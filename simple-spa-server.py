#!/usr/bin/env python3
"""
シンプルなSPA対応HTTPサーバー
"""

import http.server
import socketserver
import os
import urllib.parse

class SimpleSPAHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        # URLをパース
        parsed_path = urllib.parse.urlparse(self.path)
        path = parsed_path.path
        
        print(f"Request: {path}")
        
        # 静的ファイルの場合は通常の処理
        if self.is_static_file(path):
            print(f"Static file: {path}")
            super().do_GET()
            return
        
        # SPAルートの場合はindex.htmlを返す
        print(f"SPA route: {path}")
        self.serve_index_html()
    
    def is_static_file(self, path):
        """静的ファイルかどうかを判定"""
        static_extensions = ['.js', '.css', '.png', '.jpg', '.jpeg', '.gif', '.ico', '.svg', '.woff', '.woff2', '.ttf', '.eot', '.html']
        return any(path.endswith(ext) for ext in static_extensions)
    
    def serve_index_html(self):
        """index.htmlを返す"""
        try:
            with open('index.html', 'rb') as f:
                content = f.read()
            
            self.send_response(200)
            self.send_header('Content-Type', 'text/html; charset=utf-8')
            self.end_headers()
            self.wfile.write(content)
            print(f"Served index.html for {self.path}")
        except FileNotFoundError:
            self.send_error(404, "index.html not found")
            print(f"ERROR: index.html not found")

def run_server(port=8000):
    """サーバーを起動"""
    handler = SimpleSPAHandler
    
    with socketserver.TCPServer(("", port), handler) as httpd:
        print(f"🚀 Simple SPA対応HTTPサーバーが起動しました")
        print(f"📍 URL: http://localhost:{port}")
        print(f"🔄 SPAルーティングが有効です")
        print(f"⏹️  停止するには Ctrl+C を押してください")
        
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n🛑 サーバーを停止しています...")
            httpd.shutdown()

if __name__ == "__main__":
    import sys
    
    # ポート番号をコマンドライン引数から取得
    port = 8000
    if len(sys.argv) > 1:
        try:
            port = int(sys.argv[1])
        except ValueError:
            print("❌ 無効なポート番号です。デフォルトの8000を使用します。")
    
    run_server(port)
