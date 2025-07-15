// app.js
// PWA初期化、Supabase認証、UI制御、イベントリスナー、グローバル変数、ロジック等をここに集約
// ...（index.htmlからJS部分をすべて移植）... 

// Initialize app
console.log('🏋️ MuscleRotationManager - Starting Application');

// Global variables
let currentUser = null;
let currentWorkout = null;
let workoutTimer = null;
let workoutStartTime = null;
let currentLanguage = 'ja';
let currentFontSize = 'base';

// Supabase configuration
// TODO: Replace with your actual Supabase project URL and anon key
// Get these from your Supabase project dashboard: Settings → API
const supabaseUrl = 'https://mwwlqpokfgduxyjbqoff.supabase.co'; // Replace with your actual URL
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im13d2xxcG9rZmdkdXh5amJxb2ZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI1MTU3MTIsImV4cCI6MjA2ODA5MTcxMn0.0vyxxQ7zBfRKrH-JhpHMor_UvuBbQu3wE9HStGjsfGQ'; // Replace with your actual anon key
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

// For development/testing without Supabase, you can comment out the above and use this:
// const supabase = null;

// Page management
let currentPage = 'dashboard';
const pageCache = new Map();

// Load partial content
async function loadPartial(partialName) {
    try {
        if (pageCache.has(partialName)) {
            return pageCache.get(partialName);
        }
        
        const response = await fetch(`partials/${partialName}.html`);
        if (!response.ok) {
            throw new Error(`Failed to load ${partialName}`);
        }
        
        const content = await response.text();
        pageCache.set(partialName, content);
        return content;
    } catch (error) {
        console.error(`Error loading partial ${partialName}:`, error);
        return `<div class="text-center text-gray-500 py-8">
            <i class="fas fa-exclamation-triangle text-2xl mb-4"></i>
            <p>ページの読み込みに失敗しました</p>
        </div>`;
    }
}

// Navigate to page
async function navigateToPage(pageName) {
    try {
        // Update navigation state
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`[data-page="${pageName}"]`)?.classList.add('active');
        
        // Load page content
        const mainContent = document.querySelector('main');
        const content = await loadPartial(pageName);
        
        // Replace content
        mainContent.innerHTML = content;
        
        // Update current page
        currentPage = pageName;
        
        // Initialize page-specific functionality
        initializePage(pageName);
        
        console.log(`Navigated to ${pageName} page`);
    } catch (error) {
        console.error('Navigation error:', error);
        showNotification('ページの読み込みに失敗しました', 'error');
    }
}

// Initialize page-specific functionality
function initializePage(pageName) {
    switch (pageName) {
        case 'dashboard':
            initializeDashboard();
            break;
        case 'workout':
            initializeWorkout();
            break;
        case 'calendar':
            initializeCalendar();
            break;
        case 'analytics':
            initializeAnalytics();
            break;
        case 'exercises':
            initializeExercises();
            break;
        case 'settings':
            initializeSettings();
            break;
        case 'help':
            initializeHelp();
            break;
    }
}

// Initialize dashboard
function initializeDashboard() {
    // Load dashboard data
    loadDashboardData();
    
    // Muscle part click handlers
    document.querySelectorAll('.muscle-part').forEach(part => {
        part.addEventListener('click', () => {
            const muscle = part.dataset.muscle;
            console.log(`Clicked muscle part: ${muscle}`);
            // Add muscle part specific functionality here
        });
    });
}

// Load dashboard data
async function loadDashboardData() {
    try {
        // Load recommendations
        await loadRecommendations();
        
        // Load muscle recovery data
        await loadMuscleRecoveryData();
        
        // Load recent workouts
        await loadRecentWorkouts();
        
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        showNotification('データの読み込みに失敗しました', 'error');
    }
}

// Load recommendations
async function loadRecommendations() {
    const container = document.getElementById('today-recommendations');
    if (!container) return;
    
    try {
        // TODO: Replace with actual API call
        const recommendations = await getRecommendations();
        
        container.innerHTML = recommendations.map(rec => `
            <div class="flex items-center space-x-3 p-3 ${rec.bgColor} rounded-lg">
                <div class="w-3 h-3 ${rec.dotColor} rounded-full"></div>
                <span class="${rec.textColor}">${rec.message}</span>
            </div>
        `).join('');
        
    } catch (error) {
        container.innerHTML = `
            <div class="text-center text-gray-500 py-4">
                <i class="fas fa-exclamation-triangle text-xl mb-2"></i>
                <p>おすすめの読み込みに失敗しました</p>
            </div>
        `;
    }
}

// Load muscle recovery data
async function loadMuscleRecoveryData() {
    const container = document.getElementById('muscle-recovery-grid');
    if (!container) return;
    
    try {
        // TODO: Replace with actual API call
        const muscleData = await getMuscleRecoveryData();
        
        container.innerHTML = muscleData.map(muscle => `
            <div class="muscle-card muscle-part rounded-lg p-6" data-muscle="${muscle.id}">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="text-lg font-semibold text-gray-800">
                        <i class="fas fa-male ${muscle.iconColor} mr-2"></i>
                        <span data-i18n="muscle.${muscle.id}">${muscle.name}</span>
                    </h3>
                    <span class="text-sm text-gray-500">最終: ${muscle.lastTrained}</span>
                </div>
                <div class="mb-3">
                    <div class="flex justify-between text-sm mb-1">
                        <span data-i18n="dashboard.recovery">回復度</span>
                        <span class="font-semibold ${muscle.recoveryColor}">${muscle.recovery}%</span>
                    </div>
                    <div class="recovery-bar ${muscle.recoveryClass} rounded-full" style="width: ${muscle.recovery}%;"></div>
                </div>
                <div class="text-sm text-gray-600">次回推奨: ${muscle.nextRecommended}</div>
            </div>
        `).join('');
        
    } catch (error) {
        container.innerHTML = `
            <div class="text-center text-gray-500 py-8">
                <i class="fas fa-exclamation-triangle text-xl mb-2"></i>
                <p>回復度データの読み込みに失敗しました</p>
            </div>
        `;
    }
}

