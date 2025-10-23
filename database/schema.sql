-- Muscle Rotation Manager Database Schema
-- Supabase PostgreSQL Database Design
-- Version: 1.0.0
-- Created: 2025-07-12

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. MUSCLE GROUPS TABLE
-- ============================================================================
CREATE TABLE muscle_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL UNIQUE,
    name_en VARCHAR(50) NOT NULL,
    name_ja VARCHAR(50) NOT NULL,
    description TEXT,
    recovery_hours INTEGER DEFAULT 72 CHECK (recovery_hours > 0),
    muscle_size VARCHAR(20) DEFAULT 'large' CHECK (muscle_size IN ('large', 'small')),
    color_code VARCHAR(7) DEFAULT '#3B82F6', -- Hex color for UI
    icon_name VARCHAR(50) DEFAULT 'muscle',
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default muscle groups
INSERT INTO muscle_groups (name, name_en, name_ja, description, recovery_hours, muscle_size, color_code, icon_name, display_order) VALUES
('chest', 'Chest', '胸', 'Pectoral muscles including upper, middle, and lower chest', 72, 'large', '#EF4444', 'chest', 1),
('back', 'Back', '背中', 'Latissimus dorsi, rhomboids, middle and lower trapezius', 72, 'large', '#10B981', 'back', 2),
('shoulders', 'Shoulders', '肩', 'Deltoids (anterior, medial, posterior)', 48, 'small', '#F59E0B', 'shoulders', 3),
('arms', 'Arms', '腕', 'Biceps, triceps, and forearms', 48, 'small', '#8B5CF6', 'arms', 4),
('legs', 'Legs', '脚', 'Quadriceps, hamstrings, glutes, and calves', 72, 'large', '#06B6D4', 'legs', 5),
('abs', 'Abs', '腹', 'Abdominal muscles and core', 48, 'small', '#F97316', 'abs', 6);

-- ============================================================================
-- 2. EXERCISES TABLE
-- ============================================================================
CREATE TABLE exercises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    name_en VARCHAR(100) NOT NULL,
    name_ja VARCHAR(100) NOT NULL,
    muscle_group_id UUID REFERENCES muscle_groups(id) ON DELETE CASCADE,
    secondary_muscles UUID[] DEFAULT '{}', -- Array of muscle_group IDs
    equipment VARCHAR(50) DEFAULT 'bodyweight',
    difficulty_level INTEGER DEFAULT 1 CHECK (difficulty_level BETWEEN 1 AND 5),
    exercise_type VARCHAR(30) DEFAULT 'strength' CHECK (exercise_type IN ('strength', 'cardio', 'flexibility', 'balance')),
    description TEXT,
    instructions TEXT,
    tips TEXT,
    common_mistakes TEXT,
    video_url TEXT,
    image_url TEXT,
    calories_per_minute DECIMAL(4,2) DEFAULT 5.0,
    is_compound BOOLEAN DEFAULT false,
    is_bodyweight BOOLEAN DEFAULT true,
    is_beginner_friendly BOOLEAN DEFAULT true,
    tags TEXT[] DEFAULT '{}',
    -- 新機能: カスタムエクササイズ対応
    is_custom BOOLEAN DEFAULT false,
    created_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    is_public BOOLEAN DEFAULT false, -- カスタムエクササイズの公開設定
    -- 新機能: 検索・フィルタリング強化
    search_keywords TEXT, -- 検索用キーワード
    muscle_focus VARCHAR(20) DEFAULT 'primary' CHECK (muscle_focus IN ('primary', 'secondary', 'stabilizer')),
    -- 新機能: 画像・動画管理
    thumbnail_url TEXT,
    video_duration INTEGER, -- 動画の長さ（秒）
    has_animation BOOLEAN DEFAULT false,
    -- 新機能: 評価・統計
    average_rating DECIMAL(3,2) DEFAULT 0.0 CHECK (average_rating BETWEEN 0 AND 5),
    rating_count INTEGER DEFAULT 0,
    usage_count INTEGER DEFAULT 0,
    -- 新機能: アクセシビリティ
    accessibility_notes TEXT,
    modifications TEXT, -- 修正版・代替版の説明
    -- メタデータ
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX idx_exercises_muscle_group ON exercises(muscle_group_id);
CREATE INDEX idx_exercises_difficulty ON exercises(difficulty_level);
CREATE INDEX idx_exercises_equipment ON exercises(equipment);
-- 新しいインデックス
CREATE INDEX idx_exercises_custom ON exercises(is_custom);
CREATE INDEX idx_exercises_public ON exercises(is_public);
CREATE INDEX idx_exercises_created_by ON exercises(created_by_user_id);
CREATE INDEX idx_exercises_search ON exercises USING gin(to_tsvector('japanese', coalesce(search_keywords, '') || ' ' || coalesce(name_ja, '') || ' ' || coalesce(description, '')));
CREATE INDEX idx_exercises_rating ON exercises(average_rating DESC);
CREATE INDEX idx_exercises_usage ON exercises(usage_count DESC);

-- ============================================================================
-- 3. USER PROFILES TABLE
-- ============================================================================
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username VARCHAR(50) UNIQUE,
    display_name VARCHAR(100),
    email VARCHAR(255),
    avatar_url TEXT,
    bio TEXT,
    
    -- 基本情報
    weight DECIMAL(5,2),
    height DECIMAL(5,2),
    age INTEGER CHECK (age > 0 AND age < 150),
    gender VARCHAR(10) CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
    
    -- 体力レベル設定（詳細化）
    fitness_level VARCHAR(20) DEFAULT 'beginner' CHECK (fitness_level IN ('beginner', 'intermediate', 'advanced')),
    experience_months INTEGER DEFAULT 0 CHECK (experience_months >= 0),
    current_strength_level INTEGER DEFAULT 1 CHECK (current_strength_level BETWEEN 1 AND 10),
    
    -- トレーニング目標設定（詳細化）
    primary_goal VARCHAR(30) DEFAULT 'muscle_gain' CHECK (primary_goal IN ('strength', 'muscle_gain', 'endurance', 'weight_loss', 'general_fitness')),
    secondary_goals TEXT[] DEFAULT '{}',
    target_body_fat_percentage DECIMAL(4,1),
    target_weight DECIMAL(5,2),
    
    -- 週間トレーニング頻度設定（詳細化）
    workout_frequency INTEGER DEFAULT 3 CHECK (workout_frequency BETWEEN 1 AND 7),
    preferred_workout_days INTEGER[] DEFAULT '{1,3,5}', -- 1=Monday, 7=Sunday
    preferred_workout_time TIME DEFAULT '18:00:00',
    preferred_workout_duration INTEGER DEFAULT 60, -- minutes
    max_workout_duration INTEGER DEFAULT 90, -- minutes
    
    -- 回復時間のカスタマイズ（詳細化）
    recovery_preference VARCHAR(20) DEFAULT 'standard' CHECK (recovery_preference IN ('fast', 'standard', 'slow')),
    custom_recovery_multiplier DECIMAL(3,2) DEFAULT 1.0 CHECK (custom_recovery_multiplier BETWEEN 0.5 AND 2.0),
    sleep_hours_per_night DECIMAL(3,1) DEFAULT 7.0 CHECK (sleep_hours_per_night BETWEEN 4.0 AND 12.0),
    stress_level INTEGER DEFAULT 5 CHECK (stress_level BETWEEN 1 AND 10),
    
    -- 個人の制約・制限
    injuries TEXT[] DEFAULT '{}',
    equipment_available TEXT[] DEFAULT '{}',
    time_constraints TEXT,
    physical_limitations TEXT,
    
    -- 栄養・ライフスタイル
    diet_type VARCHAR(20) DEFAULT 'balanced' CHECK (diet_type IN ('balanced', 'high_protein', 'low_carb', 'vegetarian', 'vegan')),
    supplement_usage BOOLEAN DEFAULT false,
    activity_level VARCHAR(20) DEFAULT 'moderate' CHECK (activity_level IN ('sedentary', 'light', 'moderate', 'active', 'very_active')),
    
    -- 通知・UI設定
    notifications_enabled BOOLEAN DEFAULT true,
    email_notifications BOOLEAN DEFAULT false,
    push_notifications BOOLEAN DEFAULT true,
    reminder_enabled BOOLEAN DEFAULT true,
    reminder_time TIME DEFAULT '18:00:00',
    
    -- 表示設定
    preferred_language VARCHAR(5) DEFAULT 'ja' CHECK (preferred_language IN ('ja', 'en')),
    timezone VARCHAR(50) DEFAULT 'Asia/Tokyo',
    theme_preference VARCHAR(10) DEFAULT 'auto' CHECK (theme_preference IN ('light', 'dark', 'auto')),
    font_size VARCHAR(10) DEFAULT 'md' CHECK (font_size IN ('xs', 'sm', 'md', 'lg', 'xl')),
    
    -- 単位設定
    weight_unit VARCHAR(5) DEFAULT 'kg' CHECK (weight_unit IN ('kg', 'lbs')),
    distance_unit VARCHAR(5) DEFAULT 'km' CHECK (distance_unit IN ('km', 'mi')),
    
    -- オンボーディング状態
    onboarding_completed BOOLEAN DEFAULT false,
    onboarding_step INTEGER DEFAULT 0,
    onboarding_completed_at TIMESTAMP WITH TIME ZONE,
    
    -- プライバシー設定
    data_sharing_enabled BOOLEAN DEFAULT false,
    analytics_enabled BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 4. TRAINING LOGS TABLE
