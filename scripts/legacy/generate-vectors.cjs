/*
 * Genera fixtures/legacy-vectors.json eseguendo il motore del simulatore originale
 * (SummersideMakerspace/EnigmaMachine, Apache-2.0) su configurazioni casuali.
 *
 * Uso: node scripts/legacy/generate-vectors.cjs <percorso di enigma.js> <vettori per modello> [file di uscita]
 *
 * Il codice originale non è incluso nel repository: lo script lo carica dal percorso indicato.
 * Le configurazioni sono scritte nel formato del nuovo motore (src/engine/config.ts).
 */
const fs = require('node:fs');
const vm = require('node:vm');

const [legacyPath, perModelArg = '200', outPath = 'fixtures/legacy-vectors.json'] = process.argv.slice(2);
if (!legacyPath) {
  console.error('Indica il percorso di enigma.js del simulatore originale.');
  process.exit(1);
}

// Sostituto minimo di $.extend(true, …), l'unica funzione jQuery usata dal motore originale.
function extend(deep, target, ...sources) {
  for (const source of sources) {
    for (const key in source) {
      const value = source[key];
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        target[key] = extend(true, target[key] && typeof target[key] === 'object' ? target[key] : {}, value);
      } else target[key] = value;
    }
  }
  return target;
}
const context = { $: { extend }, console };
vm.createContext(context);
vm.runInContext(fs.readFileSync(legacyPath, 'utf8') + '\nthis.EnigmaMachine = EnigmaMachine;', context);
const { EnigmaMachine } = context;

// PRNG deterministico (mulberry32): i vettori sono riproducibili.
let seed = 0x5eed1940;
function random() {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const int = (n) => Math.floor(random() * n);
const pick = (list) => list[int(list.length)];
const letter = (i) => String.fromCharCode(65 + i);
function shuffle(list) {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = int(i + 1);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

// Corrispondenza tra gli id del motore originale e quelli del nuovo.
const MODELS = {
  D: 'D',
  I: 'I',
  'Norway Enigma': 'Norway',
  M3: 'M3',
  M4: 'M4',
  Zählwerk: 'A865',
  G: 'G31',
  'G-111': 'G111',
  'G-260': 'G260',
  'G-312': 'G312',
  K: 'K',
  'Swiss-K': 'SwissK',
  KD: 'KD',
  'Railway Enigma': 'Railway',
  T: 'T',
};
const ROTOR_ID = { β: 'Beta', γ: 'Gamma' };
const REFLECTOR_ID = { 'B Thin': 'B-thin', 'C Thin': 'C-thin' };
// Nel nuovo motore l'UKW-D è disponibile solo dove storicamente documentato.
const UKW_D_MODELS = new Set(['I', 'M4']);
// Il motore originale permette la regolazione del riflettore solo con movimento a ingranaggi.
const GEAR_MODELS = new Set(['Zählwerk', 'G', 'G-111', 'G-260', 'G-312']);

function randomPairs(count, exclude = []) {
  const letters = shuffle(ALPHABET.filter((l) => !exclude.includes(l)));
  const pairs = [];
  for (let i = 0; i < count; i++) pairs.push(letters[2 * i] + letters[2 * i + 1]);
  return pairs;
}

function randomVector(legacyModel) {
  const probe = new EnigmaMachine(legacyModel);
  const rotorNames = Object.keys(probe.available_rotors);
  const thin = rotorNames.filter((r) => probe.available_rotors[r].thin_rotor);
  const normal = rotorNames.filter((r) => !probe.available_rotors[r].thin_rotor);
  let reflectors = Object.keys(probe.available_reflectors);
  if (!UKW_D_MODELS.has(legacyModel)) reflectors = reflectors.filter((r) => r !== 'D');
  const reflector = pick(reflectors);
  const usesThin = legacyModel === 'M4' && reflector !== 'D';

  const rotors = shuffle(normal).slice(0, 3);
  if (usesThin) rotors.unshift(pick(thin));
  const positions = rotors.map(() => int(26));
  const rings = rotors.map(() => int(26));
  const reflectorPosition = GEAR_MODELS.has(legacyModel) ? int(26) : 0;

  let plugboard = [];
  let uhr;
  if (probe.has_plugboard) {
    if (legacyModel === 'I' && random() < 0.25) {
      plugboard = randomPairs(10);
      uhr = int(40);
    } else {
      plugboard = randomPairs(int(14));
    }
  }

  // Configurazione per il motore originale. Con UKW-D sull'M4 il motore originale scarta il primo rotore.
  const legacyRotors = rotors.map((r, i) => [r, positions[i], rings[i]]);
  if (legacyModel === 'M4' && reflector === 'D') legacyRotors.unshift(['β', 0, 0]);
  const machine = new EnigmaMachine(
    legacyModel,
    legacyRotors,
    [reflector, reflectorPosition],
    plugboard,
    uhr === undefined ? false : String(uhr),
  );

  const length = 20 + int(100);
  let plaintext = '';
  for (let i = 0; i < length; i++) plaintext += ALPHABET[int(26)];
  const ciphertext = machine.cipher(plaintext);

  const config = {
    model: MODELS[legacyModel],
    rotors: rotors.map((r) => ROTOR_ID[r] ?? r),
    rings: rings.map(letter).join(''),
    positions: positions.map(letter).join(''),
    reflector: REFLECTOR_ID[reflector] ?? reflector,
  };
  if (GEAR_MODELS.has(legacyModel)) config.reflectorPosition = letter(reflectorPosition);
  if (plugboard.length > 0) config.plugboard = plugboard;
  if (uhr !== undefined) config.uhr = uhr;
  return { config, plaintext, ciphertext };
}

const perModel = Number(perModelArg);
const vectors = [];
for (const legacyModel of Object.keys(MODELS)) {
  for (let i = 0; i < perModel; i++) vectors.push(randomVector(legacyModel));
}
fs.writeFileSync(
  outPath,
  JSON.stringify(
    {
      source: 'https://github.com/SummersideMakerspace/EnigmaMachine (enigma.js, commit 83495f5)',
      generator: 'scripts/legacy/generate-vectors.cjs',
      count: vectors.length,
      vectors,
    },
    null,
    0,
  ).replace(/\{"config"/g, '\n{"config"') + '\n',
);
console.log(`Scritti ${vectors.length} vettori in ${outPath}`);
