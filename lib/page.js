'use strict';
/* Functions run inside the page through chrome.scripting.executeScript. Each one must be self-contained:
   it is serialised and has no access to anything else in this file. They are only run when the person asks. */

function readSelectionInPage() {
  const el = document.activeElement;
  if (el && (el.tagName === 'TEXTAREA' || (el.tagName === 'INPUT' && /^(text|search|)$/i.test(el.type || '')))) {
    try {
      if (el.selectionStart !== el.selectionEnd) return el.value.slice(el.selectionStart, el.selectionEnd);
    } catch (e) { /* some inputs refuse selection access */ }
  }
  const s = window.getSelection();
  return s ? s.toString() : '';
}

/* Draws a small closeable panel in a shadow root, so the page's own styles do not touch it. Text goes in with
   textContent only. */
function showPanelInPage(view, error, editorUrl, optionsHint) {
  const ID = 'dropslop-extension-panel';
  const old = document.getElementById(ID);
  if (old) old.remove();
  const host = document.createElement('div');
  host.id = ID;
  host.style.cssText = 'all:initial;position:fixed;top:16px;right:16px;z-index:2147483647;';
  const sh = host.attachShadow({ mode: 'closed' });
  const css = document.createElement('style');
  css.textContent = ':host{all:initial}.p{box-sizing:border-box;width:340px;max-height:80vh;overflow:auto;font:14px/1.45 system-ui,-apple-system,"Segoe UI",sans-serif;'
    + 'background:#fff;color:#1c1b19;border:1px solid #cfcac0;border-radius:10px;box-shadow:0 6px 24px rgba(0,0,0,.2);padding:14px}'
    + '@media (prefers-color-scheme:dark){.p{background:#232220;color:#ece9e2;border-color:#4a4741}.m,.r{color:#b4afa5}.row{border-color:#3d3a35}a{color:#9ab8f0}}'
    + '.h{display:flex;justify-content:space-between;align-items:center;margin:0 0 8px}.t{font-weight:600}'
    + 'button{font:inherit;cursor:pointer;border:1px solid #8c877d;background:transparent;color:inherit;border-radius:6px;padding:4px 10px}'
    + '.s{font-size:28px;font-weight:700;margin:0}.m,.r{color:#5d5950;font-size:13px}.row{border-top:1px solid #e3dfd6;padding:8px 0}'
    + '.q{font-weight:600}.g{margin-top:4px}.err{margin:0 0 8px}a{color:#1d4ba8}.f{margin-top:10px;font-size:12px}';
  const p = document.createElement('div');
  p.className = 'p';
  const add = (parent, tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; parent.appendChild(e); return e; };
  const head = add(p, 'div', 'h');
  add(head, 'span', 't', 'DropSlop');
  const close = add(head, 'button', '', 'Close');
  close.addEventListener('click', () => host.remove());
  if (error) {
    add(p, 'p', 'err', error);
    if (optionsHint) add(p, 'p', 'm', optionsHint);
  } else {
    add(p, 'p', 's', view.score === null ? '-' : view.score + ' / 100 human');
    add(p, 'div', 'm', view.words + ' words. This score is an estimate and can be wrong about any one text.');
    if (view.empty) add(p, 'p', 'm', 'No phrases flagged.');
    for (const row of view.rows) {
      const d = add(p, 'div', 'row');
      add(d, 'div', 'q', '“' + row.phrase + '”');
      add(d, 'div', 'r', row.reason);
      const sug = row.kind === 'cut' ? 'Cut it' : (row.kind === 'replace' ? 'Try: ' + row.replacement : '');
      if (sug) add(d, 'div', 'g', sug);
    }
    if (view.cadenceNote) add(p, 'div', 'row m', view.cadenceNote);
  }
  const f = add(p, 'div', 'f');
  const a = add(f, 'a', '', 'Open the full check on DropSlop');
  a.href = editorUrl; a.target = '_blank'; a.rel = 'noopener';
  sh.appendChild(css);
  sh.appendChild(p);
  document.documentElement.appendChild(host);
}
