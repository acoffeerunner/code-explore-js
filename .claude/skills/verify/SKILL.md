---
name: verify
description: Launch and drive the CodeExplore UI (Next.js 14 web app at http://localhost:3100) in a real headless Chrome against a local Supabase-auth + backend-API stub, and capture screenshots, ARIA snapshots, and backend side effects as proof. Use to verify any user-facing change (auth, dashboard, add repository / branch selection, repo chat, info / re-index / delete) before claiming it works.
---

# Verify the CodeExplore UI

The surface is a browser UI. The app depends on two external systems, and both are reached only through env vars:

- **Supabase Auth** via `NEXT_PUBLIC_SUPABASE_URL`
- **The CodeExplore backend API**, which is not in this repo, via `NEXT_PUBLIC_API_URL`

By default, verification points both at `stub-server.mjs`, a dependency-free local server on `:8100`. It speaks the GoTrue routes the app uses (`/auth/v1/token`, `/signup`, `/user`, `/logout`) and the backend routes in `src/lib/api.ts`. It also records every request so side effects can be checked. Browser automation uses `playwright-core` with the installed Chrome (or Edge). That dependency lives in this skill's own `package.json`, never in the app's.

Every command below runs from the repo root:

```
node .claude/skills/verify/verify.mjs <launch|doctor|drive|state|reset|stop>
```

## Launch

```
node .claude/skills/verify/verify.mjs launch
```

- Installs app deps if they are missing, plus `playwright-core` into `.claude/skills/verify/node_modules` (no browser download).
- Starts the stub on `127.0.0.1:8100` and `next dev -p 3100 -H localhost`, both detached. Their PIDs and env go in `.verify/run/pids.json`, and their logs in `.verify/run/{next,stub}.log`.
- **Ready** when it prints `ready: http://localhost:3100` after `doctor: OK`. A cold start takes about 10 s. Each route still compiles on first visit (3–7 s), and the driver allows 90 s navigation timeouts for that.
- If a run's instance is already healthy, `launch` reuses it. If port 3100 or 8100 answers but isn't ours, it **refuses**. Pick other ports with `VERIFY_APP_PORT` / `VERIFY_STUB_PORT`, or ask the user. Never drive their instance.
- **Isolation limit:** `next dev` writes `./.next`. Two dev servers in one checkout (yours plus the user's `npm run dev`) clobber each other's build output. If the user's dev server is running in this checkout, stop and ask; don't start a second one.
- **Real-backend mode** (optional): export `VERIFY_SUPABASE_URL`, `VERIFY_SUPABASE_ANON_KEY` and `VERIFY_API_URL` before `launch`. The stub is then skipped, and `login()` needs real credentials. Process env beats `.env*` files in Next, so the user's `.env.local` never leaks into a stub run.

## Doctor

```
node .claude/skills/verify/verify.mjs doctor
```

Read-only. Run it first whenever anything looks off. It checks that:

- the PID file exists and both processes are alive
- `GET /` returns 200 with the `CodeExplore - AI Code Understanding` title
- the stub answers `/__state` and `/health`
- the running instance's baked env matches the env this shell would use

Exit code 0 means the instance is worth driving.

## Drive

Write a drive script, an ES module whose default export receives a context. Then run it:

```
node .claude/skills/verify/verify.mjs drive path/to/script.mjs --name <feature-id>
```

Context fields:

| field | what it is |
|---|---|
| `page`, `context`, `browser` | Playwright objects; `page` has `baseURL` = `http://localhost:3100`, so use `page.goto("/auth")`. |
| `login(email?, password?)` | Signs in **through the real `/auth` form** and waits for the dashboard heading. The stub accepts any email; password `wrong-password` is rejected. |
| `step(label)` | Logs a step to `steps.log`. |
| `shot(label)` | Full-page screenshot. |
| `aria(label)` | ARIA snapshot (YAML) of `<body>`. |
| `stubState()` | Stub state: `repos`, `history`, `users`. |
| `stubReset()` | Resets the stub to the seed. Call it first in every drive. |

Rules:

- Use `node:assert/strict` for assertions. A thrown error fails the drive, saves `FAILURE.png`, and exits 1.
- Set `VERIFY_HEADED=1` to watch the browser.
- A ready-made recipe exists at `drives/chat.mjs`. Copy its shape.
- Recipes for every feature are in `features/`. Start at `features/README.md`.

Stable handles in this app (confirmed from ARIA snapshots):

- **Icon names are part of accessible names.** Icons are Material Symbols ligatures, so a button's name includes its icon word: `"refresh Re-index"`, `"code View Source"`, `"add New Repository"`. The icon-only header buttons are named `"info"` and `"delete"`. Match with regexes (`{ name: /Re-index/ }`) or the exact icon word.
- **Inputs:**
  - Auth form: `getByLabel("Email")`, `getByLabel("Password")`.
  - Everything else is found by placeholder: `https://github.com/username/repository` (dashboard), `Find a branch...`, `Ask a question about this repository...`, `Filter repositories...`.
- **Sidebar repo links** are named `"<icon> <owner/repo> <status>"`. Match with `{ name: /pallets\/flask/ }`.

Stub seed state, restored by `reset`:

| id | repo | status |
|---|---|---|
| `repo-ready-1` | `pallets/flask` | `ready` |
| `repo-failed-1` | `example/broken` | `failed` |

Stub behaviors that drives can trigger:

- `POST /git/branches` with a URL containing `private` or `notfound` returns a branch-lookup error.
- Other URLs return the branches `main` (default), `develop` and `feature/search`.
- A new or re-indexed repo goes `pending` (`Preparing...`) → `cloning` → `indexing 33%` → `indexing 66%` → `ready`. Each `GET /repos/:id` returns the current step and then advances. The UI polls every 2 s, so a repo reaches ready about 8 s after its chat page loads.
- A chat question containing `trigger-error` streams an SSE `error` event.
- Answers are `Stub answer to "<question>" … (history: N messages)` with one source, `src/flask/app.py` L10-42.
- A question containing `rich-answer` also streams `[text][1]` and `[2]` citations and a fenced `python` code block, and returns 4 sources, which exercises `+1 more`.

## Evidence

Each drive writes `.verify/artifacts/<name>-<timestamp>/`:

| file | contents |
|---|---|
| `NN-*.png` | screenshots |
| `NN-*.aria.yml` | ARIA snapshots |
| `steps.log` | timestamped steps, with the URL for each shot |
| `console.log` | browser console and page errors |
| `stub-requests.jsonl` | every backend/auth request made **during this drive**: method, path, body |
| `result.json` | ok or error, script path, env |

Proof standards:

- **Drive the real user path.** Click, type and press Enter through the UI. Never call the stub's API directly to cause the behavior under test. `stubState()` / `stubReset()` are for setup and for reading side effects only.
- **Capture the action and the resulting state.** One final screenshot isn't enough. Wait for the true end state before shooting:
  - streaming done = `Searching codebase...` detached plus the `N source(s)` button visible
  - repo ready = `Ready` badge in the heading
- **Verify side effects as well as pixels.** Check what the backend received or stored: `stubState()` assertions and `stub-requests.jsonl`.
- **Know what stub mode proves.** It proves the UI's behavior against the backend contract in `src/lib/api.ts`. It does not prove the real backend's behavior. When a change touches that contract (request or response shapes, SSE format), say so and offer a real-backend-mode run.

## Cleanup

```
node .claude/skills/verify/verify.mjs stop
```

- Kills only the process trees whose PIDs this run recorded (`taskkill /T /F` on Windows), then deletes `.verify/run/`.
- It never kills by process name, and never touches `.verify/artifacts/`. Evidence survives cleanup; delete old artifact dirs by hand when they're no longer needed. `.verify/` is gitignored.
- Run `stop` after every failed iteration too, so broken attempts don't strand ports 3100/8100.

## Helpers

| file | purpose / invocation |
|---|---|
| `verify.mjs` | the CLI above |
| `stub-server.mjs` | started by `launch`. To run it by hand: `VERIFY_RUN_DIR=. node .claude/skills/verify/stub-server.mjs 8100` |
| `drives/chat.mjs` | proven recipe: `node .claude/skills/verify/verify.mjs drive .claude/skills/verify/drives/chat.mjs --name chat` |
| `features/` | the feature map; one recipe per user-facing feature |
