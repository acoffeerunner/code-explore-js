# Add a repository

A signed-in user enters a Git URL on the dashboard (or picks a suggestion chip), chooses a branch on `/repos/new/branches`, and confirms. The repository is created and indexing starts. The user lands on the repo's chat page, which shows cloning/indexing progress until the repo is ready.

## Sub-features

- `add-url-input` submits a typed URL with `Analyze` or Enter.
- `add-suggestion` submits one of the chips: `facebook/react`, `torvalds/linux`, `pallets/flask`.
- `add-branch-select` lists branches with the default preselected and marked `Default`, and offers a filter box.
- `add-branch-error` shows the error message for an inaccessible repo URL.
- `add-cancel` returns to `/dashboard` from branch selection without creating anything.
- `add-confirm` creates the repo and redirects to `/repos/<id>/chat`.
- `add-progress` shows these headings in order:
  - `Preparing...`
  - `Cloning repository...`
  - `Indexing codebase...`, with the percentage in the paragraph `Processing files and building search index (N%)` and in the header badge `Indexing N%`
  - the ready chat empty state

## How to get to it (user POV)

- `/dashboard` (after login): the URL input, or a suggestion chip.
- Sidebar `New Repository` (links to `/dashboard`) from any signed-in page.
- Direct URL: `/repos/new/branches?url=<encoded git url>`.

## Driving it with verify.mjs

Preconditions:

- `await stubReset()`, then `await login()`.

- **Typed URL.** `getByPlaceholder("https://github.com/username/repository").fill("https://github.com/acme/widgets")`, then `getByRole("button", { name: /Analyze/ }).click()`. Result: the URL matches `**/repos/new/branches?url=https%3A%2F%2Fgithub.com%2Facme%2Fwidgets`.
- **Branch list.** Wait for `getByText("feature/search")`. Rows show `main` with a `Default` badge, plus `develop` and `feature/search`, and the `main` radio is checked (`getByRole("radio").first()` is checked).
- **Filter.** `getByPlaceholder("Find a branch...").fill("dev")`. Result: only `develop` remains. `fill("zzz")` shows `No branches found matching "zzz"`.
- **Pick and confirm.** Clear the filter, `getByText("develop", { exact: true }).click()`, then `getByRole("button", { name: /Confirm/ }).click()`. Result: the URL becomes `/repos/repo-1/chat`. Side effect: `stub-requests.jsonl` has `POST /repos` with body `{"url":"https://github.com/acme/widgets","branch":"develop"}`.
- **Progress.** Wait for these headings in order: `getByRole("heading", { name: "Preparing..." })`, then `"Cloning repository..."`, then `/Indexing codebase/` (2 s apart). After about 8 s, `getByRole("heading", { name: "Start exploring" })` appears and the header heading matches `/acme\/widgets.*Ready/`. Use a 15 s timeout for the waits. `shot()` at least one in-progress state and the ready state.
- **Sidebar.** After ready, the sidebar has `getByRole("link", { name: /acme\/widgets/ })`.
- **Suggestion chip.** From `/dashboard`, `getByRole("button", { name: /pallets\/flask/ }).click()`. Result: the branch page for `https://github.com/pallets/flask`.
- **Branch error.** Submit `https://github.com/acme/private-thing`. Result: the branch page shows `Repository not found or not accessible` and a `Go back to dashboard` button, and no `POST /repos` appears in the drive's `stub-requests.jsonl`.
- **Cancel.** On the branch page, `getByRole("button", { name: "Cancel" }).click()`. Result: `/dashboard`, and `stubState().repos` keeps its length (2 if you run this before Confirm).

## Gotchas

- The dashboard input has `autoFocus`. Use `fill` rather than relying on focus order.
- Adding `pallets/flask` from a chip creates a second repo with the same URL. The stub doesn't dedupe, and the real backend may.
- Stub progress advances only when the UI polls `GET /repos/:id`, so a backgrounded or closed page freezes indexing. Keep the chat page open while waiting.
- The branch page reads `?url=`. Without it, the page immediately redirects to `/dashboard`.
- Confirm is disabled until a branch is selected. With the stub, the default is preselected, so it is enabled at once.
