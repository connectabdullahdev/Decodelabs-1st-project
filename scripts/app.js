/* ═══════════════════════════════════════════════════════
   app.js — Pure Vanilla JavaScript Application
   DecodeLabs Project 1 · Batch 2026
   No frameworks. No libraries. Fundamentals mastered.
═══════════════════════════════════════════════════════ */

'use strict';

/* ══════════════════════════════════════
   STATE — Single source of truth
══════════════════════════════════════ */
const State = {
  theme:         localStorage.getItem('dl-theme') || 'light',
  menuOpen:      false,
  scrollY:       0,
  activeFilter:  'all',
  form: {
    name:    '',
    email:   '',
    subject: '',
    message: '',
  },
};

/* ══════════════════════════════════════
   UTILITIES
══════════════════════════════════════ */
const $ = (sel, parent = document) => parent.querySelector(sel);
const $$ = (sel, parent = document) => [...parent.querySelectorAll(sel)];

function debounce(fn, ms = 120) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}

function throttle(fn, ms = 100) {
  let last = 0;
  return (...args) => {
    const now = Date.now();
    if (now - last < ms) return;
    last = now;
    fn(...args);
  };
}

function clamp(val, min, max) {
  return Math.min(Math.max(val, min), max);
}

/* Email validation */
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

/* ══════════════════════════════════════
   THEME MANAGER
══════════════════════════════════════ */
const ThemeManager = {
  init() {
    this.apply(State.theme);
    const btn = $('#themeBtn');
    if (!btn) return;
    btn.addEventListener('click', () => this.toggle());
  },

  apply(theme) {
    document.body.classList.remove('theme-light', 'theme-dark');
    document.body.classList.add(`theme-${theme}`);
    State.theme = theme;
    localStorage.setItem('dl-theme', theme);

    const btn = $('#themeBtn');
    if (btn) {
      btn.setAttribute('aria-label', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
      btn.setAttribute('title', theme === 'dark' ? 'Light mode' : 'Dark mode');
    }
  },

  toggle() {
    this.apply(State.theme === 'light' ? 'dark' : 'light');
  },
};

/* ══════════════════════════════════════
   HEADER & NAVIGATION
══════════════════════════════════════ */
const NavManager = {
  header:    null,
  hamburger: null,
  nav:       null,

  init() {
    this.header    = $('#header');
    this.hamburger = $('#hamburger');
    this.nav       = $('#nav');

    if (!this.header || !this.hamburger || !this.nav) return;

    /* Hamburger toggle */
    this.hamburger.addEventListener('click', () => this.toggleMenu());

    /* Close on nav link click (mobile) */
    $$('.nav__link').forEach(link => {
      link.addEventListener('click', () => {
        if (State.menuOpen) this.closeMenu();
      });
    });

    /* Close on outside click */
    document.addEventListener('click', (e) => {
      if (State.menuOpen
        && !this.nav.contains(e.target)
        && !this.hamburger.contains(e.target)) {
        this.closeMenu();
      }
    });

    /* Close on Escape */
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && State.menuOpen) this.closeMenu();
    });
  },

  toggleMenu() {
    State.menuOpen ? this.closeMenu() : this.openMenu();
  },

  openMenu() {
    State.menuOpen = true;
    this.nav.classList.add('nav--open');
    this.hamburger.classList.add('open');
    this.hamburger.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  },

  closeMenu() {
    State.menuOpen = false;
    this.nav.classList.remove('nav--open');
    this.hamburger.classList.remove('open');
    this.hamburger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  },

  /* Highlight active nav link based on scroll position */
  updateActiveLink(sectionId) {
    $$('.nav__link').forEach(link => {
      const target = link.getAttribute('data-nav');
      link.classList.toggle('active', target === sectionId);
    });
  },
};

