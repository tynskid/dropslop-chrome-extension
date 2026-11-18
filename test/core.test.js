'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const C = require('../lib/core.js');

test('countWords', () => {
  assert.strictEqual(C.countWords('  one two\nthree  '), 3);
  assert.strictEqual(C.countWords(''), 0);
  assert.strictEqual(C.countWords(null), 0);
});

test('buildRequest without a key', () => {
  const r = C.buildRequest('Hello there.', '');
  assert.strictEqual(r.url, 'https://dropslop.ai/v1/lint');
  assert.strictEqual(r.init.method, 'POST');
  assert.deepStrictEqual(JSON.parse(r.init.body), { text: 'Hello there.', mode: 'cuts' });
  assert.strictEqual(r.init.headers.Authorization, undefined);
});

test('buildRequest with a key adds a bearer header; bad keys are dropped', () => {
  assert.strictEqual(C.buildRequest('x', '  abc123 ').init.headers.Authorization, 'Bearer abc123');
  assert.strictEqual(C.buildRequest('x', 'has space').init.headers.Authorization, undefined);
  assert.strictEqual(C.buildRequest('x', 'café').init.headers.Authorization, undefined);
});

test('viewFromResult builds rows and a cadence note', () => {
  const v = C.viewFromResult({
    humanScore: 61.6, words: 40,
    flaggedSpans: [
      { start: 0, end: 5, text: 'delve', reason: 'Overused word', suggestedCut: 'dig' },
      { start: 6, end: 9, text: 'very', reason: 'Filler', suggestedCut: '' },
      { start: 10, end: 14, text: 'tapestry', reason: 'Cliche', suggestedCut: null },
    ],
    uniformCadenceBrackets: [[0, 50], [60, 120]],
  });
  assert.strictEqual(v.score, 62);
  assert.strictEqual(v.words, 40);
  assert.deepStrictEqual(v.rows.map((r) => r.kind), ['replace', 'cut', 'none']);
  assert.strictEqual(C.rowSuggestion(v.rows[0]), 'Try: dig');
  assert.strictEqual(C.rowSuggestion(v.rows[1]), 'Cut it');
  assert.strictEqual(C.rowSuggestion(v.rows[2]), '');
  assert.match(v.cadenceNote, /2 stretches/);
  assert.strictEqual(v.empty, false);
});

test('viewFromResult with nothing flagged and with odd input', () => {
  const v = C.viewFromResult({ humanScore: 90, words: 5, flaggedSpans: [], uniformCadenceBrackets: [] });
  assert.strictEqual(v.empty, true);
  assert.strictEqual(v.cadenceNote, '');
  assert.match(C.viewFromResult({ humanScore: 80, words: 9, uniformCadenceBrackets: [[1, 2]] }).cadenceNote, /^One stretch/);
  assert.strictEqual(C.viewFromResult({}).score, null);
  assert.strictEqual(C.viewFromResult(null).rows.length, 0);
});

test('errors: server message is shown as is, and a key is suggested only without one', () => {
  const e402 = C.errorFromResponse(402, { detail: { message: 'You have used your free checks for today.' } }, false);
  assert.strictEqual(e402.message, 'You have used your free checks for today.');
  assert.strictEqual(e402.needsKey, true);
  assert.strictEqual(C.errorFromResponse(402, { detail: { message: 'x' } }, true).needsKey, false);
  assert.strictEqual(C.errorFromResponse(413, { detail: { message: 'Over 2,500 words.' } }, false).needsKey, true);
  assert.strictEqual(C.errorFromResponse(400, { detail: 'No text.' }, false).message, 'No text.');
  assert.strictEqual(C.errorFromResponse(400, null, false).message, 'There is no text to check.');
  assert.strictEqual(C.errorFromResponse(500, null, false).message, 'DropSlop answered 500.');
  assert.strictEqual(C.errorFromResponse(500, null, false).needsKey, false);
  assert.strictEqual(C.networkError().ok, false);
});

test('manifest: minimal permissions, no content scripts, one host', () => {
  const m = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'manifest.json'), 'utf8'));
  assert.strictEqual(m.manifest_version, 3);
  assert.deepStrictEqual([...m.permissions].sort(), ['activeTab', 'contextMenus', 'scripting', 'storage']);
  assert.deepStrictEqual(m.host_permissions, ['https://dropslop.ai/*']);
  assert.strictEqual(m.content_scripts, undefined);
  for (const f of [m.background.service_worker, m.action.default_popup, m.options_ui.page, ...Object.values(m.icons)]) {
    assert.ok(fs.existsSync(path.join(__dirname, '..', f)), f + ' exists');
  }
});

test('no network address other than dropslop.ai in extension code', () => {
  const dir = path.join(__dirname, '..');
  for (const f of ['background.js', 'popup.js', 'options.js', 'lib/core.js', 'lib/page.js', 'popup.html', 'options.html']) {
    const urls = fs.readFileSync(path.join(dir, f), 'utf8').match(/https?:\/\/[^\s'"<>)]+/g) || [];
    for (const u of urls) assert.match(u, /^https:\/\/dropslop\.ai\//, f + ': ' + u);
  }
});
