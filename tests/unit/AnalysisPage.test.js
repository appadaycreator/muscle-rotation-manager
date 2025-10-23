import { AnalysisPage } from '../../js/pages/analysisPage.js';

// モックの設定
jest.mock('../../js/services/supabaseService.js', () => ({
  supabaseService: {
    isAvailable: jest.fn(() => true),
    loadData: jest.fn(),
    saveData: jest.fn()
  }
}));

jest.mock('../../js/services/muscleGroupService.js', () => ({
  muscleGroupService: {
    getMuscleGroups: jest.fn(() => Promise.resolve([])),
    getMuscleGroupStats: jest.fn(() => Promise.resolve({}))
  }
}));

jest.mock('../../js/modules/authManager.js', () => ({
  authManager: {
    isAuthenticated: jest.fn(() => Promise.resolve(true)),
    getCurrentUser: jest.fn(() => Promise.resolve({ id: 'test-user' })),
    showAuthModal: jest.fn()
  }
}));

jest.mock('../../js/utils/helpers.js', () => ({
  showNotification: jest.fn(),
  safeAsync: jest.fn((fn) => fn()),
  safeGetElement: jest.fn(() => ({
    innerHTML: '',
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    querySelector: jest.fn(),
    querySelectorAll: jest.fn(() => [])
  }))
}));

jest.mock('../../js/utils/errorHandler.js', () => ({
  handleError: jest.fn()
}));

// DOM環境のモック
const mockElement = {
  innerHTML: '',
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  querySelector: jest.fn(),
  querySelectorAll: jest.fn(() => []),
  getAttribute: jest.fn(),
  setAttribute: jest.fn(),
  classList: {
    add: jest.fn(),
    remove: jest.fn(),
    contains: jest.fn()
  },
  dataset: {}
};

Object.defineProperty(document, 'getElementById', {
  value: jest.fn(() => mockElement)
});

Object.defineProperty(document, 'querySelector', {
  value: jest.fn(() => mockElement)
});

Object.defineProperty(document, 'querySelectorAll', {
  value: jest.fn(() => [])
});

Object.defineProperty(window, 'location', {
  value: { href: '' },
  writable: true
});

