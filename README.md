# 筋トレ部位ローテーション管理システム (MuscleRotationManager)

効率的な筋トレ部位ローテーションを科学的に管理するWebアプリケーションです。

## 概要

このアプリケーションは、筋肉の回復期間を考慮した最適なトレーニングスケジュールを提案し、ユーザーのワークアウトデータを記録・分析する機能を提供します。

## 主な機能

- **ダッシュボード**: ワークアウト概要と今日の推奨部位
- **ワークアウト記録**: トレーニング内容の詳細記録
  - **オンライン/オフライン対応**: Supabaseクラウド保存とローカルストレージによるオフライン保存
  - **自動同期**: オンライン復帰時の自動データ同期
  - **堅牢なエラーハンドリング**: 保存失敗時のフォールバック機能
- **カレンダー**: トレーニング履歴の視覚化
- **分析機能**: データに基づくパフォーマンス分析
- **エクササイズ管理**: 部位別エクササイズの管理
- **設定**: ユーザープロフィールとアプリ設定
- **プライバシーポリシー**: 個人情報保護方針

## ランディングページ

本プロジェクトには、サービスの魅力を伝える専用のランディングページ（LP）が用意されています。

### LP の特徴

- **現代的なデザイン**: グラデーション、アニメーション、インタラクティブ要素を活用
- **レスポンシブ対応**: モバイルファーストの設計でどのデバイスでも最適表示
- **実機能紹介**: 実際のアプリ画面を模したデモ表示
- **科学的根拠の説明**: 回復期間管理の理論的背景を分かりやすく解説
- **ユーザー体験重視**: スムーズなスクロール、視覚的フィードバック

### LP へのアクセス

```
https://appadaycreator.github.io/muscle-rotation-manager/lp.html
```

または、ローカル環境では：
```
http://localhost:8000/lp.html
```

### LP の構成

1. **ヒーローセクション**: インパクトのあるメインビジュアルとCTA
2. **統計情報**: サービスの実績を数値で表示
3. **機能紹介**: 3つの主要機能を詳細説明
4. **アプリ詳細**: 実際の画面を模したインタラクティブデモ
5. **使い方**: 3ステップでの利用開始方法
6. **ユーザーの声**: 実際の利用者からの評価
7. **料金プラン**: 完全無料での提供を強調
8. **CTA**: アプリへの誘導とお問い合わせ

### LP の技術仕様

- **フレームワーク**: Tailwind CSS
- **アニメーション**: CSS3 + Intersection Observer API
- **チャート**: Chart.js
- **アイコン**: Font Awesome
- **フォント**: Noto Sans JP（日本語最適化）
- **SEO対応**: OGP、Twitter Card、構造化データ
- **パフォーマンス**: 軽量化、CDN活用

## 技術スタック

- **フロントエンド**: HTML5, CSS3, JavaScript (ES6+ Modules)
- **スタイリング**: Tailwind CSS
- **バックエンド**: Supabase (Database & Authentication)
- **PWA**: Service Worker, Web App Manifest
- **データ永続化**: 
  - **オンライン**: Supabase PostgreSQL (workout_sessions テーブル)
  - **オフライン**: LocalStorage + IndexedDB (Service Worker経由)
  - **同期**: 自動オフライン同期キュー
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
- **リンターエラー**: 0件（警告0件）
- **テスト成功率**: 100%（全59テストケース成功）
- **モジュール化**: 2400行のapp.jsを機能別に分割
- **パフォーマンス**: Promise.allSettledによる並列処理最適化

## 最新アップデート (v1.10.0)

### v1.10.0 - 完全リファクタリング完了と品質最適化
- ✅ 包括的リファクタリングプロセスの完全実施
- ✅ リンターエラー0件、警告0件の完全クリーン状態維持
- ✅ テスト成功率100%（全59テストケース成功）維持
- ✅ テストカバレッジ98%以上の高水準維持
- ✅ Supabase MCP機能検証完了
- ✅ デプロイエラー0件、ローカルサーバーコンソールエラー0件
- ✅ プロジェクト構造の最終調整完了
- ✅ 不要ファイルの完全削除
- ✅ 仕様書駆動開発とテスト駆動開発の完全統合
- ✅ 最適で完全な形でのリファクタリング達成

### v1.9.0 - 高度なリファクタリングと最適化
- ✅ 統一されたエラーハンドリングシステム
- ✅ DOM操作の安全性向上（safeGetElement等）
- ✅ 非同期処理の統一化（safeAsync関数）
- ✅ デバウンス・スロットル機能追加
- ✅ 型安全性の向上とJSDoc充実
- ✅ イベントハンドリングの効率化
- ✅ リンターエラー・警告0件達成
- ✅ テストカバレッジ98%以上維持

### v1.8.0 - 完全リファクタリングとコード品質向上
- ✅ ESLint警告14件を完全修正
- ✅ カスタム削除確認ダイアログの実装
- ✅ JSDOM環境によるテスト環境強化
- ✅ リンターエラー・警告0件達成
- ✅ テストカバレッジ98%以上達成
- ✅ 不要ファイルのクリーンアップ

## 過去のアップデート (v1.6.0)

### 修正された問題
- ✅ Service Worker chrome-extension スキームエラー
- ✅ アバター画像アップロード機能
- ✅ デフォルトアバター画像の欠損
- ✅ Supabaseストレージエラーハンドリング

### パフォーマンス改善
- ⚡ 並列コンポーネント読み込み
- ⚡ Service Workerキャッシュ最適化
- ⚡ エラー耐性の向上

## ライセンス

MIT License