/* ══════════════════════════════════════
   SCROLL HANDLER
══════════════════════════════════════ */
const ScrollManager = {
  progressBar: null,
  header:      null,
  scrollCue:   null,
  sections:    [],

  init() {
    this.progressBar = $('#progressBar');
    this.header      = $('#header');
    this.scrollCue   = $('.scroll-cue');
    this.sections    = $$('section[id]');

    window.addEventListener('scroll', throttle(() => this.onScroll(), 50));
    this.onScroll(); // run once on load
  },

  onScroll() {
    State.scrollY = window.scrollY;

    /* Progress bar */
    if (this.progressBar) {
      const docH   = document.documentElement.scrollHeight - window.innerHeight;
      const pct    = docH > 0 ? (State.scrollY / docH) * 100 : 0;
      this.progressBar.style.width = `${clamp(pct, 0, 100)}%`;
      this.progressBar.setAttribute('aria-valuenow', Math.round(pct));
    }

    /* Header shadow */
    if (this.header) {
      this.header.classList.toggle('scrolled', State.scrollY > 20);
    }

    /* Hide scroll cue after scrolling */
    if (this.scrollCue) {
      this.scrollCue.classList.toggle('hidden', State.scrollY > 80);
    }

    /* Active nav link */
    this.updateActiveSection();
  },

  updateActiveSection() {
    let current = '';
    const offset = 120;

    this.sections.forEach(section => {
      const top = section.getBoundingClientRect().top;
      if (top <= offset) current = section.id;
    });

    if (current) NavManager.updateActiveLink(current);
  },
};

/* ══════════════════════════════════════
   INTERSECTION OBSERVER — Reveal on scroll
══════════════════════════════════════ */
const RevealManager = {
  init() {
    const targets = $$('.animate-up, .reveal-up, .reveal-left, .reveal-right');
    if (!targets.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
            observer.unobserve(entry.target); // fire once
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );

    targets.forEach(el => observer.observe(el));
  },
};

/* ══════════════════════════════════════
   ANIMATED NUMBER COUNTER
   For hero stats section
══════════════════════════════════════ */
const CounterManager = {
  init() {
    const counters = $$('[data-count]');
    if (!counters.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            this.animateCounter(entry.target);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.5 }
    );

    counters.forEach(el => observer.observe(el));
  },

  animateCounter(el) {
    const target   = parseInt(el.getAttribute('data-count'), 10);
    const duration = 1600; // ms
    const start    = performance.now();

    const tick = (now) => {
      const elapsed  = now - start;
      const progress = clamp(elapsed / duration, 0, 1);
      /* Ease out quart */
      const eased = 1 - Math.pow(1 - progress, 4);
      el.textContent = Math.round(eased * target);
      if (progress < 1) requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  },
};

/* ══════════════════════════════════════
   PORTFOLIO FILTER
══════════════════════════════════════ */
const FilterManager = {
  init() {
    const btns  = $$('.filter-btn');
    const cards = $$('.project-card');
    const empty = $('#portfolioEmpty');

    if (!btns.length) return;

    btns.forEach(btn => {
      btn.addEventListener('click', () => {
        const filter = btn.getAttribute('data-filter');
        State.activeFilter = filter;

        /* Update button active state */
        btns.forEach(b => b.classList.remove('filter-btn--active'));
        btn.classList.add('filter-btn--active');

        /* Filter cards */
        let visible = 0;
        cards.forEach(card => {
          const category = card.getAttribute('data-category');
          const show     = filter === 'all' || category === filter;

          if (show) {
            card.classList.remove('hidden');
            visible++;
          } else {
            card.classList.add('hidden');
          }
        });

        /* Empty state */
        if (empty) {
          empty.hidden = visible > 0;
        }
      });
    });
  },
};

