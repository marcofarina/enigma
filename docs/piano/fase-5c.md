# Fase 5c — Pagina 3D: schede dei pezzi

**Modello: Opus · Effort: high · Durata: 2,5 h · Dipende da: 5b; solo in locale (prosa)**

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
