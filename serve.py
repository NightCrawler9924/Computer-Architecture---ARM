"""Tiny local web server for the ENGR 359 Learning Lab.

Double-clicking index.html also works. This server is only needed if your
browser blocks something when opening files directly, or for development.

    python serve.py          then open  http://localhost:8359
"""
import http.server
import os
import sys

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8359
os.chdir(os.path.dirname(os.path.abspath(__file__)))


class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def log_message(self, fmt, *args):
        pass


http.server.ThreadingHTTPServer.daemon_threads = True
with http.server.ThreadingHTTPServer(("", PORT), NoCacheHandler) as httpd:
    print("ENGR 359 Learning Lab running at http://localhost:%d  (Ctrl+C to stop)" % PORT)
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        pass
