'use strict';

// Valida a lista de bloqueio (filters/noscroll.txt).
// O bloqueador de conteúdo do iOS não pode ser executado aqui. Por isso o teste:
//  1. verifica a sintaxe e a ausência de regras com script;
//  2. aplica cada regra de ocultação (##) como CSS em páginas simuladas
//     e confere o que some e o que fica.
// A validação real no web app continua manual.

const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const h = require('./helpers');

const LIST = fs.readFileSync(path.join(__dirname, '..', 'filters', 'noscroll.txt'), 'utf8');
const lines = LIST.split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('!'));

function cosmetic(domain) {
  return lines
    .map((l) => l.match(/^([^#]+)##(.+)$/))
    .filter((m) => m && m[1].split(',').includes(domain))
    .map((m) => m[2]);
}

async function openWithList(browser, origin, domain, html, startUrl = '/') {
  const context = await browser.newContext();
  const page = await context.newPage();
  await context.route('**/*', (r) => r.fulfill({ status: 200, contentType: 'text/html', body: html }));
  await page.goto(origin + startUrl);
  const invalid = await page.evaluate((selectors) => {
    const bad = [];
    const style = document.createElement('style');
    for (const s of selectors) {
      try { document.querySelector(s); } catch { bad.push(s); continue; }
      style.textContent += `${s} { display: none !important; }\n`;
    }
    document.head.append(style);
    return bad;
  }, cosmetic(domain));
  return { page, invalid };
}

let browser;
before(async () => { browser = await h.launch(); });
after(async () => { await browser?.close(); });

test('lista: só regras de ocultação (##) e de bloqueio de documento (||...$document)', () => {
  for (const l of lines) {
    const ok = /^(youtube\.com|instagram\.com)##[^#]/.test(l)
      || /^\|\|(youtube\.com|instagram\.com)\/[\w/]+\$document$/.test(l);
    assert.ok(ok, `regra inesperada: ${l}`);
  }
  assert.doesNotMatch(LIST, /#%#|#\$#|\+js\(|\$redirect|\$replace|\$csp|scriptlet/i);
});

test('lista: versão declarada', () => {
  assert.match(LIST, /^! Version: \d+\.\d+\.\d+$/m);
});

test('YouTube: Shorts somem; vídeos, busca, canais, playlists e comentários ficam', async () => {
  const html = h.page(`
    <ytm-pivot-bar-renderer>
      <ytm-pivot-bar-item-renderer id="pv-home"><div class="pivot-home"></div>Início</ytm-pivot-bar-item-renderer>
      <ytm-pivot-bar-item-renderer id="pv-shorts"><div class="pivot-shorts"></div>Shorts</ytm-pivot-bar-item-renderer>
      <ytm-pivot-bar-item-renderer id="pv-subs"><div class="pivot-subs"></div>Inscrições</ytm-pivot-bar-item-renderer>
    </ytm-pivot-bar-renderer>
    <ytm-rich-item-renderer id="vid-normal"><a href="/watch?v=abc">Vídeo</a></ytm-rich-item-renderer>
    <ytm-rich-section-renderer id="shelf"><ytm-reel-shelf-renderer>Shorts
      <ytm-shorts-lockup-view-model><a href="/shorts/s1">s</a></ytm-shorts-lockup-view-model>
    </ytm-reel-shelf-renderer></ytm-rich-section-renderer>
    <ytm-rich-item-renderer id="vid-short"><a href="/shorts/s2">Short</a></ytm-rich-item-renderer>
    <ytm-video-with-context-renderer id="res-video"><a href="/watch?v=r1">Resultado</a></ytm-video-with-context-renderer>
    <ytm-video-with-context-renderer id="res-short"><a href="/shorts/r2">Resultado short</a></ytm-video-with-context-renderer>
    <ytm-compact-channel-renderer id="res-channel"><a href="/@canal">Canal</a></ytm-compact-channel-renderer>
    <ytm-compact-playlist-renderer id="res-playlist"><a href="/playlist?list=PL1">Playlist</a></ytm-compact-playlist-renderer>
    <a role="tab" id="tab-videos" href="/@canal/videos">Vídeos</a>
    <a role="tab" id="tab-shorts" href="/@canal/shorts">Shorts</a>
    <a role="tab" id="tab-playlists" href="/@canal/playlists">Playlists</a>
    <ytm-comment-thread-renderer id="comment">Comentário</ytm-comment-thread-renderer>`);
  const { page, invalid } = await openWithList(browser, 'https://m.youtube.com', 'youtube.com', html);
  assert.deepEqual(invalid, []);
  for (const id of ['#pv-shorts', '#shelf', '#vid-short', '#res-short', '#tab-shorts']) {
    assert.equal(await h.visible(page, id), false, `${id} deveria sumir`);
  }
  for (const id of ['#pv-home', '#pv-subs', '#vid-normal', '#res-video', '#res-channel',
    '#res-playlist', '#tab-videos', '#tab-playlists', '#comment']) {
    assert.equal(await h.visible(page, id), true, `${id} deveria ficar`);
  }
});

test('Instagram: Reels somem; feed, perfis, busca e Direct ficam', async () => {
  const html = h.page(`
    <nav>
      <a id="nav-home" href="/">Início</a><a id="nav-search" href="/explore/">Pesquisa</a>
      <a id="nav-reels" href="/reels/">Reels</a><a id="nav-direct" href="/direct/inbox/">Direct</a>
    </nav>
    <article id="post-photo"><a href="/p/FOTO/">foto</a></article>
    <article id="post-carousel"><a href="/amigo/p/CAR/">carrossel</a></article>
    <article id="post-reel"><a href="/reel/R1/">reel</a></article>
    <a id="tab-posts" href="/amigo/">Publicações</a>
    <a id="tab-reels" href="/amigo/reels/">Reels</a>
    <a id="tile-photo" href="/amigo/p/X/">foto</a>
    <a id="tile-reel" href="/amigo/reel/Y/">reel</a>
    <div id="msg-text">oi</div><textarea id="composer"></textarea>
    <input id="search"><a id="result-user" href="/amigo/">amigo</a>`);
  const { page, invalid } = await openWithList(browser, 'https://www.instagram.com', 'instagram.com', html);
  assert.deepEqual(invalid, []);
  for (const id of ['#nav-reels', '#post-reel', '#tab-reels', '#tile-reel']) {
    assert.equal(await h.visible(page, id), false, `${id} deveria sumir`);
  }
  for (const id of ['#nav-home', '#nav-search', '#nav-direct', '#post-photo', '#post-carousel',
    '#tab-posts', '#tile-photo', '#msg-text', '#composer', '#search', '#result-user']) {
    assert.equal(await h.visible(page, id), true, `${id} deveria ficar`);
  }
});