-- ============================================================================
CREATE TABLE training_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    muscle_group_id UUID REFERENCES muscle_groups(id) ON DELETE CASCADE,
    exercise_id UUID REFERENCES exercises(id) ON DELETE SET NULL,
    exercise_name VARCHAR(100) NOT NULL, -- Fallback if exercise is deleted
    workout_date DATE NOT NULL DEFAULT CURRENT_DATE,
    sets INTEGER DEFAULT 1 CHECK (sets > 0),
    reps INTEGER[] DEFAULT '{}', -- Array of reps per set
    weights DECIMAL(6,2)[] DEFAULT '{}', -- Array of weights per set
    rest_seconds INTEGER[] DEFAULT '{}', -- Rest time between sets
    duration_minutes INTEGER, -- Total exercise duration
    calories_burned DECIMAL(6,2),
    difficulty_rating INTEGER CHECK (difficulty_rating BETWEEN 1 AND 10),
    fatigue_level INTEGER CHECK (fatigue_level BETWEEN 1 AND 10),
    notes TEXT,
    is_personal_record BOOLEAN DEFAULT false,
    workout_session_id UUID, -- Group exercises in same workout
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_training_logs_user_date ON training_logs(user_id, workout_date DESC);
CREATE INDEX idx_training_logs_muscle_group ON training_logs(muscle_group_id);
CREATE INDEX idx_training_logs_session ON training_logs(workout_session_id);

-- ============================================================================
-- 5. WORKOUT SESSIONS TABLE
-- ============================================================================
CREATE TABLE workout_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    session_name VARCHAR(100),
    workout_date DATE NOT NULL DEFAULT CURRENT_DATE,
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    total_duration_minutes INTEGER,
    total_calories_burned DECIMAL(6,2),
    muscle_groups_trained UUID[] DEFAULT '{}',
    session_type VARCHAR(30) DEFAULT 'strength' CHECK (session_type IN ('strength', 'cardio', 'mixed', 'flexibility')),
    intensity_level INTEGER CHECK (intensity_level BETWEEN 1 AND 10),
    satisfaction_rating INTEGER CHECK (satisfaction_rating BETWEEN 1 AND 10),
    notes TEXT,
    is_completed BOOLEAN DEFAULT false,
    template_id UUID, -- Reference to workout template
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for user sessions
CREATE INDEX idx_workout_sessions_user_date ON workout_sessions(user_id, workout_date DESC);

-- ============================================================================
-- 6. WORKOUT TEMPLATES TABLE
-- ============================================================================
CREATE TABLE workout_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    template_name VARCHAR(100) NOT NULL,
    description TEXT,
    muscle_groups UUID[] NOT NULL DEFAULT '{}',
    estimated_duration_minutes INTEGER DEFAULT 60,
    difficulty_level INTEGER DEFAULT 1 CHECK (difficulty_level BETWEEN 1 AND 5),
    is_public BOOLEAN DEFAULT false,
    is_favorite BOOLEAN DEFAULT false,
    usage_count INTEGER DEFAULT 0,
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 7. TEMPLATE EXERCISES TABLE
-- ============================================================================
CREATE TABLE template_exercises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID REFERENCES workout_templates(id) ON DELETE CASCADE,
    exercise_id UUID REFERENCES exercises(id) ON DELETE CASCADE,
    exercise_order INTEGER NOT NULL,
    target_sets INTEGER DEFAULT 3,
    target_reps_min INTEGER DEFAULT 8,
    target_reps_max INTEGER DEFAULT 12,
    target_weight DECIMAL(6,2),
    rest_seconds INTEGER DEFAULT 60,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for template exercises
CREATE INDEX idx_template_exercises_template ON template_exercises(template_id, exercise_order);

-- ============================================================================
-- 8. MUSCLE RECOVERY TRACKING TABLE
-- ============================================================================
CREATE TABLE muscle_recovery (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    muscle_group_id UUID REFERENCES muscle_groups(id) ON DELETE CASCADE,
    last_workout_date DATE NOT NULL,
    recovery_percentage INTEGER DEFAULT 0 CHECK (recovery_percentage BETWEEN 0 AND 100),
    soreness_level INTEGER CHECK (soreness_level BETWEEN 0 AND 10),
    is_fully_recovered BOOLEAN DEFAULT false,
    estimated_recovery_date DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, muscle_group_id)
);

-- Create index for recovery tracking
CREATE INDEX idx_muscle_recovery_user ON muscle_recovery(user_id);

-- ============================================================================
-- 9. WORKOUT RECOMMENDATIONS TABLE
-- ============================================================================
CREATE TABLE workout_recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    recommended_date DATE NOT NULL DEFAULT CURRENT_DATE,
    muscle_groups_recommended UUID[] NOT NULL DEFAULT '{}',
    reasoning TEXT,
    priority_score INTEGER DEFAULT 1 CHECK (priority_score BETWEEN 1 AND 10),
    is_accepted BOOLEAN,
    is_completed BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days')
);

