'use strict';
/* Pure logic for the DropSlop extension: no chrome.* calls, no DOM. Loaded by the service worker (importScripts),
   the popup (script tag) and the tests (require). */
(function (root) {
  const API_URL = 'https://dropslop.ai/v1/lint';
  const EDITOR_URL = 'https://dropslop.ai/editor/';
  const KEYS_URL = 'https://dropslop.ai/keys/';

  function countWords(text) {
    const m = String(text || '').trim().match(/\S+/g);
    return m ? m.length : 0;
  }

  /* A key goes in a header, so it must be plain visible ASCII. Returns '' when there is none. */
  function cleanKey(key) {
    const k = String(key || '').trim();
    return /^[\x21-\x7e]+$/.test(k) ? k : '';
  }

  function buildRequest(text, key) {
    const headers = { 'Content-Type': 'application/json' };
    const k = cleanKey(key);
    if (k) headers.Authorization = 'Bearer ' + k;
    return { url: API_URL, init: { method: 'POST', headers, body: JSON.stringify({ text: String(text), mode: 'cuts' }) } };
  }

  /* Turn a failed answer into a message to show. needsKey tells the UI to point at the options page. */
  function errorFromResponse(status, body, hasKey) {
    const d = body && body.detail;
    const server = typeof d === 'string' ? d : (d && typeof d.message === 'string' ? d.message : '');
    let message = server;
    if (!message) {
      if (status === 400) message = 'There is no text to check.';
      else if (status === 413) message = 'That text is too long to check without a key.';
      else if (status === 402) message = 'The free checks are used up.';
      else if (status === 401 || status === 403) message = 'DropSlop did not accept the key.';
      else message = 'DropSlop answered ' + status + '.';
    }
    const needsKey = !hasKey && (status === 402 || status === 413);
    return { ok: false, status, message, needsKey };
  }

  function networkError() {
    return { ok: false, status: 0, message: 'Could not reach dropslop.ai. Check your connection and try again.', needsKey: false };
  }

  /* Turn an answer into what the popup and the page panel show. */
  function viewFromResult(r) {
    const spans = Array.isArray(r && r.flaggedSpans) ? r.flaggedSpans : [];
    const rows = spans.map((s) => {
      const cut = s.suggestedCut;
      let kind = 'none', replacement = '';
      if (cut === '') kind = 'cut';
      else if (typeof cut === 'string') { kind = 'replace'; replacement = cut; }
      return { phrase: String(s.text || ''), reason: String(s.reason || ''), kind, replacement };
    });
    const cadence = Array.isArray(r && r.uniformCadenceBrackets) ? r.uniformCadenceBrackets.length : 0;
    const cadenceNote = cadence
      ? (cadence === 1 ? 'One stretch has sentences of nearly the same length running together.'
        : cadence + ' stretches have sentences of nearly the same length running together.')
      : '';
    const score = Math.round(Number(r && r.humanScore));
    return {
      score: Number.isFinite(score) ? score : null,
      words: Number(r && r.words) || 0,
      rows,
      cadenceNote,
      empty: rows.length === 0 && !cadence,
    };
  }

  function rowSuggestion(row) {
    if (row.kind === 'cut') return 'Cut it';
    if (row.kind === 'replace') return 'Try: ' + row.replacement;
    return '';
  }

  const api = { API_URL, EDITOR_URL, KEYS_URL, countWords, cleanKey, buildRequest, errorFromResponse, networkError, viewFromResult, rowSuggestion };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.DropSlopCore = api;
})(typeof self !== 'undefined' ? self : globalThis);