// Load recent workouts
async function loadRecentWorkouts() {
    const container = document.getElementById('recent-workouts');
    if (!container) return;
    
    try {
        // TODO: Replace with actual API call
        const workouts = await getRecentWorkouts();
        
        if (workouts.length === 0) {
            container.innerHTML = `
                <div class="text-center text-gray-500 py-4">
                    <i class="fas fa-info-circle text-xl mb-2"></i>
                    <p>まだワークアウトが記録されていません</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = workouts.map(workout => `
            <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div class="flex items-center space-x-3 flex-1">
                    <div class="workout-dot ${workout.color}"></div>
                    <div class="flex-1">
                        <div class="font-medium text-gray-800">${workout.name}</div>
                        <div class="text-sm text-gray-500 mb-1">${workout.exercises}</div>
                        <div class="flex items-center space-x-4 text-xs text-gray-400">
                            <span><i class="fas fa-clock mr-1"></i>${workout.duration}</span>
                            <span><i class="fas fa-dumbbell mr-1"></i>${workout.totalSets}セット</span>
                            <span><i class="fas fa-weight-hanging mr-1"></i>最大${workout.maxWeight}</span>
                        </div>
                    </div>
                </div>
                <div class="text-right">
                    <div class="text-sm font-medium text-gray-700">${formatWorkoutDate(workout.date)}</div>
                    <div class="text-xs text-gray-400">${getDaysAgo(workout.date)}</div>
                </div>
            </div>
        `).join('');

        function formatWorkoutDate(dateStr) {
            const d = new Date(dateStr);
            return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
        }
        function getDaysAgo(dateStr) {
            const d = new Date(dateStr);
            const now = new Date();
            const diff = Math.floor((now - d) / (1000 * 60 * 60 * 24));
            if (diff === 0) return '今日';
            if (diff === 1) return '昨日';
            return `${diff}日前`;
        }
        
    } catch (error) {
        container.innerHTML = `
            <div class="text-center text-gray-500 py-4">
                <i class="fas fa-exclamation-triangle text-xl mb-2"></i>
                <p>最近のワークアウトの読み込みに失敗しました</p>
            </div>
        `;
    }
}

// Mock API functions (replace with actual API calls)
async function getRecommendations() {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Return empty array for now - will be replaced with actual data
    return [];
}

async function getMuscleRecoveryData() {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Return empty array for now - will be replaced with actual data
    return [];
}

async function getRecentWorkouts() {
    if (!supabase || !currentUser) {
        return [];
    }
    try {
        const { data, error } = await supabase
            .from('workouts')
            .select('*')
            .eq('user_id', currentUser.id)
            .order('date', { ascending: false })
            .limit(5);
        if (error) throw error;
        // データ整形（必要に応じて）
        return data.map(workout => {
            let exercises = [];
            try {
                exercises = JSON.parse(workout.exercises || '[]');
            } catch (e) {
                exercises = [];
            }
            let color = 'chest-color';
            if (workout.name.includes('背筋')) color = 'back-color';
            else if (workout.name.includes('肩')) color = 'shoulder-color';
            else if (workout.name.includes('腕')) color = 'arm-color';
            else if (workout.name.includes('脚')) color = 'leg-color';
            else if (workout.name.includes('体幹')) color = 'core-color';
            return {
                id: workout.id,
                name: workout.name,
                exercises: Array.isArray(exercises) ? exercises.join(', ') : exercises,
                date: workout.date,
                color: color,
                duration: workout.duration || '0分',
                totalSets: workout.total_sets || 0,
                maxWeight: workout.max_weight || '0kg'
            };
        });
    } catch (error) {
        console.error('Error fetching recent workouts:', error);
        showNotification('最近のワークアウトの取得に失敗しました', 'error');
        return [];
    }
}

// Initialize workout page
function initializeWorkout() {
    // Load workout data
    loadWorkoutData();
    // ワークアウト履歴も明示的に更新
    loadWorkoutHistory();
    // Initialize workout timer and controls
    initializeWorkoutControls();
}

// Initialize workout controls
function initializeWorkoutControls() {
    const stopWorkoutBtn = document.getElementById('stop-workout');
    if (stopWorkoutBtn) {
        stopWorkoutBtn.addEventListener('click', stopWorkout);
    }
}

// Start workout
function startWorkout(muscleGroup) {
    console.log(`Starting workout for: ${muscleGroup}`);
    
    // Show current workout section
    const currentWorkoutElement = document.getElementById('current-workout');
    if (currentWorkoutElement) {
        currentWorkoutElement.classList.remove('hidden');
    }
    
    // Start timer
    startWorkoutTimer();
    
    // Set current workout
    currentWorkout = {
        muscleGroup: muscleGroup,
        startTime: new Date(),
        exercises: []
    };
    
    // Load exercises for muscle group
    loadExercisesForMuscleGroup(muscleGroup);
    
    showNotification(`${muscleGroup}のワークアウトを開始しました`, 'success');
}

// Stop workout
function stopWorkout() {
    console.log('Stopping workout');
    // Stop timer
    stopWorkoutTimer();
    // Hide current workout section
    const currentWorkoutElement = document.getElementById('current-workout');
    if (currentWorkoutElement) {
        currentWorkoutElement.classList.add('hidden');
    }
    // Save workout data
    if (currentWorkout) {
        saveWorkoutData().then(() => {
            loadWorkoutHistory();
        });
    }
    // Reset current workout
    currentWorkout = null;
    showNotification('ワークアウトを終了しました', 'success');
}

// Start workout timer
function startWorkoutTimer() {
    workoutStartTime = new Date();
    workoutTimer = setInterval(updateWorkoutTimer, 1000);
}

// Stop workout timer
function stopWorkoutTimer() {
    if (workoutTimer) {
        clearInterval(workoutTimer);
        workoutTimer = null;
    }
}

// Update workout timer display
function updateWorkoutTimer() {
    if (!workoutStartTime) return;
    
    const now = new Date();
    const diff = now - workoutStartTime;
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    
    const timerDisplay = document.getElementById('workout-timer');
    if (timerDisplay) {
        timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
}

// Load exercises for muscle group
async function loadExercisesForMuscleGroup(muscleGroup) {
    const container = document.getElementById('workout-exercises');
    if (!container) return;
    
    try {
        const exercises = await getExercisesForMuscleGroup(muscleGroup);
        
        container.innerHTML = exercises.map(exercise => `
            <div class="exercise-item bg-gray-50 rounded-lg p-4">
                <div class="flex items-center justify-between mb-3">
                    <h4 class="font-medium text-gray-800">${exercise.name}</h4>
                    <button class="text-blue-600 hover:text-blue-800 text-sm">
                        <i class="fas fa-plus mr-1"></i>追加
                    </button>
                </div>
                <div class="grid grid-cols-3 gap-2 text-sm">
                    <div>
                        <label class="block text-gray-600 mb-1">セット</label>
                        <input type="number" class="w-full border border-gray-300 rounded px-2 py-1" min="1" max="10" value="3">
                    </div>
                    <div>
                        <label class="block text-gray-600 mb-1">重量(kg)</label>
                        <input type="number" class="w-full border border-gray-300 rounded px-2 py-1" min="0" step="0.5">
                    </div>
                    <div>
                        <label class="block text-gray-600 mb-1">回数</label>
                        <input type="number" class="w-full border border-gray-300 rounded px-2 py-1" min="1" max="50" value="10">
                    </div>
                </div>
            </div>
        `).join('');
        
    } catch (error) {
        container.innerHTML = `
            <div class="text-center text-gray-500 py-4">
                <i class="fas fa-exclamation-triangle text-xl mb-2"></i>
                <p>エクササイズの読み込みに失敗しました</p>
            </div>
        `;
    }
}

// Save workout data
async function saveWorkoutData() {
    if (!currentWorkout || !supabase || !currentUser) return;
    
    try {
        // Calculate workout duration
        const endTime = new Date();
        const duration = Math.floor((endTime - currentWorkout.startTime) / 60000); // minutes
        
        // Prepare workout data
        const workoutData = {
            user_id: currentUser.id,
            date: new Date().toISOString().split('T')[0],
            name: `${currentWorkout.muscleGroup}トレーニング`,
            exercises: JSON.stringify(currentWorkout.exercises || []),
            duration: `${duration}分`,
            total_sets: currentWorkout.exercises?.length || 0,
            max_weight: '0kg' // TODO: Calculate from exercises
        };
        
        // Save to Supabase
        const { data, error } = await supabase
            .from('workouts')
            .insert([workoutData]);
            
        if (error) throw error;
        
        console.log('Workout saved:', data);
        showNotification('ワークアウトデータを保存しました', 'success');
        
        // Refresh workout history
        await loadWorkoutHistory();
        
    } catch (error) {
        console.error('Error saving workout data:', error);
        showNotification('ワークアウトデータの保存に失敗しました', 'error');
    }
}

// Load workout data
async function loadWorkoutData() {
    try {
        // Load quick start buttons
        await loadQuickStartButtons();
        
        // Load workout history
        await loadWorkoutHistory();
        
    } catch (error) {
        console.error('Error loading workout data:', error);
        showNotification('ワークアウトデータの読み込みに失敗しました', 'error');
    }
}

// Load quick start buttons
async function loadQuickStartButtons() {
    const container = document.getElementById('quick-start-grid');
    if (!container) return;
    
    try {
        // TODO: Replace with actual API call
        const muscleGroups = await getMuscleGroups();
        
        container.innerHTML = muscleGroups.map(muscle => `
            <button class="quick-start-btn flex flex-col items-center space-y-2 p-4 ${muscle.bgColor} hover:${muscle.hoverColor} rounded-lg transition-colors" data-muscle="${muscle.id}">
                <i class="fas fa-male ${muscle.iconColor} text-2xl"></i>
                <span class="text-sm font-medium ${muscle.textColor}" data-i18n="muscle.${muscle.id}">${muscle.name}</span>
            </button>
        `).join('');
        
        // Re-attach event listeners
        document.querySelectorAll('.quick-start-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const muscle = btn.dataset.muscle;
                startWorkout(muscle);
            });
        });
        
    } catch (error) {
        container.innerHTML = `
            <div class="text-center text-gray-500 py-4">
                <i class="fas fa-exclamation-triangle text-xl mb-2"></i>
                <p>クイックスタートボタンの読み込みに失敗しました</p>
            </div>
        `;
    }
}

// Load workout history
async function loadWorkoutHistory() {
    const container = document.getElementById('workout-history');
    if (!container) return;
    
    try {
        // TODO: Replace with actual API call
        const workouts = await getWorkoutHistory();
        
        if (workouts.length === 0) {
            container.innerHTML = `
                <div class="text-center text-gray-500 py-4">
                    <i class="fas fa-info-circle text-xl mb-2"></i>
                    <p>まだワークアウト履歴がありません</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = workouts.map(workout => `
            <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div class="flex items-center space-x-3 flex-1">
                    <div class="workout-dot ${workout.color}"></div>
                    <div class="flex-1">
                        <div class="font-medium text-gray-800">${workout.name}</div>
                        <div class="text-sm text-gray-500 mb-1">${workout.exercises}</div>
                        <div class="flex items-center space-x-4 text-xs text-gray-400">
                            <span><i class="fas fa-clock mr-1"></i>${workout.duration}</span>
                            <span><i class="fas fa-dumbbell mr-1"></i>${workout.totalSets}セット</span>
                            <span><i class="fas fa-weight-hanging mr-1"></i>最大${workout.maxWeight}</span>
                        </div>
                    </div>
                </div>
                <div class="text-right">
                    <div class="text-sm font-medium text-gray-700">${formatWorkoutDate(workout.date)}</div>
                    <div class="text-xs text-gray-400">${getDaysAgo(workout.date)}</div>
                </div>
            </div>
        `).join('');

        function formatWorkoutDate(dateStr) {
            const d = new Date(dateStr);
            return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
        }
        function getDaysAgo(dateStr) {
            const d = new Date(dateStr);
            const now = new Date();
            const diff = Math.floor((now - d) / (1000 * 60 * 60 * 24));
            if (diff === 0) return '今日';
            if (diff === 1) return '昨日';
            return `${diff}日前`;
        }
        
    } catch (error) {
        container.innerHTML = `
            <div class="text-center text-gray-500 py-4">
                <i class="fas fa-exclamation-triangle text-xl mb-2"></i>
                <p>ワークアウト履歴の読み込みに失敗しました</p>
            </div>
        `;
    }
}

// Mock API functions for workout data
async function getMuscleGroups() {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Return mock muscle groups data
    return [
        {
            id: 'chest',
            name: '胸筋',
            bgColor: 'bg-red-100',
            hoverColor: 'bg-red-200',
            iconColor: 'text-red-500',
            textColor: 'text-red-700'
        },
        {
            id: 'back',
            name: '背筋',
            bgColor: 'bg-green-100',
            hoverColor: 'bg-green-200',
            iconColor: 'text-green-500',
            textColor: 'text-green-700'
        },
        {
            id: 'shoulder',
            name: '肩',
            bgColor: 'bg-yellow-100',
            hoverColor: 'bg-yellow-200',
            iconColor: 'text-yellow-500',
            textColor: 'text-yellow-700'
        },
        {
            id: 'arm',
            name: '腕',
            bgColor: 'bg-purple-100',
            hoverColor: 'bg-purple-200',
            iconColor: 'text-purple-500',
            textColor: 'text-purple-700'
        },
        {
            id: 'leg',
            name: '脚',
            bgColor: 'bg-blue-100',
            hoverColor: 'bg-blue-200',
            iconColor: 'text-blue-500',
            textColor: 'text-blue-700'
        },
        {
            id: 'core',
            name: '体幹',
            bgColor: 'bg-pink-100',
            hoverColor: 'bg-pink-200',
            iconColor: 'text-pink-500',
            textColor: 'text-pink-700'
        }
    ];
}

async function getWorkoutHistory() {
    if (!supabase || !currentUser) {
        console.log('Supabase or user not available, returning empty array');
        return [];
    }
    
    try {
        // Get workout history from Supabase
        const { data, error } = await supabase
            .from('workouts')
            .select('*')
            .eq('user_id', currentUser.id)
            .order('date', { ascending: false })
            .limit(20); // Limit to last 20 workouts
            
        if (error) throw error;
        
        // Transform data to match display format
        return data.map(workout => {
            // Parse exercises JSON and convert to display format
            let exercises = [];
            try {
                exercises = JSON.parse(workout.exercises || '[]');
            } catch (e) {
                exercises = [];
            }
            
            // Determine color based on workout name
            let color = 'chest-color';
            if (workout.name.includes('背筋')) color = 'back-color';
            else if (workout.name.includes('肩')) color = 'shoulder-color';
            else if (workout.name.includes('腕')) color = 'arm-color';
            else if (workout.name.includes('脚')) color = 'leg-color';
            else if (workout.name.includes('体幹')) color = 'core-color';
            
            return {
                id: workout.id,
                name: workout.name,
                exercises: Array.isArray(exercises) ? exercises.join(', ') : exercises,
                date: workout.date,
                color: color,
                duration: workout.duration || '0分',
                totalSets: workout.total_sets || 0,
                maxWeight: workout.max_weight || '0kg'
            };
        });
        
    } catch (error) {
        console.error('Error fetching workout history:', error);
        showNotification('ワークアウト履歴の取得に失敗しました', 'error');
        return [];
    }
}

// Get exercises for muscle group
async function getExercisesForMuscleGroup(muscleGroup) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const exercises = {
        chest: [
            { id: 1, name: 'ベンチプレス', category: 'compound' },
            { id: 2, name: 'インクラインプレス', category: 'compound' },
            { id: 3, name: 'ディップス', category: 'compound' },
            { id: 4, name: 'ダンベルフライ', category: 'isolation' },
            { id: 5, name: 'ケーブルクロスオーバー', category: 'isolation' }
        ],
        back: [
            { id: 6, name: 'デッドリフト', category: 'compound' },
            { id: 7, name: 'ラットプルダウン', category: 'compound' },
            { id: 8, name: 'ロウ', category: 'compound' },
            { id: 9, name: 'プルアップ', category: 'compound' },
            { id: 10, name: 'シーテッドロウ', category: 'compound' }
        ],
        shoulder: [
            { id: 11, name: 'ショルダープレス', category: 'compound' },
            { id: 12, name: 'サイドレイズ', category: 'isolation' },
            { id: 13, name: 'リアデルトフライ', category: 'isolation' },
            { id: 14, name: 'フロントレイズ', category: 'isolation' }
        ],
        arm: [
            { id: 15, name: 'バーベルカール', category: 'isolation' },
            { id: 16, name: 'ダンベルカール', category: 'isolation' },
            { id: 17, name: 'トライセップスプッシュダウン', category: 'isolation' },
            { id: 18, name: 'オーバーヘッドエクステンション', category: 'isolation' }
        ],
        leg: [
            { id: 19, name: 'スクワット', category: 'compound' },
            { id: 20, name: 'レッグプレス', category: 'compound' },
            { id: 21, name: 'カーフレイズ', category: 'isolation' },
            { id: 22, name: 'レッグエクステンション', category: 'isolation' },
            { id: 23, name: 'レッグカール', category: 'isolation' }
        ],
        core: [
            { id: 24, name: 'クランチ', category: 'isolation' },
            { id: 25, name: 'プランク', category: 'isolation' },
            { id: 26, name: 'サイドプランク', category: 'isolation' },
            { id: 27, name: 'レッグレイズ', category: 'isolation' }
        ]
    };
    
    return exercises[muscleGroup] || [];
}

