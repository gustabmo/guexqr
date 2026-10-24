// guexqr backend — see PROTOCOL.md at the repo root.
// Single entry point: doPost with a JSON body { "action": ..., ... }.

const CONFIG_SHEET = 'Config';
const RESERVED_SHEETS = [CONFIG_SHEET, 'Requests', 'Log'];   // never usable as a course
const MANAGER_ACTIONS = ['queue', 'history', 'act'];     // require "key"

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) throw new Error('empty body');
    const req = JSON.parse(e.postData.contents);
    const action = req.action;
    if (!action) throw new Error('missing action');

    if (MANAGER_ACTIONS.indexOf(action) >= 0) {
      const mykey = PropertiesService.getScriptProperties().getProperty('MANAGER_KEY');
      if (!mykey) throw new Error('no key stored in properties');
      if (req.key !== key) throw new Error('bad key');
    }
    if (action !== 'config' && !req.course) throw new Error('missing course');

    switch (action) {
      case 'config': return okReply(actionConfig());
      case 'pages':  return okReply(actionPages(req.course));
      default:       throw new Error('unknown action: ' + action);
    }
  } catch (err) {
    return reply({ ok: false, error: err.message || String(err) });
  }
}

// ---------- actions ----------

function actionConfig() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG_SHEET);
  if (!sheet) throw new Error('sheet "' + CONFIG_SHEET + '" not found');
  const course = String(sheet.getRange('B2').getValue()).trim();
  if (!course) throw new Error('no course in use (Config!B2 is empty)');
  return { course: course };
}

function actionPages(course) {
  const pages = getPages(course).map(p => {
    const out = { num: p.num, page: p.page, title: p.title, locked: p.locked };
    if (!p.locked) out.url = p.url;       // locked URLs are only sent on allow / autoUnlock
    return out;
  });
  return { pages: pages };
}

// ---------- helpers ----------

// Full page list of a course, URLs included. Internal use only.
function getPages(course) {
  if (RESERVED_SHEETS.indexOf(course) >= 0) throw new Error('course is reserved: ' + course);
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(course);
  if (!sheet) throw new Error('course not found: ' + course);

  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  return sheet.getRange(2, 1, lastRow - 1, 4).getValues()
    .filter(r => String(r[0]).trim() !== '')
    .map((r, i) => ({
      num: i,
      page: String(r[0]).trim(),
      title: String(r[1]),
      locked: r[2] === true || String(r[2]).toUpperCase() === 'TRUE',
      url: String(r[3])
    }));
}

function okReply(obj) {
  return reply(Object.assign({ ok: true }, obj));
}

function reply(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
