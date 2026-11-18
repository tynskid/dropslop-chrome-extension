'use strict';
importScripts('lib/core.js', 'lib/page.js');
const Core = self.DropSlopCore;
const MENU_ID = 'dropslop-check-selection';

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({ id: MENU_ID, title: 'Check selection with DropSlop', contexts: ['selection'] });
});

async function getKey() {
  try { return (await chrome.storage.local.get('apiKey')).apiKey || ''; } catch (e) { return ''; }
}

/* Calls the API. Never throws; returns {ok:true, view} or {ok:false, message, needsKey}. The key and the text are
   not logged. */
async function check(text) {
  const key = Core.cleanKey(await getKey());
  const req = Core.buildRequest(text, key);
  let res;
  try { res = await fetch(req.url, req.init); } catch (e) { return Core.networkError(); }
  let body = null;
  try { body = await res.json(); } catch (e) { /* not JSON */ }
  if (!res.ok) return Core.errorFromResponse(res.status, body, !!key);
  return { ok: true, view: Core.viewFromResult(body) };
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg && msg.type === 'check' && sender.id === chrome.runtime.id) {
    check(String(msg.text || '')).then(sendResponse);
    return true;
  }
  if (msg && msg.type === 'readSelection' && sender.id === chrome.runtime.id) {
    readSelection(msg.tabId).then(sendResponse);
    return true;
  }
  return false;
});

/* Reads the selection from the tab (all frames, so editors inside iframes work). Returns the longest. */
async function readSelection(tabId) {
  try {
    const out = await chrome.scripting.executeScript({ target: { tabId, allFrames: true }, func: readSelectionInPage });
    const texts = out.map((o) => (typeof o.result === 'string' ? o.result : '')).filter((t) => t.trim());
    texts.sort((a, b) => b.length - a.length);
    return { text: texts[0] || '' };
  } catch (e) {
    return { text: '', unreadable: true };
  }
}

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== MENU_ID || !tab || tab.id === undefined) return;
  let text = (await readSelection(tab.id)).text;
  if (!text.trim()) text = info.selectionText || '';
  if (!text.trim()) return;
  const r = await check(text);
  const hint = r.needsKey ? 'Add a key on the extension options page to check more. Keys come from ' + Core.KEYS_URL : '';
  try {
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: showPanelInPage,
      args: [r.ok ? r.view : null, r.ok ? '' : r.message, Core.EDITOR_URL, hint],
    });
  } catch (e) {
    /* The page cannot be drawn on (for example a browser page). Keep the answer for the popup. */
    await chrome.storage.session.set({ lastResult: r });
    chrome.action.setBadgeText({ text: '!' });
  }
});
