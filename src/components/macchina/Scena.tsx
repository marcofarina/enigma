import { CameraControls, CameraControlsImpl, ContactShadows, Environment, Outlines, useGLTF } from '@react-three/drei';
import { Canvas, createPortal, useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import { Suspense, useCallback, useEffect, useMemo, useRef, useState, type MutableRefObject } from 'react';
import {
  ACESFilmicToneMapping,
  AnimationMixer,
  Box3,
  CatmullRomCurve3,
  Color,
  LineCurve3,
  Mesh,
  MeshStandardMaterial,
  PointLight,
  TubeGeometry,
  Vector3,
  type AnimationAction,
  type AnimationClip,
  type Material,
  type Object3D,
  type PerspectiveCamera,
} from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { useStore } from 'zustand';
import { engagedPawls, initialState, toIndex } from '@/engine';
import { modello3d } from '@/lib/modello3d';
import { currentState } from '../simulator/session.ts';
import type { SimulatorState, SimulatorStore } from '../simulator/store.ts';
import {
  angoloNottolino,
  angoloPiuVicinoA,
  DIREZIONE_PREDEFINITA,
  DISTANZA_MASSIMA,
  DISTANZA_MINIMA,
  distanzaDopoLoZoom,
  inquadra,
  letteraDelNodo,
  NODI_ROTORI,
  OSCILLAZIONE_LEVA,
  pezzoDelNodo,
  POLARE_MASSIMO,
  rampa,
  rotazioniRotore,
  segmentiCablaggio,
  tempoClip,
  velocitaSmontaggio,
  VISTE,
  type ComandiCamera,
  type Direzione,
  type StatoZoom,
} from './geometria.ts';
import { faseDelPezzo, indiceDeiNodi, schedaDelClic, type AnelloCatena, type Pezzo } from './pezzi.ts';

/*
 * La scena della pagina 3D. Sta in un modulo a sé, importato solo dopo «Avvia la vista 3D»: con lui
 * arrivano three.js, React Three Fiber e drei. Nessuna richiesta esce dal sito: il `.glb` sta in
 * `public/`, compresso con meshopt, il cui decoder sta nel bundle di drei (dalla 4l); niente Draco
 * (drei ne scaricherebbe il decoder da gstatic) e niente `preset` di `<Environment>` (li scarica da
 * un CDN): la luce d’ambiente è una HDRI servita dal sito (`modello3d.ambiente`).
 */

/**
 * La resa (fase 5f). Tone mapping ACES: con le texture di ASHISH tiene il legno caldo e il nero della
 * vernice, mentre AgX li sbiadisce. La luce viene quasi tutta dalla HDRI da studio, girata perché la
 * finestra di luce batta di lato sulla piastra e non la sbianchi; una luce direzionale debole dà il
 * verso alle ombre dei tasti. Niente `ambientLight`: appiattirebbe l’occlusione delle texture.
 */
const RESA = {
  esposizione: 1.1,
  ambiente: { intensita: 0.8, rotazione: 1.6 },
  direzionale: { posizione: [-0.5, 1.2, 0.8] as [number, number, number], intensita: 0.8 },
} as const;

/**
 * L’ombra di contatto sotto la macchina: una sola resa per fase (`frames={1}`), perché la scena gira
 * a richiesta. Il piano copre la macchina smontata, con la tastiera davanti e il coperchio dietro.
 * Sta mezzo millimetro sotto il fondo della cassa (`sotto`), non sopra: `ContactShadows` sfuma
 * l’ombra disegnando un piano nell’origine con la sua camera, che guarda in su dal piano dell’ombra;
 * con l’ombra sopra l’origine quel piano le resta dietro e la sfumatura cancella tutto.
 */
const OMBRA = { lato: 1.1, lontano: 0.4, sfumatura: 5, opacita: 0.9, risoluzione: 512, sotto: 0.0005 } as const;

/**
 * La camera dell’anteprima di `scripts/blender/costruisci.py`, convertita in glTF: obiettivo da
 * 50 mm su sensore da 36 mm, cioè 22,9° di campo verticale. Il campo resta questo; la posizione la
 * decide `Regia` (a partire da `DIREZIONE_PREDEFINITA`, che è quella dell’anteprima).
 */
const CAMERA = { position: [0.52, 0.6, 0.8] as [number, number, number], fov: 22.9, near: 0.01, far: 10 };

/** Corsa del tasto premuto, in metri, e quanto resta giù. */
const CORSA_TASTO = 0.006;
const DURATA_TASTO_MS = 140;

/** Un rotore: i nodi che il codice gira e le misure per disegnarci dentro il cablaggio. */
interface ParteRotore {
  rotore: Object3D;
  anello: Object3D;
  /** Il materiale del nucleo, clonato: diventa trasparente quando i rotori si aprono, per far vedere il cablaggio. */
  nucleo: MeshStandardMaterial | null;
  /** Le facce del nucleo lungo X, nel sistema del rotore: a destra entra la corrente, a sinistra esce. */
  facce: { ingresso: number; uscita: number };
  raggio: number;
}

interface Parti {
  rotori: ParteRotore[];
  /** Da sinistra a destra, come gli slot dei rotori che spingono. */
  nottolini: Object3D[];
  leva: Object3D | undefined;
  tasti: Map<string, Object3D>;
  lampade: Map<string, MeshStandardMaterial>;
  /** Dove sta ogni lampada, per portarci la luce che illumina il foro della piastra. */
  ancoreLampade: Map<string, Object3D>;
}

/** Il raggio dei contatti scritto negli `extras` del nodo (convenzione-3d), con quello dell'abbozzo come ripiego. */
const RAGGIO_PREDEFINITO = 0.035;

/** Il primo materiale con quel nome fra le mesh sotto `nodo`. */
function trovaMateriale(nodo: Object3D, nome: string): { mesh: Mesh; materiale: MeshStandardMaterial } | null {
  let trovato: { mesh: Mesh; materiale: MeshStandardMaterial } | null = null;
  nodo.traverse((figlio) => {
    if (trovato || !(figlio instanceof Mesh)) return;
    const materiale = figlio.material as Material;
    if (materiale instanceof MeshStandardMaterial && materiale.name === nome) trovato = { mesh: figlio, materiale };
  });
  return trovato;
}

/** Trova i nodi che la pagina muove e dà a ogni lampada il suo materiale. Una volta sola per scena. */
function preparaModello(scena: Object3D): Parti {
  const giaPronte = scena.userData['parti'] as Parti | undefined;
  if (giaPronte) return giaPronte;

  const tasti = new Map<string, Object3D>();
  const lampade = new Map<string, MeshStandardMaterial>();
  const ancoreLampade = new Map<string, Object3D>();
  scena.traverse((nodo) => {
    const ancora = /^ancora_lampada_([a-z])$/.exec(nodo.name);
    if (ancora?.[1]) ancoreLampade.set(ancora[1].toUpperCase(), nodo);
    const tasto = letteraDelNodo(nodo.name, 'tasto');
    if (tasto) {
      tasti.set(tasto, nodo);
      nodo.userData['riposo'] = nodo.position.y;
    }
    // Dalla 4l tasti e lampade vengono dal modello di ASHISH e hanno già la loro lettera nella
    // texture: la lampada riceve solo una copia del materiale `vetro`, da accendere da sola.
    const lampada = letteraDelNodo(nodo.name, 'lampada');
    if (lampada) {
      const vetro = trovaMateriale(nodo, 'vetro');
      if (vetro) {
        const materiale = vetro.materiale.clone();
        // La lampada accesa illumina le parti chiare della texture: la lettera bianca sul disco scuro.
        materiale.emissiveMap = materiale.map;
        materiale.userData['tinta'] = materiale.color.clone();
        vetro.mesh.material = materiale;
        lampade.set(lampada, materiale);
      }
    }
  });

  const rotori = NODI_ROTORI.map((nome): ParteRotore => {
    const rotore = scena.getObjectByName(nome);
    const anello = scena.getObjectByName(`${nome}_anello`);
    if (!rotore || !anello) throw new Error(`Il modello 3D non ha il nodo ${nome} o il suo anello.`);
    const trovato =
      scena.getObjectByName(`${nome}_nucleo`) && trovaMeshDelNodo(scena.getObjectByName(`${nome}_nucleo`)!);
    let nucleo: MeshStandardMaterial | null = null;
    let facce = { ingresso: 0.0135, uscita: -0.014 };
    if (trovato) {
      // Il materiale del nucleo è condiviso con altri pezzi: ne serve una copia che diventi trasparente da sola.
      nucleo = (trovato.material as MeshStandardMaterial).clone();
      trovato.material = nucleo;
      trovato.geometry.computeBoundingBox();
      const scatola = trovato.geometry.boundingBox;
      if (scatola) facce = { ingresso: scatola.max.x, uscita: scatola.min.x };
    }
    const raggio = rotore.userData['raggio_contatti'];
    return { rotore, anello, nucleo, facce, raggio: typeof raggio === 'number' ? raggio : RAGGIO_PREDEFINITO };
  });

  const nottolini = ['nottolino_sinistro', 'nottolino_centrale', 'nottolino_destro'].map((nome) => {
    const nodo = scena.getObjectByName(nome);
    if (!nodo) throw new Error(`Il modello 3D non ha il nodo ${nome}.`);
    return nodo;
  });

  const parti = {
    rotori,
    nottolini,
    leva: scena.getObjectByName('leva_tasti') ?? undefined,
    tasti,
    lampade,
    ancoreLampade,
  };
  scena.userData['parti'] = parti;
  return parti;
}

/** La prima mesh sotto `nodo` (o il nodo stesso). */
function trovaMeshDelNodo(nodo: Object3D): Mesh | null {
  let trovata: Mesh | null = null;
  nodo.traverse((figlio) => {
    if (!trovata && figlio instanceof Mesh) trovata = figlio;
  });
  return trovata;
}

/** Il colore della lampada accesa: il token del segnale all’andata (docs/design.md). */
function coloreDelSegnale(): Color {
  const valore = getComputedStyle(document.documentElement).getPropertyValue('--signal-forward').trim();
  return new Color(valore || 'white');
}

/** Risale dal pezzo colpito al tasto che lo contiene. */
function letteraDelTasto(oggetto: Object3D | null): string | null {
  for (let nodo = oggetto; nodo; nodo = nodo.parent) {
    const lettera = letteraDelNodo(nodo.name, 'tasto');
    if (lettera) return lettera;
  }
  return null;
}

/** La manina sopra i tasti e sopra i pezzi che hanno una scheda: la tela la cambia solo da qui. */
function mostraManina(tela: HTMLElement, cliccabile: boolean) {
  tela.style.cursor = cliccabile ? 'pointer' : '';
}

/** Dal nodo alla radice, con la `fase` che il caricatore glTF copia dagli `extras` in `userData`. */
function catenaDi(oggetto: Object3D | null): AnelloCatena[] {
  const catena: AnelloCatena[] = [];
  for (let nodo = oggetto; nodo; nodo = nodo.parent) {
    const fase = nodo.userData['fase'];
    catena.push({ nome: nodo.name, fase: typeof fase === 'number' ? fase : undefined });
  }
  return catena;
}

/**
 * Lo spessore del contorno del pezzo evidenziato, in pixel della tela. In drei 10 è il modo senza
 * `screenspace`: con `screenspace` lo spessore è in unità della mesh (il nome dice il contrario).
 */
const SPESSORE_CONTORNO = 3;

/**
 * Il contorno dei pezzi della scheda aperta (fase 5c): un `Outlines` di drei dentro ogni mesh dei
 * nodi, nel colore del segnale di ritorno, diverso dall’arancio delle lampade e dal rosso dei cavi.
 * Il contorno segue i pezzi nello smontaggio, perché sta dentro le loro mesh.
 */
function Evidenza({ scena, nodi }: { scena: Object3D; nodi: readonly string[] }) {
  const colore = useMemo(() => coloreDelToken('--signal-return', '#7cc0ff'), []);
  const invalidate = useThree((s) => s.invalidate);
  const mesh = useMemo(() => {
    const trovate: Mesh[] = [];
    for (const nome of nodi) scena.getObjectByName(nome)?.traverse((o) => o instanceof Mesh && trovate.push(o));
    return trovate;
  }, [scena, nodi]);
  useEffect(() => {
    invalidate();
    return () => invalidate();
  }, [mesh, invalidate]);
  return (
    <>
      {mesh.map((m) => (
        <Contorno key={m.uuid} mesh={m} colore={colore} />
      ))}
    </>
  );
}

function Contorno({ mesh, colore }: { mesh: Mesh; colore: Color }) {
  return createPortal(<Outlines thickness={SPESSORE_CONTORNO} color={colore} toneMapped={false} />, mesh);
}

/** L’emissivo della lettera accesa, e la luce sopra la lampada: quanto è forte, quanto sale sopra l’ancora, fin dove arriva. */
const INTENSITA_LAMPADA = 2.5;
const INTENSITA_LUCE_LAMPADA = 0.02;
const ALTEZZA_LUCE_LAMPADA = 0.008;
const PORTATA_LUCE_LAMPADA = 0.05;

/** Quanto dura il movimento di un tasto: i nottolini vanno e tornano, e i rotori spinti scattano avanti. */
const DURATA_PASSO_MS = 180;

/**
 * I nottolini ruotano su X attorno al perno; con la leva puntata verso l'asse del rotore, il verso
 * che fa salire la punta lungo il bordo del cricchetto, nel verso in cui il rotore avanza, è negativo.
 */
const VERSO_NOTTOLINO = -1;
const VERSO_LEVA = 1;

/** Dallo stato dell'animazione all'angolo di un rotore: il cammino più corto, anche quando passa da Z ad A. */
function angoloPiuVicino(da: number, a: number): number {
  const giro = 2 * Math.PI;
  return da + ((((a - da + Math.PI) % giro) + giro) % giro) - Math.PI;
}

const easeOut = (u: number) => 1 - (1 - u) ** 3;

/** Un tasto in corso: da dove partono i rotori spinti e quali nottolini sono in presa. */
interface Movimento {
  inizio: number;
  da: number[];
  a: number[];
  /** Quali rotori si muovono (quelli che il motore fa avanzare con questo tasto). */
  mossi: boolean[];
  /** Per ogni nottolino, da sinistra, se entra in una tacca. */
  inPresa: boolean[];
}

/**
 * Lega la scena allo store, che resta la sola fonte: a ogni cambiamento rotori, anelli, lampada e
 * tasto prendono il loro stato da lì. A ogni tasto i tre nottolini vanno e tornano (quelli in presa,
 * che trovano una tacca, di più) e i rotori che il motore fa avanzare scattano al loro posto: senza
 * animazione con `prefers-reduced-motion`. Restituisce la funzione che scioglie il legame.
 */
function collegaAlloStore(
  parti: Parti,
  store: SimulatorStore,
  luce: PointLight,
  ridisegna: () => void,
  ridotto: boolean,
): () => void {
  const segnale = coloreDelSegnale();
  luce.color.copy(segnale);
  const spento = new Color(0, 0, 0);
  let impulso = store.getState().pulse;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let abbassato: Object3D | undefined;
  let frame = 0;
  let scadenza: ReturnType<typeof setTimeout> | undefined;
  let movimento: Movimento | undefined;
  /** L'angolo che i rotori mostrano ora: sale con l'animazione, non salta da Z ad A. */
  const mostrati: number[] = parti.rotori.map(() => 0);

  const rialza = () => {
    if (abbassato) abbassato.position.y = abbassato.userData['riposo'] as number;
    abbassato = undefined;
  };

  const posaNottolini = (u: number, inPresa: boolean[]) => {
    parti.nottolini.forEach((nottolino, i) => {
      nottolino.rotation.x = VERSO_NOTTOLINO * angoloNottolino(u, inPresa[i] ?? false);
    });
    if (parti.leva) parti.leva.rotation.x = VERSO_LEVA * OSCILLAZIONE_LEVA * Math.sin(Math.PI * Math.min(u, 1));
  };

  const posaRotori = (u: number, m: Movimento) => {
    parti.rotori.forEach(({ rotore }, slot) => {
      const da = m.da[slot] ?? 0;
      const a = m.a[slot] ?? 0;
      mostrati[slot] = m.mossi[slot] ? da + (angoloPiuVicino(da, a) - da) * easeOut(u) : a;
      rotore.rotation.x = mostrati[slot] ?? 0;
    });
  };

  const fermaMovimento = () => {
    cancelAnimationFrame(frame);
    clearTimeout(scadenza);
    if (movimento) posaRotori(1, movimento);
    posaNottolini(0, []);
    movimento = undefined;
  };

  const passo = (ora: number) => {
    if (!movimento) return;
    const u = Math.min((ora - movimento.inizio) / DURATA_PASSO_MS, 1);
    posaRotori(u, movimento);
    posaNottolini(u, movimento.inPresa);
    ridisegna();
    if (u < 1) frame = requestAnimationFrame(passo);
    else fermaMovimento();
  };

  const applica = (state: SimulatorState) => {
    const { session } = state;
    const stato = currentState(session);
    const tasto = state.pulse !== impulso;
    // Un nuovo stato interrompe il movimento in corso, lasciando i pezzi dove devono stare.
    fermaMovimento();

    const obiettivo = parti.rotori.map((_, slot) => {
      const angoli = rotazioniRotore(stato?.positions[slot] ?? 0, toIndex(session.config.rings[slot] ?? 'A'));
      parti.rotori[slot]!.anello.rotation.x = angoli.anello;
      return angoli.rotore;
    });

    const ultimo = session.presses.at(-1);
    if (tasto && !ridotto && session.machine && ultimo) {
      const prima = session.presses.at(-2)?.state ?? initialState(session.machine);
      movimento = {
        inizio: performance.now(),
        da: [...mostrati],
        a: obiettivo,
        mossi: ultimo.step.moved.slice(-parti.rotori.length),
        inPresa: engagedPawls(session.machine, prima).slice(-parti.nottolini.length),
      };
      frame = requestAnimationFrame(passo);
      // Se il browser sospende i fotogrammi (scheda in secondo piano) il movimento finisce lo stesso.
      scadenza = setTimeout(() => {
        if (!movimento) return;
        cancelAnimationFrame(frame);
        passo(movimento.inizio + DURATA_PASSO_MS);
      }, DURATA_PASSO_MS + 80);
    } else {
      obiettivo.forEach((angolo, slot) => {
        mostrati[slot] = angolo;
        parti.rotori[slot]!.rotore.rotation.x = angolo;
      });
    }

    // La lampada accesa prende il colore del segnale anche nella tinta, e l’emissivo va oltre 1: con
    // il tone mapping è quello che fa sembrare accesa la lettera, non solo dipinta d’arancio.
    for (const [lettera, materiale] of parti.lampade) {
      const accesa = ultimo?.output === lettera;
      materiale.color.copy(accesa ? segnale : (materiale.userData['tinta'] as Color));
      materiale.emissive.copy(accesa ? segnale : spento);
      materiale.emissiveIntensity = accesa ? INTENSITA_LAMPADA : 0;
    }
    // Una luce piccola sopra la lampada accesa colora il bordo del foro. Resta nella scena anche spenta
    // (intensità 0): toglierla e rimetterla farebbe ricompilare i materiali a ogni tasto.
    const ancora = ultimo && parti.ancoreLampade.get(ultimo.output);
    if (ancora) {
      ancora.updateWorldMatrix(true, false);
      ancora.getWorldPosition(luce.position);
      luce.position.y += ALTEZZA_LUCE_LAMPADA;
    }
    luce.intensity = ancora ? INTENSITA_LUCE_LAMPADA : 0;

    // Il tasto scende solo quando lo si preme, non con Annulla né con un link che porta un messaggio.
    if (tasto) {
      impulso = state.pulse;
      clearTimeout(timer);
      rialza();
      const premuto = ultimo && parti.tasti.get(ultimo.input);
      if (premuto) {
        premuto.position.y = (premuto.userData['riposo'] as number) - CORSA_TASTO;
        abbassato = premuto;
        timer = setTimeout(() => {
          rialza();
          ridisegna();
        }, DURATA_TASTO_MS);
      }
    }
    ridisegna();
  };

  // Alla partenza i rotori stanno già dove devono, senza animazione.
  applica(store.getState());
  const smetti = store.subscribe(applica);
  return () => {
    smetti();
    clearTimeout(timer);
    fermaMovimento();
    rialza();
  };
}

/** I valori che dipendono dal selettore e che la scena applica al modello, fuori dal mixer. */
function applicaSmontaggio(parti: Parti, valore: number) {
  // Il nucleo si fa trasparente man mano che i rotori si aprono, perché dentro ci sia il cablaggio.
  const opacita = 1 - 0.85 * rampa(valore, 2, 3);
  for (const { nucleo } of parti.rotori) {
    if (!nucleo) continue;
    const eraTrasparente = nucleo.transparent;
    nucleo.opacity = opacita;
    nucleo.transparent = opacita < 1;
    nucleo.depthWrite = opacita >= 1;
    if (eraTrasparente !== nucleo.transparent) nucleo.needsUpdate = true;
  }
}

/** Il colore di un token, letto dal tema corrente (il segnale, i cavi, il cablaggio). */
function coloreDelToken(nome: string, ripiego: string): Color {
  const valore = getComputedStyle(document.documentElement).getPropertyValue(nome).trim();
  return new Color(valore || ripiego);
}

/** Il raggio di un filo del cablaggio, in metri: un filo di rame da un millimetro, più sottile dei cavi del pannello. */
const RAGGIO_FILO = 0.0005;

/**
 * Il cablaggio di un rotore: una linea per contatto, dalla faccia d’ingresso a quella d’uscita, nel
 * sistema del rotore, quindi gira con lui. Compare dalla fase 3, quando i rotori si aprono, e cambia
 * con il rotore scelto nella configurazione.
 */
function CablaggioRotore({
  parte,
  cablaggio,
  smontaggio,
}: {
  parte: ParteRotore;
  cablaggio: readonly number[];
  smontaggio: number;
}) {
  const colore = useMemo(() => coloreDelToken('--alu-bright', '#f2efe6'), []);
  // Fili con uno spessore vero, in metri: una linea in pixel resta larga uguale a ogni distanza,
  // quindi da lontano sembra un cavo e da vicino uno stuzzicadenti.
  const geometria = useMemo(() => {
    const dati = segmentiCablaggio(cablaggio, parte.raggio, parte.facce.ingresso, parte.facce.uscita);
    const fili = Array.from({ length: dati.length / 6 }, (_, i) => {
      const da = new Vector3(dati[i * 6], dati[i * 6 + 1], dati[i * 6 + 2]);
      const a = new Vector3(dati[i * 6 + 3], dati[i * 6 + 4], dati[i * 6 + 5]);
      return new TubeGeometry(new LineCurve3(da, a), 1, RAGGIO_FILO, 6);
    });
    const unita = mergeGeometries(fili);
    fili.forEach((filo) => filo.dispose());
    return unita;
  }, [cablaggio, parte]);
  useEffect(() => () => geometria.dispose(), [geometria]);
  const visibile = rampa(smontaggio, 2, 3);
  return createPortal(
    <mesh geometry={geometria} visible={visibile > 0}>
      <meshStandardMaterial
        color={colore}
        metalness={0.6}
        roughness={0.4}
        transparent={visibile < 1}
        opacity={visibile}
      />
    </mesh>,
    parte.rotore,
  );
}

/** Il cavo di una coppia del pannello a spine: una curva che esce dalla presa, si alza e rientra nell’altra. */
function curvaDelCavo(da: Vector3, a: Vector3): CatmullRomCurve3 {
  const distanza = da.distanceTo(a);
  const centro = da.clone().add(a).multiplyScalar(0.5);
  centro.z += 0.012 + distanza * 0.18;
  centro.y -= distanza * 0.12;
  const uscita = (p: Vector3) => p.clone().add(new Vector3(0, 0, 0.012));
  return new CatmullRomCurve3([da, uscita(da), centro, uscita(a), a]);
}

/** I cavi del pannello: dalle ancore `ancora_presa_<l>` della coppia. Compaiono quando lo sportello si è alzato. */
function CaviPannello({
  scena,
  coppie,
  smontaggio,
}: {
  scena: Object3D;
  coppie: readonly string[];
  smontaggio: number;
}) {
  const colore = useMemo(() => coloreDelToken('--print-red', '#b3261e'), []);
  const geometrie = useMemo(() => {
    scena.updateMatrixWorld(true);
    const presa = (lettera: string) =>
      scena.getObjectByName(`ancora_presa_${lettera.toLowerCase()}`)?.getWorldPosition(new Vector3()) ?? null;
    return coppie.flatMap((coppia) => {
      const da = presa(coppia[0] ?? '');
      const a = presa(coppia[1] ?? '');
      return da && a ? [new TubeGeometry(curvaDelCavo(da, a), 32, 0.0013, 8)] : [];
    });
  }, [scena, coppie]);
  useEffect(() => () => geometrie.forEach((g) => g.dispose()), [geometrie]);
  const visibili = smontaggio >= 0.8;
  return (
    <group visible={visibili}>
      {geometrie.map((geometria, i) => (
        <mesh key={i} geometry={geometria}>
          <meshStandardMaterial color={colore} roughness={0.6} />
        </mesh>
      ))}
    </group>
  );
}

/** I comandi che `Regia` dà alla pagina, più il centraggio su un pezzo per il doppio clic. */
interface ComandiScena extends ComandiCamera {
  centraSu: (nodo: Object3D) => void;
}

const { ACTION } = CameraControlsImpl;

/**
 * Il pezzo di macchina sotto un clic: risale dalla mesh colpita al nodo che `pezzoDelNodo` riconosce.
 * Un tasto non è un pezzo da centrare (il doppio clic lo ha già battuto due volte).
 */
function pezzoSotto(oggetto: Object3D | null): Object3D | null {
  for (let nodo = oggetto; nodo; nodo = nodo.parent) {
    if (letteraDelNodo(nodo.name, 'tasto')) return null;
    if (pezzoDelNodo(nodo.name)) return nodo;
  }
  return null;
}

/** Gesti, limiti e morbidezza della camera. Con `prefers-reduced-motion` niente morbidezza: la camera si ferma dove si lascia. */
function configuraControlli(controlli: CameraControlsImpl, ridotto: boolean) {
  Object.assign(controlli.mouseButtons, {
    left: ACTION.ROTATE,
    middle: ACTION.DOLLY,
    right: ACTION.TRUCK,
    wheel: ACTION.DOLLY,
  });
  Object.assign(controlli.touches, {
    one: ACTION.TOUCH_ROTATE,
    two: ACTION.TOUCH_DOLLY_TRUCK,
    three: ACTION.TOUCH_TRUCK,
  });
  controlli.minDistance = DISTANZA_MINIMA;
  controlli.maxDistance = DISTANZA_MASSIMA;
  controlli.minPolarAngle = 0;
  controlli.maxPolarAngle = POLARE_MASSIMO;
  controlli.dollyToCursor = false;
  controlli.smoothTime = ridotto ? 0 : 0.35;
  controlli.draggingSmoothTime = ridotto ? 0 : 0.08;
}

/** Trascinare con il tasto sinistro ruota; con Shift sposta. */
function sceltaDelTrascinamento(controlli: CameraControlsImpl, conShift: boolean) {
  controlli.mouseButtons.left = conShift ? ACTION.TRUCK : ACTION.ROTATE;
}

/** La camera come la leggono i test: azimut, angolo polare e distanza, sulla tela. */
function segnalaCamera(tela: HTMLElement, controlli: CameraControlsImpl) {
  tela.dataset['camera'] = [controlli.azimuthAngle, controlli.polarAngle, controlli.distance]
    .map((n) => n.toFixed(3))
    .join(' ');
}

/**
 * La regia della camera (fase 5g). Trascinare ruota, Shift o tasto destro spostano, rotella e pizzico
 * avvicinano; sul tocco un dito ruota e due spostano e pizzicano. Ad ogni fase dello smontaggio, e
 * con «Ripristina», la camera inquadra l'ingombro dei pezzi alla fase con un margine del 6 % della
 * scena su ogni lato; le viste predefinite fanno lo stesso da un'altra direzione. Lo spostamento è
 * limitato all'ingombro della macchina smontata. Con `prefers-reduced-motion` ogni passaggio salta.
 */
function Regia({
  fase,
  ridotto,
  ingombro,
  comandiRef,
  onCameraLibera,
  onZoom,
}: {
  fase: number;
  ridotto: boolean;
  /** L'ingombro dei nodi (tutta la macchina se `null`) quando lo smontaggio è alla fase intera `fase`. */
  ingombro: (fase: number, nodi: readonly string[] | null) => Box3;
  comandiRef: MutableRefObject<ComandiScena | null>;
  onCameraLibera: () => void;
  onZoom: (stato: StatoZoom) => void;
}) {
  const controlli = useThree((s) => s.controls) as CameraControlsImpl | null;
  const camera = useThree((s) => s.camera) as PerspectiveCamera;
  const { width, height } = useThree((s) => s.size);
  const tela = useThree((s) => s.gl.domElement);
  const invalidate = useThree((s) => s.invalidate);
  // Le funzioni che rispondono ai pulsanti leggono sempre i valori di adesso.
  const corrente = useRef({ fase, ridotto, aspetto: width / height });
  useEffect(() => {
    corrente.current = { fase, ridotto, aspetto: width / height };
  });

  const vai = useCallback(
    (direzione: Direzione, scatola: Box3, transizione: boolean) => {
      if (!controlli || scatola.isEmpty()) return;
      const { bersaglio, distanza } = inquadra(
        { min: scatola.min.toArray(), max: scatola.max.toArray() },
        direzione,
        (camera.fov * Math.PI) / 180,
        corrente.current.aspetto,
      );
      void controlli.rotateTo(
        angoloPiuVicinoA(controlli.azimuthAngle, direzione.azimut),
        direzione.polare,
        transizione,
      );
      void controlli.moveTo(...bersaglio, transizione);
      void controlli.dollyTo(Math.min(Math.max(distanza, DISTANZA_MINIMA), DISTANZA_MASSIMA), transizione);
      if (!transizione) controlli.update(0);
      invalidate();
    },
    [controlli, camera, invalidate],
  );

  // Gesti, limiti e morbidezza.
  useEffect(() => {
    if (!controlli) return;
    configuraControlli(controlli, ridotto);
    // Shift + trascinare sposta: camera-controls non ha il tasto fra le opzioni, quindi si sceglie l'azione a ogni pressione.
    const allaPressione = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse' || !(event.target instanceof Node) || !tela.contains(event.target)) return;
      sceltaDelTrascinamento(controlli, event.shiftKey);
    };
    window.addEventListener('pointerdown', allaPressione, true);
    const quandoSiTocca = () => onCameraLibera();
    controlli.addEventListener('controlstart', quandoSiTocca);
    return () => {
      window.removeEventListener('pointerdown', allaPressione, true);
      controlli.removeEventListener('controlstart', quandoSiTocca);
    };
  }, [controlli, ridotto, tela, onCameraLibera]);

  // Il limite dello spostamento: l'ingombro della macchina in tutte le fasi, con un po' d'aria.
  useEffect(() => {
    if (!controlli) return;
    const tutto = new Box3();
    for (let f = 0; f <= 4; f++) tutto.union(ingombro(f, null));
    controlli.setBoundary(tutto.expandByScalar(0.03));
  }, [controlli, ingombro]);

  // Il pulsante dello zoom si spegne ai limiti; il test legge la camera da `data-camera`.
  useEffect(() => {
    if (!controlli) return;
    let ultimo = '';
    const segnala = () => {
      const stato = {
        puoAvvicinare: controlli.distance > DISTANZA_MINIMA + 1e-3,
        puoAllontanare: controlli.distance < DISTANZA_MASSIMA - 1e-3,
      };
      const chiave = `${stato.puoAvvicinare}${stato.puoAllontanare}`;
      if (chiave !== ultimo) onZoom(stato);
      ultimo = chiave;
      segnalaCamera(tela, controlli);
    };
    segnala();
    controlli.addEventListener('update', segnala);
    return () => controlli.removeEventListener('update', segnala);
  }, [controlli, onZoom, tela]);

  // Ad ogni fase la camera torna all'inquadratura di quella fase; la prima volta senza transizione.
  const giaInquadrata = useRef(false);
  useEffect(() => {
    if (!controlli) return;
    vai(DIREZIONE_PREDEFINITA, ingombro(fase, null), giaInquadrata.current && !ridotto);
    giaInquadrata.current = true;
  }, [controlli, fase, ridotto, ingombro, vai]);

  useEffect(() => {
    if (!controlli) return;
    const vista = (id: string) => {
      const v = VISTE.find((x) => x.id === id);
      if (v) vai(v, ingombro(corrente.current.fase, v.nodi), !corrente.current.ridotto);
    };
    comandiRef.current = {
      vista,
      ripristina: () => vai(DIREZIONE_PREDEFINITA, ingombro(corrente.current.fase, null), !corrente.current.ridotto),
      zoom: (verso) => void controlli.dollyTo(distanzaDopoLoZoom(controlli.distance, verso), !corrente.current.ridotto),
      centraSu: (nodo) => {
        // Resta la direzione di adesso; cambia il bersaglio e la distanza.
        const direzione = { azimut: controlli.azimuthAngle, polare: controlli.polarAngle };
        nodo.updateWorldMatrix(true, true);
        vai(direzione, new Box3().expandByObject(nodo), !corrente.current.ridotto);
      },
    };
    return () => {
      comandiRef.current = null;
    };
  }, [controlli, comandiRef, ingombro, vai]);

  return null;
}

