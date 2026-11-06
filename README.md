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
| Dashboards (currently placeholders) | `src/pages/Dashboard.tsx` |

## Pages

`/login`, `/register`, `/verify`, `/forgot-password`, `/reset-password`, `/customer`, `/worker`, `/terms`, `/privacy`

## Sessions

The access token stays in memory and the refresh token is an httpOnly cookie that scripts cannot read. A page reload restores the session from the cookie. `src/lib/api.ts` renews expired tokens automatically, so use its `api()` function for every backend call.

Host the app and API on the same site, such as `app.indege.rw` and `api.indege.rw`, because the cookie is `SameSite=Strict`.
