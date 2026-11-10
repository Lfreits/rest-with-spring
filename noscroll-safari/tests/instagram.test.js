'use strict';

const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const h = require('./helpers');

const origin = 'https://www.instagram.com';

const NAV = `
  <nav>
    <a id="nav-home" href="/">Início</a>
    <a id="nav-search" href="/explore/">Pesquisa</a>
    <a id="nav-reels" href="/reels/">Reels</a>
    <a id="nav-direct" href="/direct/inbox/">Direct</a>
    <a id="nav-profile" href="/eu/">Perfil</a>
  </nav>`;

const fixtures = {
  '/': h.page(`${NAV}
    <main>
      <article id="post-photo"><a href="/p/FOTO1/">Foto de amigo</a></article>
      <article id="post-carousel"><a href="/amigo/p/CAR1/">Carrossel</a></article>
      <article id="post-reel"><a href="/reel/REEL1/">Reel no feed</a><video></video></article>
      <article id="post-reel-user"><a href="https://www.instagram.com/alguem/reel/REEL2/">Reel</a></article>
    </main>`),
  '/amigo/': h.page(`${NAV}
    <h1 id="profile-name">amigo</h1>
    <a id="tab-posts" href="/amigo/">Publicações</a>
    <a id="tab-reels" href="/amigo/reels/">Reels</a>
    <a id="tab-tagged" href="/amigo/tagged/">Marcados</a>
    <div>
      <a id="tile-photo" href="/amigo/p/X1/">foto</a>
      <a id="tile-reel" href="/amigo/reel/Y1/">reel</a>
    </div>`),
  '/direct/t/123/': h.page(`${NAV}
    <div id="thread">
      <div id="msg-text">oi, olha isso</div>
      <a id="dm-reel" href="/reel/DMREEL/">Reel compartilhado</a>
      <a id="dm-post" href="/p/DMPOST/">Post compartilhado</a>
      <textarea id="composer" placeholder="Mensagem..."></textarea>
    </div>`),
  '/explore/search/': h.page(`${NAV}
    <input id="search" placeholder="Pesquisar">
    <a id="result-user" href="/amigo/">amigo</a>
    <a id="result-tag" href="/explore/tags/praia/">#praia</a>`),
  '/reel/FRESH/': h.page('<video id="v" muted></video>'),
};

let browser;
before(async () => { browser = await h.launch(); });
after(async () => { await browser?.close(); });

const open = (startUrl) => h.open(browser, { script: 'instagram.user.js', origin, fixtures, startUrl });

test('feed: reels somem, posts convencionais ficam', async () => {
  const { page } = await open('/');
  assert.equal(await h.visible(page, '#post-photo'), true);
  assert.equal(await h.visible(page, '#post-carousel'), true);
  assert.equal(await h.visible(page, '#post-reel'), false);
  assert.equal(await h.visible(page, '#post-reel-user'), false);
});

test('navegação: aba Reels some; Início, Pesquisa, Direct e Perfil ficam', async () => {
  const { page } = await open('/');
  assert.equal(await h.visible(page, '#nav-reels'), false);
  for (const id of ['#nav-home', '#nav-search', '#nav-direct', '#nav-profile']) {
    assert.equal(await h.visible(page, id), true, id);
  }
});

test('feed com carregamento dinâmico: reel inserido depois também some', async () => {
  const { page } = await open('/');
  await page.evaluate(() => {
    const main = document.querySelector('main');
    main.insertAdjacentHTML('beforeend',
      '<article id="late-reel"><a href="/reel/LATE/">r</a></article>' +
      '<article id="late-photo"><a href="/p/LATEP/">p</a></article>');
  });
  assert.equal(await h.eventually(async () => !(await h.visible(page, '#late-reel'))), true);
  assert.equal(await h.visible(page, '#late-photo'), true);
});

test('perfil: aba e tiles de Reels somem, resto fica', async () => {
  const { page } = await open('/amigo/');
  assert.equal(await h.visible(page, '#profile-name'), true);
  assert.equal(await h.visible(page, '#tab-posts'), true);
  assert.equal(await h.visible(page, '#tab-tagged'), true);
  assert.equal(await h.visible(page, '#tile-photo'), true);
  assert.equal(await h.visible(page, '#tab-reels'), false);
  assert.equal(await h.visible(page, '#tile-reel'), false);
});

test('Direct: mensagens, compositor e reel compartilhado continuam visíveis', async () => {
  const { page } = await open('/direct/t/123/');
  for (const id of ['#msg-text', '#dm-reel', '#dm-post', '#composer']) {
    assert.equal(await h.visible(page, id), true, id);
  }
  assert.equal(await h.overlayShown(page), false);
});

test('Direct → reel: liberado; deslizar para o próximo: bloqueado; voltar: liberado', async () => {
  const { page } = await open('/direct/t/123/');
  await h.spaNavigate(page, '/reel/DMREEL/', '<video id="v1"></video>');
  await new Promise((r) => setTimeout(r, 200));
  assert.equal(await h.overlayShown(page), false, 'reel vindo do Direct deve abrir');

  await h.spaNavigate(page, '/reel/NEXT/', '<video id="v2"></video>');
  assert.equal(await h.eventually(() => h.overlayShown(page)), true, 'próximo reel deve ser bloqueado');
  assert.equal(await h.tryPlayAndReadPaused(page, '#v2'), true, 'mídia deve ficar pausada');

  await page.evaluate(() => history.back());
  assert.equal(await h.eventually(async () => !(await h.overlayShown(page))), true, 'voltar ao reel liberado');
});

test('reel aberto direto (fora do Direct): bloqueado e pausado', async () => {
  const { page } = await open('/reel/FRESH/');
  assert.equal(await h.overlayShown(page), true);
  assert.equal(await h.tryPlayAndReadPaused(page, '#v'), true);
});

test('/reels/ redireciona para o feed', async () => {
  const { page } = await open('/reels/');
  await page.waitForURL(origin + '/');
  assert.equal(new URL(page.url()).pathname, '/');
});

test('/<perfil>/reels/ redireciona para o perfil', async () => {
  const { page } = await open('/amigo/reels/');
  await page.waitForURL(origin + '/amigo/');
  assert.equal(await h.visible(page, '#profile-name'), true);
});

test('pesquisa continua funcionando', async () => {
  const { page } = await open('/explore/search/');
  for (const id of ['#search', '#result-user', '#result-tag']) {
    assert.equal(await h.visible(page, id), true, id);
  }
});

test('privacidade: o filtro não gera nenhuma requisição além das páginas navegadas', async () => {
  const { page, requests } = await open('/');
  await h.spaNavigate(page, '/direct/t/123/');
  await new Promise((r) => setTimeout(r, 300));
  assert.deepEqual(requests, [origin + '/']);
});
