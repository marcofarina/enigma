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
- **Link**: `encodeConfig` / `decodeConfig` convertono la configurazione in una query string leggibile.

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
