# Heirline Local Run (PC locale + DB remoto)

Questo progetto gira in locale su questo PC senza VPN. Nella workspace attuale sono supportate due modalita' frontend:
- backend Python/FastAPI su `http://127.0.0.1:8000`
- frontend build statico servito in locale su `http://127.0.0.1:3010`
- frontend React dev server alternativo su `http://localhost:3000` o `http://127.0.0.1:3001`
- database MySQL remoto (resta dove si trova ora)

## Requisiti

- `python3`
- `node`
- `yarn`
- `php` (solo se vuoi servire la build locale su `3010`)

## Documentazione funzionale

- indice documentazione: `documentazione/00_INDICE.md`
- catalogo servizi e dashboard utente: `documentazione/06_SERVIZI_E_DASHBOARD_UTENTE.md`
- verifica locale e suite automatiche: `docs/testing/local-verification.md`

## Servizi attivi nel prodotto

- dashboard utente con tab `Inbox`, `Account`, `Eredi`, `Sicurezza`, `Upgrade`
- area account con profilo, sessioni attive, logout browser, passkeys, notifiche push e alias email
- inbox OTP multi-canale con filtri, shared inbox e simulazione demo
- sicurezza account con setup E2EE obbligatorio, vault locale, note sicure cifrate, policy OTP, whitelist, TOTP, audit e kill switch
- deleghe / eredita' digitale, checkout Stripe e ritorno post-pagamento
- browser extension per autofill OTP e stream realtime
- API ulteriori presenti ma non tutte cablate nella UI principale: `user_devices`, domini browser autofill, funnel analytics/export CSV

## Setup rapido

1. Configura backend:
```bash
cp backend/.env.example backend/.env
```
Apri `backend/.env` e inserisci i parametri reali del DB remoto:
- `MYSQL_HOST`
- `MYSQL_PORT`
- `MYSQL_USER`
- `MYSQL_PASSWORD`
- `MYSQL_DATABASE`

2. Avvio locale:
```bash
chmod +x scripts/dev-up.sh scripts/dev-down.sh
./scripts/dev-up.sh
```

Se la porta frontend `3000` e gia occupata:
```bash
FRONTEND_PORT=3001 ./scripts/dev-up.sh
```

Modalita' statica usata spesso in questa workspace:
```bash
cd frontend
yarn build
cd ..
php -S 127.0.0.1:3010 -t frontend/build
```

3. Stop servizi:
```bash
./scripts/dev-down.sh
```

Alternativa containerizzata:
```bash
docker compose up --build
```

## Setup E2EE reale

L'E2EE non viene "accesa in automatico" dal server, perche' la chiave privata e la passphrase devono restare sul client.

Stato corretto del prodotto:
- un account senza chiave registrata viene trattato come `E2EE richiesta`
- la dashboard porta l'utente nella tab `Sicurezza` per completare il setup
- finche' E2EE non e' attiva, le funzioni protette restano parziali o bloccate

Stati da distinguere:
- `chiave account non registrata`: il backend non ha ancora una chiave pubblica attiva
- `vault locale presente ma bloccato`: la chiave privata esiste nel browser, ma non e' sbloccata
- `vault locale sbloccato`: inbox cifrati, note sicure, deleghe protette e TOTP possono essere letti/generati lato client

Dipendenze pratiche:
- note sicure cifrate: richiedono E2EE attiva per il salvataggio e il vault locale corretto per la lettura
- import TOTP protetti: richiede E2EE attiva e vault sbloccato
- creazione nuovi eredi cifrati: richiede E2EE attiva e step-up password
- lettura payload cifrati: richiede il vault locale del browser corretto

## Hardening runtime

