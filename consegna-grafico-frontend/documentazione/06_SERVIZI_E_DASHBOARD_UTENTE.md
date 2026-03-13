# Servizi E Dashboard Utente

## Scopo

Questo documento elenca i servizi dal punto di vista dell'utente finale e distingue chiaramente:
- cosa e' visibile oggi nella dashboard principale
- cosa esiste a backend ma e' esposto solo via API o preview

## Dashboard principale

La route utente principale e' `/dashboard` e oggi contiene cinque aree:
- `Inbox`
- `Account`
- `Eredi`
- `Sicurezza`
- `Upgrade`

Questa e' la vera "visione utente" del prodotto nel runtime corrente.

### Comportamento iniziale della dashboard

- su desktop la navigazione principale usa una tablist sticky
- su mobile la navigazione primaria usa la bottom nav
- se l'account non ha ancora una chiave E2EE registrata, la dashboard forza l'attenzione sulla sezione `Sicurezza`
- questo non significa che il backend "accende" E2EE da solo: significa che il prodotto tratta la cifratura come setup obbligatorio, non come opzione secondaria

## Mappa servizi

| Area | Cosa puo' fare l'utente | UI principale | Note runtime / API |
| --- | --- | --- | --- |
| Accesso | registrazione, login password, login passkey, OTP email, OTP telefono, refresh, logout | Si | famiglia `/api/auth/*` |
| Sessioni browser | vedere sessioni attive, riconoscere il browser corrente, revocare singola sessione, disconnettere tutti | Si | `/api/auth/sessions`, `DELETE /api/auth/sessions/{session_id}` |
| Profilo account | vedere nome, email, piano, ruolo, copiare email, uscire dal browser corrente | Si | tab `Account` |
| Inbox OTP | leggere messaggi SMS, voice, email; filtrare per sorgente; limitare a solo OTP; copiare codici; segnare letti | Si | `/api/inbox`, `/api/inbox/{id}/read`, `/api/inbox/{id}` |
| Shared inbox | vedere OTP condivisi e registrare la lettura | Si | `/api/shared-inbox`, `/api/shared-inbox/{id}/read` |
| Team / Family sharing | concedere o revocare accesso inbox a un altro utente | Si | la UI principale usa `scope_type=all`; l'API supporta anche scope per numero o mittente |
| Passkeys | registrare, elencare e revocare passkeys | Si | `/api/account/passkeys/*`, login passkey in `/api/auth/passkeys/*` |
| Push su questo dispositivo | subscribe, unsubscribe e test notifica | Si | `/api/push/subscribe`, `/api/push/unsubscribe`, `/api/push/test` |
| Alias email inbound | creare alias dedicati, copiarli, disattivarli | Si | `/api/account/email-aliases` |
| E2EE locale | registrare chiave account, creare/sbloccare/bloccare vault locale, usare payload cifrati | Si | `/api/account/e2ee-status`, `/api/account/e2ee-key`, `/api/vault/*`; se manca la chiave account la dashboard mostra `E2EE richiesta` |
| Policy OTP | abilitare auto-delete, masking OTP, whitelist mittenti, bypass whitelist | Si | `/api/account/otp-policy`, `/api/account/otp-policy/whitelist/bypass` |
| Mittenti trusted | aggiungere e rimuovere mittenti in whitelist | Si | `/api/senders/whitelist` |
| TOTP integrato | importare account TOTP, generare codici, cancellare entry | Si | `/api/totp`, `/api/totp/codes`; le nuove entry protette richiedono E2EE attiva e vault sbloccato |
| Audit log | leggere audit account, accessi OTP e log autofill | Si, ma dipende da piano/ruolo | `/api/account/audit-log`, `/api/account/otp-access-log`, `/api/account/otp-autofill-log` |
| Alert sicurezza | vedere alert aperti e risolverli | Si, solo admin | `/api/security/alerts`, `/api/security/alerts/{id}/resolve` |
| Kill Switch | congelare l'account con step-up password e opzione wipe messaggi | Si, solo piano Control | `/api/panic/freeze` |
| Eredi digitali | aggiungere, revocare, annullare rilascio, monitorare grace period | Si | `/api/account/delegates/*`, `/api/delegates/access/{access_key}`; create/revoke/override richiedono step-up, e la creazione protetta richiede E2EE pronta |
| Checkout e upgrade | leggere piano attuale, confrontare tier, avviare checkout, confermare stato pagamento | Si | `/api/plans`, `/api/account/plan`, `/api/payments/checkout`, `/api/payments/status/{session_id}` |
| Simulazione OTP | generare OTP demo per riempire inbox | Si in ambiente demo | `/api/demo/simulate-otp` |

## Servizi presenti nel backend ma non esposti completamente nella UI principale

- `user_devices`: esiste CRUD dedicato per inventario device (`/api/account/devices`), ma la dashboard principale oggi mostra soprattutto le sessioni auth del browser.
- `otp-stream domains`: il backend permette di gestire i domini trusted per l'autofill browser (`/api/account/otp-stream/domains`), ma questo pannello oggi e' nella preview `_split_preview`, non nella dashboard principale.
- shared access scoped: l'API supporta `scope_type=all|number|sender`, mentre la UI principale crea solo condivisioni globali dell'inbox.
- analytics funnel e export CSV: presenti lato admin/backend, non nella UX utente standard.

## Integrazioni che toccano l'esperienza utente

- Twilio: SMS inbound, voice inbound, transcription e OTP telefonico reale.
- Email inbound: alias dedicati che portano i messaggi direttamente nella inbox Heirline.
- Stripe: checkout, stato pagamento, upgrade piano.
- Web Push: notifiche browser sul dispositivo corrente.
- WebAuthn: accesso e step-up con passkeys.
- Browser extension MV3: stream OTP realtime e tentativo di autofill sui domini autorizzati.

## Nota operativa

Quando c'e' differenza tra:
- backend disponibile
- preview `_split_preview`
- UI principale eseguibile

la dashboard principale descrive l'esperienza utente corrente, mentre il backend descrive il perimetro servizi complessivo del prodotto.

Nel runtime attuale questo significa anche che:
- l'utente vede davvero una sezione account con sessioni/passkeys/push
- le funzioni sensibili sono collegate a step-up e a stato E2EE reale
- la documentazione della dashboard deve seguire la UI mobile reale, non solo la tablist desktop