// Get calendar events
async function getCalendarEvents() {
    if (!supabase || !currentUser) return [];
    try {
        const { data, error } = await supabase
            .from('workouts')
            .select('*')
            .eq('user_id', currentUser.id);
        if (error) throw error;
        // カレンダー用に日付・種目などを整形
        return data.map(workout => ({
            date: workout.date,
            name: workout.name,
            id: workout.id,
            // 必要に応じて他の情報も
        }));
    } catch (error) {
        console.error('Error fetching calendar events:', error);
        return [];
    }
}

// Get progress data
async function getProgressData() {
    if (!supabase || !currentUser) return [];
    try {
        const { data, error } = await supabase
            .from('workouts')
            .select('date')
            .eq('user_id', currentUser.id);
        if (error) throw error;
        // 日付ごとに集計
        const totalWorkouts = data.length;
        const lastWorkout = data.length > 0 ? data[0].date : null;
        return [
            { label: '総ワークアウト数', value: totalWorkouts },
            { label: '最終ワークアウト日', value: lastWorkout || 'なし' }
        ];
    } catch (error) {
        console.error('Error fetching progress data:', error);
        return [];
    }
}

// Get weekly training data
async function getWeeklyTrainingData() {
    if (!supabase || !currentUser) return [];
    try {
        const { data, error } = await supabase
            .from('workouts')
            .select('date')
            .eq('user_id', currentUser.id);
        if (error) throw error;
        // 直近7日間の日付ごとにカウント
        const today = new Date();
        const week = Array.from({length: 7}, (_, i) => {
            const d = new Date(today);
            d.setDate(today.getDate() - (6 - i));
            return d.toISOString().slice(0, 10);
        });
        const counts = week.map(dateStr =>
            data.filter(w => w.date === dateStr).length
        );
        return { labels: week, data: counts };
    } catch (error) {
        console.error('Error fetching weekly training data:', error);
        return { labels: [], data: [] };
    }
}

