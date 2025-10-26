# デプロイ最適化ガイド

## 概要

このドキュメントでは、筋トレ部位ローテーション管理システムのデプロイ速度を向上させるための最適化手法について説明します。

## 最適化内容

### 1. ビルドプロセスの最適化

#### 高速デプロイモード

```bash
# 高速デプロイ（テストスキップ）
npm run deploy:fast

# フルビルド（テスト含む）
npm run build:full
```

#### デプロイスクリプトの使用

```bash
# 高速デプロイ
./deploy.sh fast

# フルデプロイ
./deploy.sh full
```

### 2. ファイル除外の最適化

以下のファイルがデプロイから除外されます：

- `coverage/` - テストカバレッジレポート
- `tests/results/` - テスト結果
- `*.backup` - バックアップファイル
- `app-refactored.js` - リファクタリング用ファイル

### 3. キャッシュ戦略の最適化

#### Nginx設定の改善

- 静的ファイルの1年キャッシュ
- Gzip圧縮の有効化
- 不要なファイルへのアクセスブロック

#### Service Workerの最適化

- 段階的キャッシュ戦略
- パフォーマンスメトリクス追跡
- キャッシュサイズの自動最適化

### 4. アセット最適化

#### 画像ファイルの最適化

- アイコンファイルの最小化
- 不要なスクリーンショットの除外
- WebP形式への変換推奨

#### CSS/JS最適化

- 不要なコードの削除
- ミニファイケーション
- Tree shakingの実装

## デプロイ速度の改善効果

### Before（最適化前）

- ビルド時間: 約2-3分
- デプロイ時間: 約1-2分
- 合計時間: 約3-5分

### After（最適化後）

- 高速デプロイ: 約30-60秒
- フルデプロイ: 約1-2分
- 合計時間: 約30秒-2分

## 使用方法

### 日常的なデプロイ

```bash
# コード変更のみの場合
./deploy.sh fast
```

### 重要なリリース

```bash
# テストも含む完全なデプロイ
./deploy.sh full
```

### 手動デプロイ

```bash
# フォーマットのみ
npm run deploy:fast

# フルビルド
npm run build:full && gh-pages -d .
```

## 監視とメンテナンス

### パフォーマンス監視

Service Workerのパフォーマンス統計を確認：

```javascript
// ブラウザのコンソールで実行
navigator.serviceWorker.ready.then((registration) => {
  const messageChannel = new MessageChannel();
  messageChannel.port1.onmessage = (event) => {
    console.log('Performance Stats:', event.data.stats);
  };
  registration.active.postMessage({ type: 'GET_PERFORMANCE_STATS' }, [
    messageChannel.port2,
  ]);
});
```

### キャッシュ最適化

```javascript
// 手動でキャッシュ最適化を実行
navigator.serviceWorker.ready.then((registration) => {
  const messageChannel = new MessageChannel();
  messageChannel.port1.onmessage = (event) => {
    console.log('Cache optimization result:', event.data);
  };
  registration.active.postMessage({ type: 'OPTIMIZE_CACHES' }, [
    messageChannel.port2,
  ]);
});
```

## トラブルシューティング

### デプロイが失敗する場合

1. 不要なファイルを手動で削除
2. キャッシュをクリア
3. フルビルドを実行

### パフォーマンスが悪い場合

1. Service Workerの統計を確認
2. キャッシュサイズをチェック
3. 不要なファイルを除外

## 今後の改善案

1. **CDNの導入**
   - CloudflareやAWS CloudFrontの活用
   - グローバル配信の最適化

2. **画像最適化の自動化**
   - WebP形式への自動変換
   - レスポンシブ画像の実装

3. **ビルドプロセスの並列化**
   - 複数ファイルの並列処理
   - インクリメンタルビルドの実装

4. **モニタリングの強化**
   - デプロイ時間の自動計測
   - パフォーマンスアラートの設定
