# SPA対応サーバー起動ガイド

## 問題の説明

`http://localhost:8000/workout` にアクセスすると404エラーが発生する問題は、SPA（Single Page Application）のルーティング設定が原因です。

## 解決方法

### 1. SPA対応サーバーの起動

#### 方法A: 専用スクリプトを使用（推奨）
```bash
# スクリプトを実行
./start-server.sh
```

#### 方法B: Pythonスクリプトを直接実行
```bash
# Python3を使用
python3 server.py 8000

# Pythonを使用
python server.py 8000
```

#### 方法C: 通常のHTTPサーバー（SPAルーティングが動作しない）
```bash
# 通常のHTTPサーバー
python3 -m http.server 8000
```

### 2. アクセス方法

SPA対応サーバーを起動した後、以下のURLでアクセスできます：

- **ダッシュボード**: `http://localhost:8000/`
- **ワークアウト**: `http://localhost:8000/workout`
- **カレンダー**: `http://localhost:8000/calendar`
- **分析**: `http://localhost:8000/analysis`
- **プログレス**: `http://localhost:8000/progress`
- **エクササイズ**: `http://localhost:8000/exercises`
- **設定**: `http://localhost:8000/settings`

### 3. トラブルシューティング

#### 問題: まだ404エラーが発生する
**解決方法**:
1. サーバーを停止（Ctrl+C）
2. SPA対応サーバーを再起動
3. ブラウザのキャッシュをクリア
4. ハードリフレッシュ（Ctrl+Shift+R）

#### 問題: ルーティングが正しく動作しない
**解決方法**:
1. ブラウザのコンソールで `debugRouter()` を実行
2. ルーターの状態を確認
3. 必要に応じて `clearAllCache()` を実行

#### 問題: 静的ファイルが読み込まれない
**解決方法**:
1. ファイルパスを確認
2. サーバーのルートディレクトリを確認
3. ファイルの存在を確認

### 4. 開発時の注意点

#### キャッシュクリア
```javascript
// ブラウザのコンソールで実行
clearAllCache();
debugRouter();
```

#### デバッグ情報の確認
```javascript
// ルーターの状態を確認
debugRouter();

// 現在のパスを確認
console.log('Current path:', window.router.getCurrentPath());

// 利用可能なルートを確認
console.log('Available routes:', Array.from(window.router.routes.keys()));
```

### 5. 本番環境での設定

#### Apache (.htaccess)
```apache
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^.*$ /index.html [L]
```

#### Nginx
```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

### 6. 確認方法

1. **サーバー起動確認**: コンソールに「SPA対応HTTPサーバーが起動しました」と表示される
2. **ルーティング確認**: 各URLにアクセスしてページが表示される
3. **ナビゲーション確認**: ページ間の遷移が正常に動作する
4. **ブラウザバック確認**: ブラウザの戻る/進むボタンが正常に動作する

### 7. よくある質問

**Q: なぜ通常のHTTPサーバーでは動作しないのか？**
A: SPAはクライアントサイドルーティングを使用するため、サーバー側でルートを適切に処理する必要があります。

**Q: 本番環境でも同じ設定が必要か？**
A: はい、本番環境でもSPAルーティング用の設定が必要です。

**Q: パフォーマンスに影響はあるか？**
A: 最小限の影響しかありません。静的ファイルは適切にキャッシュされます。
