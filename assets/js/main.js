const BOOKING_ENDPOINT = 'PASTE_APPS_SCRIPT_URL_HERE'; // Paste the deployed Google Apps Script web app URL here.

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function initNavigation() {
  const toggle = document.querySelector('.nav-toggle');
  const nav = document.querySelector('.site-nav');
  if (!toggle || !nav) return;

  const closeNav = () => {
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Abrir menú');
    nav.classList.remove('is-open');
    document.body.classList.remove('nav-open');
  };

  toggle.addEventListener('click', () => {
    const isOpen = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!isOpen));
    toggle.setAttribute('aria-label', isOpen ? 'Abrir menú' : 'Cerrar menú');
    nav.classList.toggle('is-open', !isOpen);
    document.body.classList.toggle('nav-open', !isOpen);
  });

  nav.addEventListener('click', (event) => {
    if (event.target.closest('a')) closeNav();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && nav.classList.contains('is-open')) closeNav();
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth >= 768) closeNav();
  });
}

function initReveal() {
  const elements = [...document.querySelectorAll('.reveal')];
  if (!elements.length) return;

  if (prefersReducedMotion || !('IntersectionObserver' in window)) {
    elements.forEach((element) => element.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  }, {
    threshold: 0.12,
    rootMargin: '0px 0px -4% 0px'
  });

  elements.forEach((element) => observer.observe(element));
}

function initHeroParallax() {
  const media = document.querySelector('.parallax-hero');
  if (!media || prefersReducedMotion) return;

  let ticking = false;

  const update = () => {
    const rect = media.parentElement.getBoundingClientRect();
    const progress = Math.max(-1, Math.min(1, -rect.top / Math.max(rect.height, 1)));
    const shift = progress * 24;
    media.style.setProperty('--hero-parallax', `${shift}px`);
    ticking = false;
  };

  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  }, { passive: true });

  window.addEventListener('resize', update);
  update();
}

