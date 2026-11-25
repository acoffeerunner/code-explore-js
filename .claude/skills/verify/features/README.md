# CodeExplore UI verification map

This directory is the maintained source for verifying the user-facing behavior of the CodeExplore UI. Read this index before driving the app, then use the matching feature file as the recipe.

## Baseline preconditions

- `node .claude/skills/verify/verify.mjs launch` has printed `ready: http://localhost:3100`. The app runs against the stub on `http://127.0.0.1:8100` unless real-backend mode is set (see `../SKILL.md`).
- `node .claude/skills/verify/verify.mjs doctor` exits 0.
- Every drive script starts with `await stubReset()`. Seed: `pallets/flask` (`repo-ready-1`, ready) and `example/broken` (`repo-failed-1`, failed).
- Never drive an instance this run did not launch.

## Driving conventions

- "Run" lines are Playwright calls inside a drive script executed by `verify.mjs drive <script> --name <feature-id>`. `page` has `baseURL` set, so use paths like `page.goto("/auth")`.
- Prefer `getByRole` with accessible names, `getByLabel`, and `getByPlaceholder`. Material Symbols icon words are part of accessible names (`"refresh Re-index"`, `"info"`, `"delete"`), so match with a regex or include the icon word.
- Use `login()` for every authenticated recipe. It signs in through the real `/auth` form.
- Wait for end states, not fixed sleeps. The UI polls repo status every 2 s, and chat streams token by token.

## Proof and skip reporting

- Capture the user action and the resulting state with `shot()`, plus `aria()` for any state you assert on.
- Mutation proof includes a second view: `stubState()` or the drive's `stub-requests.jsonl`, or a reload that shows persisted data.
- Record the feature ID with `--name` and the entry point used in `step()` labels.
- Report an unreachable path (OAuth, real backend) with the attempted action and the unmet precondition.
- Do not report a skipped entry point as verified through a different path.

## Feature entry contract

Each feature file starts with an H1 title and one paragraph describing the user-visible behavior. It then uses exactly four H2 sections, in this order:

1. `Sub-features` lists short IDs, one line per behavior.
2. `How to get to it (user POV)` lists every user entry point.
3. `Driving it with verify.mjs` starts with `Preconditions:` and uses labeled bullets that pair each user action with the exact Playwright calls and the observable result.
4. `Gotchas` lists traps that can waste or invalidate a verification run.

## Features

| feature | covers | status |
|---|---|---|
| [Authentication](./auth.md) | Email sign-in and sign-up, bad credentials, guarded routes, and sign-out. | Live-verified 2026-11-25 (OAuth unreachable in stub mode) |
| [Add a repository](./add-repository.md) | The dashboard URL input and suggestion chips, branch selection, the branch-lookup error, and indexing progress through to ready. | Live-verified 2026-11-25 |
| [Chat with a repository](./chat.md) | Streaming answers, source chips, code blocks, citations, persisted history, follow-up history, and the error path. | Live-verified 2026-11-25; proven recipe: `../drives/chat.mjs` |
| [Manage a repository](./repo-management.md) | The info panel, re-index, delete confirm and cancel, and the failed-repo state. | Live-verified 2026-11-25 (delete against the real backend unproven) |
| [Landing page and navigation](./landing.md) | Landing CTAs, the footer, the mobile menu, and the sidebar. | Live-verified 2026-11-25 |
