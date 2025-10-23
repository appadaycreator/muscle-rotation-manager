# SPAルーティング404エラー解決ガイド

## 問題の説明

`http://localhost:8000/workout` にアクセスすると404エラーが発生する問題は、SPA（Single Page Application）のルーティング設定が原因です。

## 解決方法

### 方法1: ブラウザで直接アクセス（推奨）

1. **ブラウザで `http://localhost:8000` にアクセス**
2. **アプリケーションが読み込まれた後、URLバーに `/workout` を追加**
3. **または、アプリケーション内のナビゲーションメニューを使用**

### 方法2: 手動でSPAルーティングを設定

#### ブラウザのコンソールで実行
```javascript
// ルーターを手動で初期化
if (window.router) {
    window.router.navigateTo('/workout');
} else {
    // ルーターが利用できない場合は、直接URLを変更
    window.history.pushState({}, '', '/workout');
    window.location.reload();
}
```

### 方法3: 開発者ツールでのデバッグ

#### ブラウザのコンソールで実行
```javascript
// ルーターの状態を確認
debugRouter();

// 利用可能なルートを確認
console.log('Available routes:', Array.from(window.router.routes.keys()));

// 現在のパスを確認
console.log('Current path:', window.router.getCurrentPath());

// 手動でルートを変更
window.router.navigateTo('/workout');
```

### 方法4: キャッシュクリア

#### ブラウザのコンソールで実行
```javascript
// すべてのキャッシュをクリア
clearAllCache();

// ページをリロード
window.location.reload();
```

### 方法5: ハードリフレッシュ

- **Windows/Linux**: `Ctrl + Shift + R`
- **Mac**: `Cmd + Shift + R`

### 方法6: デベロッパーツールでのキャッシュ無効化

1. **F12** でデベロッパーツールを開く
2. **Network** タブをクリック
3. **Disable cache** にチェックを入れる
4. ページをリロード

## トラブルシューティング

### 問題: まだ404エラーが発生する
**解決方法**:
1. ブラウザを完全に閉じる
2. ブラウザを再起動
3. `http://localhost:8000` にアクセス
4. アプリケーションが読み込まれた後、ナビゲーションメニューを使用

### 問題: ルーティングが正しく動作しない
**解決方法**:
1. ブラウザのコンソールで `debugRouter()` を実行
2. ルーターの状態を確認
3. 必要に応じて `clearAllCache()` を実行

### 問題: 静的ファイルが読み込まれない
**解決方法**:
1. ファイルパスを確認
2. サーバーのルートディレクトリを確認
3. ファイルの存在を確認

## 確認方法

1. **サーバー起動確認**: コンソールに「HTTPサーバーが起動しました」と表示される
2. **ルーティング確認**: 各URLにアクセスしてページが表示される
3. **ナビゲーション確認**: ページ間の遷移が正常に動作する
4. **ブラウザバック確認**: ブラウザの戻る/進むボタンが正常に動作する

## 最終的な解決策

### 最も確実な方法

1. **ブラウザで `http://localhost:8000` にアクセス**
2. **アプリケーションが完全に読み込まれるまで待つ**
3. **アプリケーション内のナビゲーションメニューを使用してページを遷移**
4. **URLバーに直接入力する場合は、アプリケーションが読み込まれた後に行う**

### デバッグ用のコマンド

```javascript
// ブラウザのコンソールで実行
console.log('Router available:', !!window.router);
console.log('Current path:', window.location.pathname);
console.log('Available routes:', window.router ? Array.from(window.router.routes.keys()) : 'Router not available');

// 手動でルートを変更
if (window.router) {
    window.router.navigateTo('/workout');
} else {
    console.log('Router not available, using manual navigation');
    window.history.pushState({}, '', '/workout');
    window.location.reload();
}
```
