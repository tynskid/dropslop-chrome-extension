'use strict';
(function () {
  const $ = (id) => document.getElementById(id);
  const say = (t) => { $('msg').textContent = t; };
  chrome.storage.local.get('apiKey').then((v) => { $('key').value = v.apiKey || ''; });
  $('save').addEventListener('click', async () => {
    const raw = $('key').value.trim();
    if (!raw) { say('Type a key first, or use Remove key.'); return; }
    const k = window.DropSlopCore.cleanKey(raw);
    if (!k) { say('That does not look like a key. It should have no spaces or odd characters.'); return; }
    await chrome.storage.local.set({ apiKey: k });
    say('Saved.');
  });
  $('clear').addEventListener('click', async () => {
    await chrome.storage.local.remove('apiKey');
    $('key').value = '';
    say('Key removed.');
  });
})();
