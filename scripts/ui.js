
(() => {
  const track   = document.getElementById('slider');
  const wrapper = track.closest('.testimonial-slider');
  const INTERVAL_MS = 3000;
  const SPEED_MS    = 600; 
  let slideSize = 0, timer = null, animating = false;

  function measure() {
    const items = track.querySelectorAll('.slider-item');
    if (items.length < 2) return;
    const r1 = items[0].getBoundingClientRect();
    const r2 = items[1].getBoundingClientRect();
    slideSize = r2.left - r1.left;             // exact card+gap distance
    track.style.transition = 'none';
    track.style.transform  = 'translate3d(0,0,0)';
    requestAnimationFrame(() => {
      track.getBoundingClientRect();
      track.style.transition = `transform ${SPEED_MS}ms cubic-bezier(.22,.61,.36,1)`;
    });
  }

  function next() {
    if (animating || !slideSize) return;
    animating = true;
    track.style.transform = `translate3d(${-slideSize}px,0,0)`;
  }

  track.addEventListener('transitionend', () => {
    // 1) Reorder without letting the browser paint in-between
    const first = track.firstElementChild;
    if (first) track.appendChild(first);

    // 2) Freeze transition so the reset is not animated
    track.style.transition = 'none';

    // 3) Reset to the neutral position (same visual frame: 2,3,4)
    track.style.transform = 'translate3d(0,0,0)';

    // 4) Two rAFs: ensure the reset is fully committed before re-enabling transition
    requestAnimationFrame(() => {
      track.getBoundingClientRect(); // flush
      requestAnimationFrame(() => {
        track.style.transition = `transform ${SPEED_MS}ms cubic-bezier(.22,.61,.36,1)`;
        animating = false;
      });
    });
  });

  function start(){ stop(); timer = setInterval(next, INTERVAL_MS); }
  function stop(){ if (timer) clearInterval(timer); timer = null; }

  wrapper.addEventListener('mouseenter', stop);
  wrapper.addEventListener('mouseleave', start);

  window.addEventListener('resize', measure);
  window.addEventListener('load', measure);

  measure(); start();
})();


// Toggle menu bar show and hide on mobile using aria expanded true/false
const menuToggle = document.querySelector('.mobile-nav-toggle');
const nav = document.querySelector('.menu-nav ul');
menuToggle.addEventListener('click', () => { 
    const isExpanded = menuToggle.getAttribute('aria-expanded') === 'true';
    menuToggle.setAttribute('aria-expanded', !isExpanded);
    nav.classList.toggle('show');
});

// Close menu when a link is clicked (for better experience on mobile)
const navLinks = document.querySelectorAll('.menu-nav ul li a');
navLinks.forEach(link => {
    link.addEventListener('click', () => {
        menuToggle.setAttribute('aria-expanded', 'false');
        nav.classList.remove('show');
    });
});

//adding a script to handle the dark mode toggle
    const themeToggle = document.getElementById('themeToggle');

    //getting the current theme under settings from local storage if it exists
    import { loadSettings } from './storage.js';
    const currentTheme = (loadSettings().theme || 'system');

    // Apply the current theme on page load
    if (currentTheme) {
        document.documentElement.setAttribute('data-theme', currentTheme);
        themeToggle.checked = currentTheme === 'dark';
        document.querySelector('.theme-text').textContent = currentTheme === 'dark' ? 'Light mode' : 'Dark mode';
    }

    // Listen for changes on the toggle
    themeToggle.addEventListener('change', function() {
        const newTheme = this.checked ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        document.querySelector('.theme-text').textContent = newTheme === 'dark' ? 'Light mode' : 'Dark mode';
    });
