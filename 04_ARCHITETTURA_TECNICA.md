# Architettura Tecnica

## 1. Struttura generale

Heirline e' organizzato come applicazione web con architettura separata:
- **frontend** React
- **backend** FastAPI
- **database** MySQL remoto
- **integrazioni esterne** Twilio, Stripe, Web Push

Il progetto e' pensato per esecuzione locale durante sviluppo e per configurazione piu' restrittiva in produzione.

## 2. Runtime locale reale usato nel repository

Nel runtime locale corrente risultano usate queste porte:
- frontend build statico servito da PHP su `http://127.0.0.1:3010`
- backend FastAPI su `http://127.0.0.1:8000`
- opzione alternativa di sviluppo: React dev server su `3000` o `3001`

Questa distinzione e' importante perche' la documentazione operativa deve riflettere sia l'avvio demo rapido sia il bundle statico usato nelle prove locali.

## 3. Frontend

Dal repository il frontend risulta basato su:
- React 19
- React Router
- Tailwind CSS
- componenti UI di area Shadcn/Radix
- Axios per chiamate API
- Motion per animazioni

### Ruolo del frontend

Il frontend gestisce:
- routing pubblico e autenticato
- visualizzazione della dashboard
- login e gestione token
- configurazione sicurezza lato utente
- interazioni con checkout e setup
- porzioni di logica E2EE lato client

### Moduli utente principali

La UI principale e' organizzata attorno a questi moduli:
- landing pubblica
- pagine `register`, `login`, `payment-success`
- dashboard con tab `Inbox`, `Account`, `Eredi`, `Sicurezza`, `Upgrade`
- componenti dedicati per sessioni, passkeys, push, alias email, TOTP, audit e kill switch

Dal punto di vista runtime:
- su desktop la dashboard usa una tablist sticky
- su mobile la stessa navigazione e' esposta come bottom nav
- se l'account non ha ancora una chiave E2EE registrata, il frontend forza il focus iniziale su `Sicurezza`

La cartella `_split_preview` mostra moduli aggiuntivi o piu' granulari, fra cui i domini browser autofill.

## 4. Backend

Il backend e' realizzato in Python con FastAPI e concentra la business logic.

### Compiti del backend

Il backend si occupa di:
- autenticazione
- gestione utenti, sessioni e limiti piano
- ricezione dei messaggi dai provider
- esposizione inbox e stream realtime
- politiche di sicurezza
- deleghe ed emergenza
- vault cifrato
- pagamenti
- KPI e tracking

### Caratteristiche operative

Sono presenti nel backend:
- rate limiting
- security headers
- CORS configurabile
- session lifecycle
- logging eventi di sicurezza
- scheduler per job periodici

### Famiglie di endpoint

Il backend espone famiglie di servizi abbastanza nette:
- pubblici/commerciali: `health`, `plans`, `landing/hero-variant`
- auth e sessioni: `register`, `login`, `refresh`, `logout`, `sessions`, `step-up`, passkeys, OTP email/telefono
- inbox e sharing: inbox personale, shared inbox, shared access, stream token, stream SSE, autofill audit
- account e sicurezza: piano, passkeys account, E2EE, vault, numeri, burner, alias email, dispositivi, OTP policy, whitelist, deleghe, TOTP, panic freeze, audit log, alert
- billing e analytics: checkout, payment status, Stripe webhook, dashboard stats, analytics funnel ed export CSV
- webhooks inbound: Twilio SMS, Twilio voice, transcription, email inbound

### Job in background

Dal codice risultano attivi job periodici per:
- cleanup OTP scaduti
- controllo inattivita' utenti / deleghe
- controllo alert di sicurezza

## 5. Database

La persistenza e' demandata a MySQL.

Dal PRD e dal backend emergono tabelle e domini come:
- users
- devices
- phone_numbers
- inbound messages
- delegates
- passkeys
- pricing plans
- payment transactions
- vault snapshots
- event logs
- security alerts
- email aliases
- otp stream allowed domains
- shared OTP access grants
- TOTP entries
- auth sessions / refresh token state

Il database rappresenta quindi sia il livello transazionale sia il livello di audit e analytics.

## 6. Integrazioni esterne

### Twilio

Usato per:
- inbound SMS
- inbound voice
- eventuale gestione OTP reali
- trascrizioni o flussi vocali collegati

