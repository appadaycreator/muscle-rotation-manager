# MCPツール設定ガイド

## 概要
MCP（Model Context Protocol）ツールをCursor IDEで利用できるようにするための設定ガイドです。

## 必要な環境

### 1. Python環境
- **Python 3.12以上** ✅ (現在: Python 3.13.7)
- **pipx** ✅ (インストール済み)

### 2. インストール済みパッケージ
- **supabase-mcp-server** ✅ (インストール済み)

## 設定手順

### 1. Supabase MCPサーバーの設定

#### 環境変数の設定
以下の環境変数を設定してください：

```bash
# 環境変数を設定
export SUPABASE_PROJECT_REF="your-project-ref"
export SUPABASE_DB_PASSWORD="your-db-password"
export SUPABASE_REGION="ap-northeast-1"
export SUPABASE_ACCESS_TOKEN="your-access-token"
export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
```

#### 設定ファイルの使用
`mcp-config.env`ファイルを編集して、実際の値を設定してください：

```bash
# 設定ファイルを読み込み
source mcp-config.env
```

### 2. Cursor IDEでのMCP設定

#### 設定ファイルの場所
Cursor IDEの設定ファイルは以下の場所に配置してください：

**macOS**: `~/Library/Application Support/Cursor/User/globalStorage/mcp-config.json`

#### 設定内容
```json
{
  "mcpServers": {
    "supabase": {
      "command": "supabase-mcp-server",
      "args": [],
      "env": {
        "SUPABASE_PROJECT_REF": "your-project-ref",
        "SUPABASE_DB_PASSWORD": "your-db-password",
        "SUPABASE_REGION": "ap-northeast-1",
        "SUPABASE_ACCESS_TOKEN": "your-access-token",
        "SUPABASE_SERVICE_ROLE_KEY": "your-service-role-key"
      }
    }
  }
}
```

### 3. MCPサーバーの起動テスト

#### 手動起動テスト
```bash
# MCPサーバーを手動で起動
supabase-mcp-server

# 別のターミナルで接続テスト
curl http://localhost:5433
```

#### 自動起動設定
Cursor IDEを再起動すると、MCPサーバーが自動的に起動されます。

## トラブルシューティング

### 1. よくある問題

#### 問題: MCPツールが表示されない
**解決方法**:
1. Cursor IDEを完全に再起動
2. 設定ファイルの構文を確認
3. 環境変数が正しく設定されているか確認

#### 問題: 接続エラーが発生する
**解決方法**:
1. Supabaseの認証情報を再確認
2. ネットワーク接続を確認
3. ファイアウォール設定を確認

#### 問題: ポートが使用中
**解決方法**:
```bash
# ポート5433を使用しているプロセスを確認
lsof -i :5433

# プロセスを終了
kill -9 <PID>
```

### 2. ログの確認

#### MCPサーバーのログ
```bash
# ログファイルの場所
~/.local/pipx/logs/
```

#### Cursor IDEのログ
```bash
# Cursor IDEのログ
~/Library/Logs/Cursor/
```

## 動作確認

### 1. Supabase MCPの動作確認
以下のプロンプトをCursor IDEで試してください：

```
データベーススキーマを取得して、その概要を説明してください。
```

### 2. 利用可能なMCPツールの確認
Cursor IDEの左下のステータスバーでMCPツールの状態を確認できます。

## 設定の確認

### 1. 現在の設定確認
```bash
# インストール済みパッケージの確認
pipx list

# 環境変数の確認
env | grep SUPABASE
```

### 2. 接続テスト
```bash
# MCPサーバーの起動確認
supabase-mcp-server --help

# 接続テスト
curl -X POST http://localhost:5433/mcp \
  -H "Content-Type: application/json" \
  -d '{"method": "ping"}'
```

## 次のステップ

1. **Supabase認証情報の取得**: Supabaseダッシュボードから必要な認証情報を取得
2. **環境変数の設定**: 実際の認証情報で環境変数を設定
3. **Cursor IDEの再起動**: 設定を反映するためにCursor IDEを再起動
4. **動作確認**: MCPツールが正常に動作することを確認

## 参考資料

- [Supabase MCP公式ドキュメント](https://github.com/supabase/mcp-server)
- [Cursor IDE MCP設定](https://cursor.sh/docs/mcp)
- [Model Context Protocol仕様](https://modelcontextprotocol.io/)

---

**注意**: この設定は開発環境用です。本番環境では適切なセキュリティ設定を行ってください。
