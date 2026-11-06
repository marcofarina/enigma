import { createStore, type StoreApi } from 'zustand';
import {
  createMachine,
  decodeConfigOrThrow,
  engagedPawls,
  initialState,
  pressKey,
  type KeyPress,
  type Machine,
  type MachineConfig,
  type MachineState,
} from '@/engine';
import {
  quadroDelPasso,
  segmentiDelPercorso,
  type Copione,
  type Durate,
  type Quadro,
  type Segmento,
} from '@/lib/lezione-3d';

/*
 * La lezione animata nella pagina 3D (fase 5d): il copione con il motore già fatto girare, e lo stato
 * del lettore che la scena legge fuori da React, a ogni fotogramma.
 */

/** A che punto è la lezione: il passo e i secondi dal suo inizio. Lo scrive il lettore, lo legge la scena. */
export interface StatoLezione {
  indice: number;
  t: number;
}
export type StoreLezione = StoreApi<StatoLezione>;

export const creaStoreLezione = (): StoreLezione => createStore<StatoLezione>()(() => ({ indice: 0, t: 0 }));

/** Il copione pronto per la scena: la configurazione, il tasto premuto con la sua traccia e il percorso. */
export interface Lezione {
  copione: Copione;
  durate: Durate;
  config: MachineConfig;
  machine: Machine;
  /** Lo stato dei rotori prima del tasto; quello dopo è `press.state`. */
  prima: MachineState;
  press: KeyPress;
  /** Per ogni nottolino, da sinistra, se entra in una tacca a questo tasto. */
  inPresa: boolean[];
  segmenti: Segmento[];
}

export function preparaLezione(copione: Copione, durate: Durate): Lezione {
  const config = decodeConfigOrThrow(copione.configurazione);
  const machine = createMachine(config);
  const prima = initialState(machine);
  const press = pressKey(machine, prima, copione.lettera);
  return {
    copione,
    durate,
    config,
    machine,
    prima,
    press,
    inPresa: engagedPawls(machine, prima),
    segmenti: segmentiDelPercorso(press),
  };
}

export const quadroDi = (lezione: Lezione, { indice, t }: StatoLezione): Quadro =>
  quadroDelPasso(lezione.copione, lezione.segmenti, lezione.durate, indice, t);

/** «Ora prova tu»: dal passo con l’azione `prova` la scena torna allo store della pagina. */
export const inProva = (lezione: Lezione, indice: number): boolean => lezione.copione.passi[indice]?.azione === 'prova';

/** La lezione animata come la riceve la scena: il copione con la traccia, e lo stato che scrive il lettore. */
export interface LezioneInScena {
  lezione: Lezione;
  stato: StoreLezione;
}
