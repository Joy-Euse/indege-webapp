# INDEGE web app

React, Vite, TypeScript and Tailwind CSS v4. Only authentication is built so far.

## Run locally

Start the backend first (see `../backend/README.md`), then:

```bash
npm install
npm run dev      # http://localhost:5173
```

Vite forwards `/api` to the backend on port 4000. While there is no SMS provider, verification codes print in the backend's terminal.

```bash
npm test
npm run build
```

## Where to edit things

| What | File |
|---|---|
| All text, English and Kinyarwanda | `src/i18n/strings.ts`. Entries marked DRAFT need checking by a fluent reader. |
| Colors and fonts | `src/index.css` (`@theme`) |
| Kigali photo (currently a green pattern) | `HeroPanel` in `src/components/AuthLayout.tsx` |
| Terms and Privacy pages (currently placeholders) | `src/pages/LegalPlaceholder.tsx` |
| Sidebar, top bar, bottom tabs and their links | `src/components/AppShell.tsx` |
| Account menu (switch side, profile, settings, log out) | `src/components/ProfileMenu.tsx` |
| Hiring dashboard | `src/pages/customer/` |
| Worker dashboard (currently a placeholder) | `src/pages/worker/WorkerHome.tsx` |
| Profile, privacy and security settings | `src/pages/settings/` |

## Pages

- Signed out: `/login`, `/register`, `/verify`, `/forgot-password`, `/reset-password`, `/terms`, `/privacy`
- Hiring side: `/customer`, `/customer/jobs` (search with `?q=`, filter with `?status=`), `/customer/jobs/new`, `/customer/jobs/:id`, `/customer/jobs/:id/edit`
- Worker side: `/worker`
- Both sides: `/settings/profile`, `/settings/privacy`, `/settings/security`

The layout changes with screen width: top bar and bottom tabs on phones (under 768px), an icon rail on tablets, and a full sidebar from 1280px.

## Sessions

The access token stays in memory and the refresh token is an httpOnly cookie that scripts cannot read. A page reload restores the session from the cookie. Logging out clears every cached answer, so the next person on a shared phone sees nothing. `src/lib/api.ts` renews expired tokens automatically, so use its `api()` function for every backend call.

Host the app and API on the same site, such as `app.indege.rw` and `api.indege.rw`, because the cookie is `SameSite=Strict`.
