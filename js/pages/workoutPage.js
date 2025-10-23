// workoutPage.js - ワークアウトページの機能

import { supabaseService } from '../services/supabaseService.js';
import {
    showNotification,
    safeAsync,
    safeGetElement,
    safeGetElements,
    debounce,
    escapeHtml
} from '../utils/helpers.js';
import { MUSCLE_GROUPS } from '../utils/constants.js';
import { globalFormValidator, globalRealtimeValidator } from '../utils/validation.js';

class WorkoutPage {
    constructor() {
        this.currentWorkout = null;
        this.selectedMuscleGroups = [];
        this.exercises = [];
        this.workoutTimer = null;
        this.startTime = null;
    }

    /**
     * ワークアウトページを初期化
     */
    async initialize() {
        console.log('Workout page initialized');

        await safeAsync(
            async () => {
                await this.setupWorkoutInterface();
                this.setupEventListeners();
                this.initializeOfflineSync();
            },
            'ワークアウトページの初期化'
        );
    }

    /**
     * ワークアウトインターフェースを設定
     */
    async setupWorkoutInterface() {
        const container = safeGetElement('#workout-container');
        if (!container) {
            console.warn('Workout container not found');
            return;
        }

        // 筋肉部位選択セクション
        const muscleGroupsHtml = MUSCLE_GROUPS.map(group => `
            <div class="muscle-group-card ${group.bgColor} hover:${group.hoverColor} 
                 rounded-lg p-4 cursor-pointer transition-colors border-2 border-transparent"
                 data-muscle="${group.id}">
                <div class="flex items-center space-x-3">
                    <i class="fas fa-male ${group.iconColor} text-2xl"></i>
                    <div>
                        <h3 class="font-semibold ${group.textColor}">${group.name}</h3>
                        <p class="text-sm text-gray-600">クリックして選択</p>
                    </div>
                </div>
            </div>
        `).join('');

        container.innerHTML = `
            <div class="space-y-6">
                <!-- ワークアウト開始セクション -->
                <div class="bg-white rounded-lg shadow-md p-6">
                    <h2 class="text-xl font-bold text-gray-800 mb-4">
                        <i class="fas fa-dumbbell text-blue-500 mr-2"></i>
                        新しいワークアウト
                    </h2>
                    
                    <!-- 筋肉部位選択 -->
                    <div class="mb-6">
                        <h3 class="text-lg font-semibold text-gray-700 mb-3">
                            対象部位を選択
                        </h3>
                        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            ${muscleGroupsHtml}
                        </div>
                    </div>

                    <!-- 選択された部位 -->
                    <div id="selected-muscles" class="mb-6 hidden">
                        <h3 class="text-lg font-semibold text-gray-700 mb-3">
                            選択された部位
                        </h3>
                        <div id="selected-muscles-list" class="flex flex-wrap gap-2">
                        </div>
                    </div>

                    <!-- ワークアウト開始ボタン -->
                    <button id="start-workout-btn" 
                            class="w-full bg-blue-500 hover:bg-blue-600 text-white 
                                   font-semibold py-3 px-6 rounded-lg transition-colors
                                   disabled:bg-gray-300 disabled:cursor-not-allowed"
                            disabled>
                        <i class="fas fa-play mr-2"></i>
                        ワークアウトを開始
                    </button>
                </div>

                <!-- 現在のワークアウトセクション -->
                <div id="current-workout-section" class="bg-white rounded-lg shadow-md p-6 hidden">
                    <div class="flex items-center justify-between mb-4">
                        <h2 class="text-xl font-bold text-gray-800">
                            <i class="fas fa-stopwatch text-green-500 mr-2"></i>
                            ワークアウト中
                        </h2>
                        <div class="flex items-center space-x-4">
                            <div class="text-lg font-mono bg-gray-100 px-3 py-1 rounded">
                                <span id="workout-timer">00:00</span>
                            </div>
                            <button id="stop-workout-btn" 
                                    class="bg-red-500 hover:bg-red-600 text-white 
                                           px-4 py-2 rounded-lg transition-colors">
                                <i class="fas fa-stop mr-1"></i>
                                終了
                            </button>
                        </div>
                    </div>

                    <!-- エクササイズリスト -->
                    <div id="exercises-list" class="space-y-4">
                    </div>

                    <!-- エクササイズ追加ボタン -->
                    <button id="add-exercise-btn" 
                            class="w-full bg-green-500 hover:bg-green-600 text-white 
                                   font-semibold py-2 px-4 rounded-lg transition-colors mt-4">
                        <i class="fas fa-plus mr-2"></i>
                        エクササイズを追加
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * イベントリスナーを設定
     */
    setupEventListeners() {
        // 筋肉部位選択（デバウンス付き）
        const debouncedToggle = debounce((muscleId, card) => {
            this.toggleMuscleGroup(muscleId, card);
        }, 100);

        safeGetElements('.muscle-group-card').forEach(card => {
            card.addEventListener('click', () => {
                const muscleId = card.dataset.muscle;
                debouncedToggle(muscleId, card);
            });
        });

        // ワークアウト開始
        const startBtn = safeGetElement('#start-workout-btn');
        if (startBtn) {
            startBtn.addEventListener('click', () => this.startWorkout());
        }

        // ワークアウト終了
        const stopBtn = safeGetElement('#stop-workout-btn');
        if (stopBtn) {
            stopBtn.addEventListener('click', () => this.stopWorkout());
        }

        // エクササイズ追加
        const addExerciseBtn = safeGetElement('#add-exercise-btn');
        if (addExerciseBtn) {
            addExerciseBtn.addEventListener('click', () => this.showAddExerciseModal());
        }
    }

    /**
     * 筋肉部位の選択を切り替え
     * @param {string} muscleId - 筋肉部位ID
     * @param {Element} cardElement - カード要素
     */
    toggleMuscleGroup(muscleId, cardElement) {
        const index = this.selectedMuscleGroups.indexOf(muscleId);

        if (index > -1) {
            // 選択解除
            this.selectedMuscleGroups.splice(index, 1);
            cardElement.classList.remove('border-blue-500', 'bg-blue-50');
        } else {
            // 選択
            this.selectedMuscleGroups.push(muscleId);
            cardElement.classList.add('border-blue-500', 'bg-blue-50');
        }

        this.updateSelectedMusclesDisplay();
        this.updateStartButtonState();
    }

    /**
     * 選択された筋肉部位の表示を更新
     */
    updateSelectedMusclesDisplay() {
        const container = safeGetElement('#selected-muscles');
        const listContainer = safeGetElement('#selected-muscles-list');

        if (!container || !listContainer) {
            console.warn('Selected muscles display containers not found');
            return;
        }

        if (this.selectedMuscleGroups.length === 0) {
            container.classList.add('hidden');
            return;
        }

        container.classList.remove('hidden');

        const muscleNames = this.selectedMuscleGroups.map(id => {
            const muscle = MUSCLE_GROUPS.find(group => group.id === id);
            return muscle ? muscle.name : id;
        });

        listContainer.innerHTML = muscleNames.map(name => `
            <span class="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                ${name}
            </span>
        `).join('');
    }

    /**
     * 開始ボタンの状態を更新
     */
    updateStartButtonState() {
        const startBtn = safeGetElement('#start-workout-btn');
        if (!startBtn) {
            console.warn('Start workout button not found');
            return;
        }

        startBtn.disabled = this.selectedMuscleGroups.length === 0;
    }

    /**
     * ワークアウトを開始
     */
    async startWorkout() {
        if (this.selectedMuscleGroups.length === 0) {
            showNotification('筋肉部位を選択してください', 'warning');
            return;
        }

        this.currentWorkout = {
            id: `workout_${Date.now()}`,
            muscleGroups: [...this.selectedMuscleGroups],
            exercises: [],
            startTime: new Date(),
            endTime: null,
            sessionId: null
        };

        this.startTime = new Date();
        this.startWorkoutTimer();

        // ワークアウトセッションを事前作成（リアルタイム保存のため）
        await this.createWorkoutSession();

        // UIを更新
        const workoutSection = safeGetElement('#current-workout-section');
        if (workoutSection) {
            workoutSection.classList.remove('hidden');
        }

        showNotification(
            `${this.selectedMuscleGroups.length}部位のワークアウトを開始しました`,
            'success'
        );

        console.log('✅ ワークアウトを開始:', this.currentWorkout);
    }

    /**
     * ワークアウトセッションを事前作成
     */
    async createWorkoutSession() {
        try {
            if (supabaseService.isAvailable() && supabaseService.getCurrentUser()) {
                const sessionData = {
                    session_name: `ワークアウト ${new Date().toLocaleDateString()}`,
                    workout_date: new Date().toISOString().split('T')[0],
                    start_time: this.currentWorkout.startTime.toISOString(),
                    muscle_groups_trained: this.currentWorkout.muscleGroups,
                    session_type: 'strength',
                    is_completed: false,
                    notes: '進行中のワークアウト'
                };

                const savedSession = await supabaseService.saveWorkout(sessionData);
                if (savedSession && savedSession[0]) {
                    this.currentWorkout.sessionId = savedSession[0].id;
                    console.log('💾 ワークアウトセッションを作成:', this.currentWorkout.sessionId);
                }
            }
        } catch (error) {
            console.error('ワークアウトセッション作成エラー:', error);
            // エラーでもワークアウトは継続
        }
    }

    /**
     * ワークアウトタイマーを開始
     */
    startWorkoutTimer() {
        this.workoutTimer = setInterval(() => {
            this.updateTimerDisplay();
        }, 1000);
    }

    /**
     * タイマー表示を更新
     */
    updateTimerDisplay() {
        if (!this.startTime) {return;}

        const now = new Date();
        const elapsed = Math.floor((now - this.startTime) / 1000);
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;

        const timerElement = safeGetElement('#workout-timer');
        if (timerElement) {
            timerElement.textContent =
                `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
    }

