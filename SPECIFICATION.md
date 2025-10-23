# MuscleRotationManager - 詳細仕様書

## 1. 概要

### 1.1 プロジェクト名
筋トレ部位ローテーション管理システム (MuscleRotationManager)

### 1.2 目的
効率的な筋トレ部位ローテーションを科学的に管理し、回復期間を考慮した最適なトレーニングスケジュールを提案するWebアプリケーション

### 1.3 アーキテクチャ
- **フロントエンド**: HTML5, CSS3, JavaScript (ES6+), Tailwind CSS
- **バックエンド**: Supabase (PostgreSQL, Authentication, Real-time)
- **デプロイ**: 静的サイト (GitHub Pages対応)
- **テスト**: Jest, Puppeteer
- **品質管理**: ESLint, Prettier

## 2. 機能要件

### 2.1 認証機能
- **ユーザー登録**: メールアドレス + パスワード
- **ログイン/ログアウト**: Supabase Auth
- **パスワードリセット**: メール認証
- **セッション管理**: JWT トークン

### 2.2 ワークアウト管理
- **ワークアウト記録**: 日時、部位、エクササイズ、セット数、重量
- **部位ローテーション**: 筋肉部位別の回復期間管理
- **プログレッシブ・オーバーロード**: 重量・回数の追跡
- **ワークアウト履歴**: 過去の記録表示・検索

### 2.3 分析機能
- **進捗分析**: グラフ表示（Chart.js）
- **統計情報**: トレーニング頻度、強度分析
- **推奨事項**: 科学的根拠に基づく提案

### 2.4 カレンダー機能
- **スケジュール表示**: 月間・週間ビュー
- **予定管理**: ワークアウト予定の登録
- **リマインダー**: 通知機能

### 2.5 エクササイズデータベース
- **エクササイズ一覧**: 部位別・種別別分類
- **詳細情報**: 説明、動画、注意点
- **カスタムエクササイズ**: ユーザー独自の追加

### 2.6 設定機能
- **プロフィール管理**: 基本情報、目標設定
- **通知設定**: リマインダー、進捗通知
- **データ管理**: エクスポート、インポート

## 3. 非機能要件

### 3.1 パフォーマンス
- **初期読み込み時間**: 3秒以内
- **ページ遷移**: 1秒以内
- **レスポンス時間**: 500ms以内
- **同時接続数**: 1000ユーザー

### 3.2 可用性
- **稼働率**: 99.9%以上
- **障害復旧時間**: 30分以内
- **データバックアップ**: 日次自動

### 3.3 セキュリティ
- **HTTPS**: 必須
- **認証**: JWT + Supabase Auth
- **データ暗号化**: 転送時・保存時
- **CSP**: Content Security Policy

### 3.4 アクセシビリティ
- **WCAG 2.1 AA**: 準拠
- **キーボード操作**: 完全対応
- **スクリーンリーダー**: 対応
- **色覚異常**: 配慮

## 4. 技術仕様

### 4.1 フロントエンド
```javascript
// 技術スタック
- HTML5 (セマンティックマークアップ)
- CSS3 (Tailwind CSS + カスタムスタイル)
- JavaScript ES6+ (モジュール、クラス、async/await)
- Chart.js (グラフ表示)
- Font Awesome (アイコン)
```

### 4.2 バックエンド
```javascript
// Supabase設定
- Database: PostgreSQL
- Authentication: Supabase Auth
- Real-time: Supabase Realtime
- Storage: Supabase Storage
- Edge Functions: Supabase Edge Functions
```

### 4.3 データベース設計
```sql
-- 主要テーブル
users (id, email, created_at, updated_at)
workout_sessions (id, user_id, date, duration, notes)
exercises (id, name, muscle_group, description)
training_logs (id, session_id, exercise_id, sets, reps, weight)
muscle_groups (id, name, recovery_days)
```

### 4.4 API設計
```javascript
// RESTful API
GET /api/workouts - ワークアウト一覧
POST /api/workouts - ワークアウト作成
PUT /api/workouts/:id - ワークアウト更新
DELETE /api/workouts/:id - ワークアウト削除

GET /api/exercises - エクササイズ一覧
GET /api/analysis - 分析データ
GET /api/calendar - カレンダーデータ
```

## 5. ページ構成

### 5.1 ルート設計
```
/ - ダッシュボード
/workout - ワークアウト記録
/calendar - カレンダー
/analysis - 分析
/progress - プログレス
/exercises - エクササイズ
/settings - 設定
/help - ヘルプ
/privacy - プライバシーポリシー
```

### 5.2 ページ構造
```html
<!-- 共通レイアウト -->
<!DOCTYPE html>
<html>
<head>
  <!-- メタデータ、CSS、JS -->
</head>
<body>
  <header><!-- ナビゲーション --></header>
  <main><!-- メインコンテンツ --></main>
  <footer><!-- フッター --></footer>
</body>
</html>
```

## 6. テスト仕様

### 6.1 単体テスト
- **カバレッジ**: 98%以上
- **フレームワーク**: Jest
- **対象**: 全JavaScript関数・クラス

### 6.2 統合テスト
- **フレームワーク**: Puppeteer
- **対象**: ページ遷移、API連携、認証フロー

### 6.3 E2Eテスト
- **シナリオ**: ユーザー登録からワークアウト記録まで
- **ブラウザ**: Chrome, Firefox, Safari
- **デバイス**: デスクトップ、タブレット、モバイル

## 7. 品質管理

### 7.1 コード品質
- **ESLint**: エラー0件、警告0件
- **Prettier**: コードフォーマット統一
- **TypeScript**: 型安全性（将来的に導入）

### 7.2 パフォーマンス
- **Lighthouse**: 90点以上
- **Core Web Vitals**: 全て緑
- **Bundle Size**: 500KB以下

### 7.3 セキュリティ
- **OWASP**: 準拠
- **脆弱性スキャン**: 月次実行
- **依存関係**: 最新版維持

## 8. デプロイ仕様

### 8.1 環境構成
- **開発環境**: localhost:8000
- **ステージング**: GitHub Pages
- **本番環境**: GitHub Pages

### 8.2 CI/CD
- **GitHub Actions**: 自動テスト・デプロイ
- **ブランチ戦略**: main, develop, feature/*
- **レビュー**: 必須

### 8.3 監視
- **エラー追跡**: Sentry
- **パフォーマンス**: Google Analytics
- **可用性**: Uptime Robot

## 9. 運用仕様

### 9.1 バックアップ
- **データベース**: 日次自動
- **ファイル**: 週次自動
- **復旧時間**: 1時間以内

### 9.2 メンテナンス
- **定期更新**: 月次
- **セキュリティパッチ**: 即座に適用
- **機能追加**: 四半期ごと

### 9.3 サポート
- **ドキュメント**: 充実
- **FAQ**: 自動回答
- **問い合わせ**: 24時間以内回答

## 10. 将来拡張

### 10.1 短期計画（3ヶ月）
- PWA対応
- オフライン機能
- プッシュ通知

### 10.2 中期計画（6ヶ月）
- モバイルアプリ
- ソーシャル機能
- AI推奨機能

### 10.3 長期計画（1年）
- 多言語対応
- 企業向け機能
- API公開

---

**作成日**: 2024年10月23日  
**バージョン**: 1.0  
**承認者**: 開発チーム
