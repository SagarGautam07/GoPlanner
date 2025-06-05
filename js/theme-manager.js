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
        this.applyTheme(
            localStorage.getItem(this.themeKey) || 'light-theme',
            localStorage.getItem(this.customThemeKey) || ''
        );

        // Listen for system theme changes
        this.setupSystemThemeListener();

        // Setup theme transition observer
        this.setupTransitionObserver();
    }

    applyTheme(theme, customTheme = '') {
        document.documentElement.classList.add('theme-transitioning');
        
        // Remove all existing themes
        document.body.className = '';
        
        // Apply main theme
        document.body.classList.add(theme);
        localStorage.setItem(this.themeKey, theme);
        
        // Apply custom theme if present
        if (customTheme) {
            document.body.classList.add(customTheme);
            localStorage.setItem(this.customThemeKey, customTheme);
        }

        // Remove transition class after animation
        setTimeout(() => {
            document.documentElement.classList.remove('theme-transitioning');
        }, this.transitionDuration);

        // Dispatch theme change event
        window.dispatchEvent(new CustomEvent('themechange', {
            detail: { theme, customTheme }
        }));
    }

    setupSystemThemeListener() {
        // Listen for system theme changes if no theme is set
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        mediaQuery.addEventListener('change', (e) => {
            if (!localStorage.getItem(this.themeKey)) {
                this.applyTheme(e.matches ? 'dark-theme' : 'light-theme');
            }
        });
    }

    setupTransitionObserver() {
        // Observe theme-related class changes and ensure smooth transitions
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
            manager.applyTheme(
                localStorage.getItem(manager.themeKey) || 'light-theme',
                theme
            );
        } else {
            manager.applyTheme(theme);
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