    /**
     * ワークアウトを停止
     */
    async stopWorkout() {
        if (!this.currentWorkout) {
            showNotification('進行中のワークアウトがありません', 'warning');
            return;
        }

        // 確認ダイアログを表示
        const shouldStop = await this.showWorkoutStopConfirmation();
        if (!shouldStop) {
            return;
        }

        // タイマーを停止
        if (this.workoutTimer) {
            clearInterval(this.workoutTimer);
            this.workoutTimer = null;
        }

        this.currentWorkout.endTime = new Date();
        const durationMinutes = Math.floor(
            (this.currentWorkout.endTime - this.currentWorkout.startTime) / (1000 * 60)
        );
        this.currentWorkout.duration = durationMinutes;

        // ワークアウト完了処理
        const success = await safeAsync(
            async () => {
                await this.completeWorkout({
                    ...this.currentWorkout,
                    duration: durationMinutes
                });
                return true;
            },
            'ワークアウトの完了処理',
            false
        );

        if (success) {
            await this.showWorkoutSummary(this.currentWorkout);
            showNotification(
                `ワークアウトを完了しました！ (${durationMinutes}分, ${this.exercises.length}種目)`,
                'success'
            );
        } else {
            showNotification('ワークアウトの保存に失敗しました', 'error');
        }

        // リセット
        this.resetWorkout();
    }

