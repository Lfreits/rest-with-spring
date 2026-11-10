'use strict';

// Ambiente de teste: Chromium (Playwright) carregando páginas *simuladas* (fixtures)
// sob os domínios reais. Nenhuma requisição sai para a internet: todas são
// interceptadas por page.route(). Isso valida a LÓGICA dos filtros; o HTML real
// de Instagram/YouTube só é validado no iPhone (ver checklist no README).

const path = require('node:path');
const { chromium } = require('playwright');

const SCRIPTS = path.join(__dirname, '..', 'scripts');

function page(body) {
  return `<!doctype html><html><head><meta charset="utf-8"></head><body>${body}</body></html>`;
}

async function launch() {
  return chromium.launch();
}

/**
 * Abre `startUrl` com o userscript injetado no início do documento.
 * `fixtures` mapeia pathname -> HTML. Retorna { page, requests }.
 */
async function open(browser, { script, origin, fixtures, startUrl }) {
  const context = await browser.newContext();
  const p = await context.newPage();
  const requests = [];
  await context.route('**/*', (route) => {
    const url = new URL(route.request().url());
    requests.push(url.href);
    if (url.origin !== origin) return route.abort();
    const html = fixtures[url.pathname] ?? page('<p id="fallback">fixture padrão</p>');
    return route.fulfill({ status: 200, contentType: 'text/html', body: html });
  });
  await p.addInitScript({ path: path.join(SCRIPTS, script) });
  await p.goto(origin + startUrl);
  return { page: p, requests, context };
}

/** Simula uma troca de rota de SPA: pushState + renderização de novo conteúdo. */
async function spaNavigate(p, to, html = '') {
  await p.evaluate(([to, html]) => {
    history.pushState({}, '', to);
    const div = document.createElement('div');
    div.className = 'spa-render';
    div.innerHTML = html;
    document.body.append(div);
  }, [to, html]);
}

async function visible(p, selector) {
  return p.locator(selector).first().isVisible();
}

async function overlayShown(p) {
  return p.locator('#noscroll-overlay').isVisible();
}

/** Espera uma condição assíncrona (até ~3 s). */
async function eventually(fn, timeout = 3000) {
  const start = Date.now();
  let last;
  while (Date.now() - start < timeout) {
    last = await fn();
    if (last) return true;
    await new Promise((r) => setTimeout(r, 50));
  }
  return last;
}

async function tryPlayAndReadPaused(p, selector) {
  return p.evaluate(async (sel) => {
    const v = document.querySelector(sel);
    try { await v.play(); } catch { /* sem fonte de mídia: ok */ }
    await new Promise((r) => setTimeout(r, 50));
    return v.paused;
  }, selector);
}

module.exports = { page, launch, open, spaNavigate, visible, overlayShown, eventually, tryPlayAndReadPaused };
