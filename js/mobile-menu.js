// Mobile Menu Handler
document.addEventListener('DOMContentLoaded', () => {
    const menuToggle = document.getElementById('menuToggle');
    const mainNav = document.querySelector('.main-nav');
    const navOverlay = document.getElementById('navOverlay');
    const navLinks = document.querySelectorAll('.nav-links a');

    // Toggle menu function
    function toggleMenu() {
        mainNav.classList.toggle('active');
        navOverlay.classList.toggle('active');
        document.body.classList.toggle('nav-open');
    }

    // Event listeners
    menuToggle.addEventListener('click', toggleMenu);
    navOverlay.addEventListener('click', toggleMenu);

    // Close menu when clicking a link (mobile)
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (window.innerWidth <= 768) {
                toggleMenu();
            }
        });
    });

    // Handle resize events
    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            if (window.innerWidth > 768) {
                mainNav.classList.remove('active');
                navOverlay.classList.remove('active');
                document.body.classList.remove('nav-open');
            }
        }, 250);
    });
}); 