-- ============================================================================
-- 10. USER ACHIEVEMENTS TABLE
-- ============================================================================
CREATE TABLE user_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    achievement_type VARCHAR(50) NOT NULL,
    achievement_name VARCHAR(100) NOT NULL,
    description TEXT,
    icon_name VARCHAR(50),
    points INTEGER DEFAULT 0,
    unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_milestone BOOLEAN DEFAULT false,
    metadata JSONB DEFAULT '{}'
);

-- ============================================================================
-- 11. USER SETTINGS TABLE
-- ============================================================================
CREATE TABLE user_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    auto_rest_timer BOOLEAN DEFAULT true,
    default_rest_time INTEGER DEFAULT 60,
    weight_unit VARCHAR(5) DEFAULT 'kg' CHECK (weight_unit IN ('kg', 'lbs')),
    distance_unit VARCHAR(5) DEFAULT 'km' CHECK (distance_unit IN ('km', 'mi')),
    start_week_on VARCHAR(10) DEFAULT 'monday' CHECK (start_week_on IN ('sunday', 'monday')),
    reminder_time TIME DEFAULT '18:00:00',
    reminder_days INTEGER[] DEFAULT '{1,2,3,4,5}', -- 1=Monday, 7=Sunday
    backup_enabled BOOLEAN DEFAULT true,
    data_sync_enabled BOOLEAN DEFAULT true,
    analytics_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 12. OFFLINE SYNC QUEUE TABLE
-- ============================================================================
CREATE TABLE offline_sync_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    table_name VARCHAR(50) NOT NULL,
    record_id UUID NOT NULL,
    operation VARCHAR(10) NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
    data JSONB,
    sync_status VARCHAR(20) DEFAULT 'pending' CHECK (sync_status IN ('pending', 'synced', 'failed')),
    retry_count INTEGER DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    synced_at TIMESTAMP WITH TIME ZONE
);

-- ============================================================================
-- TRIGGERS FOR UPDATED_AT TIMESTAMPS
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to all tables with updated_at
CREATE TRIGGER update_muscle_groups_updated_at BEFORE UPDATE ON muscle_groups FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_exercises_updated_at BEFORE UPDATE ON exercises FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_training_logs_updated_at BEFORE UPDATE ON training_logs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_workout_sessions_updated_at BEFORE UPDATE ON workout_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_workout_templates_updated_at BEFORE UPDATE ON workout_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_muscle_recovery_updated_at BEFORE UPDATE ON muscle_recovery FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON user_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all user-specific tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE muscle_recovery ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE offline_sync_queue ENABLE ROW LEVEL SECURITY;

-- User Profiles Policies
CREATE POLICY "Users can view own profile" ON user_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON user_profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON user_profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Training Logs Policies
CREATE POLICY "Users can view own training logs" ON training_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own training logs" ON training_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own training logs" ON training_logs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own training logs" ON training_logs FOR DELETE USING (auth.uid() = user_id);

-- Workout Sessions Policies
CREATE POLICY "Users can view own workout sessions" ON workout_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own workout sessions" ON workout_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own workout sessions" ON workout_sessions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own workout sessions" ON workout_sessions FOR DELETE USING (auth.uid() = user_id);

-- Workout Templates Policies
CREATE POLICY "Users can view own templates and public templates" ON workout_templates FOR SELECT USING (auth.uid() = user_id OR is_public = true);
CREATE POLICY "Users can insert own templates" ON workout_templates FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own templates" ON workout_templates FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own templates" ON workout_templates FOR DELETE USING (auth.uid() = user_id);

-- Muscle Recovery Policies
CREATE POLICY "Users can view own muscle recovery" ON muscle_recovery FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own muscle recovery" ON muscle_recovery FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own muscle recovery" ON muscle_recovery FOR UPDATE USING (auth.uid() = user_id);

-- Workout Recommendations Policies
CREATE POLICY "Users can view own recommendations" ON workout_recommendations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own recommendations" ON workout_recommendations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own recommendations" ON workout_recommendations FOR UPDATE USING (auth.uid() = user_id);

-- User Achievements Policies
CREATE POLICY "Users can view own achievements" ON user_achievements FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own achievements" ON user_achievements FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User Settings Policies
CREATE POLICY "Users can view own settings" ON user_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own settings" ON user_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own settings" ON user_settings FOR UPDATE USING (auth.uid() = user_id);

-- Offline Sync Queue Policies
CREATE POLICY "Users can view own sync queue" ON offline_sync_queue FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own sync queue" ON offline_sync_queue FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own sync queue" ON offline_sync_queue FOR UPDATE USING (auth.uid() = user_id);

-- Enable RLS on exercises table for custom exercises
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;

-- Exercises Policies
CREATE POLICY "Everyone can view public exercises" ON exercises FOR SELECT USING (is_custom = false OR is_public = true);
CREATE POLICY "Users can view own custom exercises" ON exercises FOR SELECT USING (is_custom = true AND created_by_user_id = auth.uid());
CREATE POLICY "Users can insert own custom exercises" ON exercises FOR INSERT WITH CHECK (is_custom = true AND created_by_user_id = auth.uid());
CREATE POLICY "Users can update own custom exercises" ON exercises FOR UPDATE USING (is_custom = true AND created_by_user_id = auth.uid());
CREATE POLICY "Users can delete own custom exercises" ON exercises FOR DELETE USING (is_custom = true AND created_by_user_id = auth.uid());

-- Public tables (no RLS needed)
-- muscle_groups, template_exercises are public read-only

-- ============================================================================
-- FUNCTIONS FOR BUSINESS LOGIC
-- ============================================================================

-- Function to calculate muscle recovery percentage
CREATE OR REPLACE FUNCTION calculate_recovery_percentage(
    last_workout_date DATE,
    recovery_hours INTEGER
) RETURNS INTEGER AS $$
DECLARE
    hours_since_workout INTEGER;
    recovery_percentage INTEGER;
BEGIN
    hours_since_workout := EXTRACT(EPOCH FROM (NOW() - (last_workout_date + TIME '00:00:00'))) / 3600;
    recovery_percentage := LEAST(100, (hours_since_workout * 100 / recovery_hours)::INTEGER);
    RETURN recovery_percentage;
END;
$$ LANGUAGE plpgsql;

-- Function to update muscle recovery after workout
CREATE OR REPLACE FUNCTION update_muscle_recovery_after_workout()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

-- Trigger to update recovery after training log insert
CREATE TRIGGER update_recovery_after_training
    AFTER INSERT ON training_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_muscle_recovery_after_workout();

-- Function to get workout recommendations
CREATE OR REPLACE FUNCTION get_workout_recommendations(user_uuid UUID)
RETURNS TABLE (
    muscle_group_id UUID,
    muscle_group_name VARCHAR,
    recovery_percentage INTEGER,
    days_since_last_workout INTEGER,
    priority_score INTEGER
) AS $$
BEGIN
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
$$ LANGUAGE plpgsql;

-- ============================================================================
-- SAMPLE DATA FOR EXERCISES
-- ============================================================================

-- Get muscle group IDs for reference
DO $$
DECLARE
    chest_id UUID;
    back_id UUID;
    shoulders_id UUID;
    arms_id UUID;
    legs_id UUID;
    abs_id UUID;
