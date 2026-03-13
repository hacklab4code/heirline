# Indice Documentazione Operativa E Funzionale

Questa cartella raccoglie una descrizione formale e ordinata del progetto **Heirline**, con taglio sia descrittivo sia tecnico, ma con un focus piu' esplicito sui servizi realmente presenti nel runtime corrente.

## Scopo della cartella

L'obiettivo e' fornire una documentazione leggibile anche in contesti non strettamente di sviluppo:
- presentazione generale del prodotto
- spiegazione di cosa serve e cosa fa
- distinzione tra varianti del progetto e piani commerciali
- sintesi architetturale e operativa
- mappa dei servizi utente, delle integrazioni e dei confini tra UI principale e API

## File inclusi

1. `01_DESCRIZIONE_APPLICAZIONE.md`
   Descrizione generale del prodotto, del problema che risolve e del suo utilizzo.

2. `02_COSA_FA_LA_PIATTAFORMA.md`
   Elenco ragionato delle funzioni principali per area funzionale.

3. `03_VERSIONI_E_PIANI.md`
   Distinzione tra versioni/varianti del progetto e piani commerciali disponibili.

4. `04_ARCHITETTURA_TECNICA.md`
   Panoramica tecnica di frontend, backend, integrazioni e flussi operativi.

5. `05_FILE_E_FONTI_DI_RIFERIMENTO.md`
   Mappa dei file consultati nel repository per ricostruire la documentazione.

6. `06_SERVIZI_E_DASHBOARD_UTENTE.md`
   Catalogo concreto dei servizi visti dal lato utente, con distinzione tra UI principale, preview e API.

## Ordine di lettura consigliato

1. `01_DESCRIZIONE_APPLICAZIONE.md`
2. `03_VERSIONI_E_PIANI.md`
3. `02_COSA_FA_LA_PIATTAFORMA.md`
4. `04_ARCHITETTURA_TECNICA.md`
5. `05_FILE_E_FONTI_DI_RIFERIMENTO.md`
6. `06_SERVIZI_E_DASHBOARD_UTENTE.md`

## Nota metodologica

Questa documentazione e' stata ricostruita a partire dal codice e dai documenti gia' presenti nel repository. Quando esistono differenze tra:
- PRD storico
- README operativo
- frontend eseguibile attuale
- preview/documentazione estesa
- backend/API

prevale l'interpretazione piu' aderente a cio' che il repository mostra concretamente, con questa gerarchia:
- `backend/server.py` come fonte principale dei servizi e dei limiti runtime
- `frontend/src/App.js` e componenti dashboard come fonte principale della UX attuale
- `_split_preview` come fonte per servizi esistenti ma non ancora esposti nella UI principale

Per il bootstrap locale e le prove automatiche aggiornate vanno consultati anche:
- `README.md`
- `docs/security/security-overview.md`
- `docs/testing/local-verification.md`
