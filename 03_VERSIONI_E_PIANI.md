# Versioni E Piani

## Premessa

Nel progetto la parola "versioni" puo' essere interpretata in tre modi diversi:

1. versioni tecniche o varianti del prodotto
2. modalita' operative dell'ambiente
3. piani commerciali assegnati agli utenti

Per evitare confusione, questo documento le separa.

## A. Varianti tecniche del progetto

### 1. Web app principale

E' la versione applicativa principale visibile in `frontend/src/App.js`.

Include:
- landing
- registrazione
- login
- dashboard utente completa
- area account
- area sicurezza
- area eredi
- upgrade
- pagamento

E' la forma piu' diretta e immediatamente eseguibile del prodotto.

### 2. Variante documentata/preview estesa

Nel repository esiste una preview spezzata in file dentro `frontend/src/_split_preview/`.

Questa variante mostra in modo piu' esplicito:
- struttura interna della dashboard
- sezioni separate per inbox, account, delegates, settings, upgrade, KPI e security
- pannelli oggi non presenti nella UI principale, come i domini browser autofill
- componenti mobile come sticky conversion CTA e bottom navigation

Questa non sembra essere la versione di runtime principale, ma e' utile come riferimento funzionale, documentale e di refactor.

### 3. Estensione browser MVP

La cartella `browser-extension/` contiene una versione separata del prodotto, dedicata all'autofill OTP nel browser.

Non sostituisce la web app, ma la estende con un modulo operativo specializzato.

### 4. Backend API centrale

Il backend in `backend/server.py` rappresenta la parte piu' completa del dominio funzionale:
- auth
- inbox
- stream realtime
- vault
- deleghe
- pagamenti
- KPI
- sicurezza

Dal punto di vista delle funzionalita', il backend e' la fonte piu' ampia del progetto.

## B. Modalita' operative dell'ambiente

### 1. Modalita' demo / sviluppo locale

Questa modalita' e' pensata per test e presentazione. Puo' includere:
- endpoint demo
- simulazione OTP
- provider reali non obbligatori
- maggiore tolleranza di configurazione

Serve per mostrare il prodotto e svilupparlo localmente.

### 2. Modalita' produzione

Questa modalita' impone una configurazione reale e piu' rigida:
- secret forti
- CORS esplicito
- Twilio configurato
- Stripe configurato
- controlli di hardening
- vincoli su flag demo

Serve all'uso effettivo del servizio.

## C. Piani commerciali dell'applicazione

Il progetto distingue chiaramente piu' livelli di servizio. Nel runtime corrente convivono:
- chiavi piano tecniche: `pending`, `silver`, `gold`, `elite`
- nomi pubblici in UI: `Checkout`, `Vault`, `Shield`, `Control`
- alias legacy: `free`, `starter`, `pro`, `team`

### 1. Base / Pending / Checkout

Il piano base dell'account e' il livello minimo prima dell'attivazione commerciale.

Caratteristiche principali:
- accesso, login e dashboard base
- inbox personale
- gestione sessioni browser
- nessun alias email
- nessun TOTP
- nessun erede
- nessuna whitelist avanzata
- nessun kill switch
- nessuna passkey
- nessun audit avanzato

### 2. Vault (`silver`)

`silver` e' il primo livello pagato ed e' mostrato in UI come `Vault`.

Caratteristiche principali:
- fino a 3 dispositivi runtime
- TOTP
- alias email inbound
- notifiche push
- nessun erede
- niente passkeys
- niente kill switch

### 3. Shield (`gold`)

`gold` e' il tier centrale ed e' mostrato in UI come `Shield`.

Caratteristiche principali:
- tutto cio' che offre Vault
- 1 numero account
- 1 numero burner
- 1 erede digitale
- fino a 5 dispositivi runtime
- whitelist mittenti
- autodistruzione OTP
- voice-to-text
- alias email
- nessuna passkey
- nessun kill switch

### 4. Control (`elite`)

`elite` e' il livello massimo ed e' mostrato in UI come `Control`.

Caratteristiche principali:
- tutto cio' che offre Shield
- fino a 3 eredi
- fino a 10 dispositivi runtime
- fino a 10 alias email
- shared inbox / team sharing
- audit log account e autofill
- passkeys
- kill switch
- hardening operativo superiore

## D. Alias legacy dei piani

Nel backend sono presenti anche alias storici:
- `free` viene normalizzato a `pending`
- `starter` corrisponde sostanzialmente a `silver`
- `pro` corrisponde sostanzialmente a `gold`
- `team` corrisponde sostanzialmente a `elite`

Questi nomi sembrano derivare da una nomenclatura precedente, mantenuta per compatibilita'.

## E. Matrice servizi per piano

Questa matrice segue i limiti runtime correnti di `PLAN_LIMITS` e del catalogo frontend.

| Servizio | Base / pending | Vault / silver | Shield / gold | Control / elite |
| --- | --- | --- | --- | --- |
| Dashboard, login, inbox personale | Si | Si | Si | Si |
| Gestione sessioni browser | Si | Si | Si | Si |
| Alias email inbound | No | fino a 3 | fino a 5 | fino a 10 |
| TOTP integrato | No | Si | Si | Si |
| Device capacity runtime | 0 | 3 | 5 | 10 |
| Numero account | No | No | 1 | 1 |
| Numero burner | No | No | 1 | 10 |
| Eredi digitali | No | No | 1 | 3 |
| Whitelist mittenti | No | No | Si | Si |
| Autodistruzione OTP | No | No | Si | Si |
| Audit log account | No | No | No | Si |
| Shared inbox / team sharing | No | No | No | Si |
| Passkeys | No | No | No | Si |
| Kill switch | No | No | No | Si |

## F. Nota importante sui piani

Nel repository esistono piu' strati che parlano dei piani:
- limiti runtime del backend
- catalogo pricing usato dalla UI
- copie marketing della landing

Quando c'e' differenza, per una documentazione tecnica fa fede il runtime corrente del codice.

## G. Chiarimento finale sul termine "tutte le sue versioni"

Se si parla di "tutte le versioni" di Heirline, nel repository si possono quindi distinguere:
- versione web principale
- versione preview/documentata
- versione estensione browser
- versione demo/sviluppo
- versione produzione
- versioni commerciali/piani: Base/Checkout, Vault, Shield, Control

Non emergono invece release cronologiche ufficiali numerate come `v1`, `v2` o `v3`, perche' nel pacchetto analizzato non e' presente lo storico Git del progetto.
