/**
 * Verifica public/modelli/enigma-i.glb contro la «Convenzione del modello 3D»
 * (docs/piano/convenzione-3d.md). Dalla 4l il file è compresso con meshopt: lo si decodifica con
 * gltf-transform, lo si riscrive senza compressione in memoria e si leggono il blocco JSON e i dati.
 *
 * NODI_ATTESI è la tabella dei nodi della convenzione: se cambia l’una, cambia l’altra, nello
 * stesso commit. FASE_MODELLO dice fin dove è arrivato il modello: si controllano i nodi delle fasi
 * fino a quella, e la fase che crea nodi nuovi la fa avanzare.
 */
import { statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { MeshoptDecoder } from 'meshoptimizer';

const FASI = ['4i', '4j', '4k', '4l', '4m', '4n'] as const;
type Fase = (typeof FASI)[number];
const FASE_MODELLO: Fase = '4n';

/**
 * Tetto del peso: 300 KB per l’abbozzo della 4i, 1 MB per il modello completo (D15), 6 MB per il
 * modello ibrido con l’esterno di ASHISH, texture comprese (D23); il tetto resta quello dalla 4m, con
 * l’interno cotto in un atlante (4m) e con lo smontaggio rivisto (4n).
 */
const TETTO: Record<Fase, number> = {
  '4i': 300 * 1024,
  '4j': 1024 * 1024,
  '4k': 1024 * 1024,
  '4l': 6 * 1024 * 1024,
  '4m': 6 * 1024 * 1024,
  '4n': 6 * 1024 * 1024,
};
/** Dalla 4l: il lato massimo delle texture (D23) e il loro formato. */
const TEXTURE_MAX = 2048;

/** La clip dello smontaggio (fase 4k): un’animazione sola, un secondo per ciascuna delle quattro fasi. */
const CLIP = { nome: 'smontaggio', secondiPerFase: 1, fasi: 4 };
/** Quanto il coperchio di legno si allontana all’indietro nella fase 1 (D22), al minimo, in metri. */
const COPERCHIO_LEGNO = { indietro: 0.1 };
const EPSILON = 1e-4;
/**
 * Il filtro di meshopt (scripts/comprimi-modello.ts) arrotonda le traslazioni della clip: la
 * posizione a riposo di un nodo e il primo valore della sua traccia differiscono fino a 0,05 mm.
 */
const TOLLERANZA_CLIP = 1e-4;

/**
 * La cassa dell’Enigma I secondo la scheda del Deutsches Technikmuseum (fonte «technikmuseum-enigma»
 * di src/content/fonti.yaml): 280 mm di larghezza, 340 di profondità, 160 di altezza a coperchio
 * chiuso. Il coperchio di legno è un nodo a sé (dalla 4l), quindi l’altezza ha solo un intervallo.
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
  nodo('coperchio_legno', '4l', { clip: 1 }),
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
/**
 * I materiali con lettera o numero: ognuno ha come colore base l’atlante. Dalla 4l tasti e lampade
 * hanno le lettere di ASHISH e l’atlante resta ai soli numeri degli anelli.
 */
const MATERIALI_CON_ATLANTE =
  FASI.indexOf(FASE_MODELLO) >= FASI.indexOf('4l') ? ['tessera'] : ['tessera', 'cima_tasto', 'vetro'];

/**
 * Dalla 4m l’interno ha un solo materiale, `interno`, con colore, occlusione e ruvidità e metallicità
 * (la stessa immagine, canali R, G e B) e normal map: un atlante cotto in Blender (scripts/blender/
 * cottura.py). I materiali piani dei pezzi interni non ci sono più; resta `ottone`, il perno dei
 * nottolini nella cassa.
 */
const INTERNO_MAX = 1024;
const MATERIALI_PIANI_TOLTI = ['vernice', 'metallo', 'metallo_scuro', 'bachelite', 'batteria'];

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
  bufferView?: number;
  byteOffset?: number;
  componentType?: number;
  type?: string;
}
interface Animazione {
  name?: string;
  channels: { sampler: number; target: { node?: number; path: string } }[];
  samplers: { input: number; output: number; interpolation?: string }[];
}
interface Materiale {
  name?: string;
  pbrMetallicRoughness?: { baseColorTexture?: { index: number }; metallicRoughnessTexture?: { index: number } };
  normalTexture?: { index: number };
  occlusionTexture?: { index: number };
}
interface Gltf {
  nodes?: Nodo[];
  materials?: Materiale[];
  textures?: { source?: number; extensions?: { EXT_texture_webp?: { source?: number } } }[];
  images?: { name?: string; bufferView?: number; mimeType?: string }[];
  bufferViews?: { byteOffset?: number; byteLength: number }[];
  meshes?: { name?: string; primitives: Primitiva[] }[];
  accessors?: Accessor[];
  animations?: Animazione[];
}