BEGIN
    SELECT id INTO chest_id FROM muscle_groups WHERE name = 'chest';
    SELECT id INTO back_id FROM muscle_groups WHERE name = 'back';
    SELECT id INTO shoulders_id FROM muscle_groups WHERE name = 'shoulders';
    SELECT id INTO arms_id FROM muscle_groups WHERE name = 'arms';
    SELECT id INTO legs_id FROM muscle_groups WHERE name = 'legs';
    SELECT id INTO abs_id FROM muscle_groups WHERE name = 'abs';

    -- Chest exercises (12種類)
    INSERT INTO exercises (name, name_en, name_ja, muscle_group_id, equipment, difficulty_level, is_compound, is_bodyweight, description, instructions, tips, search_keywords) VALUES
    ('Push-ups', 'Push-ups', 'プッシュアップ', chest_id, 'bodyweight', 1, true, true, 'Classic bodyweight chest exercise', '手を肩幅に開き、体を一直線に保ちながら上下運動', '体幹を意識して、お尻が上がらないよう注意', 'プッシュアップ 腕立て伏せ 胸筋 自重'),
    ('Incline Push-ups', 'Incline Push-ups', 'インクラインプッシュアップ', chest_id, 'bodyweight', 1, true, true, 'Easier variation using elevation', '台や階段を使って手を高い位置に置く', '初心者向け。角度が急なほど負荷が軽くなる', 'インクライン 初心者 台 階段'),
    ('Diamond Push-ups', 'Diamond Push-ups', 'ダイヤモンドプッシュアップ', chest_id, 'bodyweight', 3, true, true, 'Targets triceps and inner chest', '両手でダイヤモンド形を作り、胸の中央で行う', '上腕三頭筋により効果的。手首に注意', 'ダイヤモンド 三頭筋 内側胸筋'),
    ('Wide-grip Push-ups', 'Wide-grip Push-ups', 'ワイドプッシュアップ', chest_id, 'bodyweight', 2, true, true, 'Emphasizes outer chest', '手幅を肩幅より広く取って行う', '胸の外側により効果的。肩への負担に注意', 'ワイド 外側胸筋 肩幅'),
    ('Decline Push-ups', 'Decline Push-ups', 'デクラインプッシュアップ', chest_id, 'bodyweight', 3, true, true, 'Feet elevated variation', '足を台に乗せて行う上級者向け', '上部胸筋に効果的。バランスに注意', 'デクライン 上部胸筋 台 上級者'),
    ('Archer Push-ups', 'Archer Push-ups', 'アーチャープッシュアップ', chest_id, 'bodyweight', 4, true, true, 'Unilateral chest exercise', '片側に重心を移しながら行う', '片腕プッシュアップへの準備運動', 'アーチャー 片側 不均等'),
    ('Hindu Push-ups', 'Hindu Push-ups', 'ヒンドゥープッシュアップ', chest_id, 'bodyweight', 3, true, true, 'Dynamic flowing movement', '流れるような動作で全身を使う', '肩の柔軟性も向上。動作をゆっくり', 'ヒンドゥー 流動的 全身'),
    ('Pike Push-ups', 'Pike Push-ups', 'パイクプッシュアップ', chest_id, 'bodyweight', 3, true, true, 'Targets upper chest and shoulders', 'お尻を高く上げた逆V字で行う', '肩の筋肉も鍛えられる。頭部に注意', 'パイク 上部胸筋 肩 逆V字'),
    ('Single-arm Push-ups', 'Single-arm Push-ups', '片腕プッシュアップ', chest_id, 'bodyweight', 5, true, true, 'Advanced unilateral exercise', '片腕のみで体重を支える上級技', '十分な基礎筋力が必要。段階的に練習', '片腕 上級者 高難度'),
    ('Clap Push-ups', 'Clap Push-ups', 'クラッププッシュアップ', chest_id, 'bodyweight', 4, true, true, 'Explosive power exercise', '爆発的に押し上げて手を叩く', 'パワー向上に効果的。着地に注意', 'クラップ 爆発力 パワー'),
    ('Staggered Push-ups', 'Staggered Push-ups', 'スタッガードプッシュアップ', chest_id, 'bodyweight', 2, true, true, 'Asymmetric hand position', '手の位置を前後にずらして行う', '左右交互に行い、バランスよく鍛える', 'スタッガード 非対称 前後'),
    ('T Push-ups', 'T Push-ups', 'Tプッシュアップ', chest_id, 'bodyweight', 3, true, true, 'Combines push-up with rotation', 'プッシュアップ後にT字に体を回転', '体幹の回転力も鍛えられる', 'T字 回転 体幹');

    -- Back exercises (12種類)
    INSERT INTO exercises (name, name_en, name_ja, muscle_group_id, equipment, difficulty_level, is_compound, is_bodyweight, description, instructions, tips, search_keywords) VALUES
    ('Pull-ups', 'Pull-ups', 'プルアップ', back_id, 'pull-up bar', 4, true, true, 'Ultimate back and bicep exercise', '順手でバーを握り、胸をバーに近づける', '肩甲骨を寄せることを意識', 'プルアップ 懸垂 背筋 順手'),
    ('Chin-ups', 'Chin-ups', 'チンアップ', back_id, 'pull-up bar', 3, true, true, 'Underhand grip variation', '逆手でバーを握り、上腕二頭筋も使う', 'プルアップより少し易しい', 'チンアップ 逆手 二頭筋'),
    ('Inverted Rows', 'Inverted Rows', 'インバーテッドロウ', back_id, 'bodyweight', 2, true, true, 'Horizontal pulling exercise', '体を斜めにして水平に引く動作', '角度で負荷調整可能', 'インバーテッドロウ 水平 斜め'),
    ('Superman', 'Superman', 'スーパーマン', back_id, 'bodyweight', 1, false, true, 'Lower back strengthening', 'うつ伏せで手足を同時に上げる', '腰を反りすぎないよう注意', 'スーパーマン 腰 脊柱起立筋'),
    ('Reverse Snow Angels', 'Reverse Snow Angels', 'リバーススノーエンジェル', back_id, 'bodyweight', 1, false, true, 'Upper back activation', 'うつ伏せで腕を雪だるま作りの動作', '肩甲骨周りの筋肉を活性化', 'リバース スノーエンジェル 肩甲骨'),
    ('Single-arm Rows', 'Single-arm Rows', '片腕ロウ', back_id, 'dumbbell', 2, false, false, 'Unilateral back exercise', 'ダンベルを片手で引く動作', '体幹の安定性も重要', '片腕 ロウ ダンベル'),
    ('Bent-over Rows', 'Bent-over Rows', 'ベントオーバーロウ', back_id, 'barbell', 3, true, false, 'Compound back exercise', '前傾姿勢でバーベルを引く', '腰の角度を保持することが重要', 'ベントオーバー バーベル 前傾'),
    ('Lat Pulldowns', 'Lat Pulldowns', 'ラットプルダウン', back_id, 'cable machine', 2, true, false, 'Machine-based lat exercise', 'ケーブルマシンで上から引く動作', '広背筋を意識して引く', 'ラット プルダウン マシン'),
    ('Deadlifts', 'Deadlifts', 'デッドリフト', back_id, 'barbell', 4, true, false, 'King of all exercises', '床からバーベルを持ち上げる', '正しいフォームが最重要', 'デッドリフト 床引き 全身'),
    ('Face Pulls', 'Face Pulls', 'フェイスプル', back_id, 'cable machine', 2, false, false, 'Rear delt and upper back', 'ケーブルを顔に向かって引く', '後部三角筋と上部背筋に効果的', 'フェイスプル 後部三角筋 ケーブル'),
    ('Shrugs', 'Shrugs', 'シュラッグ', back_id, 'dumbbell', 1, false, false, 'Trapezius exercise', '肩をすくめる動作', '僧帽筋上部を集中的に鍛える', 'シュラッグ 僧帽筋 肩すくめ'),
    ('Good Mornings', 'Good Mornings', 'グッドモーニング', back_id, 'barbell', 3, true, false, 'Hip hinge movement', 'バーベルを担いで前傾する', '腰部と臀筋に効果的', 'グッドモーニング 前傾 腰部');

    -- Shoulders exercises (12種類)
    INSERT INTO exercises (name, name_en, name_ja, muscle_group_id, equipment, difficulty_level, is_compound, is_bodyweight, description, instructions, tips, search_keywords) VALUES
    ('Shoulder Press', 'Shoulder Press', 'ショルダープレス', shoulders_id, 'dumbbell', 2, true, false, 'Basic shoulder exercise', 'ダンベルを頭上に押し上げる', '肩甲骨を安定させて行う', 'ショルダープレス 肩 頭上'),
    ('Lateral Raises', 'Lateral Raises', 'サイドレイズ', shoulders_id, 'dumbbell', 1, false, false, 'Side deltoid isolation', '腕を横に上げる動作', '肩の高さまで上げる', 'サイドレイズ 横 三角筋中部'),
    ('Front Raises', 'Front Raises', 'フロントレイズ', shoulders_id, 'dumbbell', 1, false, false, 'Front deltoid isolation', '腕を前に上げる動作', '前部三角筋を集中的に', 'フロントレイズ 前 三角筋前部'),
    ('Rear Delt Flyes', 'Rear Delt Flyes', 'リアデルトフライ', shoulders_id, 'dumbbell', 2, false, false, 'Rear deltoid isolation', '後ろに腕を開く動作', '後部三角筋を意識', 'リアデルト 後部 フライ'),
    ('Pike Push-ups', 'Pike Push-ups', 'パイクプッシュアップ', shoulders_id, 'bodyweight', 3, true, true, 'Bodyweight shoulder exercise', 'お尻を高く上げて行うプッシュアップ', '肩の筋肉を主に使う', 'パイク 自重 肩'),
    ('Handstand Push-ups', 'Handstand Push-ups', '逆立ちプッシュアップ', shoulders_id, 'bodyweight', 5, true, true, 'Advanced shoulder exercise', '壁に足をつけて逆立ちで行う', '上級者向け。段階的に練習', '逆立ち 上級者 壁'),
    ('Arnold Press', 'Arnold Press', 'アーノルドプレス', shoulders_id, 'dumbbell', 3, true, false, 'Rotating shoulder press', '回転を加えたショルダープレス', '三角筋全体に効果的', 'アーノルド 回転 全体'),
    ('Upright Rows', 'Upright Rows', 'アップライトロウ', shoulders_id, 'barbell', 2, true, false, 'Vertical pulling exercise', 'バーベルを縦に引き上げる', '肩と僧帽筋に効果', 'アップライト 縦引き 僧帽筋'),
    ('Military Press', 'Military Press', 'ミリタリープレス', shoulders_id, 'barbell', 3, true, false, 'Standing overhead press', '立位でバーベルを頭上に', '体幹の安定性が重要', 'ミリタリー 立位 頭上'),
    ('Lateral Plank Raises', 'Lateral Plank Raises', 'サイドプランクレイズ', shoulders_id, 'bodyweight', 3, false, true, 'Plank with arm raise', 'サイドプランクで腕を上げる', '体幹と肩の複合運動', 'サイドプランク 複合 体幹'),
    ('Wall Handstand Hold', 'Wall Handstand Hold', '壁逆立ちホールド', shoulders_id, 'bodyweight', 4, false, true, 'Isometric shoulder exercise', '壁に足をつけて逆立ちキープ', '肩の持久力向上', '壁逆立ち アイソメトリック 持久力'),
    ('Shoulder Circles', 'Shoulder Circles', 'ショルダーサークル', shoulders_id, 'bodyweight', 1, false, true, 'Shoulder mobility exercise', '腕を大きく回す動作', 'ウォームアップにも最適', 'ショルダーサークル 可動域 ウォームアップ');

    -- Arms exercises (12種類)
    INSERT INTO exercises (name, name_en, name_ja, muscle_group_id, equipment, difficulty_level, is_compound, is_bodyweight, description, instructions, tips, search_keywords) VALUES
    ('Bicep Curls', 'Bicep Curls', 'バイセップカール', arms_id, 'dumbbell', 1, false, false, 'Basic bicep exercise', 'ダンベルを肘を固定して上げる', '反動を使わずゆっくりと', 'バイセップ カール 二頭筋'),
    ('Tricep Dips', 'Tricep Dips', 'トライセップディップス', arms_id, 'bodyweight', 2, false, true, 'Bodyweight tricep exercise', '椅子や台を使って体を上下', '肘を体に近づけて行う', 'トライセップ ディップス 三頭筋'),
    ('Hammer Curls', 'Hammer Curls', 'ハンマーカール', arms_id, 'dumbbell', 1, false, false, 'Neutral grip bicep exercise', '親指を上にしてカール', '上腕筋と前腕も鍛えられる', 'ハンマー 中立 前腕'),
    ('Tricep Push-ups', 'Tricep Push-ups', 'トライセッププッシュアップ', arms_id, 'bodyweight', 3, true, true, 'Close-grip push-up variation', '手幅を狭くしたプッシュアップ', '三頭筋により効果的', 'トライセップ 狭い手幅 三頭筋'),
    ('Concentration Curls', 'Concentration Curls', 'コンセントレーションカール', arms_id, 'dumbbell', 2, false, false, 'Isolated bicep exercise', '座って肘を膝に固定', '二頭筋を集中的に鍛える', 'コンセントレーション 集中 座位'),
    ('Overhead Tricep Extension', 'Overhead Tricep Extension', 'オーバーヘッドトライセップエクステンション', arms_id, 'dumbbell', 2, false, false, 'Tricep stretch exercise', '頭上でダンベルを上下', '三頭筋の長頭に効果的', 'オーバーヘッド 頭上 長頭'),
    ('Preacher Curls', 'Preacher Curls', 'プリーチャーカール', arms_id, 'barbell', 2, false, false, 'Supported bicep exercise', 'プリーチャーベンチでカール', '可動域を最大限に使う', 'プリーチャー ベンチ 可動域'),
    ('Close-grip Bench Press', 'Close-grip Bench Press', 'クローズグリップベンチプレス', arms_id, 'barbell', 3, true, false, 'Compound tricep exercise', '手幅を狭くしたベンチプレス', '三頭筋と胸筋内側に効果', 'クローズグリップ ベンチ 複合'),
    ('Cable Curls', 'Cable Curls', 'ケーブルカール', arms_id, 'cable machine', 2, false, false, 'Constant tension bicep exercise', 'ケーブルマシンでカール', '一定の張力で効果的', 'ケーブル 一定張力 マシン'),
    ('Tricep Kickbacks', 'Tricep Kickbacks', 'トライセップキックバック', arms_id, 'dumbbell', 2, false, false, 'Rear tricep exercise', '前傾姿勢で後ろに蹴る動作', '三頭筋の収縮を意識', 'キックバック 後ろ 収縮'),
    ('Zottman Curls', 'Zottman Curls', 'ゾットマンカール', arms_id, 'dumbbell', 3, false, false, 'Rotating bicep exercise', '上げる時と下ろす時で握りを変える', '二頭筋と前腕の両方に効果', 'ゾットマン 回転 前腕'),
    ('Diamond Push-ups', 'Diamond Push-ups', 'ダイヤモンドプッシュアップ', arms_id, 'bodyweight', 3, true, true, 'Tricep-focused push-up', '両手でダイヤモンド形を作る', '三頭筋に最も効果的な自重種目', 'ダイヤモンド 三頭筋 自重');

    -- Legs exercises (12種類)
    INSERT INTO exercises (name, name_en, name_ja, muscle_group_id, equipment, difficulty_level, is_compound, is_bodyweight, description, instructions, tips, search_keywords) VALUES
    ('Squats', 'Squats', 'スクワット', legs_id, 'bodyweight', 2, true, true, 'King of leg exercises', '足を肩幅に開いて腰を下ろす', '膝がつま先より前に出ないよう注意', 'スクワット 脚 大腿四頭筋'),
    ('Lunges', 'Lunges', 'ランジ', legs_id, 'bodyweight', 2, true, true, 'Unilateral leg exercise', '片足を前に出して腰を下ろす', '前膝が90度になるまで', 'ランジ 片足 不均等'),
    ('Jump Squats', 'Jump Squats', 'ジャンプスクワット', legs_id, 'bodyweight', 3, true, true, 'Explosive leg exercise', 'スクワットからジャンプ', '着地は柔らかく', 'ジャンプ 爆発力 プライオメトリック'),
    ('Bulgarian Split Squats', 'Bulgarian Split Squats', 'ブルガリアンスプリットスクワット', legs_id, 'bodyweight', 3, true, true, 'Rear-foot elevated squat', '後ろ足を台に乗せたスクワット', '前足に重心を置く', 'ブルガリアン スプリット 台'),
    ('Calf Raises', 'Calf Raises', 'カーフレイズ', legs_id, 'bodyweight', 1, false, true, 'Calf muscle exercise', 'つま先立ちを繰り返す', 'ふくらはぎの収縮を意識', 'カーフ ふくらはぎ つま先立ち'),
    ('Wall Sits', 'Wall Sits', 'ウォールシット', legs_id, 'bodyweight', 2, false, true, 'Isometric leg exercise', '壁に背中をつけて座る姿勢キープ', '太ももが床と平行になるまで', 'ウォール アイソメトリック 持久力'),
    ('Single-leg Squats', 'Single-leg Squats', '片足スクワット', legs_id, 'bodyweight', 4, true, true, 'Advanced unilateral exercise', '片足のみでスクワット', 'バランスと筋力が必要', '片足 上級者 バランス'),
    ('Step-ups', 'Step-ups', 'ステップアップ', legs_id, 'bodyweight', 2, true, true, 'Functional leg exercise', '台に足を乗せて上がる', '日常動作に近い運動', 'ステップ 台 機能的'),
    ('Goblet Squats', 'Goblet Squats', 'ゴブレットスクワット', legs_id, 'dumbbell', 2, true, false, 'Front-loaded squat', 'ダンベルを胸の前で持つ', '上体を立てやすい', 'ゴブレット 前荷重 ダンベル'),
    ('Romanian Deadlifts', 'Romanian Deadlifts', 'ルーマニアンデッドリフト', legs_id, 'barbell', 3, true, false, 'Hip hinge exercise', '膝を少し曲げて前傾', 'ハムストリングと臀筋に効果', 'ルーマニアン ハムストリング 臀筋'),
    ('Leg Press', 'Leg Press', 'レッグプレス', legs_id, 'machine', 2, true, false, 'Machine-based leg exercise', 'マシンで足を押す動作', '安全に高重量を扱える', 'レッグプレス マシン 高重量'),
    ('Sumo Squats', 'Sumo Squats', 'スモウスクワット', legs_id, 'bodyweight', 2, true, true, 'Wide-stance squat', '足幅を広くしたスクワット', '内転筋により効果的', 'スモウ 広い 内転筋');

    -- Abs exercises (12種類)
    INSERT INTO exercises (name, name_en, name_ja, muscle_group_id, equipment, difficulty_level, is_compound, is_bodyweight, description, instructions, tips, search_keywords) VALUES
    ('Crunches', 'Crunches', 'クランチ', abs_id, 'bodyweight', 1, false, true, 'Basic ab exercise', '仰向けで上体を起こす', '腰は床につけたまま', 'クランチ 腹筋 基本'),
    ('Plank', 'Plank', 'プランク', abs_id, 'bodyweight', 2, false, true, 'Isometric core exercise', '肘とつま先で体を支える', '体を一直線に保つ', 'プランク 体幹 アイソメトリック'),
    ('Bicycle Crunches', 'Bicycle Crunches', 'バイシクルクランチ', abs_id, 'bodyweight', 2, false, true, 'Rotating ab exercise', '自転車を漕ぐような動作', '対角線の動きを意識', 'バイシクル 回転 対角線'),
    ('Russian Twists', 'Russian Twists', 'ロシアンツイスト', abs_id, 'bodyweight', 2, false, true, 'Oblique exercise', '座位で体を左右にひねる', '腹斜筋に効果的', 'ロシアン ツイスト 腹斜筋'),
    ('Mountain Climbers', 'Mountain Climbers', 'マウンテンクライマー', abs_id, 'bodyweight', 3, true, true, 'Dynamic core exercise', 'プランク姿勢で足を交互に動かす', '有酸素効果もある', 'マウンテン 動的 有酸素'),
    ('Dead Bug', 'Dead Bug', 'デッドバグ', abs_id, 'bodyweight', 2, false, true, 'Core stability exercise', '仰向けで対角の手足を動かす', '体幹の安定性を鍛える', 'デッドバグ 安定性 対角'),
    ('Leg Raises', 'Leg Raises', 'レッグレイズ', abs_id, 'bodyweight', 3, false, true, 'Lower ab exercise', '仰向けで足を上げ下げ', '下部腹筋に効果的', 'レッグレイズ 下部腹筋 足上げ'),
    ('Side Plank', 'Side Plank', 'サイドプランク', abs_id, 'bodyweight', 3, false, true, 'Lateral core exercise', '横向きで体を支える', '腹斜筋と体幹の安定性', 'サイドプランク 横 腹斜筋'),
    ('Hollow Body Hold', 'Hollow Body Hold', 'ホローボディホールド', abs_id, 'bodyweight', 3, false, true, 'Advanced core exercise', '体を弓なりにしてキープ', '体操選手の基本種目', 'ホロー 弓なり 体操'),
    ('V-ups', 'V-ups', 'Vアップ', abs_id, 'bodyweight', 3, false, true, 'Full ab exercise', '手足を同時に上げてV字を作る', '腹筋全体に効果的', 'Vアップ V字 全体'),
    ('Flutter Kicks', 'Flutter Kicks', 'フラッターキック', abs_id, 'bodyweight', 2, false, true, 'Lower ab exercise', '仰向けで足を小刻みに動かす', '下部腹筋と腸腰筋に効果', 'フラッター 小刻み 腸腰筋'),
    ('Reverse Crunches', 'Reverse Crunches', 'リバースクランチ', abs_id, 'bodyweight', 2, false, true, 'Lower ab focused exercise', '膝を胸に引き寄せる', '下部腹筋を集中的に', 'リバース 下部 引き寄せ');

