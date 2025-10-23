# Supabase復旧ガイド

## 🚨 現在の状況

### 検出された問題
1. **プロジェクト一時停止**: 実際のSupabaseプロジェクトが一時停止中
2. **設定不整合**: アプリケーション設定が間違ったプロジェクトIDを参照

### プロジェクト情報
- **実際のプロジェクト**: `rtdbgxanjfvdkzrnxqjz`
- **リージョン**: Northeast Asia (Tokyo)
- **状態**: ⏸️ PAUSED
- **設定されているプロジェクト**: `mwwlqpokfgduxyjbqoff` ❌ (存在しない)

## 🛠️ 復旧手順

### Step 1: Supabaseプロジェクトの復旧

#### 1.1 ダッシュボードでプロジェクトを復旧
```bash
# ブラウザで以下のURLにアクセス
https://supabase.com/dashboard/project/rtdbgxanjfvdkzrnxqjz
```

**手順:**
1. Supabaseダッシュボードにログイン
2. プロジェクト `rtdbgxanjfvdkzrnxqjz` を選択
3. "Unpause Project" ボタンをクリック
4. 課金情報を確認・更新（必要に応じて）

#### 1.2 プロジェクト復旧の確認
```bash
# CLI で復旧を確認
supabase projects list
supabase link --project-ref rtdbgxanjfvdkzrnxqjz
```

### Step 2: 正しい設定情報の取得

#### 2.1 APIキーの取得
```bash
# プロジェクトリンク後
supabase projects api-keys
```

または、ダッシュボードから：
1. Settings → API
2. Project URL と anon public key をコピー

#### 2.2 設定情報の確認
- **Project URL**: `https://rtdbgxanjfvdkzrnxqjz.supabase.co`
- **Anon Key**: [ダッシュボードから取得]
- **Service Role Key**: [ダッシュボードから取得]

### Step 3: アプリケーション設定の更新

#### 3.1 app.js の更新
```javascript
// 現在の設定（間違い）
const supabaseUrl = 'https://mwwlqpokfgduxyjbqoff.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';

// 正しい設定に更新
const supabaseUrl = 'https://rtdbgxanjfvdkzrnxqjz.supabase.co';
const supabaseKey = '[NEW_ANON_KEY_FROM_DASHBOARD]';
```

#### 3.2 GitHub Secrets の更新
```bash
# GitHub リポジトリの Settings → Secrets and variables → Actions
SUPABASE_URL=https://rtdbgxanjfvdkzrnxqjz.supabase.co
SUPABASE_ANON_KEY=[NEW_ANON_KEY]
```

### Step 4: データベーススキーマの確認・復旧

#### 4.1 既存スキーマの確認
```bash
# プロジェクトリンク後
supabase db dump --schema-only > current_schema.sql
```

#### 4.2 必要に応じてスキーマを適用
```bash
# 既存の schema.sql を適用
supabase db reset
# または
psql -h db.rtdbgxanjfvdkzrnxqjz.supabase.co -U postgres -d postgres -f database/schema.sql
```

### Step 5: 接続テストの再実行

#### 5.1 設定更新後のテスト
```bash
# 更新された設定でテスト実行
node supabase-connection-test.js
```

#### 5.2 期待される結果
```
✅ PASS 基本接続
✅ PASS 認証設定  
✅ PASS データベース
✅ PASS テーブル存在
✅ PASS RLS設定
✅ PASS ストレージ
```

## 📝 チェックリスト

### 復旧前の確認
- [ ] Supabaseダッシュボードにアクセス可能
- [ ] プロジェクト `rtdbgxanjfvdkzrnxqjz` が表示される
- [ ] 課金情報が最新

### 復旧作業
- [ ] プロジェクトの一時停止を解除
- [ ] 新しいAPIキーを取得
- [ ] app.js の設定を更新
- [ ] GitHub Secrets を更新
- [ ] 接続テストが成功

### 復旧後の確認
- [ ] アプリケーションが正常に動作
- [ ] 認証機能が動作
- [ ] データベース操作が可能
- [ ] ストレージ機能が利用可能

## ⚠️ 注意事項

### セキュリティ
- 新しいAPIキーは環境変数で管理
- 古いAPIキーは無効化
- GitHubリポジトリから機密情報を除去

### データ保護
- 復旧前にデータのバックアップを確認
- RLSポリシーが正しく設定されているか確認
- ユーザーデータの整合性を確認

### 監視
- プロジェクトの使用量を監視
- 課金アラートを設定
- 定期的なヘルスチェックを実装

## 🔗 参考リンク

- [Supabase Dashboard](https://supabase.com/dashboard/project/rtdbgxanjfvdkzrnxqjz)
- [Supabase Pricing](https://supabase.com/pricing)
- [Supabase CLI Documentation](https://supabase.com/docs/guides/cli)
- [Project Pausing Documentation](https://supabase.com/docs/guides/platform/project-pausing)

## 📞 サポート

問題が解決しない場合：
1. [Supabase Community](https://github.com/supabase/supabase/discussions)
2. [Supabase Discord](https://discord.supabase.com/)
3. [Supabase Support](https://supabase.com/support)

---

**重要**: この復旧作業は本番環境に影響する可能性があります。作業前に必要なバックアップを取得し、段階的に実行してください。
