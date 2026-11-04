# Motore

TypeScript puro, senza dipendenze: si usa dal sito, dagli esercizi e da script Node (per esempio per generare figure ed esercizi del libro).

```ts
import { createMachine, initialState, pressKey, encipher, prepareText, groupLetters } from '@/engine';

const machine = createMachine({
  model: 'M3',
  rotors: ['II', 'IV', 'V'], // Walzenlage, da sinistra a destra
  rings: 'BUL', // Ringstellung
  positions: 'BLA', // Grundstellung
  reflector: 'B',
  plugboard: ['AV', 'BS', 'CG', 'DL', 'FU', 'HZ', 'IN', 'KM', 'OW', 'RX'],
});

let state = initialState(machine);
const press = pressKey(machine, state, 'A'); // { state, output, step, stages }
state = press.state;

const { output } = encipher(machine, initialState(machine), prepareText('L’attacco è all’alba'));
groupLetters(output); // gruppi da cinque
```

- **Immutabile**: `pressKey`, `step` ed `encipher` restituiscono uno stato nuovo; annullare significa tenere lo stato precedente.
- **Validazione**: `createMachine` lancia `InvalidConfigError` (con l’elenco dei problemi in italiano) se la configurazione non è realizzabile sulla macchina reale; `validateConfig` restituisce lo stesso elenco senza lanciare.
- **Traccia**: `stages` descrive il percorso del segnale (pannello, ruota d’ingresso, rotori, riflettore e ritorno) e alimenta le visualizzazioni.
- **Configurazioni di base**: `defaultConfig(modello)` restituisce una chiave valida (riflettore B dove esiste, primi rotori, anelli e posizioni su A).
- **Link**: `encodeConfig` / `decodeConfig` convertono la configurazione in una query string leggibile.

## Crittoanalisi

`cryptanalysis.ts` calcola ciò che mostrano le lezioni e le animazioni di crittoanalisi. Le permutazioni sono array di indici 0–25 e il prodotto si legge da sinistra a destra, come in Rejewski: in AD si applica prima A e poi D.

```ts
import { characteristicFromIndicators, chains, doubledIndicators, buildMenu, menuLoops, testHypothesis } from '@/engine';

// Rejewski: gli indicatori doppi di una giornata e la caratteristica AD, BE, CF.
const indicators = doubledIndicators(machine, ['KUL', 'HEJ', 'ABC']); // ogni chiave cifrata due volte
const partial = characteristicFromIndicators(indicators);
chains(partial.AD); // { closed: cicli già chiusi, open: catene ancora aperte }

// Bletchley Park: menu di un crib e prova di un’ipotesi sul pannello.
const menu = buildMenu('WETTERVORHERSAGE', ciphertext, 25); // lancia se una lettera cifrerebbe sé stessa
menuLoops(menu); // anelli indipendenti, dal più corto
testHypothesis(machine, state, menu, { letter: 'E', partner: 'K' }, { diagonalBoard: true });
// { deductions, contradictions, consistent, partners }
```

- **Indicatori e caratteristica** (Rejewski 1980, pp. 5–6): `doubledIndicators` cifra due volte ogni chiave di messaggio dalla posizione di base; `addIndicator` aggiunge un indicatore alla volta e lancia un errore se contraddice i precedenti; `characteristic` dà la caratteristica esatta calcolata dalla macchina; `chains` separa i cicli chiusi dalle catene aperte.
- **Teorema dei cicli** (p. 9): `hasPairedCycles` controlla che i cicli di ogni lunghezza siano in numero pari; `transpositionsFromPair` e `secondFactorTranspositions` ricavano da una trasposizione supposta di A le altre fra gli stessi due cicli e le corrispondenti di D, come nell’esempio «jjj» di p. 10.
- **Notazione**: `cycleNotation` e `parseCycles` scrivono e leggono le permutazioni come `(DVPF)(BC)(A)`.
- **Menu**: `cribCrashes` e `cribPositions` scartano le posizioni in cui una lettera cifrerebbe sé stessa; `menuComponents`, `menuCentre` e `menuLoops` descrivono il grafo; `loopPermutation` compone le permutazioni dei rotori lungo un anello.
- **Prova della Bombe**: `testHypothesis` segue tutte le conseguenze di un’ipotesi lungo il menu, con i rotori senza pannello (`scramblers`) e, se richiesto, con il diagonal board. Ogni deduzione ricorda da quale è nata, così un’animazione può ripercorrerla. Con l’Uhr la prova non vale e la funzione lancia un errore. A differenza della Bombe vera, i rotori avanzano con il passo esatto della macchina, doppio passo compreso.

## Verifica

- `__tests__/historical.test.ts`: messaggi reali (Barbarossa, U-264, Scharnhorst).
- `__tests__/differential.test.ts`: confronto con il motore del simulatore originale sui vettori di `fixtures/legacy-vectors.json`. Per un controllo più ampio si generano più vettori e si indica il file con `LEGACY_VECTORS`:

```bash
node scripts/legacy/generate-vectors.cjs <percorso di enigma.js> 10000 /tmp/legacy-vectors.json
```

```bash
LEGACY_VECTORS=/tmp/legacy-vectors.json pnpm exec vitest run src/engine/__tests__/differential.test.ts
```

- `__tests__/properties.test.ts`: proprietà verificate su configurazioni casuali di tutti i modelli (reciprocità, nessuna lettera cifrata in sé stessa, avanzamento dei rotori).
- `__tests__/cryptanalysis.test.ts`: gli esempi di Rejewski 1980 (pp. 5, 6 e 10) e le proprietà su chiavi casuali: cicli di AD, BE, CF a coppie, caratteristica invariata dal pannello, ipotesi corretta senza contraddizioni.
