# Todo List — Express API + React Frontend

A small full-stack to-do app: a REST API built with Node/Express and a React
(Vite) frontend, both with tests.

```
todo-app/
├── server/            Express REST API
│   ├── src/
│   │   ├── app.js     Route definitions + validation (exported for tests)
│   │   ├── index.js   HTTP server entrypoint
│   │   └── store.js   In-memory data store
│   └── tests/         API tests (node:test + supertest)
└── client/            React frontend
    └── src/
        ├── App.jsx        UI component
        ├── api.js         fetch wrapper for the REST API
        └── App.test.jsx   Component tests (Vitest + Testing Library)
```

## Getting started

Two terminals, from the project root:

```bash
# Terminal 1 — API on http://localhost:4000
cd server && npm install && npm run dev

# Terminal 2 — UI on http://localhost:5173
cd client && npm install && npm run dev
```

Vite proxies `/api/*` to the API server, so there are no CORS issues or
hardcoded hosts in the frontend. Open http://localhost:5173.

## Tests

```bash
cd server && npm test   # 13 API tests
cd client && npm test   # 7 component tests
```

## API

Base URL: `http://localhost:4000`

| Method | Path             | Body                            | Response                  |
| ------ | ---------------- | ------------------------------- | ------------------------- |
| GET    | `/api/health`    | —                               | `200 {"status":"ok"}`     |
| GET    | `/api/todos`     | —                               | `200 [todo]`              |
| POST   | `/api/todos`     | `{"title":"buy milk"}`          | `201 todo`                |
| GET    | `/api/todos/:id` | —                               | `200 todo` / `404`        |
| PATCH  | `/api/todos/:id` | `{"title"?:string,"done"?:bool}`| `200 todo` / `404`        |
| DELETE | `/api/todos/:id` | —                               | `204` / `404`             |

Todo shape:

```json
{
  "id": "4ce7ef98-85c0-4baf-aa6a-1224bd3adcb4",
  "title": "buy milk",
  "done": false,
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

Errors return `{"error": "message"}`. Validation rules: `title` must be a
non-empty string of at most 200 characters (it is trimmed); `done` must be a
boolean; a `PATCH` with neither field returns `400`.

## Notes & assumptions

- **Storage is in-memory**, so data resets when the server restarts. `store.js`
  is isolated behind a small interface, so swapping in a database means
  rewriting only that module.
- `createApp()` accepts an injected store, letting tests run against the real
  routes with a clean dataset per test and without binding a port.
- No authentication or multi-user support — out of scope for a simple app.
- Frontend state updates optimistically from API responses and surfaces any
  error in an alert region rather than failing silently.