/* ══════════════════════════════════════
   FORM HANDLER
══════════════════════════════════════ */
const FormManager = {
  form:      null,
  submitBtn: null,
  status:    null,

  init() {
    this.form      = $('#contactForm');
    this.submitBtn = $('#submitBtn');
    this.status    = $('#formStatus');
    if (!this.form) return;

    /* Live state sync */
    $$('input, textarea', this.form).forEach(input => {
      input.addEventListener('input', () => {
        State.form[input.name] = input.value;
        /* Clear error on typing */
        this.clearError(input);
      });

      /* Validate on blur */
      input.addEventListener('blur', () => {
        this.validateField(input);
      });
    });

    /* Submit */
    this.form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleSubmit();
    });
  },

  validateField(input) {
    const { name, value } = input;
    let msg = '';

    if (name === 'name'    && !value.trim())          msg = 'Your name is required.';
    if (name === 'email'   && !value.trim())          msg = 'Email address is required.';
    if (name === 'email'   && value && !isValidEmail(value)) msg = 'Please enter a valid email.';
    if (name === 'subject' && !value.trim())          msg = 'Subject is required.';
    if (name === 'message' && value.trim().length < 10) msg = 'Message must be at least 10 characters.';

    if (msg) {
      this.showError(input, msg);
      return false;
    }
    this.clearError(input);
    return true;
  },

  showError(input, msg) {
    input.classList.add('invalid');
    const errEl = $(`#${input.id}-err`);
    if (errEl) errEl.textContent = msg;
  },

  clearError(input) {
    input.classList.remove('invalid');
    const errEl = $(`#${input.id}-err`);
    if (errEl) errEl.textContent = '';
  },

  validateAll() {
    const inputs = $$('input[required], textarea[required]', this.form);
    return inputs.map(input => this.validateField(input)).every(Boolean);
  },

  async handleSubmit() {
    if (!this.validateAll()) return;

    /* Loading state */
    this.submitBtn.disabled = true;
    const origText = this.submitBtn.querySelector('.btn__text').textContent;
    this.submitBtn.querySelector('.btn__text').textContent = 'Sending…';

    try {
      /* Simulate async API call */
      await this.fakeApiCall(State.form);

      /* Success */
      this.showStatus('success', '✓ Message sent successfully! We will get back to you soon.');
      this.form.reset();
      Object.keys(State.form).forEach(k => State.form[k] = '');

    } catch (err) {
      /* Error */
      this.showStatus('error', '✕ Something went wrong. Please try again or email us directly.');

    } finally {
      this.submitBtn.disabled = false;
      this.submitBtn.querySelector('.btn__text').textContent = origText;
    }
  },

  fakeApiCall(data) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        /* Simulate 95% success rate */
        Math.random() > 0.05 ? resolve(data) : reject(new Error('Network error'));
      }, 1400);
    });
  },

  showStatus(type, msg) {
    if (!this.status) return;
    this.status.className = `form-status ${type}`;
    this.status.textContent = msg;

    /* Auto-dismiss success after 6 seconds */
    if (type === 'success') {
      setTimeout(() => {
        this.status.className = 'form-status';
        this.status.textContent = '';
      }, 6000);
    }
  },
};

/* ══════════════════════════════════════
   SMOOTH SCROLL for anchor links
══════════════════════════════════════ */
const SmoothScrollManager = {
  init() {
    $$('a[href^="#"]').forEach(link => {
      link.addEventListener('click', (e) => {
        const id = link.getAttribute('href').slice(1);
        const target = document.getElementById(id);
        if (!target) return;
        e.preventDefault();

        const navH   = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-h'), 10) || 72;
        const top    = target.getBoundingClientRect().top + window.scrollY - navH;

        window.scrollTo({ top, behavior: 'smooth' });

        /* Move focus to target for accessibility */
        target.setAttribute('tabindex', '-1');
        target.focus({ preventScroll: true });
      });
    });
  },
};

/* ══════════════════════════════════════
   APP INIT — orchestrate all modules
══════════════════════════════════════ */
function initApp() {
  ThemeManager.init();
  NavManager.init();
  ScrollManager.init();
  RevealManager.init();
  CounterManager.init();
  FilterManager.init();
  FormManager.init();
  SmoothScrollManager.init();

  console.log(
    '%c DecodeLabs · Project 1 · Batch 2026 \n%c Responsive Frontend Interface — Loaded ✓',
    'background:#A6856F;color:#fff;font-weight:700;padding:4px 8px;border-radius:4px 4px 0 0;',
    'background:#1C1612;color:#A0D4E0;padding:4px 8px;border-radius:0 0 4px 4px;'
  );
  console.log('%cTip: Type App.debug() to inspect state.', 'color:#8C7B6E;font-size:11px;');

  /* Expose for debugging */
  window.App = {
    state:   State,
    theme:   ThemeManager,
    nav:     NavManager,
    scroll:  ScrollManager,
    filter:  FilterManager,
    form:    FormManager,
    debug:   () => console.table(State),
  };
}

/* Run when DOM is ready */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
