// Intersection Observer dla fade-in animacji
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('fade-in');
            entry.target.style.animation = 'fade-in-up 0.6s ease-out forwards';
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

// Obserwuj wszystkie sekcje
document.addEventListener('DOMContentLoaded', () => {
    const sections = document.querySelectorAll('section');
    sections.forEach(section => {
        observer.observe(section);
    });

    // Smooth scroll dla linków
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });

    // Navbar scroll effect
    const navbar = document.querySelector('nav');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 100) {
            navbar.classList.add('shadow-lg');
        } else {
            navbar.classList.remove('shadow-lg');
        }
    });

    // Parallax effect dla hero section
    const heroSection = document.querySelector('section');
    window.addEventListener('scroll', () => {
        const scrolled = window.pageYOffset;
        const blobs = document.querySelectorAll('.animate-blob');
        blobs.forEach((blob, index) => {
            blob.style.transform = `translate(0, ${scrolled * 0.1 * (index + 1)}px) scale(1)`;
        });
    });

    // Counter animation
    const stats = document.querySelectorAll('[data-stat]');
    stats.forEach(stat => {
        observer.observe(stat);
    });

    // Mobile menu toggle (optional)
    const menuButton = document.querySelector('[data-mobile-menu]');
    if (menuButton) {
        menuButton.addEventListener('click', () => {
            document.querySelector('[data-mobile-nav]').classList.toggle('hidden');
        });
    }

    // Details animation
    document.querySelectorAll('details').forEach(detail => {
        detail.addEventListener('toggle', () => {
            if (detail.open) {
                detail.style.animation = 'fade-in-up 0.3s ease-out';
            }
        });
    });

    console.log('%c✨ ExamAssist Showcase Loaded', 'color: #a855f7; font-weight: bold; font-size: 14px;');
});

// Scroll to top button (optional)
window.addEventListener('scroll', () => {
    const scrollButton = document.querySelector('[data-scroll-top]');
    if (scrollButton) {
        if (window.pageYOffset > 300) {
            scrollButton.classList.remove('hidden');
        } else {
            scrollButton.classList.add('hidden');
        }
    }
});
