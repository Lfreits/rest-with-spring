'use strict';

const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const h = require('./helpers');

const origin = 'https://m.youtube.com';

const PIVOT = `
  <ytm-pivot-bar-renderer>
    <ytm-pivot-bar-item-renderer id="pv-home"><div class="pivot-home"></div>Início</ytm-pivot-bar-item-renderer>
    <ytm-pivot-bar-item-renderer id="pv-shorts"><div class="pivot-shorts"></div>Shorts</ytm-pivot-bar-item-renderer>
    <ytm-pivot-bar-item-renderer id="pv-subs"><div class="pivot-subs"></div>Inscrições</ytm-pivot-bar-item-renderer>
    <ytm-pivot-bar-item-renderer id="pv-lib"><div class="pivot-library"></div>Você</ytm-pivot-bar-item-renderer>
  </ytm-pivot-bar-renderer>`;

const fixtures = {
  '/': h.page(`${PIVOT}
    <ytm-rich-item-renderer id="vid-normal"><a href="/watch?v=abc">Vídeo normal</a></ytm-rich-item-renderer>
    <ytm-rich-section-renderer id="shorts-shelf">
      <ytm-reel-shelf-renderer>Shorts
        <ytm-shorts-lockup-view-model><a href="/shorts/s1">short 1</a></ytm-shorts-lockup-view-model>
      </ytm-reel-shelf-renderer>
    </ytm-rich-section-renderer>
    <ytm-rich-item-renderer id="vid-short"><a href="/shorts/s2">Short solto</a></ytm-rich-item-renderer>
    <ytm-rich-section-renderer id="section-normal"><a href="/watch?v=def">Seção normal</a></ytm-rich-section-renderer>
    <grid-shelf-view-model id="grid-shorts"><a href="/shorts/s3">s3</a></grid-shelf-view-model>`),
  '/results': h.page(`${PIVOT}
    <input id="search" value="receita">
    <ytm-chip-cloud-chip-renderer id="chip-all">Tudo</ytm-chip-cloud-chip-renderer>
    <ytm-chip-cloud-chip-renderer id="chip-shorts">Shorts</ytm-chip-cloud-chip-renderer>
    <ytm-chip-cloud-chip-renderer id="chip-videos">Vídeos</ytm-chip-cloud-chip-renderer>
    <ytm-video-with-context-renderer id="res-video"><a href="/watch?v=r1">Receita</a></ytm-video-with-context-renderer>
    <ytm-video-with-context-renderer id="res-short"><a href="/shorts/r2">Receita short</a></ytm-video-with-context-renderer>
    <ytm-compact-channel-renderer id="res-channel"><a href="/@canal">Canal</a></ytm-compact-channel-renderer>
    <ytm-compact-playlist-renderer id="res-playlist"><a href="/playlist?list=PL1">Playlist</a></ytm-compact-playlist-renderer>`),
  '/@canal': h.page(`
    <h1 id="channel-name">Canal</h1>
    <a role="tab" id="tab-home" href="/@canal/featured">Início</a>
    <a role="tab" id="tab-videos" href="/@canal/videos">Vídeos</a>
    <a role="tab" id="tab-shorts" href="/@canal/shorts">Shorts</a>
    <a role="tab" id="tab-playlists" href="/@canal/playlists">Playlists</a>`),
  '/@canal/videos': h.page('<h1 id="channel-videos">Vídeos do canal</h1>'),
  '/watch': h.page(`
    <video id="player"></video>
    <h1 id="title">Vídeo normal</h1>
    <ytm-compact-video-renderer id="rec-video"><a href="/watch?v=next">Recomendado</a></ytm-compact-video-renderer>
    <ytm-reel-shelf-renderer id="rec-shorts"><a href="/shorts/x">Shorts</a></ytm-reel-shelf-renderer>
    <ytm-comment-thread-renderer id="comment">Ótimo vídeo</ytm-comment-thread-renderer>`),
  '/playlist': h.page(`
    <h1 id="pl-title">Minha playlist</h1>
    <ytm-playlist-video-renderer id="pl-item"><a href="/watch?v=p1&list=PL1">Item</a></ytm-playlist-video-renderer>`),
  '/shorts/abc': h.page('<video id="v" muted></video>'),
};

