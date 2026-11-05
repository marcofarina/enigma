import { Environment, Lightformer, OrbitControls, useGLTF } from '@react-three/drei';
import { Canvas, createPortal, useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import { Suspense, useEffect, useMemo, useRef } from 'react';
import {
  AnimationMixer,
  CatmullRomCurve3,
  Color,
  LineCurve3,
  Mesh,
  MeshStandardMaterial,
  TubeGeometry,
  Vector3,
  type AnimationAction,
  type AnimationClip,
  type Material,
  type Object3D,
} from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { useStore } from 'zustand';
import { engagedPawls, initialState, toIndex } from '@/engine';
import { modello3d } from '@/lib/modello3d';
import { currentState } from '../simulator/session.ts';
import type { SimulatorState, SimulatorStore } from '../simulator/store.ts';
import {
  angoloNottolino,
  inquadratura,
  letteraDelNodo,
  NODI_ROTORI,
  offsetAtlante,
  OSCILLAZIONE_LEVA,
  rampa,
  rotazioniRotore,
  segmentiCablaggio,
  tempoClip,
} from './geometria.ts';

/*
 * La scena della pagina 3D. Sta in un modulo a sé, importato solo dopo «Avvia la vista 3D»: con lui
 * arrivano three.js, React Three Fiber e drei. Nessuna richiesta esce dal sito: il `.glb` sta in
 * `public/`, niente Draco (drei ne scaricherebbe il decoder da gstatic) e niente `preset` di
 * `<Environment>` (li scarica da un CDN); la luce la fanno i Lightformer.
 */

/** Il punto che la camera guarda: il centro della macchina, poco sopra il fondo (come l’anteprima). */
const BERSAGLIO: [number, number, number] = [0, 0.055, 0];

/**
 * La camera dell’anteprima di `scripts/blender/costruisci.py`, convertita in glTF: obiettivo da
 * 50 mm su sensore da 36 mm, cioè 22,9° di campo verticale a 16:9. Così l’anteprima e la prima
 * immagine della scena coincidono.
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

/**
 * Tasti e lampade sono copie della stessa mesh, che punta alla cella della A nell’atlante: ognuno
 * riceve un materiale suo, con la texture clonata (l’immagine resta una) e spostata sulla sua
 * lettera (convenzione-3d, «Lettere e numeri»).
 */
function materialeConLettera(materiale: MeshStandardMaterial, lettera: string): MeshStandardMaterial {
  const copia = materiale.clone();
  if (materiale.map) {
    const mappa = materiale.map.clone();
    const { x, y } = offsetAtlante(toIndex(lettera));
    mappa.offset.set(x, y);
    copia.map = mappa;
  }
  return copia;
}

/** Trova i nodi che la pagina muove e dà a tasti e lampade la loro lettera. Una volta sola per scena. */
function preparaModello(scena: Object3D): Parti {
  const giaPronte = scena.userData['parti'] as Parti | undefined;
  if (giaPronte) return giaPronte;

  const tasti = new Map<string, Object3D>();
  const lampade = new Map<string, MeshStandardMaterial>();
  scena.traverse((nodo) => {
    const tasto = letteraDelNodo(nodo.name, 'tasto');
    if (tasto) {
      tasti.set(tasto, nodo);
      nodo.userData['riposo'] = nodo.position.y;
      const cima = trovaMateriale(nodo, 'cima_tasto');
      if (cima) cima.mesh.material = materialeConLettera(cima.materiale, tasto);
    }
    const lampada = letteraDelNodo(nodo.name, 'lampada');
    if (lampada) {
      const vetro = trovaMateriale(nodo, 'vetro');
      if (vetro) {
        const materiale = materialeConLettera(vetro.materiale, lampada);
        // La lampada accesa illumina la tessera e lascia scura la lettera.
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

  const parti = { rotori, nottolini, leva: scena.getObjectByName('leva_tasti') ?? undefined, tasti, lampade };
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

/** La manina sopra i tasti: la tela la cambia solo da qui. */
function mostraManina(tela: HTMLElement, sopraUnTasto: boolean) {
  tela.style.cursor = sopraUnTasto ? 'pointer' : '';
}

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
function collegaAlloStore(parti: Parti, store: SimulatorStore, ridisegna: () => void, ridotto: boolean): () => void {
  const segnale = coloreDelSegnale();
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

    // La lampada accesa prende il colore del segnale anche nella tinta: con il solo emissivo, sopra
    // la tessera crema, l’arancio si perderebbe nel bianco.
    for (const [lettera, materiale] of parti.lampade) {
      const accesa = ultimo?.output === lettera;
      materiale.color.copy(accesa ? segnale : (materiale.userData['tinta'] as Color));
      materiale.emissive.copy(accesa ? segnale : spento);
      materiale.emissiveIntensity = accesa ? 0.8 : 0;
    }

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

/**
 * La camera segue lo smontaggio: sale e si allontana per tenere nel quadro i pezzi che escono.
 * Cambia solo il punto guardato e la distanza, non l'angolo: la direzione scelta con il mouse resta.
 * Con `prefers-reduced-motion` salta alla nuova inquadratura senza transizione.
 */
/** Lo stato della camera rispetto all'inquadratura della macchina chiusa: dove guarda e di quanto si è allontanata. */
interface QuadroCamera {
  y: number;
  scala: number;
}

/** Porta la camera di un tratto `k` (da 0 a 1) verso `voluta`, e dice se manca ancora strada. */
function avvicinaCamera(
  controlli: { target: Vector3; update: () => void },
  camera: Object3D,
  quadro: QuadroCamera,
  voluta: QuadroCamera,
  k: number,
): boolean {
  const y = quadro.y + (voluta.y - quadro.y) * k;
  const scala = quadro.scala + (voluta.scala - quadro.scala) * k;
  const dy = y - quadro.y;
  controlli.target.y += dy;
  camera.position.y += dy;
  // La distanza cambia di quanto cambia la scala, così lo zoom scelto con la rotella resta.
  const scarto = camera.position
    .clone()
    .sub(controlli.target)
    .multiplyScalar(scala / quadro.scala);
  camera.position.copy(controlli.target).add(scarto);
  quadro.y = y;
  quadro.scala = scala;
  controlli.update();
  return Math.abs(voluta.y - y) > 1e-4 || Math.abs(voluta.scala - scala) > 1e-3;
}

function CameraSullo({ smontaggio, ridotto }: { smontaggio: number; ridotto: boolean }) {
  const controlli = useThree((s) => s.controls) as { target: Vector3; update: () => void } | null;
  const camera = useThree((s) => s.camera);
  const invalidate = useThree((s) => s.invalidate);
  const quadro = useRef<QuadroCamera>({ y: BERSAGLIO[1], scala: 1 });
  useEffect(() => invalidate(), [smontaggio, invalidate]);
  useFrame((_, dt) => {
    if (!controlli) return;
    const k = ridotto ? 1 : 1 - Math.exp(-dt * 7);
    if (avvicinaCamera(controlli, camera, quadro.current, inquadratura(smontaggio), k)) invalidate();
  });
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
  smontaggio,
  ridotto,
  bloccata,
  onBloccata,
  onPronto,
}: {
  store: SimulatorStore;
  smontaggio: number;
  ridotto: boolean;
  bloccata: boolean;
  onBloccata: () => void;
  onPronto: () => void;
}) {
  const { scene, animations } = useGLTF(modello3d.file, false, false);
  const invalidate = useThree((s) => s.invalidate);
  const tela = useThree((s) => s.gl.domElement);
  const parti = useMemo(() => preparaModello(scene), [scene]);
  const clip = animations.find((a) => a.name === 'smontaggio');
  const animazione = useSmontaggio(scene, clip);
  const machine = useStore(store, (s) => s.session.machine);
  const coppie = useStore(store, (s) => s.session.config.plugboard);

  useEffect(() => {
    const sciogli = collegaAlloStore(parti, store, () => invalidate(), ridotto);
    onPronto();
    return sciogli;
  }, [store, parti, invalidate, onPronto, ridotto]);

  // Il selettore è il tempo della clip: l'azione sta in pausa e si porta al punto voluto.
  useEffect(() => {
    portaLaClip(animazione, smontaggio);
    applicaSmontaggio(parti, smontaggio);
    segnalaTempo(tela, smontaggio);
    invalidate();
  }, [animazione, parti, smontaggio, tela, invalidate]);

  // Il primo pezzo colpito decide: un tasto nascosto dietro la cassa non si preme.
  const onClick = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    if (event.delta > 4) return; // era un trascinamento della camera
    const lettera = letteraDelTasto(event.object);
    if (!lettera) return;
    if (bloccata) onBloccata();
    else store.getState().press(lettera);
  };
  const onPointerMove = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    mostraManina(tela, letteraDelTasto(event.object) !== null);
  };

  return (
    <>
      <primitive
        object={scene}
        onClick={onClick}
        onPointerMove={onPointerMove}
        onPointerOut={() => mostraManina(tela, false)}
      />
      {machine &&
        parti.rotori.map((parte, slot) => {
          const rotore = machine.rotors[slot];
          return rotore ? (
            <CablaggioRotore key={parte.rotore.name} parte={parte} cablaggio={rotore.forward} smontaggio={smontaggio} />
          ) : null;
        })}
      <CaviPannello scena={scene} coppie={coppie ?? EMPTY} smontaggio={smontaggio} />
      <CameraSullo smontaggio={smontaggio} ridotto={ridotto} />
    </>
  );
}

const EMPTY: readonly string[] = [];

export default function Scena({
  store,
  smontaggio,
  ridotto,
  bloccata,
  onBloccata,
  onPronto,
}: {
  store: SimulatorStore;
  /** Il selettore: da 0 (macchina chiusa) a 4 (meccanica sotto i tasti), il tempo in secondi della clip `smontaggio`. */
  smontaggio: number;
  /** `prefers-reduced-motion`: la camera si ferma appena si lascia il mouse e salta alle inquadrature, senza animazioni. */
  ridotto: boolean;
  /** Con la macchina smontata i tasti del modello non cifrano: il clic chiama `onBloccata`. */
  bloccata: boolean;
  onBloccata: () => void;
  onPronto: () => void;
}) {
  return (
    <Canvas frameloop="demand" dpr={[1, 2]} flat camera={CAMERA} gl={{ alpha: true, antialias: true }}>
      <ambientLight intensity={0.6} />
      <directionalLight position={[-0.5, 1.2, 0.8]} intensity={1.8} />
      {/* Riflessi per i metalli, fatti in scena: nessun file HDR da scaricare. */}
      <Environment resolution={128}>
        <Lightformer form="rect" intensity={1.5} position={[0, 3, 0]} rotation-x={Math.PI / 2} scale={[6, 6, 1]} />
        <Lightformer form="rect" intensity={0.8} position={[-3, 1, 2]} rotation-y={Math.PI / 3} scale={[3, 2, 1]} />
        <Lightformer form="rect" intensity={0.6} position={[3, 1, -2]} rotation-y={-Math.PI / 2} scale={[3, 2, 1]} />
      </Environment>
      <Suspense fallback={null}>
        <Modello
          store={store}
          smontaggio={smontaggio}
          ridotto={ridotto}
          bloccata={bloccata}
          onBloccata={onBloccata}
          onPronto={onPronto}
        />
      </Suspense>
      <OrbitControls
        makeDefault
        target={BERSAGLIO}
        enablePan={false}
        enableDamping={!ridotto}
        minDistance={0.3}
        maxDistance={3}
        maxPolarAngle={Math.PI / 2 - 0.05}
      />
    </Canvas>
  );
}
