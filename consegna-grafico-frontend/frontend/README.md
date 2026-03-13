# Frontend Heirline

Frontend React per landing, autenticazione, dashboard utente e checkout.

## Stack

- React 19
- React Router
- Tailwind CSS + componenti UI locali
- Axios con `withCredentials` per refresh cookie `HttpOnly`
- Playwright per E2E
- ESLint flat config

## Comandi

```bash
yarn install
yarn start
yarn lint
yarn build
yarn test
yarn e2e
```

## Variabili ambiente

Usa `frontend/.env.example` come base.

Variabile principale:

```bash
REACT_APP_BACKEND_URL=http://127.0.0.1:8000
```

## Note architetturali

- L'access token vive solo in memoria.
- Il refresh token non viene più letto da JavaScript: è gestito dal backend via cookie `HttpOnly`.
- Le pagine pubbliche e private convivono nello stesso bundle, ma CI ora esegue lint, build ed E2E.
- La dashboard usa `HashRouter`: su desktop espone una tablist sticky, su mobile usa la bottom navigation.

## E2EE reale nel frontend

Il frontend distingue tre stati diversi:
- `E2EE richiesta`: l'account non ha ancora una chiave pubblica registrata a backend
- `vault locale bloccato`: la chiave privata è presente nel browser ma serve la passphrase
- `vault locale sbloccato`: i payload cifrati possono essere letti o creati lato client

Comportamento attuale:
- se l'account non ha E2EE attiva, la dashboard porta l'utente in `Sicurezza`
- TOTP protetti e nuovi delegati cifrati richiedono una cassaforte pronta
- la passphrase non lascia mai il browser

## Verifica frontend

Smoke check:

```bash
yarn lint
yarn build
```

Suite E2E principali:

```bash
yarn e2e e2e/dashboard-conversion.spec.js
yarn e2e e2e/auth-and-checkout.spec.js
yarn e2e e2e/advanced-operational-flows.spec.js
```

La suite avanzata usa utenti deterministici creati da:

```bash
backend/.venv/bin/python scripts/provision-test-users.py
```
