# Descrizione Dell'Applicazione

## Nome del progetto

**Heirline**

## Definizione sintetica

Heirline e' una piattaforma web per ricezione, segregazione e governo di OTP, messaggi sensibili e accessi second factor. Il sistema centralizza questi contenuti in un ambiente controllato, separato dal numero telefonico o dall'email personale dell'utente, e li collega a una dashboard di sicurezza con funzioni operative.

## Problema che il prodotto intende risolvere

Molti utenti ricevono codici OTP tramite:
- SMS
- chiamate vocali
- email

Questi canali, pur essendo diffusi, presentano criticita' operative e di sicurezza:
- dispersione dei codici su piu' canali
- esposizione del numero personale
- rischio di accessi non autorizzati
- mancanza di storico e tracciamento
- difficolta' nel gestire emergenze, dispositivi multipli o deleghe

Heirline nasce per ridurre tali rischi creando una **cassaforte OTP** con regole di sicurezza piu' rigorose rispetto ai flussi tradizionali.

## A cosa serve

L'applicazione serve a:
- ricevere i codici OTP in un unico punto controllato
- proteggere i contenuti sensibili con misure di hardening
- gestire l'identita' utente con sessioni attive, passkeys, alias email e notifiche push
- distribuire l'accesso su piu' browser e dispositivi in modo governato
- applicare policy di sicurezza su mittenti, lettura, conservazione e condivisione dei messaggi
- tracciare sessioni, eventi, accessi, autofill e anomalie
- consentire deleghe o accessi di emergenza in scenari di inattivita' o eredita' digitale

## Utente target

Il prodotto sembra pensato per:
- utenti privati con forte sensibilita' alla sicurezza
- utenti che ricevono OTP per servizi critici
- profili con piu' dispositivi
- utenti che desiderano accesso delegato o eredita' digitale
- contesti in cui audit, compartimentazione e controllo dei canali di ricezione sono considerati importanti

## Come funziona in pratica

In termini operativi, il flusso e' questo:

1. l'utente crea o usa un account Heirline
2. il sistema gestisce canali dedicati di ricezione via SMS, voice o alias email
3. i messaggi in ingresso vengono acquisiti dal backend
4. i contenuti vengono mostrati nella dashboard in una inbox protetta
5. l'utente applica regole come whitelist, masking, autodistruzione, cifratura o condivisione controllata
6. dalla dashboard puo' anche vedere sessioni attive, gestire passkeys, attivare push e creare alias email
7. nei piani piu' avanzati puo' aggiungere eredi, shared inbox, audit e funzioni di emergenza

## Posizionamento del prodotto

Heirline non e' una semplice inbox per SMS. E' piuttosto un sistema ibrido tra:
- inbox OTP
- pannello di sicurezza account
- strumento di delega/eredita' digitale
- piattaforma di governance per codici di autenticazione

## Esperienza utente prevista

Dal frontend attuale si ricava una UX composta da:
- landing marketing con pricing e CTA
- login con password, passkey, OTP email e OTP telefono
- dashboard con tabs operative `Inbox`, `Account`, `Eredi`, `Sicurezza`, `Upgrade`
- setup di sicurezza, gestione account e gestione sessioni
- sezione upgrade con checkout
- pagina di ritorno post-pagamento

## Visione utente effettiva oggi

La dashboard principale non e' solo una inbox OTP. Oggi espone queste aree:
- `Inbox`: messaggi SMS, voice ed email, filtri sorgente, copia OTP, shared inbox e simulazione demo
- `Account`: profilo, piano, sessioni attive, logout browser, passkeys, notifiche push e alias email
- `Eredi`: creazione, revoca e override delle deleghe con logica di rilascio differito
- `Sicurezza`: E2EE locale, policy OTP, whitelist mittenti, TOTP, audit log, alert admin e kill switch
- `Upgrade`: confronto tier e attivazione checkout

## Ambiti principali coperti dal prodotto

I moduli piu' importanti sono:
- autenticazione e sessioni
- area account utente
- inbox OTP e inbox condivisa
- sicurezza account
- cifratura end-to-end lato client
- deleghe ed eredi digitali
- pagamenti e upgrade
- notifiche push
- estensione browser per autofill OTP
- monitoraggio e analytics amministrativi

## Limite importante da chiarire

Nel repository non e' presente uno storico Git delle release, quindi non e' possibile ricostruire con certezza una sequenza ufficiale di versioni cronologiche come "v1", "v2", "v3". La documentazione distingue quindi:
- varianti tecniche del progetto
- modalita' operative demo/produzione
- piani commerciali dell'applicazione

Inoltre, non tutti i servizi backend hanno la stessa visibilita' nella UI principale: alcuni moduli esistono gia' come API o preview e sono comunque parte del perimetro prodotto.