- `JWT_SECRET` deve essere casuale e lungo almeno 32 caratteri.
- In `APP_ENV=production` il backend blocca l'avvio se il secret e debole (override solo con `ALLOW_WEAK_JWT_SECRET=true`).
- Timeout/retry DB configurabili da env:
  - `DB_CONNECT_TIMEOUT_SEC`
  - `DB_READ_TIMEOUT_SEC`
  - `DB_WRITE_TIMEOUT_SEC`
  - `DB_MAX_RETRIES`
  - `DB_RETRY_BACKOFF_MS`
- Pool DB opzionale (riduce picchi di connessioni su DB remoto):
  - `DB_POOL_ENABLED`
  - `DB_POOL_MIN_CACHED`
  - `DB_POOL_MAX_CACHED`
  - `DB_POOL_MAX_SHARED`
  - `DB_POOL_MAX_CONNECTIONS`
- Migrazioni schema:
  - baseline versionata via tabella `schema_migrations`
- Rate limit auth configurabili da env (default invariati):
  - `RATE_LIMIT_REGISTER`
  - `RATE_LIMIT_LOGIN`
  - `RATE_LIMIT_OTP_REQUEST`
- Session token lifecycle:
  - `ACCESS_TOKEN_TTL_SECONDS`
  - `REFRESH_TOKEN_TTL_DAYS`
  - `STEP_UP_TOKEN_TTL_SECONDS`
  - refresh token trasportato via cookie `HttpOnly`
- CORS esplicito:
  - `CORS_ORIGINS` (obbligatorio in produzione, wildcard `*` non ammesso)
- URL pubblico API:
  - `PUBLIC_API_BASE_URL` per callback Twilio, link deleghe e integrazioni esterne
- Debug OTP hardening:
  - `ALLOW_DEBUG_OTP_EXPOSURE=false` (default)
  - `ALLOW_OTP_FALLBACK_LOG_CONTENT=false` (default)
- Security headers API:
  - `SECURITY_HEADERS_ENABLED=true` (default)
  - `SECURITY_HEADERS_HSTS_SECONDS=31536000`
  - `SECURITY_HEADERS_HSTS_INCLUDE_SUBDOMAINS=true`
  - `SECURITY_HEADERS_HSTS_PRELOAD=false`
  - `SECURITY_HEADERS_CSP` (override opzionale policy CSP)
- Security monitoring / SIEM:
  - `SECURITY_EVENTS_LOG_PATH` (default `.run/security-events.ndjson`)
  - `SECURITY_EVENTS_WEBHOOK_URL` (opzionale)
  - `SECURITY_EVENTS_WEBHOOK_TIMEOUT_SECONDS`
  - `SECURITY_ALERT_LOGIN_FAILURE_THRESHOLD`
  - `SECURITY_ALERT_LOGIN_WINDOW_MINUTES`
  - `SECURITY_ALERT_SESSION_DRIFT_THRESHOLD`
  - `SECURITY_ALERT_SESSION_DRIFT_WINDOW_MINUTES`
  - `SESSION_RISK_SCORE_IP_DRIFT`
  - `SESSION_RISK_SCORE_UA_DRIFT`
  - `SESSION_RISK_SCORE_DECAY_STEP`
  - `SESSION_RISK_BLOCK_THRESHOLD`

## Vault Zero-Knowledge API

Endpoint disponibili:
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `GET /api/auth/sessions`
- `DELETE /api/auth/sessions/{session_id}`
- `POST /api/auth/step-up/password`
- `GET /api/security/alerts` (admin)
- `POST /api/security/alerts/{alert_id}/resolve` (admin)
- `POST /api/vault/upload`
- `GET /api/vault/sync?since_revision=...`
- `POST /api/vault/rekey`
- `GET /api/delegates/access/{access_key}` (rilascio delega via token di inattività/emergenza)

Questi endpoint salvano solo snapshot cifrati lato client con controllo revisione (`expected_revision`) per evitare overwrite concorrenti.

