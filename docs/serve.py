#!/usr/bin/env python3
"""
Simple CORS-enabled HTTP Server for local plugin development.

Usage:
  python3 docs/serve.py [port]
Example:
  python3 docs/serve.py 8016
"""

import sys
import os
import socket
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler

class CORSRequestHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', '*')
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

class DualStackServer(ThreadingHTTPServer):
    def server_bind(self):
        try:
            self.socket.setsockopt(socket.IPPROTO_IPV6, socket.IPV6_V6ONLY, 0)
        except Exception:
            pass
        super().server_bind()

def run(port=8016):
    docs_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(docs_dir)

    try:
        DualStackServer.address_family = socket.AF_INET6
        httpd = DualStackServer(('', port), CORSRequestHandler)
    except Exception:
        DualStackServer.address_family = socket.AF_INET
        httpd = DualStackServer(('0.0.0.0', port), CORSRequestHandler)

    print(f"🚀 Plugin server running at http://localhost:{port}/ (CORS enabled)")
    print(f"👉 Demo plugin URL: http://localhost:{port}/demo-plugin.js")
    print("Press Ctrl+C to stop.\n")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nServer stopped.")

if __name__ == '__main__':
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8016
    run(port)
