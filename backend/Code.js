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
      case 'pages':  return okReply(actionPages(req));
      case 'request': return okReply(withLock(() => actionRequest(req)));
      case 'status': return okReply(actionStatus(req));
      case 'ack':    return okReply(withLock(() => actionAck(req)));
      case 'queue':  return okReply(actionQueue(req));
      case 'history': return okReply(actionHistory(req));
      case 'act':    return okReply(withLock(() => actionAct(req)));
      default:       throw new Error('unknown action: ' + action);
    }
  } catch (err) {
    return reply({ ok: false, error: err.message || String(err) });
  }
}

// ---------- actions — student page ----------

function actionConfig() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG_SHEET);
  if (!sheet) throw new Error('sheet "' + CONFIG_SHEET + '" not found');
  const course = String(sheet.getRange('B2').getValue()).trim();
  if (!course) throw new Error('no course in use (Config!B2 is empty)');
  return { course: course };
}

// Page list. "url" is present on every page the student can open:
// unlocked pages, plus locked pages this student already has in Log.
// "student" is optional and must come from the studentName cookie (PROTOCOL.md §4).
function actionPages(req) {
  const student = normalizeName(req.student);
  const logged = {};                      // page codes this student has in Log
  if (student) {
    getLogRows().forEach(r => {
      if (String(r[LG.course]) === req.course && sameName(r[LG.student], student)) {
        logged[String(r[LG.page])] = true;
      }
    });
  }
  const pages = getPages(req.course).map(p => {
    const out = { num: p.num, page: p.page, title: p.title, locked: p.locked };
    if (!p.locked || logged[p.page]) out.url = p.url;
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

// ---------- actions — manager app ----------

// All requests of the course, oldest first.
function actionQueue(req) {
  const pages = getPages(req.course);
  const requests = getSheet(REQUESTS_SHEET).getDataRange().getValues().slice(1)
    .filter(r => String(r[RQ.course]) === req.course)
    .map(r => {
      const page = findPage(pages, r[RQ.page]);
      return {
        requestId: String(r[RQ.requestId]).padStart(10, '0'),
        student: String(r[RQ.student]),
        page: String(r[RQ.page]),
        num: page ? page.num : null,
        state: String(r[RQ.state]),
        target: String(r[RQ.target]),
        requested: r[RQ.requested],
        stateChanged: r[RQ.stateChanged]
      };
    })
    .sort((a, b) => new Date(a.requested) - new Date(b.requested));
  return { requests: requests, now: new Date() };
}

// Last 5 Log rows of a student in the course; if none, the list of known students.
function actionHistory(req) {
  const student = normalizeName(req.student);
  if (!student) throw new Error('missing student');
  const pages = getPages(req.course);
  const rows = getLogRows().filter(r => String(r[LG.course]) === req.course);

  const logs = rows.filter(r => sameName(r[LG.student], student)).slice(-5).map(r => {
    const page = findPage(pages, r[LG.page]);
    return { page: String(r[LG.page]), num: page ? page.num : null, logged: r[LG.logged] };
  });
  const out = { logs: logs, now: new Date() };

  if (logs.length === 0) {
    const byLower = {};                       // later rows overwrite: most recent spelling wins
    rows.forEach(r => {
      const name = normalizeName(r[LG.student]);
      if (name) byLower[name.toLowerCase()] = name;
    });
    out.students = Object.values(byLower)
      .sort((a, b) => a.localeCompare(b, 'fr', { sensitivity: 'base' }));
  }
  return out;
}

// Teacher's decision on a request.
function actionAct(req) {
  const found = findRequest(req.course, req.requestId);
  if (!found) throw new Error('unknown request');
  const r = found.values;
  const state = String(r[RQ.state]);
  const sheet = getSheet(REQUESTS_SHEET);
  const now = new Date();

  if (req.do === 'delete') {
    sheet.deleteRow(found.row);
    return {};
  }
  if (state !== 'pending') throw new Error('request is ' + state + ': only delete is possible');

  let newState, target = '';
  switch (req.do) {
    case 'allow':      newState = 'allowing'; break;
    case 'refuseName': newState = 'refusingName'; break;
    case 'back':
    case 'forward': {
      const pages = getPages(req.course);
      const cur = findPage(pages, r[RQ.page]);
      if (!cur) throw new Error('page not in list: ' + r[RQ.page]);
      const next = pages[cur.num + (req.do === 'back' ? -1 : 1)];
      if (!next) throw new Error(req.do === 'back' ? 'no previous page' : 'no next page');
      newState = req.do === 'back' ? 'movingBack' : 'movingForward';
      target = next.page;
      break;
    }
    default: throw new Error('unknown do: ' + req.do);
  }
  // columns F..H = state, target, stateChanged
  sheet.getRange(found.row, RQ.state + 1, 1, 3).setValues([[newState, target, now]]);
  return {};
}

// ---------- helpers ----------

// Column indexes (0-based) of the Log tab.
const LG = { logged: 0, course: 1, student: 2, page: 3, requested: 4 };

function getLogRows() {
  return getSheet(LOG_SHEET).getDataRange().getValues().slice(1);
}

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