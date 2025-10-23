// user_profilesテーブルのRLS設定修正スクリプト
const { createClient } = require('@supabase/supabase-js');

// Supabase設定
const supabaseUrl = 'https://mwwlqpokfgduxyjbqoff.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im13d2xxcG9rZmdkdXh5amJxb2ZmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjUxNTcxMiwiZXhwIjoyMDY4MDkxNzEyfQ.SERVICE_ROLE_KEY_PLACEHOLDER';

// Service Roleクライアント（管理者権限）
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixUserProfilesRLS() {
    console.log('🔧 user_profilesテーブルのRLS設定を修正します...');
    
    try {
        // 1. RLS有効化
        console.log('1️⃣ RLS有効化中...');
        const { error: rlsError } = await supabase.rpc('exec_sql', {
            sql: 'ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;'
        });
        
        if (rlsError && !rlsError.message.includes('already enabled')) {
            console.error('❌ RLS有効化エラー:', rlsError.message);
        } else {
            console.log('✅ RLS有効化完了');
        }
        
        // 2. 既存のポリシーを削除（存在する場合）
        console.log('2️⃣ 既存ポリシーのクリーンアップ中...');
        const dropPolicies = [
            'DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;',
            'DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;',
            'DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;'
        ];
        
        for (const sql of dropPolicies) {
            const { error } = await supabase.rpc('exec_sql', { sql });
            if (error) {
                console.log('⚠️ ポリシー削除:', error.message);
            }
        }
        
        // 3. 新しいポリシーを作成
        console.log('3️⃣ 新しいポリシー作成中...');
        const policies = [
            {
                name: 'Users can view own profile',
                sql: `CREATE POLICY "Users can view own profile" ON public.user_profiles 
                      FOR SELECT USING (auth.uid() = id);`
            },
            {
                name: 'Users can update own profile', 
                sql: `CREATE POLICY "Users can update own profile" ON public.user_profiles 
                      FOR UPDATE USING (auth.uid() = id);`
            },
            {
                name: 'Users can insert own profile',
                sql: `CREATE POLICY "Users can insert own profile" ON public.user_profiles 
                      FOR INSERT WITH CHECK (auth.uid() = id);`
            }
        ];
        
        for (const policy of policies) {
            console.log(`   📝 作成中: ${policy.name}`);
            const { error } = await supabase.rpc('exec_sql', { sql: policy.sql });
            
            if (error) {
                console.error(`   ❌ エラー: ${error.message}`);
            } else {
                console.log(`   ✅ 完了: ${policy.name}`);
            }
        }
        
        // 4. 設定確認
        console.log('4️⃣ 設定確認中...');
        const { data: policies_check, error: checkError } = await supabase.rpc('exec_sql', {
            sql: `SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
                  FROM pg_policies 
                  WHERE tablename = 'user_profiles';`
        });
        
        if (checkError) {
            console.error('❌ 確認エラー:', checkError.message);
        } else {
            console.log('✅ 設定確認完了');
            console.log('📋 現在のポリシー:', policies_check?.length || 0, '件');
        }
        
        console.log('🎉 user_profilesのRLS設定が完了しました！');
        
    } catch (error) {
        console.error('❌ 予期しないエラー:', error.message);
        console.error('詳細:', error);
    }
}

// 実行
fixUserProfilesRLS().then(() => {
    console.log('✨ スクリプト実行完了');
    process.exit(0);
}).catch((error) => {
    console.error('💥 スクリプト実行失敗:', error);
    process.exit(1);
});
