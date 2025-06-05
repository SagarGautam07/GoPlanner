// Theme Manager - Handles global theme management across all pages
class ThemeManager {
    constructor() {
        this.themeKey = 'theme';
        this.customThemeKey = 'customTheme';
        this.transitionDuration = 300;
        this.initialize();
    }

    initialize() {
        // Apply saved themes on page load
        const savedTheme = localStorage.getItem(this.themeKey) || 'light-theme';
        const savedCustomTheme = localStorage.getItem(this.customThemeKey) || '';
        
        // Apply themes
        this.applyTheme(savedTheme, savedCustomTheme);

        // Setup theme toggle button
        this.setupThemeToggle();

        // Listen for system theme changes
        this.setupSystemThemeListener();

        // Setup theme transition observer
        this.setupTransitionObserver();

        // Log initial state
        console.log('Theme Manager initialized:', {
            theme: savedTheme,
            customTheme: savedCustomTheme,
            bodyClasses: document.body.className
        });
    }

    setupThemeToggle() {
        const themeToggleBtn = document.querySelector('.theme-toggle-btn');
        if (themeToggleBtn) {
            themeToggleBtn.addEventListener('click', (e) => {
                e.preventDefault();
                const currentTheme = localStorage.getItem(this.themeKey) || 'light-theme';
                const newTheme = currentTheme === 'light-theme' ? 'dark-theme' : 'light-theme';
                this.applyTheme(newTheme, localStorage.getItem(this.customThemeKey) || '');
            });
        }
    }

    applyTheme(theme, customTheme = '') {
        console.log('Applying theme:', { theme, customTheme });

        // Store current scroll position
        const scrollPosition = window.scrollY;

        // Add transition class
        document.documentElement.classList.add('theme-transitioning');
        
        try {
            // Remove all theme classes
            const themeClasses = ['light-theme', 'dark-theme', 'high-contrast-theme', 
                                'theme-blue', 'theme-green', 'theme-purple', 'theme-orange'];
            document.body.classList.remove(...themeClasses);
            
            // Apply main theme
            document.body.classList.add(theme);
            localStorage.setItem(this.themeKey, theme);
            
            // Apply custom theme if present
            if (customTheme) {
                document.body.classList.add(customTheme);
                localStorage.setItem(this.customThemeKey, customTheme);
            } else {
                localStorage.removeItem(this.customThemeKey);
            }

            // Update theme toggle button
            const themeToggleBtn = document.querySelector('.theme-toggle-btn');
            if (themeToggleBtn) {
                themeToggleBtn.setAttribute('aria-label', 
                    theme === 'light-theme' ? 'Switch to dark theme' : 'Switch to light theme'
                );
            }

            // Update theme buttons if on settings page
            this.updateThemeButtons(theme, customTheme);

            console.log('Theme applied successfully:', {
                theme,
                customTheme,
                bodyClasses: document.body.className
            });
        } catch (error) {
            console.error('Error applying theme:', error);
        }

        // Remove transition class and restore scroll position
        setTimeout(() => {
            document.documentElement.classList.remove('theme-transitioning');
            window.scrollTo(0, scrollPosition);
        }, this.transitionDuration);

        // Dispatch theme change event
        window.dispatchEvent(new CustomEvent('themechange', {
            detail: { theme, customTheme }
        }));
    }

    updateThemeButtons(theme, customTheme) {
        // Update theme mode buttons
        document.querySelectorAll('.theme-button').forEach(button => {
            const isActive = button.dataset.theme === theme;
            button.classList.toggle('active', isActive);
            button.setAttribute('aria-pressed', isActive);
        });

        // Update color theme buttons
        document.querySelectorAll('.color-option').forEach(button => {
            const isActive = button.dataset.theme === customTheme;
            button.classList.toggle('active', isActive);
            button.setAttribute('aria-pressed', isActive);
        });
    }

    setupSystemThemeListener() {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        mediaQuery.addEventListener('change', (e) => {
            if (!localStorage.getItem(this.themeKey)) {
                this.applyTheme(e.matches ? 'dark-theme' : 'light-theme');
            }
        });
    }

    setupTransitionObserver() {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.attributeName === 'class') {
                    const element = mutation.target;
                    if (element.classList.contains('theme-transitioning')) {
                        element.style.transition = `all ${this.transitionDuration}ms ease-in-out`;
                    } else {
                        element.style.transition = '';
                    }
                }
            });
        });

        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['class']
        });
    }

    // Static methods for easy access
    static getInstance() {
        if (!window.themeManager) {
            window.themeManager = new ThemeManager();
        }
        return window.themeManager;
    }

    static setTheme(theme, isCustomTheme = false) {
        const manager = ThemeManager.getInstance();
        if (isCustomTheme) {
            const currentTheme = localStorage.getItem(manager.themeKey) || 'light-theme';
            manager.applyTheme(currentTheme, theme);
        } else {
            const currentCustomTheme = localStorage.getItem(manager.customThemeKey) || '';
            manager.applyTheme(theme, currentCustomTheme);
        }
    }

    static getCurrentTheme() {
        const manager = ThemeManager.getInstance();
        return {
            theme: localStorage.getItem(manager.themeKey) || 'light-theme',
            customTheme: localStorage.getItem(manager.customThemeKey) || ''
        };
    }
}

// Initialize theme manager on page load
document.addEventListener('DOMContentLoaded', () => {
    ThemeManager.getInstance();
}); 