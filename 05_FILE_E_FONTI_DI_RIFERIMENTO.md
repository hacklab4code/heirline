# File E Fonti Di Riferimento

## Scopo del documento

Questo file elenca i principali sorgenti consultati nel repository per ricostruire descrizione, servizi, dashboard utente, versioni e piani.

## File principali consultati

### Documentazione generale e operativa

- `README.md`
  Documento operativo principale del progetto. Descrive setup locale, hardening, modalita' demo/produzione e note di go-live.

- `memory/PRD.md`
  Product Requirements Document storico. Utile come contesto, ma non trattato come fonte definitiva dei servizi correnti.

### Frontend

- `frontend/src/App.js`
  Punto di ingresso della web app principale. Mostra routing, login, dashboard, tab utente, caricamento dati e wiring dei servizi.

- `frontend/src/components/dashboard/DashboardInboxTab.js`
  Fonte primaria per inbox personale, shared inbox e condivisione Team / Family.

- `frontend/src/components/dashboard/DashboardAccountTab.js`
  Fonte primaria per profilo, sessioni browser, passkeys, push notifications e alias email.

- `frontend/src/components/dashboard/DashboardDelegatesTab.js`
  Fonte primaria per la UX di eredi digitali, override e revoca.

- `frontend/src/components/dashboard/DashboardSettingsTab.js`
  Fonte primaria per E2EE, policy OTP, whitelist, TOTP, audit, alert sicurezza e kill switch.

- `frontend/src/components/dashboard/DashboardUpgradeTab.js`
  Fonte primaria per il confronto piani e le CTA checkout.

- `frontend/src/lib/app-shared.js`
  Fonte primaria per nomi pubblici dei piani, catalogo fallback e normalizzazione dei plan key.

- `frontend/package.json`
  Rende esplicito stack frontend, librerie e script disponibili.

- `frontend/src/pages/LandingPage.js`
- `frontend/src/pages/RegisterPage.js`
- `frontend/src/pages/LoginPage.js`
- `frontend/src/pages/PaymentSuccessPage.js`
  File utili per confermare il perimetro pubblico e i flussi di autenticazione / pagamento.

- `frontend/e2e/dashboard-conversion.spec.js`
- `frontend/e2e/auth-and-checkout.spec.js`
- `frontend/e2e/advanced-operational-flows.spec.js`
  Test E2E Playwright utili per confermare flussi utente reali.

### Preview/documentazione estesa frontend

- `frontend/src/_split_preview/App.js`
- `frontend/src/_split_preview/DashboardPage.js`
- `frontend/src/_split_preview/dashboard_sections/04_settings.js`

Questi file mostrano una rappresentazione piu' granulare della UI e di alcune aree funzionali avanzate, comprese funzioni backend non ancora esposte nella dashboard principale.

### Backend

- `backend/server.py`
  File piu' importante per la ricostruzione funzionale. Contiene configurazione, modelli, limiti piano, pricing, API pubbliche, gestione sicurezza, account, sessioni, passkeys, alias, inbox, vault, deleghe, billing, analytics e webhooks.

### Browser extension

- `browser-extension/README.md`
  Documento di comportamento e installazione dell'estensione browser OTP autofill.

- `browser-extension/manifest.json`
- `browser-extension/background.js`
- `browser-extension/content-script.js`
- `browser-extension/options.js`

## Informazioni chiave ricavate dalle fonti

Dalle fonti sopra si conferma che Heirline e':
- una web app per la gestione sicura di OTP, account e second factor
- integrata con provider esterni come Twilio e Stripe
- dotata di piani commerciali con limiti runtime diversi
- arricchita da funzioni di sicurezza avanzata
- estesa da una browser extension per autofill OTP
- dotata di una vera dashboard account utente, non solo di una inbox OTP

## Chiarimento metodologico

Quando due fonti non coincidevano perfettamente:
- il backend e' stato trattato come riferimento principale per le funzioni effettivamente previste
- il frontend principale e' stato trattato come riferimento per l'esperienza utente corrente
- la preview/documentazione estesa e' stata trattata come supporto per le aree piu' avanzate o meglio articolate
- il PRD storico e' stato trattato come contesto, non come fonte di verita' finale

## Uso consigliato di questa cartella

Questa cartella puo' essere usata come:
- base per consegna cliente
- supporto per relazione tecnica
- materiale introduttivo per collaboratori non tecnici
- documentazione preliminare per audit o handoff
- riferimento rapido per distinguere cosa e' gia' in UI, cosa e' in preview e cosa e' solo API
