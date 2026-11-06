# Fase 5c — Pagina 3D: schede dei pezzi

**Modello: Opus · Effort: high · Durata: 2,5 h · Dipende da: 4n, 5g; solo in locale (prosa)**

**Obiettivo.** Toccando un pezzo, o scegliendolo da un elenco accessibile, si apre una scheda con
il suo nome, una spiegazione breve e il link alla lezione che lo tratta.

**Prompt di apertura**

```
Prima di tutto: questa fase richiede Opus con effort high. Se non stai girando su Opus, fermati e
dimmelo senza fare altro.

Esegui docs/piano/fase-5c.md. Leggi prima l’indice docs/piano.md e
docs/piano/convenzione-3d.md. Prima di scrivere le schede leggi
.claude/norms/scrittura-didattica.md; a fine stesura fai la passata di scrittura-umana.md e di
scrittura-parlata.md §1. Si lavora in locale: nel cloud le norme non sono raggiungibili.
```

**Passi**

1. **Dati.** `src/content/pezzi.yaml`, una voce per pezzo: `id` (il nome di un nodo, anche di un
   gruppo come `tastiera`), `nome`, `descrizione` (due o tre frasi, controllate da `lint:content`),
   `lezione` (percorso della lezione che lo spiega) e `fonti` se c’è un fatto storico. La scheda
   rimanda alla lezione, non la ripete.
2. **Interazione.** Il clic o il tocco su un nodo risale al primo antenato che ha una voce (il clic
   su `tasto_q` apre la scheda della `tastiera`), lo evidenzia e apre la scheda. Un elenco dei pezzi,
   navigabile da tastiera e leggibile da uno screen reader, fa lo stesso senza il mouse. Il focus
   passa alla scheda e torna all’elemento che l’ha aperta.
3. **Raccordo con l’esploso.** Dalla scheda un pulsante porta il selettore alla `fase` del pezzo, o
   del primo antenato che ce l’ha; per i pezzi senza `fase` il pulsante non c’è.
4. **Test di coerenza.** Un test unitario controlla che ogni `id` di `pezzi.yaml` sia un nodo del
   `.glb`, che ogni nodo con `fase` abbia una voce, che ogni `lezione` esista e che ogni `fonti` sia
   in `fonti.yaml`.
5. **Prosa.** Le schede nascono come bozza e le rivede Marco. I fatti non confermati da una fonte
   consultata vanno in «Da verificare» di `docs/stato.md`.

**Criteri di accettazione**

```bash
pnpm lint:content
```
exit 0.

```bash
pnpm verify && pnpm test:e2e
```
con un test che apre la scheda dall’elenco con la tastiera e controlla il link alla lezione, e il
crawler dei link interni che include le pagine nuove.

**Esito** (2026-11-06, Opus)

All’apertura Marco ha approvato le immagini della 5f, che è stata fusa in `main` prima di creare
`fase/5c`. Sul branch c’è anche il commit `b83b16f` di un’altra sessione (dominio
`enigma.rainbowbits.cloud`, `base: '/'`): entra in `main` con la 5c.

- **Dati.** `src/content/pezzi.yaml`, 21 schede nella collezione `pezzi` di `src/content.config.ts`
  (`fonti` come riferimenti: una fonte sbagliata ferma la build). Scarto dal passo 1: `id` è un nome
  breve della scheda (`anello`, `pannello-spine`) e i nodi stanno in `nodi`, perché una scheda copre
  più nodi (i tre anelli, le 26 lampade, i sei gruppi di contatti). La pagina risolve alla build
  titolo e indirizzo della lezione e le fonti (`src/pages/macchina/index.astro`); una lezione che
  non esiste ferma la build.
- **Interazione.** Pulsante «Pezzi» nel foglio, elenco e scheda al posto di «Messaggio», × ed Esc
  per chiudere, fuoco come in `docs/design.md`, «Come l’ha realizzata la 5c». Il clic su un pezzo
  risale al primo antenato con una scheda (`schedaDelClic` in `src/components/macchina/pezzi.ts`);
  le parti di un rotore contano da sole solo dalla fase «rotori aperti», prima aprono il rotore.
  **Scarto:** un clic su un tasto batte ancora la lettera e non apre la scheda della tastiera, che si
  apre dalla piastra dei tasti o dall’elenco: altrimenti non si potrebbe più battere col mouse. Il
  pezzo della scheda aperta ha un contorno di 3 px in `--signal-return` (`Outlines` di drei; in
  drei 10 il flag `screenspace` dà lo spessore in unità della mesh, non in pixel).
- **Raccordo con l’esploso.** «Smonta fino a «fase»», con la fase del primo nodo o del suo primo
  antenato che ce l’ha, letta da `userData` a modello caricato; niente pulsante per i pezzi fermi
  (lampade, pannello, ruota d’ingresso, nottolini, cassa…) e prima di «Avvia la vista 3D».
- **Test di coerenza.** `src/components/macchina/pezzi.test.ts` legge il blocco JSON del `.glb` e
  controlla nodi, nodi con `fase`, lezioni e fonti, più i conti del clic sul modello vero
  (aggiunta la dipendenza di sviluppo `yaml`). La regola è scritta in `docs/piano/convenzione-3d.md`.
- **Prosa.** Schede in bozza, controllate su Crypto Museum (Enigma I, funzionamento, cablaggi) e sul
  Deutsches Technikmuseum. Cricchetto e barra dei tasti non hanno una fonte consultata: sono in «Da
  verificare» di `docs/stato.md` e le loro schede non hanno `fonti`. Passata di `scrittura-umana.md`
  e di `scrittura-parlata.md` §1 fatta (referenti espliciti nel rotore di destra, nella ruota
  d’ingresso e nel corpo del rotore).
- **E2e** in `tests/e2e/macchina.spec.ts`, «schede dei pezzi»: elenco e scheda solo da tastiera con
  il fuoco che torna dov’era e il link alla lezione; ogni scheda porta a una lezione che risponde
  (le schede sono montate da React, quindi il crawler dei link non le vede: questo test fa il suo
  lavoro sulle schede); «Smonta fino a» e axe con la scheda aperta; un clic sul modello, in vista
  «Pannello a spine», apre la scheda e Esc riporta il fuoco alla scena.
- **Resta a Marco:** rivedere le 21 schede; decidere se il clic su un tasto debba aprire la scheda
  della tastiera a macchina smontata, quando non batte.

- **Fuori dai passi:** `scripts/lighthouse.ts` e `scripts/schermate-3d.ts` puntavano ancora a
  `/enigma/`, che il cambio di dominio non aveva aggiornato; ora puntano alla radice.

Comandi eseguiti:

```bash
pnpm lint:content
pnpm verify && pnpm test:e2e
pnpm test:lighthouse
```

Esiti: `lint:content` 0 errori; `verify` verde (258 unit test, 10 nuovi in `pezzi.test.ts`); e2e
213 passati e 25 saltati (quelli che girano su un progetto solo); Lighthouse rispettato su tutte le
pagine, `/macchina/` 100 a desktop e **90** a 375 px (era 91 nella 5f: al limite del budget),
accessibilità 100 ovunque.
