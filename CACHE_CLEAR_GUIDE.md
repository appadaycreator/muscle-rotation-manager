# キャッシュクリアガイド

## ブラウザキャッシュのクリア方法

### Chrome/Edge
1. **Ctrl+Shift+R** (Windows) または **Cmd+Shift+R** (Mac) - ハードリフレッシュ
2. **F12** でデベロッパーツールを開く
3. **Network** タブをクリック
4. **Disable cache** にチェックを入れる
5. **Ctrl+Shift+R** でリロード

### Firefox
1. **Ctrl+Shift+R** (Windows) または **Cmd+Shift+R** (Mac) - ハードリフレッシュ
2. **F12** でデベロッパーツールを開く
3. **ネットワーク** タブをクリック
4. **設定** アイコンをクリック
5. **キャッシュを無効にする** にチェックを入れる

### Safari
1. **Cmd+Option+R** - ハードリフレッシュ
2. **開発** メニュー → **キャッシュを空にする**

## アプリケーションキャッシュのクリア

### 1. ローカルストレージのクリア
```javascript
// ブラウザのコンソールで実行
localStorage.clear();
sessionStorage.clear();
```

### 2. Service Workerのクリア
```javascript
// ブラウザのコンソールで実行
navigator.serviceWorker.getRegistrations().then(function(registrations) {
    for(let registration of registrations) {
        registration.unregister();
    }
});
```

### 3. アプリケーションキャッシュのクリア
```javascript
// ブラウザのコンソールで実行
if ('caches' in window) {
    caches.keys().then(function(names) {
        for (let name of names) {
            caches.delete(name);
        }
    });
}
```

## 開発サーバーの再起動

### 1. 開発サーバーを停止
```bash
# 現在実行中のサーバーを停止
# Ctrl+C で停止
```

### 2. 開発サーバーを再起動
```bash
# ローカルサーバーを再起動
python -m http.server 8000
# または
npx serve .
```

## 完全なキャッシュクリア手順

1. **ブラウザを完全に閉じる**
2. **ブラウザを再起動**
3. **ハードリフレッシュを実行** (Ctrl+Shift+R)
4. **デベロッパーツールでキャッシュを無効化**
5. **ローカルストレージをクリア**
6. **Service Workerをクリア**
7. **開発サーバーを再起動**

## トラブルシューティング

### 問題が解決しない場合
1. **別のブラウザでテスト**
2. **プライベート/シークレットモードでテスト**
3. **開発サーバーのポートを変更**
4. **完全にブラウザを再インストール**

### デバッグ情報の確認
```javascript
// ブラウザのコンソールで実行
console.log('Current URL:', window.location.href);
console.log('Router state:', window.router);
console.log('Available routes:', Array.from(window.router.routes.keys()));
```
