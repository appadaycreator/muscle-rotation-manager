-- 緊急セキュリティ修正 - 最重要項目のみ
-- Supabase SQL Editorで実行してください

-- ============================================================================
-- 1. RLS (Row Level Security) の有効化
-- ============================================================================

-- パブリックテーブルのRLS有効化
ALTER TABLE IF EXISTS public.muscle_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.template_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.workouts ENABLE ROW LEVEL SECURITY;

-- muscle_groups テーブル用ポリシー（読み取り専用）
DROP POLICY IF EXISTS "Allow public read access to muscle_groups" ON public.muscle_groups;
CREATE POLICY "Allow public read access to muscle_groups" ON public.muscle_groups
    FOR SELECT USING (true);

-- exercises テーブル用ポリシー（読み取り専用）
DROP POLICY IF EXISTS "Allow public read access to exercises" ON public.exercises;
CREATE POLICY "Allow public read access to exercises" ON public.exercises
    FOR SELECT USING (true);

-- template_exercises テーブル用ポリシー（読み取り専用）
DROP POLICY IF EXISTS "Allow public read access to template_exercises" ON public.template_exercises;
CREATE POLICY "Allow public read access to template_exercises" ON public.template_exercises
    FOR SELECT USING (true);

-- workouts テーブル用ポリシー（ユーザー自身のデータのみ）
DROP POLICY IF EXISTS "Users can view own workouts" ON public.workouts;
DROP POLICY IF EXISTS "Users can insert own workouts" ON public.workouts;
DROP POLICY IF EXISTS "Users can update own workouts" ON public.workouts;
DROP POLICY IF EXISTS "Users can delete own workouts" ON public.workouts;

CREATE POLICY "Users can view own workouts" ON public.workouts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own workouts" ON public.workouts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own workouts" ON public.workouts
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own workouts" ON public.workouts
    FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- 2. 関数のセキュリティ修正（search_path固定）
-- ============================================================================

-- calculate_recovery_percentage 関数の修正
CREATE OR REPLACE FUNCTION public.calculate_recovery_percentage(
    last_workout_date DATE,
    recovery_hours INTEGER
) RETURNS INTEGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    hours_since_workout INTEGER;
    recovery_percentage INTEGER;
BEGIN
    hours_since_workout := EXTRACT(EPOCH FROM (NOW() - (last_workout_date + TIME '00:00:00'))) / 3600;
    recovery_percentage := LEAST(100, (hours_since_workout * 100 / recovery_hours)::INTEGER);
    RETURN recovery_percentage;
END;
$$;

-- update_updated_at_column 関数の修正
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- ============================================================================
-- 3. 完了メッセージ
-- ============================================================================

-- 修正完了の確認
SELECT 'セキュリティ修正が完了しました' as status;
