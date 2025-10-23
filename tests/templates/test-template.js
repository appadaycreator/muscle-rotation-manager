/**
 * テストテンプレート - 新しいテストファイル作成時の雛形
 * 
 * 使用方法:
 * 1. このファイルをコピーして新しいテストファイルを作成
 * 2. [FEATURE_NAME]を実際の機能名に置換
 * 3. テストケースを実装
 */

// テストランナーの読み込み（ブラウザ環境では不要）
if (typeof require !== 'undefined') {
    const { test, describe, expect, beforeEach, afterEach, mock } = require('../unit/test-runner.js');
}

describe('[FEATURE_NAME]機能テスト', () => {
    let mockData;
    let testTarget;

    beforeEach(() => {
        // 各テスト前の初期化処理
        mockData = {
            // テスト用のモックデータを定義
        };
        
        testTarget = {
            // テスト対象のオブジェクトを初期化
        };
    });

    afterEach(() => {
        // 各テスト後のクリーンアップ処理
        mockData = null;
        testTarget = null;
    });

    test('基本機能が正常に動作する', () => {
        // Arrange（準備）
        const input = 'test-input';
        const expected = 'expected-output';
        
        // Act（実行）
        const result = testTarget.basicFunction(input);
        
        // Assert（検証）
        expect(result).toBe(expected);
    });

    test('無効な入力に対してエラーが発生する', () => {
        // Arrange
        const invalidInput = null;
        
        // Act & Assert
        expect(() => {
            testTarget.basicFunction(invalidInput);
        }).toThrow('無効な入力です');
    });

    test('境界値での動作が正しい', () => {
        // 境界値テストの例
        const boundaryValues = [0, 1, -1, 100, 101];
        
        boundaryValues.forEach(value => {
            const result = testTarget.boundaryFunction(value);
            expect(result).toBeTruthy();
        });
    });

    test('非同期処理が正常に完了する', async () => {
        // 非同期テストの例
        const result = await testTarget.asyncFunction();
        expect(result).toBeTruthy();
    });

    test('モック関数が正しく呼び出される', () => {
        // モックテストの例
        const mockCallback = mock();
        testTarget.functionWithCallback(mockCallback);
        
        expect(mockCallback.callCount).toBe(1);
    });
});

describe('[FEATURE_NAME]統合テスト', () => {
    test('他の機能との連携が正常に動作する', () => {
        // 統合テストの例
        // 複数の機能を組み合わせたテストケース
    });
});

describe('[FEATURE_NAME]仕様書準拠テスト', () => {
    test('【仕様】SPEC.mdの要件を満たしている', () => {
        // 仕様書に記載された要件に基づくテスト
        // 例: 「ユーザーは6つの筋肉部位から選択できる」
    });
});

// ブラウザ環境でのテスト実行
if (typeof window !== 'undefined') {
    console.log('🧪 [FEATURE_NAME]のテストを実行します...');
}

/*
テスト作成のベストプラクティス:

1. AAA パターンを使用
   - Arrange: テストデータの準備
   - Act: テスト対象の実行
   - Assert: 結果の検証

2. テスト名は具体的に
   - 「何をテストするか」が明確
   - 「期待する結果」を含める

3. 1テスト1検証
   - 1つのテストで1つの機能のみ検証
   - 複数の検証が必要な場合は分割

4. 独立性を保つ
   - テスト間で依存関係を作らない
   - beforeEach/afterEachで初期化・クリーンアップ

5. エッジケースを含める
   - 正常系だけでなく異常系もテスト
   - 境界値テストを実施

6. 可読性を重視
   - テストコードも保守対象
   - コメントで意図を明確に

7. モックを適切に使用
   - 外部依存を排除
   - テストの高速化と安定化
*/
