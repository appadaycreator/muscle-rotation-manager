// CalendarPage.test.js - カレンダーページのテスト

import CalendarPage from '../../js/pages/calendarPage.js';

describe('CalendarPage', () => {
  test('should export CalendarPage instance', () => {
    expect(CalendarPage).toBeDefined();
    expect(typeof CalendarPage).toBe('object');
  });

  test('should have initialize method', () => {
    expect(typeof CalendarPage.initialize).toBe('function');
  });

  test('should have loadWorkoutData method', () => {
    expect(typeof CalendarPage.loadWorkoutData).toBe('function');
  });

  test('should have renderCalendar method', () => {
    expect(typeof CalendarPage.renderCalendar).toBe('function');
  });
});