// Get muscle distribution data
async function getMuscleDistributionData() {
    if (!supabase || !currentUser) return [];
    try {
        const { data, error } = await supabase
            .from('workouts')
            .select('name')
            .eq('user_id', currentUser.id);
        if (error) throw error;
        // nameから部位名を抽出してカウント
        const parts = {};
        data.forEach(w => {
            const key = w.name.replace('トレーニング', '');
            parts[key] = (parts[key] || 0) + 1;
        });
        return Object.entries(parts).map(([label, value]) => ({ label, value }));
    } catch (error) {
        console.error('Error fetching muscle distribution data:', error);
        return [];
    }
}

// Get performance metrics
async function getPerformanceMetrics() {
    if (!supabase || !currentUser) return [];
    try {
        const { data, error } = await supabase
            .from('workouts')
            .select('total_sets, max_weight')
            .eq('user_id', currentUser.id);
        if (error) throw error;
        // 合計セット数・最大重量
        const totalSets = data.reduce((sum, w) => sum + (w.total_sets || 0), 0);
        const maxWeight = data.reduce((max, w) => {
            const num = parseFloat((w.max_weight || '0').replace('kg',''));
            return num > max ? num : max;
        }, 0);
        return [
            { label: '総セット数', value: totalSets },
            { label: '最大重量(kg)', value: maxWeight }
        ];
    } catch (error) {
        console.error('Error fetching performance metrics:', error);
        return [];
    }
}

// Get exercises for category
async function getExercisesForCategory(category) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const exercises = {
        chest: [
            {
                id: 1,
                name: 'ベンチプレス',
                category: 'compound',
                description: '大胸筋を鍛える基本的な複合エクササイズ',
                muscles: '大胸筋、三角筋前部、上腕三頭筋',
                difficulty: '中級'
            },
            {
                id: 2,
                name: 'インクラインプレス',
                category: 'compound',
                description: '大胸筋上部を重点的に鍛える',
                muscles: '大胸筋上部、三角筋前部',
                difficulty: '中級'
            },
            {
                id: 3,
                name: 'ディップス',
                category: 'compound',
                description: '自重で大胸筋下部を鍛える',
                muscles: '大胸筋下部、上腕三頭筋',
                difficulty: '初級'
            },
            {
                id: 4,
                name: 'ダンベルフライ',
                category: 'isolation',
                description: '大胸筋を単独で鍛える単関節エクササイズ',
                muscles: '大胸筋',
                difficulty: '初級'
            }
        ],
        back: [
            {
                id: 5,
                name: 'デッドリフト',
                category: 'compound',
                description: '全身を鍛える基本的な複合エクササイズ',
                muscles: '広背筋、脊柱起立筋、臀筋',
                difficulty: '上級'
            },
            {
                id: 6,
                name: 'ラットプルダウン',
                category: 'compound',
                description: '広背筋を鍛える基本的なエクササイズ',
                muscles: '広背筋、上腕二頭筋',
                difficulty: '初級'
            },
            {
                id: 7,
                name: 'ロウ',
                category: 'compound',
                description: '背中の厚みを作るエクササイズ',
                muscles: '広背筋、菱形筋',
                difficulty: '中級'
            }
        ],
        shoulder: [
            {
                id: 8,
                name: 'ショルダープレス',
                category: 'compound',
                description: '三角筋全体を鍛える基本的なエクササイズ',
                muscles: '三角筋前部・中部、上腕三頭筋',
                difficulty: '中級'
            },
            {
                id: 9,
                name: 'サイドレイズ',
                category: 'isolation',
                description: '三角筋中部を重点的に鍛える',
                muscles: '三角筋中部',
                difficulty: '初級'
            }
        ],
        arm: [
            {
                id: 10,
                name: 'バーベルカール',
                category: 'isolation',
                description: '上腕二頭筋を鍛える基本的なエクササイズ',
                muscles: '上腕二頭筋',
                difficulty: '初級'
            },
            {
                id: 11,
                name: 'トライセップスプッシュダウン',
                category: 'isolation',
                description: '上腕三頭筋を鍛えるエクササイズ',
                muscles: '上腕三頭筋',
                difficulty: '初級'
            }
        ],
        leg: [
            {
                id: 12,
                name: 'スクワット',
                category: 'compound',
                description: '脚を鍛える基本的な複合エクササイズ',
                muscles: '大腿四頭筋、臀筋、ハムストリング',
                difficulty: '中級'
            },
            {
                id: 13,
                name: 'レッグプレス',
                category: 'compound',
                description: 'マシンで脚を鍛えるエクササイズ',
                muscles: '大腿四頭筋、臀筋',
                difficulty: '初級'
            }
        ],
        core: [
            {
                id: 14,
                name: 'クランチ',
                category: 'isolation',
                description: '腹直筋を鍛える基本的なエクササイズ',
                muscles: '腹直筋',
                difficulty: '初級'
            },
            {
                id: 15,
                name: 'プランク',
                category: 'isolation',
                description: '体幹を安定させる静的エクササイズ',
                muscles: '腹直筋、腹斜筋、脊柱起立筋',
                difficulty: '初級'
            }
        ]
    };
    
    return exercises[category] || [];
}

// Initialize calendar page
function initializeCalendar() {
    console.log('Calendar page initialized');
    
    // Initialize calendar controls
    initializeCalendarControls();
    
    // Load calendar data
    loadCalendarData();
}

// Initialize calendar controls
function initializeCalendarControls() {
    const prevMonthBtn = document.getElementById('prev-month');
    const nextMonthBtn = document.getElementById('next-month');
    
    if (prevMonthBtn) {
        prevMonthBtn.addEventListener('click', () => {
            changeMonth(-1);
        });
    }
    
    if (nextMonthBtn) {
        nextMonthBtn.addEventListener('click', () => {
            changeMonth(1);
        });
    }
}

// Calendar state
let currentCalendarDate = new Date();
let calendarData = {};

// Change month
function changeMonth(delta) {
    currentCalendarDate.setMonth(currentCalendarDate.getMonth() + delta);
    loadCalendarData();
}

// Load calendar data
async function loadCalendarData() {
    try {
        // Update month display
        updateMonthDisplay();
        
        // Generate calendar days
        generateCalendarDays();
        
        // Load workout events
        await loadWorkoutEvents();
        
    } catch (error) {
        console.error('Error loading calendar data:', error);
        showNotification('カレンダーデータの読み込みに失敗しました', 'error');
    }
}

