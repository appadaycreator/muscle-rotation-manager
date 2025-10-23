# Supabase接続診断レポート

## 📋 診断結果サマリー

**実行日時**: 2024年10月23日  
**プロジェクト**: 筋トレ部位ローテーション管理システム  
**診断対象**: Supabase接続設定

## ❌ 検出された問題

### 1. DNS解決エラー
- **エラー**: `getaddrinfo ENOTFOUND mwwlqpokfgduxyjbqoff.supabase.co`
- **詳細**: 指定されたSupabaseプロジェクトURLが解決できません
- **影響**: すべてのSupabase機能が利用不可

### 2. 現在の設定情報
```javascript
const supabaseUrl = 'https://mwwlqpokfgduxyjbqoff.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
```

### 3. JWTトークン分析
- **プロジェクトRef**: mwwlqpokfgduxyjbqoff
- **ロール**: anon
- **発行日時**: 2025/7/15 2:55:12
- **有効期限**: 2035/7/15 14:55:12 ✅ (有効)

## 🔍 考えられる原因

### A. プロジェクトの状態問題
1. **プロジェクト削除**: Supabaseプロジェクトが削除された
2. **プロジェクト一時停止**: 無料プランの制限により一時停止
3. **プロジェクト移行**: 別のリージョンやアカウントに移行

### B. 設定問題
1. **URL間違い**: プロジェクトURLが正しくない
2. **環境設定**: 開発環境と本番環境の設定混在
3. **キー不整合**: URLとAPIキーの組み合わせが不正

### C. ネットワーク問題
1. **DNS設定**: ローカルDNS設定の問題
2. **ファイアウォール**: 企業ネットワークでのブロック
3. **プロキシ設定**: プロキシサーバーの設定問題

## 🛠️ 解決策

### 即座に実行すべき対応

#### 1. Supabaseダッシュボードでの確認
```bash
# ブラウザで以下にアクセス
https://supabase.com/dashboard/projects
```
- プロジェクト一覧を確認
- プロジェクトの状態（Active/Paused/Deleted）を確認
- 正しいURLとAPIキーを再取得

#### 2. 新しいプロジェクトの作成（必要に応じて）
```bash
# Supabase CLI使用の場合
npx supabase init
npx supabase start
npx supabase db reset
```

#### 3. 設定ファイルの更新
```javascript
// app.js の更新が必要な箇所
const supabaseUrl = 'https://[NEW_PROJECT_REF].supabase.co';
const supabaseKey = '[NEW_ANON_KEY]';
```

### 段階的な復旧手順

#### Phase 1: 状況確認
- [ ] Supabaseダッシュボードにログイン
- [ ] プロジェクト状態の確認
- [ ] 課金状況の確認
- [ ] バックアップの有無確認

#### Phase 2: プロジェクト復旧/再作成
- [ ] 既存プロジェクトの復旧（可能な場合）
- [ ] 新規プロジェクトの作成（必要な場合）
- [ ] データベーススキーマの適用
- [ ] 初期データの投入

#### Phase 3: アプリケーション設定更新
- [ ] 新しいURL/APIキーの取得
- [ ] app.jsの設定更新
- [ ] GitHub Secretsの更新
- [ ] 環境変数の更新

#### Phase 4: 機能テスト
- [ ] 接続テストの再実行
- [ ] 認証機能のテスト
- [ ] データベース操作のテスト
- [ ] ストレージ機能のテスト

## 📝 データベーススキーマ復旧

既存の `database/schema.sql` を使用してデータベースを復旧：

```sql
-- 1. 基本テーブルの作成
-- muscle_groups, exercises, user_profiles等

-- 2. RLSポリシーの設定
-- セキュリティポリシーの適用

-- 3. 初期データの投入
-- muscle_groupsの基本データ等
```

## 🔐 セキュリティ考慮事項

### APIキーの管理
- 新しいAPIキーは環境変数で管理
- GitHubリポジトリからの機密情報除去
- 本番環境とテスト環境の分離

### RLSポリシー
- ユーザーデータの適切な保護
- 認証状態に基づくアクセス制御
- 監査ログの設定

## 📊 推奨される次のアクション

### 優先度: 高
1. **Supabaseダッシュボードでプロジェクト状態確認**
2. **新規プロジェクト作成（必要に応じて）**
3. **データベーススキーマの適用**

### 優先度: 中
1. **GitHub Secretsの更新**
2. **CI/CDパイプラインの修正**
3. **ドキュメントの更新**

### 優先度: 低
1. **監視・アラートの設定**
2. **バックアップ戦略の策定**
3. **災害復旧計画の作成**

## 🔗 参考リンク

- [Supabase Dashboard](https://supabase.com/dashboard)
- [Supabase Documentation](https://supabase.com/docs)
- [Supabase CLI Guide](https://supabase.com/docs/guides/cli)
- [RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)

---

**注意**: このレポートは自動診断の結果です。実際の復旧作業前に、Supabaseダッシュボードでの手動確認を強く推奨します。
