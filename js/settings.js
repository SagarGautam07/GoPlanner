// Settings Page Initialization
document.addEventListener('DOMContentLoaded', () => {
    initializeSettings();
    setupEventListeners();
});

// Initialize Settings
function initializeSettings() {
    loadUserProfile();
    loadThemeSettings();
    loadNotificationSettings();
}

// Event Listeners Setup
function setupEventListeners() {
    // Profile Form
    document.getElementById('avatarUpload').addEventListener('change', handleAvatarUpload);
    document.getElementById('userName').addEventListener('input', debounce(updateUserProfile, 500));
    document.getElementById('userEmail').addEventListener('input', debounce(updateUserProfile, 500));

    // Theme Settings
    document.querySelectorAll('.theme-button').forEach(button => {
        button.addEventListener('click', () => setThemeMode(button.dataset.theme));
    });

    document.querySelectorAll('.color-option').forEach(button => {
        button.addEventListener('click', () => setColorTheme(button.dataset.theme));
    });

    // Quick Theme Toggle
    document.querySelector('.theme-toggle-btn').addEventListener('click', toggleTheme);

    // Notification Settings
    document.querySelectorAll('.toggle-switch input').forEach(toggle => {
        toggle.addEventListener('change', handleNotificationToggle);
    });

    // Data Management
    document.getElementById('exportData').addEventListener('click', handleDataExport);
    document.getElementById('importData').addEventListener('click', handleDataImport);
    document.getElementById('clearData').addEventListener('click', handleDataClear);
}

// Profile Management
function loadUserProfile() {
    const profile = AppUtils.AppState.userProfile;
    document.getElementById('userName').value = profile.name || '';
    document.getElementById('userEmail').value = profile.email || '';
    
    if (profile.avatar) {
        document.getElementById('avatarPreview').src = profile.avatar;
        document.getElementById('avatarPreview').classList.add('has-avatar');
    }
}

function handleAvatarUpload(event) {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const avatar = e.target.result;
            const preview = document.getElementById('avatarPreview');
            preview.src = avatar;
            preview.classList.add('has-avatar');
            updateUserProfile({ avatar });
        };
        reader.readAsDataURL(file);
    }
}

function updateUserProfile(updates = {}) {
    const name = document.getElementById('userName').value;
    const email = document.getElementById('userEmail').value;
    
    AppUtils.AppState.userProfile = {
        ...AppUtils.AppState.userProfile,
        name,
        email,
        ...updates
    };
    
    AppUtils.saveToLocalStorage('userProfile', AppUtils.AppState.userProfile);
    AppUtils.showNotification('Profile updated successfully', 'success');
}

// Theme Management
function loadThemeSettings() {
    const currentTheme = ThemeManager.getCurrentTheme();
    
    // Set active theme mode button
    document.querySelectorAll('.theme-button').forEach(button => {
        button.classList.toggle('active', button.dataset.theme === currentTheme.theme);
    });

    // Set active color theme
    document.querySelectorAll('.color-option').forEach(button => {
        button.classList.toggle('active', button.dataset.theme === currentTheme.customTheme);
    });

    // Update theme toggle button state
    updateThemeToggleButton(currentTheme.theme);
}

function setThemeMode(theme) {
    ThemeManager.setTheme(theme);
    updateThemeToggleButton(theme);
    
    // Update theme buttons
    document.querySelectorAll('.theme-button').forEach(button => {
        button.classList.toggle('active', button.dataset.theme === theme);
    });
}

function setColorTheme(theme) {
    ThemeManager.setTheme(theme, true);
    
    // Update color theme buttons
    document.querySelectorAll('.color-option').forEach(button => {
        button.classList.toggle('active', button.dataset.theme === theme);
    });
}

function toggleTheme() {
    const currentTheme = ThemeManager.getCurrentTheme();
    const newTheme = currentTheme.theme === 'dark-theme' ? 'light-theme' : 'dark-theme';
    setThemeMode(newTheme);
}

function updateThemeToggleButton(theme) {
    const toggleBtn = document.querySelector('.theme-toggle-btn');
    if (toggleBtn) {
        toggleBtn.setAttribute('aria-label', `Switch to ${theme === 'dark-theme' ? 'light' : 'dark'} theme`);
    }
}

// Notification Management
function loadNotificationSettings() {
    const settings = AppUtils.AppState.notifications;
    
    if (typeof settings === 'object') {
        Object.entries(settings).forEach(([key, value]) => {
            const toggle = document.getElementById(key);
            if (toggle) {
                toggle.checked = value;
                // Update toggle appearance
                toggle.parentElement.classList.toggle('active', value);
            }
        });
    }
}

function handleNotificationToggle(event) {
    const settings = {
        ...AppUtils.AppState.notifications,
        [event.target.id]: event.target.checked
    };
    
    AppUtils.AppState.notifications = settings;
    AppUtils.saveToLocalStorage('notifications', settings);
    
    // Update toggle appearance
    event.target.parentElement.classList.toggle('active', event.target.checked);
    
    AppUtils.showNotification(
        `${event.target.checked ? 'Enabled' : 'Disabled'} ${event.target.id.replace(/([A-Z])/g, ' $1').toLowerCase()}`,
        'info'
    );
}

// Data Management
function handleDataExport() {
    const data = {
        userProfile: AppUtils.AppState.userProfile,
        tasks: AppUtils.AppState.tasks,
        exams: AppUtils.AppState.exams,
        studyPlan: AppUtils.AppState.studyPlan,
        streak: AppUtils.AppState.streak,
        events: AppUtils.AppState.events,
        sessions: AppUtils.AppState.sessions,
        settings: {
            theme: ThemeManager.getCurrentTheme().theme,
            customTheme: ThemeManager.getCurrentTheme().customTheme,
            notifications: AppUtils.AppState.notifications
        }
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `go-planner-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    AppUtils.showNotification('Data exported successfully', 'success');
}

function handleDataImport() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    
    input.onchange = (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    importData(data);
                    AppUtils.showNotification('Data imported successfully', 'success');
                    setTimeout(() => window.location.reload(), 1000);
                } catch (error) {
                    AppUtils.showNotification('Error importing data', 'error');
                }
            };
            reader.readAsText(file);
        }
    };
    
    input.click();
}

function handleDataClear() {
    showConfirmationModal(
        'Are you sure you want to clear all data? This action cannot be undone.',
        () => {
            localStorage.clear();
            ThemeManager.setTheme('light-theme'); // Reset to default theme
            AppUtils.showNotification('All data cleared successfully', 'success');
            setTimeout(() => window.location.reload(), 1000);
        }
    );
}

// Utility Functions
function importData(data) {
    Object.entries(data).forEach(([key, value]) => {
        if (key === 'settings') {
            ThemeManager.setTheme(value.theme);
            if (value.customTheme) {
                ThemeManager.setTheme(value.customTheme, true);
            }
            AppUtils.saveToLocalStorage('notifications', value.notifications);
        } else {
            AppUtils.saveToLocalStorage(key, value);
        }
    });
}

function showConfirmationModal(message, onConfirm) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content">
            <p>${message}</p>
            <div class="modal-actions">
                <button class="btn-cancel">Cancel</button>
                <button class="btn-confirm">Confirm</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    modal.querySelector('.btn-cancel').onclick = () => {
        modal.remove();
    };
    
    modal.querySelector('.btn-confirm').onclick = () => {
        onConfirm();
        modal.remove();
    };
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
} 