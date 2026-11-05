# Fase 5d — Lezione animata: copione, lettore e scena

**Modello: Opus · Effort: high · Durata: 3 h · Dipende da: 5b, D16–D19**

**Obiettivo.** In `/macchina/` un pulsante «Guarda come funziona» avvia una lezione di uno o due
minuti: si preme un tasto, i rotori avanzano, la corrente va dal tasto al pannello a spine, alla
ruota d’ingresso, ai tre rotori, al riflettore e indietro fino alla lampada. Le parti esterne
diventano fantasma, il meccanismo va al rallentatore e una voce racconta. In questa fase il testo è
provvisorio e la voce è il segnaposto di macOS; testo e voce definitivi li fa la 5e.

**Prompt di apertura**

```
Prima di tutto: questa fase richiede Opus con effort high. Se non stai girando su Opus, fermati e
dimmelo senza fare altro.

Esegui docs/piano/fase-5d.md. Leggi prima l’indice docs/piano.md (le decisioni D16–D19) e
docs/piano/convenzione-3d.md. Avvia il sito con il server «astro-dev» e verifica nel browser.
```

**Passi**

1. **Il copione è un dato.** `src/content/lezione-3d/it.yaml`, controllato da `pnpm lint:content`
   come le altre YAML di `src/content/`. In testa la configurazione (nel formato della query) e la
   lettera, fisse (D19). Poi l’elenco dei passi; ogni passo ha `id`, `testo` (una o due frasi) e che
   cosa fa la scena: `camera` (un’inquadratura con nome, definita nel codice), `fantasma` (nodi
   che diventano trasparenti), `evidenzia`, `azione` (`premi`, `passo`, `segnale` fino a uno stadio
   della traccia, `lampada`) e `rallenta`. L’ultimo passo, «ora prova tu», riporta la scena allo
   stato normale e restituisce la tastiera.
2. **Un audio per passo.** `public/lezione-3d/it/<id>.m4a`, più `durate.json` con la durata di
   ciascuno e l’hash del suo testo. Con un file per frase non servono i tempi delle parole da un
   servizio, una correzione rifà un solo file e Marco può registrarsi frase per frase. Audio e durate
   li genera `scripts/voce.ts`, che in questa fase usa il segnaposto: `say -v Alice -o <id>.aiff "<testo>"`,
   poi `afconvert -f m4af -d aac <id>.aiff <id>.m4a`, con la durata letta da `afinfo` (verificato il
   2026-11-05: i tre comandi ci sono su questo Mac, e `Alice` è una voce `it_IT`). Lo script rifà
   solo i passi il cui testo è cambiato.
3. **Lettore.** Il passo corrente suona il suo audio, e la sua animazione dura quanto l’audio;
   finito l’audio, si passa al successivo. Comandi: avvia e pausa, passo precedente, passo
   successivo, e una modalità a passi senza voce, che avanza a mano (serve alla LIM). Il testo del
   passo corrente sta sotto la scena come sottotitolo; la trascrizione completa in un `<details>`.
4. **Percorso della corrente.** Dagli stadi della traccia del motore (`traceOf` in
   `src/components/simulator/trace.ts`) alle ancore e ai contatti calcolati: una linea che si
   accende tratto per tratto. È giusta per costruzione, perché viene dal motore. I tratti fra le
   ancore sono semplificati e non seguono i fili veri; il copione lo dice.
5. **Fantasma.** Materiale semitrasparente con `depthWrite: false` più gli spigoli principali
   (`EdgesGeometry` con una soglia sull’angolo), non il wireframe dei triangoli. Fissa l’ordine di
   disegno per evitare gli errori di ordinamento delle trasparenze.
6. **Componente.** `<LezioneAnimata>` in `src/components/lesson/`, caricato solo al clic come la
   vista 3D (D18). In questa fase sta solo in `/macchina/`; nella lezione 3 lo mette la 5e.
7. **Preferenze.** Con `prefers-reduced-motion` stacchi di camera al posto dei movimenti; il
   rallentatore resta, perché è il contenuto. L’audio parte solo dopo il clic.
8. **Prestazioni.** Misura i fotogrammi al secondo durante la lezione a 375 px con la CPU
   rallentata quattro volte (`Emulation.setCPUThrottlingRate` via CDP in Playwright) e scrivili
   nell’«Esito». Sotto 30, riduci trasparenze e spigoli.

**Criteri di accettazione**

```bash
node scripts/voce.ts
```
exit 0, con un file audio e una voce di `durate.json` per ogni passo del copione.

```bash
pnpm verify && pnpm test:e2e
```
con un test che porta la lezione, in modalità a passi, fino alla lampada e legge l’annuncio
«Lampada X» uguale all’uscita del motore per la lettera e la configurazione del copione; uno che
dopo «ora prova tu» batte una lettera e la cifra; uno che controlla che nessun audio si scarichi
prima del clic.

```bash
pnpm build && pnpm test:lighthouse
```
exit 0.

**Esito.** Da compilare: formato finale del copione, fotogrammi al secondo misurati, che cosa è
rimasto provvisorio per la 5e.
