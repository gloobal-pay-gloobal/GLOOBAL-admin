# GLOOBAL Admin — the staff site

Everyone who works on GLOOBAL signs in here, and each role lands on its own
desk. Plain files — no build step, no npm install. It installs like an app
(PWA) on a phone or a laptop.

- **Part 1:** sign-in, **Today**, the **Audit log**.
- **Part 2 (patch 0216):** a door for everyone (app users and shops are sent
  to the app; staff sign in), roles — **Admin, Support, Finance, Risk,
  Tech** — the live **Support desk** that answers Help & Support chats from
  the app, and **Team & roles** to add and remove people.

- **Part 3 (patch 0218):** **Look up** an account (Admin, Support, Finance,
  Risk), the payment a chat is about shown on the desk, and **alerts on
  this device** (More → Turn on alerts): a new chat, an answer, a chat
  passed to you. Alerts need the server's VAPID keys, which the app's own
  notifications already use.

- **Part 4 (patch 0219):** **Countries** (Admin, Finance, Risk) and **Money &
  books** (Admin, Finance), live. **GEU on every figure**, with a Local · GEU
  switch on every screen: `18.4L₹ │ GEU` or `18.4L GEU │ ₹`, other
  currencies by their code (`$4.1K │ USD`). Admin can **set a books gap
  aside** with a reason, from Books for a currency.

- **Part 5 (patch 0220):** **Problems** — escalated complaints and GLOOBAL
  Bank cases in one queue, answered as GLOOBAL; **sending money back** with
  two people (one proposes, a different one on Finance or the founder
  approves); **holds** on an account from Look up (Risk and the founder):
  pause payments, pause bank payouts, hide a shop page.

- **Part 6 (patch 0221):** every screen is live. **Controls** between two
  countries on Two together (pause a direction, or cap each payment);
  **refresh rates**; **Server & deploys** (what Render and Netlify run
  against GitHub main); **Growth**; **Shops**; **Risk** signals with scores;
  **Live feed**; **Alerts** — each person picks what reaches their phone,
  and a morning summary of yesterday.

Optional on Render: `GITHUB_TOKEN` (read-only) if Server & deploys shows
"GitHub did not answer: HTTP 403" — a shared IP can hit GitHub's free limit.

## Roles

| Role | Lands on | Sees |
| --- | --- | --- |
| Admin | Today | Everything. Named in `ADMIN_SYMBOL_IDS` on Render. Adds and removes the team. |
| Support | Support desk | Every chat; a person's name, country and last payments — never their balance or full phone number. |
| Finance | Support desk | Only chats passed to Finance, with balance and number. |
| Risk | Support desk | Only chats passed to Risk, with balance and number. |
| Tech | Server & deploys | No one's money or numbers (part 5). |

To add someone: Team & roles → their GLOOBAL ID → a role. The site shows a
one-time code (7 days). They open this site, tap **I work at GLOOBAL**, type
their GLOOBAL ID and PIN, then that code, and their device makes its own
passkey. Removing someone ends their sessions at once.

The server decides what each role may see on every call; the menu here only
follows it. Admin can **View as** another role to check their menu.

## How it is put together

```
GLOOBAL Admin (this repo, Netlify)  ──►  GLOOBAL API on Render  ──►  MongoDB
                                         /api/admin/*  (server/lib/admin.js
                                          in the GloobalV3 repo, patch 0215)
```

This site holds no data. Every number comes from `/api/admin/*`, which the
server opens only to:

- a GLOOBAL ID listed in `ADMIN_SYMBOL_IDS` (Render),
- with its PIN (same PIN and lockout as the app),
- and a passkey made for this site,
- calling from this site's address (`ADMIN_ORIGINS`).

An admin session lasts 8 hours and only in that browser tab. Every view and
action is written to the audit log.

## Files

| File | What it is |
| --- | --- |
| `index.html` | The page |
| `css/admin.css` | The look (GLOOBAL Day / Night) |
| `js/config.js` | Where the API is |
| `js/api.js` | Calls to the API, the session |
| `js/webauthn.js` | Passkeys |
| `js/app.js` | The screens |
| `sw.js`, `manifest.webmanifest`, `icons/` | Install as an app |
| `netlify.toml` | No build; security headers |

## Going live (once)

1. **GitHub**: create an empty repo `gloobal-admin`, then in this folder:
   ```powershell
   git init
   git add .
   git commit -m "GLOOBAL Admin, part 1"
   git branch -M main
   git remote add origin https://github.com/gloobal-pay-gloobal/gloobal-admin.git
   git push -u origin main
   ```
2. **Netlify**: Add new site → Import from GitHub → `gloobal-admin`.
   Build command: empty. Publish directory: `.`. Site name: `gloobal-admin`
   (so the address is `https://gloobal-admin.netlify.app`).
3. **Render** (the API), Environment:
   - `ADMIN_SYMBOL_IDS` = your GLOOBAL ID
   - `ADMIN_SETUP_CODE` = a long random code, only for making the first passkey
   - `ADMIN_ORIGINS` = the Netlify address, only if it is not
     `https://gloobal-admin.netlify.app`
4. Open the site, enter your GLOOBAL ID and PIN, type the setup code, and
   make the passkey. After that: ID, PIN, passkey.

## Updating

Edit, then `git add .`, `git commit -m "…"`, `git push`. Netlify builds on
push if auto-publish is on; otherwise Deploys → Trigger deploy.
