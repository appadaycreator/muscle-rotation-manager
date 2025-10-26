# Supabase設定ガイド

このガイドでは、筋トレ部位ローテーション管理システムのSupabase設定について詳しく説明します。

## 目次

1. [Supabaseプロジェクトの作成](#supabaseプロジェクトの作成)
2. [設定ファイルの更新](#設定ファイルの更新)
3. [データベーススキーマの設定](#データベーススキーマの設定)
4. [ストレージバケットの設定](#ストレージバケットの設定)
5. [認証設定](#認証設定)
6. [トラブルシューティング](#トラブルシューティング)

## Supabaseプロジェクトの作成

### 1. Supabaseアカウントの作成

1. [Supabase](https://supabase.com)にアクセス
2. 「Start your project」をクリック
3. GitHubアカウントでサインアップ（推奨）

### 2. 新しいプロジェクトの作成

1. [Supabaseダッシュボード](https://supabase.com/dashboard)にアクセス
2. 「New Project」をクリック
3. 以下の情報を入力：
   - **Organization**: 既存の組織を選択または新規作成
   - **Project Name**: `muscle-rotation-manager`（任意の名前）
   - **Database Password**: 強力なパスワードを設定
   - **Region**: 最寄りのリージョンを選択（例：Asia Northeast (Tokyo)）
4. 「Create new project」をクリック

### 3. プロジェクト情報の取得

プロジェクトが作成されたら、以下の情報を取得：

1. **Project URL**:
   - ダッシュボードの「Settings」→「API」から取得
   - 例：`https://abcdefghijklmnop.supabase.co`

2. **API Keys**:
   - **anon/public key**: フロントエンド用（`eyJ`で始まるJWTトークン）
   - **service_role key**: サーバーサイド用（MCP設定で使用）

### 4. 設定ファイルの更新

取得した情報を以下のファイルに設定：

#### js/utils/constants.js

```javascript
export const SUPABASE_CONFIG = {
  url: 'https://your-actual-project-id.supabase.co', // 実際のURL
  key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...', // 実際のanon key
};
```

#### mcp-config.json（MCP使用時）

```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": ["@supabase/mcp-server-supabase"],
      "env": {
        "SUPABASE_URL": "https://your-actual-project-id.supabase.co",
        "SUPABASE_SERVICE_ROLE_KEY": "your-service-role-key"
      }
    }
  }
}
```

## 設定ファイルの更新

### 1. constants.jsの更新

`js/utils/constants.js` ファイルを編集：

```javascript
// Supabase設定
export const SUPABASE_CONFIG = {
  // 実際のプロジェクトURLに置き換え
  url: 'https://your-actual-project-id.supabase.co',
  // 実際のanon keyに置き換え
  key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
};
```

### 2. 設定の確認

- URLは `https://` で始まり、`.supabase.co` で終わることを確認
- APIキーは `eyJ` で始まるJWTトークンであることを確認

## データベーススキーマの設定

### 1. SQL Editorでの実行

1. Supabaseダッシュボードの「SQL Editor」にアクセス
2. `database/schema.sql` の内容をコピー
3. SQL Editorに貼り付けて実行

### 2. 必要なテーブル

以下のテーブルが作成されます：

- `user_profiles`: ユーザープロフィール情報
- `workout_sessions`: ワークアウトセッション
- `training_logs`: トレーニングログ
- `workout_statistics`: 統計情報
- `muscle_groups`: 筋肉部位マスター

### 3. RLS（Row Level Security）の設定

各テーブルに適切なRLSポリシーが設定されます。

## ストレージバケットの設定

### 1. バケットの作成

Supabaseダッシュボードの「Storage」で以下のバケットを作成：

#### avatars（Public）

- **用途**: ユーザーアバター画像
- **設定**: Public access enabled
- **ファイル制限**: 5MB以下、画像形式のみ

#### exercise-images（Public）

- **用途**: エクササイズ画像
- **設定**: Public access enabled
- **ファイル制限**: 10MB以下、画像形式のみ

#### user-uploads（Private）

- **用途**: プライベートファイル
- **設定**: Private access
- **ファイル制限**: 50MB以下

### 2. バケットポリシーの設定

各バケットに適切なRLSポリシーを設定：

```sql
-- avatarsバケットのポリシー例
CREATE POLICY "Users can upload their own avatars" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own avatars" ON storage.objects
FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
```

## 認証設定

### 1. 認証プロバイダーの設定

1. 「Authentication」→「Providers」にアクセス
2. 以下のプロバイダーを有効化：
   - **Email**: デフォルトで有効
   - **Google**: 必要に応じて設定
   - **GitHub**: 必要に応じて設定

### 2. メール設定

1. 「Authentication」→「Settings」にアクセス
2. メール設定を構成：
   - **SMTP settings**: カスタムSMTPサーバーの設定
   - **Email templates**: 認証メールのテンプレート設定

### 3. 認証フローの設定

- **Enable email confirmations**: メール確認を有効化
- **Enable phone confirmations**: 電話番号確認を有効化（オプション）

## トラブルシューティング

### よくある問題と解決方法

#### 1. ERR_NAME_NOT_RESOLVED エラー

**症状**: `net::ERR_NAME_NOT_RESOLVED` エラーが発生

**原因**:

- 無効なSupabase URL
- プロジェクトの一時停止
- DNS設定の問題

**解決方法**:

1. Supabaseダッシュボードでプロジェクトがアクティブか確認
2. URLが正しいか確認（`https://` で始まり、`.supabase.co` で終わる）
3. プロジェクトが一時停止されている場合は復旧

#### 2. 認証エラー

**症状**: ログイン・新規登録が失敗

**原因**:

- 無効なAPIキー
- RLS設定の問題
- 認証テーブルの未作成

**解決方法**:

1. APIキーが正しいか確認
2. `database/schema.sql` が実行されているか確認
3. RLSポリシーが適切に設定されているか確認

#### 3. ストレージエラー

**症状**: ファイルアップロードが失敗

**原因**:

- バケットが作成されていない
- バケットポリシーの設定ミス
- ファイルサイズ制限

**解決方法**:

1. 必要なバケットが作成されているか確認
2. バケットポリシーが適切に設定されているか確認
3. ファイルサイズが制限内か確認

#### 4. データベース接続エラー

**症状**: データの取得・保存が失敗

**原因**:

- テーブルが作成されていない
- RLSポリシーの問題
- データベースの一時停止

**解決方法**:

1. `database/schema.sql` の実行を確認
2. RLSポリシーを確認
3. データベースの状態を確認

### デバッグ方法

#### 1. ブラウザの開発者ツール

- **Console**: JavaScriptエラーの確認
- **Network**: APIリクエストの確認
- **Application**: LocalStorageの確認

#### 2. Supabaseダッシュボード

- **Logs**: サーバーログの確認
- **Database**: テーブルとデータの確認
- **Authentication**: ユーザー認証の確認

#### 3. 接続テスト

```javascript
// ブラウザのコンソールで実行
const { createClient } = supabase;
const client = createClient('YOUR_URL', 'YOUR_KEY');
client.from('muscle_groups').select('*').then(console.log);
```

## セキュリティ考慮事項

### 1. APIキーの管理

- **anon key**: フロントエンドで使用（公開されても問題なし）
- **service_role key**: サーバーサイドでのみ使用（絶対に公開しない）

### 2. RLSポリシー

- すべてのテーブルに適切なRLSポリシーを設定
- ユーザーは自分のデータのみアクセス可能

### 3. ストレージセキュリティ

- プライベートファイルは適切な認証が必要
- ファイルアップロード時のバリデーション

## 本番環境での設定

### 1. 環境変数の使用

本番環境では環境変数を使用：

```javascript
export const SUPABASE_CONFIG = {
  url: process.env.SUPABASE_URL,
  key: process.env.SUPABASE_ANON_KEY,
};
```

### 2. ドメイン設定

- **Site URL**: 本番ドメインを設定
- **Redirect URLs**: 認証後のリダイレクト先を設定

### 3. セキュリティ設定

- **Rate limiting**: API呼び出し制限
- **CORS**: 適切なオリジン設定
- **SSL**: HTTPSの強制

## サポート

問題が解決しない場合は、以下を確認してください：

1. [Supabase公式ドキュメント](https://supabase.com/docs)
2. [GitHub Issues](https://github.com/appadaycreator/muscle-rotation-manager/issues)
3. [Supabase Community](https://github.com/supabase/supabase/discussions)

---

このガイドに従って設定を行うことで、筋トレ部位ローテーション管理システムが正常に動作するはずです。
