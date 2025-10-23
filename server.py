#!/usr/bin/env python3
"""
SPA対応HTTPサーバー
すべてのルートをindex.htmlにフォールバック
"""

import http.server
import socketserver
import os
import urllib.parse
from pathlib import Path

class SPAHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # SPAルーティング用のヘッダーを追加
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

    def do_GET(self):
        # URLをパース
        parsed_path = urllib.parse.urlparse(self.path)
        path = parsed_path.path
        
        # 静的ファイルの場合は通常の処理
        if self.is_static_file(path):
            super().do_GET()
            return
        
        # SPAルートの場合はindex.htmlを返す
        if self.is_spa_route(path):
            self.serve_index_html()
            return
        
        # その他の場合は通常の処理
        super().do_GET()
    
    def is_static_file(self, path):
        """静的ファイルかどうかを判定"""
        static_extensions = ['.js', '.css', '.png', '.jpg', '.jpeg', '.gif', '.ico', '.svg', '.woff', '.woff2', '.ttf', '.eot']
        return any(path.endswith(ext) for ext in static_extensions)
    
    def is_spa_route(self, path):
        """SPAルートかどうかを判定"""
        # ルートパスまたは既存のファイルでない場合
        if path == '/' or path == '/index.html':
            return False
        
        # 既存のファイルが存在しない場合
        file_path = Path(self.translate_path(path))
        return not file_path.exists()
    
    def serve_index_html(self):
        """index.htmlを返す"""
        try:
            with open('index.html', 'rb') as f:
                content = f.read()
            
            self.send_response(200)
            self.send_header('Content-Type', 'text/html; charset=utf-8')
            self.end_headers()
            self.wfile.write(content)
        except FileNotFoundError:
            self.send_error(404, "index.html not found")

def run_server(port=8000):
    """サーバーを起動"""
    handler = SPAHandler
    
    with socketserver.TCPServer(("", port), handler) as httpd:
        print(f"🚀 SPA対応HTTPサーバーが起動しました")
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
