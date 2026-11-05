import { Environment, Lightformer, OrbitControls, useGLTF } from '@react-three/drei';
import { Canvas, useThree, type ThreeEvent } from '@react-three/fiber';
import { Suspense, useEffect, useMemo } from 'react';
import { Color, Mesh, MeshStandardMaterial, type Material, type Object3D } from 'three';
import { toIndex } from '@/engine';
import { modello3d } from '@/lib/modello3d';
import { currentState } from '../simulator/session.ts';
import type { SimulatorState, SimulatorStore } from '../simulator/store.ts';
import { letteraDelNodo, NODI_ROTORI, offsetAtlante, rotazioniRotore } from './geometria.ts';

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

interface Parti {
  rotori: { rotore: Object3D; anello: Object3D }[];
  tasti: Map<string, Object3D>;
  lampade: Map<string, MeshStandardMaterial>;
}

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

  const rotori = NODI_ROTORI.map((nome) => {
    const rotore = scena.getObjectByName(nome);
    const anello = scena.getObjectByName(`${nome}_anello`);
    if (!rotore || !anello) throw new Error(`Il modello 3D non ha il nodo ${nome} o il suo anello.`);
    return { rotore, anello };
  });

  const parti = { rotori, tasti, lampade };
  scena.userData['parti'] = parti;
  return parti;
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

/**
 * Lega la scena allo store, che resta la sola fonte: a ogni cambiamento rotori, anelli, lampada e
 * tasto prendono il loro stato da lì. Restituisce la funzione che scioglie il legame.
 */
function collegaAlloStore(parti: Parti, store: SimulatorStore, ridisegna: () => void): () => void {
  const segnale = coloreDelSegnale();
  const spento = new Color(0, 0, 0);
  let impulso = store.getState().pulse;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let abbassato: Object3D | undefined;

  const rialza = () => {
    if (abbassato) abbassato.position.y = abbassato.userData['riposo'] as number;
    abbassato = undefined;
  };

  const applica = (state: SimulatorState) => {
    const { session } = state;
    const stato = currentState(session);
    parti.rotori.forEach(({ rotore, anello }, slot) => {
      const angoli = rotazioniRotore(stato?.positions[slot] ?? 0, toIndex(session.config.rings[slot] ?? 'A'));
      rotore.rotation.x = angoli.rotore;
      anello.rotation.x = angoli.anello;
    });

    // La lampada accesa prende il colore del segnale anche nella tinta: con il solo emissivo, sopra
    // la tessera crema, l’arancio si perderebbe nel bianco.
    const ultimo = session.presses.at(-1);
    for (const [lettera, materiale] of parti.lampade) {
      const accesa = ultimo?.output === lettera;
      materiale.color.copy(accesa ? segnale : (materiale.userData['tinta'] as Color));
      materiale.emissive.copy(accesa ? segnale : spento);
      materiale.emissiveIntensity = accesa ? 0.8 : 0;
    }

    // Il tasto scende solo quando lo si preme, non con Annulla né con un link che porta un messaggio.
    if (state.pulse !== impulso) {
      impulso = state.pulse;
      clearTimeout(timer);
      rialza();
      const tasto = ultimo && parti.tasti.get(ultimo.input);
      if (tasto) {
        tasto.position.y = (tasto.userData['riposo'] as number) - CORSA_TASTO;
        abbassato = tasto;
        timer = setTimeout(() => {
          rialza();
          ridisegna();
        }, DURATA_TASTO_MS);
      }
    }
    ridisegna();
  };

  applica(store.getState());
  const smetti = store.subscribe(applica);
  return () => {
    smetti();
    clearTimeout(timer);
    rialza();
  };
}

function Modello({ store, onPronto }: { store: SimulatorStore; onPronto: () => void }) {
  const { scene } = useGLTF(modello3d.file, false, false);
  const invalidate = useThree((s) => s.invalidate);
  const tela = useThree((s) => s.gl.domElement);
  const parti = useMemo(() => preparaModello(scene), [scene]);

  useEffect(() => {
    const sciogli = collegaAlloStore(parti, store, () => invalidate());
    onPronto();
    return sciogli;
  }, [store, parti, invalidate, onPronto]);

  // Il primo pezzo colpito decide: un tasto nascosto dietro la cassa non si preme.
  const onClick = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    if (event.delta > 4) return; // era un trascinamento della camera
    const lettera = letteraDelTasto(event.object);
    if (lettera) store.getState().press(lettera);
  };
  const onPointerMove = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    mostraManina(tela, letteraDelTasto(event.object) !== null);
  };

  return (
    <primitive
      object={scene}
      onClick={onClick}
      onPointerMove={onPointerMove}
      onPointerOut={() => mostraManina(tela, false)}
    />
  );
}

export default function Scena({
  store,
  ridotto,
  onPronto,
}: {
  store: SimulatorStore;
  /** `prefers-reduced-motion`: la camera si ferma appena si lascia il mouse, senza inerzia. */
  ridotto: boolean;
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
        <Modello store={store} onPronto={onPronto} />
      </Suspense>
      <OrbitControls
        makeDefault
        target={BERSAGLIO}
        enablePan={false}
        enableDamping={!ridotto}
        minDistance={0.3}
        maxDistance={2}
        maxPolarAngle={Math.PI / 2 - 0.05}
      />
    </Canvas>
  );
}
