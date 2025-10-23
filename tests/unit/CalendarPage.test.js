// CalendarPage.test.js - カレンダーページのテスト

import CalendarPage from '../../js/pages/calendarPage.js';

// DOM モック
const mockElement = {
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  querySelector: jest.fn(),
  querySelectorAll: jest.fn(() => []),
  innerHTML: '',
  style: {},
  classList: {
    add: jest.fn(),
    remove: jest.fn(),
    contains: jest.fn(),
    toggle: jest.fn()
  },
  setAttribute: jest.fn(),
  getAttribute: jest.fn(),
  appendChild: jest.fn(),
  removeChild: jest.fn(),
  click: jest.fn(),
  focus: jest.fn(),
  blur: jest.fn()
};

// document モック
Object.defineProperty(document, 'getElementById', {
  value: jest.fn(() => mockElement),
  writable: true
});

Object.defineProperty(document, 'querySelector', {
  value: jest.fn(() => mockElement),
  writable: true
});

Object.defineProperty(document, 'querySelectorAll', {
  value: jest.fn(() => []),
  writable: true
});

Object.defineProperty(document, 'createElement', {
  value: jest.fn(() => mockElement),
  writable: true
});

Object.defineProperty(document, 'addEventListener', {
  value: jest.fn(),
  writable: true
});

Object.defineProperty(document, 'removeEventListener', {
  value: jest.fn(),
  writable: true
});

// window.location のモック
delete window.location;
window.location = { href: '' };

describe('CalendarPage', () => {
  let calendarPage;

  beforeEach(() => {
    calendarPage = CalendarPage;
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    test('should initialize with default values', () => {
      expect(calendarPage.currentDate).toBeInstanceOf(Date);
      expect(calendarPage.workoutData).toEqual([]);
      expect(calendarPage.plannedWorkouts).toEqual([]);
      expect(calendarPage.selectedDate).toBeNull();
      expect(calendarPage.isLoading).toBe(false);
    });
  });

  describe('initialize', () => {
    test('should initialize successfully', async () => {
      await expect(calendarPage.initialize()).resolves.not.toThrow();
    });
  });

  describe('loadWorkoutData', () => {
    test('should load workout data', async () => {
      await expect(calendarPage.loadWorkoutData()).resolves.not.toThrow();
    });
  });

  describe('loadPlannedWorkouts', () => {
    test('should load planned workouts', async () => {
      const result = await calendarPage.loadPlannedWorkouts();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('setupCalendarInterface', () => {
    test('should setup calendar interface', () => {
      expect(() => calendarPage.setupCalendarInterface()).not.toThrow();
    });
  });

  describe('setupEventListeners', () => {
    test('should setup event listeners', () => {
      expect(() => calendarPage.setupEventListeners()).not.toThrow();
    });
  });

  describe('setupAuthButton', () => {
    test('should setup auth button', () => {
      expect(() => calendarPage.setupAuthButton()).not.toThrow();
    });
  });

  describe('renderCalendar', () => {
    test('should render calendar', () => {
      expect(() => calendarPage.renderCalendar()).not.toThrow();
    });
  });

  describe('getCurrentMonth', () => {
    test('should return current month', () => {
      const month = calendarPage.getCurrentMonth();
      expect(typeof month).toBe('number');
      expect(month).toBeGreaterThanOrEqual(0);
      expect(month).toBeLessThanOrEqual(11);
    });
  });

  describe('getCurrentYear', () => {
    test('should return current year', () => {
      const year = calendarPage.getCurrentYear();
      expect(typeof year).toBe('number');
      expect(year).toBeGreaterThan(2020);
    });
  });

  describe('showLoginPrompt', () => {
    test('should show login prompt', () => {
      expect(() => calendarPage.showLoginPrompt()).not.toThrow();
    });
  });
});