END $$;

-- ============================================================================
-- VIEWS FOR COMMON QUERIES
-- ============================================================================

-- View for user workout summary
CREATE VIEW user_workout_summary AS
SELECT 
    u.id as user_id,
    u.email,
    COUNT(DISTINCT tl.workout_date) as total_workout_days,
    COUNT(tl.id) as total_exercises_logged,
    AVG(ws.satisfaction_rating) as avg_satisfaction,
    MAX(tl.workout_date) as last_workout_date,
    ARRAY_AGG(DISTINCT mg.name) as trained_muscle_groups
FROM auth.users u
LEFT JOIN training_logs tl ON u.id = tl.user_id
LEFT JOIN workout_sessions ws ON u.id = ws.user_id
LEFT JOIN muscle_groups mg ON tl.muscle_group_id = mg.id
GROUP BY u.id, u.email;

-- View for muscle group training frequency
CREATE VIEW muscle_group_frequency AS
SELECT 
    tl.user_id,
    mg.name as muscle_group,
    COUNT(*) as training_count,
    MAX(tl.workout_date) as last_trained,
    AVG(tl.difficulty_rating) as avg_difficulty
FROM training_logs tl
JOIN muscle_groups mg ON tl.muscle_group_id = mg.id
GROUP BY tl.user_id, mg.id, mg.name;

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Additional performance indexes
CREATE INDEX idx_training_logs_workout_date ON training_logs(workout_date);
CREATE INDEX idx_workout_sessions_start_time ON workout_sessions(start_time);
CREATE INDEX idx_muscle_recovery_last_workout ON muscle_recovery(last_workout_date);
CREATE INDEX idx_user_achievements_type ON user_achievements(achievement_type);
CREATE INDEX idx_exercises_tags ON exercises USING GIN(tags);
CREATE INDEX idx_workout_templates_tags ON workout_templates USING GIN(tags);

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE muscle_groups IS 'Master table for muscle groups with recovery times';
COMMENT ON TABLE exercises IS 'Exercise database with instructions and metadata';
COMMENT ON TABLE user_profiles IS 'Extended user profile information';
COMMENT ON TABLE training_logs IS 'Individual exercise records within workouts';
COMMENT ON TABLE workout_sessions IS 'Complete workout session records';
COMMENT ON TABLE workout_templates IS 'Reusable workout templates';
COMMENT ON TABLE muscle_recovery IS 'Tracks recovery status for each muscle group';
COMMENT ON TABLE workout_recommendations IS 'AI-generated workout suggestions';
COMMENT ON TABLE user_achievements IS 'Gamification achievements and milestones';
COMMENT ON TABLE user_settings IS 'User preferences and app settings';
COMMENT ON TABLE offline_sync_queue IS 'Queue for syncing offline changes';

