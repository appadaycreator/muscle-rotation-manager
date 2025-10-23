# 筋トレ部位ローテーション管理システム (MuscleRotationManager)

効率的な筋トレ部位ローテーションを科学的に管理するWebアプリケーションです。

## 概要

このアプリケーションは、筋肉の回復期間を考慮した最適なトレーニングスケジュールを提案し、ユーザーのワークアウトデータを記録・分析する機能を提供します。

## 主な機能

- **ダッシュボード**: ワークアウト概要と今日の推奨部位
- **ワークアウト記録**: トレーニング内容の詳細記録
- **カレンダー**: トレーニング履歴の視覚化
- **分析機能**: データに基づくパフォーマンス分析
- **エクササイズ管理**: 部位別エクササイズの管理
- **設定**: ユーザープロフィールとアプリ設定
- **プライバシーポリシー**: 個人情報保護方針

## 技術スタック

- **フロントエンド**: HTML5, CSS3, JavaScript (ES6+ Modules)
- **スタイリング**: Tailwind CSS
- **バックエンド**: Supabase (Database & Authentication)
- **PWA**: Service Worker, Web App Manifest
- **自動化**: GitHub Actions (Supabaseキープアライブ、CI/CD、セキュリティ監査)
- **MCP統合**: Supabase MCP サーバー対応
- **コード品質**: ESLint, Prettier
- **アーキテクチャ**: モジュラー設計、関心の分離

## データプライバシー

本アプリケーションはユーザーの個人情報と健康データを安全に管理します。詳細は[プライバシーポリシー](partials/privacy.html)をご覧ください。

## セットアップ

1. プロジェクトをクローン
```bash
git clone https://github.com/appadaycreator/muscle-rotation-manager.git
cd muscle-rotation-manager
```

2. 依存関係をインストール
```bash
npm install
```

3. ローカルサーバーで起動
```bash
npm start
# または
python -m http.server 8000
```

4. ブラウザで `http://localhost:8000` にアクセス

## Supabase MCP設定

### 前提条件
- Supabaseプロジェクトが作成済み
- Service Role Keyが取得済み

### MCP設定手順

1. **mcp-config.json の設定**
```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": ["@supabase/mcp-server-supabase"],
      "env": {
        "SUPABASE_URL": "https://your-project.supabase.co",
        "SUPABASE_SERVICE_ROLE_KEY": "your-service-role-key"
      }
    }
  }
}
```

2. **ストレージバケット作成**
Supabaseダッシュボードで以下のバケットを手動作成：
- `avatars` (Public)
- `exercise-images` (Public)  
- `user-uploads` (Private)

3. **RLS設定確認**
```bash
node supabase-connection-test.js
```

### トラブルシューティング

#### プロフィール編集エラー（RLS Policy Violation）
- **原因**: Supabaseプロジェクト一時停止またはuser_profilesテーブル未作成
- **解決方法**: 
  1. `SUPABASE_SETUP.md`の復旧手順に従ってプロジェクトを復旧
  2. `database/schema.sql`を実行してテーブルを作成
  3. 暫定的にlocalStorageでプロフィール保存が動作
  4. ブラウザのコンソールでエラー詳細を確認

#### MCP接続エラー
- **原因**: アクセストークン不足
- **解決方法**: 
  ```bash
  npx @supabase/mcp-server-supabase --access-token YOUR_TOKEN
  ```

## テスト駆動開発

### テスト実行方法

#### ブラウザでのインタラクティブテスト
```bash
# ローカルサーバー起動後
# http://localhost:8000/tests/test-runner.html にアクセス
```

#### コマンドラインでのテスト実行
```bash
# 全テスト実行
npm test

# ユニットテストのみ
npm run test:unit

# 統合テストのみ
npm run test:integration

# 仕様書駆動テストのみ
npm run test:spec

# E2Eテスト（詳細）
npm run test:detailed
```

### テスト構造
```
tests/
├── unit/                    # ユニットテスト
│   ├── test-runner.js      # カスタムテストランナー
│   └── muscle-groups.test.js
├── integration/             # 統合テスト
│   └── workout-flow.test.js
├── spec-driven/            # 仕様書駆動テスト
│   └── requirements.test.js
├── mocks/                  # モック実装
│   └── supabase.mock.js
├── templates/              # テストテンプレート
│   └── test-template.js
├── results/                # テスト結果
└── test-runner.html        # ブラウザテストUI
```

### 新しいテストの作成
1. `tests/templates/test-template.js` をコピー
2. `[FEATURE_NAME]` を実際の機能名に置換
3. テストケースを実装
4. 適切なディレクトリに配置

## アーキテクチャ

### モジュラー設計

アプリケーションは以下のモジュール構成で設計されています：

```
js/
├── modules/           # 主要機能モジュール
│   ├── pageManager.js    # ページ管理・ナビゲーション
│   └── authManager.js    # 認証管理
├── services/          # サービス層
│   └── supabaseService.js # Supabase API ラッパー
├── utils/             # ユーティリティ
│   ├── constants.js      # 定数定義
│   └── helpers.js        # ヘルパー関数
└── pages/             # ページ固有ロジック
    └── dashboardPage.js  # ダッシュボード機能
```

### 設計原則

- **関心の分離**: 各モジュールは単一責任を持つ
- **依存性注入**: サービス層を通じた疎結合
- **ES6+ モジュール**: 標準的なimport/export構文
- **シングルトンパターン**: 状態管理の一元化

## コード品質

- **ESLint**: コード品質とスタイルの統一
- **Prettier**: 自動コードフォーマット
- **リンターエラー**: 0件（警告3件のみ）
- **モジュール化**: 2400行のapp.jsを機能別に分割

## ライセンス

MIT License