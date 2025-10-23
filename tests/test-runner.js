// tests/test-runner.js - テストランナークラス

export class TestRunner {
  constructor() {
    this.describe = describe;
    this.it = it;
    this.test = it;
    this.beforeEach = beforeEach;
    this.afterEach = afterEach;
    this.beforeAll = beforeAll;
    this.afterAll = afterAll;
    this.expect = expect;
    this.jest = jest;
  }

  // テストヘルパーメソッド
  createMockElement(tagName = 'div', attributes = {}) {
    const element = {
      tagName: tagName.toUpperCase(),
      attributes: attributes,
      classList: {
        add: jest.fn(),
        remove: jest.fn(),
        contains: jest.fn(),
        toggle: jest.fn()
      },
      style: {},
      textContent: '',
      innerHTML: '',
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      click: jest.fn(),
      focus: jest.fn(),
      blur: jest.fn(),
      getAttribute: jest.fn(),
      setAttribute: jest.fn(),
      removeAttribute: jest.fn()
    };
    return element;
  }

  createMockSupabaseClient() {
    return {
      auth: {
        signUp: jest.fn(),
        signIn: jest.fn(),
        signOut: jest.fn(),
        getSession: jest.fn(),
        onAuthStateChange: jest.fn()
      },
      from: jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(),
            order: jest.fn(() => ({
              limit: jest.fn()
            }))
          }))
        })),
        insert: jest.fn(),
        update: jest.fn(),
        delete: jest.fn()
      }))
    };
  }

  createMockAuthManager() {
    return {
      isAuthenticated: jest.fn().mockResolvedValue(true),
      getCurrentUser: jest.fn().mockReturnValue({ email: 'test@example.com' }),
      signIn: jest.fn().mockResolvedValue({ user: { email: 'test@example.com' } }),
      signOut: jest.fn().mockResolvedValue()
    };
  }

  createMockSupabaseService() {
    return {
      isAvailable: jest.fn().mockReturnValue(true),
      getClient: jest.fn().mockReturnValue(this.createMockSupabaseClient()),
      saveWorkout: jest.fn().mockResolvedValue({ id: 1 }),
      getWorkouts: jest.fn().mockResolvedValue([]),
      saveTrainingLogs: jest.fn().mockResolvedValue([])
    };
  }

  // DOM環境のセットアップ
  setupDOMEnvironment() {
    global.document.getElementById = jest.fn((id) => {
      if (id === 'main-content') {
        return this.createMockElement('div', { id: 'main-content' });
      }
      return this.createMockElement();
    });

    global.document.querySelector = jest.fn((selector) => {
      if (selector === '.nav-item') {
        return this.createMockElement('a', { class: 'nav-item' });
      }
      return this.createMockElement();
    });

    global.document.querySelectorAll = jest.fn((selector) => {
      if (selector === '.nav-item') {
        return [this.createMockElement('a', { class: 'nav-item' })];
      }
      return [];
    });
  }

  // テストデータの生成
  generateTestWorkoutData() {
    return {
      id: 'test-workout-1',
      session_name: 'Test Workout',
      workout_date: '2024-10-23',
      start_time: '2024-10-23T10:00:00Z',
      end_time: '2024-10-23T11:00:00Z',
      total_duration_minutes: 60,
      muscle_groups_trained: ['chest', 'shoulders'],
      session_type: 'strength',
      is_completed: true,
      exercises: [
        {
          name: 'Bench Press',
          muscle_group: 'chest',
          sets: [
            { reps: 10, weight: 80, rest_seconds: 60 }
          ]
        }
      ],
      notes: 'Test workout notes'
    };
  }

  // 非同期テストのヘルパー
  async waitFor(condition, timeout = 1000) {
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
      if (await condition()) {
        return true;
      }
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    throw new Error('Condition not met within timeout');
  }

  // モックのリセット
  resetAllMocks() {
    jest.clearAllMocks();
    jest.clearAllTimers();
  }
}

// デフォルトのテストランナーインスタンス
export const testRunner = new TestRunner();