function initLightbox() {
  const lightbox = document.querySelector('[data-lightbox]');
  const gallery = document.querySelector('[data-gallery]');
  if (!lightbox || !gallery) return;

  const image = lightbox.querySelector('[data-lightbox-image]');
  const caption = lightbox.querySelector('[data-lightbox-caption]');
  const closeButton = lightbox.querySelector('[data-lightbox-close]');
  const prevButton = lightbox.querySelector('[data-lightbox-prev]');
  const nextButton = lightbox.querySelector('[data-lightbox-next]');
  const backdrop = lightbox.querySelector('[data-lightbox-backdrop]');
  const triggers = [...gallery.querySelectorAll('[data-lightbox-trigger]')];
  let currentIndex = 0;
  let activeTrigger = null;
  let touchStartX = 0;

  const render = (index) => {
    currentIndex = (index + triggers.length) % triggers.length;
    const source = triggers[currentIndex].querySelector('img');
    if (!source) return;

    image.src = source.currentSrc || source.src;
    image.alt = source.alt;
    image.width = source.width;
    image.height = source.height;
    caption.textContent = source.alt;
  };

  const openLightbox = (trigger) => {
    activeTrigger = trigger;
    currentIndex = Math.max(0, triggers.indexOf(trigger));
    render(currentIndex);
    lightbox.hidden = false;
    document.body.classList.add('nav-open');
    closeButton.focus();
  };

  const closeLightbox = () => {
    lightbox.hidden = true;
    document.body.classList.remove('nav-open');
    activeTrigger?.focus();
  };

  gallery.addEventListener('click', (event) => {
    const trigger = event.target.closest('[data-lightbox-trigger]');
    if (trigger) openLightbox(trigger);
  });

  closeButton.addEventListener('click', closeLightbox);
  backdrop.addEventListener('click', closeLightbox);
  prevButton.addEventListener('click', () => render(currentIndex - 1));
  nextButton.addEventListener('click', () => render(currentIndex + 1));

  lightbox.addEventListener('touchstart', (event) => {
    touchStartX = event.changedTouches[0].clientX;
  }, { passive: true });

  lightbox.addEventListener('touchend', (event) => {
    const delta = event.changedTouches[0].clientX - touchStartX;
    if (Math.abs(delta) < 45) return;
    render(currentIndex + (delta < 0 ? 1 : -1));
  }, { passive: true });

  document.addEventListener('keydown', (event) => {
    if (lightbox.hidden) return;

    if (event.key === 'Escape') closeLightbox();
    if (event.key === 'ArrowLeft') render(currentIndex - 1);
    if (event.key === 'ArrowRight') render(currentIndex + 1);

    if (event.key === 'Tab') {
      const focusable = [...lightbox.querySelectorAll('button:not([disabled]), a[href]')];
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  });
}

function initShowsState() {
  const list = document.querySelector('[data-shows-list]');
  const empty = document.querySelector('[data-shows-empty]');
  if (!list || !empty) return;

  const hasShows = Boolean(list.querySelector('.show-row'));
  empty.hidden = hasShows;
}

function initBookingForm() {
  const form = document.querySelector('[data-booking-form]');
  if (!form) return;

  const success = document.querySelector('[data-booking-success]');
  const status = form.querySelector('[data-form-status]');
  const submitButton = form.querySelector('[data-submit-button]');
  const submitLabel = form.querySelector('[data-submit-label]');
  const submitLoading = form.querySelector('[data-submit-loading]');
  const dateInput = form.elements.eventDate;

  const formatLocalDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const tomorrow = new Date();
  tomorrow.setHours(0, 0, 0, 0);
  tomorrow.setDate(tomorrow.getDate() + 1);
  dateInput.min = formatLocalDate(tomorrow);

  const messages = {
    name: 'Escribe tu nombre.',
    phone: 'Escribe un teléfono válido con al menos 10 dígitos.',
    email: 'Escribe un correo electrónico válido.',
    eventType: 'Selecciona el tipo de evento.',
    eventDate: 'Selecciona una fecha futura.',
    location: 'Escribe la ubicación del evento.',
    musicHours: 'Indica entre 1 y 12 horas de música.',
    budget: 'Escribe un presupuesto aproximado.',
    message: 'Cuéntanos un poco sobre el evento.'
  };

  const setError = (field, message = '') => {
    const error = form.querySelector(`[data-error-for="${field.name}"]`);
    field.setAttribute('aria-invalid', message ? 'true' : 'false');
    if (error) error.textContent = message;
  };

  const validateField = (field) => {
    if (!field || !field.name || field.name === 'company') return true;

    const value = typeof field.value === 'string' ? field.value.trim() : '';
    let valid = !field.required || value !== '';

    if (valid && field.name === 'phone') {
      const digits = value.replace(/\D/g, '');
      valid = digits.length >= 10 && digits.length <= 15;
    }

    if (valid && field.name === 'email') {
      valid = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(value);
    }

    if (valid && field.name === 'eventDate') {
      const selected = new Date(`${value}T12:00:00`);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      valid = Number.isFinite(selected.getTime()) && selected > today;
    }

    if (valid && field.name === 'musicHours') {
      const hours = Number(value);
      valid = Number.isFinite(hours) && hours >= 1 && hours <= 12;
    }

    setError(field, valid ? '' : messages[field.name]);
    return valid;
  };

  [...form.elements].forEach((field) => {
    if (!field.name || field.name === 'company') return;

    field.addEventListener('blur', () => validateField(field));
    field.addEventListener('input', () => {
      if (field.getAttribute('aria-invalid') === 'true') validateField(field);
    });
    field.addEventListener('change', () => {
      if (field.getAttribute('aria-invalid') === 'true') validateField(field);
    });
  });

  const validateForm = () => {
    const fields = [...form.elements].filter((field) => field.name && field.name !== 'company');
    const results = fields.map((field) => validateField(field));
    const firstInvalid = fields.find((field) => field.getAttribute('aria-invalid') === 'true');
    firstInvalid?.focus();
    return results.every(Boolean);
  };

  const setSending = (sending) => {
    submitButton.disabled = sending;
    submitButton.setAttribute('aria-busy', String(sending));
    submitLabel.hidden = sending;
    submitLoading.hidden = !sending;
  };

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    status.textContent = '';
    status.classList.remove('is-error');

    if (form.elements.company.value.trim() !== '') {
      form.reset();
      return;
    }

    if (!validateForm()) return;

    if (BOOKING_ENDPOINT === 'PASTE_APPS_SCRIPT_URL_HERE') {
      status.classList.add('is-error');
      status.innerHTML = 'El formulario todavía no está conectado. Para no perder tu solicitud, llama al <a href="tel:5154222977">515-422-2977</a>.';
      return;
    }

    setSending(true);

    try {
      const formData = new FormData(form);
      await fetch(BOOKING_ENDPOINT, {
        method: 'POST',
        mode: 'no-cors',
        body: formData
      });

      form.hidden = true;
      success.hidden = false;
      success.focus();
    } catch (error) {
      status.classList.add('is-error');
      status.innerHTML = 'No pudimos enviar la solicitud. Para que no se pierda tu fecha, llama al <a href="tel:5154222977">515-422-2977</a>.';
      setSending(false);
    }
  });
}

function initCurrentYear() {
  document.querySelectorAll('[data-current-year]').forEach((element) => {
    element.textContent = String(new Date().getFullYear());
  });
}

initNavigation();
initReveal();
initHeroParallax();
initLightbox();
initShowsState();
initBookingForm();
initCurrentYear();
