# 筋トレ部位ローテーション管理システム (MuscleRotationManager)

効率的な筋トレ部位ローテーションを科学的に管理するWebアプリケーションです。

## 概要

このアプリケーションは、筋肉の回復期間を考慮した最適なトレーニングスケジュールを提案し、ユーザーのワークアウトデータを記録・分析する機能を提供します。

## 主な機能

- **ダッシュボード**: ワークアウト概要と今日の推奨部位
- **ワークアウト記録**: トレーニング内容の詳細記録
- **カレンダー**: トレーニング履歴の視覚化
- **分析機能**: データに基づくパフォーマンス分析
- **エクササイズ管理**: 部位別エクササイズの管理
- **設定**: ユーザープロフィールとアプリ設定
- **プライバシーポリシー**: 個人情報保護方針

## 技術スタック

- **フロントエンド**: HTML5, CSS3, JavaScript (ES6+)
- **スタイリング**: Tailwind CSS
- **バックエンド**: Supabase (Database & Authentication)
- **PWA**: Service Worker, Web App Manifest
- **自動化**: GitHub Actions (Supabaseキープアライブ、CI/CD、セキュリティ監査)

## データプライバシー

本アプリケーションはユーザーの個人情報と健康データを安全に管理します。詳細は[プライバシーポリシー](partials/privacy.html)をご覧ください。

## セットアップ

1. プロジェクトをクローン
```bash
git clone https://github.com/appadaycreator/muscle-rotation-manager.git
cd muscle-rotation-manager
```

2. ローカルサーバーで起動
```bash
python -m http.server 8000
# または
npx serve .
```

3. ブラウザで `http://localhost:8000` にアクセス

## ライセンス

MIT License