    /**
     * ワークアウト停止確認ダイアログ
     * @returns {Promise<boolean>} 停止するかどうか
     */
    async showWorkoutStopConfirmation() {
        return new Promise((resolve) => {
            const modalHtml = `
                <div id="stop-workout-modal" 
                     class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div class="bg-white rounded-lg p-6 w-full max-w-md mx-4">
                        <h3 class="text-lg font-bold text-gray-800 mb-4">
                            <i class="fas fa-stop-circle text-red-500 mr-2"></i>
                            ワークアウトを終了しますか？
                        </h3>
                        <div class="mb-4 text-gray-600">
                            <p class="mb-2">現在の進行状況:</p>
                            <ul class="list-disc list-inside space-y-1 text-sm">
                                <li>実施時間: <span class="font-medium">${this.getElapsedTimeString()}</span></li>
                                <li>エクササイズ数: <span class="font-medium">${this.exercises.length}種目</span></li>
                                <li>対象部位: <span class="font-medium">${this.selectedMuscleGroups.length}部位</span></li>
                            </ul>
                        </div>
                        <div class="flex space-x-3">
                            <button id="confirm-stop" 
                                    class="flex-1 bg-red-500 hover:bg-red-600 
                                           text-white py-2 px-4 rounded-lg transition-colors">
                                <i class="fas fa-check mr-2"></i>終了する
                            </button>
                            <button id="cancel-stop" 
                                    class="flex-1 bg-gray-500 hover:bg-gray-600 
                                           text-white py-2 px-4 rounded-lg transition-colors">
                                <i class="fas fa-times mr-2"></i>続ける
                            </button>
                        </div>
                    </div>
                </div>
            `;

            document.body.insertAdjacentHTML('beforeend', modalHtml);

            const modal = safeGetElement('#stop-workout-modal');
            const confirmBtn = safeGetElement('#confirm-stop');
            const cancelBtn = safeGetElement('#cancel-stop');

            const cleanup = () => {
                if (modal) {
                    modal.remove();
                }
            };

            if (confirmBtn) {
                confirmBtn.addEventListener('click', () => {
                    cleanup();
                    resolve(true);
                });
            }

            if (cancelBtn) {
                cancelBtn.addEventListener('click', () => {
                    cleanup();
                    resolve(false);
                });
            }

            // モーダル外クリックでキャンセル
            if (modal) {
                modal.addEventListener('click', (e) => {
                    if (e.target === modal) {
                        cleanup();
                        resolve(false);
                    }
                });
            }
        });
    }

    /**
     * 経過時間を文字列で取得
     * @returns {string} 経過時間
     */
    getElapsedTimeString() {
        if (!this.startTime) {return '0分';}

        const elapsed = Math.floor((new Date() - this.startTime) / (1000 * 60));
        const hours = Math.floor(elapsed / 60);
        const minutes = elapsed % 60;

        if (hours > 0) {
            return `${hours}時間${minutes}分`;
        }
        return `${minutes}分`;
    }

    /**
     * ワークアウト完了処理
     * @param {Object} workoutData - ワークアウトデータ
     */
    async completeWorkout(workoutData) {
        // データ保存
        await this.saveWorkoutData(workoutData);

        // セッション完了をSupabaseに更新
        if (workoutData.sessionId && supabaseService.isAvailable()) {
            try {
                // セッション完了フラグを更新（直接SQLクエリが必要な場合は別途実装）
                console.log('✅ ワークアウトセッション完了:', workoutData.sessionId);
            } catch (error) {
                console.error('セッション完了更新エラー:', error);
            }
        }

        // 統計更新
        await this.updateWorkoutStatistics(workoutData);

        // 筋肉回復データ更新
        await this.updateMuscleRecoveryData(workoutData);

        console.log('🎉 ワークアウト完了処理が完了しました');
    }

    /**
     * 筋肉回復データを更新
     * @param {Object} workoutData - ワークアウトデータ
     */
    async updateMuscleRecoveryData(workoutData) {
        try {
            const recoveryData = JSON.parse(localStorage.getItem('muscleRecoveryData') || '{}');
            const today = new Date().toISOString().split('T')[0];

            // 各筋肉部位の最終ワークアウト日を更新
            workoutData.muscleGroups.forEach(muscleGroup => {
                recoveryData[muscleGroup] = {
                    lastWorkout: today,
                    workoutCount: (recoveryData[muscleGroup]?.workoutCount || 0) + 1,
                    totalSets: (recoveryData[muscleGroup]?.totalSets || 0) +
                              workoutData.exercises.reduce((sum, ex) => sum + ex.sets, 0)
                };
            });

            localStorage.setItem('muscleRecoveryData', JSON.stringify(recoveryData));
            console.log('💪 筋肉回復データを更新しました:', recoveryData);
        } catch (error) {
            console.error('筋肉回復データ更新エラー:', error);
        }
    }

