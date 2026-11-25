// Drive: ask questions about an indexed repo (streaming, sources, code blocks, citations, history, error path).
// Run: node .claude/skills/verify/verify.mjs drive .claude/skills/verify/drives/chat.mjs --name chat
import assert from "node:assert/strict";

export default async ({ page, step, shot, aria, login, stubReset, stubState }) => {
  await stubReset();
  step("sign in through /auth");
  await login();

  step("open seeded ready repo from the sidebar");
  await page.getByRole("link", { name: /pallets\/flask/ }).click();
  await page.waitForURL("**/repos/repo-ready-1/chat");
  await page.getByRole("heading", { name: "Start exploring" }).waitFor();
  await shot("chat-empty");

  const box = page.getByPlaceholder("Ask a question about this repository...");
  const send = page.locator('form button[type="submit"]');
  const streamDone = () => page.getByText("Searching codebase...").waitFor({ state: "detached" });

  // Runs first on purpose: in a long thread the last answer's "+N more" is covered by the
  // fixed ChatInput overlay (known product bug, see features/chat.md Gotchas).
  step("Shift+Enter newline; arrow button disabled when empty, sends when clicked");
  assert.equal(await send.isDisabled(), true);
  await box.fill("rich-answer please");
  await box.press("Shift+Enter");
  await box.pressSequentially("with code");
  assert.equal(await box.inputValue(), "rich-answer please\nwith code");
  await send.click();
  assert.equal(await box.isDisabled(), true); // disabled while streaming

  step("code block + Copy, citations, +N more sources");
  await streamDone();
  await page.getByText("def create_app():").waitFor();
  await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.getByRole("button", { name: "content_copy Copy" }).click();
  await page.getByRole("button", { name: "check Copied!" }).waitFor();
  await page.getByTitle("app.py lines 10-42").waitFor(); // [text][1] citation superscript
  await page.getByTitle("Source 2").waitFor(); // bare [2] citation
  await page.getByRole("button", { name: /4 sources/ }).waitFor();
  await page.getByRole("button", { name: "+1 more" }).click();
  await page.getByTitle("src/flask/views.py").waitFor();
  await shot("chat-rich-answer");

  step("send question with Enter");
  await box.fill("Where is the app factory?");
  await box.press("Enter");
  await page.getByText(/Stub answer to "Where is the app factory\?"/).waitFor();
  // Stream finished = thinking indicator gone + source chip rendered (only sent in the final "done" event).
  await streamDone();
  await page.getByRole("button", { name: /expand_more 1 source/ }).waitFor();
  await page.getByTitle("src/flask/app.py").last().waitFor();
  await shot("chat-answer-with-source");
  await aria("chat-answer");

  step("reload: history comes back from the backend");
  await page.reload();
  await page.getByText(/Stub answer to "Where is the app factory\?"/).waitFor();
  await page.getByRole("button", { name: /4 sources/ }).waitFor(); // sources persist with history (collapsed to 3 again)
  await shot("chat-history-after-reload");

  step("follow-up sends prior turns as history");
  await box.fill("And the config?");
  await box.press("Enter");
  await page.getByText(/Stub answer to "And the config\?".*history: 4 messages/).waitFor();
  await streamDone();

  step("backend error surfaces and the failed turn is removed");
  await box.fill("please trigger-error");
  await box.press("Enter");
  await page.getByText("Stub backend error: LLM unavailable").waitFor();
  assert.equal(await page.getByText("please trigger-error").count(), 0);
  await shot("chat-error");

  step("side effect: backend stored exactly the three successful turns");
  const hist = (await stubState()).history["repo-ready-1"];
  assert.deepEqual(hist.map((m) => `${m.role}:${m.content.slice(0, 30)}`), [
    "user:rich-answer please\nwith code",
    'assistant:Stub answer to "rich-answer pl',
    "user:Where is the app factory?",
    'assistant:Stub answer to "Where is the a',
    "user:And the config?",
    'assistant:Stub answer to "And the config',
  ]);
};
