import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

/**
 * Top-level error boundary — catches unhandled render errors and shows a
 * recovery UI instead of a blank white screen.
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('SonarAI render error:', error, info.componentStack)
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null })
  }

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback

      return (
        <div
          className="h-screen flex flex-col items-center justify-center px-8 text-center"
          style={{ background: 'var(--bg-void, #0a0a0f)', color: 'var(--text-secondary, #a0a0b0)' }}
        >
          <svg
            className="w-16 h-16 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            style={{ color: 'var(--text-dim, #4a4a5a)' }}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <p className="text-lg mb-2" style={{ color: 'var(--text-secondary, #a0a0b0)' }}>
            Something went wrong
          </p>
          <p className="text-sm mb-6" style={{ color: 'var(--text-muted, #6a6a7a)' }}>
            {this.state.error?.message ?? 'An unexpected error occurred'}
          </p>
          <button
            onClick={this.handleRetry}
            className="px-4 py-2 text-sm rounded-lg transition-colors"
            style={{
              background: 'var(--bg-card, #14141e)',
              border: '1px solid var(--border-subtle, rgba(255,255,255,0.06))',
              color: 'var(--text-primary, #e0e0f0)',
            }}
          >
            Try again
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
