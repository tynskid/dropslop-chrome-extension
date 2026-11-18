'use strict';
(function () {
  const Core = window.DropSlopCore;
  const $ = (id) => document.getElementById(id);
  const sections = ['paste', 'error', 'result'];
  function show(name) { sections.forEach((s) => { $(s).hidden = s !== name; }); }
  function status(t) { $('status').textContent = t; $('status').hidden = !t; }
  function openOptions() { chrome.runtime.openOptionsPage(); }

  function render(view) {
    status('');
    $('score').textContent = view.score === null ? '-' : view.score + ' / 100 human';
    $('meta').textContent = view.words + ' words. This score is an estimate and can be wrong about any one text.';
    $('cadence').hidden = !view.cadenceNote;
    $('cadence').textContent = view.cadenceNote;
    $('none').hidden = !view.empty;
    const list = $('list');
    list.textContent = '';
    for (const row of view.rows) {
      const d = document.createElement('div');
      d.className = 'row';
      const q = document.createElement('div'); q.className = 'q'; q.textContent = '“' + row.phrase + '”';
      const r = document.createElement('div'); r.className = 'reason'; r.textContent = row.reason;
      d.append(q, r);
      const s = Core.rowSuggestion(row);
      if (s) { const g = document.createElement('div'); g.className = 'sug'; g.textContent = s; d.appendChild(g); }
      list.appendChild(d);
    }
    show('result');
  }

  function showError(r) {
    status('');
    $('errmsg').textContent = r.message;
    $('keyhint').hidden = !r.needsKey;
    $('opt').hidden = !r.needsKey;
    show('error');
  }

  async function run(text) {
    show(null);
    status('Checking ' + Core.countWords(text) + ' words...');
    let r;
    try { r = await chrome.runtime.sendMessage({ type: 'check', text }); } catch (e) { r = Core.networkError(); }
    if (r && r.ok) render(r.view); else showError(r || Core.networkError());
  }

  function showPaste() { status(''); show('paste'); $('text').focus(); }

  $('go').addEventListener('click', () => { const t = $('text').value; if (t.trim()) run(t); });
  $('back').addEventListener('click', showPaste);
  $('opt').addEventListener('click', openOptions);
  $('optlink').addEventListener('click', (e) => { e.preventDefault(); openOptions(); });

  async function start() {
    try {
      const saved = (await chrome.storage.session.get('lastResult')).lastResult;
      if (saved) {
        await chrome.storage.session.remove('lastResult');
        chrome.action.setBadgeText({ text: '' });
        if (saved.ok) render(saved.view); else showError(saved);
        return;
      }
    } catch (e) { /* no stored result */ }
    let text = '';
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab && tab.id !== undefined) text = (await chrome.runtime.sendMessage({ type: 'readSelection', tabId: tab.id })).text || '';
    } catch (e) { /* page cannot be read */ }
    if (text.trim()) run(text); else showPaste();
  }
  if (window.chrome && chrome.runtime && chrome.runtime.id) start();
})();