// Update month display
function updateMonthDisplay() {
    const monthDisplay = document.querySelector('[data-i18n="calendar.month"]');
    if (monthDisplay) {
        const year = currentCalendarDate.getFullYear();
        const month = currentCalendarDate.getMonth() + 1;
        monthDisplay.textContent = `${year}年${month}月`;
    }
}

// Generate calendar days
function generateCalendarDays() {
    const container = document.getElementById('calendar-days');
    if (!container) return;
    
    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();
    
    // Get first day of month and number of days
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    let html = '';
    
    // Generate 6 weeks of days
    for (let week = 0; week < 6; week++) {
        for (let day = 0; day < 7; day++) {
            const currentDate = new Date(startDate);
            currentDate.setDate(startDate.getDate() + (week * 7) + day);
            
            const isCurrentMonth = currentDate.getMonth() === month;
            const isToday = isTodayDate(currentDate);
            const hasWorkout = hasWorkoutOnDate(currentDate);
            
            const dayClass = `p-2 text-center text-sm border border-gray-200 ${
                isCurrentMonth ? 'bg-white' : 'bg-gray-50 text-gray-400'
            } ${isToday ? 'bg-blue-100 font-bold' : ''} ${
                hasWorkout ? 'workout-day' : ''
            }`;
            
            html += `
                <div class="${dayClass}" data-date="${currentDate.toISOString().split('T')[0]}">
                    <div class="relative">
                        ${currentDate.getDate()}
                        ${hasWorkout ? '<div class="workout-dot absolute -top-1 -right-1"></div>' : ''}
                    </div>
                </div>
            `;
        }
    }
    
    container.innerHTML = html;
    
    // Add click handlers for days
    container.querySelectorAll('[data-date]').forEach(day => {
        day.addEventListener('click', () => {
            const date = day.dataset.date;
            showDayDetails(date);
        });
    });
}

// Check if date is today
function isTodayDate(date) {
    const today = new Date();
    return date.toDateString() === today.toDateString();
}

// Check if date has workout
function hasWorkoutOnDate(date) {
    const dateString = date.toISOString().split('T')[0];
    return calendarData[dateString] && calendarData[dateString].length > 0;
}

// Load workout events
async function loadWorkoutEvents() {
    try {
        // TODO: Replace with actual API call
        const events = await getCalendarEvents();
        
        // Process events
        calendarData = {};
        events.forEach(event => {
            const date = event.date;
            if (!calendarData[date]) {
                calendarData[date] = [];
            }
            calendarData[date].push(event);
        });
        
        // Regenerate calendar to show events
        generateCalendarDays();
        
    } catch (error) {
        console.error('Error loading workout events:', error);
    }
}

