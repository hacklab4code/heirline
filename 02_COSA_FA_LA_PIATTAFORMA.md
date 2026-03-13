# Cosa Fa La Piattaforma

Questo documento cataloga i servizi veri del prodotto per area funzionale, non solo le tab piu' visibili.

## 1. Landing, pricing e attivazione

La piattaforma espone una landing pubblica che mostra:
- proposta di valore
- piani commerciali
- CTA di registrazione o accesso
- hero variant e tracking conversione

Questa parte serve a presentare il prodotto e a spingere l'utente verso login, registrazione o upgrade.

## 2. Registrazione, accesso e recupero account

Heirline implementa piu' modalita' di accesso:
- registrazione email/password
- login email/password
- login passkey/WebAuthn
- accesso tramite OTP email
- accesso tramite OTP telefono
- refresh token, logout e revoca sessioni
- step-up authentication per azioni sensibili

## 3. Inbox OTP multicanale

Il cuore della piattaforma resta la inbox, che consente di:
- vedere messaggi ricevuti
- distinguere SMS, voice ed email
- filtrare per sorgente
- limitare la vista a "solo OTP"
- copiare il codice
- segnare messaggi come letti
- eliminare messaggi
- marcare mittenti come trusted

In ambiente demo e' disponibile anche la simulazione OTP.

## 4. Inbox condivisa e accesso Team / Family

La piattaforma non gestisce solo inbox personale. Supporta anche:
- condivisione controllata dell'inbox con altri utenti
- vista degli accessi concessi e ricevuti
- shared inbox separata dagli OTP personali
- audit della lettura dei messaggi condivisi

La UI principale oggi crea condivisioni globali; l'API supporta anche scope piu' fini per numero o mittente.

## 5. Area account utente

La dashboard principale contiene una vera area account, non solo una schermata OTP. L'utente puo':
- vedere profilo, email, ruolo e piano
- copiare la propria email
- vedere sessioni attive
- identificare il browser corrente
- disconnettere una sessione singola o tutte le sessioni
- uscire dal browser corrente

## 6. Passkeys, notifiche push e identita' del dispositivo

Nella stessa area account l'utente puo':
- registrare passkeys
- revocare passkeys esistenti
- controllare lo stato WebAuthn del browser
- attivare o disattivare notifiche push
- inviare una notifica di test

Questa parte copre la relazione tra account e browser in uso.

## 7. Alias email, numeri e perimetro di ricezione

Heirline gestisce diversi canali di ingresso:
- alias email inbound dedicati
- numeri account e numeri burner
- webhooks SMS e voice via Twilio
- trascrizioni voice
- stream OTP per browser extension

L'utente puo' gia' gestire gli alias email dalla UI principale. Numeri, burner e domini browser autofill risultano presenti come servizi backend, ma non tutti sono ancora cablati nella dashboard principale.

## 8. Sicurezza account e policy OTP

La piattaforma include controlli di sicurezza che vanno oltre la sola lettura dell'OTP:
- whitelist mittenti
- modalita' monitor/enforce whitelist
- bypass temporaneo della whitelist
- autodistruzione OTP
- masking OTP
- audit log
- log accessi OTP condivisi
- log eventi autofill
- alert di sicurezza
- risoluzione amministrativa degli alert
- kill switch / panic freeze

## 9. Vault E2EE e cifratura locale

Una parte critica del prodotto e' la cifratura end-to-end lato client. Il sistema permette di:
- attivare una chiave E2EE sull'account
- creare o sbloccare il vault locale del browser
- sincronizzare snapshot cifrati col backend
- riallineare o ruotare la chiave
- leggere alcuni payload solo localmente

Questo vale per messaggi sensibili, deleghe e TOTP protetti.
Nel runtime attuale, se l'account non ha ancora una chiave registrata, la dashboard segnala `E2EE richiesta` e porta l'utente nella sezione `Sicurezza`.

## 10. TOTP integrato

Oltre agli OTP ricevuti dall'esterno, Heirline gestisce anche TOTP propri:
- import di account TOTP
- generazione codici lato client
- copia codice
- rimozione entry

Il TOTP e' quindi parte della cassaforte, non un servizio esterno separato.

## 11. Deleghe, eredi digitali e continuita' operativa

Una delle aree distintive del progetto e' la gestione eredita' / delega:
- aggiunta e revoca eredi
- override del rilascio
- warning progressivi in caso di inattivita'
- grace period
- access key di emergenza
- endpoint di accesso delegato

Questa area colloca Heirline nel dominio della continuita' operativa personale e della digital legacy.

## 12. Billing, checkout e upgrade piano

Il sistema integra Stripe per:
- mostrare catalogo piani
- avviare checkout
- verificare lo stato della sessione di pagamento
- aggiornare il piano dell'account
- ricevere webhook Stripe

La dashboard principale contiene una tab `Upgrade` dedicata a questo flusso.

## 13. Browser extension e autofill OTP

Il repository include un'estensione browser MV3 che:
- richiede un token stream al backend
- apre uno stream SSE
- riceve eventi OTP
- tenta l'autocompilazione del campo OTP
- invia audit di utilizzo

I domini autorizzati per l'autofill sono gestiti a backend e nella preview estesa; non sono ancora esposti nella dashboard principale.

## 14. Analytics, KPI e monitoraggio amministrativo

Il backend espone servizi di analytics e controllo operativo:
- tracking eventi prodotto
- funnel analytics
- export CSV
- daily pulse
- alert operativi
- dashboard stats
- report di conversione

Questa parte e' soprattutto admin/backend e non coincide con la UX utente standard.

## 15. Modalita' demo e modalita' reale

Il progetto distingue tra:
- ambiente demo/sviluppo, con simulazioni e provider non obbligatori
- ambiente produzione, con vincoli piu' severi su provider, secret, CORS, passkeys e hardening

Heirline e' quindi pensato sia per demo locale sia per esercizio reale con integrazioni attive.

## Nota di perimetro

Per descrivere "tutti i servizi" bisogna distinguere tre livelli:
- servizi visibili oggi nella UI principale
- servizi visibili nella preview `_split_preview`
- servizi disponibili direttamente via API backend

La documentazione aggiornata tiene insieme tutti e tre i livelli, ma li separa per evitare ambiguita'.