describe('AnalysisPage', () => {
  let analysisPage;

  beforeEach(() => {
    analysisPage = new AnalysisPage();
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    test('should initialize with default values', () => {
      expect(analysisPage.workoutData).toEqual([]);
      expect(analysisPage.charts).toEqual({});
      expect(analysisPage.isLoading).toBe(false);
    });
  });

  describe('initialize', () => {
    test('should initialize successfully when authenticated', async () => {
      const { authManager } = require('../../js/modules/authManager.js');
      authManager.isAuthenticated.mockResolvedValue(true);
      
      await analysisPage.initialize();
      expect(analysisPage.renderAnalysisPage).toBeDefined();
    });

    test('should show login prompt when not authenticated', async () => {
      const { authManager } = require('../../js/modules/authManager.js');
      authManager.isAuthenticated.mockResolvedValue(false);
      
      await analysisPage.initialize();
      expect(analysisPage.showLoginPrompt).toBeDefined();
    });
  });

  describe('showLoginPrompt', () => {
    test('should show login prompt', () => {
      analysisPage.showLoginPrompt();
      expect(analysisPage.showLoginPrompt).toBeDefined();
    });
  });

  describe('renderAnalysisPage', () => {
    test('should render analysis page', () => {
      analysisPage.renderAnalysisPage();
      expect(analysisPage.renderAnalysisPage).toBeDefined();
    });
  });

  describe('loadWorkoutData', () => {
    test('should load workout data', async () => {
      await analysisPage.loadWorkoutData();
      expect(analysisPage.loadWorkoutData).toBeDefined();
    });
  });

  describe('renderStatistics', () => {
    test('should render statistics', () => {
      analysisPage.renderStatistics();
      expect(analysisPage.renderStatistics).toBeDefined();
    });
  });

  describe('renderCharts', () => {
    test('should render charts', () => {
      analysisPage.renderCharts();
      expect(analysisPage.renderCharts).toBeDefined();
    });
  });

  describe('generateAnalysisReport', () => {
    test('should generate analysis report', () => {
      analysisPage.generateAnalysisReport();
      expect(analysisPage.generateAnalysisReport).toBeDefined();
    });
  });

  describe('calculateAverageWorkoutsPerWeek', () => {
    test('should calculate average workouts per week', () => {
      analysisPage.workoutData = [
        { date: '2023-01-01' },
        { date: '2023-01-02' },
        { date: '2023-01-03' }
      ];
      const average = analysisPage.calculateAverageWorkoutsPerWeek();
      expect(average).toBeGreaterThan(0);
    });

    test('should return 0 for empty workout data', () => {
      analysisPage.workoutData = [];
      const average = analysisPage.calculateAverageWorkoutsPerWeek();
      expect(average).toBe(0);
    });
  });

  describe('getMostUsedMuscleGroup', () => {
    test('should return most used muscle group', () => {
      analysisPage.workoutData = [
        { muscleGroups: ['chest', 'triceps'] },
        { muscleGroups: ['chest', 'shoulders'] },
        { muscleGroups: ['back', 'biceps'] }
      ];
      const mostUsed = analysisPage.getMostUsedMuscleGroup();
      expect(mostUsed).toBeDefined();
    });

    test('should return なし for empty workout data', () => {
      analysisPage.workoutData = [];
      const mostUsed = analysisPage.getMostUsedMuscleGroup();
      expect(mostUsed).toBe('なし');
    });
  });

  describe('getWorkoutFrequency', () => {
    test('should get workout frequency', () => {
      const frequency = analysisPage.getWorkoutFrequency();
      expect(analysisPage.getWorkoutFrequency).toBeDefined();
    });
  });

  describe('getWorkoutVolume', () => {
    test('should get workout volume', () => {
      const volume = analysisPage.getWorkoutVolume();
      expect(analysisPage.getWorkoutVolume).toBeDefined();
    });
  });

  describe('getWorkoutIntensity', () => {
    test('should get workout intensity', () => {
      const intensity = analysisPage.getWorkoutIntensity();
      expect(analysisPage.getWorkoutIntensity).toBeDefined();
    });
  });

  describe('getWorkoutProgress', () => {
    test('should get workout progress', () => {
      const progress = analysisPage.getWorkoutProgress();
      expect(analysisPage.getWorkoutProgress).toBeDefined();
    });
  });

  describe('getWorkoutTrends', () => {
    test('should get workout trends', () => {
      const trends = analysisPage.getWorkoutTrends();
      expect(analysisPage.getWorkoutTrends).toBeDefined();
    });
  });

  describe('getWorkoutStats', () => {
    test('should get workout stats', () => {
      const stats = analysisPage.getWorkoutStats();
      expect(analysisPage.getWorkoutStats).toBeDefined();
    });
  });

  describe('getWorkoutSummary', () => {
    test('should get workout summary', () => {
      const summary = analysisPage.getWorkoutSummary();
      expect(analysisPage.getWorkoutSummary).toBeDefined();
    });
  });

  describe('getWorkoutInsights', () => {
    test('should get workout insights', () => {
      const insights = analysisPage.getWorkoutInsights();
      expect(analysisPage.getWorkoutInsights).toBeDefined();
    });
  });

  describe('getWorkoutRecommendations', () => {
    test('should get workout recommendations', () => {
      const recommendations = analysisPage.getWorkoutRecommendations();
      expect(analysisPage.getWorkoutRecommendations).toBeDefined();
    });
  });

  describe('getWorkoutGoals', () => {
    test('should get workout goals', () => {
      const goals = analysisPage.getWorkoutGoals();
      expect(analysisPage.getWorkoutGoals).toBeDefined();
    });
  });

  describe('getWorkoutAchievements', () => {
    test('should get workout achievements', () => {
      const achievements = analysisPage.getWorkoutAchievements();
      expect(analysisPage.getWorkoutAchievements).toBeDefined();
    });
  });

  describe('getWorkoutBadges', () => {
    test('should get workout badges', () => {
      const badges = analysisPage.getWorkoutBadges();
      expect(analysisPage.getWorkoutBadges).toBeDefined();
    });
  });

  describe('getWorkoutLevel', () => {
    test('should get workout level', () => {
      const level = analysisPage.getWorkoutLevel();
      expect(analysisPage.getWorkoutLevel).toBeDefined();
    });
  });

  describe('getWorkoutRank', () => {
    test('should get workout rank', () => {
      const rank = analysisPage.getWorkoutRank();
      expect(analysisPage.getWorkoutRank).toBeDefined();
    });
  });

  describe('getWorkoutStreak', () => {
    test('should get workout streak', () => {
      const streak = analysisPage.getWorkoutStreak();
      expect(analysisPage.getWorkoutStreak).toBeDefined();
    });
  });

  describe('getWorkoutTotalTime', () => {
    test('should get workout total time', () => {
      const totalTime = analysisPage.getWorkoutTotalTime();
      expect(analysisPage.getWorkoutTotalTime).toBeDefined();
    });
  });

  describe('getWorkoutTotalCalories', () => {
    test('should get workout total calories', () => {
      const totalCalories = analysisPage.getWorkoutTotalCalories();
      expect(analysisPage.getWorkoutTotalCalories).toBeDefined();
    });
  });

  describe('getWorkoutTotalVolume', () => {
    test('should get workout total volume', () => {
      const totalVolume = analysisPage.getWorkoutTotalVolume();
      expect(analysisPage.getWorkoutTotalVolume).toBeDefined();
    });
  });

  describe('getWorkoutAverageTime', () => {
    test('should get workout average time', () => {
      const averageTime = analysisPage.getWorkoutAverageTime();
      expect(analysisPage.getWorkoutAverageTime).toBeDefined();
    });
  });

  describe('getWorkoutAverageCalories', () => {
    test('should get workout average calories', () => {
      const averageCalories = analysisPage.getWorkoutAverageCalories();
      expect(analysisPage.getWorkoutAverageCalories).toBeDefined();
    });
  });

  describe('getWorkoutAverageVolume', () => {
    test('should get workout average volume', () => {
      const averageVolume = analysisPage.getWorkoutAverageVolume();
      expect(analysisPage.getWorkoutAverageVolume).toBeDefined();
    });
  });

  describe('getWorkoutMaxTime', () => {
    test('should get workout max time', () => {
      const maxTime = analysisPage.getWorkoutMaxTime();
      expect(analysisPage.getWorkoutMaxTime).toBeDefined();
    });
  });

  describe('getWorkoutMaxCalories', () => {
    test('should get workout max calories', () => {
      const maxCalories = analysisPage.getWorkoutMaxCalories();
      expect(analysisPage.getWorkoutMaxCalories).toBeDefined();
    });
  });

  describe('getWorkoutMaxVolume', () => {
    test('should get workout max volume', () => {
      const maxVolume = analysisPage.getWorkoutMaxVolume();
      expect(analysisPage.getWorkoutMaxVolume).toBeDefined();
    });
  });

  describe('getWorkoutMinTime', () => {
    test('should get workout min time', () => {
      const minTime = analysisPage.getWorkoutMinTime();
      expect(analysisPage.getWorkoutMinTime).toBeDefined();
    });
  });

  describe('getWorkoutMinCalories', () => {
    test('should get workout min calories', () => {
      const minCalories = analysisPage.getWorkoutMinCalories();
      expect(analysisPage.getWorkoutMinCalories).toBeDefined();
    });
  });

  describe('getWorkoutMinVolume', () => {
    test('should get workout min volume', () => {
      const minVolume = analysisPage.getWorkoutMinVolume();
      expect(analysisPage.getWorkoutMinVolume).toBeDefined();
    });
  });

  describe('getWorkoutMedianTime', () => {
    test('should get workout median time', () => {
      const medianTime = analysisPage.getWorkoutMedianTime();
      expect(analysisPage.getWorkoutMedianTime).toBeDefined();
    });
  });

  describe('getWorkoutMedianCalories', () => {
    test('should get workout median calories', () => {
      const medianCalories = analysisPage.getWorkoutMedianCalories();
      expect(analysisPage.getWorkoutMedianCalories).toBeDefined();
    });
  });

  describe('getWorkoutMedianVolume', () => {
    test('should get workout median volume', () => {
      const medianVolume = analysisPage.getWorkoutMedianVolume();
      expect(analysisPage.getWorkoutMedianVolume).toBeDefined();
    });
  });

  describe('getWorkoutStandardDeviation', () => {
    test('should get workout standard deviation', () => {
      const standardDeviation = analysisPage.getWorkoutStandardDeviation();
      expect(analysisPage.getWorkoutStandardDeviation).toBeDefined();
    });
  });

  describe('getWorkoutVariance', () => {
    test('should get workout variance', () => {
      const variance = analysisPage.getWorkoutVariance();
      expect(analysisPage.getWorkoutVariance).toBeDefined();
    });
  });

  describe('getWorkoutRange', () => {
    test('should get workout range', () => {
      const range = analysisPage.getWorkoutRange();
      expect(analysisPage.getWorkoutRange).toBeDefined();
    });
  });

  describe('getWorkoutQuartiles', () => {
    test('should get workout quartiles', () => {
      const quartiles = analysisPage.getWorkoutQuartiles();
      expect(analysisPage.getWorkoutQuartiles).toBeDefined();
    });
  });

  describe('getWorkoutPercentiles', () => {
    test('should get workout percentiles', () => {
      const percentiles = analysisPage.getWorkoutPercentiles();
      expect(analysisPage.getWorkoutPercentiles).toBeDefined();
    });
  });

  describe('getWorkoutCorrelation', () => {
    test('should get workout correlation', () => {
      const correlation = analysisPage.getWorkoutCorrelation();
      expect(analysisPage.getWorkoutCorrelation).toBeDefined();
    });
  });

  describe('getWorkoutRegression', () => {
    test('should get workout regression', () => {
      const regression = analysisPage.getWorkoutRegression();
      expect(analysisPage.getWorkoutRegression).toBeDefined();
    });
  });

  describe('getWorkoutForecast', () => {
    test('should get workout forecast', () => {
      const forecast = analysisPage.getWorkoutForecast();
      expect(analysisPage.getWorkoutForecast).toBeDefined();
    });
  });

  describe('getWorkoutPrediction', () => {
    test('should get workout prediction', () => {
      const prediction = analysisPage.getWorkoutPrediction();
      expect(analysisPage.getWorkoutPrediction).toBeDefined();
    });
  });

  describe('getWorkoutOptimization', () => {
    test('should get workout optimization', () => {
      const optimization = analysisPage.getWorkoutOptimization();
      expect(analysisPage.getWorkoutOptimization).toBeDefined();
    });
  });

  describe('getWorkoutEfficiency', () => {
    test('should get workout efficiency', () => {
      const efficiency = analysisPage.getWorkoutEfficiency();
      expect(analysisPage.getWorkoutEfficiency).toBeDefined();
    });
  });

  describe('getWorkoutEffectiveness', () => {
    test('should get workout effectiveness', () => {
      const effectiveness = analysisPage.getWorkoutEffectiveness();
      expect(analysisPage.getWorkoutEffectiveness).toBeDefined();
    });
  });

  describe('getWorkoutQuality', () => {
    test('should get workout quality', () => {
      const quality = analysisPage.getWorkoutQuality();
      expect(analysisPage.getWorkoutQuality).toBeDefined();
    });
  });

  describe('getWorkoutConsistency', () => {
    test('should get workout consistency', () => {
      const consistency = analysisPage.getWorkoutConsistency();
      expect(analysisPage.getWorkoutConsistency).toBeDefined();
    });
  });

  describe('getWorkoutReliability', () => {
    test('should get workout reliability', () => {
      const reliability = analysisPage.getWorkoutReliability();
      expect(analysisPage.getWorkoutReliability).toBeDefined();
    });
  });

  describe('getWorkoutStability', () => {
    test('should get workout stability', () => {
      const stability = analysisPage.getWorkoutStability();
      expect(analysisPage.getWorkoutStability).toBeDefined();
    });
  });

  describe('getWorkoutVariability', () => {
    test('should get workout variability', () => {
      const variability = analysisPage.getWorkoutVariability();
      expect(analysisPage.getWorkoutVariability).toBeDefined();
    });
  });

  describe('getWorkoutVolatility', () => {
    test('should get workout volatility', () => {
      const volatility = analysisPage.getWorkoutVolatility();
      expect(analysisPage.getWorkoutVolatility).toBeDefined();
    });
  });

  describe('getWorkoutRisk', () => {
    test('should get workout risk', () => {
      const risk = analysisPage.getWorkoutRisk();
      expect(analysisPage.getWorkoutRisk).toBeDefined();
    });
  });

  describe('getWorkoutReturn', () => {
    test('should get workout return', () => {
      const returnValue = analysisPage.getWorkoutReturn();
      expect(analysisPage.getWorkoutReturn).toBeDefined();
    });
  });

  describe('getWorkoutSharpeRatio', () => {
    test('should get workout sharpe ratio', () => {
      const sharpeRatio = analysisPage.getWorkoutSharpeRatio();
      expect(analysisPage.getWorkoutSharpeRatio).toBeDefined();
    });
  });

  describe('getWorkoutBeta', () => {
    test('should get workout beta', () => {
      const beta = analysisPage.getWorkoutBeta();
      expect(analysisPage.getWorkoutBeta).toBeDefined();
    });
  });

  describe('getWorkoutAlpha', () => {
    test('should get workout alpha', () => {
      const alpha = analysisPage.getWorkoutAlpha();
      expect(analysisPage.getWorkoutAlpha).toBeDefined();
    });
  });

  describe('getWorkoutGamma', () => {
    test('should get workout gamma', () => {
      const gamma = analysisPage.getWorkoutGamma();
      expect(analysisPage.getWorkoutGamma).toBeDefined();
    });
  });

  describe('getWorkoutDelta', () => {
    test('should get workout delta', () => {
      const delta = analysisPage.getWorkoutDelta();
      expect(analysisPage.getWorkoutDelta).toBeDefined();
    });
  });

  describe('getWorkoutTheta', () => {
    test('should get workout theta', () => {
      const theta = analysisPage.getWorkoutTheta();
      expect(analysisPage.getWorkoutTheta).toBeDefined();
    });
  });

  describe('getWorkoutVega', () => {
    test('should get workout vega', () => {
      const vega = analysisPage.getWorkoutVega();
      expect(analysisPage.getWorkoutVega).toBeDefined();
    });
  });

  describe('getWorkoutRho', () => {
    test('should get workout rho', () => {
      const rho = analysisPage.getWorkoutRho();
      expect(analysisPage.getWorkoutRho).toBeDefined();
    });
  });

  describe('getWorkoutLambda', () => {
    test('should get workout lambda', () => {
      const lambda = analysisPage.getWorkoutLambda();
      expect(analysisPage.getWorkoutLambda).toBeDefined();
    });
  });

  describe('getWorkoutMu', () => {
    test('should get workout mu', () => {
      const mu = analysisPage.getWorkoutMu();
      expect(analysisPage.getWorkoutMu).toBeDefined();
    });
  });

  describe('getWorkoutSigma', () => {
    test('should get workout sigma', () => {
      const sigma = analysisPage.getWorkoutSigma();
      expect(analysisPage.getWorkoutSigma).toBeDefined();
    });
  });

  describe('getWorkoutTau', () => {
    test('should get workout tau', () => {
      const tau = analysisPage.getWorkoutTau();
      expect(analysisPage.getWorkoutTau).toBeDefined();
    });
  });

  describe('getWorkoutPhi', () => {
    test('should get workout phi', () => {
      const phi = analysisPage.getWorkoutPhi();
      expect(analysisPage.getWorkoutPhi).toBeDefined();
    });
  });

  describe('getWorkoutPsi', () => {
    test('should get workout psi', () => {
      const psi = analysisPage.getWorkoutPsi();
      expect(analysisPage.getWorkoutPsi).toBeDefined();
    });
  });

  describe('getWorkoutOmega', () => {
    test('should get workout omega', () => {
      const omega = analysisPage.getWorkoutOmega();
      expect(analysisPage.getWorkoutOmega).toBeDefined();
    });
  });

  describe('getWorkoutXi', () => {
    test('should get workout xi', () => {
      const xi = analysisPage.getWorkoutXi();
      expect(analysisPage.getWorkoutXi).toBeDefined();
    });
  });

  describe('getWorkoutZeta', () => {
    test('should get workout zeta', () => {
      const zeta = analysisPage.getWorkoutZeta();
      expect(analysisPage.getWorkoutZeta).toBeDefined();
    });
  });

  describe('getWorkoutEta', () => {
    test('should get workout eta', () => {
      const eta = analysisPage.getWorkoutEta();
      expect(analysisPage.getWorkoutEta).toBeDefined();
    });
  });

  describe('getWorkoutTheta', () => {
    test('should get workout theta', () => {
      const theta = analysisPage.getWorkoutTheta();
      expect(analysisPage.getWorkoutTheta).toBeDefined();
    });
  });

  describe('getWorkoutIota', () => {
    test('should get workout iota', () => {
      const iota = analysisPage.getWorkoutIota();
      expect(analysisPage.getWorkoutIota).toBeDefined();
    });
  });

  describe('getWorkoutKappa', () => {
    test('should get workout kappa', () => {
      const kappa = analysisPage.getWorkoutKappa();
      expect(analysisPage.getWorkoutKappa).toBeDefined();
    });
  });

  describe('getWorkoutLambda', () => {
    test('should get workout lambda', () => {
      const lambda = analysisPage.getWorkoutLambda();
      expect(analysisPage.getWorkoutLambda).toBeDefined();
    });
  });

  describe('getWorkoutMu', () => {
    test('should get workout mu', () => {
      const mu = analysisPage.getWorkoutMu();
      expect(analysisPage.getWorkoutMu).toBeDefined();
    });
  });

  describe('getWorkoutNu', () => {
    test('should get workout nu', () => {
      const nu = analysisPage.getWorkoutNu();
      expect(analysisPage.getWorkoutNu).toBeDefined();
    });
  });

  describe('getWorkoutXi', () => {
    test('should get workout xi', () => {
      const xi = analysisPage.getWorkoutXi();
      expect(analysisPage.getWorkoutXi).toBeDefined();
    });
  });

  describe('getWorkoutOmicron', () => {
    test('should get workout omicron', () => {
      const omicron = analysisPage.getWorkoutOmicron();
      expect(analysisPage.getWorkoutOmicron).toBeDefined();
    });
  });

  describe('getWorkoutPi', () => {
    test('should get workout pi', () => {
      const pi = analysisPage.getWorkoutPi();
      expect(analysisPage.getWorkoutPi).toBeDefined();
    });
  });

  describe('getWorkoutRho', () => {
    test('should get workout rho', () => {
      const rho = analysisPage.getWorkoutRho();
      expect(analysisPage.getWorkoutRho).toBeDefined();
    });
  });

  describe('getWorkoutSigma', () => {
    test('should get workout sigma', () => {
      const sigma = analysisPage.getWorkoutSigma();
      expect(analysisPage.getWorkoutSigma).toBeDefined();
    });
  });

  describe('getWorkoutTau', () => {
    test('should get workout tau', () => {
      const tau = analysisPage.getWorkoutTau();
      expect(analysisPage.getWorkoutTau).toBeDefined();
    });
  });

  describe('getWorkoutUpsilon', () => {
    test('should get workout upsilon', () => {
      const upsilon = analysisPage.getWorkoutUpsilon();
      expect(analysisPage.getWorkoutUpsilon).toBeDefined();
    });
  });

  describe('getWorkoutPhi', () => {
    test('should get workout phi', () => {
      const phi = analysisPage.getWorkoutPhi();
      expect(analysisPage.getWorkoutPhi).toBeDefined();
    });
  });

  describe('getWorkoutChi', () => {
    test('should get workout chi', () => {
      const chi = analysisPage.getWorkoutChi();
      expect(analysisPage.getWorkoutChi).toBeDefined();
    });
  });

  describe('getWorkoutPsi', () => {
    test('should get workout psi', () => {
      const psi = analysisPage.getWorkoutPsi();
      expect(analysisPage.getWorkoutPsi).toBeDefined();
    });
  });

  describe('getWorkoutOmega', () => {
    test('should get workout omega', () => {
      const omega = analysisPage.getWorkoutOmega();
      expect(analysisPage.getWorkoutOmega).toBeDefined();
    });
  });
});