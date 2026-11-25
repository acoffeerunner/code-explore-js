# Chat with a repository

On a ready repository's chat page, a user asks questions in natural language and gets a streamed answer with source chips (file, line range). Answers can contain code blocks with a Copy button and numbered citations. The conversation persists across reloads, follow-ups carry recent history, and backend failures surface as an inline error.

## Sub-features

- `chat-empty` shows the `Start exploring` empty state for a repo with no history.
- `chat-send` sends with Enter or with the arrow submit button. Shift+Enter inserts a newline. The button is disabled while the input is empty or a reply is streaming.
- `chat-stream` streams the answer token by token, with a `Searching codebase...` indicator. The textarea is disabled while streaming.
- `chat-sources` shows an `expand_more N source(s)` toggle and chips whose text is like `1 app.py L10-42`; each chip's title is the full path. Only 3 chips show until `+N more` is clicked.
- `chat-code-block` renders fenced code with a language label and a `content_copy Copy` button, which reads `check Copied!` for 2 s.
- `chat-citations` renders `[text][N]` and `[N]` as superscript numbers, titled with the text or `Source N`.
- `chat-history` reloads previous turns, with their sources, from the backend when the page opens. If loading fails, the chat silently starts empty.
- `chat-followup` sends the last 10 messages before the new question as `history`.
- `chat-error` shows the error inline and removes the failed user/assistant pair from the thread.

## How to get to it (user POV)

- A sidebar repo link (any signed-in page) → `/repos/<id>/chat`.
- Directly after adding a repository, once indexing reaches ready.
- Direct URL `/repos/<id>/chat`.

## Driving it with verify.mjs

Preconditions:

- `await stubReset()`, `await login()`. The seed repo `pallets/flask` (`repo-ready-1`) is ready with empty history.
- Proven recipe that covers every step below: `node .claude/skills/verify/verify.mjs drive .claude/skills/verify/drives/chat.mjs --name chat`.

- **Open.** `getByRole("link", { name: /pallets\/flask/ }).click()`. Result: the URL is `**/repos/repo-ready-1/chat` and the heading `Start exploring` is visible. Bind `const box = page.getByPlaceholder("Ask a question about this repository...")`.
- **Send button and newline.** `const send = page.locator('form button[type="submit"]')` is disabled while empty. `box.fill("rich-answer please")`, `box.press("Shift+Enter")`, `box.pressSequentially("with code")`. Result: `box.inputValue()` is `"rich-answer please\nwith code"`. `send.click()`. Result: `box` becomes disabled right away.
- **Rich answer** (run it while the thread is short; see Gotchas). Wait for `Searching codebase...` to detach. Result:
  - `getByText("def create_app():")` is visible.
  - After `context.grantPermissions(["clipboard-read","clipboard-write"])`, clicking `getByRole("button", { name: "content_copy Copy" })` shows `getByRole("button", { name: "check Copied!" })`.
  - `getByTitle("app.py lines 10-42")` and `getByTitle("Source 2")` (the citations) are visible.
  - `getByRole("button", { name: /4 sources/ })` is visible. Clicking `getByRole("button", { name: "+1 more" })` reveals `getByTitle("src/flask/views.py")`.
- **Send.** `box.fill("Where is the app factory?")` and `box.press("Enter")`. Result: the user bubble appears, then `getByText(/Stub answer to "Where is the app factory\?"/)`.
- **Stream done.** `getByText("Searching codebase...").waitFor({ state: "detached" })`. Then `getByRole("button", { name: /expand_more 1 source/ })` and `getByTitle("src/flask/app.py")` are visible. Shoot now, not earlier.
- **History.** `page.reload()`. Result: the earlier Q&As render again, and `/4 sources/` is back, collapsed to 3 chips. They come from `GET /chat/history/repo-ready-1`.
- **Follow-up.** Ask `And the config?`. Result: the answer ends with `history: 4 messages`, and the drive's `stub-requests.jsonl` shows a `history` array of that length in the `/chat/stream` body.
- **Error.** Ask `please trigger-error`. Result: the inline error `Stub backend error: LLM unavailable` appears, and `getByText("please trigger-error")` has count 0.
- **Proof.** `(await stubState()).history["repo-ready-1"]` holds exactly the 6 messages of the three successful turns. The newline is kept in the first question. Screenshots cover the empty, rich, answered, reloaded and error states, with an `aria()` of the answered state.

## Gotchas

- **Known product bug:** the bottom spacer (`h-32`, 128 px) is shorter than the fixed ChatInput overlay (about 186 px at 1440×900). In a thread long enough to scroll, the last answer's lower edge, including its `+N more` button and source chips, stays under the overlay even at maximum scroll. Clicks land on the input toolbar. Drive `+N more` while the thread is short, and don't bypass it with `dispatchEvent` or `force`.
- The answer text itself contains `src/flask/app.py` as inline code. `getByText("src/flask/app.py")` matches mid-stream, so use `getByTitle(...)` on the chip, which only exists after the `done` event.
- The textarea is `disabled` while streaming. `fill` on it fails until the previous answer completes.
- The input and the chat stream only render when the repo status is `ready`. `pending`, `cloning`, `indexing` and `failed` repos show status panels instead.
- History loading is gated on auth. A spinner shows briefly after navigation, so wait for content, not for `networkidle`.
- The error path filters out the failed pair client-side. The stub stores nothing for errored turns, so a reload must not show them either.
- `useChat` exposes `clearMessages` (`DELETE /chat/history/:id`), but no UI calls it. There is no user-facing "clear chat".
