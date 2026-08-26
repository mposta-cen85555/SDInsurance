/**
 * script.js – Presentation controller
 * Pure vanilla JS, no external dependencies.
 */

(function () {
  'use strict';

  /* ── Mark JS as available ─────────────────────────────── */
  document.documentElement.classList.add('js-enabled');
  document.body.classList.add('js-enabled');

  /* ── Constants ────────────────────────────────────────── */
  const TOTAL_SLIDES = 8;
  const SWIPE_THRESHOLD = 50; // px

  /* ── State ─────────────────────────────────────────────── */
  let currentSlide = 0;
  let isAnimating = false;

  /* ── DOM references ────────────────────────────────────── */
  const slides = Array.from(document.querySelectorAll('.slide'));
  const dots = Array.from(document.querySelectorAll('.slide-dot'));
  const btnPrev = document.getElementById('btnPrev');
  const btnNext = document.getElementById('btnNext');
  const slideCounter = document.getElementById('slideCounter');
  const progressBar = document.getElementById('progressBar');
  const btnFullscreen = document.getElementById('btnFullscreen');
  const iconFullscreen = document.getElementById('iconFullscreen');

  /* Guard – abort if essential elements are missing */
  if (!slides.length || !btnPrev || !btnNext) return;

  /* ── Show slide ─────────────────────────────────────────── */
  function showSlide(index, direction) {
    if (isAnimating) return;
    if (index < 0 || index >= TOTAL_SLIDES) return;
    if (index === currentSlide) return;

    isAnimating = true;

    const prevIndex = currentSlide;
    const prevSlide = slides[prevIndex];
    const nextSlide = slides[index];

    /* Mark direction for CSS */
    const goingForward = direction === 'forward' || index > prevIndex;

    /* Outgoing slide */
    prevSlide.classList.remove('is-active');
    prevSlide.classList.add('is-prev');
    prevSlide.setAttribute('aria-hidden', 'true');
    setTabIndex(prevSlide, -1);

    /* Incoming slide */
    nextSlide.style.transform = goingForward ? 'translateX(60px)' : 'translateX(-60px)';
    nextSlide.classList.add('is-active');
    nextSlide.setAttribute('aria-hidden', 'false');
    setTabIndex(nextSlide, 0);

    /* Force reflow then reset transform so CSS transition kicks in */
    void nextSlide.offsetHeight;
    nextSlide.style.transform = '';

    currentSlide = index;
    updateUI();

    const cleanup = () => {
      prevSlide.classList.remove('is-prev');
      isAnimating = false;
    };

    /* Listen on the outgoing slide for transition end */
    prevSlide.addEventListener('transitionend', cleanup, { once: true });
    /* Fallback if transition doesn't fire */
    setTimeout(cleanup, 400);
  }

  /* ── Set tabindex on focusable children ─────────────────── */
  function setTabIndex(slide, value) {
    slide.querySelectorAll('a, button, input, select, textarea, [tabindex]').forEach(el => {
      el.tabIndex = value;
    });
  }

  /* ── Update UI after slide change ───────────────────────── */
  function updateUI() {
    /* Counter */
    if (slideCounter) {
      slideCounter.textContent = (currentSlide + 1) + ' / ' + TOTAL_SLIDES;
    }

    /* Progress bar */
    if (progressBar) {
      const pct = ((currentSlide + 1) / TOTAL_SLIDES) * 100;
      progressBar.style.width = pct + '%';
      progressBar.setAttribute('aria-valuenow', currentSlide + 1);
    }

    /* Dots */
    dots.forEach((dot, i) => {
      const active = i === currentSlide;
      dot.classList.toggle('is-active', active);
      dot.setAttribute('aria-pressed', active ? 'true' : 'false');
    });

    /* Buttons */
    if (btnPrev) {
      btnPrev.disabled = currentSlide === 0;
    }
    if (btnNext) {
      btnNext.disabled = currentSlide === TOTAL_SLIDES - 1;
    }
  }

  /* ── Navigation helpers ─────────────────────────────────── */
  function goNext() {
    if (currentSlide < TOTAL_SLIDES - 1) {
      showSlide(currentSlide + 1, 'forward');
    }
  }

  function goPrev() {
    if (currentSlide > 0) {
      showSlide(currentSlide - 1, 'backward');
    }
  }

  function goTo(index) {
    const dir = index > currentSlide ? 'forward' : 'backward';
    showSlide(index, dir);
  }

  /* ── Initial state ──────────────────────────────────────── */
  function init() {
    slides.forEach((slide, i) => {
      if (i === 0) {
        slide.classList.add('is-active');
        slide.setAttribute('aria-hidden', 'false');
        setTabIndex(slide, 0);
      } else {
        slide.setAttribute('aria-hidden', 'true');
        setTabIndex(slide, -1);
      }
    });
    updateUI();
  }

  /* ── Button listeners ───────────────────────────────────── */
  if (btnPrev) {
    btnPrev.addEventListener('click', goPrev);
  }
  if (btnNext) {
    btnNext.addEventListener('click', goNext);
  }

  /* ── Dot listeners ──────────────────────────────────────── */
  dots.forEach((dot, i) => {
    dot.addEventListener('click', () => goTo(i));
  });

  /* ── Keyboard navigation ────────────────────────────────── */
  document.addEventListener('keydown', (e) => {
    /* Skip if user is typing in an input */
    const tag = document.activeElement ? document.activeElement.tagName : '';
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tag)) return;

    switch (e.key) {
      case 'ArrowRight':
      case 'PageDown':
      case ' ':
        e.preventDefault();
        goNext();
        break;
      case 'ArrowLeft':
      case 'PageUp':
        e.preventDefault();
        goPrev();
        break;
      case 'Home':
        e.preventDefault();
        goTo(0);
        break;
      case 'End':
        e.preventDefault();
        goTo(TOTAL_SLIDES - 1);
        break;
      case 'f':
      case 'F':
        e.preventDefault();
        toggleFullscreen();
        break;
      case 'Escape':
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(() => {});
        }
        break;
    }
  });

  /* ── Fullscreen ─────────────────────────────────────────── */
  const ICON_EXPAND = '<path d="M2 6V2H6M12 2H16V6M16 12V16H12M6 16H2V12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>';
  const ICON_COMPRESS = '<path d="M6 2V6H2M16 6H12V2M12 16H16V12M2 12H6V16" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>';

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      const el = document.documentElement;
      if (el.requestFullscreen) {
        el.requestFullscreen().catch(() => {});
      } else if (el.webkitRequestFullscreen) {
        el.webkitRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      }
    }
  }

  document.addEventListener('fullscreenchange', updateFullscreenIcon);
  document.addEventListener('webkitfullscreenchange', updateFullscreenIcon);

  function updateFullscreenIcon() {
    if (!iconFullscreen) return;
    if (document.fullscreenElement || document.webkitFullscreenElement) {
      iconFullscreen.innerHTML = ICON_COMPRESS;
      if (btnFullscreen) btnFullscreen.setAttribute('aria-label', 'Ukončit celou obrazovku');
    } else {
      iconFullscreen.innerHTML = ICON_EXPAND;
      if (btnFullscreen) btnFullscreen.setAttribute('aria-label', 'Celá obrazovka');
    }
  }

  if (btnFullscreen) {
    btnFullscreen.addEventListener('click', toggleFullscreen);
  }

  /* ── Touch / Swipe ──────────────────────────────────────── */
  let touchStartX = 0;
  let touchStartY = 0;

  document.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].clientX;
    touchStartY = e.changedTouches[0].clientY;
  }, { passive: true });

  document.addEventListener('touchend', (e) => {
    const dx = e.changedTouches[0].clientX - touchStartX;
    const dy = e.changedTouches[0].clientY - touchStartY;

    /* Only count horizontal swipes that are clearly horizontal */
    if (Math.abs(dx) < SWIPE_THRESHOLD) return;
    if (Math.abs(dy) > Math.abs(dx)) return; // mostly vertical – ignore

    if (dx < 0) {
      goNext(); // swipe left → next
    } else {
      goPrev(); // swipe right → prev
    }
  }, { passive: true });

  /* ── Prevent scroll keys from scrolling page ────────────── */
  window.addEventListener('keydown', (e) => {
    if ([' ', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'PageUp', 'PageDown', 'Home', 'End'].includes(e.key)) {
      /* Only if not inside a scrollable element */
      const active = document.activeElement;
      if (!active || !['INPUT', 'TEXTAREA', 'SELECT'].includes(active.tagName)) {
        e.preventDefault();
      }
    }
  }, { passive: false });

  /* ── Init ───────────────────────────────────────────────── */
  init();

})();
