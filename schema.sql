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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX idx_exercises_muscle_group ON exercises(muscle_group_id);
CREATE INDEX idx_exercises_difficulty ON exercises(difficulty_level);
CREATE INDEX idx_exercises_equipment ON exercises(equipment);

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
    fitness_level VARCHAR(20) DEFAULT 'beginner' CHECK (fitness_level IN ('beginner', 'intermediate', 'advanced')),
    primary_goals TEXT[] DEFAULT '{}',
    preferred_language VARCHAR(5) DEFAULT 'ja' CHECK (preferred_language IN ('ja', 'en')),
    timezone VARCHAR(50) DEFAULT 'Asia/Tokyo',
    weight DECIMAL(5,2),
    height DECIMAL(5,2),
    age INTEGER CHECK (age > 0 AND age < 150),
    gender VARCHAR(10) CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
    activity_level VARCHAR(20) DEFAULT 'moderate' CHECK (activity_level IN ('sedentary', 'light', 'moderate', 'active', 'very_active')),
    workout_frequency INTEGER DEFAULT 3 CHECK (workout_frequency BETWEEN 1 AND 7),
    preferred_workout_duration INTEGER DEFAULT 60, -- minutes
    notifications_enabled BOOLEAN DEFAULT true,
    email_notifications BOOLEAN DEFAULT false,
    push_notifications BOOLEAN DEFAULT true,
    theme_preference VARCHAR(10) DEFAULT 'auto' CHECK (theme_preference IN ('light', 'dark', 'auto')),
    font_size VARCHAR(10) DEFAULT 'medium' CHECK (font_size IN ('xs', 'sm', 'md', 'lg', 'xl')),
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

-- Public tables (no RLS needed)
-- muscle_groups, exercises, template_exercises are public read-only

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

    -- Chest exercises
    INSERT INTO exercises (name, name_en, name_ja, muscle_group_id, equipment, difficulty_level, is_compound, is_bodyweight, description) VALUES
    ('Push-ups', 'Push-ups', 'プッシュアップ', chest_id, 'bodyweight', 1, true, true, 'Classic bodyweight chest exercise'),
    ('Incline Push-ups', 'Incline Push-ups', 'インクラインプッシュアップ', chest_id, 'bodyweight', 1, true, true, 'Easier variation using elevation'),
    ('Diamond Push-ups', 'Diamond Push-ups', 'ダイヤモンドプッシュアップ', chest_id, 'bodyweight', 3, true, true, 'Targets triceps and inner chest'),
    ('Wide-grip Push-ups', 'Wide-grip Push-ups', 'ワイドプッシュアップ', chest_id, 'bodyweight', 2, true, true, 'Emphasizes outer chest'),
    ('Decline Push-ups', 'Decline Push-ups', 'デクラインプッシュアップ', chest_id, 'bodyweight', 3, true, true, 'Feet elevated variation');

    -- Back exercises
    INSERT INTO exercises (name, name_en, name_ja, muscle_group_id, equipment, difficulty_level, is_compound, is_bodyweight, description) VALUES
    ('Pull-ups', 'Pull-ups', 'プルアップ', back_id, 'pull-up bar', 4, true, true, 'Ultimate back and bicep exercise'),
    ('Chin-ups', 'Chin-ups', 'チンアップ', back_id, 'pull-up bar', 3, true, true, 'Underhand grip variation'),
    ('Inverted Rows', 'Inverted Rows', 'インバーテッドロウ', back_id, 'bodyweight', 2, true, true, 'Horizontal pulling exercise'),
    ('Superman', 'Superman', 'スーパーマン', back_id, 'bodyweight', 1, false, true, 'Lower back strengthening'),
    ('Reverse Snow Angels', 'Reverse Snow Angels', 'リバーススノーエンジェル', back_id, 'bodyweight', 1, false, true, 'Upper back activation');

    -- Continue with other muscle groups...
    -- (Additional exercises would be inserted here)

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
   - Create bucket: 'user-uploads' (private)

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