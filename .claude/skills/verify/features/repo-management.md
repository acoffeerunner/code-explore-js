# Manage a repository

From a repository's chat page header, a user can view repository info, re-index it, open its source, or delete it after confirmation. A failed repository shows its error and a way back to the dashboard.

## Sub-features

- `repo-info` opens the `Repository Info` modal: URL, Branch, Status, file and chunk counts, and timestamps.
- `repo-reindex` restarts indexing. The chat is replaced by progress until the repo is ready again.
- `repo-view-source` opens the repo URL in a new tab.
- `repo-delete-cancel` closes the confirm dialog and leaves the repo intact.
- `repo-delete` deletes the repo and returns to `/dashboard`. The sidebar no longer lists it.
- `repo-failed` shows `Indexing Failed`, the error message, and `Back to Dashboard`.

## How to get to it (user POV)

- The chat page header (`/repos/<id>/chat`): `View Source`, `Re-index`, the info icon button, and the delete icon button.
- A failed repo in the sidebar shows status `Failed`, and its page shows the failed panel.

## Driving it with verify.mjs

Preconditions:

- `await stubReset()`, `await login()`, then open `pallets/flask` from the sidebar and wait for `Start exploring`.

- **Info.** `getByRole("button", { name: "info" }).click()`. Result: `getByRole("heading", { name: "Repository Info" })` appears and the modal shows `Files Indexed` `120`, `Code Chunks` `950` and Branch `main`. `aria("repo-info")`. Close it with `page.keyboard.press("Escape")`, then reopen and close with `getByRole("button", { name: "close", exact: true })`. Either way the heading detaches.
- **Re-index.** `getByRole("button", { name: /Re-index/ }).click()`. Result: a heading matching `/Preparing|Cloning repository|Indexing codebase/` appears and the Re-index button is disabled. After about 8 s, `Start exploring` returns and the heading matches `/pallets\/flask.*Ready/`. The info modal now shows `Code Chunks` `300` (and `Files Indexed` `42`), which are the stub's post-index values. Side effect: the drive's `stub-requests.jsonl` has `POST /repos/repo-ready-1/reindex` with body `{"force":true}`.
- **View source.** `const [popup] = await Promise.all([context.waitForEvent("page"), getByRole("button", { name: /View Source/ }).click()])`. Result: `popup.url()` starts with `https://github.com/pallets/flask`. Close the popup without interacting with it.
- **Delete, cancel.** `getByRole("button", { name: "delete", exact: true }).click()`. Result: `getByRole("heading", { name: "Delete Repository" })` appears with `Are you sure you want to delete "pallets/flask"?`. `getByRole("button", { name: "Cancel" }).click()` closes it, and `stubState().repos` still has length 2.
- **Delete, confirm.** Reopen the dialog, then `getByRole("button", { name: "Delete", exact: true }).click()`. Result: the URL becomes `/dashboard`, the sidebar has no `pallets/flask` link, and `stubState().repos.map(r => r.id)` equals `["repo-failed-1"]`.
- **Failed repo.** `getByRole("link", { name: /example\/broken/ }).click()`. Result: the heading `Indexing Failed` and the text `Clone failed: repository not found` are visible. `getByRole("button", { name: "Back to Dashboard" })` returns to `/dashboard`.

## Gotchas

- The header icon buttons have no `aria-label`. Their accessible names are the Material Symbols ligature words `info` and `delete`. If the icon font is swapped, these names change. `exact: true` keeps `Delete` (the dialog's confirm) from matching `delete`, and vice versa.
- `Modal` has no `role="dialog"`, so `getByRole("dialog")` finds nothing. Target the modal's `h3` title with `getByRole("heading", ...)`. Clicking the backdrop also closes it.
- While the re-index request is in flight, `isLoading` replaces the button content with a spinner, so its name is briefly `progress_activity`. Assert the disabled state after the progress heading appears, using `/Re-index/`.
- `Re-index` is labelled only at `lg` widths and above (`hidden lg:inline`). At the default 1440 px viewport its name is `refresh Re-index`. Below `lg`, it's `refresh`.
- `View Source` is `hidden md:flex` and doesn't exist on mobile viewports.
- The stub's DELETE returns `200 {"deleted":true}`, because `api.request` always calls `response.json()`. If the real backend returns `204 No Content`, delete will throw client-side and the dialog stays open. Check this in real-backend mode.
- Delete redirects after a 150 ms timeout. Wait for the URL, not the dialog close.
