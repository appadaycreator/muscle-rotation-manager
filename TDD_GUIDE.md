# テスト駆動・仕様書駆動開発ガイド

## 概要

筋トレ部位ローテーション管理システムにおけるテスト駆動開発（TDD）と仕様書駆動開発（SDD）の実践ガイドです。

## 🚀 クイックスタート

### 1. 環境セットアップ
```bash
# 依存関係のインストール
npm install

# 開発サーバー起動
npm run dev
```

### 2. テスト実行
```bash
# 全テスト実行
npm run test:all-new

# カテゴリ別テスト実行
npm run test:unit          # ユニットテスト
npm run test:integration   # 統合テスト
npm run test:spec         # 仕様書駆動テスト

# ブラウザでのインタラクティブテスト
npm run test:browser
# → http://localhost:8000/tests/test-runner.html にアクセス
```

### 3. 実践例の確認
```bash
# TDD実践例
npm run test:tdd-example

# 仕様書駆動開発実践例
npm run test:spec-example
```

## 📁 プロジェクト構造

```
tests/
├── unit/                    # ユニットテスト
│   ├── test-runner.js      # カスタムテストランナー
│   └── muscle-groups.test.js # 筋肉部位管理テスト
├── integration/             # 統合テスト
│   └── workout-flow.test.js # ワークアウトフロー統合テスト
├── spec-driven/            # 仕様書駆動テスト
│   └── requirements.test.js # SPEC.md準拠テスト
├── examples/               # 実践例
│   ├── tdd-example.js      # TDD実践例
│   └── spec-driven-example.js # SDD実践例
├── mocks/                  # モック実装
│   └── supabase.mock.js    # Supabaseモック
├── templates/              # テンプレート
│   └── test-template.js    # 新規テスト作成用テンプレート
├── results/                # テスト結果
└── test-runner.html        # ブラウザテストUI
```

## 🧪 テスト駆動開発（TDD）

### TDDサイクル: Red → Green → Refactor

#### 1. Red Phase（失敗するテストを書く）
```javascript
test('新機能が期待通りに動作する', () => {
    // まだ実装されていない機能をテスト
    const result = newFeature.calculate(input);
    expect(result).toBe(expectedOutput);
});
```

#### 2. Green Phase（テストを通す最小限の実装）
```javascript
class NewFeature {
    calculate(input) {
        // テストを通すための最小限の実装
        return expectedOutput;
    }
}
```

#### 3. Refactor Phase（コードの改善）
```javascript
class NewFeature {
    calculate(input) {
        // より良い実装にリファクタリング
        return this.performComplexCalculation(input);
    }
    
    performComplexCalculation(input) {
        // 実際のロジック
    }
}
```

### TDD実践のポイント

1. **小さなステップで進む**
   - 一度に一つの機能のみ実装
   - テストは具体的で理解しやすく

2. **テストファースト**
   - 実装前にテストを書く
   - 要件を明確にしてからコーディング

3. **継続的なリファクタリング**
   - テストがあることで安心してリファクタリング
   - コードの品質を継続的に改善

## 📋 仕様書駆動開発（SDD）

### SPEC.mdからテストケースを生成

#### 1. 仕様書の要件を分析
```markdown
## カレンダー機能
- 月間表示: カレンダー形式でのトレーニング履歴表示
- 日別詳細: 特定日のワークアウト詳細表示
- 色分け表示: 部位別の色分けによる視覚化
```

#### 2. 要件ごとにテストケースを作成
```javascript
describe('【SPEC準拠】カレンダー機能', () => {
    test('【仕様】月間表示: カレンダー形式でのトレーニング履歴表示', () => {
        const calendar = calendarManager.generateMonthlyCalendar(2024, 1, workoutData);
        expect(calendar.days).toHaveLength(31);
        expect(calendar.days[14].hasWorkout).toBeTruthy();
    });
    
    test('【仕様】日別詳細: 特定日のワークアウト詳細表示', () => {
        const detail = calendarManager.getDayDetail('2024-01-15', workoutData);
        expect(detail.workouts).toHaveLength(1);
        expect(detail.totalDuration).toBe(3600);
    });
});
```

#### 3. 仕様に基づいた実装
```javascript
class CalendarManager {
    generateMonthlyCalendar(year, month, workoutData) {
        // SPEC.mdの要件に従って実装
    }
    
    getDayDetail(date, workoutData) {
        // 仕様書の詳細要件に従って実装
    }
}
```

### SDD実践のポイント

1. **仕様書との対応を明確化**
   - テスト名に【SPEC準拠】タグを付与
   - 仕様書の章節との対応を記載

