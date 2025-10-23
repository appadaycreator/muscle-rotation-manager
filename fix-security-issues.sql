-- Supabaseセキュリティ問題修正SQL
-- ダッシュボードで検出された43の問題を修正します

-- ============================================================================
-- 1. RLS (Row Level Security) の有効化
-- ============================================================================

-- パブリックテーブルのRLS有効化
ALTER TABLE public.muscle_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;

-- muscle_groups テーブル用ポリシー（読み取り専用）
CREATE POLICY "Allow public read access to muscle_groups" ON public.muscle_groups
    FOR SELECT USING (true);

-- exercises テーブル用ポリシー（読み取り専用）
CREATE POLICY "Allow public read access to exercises" ON public.exercises
    FOR SELECT USING (true);

-- template_exercises テーブル用ポリシー（読み取り専用）
CREATE POLICY "Allow public read access to template_exercises" ON public.template_exercises
    FOR SELECT USING (true);

-- workouts テーブル用ポリシー（ユーザー自身のデータのみ）
CREATE POLICY "Users can view own workouts" ON public.workouts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own workouts" ON public.workouts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own workouts" ON public.workouts
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own workouts" ON public.workouts
    FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- 2. ビューのセキュリティ修正
-- ============================================================================

-- user_workout_summary ビューを安全に再作成
DROP VIEW IF EXISTS public.user_workout_summary;

CREATE VIEW public.user_workout_summary 
SECURITY INVOKER  -- SECURITY DEFINER から SECURITY INVOKER に変更
AS
SELECT 
    u.id as user_id,
    COUNT(DISTINCT tl.workout_date) as total_workout_days,
    COUNT(tl.id) as total_exercises_logged,
    AVG(ws.satisfaction_rating) as avg_satisfaction,
    MAX(tl.workout_date) as last_workout_date,
    ARRAY_AGG(DISTINCT mg.name) as trained_muscle_groups
FROM auth.users u
LEFT JOIN training_logs tl ON u.id = tl.user_id
LEFT JOIN workout_sessions ws ON u.id = ws.user_id
LEFT JOIN muscle_groups mg ON tl.muscle_group_id = mg.id
WHERE u.id = auth.uid()  -- 現在のユーザーのデータのみ
GROUP BY u.id;

-- muscle_group_frequency ビューを安全に再作成
DROP VIEW IF EXISTS public.muscle_group_frequency;

CREATE VIEW public.muscle_group_frequency
SECURITY INVOKER  -- SECURITY DEFINER から SECURITY INVOKER に変更
AS
SELECT 
    tl.user_id,
    mg.name as muscle_group,
    COUNT(*) as training_count,
    MAX(tl.workout_date) as last_trained,
    AVG(tl.difficulty_rating) as avg_difficulty
FROM training_logs tl
JOIN muscle_groups mg ON tl.muscle_group_id = mg.id
WHERE tl.user_id = auth.uid()  -- 現在のユーザーのデータのみ
GROUP BY tl.user_id, mg.id, mg.name;

-- ============================================================================
-- 3. 関数のセキュリティ修正
-- ============================================================================

-- calculate_recovery_percentage 関数の修正
CREATE OR REPLACE FUNCTION public.calculate_recovery_percentage(
    last_workout_date DATE,
    recovery_hours INTEGER
) RETURNS INTEGER 
LANGUAGE plpgsql
SECURITY DEFINER  -- 必要に応じてSECURITY DEFINERを維持
SET search_path = public, pg_temp  -- search_pathを固定
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
SET search_path = public, pg_temp  -- search_pathを固定
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- get_workout_recommendations 関数の修正
CREATE OR REPLACE FUNCTION public.get_workout_recommendations(user_uuid UUID)
RETURNS TABLE (
    muscle_group_id UUID,
    muscle_group_name VARCHAR,
    recovery_percentage INTEGER,
    days_since_last_workout INTEGER,
    priority_score INTEGER
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp  -- search_pathを固定
AS $$
BEGIN
    -- ユーザー認証チェック
    IF user_uuid != auth.uid() THEN
        RAISE EXCEPTION 'Access denied: You can only get recommendations for yourself';
    END IF;
    
    RETURN QUERY
    SELECT 
        mg.id,
        mg.name,
        COALESCE(calculate_recovery_percentage(mr.last_workout_date, mg.recovery_hours), 100) as recovery_pct,
        COALESCE(CURRENT_DATE - mr.last_workout_date, 999) as days_since,
        CASE 
            WHEN mr.last_workout_date IS NULL THEN 10
            WHEN CURRENT_DATE - mr.last_workout_date > 7 THEN 9
            WHEN calculate_recovery_percentage(mr.last_workout_date, mg.recovery_hours) >= 100 THEN 8
            WHEN calculate_recovery_percentage(mr.last_workout_date, mg.recovery_hours) >= 80 THEN 6
            ELSE 3
        END as priority
    FROM muscle_groups mg
    LEFT JOIN muscle_recovery mr ON mg.id = mr.muscle_group_id AND mr.user_id = user_uuid
    WHERE mg.is_active = true
    ORDER BY priority DESC, days_since DESC;
END;
$$;

-- update_muscle_recovery_after_workout 関数の修正
CREATE OR REPLACE FUNCTION public.update_muscle_recovery_after_workout()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp  -- search_pathを固定
AS $$
BEGIN
    INSERT INTO muscle_recovery (user_id, muscle_group_id, last_workout_date, recovery_percentage, is_fully_recovered)
    VALUES (NEW.user_id, NEW.muscle_group_id, NEW.workout_date, 0, false)
    ON CONFLICT (user_id, muscle_group_id)
    DO UPDATE SET
        last_workout_date = NEW.workout_date,
        recovery_percentage = 0,
        is_fully_recovered = false,
        updated_at = NOW();
    RETURN NEW;
END;
$$;

-- ============================================================================
-- 4. 追加のセキュリティ設定
-- ============================================================================

-- 認証されていないユーザーのアクセス制限
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM anon;

-- 認証済みユーザーに必要な権限のみ付与
GRANT SELECT ON public.muscle_groups TO authenticated;
GRANT SELECT ON public.exercises TO authenticated;
GRANT SELECT ON public.template_exercises TO authenticated;

-- ユーザー固有テーブルへの適切な権限設定
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workouts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.training_logs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workout_sessions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.muscle_recovery TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_profiles TO authenticated;

-- ============================================================================
-- 5. コメント追加（セキュリティ修正の記録）
-- ============================================================================

COMMENT ON TABLE public.muscle_groups IS 'Master table for muscle groups - Public read access with RLS enabled';
COMMENT ON TABLE public.exercises IS 'Exercise database - Public read access with RLS enabled';
COMMENT ON TABLE public.workouts IS 'User workouts - User-specific access with RLS enabled';
COMMENT ON VIEW public.user_workout_summary IS 'User workout summary - SECURITY INVOKER with user filtering';
COMMENT ON VIEW public.muscle_group_frequency IS 'Muscle group frequency - SECURITY INVOKER with user filtering';

-- セキュリティ修正完了のログ
INSERT INTO public.system_logs (log_type, message, created_at) 
VALUES ('security', 'RLS policies and function security updated', NOW())
ON CONFLICT DO NOTHING;
