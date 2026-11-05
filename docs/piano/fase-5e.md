# Fase 5e — Lezione animata: testo, voce e crediti

**Modello: Opus · Effort: high · Durata: 2,5 h · Dipende da: 5d; Marco ha scelto la voce (D17); solo in locale (prosa)**

**Obiettivo.** Il copione definitivo, con i fatti verificati e la voce vera; i crediti della voce;
il componente nella lezione 3.

**Prompt di apertura**

```
Prima di tutto: questa fase richiede Opus con effort high. Se non stai girando su Opus, fermati e
dimmelo senza fare altro.

Esegui docs/piano/fase-5e.md. Leggi prima l’indice docs/piano.md (la decisione D17) e
docs/piano/convenzione-3d.md, poi l’«Esito» in fondo a docs/piano/fase-5d.md. Prima di
scrivere leggi .claude/norms/scrittura-didattica.md; a fine stesura fai la passata di
scrittura-umana.md e di scrittura-parlata.md §1. Se la riga D17 dell’indice non dice quale voce
usare, fermati e chiedilo a Marco.
```

**Prima della sessione (Marco).** Scegli la voce e scrivila nella riga D17 dell’indice (docs/piano.md):

- un servizio di sintesi vocale, con il tuo account e la chiave API in una variabile d’ambiente,
  mai nel repo. Hanno voci italiane ElevenLabs, Google Cloud TTS, Azure Speech e OpenAI; Piper è
  libero e gira in locale, ma suona più meccanico. Due minuti di narrazione sono circa 1 800
  caratteri, dentro il piano gratuito di qualunque servizio: contano la qualità e le condizioni
  d’uso dell’audio generato, da leggere prima di scegliere;
- oppure la tua voce: la sessione prepara il testo, tu registri un file per passo con i nomi di
  `durate.json`.

**Passi**

1. **Testo.** Una o due frasi per passo, scritte per essere ascoltate: frasi brevi, soggetto
   esplicito (`scrittura-parlata.md` §1). Durata totale fra 60 e 120 secondi.
2. **Fatti.** Ogni fatto storico o meccanico rimanda a una voce di `fonti.yaml`, con un campo
   `fonti` nel passo. In particolare l’ordine «prima avanza il rotore, poi si chiude il circuito» e
   la lampada accesa finché il tasto resta premuto: controllali su `crypto-museum-funzionamento`.
3. **Voce.** In `scripts/voce.ts` un adattatore per il servizio scelto (`--voce <nome>`), oppure i
   file registrati da Marco; `durate.json` rigenerato.
4. **Crediti.** Una voce nei crediti con servizio, voce, data e condizioni d’uso; se la voce è
   sintetica, sotto la scena la dicitura «voce sintetica».
5. **Lezione 3.** `<LezioneAnimata>` entra in `03-tastiera-lampade-e-circuito.mdx`, nel punto in
   cui il testo descrive il circuito. La lezione resta `stato: bozza`.
6. **Revisione.** Il copione lo rivede Marco; i fatti non confermati vanno in «Da verificare» di
   `docs/stato.md`.

**Criteri di accettazione**

```bash
pnpm lint:content
```
exit 0.

```bash
pnpm test
```
con un test che controlla che ogni passo abbia il suo audio in `durate.json` con l’hash del testo
corrente, che la durata totale stia fra 60 e 120 secondi e che gli audio pesino insieme meno di
1,5 MB.

```bash
pnpm verify && pnpm test:e2e
```
con il crawler dei link interni che include la lezione 3.

**Esito.** Da compilare: voce scelta e condizioni d’uso, durata totale, peso degli audio, fatti
rimasti da verificare.