/** Porta l'azione in pausa al secondo voluto e fa applicare al mixer le posizioni di quel secondo. */
function portaLaClip(animazione: { mixer: AnimationMixer; azione: AnimationAction } | null, valore: number) {
  if (!animazione) return;
  animazione.azione.time = tempoClip(valore);
  animazione.mixer.update(0);
}

/** Il tempo della clip sulla tela, per i test: un attributo `data-tempo-clip`. */
function segnalaTempo(tela: HTMLElement, valore: number) {
  tela.dataset['tempoClip'] = String(tempoClip(valore));
}

/** L'animazione `smontaggio` del modello, in pausa: il selettore decide a che punto sta. */
function useSmontaggio(scena: Object3D, clip: AnimationClip | undefined) {
  return useMemo(() => {
    if (!clip) return null;
    const mixer = new AnimationMixer(scena);
    const azione: AnimationAction = mixer.clipAction(clip);
    azione.play();
    azione.paused = true;
    return { mixer, azione };
  }, [scena, clip]);
}

function Modello({
  store,
  fase,
  ridotto,
  bloccata,
  onBloccata,
  onPronto,
  comandiRef,
  onCameraLibera,
  onZoom,
  pezzi,
  evidenziati,
  onPezzo,
  onFasiPezzi,
}: {
  store: SimulatorStore;
  fase: number;
  ridotto: boolean;
  bloccata: boolean;
  onBloccata: () => void;
  onPronto: () => void;
  comandiRef: MutableRefObject<ComandiScena | null>;
  onCameraLibera: () => void;
  onZoom: (stato: StatoZoom) => void;
  pezzi: readonly Pezzo[];
  evidenziati: readonly string[] | null;
  onPezzo: (id: string) => void;
  onFasiPezzi: (fasi: Record<string, number | null>) => void;
}) {
  const { scene, animations } = useGLTF(modello3d.file, false, true);
  const invalidate = useThree((s) => s.invalidate);
  const tela = useThree((s) => s.gl.domElement);
  const parti = useMemo(() => preparaModello(scene), [scene]);
  const luceLampada = useMemo(() => new PointLight('white', 0, PORTATA_LUCE_LAMPADA, 2), []);
  const clip = animations.find((a) => a.name === 'smontaggio');
  const animazione = useSmontaggio(scene, clip);
  const machine = useStore(store, (s) => s.session.machine);
  const coppie = useStore(store, (s) => s.session.config.plugboard);

  // La fase scelta è un bersaglio: la clip ci arriva in un secondo per fase (subito con `prefers-reduced-motion`).
  const [valore, setValore] = useState(fase);
  const corrente = useRef(fase);
  const velocita = useRef(1);
  const ultimoMs = useRef(0);
  useEffect(() => {
    velocita.current = velocitaSmontaggio(corrente.current, fase);
    ultimoMs.current = performance.now();
    invalidate();
  }, [fase, invalidate]);
  // Il tempo è quello vero: con pochi fotogrammi al secondo i pezzi non rallentano, fanno meno passi.
  useFrame(() => {
    if (corrente.current === fase) return;
    const ora = performance.now();
    const secondi = Math.min((ora - ultimoMs.current) / 1000, 0.5);
    ultimoMs.current = ora;
    const passo = ridotto ? Infinity : secondi * velocita.current;
    corrente.current =
      corrente.current < fase ? Math.min(corrente.current + passo, fase) : Math.max(corrente.current - passo, fase);
    setValore(corrente.current);
    if (corrente.current !== fase) invalidate();
  });

  useEffect(() => {
    const sciogli = collegaAlloStore(parti, store, luceLampada, () => invalidate(), ridotto);
    onPronto();
    return sciogli;
  }, [store, parti, luceLampada, invalidate, onPronto, ridotto]);

  // L'ultima fase a cui i pezzi sono arrivati: l'ombra di contatto si rifà solo lì.
  // Si aggiorna durante il render, come vuole React per uno stato che deriva da un altro.
  const [faseArrivata, setFaseArrivata] = useState(fase);
  if (valore === fase && faseArrivata !== fase) setFaseArrivata(fase);

  // Il valore è il tempo della clip: l'azione sta in pausa e si porta al punto voluto.
  useEffect(() => {
    portaLaClip(animazione, valore);
    applicaSmontaggio(parti, valore);
    segnalaTempo(tela, valore);
    invalidate();
  }, [animazione, parti, valore, tela, invalidate]);

  // L'ingombro dei pezzi a una fase intera: si porta la clip lì, si misura e si rimette com'era.
  const ingombro = useCallback(
    (alla: number, nodi: readonly string[] | null): Box3 => {
      portaLaClip(animazione, alla);
      scene.updateMatrixWorld(true);
      const scatola = new Box3();
      for (const nome of nodi ?? []) {
        const nodo = scene.getObjectByName(nome);
        if (nodo) scatola.expandByObject(nodo);
      }
      if (scatola.isEmpty()) scatola.setFromObject(scene);
      portaLaClip(animazione, corrente.current);
      scene.updateMatrixWorld(true);
      return scatola;
    },
    [animazione, scene],
  );

  // Le schede dei pezzi: da nodo a scheda, e la fase in cui ogni pezzo si vede, per il pulsante della scheda.
  const indice = useMemo(() => indiceDeiNodi(pezzi), [pezzi]);
  useEffect(() => {
    const fasi: Record<string, number | null> = {};
    for (const pezzo of pezzi) {
      const primo = pezzo.nodi[0];
      const nodo = primo === undefined ? undefined : scene.getObjectByName(primo);
      fasi[pezzo.id] = nodo ? faseDelPezzo(pezzo, new Map([[nodo.name, catenaDi(nodo)]])) : null;
    }
    onFasiPezzi(fasi);
  }, [scene, pezzi, onFasiPezzi]);
  const schedaSotto = (oggetto: Object3D) => schedaDelClic(catenaDi(oggetto), indice, fase);

  // Il primo pezzo colpito decide: un tasto nascosto dietro la cassa non si preme. Un tasto batte la
  // sua lettera; ogni altro pezzo apre la sua scheda.
  const onClick = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    if (event.delta > 4) return; // era un trascinamento della camera
    const lettera = letteraDelTasto(event.object);
    if (!lettera) {
      const scheda = schedaSotto(event.object);
      if (scheda) onPezzo(scheda);
      return;
    }
    if (bloccata) onBloccata();
    else store.getState().press(lettera);
  };
  // Un doppio clic su un pezzo porta la camera su di lui.
  const onDoubleClick = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    const pezzo = pezzoSotto(event.object);
    if (!pezzo) return;
    comandiRef.current?.centraSu(pezzo);
    onCameraLibera();
  };
  const onPointerMove = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    mostraManina(tela, letteraDelTasto(event.object) !== null || schedaSotto(event.object) !== null);
  };

  return (
    <>
      <primitive
        object={scene}
        onClick={onClick}
        onDoubleClick={onDoubleClick}
        onPointerMove={onPointerMove}
        onPointerOut={() => mostraManina(tela, false)}
      />
      {machine &&
        parti.rotori.map((parte, slot) => {
          const rotore = machine.rotors[slot];
          return rotore ? (
            <CablaggioRotore key={parte.rotore.name} parte={parte} cablaggio={rotore.forward} smontaggio={valore} />
          ) : null;
        })}
      <primitive object={luceLampada} />
      {/* L'ombra si rifà quando i pezzi sono arrivati alla fase: durante il movimento resta quella di prima. */}
      <ContactShadows
        key={faseArrivata}
        frames={1}
        position={[0, -OMBRA.sotto, 0]}
        scale={OMBRA.lato}
        far={OMBRA.lontano}
        blur={OMBRA.sfumatura}
        opacity={OMBRA.opacita}
        resolution={OMBRA.risoluzione}
      />
      <CaviPannello scena={scene} coppie={coppie ?? EMPTY} smontaggio={valore} />
      {evidenziati && <Evidenza scena={scene} nodi={evidenziati} />}
      <Regia
        fase={fase}
        ridotto={ridotto}
        ingombro={ingombro}
        comandiRef={comandiRef}
        onCameraLibera={onCameraLibera}
        onZoom={onZoom}
      />
    </>
  );
}