let browser;
before(async () => { browser = await h.launch(); });
after(async () => { await browser?.close(); });

const open = (startUrl) => h.open(browser, { script: 'youtube.user.js', origin, fixtures, startUrl });

test('início: Shorts somem (prateleira, card, grade, botão), vídeos ficam', async () => {
  const { page } = await open('/');
  assert.equal(await h.visible(page, '#vid-normal'), true);
  assert.equal(await h.visible(page, '#section-normal'), true);
  assert.equal(await h.visible(page, '#shorts-shelf'), false);
  assert.equal(await h.visible(page, '#vid-short'), false);
  assert.equal(await h.visible(page, '#grid-shorts'), false);
  assert.equal(await h.visible(page, '#pv-shorts'), false);
  for (const id of ['#pv-home', '#pv-subs', '#pv-lib']) assert.equal(await h.visible(page, id), true, id);
});

test('carregamento dinâmico: Short inserido depois some, vídeo fica', async () => {
  const { page } = await open('/');
  await page.evaluate(() => document.body.insertAdjacentHTML('beforeend',
    '<ytm-rich-item-renderer id="late-short"><a href="/shorts/late">s</a></ytm-rich-item-renderer>' +
    '<ytm-rich-item-renderer id="late-video"><a href="/watch?v=late">v</a></ytm-rich-item-renderer>'));
  assert.equal(await h.eventually(async () => !(await h.visible(page, '#late-short'))), true);
  assert.equal(await h.visible(page, '#late-video'), true);
});

test('pesquisa: resultados, canais e playlists ficam; Shorts e chip Shorts somem', async () => {
  const { page } = await open('/results?search_query=receita');
  for (const id of ['#search', '#chip-all', '#chip-videos', '#res-video', '#res-channel', '#res-playlist']) {
    assert.equal(await h.visible(page, id), true, id);
  }
  assert.equal(await h.visible(page, '#res-short'), false);
  assert.equal(await h.visible(page, '#chip-shorts'), false);
});

test('canal: aba Shorts some, demais abas ficam', async () => {
  const { page } = await open('/@canal');
  for (const id of ['#channel-name', '#tab-home', '#tab-videos', '#tab-playlists']) {
    assert.equal(await h.visible(page, id), true, id);
  }
  assert.equal(await h.visible(page, '#tab-shorts'), false);
});

test('/@canal/shorts redireciona para /@canal/videos', async () => {
  const { page } = await open('/@canal/shorts');
  await page.waitForURL(origin + '/@canal/videos');
  assert.equal(await h.visible(page, '#channel-videos'), true);
});

test('vídeo convencional: player, recomendações e comentários ficam; prateleira de Shorts some', async () => {
  const { page } = await open('/watch?v=abc');
  assert.equal(await h.overlayShown(page), false);
  for (const id of ['#player', '#title', '#rec-video', '#comment']) {
    assert.equal(await h.visible(page, id), true, id);
  }
  assert.equal(await h.visible(page, '#rec-shorts'), false);
});

test('playlist continua funcionando', async () => {
  const { page } = await open('/playlist?list=PL1');
  assert.equal(await h.visible(page, '#pl-title'), true);
  assert.equal(await h.visible(page, '#pl-item'), true);
});

test('/shorts/<id> aberto direto: bloqueado e pausado', async () => {
  const { page } = await open('/shorts/abc');
  assert.equal(await h.overlayShown(page), true);
  assert.equal(await h.tryPlayAndReadPaused(page, '#v'), true);
});

test('SPA: ir para um Short bloqueia; voltar a um vídeo normal libera', async () => {
  const { page } = await open('/');
  await h.spaNavigate(page, '/shorts/spa');
  assert.equal(await h.eventually(() => h.overlayShown(page)), true);
  await h.spaNavigate(page, '/watch?v=ok');
  assert.equal(await h.eventually(async () => !(await h.overlayShown(page))), true);
});

test('privacidade: o filtro não gera nenhuma requisição além das páginas navegadas', async () => {
  const { page, requests } = await open('/');
  await h.spaNavigate(page, '/watch?v=1');
  await new Promise((r) => setTimeout(r, 300));
  assert.deepEqual(requests, [origin + '/']);
});
