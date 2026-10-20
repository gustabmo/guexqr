// guexqr backend – Log receiver
// Expects a JSON POST body:
//   { "student": "...", "page": "...", "browser": "...", "qrTimestamp": "...", "group": "..." (optional) }
// Appends one row to the "Log" tab:
//   logged | group | student | page | browser | qrTimestamp

const LOG_SHEET = 'Log';
const DEFAULT_GROUP = 'A';
const REQUIRED_FIELDS = ['student', 'page', 'browser', 'qrTimestamp'];

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return jsonResponse({ ok: false, error: 'empty body' });
    }

    const data = JSON.parse(e.postData.contents);

    const missing = REQUIRED_FIELDS.filter(
      k => data[k] === undefined || data[k] === null || String(data[k]).trim() === ''
    );
    if (missing.length > 0) {
      return jsonResponse({ ok: false, error: 'missing field(s): ' + missing.join(', ') });
    }

    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(LOG_SHEET);
    if (!sheet) {
      return jsonResponse({ ok: false, error: 'sheet "' + LOG_SHEET + '" not found' });
    }

    const group = (data.group && String(data.group).trim()) || DEFAULT_GROUP;

    sheet.appendRow([
      new Date(),
      group,
      String(data.student).trim(),
      String(data.page),
      String(data.browser),
      String(data.qrTimestamp)
    ]);

    return jsonResponse({ ok: true });
  } catch (err) {
    return jsonResponse({ ok: false, error: String(err) });
  }
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
