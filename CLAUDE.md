# Convenzioni del progetto

## Norme di contenuto condivise (workspace)

Le norme di contenuto di Marco (tono, tipografia, lessico, numeri) sono importate dal workspace tramite symlink interno (`.claude/norms -> ../../norms`):

@.claude/norms/contenuto.md

Le norme di **scrittura** non si importano: pesano sul contesto di ogni sessione, comprese quelle che non scrivono una riga di prosa. Si leggono quando servono, dal percorso `.claude/norms/`:

| Quando                                              | Norma                                                                     |
| --------------------------------------------------- | ------------------------------------------------------------------------- |
| prima di scrivere una lezione o un esercizio        | `scrittura-didattica.md`                                                  |
| prima di scrivere un piano, una procedura, un README | `scrittura-tecnica.md`                                                    |
| a fine stesura, come passata di verifica            | `scrittura-umana.md` (norma madre anti-slop)                              |
| a fine stesura, dopo l’anti-slop                    | `scrittura-parlata.md` §1: soggetti e referenti espliciti                 |

Il symlink esiste solo in locale (è in `.gitignore`): nel cloud `norms/` non è raggiungibile. **Il lavoro sui testi si fa solo in locale**; una sessione cloud può toccare il codice, non la prosa.

## Il progetto

Sito Astro + React + TypeScript (Tailwind, MDX), pubblicato su GitHub Pages sotto `/enigma/`. Il piano completo è in `docs/piano.md`.

## Comandi

- `pnpm dev` — server di sviluppo
- `pnpm verify` — lint, formattazione, regole tipografiche, tipi, unit test e build (da far passare prima di ogni push)
- `pnpm test:e2e` — test Playwright con axe (richiede `pnpm build`)
- `pnpm test:lighthouse` — budget Lighthouse: prestazioni ≥ 90, accessibilità 100, a desktop e a 375 px (richiede `pnpm build`; le pagine stanno in `scripts/pagine.ts`)

Node ≥ 22.23.4 (vedi `.nvmrc`), pnpm 10.

## Regole

- `src/engine/` è TypeScript puro: nessuna dipendenza, nessun accesso a DOM, React o Astro (lo impone ESLint).
- I link interni passano da `url()` in `src/lib/url.ts`, per rispettare `base`.
- I colori e i font si usano solo tramite i design token di `src/styles/tokens.css`.
- I testi in `src/content/` seguono le regole tipografiche italiane controllate da `pnpm lint:content`: virgolette « » per le citazioni e “ ” per quelle interne a una citazione (l’eccezione dei caporali vale solo per Python Doesn’t Byte), apostrofo ’, trattino lungo — per gli incisi, titoli con maiuscola solo iniziale, acronimi senza punti, `…` e non tre punti, numeri fino a dieci in lettere, cifre a gruppi di tre con lo spazio non separabile, matematica in `<Formula>`, mai «sennò» né «qual’è». I nomi propri ammessi nei titoli e dopo i due punti si elencano in `scripts/nomi-propri.txt`.
- Le lezioni nuove nascono con `stato: bozza`; solo l’autore le porta a `rivista`.
- Ogni immagine di terzi ha una voce in `src/content/immagini.yaml`; sono ammesse solo licenze PD, CC0, CC BY e CC BY-SA.
- Ogni fatto storico nei testi rimanda a una voce di `src/content/fonti.yaml`.

## Lo scheletro della lezione

Decisione D3 di `docs/piano-aggiornamento.md`: le lezioni di «Come funziona» hanno lo scheletro
completo di `scrittura-didattica.md` §7; quelle di Storia solo obiettivi e riepilogo. I componenti
stanno in `src/components/lesson/` e si importano nell’MDX come gli altri.

| Componente | Dove va | Quando si usa |
| --- | --- | --- |
| `<Citazione fonte="id" pagina="12">` | subito dopo gli import, prima dell’aggancio | citazione d’apertura, oppure citazione breve nel testo. `fonte` è un id di `fonti.yaml` (senza voce la build si ferma); `autore` solo se chi parla non è l’autore della fonte; `tradotta` se la traduzione è nostra; `lingua="de"` per un testo non italiano. La citazione d’apertura la sceglie Marco fra tre proposte vere |
| `<Prerequisiti>` | dopo l’aggancio | elenco di ciò che serve sapere, ogni voce con il link alla lezione che lo spiega. Solo «Come funziona» |
| `<Obiettivi>` | dopo i prerequisiti (in Storia dopo l’aggancio) | elenco di ciò che lo studente sa fare alla fine, con verbi operativi; non anticipa l’esito di una previsione |
| `<Previsione>` | prima del componente interattivo che la verifica | quando l’esito si può sbagliare: lo studente sceglie fra le `<Risposta testo="…">` (una `corretta`) o, con `libera`, scrive la risposta. Il corpo di una `Risposta` sbagliata dice quale idea porta a darla; `<Esito>` spiega o rimanda al componente. La prosa che segue non deve dare il risultato prima della domanda |
| `<Riepilogo>` | in fondo alla lezione | per ogni obiettivo, il risultato a cui la lezione è arrivata, nello stesso ordine |

La domanda, i commenti e l’esito di una `Previsione` stanno nel corpo, non negli attributi: così
li controlla `pnpm lint:content`. Il `testo` di una `Risposta` è un’etichetta breve.
