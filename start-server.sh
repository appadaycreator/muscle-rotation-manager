#!/bin/bash

# SPA対応HTTPサーバー起動スクリプト

echo "🚀 MuscleRotationManager SPA対応サーバーを起動中..."

# Python3が利用可能かチェック
if command -v python3 &> /dev/null; then
    echo "✅ Python3を使用してSPA対応サーバーを起動します"
    python3 server.py 8000
elif command -v python &> /dev/null; then
    echo "✅ Pythonを使用してSPA対応サーバーを起動します"
    python server.py 8000
else
    echo "❌ Pythonが見つかりません。通常のHTTPサーバーを起動します"
    echo "⚠️  SPAルーティングが正しく動作しない可能性があります"
    
    # 通常のHTTPサーバーを起動
    if command -v python3 &> /dev/null; then
        python3 -m http.server 8000
    elif command -v python &> /dev/null; then
        python -m http.server 8000
    else
        echo "❌ HTTPサーバーを起動できません"
        exit 1
    fi
fi
