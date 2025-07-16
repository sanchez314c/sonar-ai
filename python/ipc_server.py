#!/usr/bin/env python3
"""
JSON-RPC IPC Server for SonarAI Electron App
Communicates with Electron main process via stdin/stdout
"""

import json
import sys
import traceback
from typing import Any, Callable, Dict, Optional, Set


# Maximum input line size (10 MB) — prevents memory exhaustion from malformed input
MAX_LINE_BYTES = 10 * 1024 * 1024


class IPCServer:
    """
    Simple JSON-RPC 2.0 server over stdin/stdout.
    Each message is a single line of JSON.
    """

    def __init__(self):
        self.handlers: Dict[str, Callable] = {}
        self._registered_methods: Set[str] = set()
        self.running = False

    def register(self, method: str, handler: Callable) -> None:
        """Register a method handler."""
        self.handlers[method] = handler
        self._registered_methods.add(method)

    def _send_response(
        self, id: Optional[str], result: Any = None, error: Optional[Dict] = None
    ) -> None:
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

        if not method or not isinstance(method, str):
            self._send_response(
                request_id,
                error={
                    "code": -32600,
                    "message": "Invalid Request: method is required and must be a string",
                },
            )
            return

        # Validate method is in the registered allowlist
        if method not in self._registered_methods:
            self._send_response(
                request_id,
                error={"code": -32601, "message": f"Method not found: {method}"},
            )
            return

        # Validate params type — must be dict or list per JSON-RPC spec
        if params is not None and not isinstance(params, (dict, list)):
            self._send_response(
                request_id,
                error={
                    "code": -32602,
                    "message": "Invalid params: must be object or array",
                },
            )
            return

        handler = self.handlers[method]

        try:
            if isinstance(params, dict):
                result = handler(**params)
            elif isinstance(params, list):
                result = handler(*params)
            else:
                result = handler()

            self._send_response(request_id, result=result)
        except TypeError as e:
            # Invalid parameter types/counts — safe to surface to caller
            self._send_response(
                request_id, error={"code": -32602, "message": f"Invalid params: {e}"}
            )
        except Exception as e:
            # Log full traceback to stderr only — do NOT send to client
            print(f"Handler error for {method}: {e}", file=sys.stderr)
            traceback.print_exc(file=sys.stderr)
            self._send_response(
                request_id,
                error={
                    "code": -32000,
                    "message": str(e),
                    # data field intentionally omitted — traceback stays server-side
                },
            )

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

                # Guard against enormous lines that could cause memory issues
                if len(line.encode("utf-8")) > MAX_LINE_BYTES:
                    self._send_response(
                        None,
                        error={
                            "code": -32700,
                            "message": "Parse error: request too large",
                        },
                    )
                    continue

                line = line.strip()
                if not line:
                    continue

                try:
                    request = json.loads(line)
                except json.JSONDecodeError as e:
                    self._send_response(
                        None, error={"code": -32700, "message": f"Parse error: {e}"}
                    )
                    continue

                if not isinstance(request, dict):
                    self._send_response(
                        None,
                        error={
                            "code": -32600,
                            "message": "Invalid Request: must be a JSON object",
                        },
                    )
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