-- ============================================================================
-- 13. PROGRESS TRACKING TABLES (プログレッシブ・オーバーロード追跡)
-- ============================================================================

-- 進捗統計テーブル
CREATE TABLE progress_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    exercise_id UUID REFERENCES exercises(id) ON DELETE CASCADE,
    max_one_rm DECIMAL(6,2) DEFAULT 0,
    avg_one_rm DECIMAL(6,2) DEFAULT 0,
    progress_rate DECIMAL(5,2) DEFAULT 0, -- 進捗率（%）
    total_sessions INTEGER DEFAULT 0,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, exercise_id)
);

-- ユーザー目標テーブル
CREATE TABLE user_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    exercise_id UUID REFERENCES exercises(id) ON DELETE CASCADE,
    goal_type VARCHAR(20) NOT NULL CHECK (goal_type IN ('weight', 'reps', 'one_rm', 'volume')),
    target_value DECIMAL(8,2) NOT NULL CHECK (target_value > 0),
    current_value DECIMAL(8,2) DEFAULT 0,
    target_date DATE NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    is_achieved BOOLEAN DEFAULT false,
    achieved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- パフォーマンス分析テーブル
CREATE TABLE performance_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    exercise_id UUID REFERENCES exercises(id) ON DELETE CASCADE,
    analysis_date DATE NOT NULL DEFAULT CURRENT_DATE,
    period_type VARCHAR(20) NOT NULL CHECK (period_type IN ('weekly', 'monthly', 'quarterly')),
    max_weight DECIMAL(6,2),
    avg_weight DECIMAL(6,2),
    max_one_rm DECIMAL(6,2),
    avg_one_rm DECIMAL(6,2),
    total_volume DECIMAL(10,2), -- 総ボリューム（重量×回数の合計）
    session_count INTEGER DEFAULT 0,
    improvement_rate DECIMAL(5,2), -- 改善率（%）
    trend_direction VARCHAR(20) CHECK (trend_direction IN ('improving', 'stable', 'declining')),
    trend_strength DECIMAL(5,2), -- トレンドの強さ
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 1RM履歴テーブル（詳細な1RM追跡用）
CREATE TABLE one_rm_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    exercise_id UUID REFERENCES exercises(id) ON DELETE CASCADE,
    training_log_id UUID REFERENCES training_logs(id) ON DELETE CASCADE,
    calculated_one_rm DECIMAL(6,2) NOT NULL,
    calculation_method VARCHAR(20) DEFAULT 'brzycki' CHECK (calculation_method IN ('brzycki', 'epley', 'lander', 'lombardi')),
    weight_used DECIMAL(6,2) NOT NULL,
    reps_performed INTEGER NOT NULL CHECK (reps_performed > 0),
    workout_date DATE NOT NULL,
    is_estimated BOOLEAN DEFAULT true, -- true: 計算値, false: 実測値
    confidence_score DECIMAL(3,2) DEFAULT 0.8, -- 信頼度スコア（0-1）
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックス作成
CREATE INDEX idx_progress_stats_user_exercise ON progress_stats(user_id, exercise_id);
CREATE INDEX idx_user_goals_user_exercise ON user_goals(user_id, exercise_id);
CREATE INDEX idx_user_goals_active ON user_goals(is_active, target_date);
CREATE INDEX idx_performance_analytics_user_date ON performance_analytics(user_id, analysis_date DESC);
CREATE INDEX idx_performance_analytics_exercise ON performance_analytics(exercise_id, period_type);
CREATE INDEX idx_one_rm_history_user_exercise ON one_rm_history(user_id, exercise_id, workout_date DESC);
CREATE INDEX idx_one_rm_history_training_log ON one_rm_history(training_log_id);

