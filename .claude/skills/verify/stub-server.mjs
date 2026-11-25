#!/usr/bin/env node
// Verification stub for the two external systems the UI talks to:
//   /auth/v1/*  -> Supabase GoTrue (NEXT_PUBLIC_SUPABASE_URL)
//   everything else -> CodeExplore backend API (NEXT_PUBLIC_API_URL)
// In-memory state; every request is appended to $VERIFY_RUN_DIR/stub-requests.jsonl.
// Usage: node stub-server.mjs [port]   (default 8100)
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const PORT = Number(process.argv[2] || process.env.STUB_PORT || 8100);
const RUN_DIR = process.env.VERIFY_RUN_DIR || ".";
const LOG = path.join(RUN_DIR, "stub-requests.jsonl");

const now = () => new Date().toISOString();
const b64url = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");

function seed() {
  const t = "2026-01-01T00:00:00.000Z";
  return {
    users: {}, // email -> user
    repos: [
      { id: "repo-ready-1", url: "https://github.com/pallets/flask", branch: "main", status: "ready", progress_pct: 100,
        branches_available: ["main"], error_message: null, file_count: 120, chunk_count: 950, webhook_url: null,
        created_at: t, updated_at: t, indexed_at: t, _ticks: 0 },
      { id: "repo-failed-1", url: "https://github.com/example/broken", branch: "main", status: "failed", progress_pct: 0,
        branches_available: ["main"], error_message: "Clone failed: repository not found", file_count: null, chunk_count: null,
        webhook_url: null, created_at: t, updated_at: t, indexed_at: null, _ticks: 0 },
    ],
    history: {}, // repoId -> messages
    seq: 0,
  };
}
let state = seed();

const publicRepo = ({ _ticks, ...r }) => r;
const PROGRESSION = ["pending", "cloning", "indexing", "indexing", "ready"];

function makeUser(email) {
  return state.users[email] ||= {
    id: crypto.randomUUID(), aud: "authenticated", role: "authenticated", email,
    app_metadata: { provider: "email", providers: ["email"] }, user_metadata: {},
    created_at: now(), updated_at: now(),
  };
}
function session(user) {
  const iat = Math.floor(Date.now() / 1000), exp = iat + 3600;
  const access_token = `${b64url({ alg: "HS256", typ: "JWT" })}.${b64url({ sub: user.id, email: user.email, role: "authenticated", aud: "authenticated", iat, exp, session_id: crypto.randomUUID() })}.stub`;
  return { access_token, token_type: "bearer", expires_in: 3600, expires_at: exp, refresh_token: `rt-${user.email}`, user };
}
function userFromBearer(req) {
  const m = /^Bearer (.+)$/.exec(req.headers.authorization || "");
  if (!m) return null;
  try {
    const p = JSON.parse(Buffer.from(m[1].split(".")[1], "base64url").toString());
    return p.exp * 1000 > Date.now() ? makeUser(p.email) : null;
  } catch { return null; }
}

function send(res, status, body, headers = {}) {
  res.writeHead(status, { "Content-Type": "application/json", ...headers });
  res.end(body === undefined ? "" : JSON.stringify(body));
}
const authErr = (res, msg, code = 400) => send(res, code, { code, error_code: "invalid_credentials", msg });

async function readBody(req) {
  let s = "";
  for await (const c of req) s += c;
  try { return s ? JSON.parse(s) : {}; } catch { return {}; }
}

async function handleAuth(req, res, url, body) {
  const p = url.pathname.replace("/auth/v1", "");
  if (p === "/token") {
    const grant = url.searchParams.get("grant_type");
    if (grant === "password") {
      if (!body.email || body.password === "wrong-password") return authErr(res, "Invalid login credentials");
      return send(res, 200, session(makeUser(body.email)));
    }
    if (grant === "refresh_token") {
      const email = String(body.refresh_token || "").replace(/^rt-/, "");
      return email ? send(res, 200, session(makeUser(email))) : authErr(res, "Invalid Refresh Token");
    }
    return authErr(res, `unsupported grant_type ${grant}`);
  }
  if (p === "/signup") {
    if (state.users[body.email]) return send(res, 422, { code: 422, error_code: "user_already_exists", msg: "User already registered" });
    return send(res, 200, session(makeUser(body.email)));
  }
  if (p === "/user") {
    const u = userFromBearer(req);
    return u ? send(res, 200, u) : send(res, 401, { code: 401, error_code: "bad_jwt", msg: "invalid JWT" });
  }
  if (p === "/logout") return send(res, 204);
  if (p === "/authorize") return send(res, 400, { code: 400, msg: "OAuth providers are not stubbed" });
  return send(res, 404, { msg: `auth stub: no route ${p}` });
}

