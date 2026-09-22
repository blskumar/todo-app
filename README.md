# Todo List - Full-Stack App (Express REST API + React)

A small but complete to-do list application: a REST API built with Node and
Express, and a React single-page frontend. Both halves have automated tests,
and the app can run as a single process in production.

**Repository:** https://github.com/blskumar/todo-app

---

## Features

- Create, list, update, and delete to-do items (full CRUD)
- Toggle items complete / incomplete, with a live "N remaining" counter
- Server-side input validation with clear JSON error messages
- Errors surfaced in the UI through an accessible alert region
- Empty and loading states
- 20 automated tests (13 API, 7 UI)
- Single-process production mode: Express serves both the API and the built UI
- Ready to deploy via `render.yaml` or the included `Dockerfile`

---

## Tech stack

### Backend
| Technology | Version | Purpose |
| ---------- | ------- | ------- |
| Node.js | 18+ (developed on 22) | JavaScript runtime |
| Express | 4.x | HTTP server and routing |
| cors | 2.x | Cross-origin headers for direct API clients |
| node:test | built in | Test runner (no extra dependency) |
| supertest | 7.x | HTTP assertions against the Express app |

### Frontend
| Technology | Version | Purpose |
| ---------- | ------- | ------- |
| React | 18.x | UI library (function components + hooks) |
| Vite | 6.x | Dev server with HMR, production bundler |
| Vitest | 2.x | Test runner, shares the Vite config |
| Testing Library | 16.x | Component tests driven by user behaviour |
| jsdom | 25.x | Simulated DOM for tests |

### Language and tooling notes
- Plain JavaScript with ES modules (`"type": "module"`) throughout, no TypeScript
  and no build step on the server.
- No state-management library. Component state plus `fetch` is enough at this size.
- No CSS framework. A single hand-written stylesheet keeps the dependency count low.

---

## Project structure

```
todo-app/
|-- package.json          Root scripts (build / start / test for both halves)
|-- Dockerfile            Multi-stage build, single runtime image
|-- render.yaml           Render.com deployment config
|-- server/
|   |-- package.json
|   |-- src/
|   |   |-- index.js      Entrypoint: binds host/port only
|   |   |-- app.js        Routes, validation, static file serving
|   |   `-- store.js      In-memory data store (swap this for a database)
|   `-- tests/
|       `-- todos.test.js API tests
`-- client/
    |-- package.json
    |-- vite.config.js    Dev proxy + Vitest config
    |-- index.html
    `-- src/
        |-- main.jsx      React entrypoint
        |-- App.jsx       Main component
        |-- api.js        fetch wrapper for the REST API
        |-- styles.css
        |-- setupTests.js
        `-- App.test.jsx  Component tests
```

### Design decisions

- **`app.js` is separate from `index.js`, and the store is injected.**
  `createApp({ store })` returns a configured Express app without binding a port,
  so tests exercise the real routes over real HTTP with a clean dataset per test.
- **The data store sits behind a five-method interface**
  (`list` / `get` / `create` / `update` / `remove`). Moving to a database means
  rewriting only `store.js`; routes and tests are unaffected.
- **Node's built-in test runner instead of Jest.** The project is ESM, and
  `node --test` runs it natively with zero configuration.
- **Frontend tests mock `api.js`, not `fetch`.** They assert on what the user
  sees, so they survive changes to the network plumbing.
- **No API host is hardcoded in the frontend.** In development Vite proxies
  `/api` to port 4000; in production Express serves the UI, so requests are
  always same-origin. This avoids CORS issues entirely.

---

## Getting started

### Prerequisites
- Node.js 18 or newer (`node -v`)
- npm (`npm -v`)

### Install

```bash
git clone https://github.com/blskumar/todo-app.git
cd todo-app
npm run install:all
```

### Run in development

Two terminals, because both processes stay in the foreground.

Terminal 1 - API on http://localhost:4000

```bash
cd server
npm run dev
```

Terminal 2 - UI on http://localhost:5173

```bash
cd client
npm run dev
```

Open **http://localhost:5173**. Use that port, not 4000; port 4000 serves JSON
only. Both commands watch for changes and reload automatically.

### Run in production mode (single process)

```bash
npm install
npm run build      # bundles React into client/dist
npm start          # serves API + UI on $PORT (default 4000)
```

Open **http://localhost:4000**. Express serves the built frontend and the API
from the same origin.

---

## Tests

```bash
npm test                      # everything (20 tests)
npm --prefix server test      # 13 API tests
npm --prefix client test      # 7 component tests
```

The servers do not need to be running.

**API tests** cover the happy path for every endpoint, validation failures
(missing, blank, and non-string titles; non-boolean `done`; empty patches),
and 404s for unknown ids.

**Component tests** cover loading and rendering, adding a todo, refusing to
submit a blank title, toggling completion, deleting, and displaying API errors.

---

## API reference

Base URL: `http://localhost:4000`

| Method | Path | Body | Success | Errors |
| ------ | ---- | ---- | ------- | ------ |
| GET | `/api/health` | - | `200 {"status":"ok"}` | - |
| GET | `/api/todos` | - | `200 [todo]` | - |
| POST | `/api/todos` | `{"title":"buy milk"}` | `201 todo` | `400` |
| GET | `/api/todos/:id` | - | `200 todo` | `404` |
| PATCH | `/api/todos/:id` | `{"title"?:string,"done"?:boolean}` | `200 todo` | `400`, `404` |
| DELETE | `/api/todos/:id` | - | `204` | `404` |

### Todo object

```json
{
  "id": "4ce7ef98-85c0-4baf-aa6a-1224bd3adcb4",
  "title": "buy milk",
  "done": false,
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

### Validation rules
- `title` must be a non-empty string of at most 200 characters; it is trimmed.
- `done` must be a boolean.
- A `PATCH` containing neither `title` nor `done` returns `400`.
- Errors always return `{"error": "message"}`.

### Examples

```bash
curl http://localhost:4000/api/todos

curl -X POST http://localhost:4000/api/todos \
  -H "Content-Type: application/json" \
  -d '{"title":"buy milk"}'

curl -X PATCH http://localhost:4000/api/todos/<id> \
  -H "Content-Type: application/json" \
  -d '{"done":true}'

curl -X DELETE http://localhost:4000/api/todos/<id>
```

---

## Deployment

The production build runs as one process on one port. The server reads `PORT`
from the environment and binds `0.0.0.0`, which suits most managed hosts.

- **Build command:** `npm install && npm run build`
- **Start command:** `npm start`

### Render
`render.yaml` is included. Create a new Web Service pointed at this repository
and Render picks up the configuration.

### Docker
```bash
docker build -t todo-app .
docker run -p 4000:4000 todo-app
```

Note: the Dockerfile has not yet been verified against a live Docker daemon.

---

## Known limitations

1. **Storage is in-memory.** All todos are lost when the server restarts, and
   running multiple instances would give each its own separate copy. This is the
   first thing to change for real use: reimplement `server/src/store.js` against
   a database, keeping the same five methods.
2. **No authentication.** Every visitor sees and edits the same shared list.
3. **No pagination.** The full list is returned on every request.
4. **Titles cannot be edited in the UI.** The API supports renaming via `PATCH`,
   but the frontend only exposes toggle and delete.

## Possible next steps

- Postgres or SQLite persistence
- Edit-in-place for titles
- Filter tabs (all / active / completed)
- User accounts and per-user lists
- GitHub Actions workflow to run both test suites on every push