-- RLS (Row Level Security) ポリシー
ALTER TABLE progress_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE one_rm_history ENABLE ROW LEVEL SECURITY;

-- Progress Stats Policies
CREATE POLICY "Users can view own progress stats" ON progress_stats FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own progress stats" ON progress_stats FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own progress stats" ON progress_stats FOR UPDATE USING (auth.uid() = user_id);

-- User Goals Policies
CREATE POLICY "Users can view own goals" ON user_goals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own goals" ON user_goals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own goals" ON user_goals FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own goals" ON user_goals FOR DELETE USING (auth.uid() = user_id);

-- Performance Analytics Policies
CREATE POLICY "Users can view own analytics" ON performance_analytics FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own analytics" ON performance_analytics FOR INSERT WITH CHECK (auth.uid() = user_id);

-- One RM History Policies
CREATE POLICY "Users can view own 1rm history" ON one_rm_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own 1rm history" ON one_rm_history FOR INSERT WITH CHECK (auth.uid() = user_id);

-- トリガー関数：training_logsに新しいレコードが挿入されたときに1RM履歴を自動作成
CREATE OR REPLACE FUNCTION create_one_rm_history_on_training_log()
RETURNS TRIGGER AS $$
DECLARE
    best_one_rm DECIMAL(6,2);
    best_weight DECIMAL(6,2);
    best_reps INTEGER;
    i INTEGER;
