# Consegna Grafico Frontend

Questa cartella contiene i file frontend da mandare al grafico per lavorare su tutte le sezioni del sito senza portarsi dietro `node_modules`, build e backend.

## Cosa c'e dentro

- `frontend/src/pages/`: pagine pubbliche e flusso checkout
- `frontend/src/components/app/`: layout auth e navbar
- `frontend/src/components/dashboard/`: tutte le sezioni della dashboard
- `frontend/src/components/ui/`: componenti UI base riusati nelle schermate
- `frontend/src/App.js`: routing, shell dashboard, tab desktop e bottom nav mobile
- `frontend/src/index.css` e `frontend/src/App.css`: stile globale, palette, tipografia, component tokens
- `frontend/tailwind.config.js`, `frontend/craco.config.js`, `frontend/components.json`, `frontend/jsconfig.json`: configurazione frontend utile per ricostruire il look
- `documentazione/06_SERVIZI_E_DASHBOARD_UTENTE.md`: mappa funzionale della dashboard
- `design_guidelines.json`: linee guida visuali già presenti nel progetto

## Mappa completa sezioni sito

### Pagine pubbliche

1. Landing page
   File: `frontend/src/pages/LandingPage.js`
   Include: hero, highlights, features, pricing, CTA finali.

2. Registrazione
   File: `frontend/src/pages/RegisterPage.js`
   Supporto layout: `frontend/src/components/app/AuthLayout.js`

3. Login
   File: `frontend/src/pages/LoginPage.js`
   Supporto layout: `frontend/src/components/app/AuthLayout.js`
   Include: login password, passkey, recovery.

4. Payment success / stato checkout
   File: `frontend/src/pages/PaymentSuccessPage.js`

5. Navbar pubblica e autenticata
   File: `frontend/src/components/app/Navbar.js`

### Dashboard

La shell della dashboard sta in `frontend/src/App.js`.
Qui trovi:

- hero/sommario iniziale dashboard
- tablist sticky desktop
- bottom navigation mobile
- montaggio delle sezioni sotto

Sezioni operative:

1. Inbox
   File: `frontend/src/components/dashboard/DashboardInboxTab.js`
   Include: filtri SMS/Voice/Email, solo OTP, shared inbox, condivisione Team/Family.

2. Account
   File: `frontend/src/components/dashboard/DashboardAccountTab.js`
   Include: profilo, sessioni, passkeys, alias email, notifiche push.

3. Eredi digitali
   File: `frontend/src/components/dashboard/DashboardDelegatesTab.js`

4. Sicurezza
   File: `frontend/src/components/dashboard/DashboardSettingsTab.js`
   Include: E2EE, policy OTP, whitelist, TOTP, audit, alert, kill switch.

5. Note sicure
   File: `frontend/src/components/dashboard/DashboardSecureNotesSection.js`
   E' una sottosezione della tab Sicurezza.

6. Upgrade / pricing interno
   File: `frontend/src/components/dashboard/DashboardUpgradeTab.js`

7. Admin
   File: `frontend/src/components/dashboard/DashboardAdminTab.js`
   Visibile solo per utenti admin.

## File da guardare per primi

- `frontend/src/App.js`
- `frontend/src/pages/LandingPage.js`
- `frontend/src/pages/LoginPage.js`
- `frontend/src/pages/RegisterPage.js`
- `frontend/src/pages/PaymentSuccessPage.js`
- `frontend/src/components/dashboard/DashboardInboxTab.js`
- `frontend/src/components/dashboard/DashboardAccountTab.js`
- `frontend/src/components/dashboard/DashboardDelegatesTab.js`
- `frontend/src/components/dashboard/DashboardSettingsTab.js`
- `frontend/src/components/dashboard/DashboardUpgradeTab.js`
- `frontend/src/components/dashboard/DashboardAdminTab.js`
- `frontend/src/index.css`
- `frontend/src/App.css`

## Nota pratica

Se al grafico servono solo schermate e struttura UX, puo ignorare quasi tutti i file in `frontend/src/components/ui/`.
Se invece deve passare un handoff preciso a chi implementa, quella cartella va tenuta perche contiene i building block riusati dalle schermate.
