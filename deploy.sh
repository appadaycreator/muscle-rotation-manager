#!/bin/bash

# デプロイ最適化スクリプト
# 使用方法: ./deploy.sh [fast|full]

set -e

DEPLOY_MODE=${1:-fast}

echo "🚀 デプロイ開始: $DEPLOY_MODE モード"

# 不要なファイルをクリーンアップ
echo "🧹 不要ファイルのクリーンアップ..."
rm -rf coverage/
rm -rf tests/results/
rm -f *.backup
rm -f app-refactored.js

# デプロイモードに応じてビルド実行
if [ "$DEPLOY_MODE" = "full" ]; then
    echo "🔧 フルビルド実行中..."
    npm run build:full
else
    echo "⚡ 高速デプロイ実行中..."
    npm run deploy:fast
fi

echo "✅ デプロイ完了！"
echo "📊 デプロイ統計:"
echo "  - モード: $DEPLOY_MODE"
echo "  - 時刻: $(date)"
echo "  - ブランチ: $(git branch --show-current)"