2. **受け入れ条件の明確化**
   - 仕様書の曖昧な部分をテストで明確化
   - ステークホルダーとの合意形成

3. **仕様変更への対応**
   - 仕様書更新時はテストから見直し
   - 影響範囲の把握と対応

## 🛠️ カスタムテストランナー

### 基本的な使用方法

```javascript
// テストの定義
describe('機能名', () => {
    test('テストケース名', () => {
        // Arrange（準備）
        const input = 'test-data';
        
        // Act（実行）
        const result = targetFunction(input);
        
        // Assert（検証）
        expect(result).toBe('expected-output');
    });
});
```

### アサーション関数

```javascript
expect(actual).toBe(expected);              // 厳密等価
expect(actual).toEqual(expected);           // 深い等価
expect(actual).toBeTruthy();                // truthy値
expect(actual).toBeFalsy();                 // falsy値
expect(actual).toContain(item);             // 配列・文字列に含まれる
expect(actual).toHaveLength(length);        // 長さ
expect(actual).toThrow();                   // 例外発生
expect(actual).toBeInstanceOf(Constructor); // インスタンス
```

### モック機能

```javascript
const mockFn = mock();
mockFn.mockReturnValue('mocked-value');
mockFn.mockImplementation((arg) => arg * 2);

// モック関数の呼び出し確認
expect(mockFn.callCount).toBe(1);
expect(mockFn.calls[0]).toEqual(['arg1', 'arg2']);
```

## 🎯 新しいテストの作成手順

### 1. テンプレートをコピー
```bash
cp tests/templates/test-template.js tests/unit/new-feature.test.js
```

### 2. テンプレートをカスタマイズ
```javascript
// [FEATURE_NAME] を実際の機能名に置換
describe('新機能テスト', () => {
    // テストケースを実装
});
```

### 3. テストを実行
```bash
# 新しいテストファイルを実行
node -e "require('./tests/unit/test-runner.js'); require('./tests/unit/new-feature.test.js'); runTests()"
```

## 📊 テスト結果の確認

### コマンドライン出力
```
🚀 テスト実行開始
📊 総テスト数: 15
============================================================
✅ 1. 筋肉部位の基本データが正しく定義されている
✅ 2. 大筋群の回復時間が72時間に設定されている
❌ 3. 無効な入力に対してエラーが発生する
   エラー: 期待値: Error, 実際の値: undefined
============================================================
📈 テスト結果サマリー
✅ 成功: 14
❌ 失敗: 1
📊 総計: 15
⏱️  実行時間: 1250ms
📈 成功率: 93.3%
```

### JSON結果ファイル
```json
{
  "passed": 14,
  "failed": 1,
  "total": 15,
  "duration": 1250,
  "timestamp": "2024-12-25T10:30:00.000Z",
  "successRate": "93.3",
  "errors": [
    {
      "test": "無効な入力に対してエラーが発生する",
      "error": "期待値: Error, 実際の値: undefined"
    }
  ]
}
```

## 🔄 継続的インテグレーション

### GitHub Actionsとの統合
```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm install
      - run: npm run test:all-new
```

## 📚 ベストプラクティス

### 1. テスト設計
- **AAA パターン**: Arrange, Act, Assert
- **1テスト1検証**: 1つのテストで1つの機能のみ
- **独立性**: テスト間の依存関係を排除

### 2. テスト命名
- **具体的**: 何をテストするかが明確
- **期待結果**: 期待する結果を含める
- **日本語**: 理解しやすい日本語で記述

### 3. モックの活用
- **外部依存の排除**: データベース、API等
- **テストの高速化**: 重い処理をモック化
- **エラーケースの再現**: 異常系のテスト

### 4. 継続的改善
- **リファクタリング**: テストコードも保守対象
- **カバレッジ**: 重要な機能の網羅
- **ドキュメント**: テストの意図を明確に

## 🚨 トラブルシューティング

### よくある問題と解決方法

#### 1. テストが実行されない
```bash
# Node.jsのバージョン確認
node --version

# パスの確認
ls -la tests/unit/test-runner.js
```

#### 2. モックが動作しない
```javascript
// モックの初期化を確認
beforeEach(() => {
    mockObject = new MockClass();
});
```

#### 3. 非同期テストの失敗
```javascript
// async/awaitを使用
test('非同期処理のテスト', async () => {
    const result = await asyncFunction();
    expect(result).toBeTruthy();
});
```

## 📞 サポート

- **ドキュメント**: `SPEC.md` で仕様を確認
- **実践例**: `tests/examples/` で具体例を参照
- **テンプレート**: `tests/templates/` で雛形を利用

---

このガイドを参考に、効率的なテスト駆動・仕様書駆動開発を実践してください！
