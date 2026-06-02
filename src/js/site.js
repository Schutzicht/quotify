/* Offertje marketing site - lightweight interactions, no dependencies */

// Header shadow on scroll
const header = document.getElementById('header');
const onScroll = () => {
    if (!header) return;
    header.classList.toggle('scrolled', window.scrollY > 8);
};
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

// Mobile menu
const toggle = document.getElementById('navToggle');
if (toggle && header) {
    toggle.addEventListener('click', () => header.classList.toggle('menu-open'));
    document.querySelectorAll('#navLinks a').forEach((a) =>
        a.addEventListener('click', () => header.classList.remove('menu-open'))
    );
}

// FAQ accordion
document.querySelectorAll('.faq-item').forEach((item) => {
    const q = item.querySelector('.faq-q');
    const a = item.querySelector('.faq-a');
    if (!q || !a) return;
    q.addEventListener('click', () => {
        const open = item.classList.contains('open');
        document.querySelectorAll('.faq-item.open').forEach((other) => {
            if (other !== item) {
                other.classList.remove('open');
                const oa = other.querySelector('.faq-a');
                if (oa) oa.style.maxHeight = null;
            }
        });
        item.classList.toggle('open', !open);
        a.style.maxHeight = open ? null : a.scrollHeight + 'px';
    });
});

// Scroll reveal
const reveals = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window && reveals.length) {
    const io = new IntersectionObserver(
        (entries) => {
            entries.forEach((e) => {
                if (e.isIntersecting) {
                    e.target.classList.add('in');
                    io.unobserve(e.target);
                }
            });
        },
        { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );
    reveals.forEach((el) => io.observe(el));
} else {
    reveals.forEach((el) => el.classList.add('in'));
}
