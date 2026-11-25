# Authentication

Users sign in or create an account with email and password on `/auth` and land on `/dashboard`. Bad credentials show an inline error. Signed-out users who open a protected page are sent back to `/auth`, and signing out from the sidebar returns them there.

## Sub-features

- `auth-login` signs in with email and password and redirects to `/dashboard`.
- `auth-signup` creates an account from the `Sign Up` tab and redirects to `/dashboard`.
- `auth-bad-credentials` shows the Supabase error message inline and stays on `/auth`.
- `auth-guard` sends an anonymous visit to `/dashboard` or `/repos/...` back to `/auth`.
- `auth-signed-in-redirect` sends a signed-in visit to `/auth` on to `/dashboard`.
- `auth-signout` signs out from the sidebar user menu.
- `auth-oauth` provides the `Continue with GitHub` / `Continue with Google` buttons. These are not drivable in stub mode.

## How to get to it (user POV)

- Landing header `Login` or `Sign Up`, the hero `Get Started for Free`, or the CTA `Sign Up Free`. Sign-up links open `/auth?mode=signup`.
- Open `http://localhost:3100/auth` directly.
- Open any protected URL while signed out.
- Sidebar user button (shows the email) → `Sign out`.

## Driving it with verify.mjs

Preconditions:

- Doctor OK, `await stubReset()` called, and a fresh browser context (every `drive` gets one).

- **Login.** `await page.goto("/auth")`, then `getByLabel("Email").fill("verify@example.com")`, `getByLabel("Password").fill("verify-pass-123")` and `getByRole("button", { name: "Sign In" }).click()`. Result: the URL becomes `/dashboard` and the heading `/What code are we/` is visible. The built-in `login()` does exactly this.
- **Signup.** `page.goto("/auth?mode=signup")`, so the heading reads `Create your account`. Fill Email and Password, then `getByRole("button", { name: "Create Account" }).click()`. Result: `/dashboard`. Side effect: `stubState().users` has the email, and `stub-requests.jsonl` has `POST /auth/v1/signup`.
- **Duplicate signup.** In the same drive, sign out after the first signup (see Sign out), then repeat the signup with the same email. The stub keeps users until `stubReset()`. Result: inline error `User already registered`, and the URL stays on `/auth`.
- **Bad credentials.** Log in with password `wrong-password`. Result: inline error `Invalid login credentials`, and the URL stays `/auth`.
- **Guard.** In a fresh context, `page.goto("/dashboard")`. Result: the client redirects to `/auth` (waitForURL `**/auth**`). Repeat with `/repos/repo-ready-1/chat`.
- **Signed-in redirect.** After `login()`, `page.goto("/auth")`. Result: the URL returns to `/dashboard`.
- **Sign out.** After `login()`, `getByRole("button", { name: /verify@example\.com/ }).click()`, then `getByRole("button", { name: /Sign out/ }).click()`. Result: `/auth`, the stub log has `POST /auth/v1/logout`, and `page.goto("/dashboard")` bounces back to `/auth`.
- **Proof.** `shot()` the error state and the post-login dashboard. `aria("dashboard")` must show the sidebar user button with the email.

## Gotchas

- **Server middleware is not active.** `middleware.ts` sits at the repo root, but the app uses `src/app/`, so Next only loads `src/middleware.ts`. The root file is never compiled. An anonymous `GET /dashboard` returns 200 server-side, and the redirect comes only from client code (`useAuth` + `router.push("/auth")`). The `?next=` parameter the middleware would add is therefore never present. Don't assert on it unless the middleware gets moved.
- OAuth buttons navigate the whole browser to the stub's `/auth/v1/authorize`, which refuses on purpose. You land on a raw JSON page (`OAuth providers are not stubbed`), not an inline error. Report `auth-oauth` as unreachable in stub mode; the prerequisite is real-backend mode with a configured GitHub or Google provider.
- `/auth/callback` redirects to `/auth?error=callback_failed` when the code exchange fails, but the auth page never reads `error`, so no message is shown.
- The password field has `minLength=6`. Shorter passwords are blocked by browser validation before any request is sent.
- Signup redirects to `/dashboard` even when Supabase requires email confirmation. In real-backend mode, confirm-email projects behave differently from the stub.