async function handleApi(req, res, url, body) {
  const p = url.pathname, m = req.method;
  if (p === "/health") return send(res, 200, { status: "ok" });
  if (!userFromBearer(req)) return send(res, 401, { detail: "Not authenticated" });

  const repoMatch = /^\/repos\/([^/]+)(\/reindex)?$/.exec(p);
  if (p === "/repos" && m === "GET") {
    const items = state.repos.map(publicRepo);
    return send(res, 200, { items, total: items.length, page: 1, page_size: 50, has_more: false });
  }
  if (p === "/repos" && m === "POST") {
    const r = { id: `repo-${++state.seq}`, url: body.url, branch: body.branch, status: "pending", progress_pct: 0,
      branches_available: null, error_message: null, file_count: null, chunk_count: null, webhook_url: body.webhook_url ?? null,
      created_at: now(), updated_at: now(), indexed_at: null, _ticks: 0 };
    state.repos.unshift(r);
    return send(res, 201, publicRepo(r));
  }
  if (repoMatch) {
    const r = state.repos.find((x) => x.id === repoMatch[1]);
    if (!r) return send(res, 404, { detail: "Repository not found" });
    if (repoMatch[2] && m === "POST") {
      Object.assign(r, { status: "pending", progress_pct: 0, _ticks: 0, updated_at: now() });
      return send(res, 200, publicRepo(r));
    }
    if (m === "GET") {
      // Each poll returns the current step, then advances (UI polls every 2s): pending, cloning, indexing 33%, 66%, ready.
      if (r.status !== "ready" && r.status !== "failed") {
        r.status = PROGRESSION[Math.min(r._ticks, PROGRESSION.length - 1)];
        r.progress_pct = r.status === "ready" ? 100 : r.status === "indexing" ? 33 * (r._ticks - 1) : 0;
        if (r.status === "ready") Object.assign(r, { file_count: 42, chunk_count: 300, indexed_at: now() });
        r.updated_at = now();
        r._ticks++;
      }
      return send(res, 200, publicRepo(r));
    }
    if (m === "DELETE") {
      state.repos = state.repos.filter((x) => x !== r);
      delete state.history[r.id];
      // shortcut: backend's real DELETE response shape is unknown; UI calls response.json(), so return JSON.
      return send(res, 200, { deleted: true });
    }
  }
  if (p === "/git/branches" && m === "POST") {
    if (/private|notfound/i.test(body.url || "")) {
      return send(res, 200, { url: body.url, default_branch: "", branches: [], is_public: false, error: "Repository not found or not accessible" });
    }
    return send(res, 200, { url: body.url, default_branch: "main", branches: ["main", "develop", "feature/search"], is_public: true });
  }
  const hist = /^\/chat\/history\/([^/]+)$/.exec(p);
  if (hist && m === "GET") {
    const messages = state.history[hist[1]] || [];
    return send(res, 200, { messages, total: messages.length });
  }
  if (hist && m === "DELETE") { delete state.history[hist[1]]; return send(res, 200, { cleared: true }); }
  if (p === "/chat/stream" && m === "POST") return streamChat(res, body);
  return send(res, 404, { detail: `api stub: no route ${m} ${p}` });
}

async function streamChat(res, body) {
  res.writeHead(200, { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" });
  const ev = (event, data) => res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  if (/trigger-error/i.test(body.question || "")) { ev("error", { error: "Stub backend error: LLM unavailable" }); return res.end(); }
  const rich = /rich-answer/i.test(body.question || "");
  let answer = `Stub answer to "${body.question}". The app factory lives in \`src/flask/app.py\` (history: ${body.history?.length ?? 0} messages).`;
  if (rich) answer += ` See [app.py lines 10-42][1] and [2].\n\n\`\`\`python\ndef create_app():\n    return Flask(__name__)\n\`\`\`\n`;
  for (const chunk of answer.match(/[\s\S]{1,12}/g)) { ev("token", { content: chunk }); await new Promise((r) => setTimeout(r, 40)); }
  const src = (i, file) => ({ chunk_id: `c${i}`, file, line_start: 10 * i, line_end: 10 * i + 32, symbol_name: null, score: 0.9 - i / 10 });
  const sources = rich
    ? [src(1, "src/flask/app.py"), src(2, "src/flask/config.py"), src(3, "src/flask/cli.py"), src(4, "src/flask/views.py")]
    : [{ chunk_id: "c1", file: "src/flask/app.py", line_start: 10, line_end: 42, symbol_name: "Flask", score: 0.91 }];
  ev("done", { sources, model: "stub-model" });
  res.end();
  const h = (state.history[body.repo_id] ||= []);
  h.push({ id: crypto.randomUUID(), role: "user", content: body.question, sources: null, created_at: now() },
         { id: crypto.randomUUID(), role: "assistant", content: answer, sources, created_at: now() });
}

http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  res.setHeader("Access-Control-Allow-Origin", req.headers.origin || "*");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", req.headers["access-control-request-headers"] || "*");
  if (req.method === "OPTIONS") return send(res, 204);

  const body = ["POST", "PUT", "PATCH", "DELETE"].includes(req.method) ? await readBody(req) : undefined;
  if (url.pathname.startsWith("/__")) {
    if (url.pathname === "/__state") return send(res, 200, { ...state, repos: state.repos.map(publicRepo) });
    if (url.pathname === "/__reset" && req.method === "POST") { state = seed(); return send(res, 200, { reset: true }); }
    return send(res, 404, {});
  }
  fs.appendFileSync(LOG, JSON.stringify({ t: now(), method: req.method, path: url.pathname + url.search, body }) + "\n");
  try {
    if (url.pathname.startsWith("/auth/v1/")) await handleAuth(req, res, url, body || {});
    else await handleApi(req, res, url, body || {});
  } catch (e) { send(res, 500, { detail: String(e) }); }
}).listen(PORT, "127.0.0.1", () => console.log(`stub listening on http://127.0.0.1:${PORT}`));