// Show day details
function showDayDetails(date) {
    const events = calendarData[date] || [];
    
    // Create modal or update existing UI
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.innerHTML = `
        <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div class="flex items-center justify-between mb-4">
                <h3 class="text-lg font-semibold">${formatDate(date)}</h3>
                <button class="text-gray-500 hover:text-gray-700" onclick="this.closest('.fixed').remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="space-y-3">
                ${events.length > 0 ? 
                    events.map(event => `
                        <div class="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                            <div class="workout-dot ${event.color}"></div>
                            <div>
                                <div class="font-medium">${event.name}</div>
                                <div class="text-sm text-gray-500">${event.exercises}</div>
                            </div>
                        </div>
                    `).join('') :
                    '<p class="text-gray-500 text-center py-4">予定はありません</p>'
                }
            </div>
            <div class="mt-4 flex space-x-2">
                <button class="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">
                    ワークアウト追加
                </button>
                <button class="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400">
                    閉じる
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Close modal when clicking outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

// Format date for display
function formatDate(dateString) {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const dayOfWeek = ['日', '月', '火', '水', '木', '金', '土'][date.getDay()];
    
    return `${year}年${month}月${day}日 (${dayOfWeek})`;
}

// Initialize analytics page
function initializeAnalytics() {
    console.log('Analytics page initialized');
    
    // Load analytics data
    loadAnalyticsData();
}

// Load analytics data
async function loadAnalyticsData() {
    try {
        // Load progress overview
        await loadProgressOverview();
        
        // Load charts
        await loadCharts();
        
        // Load performance metrics
        await loadPerformanceMetrics();
        
    } catch (error) {
        console.error('Error loading analytics data:', error);
        showNotification('分析データの読み込みに失敗しました', 'error');
    }
}

// Load progress overview
async function loadProgressOverview() {
    const container = document.getElementById('progress-overview');
    if (!container) return;
    
    try {
        const progressData = await getProgressData();
        
        container.innerHTML = progressData.map(metric => `
            <div class="muscle-card rounded-lg p-6 text-center">
                <div class="text-3xl font-bold ${metric.color} mb-2">${metric.value}</div>
                <div class="text-gray-600 mb-1">${metric.label}</div>
                <div class="text-sm ${metric.trend > 0 ? 'text-green-500' : 'text-red-500'}">
                    ${metric.trend > 0 ? '+' : ''}${metric.trend}% 先週比
                </div>
            </div>
        `).join('');
        
    } catch (error) {
        container.innerHTML = `
            <div class="text-center text-gray-500 py-8">
                <i class="fas fa-exclamation-triangle text-xl mb-2"></i>
                <p>進捗データの読み込みに失敗しました</p>
            </div>
        `;
    }
}

// Load charts
async function loadCharts() {
    try {
        // Load weekly training frequency chart
        await loadWeeklyChart();
        
        // Load muscle group distribution chart
        await loadMuscleChart();
        
    } catch (error) {
        console.error('Error loading charts:', error);
    }
}

// Load weekly chart
async function loadWeeklyChart() {
    const canvas = document.getElementById('weekly-chart');
    if (!canvas) return;
    
    try {
        const weeklyData = await getWeeklyTrainingData();
        
        // Create chart using Chart.js (if available)
        if (window.Chart) {
            new Chart(canvas, {
                type: 'line',
                data: {
                    labels: weeklyData.labels,
                    datasets: [{
                        label: 'トレーニング回数',
                        data: weeklyData.data,
                        borderColor: 'rgb(59, 130, 246)',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            display: false
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                stepSize: 1
                            }
                        }
                    }
                }
            });
        } else {
            // Fallback if Chart.js is not available
            canvas.style.display = 'none';
            canvas.parentElement.innerHTML = `
                <div class="text-center text-gray-500 py-8">
                    <i class="fas fa-chart-line text-xl mb-2"></i>
                    <p>チャート機能は利用できません</p>
                </div>
            `;
        }
        
    } catch (error) {
        console.error('Error loading weekly chart:', error);
    }
}

// Load muscle chart
async function loadMuscleChart() {
    const canvas = document.getElementById('muscle-chart');
    if (!canvas) return;
    
    try {
        const muscleData = await getMuscleDistributionData();
        
        // Create chart using Chart.js (if available)
        if (window.Chart) {
            new Chart(canvas, {
                type: 'doughnut',
                data: {
                    labels: muscleData.map(d => d.label),
                    datasets: [{
                        data: muscleData.map(d => d.value),
                        backgroundColor: [
                            '#ef4444', '#10b981', '#f59e0b',
                            '#8b5cf6', '#3b82f6', '#ec4899'
                        ]
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            position: 'bottom'
                        }
                    }
                }
            });
        } else {
            // Fallback if Chart.js is not available
            canvas.style.display = 'none';
            canvas.parentElement.innerHTML = `
                <div class="text-center text-gray-500 py-8">
                    <i class="fas fa-chart-pie text-xl mb-2"></i>
                    <p>チャート機能は利用できません</p>
                </div>
            `;
        }
        
    } catch (error) {
        console.error('Error loading muscle chart:', error);
    }
}

// Load performance metrics
async function loadPerformanceMetrics() {
    const container = document.getElementById('performance-metrics');
    if (!container) return;
    
    try {
        const metrics = await getPerformanceMetrics();
        
        container.innerHTML = metrics.map(metric => `
            <div class="text-center p-4 bg-gray-50 rounded-lg">
                <div class="text-2xl font-bold text-gray-800 mb-1">${metric.value}</div>
                <div class="text-sm text-gray-600">${metric.label}</div>
                <div class="text-xs text-gray-500 mt-1">${metric.description}</div>
            </div>
        `).join('');
        
    } catch (error) {
        container.innerHTML = `
            <div class="text-center text-gray-500 py-4">
                <i class="fas fa-exclamation-triangle text-xl mb-2"></i>
                <p>パフォーマンス指標の読み込みに失敗しました</p>
            </div>
        `;
    }
}

// Initialize exercises page
function initializeExercises() {
    console.log('Exercises page initialized');
    
    // Initialize exercise category handlers
    initializeExerciseCategories();
}

// Initialize exercise categories
function initializeExerciseCategories() {
    // Add click handlers for exercise categories
    document.querySelectorAll('[data-category]').forEach(category => {
        category.addEventListener('click', () => {
            const categoryName = category.dataset.category;
            showExerciseList(categoryName);
        });
    });
    
    // Add back button handler
    const backBtn = document.getElementById('back-to-categories');
    if (backBtn) {
        backBtn.addEventListener('click', showExerciseCategories);
    }
}

// Show exercise list for category
async function showExerciseList(category) {
    const categoryContainer = document.querySelector('.grid.grid-cols-1.md\\:grid-cols-2.lg\\:grid-cols-3');
    const listContainer = document.getElementById('exercise-list');
    
    if (!categoryContainer || !listContainer) return;
    
    try {
        // Hide categories, show list
        categoryContainer.classList.add('hidden');
        listContainer.classList.remove('hidden');
        
        // Update title
        const title = document.getElementById('exercise-category-title');
        if (title) {
            const categoryNames = {
                chest: '胸筋',
                back: '背筋',
                shoulder: '肩',
                arm: '腕',
                leg: '脚',
                core: '体幹'
            };
            title.textContent = `${categoryNames[category]}エクササイズ`;
        }
        
        // Load exercises
        await loadExercisesForCategory(category);
        
    } catch (error) {
        console.error('Error showing exercise list:', error);
        showNotification('エクササイズリストの読み込みに失敗しました', 'error');
    }
}

// Show exercise categories
function showExerciseCategories() {
    const categoryContainer = document.querySelector('.grid.grid-cols-1.md\\:grid-cols-2.lg\\:grid-cols-3');
    const listContainer = document.getElementById('exercise-list');
    
    if (!categoryContainer || !listContainer) return;
    
    // Show categories, hide list
    categoryContainer.classList.remove('hidden');
    listContainer.classList.add('hidden');
}

// Load exercises for category
async function loadExercisesForCategory(category) {
    const container = document.getElementById('exercise-items');
    if (!container) return;
    
    try {
        const exercises = await getExercisesForCategory(category);
        
        container.innerHTML = exercises.map(exercise => `
            <div class="exercise-item bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                <div class="flex items-center justify-between mb-3">
                    <h4 class="font-medium text-gray-800">${exercise.name}</h4>
                    <span class="text-xs px-2 py-1 rounded-full ${
                        exercise.category === 'compound' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                    }">
                        ${exercise.category === 'compound' ? '複合' : '単関節'}
                    </span>
                </div>
                <p class="text-sm text-gray-600 mb-3">${exercise.description}</p>
                <div class="grid grid-cols-2 gap-2 text-xs text-gray-500">
                    <div>
                        <span class="font-medium">主な筋肉:</span> ${exercise.muscles}
                    </div>
                    <div>
                        <span class="font-medium">難易度:</span> ${exercise.difficulty}
                    </div>
                </div>
                <div class="mt-3 flex space-x-2">
                    <button class="flex-1 bg-blue-600 text-white py-2 rounded text-sm hover:bg-blue-700 transition-colors">
                        <i class="fas fa-plus mr-1"></i>ワークアウトに追加
                    </button>
                    <button class="px-3 py-2 text-gray-600 hover:text-gray-800 transition-colors">
                        <i class="fas fa-info-circle"></i>
                    </button>
                </div>
            </div>
        `).join('');
        
    } catch (error) {
        container.innerHTML = `
            <div class="text-center text-gray-500 py-8">
                <i class="fas fa-exclamation-triangle text-xl mb-2"></i>
                <p>エクササイズの読み込みに失敗しました</p>
            </div>
        `;
    }
}

// Initialize settings page
function initializeSettings() {
    console.log('Settings page initialized');
    
    // プロフィール編集フォーム初期化
    initializeProfileEdit();
    // Initialize settings controls
    initializeSettingsControls();
    // Load user settings
    loadUserSettings();
}

// プロフィール編集フォーム初期化
function initializeProfileEdit() {
    const form = document.getElementById('profile-edit-form');
    const avatarInput = document.getElementById('profile-avatar');
    const avatarPreview = document.getElementById('profile-avatar-preview');
    const nicknameInput = document.getElementById('profile-nickname');
    const emailInput = document.getElementById('profile-email');
    const messageDiv = document.getElementById('profile-edit-message');

    // プロフィール情報を取得してフォームに反映
    loadUserProfile();

    // アバター画像プレビュー
    if (avatarInput) {
        avatarInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (ev) => {
                    avatarPreview.src = ev.target.result;
                };
                reader.readAsDataURL(file);
            }
        });
    }

    // フォーム送信
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            messageDiv.textContent = '';
            messageDiv.className = 'text-sm mt-2';
            // バリデーション
            if (!nicknameInput.value.trim()) {
                messageDiv.textContent = 'ニックネームを入力してください';
                messageDiv.classList.add('text-red-600');
                return;
            }
            if (!emailInput.value.trim() || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(emailInput.value)) {
                messageDiv.textContent = '正しいメールアドレスを入力してください';
                messageDiv.classList.add('text-red-600');
                return;
            }
            // 保存処理
            messageDiv.textContent = '保存中...';
            messageDiv.classList.remove('text-red-600');
            messageDiv.classList.add('text-gray-600');
            try {
                let avatarUrl = avatarPreview.src;
                if (avatarInput.files[0]) {
                    avatarUrl = await uploadAvatarImage(avatarInput.files[0]);
                }
                await saveUserProfile({
                    nickname: nicknameInput.value.trim(),
                    email: emailInput.value.trim(),
                    avatar_url: avatarUrl
                });
                messageDiv.textContent = 'プロフィールを保存しました';
                messageDiv.classList.remove('text-red-600');
                messageDiv.classList.add('text-green-600');
            } catch (error) {
                messageDiv.textContent = '保存に失敗しました: ' + (error.message || error);
                messageDiv.classList.remove('text-green-600');
                messageDiv.classList.add('text-red-600');
            }
        });
    }
}

// プロフィール情報取得
async function loadUserProfile() {
    if (!supabase || !currentUser) return;
    const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', currentUser.id)
        .maybeSingle(); // 0件でもエラーにしない
    const nicknameInput = document.getElementById('profile-nickname');
    const emailInput = document.getElementById('profile-email');
    const avatarPreview = document.getElementById('profile-avatar-preview');
    if (error) {
        console.error('プロフィール取得エラー', error);
        if (nicknameInput) nicknameInput.value = '';
        if (emailInput) emailInput.value = '';
        if (avatarPreview) avatarPreview.src = 'assets/default-avatar.png';
        return;
    }
    if (!data) {
        if (nicknameInput) nicknameInput.value = '';
        if (emailInput) emailInput.value = '';
        if (avatarPreview) avatarPreview.src = 'assets/default-avatar.png';
        return;
    }
    if (nicknameInput) nicknameInput.value = data.display_name || '';
    if (emailInput) emailInput.value = data.email || '';
    if (avatarPreview && data.avatar_url) avatarPreview.src = data.avatar_url;
}

// プロフィール保存
async function saveUserProfile({ nickname, email, avatar_url }) {
    if (!supabase || !currentUser) throw new Error('認証情報がありません');
    // プロフィールテーブル更新
    const { error } = await supabase
        .from('user_profiles')
        .upsert({
            id: currentUser.id,
            display_name: nickname,
            email: email,
            avatar_url: avatar_url
        });
    if (error) throw error;
    // メールアドレス変更はAuthにも反映
    if (email !== currentUser.email) {
        const { error: authError } = await supabase.auth.updateUser({ email });
        if (authError) throw authError;
    }
}

// アバター画像アップロード
async function uploadAvatarImage(file) {
    if (!supabase || !currentUser) throw new Error('認証情報がありません');
    const fileExt = file.name.split('.').pop();
    const fileName = `${currentUser.id}_${Date.now()}.${fileExt}`;
    const { data, error } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true, contentType: file.type });
    if (error) throw error;
    // 公開URL取得
    const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(fileName);
    return publicUrlData.publicUrl;
}

// Initialize settings controls
function initializeSettingsControls() {
    // Dark mode toggle
    const darkModeToggle = document.querySelector('input[type="checkbox"]');
    if (darkModeToggle) {
        darkModeToggle.addEventListener('change', (e) => {
            toggleDarkMode(e.target.checked);
        });
    }
    
    // Notification toggle
    const notificationToggle = document.querySelectorAll('input[type="checkbox"]')[1];
    if (notificationToggle) {
        notificationToggle.addEventListener('change', (e) => {
            toggleNotifications(e.target.checked);
        });
    }
    
    // Voice guide toggle
    const voiceGuideToggle = document.querySelectorAll('input[type="checkbox"]')[2];
    if (voiceGuideToggle) {
        voiceGuideToggle.addEventListener('change', (e) => {
            toggleVoiceGuide(e.target.checked);
        });
    }
    
    // Data management buttons（textContentで判定）
    const buttons = document.querySelectorAll('button');
    let exportBtn = null, importBtn = null, deleteBtn = null;
    buttons.forEach(btn => {
        if (btn.textContent.includes('データをエクスポート')) exportBtn = btn;
        if (btn.textContent.includes('データをインポート')) importBtn = btn;
        if (btn.textContent.includes('データを削除')) deleteBtn = btn;
    });
    if (exportBtn) {
        exportBtn.addEventListener('click', exportData);
    }
    if (importBtn) {
        importBtn.addEventListener('click', importData);
    }
    if (deleteBtn) {
        deleteBtn.addEventListener('click', deleteData);
    }
}

// Load user settings
async function loadUserSettings() {
    try {
        const settings = await getUserSettings();
        
        // Update form fields
        const displayNameInput = document.querySelector('input[placeholder="あなたの名前"]');
        const emailInput = document.querySelector('input[placeholder="your@email.com"]');
        const goalSelect = document.querySelector('select');
        
        if (displayNameInput && settings.displayName) {
            displayNameInput.value = settings.displayName;
        }
        if (emailInput && settings.email) {
            emailInput.value = settings.email;
        }
        if (goalSelect && settings.goal) {
            goalSelect.value = settings.goal;
        }
        
        // Update toggles
        const toggles = document.querySelectorAll('input[type="checkbox"]');
        if (toggles[0] && settings.darkMode !== undefined) {
            toggles[0].checked = settings.darkMode;
        }
        if (toggles[1] && settings.notifications !== undefined) {
            toggles[1].checked = settings.notifications;
        }
        if (toggles[2] && settings.voiceGuide !== undefined) {
            toggles[2].checked = settings.voiceGuide;
        }
        
    } catch (error) {
        console.error('Error loading user settings:', error);
        showNotification('設定の読み込みに失敗しました', 'error');
    }
}

// Toggle dark mode
function toggleDarkMode(enabled) {
    if (enabled) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('darkMode', 'true');
    } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('darkMode', 'false');
    }
    
    showNotification(`ダークモードを${enabled ? '有効' : '無効'}にしました`, 'success');
}

// Toggle notifications
function toggleNotifications(enabled) {
    if (enabled) {
        // Request notification permission
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }
    
    showNotification(`通知を${enabled ? '有効' : '無効'}にしました`, 'success');
}

// Toggle voice guide
function toggleVoiceGuide(enabled) {
    showNotification(`音声ガイドを${enabled ? '有効' : '無効'}にしました`, 'success');
}

// Export data
async function exportData() {
    try {
        const data = await exportUserData();
        
        // Create download link
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `muscle-rotation-data-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showNotification('データをエクスポートしました', 'success');
    } catch (error) {
        console.error('Error exporting data:', error);
        showNotification('データのエクスポートに失敗しました', 'error');
    }
}