    /**
     * ワークアウトサマリーを表示
     * @param {Object} workoutData - ワークアウトデータ
     */
    async showWorkoutSummary(workoutData) {
        const totalSets = workoutData.exercises.reduce((sum, ex) => sum + ex.sets, 0);
        const maxWeight = Math.max(...workoutData.exercises.map(ex => ex.weight));

        const modalHtml = `
            <div id="workout-summary-modal" 
                 class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div class="bg-white rounded-lg p-6 w-full max-w-lg mx-4">
                    <h3 class="text-xl font-bold text-gray-800 mb-4 text-center">
                        <i class="fas fa-trophy text-yellow-500 mr-2"></i>
                        ワークアウト完了！
                    </h3>
                    
                    <div class="grid grid-cols-2 gap-4 mb-6">
                        <div class="text-center p-4 bg-blue-50 rounded-lg">
                            <div class="text-2xl font-bold text-blue-600">${workoutData.duration}</div>
                            <div class="text-sm text-gray-600">分</div>
                        </div>
                        <div class="text-center p-4 bg-green-50 rounded-lg">
                            <div class="text-2xl font-bold text-green-600">${workoutData.exercises.length}</div>
                            <div class="text-sm text-gray-600">種目</div>
                        </div>
                        <div class="text-center p-4 bg-purple-50 rounded-lg">
                            <div class="text-2xl font-bold text-purple-600">${totalSets}</div>
                            <div class="text-sm text-gray-600">セット</div>
                        </div>
                        <div class="text-center p-4 bg-orange-50 rounded-lg">
                            <div class="text-2xl font-bold text-orange-600">${maxWeight}</div>
                            <div class="text-sm text-gray-600">kg (最大)</div>
                        </div>
                    </div>
                    
                    <div class="mb-6">
                        <h4 class="font-semibold text-gray-700 mb-2">実施エクササイズ</h4>
                        <div class="space-y-2 max-h-32 overflow-y-auto">
                            ${workoutData.exercises.map(ex => `
                                <div class="flex justify-between items-center text-sm bg-gray-50 p-2 rounded">
                                    <span class="font-medium">${escapeHtml(ex.name)}</span>
                                    <span class="text-gray-600">${ex.weight}kg × ${ex.reps}回 × ${ex.sets}セット</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    
                    <button id="close-summary" 
                            class="w-full bg-blue-500 hover:bg-blue-600 
                                   text-white py-3 px-4 rounded-lg transition-colors">
                        <i class="fas fa-check mr-2"></i>完了
                    </button>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);

        const modal = safeGetElement('#workout-summary-modal');
        const closeBtn = safeGetElement('#close-summary');

        const cleanup = () => {
            if (modal) {
                modal.remove();
            }
        };

