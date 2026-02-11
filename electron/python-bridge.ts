import { spawn, ChildProcess } from 'child_process'
import { app } from 'electron'
import * as path from 'path'
import * as readline from 'readline'
import * as fs from 'fs'

interface JsonRpcRequest {
  jsonrpc: '2.0'
  id: string
  method: string
  params?: Record<string, unknown> | unknown[]
}

interface JsonRpcResponse {
  jsonrpc: '2.0'
  id: string | null
  result?: unknown
  error?: {
    code: number
    message: string
    data?: string
  }
}

type PendingCallback = {
  resolve: (value: unknown) => void
  reject: (error: Error) => void
}

export class PythonBridge {
  private process: ChildProcess | null = null
  private readline: readline.Interface | null = null
  private requestId = 0
  private pendingRequests: Map<string, PendingCallback> = new Map()
  private ready = false
  private readyPromise: Promise<void>
  private readyResolve: (() => void) | null = null

  constructor() {
    this.readyPromise = new Promise((resolve) => {
      this.readyResolve = resolve
    })
  }

  async start(): Promise<void> {
    if (this.process) {
      return this.readyPromise
    }

    const pythonPath = this.getPythonPath()
    const scriptPath = this.getScriptPath()

    console.log(`Starting Python backend: ${pythonPath} ${scriptPath}`)

    this.process = spawn(pythonPath, [scriptPath], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, PYTHONUNBUFFERED: '1' }
    })

    // Handle stdout (JSON-RPC responses)
    if (this.process.stdout) {
      this.readline = readline.createInterface({
        input: this.process.stdout,
        crlfDelay: Infinity
      })

      this.readline.on('line', (line) => {
        this.handleResponse(line)
      })
    }

    // Handle stderr (logging/errors)
    if (this.process.stderr) {
      this.process.stderr.on('data', (data) => {
        console.error(`Python stderr: ${data.toString()}`)
      })
    }

    // Handle process exit
    this.process.on('exit', (code, signal) => {
      console.log(`Python process exited with code ${code}, signal ${signal}`)
      this.cleanup()
    })

    this.process.on('error', (error) => {
      console.error(`Python process error: ${error.message}`)
      this.cleanup()
    })

    return this.readyPromise
  }

  private getPythonPath(): string {
    // Priority order:
    // 1. Environment variable (set by run-source-linux.sh)
    // 2. Bundled venv in development
    // 3. Bundled venv in production
    // 4. System Python fallback

    // Check environment variable first
    if (process.env.SONAR_PYTHON_PATH && fs.existsSync(process.env.SONAR_PYTHON_PATH)) {
      console.log(`Using Python from env: ${process.env.SONAR_PYTHON_PATH}`)
      return process.env.SONAR_PYTHON_PATH
    }

    const isDev = !app.isPackaged
    let venvPython: string

    if (process.platform === 'win32') {
      venvPython = isDev
        ? path.join(app.getAppPath(), 'python', '.venv', 'Scripts', 'python.exe')
        : path.join(process.resourcesPath, 'python', '.venv', 'Scripts', 'python.exe')
    } else {
      venvPython = isDev
        ? path.join(app.getAppPath(), 'python', '.venv', 'bin', 'python3')
        : path.join(process.resourcesPath, 'python', '.venv', 'bin', 'python3')
    }

    // Check if venv Python exists
    if (fs.existsSync(venvPython)) {
      console.log(`Using bundled Python venv: ${venvPython}`)
      return venvPython
    }

    // Fallback to system Python
    console.log('Falling back to system Python')
    return process.platform === 'win32' ? 'python' : 'python3'
  }

  private getScriptPath(): string {
    // In development, use the python folder directly
    // In production, it's in the resources folder
    const isDev = !app.isPackaged

    if (isDev) {
      return path.join(app.getAppPath(), 'python', 'main.py')
    } else {
      return path.join(process.resourcesPath, 'python', 'main.py')
    }
  }

  private handleResponse(line: string): void {
    try {
      const response: JsonRpcResponse = JSON.parse(line)

      // Check if this is the ready signal (id is null)
      if (response.id === null && response.result) {
        const result = response.result as { status?: string }
        if (result.status === 'ready') {
          this.ready = true
          if (this.readyResolve) {
            this.readyResolve()
            this.readyResolve = null
          }
          console.log('Python backend ready')
          return
        }
      }

      // Handle regular responses
      if (response.id) {
        const pending = this.pendingRequests.get(response.id)
        if (pending) {
          this.pendingRequests.delete(response.id)

          if (response.error) {
            pending.reject(new Error(response.error.message))
          } else {
            pending.resolve(response.result)
          }
        }
      }
    } catch (error) {
      console.error(`Failed to parse Python response: ${line}`, error)
    }
  }

  async call<T = unknown>(method: string, params?: Record<string, unknown>): Promise<T> {
    if (!this.ready) {
      await this.readyPromise
    }

    if (!this.process || !this.process.stdin) {
      throw new Error('Python process not running')
    }

    const id = String(++this.requestId)

    const request: JsonRpcRequest = {
      jsonrpc: '2.0',
      id,
      method,
      params: params || {}
    }

    return new Promise((resolve, reject) => {
      this.pendingRequests.set(id, { resolve: resolve as (value: unknown) => void, reject })

      const requestLine = JSON.stringify(request) + '\n'
      this.process!.stdin!.write(requestLine, (error) => {
        if (error) {
          this.pendingRequests.delete(id)
          reject(error)
        }
      })

      // Timeout after 30 seconds
      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id)
          reject(new Error(`Request ${method} timed out`))
        }
      }, 30000)
    })
  }

  private cleanup(): void {
    this.ready = false
    this.readline?.close()
    this.readline = null
    this.process = null

    // Reject all pending requests
    for (const [id, { reject }] of this.pendingRequests) {
      reject(new Error('Python process terminated'))
    }
    this.pendingRequests.clear()
  }

  async stop(): Promise<void> {
    if (this.process) {
      this.process.kill()
      this.cleanup()
    }
  }

  isReady(): boolean {
    return this.ready
  }
}

// Singleton instance
export const pythonBridge = new PythonBridge()
