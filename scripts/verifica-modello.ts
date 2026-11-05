/**
 * Verifica public/modelli/enigma-i.glb contro la «Convenzione del modello 3D»
 * (docs/piano/convenzione-3d.md). Legge solo il blocco JSON del glTF binario: nessuna dipendenza.
 *
 * NODI_ATTESI è la tabella dei nodi della convenzione: se cambia l’una, cambia l’altra, nello
 * stesso commit. FASE_MODELLO dice fin dove è arrivato il modello: si controllano i nodi delle fasi
 * fino a quella, e la fase che crea nodi nuovi la fa avanzare.
 */
import { readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const FASI = ['4i', '4j'] as const;
type Fase = (typeof FASI)[number];
const FASE_MODELLO: Fase = '4j';

/** Tetto del peso: 300 KB per l’abbozzo della 4i, 1 MB per il modello completo (D15). */
const TETTO: Record<Fase, number> = { '4i': 300 * 1024, '4j': 1024 * 1024 };

/**
 * La cassa dell’Enigma I secondo la scheda del Deutsches Technikmuseum (fonte «technikmuseum-enigma»
 * di src/content/fonti.yaml): 280 mm di larghezza, 340 di profondità, 160 di altezza a coperchio
 * chiuso. Il coperchio di legno non è un nodo, quindi l’altezza ha solo un intervallo.
 */
const CASSA = { larghezza: 0.28, profondita: 0.34, altezzaChiusa: 0.16 };
const TOLLERANZA = 0.1;

interface NodoAtteso {
  nome: string;
  da: Fase;
  /** La fase dello smontaggio in cui la clip lo muove: è il valore di `extras.fase`. */
  clip?: 1 | 2 | 3 | 4;
  /** Che cosa ne fa il codice della pagina. */
  codice?: 'rotazione' | 'traslazione' | 'materiale';
  /** Se ha `extras.raggio_contatti`. */
  contatti?: true;
}

function nodo(nome: string, da: Fase, opzioni: Omit<NodoAtteso, 'nome' | 'da'> = {}): NodoAtteso {
  return { nome, da, ...opzioni };
}

const LETTERE = [...'abcdefghijklmnopqrstuvwxyz'];
const ROTORI = ['rotore_destro', 'rotore_centrale', 'rotore_sinistro'];

const NODI_ATTESI: NodoAtteso[] = [
  nodo('cassa', '4i'),
  nodo('coperchio_interno', '4i', { clip: 1 }),
  nodo('sportello_spine', '4i', { clip: 1 }),
  nodo('pannello_spine', '4i'),
  nodo('tastiera', '4i', { clip: 4 }),
  ...LETTERE.map((l) => nodo(`tasto_${l}`, '4i', { codice: 'traslazione' })),
  ...LETTERE.map((l) => nodo(`lampada_${l}`, '4i', { codice: 'materiale' })),
  nodo('ruota_ingresso', '4i', { contatti: true }),
  nodo('riflettore', '4i', { clip: 2, contatti: true }),
  nodo('asse_rotori', '4i', { clip: 2 }),
  ...ROTORI.flatMap((r) => [
    nodo(r, '4i', { clip: 2, codice: 'rotazione', contatti: true }),
    nodo(`${r}_anello`, '4i', { clip: 3, codice: 'rotazione' }),
    nodo(`${r}_nucleo`, '4j', { clip: 3 }),
    nodo(`${r}_contatti_molla`, '4j', { clip: 3 }),
    nodo(`${r}_contatti_piani`, '4j', { clip: 3 }),
    nodo(`${r}_cricchetto`, '4j', { clip: 3 }),
    nodo(`${r}_rotella`, '4j', { clip: 3 }),
    nodo(`${r}_tacca`, '4j'),
  ]),
  ...['nottolino_destro', 'nottolino_centrale', 'nottolino_sinistro'].map((n) =>
    nodo(n, '4i', { codice: 'rotazione' }),
  ),
  nodo('leva_tasti', '4j', { codice: 'rotazione' }),
  nodo('batteria', '4j', { clip: 4 }),
  ...['tasto', 'presa', 'lampada'].flatMap((pezzo) => LETTERE.map((l) => nodo(`ancora_${pezzo}_${l}`, '4j'))),
  nodo('ancora_batteria', '4j'),
];

const EXTRAS_AMMESSI = new Set(['fase', 'raggio_contatti']);

/** Il lato massimo, in pixel, dell’atlante dei glifi (D15: un’immagine sola). */
const ATLANTE_MAX = 512;
/** I materiali con lettera o numero: ognuno ha come colore base l’atlante. */
const MATERIALI_CON_ATLANTE = ['tessera', 'cima_tasto', 'vetro'];

// --- glTF ------------------------------------------------------------------------------------

interface Nodo {
  name?: string;
  mesh?: number;
  children?: number[];
  translation?: number[];
  rotation?: number[];
  scale?: number[];
  extras?: Record<string, unknown>;
}
interface Primitiva {
  attributes: Record<string, number>;
  indices?: number;
}
interface Accessor {
  count: number;
  min?: number[];
  max?: number[];
}
interface Materiale {
  name?: string;
  pbrMetallicRoughness?: { baseColorTexture?: { index: number } };
}
interface Gltf {
  nodes?: Nodo[];
  materials?: Materiale[];
  textures?: { source?: number }[];
  images?: { bufferView?: number; mimeType?: string }[];
  bufferViews?: { byteOffset?: number; byteLength: number }[];
  meshes?: { name?: string; primitives: Primitiva[] }[];
  accessors?: Accessor[];
  animations?: { name?: string; channels: { target: { node?: number; path: string } }[] }[];
}

/**
 * Un glTF binario: intestazione di 12 byte, poi il blocco JSON e, dopo, il blocco BIN con i dati
 * (mesh e immagini).
 */
function leggiGlb(file: string): { gltf: Gltf; bin: Buffer } {
  const dati = readFileSync(file);
  if (dati.readUInt32LE(0) !== 0x46546c67) throw new Error('non è un glTF binario');
  const lunghezza = dati.readUInt32LE(12);
  if (dati.readUInt32LE(16) !== 0x4e4f534a) throw new Error('il primo blocco non è JSON');
  const gltf = JSON.parse(dati.subarray(20, 20 + lunghezza).toString('utf8')) as Gltf;
  const inizioBin = 20 + lunghezza;
  const bin = inizioBin + 8 <= dati.length ? dati.subarray(inizioBin + 8) : Buffer.alloc(0);
  return { gltf, bin };
}

// --- Verifica --------------------------------------------------------------------------------

/** Restituisce gli errori trovati e qualche numero da riportare. */
function verifica(gltf: Gltf, bin: Buffer, peso: number) {
  const errori: string[] = [];
  const nodi = gltf.nodes ?? [];
  const meshes = gltf.meshes ?? [];
  const accessors = gltf.accessors ?? [];
  const fasi = FASI.slice(0, FASI.indexOf(FASE_MODELLO) + 1) as readonly Fase[];
  const attesi = new Map(NODI_ATTESI.map((n) => [n.nome, n]));

  if (peso > TETTO[FASE_MODELLO]) {
    errori.push(`pesa ${kb(peso)}, oltre il tetto di ${kb(TETTO[FASE_MODELLO])} della fase ${FASE_MODELLO}`);
  }

  const perNome = new Map<string, Nodo>();
  for (const n of nodi) {
    const nome = n.name ?? '(senza nome)';
    if (perNome.has(nome)) errori.push(`il nodo ${nome} compare due volte`);
    perNome.set(nome, n);
    const atteso = attesi.get(nome);
    if (atteso === undefined || !fasi.includes(atteso.da)) {
      errori.push(`il nodo ${nome} non è nella convenzione (fino alla fase ${FASE_MODELLO})`);
    }
    for (const chiave of Object.keys(n.extras ?? {})) {
      if (!EXTRAS_AMMESSI.has(chiave)) errori.push(`${nome}: extras.${chiave} non è ammesso`);
    }
  }

  for (const atteso of NODI_ATTESI) {
    if (!fasi.includes(atteso.da)) continue;
    const n = perNome.get(atteso.nome);
    if (n === undefined) {
      errori.push(`manca il nodo ${atteso.nome}`);
      continue;
    }
    const fase = n.extras?.['fase'];
    if (atteso.clip !== undefined && fase !== atteso.clip) {
      errori.push(`${atteso.nome}: extras.fase è ${String(fase)}, deve essere ${atteso.clip}`);
    }
    if (atteso.clip === undefined && fase !== undefined) {
      errori.push(`${atteso.nome}: la clip non lo muove, quindi non ha extras.fase`);
    }
    const raggio = n.extras?.['raggio_contatti'];
    if (atteso.contatti && !(typeof raggio === 'number' && raggio > 0)) {
      errori.push(`${atteso.nome}: extras.raggio_contatti deve essere un numero positivo`);
    }
    if (!atteso.contatti && raggio !== undefined) {
      errori.push(`${atteso.nome}: non ha contatti sulle facce, quindi non ha extras.raggio_contatti`);
    }
    // Il codice gira un rotore con la sola rotation.x: il nodo a riposo non ruota e non scala.
    if (atteso.codice === 'rotazione' || atteso.codice === 'traslazione') {
      if (!uguale(n.rotation, [0, 0, 0, 1]) || !uguale(n.scale, [1, 1, 1])) {
        errori.push(`${atteso.nome}: il codice lo muove, quindi a riposo non ruota e non scala`);
      }
    }
  }

  // La gerarchia: i pezzi di un rotore sono suoi figli, la tacca è figlia dell’anello, i tasti stanno
  // sotto la tastiera, le ancore e gli altri nodi sotto la radice.
  const padre = new Map<string, string>();
  nodi.forEach((n) => (n.children ?? []).forEach((f) => padre.set(nodi[f]?.name ?? '?', n.name ?? '?')));
  for (const atteso of NODI_ATTESI) {
    const trovato = padre.get(atteso.nome);
    const rotore = ROTORI.find((r) => atteso.nome.startsWith(`${r}_`));
    const dovrebbe = atteso.nome.startsWith('tasto_')
      ? 'tastiera'
      : rotore === undefined
        ? undefined
        : atteso.nome === `${rotore}_tacca`
          ? `${rotore}_anello`
          : rotore;
    if (fasi.includes(atteso.da) && trovato !== dovrebbe) {
      errori.push(`${atteso.nome}: il padre è ${trovato ?? 'la radice'}, deve essere ${dovrebbe ?? 'la radice'}`);
    }
  }

  // Tasti e lampade sono copie collegate: tutti i tasti usano una mesh, tutte le lampade un’altra.
  for (const prefisso of ['tasto_', 'lampada_']) {
    const usate = new Set(LETTERE.map((l) => perNome.get(prefisso + l)?.mesh));
    if (usate.size !== 1 || usate.has(undefined)) {
      errori.push(`i nodi ${prefisso}* devono usare tutti la stessa mesh`);
    }
  }

  // Le dimensioni della cassa, dal minimo e dal massimo di POSITION: Y è l’altezza, Z la profondità.
  const cassa = perNome.get('cassa');
  const mesh = cassa?.mesh === undefined ? undefined : meshes[cassa.mesh];
  let dimensioni: number[] = [];
  if (mesh === undefined) {
    errori.push('la cassa non ha una mesh');
  } else {
    const min = [Infinity, Infinity, Infinity];
    const max = [-Infinity, -Infinity, -Infinity];
    for (const p of mesh.primitives) {
      const a = accessors[p.attributes['POSITION'] ?? -1];
      for (let i = 0; i < 3; i++) {
        min[i] = Math.min(min[i] ?? Infinity, a?.min?.[i] ?? Infinity);
        max[i] = Math.max(max[i] ?? -Infinity, a?.max?.[i] ?? -Infinity);
      }
    }
    dimensioni = max.map((m, i) => m - (min[i] ?? 0));
    const [x = 0, y = 0, z = 0] = dimensioni;
    const vicino = (misura: number, fonte: number) => Math.abs(misura - fonte) <= fonte * TOLLERANZA;
    if (!vicino(x, CASSA.larghezza)) errori.push(`cassa larga ${cm(x)}, la fonte dice ${cm(CASSA.larghezza)}`);
    if (!vicino(z, CASSA.profondita)) errori.push(`cassa profonda ${cm(z)}, la fonte dice ${cm(CASSA.profondita)}`);
    if (!(y >= CASSA.altezzaChiusa / 2 && y <= CASSA.altezzaChiusa)) {
      errori.push(`cassa alta ${cm(y)}: senza coperchio deve stare fra metà e tutta l’altezza chiusa`);
    }
    const centrata =
      Math.abs(min[1] ?? 1) < 1e-3 &&
      Math.abs((min[0] ?? 1) + (max[0] ?? 0)) < 2e-3 &&
      Math.abs((min[2] ?? 1) + (max[2] ?? 0)) < 2e-3;
    const ferma = uguale(cassa?.translation, [0, 0, 0]);
    if (!centrata || !ferma) errori.push('l’origine non sta al centro del fondo della cassa');
  }

  // Chi muove che cosa: la clip non tocca i nodi che non sono suoi, e su quelli che il codice
  // ruota ha solo tracce translation.
  for (const animazione of gltf.animations ?? []) {
    for (const { target } of animazione.channels) {
      const nome = target.node === undefined ? undefined : nodi[target.node]?.name;
      const atteso = nome === undefined ? undefined : attesi.get(nome);
      const dove = `animazione ${animazione.name ?? '?'}, nodo ${nome ?? '?'}, ${target.path}`;
      if (atteso?.clip === undefined) errori.push(`${dove}: la clip non muove questo nodo`);
      else if (atteso.codice === 'traslazione') errori.push(`${dove}: il codice trasla questo nodo`);
      else if (atteso.codice === 'rotazione' && target.path !== 'translation') {
        errori.push(`${dove}: il codice ruota questo nodo, la clip può solo traslarlo`);
      }
    }
  }

  // L’atlante dei glifi: un’immagine sola, non più grande di ATLANTE_MAX, usata dai tre materiali con
  // lettera o numero, ognuno con una texture come colore base.
  const immagini = gltf.images ?? [];
  let atlante = '';
  if (immagini.length !== 1) {
    errori.push(`le immagini sono ${immagini.length}: deve esserci solo l’atlante dei glifi`);
  } else {
    const vista = gltf.bufferViews?.[immagini[0]?.bufferView ?? -1];
    const inizio = vista?.byteOffset ?? 0;
    const png = vista === undefined ? undefined : bin.subarray(inizio, inizio + vista.byteLength);
    if (png === undefined || png.subarray(1, 4).toString() !== 'PNG') {
      errori.push('l’atlante non è un PNG incorporato nel .glb');
    } else {
      const [larghezza, altezza] = [png.readUInt32BE(16), png.readUInt32BE(20)];
      atlante = `${larghezza} × ${altezza}`;
      if (larghezza > ATLANTE_MAX || altezza > ATLANTE_MAX) {
        errori.push(`l’atlante è ${atlante}, oltre ${ATLANTE_MAX} × ${ATLANTE_MAX}`);
      }
    }
  }
  for (const nome of MATERIALI_CON_ATLANTE) {
    const materiale = (gltf.materials ?? []).find((m) => m.name === nome);
    const texture = materiale?.pbrMetallicRoughness?.baseColorTexture?.index;
    if (materiale === undefined) errori.push(`manca il materiale ${nome}`);
    else if (texture === undefined || gltf.textures?.[texture]?.source !== 0) {
      errori.push(`il materiale ${nome} non ha l’atlante come colore base`);
    }
  }

  const triangoli = (indice: number) =>
    (meshes[indice]?.primitives ?? []).reduce((somma, p) => {
      const conteggio = accessors[p.indices ?? p.attributes['POSITION'] ?? -1]?.count ?? 0;
      return somma + conteggio / 3;
    }, 0);
  const disegnati = nodi.reduce((somma, n) => somma + (n.mesh === undefined ? 0 : triangoli(n.mesh)), 0);
  const unici = meshes.reduce((somma, _, i) => somma + triangoli(i), 0);

  return { errori, nodi: nodi.length, dimensioni, atlante, triangoli: { unici, disegnati } };
}

function uguale(valore: number[] | undefined, riposo: number[]) {
  return valore === undefined || valore.every((v, i) => Math.abs(v - (riposo[i] ?? 0)) < 1e-6);
}

function kb(byte: number) {
  return `${(byte / 1024).toFixed(0)} KB`;
}

function cm(metri: number) {
  return `${(metri * 100).toFixed(1)} cm`;
}

/** Il file da verificare: quello del sito, o quello passato come argomento. */
const file = process.argv[2] ?? join(import.meta.dirname, '..', 'public', 'modelli', 'enigma-i.glb');
const peso = statSync(file).size;
const { gltf, bin } = leggiGlb(file);
const esito = verifica(gltf, bin, peso);
for (const errore of esito.errori) console.log(`✖ ${errore}`);
const [x = 0, y = 0, z = 0] = esito.dimensioni;
console.log(
  `${relative(process.cwd(), file)}, fase ${FASE_MODELLO}: ${kb(peso)}, ${esito.nodi} nodi, ` +
    `${esito.triangoli.unici} triangoli nelle mesh (${esito.triangoli.disegnati} disegnati), ` +
    `atlante ${esito.atlante || 'assente'}, ` +
    `cassa ${cm(x)} × ${cm(z)} × ${cm(y)} (larghezza × profondità × altezza).`,
);
console.log(`${esito.errori.length} errori.`);
if (esito.errori.length > 0) process.exitCode = 1;