const EMPTY: readonly string[] = [];

export default function Scena({
  store,
  fase,
  ridotto,
  bloccata,
  onBloccata,
  onPronto,
  comandiRef,
  onCameraLibera,
  onZoom,
  pezzi,
  evidenziati,
  onPezzo,
  onFasiPezzi,
}: {
  store: SimulatorStore;
  /** La fase dello smontaggio da raggiungere: da 0 (macchina chiusa) a 4 (meccanica sotto i tasti). */
  fase: number;
  /** `prefers-reduced-motion`: i pezzi e la camera saltano alle posizioni nuove, senza transizioni. */
  ridotto: boolean;
  /** Con la macchina smontata i tasti del modello non cifrano: il clic chiama `onBloccata`. */
  bloccata: boolean;
  onBloccata: () => void;
  onPronto: () => void;
  /** La scena vi mette i comandi della camera appena è pronta, per i pulsanti della pagina. */
  comandiRef: MutableRefObject<ComandiCamera | null>;
  /** La camera è stata mossa a mano (o con il doppio clic): nessuna vista predefinita è più attiva. */
  onCameraLibera: () => void;
  onZoom: (stato: StatoZoom) => void;
  /** Le schede dei pezzi (fase 5c): un clic su un pezzo chiama `onPezzo` con l’id della sua scheda. */
  pezzi: readonly Pezzo[];
  /** I nodi della scheda aperta, da contornare; `null` se non c’è una scheda aperta. */
  evidenziati: readonly string[] | null;
  onPezzo: (id: string) => void;
  /** Una volta, a modello caricato: in quale fase dello smontaggio si vede ogni pezzo (`null` se non si muove). */
  onFasiPezzi: (fasi: Record<string, number | null>) => void;
}) {
  return (
    <Canvas
      frameloop="demand"
      dpr={[1, 2]}
      camera={CAMERA}
      gl={{ alpha: true, antialias: true, toneMapping: ACESFilmicToneMapping, toneMappingExposure: RESA.esposizione }}
    >
      <directionalLight position={RESA.direzionale.posizione} intensity={RESA.direzionale.intensita} />
      <Environment
        files={modello3d.ambiente.file}
        environmentIntensity={RESA.ambiente.intensita}
        environmentRotation={[0, RESA.ambiente.rotazione, 0]}
      />
      <CameraControls makeDefault />
      <Suspense fallback={null}>
        <Modello
          store={store}
          fase={fase}
          ridotto={ridotto}
          bloccata={bloccata}
          onBloccata={onBloccata}
          onPronto={onPronto}
          comandiRef={comandiRef as MutableRefObject<ComandiScena | null>}
          onCameraLibera={onCameraLibera}
          onZoom={onZoom}
          pezzi={pezzi}
          evidenziati={evidenziati}
          onPezzo={onPezzo}
          onFasiPezzi={onFasiPezzi}
        />
      </Suspense>
    </Canvas>
  );
}