### Stripe

Usato per:
- creazione checkout
- conferma pagamento
- aggiornamento piano utente
- webhook di pagamento

### Web Push

Usato per:
- registrazione subscription browser
- invio notifiche realtime

### WebAuthn / Passkeys

Usato per:
- login resistente al phishing
- step-up authentication
- registrazione e revoca credenziali passkey

### Browser Extension MV3

Usata per:
- richiedere stream token OTP
- aprire stream SSE realtime
- tentare autofill su domini autorizzati
- inviare audit di utilizzo

## 7. Flussi funzionali principali

### Flusso di accesso

1. l'utente apre la web app
2. esegue login con password, passkey o recovery
3. ottiene access token e refresh token
4. accede alla dashboard

### Flusso OTP

1. il provider invia il messaggio al backend
2. il backend salva, normalizza e categorizza il messaggio
3. il frontend recupera la inbox via API
4. l'utente legge, filtra o copia il codice
5. opzionalmente il sistema pubblica eventi realtime o push

### Flusso sessioni / browser

1. l'utente effettua login
2. il backend registra una sessione e un refresh token
3. la dashboard mostra le sessioni attive
4. l'utente puo' revocare singole sessioni o tutte le sessioni remote

### Flusso browser autofill

1. l'estensione chiede un token stream al backend
2. apre una connessione SSE
3. riceve evento OTP
4. prova a compilare il campo del sito autorizzato
5. invia audit di utilizzo

### Flusso E2EE

1. l'utente registra una chiave pubblica account e crea il vault locale del browser
2. il browser conserva la chiave privata protetta da passphrase, che non lascia il client
3. se E2EE non e' ancora attiva, la dashboard segnala `E2EE richiesta` e porta l'utente in `Sicurezza`
4. il backend riceve solo payload cifrati o metadati necessari
5. la lettura dei contenuti protetti avviene localmente solo dopo sblocco del vault
6. TOTP protetti e nuove deleghe cifrate richiedono E2EE pronta, non solo la presenza di un account attivo

### Flusso alias email

1. l'utente crea un alias dedicato
2. i messaggi inbound arrivano al backend
3. il backend li normalizza come inbox entry
4. la dashboard li mostra insieme a SMS e voice

### Flusso delega / eredita'

1. l'utente definisce delegati o eredi
2. il sistema monitora lo stato e le regole di inattivita'
3. in caso di scenario previsto vengono applicati warning e grace period
4. l'accesso delegato viene rilasciato secondo la policy stabilita

## 8. Confine tra UI principale, preview e API

La parte backend appare piu' ricca della UI principale attuale. In pratica:
- alcune funzioni sono esposte e gestibili nella dashboard principale
- alcune funzioni sono gia' presenti nella preview `_split_preview`
- alcune funzioni esistono oggi solo come API backend

Esempi concreti:
- sessioni browser: visibili nella UI principale
- `user_devices`: presenti in API, meno evidenti nella UI principale
- domini browser autofill: presenti in API e preview, non nella UI principale
- analytics funnel: presenti a backend, non parte della UX utente standard

## 9. Stato di maturita' desumibile

Il progetto mostra un livello superiore a un semplice mockup, perche' include:
- backend articolato
- test backend
- test E2E frontend
- integrazioni provider reali
- gestione sicurezza abbastanza estesa

Allo stesso tempo mantiene elementi di:
- demo
- simulazione
- preview di refactor o di espansione funzionale

Per questo puo' essere definito come un prodotto in stato avanzato di MVP evoluto o piattaforma applicativa quasi production-ready, a seconda della qualita' della configurazione ambiente.

## 10. Verifica automatizzata corrente

Nel repository risultano oggi usate e mantenute queste verifiche:
- `backend/.venv/bin/pytest -q`
- `frontend/yarn lint`
- `frontend/yarn build`
- Playwright su:
  - `e2e/dashboard-conversion.spec.js`
  - `e2e/auth-and-checkout.spec.js`
  - `e2e/advanced-operational-flows.spec.js`

Le prove E2E coprono non solo la dashboard base, ma anche:
- gating E2EE reale
- TOTP end-to-end
- deleghe con step-up password
- kill switch
- funnel auth e ritorno checkout
