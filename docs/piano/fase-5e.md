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

**Già fatto prima della fase** (2026-11-06, su richiesta di Marco, branch `testo-lezione-3d`).

- **Passata delle norme sul testo** (`scrittura-didattica.md` §8, `scrittura-umana.md`,
  `scrittura-parlata.md` §1) e allineamento con la lezione 3 e con `pezzi.yaml`: «deviatore» e
  «barra dei tasti» al posto di «contatto sotto il tasto» e «leva»; la corrente parte dalla batteria
  attraverso il deviatore della A, non «dal tasto»; la lampada si accende perché il deviatore del tasto
  K è a riposo, come nella lezione 3; i nottolini «non trovano una tacca sull’anello a cui appoggiano»,
  come nella lezione 5. Il passo `lampada` è diviso in due (`lampada` e `cifrata`): la lampada si
  accendeva alla fine dell’audio, mentre la voce diceva «si accende» a metà. Ora i passi sono 12, per
  101,8 s con la voce segnaposto. Restano da fare i passi 2–6 qui sotto: le fonti dei passi non ci sono
  ancora, e il testo lo rivede Marco.
- **Testo approvato da Marco** il 2026-11-09, così com’è in `src/content/lezione-3d/it.yaml` (12 passi,
  1 863 caratteri letti dalla voce). Il passo 6 resta da fare solo per i fatti: se la verifica delle
  fonti (passo 2) smentisce una frase, la correzione torna a Marco.
- **Voce importata** il 2026-11-09 (passo 3 fatto): Adriatico di ElevenLabs, 12 file generati da Marco
  sul sito e importati con `node scripts/voce.ts --da ~/Downloads` (AAC mono a 48 kbit/s). Durata
  131,5 s, peso 876 KB. Restano i passi 2, 4, 5 e 6; nei crediti (passo 4) vanno le condizioni del
  piano gratuito di ElevenLabs, che chiede l’attribuzione e vieta l’uso commerciale. Marco ha
  ascoltato la lezione sul server locale: l’audio va bene. Ci saranno correzioni all’animazione della
  camera, da fare in un secondo momento.
- **Campo `voce`** nel copione: il testo che legge la voce quando non è uguale al sottotitolo. Serve
  per i numeri romani («Enigma uno», «rotori uno, due e tre»), per le posizioni dei rotori («A, A, B»
  invece di «AAB», che una voce legge come una parola) e per i tag audio di ElevenLabs, che a schermo
  non vanno. L’impronta in `durate.json` è fatta sul testo della voce; `scripts/voce.ts` toglie i tag
  quando usa `say`, che li leggerebbe. Tag messi: due `[pause]`, prima di «Seguiamo la corrente» e
  prima di «I rotori passano ad A, A, C», e uno `[slowly]` sulla catena di lettere del ritorno.
  Nessun tag di emozione.
- **ElevenLabs** (verificato il 2026-11-06). I tag audio funzionano via API con Eleven v4
  (`eleven_v4`), v4 Turbo e v3; vanno fra parentesi quadre, prima delle parole su cui agiscono, e
  valgono finché non ne arriva un altro; `[pause]` e `[long pause]` sostituiscono l’SSML. La pagina di
  ElevenLabs non dice niente sull’italiano: i tag vanno ascoltati passo per passo. Il connettore MCP
  di ElevenLabs nel registro di Claude, a giudicare dalla descrizione e dai nomi degli strumenti, serve
  a gestire gli agenti vocali (ElevenAgents), non a generare un file audio da un testo: l’adattatore di `voce.ts` chiama direttamente l’API di sintesi, con la chiave in
  `ELEVENLABS_API_KEY`. Con un file per passo il modello non sente il contesto dei passi vicini: se
  l’intonazione salta da un passo all’altro, si possono passare `previous_text` e `next_text`
  (parametri dell’API da verificare nella fase).

**Passi**

1. **Testo.** Una o due frasi per passo, scritte per essere ascoltate: frasi brevi, soggetto
   esplicito (`scrittura-parlata.md` §1). Durata totale fra 60 e 140 secondi (il tetto era 120: lo ha alzato Marco il 2026-11-09, D17).
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
corrente, che la durata totale stia fra 60 e 140 secondi e che gli audio pesino insieme meno di
1,5 MB.

```bash
pnpm verify && pnpm test:e2e
```
con il crawler dei link interni che include la lezione 3.

**Esito.** Da compilare: voce scelta e condizioni d’uso, durata totale, peso degli audio, fatti
rimasti da verificare.
