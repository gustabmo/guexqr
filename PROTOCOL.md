# guexqr protocol (v2 — no QR code)

Three parts:

- `web/` — student pages (browser)
- `managerapp/` — teacher app (Flutter)
- `backend/` — Apps Script web app bound to the guexqr Google Sheet

## 1. Google Sheet

| Tab        | Content |
|------------|---------|
| `Config`   | `A2` = `CourseInUse`, `B2` = name of the course in use (e.g. `js2026`) |
| `<course>` | one tab per course, named like the course (e.g. `js2026`): the page list |
| `Requests` | pending access requests (managed by the backend only) |
| `Log`      | one row per page allowed |

### `<course>` tab (page list)

Row 1 = headers. Row order gives the page number, 0-based: row 2 = page #0.

| Column | Header   | Example       |
|--------|----------|---------------|
| A      | `page`   | `BtnOnClick`  |
| B      | `title`  | `Actions à partir de click de buttons` |
| C      | `locked` | `TRUE` / `FALSE` |
| D      | `url`    | Google Docs published URL |

A page's number is always derived from its position in this list.
A page code found in `Log` but no longer in the list is shown as `#n/a`.

### `Requests` tab

| Column | Header         | Notes |
|--------|----------------|-------|
| A      | `requested`    | server time when the request was made |
| B      | `course`       | |
| C      | `requestId`    | 10 random digits, as text |
| D      | `browser`      | browser ID (cookie) |
| E      | `student`      | name as typed (normalized, see §4) |
| F      | `page`         | page code the request is for |
| G      | `state`        | see §3 |
| H      | `target`       | page code to move to (state `moving` only) |
| I      | `stateChanged` | server time of the last state change |

### `Log` tab

`logged | course | student | page | browser | requested`

`requested` (column F, was `qrTimestamp`) = when the request was made,
so waiting times can be computed later.

## 2. Transport

Single URL (Apps Script web app `/exec`, kept out of the repo).
Every call is an HTTP **POST** whose body is a JSON object with an `action` field.

- Send the body with `Content-Type: text/plain`. With `application/json`
  the browser sends a CORS preflight (OPTIONS) that Apps Script cannot answer.
  The backend parses the body as JSON either way.
- Google answers with a 302 redirect; the real response comes from a GET on
  the `Location` URL. Browser `fetch` follows it automatically; the Flutter
  app must follow it itself.
- Every response is JSON: `{"ok": true, ...}` or `{"ok": false, "error": "..."}`.
- Every call except `config` includes `course`.

## 3. Request states

    pending  ──allow──▶  allowing  ──ack──▶  (row deleted, Log row added)
       │
       ├──back/forward──▶  moving  ──ack──▶  pending (page = target)
       │
       ├──refuseName──▶  refusingName  ──ack──▶  (row deleted)
       │
       └──delete──▶  (row deleted immediately)

- The manager app lists `pending`, `allowing` and `moving` (the last two
  shown as "waiting for browser").
- `refusingName` is hidden from the app; it only waits for the browser to read it.
- `delete` needs no browser feedback: the row is removed, and the browser
  learns it through `status` returning `unknown`.
- While a request is `allowing` or `moving`, only `delete` is accepted.
- A new `request` from the same browser + course replaces any existing row.

## 4. Student names

Before storing or comparing: trim, then collapse internal whitespace to one space.
Comparisons are case-insensitive (`toLowerCase()` of the normalized name).

## 5. Actions — student page (no key)

### `config`
→ `{"ok": true, "course": "js2026"}`

### `pages`
`{"action": "pages", "course": "js2026"}`
→ `{"ok": true, "pages": [{"num": 0, "page": "Intro", "title": "...", "locked": false, "url": "..."}, ...]}`

`url` is included only for pages with `locked: false`.

### `request`
`{"action": "request", "course", "requestId", "browser", "student", "page"}`
→ `{"ok": true}`

### `status`
`{"action": "status", "course", "requestId"}`
→ `{"ok": true, "state": ...}` where `state` is one of:

| state          | extra fields              | browser does |
|----------------|---------------------------|--------------|
| `pending`      |                           | keep polling |
| `allowing`     | `url`                     | store unlock + URL + `studentName` cookie, then `ack` |
| `moving`       | `target`, `targetNum`     | `ack`, then go to that page and keep polling |
| `refusingName` |                           | `ack`, show the name field, re-enable the button |
| `unknown`      |                           | (deleted) re-enable the button |

### `ack`
`{"action": "ack", "course", "requestId", "state"}` — `state` = the state being acknowledged
→ `{"ok": true}`

## 6. Actions — manager app (require `"key"`)

The key is stored as script property `MANAGER_KEY` and in the app's
untracked config file; never in the repo.

### `queue`
`{"action": "queue", "key", "course"}`
→ `{"ok": true, "requests": [{"requestId", "student", "page", "num", "state", "requested", "stateChanged"}, ...]}`

Sorted oldest first. `num` is `null` for a page not in the list (`#n/a`).

### `history`
`{"action": "history", "key", "course", "student"}`
→ `{"ok": true, "logs": [{"page", "num", "logged"}, ...], "students": [...]}`

- `logs`: the last 5 `Log` rows for this course + student (case-insensitive), oldest first.
- `students`: only when `logs` is empty — unique student names in `Log` for this
  course, sorted, case-insensitive (spelling of the most recent row).

### `act`
`{"action": "act", "key", "course", "requestId", "do"}`
with `do` = `allow` | `refuseName` | `delete` | `back` | `forward`
→ `{"ok": true}`

`back` / `forward` fail if there is no previous / next page.