// Import data
async function importData() {
    try {
        // Create file input
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (file) {
                const text = await file.text();
                const data = JSON.parse(text);
                await importUserData(data);
                showNotification('データをインポートしました', 'success');
            }
        };
        input.click();
    } catch (error) {
        console.error('Error importing data:', error);
        showNotification('データのインポートに失敗しました', 'error');
    }
}

// Delete data
async function deleteData() {
    if (confirm('本当にすべてのデータを削除しますか？この操作は取り消せません。')) {
        try {
            await deleteUserData();
            showNotification('データを削除しました', 'success');
        } catch (error) {
            console.error('Error deleting data:', error);
            showNotification('データの削除に失敗しました', 'error');
        }
    }
}

// Get user settings
async function getUserSettings() {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    return {
        displayName: 'ユーザー',
        email: 'user@example.com',
        goal: '筋力向上',
        darkMode: false,
        notifications: true,
        voiceGuide: false
    };
}

// Export user data
async function exportUserData() {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
        user: {
            displayName: 'ユーザー',
            email: 'user@example.com',
            goal: '筋力向上'
        },
        workouts: [
            {
                id: 1,
                name: '胸筋トレーニング',
                date: '2024-01-15',
                exercises: [
                    {
                        name: 'ベンチプレス',
                        sets: 3,
                        weight: 80,
                        reps: 10
                    }
                ]
            }
        ],
        settings: {
            darkMode: false,
            notifications: true,
            voiceGuide: false
        },
        exportDate: new Date().toISOString()
    };
}

// Import user data
async function importUserData(data) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log('Importing user data:', data);
    // TODO: Implement actual data import logic
}

// Delete user data
async function deleteUserData() {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log('Deleting user data');
    // TODO: Implement actual data deletion logic
}

// Initialize help page
function initializeHelp() {
    console.log('Help page initialized');
    // Help page doesn't need specific data loading as it's static content
}

// Show notification
function showNotification(message, type = 'info') {
    const container = document.getElementById('notification-container');
    if (!container) return;
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    container.appendChild(notification);
    
    // Show notification
    setTimeout(() => notification.classList.add('show'), 100);
    
    // Remove notification after 3 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => container.removeChild(notification), 300);
    }, 3000);
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', async function() {
    console.log('DOM loaded, initializing app...');
    
    // Load header and sidebar
    await loadHeader();
    await loadSidebar();
    
    // Load initial page (dashboard)
    await navigateToPage('dashboard');
    
    // Initialize navigation
    initializeNavigation();
    
    // Initialize authentication
    initializeAuth();
    
    // Initialize mobile menu
    initializeMobileMenu();
    
    console.log('App initialization complete');
    console.log('Current user:', currentUser);
    console.log('Supabase configured:', !!supabase);
});

// Load header
async function loadHeader() {
    try {
        const headerContainer = document.getElementById('header-container');
        if (headerContainer) {
            const headerContent = await loadPartial('header');
            headerContainer.innerHTML = headerContent;
        }
    } catch (error) {
        console.error('Error loading header:', error);
    }
}

// Load sidebar
async function loadSidebar() {
    try {
        const sidebarContainer = document.getElementById('sidebar-container');
        if (sidebarContainer) {
            const sidebarContent = await loadPartial('sidebar');
            sidebarContainer.innerHTML = sidebarContent;
        }
    } catch (error) {
        console.error('Error loading sidebar:', error);
    }
}

