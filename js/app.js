/* ════════════════════════════════════════════════════════════
   CRUZEN DIGITAL — App JavaScript
   Lenis smooth scroll · GSAP animations · UI interactions
   ════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  /* ── PAGE LOAD ── */
  document.addEventListener('DOMContentLoaded', init);

  function init() {
    document.body.classList.add('loaded');
    initLenis();
    initNavbar();
    initMobileMenu();
    initHeroAnimations();
    initRevealObserver();
    initCountUp();
    initWhyChooseTabs();
    initPortfolioAccordion();
    initFAQ();
    initContactForm();
    activateNavLinks();
  }

  /* ── LENIS SMOOTH SCROLL ── */
  function initLenis() {
    if (typeof Lenis === 'undefined') return;

    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      direction: 'vertical',
      smooth: true,
      smoothTouch: false,
    });

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    // Integrate with GSAP ScrollTrigger
    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add((time) => { lenis.raf(time * 1000); });
      gsap.ticker.lagSmoothing(0);
    }

    // Smooth anchor links
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
      anchor.addEventListener('click', (e) => {
        e.preventDefault();
        const target = document.querySelector(anchor.getAttribute('href'));
        if (target) lenis.scrollTo(target, { offset: -90, duration: 1.4 });
        closeMobileMenu();
      });
    });
  }

  /* ── NAVBAR ── */
  function initNavbar() {
    const navbar = document.getElementById('navbar');
    if (!navbar) return;

    let lastY = 0;
    const THRESHOLD = 40;

    function onScroll() {
      const y = window.scrollY;
      if (y > THRESHOLD) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }
      lastY = y;
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ── MOBILE MENU ── */
  const toggle   = document.getElementById('navToggle');
  const menu     = document.getElementById('mobileMenu');
  const overlay  = document.getElementById('mobileOverlay');
  const closeBtn = document.getElementById('mobileClose');

  function openMobileMenu() {
    if (!menu) return;
    menu.classList.add('open');
    menu.setAttribute('aria-hidden', 'false');
    toggle && toggle.classList.add('open');
    toggle && toggle.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  }

  function closeMobileMenu() {
    if (!menu) return;
    menu.classList.remove('open');
    menu.setAttribute('aria-hidden', 'true');
    toggle && toggle.classList.remove('open');
    toggle && toggle.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  function initMobileMenu() {
    toggle  && toggle.addEventListener('click', openMobileMenu);
    closeBtn && closeBtn.addEventListener('click', closeMobileMenu);
    overlay && overlay.addEventListener('click', closeMobileMenu);
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeMobileMenu();
    });
  }

  /* ── HERO GSAP ANIMATIONS ── */
  function initHeroAnimations() {
    if (typeof gsap === 'undefined') {
      // Fallback: reveal without GSAP
      document.querySelectorAll('.fade-up').forEach((el, i) => {
        setTimeout(() => {
          el.style.transition = `opacity 0.7s ease ${parseFloat(el.style.getPropertyValue('--delay') || 0)}s, transform 0.7s ease ${parseFloat(el.style.getPropertyValue('--delay') || 0)}s`;
          el.style.opacity = '1';
          el.style.transform = 'translateY(0)';
        }, 100);
      });
      return;
    }

    gsap.registerPlugin(ScrollTrigger);

    // Hero icon row entrance
    const icons = gsap.utils.toArray('.hero-icon-wrap');
    gsap.from(icons, {
      opacity: 0,
      y: 20,
      scale: 0.8,
      duration: 0.6,
      stagger: 0.08,
      ease: 'back.out(1.4)',
      delay: 0.2,
    });

    // Hero text stagger
    const fadeEls = gsap.utils.toArray('.fade-up');
    gsap.to(fadeEls, {
      opacity: 1,
      y: 0,
      duration: 0.8,
      stagger: 0.12,
      ease: 'power3.out',
      delay: 0.5,
    });

    // Headline word split effect — highlight pill
    const pill = document.querySelector('.headline-pill');
    if (pill) {
      gsap.from(pill, {
        scale: 0.85,
        opacity: 0,
        duration: 0.7,
        ease: 'back.out(1.7)',
        delay: 0.9,
      });
    }

    // Hero showcase entrance
    const showcase = document.querySelector('.hero-showcase');
    if (showcase) {
      gsap.from(showcase, {
        y: 60,
        opacity: 0,
        duration: 1.1,
        ease: 'power3.out',
        delay: 1.0,
      });
    }
  }

  /* ── REVEAL ON SCROLL (Intersection Observer) ── */
  function initRevealObserver() {
    const items = document.querySelectorAll('.reveal');
    if (!items.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
            // Stagger siblings
            const siblings = entry.target.parentElement.querySelectorAll('.reveal');
            let delay = 0;
            siblings.forEach((sib, i) => {
              if (!sib.classList.contains('in-view')) return;
              sib.style.transitionDelay = `${i * 0.07}s`;
            });
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );

    items.forEach((el) => observer.observe(el));

    // Also observe process steps for step-number highlight
    const processSteps = document.querySelectorAll('.process-step');
    const stepObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
          }
        });
      },
      { threshold: 0.3 }
    );
    processSteps.forEach((el) => stepObserver.observe(el));
  }

  /* ── COUNT UP ── */
  function initCountUp() {
    const stats = document.querySelectorAll('.stat-number[data-target]');
    if (!stats.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            animateCount(entry.target);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.5 }
    );

    stats.forEach((el) => observer.observe(el));
  }

  function animateCount(el) {
    const target = parseFloat(el.dataset.target);
    const duration = 2000;
    const start = performance.now();
    const isDecimal = target % 1 !== 0;

    function tick(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = target * eased;
      el.textContent = isDecimal ? current.toFixed(1) : Math.round(current);
      if (progress < 1) requestAnimationFrame(tick);
      else el.textContent = isDecimal ? target.toFixed(1) : target;
    }

    requestAnimationFrame(tick);
  }

  /* ── PROCESS LINE FILL ── */
  function initProcessLine() {
    const line = document.getElementById('processLine');
    if (!line) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            line.style.width = '100%';
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.3 }
    );

    const section = document.getElementById('process');
    if (section) observer.observe(section);
  }

  /* ── GSAP SCROLL ANIMATIONS ── */
  if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
    document.addEventListener('DOMContentLoaded', initGSAPScrollAnimations);
  }

  function initGSAPScrollAnimations() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
    gsap.registerPlugin(ScrollTrigger);

    // Services section — stagger bento cards
    const bentoCards = gsap.utils.toArray('.bento-card');
    if (bentoCards.length) {
      gsap.from(bentoCards, {
        opacity: 0,
        y: 40,
        duration: 0.7,
        stagger: 0.1,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: '.bento-grid',
          start: 'top 80%',
        },
      });
    }

    // Work cards
    const workCards = gsap.utils.toArray('.work-card');
    if (workCards.length) {
      gsap.from(workCards, {
        opacity: 0,
        y: 50,
        duration: 0.8,
        stagger: 0.15,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: '.work-grid',
          start: 'top 80%',
        },
      });
    }

    // Why cards
    const whyCards = gsap.utils.toArray('.why-card');
    if (whyCards.length) {
      gsap.from(whyCards, {
        opacity: 0,
        x: 30,
        duration: 0.7,
        stagger: 0.12,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: '.why-right',
          start: 'top 80%',
        },
      });
    }

    // Section headers
    document.querySelectorAll('.section-header').forEach((header) => {
      gsap.from(header.children, {
        opacity: 0,
        y: 24,
        duration: 0.7,
        stagger: 0.1,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: header,
          start: 'top 85%',
        },
      });
    });

    // About milestones
    const milestones = gsap.utils.toArray('.about-milestone');
    if (milestones.length) {
      gsap.from(milestones, {
        opacity: 0,
        x: 24,
        duration: 0.6,
        stagger: 0.12,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: '.about-timeline',
          start: 'top 80%',
        },
      });
    }
  }

  /* ── CONTACT FORM ── */
  function initContactForm() {
    const form    = document.getElementById('contactForm');
    const success = document.getElementById('formSuccess');
    const btn     = document.getElementById('formSubmit');
    if (!form) return;

    form.addEventListener('submit', (e) => {
      e.preventDefault();

      if (!validateForm(form)) return;

      // Simulate async send
      const text = btn.querySelector('.submit-text');
      if (text) text.textContent = 'Sending…';
      btn.disabled = true;
      btn.style.opacity = '0.7';

      setTimeout(() => {
        btn.disabled = false;
        btn.style.opacity = '1';
        if (text) text.textContent = 'Send Message';
        if (success) {
          success.classList.add('visible');
          success.setAttribute('aria-hidden', 'false');
          form.reset();
          setTimeout(() => {
            success.classList.remove('visible');
            success.setAttribute('aria-hidden', 'true');
          }, 5000);
        }
      }, 1600);
    });
  }

  function validateForm(form) {
    let valid = true;
    const required = form.querySelectorAll('[required]');

    required.forEach((field) => {
      field.style.borderColor = '';
      if (!field.value.trim()) {
        field.style.borderColor = '#EF4444';
        valid = false;
      }
      if (field.type === 'email' && field.value && !isValidEmail(field.value)) {
        field.style.borderColor = '#EF4444';
        valid = false;
      }
    });

    // Re-style to cyan when user starts correcting
    required.forEach((field) => {
      field.addEventListener('input', () => {
        field.style.borderColor = '';
      }, { once: true });
    });

    return valid;
  }

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  /* ── ACTIVE NAV LINKS ── */
  function activateNavLinks() {
    const sections = document.querySelectorAll('section[id], footer[id]');
    const navLinks = document.querySelectorAll('.nav-link');
    if (!sections.length || !navLinks.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.id;
            navLinks.forEach((link) => {
              const href = link.getAttribute('href');
              link.classList.toggle('active', href === `#${id}`);
            });
          }
        });
      },
      { rootMargin: '-40% 0px -55% 0px' }
    );

    sections.forEach((s) => observer.observe(s));
  }

  /* ── WHY CHOOSE — AUTO-CYCLING TAB PANELS ── */
  function initWhyChooseTabs() {
    const items  = document.querySelectorAll('.wuc-list-item');
    const panels = document.querySelectorAll('.wuc-panel');
    if (!items.length || !panels.length) return;

    let current = 0;
    panels.forEach((p, i) => { if (p.classList.contains('active')) current = i; });

    let timer  = null;
    let paused = false;

    function resetProg(item) {
      const p = item.querySelector('.wuc-li-prog');
      if (!p) return;
      p.classList.remove('running');
      void p.offsetWidth;
      p.classList.add('running');
    }

    function switchTo(idx) {
      if (idx === current) return;
      panels[current].classList.remove('active');
      panels[current].classList.add('exiting');
      items[current].classList.remove('active');
      const prev = current;
      current = idx;
      setTimeout(() => panels[prev].classList.remove('exiting'), 450);
      panels[current].classList.add('active');
      items[current].classList.add('active');
      resetProg(items[current]);
    }

    function startAuto() {
      clearInterval(timer);
      if (!paused) timer = setInterval(() => switchTo((current + 1) % items.length), 5000);
    }

    function stopAuto() { clearInterval(timer); }

    items.forEach((item, i) => {
      item.addEventListener('click', () => { stopAuto(); switchTo(i); startAuto(); });
    });

    const section = document.getElementById('why-us');
    if (section) {
      const obs = new IntersectionObserver((entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) { resetProg(items[current]); startAuto(); }
          else stopAuto();
        });
      }, { threshold: 0.25 });
      obs.observe(section);
      section.addEventListener('mouseenter', () => { paused = true; stopAuto(); });
      section.addEventListener('mouseleave', () => { paused = false; startAuto(); });
    }
  }

  /* ── AUDIENCE TAB TOGGLE ── */
  function initAudienceTab() {
    const btns     = document.querySelectorAll('.aud-btn');
    const tabBrand = document.getElementById('tabBrand');
    const tabCreator = document.getElementById('tabCreator');
    if (!btns.length || !tabBrand || !tabCreator) return;

    btns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;
        btns.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');

        if (tab === 'brand') {
          tabBrand.classList.remove('aud-hidden');
          tabCreator.classList.add('aud-hidden');
        } else {
          tabCreator.classList.remove('aud-hidden');
          tabBrand.classList.add('aud-hidden');
        }
      });
    });
  }

  /* ── PORTFOLIO ACCORDION BARS ── */
  function initPortfolioAccordion() {
    const bars = document.querySelectorAll('.port-bar');
    if (!bars.length) return;

    bars.forEach((bar) => {
      bar.addEventListener('click', () => {
        const isOpen = bar.classList.contains('open');

        // Close all
        bars.forEach((b) => {
          b.classList.remove('open');
          const body = b.querySelector('.port-bar-body');
          if (body) body.style.maxHeight = '0';
        });

        // Open clicked if it was closed
        if (!isOpen) {
          bar.classList.add('open');
          const body = bar.querySelector('.port-bar-body');
          if (body) body.style.maxHeight = body.scrollHeight + 'px';
        }
      });
    });
  }

  /* ── FAQ ACCORDION ── */
  function initFAQ() {
    const items = document.querySelectorAll('.faq-item');
    if (!items.length) return;

    items.forEach((item) => {
      const btn    = item.querySelector('.faq-q');
      const answer = item.querySelector('.faq-answer');
      if (!btn || !answer) return;

      btn.addEventListener('click', () => {
        const isOpen = item.classList.contains('open');

        // Close all
        items.forEach((i) => {
          i.classList.remove('open');
          const q = i.querySelector('.faq-q');
          if (q) q.setAttribute('aria-expanded', 'false');
        });

        // Open clicked (if was closed)
        if (!isOpen) {
          item.classList.add('open');
          btn.setAttribute('aria-expanded', 'true');
        }
      });
    });
  }

  /* ════════════════════════════════════════════════════════════
     BACKEND API CONNECTION
     Connects to Node.js/Express backend at /api/*
     No HTML or CSS changes — all done via JavaScript.
  ════════════════════════════════════════════════════════════ */

  const API_BASE = '/api';

  // Session ID — persisted per browser tab for lead dedup
  function getSessionId() {
    let sid = sessionStorage.getItem('cru_sid');
    if (!sid) {
      sid = 'sid_' + Date.now() + '_' + Math.random().toString(36).slice(2, 9);
      sessionStorage.setItem('cru_sid', sid);
    }
    return sid;
  }

  /* ── LEAD / ACTIVITY CAPTURE ── */
  function initLeadCapture() {
    const sid = getSessionId();
    fetch(API_BASE + '/activity/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-session-id': sid },
      body: JSON.stringify({ sessionId: sid, type: 'page_view', metadata: { page: 'home' } }),
    }).catch(() => {}); // silent — never block the UI
  }

  /* ── CONSULTATION MODAL ── */
  function initConsultationModal() {
    // Build the modal entirely in JS — index.html stays untouched
    const overlay = document.createElement('div');
    overlay.id = 'consultModal';
    overlay.style.cssText = [
      'position:fixed;inset:0;z-index:9999;display:none;align-items:center;justify-content:center',
      'background:rgba(0,0,0,0.7);backdrop-filter:blur(6px)',
    ].join(';');

    overlay.innerHTML = `
      <div style="background:#0f1117;border:1px solid rgba(255,255,255,0.1);border-radius:20px;padding:40px;width:90%;max-width:480px;position:relative;color:#fff">
        <button id="consultClose" aria-label="Close" style="position:absolute;top:16px;right:16px;background:none;border:none;color:#aaa;font-size:24px;cursor:pointer;line-height:1">×</button>
        <h2 style="margin:0 0 6px;font-size:22px;font-weight:800">Book a Free Strategy Call</h2>
        <p style="margin:0 0 24px;color:#9ca3af;font-size:14px">We'll review your brand and show you what's possible — no hard sell.</p>
        <div id="consultSuccess" style="display:none;background:rgba(21,216,225,0.1);border:1px solid #15D8E1;border-radius:10px;padding:16px;text-align:center;color:#15D8E1;margin-bottom:16px">
          ✓ Booked! We'll reach out within 24 hours.
        </div>
        <form id="consultForm">
          <div style="margin-bottom:14px">
            <input name="name" placeholder="Your name *" required style="width:100%;padding:12px 14px;border-radius:10px;border:1px solid rgba(255,255,255,0.15);background:#1a1d27;color:#fff;font-size:14px;box-sizing:border-box;outline:none" />
          </div>
          <div style="margin-bottom:14px">
            <input name="email" type="email" placeholder="Email address *" required style="width:100%;padding:12px 14px;border-radius:10px;border:1px solid rgba(255,255,255,0.15);background:#1a1d27;color:#fff;font-size:14px;box-sizing:border-box;outline:none" />
          </div>
          <div style="margin-bottom:14px">
            <input name="phone" placeholder="Phone number" style="width:100%;padding:12px 14px;border-radius:10px;border:1px solid rgba(255,255,255,0.15);background:#1a1d27;color:#fff;font-size:14px;box-sizing:border-box;outline:none" />
          </div>
          <div style="margin-bottom:14px">
            <select name="service" style="width:100%;padding:12px 14px;border-radius:10px;border:1px solid rgba(255,255,255,0.15);background:#1a1d27;color:#fff;font-size:14px;box-sizing:border-box;outline:none;appearance:none">
              <option value="">What do you need help with?</option>
              <option value="Digital Marketing">Digital Marketing</option>
              <option value="Web Development">Web Development</option>
              <option value="E-Commerce Growth">E-Commerce Growth</option>
              <option value="SEO">SEO</option>
              <option value="Performance Ads">Performance Ads</option>
              <option value="Automation">Automation</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div style="margin-bottom:20px">
            <textarea name="message" placeholder="Tell us about your brand (optional)" rows="3" style="width:100%;padding:12px 14px;border-radius:10px;border:1px solid rgba(255,255,255,0.15);background:#1a1d27;color:#fff;font-size:14px;box-sizing:border-box;outline:none;resize:vertical"></textarea>
          </div>
          <button type="submit" id="consultSubmit" style="width:100%;padding:14px;border-radius:10px;border:none;background:#15D8E1;color:#0f1117;font-size:15px;font-weight:700;cursor:pointer">
            Book My Strategy Call →
          </button>
        </form>
      </div>`;

    document.body.appendChild(overlay);

    // Open/close
    function openModal() {
      overlay.style.display = 'flex';
      document.body.style.overflow = 'hidden';
    }
    function closeModal() {
      overlay.style.display = 'none';
      document.body.style.overflow = '';
    }

    document.getElementById('consultClose').addEventListener('click', closeModal);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });

    // Wire every "Book" CTA to open the modal (instead of scrolling to #contact)
    document.querySelectorAll('[href="#contact"], .footer-cta, .nav-cta, .mobile-cta').forEach((el) => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        openModal();
        closeMobileMenu();
      });
    });

    // Form submit → POST /api/consultation
    document.getElementById('consultForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const form   = e.target;
      const btn    = document.getElementById('consultSubmit');
      const notice = document.getElementById('consultSuccess');
      const data   = Object.fromEntries(new FormData(form));

      btn.disabled    = true;
      btn.textContent = 'Sending…';

      try {
        const res = await fetch(API_BASE + '/consultation', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-session-id': getSessionId(),
          },
          body: JSON.stringify(data),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.message || 'Submission failed');
        }

        notice.style.display = 'block';
        form.reset();
        setTimeout(closeModal, 3000);
      } catch (err) {
        btn.style.background = '#ef4444';
        btn.textContent = err.message || 'Something went wrong — try again';
        setTimeout(() => {
          btn.style.background = '#15D8E1';
          btn.textContent = 'Book My Strategy Call →';
          btn.disabled = false;
        }, 3000);
        return;
      }

      btn.textContent = 'Book My Strategy Call →';
      btn.disabled = false;
    });
  }

  // Kick off API connections after DOM is ready
  document.addEventListener('DOMContentLoaded', () => {
    initLeadCapture();
    initConsultationModal();
  });

})();
