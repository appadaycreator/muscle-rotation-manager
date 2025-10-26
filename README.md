# 筋トレ部位ローテーション管理システム

## 概要

筋トレ部位ローテーション管理システムは、効率的な筋力トレーニングをサポートするWebアプリケーションです。プログレッシブ・オーバーロードの原則に基づいて、各部位のトレーニング頻度と強度を最適化します。

## 特徴

- **マルチページアプリケーション（MPA）**: 各ページが独立したHTMLファイルとして動作
- **プログレッシブ・オーバーロード**: 段階的な負荷増加による筋力向上
- **部位ローテーション**: 効率的なトレーニングスケジュール管理
- **データ分析**: トレーニング進捗の可視化と分析
- **オフライン対応**: インターネット接続がない環境でも利用可能
- **レスポンシブデザイン**: モバイル・デスクトップ両対応

## 技術スタック

- **フロントエンド**: HTML5, CSS3, JavaScript (ES6+), Tailwind CSS
- **バックエンド**: Supabase (PostgreSQL, Authentication, Real-time)
- **テスト**: Jest, Puppeteer
- **品質管理**: ESLint, Prettier

## ページ構成

### メインページ
- **`index.html`**: ランディングページ
- **`dashboard.html`**: ダッシュボードページ
- **`workout.html`**: ワークアウト記録ページ
- **`progress.html`**: プログレッシブ・オーバーロード追跡ページ
- **`calendar.html`**: カレンダーページ
- **`exercises.html`**: エクササイズデータベースページ
- **`settings.html`**: 設定ページ
- **`analysis.html`**: 分析ページ
- **`help.html`**: ヘルプページ
- **`privacy.html`**: プライバシーポリシーページ

### 共通コンポーネント
- **`partials/header.html`**: ヘッダーコンポーネント
- **`partials/sidebar.html`**: サイドバーコンポーネント
- **`partials/footer.html`**: フッターコンポーネント

## セットアップ

### 前提条件
- Node.js 18以上
- Python 3.8以上
- Supabaseアカウント

### インストール

1. リポジトリをクローン
```bash
git clone <repository-url>
cd muscle-rotation-manager
```

2. 依存関係をインストール
```bash
npm install
```

3. Supabaseの設定
```bash
# Supabaseプロジェクトの設定
cp mcp-config.env.example mcp-config.env
# mcp-config.envを編集してSupabaseの設定を追加
```

### 開発サーバーの起動

```bash
# 開発サーバーを起動
npm run dev

# または直接Pythonサーバーを使用
python3 -m http.server 8000
```

ブラウザで `http://localhost:8000` にアクセス

### テストの実行

```bash
# 全テストを実行
npm test

# テストカバレッジを確認
npm run test:coverage

# ウォッチモードでテスト実行
npm run test:watch
```

### リントとフォーマット

```bash
# リントを実行
npm run lint

# リントエラーを自動修正
npm run lint:fix

# コードをフォーマット
npm run format
```

## アーキテクチャ

### MPA（マルチページアプリケーション）設計

このアプリケーションは**MPA**として設計されており、以下の特徴があります：

- **独立したHTMLファイル**: 各ページが独立したHTMLファイルとして動作
- **SEO最適化**: 各ページが独立したURLを持つ
- **ブラウザ互換性**: 戻る/進むボタンの自然な動作
- **キャッシュ効率**: 各ページの独立したキャッシュ管理

### JavaScript構造

```
js/
├── core/
│   ├── MPAInitializer.js - MPA初期化
│   └── BasePage.js - ベースページクラス
├── components/
│   └── Navigation.js - ナビゲーションコンポーネント
├── pages/
│   ├── dashboardPage.js
│   ├── workoutPage.js
│   ├── calendarPage.js
│   ├── analysisPage.js
│   ├── progressPage.js
│   ├── exercisePage.js
│   └── settingsPage.js
├── services/
│   ├── supabaseService.js
│   ├── exerciseService.js
│   ├── progressTrackingService.js
│   ├── recommendationService.js
│   ├── chartService.js
│   └── reportService.js
└── utils/
    ├── helpers.js
    ├── errorHandler.js
    ├── validation.js
    └── performanceOptimizer.js
```

## 機能

### 認証機能
- 統一認証システム
- JWTトークンによる認証状態管理
- 認証ガード機能
- 自動リダイレクト

### データ管理
- Supabase統合
- オフライン対応
- リアルタイム更新
- データ永続化

### パフォーマンス
- ページ読み込み最適化
- リソース共有
- キャッシュ戦略
- 遅延読み込み

## デプロイ

### 本番環境へのデプロイ

```bash
# ビルドを実行
npm run build

# GitHub Pagesにデプロイ
npm run deploy
```

## ライセンス

MIT License

## 貢献

プルリクエストやイシューの報告を歓迎します。

## サポート

問題が発生した場合は、GitHubのIssuesページで報告してください。