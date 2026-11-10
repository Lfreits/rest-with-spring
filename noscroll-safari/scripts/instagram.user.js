// ==UserScript==
// @name         NoScroll — Instagram
// @namespace    noscroll
// @version      0.1.0
// @description  Oculta Reels no Instagram web. Preserva feed, Direct, perfis, publicações e busca. Roda 100% local.
// @match        https://www.instagram.com/*
// @match        https://instagram.com/*
// @run-at       document-start
// @inject-into  content
// @grant        GM.addStyle
// @noframes
// ==/UserScript==

/*
 * Regras
 * - /reels/ (aba de Reels) ............ redireciona para o feed (/)
 * - /<perfil>/reels/ (aba do perfil) ... redireciona para o perfil
 * - /reel/<id> aberto a partir do Direct  liberado, só aquele reel
 * - qualquer outro /reel/<id> ......... tela de bloqueio + mídia pausada
 *   (inclui "deslizar para o próximo reel", pois o próximo não veio do Direct)
 * - links e cards de Reels no feed, perfil e Explorar ... ocultos
 * - dentro do Direct nada é ocultado (para você poder abrir o reel que te mandaram)
 *
 * Privacidade: este script não faz nenhuma requisição de rede e não lê
 * conteúdo de mensagens. Ele só olha endereços (href) e esconde elementos.
 */
(() => {
  'use strict';

  const VERSION = '0.1.0';
  const FLAG = '__noscrollInstagram';
  if (window[FLAG]) return;
  window[FLAG] = VERSION;

  const HIDDEN_ATTR = 'data-noscroll-hidden';
  const ROUTE_ATTR = 'data-noscroll-route';
  const OVERLAY_ID = 'noscroll-overlay';
  const ALLOWED_KEY = 'noscroll.instagram.allowedReel';
  const REEL_LINK_SELECTOR = 'a[href*="/reel/"], a[href*="/reels/"]';

  // ---------------------------------------------------------------- rotas

  /** Classifica um pathname do Instagram. Função pura. */
  function classify(pathname) {
    if (/^\/direct(\/|$)/.test(pathname)) return { kind: 'direct' };
    let m = pathname.match(/^\/(?:[^/]+\/)?reels?\/([A-Za-z0-9_-]+)\/?$/);
    if (m) return { kind: 'reel', id: m[1] };
    if (/^\/reels(\/|$)/.test(pathname)) return { kind: 'reels-feed' };
    m = pathname.match(/^\/([^/]+)\/reels\/?$/);
    if (m) return { kind: 'profile-reels', base: `/${m[1]}/` };
    return { kind: 'other' };
  }

  function isReelHref(href) {
    try {
      const k = classify(new URL(href, location.href).pathname).kind;
      return k === 'reel' || k === 'reels-feed' || k === 'profile-reels';
    } catch {
      return false;
    }
  }

  let memoryAllowed = null;
  function getAllowed() {
    try { return sessionStorage.getItem(ALLOWED_KEY); } catch { return memoryAllowed; }
  }
  function setAllowed(id) {
    memoryAllowed = id;
    try { sessionStorage.setItem(ALLOWED_KEY, id); } catch { /* sem storage: usa memória */ }
  }

  let lastHref = null;
  let blocked = false;

  function setRoute(value) {
    document.documentElement?.setAttribute(ROUTE_ATTR, value);
  }

  let started = false;

  function onRoute() {
    if (!started) return;
    const href = location.href;
    if (href === lastHref) return;
    const previous = lastHref ? classify(new URL(lastHref).pathname) : null;
    lastHref = href;

    const route = classify(location.pathname);
    switch (route.kind) {
      case 'reels-feed':
        location.replace('/');
        return;
      case 'profile-reels':
        location.replace(route.base);
        return;
      case 'reel':
        if (previous && previous.kind === 'direct') setAllowed(route.id);
        if (getAllowed() === route.id) {
          setRoute('reel-allowed');
          unblock();
        } else {
          setRoute('reel-blocked');
          block();
        }
        return;
      default:
        setRoute(route.kind);
        unblock();
        scan(document);
    }
  }

  // ------------------------------------------------------------- ocultação

  function canHideContent() {
    const r = document.documentElement?.getAttribute(ROUTE_ATTR);
    return r !== 'direct' && r !== 'reel-allowed';
  }

  function hide(el) {
    if (!el || el.hasAttribute(HIDDEN_ATTR)) return;
    el.setAttribute(HIDDEN_ATTR, '');
    el.style.setProperty('display', 'none', 'important');
  }

  function handleLink(a) {
    if (a.hasAttribute(HIDDEN_ATTR) || !isReelHref(a.href)) return;
    // A aba "Reels" da navegação é sempre ocultada, em qualquer rota.
    const path = new URL(a.href, location.href).pathname;
    if (path === '/reels/' || path === '/reels') {
      hide(a);
      return;
    }
    if (!canHideContent()) return;
    // No feed, o card inteiro (<article>) é removido; em grades, só o bloco do link.
    hide(a.closest('article') || a);
  }

  function scan(root) {
    if (!root || !root.querySelectorAll) return;
    if (root.matches && root.matches(REEL_LINK_SELECTOR)) handleLink(root);
    for (const a of root.querySelectorAll(REEL_LINK_SELECTOR)) handleLink(a);
  }

  // Camada principal: CSS (eficiente e aplicado antes da pintura).
  // A camada JS acima é o reforço caso o CSS não seja aplicado.
  const CSS = `
    a[href="/reels/"], a[href="/reels"], a[href="https://www.instagram.com/reels/"] { display: none !important; }
    html:not([${ROUTE_ATTR}="direct"]):not([${ROUTE_ATTR}="reel-allowed"]) article:has(a[href*="/reel/"]),
    html:not([${ROUTE_ATTR}="direct"]):not([${ROUTE_ATTR}="reel-allowed"]) a[href*="/reel/"],
    html:not([${ROUTE_ATTR}="direct"]):not([${ROUTE_ATTR}="reel-allowed"]) a[href*="/reels/"] { display: none !important; }
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
      'Reels bloqueados',
      'O NoScroll só libera um reel quando ele é aberto pelo Direct.',
      [
        ['Voltar', () => history.length > 1 ? history.back() : location.assign('/')],
        ['Ir para o feed', () => location.assign('/')],
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

  // Mídia que tentar tocar enquanto o bloqueio está ativo é pausada.
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
  // Reforço barato para mudanças de rota que não alteram o DOM (só compara strings).
  setInterval(onRoute, 500);
  if (document.documentElement) start();
})();
