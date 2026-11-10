// ==UserScript==
// @name         NoScroll — YouTube
// @namespace    noscroll
// @version      0.1.0
// @description  Remove Shorts do YouTube web. Preserva vídeos, busca, canais, playlists e comentários. Roda 100% local.
// @match        https://m.youtube.com/*
// @match        https://www.youtube.com/*
// @match        https://youtube.com/*
// @run-at       document-start
// @inject-into  content
// @grant        GM.addStyle
// @noframes
// ==/UserScript==

/*
 * Regras
 * - /shorts/<id> ........................ tela de bloqueio + mídia pausada
 * - /@canal/shorts (aba do canal) ....... redireciona para /@canal/videos
 * - prateleiras, cards, abas e botões de Shorts ... ocultos
 * - vídeos convencionais (/watch), busca, canais, playlists e comentários
 *   não são tocados
 *
 * Privacidade: este script não faz nenhuma requisição de rede.
 */
(() => {
  'use strict';

  const VERSION = '0.1.0';
  const FLAG = '__noscrollYouTube';
  if (window[FLAG]) return;
  window[FLAG] = VERSION;

  const HIDDEN_ATTR = 'data-noscroll-hidden';
  const OVERLAY_ID = 'noscroll-overlay';
  const SHORTS_LINK_SELECTOR = 'a[href*="/shorts/"]';
  const CHIP_SELECTOR = 'ytm-chip-cloud-chip-renderer, yt-chip-cloud-chip-renderer';

  // Cards de vídeo conhecidos (mobile "ytm-" e desktop "ytd-"). Ao achar um link
  // para /shorts/, sobe no máximo até um destes; nunca até containers genéricos.
  const CARD_SELECTOR = [
    'ytm-shorts-lockup-view-model', 'ytm-shorts-lockup-view-model-v2', 'ytm-reel-item-renderer',
    'ytm-video-with-context-renderer', 'ytm-compact-video-renderer', 'ytm-rich-item-renderer',
    'ytm-reel-shelf-renderer', 'ytd-reel-item-renderer', 'ytd-video-renderer',
    'ytd-grid-video-renderer', 'ytd-rich-item-renderer', 'ytd-compact-video-renderer',
    'ytd-reel-shelf-renderer', 'ytd-guide-entry-renderer', 'ytd-mini-guide-entry-renderer',
    'ytm-pivot-bar-item-renderer',
  ].join(', ');

  // ---------------------------------------------------------------- rotas

  /** Classifica um pathname do YouTube. Função pura. */
  function classify(pathname) {
    if (/^\/shorts(\/|$)/.test(pathname)) return { kind: 'short' };
    const m = pathname.match(/^\/(@[^/]+|channel\/[^/]+|c\/[^/]+|user\/[^/]+)\/shorts\/?$/);
    if (m) return { kind: 'channel-shorts', base: `/${m[1]}/videos` };
    return { kind: 'other' };
  }

  let lastHref = null;
  let blocked = false;

  let started = false;

  function onRoute() {
    if (!started) return;
    const href = location.href;
    if (href === lastHref) return;
    lastHref = href;
    const route = classify(location.pathname);
    if (route.kind === 'channel-shorts') {
      location.replace(route.base);
    } else if (route.kind === 'short') {
      block();
    } else {
      unblock();
    }
  }

  // ------------------------------------------------------------- ocultação

  function hide(el) {
    if (!el || el.hasAttribute(HIDDEN_ATTR)) return;
    el.setAttribute(HIDDEN_ATTR, '');
    el.style.setProperty('display', 'none', 'important');
  }

  function handleLink(a) {
    if (a.hasAttribute(HIDDEN_ATTR)) return;
    let path;
    try { path = new URL(a.href, location.href).pathname; } catch { return; }
    const kind = classify(path).kind;
    if (kind === 'other') return;
    // Aba "Shorts" de um canal: some só a aba.
    if (kind === 'channel-shorts') { hide(a.closest('[role="tab"]') || a); return; }
    hide(a.closest(CARD_SELECTOR) || a);
  }

  function handleChip(chip) {
    if (chip.hasAttribute(HIDDEN_ATTR)) return;
    if ((chip.textContent || '').trim().toLowerCase() === 'shorts') hide(chip);
  }

  // Componentes que são Shorts por definição. A seção que os contém some junto.
  const SHORTS_COMPONENT_SELECTOR = [
    'ytm-reel-shelf-renderer', 'ytm-shorts-lockup-view-model', 'ytm-shorts-lockup-view-model-v2',
    'ytm-reel-item-renderer', 'ytd-reel-shelf-renderer', 'ytd-reel-item-renderer',
    'ytd-rich-shelf-renderer[is-shorts]', '.pivot-shorts',
  ].join(', ');
  const SHORTS_COMPONENT_PARENT = 'ytm-rich-section-renderer, ytd-rich-section-renderer, ytm-pivot-bar-item-renderer';

  function handleComponent(el) {
    hide(el.closest(SHORTS_COMPONENT_PARENT) || el);
  }

  function scan(root) {
    if (!root || !root.querySelectorAll) return;
    if (root.matches) {
      if (root.matches(SHORTS_LINK_SELECTOR) || root.matches('a[href$="/shorts"]')) handleLink(root);
      if (root.matches(CHIP_SELECTOR)) handleChip(root);
      if (root.matches(SHORTS_COMPONENT_SELECTOR)) handleComponent(root);
    }
    for (const el of root.querySelectorAll(SHORTS_COMPONENT_SELECTOR)) handleComponent(el);
    for (const a of root.querySelectorAll(`${SHORTS_LINK_SELECTOR}, a[href$="/shorts"]`)) handleLink(a);
    for (const c of root.querySelectorAll(CHIP_SELECTOR)) handleChip(c);
  }

  // Camada principal: CSS. Componentes que são Shorts por definição somem direto.
  const CSS = `
    ytm-reel-shelf-renderer, ytm-shorts-lockup-view-model, ytm-shorts-lockup-view-model-v2,
    ytm-reel-item-renderer, ytd-reel-shelf-renderer, ytd-reel-item-renderer,
    ytd-rich-shelf-renderer[is-shorts],
    ytm-rich-section-renderer:has(ytm-reel-shelf-renderer),
    ytm-rich-section-renderer:has(ytm-shorts-lockup-view-model),
    ytm-rich-section-renderer:has(ytm-shorts-lockup-view-model-v2),
    ytd-rich-section-renderer:has(ytd-rich-shelf-renderer[is-shorts]),
    grid-shelf-view-model:has(a[href*="/shorts/"]),
    ytm-pivot-bar-item-renderer:has(.pivot-shorts),
    ytd-guide-entry-renderer:has(a[title="Shorts"]),
    ytd-mini-guide-entry-renderer[aria-label="Shorts"],
    ytm-video-with-context-renderer:has(a[href*="/shorts/"]),
    ytm-compact-video-renderer:has(a[href*="/shorts/"]),
    ytm-rich-item-renderer:has(a[href*="/shorts/"]),
    ytd-video-renderer:has(a[href*="/shorts/"]),
    ytd-grid-video-renderer:has(a[href*="/shorts/"]),
    ytd-rich-item-renderer:has(a[href*="/shorts/"]),
    ytd-compact-video-renderer:has(a[href*="/shorts/"]) { display: none !important; }
  `;

  function addStyle(css) {
    const fallback = () => {
      const style = document.createElement('style');
      style.textContent = css;
      (document.head || document.documentElement).appendChild(style);
    };
    try {
      if (typeof GM !== 'undefined' && GM && typeof GM.addStyle === 'function') {
        Promise.resolve(GM.addStyle(css)).catch(fallback);
        return;
      }
    } catch { /* cai no fallback */ }
    fallback();
  }

  // ------------------------------------------------------ tela de bloqueio

  function pauseAllMedia() {
    for (const m of document.querySelectorAll('video, audio')) {
      try { m.pause(); } catch { /* ignora */ }
    }
  }

  function block() {
    blocked = true;
    pauseAllMedia();
    if (document.getElementById(OVERLAY_ID) || !document.documentElement) return;
    document.documentElement.appendChild(buildOverlay(
      'Shorts bloqueados',
      'O NoScroll bloqueia Shorts. Vídeos normais continuam disponíveis.',
      [
        ['Voltar', () => history.length > 1 ? history.back() : location.assign('/')],
        ['Ir para o início', () => location.assign('/')],
      ]
    ));
  }

  function unblock() {
    blocked = false;
    document.getElementById(OVERLAY_ID)?.remove();
  }

  function buildOverlay(title, text, actions) {
    const dark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
    const fg = dark ? '#f5f5f7' : '#1d1d1f';
    const overlay = document.createElement('div');
    overlay.id = OVERLAY_ID;
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-label', title);
    overlay.style.cssText = [
      'position:fixed', 'inset:0', 'z-index:2147483647', 'display:flex',
      'flex-direction:column', 'align-items:center', 'justify-content:center',
      'gap:12px', 'padding:24px', 'text-align:center',
      `background:${dark ? '#000' : '#fff'}`, `color:${fg}`,
      'font:17px -apple-system, system-ui, sans-serif',
    ].join(';');

    const h = document.createElement('div');
    h.textContent = title;
    h.style.cssText = 'font-size:24px;font-weight:700';
    const p = document.createElement('div');
    p.textContent = text;
    p.style.cssText = 'opacity:.7;max-width:320px';
    overlay.append(h, p);

    actions.forEach(([label, fn], i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = label;
      b.style.cssText = [
        'margin-top:' + (i === 0 ? '12px' : '0'), 'padding:12px 22px', 'border-radius:12px',
        'border:0', 'font:inherit', 'font-weight:600', 'min-width:200px',
        i === 0 ? `background:${fg};color:${dark ? '#000' : '#fff'}` : `background:transparent;color:${fg}`,
      ].join(';');
      b.addEventListener('click', fn);
      overlay.append(b);
    });
    return overlay;
  }

  // ------------------------------------------------------------ observação

  document.addEventListener('play', (e) => {
    if (blocked && e.target && typeof e.target.pause === 'function') e.target.pause();
  }, true);

  const observer = new MutationObserver((records) => {
    if (!started) {
      if (!document.documentElement) return;
      start();
    }
    onRoute();
    if (blocked) pauseAllMedia();
    for (const r of records) {
      for (const n of r.addedNodes) {
        if (n.nodeType === 1 && n.id !== OVERLAY_ID) scan(n);
      }
    }
  });

  // Em document-start o <html> pode ainda não existir: inicia assim que existir.
  function start() {
    started = true;
    addStyle(CSS);
    onRoute();
  }

  observer.observe(document, { childList: true, subtree: true });
  window.addEventListener('popstate', onRoute);
  // Eventos de navegação SPA do próprio YouTube (desktop e mobile), quando existirem.
  window.addEventListener('yt-navigate-finish', onRoute);
  window.addEventListener('state-navigateend', onRoute);
  // Reforço barato para mudanças de rota que não alteram o DOM (só compara strings).
  setInterval(onRoute, 500);
  if (document.documentElement) start();
})();
