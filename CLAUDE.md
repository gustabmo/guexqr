# guexqr — notes for Claude

Classroom system: students work through a sequence of pages (published Google Docs).
Locked pages show a request screen; the teacher allows access from his phone app.
No logins, deliberately basic security (see "Security level" below).

**[PROTOCOL.md](PROTOCOL.md) is the contract** between the three parts: Sheet layout, request states, every backend action and its JSON. Read it first; keep it in sync with any change to an action.

## How to work with me (Gustavo)

- Work one step at a time. After each step, give me what to run and wait for my output before the next step. Don't branch into hypothetical scenarios before seeing real output.
- Before changing a file, read its current version: I often edit files myself.
- Explain in English; everything students or I see in the UI is in French (students are addressed with "tu").
- I use both Linux (Fedora) and macOS. The repo lives in Dropbox.

## Repo layout

| Folder        | What |
|---------------|------|
| `web/`        | student site, plain HTML/JS. Deployed to https://ersge-gustavo.github.io by the GitHub Action `.github/workflows/deploy-site.yml` on every push touching `web/`. Never edit the `ersge-gustavo.github.io` repo directly. |
| `backend/`    | Google Apps Script bound to the "guexqr" Google Sheet, managed with clasp (`Code.js`, `appsscript.json`). |
| `managerapp/` | Flutter app for the teacher (Android phone). |

Untracked files in the repo root (listed in `.gitignore`, never commit them):

- `guexqrkey` — `export GUEXQR_URL=…` and `export GUEXQR_KEY=…` (the manager key).
- `claspdeploy` — `./claspdeploy <description>` = clasp push + deploy to the
  existing web app deployment (same URL); `./claspdeploy runtests` runs smoke tests;
  `source ./claspdeploy` defines `gx '<json>'` (student call) and
  `gxk '<json>'` (manager call, key added) for testing with curl.

The backend URL is public (it is in `web/index.html`). The manager key is not:
it is the script property `MANAGER_KEY` and must stay out of the repo.

## Current state (Oct 2026)

- Backend: complete and tested — all actions in PROTOCOL.md.
- Web: complete and tested — `web/index.html` does request / polling / allow / move / refuse name / delete; page list cached and refreshed (stale-while-revalidate).
- Manager app: **next to build.** `managerapp/lib` still holds the old QR-scanner app (`mobile_scanner`); the QR flow and all the rest in this app is obsolete and can be removed.

## Manager app — specification

Gets the course with `config` at start, then sends it in every call. All manager calls include the key. Transport details (POST with `Content-Type: text/plain`, **follow the 302 redirect manually with a GET** — Dart's http client does not follow redirects for POST) are in PROTOCOL.md §2.

Backend URL and key go in an untracked config file (e.g. `lib/config.dart`, gitignored) with a committed `config.example.dart`.

### Queue screen

- Lists all requests of the course (`queue`), **oldest first**, each with: request number, student name, page (`#num code`), time in queue.
- Request number: show the **first 2 digits**; if two listed requests share them, show as many digits as needed to tell them apart (at most all 10).
- Show the state of each request (`pending`, or waiting for the browser: `allowing`, `movingBack`, `movingForward`, `refusingName`).
- Polls `queue` (about every 3 s) **only while this screen is open**.
- Times are computed from the response's `now` (server clock), not the phone's.

### Request detail screen (tap a request)

Title: `<student> - req#<number as shown in the list>`. Then the last 5 log rows of this student in this course (`history`), with the time between consecutive rows, the time since the last one, and the pending request. Example:

```
John Doe - req#82

page #7 ABC yyyy-mm-dd hh:mm:ss   <-- the log page and when it was logged (=when it was allowed)
10' 15"    <-- time between successive logs
page #8 DEF yyyy-mm-dd hh:mm:ss
3d 5h
page #9 GHI yyyy-mm-dd hh:mm:ss
2h 15'
page #10 JKL yyyy-mm-dd hh:mm:ss
50"
page #11 MNO yyyy-mm-dd hh:mm:ss
45' 15"                       <-- time since the last log
request pending for page #12 PQR
```

A page code no longer in the list shows `#n/a` instead of its number.

If the student has no log row in this course, display only the time since the request is pending and a list of students (maybe the name was incorrectly typed so I want to see the names already in the log)

```
First request for this user
1' 10"                        <- time in queue
request pending for page #1 AAA

Existing students:            <- history.students: unique, sorted
Audrey
Bob
Charlie S
```

Duration format, as in the examples: under a minute `50"`; under an hour `10' 15"`; under a day `2h 15'`; otherwise `3d 5h`.

### Buttons (same for new and known students) → `act`

| Button | `do` | Effect |
|--------|------|--------|
| Allow | `allow` | browser unlocks, stores the name cookie, acks; then the request disappears and a Log row is added |
| Refuse name | `refuseName` | browser deletes the name cookie, shows the name field again; request disappears after the ack |
| Delete | `delete` | request removed at once; the browser just re-enables its button. The **only** action that does not wait for the browser |
| Back one page | `back` | browser goes one page back; request stays, for the previous page |
| Forward one page | `forward` | same, one page forward |

While a request waits for the browser, only Delete is possible (the backend refuses the rest).

## Security level (deliberate)

Good enough for a classroom, not more: the student page is unauthenticated, the manager actions require the key, a page's URL is only sent once it is unlocked.
Known and accepted: on a shared computer, the name cookie of the last student allowed there unlocks that student's logged pages for whoever sits down.
