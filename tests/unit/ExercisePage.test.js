// ExercisePage.test.js - エクササイズページのテスト

import ExercisePage from '../../js/pages/exercisePage.js';

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

describe('ExercisePage', () => {
  let exercisePage;

  beforeEach(() => {
    exercisePage = ExercisePage;
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    test('should initialize with default values', () => {
      expect(exercisePage.currentExercises).toEqual([]);
      expect(exercisePage.totalExercises).toBe(0);
      expect(exercisePage.currentFilters).toEqual({});
      expect(exercisePage.selectedExercise).toBeNull();
      expect(exercisePage.isLoading).toBe(false);
    });
  });

  describe('init', () => {
    test('should initialize successfully', () => {
      expect(() => exercisePage.init()).not.toThrow();
    });
  });

  describe('setupEventListeners', () => {
    test('should setup event listeners', () => {
      expect(() => exercisePage.setupEventListeners()).not.toThrow();
    });
  });

  describe('setupModalEventListeners', () => {
    test('should setup modal event listeners', () => {
      expect(() => exercisePage.setupModalEventListeners()).not.toThrow();
    });
  });

  describe('setupFileUploadListeners', () => {
    test('should setup file upload listeners', () => {
      expect(() => exercisePage.setupFileUploadListeners()).not.toThrow();
    });
  });

  describe('loadInitialData', () => {
    test('should load initial data', async () => {
      await expect(exercisePage.loadInitialData()).resolves.not.toThrow();
    });
  });

  describe('setupMuscleGroupFilter', () => {
    test('should setup muscle group filter', async () => {
      await expect(exercisePage.setupMuscleGroupFilter()).resolves.not.toThrow();
    });
  });

  describe('setupEquipmentFilter', () => {
    test('should setup equipment filter', async () => {
      await expect(exercisePage.setupEquipmentFilter()).resolves.not.toThrow();
    });
  });

  describe('loadTotalExerciseCount', () => {
    test('should load total exercise count', async () => {
      await expect(exercisePage.loadTotalExerciseCount()).resolves.not.toThrow();
    });
  });

  describe('getEquipmentDisplayName', () => {
    test('should get equipment display name', () => {
      const equipment = 'bodyweight';
      const displayName = exercisePage.getEquipmentDisplayName(equipment);
      expect(typeof displayName).toBe('string');
    });
  });

  describe('loadExercises', () => {
    test('should load exercises', async () => {
      await expect(exercisePage.loadExercises()).resolves.not.toThrow();
    });
  });

  describe('getCurrentFilters', () => {
    test('should get current filters', () => {
      const filters = exercisePage.getCurrentFilters();
      expect(typeof filters).toBe('object');
    });
  });

  describe('performSearch', () => {
    test('should perform search', async () => {
      const searchTerm = 'push';
      await expect(exercisePage.performSearch(searchTerm)).resolves.not.toThrow();
    });
  });

  describe('applyFilters', () => {
    test('should apply filters', async () => {
      await expect(exercisePage.applyFilters()).resolves.not.toThrow();
    });
  });

  describe('updateExerciseCount', () => {
    test('should update exercise count', () => {
      expect(() => exercisePage.updateExerciseCount()).not.toThrow();
    });
  });

  describe('hasActiveFilters', () => {
    test('should check if has active filters', () => {
      const hasActive = exercisePage.hasActiveFilters();
      expect(typeof hasActive).toBe('boolean');
    });
  });

  describe('resetFilters', () => {
    test('should reset filters', async () => {
      await expect(exercisePage.resetFilters()).resolves.not.toThrow();
    });
  });

  describe('renderExercises', () => {
    test('should render exercises', () => {
      expect(() => exercisePage.renderExercises()).not.toThrow();
    });
  });

  describe('renderExerciseCard', () => {
    test('should render exercise card', () => {
      const exercise = { id: 1, name_ja: 'Push-ups', name_en: 'Push-ups', muscle_groups: { name_ja: '胸' }, difficulty_level: 2, equipment: 'bodyweight' };
      const card = exercisePage.renderExerciseCard(exercise);
      expect(typeof card).toBe('string');
    });
  });

  describe('showCategoryDetail', () => {
    test('should show category detail', async () => {
      const muscleGroup = 'chest';
      await expect(exercisePage.showCategoryDetail(muscleGroup)).resolves.not.toThrow();
    });
  });

  describe('renderCategoryDetail', () => {
    test('should render category detail', () => {
      const categoryInfo = { name: '胸筋', nameEn: 'Chest', description: '胸筋の説明' };
      expect(() => exercisePage.renderCategoryDetail(categoryInfo)).not.toThrow();
    });
  });

  describe('applyCategoryFilter', () => {
    test('should apply category filter', async () => {
      const categoryName = '胸筋';
      await expect(exercisePage.applyCategoryFilter(categoryName)).resolves.not.toThrow();
    });
  });

  describe('showExerciseDetail', () => {
    test('should show exercise detail', async () => {
      const exerciseId = '1';
      await expect(exercisePage.showExerciseDetail(exerciseId)).resolves.not.toThrow();
    });
  });

  describe('renderExerciseDetail', () => {
    test('should render exercise detail', () => {
      const exercise = { id: 1, name_ja: 'Push-ups', name_en: 'Push-ups', muscle_groups: { name_ja: '胸' }, difficulty_level: 2, equipment: 'bodyweight' };
      expect(() => exercisePage.renderExerciseDetail(exercise)).not.toThrow();
    });
  });

  describe('showCustomExerciseModal', () => {
    test('should show custom exercise modal', () => {
      expect(() => exercisePage.showCustomExerciseModal()).not.toThrow();
    });
  });

  describe('populateCustomExerciseForm', () => {
    test('should populate custom exercise form', () => {
      const exercise = { id: 1, name_ja: 'Custom Exercise' };
      expect(() => exercisePage.populateCustomExerciseForm(exercise)).not.toThrow();
    });
  });

  describe('saveCustomExercise', () => {
    test('should save custom exercise', async () => {
      await expect(exercisePage.saveCustomExercise()).resolves.not.toThrow();
    });
  });

  describe('uploadMediaFiles', () => {
    test('should upload media files', async () => {
      const exerciseId = '1';
      await expect(exercisePage.uploadMediaFiles(exerciseId)).resolves.not.toThrow();
    });
  });

  describe('getCustomExerciseFormData', () => {
    test('should get custom exercise form data', () => {
      const formData = exercisePage.getCustomExerciseFormData();
      expect(typeof formData).toBe('object');
    });
  });

  describe('generateSearchKeywords', () => {
    test('should generate search keywords', () => {
      const keywords = exercisePage.generateSearchKeywords();
      expect(typeof keywords).toBe('string');
    });
  });

  describe('editCustomExercise', () => {
    test('should edit custom exercise', () => {
      const exercise = { id: 1, name_ja: 'Custom Exercise' };
      expect(() => exercisePage.editCustomExercise(exercise)).not.toThrow();
    });
  });

  describe('deleteCustomExercise', () => {
    test('should delete custom exercise', async () => {
      const exerciseId = '1';
      await expect(exercisePage.deleteCustomExercise(exerciseId)).resolves.not.toThrow();
    });
  });

  describe('showDetailModal', () => {
    test('should show detail modal', () => {
      expect(() => exercisePage.showDetailModal()).not.toThrow();
    });
  });

  describe('closeDetailModal', () => {
    test('should close detail modal', () => {
      expect(() => exercisePage.closeDetailModal()).not.toThrow();
    });
  });

  describe('closeCustomModal', () => {
    test('should close custom modal', () => {
      expect(() => exercisePage.closeCustomModal()).not.toThrow();
    });
  });

  describe('closeAllModals', () => {
    test('should close all modals', () => {
      expect(() => exercisePage.closeAllModals()).not.toThrow();
    });
  });

  describe('showLoading', () => {
    test('should show loading', () => {
      expect(() => exercisePage.showLoading(true)).not.toThrow();
    });
  });

  describe('handleImageUpload', () => {
    test('should handle image upload', async () => {
      const mockEvent = { target: { files: [new File([''], 'test.jpg', { type: 'image/jpeg' })] } };
      await expect(exercisePage.handleImageUpload(mockEvent)).resolves.not.toThrow();
    });
  });

  describe('handleVideoUpload', () => {
    test('should handle video upload', async () => {
      const mockEvent = { target: { files: [new File([''], 'test.mp4', { type: 'video/mp4' })] } };
      await expect(exercisePage.handleVideoUpload(mockEvent)).resolves.not.toThrow();
    });
  });

  describe('showImagePreview', () => {
    test('should show image preview', () => {
      const previewUrl = 'data:image/jpeg;base64,test';
      expect(() => exercisePage.showImagePreview(previewUrl)).not.toThrow();
    });
  });

  describe('showVideoPreview', () => {
    test('should show video preview', () => {
      const file = new File([''], 'test.mp4', { type: 'video/mp4' });
      expect(() => exercisePage.showVideoPreview(file)).not.toThrow();
    });
  });

  describe('removeImage', () => {
    test('should remove image', () => {
      expect(() => exercisePage.removeImage()).not.toThrow();
    });
  });

  describe('removeVideo', () => {
    test('should remove video', () => {
      expect(() => exercisePage.removeVideo()).not.toThrow();
    });
  });

  describe('scrollToExerciseList', () => {
    test('should scroll to exercise list', () => {
      expect(() => exercisePage.scrollToExerciseList()).not.toThrow();
    });
  });

  describe('highlightExerciseList', () => {
    test('should highlight exercise list', () => {
      expect(() => exercisePage.highlightExerciseList()).not.toThrow();
    });
  });

  describe('showDeleteConfirmDialog', () => {
    test('should show delete confirm dialog', async () => {
      const message = 'Are you sure?';
      const result = await exercisePage.showDeleteConfirmDialog(message);
      expect(typeof result).toBe('boolean');
    });
  });

  describe('setupTooltips', () => {
    test('should setup tooltips', () => {
      expect(() => exercisePage.setupTooltips()).not.toThrow();
    });
  });
});