/**
 * Un glTF binario: intestazione di 12 byte, poi il blocco JSON e, dopo, il blocco BIN con i dati
 * (mesh e immagini). Il file si decodifica prima da meshopt: gltf-transform lo legge e lo riscrive
 * in memoria senza compressione.
 */
async function leggiGlb(file: string): Promise<{ gltf: Gltf; bin: Buffer }> {
  await MeshoptDecoder.ready;
  const io = new NodeIO()
    .registerExtensions(ALL_EXTENSIONS)
    .registerDependencies({ 'meshopt.decoder': MeshoptDecoder });
  const documento = await io.read(file);
  for (const estensione of documento.getRoot().listExtensionsUsed()) {
    if (estensione.extensionName === 'EXT_meshopt_compression') estensione.dispose();
  }
  const dati = Buffer.from(await io.writeBinary(documento));
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

  // Fino alla 4k tasti e lampade sono copie collegate: tutti i tasti usano una mesh, tutte le
  // lampade un’altra. Dalla 4l vengono da ASHISH, ognuno con la sua lettera: basta che abbiano una mesh.
  for (const prefisso of ['tasto_', 'lampada_']) {
    const usate = new Set(LETTERE.map((l) => perNome.get(prefisso + l)?.mesh));
    if (fasi.includes('4l')) {
      if (usate.has(undefined)) errori.push(`i nodi ${prefisso}* devono avere tutti una mesh`);
    } else if (usate.size !== 1 || usate.has(undefined)) {
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

  // La clip dello smontaggio (dalla 4k): una sola animazione lunga quattro secondi; ogni nodo che
  // muove ha `fase` da 1 a 4 e si muove solo nel secondo della sua fase; ogni fase ha almeno un nodo.
  const nodiPerFase = new Map<number, number>();
  let durata = 0;
  if (fasi.includes('4k')) {
    const animazioni = gltf.animations ?? [];
    const clip = animazioni[0];
    if (animazioni.length !== 1 || clip?.name !== CLIP.nome) {
      errori.push(
        `le animazioni sono [${animazioni.map((a) => a.name ?? '?').join(', ')}]: deve esserci solo «${CLIP.nome}»`,
      );
    }
    if (clip !== undefined) {
      for (const campionatore of clip.samplers) {
        durata = Math.max(durata, accessors[campionatore.input]?.max?.[0] ?? 0);
      }
      if (Math.abs(durata - CLIP.fasi * CLIP.secondiPerFase) > EPSILON) {
        errori.push(`la clip dura ${durata} s, deve durare ${CLIP.fasi * CLIP.secondiPerFase}`);
      }
      for (const canale of clip.channels) {
        const nodoMosso = canale.target.node === undefined ? undefined : nodi[canale.target.node];
        const nome = nodoMosso?.name ?? '?';
        const fase = nodoMosso?.extras?.['fase'];
        if (typeof fase !== 'number' || !Number.isInteger(fase) || fase < 1 || fase > CLIP.fasi) {
          errori.push(`${nome}: muove nella clip ma extras.fase non è un intero da 1 a ${CLIP.fasi}`);
          continue;
        }
        const campionatore = clip.samplers[canale.sampler];
        if (campionatore === undefined || canale.target.path !== 'translation') continue;
        const tempi = leggiNumeri(gltf, bin, campionatore.input);
        const valori = leggiNumeri(gltf, bin, campionatore.output);
        if (tempi.length * 3 !== valori.length) {
          errori.push(`${nome}: ${tempi.length} istanti e ${valori.length} valori di translation`);
          continue;
        }
        const punto = (i: number) => valori.slice(3 * i, 3 * i + 3);
        const inizio = (fase - 1) * CLIP.secondiPerFase;
        const fine = fase * CLIP.secondiPerFase;
        if (!uguale(nodoMosso?.translation, punto(0), TOLLERANZA_CLIP) && nodoMosso?.translation !== undefined) {
          errori.push(`${nome}: la translation a riposo non è il primo valore della clip`);
        }
        tempi.forEach((t, i) => {
          if (t <= inizio + EPSILON && !uguale(punto(i), punto(0))) {
            errori.push(`${nome}: si muove prima della fase ${fase} (a ${t} s)`);
          }
          if (t >= fine - EPSILON && !uguale(punto(i), punto(tempi.length - 1))) {
            errori.push(`${nome}: si muove dopo la fase ${fase} (a ${t} s)`);
          }
        });
        if (uguale(punto(0), punto(tempi.length - 1))) errori.push(`${nome}: la clip non lo sposta`);
        if (fasi.includes('4n') && nome === 'coperchio_legno') {
          // D22: il coperchio di legno, aperto dietro la macchina, si allontana all’indietro e in
          // basso nella fase 1. In glTF il retro è −Z e il basso è −Y.
          const ultimo = punto(tempi.length - 1);
          const dy = (ultimo[1] ?? 0) - (punto(0)[1] ?? 0);
          const dz = (ultimo[2] ?? 0) - (punto(0)[2] ?? 0);
          if (fase !== 1) errori.push(`${nome}: la clip lo muove nella fase ${fase}, deve essere la 1`);
          if (dz > -COPERCHIO_LEGNO.indietro) {
            errori.push(
              `${nome}: si allontana all’indietro di ${(-dz * 1000).toFixed(0)} mm, ne servono almeno ${COPERCHIO_LEGNO.indietro * 1000}`,
            );
          }
          if (dy >= 0) errori.push(`${nome}: non scende (${(dy * 1000).toFixed(0)} mm)`);
        }
        nodiPerFase.set(fase, (nodiPerFase.get(fase) ?? 0) + 1);
      }
      for (let fase = 1; fase <= CLIP.fasi; fase++) {
        if ((nodiPerFase.get(fase) ?? 0) === 0) errori.push(`nessun nodo si muove nella fase ${fase}`);
      }
    }
  }

  // Le immagini. Fino alla 4k c’è solo l’atlante dei glifi, un PNG non più grande di ATLANTE_MAX.
  // Dalla 4l ci sono anche le texture di ASHISH: tutte in WebP, non più grandi di TEXTURE_MAX, e
  // l’atlante è quella del materiale `tessera`.
  const immagini = gltf.images ?? [];
  const lati = immagini.map((immagine) => {
    const vista = gltf.bufferViews?.[immagine.bufferView ?? -1];
    const inizio = vista?.byteOffset ?? 0;
    return vista === undefined ? undefined : latoImmagine(bin.subarray(inizio, inizio + vista.byteLength));
  });
  const tessera = (gltf.materials ?? []).find((m) => m.name === 'tessera');
  const indiceAtlante = sorgente(gltf, tessera?.pbrMetallicRoughness?.baseColorTexture?.index);
  let atlante = '';
  if (!fasi.includes('4l') && immagini.length !== 1) {
    errori.push(`le immagini sono ${immagini.length}: deve esserci solo l’atlante dei glifi`);
  }
  immagini.forEach((immagine, i) => {
    const lato = lati[i];
    const nome = immagine.name ?? `immagine ${i}`;
    if (lato === undefined) {
      errori.push(`${nome}: non è un PNG né un WebP incorporato nel .glb`);
      return;
    }
    if (fasi.includes('4l') && lato.formato !== 'WebP') errori.push(`${nome}: è un ${lato.formato}, deve essere WebP`);
    if (!fasi.includes('4l') && lato.formato !== 'PNG') errori.push(`${nome}: l’atlante non è un PNG`);
    const massimo = i === indiceAtlante ? ATLANTE_MAX : TEXTURE_MAX;
    if (lato.larghezza > massimo || lato.altezza > massimo) {
      errori.push(`${nome} è ${lato.larghezza} × ${lato.altezza}, oltre ${massimo} × ${massimo}`);
    }
    if (i === indiceAtlante) atlante = `${lato.larghezza} × ${lato.altezza}`;
  });
  const numeroImmagini = immagini.length;
  for (const nome of MATERIALI_CON_ATLANTE) {
    const materiale = (gltf.materials ?? []).find((m) => m.name === nome);
    const texture = materiale?.pbrMetallicRoughness?.baseColorTexture?.index;
    if (materiale === undefined) errori.push(`manca il materiale ${nome}`);
    else if (texture === undefined || sorgente(gltf, texture) !== indiceAtlante) {
      errori.push(`il materiale ${nome} non ha l’atlante come colore base`);
    }
  }

  if (fasi.includes('4m')) {
    const interno = (gltf.materials ?? []).find((m) => m.name === 'interno');
    if (interno === undefined) {
      errori.push('manca il materiale interno');
    } else {
      const texture = {
        'colore base': interno.pbrMetallicRoughness?.baseColorTexture?.index,
        'ruvidità e metallicità': interno.pbrMetallicRoughness?.metallicRoughnessTexture?.index,
        'normal map': interno.normalTexture?.index,
        occlusione: interno.occlusionTexture?.index,
      };
      for (const [che, indice] of Object.entries(texture)) {
        const immagine = sorgente(gltf, indice);
        if (immagine === undefined) {
          errori.push(`il materiale interno non ha la texture di ${che}`);
          continue;
        }
        const lato = lati[immagine];
        if (lato !== undefined && (lato.larghezza > INTERNO_MAX || lato.altezza > INTERNO_MAX)) {
          errori.push(`la texture di ${che} dell’interno è ${lato.larghezza} × ${lato.altezza}, oltre ${INTERNO_MAX}`);
        }
      }
      if (texture['ruvidità e metallicità'] !== texture.occlusione) {
        errori.push('l’occlusione e la ruvidità non stanno nella stessa texture (formato ORM)');
      }
    }
    for (const nome of MATERIALI_PIANI_TOLTI) {
      if ((gltf.materials ?? []).some((m) => m.name === nome)) errori.push(`c’è ancora il materiale piano ${nome}`);
    }
  }

  const triangoli = (indice: number) =>
    (meshes[indice]?.primitives ?? []).reduce((somma, p) => {
      const conteggio = accessors[p.indices ?? p.attributes['POSITION'] ?? -1]?.count ?? 0;
      return somma + conteggio / 3;
    }, 0);
  const disegnati = nodi.reduce((somma, n) => somma + (n.mesh === undefined ? 0 : triangoli(n.mesh)), 0);
  const unici = meshes.reduce((somma, _, i) => somma + triangoli(i), 0);

  return {
    errori,
    nodi: nodi.length,
    dimensioni,
    atlante,
    texture: numeroImmagini,
    triangoli: { unici, disegnati },
    durata,
    nodiPerFase,
  };
}

/** I numeri float32 di un accessor, uno dopo l’altro (VEC3 incluso). Gli accessor dell’animazione non hanno stride. */
function leggiNumeri(gltf: Gltf, bin: Buffer, indice: number): number[] {
  const accessor = gltf.accessors?.[indice];
  const vista = gltf.bufferViews?.[accessor?.bufferView ?? -1];
  if (accessor === undefined || vista === undefined || accessor.componentType !== 5126) return [];
  const componenti = { SCALAR: 1, VEC3: 3, VEC4: 4 }[accessor.type ?? ''] ?? 0;
  const inizio = (vista.byteOffset ?? 0) + (accessor.byteOffset ?? 0);
  return Array.from({ length: accessor.count * componenti }, (_, i) => bin.readFloatLE(inizio + 4 * i));
}

/** L’immagine di una texture: in `source`, o in `EXT_texture_webp` se l’immagine è WebP. */
function sorgente(gltf: Gltf, texture: number | undefined): number | undefined {
  const t = texture === undefined ? undefined : gltf.textures?.[texture];
  return t?.source ?? t?.extensions?.EXT_texture_webp?.source;
}

/** Formato e lato di un PNG o di un WebP (lossy, lossless o esteso), dall’intestazione. */
function latoImmagine(dati: Buffer): { formato: 'PNG' | 'WebP'; larghezza: number; altezza: number } | undefined {
  if (dati.subarray(1, 4).toString() === 'PNG') {
    return { formato: 'PNG', larghezza: dati.readUInt32BE(16), altezza: dati.readUInt32BE(20) };
  }
  if (dati.subarray(0, 4).toString() !== 'RIFF' || dati.subarray(8, 12).toString() !== 'WEBP') return undefined;
  const blocco = dati.subarray(12, 16).toString();
  if (blocco === 'VP8 ') {
    return { formato: 'WebP', larghezza: dati.readUInt16LE(26) & 0x3fff, altezza: dati.readUInt16LE(28) & 0x3fff };
  }
  if (blocco === 'VP8L') {
    const bit = dati.readUInt32LE(21);
    return { formato: 'WebP', larghezza: (bit & 0x3fff) + 1, altezza: ((bit >> 14) & 0x3fff) + 1 };
  }
  if (blocco === 'VP8X') {
    return { formato: 'WebP', larghezza: dati.readUIntLE(24, 3) + 1, altezza: dati.readUIntLE(27, 3) + 1 };
  }
  return undefined;
}

function uguale(valore: number[] | undefined, riposo: number[], tolleranza = 1e-6) {
  return valore === undefined || valore.every((v, i) => Math.abs(v - (riposo[i] ?? 0)) < tolleranza);
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
const { gltf, bin } = await leggiGlb(file);
const esito = verifica(gltf, bin, peso);
for (const errore of esito.errori) console.log(`✖ ${errore}`);
const [x = 0, y = 0, z = 0] = esito.dimensioni;
console.log(
  `${relative(process.cwd(), file)}, fase ${FASE_MODELLO}: ${kb(peso)}, ${esito.nodi} nodi, ` +
    `${esito.triangoli.unici} triangoli nelle mesh (${esito.triangoli.disegnati} disegnati), ` +
    `atlante ${esito.atlante || 'assente'}, ${esito.texture} immagini, ` +
    `cassa ${cm(x)} × ${cm(z)} × ${cm(y)} (larghezza × profondità × altezza).`,
);
if (FASI.indexOf(FASE_MODELLO) >= FASI.indexOf('4k')) {
  const perFase = [...esito.nodiPerFase].sort(([a], [b]) => a - b).map(([fase, n]) => `fase ${fase}: ${n}`);
  console.log(`clip ${CLIP.nome}: ${esito.durata} s, nodi mossi per fase (${perFase.join(', ')}).`);
}
console.log(`${esito.errori.length} errori.`);
if (esito.errori.length > 0) process.exitCode = 1;
