# DropSlop for Chrome

Select text on any page, click the toolbar button (or right-click and choose "Check selection with DropSlop"), and
see which phrases read as machine-made, why, and what to put instead. No build step and no dependencies.

## Load it unpacked
1. Open `chrome://extensions` and turn on Developer mode.
2. Choose "Load unpacked" and pick this folder (a clone or download of this repository).
3. Select some text on a page and click the DropSlop button. Pin it from the puzzle-piece menu if you like.

An optional API key goes on the options page (right-click the button, then Options). Without one you get a few
free checks a day; when they run out the extension shows DropSlop's own message and points to the options page.
Keys come from https://dropslop.ai/keys/.

## What it does
- Toolbar button: reads the current selection, checks it, and shows the result in the popup. If nothing is
  selected, the popup has a box to paste text into.
- Right-click menu: checks the selection and shows a small closeable panel on the page.
- The result is the human score, the word count, each flagged phrase with its reason and suggested replacement,
  and a note when sentences of nearly the same length run together.
- "Open the full check on DropSlop" opens https://dropslop.ai/editor/ in a new tab.
- It does not highlight inside the page. Google Docs draws to a canvas, so highlighting there is not possible; the
  list of flagged phrases is the feature. In Google Docs, selection can be read in many cases but not all; if it
  cannot be read, paste the text into the popup.

## Permissions and why
| Permission | Why |
| --- | --- |
| `activeTab` | Read the selected text on the page you clicked on, only after you click the button or menu item. |
| `scripting` | Run the small function that reads the selection, and draws the panel for the right-click check. |
| `storage` | Keep your optional API key on this device (`storage.local`) and hold a result briefly if a page cannot show the panel. |
| `contextMenus` | The "Check selection with DropSlop" menu item. |
| host `https://dropslop.ai/*` | Send the text you asked to check to DropSlop. No other site is contacted. |

There are no content scripts, no scripts that run on every site, no remote code and no analytics.

## Tests
`node --test integrations/chrome-extension/test/` covers the request, the answer-to-rows step, the error messages
and the manifest. Icons are made by `tools/make_icons.py` (needs Pillow) and are committed.

---

## Draft Chrome Web Store listing (not published)

**Short description (under 132 characters)**
Select text on any page and see which phrases read as machine-made, with a suggested replacement for each.

**Long description**
DropSlop checks a piece of writing for phrases that tend to read as machine-made, and says what to do about each one.

Select text on a page (a Substack or WordPress editor, a Ghost draft, a LinkedIn post, a document you can select
from) and click the DropSlop button, or right-click and choose "Check selection with DropSlop". You see:
- a human score and the word count
- each flagged phrase, why it was flagged, and a suggested replacement or a suggestion to cut it
- a note when sentences of nearly the same length run together

If nothing is selected, you can paste text into the popup instead. "Open the full check on DropSlop" takes you to
the full editor at dropslop.ai.

The score is an estimate and can be wrong about any one text. Use it as a prompt to reread, not as a verdict.

The extension does not change the page, does not highlight text in place, and does nothing until you ask for a
check. A few checks a day are free. If you have a DropSlop key, add it on the options page.

**Privacy statement**
- What is sent: only the text you selected or pasted, when you click the button, use the right-click item, or press
  "Check this text". It is sent to https://dropslop.ai/v1/lint, and nowhere else. If you saved an API key, it is
  sent in the request header to the same address.
- When: never in the background, never on page load, never for text you did not select or paste.
- What is stored: your optional API key, in this browser's local extension storage. It is not synced, not logged
  and not sent to any other site.
- What is not done: no analytics, no tracking, no advertising, no remote code, no reading of pages you did not ask
  it to check.
- How DropSlop handles the text once received is covered by the privacy policy at https://dropslop.ai/ (link to be
  confirmed before submitting).

**Single purpose** Check selected text for phrases that read as machine-made.
