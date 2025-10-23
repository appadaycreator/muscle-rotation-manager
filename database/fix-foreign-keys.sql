-- Supabaseデータベーススキーマ修正スクリプト
-- workout_sessionsとtraining_logsテーブル間の外部キー関係を確立

-- 1. 既存の外部キー制約を削除（存在する場合）
ALTER TABLE training_logs DROP CONSTRAINT IF EXISTS training_logs_workout_session_id_fkey;

-- 2. workout_session_idカラムが存在することを確認し、存在しない場合は追加
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'training_logs' 
        AND column_name = 'workout_session_id'
    ) THEN
        ALTER TABLE training_logs ADD COLUMN workout_session_id UUID;
    END IF;
END $$;

-- 3. 外部キー制約を追加
ALTER TABLE training_logs 
ADD CONSTRAINT training_logs_workout_session_id_fkey 
FOREIGN KEY (workout_session_id) 
REFERENCES workout_sessions(id) 
ON DELETE CASCADE;

-- 4. インデックスを追加（パフォーマンス向上）
CREATE INDEX IF NOT EXISTS idx_training_logs_workout_session_id 
ON training_logs(workout_session_id);

-- 5. RLS（Row Level Security）ポリシーを確認・更新
-- training_logsテーブルのRLSポリシー
DROP POLICY IF EXISTS "Users can view their own training logs" ON training_logs;
DROP POLICY IF EXISTS "Users can insert their own training logs" ON training_logs;
DROP POLICY IF EXISTS "Users can update their own training logs" ON training_logs;
DROP POLICY IF EXISTS "Users can delete their own training logs" ON training_logs;

-- 新しいRLSポリシーを作成
CREATE POLICY "Users can view their own training logs" ON training_logs
    FOR SELECT USING (
        workout_session_id IN (
            SELECT id FROM workout_sessions WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert their own training logs" ON training_logs
    FOR INSERT WITH CHECK (
        workout_session_id IN (
            SELECT id FROM workout_sessions WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own training logs" ON training_logs
    FOR UPDATE USING (
        workout_session_id IN (
            SELECT id FROM workout_sessions WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete their own training logs" ON training_logs
    FOR DELETE USING (
        workout_session_id IN (
            SELECT id FROM workout_sessions WHERE user_id = auth.uid()
        )
    );

-- 6. 既存データの整合性を確認
-- workout_session_idがNULLのレコードがある場合は警告
DO $$
DECLARE
    null_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO null_count 
    FROM training_logs 
    WHERE workout_session_id IS NULL;
    
    IF null_count > 0 THEN
        RAISE WARNING 'Found % training_logs records with NULL workout_session_id', null_count;
    END IF;
END $$;

-- 7. テーブル構造の確認クエリ
SELECT 
    t.table_name,
    c.column_name,
    c.data_type,
    c.is_nullable,
    c.column_default
FROM information_schema.tables t
JOIN information_schema.columns c ON t.table_name = c.table_name
WHERE t.table_name IN ('workout_sessions', 'training_logs')
ORDER BY t.table_name, c.ordinal_position;
