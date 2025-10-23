-- エクササイズ追加スクリプト
-- Muscle Rotation Manager - 追加エクササイズ
-- 作成日: 2025-01-21

-- 筋肉部位のIDを取得
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

    -- ============================================================================
    -- 胸筋エクササイズ追加 (8種類)
    -- ============================================================================
    INSERT INTO exercises (name, name_en, name_ja, muscle_group_id, equipment, difficulty_level, is_compound, is_bodyweight, description, instructions, tips, search_keywords) VALUES
    ('Bench Press', 'Bench Press', 'ベンチプレス', chest_id, 'barbell', 3, true, false, 'Classic chest exercise with barbell', 'ベンチに横になり、バーベルを胸に下ろして押し上げる', '肩甲骨を寄せて安定させる', 'ベンチプレス バーベル 胸筋 マシン'),
    ('Dumbbell Press', 'Dumbbell Press', 'ダンベルプレス', chest_id, 'dumbbell', 2, true, false, 'Chest exercise with dumbbells', 'ダンベルを胸の位置から押し上げる', '可動域を広く取る', 'ダンベルプレス 可動域 胸筋'),
    ('Incline Dumbbell Press', 'Incline Dumbbell Press', 'インクラインダンベルプレス', chest_id, 'dumbbell', 3, true, false, 'Upper chest focus with dumbbells', 'インクラインベンチでダンベルを押し上げる', '上部胸筋に効果的', 'インクライン 上部胸筋 ダンベル'),
    ('Chest Flyes', 'Chest Flyes', 'チェストフライ', chest_id, 'dumbbell', 2, false, false, 'Isolation chest exercise', 'ダンベルを胸の前で開閉する', '胸筋のストレッチを意識', 'チェストフライ 単関節 ストレッチ'),
    ('Cable Crossover', 'Cable Crossover', 'ケーブルクロスオーバー', chest_id, 'cable machine', 2, false, false, 'Cable chest exercise', 'ケーブルを胸の前でクロスさせる', '胸筋の内側に効果的', 'ケーブル クロス 内側胸筋'),
    ('Dips', 'Dips', 'ディップス', chest_id, 'dip bars', 3, true, true, 'Bodyweight chest and tricep exercise', 'ディップバーで体を上下させる', '胸を張って行う', 'ディップス 自重 三頭筋'),
    ('Incline Cable Flyes', 'Incline Cable Flyes', 'インクラインケーブルフライ', chest_id, 'cable machine', 2, false, false, 'Upper chest cable exercise', 'インクラインでケーブルフライを行う', '上部胸筋の仕上げに最適', 'インクライン ケーブル 上部'),
    ('Machine Chest Press', 'Machine Chest Press', 'マシンチェストプレス', chest_id, 'machine', 1, true, false, 'Machine-based chest exercise', 'チェストプレスマシンで押し上げる', '初心者にも安全で効果的', 'マシン 初心者 安全');

    -- ============================================================================
    -- 背中エクササイズ追加 (8種類)
    -- ============================================================================
    INSERT INTO exercises (name, name_en, name_ja, muscle_group_id, equipment, difficulty_level, is_compound, is_bodyweight, description, instructions, tips, search_keywords) VALUES
    ('Wide-grip Pull-ups', 'Wide-grip Pull-ups', 'ワイドグリッププルアップ', back_id, 'pull-up bar', 4, true, true, 'Wide grip pull-up variation', '手幅を広く取って懸垂を行う', '広背筋の幅を広げる', 'ワイドグリップ 広背筋 幅'),
    ('Close-grip Pull-ups', 'Close-grip Pull-ups', 'クローズグリッププルアップ', back_id, 'pull-up bar', 3, true, true, 'Close grip pull-up variation', '手幅を狭く取って懸垂を行う', '上腕二頭筋も効果的', 'クローズグリップ 二頭筋 狭い'),
    ('Cable Rows', 'Cable Rows', 'ケーブルロウ', back_id, 'cable machine', 2, true, false, 'Seated cable rowing exercise', 'ケーブルを座って引く動作', '背中の厚みを作る', 'ケーブルロウ 座り 厚み'),
    ('One-arm Dumbbell Rows', 'One-arm Dumbbell Rows', 'ワンアームダンベルロウ', back_id, 'dumbbell', 2, false, false, 'Single arm rowing exercise', '片手でダンベルを引く動作', '左右のバランスを整える', 'ワンアーム 片手 バランス'),
    ('T-bar Rows', 'T-bar Rows', 'Tバーロウ', back_id, 'barbell', 3, true, false, 'T-bar rowing exercise', 'Tバーを引く動作', '背中の中央部に効果的', 'Tバー 中央部 背中'),
    ('Hyperextensions', 'Hyperextensions', 'ハイパーエクステンション', back_id, 'bodyweight', 1, false, true, 'Lower back strengthening', 'うつ伏せで腰を反らす動作', '腰の強化に重要', 'ハイパーエクステンション 腰 反らす'),
    ('Reverse Flyes', 'Reverse Flyes', 'リバースフライ', back_id, 'dumbbell', 2, false, false, 'Rear delt and upper back', '後ろに腕を開く動作', '後部三角筋と上部背筋', 'リバースフライ 後部三角筋 上部'),
    ('Rack Pulls', 'Rack Pulls', 'ラックプル', back_id, 'barbell', 3, true, false, 'Partial deadlift variation', 'ラックからバーベルを引く', 'デッドリフトの準備運動', 'ラックプル 部分 デッドリフト');

    -- ============================================================================
    -- 肩エクササイズ追加 (8種類)
    -- ============================================================================
    INSERT INTO exercises (name, name_en, name_ja, muscle_group_id, equipment, difficulty_level, is_compound, is_bodyweight, description, instructions, tips, search_keywords) VALUES
    ('Overhead Press', 'Overhead Press', 'オーバーヘッドプレス', shoulders_id, 'barbell', 3, true, false, 'Standing overhead press', '立位でバーベルを頭上に押し上げる', '体幹の安定性が重要', 'オーバーヘッド 立位 体幹'),
    ('Lateral Raises', 'Lateral Raises', 'サイドレイズ', shoulders_id, 'dumbbell', 1, false, false, 'Side deltoid isolation', '腕を横に上げる動作', '肩の高さまで上げる', 'サイドレイズ 横 三角筋中部'),
    ('Front Raises', 'Front Raises', 'フロントレイズ', shoulders_id, 'dumbbell', 1, false, false, 'Front deltoid isolation', '腕を前に上げる動作', '前部三角筋を集中的に', 'フロントレイズ 前 三角筋前部'),
    ('Rear Delt Flyes', 'Rear Delt Flyes', 'リアデルトフライ', shoulders_id, 'dumbbell', 2, false, false, 'Rear deltoid isolation', '後ろに腕を開く動作', '後部三角筋を意識', 'リアデルト 後部 フライ'),
    ('Cable Lateral Raises', 'Cable Lateral Raises', 'ケーブルサイドレイズ', shoulders_id, 'cable machine', 2, false, false, 'Cable lateral raises', 'ケーブルでサイドレイズを行う', '一定の負荷を維持', 'ケーブル サイドレイズ 一定負荷'),
    ('Pike Push-ups', 'Pike Push-ups', 'パイクプッシュアップ', shoulders_id, 'bodyweight', 3, true, true, 'Bodyweight shoulder exercise', 'お尻を高く上げて行うプッシュアップ', '肩の筋肉を主に使う', 'パイク 自重 肩'),
    ('Handstand Push-ups', 'Handstand Push-ups', '逆立ちプッシュアップ', shoulders_id, 'bodyweight', 5, true, true, 'Advanced shoulder exercise', '壁に足をつけて逆立ちで行う', '上級者向け。段階的に練習', '逆立ち 上級者 壁'),
    ('Barbell Upright Rows', 'Barbell Upright Rows', 'バーベルアップライトロウ', shoulders_id, 'barbell', 2, true, false, 'Vertical pulling exercise', 'バーベルを縦に引き上げる', '肩と僧帽筋に効果', 'アップライト 縦引き 僧帽筋');

    -- ============================================================================
    -- 腕エクササイズ追加 (12種類)
    -- ============================================================================
    INSERT INTO exercises (name, name_en, name_ja, muscle_group_id, equipment, difficulty_level, is_compound, is_bodyweight, description, instructions, tips, search_keywords) VALUES
    -- 上腕二頭筋
    ('Hammer Curls', 'Hammer Curls', 'ハンマーカール', arms_id, 'dumbbell', 1, false, false, 'Neutral grip bicep exercise', 'ハンマーグリップでカールを行う', '上腕二頭筋と前腕に効果的', 'ハンマーカール ニュートラル 前腕'),
    ('Preacher Curls', 'Preacher Curls', 'プリーチャーカール', arms_id, 'barbell', 2, false, false, 'Isolation bicep exercise', 'プリーチャーベンチでカールを行う', '上腕二頭筋のピークを作る', 'プリーチャー ピーク 単関節'),
    ('Cable Curls', 'Cable Curls', 'ケーブルカール', arms_id, 'cable machine', 1, false, false, 'Cable bicep exercise', 'ケーブルでカールを行う', '一定の負荷を維持', 'ケーブルカール 一定負荷'),
    ('Concentration Curls', 'Concentration Curls', 'コンセントレーションカール', arms_id, 'dumbbell', 1, false, false, 'Seated bicep isolation', '座って片手でカールを行う', '上腕二頭筋を集中的に', 'コンセントレーション 座り 片手'),
    
    -- 上腕三頭筋
    ('Tricep Dips', 'Tricep Dips', 'トライセップディップス', arms_id, 'dip bars', 3, true, true, 'Bodyweight tricep exercise', 'ディップバーで三頭筋を鍛える', '胸を張って行う', 'トライセップディップス 三頭筋 自重'),
    ('Close-grip Bench Press', 'Close-grip Bench Press', 'クローズグリップベンチプレス', arms_id, 'barbell', 3, true, false, 'Tricep-focused bench press', '手幅を狭くしてベンチプレス', '上腕三頭筋に効果的', 'クローズグリップ 三頭筋 狭い'),
    ('Overhead Tricep Extension', 'Overhead Tricep Extension', 'オーバーヘッドトライセップエクステンション', arms_id, 'dumbbell', 2, false, false, 'Overhead tricep exercise', '頭上で三頭筋を伸ばす動作', '三頭筋の長頭に効果的', 'オーバーヘッド 三頭筋 長頭'),
    ('Tricep Kickbacks', 'Tricep Kickbacks', 'トライセップキックバック', arms_id, 'dumbbell', 1, false, false, 'Tricep isolation exercise', '前傾姿勢で三頭筋を後ろに伸ばす', '三頭筋の単関節運動', 'キックバック 単関節 後ろ'),
    ('Cable Tricep Pushdowns', 'Cable Tricep Pushdowns', 'ケーブルトライセッププッシュダウン', arms_id, 'cable machine', 1, false, false, 'Cable tricep exercise', 'ケーブルを下に押し下げる', '三頭筋の仕上げに最適', 'ケーブル プッシュダウン 仕上げ'),
    ('Diamond Push-ups', 'Diamond Push-ups', 'ダイヤモンドプッシュアップ', arms_id, 'bodyweight', 3, true, true, 'Tricep-focused push-ups', '手でダイヤモンド形を作ってプッシュアップ', '三頭筋に効果的な自重運動', 'ダイヤモンド 三頭筋 自重'),
    
    -- 前腕
    ('Wrist Curls', 'Wrist Curls', 'リストカール', arms_id, 'dumbbell', 1, false, false, 'Forearm strengthening', '手首を曲げる動作', '前腕の屈筋を鍛える', 'リストカール 前腕 屈筋'),
    ('Reverse Wrist Curls', 'Reverse Wrist Curls', 'リバースリストカール', arms_id, 'dumbbell', 1, false, false, 'Reverse forearm exercise', '手首を反らす動作', '前腕の伸筋を鍛える', 'リバース 前腕 伸筋');

    -- ============================================================================
    -- 脚エクササイズ追加 (12種類)
    -- ============================================================================
    INSERT INTO exercises (name, name_en, name_ja, muscle_group_id, equipment, difficulty_level, is_compound, is_bodyweight, description, instructions, tips, search_keywords) VALUES
    -- 大腿四頭筋
    ('Front Squats', 'Front Squats', 'フロントスクワット', legs_id, 'barbell', 4, true, false, 'Front-loaded squat variation', 'バーベルを胸の前で担いでスクワット', '体幹の安定性が重要', 'フロントスクワット 前担ぎ 体幹'),
    ('Bulgarian Split Squats', 'Bulgarian Split Squats', 'ブルガリアンスプリットスクワット', legs_id, 'bodyweight', 3, true, true, 'Single leg squat variation', '後ろ足を台に乗せて片足スクワット', '片足の筋力とバランス向上', 'ブルガリアン 片足 バランス'),
    ('Lunges', 'Lunges', 'ランジ', legs_id, 'bodyweight', 2, true, true, 'Forward stepping exercise', '前に大きく踏み出してスクワット', '脚の前後バランスを整える', 'ランジ 前踏み出し バランス'),
    ('Walking Lunges', 'Walking Lunges', 'ウォーキングランジ', legs_id, 'bodyweight', 2, true, true, 'Dynamic lunge variation', '歩きながらランジを行う', '動的な脚の運動', 'ウォーキングランジ 動的 歩く'),
    ('Leg Press', 'Leg Press', 'レッグプレス', legs_id, 'machine', 1, true, false, 'Machine-based leg exercise', 'レッグプレスマシンで脚を押す', '安全で効果的な脚の運動', 'レッグプレス マシン 安全'),
    ('Leg Extensions', 'Leg Extensions', 'レッグエクステンション', legs_id, 'machine', 1, false, false, 'Quadricep isolation', 'レッグエクステンションマシンで大腿四頭筋を鍛える', '大腿四頭筋の単関節運動', 'レッグエクステンション 大腿四頭筋 単関節'),
    
    -- ハムストリング
    ('Romanian Deadlifts', 'Romanian Deadlifts', 'ルーマニアンデッドリフト', legs_id, 'barbell', 3, true, false, 'Hip hinge movement', '膝を軽く曲げてバーベルを下ろす', 'ハムストリングと臀筋に効果的', 'ルーマニアン ハムストリング 臀筋'),
    ('Leg Curls', 'Leg Curls', 'レッグカール', legs_id, 'machine', 1, false, false, 'Hamstring isolation', 'レッグカールマシンでハムストリングを鍛える', 'ハムストリングの単関節運動', 'レッグカール ハムストリング 単関節'),
    ('Good Mornings', 'Good Mornings', 'グッドモーニング', legs_id, 'barbell', 3, true, false, 'Hip hinge exercise', 'バーベルを担いで前傾する', 'ハムストリングと臀筋に効果的', 'グッドモーニング 前傾 臀筋'),
    
    -- 臀筋
    ('Hip Thrusts', 'Hip Thrusts', 'ヒップスラスト', legs_id, 'bodyweight', 2, true, true, 'Glute-focused exercise', '背中を台に乗せて腰を上げる', '臀筋を集中的に鍛える', 'ヒップスラスト 臀筋 腰上げ'),
    ('Glute Bridges', 'Glute Bridges', 'グリュートブリッジ', legs_id, 'bodyweight', 1, true, true, 'Basic glute exercise', '仰向けで腰を上げる', '臀筋の基本運動', 'グリュートブリッジ 臀筋 基本'),
    ('Calf Raises', 'Calf Raises', 'カーフレイズ', legs_id, 'bodyweight', 1, false, true, 'Calf strengthening', 'つま先立ちでふくらはぎを鍛える', 'ふくらはぎの基本運動', 'カーフレイズ ふくらはぎ つま先立ち');

    -- ============================================================================
    -- 腹筋エクササイズ追加 (12種類)
    -- ============================================================================
    INSERT INTO exercises (name, name_en, name_ja, muscle_group_id, equipment, difficulty_level, is_compound, is_bodyweight, description, instructions, tips, search_keywords) VALUES
    -- 腹直筋
    ('Sit-ups', 'Sit-ups', 'シットアップ', abs_id, 'bodyweight', 2, false, true, 'Classic abdominal exercise', '仰向けから上体を起こす', '腹直筋の基本運動', 'シットアップ 腹直筋 上体起こし'),
    ('Russian Twists', 'Russian Twists', 'ロシアンツイスト', abs_id, 'bodyweight', 2, false, true, 'Rotational core exercise', '座って体を左右に回転させる', '腹斜筋と体幹の回転力', 'ロシアンツイスト 腹斜筋 回転'),
    ('Mountain Climbers', 'Mountain Climbers', 'マウンテンクライマー', abs_id, 'bodyweight', 3, true, true, 'Dynamic core exercise', 'プランク姿勢で膝を交互に胸に近づける', '全身の有酸素運動', 'マウンテンクライマー 全身 有酸素'),
    ('Bicycle Crunches', 'Bicycle Crunches', 'バイシクルクランチ', abs_id, 'bodyweight', 2, false, true, 'Alternating core exercise', '自転車を漕ぐように膝を交互に動かす', '腹斜筋に効果的', 'バイシクル 腹斜筋 交互'),
    ('Leg Raises', 'Leg Raises', 'レッグレイズ', abs_id, 'bodyweight', 2, false, true, 'Lower abdominal exercise', '仰向けで脚を上げる', '下腹部に効果的', 'レッグレイズ 下腹部 脚上げ'),
    ('Hanging Leg Raises', 'Hanging Leg Raises', 'ハンギングレッグレイズ', abs_id, 'pull-up bar', 4, false, true, 'Advanced lower abdominal', '懸垂バーにぶら下がって脚を上げる', '上級者向けの下腹部運動', 'ハンギング 上級者 下腹部'),
    
    -- 体幹
    ('Side Planks', 'Side Planks', 'サイドプランク', abs_id, 'bodyweight', 2, false, true, 'Lateral core exercise', '横向きで体を一直線に保つ', '腹斜筋と体幹の安定性', 'サイドプランク 腹斜筋 安定性'),
    ('Dead Bug', 'Dead Bug', 'デッドバグ', abs_id, 'bodyweight', 1, false, true, 'Core stability exercise', '仰向けで対角の手足を動かす', '体幹の安定性向上', 'デッドバグ 体幹 安定性'),
    ('Bird Dog', 'Bird Dog', 'バードドッグ', abs_id, 'bodyweight', 1, false, true, 'Quadruped core exercise', '四つん這いで対角の手足を伸ばす', '体幹とバランスの向上', 'バードドッグ 四つん這い バランス'),
    ('Ab Wheel Rollouts', 'Ab Wheel Rollouts', 'アブローラー', abs_id, 'ab wheel', 4, true, true, 'Advanced core exercise', 'アブローラーで体を前後に動かす', '上級者向けの体幹運動', 'アブローラー 上級者 体幹'),
    ('Pallof Press', 'Pallof Press', 'パロフプレス', abs_id, 'cable machine', 3, false, false, 'Anti-rotation core exercise', 'ケーブルを胸の前で押し出す', '体幹の回転防止力', 'パロフプレス 回転防止 ケーブル'),
    ('Woodchoppers', 'Woodchoppers', 'ウッドチョッパー', abs_id, 'cable machine', 2, false, false, 'Rotational core exercise', 'ケーブルを斜めに引く動作', '体幹の回転力向上', 'ウッドチョッパー 回転力 斜め');

END $$;