Limiti e guardrail configurabili:
- `VAULT_MAX_ITEMS` (default `500`)
- `VAULT_MAX_DELEGATE_PACKAGES` (default `50`)
- `VAULT_MAX_SNAPSHOT_BYTES` (default `1048576`)
- `RATE_LIMIT_VAULT_UPLOAD` (default `15/minute`)
- `RATE_LIMIT_VAULT_SYNC` (default `60/minute`)
- `RATE_LIMIT_VAULT_REKEY` (default `6/minute`)

Documentazione:
- overview sicurezza: `docs/security/security-overview.md`
- gap analysis + remediation roadmap: `docs/security/security-gap-roadmap.md`
- trust/compliance baseline: `docs/security/trust-and-compliance.md`
- incident response runbook: `docs/security/incident-response.md`
- external audit plan: `docs/security/external-audit-plan.md`
- backup/restore drill: `docs/security/backup-restore-drill.md`
- contratti payload/API: `docs/security/vault-payloads.md`
- checklist hardening: `docs/security/mvp-hardening-checklist.md`
- verifica locale end-to-end: `docs/testing/local-verification.md`

### Uscire Dalla Demo (Real Mode)

Per un ambiente reale imposta in `backend/.env`:
- `APP_ENV=production`
- `OTP_DEV_MODE=false`
- `ENABLE_DEMO_ENDPOINTS=false`
- `REQUIRE_REAL_OTP_PROVIDER=true`
- `REQUIRE_STRIPE_CHECKOUT=true`
- `ALLOW_DEMO_ENDPOINTS_IN_PRODUCTION=false`

Credenziali minime richieste:
- Twilio OTP: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_MESSAGING_FROM`
- Stripe checkout: `STRIPE_API_KEY` (e consigliato `STRIPE_WEBHOOK_SECRET`)
- Push web: `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` (opzionale ma consigliato)

Con `APP_ENV=production` il backend ora rifiuta l'avvio se rileva configurazioni demo o provider mancanti quando richiesti.

Per sviluppo demo esplicito (non produzione), abilita manualmente:
- `OTP_DEV_MODE=true`
- `ENABLE_DEMO_ENDPOINTS=true`
- `STRIPE_DEMO_MODE=true`

Stripe locale/demo:
- con `STRIPE_DEMO_MODE=true` e `STRIPE_API_KEY=sk_test_demo_local` il checkout viene simulato in locale e porta direttamente al flusso `payment-success`
- se sostituisci `STRIPE_API_KEY` con una vera secret key Stripe test (`sk_test_...`), lo stesso endpoint passa automaticamente a Stripe Checkout reale
- in sviluppo, se Stripe conferma il pagamento ma non hai ancora esposto un webhook pubblico, `GET /api/payments/status/:session_id` completa comunque il provisioning locale

## Verifica locale consigliata

Backend:
```bash
cd backend
.venv/bin/pytest -q
```

Frontend:
```bash
cd frontend
yarn lint
yarn build
```

E2E principali:
```bash
cd frontend
yarn e2e e2e/dashboard-conversion.spec.js e2e/auth-and-checkout.spec.js e2e/advanced-operational-flows.spec.js
```

Le suite E2E oggi coprono:
- dashboard reale, account, upgrade, sicurezza ed E2EE gating
- registrazione, recovery e ritorno checkout
- TOTP end-to-end, deleghe con step-up e kill switch

Per la suite avanzata esiste un bootstrap dedicato:
```bash
backend/.venv/bin/python scripts/provision-test-users.py
```

Utenti deterministici creati dallo script:
- `debug123@test.com` / `Test123!` (`gold`)
- `vault123@test.com` / `Vault123!` (`silver`)
- `admin.kpi.test+01@gmail.com` / `AdminTest123!` (`elite`)

## Go-Live Produzione

1. Prepara `.env` production:
```bash
cp backend/.env.production.example backend/.env
```

2. Compila i campi obbligatori in `backend/.env`:
- `MYSQL_HOST`, `MYSQL_USER`, `MYSQL_PASSWORD`, `MYSQL_DATABASE`
- `JWT_SECRET` (casuale e lungo)
- `PUBLIC_API_BASE_URL` con il dominio pubblico del backend/API
- `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_MESSAGING_FROM`
- `STRIPE_API_KEY`, `STRIPE_WEBHOOK_SECRET`
- `CORS_ORIGINS` con il dominio reale frontend
- `WEBAUTHN_RP_ID`, `WEBAUTHN_ORIGIN`, `WEBAUTHN_ALLOWED_ORIGINS` per Passkeys/WebAuthn

Esempio Passkeys produzione (Heirline):
- `WEBAUTHN_RP_ID=heirline.hacklab.digital`
- `WEBAUTHN_ORIGIN=https://heirline.hacklab.digital`
- `WEBAUTHN_ALLOWED_ORIGINS=https://heirline.hacklab.digital`

