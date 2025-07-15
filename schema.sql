-- ワークアウト履歴テーブル
CREATE TABLE IF NOT EXISTS workouts (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL,
    date DATE NOT NULL,
    name TEXT NOT NULL,
    exercises JSONB NOT NULL,
    duration TEXT,
    total_sets INTEGER,
    max_weight TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- user_idに外部キー制約を付ける場合（Supabaseのauth.usersを参照）
-- ALTER TABLE workouts ADD CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES auth.users(id); 