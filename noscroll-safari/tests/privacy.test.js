'use strict';

// Auditoria estática dos userscripts: garante que nenhum mecanismo de rede,
// execução dinâmica de código, permissão extra ou atualização remota foi incluído.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const DIR = path.join(__dirname, '..', 'scripts');
const scripts = fs.readdirSync(DIR).filter((f) => f.endsWith('.user.js'));

function metadata(src) {
  const block = src.match(/\/\/ ==UserScript==([\s\S]*?)\/\/ ==\/UserScript==/);
  assert.ok(block, 'bloco de metadados ausente');
  return [...block[1].matchAll(/\/\/\s+@(\S+)\s*(.*)/g)].map(([, k, v]) => [k, v.trim()]);
}

test('existem os dois userscripts', () => {
  assert.deepEqual(scripts.sort(), ['instagram.user.js', 'youtube.user.js']);
});

for (const file of scripts) {
  const src = fs.readFileSync(path.join(DIR, file), 'utf8');
  const code = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

  test(`${file}: nenhuma API de rede ou execução dinâmica`, () => {
    const forbidden = [
      /\bfetch\s*\(/, /XMLHttpRequest/, /WebSocket/, /sendBeacon/, /EventSource/,
      /new\s+Image\b/, /xmlhttpRequest/i, /\beval\s*\(/, /new\s+Function\b/,
      /importScripts/, /\.src\s*=/, /innerHTML/, /document\.cookie/, /localStorage/,
      /RTCPeerConnection/, /getDisplayMedia|getUserMedia/,
    ];
    for (const re of forbidden) assert.doesNotMatch(code, re, `${file} contém ${re}`);
  });

  test(`${file}: metadados sem permissões ou fontes remotas`, () => {
    const meta = metadata(src);
    const keys = meta.map(([k]) => k);
    for (const k of ['require', 'resource', 'connect', 'updateURL', 'downloadURL']) {
      assert.ok(!keys.includes(k), `${file} declara @${k}`);
    }
    const grants = meta.filter(([k]) => k === 'grant').map(([, v]) => v);
    assert.deepEqual(grants, ['GM.addStyle']);
    for (const [, v] of meta.filter(([k]) => k === 'match')) {
      assert.match(v, /^https:\/\/(www\.|m\.)?(instagram|youtube)\.com\/\*$/, v);
    }
  });
}