Nota: `WEBAUTHN_RP_ID` deve essere solo dominio (niente `https://`, niente porta).

Generazione rapida `JWT_SECRET`:
```bash
openssl rand -hex 48
```

3. Verifica bootstrap backend:
```bash
cd backend
.venv/bin/python -m uvicorn server:app --host 0.0.0.0 --port 8000
```
Con `APP_ENV=production`, l'avvio viene bloccato automaticamente se restano flag demo o provider mancanti.

4. Smoke check minimo:
- `GET /api/health`
- login OTP reale (`/api/auth/otp/request` + `/api/auth/otp/verify`)
- checkout Stripe (`/api/payments/checkout`)

## File utili

- Template env backend: `backend/.env.example`
- Template env frontend: `frontend/.env.example`
- Script avvio: `scripts/dev-up.sh`
- Script stop: `scripts/dev-down.sh`
- Script restore drill: `scripts/security/backup-restore-drill.sh`
- Log runtime: `.run/backend.log` e `.run/frontend.log`

## KPI e Growth (gia integrati)

Sono gia disponibili:
- onboarding OTP-first con endpoint:
  - `POST /api/auth/otp/request`
  - `POST /api/auth/otp/verify`
- hardening anti-abuso OTP:
  - cooldown reinvio
  - limite giornaliero per numero
  - limite giornaliero per IP
- tracking eventi prodotto:
  - `POST /api/analytics/events`
- report funnel admin:
  - `GET /api/analytics/funnel?days=7`
  - `GET /api/analytics/funnel/export.csv?days=7`
  - `GET /api/analytics/funnel/goals/export.csv?days=7`
  - `GET /api/analytics/funnel/daily-pulse/export.csv?days=7`
  - `GET /api/analytics/funnel/alerts/export.csv?days=7&severity=all`
- A/B test landing Hero (variant A/B) e tracking UTM persistente
- assegnazione Hero A/B adattiva (`GET /api/landing/hero-variant`) con pesi dinamici verso la variante con conversione migliore
- tab KPI in dashboard (visibile solo utenti admin)
- tracking checkout affidabile server-side:
  - eventi `checkout.started` e `checkout.paid` deduplicati per sessione
  - fallback webhook Stripe per pagamento confermato
  - controllo ownership su `GET /api/payments/status/{session_id}`
