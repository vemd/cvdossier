/* CvDossier — landing page */

// Endereços oficiais das lojas. Preencher antes de publicar.
const LOJAS = {
  android: '', // Em testes: os botões levam ao formulário. Preencher e atualizar os avisos após o lançamento público.
  ios: '',     // ex.: https://apps.apple.com/app/id...
};

document.documentElement.classList.add('js');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = window.matchMedia('(pointer: fine)').matches;
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));

// Botões das lojas
document.querySelectorAll('[data-store]').forEach((a) => {
  const url = LOJAS[a.dataset.store];
  if (url) {
    a.href = url;
    a.target = '_blank';
    a.rel = 'noopener';
  }
});

// Menu móvel
const toggle = document.querySelector('.nav-toggle');
const nav = document.getElementById('nav');
const setMenu = (open) => {
  nav.classList.toggle('open', open);
  toggle.setAttribute('aria-expanded', String(open));
  toggle.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
};
if (toggle && nav) {
  toggle.addEventListener('click', () => setMenu(!nav.classList.contains('open')));
  nav.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });
}

// Revelação ao rolar, com pequeno atraso entre irmãos
const reveals = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window && !reduceMotion) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('in');
      io.unobserve(entry.target);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
  reveals.forEach((el) => {
    const siblings = [...el.parentElement.children].filter((c) => c.classList.contains('reveal'));
    el.style.setProperty('--d', `${Math.min(siblings.indexOf(el), 5) * 0.08}s`);
    io.observe(el);
  });
} else {
  reveals.forEach((el) => el.classList.add('in'));
}

// Faixas contínuas: duplicar o conteúdo para um ciclo sem saltos
document.querySelectorAll('.marquee-track').forEach((track) => {
  if (reduceMotion) return;
  [...track.children].forEach((li) => {
    const clone = li.cloneNode(true);
    clone.setAttribute('aria-hidden', 'true');
    clone.querySelectorAll('img').forEach((img) => (img.alt = ''));
    track.appendChild(clone);
  });
});

// História: dividir o texto em palavras, que se acendem ao rolar
const scrub = document.querySelector('[data-scrub]');
const storyWords = [];
if (scrub) {
  const split = (node, target) => {
    node.childNodes.forEach((child) => {
      if (child.nodeType === Node.TEXT_NODE) {
        child.textContent.split(/(\s+)/).forEach((part) => {
          if (!part) return;
          if (/^\s+$/.test(part)) { target.appendChild(document.createTextNode(part)); return; }
          const span = document.createElement('span');
          span.className = 'sw';
          span.textContent = part;
          target.appendChild(span);
          storyWords.push(span);
        });
      } else {
        const copy = child.cloneNode(false);
        split(child, copy);
        target.appendChild(copy);
      }
    });
  };
  const frag = document.createDocumentFragment();
  split(scrub, frag);
  scrub.replaceChildren(frag);
}
const story = document.querySelector('.story');

// Trajetória: linha que se preenche e ecrãs que mudam
const steps = document.getElementById('steps');
const stepItems = steps ? [...steps.querySelectorAll('.step')] : [];
const screens = [...document.querySelectorAll('.how-phone .screen')];
let currentScreen = 0;

// Tudo o que depende da posição da página
const header = document.querySelector('.site-header');
const bar = document.querySelector('.progress');
const darkSections = [...document.querySelectorAll('[data-dark]')];
let ticking = false;
const onScroll = () => {
  ticking = false;
  const y = window.scrollY;
  const vh = window.innerHeight;
  header.classList.toggle('scrolled', y > 12);
  const hb = header.offsetHeight / 2;
  header.classList.toggle('on-dark', !document.querySelector('.nav.open') && darkSections.some((s) => {
    const r = s.getBoundingClientRect();
    return r.top <= hb && r.bottom >= hb;
  }));
  if (bar) {
    const max = document.documentElement.scrollHeight - vh;
    bar.style.setProperty('--sp', max > 0 ? (y / max).toFixed(4) : 0);
  }

  if (story && storyWords.length && !reduceMotion) {
    const r = story.getBoundingClientRect();
    const p = clamp(-r.top / Math.max(r.height - vh, 1) * 1.15);
    const lit = Math.round(p * storyWords.length);
    storyWords.forEach((w, i) => w.classList.toggle('lit', i < lit));
    story.classList.toggle('done', p >= 0.98);
  }

  if (steps) {
    const r = steps.getBoundingClientRect();
    const p = clamp((vh * 0.55 - r.top) / r.height);
    steps.style.setProperty('--p', p.toFixed(4));
    let active = 0;
    stepItems.forEach((li, i) => {
      const n = li.querySelector('.step-n').getBoundingClientRect();
      const on = n.top + n.height / 2 < vh * 0.6;
      li.classList.toggle('on', on);
      if (on) active = i;
    });
    if (active !== currentScreen && screens.length) {
      screens.forEach((s, i) => s.classList.toggle('is-on', i === active));
      currentScreen = active;
    }
  }
};
const requestScroll = () => {
  if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
};
window.addEventListener('scroll', requestScroll, { passive: true });
window.addEventListener('resize', requestScroll);
onScroll();

