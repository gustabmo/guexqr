// guexqr backend — see PROTOCOL.md at the repo root.
// Single entry point: doPost with a JSON body { "action": ..., ... }.

const CONFIG_SHEET = 'Config';
const REQUESTS_SHEET = 'Requests';
const LOG_SHEET = 'Log';
const RESERVED_SHEETS = [CONFIG_SHEET, REQUESTS_SHEET, LOG_SHEET];   // never usable as a course
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
      if (req.key !== mykey) throw new Error('bad key');
    }
    if (action !== 'config' && !req.course) throw new Error('missing course');

    switch (action) {
      case 'config': return okReply(actionConfig());
      case 'pages':  return okReply(actionPages(req.course));
      case 'request': return okReply(withLock(() => actionRequest(req)));
      case 'status': return okReply(actionStatus(req));
      case 'ack':    return okReply(withLock(() => actionAck(req)));
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

// Student asks for access to a locked page.
// Replaces any request of the same student (case-insensitive) in the same course.
function actionRequest(req) {
  const requestId = String(req.requestId || '');
  if (!/^\d{10}$/.test(requestId)) throw new Error('requestId must be 10 digits');
  const student = normalizeName(req.student);
  if (!student) throw new Error('missing student');
  const page = findPage(getPages(req.course), req.page);
  if (!page) throw new Error('page not found: ' + req.page);
  if (!page.locked) throw new Error('page is not locked: ' + page.page);

  const sheet = getSheet(REQUESTS_SHEET);
  const rows = sheet.getDataRange().getValues();
  // delete bottom-up so row numbers stay valid
  for (let i = rows.length - 1; i >= 1; i--) {
    const r = rows[i];
    if (String(r[RQ.course]) === req.course &&
        (sameName(r[RQ.student], student) || sameId(r[RQ.requestId], requestId))) {
      sheet.deleteRow(i + 1);
    }
  }
  const now = new Date();
  sheet.appendRow([now, req.course, requestId, student, page.page, 'pending', '', now]);
  return {};
}

// Student page polls its request.
function actionStatus(req) {
  const found = findRequest(req.course, req.requestId);
  if (!found) return { state: 'unknown' };
  const r = found.values;
  const state = String(r[RQ.state]);
  const out = { state: state };
  if (state === 'allowing') {
    const page = findPage(getPages(req.course), r[RQ.page]);
    out.url = page ? page.url : null;
  } else if (state === 'movingBack' || state === 'movingForward') {
    const target = findPage(getPages(req.course), r[RQ.target]);
    out.target = String(r[RQ.target]);
    out.targetNum = target ? target.num : null;
  }
  return out;
}

// Student page confirms it has applied a state.
function actionAck(req) {
  const found = findRequest(req.course, req.requestId);
  if (!found) throw new Error('unknown request');
  const r = found.values;
  const state = String(r[RQ.state]);
  if (state !== req.state) throw new Error('state mismatch: request is ' + state);

  const sheet = getSheet(REQUESTS_SHEET);
  const now = new Date();
  if (state === 'allowing') {
    getSheet(LOG_SHEET).appendRow([now, r[RQ.course], r[RQ.student], r[RQ.page], r[RQ.requested]]);
    sheet.deleteRow(found.row);
  } else if (state === 'movingBack' || state === 'movingForward') {
    // columns E..H = page, state, target, stateChanged
    sheet.getRange(found.row, RQ.page + 1, 1, 4).setValues([[r[RQ.target], 'pending', '', now]]);
  } else if (state === 'refusingName') {
    sheet.deleteRow(found.row);
  } else {
    throw new Error('nothing to acknowledge in state ' + state);
  }
  return {};
}

// ---------- helpers ----------

// Column indexes (0-based) of the Requests tab.
const RQ = { requested: 0, course: 1, requestId: 2, student: 3, page: 4,
             state: 5, target: 6, stateChanged: 7 };

// Returns { row (1-based sheet row), values } or null.
function findRequest(course, requestId) {
  const rows = getSheet(REQUESTS_SHEET).getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][RQ.course]) === course && sameId(rows[i][RQ.requestId], requestId)) {
      return { row: i + 1, values: rows[i] };
    }
  }
  return null;
}

function findPage(pages, code) {
  return pages.find(p => p.page === String(code).trim()) || null;
}

function getSheet(name) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
  if (!sheet) throw new Error('sheet "' + name + '" not found');
  return sheet;
}

// Serializes writes: two requests arriving together can't corrupt the Requests tab.
function withLock(fn) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try { return fn(); } finally { lock.releaseLock(); }
}

function normalizeName(s) {
  return String(s == null ? '' : s).trim().replace(/\s+/g, ' ');
}

function sameName(a, b) {
  return normalizeName(a).toLowerCase() === normalizeName(b).toLowerCase();
}

// Tolerates an ID that Sheets stored as a number (lost leading zeros).
function sameId(a, b) {
  return String(a).padStart(10, '0') === String(b).padStart(10, '0');
}

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