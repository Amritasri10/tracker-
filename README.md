# AucTech Vault — Frontend

Two files, no build step needed:
- `index.html` — the whole app (lock screen + dashboard/vault/renewals/social/settings UI)
- `login.js` — login, session, and API-fetch logic (loaded by index.html)

## Pointing this at your backend

Near the top of `index.html` you'll find:

```html
<script>window.AUCTECH_API_BASE = "http://localhost:5000/api";</script>
```

Change that URL to wherever the **backend** folder is actually running —
e.g. `https://your-api-domain.com/api` once deployed. `login.js` reads this
value (`window.AUCTECH_API_BASE`) for every API call, so this one line is
the only place that needs updating.

## Running it locally

Just open `index.html` in a browser, or serve the folder with any static
file server (VS Code "Live Server", `npx serve`, etc.) — there's nothing to
install or build here. Make sure the backend (see `../backend/README.md`)
is running and reachable at whatever URL you set `AUCTECH_API_BASE` to,
and that its `CLIENT_ORIGIN` / CORS setting allows requests from wherever
this frontend is being served from.