// Profundidade na apresentação, a seguir o cursor
const visual = document.querySelector('.hero-visual');
if (visual && !reduceMotion && finePointer) {
  const layers = [...visual.querySelectorAll('.layer')];
  let frame = null;
  window.addEventListener('pointermove', (e) => {
    if (frame) return;
    frame = requestAnimationFrame(() => {
      const x = e.clientX / window.innerWidth - 0.5;
      const y = e.clientY / window.innerHeight - 0.5;
      layers.forEach((l) => {
        const d = Number(l.dataset.depth);
        l.style.transform = `translate3d(${-x * d}px, ${-y * d}px, 0)`;
      });
      frame = null;
    });
  });
}

// Luz que segue o cursor nos cartões
if (finePointer) {
  document.querySelectorAll('.spot').forEach((el) => {
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty('--mx', `${e.clientX - r.left}px`);
      el.style.setProperty('--my', `${e.clientY - r.top}px`);
    });
  });
}

// Botões magnéticos
if (finePointer && !reduceMotion) {
  document.querySelectorAll('.magnetic').forEach((el) => {
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left - r.width / 2) / r.width;
      const y = (e.clientY - r.top - r.height / 2) / r.height;
      el.style.setProperty('--tx', `${x * 10}px`);
      el.style.setProperty('--ty', `${y * 8}px`);
    });
    el.addEventListener('pointerleave', () => {
      el.style.setProperty('--tx', '0px');
      el.style.setProperty('--ty', '0px');
    });
  });
}

// Personalização ao vivo
const mini = document.getElementById('miniCv');
const selectIn = (group, btn) => {
  group.querySelectorAll('[role="radio"]').forEach((b) => b.setAttribute('aria-checked', String(b === btn)));
};
document.querySelectorAll('.swatches').forEach((group) => {
  group.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-color]');
    if (!btn) return;
    selectIn(group, btn);
    mini.style.setProperty('--accent', btn.dataset.color);
  });
});
document.querySelectorAll('.seg').forEach((group) => {
  group.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-font]');
    if (!btn) return;
    selectIn(group, btn);
    mini.classList.toggle('serif-mode', btn.dataset.font === 'serif');
  });
});

// Comparação claro / escuro: a linha acompanha o scroll, de um lado para o outro
const compare = document.getElementById('compare');
if (compare) {
  const range = compare.querySelector('input');
  let current = 50;
  let target = 50;
  let dragging = false;
  let animating = false;
  const set = (v) => {
    compare.style.setProperty('--pos', `${v.toFixed(2)}%`);
    range.value = v;
  };
  const animate = () => {
    current += (target - current) * 0.14;
    if (Math.abs(target - current) < 0.05) current = target;
    set(current);
    animating = current !== target;
    if (animating) requestAnimationFrame(animate);
  };
  const follow = () => {
    if (dragging || reduceMotion) return;
    const r = compare.getBoundingClientRect();
    const vh = window.innerHeight;
    if (r.bottom < 0 || r.top > vh) return;
    const p = clamp((vh - r.top) / (vh + r.height));
    target = 50 + Math.sin(p * Math.PI * 4) * 42;
    if (!animating) { animating = true; requestAnimationFrame(animate); }
  };
  window.addEventListener('scroll', follow, { passive: true });
  follow();

  range.addEventListener('pointerdown', () => (dragging = true));
  window.addEventListener('pointerup', () => (dragging = false));
  range.addEventListener('input', () => {
    current = target = Number(range.value);
    set(current);
  });
}

// FAQ: uma pergunta aberta de cada vez
const faqs = document.querySelectorAll('.faq details');
faqs.forEach((d) => d.addEventListener('toggle', () => {
  if (d.open) faqs.forEach((o) => { if (o !== d) o.open = false; });
}));

// Índice das páginas legais: realçar a secção visível
const tocLinks = [...document.querySelectorAll('.toc a')];
if (tocLinks.length && 'IntersectionObserver' in window) {
  const byId = new Map(tocLinks.map((a) => [a.hash.slice(1), a]));
  const spy = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      tocLinks.forEach((a) => a.classList.remove('active'));
      byId.get(entry.target.id)?.classList.add('active');
    });
  }, { rootMargin: '-20% 0px -70% 0px' });
  document.querySelectorAll('.legal-body section[id]').forEach((s) => spy.observe(s));
}

// Ano no rodapé
document.querySelectorAll('[data-year]').forEach((el) => (el.textContent = new Date().getFullYear()));
