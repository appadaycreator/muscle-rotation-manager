# Supabase設定・復旧ガイド

## 🚨 現在の状況

### 検出された問題
1. **プロジェクト一時停止**: Supabaseプロジェクト `rtdbgxanjfvdkzrnxqjz` が一時停止中
2. **設定不整合**: アプリケーション設定が間違ったプロジェクトIDを参照していた
3. **RLSエラー**: `user_profiles`テーブルのRow Level Securityポリシーの問題

### 修正済み事項
- ✅ 正しいプロジェクトIDに更新（`rtdbgxanjfvdkzrnxqjz`）
- ✅ `user_profiles`テーブルが存在しない場合のフォールバック処理を追加
- ✅ localStorageを使用した一時的なプロフィール保存機能

## 🛠️ Supabaseプロジェクト復旧手順

### Step 1: プロジェクトの復旧

1. **Supabaseダッシュボードにアクセス**
   ```
   https://supabase.com/dashboard/project/rtdbgxanjfvdkzrnxqjz
   ```

2. **プロジェクトの復旧**
   - "Unpause Project" ボタンをクリック
   - 課金情報を確認・更新（必要に応じて）

### Step 2: データベーススキーマの設定

1. **SQLエディターで完全なスキーマを実行**
   ```sql
   -- database/schema.sql の内容を実行
   ```

2. **必要なテーブルの確認**
   - `user_profiles` テーブル
   - `workouts` テーブル
   - その他の必要なテーブル

### Step 3: 新しいAPIキーの取得

1. **ダッシュボードでAPIキーを取得**
   - Settings → API
   - Project URL と anon public key をコピー

2. **app.jsの更新**
   ```javascript
   // 現在の設定（プロジェクト復旧後に更新が必要）
   const supabaseUrl = 'https://rtdbgxanjfvdkzrnxqjz.supabase.co';
   const supabaseKey = '[NEW_ANON_KEY_FROM_DASHBOARD]';
   ```

### Step 4: ストレージバケットの設定

以下のバケットを作成：
- `avatars` (Public) - ユーザーアバター画像用
- `exercise-images` (Public) - エクササイズ画像用
- `user-uploads` (Private) - ユーザーアップロード用

### Step 5: Row Level Security (RLS) の確認

`user_profiles`テーブルのRLSポリシーが正しく設定されていることを確認：

```sql
-- ユーザープロフィールのRLSポリシー
CREATE POLICY "Users can view own profile" ON user_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON user_profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON user_profiles FOR INSERT WITH CHECK (auth.uid() = id);
```

## 🔧 現在の暫定対応

### プロフィール機能
- `user_profiles`テーブルが利用できない場合、localStorageにデータを保存
- Supabase復旧後は自動的にデータベースを使用

### エラーハンドリング
- テーブル存在チェック機能を追加
- フォールバック処理でアプリケーションの継続動作を保証

## 📋 復旧後のチェックリスト

- [ ] Supabaseプロジェクトの復旧
- [ ] 新しいAPIキーの取得・設定
- [ ] データベーススキーマの適用
- [ ] ストレージバケットの作成
- [ ] RLSポリシーの確認
- [ ] プロフィール編集機能のテスト
- [ ] ワークアウト記録機能のテスト
- [ ] 認証機能のテスト

## 🚀 テスト方法

### プロフィール編集のテスト
1. アプリにログイン
2. 設定画面に移動
3. プロフィール情報を編集
4. 保存ボタンをクリック
5. エラーが発生しないことを確認

### 接続テストの実行
```bash
node supabase-connection-test.js
```

## 📞 サポート

問題が解決しない場合は、以下を確認してください：
1. ブラウザのコンソールエラー
2. Supabaseダッシュボードのログ
3. ネットワーク接続状況
4. 課金状況（無料枠の制限など）
