# guexqr protocol (v2 — no QR code)

Three parts:

- `web/` — student pages (browser)
- `managerapp/` — teacher app (Flutter)
- `backend/` — Apps Script web app bound to the guexqr Google Sheet

## 1. Google Sheet

| Tab        | Content |
|------------|---------|
| `Config`   | `A2` = `CourseInUse`, `B2` = name of the course in use (e.g. `js2026`) |
| `<course>` | one tab per course, named like the course (e.g. `js2026`): the page list. Course names Config, Requests, Log are reserved. |
| `Requests` | pending access requests (managed by the backend only) |
| `Log`      | one row per allowed page |

### `<course>` tab (page list)

Row 1 = headers. Row order gives the page number, 0-based: row 2 = page #0.

| Column | Header   | Example       |
|--------|----------|---------------|
| A      | `page`   | `BtnOnClick`  |
| B      | `title`  | `Actions à partir de click de buttons` |
| C      | `locked` | `TRUE` / `FALSE` |
| D      | `url`    | Google Docs published URL |

A page's number is always derived from its position in this list.
A page code found in `Log` but no longer in the list shows `#n/a` instead of its number.

Pages are identified **only by their code**, never by their number:

- The student page URL carries only the code: `...?code=BtnOnClick` (no `np`).
- Requests and `Log` rows store the code.
- The browser fetches the list (`pages`) on every page load, so changes made in
  the Sheet apply on the next page a student opens, with no deploy. Inserting,
  removing or reordering pages never invalidates an unlocked page or a pending request.
- An open page is not refreshed by itself; it sees changes on the next
  navigation or reload.
- A code that is no longer in the list shows a "page not found" page.

### `Requests` tab

| Column | Header         | Notes |
|--------|----------------|-------|
| A      | `requested`    | server time when the request was made |
| B      | `course`       | |
| C      | `requestId`    | 10 random digits, as text |
| D      | `student`      | name as typed (normalized, see §5) |
| E      | `page`         | page code the request is for |
| F      | `state`        | see §3 |
| G      | `target`       | page code to move to (state `movingBack`/`movingForward` only) |
| H      | `stateChanged` | server time of the last state change |

### `Log` tab

`logged | course | student | page | requested`

`requested` = when the request was made,
so waiting times can be computed later.

## 2. Transport

The URL is public (it’s in web/); the manager actions require the key.
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
       ├──back/forward──▶  movingBack/movingForward  ──ack──▶  pending (page = target)
       │
       ├──refuseName──▶  refusingName  ──ack──▶  (row deleted)
       │
       └──delete──▶  (row deleted immediately)

- The manager app shows the detailed state of each request
- `delete` needs no browser feedback: the row is removed, and the browser
  learns it through `status` returning `unknown`.
- While a request is `allowing` or `movingBack` or `movingForward` or `refusingName`, only `delete` is accepted.
- A new `request` from the same student + course replaces any existing row.
- The browser keeps its pending `requestId` in `sessionStorage`, so a reload resumes polling instead of sending a new request.

## 4. What the browser stores, and auto-unlock

`Log` is the only record of what a student has unlocked. The browser stores just:

- the `studentName` cookie: written on `allow`, i.e. a name the teacher confirmed
  on this computer; deleted on `refuseName`;
- while a request is pending, its `requestId` in `sessionStorage`.

There is no per-page unlock cookie. On every page load the browser calls `pages`,
sending `student` **only if it comes from the `studentName` cookie** (a name typed
in the field is never sent there). The backend then includes the `url` of every
page this student already has in `Log` for this course: those pages open without
a new request, on any computer where the cookie holds that name.

Known limitation, accepted: on a shared computer the cookie holds the last
student allowed there; another student sitting there gets that student's
already-logged pages. The name is shown in large letters on the page.

## 5. Student names

Before storing or comparing: trim, then collapse internal whitespace to one space.
Comparisons are case-insensitive (`toLowerCase()` of the normalized name).

## 6. Actions — student page (no key)

### `config`
→ `{"ok": true, "course": "js2026"}`

### `pages`
`{"action": "pages", "course": "js2026", "student": "Léa"}` — `student` optional, from the cookie only (§4)
→ `{"ok": true, "pages": [{"num": 0, "page": "Intro", "title": "...", "locked": false, "url": "..."}, ...]}`

`url` is present on every page the student can open: pages with `locked: false`,
plus locked pages that `student` already has in `Log` for this course.
A page with `url` opens; a page without one shows the request screen.

### `request`
`{"action": "request", "course", "requestId", "student", "page"}`
→ `{"ok": true}`

### `status`
`{"action": "status", "course", "requestId"}`
→ `{"ok": true, "state": ...}` where `state` is one of:

| state          | extra fields              | browser does |
|----------------|---------------------------|--------------|
| `pending`      |                           | keep polling |
| `allowing`     | `url`                     | write the `studentName` cookie, open `url`, then `ack` |
| `movingBack`   | `target`, `targetNum`     | `ack`, then go to page `target` (by code) and keep polling |
| `movingForward`| `target`, `targetNum`     | `ack`, then go to page `target` (by code) and keep polling |
| `refusingName` |                           | `ack`, delete the `studentName` cookie, show the name field, re-enable the button |
| `unknown`      |                           | (deleted) re-enable the button |

### `ack`
`{"action": "ack", "course", "requestId", "state"}` — `state` = the state being acknowledged
→ `{"ok": true}`

## 7. Actions — manager app (require `"key"`)

The key is stored as script property `MANAGER_KEY` and in the app's
untracked config file; never in the repo.

### `queue`
`{"action": "queue", "key", "course"}`
→ `{"ok": true, "requests": [{"requestId", "student", "page", "num", "state", "target", "requested", "stateChanged"}, ...], "now"}`

Sorted oldest first. `num` is `null` for a page not in the list (`#n/a`).
`target` is the destination page code while `movingBack`/`movingForward`, empty otherwise.

`now` (here and in `history`) is the server's clock: the app computes "time in
queue" and the intervals between log rows from it, not from the phone's clock.

### `history`
`{"action": "history", "key", "course", "student"}`
→ `{"ok": true, "logs": [{"page", "num", "logged"}, ...], "students": [...], "now"}`

- `logs`: the last 5 `Log` rows for this course + student (case-insensitive), oldest first.
- `students`: only when `logs` is empty — unique student names in `Log` for this
  course, sorted, case-insensitive (spelling of the most recent row).

### `act`
`{"action": "act", "key", "course", "requestId", "do"}`
with `do` = `allow` | `refuseName` | `delete` | `back` | `forward`
→ `{"ok": true}`

`back` / `forward` fail if there is no previous / next page.