        if (closeBtn) {
            closeBtn.addEventListener('click', cleanup);
        }

        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    cleanup();
                }
            });
        }

        // 3秒後に自動で閉じる（オプション）
        setTimeout(() => {
            if (document.getElementById('workout-summary-modal')) {
                cleanup();
            }
        }, 10000);
    }

    /**
     * ワークアウトデータを保存
     * @param {Object} workoutData - ワークアウトデータ
     */
    async saveWorkoutData(workoutData) {
        try {
            // リアルタイム保存とオフライン対応
            if (supabaseService.isAvailable() && supabaseService.getCurrentUser()) {
                // Supabaseに保存
                const sessionData = {
                    session_name: `ワークアウト ${new Date().toLocaleDateString()}`,
                    workout_date: workoutData.startTime.toISOString().split('T')[0],
                    start_time: workoutData.startTime.toISOString(),
                    end_time: workoutData.endTime.toISOString(),
                    total_duration_minutes: workoutData.duration,
                    muscle_groups_trained: workoutData.muscleGroups,
                    session_type: 'strength',
                    is_completed: true,
                    notes: `${workoutData.exercises.length}種目のワークアウト`
                };

                const savedSession = await supabaseService.saveWorkout(sessionData);
                const sessionId = savedSession[0]?.id;

                // 各エクササイズをtraining_logsに保存
                if (sessionId && workoutData.exercises.length > 0) {
                    const trainingLogs = workoutData.exercises.map(exercise => ({
                        workout_session_id: sessionId,
                        muscle_group_id: this.getMuscleGroupId(workoutData.muscleGroups[0]),
                        exercise_name: exercise.name,
                        sets: exercise.sets,
                        reps: [exercise.reps],
                        weights: [exercise.weight],
                        workout_date: workoutData.startTime.toISOString().split('T')[0],
                        notes: exercise.notes || null
                    }));

                    await supabaseService.saveTrainingLogs(trainingLogs);
                }

                // 統計情報を更新
                await this.updateWorkoutStatistics(workoutData);

                console.log('✅ ワークアウトデータをSupabaseに保存しました');
            } else {
                // オフライン時はローカルストレージに保存
                await this.saveToLocalStorage(workoutData);
                console.log('📱 オフライン: ローカルストレージに保存しました');
            }

            // カスタムイベントを発火
            window.dispatchEvent(new CustomEvent('workoutSaved', {
                detail: workoutData
            }));

            return true;

        } catch (error) {
            console.error('❌ ワークアウト保存エラー:', error);
            // フォールバック: ローカルストレージに保存
            await this.saveToLocalStorage(workoutData);
            showNotification('オンライン保存に失敗しました。ローカルに保存されました。', 'warning');
            return false;
        }
    }

    /**
     * ローカルストレージに保存
     * @param {Object} workoutData - ワークアウトデータ
     */
    async saveToLocalStorage(workoutData) {
        const history = JSON.parse(localStorage.getItem('workoutHistory') || '[]');
        const enhancedData = {
            ...workoutData,
            id: workoutData.id || `workout_${Date.now()}`,
            savedAt: new Date().toISOString(),
            syncStatus: 'pending'
        };

        history.unshift(enhancedData);
        localStorage.setItem('workoutHistory', JSON.stringify(history.slice(0, 50)));

        // オフライン同期キューに追加
        const syncQueue = JSON.parse(localStorage.getItem('offlineWorkoutQueue') || '[]');
        syncQueue.push({
            id: enhancedData.id,
            data: enhancedData,
            operation: 'INSERT',
            timestamp: Date.now()
        });
        localStorage.setItem('offlineWorkoutQueue', JSON.stringify(syncQueue));
    }

    /**
     * 筋肉部位名からIDを取得
     * @param {string} muscleName - 筋肉部位名
     * @returns {string} 筋肉部位ID
     */
    getMuscleGroupId(muscleName) {
        const muscleMap = {
            chest: 'chest',
            back: 'back',
            shoulders: 'shoulders',
            arms: 'arms',
            legs: 'legs',
            abs: 'abs'
        };
        return muscleMap[muscleName] || muscleName;
    }

    /**
     * ワークアウト統計を更新
     * @param {Object} workoutData - ワークアウトデータ
     */
    async updateWorkoutStatistics(workoutData) {
        try {
            // ローカル統計を更新
            const stats = JSON.parse(localStorage.getItem('workoutStats') || '{}');
            const today = new Date().toISOString().split('T')[0];

            if (!stats[today]) {
                stats[today] = {
                    workouts: 0,
                    exercises: 0,
                    duration: 0,
                    muscleGroups: []
                };
            }

            stats[today].workouts += 1;
            stats[today].exercises += workoutData.exercises.length;
            stats[today].duration += workoutData.duration;
            stats[today].muscleGroups = [...new Set([
                ...stats[today].muscleGroups,
                ...workoutData.muscleGroups
            ])];

            localStorage.setItem('workoutStats', JSON.stringify(stats));

            console.log('📊 統計情報を更新しました:', stats[today]);
            return true;
        } catch (error) {
            console.error('統計更新エラー:', error);
            return false;
        }
    }

    /**
     * ワークアウトをリセット
     */
    resetWorkout() {
        this.currentWorkout = null;
        this.selectedMuscleGroups = [];
        this.exercises = [];
        this.startTime = null;

        // UI をリセット
        const workoutSection = safeGetElement('#current-workout-section');
        if (workoutSection) {
            workoutSection.classList.add('hidden');
        }

        safeGetElements('.muscle-group-card').forEach(card => {
            card.classList.remove('border-blue-500', 'bg-blue-50');
        });

        this.updateSelectedMusclesDisplay();
        this.updateStartButtonState();
    }

    /**
     * エクササイズ追加モーダルを表示
     */
    showAddExerciseModal() {
        const modalHtml = `
            <div id="add-exercise-modal" 
                 class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div class="bg-white rounded-lg p-6 w-full max-w-md mx-4">
                    <h3 class="text-lg font-bold text-gray-800 mb-4">
                        <i class="fas fa-plus-circle text-green-500 mr-2"></i>
                        エクササイズを追加
                    </h3>
                    <form id="add-exercise-form" class="space-y-4">
                        <div>
                            <label for="exercise-name" 
                                   class="block text-gray-700 font-medium mb-1">
                                エクササイズ名
                            </label>
                            <input id="exercise-name" name="exerciseName" type="text" required 
                                   class="w-full border border-gray-300 rounded px-3 py-2 
                                          focus:border-blue-500 focus:outline-none"
                                   placeholder="例: ベンチプレス">
                            <div id="exercise-name-error" 
                                 class="text-red-600 text-sm mt-1 hidden"></div>
                        </div>
                        <div class="grid grid-cols-3 gap-4">
                            <div>
                                <label for="exercise-weight" 
                                       class="block text-gray-700 font-medium mb-1">
                                    重量 (kg)
                                </label>
                                <input id="exercise-weight" name="weight" type="number" 
                                       min="0" max="1000" step="0.5" required
                                       class="w-full border border-gray-300 rounded px-3 py-2 
                                              focus:border-blue-500 focus:outline-none"
                                       placeholder="80">
                                <div id="exercise-weight-error" 
                                     class="text-red-600 text-sm mt-1 hidden"></div>
                            </div>
                            <div>
                                <label for="exercise-reps" 
                                       class="block text-gray-700 font-medium mb-1">
                                    回数
                                </label>
                                <input id="exercise-reps" name="reps" type="number" 
                                       min="1" max="100" required
                                       class="w-full border border-gray-300 rounded px-3 py-2 
                                              focus:border-blue-500 focus:outline-none"
                                       placeholder="10">
                                <div id="exercise-reps-error" 
                                     class="text-red-600 text-sm mt-1 hidden"></div>
                            </div>
                            <div>
                                <label for="exercise-sets" 
                                       class="block text-gray-700 font-medium mb-1">
                                    セット数
                                </label>
                                <input id="exercise-sets" name="sets" type="number" 
                                       min="1" max="20" required
                                       class="w-full border border-gray-300 rounded px-3 py-2 
                                              focus:border-blue-500 focus:outline-none"
                                       placeholder="3">
                                <div id="exercise-sets-error" 
                                     class="text-red-600 text-sm mt-1 hidden"></div>
                            </div>
                        </div>
                        <div>
                            <label for="exercise-notes" 
                                   class="block text-gray-700 font-medium mb-1">
                                メモ（任意）
                            </label>
                            <textarea id="exercise-notes" name="notes" rows="3" 
                                      maxlength="1000"
                                      class="w-full border border-gray-300 rounded px-3 py-2 
                                             focus:border-blue-500 focus:outline-none"
                                      placeholder="フォームや感想など..."></textarea>
                            <div id="exercise-notes-error" 
                                 class="text-red-600 text-sm mt-1 hidden"></div>
                        </div>
                        <div id="exercise-form-error" class="text-red-600 text-sm hidden"></div>
                        <div class="flex space-x-3">
                            <button type="submit" 
                                    class="flex-1 bg-green-500 hover:bg-green-600 
                                           text-white py-2 px-4 rounded-lg transition-colors">
                                <i class="fas fa-check mr-2"></i>追加
                            </button>
                            <button type="button" id="cancel-exercise" 
                                    class="flex-1 bg-gray-500 hover:bg-gray-600 
                                           text-white py-2 px-4 rounded-lg transition-colors">
                                <i class="fas fa-times mr-2"></i>キャンセル
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        // モーダルを追加
        document.body.insertAdjacentHTML('beforeend', modalHtml);

        // イベントリスナーを設定
        this.setupExerciseModalListeners();
    }

    /**
     * エクササイズモーダルのイベントリスナーを設定
     */
    setupExerciseModalListeners() {
        const modal = safeGetElement('#add-exercise-modal');
        const form = safeGetElement('#add-exercise-form');
        const cancelBtn = safeGetElement('#cancel-exercise');

        if (!modal || !form) {
            console.warn('Exercise modal elements not found');
            return;
        }

        // バリデーション設定
        globalRealtimeValidator.setupWorkoutFormValidation(form);

        // フォーム送信
        form.addEventListener('submit', (e) => this.handleAddExercise(e));

        // キャンセルボタン
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => this.hideExerciseModal());
        }

        // モーダル外クリックで閉じる
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.hideExerciseModal();
            }
        });

        // Escapeキーで閉じる
        const escapeHandler = (e) => {
            if (e.key === 'Escape') {
                this.hideExerciseModal();
                document.removeEventListener('keydown', escapeHandler);
            }
        };
        document.addEventListener('keydown', escapeHandler);
    }

    /**
     * エクササイズ追加処理
     * @param {Event} e - イベントオブジェクト
     */
    async handleAddExercise(e) {
        e.preventDefault();

        const formData = {
            exerciseName: safeGetElement('#exercise-name')?.value,
            weight: safeGetElement('#exercise-weight')?.value,
            reps: safeGetElement('#exercise-reps')?.value,
            sets: safeGetElement('#exercise-sets')?.value,
            notes: safeGetElement('#exercise-notes')?.value
        };

        // バリデーション実行
        const sanitizedData = globalFormValidator.validateWorkoutForm(formData);

        if (!globalFormValidator.isValid()) {
            const errors = globalFormValidator.getAllErrors();
            const firstError = Object.values(errors).flat()[0];
            const errorDiv = safeGetElement('#exercise-form-error');
            if (errorDiv) {
                errorDiv.textContent = firstError;
                errorDiv.classList.remove('hidden');
            }
            return;
        }

        // エクササイズを追加
        const exercise = {
            id: `exercise_${Date.now()}`,
            name: sanitizedData.exerciseName,
            weight: parseFloat(sanitizedData.weight),
            reps: parseInt(sanitizedData.reps),
            sets: parseInt(sanitizedData.sets),
            notes: sanitizedData.notes || '',
            timestamp: new Date(),
            muscleGroups: [...this.selectedMuscleGroups]
        };

        this.exercises.push(exercise);
        if (this.currentWorkout) {
            this.currentWorkout.exercises.push(exercise);

            // リアルタイム保存（エクササイズ追加時）
            await this.saveExerciseRealtime(exercise);
        }

        // UIを更新
        this.updateExercisesList();
        this.hideExerciseModal();

        showNotification(`${exercise.name}を追加しました`, 'success');

        console.log('✅ エクササイズを追加:', exercise);
    }

    /**
     * エクササイズのリアルタイム保存
     * @param {Object} exercise - エクササイズデータ
     */
    async saveExerciseRealtime(exercise) {
        try {
            if (supabaseService.isAvailable() && supabaseService.getCurrentUser()) {
                // 現在のワークアウトセッションが存在する場合のみ保存
                if (this.currentWorkout?.sessionId) {
                    const trainingLog = {
                        workout_session_id: this.currentWorkout.sessionId,
                        muscle_group_id: this.getMuscleGroupId(exercise.muscleGroups[0]),
                        exercise_name: exercise.name,
                        sets: exercise.sets,
                        reps: [exercise.reps],
                        weights: [exercise.weight],
                        workout_date: new Date().toISOString().split('T')[0],
                        notes: exercise.notes
                    };

                    await supabaseService.saveTrainingLog(trainingLog);
                    console.log('💾 エクササイズをリアルタイム保存しました');
                }
            } else {
                // オフライン時は一時保存
                const tempExercises = JSON.parse(localStorage.getItem('tempExercises') || '[]');
                tempExercises.push({
                    ...exercise,
                    workoutId: this.currentWorkout?.id,
                    savedAt: new Date().toISOString()
                });
                localStorage.setItem('tempExercises', JSON.stringify(tempExercises));
                console.log('📱 エクササイズを一時保存しました');
            }
        } catch (error) {
            console.error('エクササイズ保存エラー:', error);
            // エラー時もローカルに保存
            const tempExercises = JSON.parse(localStorage.getItem('tempExercises') || '[]');
            tempExercises.push({
                ...exercise,
                workoutId: this.currentWorkout?.id,
                savedAt: new Date().toISOString(),
                syncStatus: 'failed'
            });
            localStorage.setItem('tempExercises', JSON.stringify(tempExercises));
        }
    }

    /**
     * エクササイズリストの表示を更新
     */
    updateExercisesList() {
        const container = safeGetElement('#exercises-list');
        if (!container) {
            console.warn('Exercises list container not found');
            return;
        }

        if (this.exercises.length === 0) {
            container.innerHTML = `
                <div class="text-center text-gray-500 py-8">
                    <i class="fas fa-dumbbell text-3xl mb-2"></i>
                    <p>まだエクササイズが追加されていません</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.exercises.map(exercise => `
            <div class="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div class="flex items-center justify-between mb-2">
                    <h4 class="font-semibold text-gray-800">${escapeHtml(exercise.name)}</h4>
                    <button class="text-red-500 hover:text-red-700 transition-colors" 
                            onclick="workoutPage.removeExercise('${escapeHtml(exercise.id)}')">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
                <div class="grid grid-cols-3 gap-4 text-sm text-gray-600 mb-2">
                    <div>
                        <span class="font-medium">重量:</span> 
                        ${escapeHtml(exercise.weight.toString())}kg
                    </div>
                    <div>
                        <span class="font-medium">回数:</span> 
                        ${escapeHtml(exercise.reps.toString())}回
                    </div>
                    <div>
                        <span class="font-medium">セット:</span> 
                        ${escapeHtml(exercise.sets.toString())}セット
                    </div>
                </div>
                ${exercise.notes ? `
                    <div class="text-sm text-gray-600 bg-white p-2 rounded border">
                        <i class="fas fa-sticky-note mr-1"></i>
                        ${escapeHtml(exercise.notes)}
                    </div>
                ` : ''}
            </div>
        `).join('');
    }

    /**
     * エクササイズを削除
     * @param {string} exerciseId - エクササイズID
     */
    removeExercise(exerciseId) {
        const index = this.exercises.findIndex(ex => ex.id === exerciseId);
        if (index > -1) {
            const exercise = this.exercises[index];
            this.exercises.splice(index, 1);

            if (this.currentWorkout) {
                const workoutIndex = this.currentWorkout.exercises
                    .findIndex(ex => ex.id === exerciseId);
                if (workoutIndex > -1) {
                    this.currentWorkout.exercises.splice(workoutIndex, 1);
                }
            }

            this.updateExercisesList();
            showNotification(`${exercise.name}を削除しました`, 'info');
        }
    }

    /**
     * エクササイズモーダルを非表示
     */
    hideExerciseModal() {
        const modal = safeGetElement('#add-exercise-modal');
        if (modal) {
            modal.remove();
        }
    }

    /**
     * 現在のワークアウトを取得
     * @returns {Object|null} 現在のワークアウト
     */
    getCurrentWorkout() {
        return this.currentWorkout;
    }

    /**
     * オフライン同期機能を初期化
     */
    initializeOfflineSync() {
        // オンライン復帰時の自動同期
        window.addEventListener('online', () => {
            console.log('🌐 オンラインに復帰しました。同期を開始します...');
            this.syncOfflineData();
        });

        // ページ読み込み時に未同期データがあるかチェック
        this.checkPendingSyncData();
    }

    /**
     * オフラインデータを同期
     */
    async syncOfflineData() {
        try {
            if (!supabaseService.isAvailable() || !supabaseService.getCurrentUser()) {
                console.log('⚠️ Supabaseまたはユーザー認証が利用できません');
                return;
            }

            const syncQueue = JSON.parse(localStorage.getItem('offlineWorkoutQueue') || '[]');
            if (syncQueue.length === 0) {
                console.log('✅ 同期待ちのデータはありません');
                return;
            }

            console.log(`🔄 ${syncQueue.length}件のデータを同期中...`);
            let syncedCount = 0;
            let failedCount = 0;

            for (const item of syncQueue) {
                try {
                    await this.syncSingleWorkout(item.data);
                    syncedCount++;

                    // 同期成功したアイテムをキューから削除
                    const updatedQueue = JSON.parse(localStorage.getItem('offlineWorkoutQueue') || '[]')
                        .filter(queueItem => queueItem.id !== item.id);
                    localStorage.setItem('offlineWorkoutQueue', JSON.stringify(updatedQueue));

                } catch (error) {
                    console.error(`❌ 同期失敗 (ID: ${item.id}):`, error);
                    failedCount++;
                }
            }

            const message = `同期完了: 成功${syncedCount}件, 失敗${failedCount}件`;
            showNotification(message, failedCount === 0 ? 'success' : 'warning');
            console.log(`📊 ${message}`);

        } catch (error) {
            console.error('❌ オフライン同期エラー:', error);
            showNotification('オフラインデータの同期に失敗しました', 'error');
        }
    }

    /**
     * 単一のワークアウトデータを同期
     * @param {Object} workoutData - ワークアウトデータ
     */
    async syncSingleWorkout(workoutData) {
        const sessionData = {
            session_name: workoutData.sessionName || `ワークアウト ${new Date(workoutData.startTime).toLocaleDateString()}`,
            workout_date: new Date(workoutData.startTime).toISOString().split('T')[0],
            start_time: new Date(workoutData.startTime).toISOString(),
            end_time: workoutData.endTime ? new Date(workoutData.endTime).toISOString() : null,
            total_duration_minutes: workoutData.duration || 0,
            muscle_groups_trained: workoutData.muscleGroups || [],
            session_type: 'strength',
            is_completed: !!workoutData.endTime,
            notes: `オフライン同期: ${workoutData.exercises?.length || 0}種目`
        };

        const savedSession = await supabaseService.saveWorkout(sessionData);
        const sessionId = savedSession[0]?.id;

        // エクササイズデータも同期
        if (sessionId && workoutData.exercises && workoutData.exercises.length > 0) {
            const trainingLogs = workoutData.exercises.map(exercise => ({
                workout_session_id: sessionId,
                muscle_group_id: this.getMuscleGroupId(workoutData.muscleGroups[0]),
                exercise_name: exercise.name,
                sets: exercise.sets,
                reps: [exercise.reps],
                weights: [exercise.weight],
                workout_date: new Date(workoutData.startTime).toISOString().split('T')[0],
                notes: exercise.notes || null
            }));

            await supabaseService.saveTrainingLogs(trainingLogs);
        }

        console.log(`✅ ワークアウト同期完了 (ID: ${workoutData.id})`);
    }

    /**
     * 未同期データの存在をチェック
     */
    async checkPendingSyncData() {
        const syncQueue = JSON.parse(localStorage.getItem('offlineWorkoutQueue') || '[]');
        if (syncQueue.length > 0) {
            console.log(`📋 ${syncQueue.length}件の未同期データがあります`);

            if (navigator.onLine && supabaseService.isAvailable() && supabaseService.getCurrentUser()) {
                showNotification(`${syncQueue.length}件の未同期データを同期中...`, 'info');
                await this.syncOfflineData();
            } else {
                showNotification(`${syncQueue.length}件の未同期データがあります。オンライン時に自動同期されます。`, 'warning');
            }
        }
    }

    /**
     * ワークアウト履歴を取得（オンライン・オフライン対応）
     * @param {number} limit - 取得件数
     * @returns {Promise<Array>} ワークアウト履歴
     */
    async getWorkoutHistory(limit = 20) {
        try {
            let workouts = [];

            // オンラインデータを取得
            if (supabaseService.isAvailable() && supabaseService.getCurrentUser()) {
                workouts = await supabaseService.getWorkouts(limit);
            }

            // ローカルデータを追加
            const localHistory = JSON.parse(localStorage.getItem('workoutHistory') || '[]');

            // 重複を除去してマージ
            const allWorkouts = [...workouts, ...localHistory];
            const uniqueWorkouts = allWorkouts.filter((workout, index, self) =>
                index === self.findIndex(w => w.id === workout.id)
            );

            // 日付でソート
            uniqueWorkouts.sort((a, b) => new Date(b.startTime || b.workout_date) - new Date(a.startTime || a.workout_date));

            return uniqueWorkouts.slice(0, limit);
        } catch (error) {
            console.error('ワークアウト履歴取得エラー:', error);
            // フォールバック: ローカルデータのみ
            return JSON.parse(localStorage.getItem('workoutHistory') || '[]').slice(0, limit);
        }
    }

    /**
     * データ整合性チェック
     */
    async validateDataIntegrity() {
        try {
            const localHistory = JSON.parse(localStorage.getItem('workoutHistory') || '[]');
            const syncQueue = JSON.parse(localStorage.getItem('offlineWorkoutQueue') || '[]');

            console.log('📊 データ整合性チェック:');
            console.log(`  - ローカル履歴: ${localHistory.length}件`);
            console.log(`  - 未同期キュー: ${syncQueue.length}件`);

            // 重複チェック
            const duplicates = localHistory.filter((item, index, self) =>
                index !== self.findIndex(other => other.id === item.id)
            );

            if (duplicates.length > 0) {
                console.warn(`⚠️ 重複データを検出: ${duplicates.length}件`);
                // 重複を削除
                const uniqueHistory = localHistory.filter((item, index, self) =>
                    index === self.findIndex(other => other.id === item.id)
                );
                localStorage.setItem('workoutHistory', JSON.stringify(uniqueHistory));
                console.log('✅ 重複データを削除しました');
            }

            return {
                localCount: localHistory.length,
                pendingSync: syncQueue.length,
                duplicatesRemoved: duplicates.length
            };
        } catch (error) {
            console.error('データ整合性チェックエラー:', error);
            return null;
        }
    }
}

// デフォルトエクスポート
const workoutPageInstance = new WorkoutPage();

// オフライン同期機能を初期化
workoutPageInstance.initializeOfflineSync();

export default workoutPageInstance;
