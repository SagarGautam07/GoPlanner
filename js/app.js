// App State Management
const AppState = {
    theme: localStorage.getItem('theme') || 'light-theme',
    customTheme: localStorage.getItem('customTheme') || '',
    notifications: JSON.parse(localStorage.getItem('notifications') ?? 'true'),
    userProfile: JSON.parse(localStorage.getItem('userProfile') || '{"name":"Student","avatar":null}'),
    tasks: JSON.parse(localStorage.getItem('tasks') || '[]'),
    exams: JSON.parse(localStorage.getItem('exams') || '[]'),
    studyPlan: JSON.parse(localStorage.getItem('studyPlan') || '{}'),
    streak: JSON.parse(localStorage.getItem('streak') || '{"current":0,"lastStudyDate":null}'),
    events: JSON.parse(localStorage.getItem('events') || '[]'),
    sessions: JSON.parse(localStorage.getItem('sessions') || '[]')
};

// State Change Event System
const StateEvents = {
    listeners: new Map(),
    
    emit(key, value) {
        if (this.listeners.has(key)) {
            this.listeners.get(key).forEach(callback => callback(value));
        }
    },
    
    on(key, callback) {
        if (!this.listeners.has(key)) {
            this.listeners.set(key, new Set());
        }
        this.listeners.get(key).add(callback);
    },
    
    off(key, callback) {
        if (this.listeners.has(key)) {
            this.listeners.get(key).delete(callback);
        }
    }
};

// Theme Management with Transitions
function initializeTheme() {
    document.body.className = AppState.theme;
    if (AppState.customTheme) {
        document.body.classList.add(AppState.customTheme);
    }
    document.documentElement.style.setProperty('--transition-speed', '0.3s');
}

function setTheme(theme, isCustomTheme = false) {
    document.body.classList.add('theme-transition');
    
    if (isCustomTheme) {
        AppState.customTheme = theme;
        saveToLocalStorage('customTheme', theme);
        document.body.className = AppState.theme;
        document.body.classList.add(theme);
    } else {
        AppState.theme = theme;
        saveToLocalStorage('theme', theme);
        document.body.className = theme;
        if (AppState.customTheme) {
            document.body.classList.add(AppState.customTheme);
        }
    }
    
    setTimeout(() => {
        document.body.classList.remove('theme-transition');
    }, 300);
}

// Enhanced Notification System
function showNotification(message, type = 'info', duration = 3000) {
    if (!AppState.notifications) return;

    const notification = document.createElement('div');
    notification.className = `notification ${type} slide-in`;
    notification.setAttribute('role', 'alert');
    notification.innerHTML = `
        <span class="material-icons" aria-hidden="true">${
            type === 'success' ? 'check_circle' : 
            type === 'error' ? 'error' : 
            type === 'warning' ? 'warning' : 
            'info'
        }</span>
        <p>${message}</p>
        <button class="notification-close" aria-label="Close notification">
            <span class="material-icons">close</span>
        </button>
    `;

    // Add close button functionality
    notification.querySelector('.notification-close').addEventListener('click', () => {
        notification.classList.remove('slide-in');
        notification.classList.add('slide-out');
        setTimeout(() => notification.remove(), 300);
    });

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.classList.remove('slide-in');
        notification.classList.add('slide-out');
        setTimeout(() => notification.remove(), 300);
    }, duration);
}

// Date Utilities
function formatDate(date) {
    return new Date(date).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function formatTime(date) {
    return new Date(date).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

function calculateTimeLeft(targetDate) {
    const now = new Date().getTime();
    const target = new Date(targetDate).getTime();
    const difference = target - now;

    if (difference <= 0) return null;

    const days = Math.floor(difference / (1000 * 60 * 60 * 24));
    const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));

    return { days, hours, minutes };
}

// Enhanced Local Storage Management
function saveToLocalStorage(key, value) {
    try {
        const serializedValue = JSON.stringify(value);
        localStorage.setItem(key, serializedValue);
        StateEvents.emit(key, value);
    } catch (error) {
        console.error('Error saving to localStorage:', error);
        showNotification('Error saving data', 'error');
    }
}

function getFromLocalStorage(key, defaultValue) {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
        console.error('Error reading from localStorage:', error);
        return defaultValue;
    }
}

// Enhanced Task Management
function addTask(task) {
    const newTask = {
        id: Date.now(),
        ...task,
        completed: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    AppState.tasks.push(newTask);
    saveToLocalStorage('tasks', AppState.tasks);
    return newTask;
}

function updateTask(taskId, updates) {
    const taskIndex = AppState.tasks.findIndex(task => task.id === taskId);
    if (taskIndex !== -1) {
        AppState.tasks[taskIndex] = { 
            ...AppState.tasks[taskIndex], 
            ...updates,
            updatedAt: new Date().toISOString()
        };
        saveToLocalStorage('tasks', AppState.tasks);
        return AppState.tasks[taskIndex];
    }
    return null;
}

function deleteTask(taskId) {
    AppState.tasks = AppState.tasks.filter(task => task.id !== taskId);
    saveToLocalStorage('tasks', AppState.tasks);
}

// Enhanced Streak Management
function updateStreak() {
    const today = new Date().toDateString();
    const lastStudy = AppState.streak.lastStudyDate;

    if (!lastStudy) {
        AppState.streak = { current: 1, lastStudyDate: today };
    } else {
        const lastStudyDate = new Date(lastStudy);
        const dayDifference = Math.floor((new Date(today) - lastStudyDate) / (1000 * 60 * 60 * 24));

        if (dayDifference === 1) {
            AppState.streak.current += 1;
            AppState.streak.lastStudyDate = today;
        } else if (dayDifference > 1) {
            AppState.streak.current = 1;
            AppState.streak.lastStudyDate = today;
        }
    }

    saveToLocalStorage('streak', AppState.streak);
    return AppState.streak.current;
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    initializeTheme();
});

// Export utilities for use in other modules
window.AppUtils = {
    AppState,
    StateEvents,
    showNotification,
    formatDate,
    formatTime,
    calculateTimeLeft,
    addTask,
    updateTask,
    deleteTask,
    updateStreak,
    setTheme,
    saveToLocalStorage,
    getFromLocalStorage
}; 