// Initialize navigation
function initializeNavigation() {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', async (e) => {
            e.preventDefault();
            const page = item.dataset.page;
            if (page && page !== currentPage) {
                await navigateToPage(page);
            }
        });
    });
}

// Initialize authentication
function initializeAuth() {
    const loginBtn = document.getElementById('login-btn');
    const logoutBtn = document.getElementById('logout-btn');
    
    if (loginBtn) {
        loginBtn.addEventListener('click', () => {
            if (!supabase) {
                showNotification('Supabaseが設定されていません。設定を確認してください。', 'error');
                return;
            }
            showAuthModal('login');
        });
    }
    
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            if (!supabase) {
                showNotification('Supabaseが設定されていません。', 'error');
                return;
            }
            // ログアウト前にワークアウト履歴をlocalStorageに保存
            try {
                const history = await getWorkoutHistory();
                localStorage.setItem('workoutHistory', JSON.stringify(history));
            } catch (e) {
                console.warn('ワークアウト履歴のlocalStorage保存に失敗:', e);
            }
            try {
                const { error } = await supabase.auth.signOut();
                if (error) throw error;
                currentUser = null;
                updateAuthUI();
                showNotification('ログアウトしました', 'success');
            } catch (error) {
                console.error('Logout error:', error);
                showNotification('ログアウトに失敗しました', 'error');
            }
        });
    }
    
    // Check current session
    checkCurrentSession();
    
    // Listen for auth state changes
    if (supabase) {
        supabase.auth.onAuthStateChange((event, session) => {
            console.log('Auth state changed:', event, session);
            if (event === 'SIGNED_IN' && session) {
                currentUser = session.user;
                updateAuthUI();
                showNotification('ログインしました', 'success');
            } else if (event === 'SIGNED_OUT') {
                currentUser = null;
                updateAuthUI();
                showNotification('ログアウトしました', 'success');
            }
        });
    }
}

// Initialize mobile menu
function initializeMobileMenu() {
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const mobileSidebar = document.getElementById('mobile-sidebar');
    const mobileSidebarClose = document.getElementById('mobile-sidebar-close');
    
    if (mobileMenuBtn && mobileSidebar) {
        mobileMenuBtn.addEventListener('click', () => {
            mobileSidebar.classList.add('open');
        });
    }
    
    if (mobileSidebarClose && mobileSidebar) {
        mobileSidebarClose.addEventListener('click', () => {
            mobileSidebar.classList.remove('open');
        });
    }
    
    // Close mobile sidebar when clicking outside
    document.addEventListener('click', (e) => {
        if (mobileSidebar && !mobileSidebar.contains(e.target) && !mobileMenuBtn?.contains(e.target)) {
            mobileSidebar.classList.remove('open');
        }
    });
}

// Check current session
async function checkCurrentSession() {
    if (!supabase) {
        console.log('Supabase not configured, skipping session check');
        return;
    }
    
    try {
        console.log('Checking current session...');
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        
        if (session) {
            console.log('Session found, user:', session.user);
            currentUser = session.user;
            updateAuthUI();
            showNotification('ログイン済みです', 'success');
        } else {
            console.log('No active session found');
            currentUser = null;
            updateAuthUI();
        }
    } catch (error) {
        console.error('Session check error:', error);
        currentUser = null;
        updateAuthUI();
    }
}

// Update authentication UI
function updateAuthUI() {
    const loginBtn = document.getElementById('login-btn');
    const logoutBtn = document.getElementById('logout-btn');
    
    console.log('Updating auth UI, currentUser:', currentUser);
    
    if (currentUser) {
        console.log('User is logged in, hiding login button, showing logout button');
        if (loginBtn) {
            loginBtn.classList.add('hidden');
            console.log('Login button hidden');
        }
        if (logoutBtn) {
            logoutBtn.classList.remove('hidden');
            console.log('Logout button shown');
        }
    } else {
        console.log('User is not logged in, showing login button, hiding logout button');
        if (loginBtn) {
            loginBtn.classList.remove('hidden');
            console.log('Login button shown');
        }
        if (logoutBtn) {
            logoutBtn.classList.add('hidden');
            console.log('Logout button hidden');
        }
    }
}

// Show auth modal
function showAuthModal(mode = 'login') {
    // Load auth modal if not already loaded
    if (!document.getElementById('auth-modal')) {
        loadPartial('auth-modal').then(content => {
            document.body.insertAdjacentHTML('beforeend', content);
            initializeAuthModal(mode);
        });
    } else {
        initializeAuthModal(mode);
    }
}

// Initialize auth modal
function initializeAuthModal(mode = 'login') {
    const authModal = document.getElementById('auth-modal');
    const authModalClose = document.getElementById('auth-modal-close');
    const authForm = document.getElementById('auth-form');
    const signupForm = document.getElementById('signup-form');
    const switchToSignup = document.getElementById('switch-to-signup');
    const switchToLogin = document.getElementById('switch-to-login');
    const authModalTitle = document.getElementById('auth-modal-title');
    
    if (!authModal) return;
    
    // Show modal
    authModal.classList.remove('hidden');
    
    // Set mode
    if (mode === 'login') {
        authForm.classList.remove('hidden');
        signupForm.classList.add('hidden');
        authModalTitle.textContent = 'ログイン';
    } else {
        authForm.classList.add('hidden');
        signupForm.classList.remove('hidden');
        authModalTitle.textContent = '新規登録';
    }
    
    // Event listeners
    if (authModalClose) {
        authModalClose.addEventListener('click', hideAuthModal);
    }
    
    if (switchToSignup) {
        switchToSignup.addEventListener('click', () => showAuthModal('signup'));
    }
    
    if (switchToLogin) {
        switchToLogin.addEventListener('click', () => showAuthModal('login'));
    }
    
    // Form submissions
    if (authForm) {
        authForm.addEventListener('submit', handleLogin);
    }
    
    if (signupForm) {
        signupForm.addEventListener('submit', handleSignup);
    }
    
    // Close on escape key
    window.addEventListener('keydown', e => {
        if (e.key === 'Escape') hideAuthModal();
    });
}

// Hide auth modal
function hideAuthModal() {
    const authModal = document.getElementById('auth-modal');
    if (authModal) {
        authModal.classList.add('hidden');
    }
}

// Handle login
async function handleLogin(e) {
    e.preventDefault();
    
    if (!supabase) {
        showNotification('Supabaseが設定されていません。設定を確認してください。', 'error');
        return;
    }
    
    const email = document.getElementById('auth-email').value;
    const password = document.getElementById('auth-password').value;
    const errorDiv = document.getElementById('auth-error');
    
    try {
        console.log('Attempting login with email:', email);
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });
        
        if (error) throw error;
        
        console.log('Login successful, user data:', data.user);
        currentUser = data.user;
        
        // Clear any previous errors
        if (errorDiv) {
            errorDiv.textContent = '';
            errorDiv.classList.add('hidden');
        }
        
        // Update UI
        updateAuthUI();
        hideAuthModal();
        showNotification('ログインしました', 'success');
        
    } catch (error) {
        console.error('Login error:', error);
        if (errorDiv) {
            errorDiv.textContent = error.message || 'ログインに失敗しました';
            errorDiv.classList.remove('hidden');
        }
    }
}

// Handle signup
async function handleSignup(e) {
    e.preventDefault();
    
    if (!supabase) {
        showNotification('Supabaseが設定されていません。設定を確認してください。', 'error');
        return;
    }
    
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    const errorDiv = document.getElementById('signup-error');
    
    try {
        const { data, error } = await supabase.auth.signUp({
            email,
            password
        });
        
        if (error) throw error;
        
        hideAuthModal();
        showNotification('登録が完了しました。メールを確認してください。', 'success');
        
    } catch (error) {
        console.error('Signup error:', error);
        if (errorDiv) {
            errorDiv.textContent = error.message || '新規登録に失敗しました';
            errorDiv.classList.remove('hidden');
        }
    }
} 