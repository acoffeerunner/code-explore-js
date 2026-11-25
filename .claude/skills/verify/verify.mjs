#!/usr/bin/env node
// CodeExplore UI verification driver. Run from anywhere:
//   node .claude/skills/verify/verify.mjs <launch|doctor|drive|state|reset|stop> [...]
import { spawn, execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";

const SKILL_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(SKILL_DIR, "../../..");
const RUN_DIR = path.join(REPO, ".verify", "run"); // scratch: removed by `stop`
const ART_DIR = path.join(REPO, ".verify", "artifacts"); // evidence: never removed by this script
const PIDS = path.join(RUN_DIR, "pids.json");
const APP_PORT = Number(process.env.VERIFY_APP_PORT || 3100);
const STUB_PORT = Number(process.env.VERIFY_STUB_PORT || 8100);
const APP = `http://localhost:${APP_PORT}`;
const STUB = `http://127.0.0.1:${STUB_PORT}`;
// Real-backend mode: set VERIFY_SUPABASE_URL/VERIFY_SUPABASE_ANON_KEY/VERIFY_API_URL to skip the stub.
const REAL = !!process.env.VERIFY_API_URL;
const ENV = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.VERIFY_SUPABASE_URL || STUB,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.VERIFY_SUPABASE_ANON_KEY || "stub-anon-key",
  NEXT_PUBLIC_API_URL: process.env.VERIFY_API_URL || STUB,
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const readPids = () => (fs.existsSync(PIDS) ? JSON.parse(fs.readFileSync(PIDS, "utf8")) : null);
const alive = (pid) => { try { process.kill(pid, 0); return true; } catch { return false; } };
async function get(url, opts) {
  try { const r = await fetch(url, { redirect: "manual", ...opts }); return { status: r.status, headers: r.headers, text: await r.text() }; }
  catch (e) { return { status: 0, error: e.cause?.code || e.message }; }
}
function killTree(pid) {
  if (!alive(pid)) return;
  if (process.platform === "win32") execSync(`taskkill /PID ${pid} /T /F`, { stdio: "ignore" });
  else { try { process.kill(-pid, "SIGTERM"); } catch { process.kill(pid, "SIGTERM"); } }
}
function startDetached(name, cmd, args, env) {
  const out = fs.openSync(path.join(RUN_DIR, `${name}.log`), "a");
  const p = spawn(cmd, args, { cwd: REPO, env: { ...process.env, ...env }, detached: true, stdio: ["ignore", out, out], windowsHide: true });
  p.unref();
  return p.pid;
}

async function doctor({ quiet = false } = {}) {
  const pids = readPids();
  const checks = [];
  const add = (ok, what, detail = "") => checks.push({ ok, what, detail });
  add(!!pids, "pid file", pids ? PIDS : "missing: this run did not launch an instance (run `launch`)");
  if (pids) {
    add(alive(pids.next), "next dev process", `pid ${pids.next}`);
    if (pids.stub) add(alive(pids.stub), "stub process", `pid ${pids.stub}`);
  }
  const home = await get(`${APP}/`);
  add(home.status === 200 && home.text.includes("CodeExplore - AI Code Understanding"), `app answers ${APP}/`, `status ${home.status} ${home.error || ""}`);
  if (!REAL) {
    const st = await get(`${STUB}/__state`);
    add(st.status === 200, `stub answers ${STUB}`, `status ${st.status} ${st.error || ""}`);
    const health = await get(`${STUB}/health`);
    add(health.status === 200, "stub /health", `status ${health.status}`);
  }
  add(!!pids && pids.appPort === APP_PORT && JSON.stringify(pids.env) === JSON.stringify(ENV), "instance env matches this shell", pids ? JSON.stringify(pids.env) : "");
  const ok = checks.every((c) => c.ok);
  if (!quiet) { for (const c of checks) console.log(`${c.ok ? "PASS" : "FAIL"}  ${c.what}  ${c.detail}`); console.log(ok ? "doctor: OK" : "doctor: NOT OK"); }
  return ok;
}

async function launch() {
  const pids = readPids();
  if (pids && alive(pids.next)) {
    if (await doctor({ quiet: true })) { console.log(`already running: ${APP} (stub ${REAL ? "disabled" : STUB})`); return; }
    console.error("a previous verify instance exists but doctor fails; run `stop` first"); process.exit(1);
  }
  for (const [name, url] of [["app", `${APP}/`], ...(REAL ? [] : [["stub", `${STUB}/health`]])]) {
    const r = await get(url);
    if (r.status !== 0) { console.error(`port for ${name} (${url}) is already answering and not ours. Refusing to double-drive; pick VERIFY_APP_PORT/VERIFY_STUB_PORT or stop that process.`); process.exit(1); }
  }
  if (!fs.existsSync(path.join(REPO, "node_modules", "next"))) execSync("npm install", { cwd: REPO, stdio: "inherit" });
  if (!fs.existsSync(path.join(SKILL_DIR, "node_modules", "playwright-core"))) execSync("npm install --no-audit --no-fund", { cwd: SKILL_DIR, stdio: "inherit" });
  fs.mkdirSync(RUN_DIR, { recursive: true });
  const rec = { appPort: APP_PORT, stubPort: STUB_PORT, env: ENV, startedAt: new Date().toISOString() };
  if (!REAL) rec.stub = startDetached("stub", process.execPath, [path.join(SKILL_DIR, "stub-server.mjs"), String(STUB_PORT)], { VERIFY_RUN_DIR: RUN_DIR });
  rec.next = startDetached("next", process.execPath, [path.join(REPO, "node_modules", "next", "dist", "bin", "next"), "dev", "-p", String(APP_PORT), "-H", "localhost"], ENV);
  fs.writeFileSync(PIDS, JSON.stringify(rec, null, 2));
  const deadline = Date.now() + 180_000;
  while (Date.now() < deadline) {
    if (!alive(rec.next)) { console.error(`next dev exited; see ${path.join(RUN_DIR, "next.log")}`); process.exit(1); }
    if ((await get(`${APP}/`)).status === 200) break;
    await sleep(1000);
  }
  if (!(await doctor())) process.exit(1);
  console.log(`ready: ${APP}  stub: ${REAL ? "disabled (real backend)" : STUB}  logs: ${RUN_DIR}`);
}

async function stop() {
  const pids = readPids();
  if (!pids) { console.log("nothing to stop (no pid file)"); return; }
  for (const k of ["next", "stub"]) if (pids[k]) { killTree(pids[k]); console.log(`stopped ${k} pid ${pids[k]}`); }
  fs.rmSync(RUN_DIR, { recursive: true, force: true });
  console.log(`removed ${RUN_DIR}; evidence kept in ${ART_DIR}`);
}

async function drive(scriptPath, name) {
  if (!scriptPath) { console.error("usage: verify.mjs drive <script.mjs> [--name <feature>]"); process.exit(2); }
  if (!(await doctor({ quiet: true }))) { console.error("doctor fails; run `doctor` to see why"); process.exit(1); }
  const require = createRequire(path.join(SKILL_DIR, "package.json"));
  const { chromium } = require("playwright-core");
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const out = path.join(ART_DIR, `${name || path.basename(scriptPath, ".mjs")}-${stamp}`);
  fs.mkdirSync(out, { recursive: true });
  const stepsLog = path.join(out, "steps.log"), consoleLog = path.join(out, "console.log");
  const logLine = (f, s) => fs.appendFileSync(f, `${new Date().toISOString()} ${s}\n`);
  const reqLog = path.join(RUN_DIR, "stub-requests.jsonl");
  const reqOffset = fs.existsSync(reqLog) ? fs.statSync(reqLog).size : 0;

  let browser;
  for (const channel of ["chrome", "msedge", undefined]) {
    try { browser = await chromium.launch({ channel, headless: !process.env.VERIFY_HEADED }); break; } catch (e) { if (!channel) throw e; }
  }
  const context = await browser.newContext({ baseURL: APP, viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  page.setDefaultTimeout(30_000);
  page.setDefaultNavigationTimeout(90_000); // first compile of a route in next dev is slow
  page.on("console", (m) => logLine(consoleLog, `[${m.type()}] ${m.text()}`));
  page.on("pageerror", (e) => logLine(consoleLog, `[pageerror] ${e.message}`));

  let n = 0;
  const label = (s) => `${String(++n).padStart(2, "0")}-${s.replace(/[^a-z0-9-]+/gi, "-")}`;
  const ctx = {
    page, context, browser, APP, STUB, out,
    step: (s) => { logLine(stepsLog, `STEP ${s}`); console.log(`step: ${s}`); },
    shot: async (s) => { const f = path.join(out, `${label(s)}.png`); await page.screenshot({ path: f, fullPage: true }); logLine(stepsLog, `SHOT ${path.basename(f)} url=${page.url()}`); return f; },
    aria: async (s) => { const f = path.join(out, `${label(s)}.aria.yml`); fs.writeFileSync(f, await page.locator("body").ariaSnapshot()); logLine(stepsLog, `ARIA ${path.basename(f)} url=${page.url()}`); return f; },
    stubState: async () => (await (await fetch(`${STUB}/__state`)).json()),
    stubReset: async () => { await fetch(`${STUB}/__reset`, { method: "POST" }); },
    // Signs in through the real /auth form (stub accepts any email; password "wrong-password" is rejected).
    login: async (email = "verify@example.com", password = "verify-pass-123") => {
      await page.goto("/auth");
      await page.getByLabel("Email").fill(email);
      await page.getByLabel("Password").fill(password);
      await page.getByRole("button", { name: "Sign In" }).click();
      await page.waitForURL("**/dashboard");
      await page.getByRole("heading", { name: /What code are we/ }).waitFor();
      logLine(stepsLog, `LOGIN ${email}`);
    },
  };
  let result = { ok: true };
  try {
    const mod = await import(pathToFileURL(path.resolve(scriptPath)).href);
    await mod.default(ctx);
  } catch (e) {
    result = { ok: false, error: String(e?.stack || e) };
    await page.screenshot({ path: path.join(out, "FAILURE.png"), fullPage: true }).catch(() => {});
  } finally {
    await browser.close();
    if (fs.existsSync(reqLog)) {
      const fd = fs.openSync(reqLog, "r"); const size = fs.fstatSync(fd).size;
      const buf = Buffer.alloc(size - reqOffset); fs.readSync(fd, buf, 0, buf.length, reqOffset); fs.closeSync(fd);
      fs.writeFileSync(path.join(out, "stub-requests.jsonl"), buf);
    }
    fs.writeFileSync(path.join(out, "result.json"), JSON.stringify({ ...result, script: path.resolve(scriptPath), app: APP, env: ENV }, null, 2));
  }
  console.log(`${result.ok ? "DRIVE OK" : "DRIVE FAILED"}  evidence: ${out}`);
  if (!result.ok) { console.error(result.error); process.exit(1); }
}

const [cmd, ...rest] = process.argv.slice(2);
const flag = (f) => { const i = rest.indexOf(f); return i >= 0 ? rest[i + 1] : undefined; };
const cmds = {
  launch, stop,
  doctor: async () => process.exit((await doctor()) ? 0 : 1),
  drive: () => drive(rest.find((a, i) => !a.startsWith("--") && rest[i - 1] !== "--name"), flag("--name")),
  state: async () => console.log(JSON.stringify(await (await fetch(`${STUB}/__state`)).json(), null, 2)),
  reset: async () => { await fetch(`${STUB}/__reset`, { method: "POST" }); console.log("stub state reset to seed"); },
};
if (!cmds[cmd]) { console.error("usage: verify.mjs <launch|doctor|drive <script.mjs> [--name x]|state|reset|stop>"); process.exit(2); }
await cmds[cmd]();