BEGIN
    -- セット内で最高の1RMを計算
    best_one_rm := 0;
    best_weight := 0;
    best_reps := 0;
    
    FOR i IN 1..array_length(NEW.weights, 1) LOOP
        IF i <= array_length(NEW.reps, 1) THEN
            DECLARE
                current_one_rm DECIMAL(6,2);
            BEGIN
                -- Brzycki式で1RM計算: 1RM = weight × (36 / (37 - reps))
                IF NEW.reps[i] = 1 THEN
                    current_one_rm := NEW.weights[i];
                ELSIF NEW.reps[i] > 1 AND NEW.reps[i] <= 36 THEN
                    current_one_rm := NEW.weights[i] * (36.0 / (37 - NEW.reps[i]));
                ELSE
                    current_one_rm := 0; -- 36回を超える場合は計算しない
                END IF;
                
                IF current_one_rm > best_one_rm THEN
                    best_one_rm := current_one_rm;
                    best_weight := NEW.weights[i];
                    best_reps := NEW.reps[i];
                END IF;
            END;
        END IF;
    END LOOP;
    
    -- 1RM履歴に記録
    IF best_one_rm > 0 THEN
        INSERT INTO one_rm_history (
            user_id,
            exercise_id,
            training_log_id,
            calculated_one_rm,
            calculation_method,
            weight_used,
            reps_performed,
            workout_date,
            is_estimated,
            confidence_score
        ) VALUES (
            NEW.user_id,
            NEW.exercise_id,
            NEW.id,
            ROUND(best_one_rm, 1),
            'brzycki',
            best_weight,
            best_reps,
            NEW.workout_date,
            true,
            CASE 
                WHEN best_reps = 1 THEN 1.0
                WHEN best_reps <= 5 THEN 0.9
                WHEN best_reps <= 10 THEN 0.8
                WHEN best_reps <= 15 THEN 0.7
                ELSE 0.6
            END
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- トリガー作成
CREATE TRIGGER create_one_rm_history_trigger
    AFTER INSERT ON training_logs
    FOR EACH ROW
    EXECUTE FUNCTION create_one_rm_history_on_training_log();

-- トリガー関数：目標達成チェック
CREATE OR REPLACE FUNCTION check_goal_achievement()
RETURNS TRIGGER AS $$
DECLARE
    goal_record RECORD;
    current_value DECIMAL(8,2);
BEGIN
    -- アクティブな目標を取得
    FOR goal_record IN 
        SELECT * FROM user_goals 
        WHERE user_id = NEW.user_id 
        AND exercise_id = NEW.exercise_id 
        AND is_active = true 
        AND is_achieved = false
    LOOP
        -- 目標タイプに応じて現在値を計算
        CASE goal_record.goal_type
            WHEN 'weight' THEN
                SELECT MAX(unnest(weights)) INTO current_value FROM training_logs 
                WHERE user_id = NEW.user_id AND exercise_id = NEW.exercise_id 
                ORDER BY workout_date DESC LIMIT 1;
            WHEN 'reps' THEN
                SELECT MAX(unnest(reps)) INTO current_value FROM training_logs 
                WHERE user_id = NEW.user_id AND exercise_id = NEW.exercise_id 
                ORDER BY workout_date DESC LIMIT 1;
            WHEN 'one_rm' THEN
                SELECT calculated_one_rm INTO current_value FROM one_rm_history 
                WHERE user_id = NEW.user_id AND exercise_id = NEW.exercise_id 
                ORDER BY workout_date DESC LIMIT 1;
            WHEN 'volume' THEN
                -- ボリューム計算（最新セッションの総ボリューム）
                SELECT SUM(weights[i] * reps[i]) INTO current_value
                FROM training_logs, generate_subscripts(weights, 1) AS i
                WHERE user_id = NEW.user_id AND exercise_id = NEW.exercise_id
                AND id = NEW.id;
        END CASE;
        
        -- 目標達成チェック
        IF current_value >= goal_record.target_value THEN
            UPDATE user_goals 
            SET is_achieved = true, 
                achieved_at = NOW(),
                current_value = current_value,
                updated_at = NOW()
            WHERE id = goal_record.id;
        ELSE
            -- 現在値を更新
            UPDATE user_goals 
            SET current_value = current_value,
                updated_at = NOW()
            WHERE id = goal_record.id;
        END IF;
    END LOOP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 目標達成チェックトリガー
CREATE TRIGGER check_goal_achievement_trigger
    AFTER INSERT OR UPDATE ON training_logs
    FOR EACH ROW
    EXECUTE FUNCTION check_goal_achievement();

-- updated_atトリガーを追加
CREATE TRIGGER update_user_goals_updated_at BEFORE UPDATE ON user_goals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- training_logsテーブルに1RM列を追加（既存データとの互換性のため）
ALTER TABLE training_logs ADD COLUMN IF NOT EXISTS one_rm DECIMAL(6,2);

-- コメント追加
COMMENT ON TABLE progress_stats IS 'エクササイズ別の進捗統計データ';
COMMENT ON TABLE user_goals IS 'ユーザーが設定した目標とその達成状況';
COMMENT ON TABLE performance_analytics IS '期間別のパフォーマンス分析データ';
COMMENT ON TABLE one_rm_history IS '1RM（最大挙上重量）の履歴追跡';

-- ============================================================================
-- FINAL SETUP NOTES
-- ============================================================================

/*
SETUP INSTRUCTIONS:

1. Run this schema in your Supabase SQL editor
2. Enable authentication in Supabase dashboard
3. Configure email templates for auth
4. Set up storage bucket for user avatars and exercise images:
   - Create bucket: 'avatars' (public)
   - Create bucket: 'exercise-images' (public)
   - Create bucket: 'exercise-videos' (public)
   - Create bucket: 'user-uploads' (private)
   - Create bucket: 'custom-exercise-media' (private)

5. Environment variables needed in your app:
   - SUPABASE_URL
   - SUPABASE_ANON_KEY
   - SUPABASE_SERVICE_ROLE_KEY (for admin operations)

6. Optional: Set up Edge Functions for:
   - Workout recommendation algorithm
   - Achievement calculation
   - Push notification triggers
   - Data analytics

7. Consider setting up:
   - Database backups
   - Monitoring and alerts
   - Rate limiting
   - CORS policies
*/