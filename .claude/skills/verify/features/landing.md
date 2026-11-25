# Landing page and navigation

The public landing page at `/` introduces CodeExplore and routes visitors to sign-in or sign-up. On small screens a toggle menu replaces the header buttons. Signed-in pages share a sidebar with the logo, `New Repository`, the repo list, and the user menu. On mobile the sidebar opens from a menu button.

## Sub-features

- `landing-hero` shows the heading `Understand Any Codebase in Seconds` and the `Get Started for Free` CTA.
- `landing-header-auth` shows the header `Login` (`/auth`) and `Sign Up` (`/auth?mode=signup`) buttons at `md` widths and above.
- `landing-mobile-menu` provides a `Toggle menu` button below `md` that reveals `Login` and `Sign Up` and sets `aria-expanded`.
- `landing-cta` shows the bottom `Sign Up Free` CTA.
- `landing-footer` shows a brand-only footer: a `terminal CodeExplore` link to `/` and the tagline `The intelligent code exploration platform for modern engineering teams.`
- `sidebar-nav` provides the logo and `New Repository` (both link to `/dashboard`) and repo links to `/repos/<id>/chat`.
- `sidebar-mobile` provides `Open menu`, which opens the sidebar below `md`. `Close sidebar`, Escape, and a backdrop click close it.

## How to get to it (user POV)

- Visit `http://localhost:3100/` while signed out.
- The sidebar on `/dashboard`, `/repos/new/branches`, and `/repos/<id>/chat` after login.

## Driving it with verify.mjs

Preconditions:

- Doctor OK, `await stubReset()`.

- **Hero.** `page.goto("/")`. Result: `getByRole("heading", { name: /Understand Any/ })` is visible, and `getByRole("contentinfo").getByText(/intelligent code exploration platform/)` shows the footer. `getByRole("link", { name: /Get Started for Free/ }).click()` leads to `/auth?mode=signup` with the heading `Create your account`.
- **Header auth.** Back on `/`, `getByRole("banner").getByRole("link", { name: "Login" }).click()` leads to `/auth` with the heading `Welcome back`.
- **Mobile menu.** `page.setViewportSize({ width: 390, height: 844 })`, `page.goto("/")`, then `getByRole("button", { name: "Toggle menu" }).click()`. Result: the button has `aria-expanded="true"` and the dropdown shows `Login` and `Sign Up`. `getByRole("banner").getByRole("link", { name: "Sign Up", exact: true }).last().click()` lands on `/auth?mode=signup`. Scope the link to the banner: an unscoped `name: "Sign Up"` also matches the page's `Sign Up Free` CTA.
- **Sidebar.** After `login()`, `getByRole("link", { name: /pallets\/flask/ }).click()` leads to `/repos/repo-ready-1/chat`, where that link shows `Active Now`. `getByRole("link", { name: /New Repository/ }).click()` leads to `/dashboard`.
- **Sidebar mobile.** At a 390 px width after `login()`, the `complementary` region's `boundingBox().x` is below 0 (closed). `getByRole("button", { name: "Open menu" }).click()` moves x to 0 or more after the 200 ms transition. Each of these slides it closed again (x below 0); reopen between them:
  - `page.keyboard.press("Escape")`
  - `getByRole("button", { name: "Close sidebar" }).click()`
  - a backdrop click right of the 280 px panel, e.g. `page.mouse.click(360, 400)`
  - clicking any sidebar link
- **Proof.** `shot()` the desktop landing, the mobile menu open, and the mobile sidebar open, plus `aria()` the mobile menu state.

## Gotchas

- The landing's `Enter your email address` input is decorative. It isn't submitted anywhere, and `Sign Up Free` is just a link.
- `Terms` / `Privacy Policy` links point to `#`.
- The sidebar `Filter repositories...` input is not wired to any filtering. Typing into it does nothing.
- The header's mobile dropdown is the opposite case: it is conditionally rendered. It is absent from the DOM when closed, and choosing one of its links closes it.
- `getByRole("banner")` exists only on `/`. The chat page's header sits inside `<main>` and has no banner role.
- `Active Now` replaces the status text only on the chat page. The dashboard and branch pages show `Ready <date>`, `Failed`, and so on.
- The sidebar is translated off-canvas, not removed, on mobile. It stays in the DOM and the ARIA tree when "closed", so assert with `toBeInViewport`-style checks (bounding box x ≥ 0), not visibility.
- Material Symbols load from Google Fonts. Offline, the icon words render as plain text, but accessible names are unchanged.
