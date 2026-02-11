#!/usr/bin/env python3
"""
JSON-RPC IPC Server for SonarAI Electron App
Communicates with Electron main process via stdin/stdout
"""
import json
import sys
import traceback
from typing import Any, Callable, Dict, Optional


class IPCServer:
    """
    Simple JSON-RPC 2.0 server over stdin/stdout.
    Each message is a single line of JSON.
    """

    def __init__(self):
        self.handlers: Dict[str, Callable] = {}
        self.running = False

    def register(self, method: str, handler: Callable) -> None:
        """Register a method handler."""
        self.handlers[method] = handler

    def _send_response(self, id: Optional[str], result: Any = None, error: Optional[Dict] = None) -> None:
        """Send a JSON-RPC response to stdout."""
        response = {"jsonrpc": "2.0", "id": id}
        if error:
            response["error"] = error
        else:
            response["result"] = result

        # Write response as single line followed by newline
        output = json.dumps(response, ensure_ascii=False)
        sys.stdout.write(output + "\n")
        sys.stdout.flush()

    def _handle_request(self, request: Dict) -> None:
        """Handle a single JSON-RPC request."""
        request_id = request.get("id")
        method = request.get("method")
        params = request.get("params", {})

        if not method:
            self._send_response(request_id, error={
                "code": -32600,
                "message": "Invalid Request: method is required"
            })
            return

        handler = self.handlers.get(method)
        if not handler:
            self._send_response(request_id, error={
                "code": -32601,
                "message": f"Method not found: {method}"
            })
            return

        try:
            if isinstance(params, dict):
                result = handler(**params)
            elif isinstance(params, list):
                result = handler(*params)
            else:
                result = handler()

            self._send_response(request_id, result=result)
        except Exception as e:
            self._send_response(request_id, error={
                "code": -32000,
                "message": str(e),
                "data": traceback.format_exc()
            })

    def run(self) -> None:
        """Start the IPC server, reading from stdin."""
        self.running = True

        # Signal ready to parent process
        self._send_response(None, result={"status": "ready", "version": "1.0.0"})

        while self.running:
            try:
                line = sys.stdin.readline()
                if not line:
                    # EOF - parent process closed connection
                    break

                line = line.strip()
                if not line:
                    continue

                try:
                    request = json.loads(line)
                except json.JSONDecodeError as e:
                    self._send_response(None, error={
                        "code": -32700,
                        "message": f"Parse error: {e}"
                    })
                    continue

                self._handle_request(request)

            except KeyboardInterrupt:
                break
            except Exception as e:
                # Log to stderr so it doesn't interfere with IPC
                print(f"IPC Server Error: {e}", file=sys.stderr)
                traceback.print_exc(file=sys.stderr)

        self.running = False

    def stop(self) -> None:
        """Stop the IPC server."""
        self.running = False
