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
    }
}

// Initialize dashboard
function initializeDashboard() {
    // Muscle part click handlers
    document.querySelectorAll('.muscle-part').forEach(part => {
        part.addEventListener('click', () => {
            const muscle = part.dataset.muscle;
            console.log(`Clicked muscle part: ${muscle}`);
            // Add muscle part specific functionality here
        });
    });
}

// Initialize workout page
function initializeWorkout() {
    // Quick start button handlers
    document.querySelectorAll('.quick-start-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const muscle = btn.dataset.muscle;
            console.log(`Quick start workout for: ${muscle}`);
            // Add workout start functionality here
        });
    });
}

// Initialize calendar page
function initializeCalendar() {
    // Calendar functionality will be added here
    console.log('Calendar page initialized');
}

// Initialize analytics page
function initializeAnalytics() {
    // Analytics functionality will be added here
    console.log('Analytics page initialized');
}

// Initialize exercises page
function initializeExercises() {
    // Exercises functionality will be added here
    console.log('Exercises page initialized');
}

// Initialize settings page
function initializeSettings() {
    // Settings functionality will be added here
    console.log('Settings page initialized');
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
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        
        if (session) {
            currentUser = session.user;
            updateAuthUI();
            showNotification('ログイン済みです', 'success');
        }
    } catch (error) {
        console.error('Session check error:', error);
    }
}

// Update authentication UI
function updateAuthUI() {
    const loginBtn = document.getElementById('login-btn');
    const logoutBtn = document.getElementById('logout-btn');
    
    if (currentUser) {
        if (loginBtn) loginBtn.classList.add('hidden');
        if (logoutBtn) logoutBtn.classList.remove('hidden');
    } else {
        if (loginBtn) loginBtn.classList.remove('hidden');
        if (logoutBtn) logoutBtn.classList.add('hidden');
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
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });
        
        if (error) throw error;
        
        currentUser = data.user;
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