- dashboard operativa:
  - setup push notifications end-to-end:
    - `POST /api/push/subscribe`
    - `DELETE /api/push/unsubscribe?endpoint=...`
    - `POST /api/push/test`
  - tab `Setup` con policy OTP (TTL, mask OTP, auto-delete, whitelist toggle)
  - gestione whitelist mittenti trusted direttamente da UI
  - gestione eredi completa da UI (aggiunta/revoca)
  - tab KPI con filtro periodo `7/14/30/60/90 giorni` + funnel visuale a barre (range persistito)
  - KPI aggiuntivo "Upgrade Nudge" (shown/click/paid/CTR) + breakdown A/B per variante nudge
  - KPI "Onboarding Readiness" (ready -> checkout -> paid)
  - KPI "Onboarding Blockers" (top gap richiesti per utenti non-ready) + "Efficacia Azioni Onboarding" (click -> ready -> paid)
  - KPI "Funnel Health Score" + "Alert Operativi" con raccomandazioni action-oriented
  - KPI "Hero Assignment" (winner/mode/weights A-B) allineato al motore A/B adattivo
  - KPI "Trend vs Periodo Precedente" con delta pp sulle conversioni chiave
  - pannello "Conversioni Chiave" con andamento sintetico (delta vs periodo precedente)
  - KPI "Next Best Actions" (top 3 priorità operative generate automaticamente) con CTA "Esegui" e tracking `kpi.next_action_click`
  - auto-refresh KPI ogni 60s con toggle ON/OFF persistente lato admin
  - KPI "Top Bottleneck Funnel" (drop e utenti persi tra step consecutivi)
  - export report `Insights` in Markdown dalla tab KPI (health + alert + trend + bottleneck + azioni)
  - KPI "Qualità Sorgenti Acquisizione" (`utm_source`: view -> OTP -> checkout -> paid)
  - KPI "Performance Checkout per Piano" (`checkout.started` -> `checkout.paid` per Vault/Shield/Control) con trend vs periodo precedente
  - KPI "Time to Conversion" (avg/min/max per i passaggi principali del funnel) + alert dedicati sulle latenze anomale
  - KPI "Goals & Target" con stato `on_track / at_risk / off_track`, coverage dati e raccomandazioni operative
  - filtro KPI Goals per stato + export CSV dedicato ai goals dalla tab KPI
  - KPI "Daily Pulse" con serie giornaliera funnel, storico anomalie e timeline severita (high/medium/low)
  - confronto anomalie `ultimi 7 giorni vs 7 giorni precedenti` con delta/trend e reference date operativa
  - export CSV Daily Pulse con colonne di summary 7d + anomalie Daily Pulse integrate anche nel pannello alert operativo
  - filtro Alert Operativi per severita (`all/high/medium/low`) con persistenza lato admin
  - export CSV Alerts con filtro severita (all/high/medium/low) allineato al filtro UI
  - onboarding guidato step-by-step (next action consigliata con CTA dinamica)
  - trigger automatico CTA upgrade quando `activation_ready=true` ma piano ancora `pending/Vault` con dismiss persistente (72h)
  - sticky mobile conversion CTA in dashboard (onboarding/upgrade/checkout) sopra la bottom navigation
  - suite E2E UI mobile con Playwright per conversion flow dashboard (`frontend/e2e/dashboard-conversion.spec.js`)

Nota ruolo admin:
- il primo utente registrato diventa `admin` automaticamente (bootstrap).

## E2E UI (Playwright)

Da cartella `frontend`:
```bash
yarn install
npx playwright install chromium
E2E_BASE_URL=http://127.0.0.1:3001 \
E2E_API_BASE_URL=http://127.0.0.1:8000/api \
TEST_USER_EMAIL=debug123@test.com \
TEST_USER_PASSWORD=Test123! \
yarn e2e
```

## API test suite (pytest)

Provisioning utenti test (user + admin):
```bash
backend/.venv/bin/python scripts/provision-test-users.py
```

Esecuzione:
```bash
REACT_APP_BACKEND_URL=http://127.0.0.1:8000 \
TEST_ADMIN_EMAIL=admin.kpi.test+01@gmail.com \
TEST_ADMIN_PASSWORD=AdminTest123! \
backend/.venv/bin/pytest -q backend/tests/test_heirline_api.py
```

## CI pipeline

Workflow GitHub Actions:
- `.github/workflows/ci.yml`

La pipeline esegue:
1. backend API tests (`pytest`)
2. frontend mobile E2E (`Playwright`)
