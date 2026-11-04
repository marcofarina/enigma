import type { MachineConfig, ModelId } from '../engine/index.ts';

/** Una parte di un messaggio storico: la chiave del messaggio e i due testi. */
export interface MissionPart {
  /** Indicatore come compare sul modulo, per esempio `WXC KCH`; manca se la procedura non è riproducibile. */
  indicatore?: string | undefined;
  /** Chiave del messaggio: le lettere nelle finestrelle all’inizio della parte. */
  posizioni: string;
  /** Testo cifrato senza i gruppi dell’indicatore, nei gruppi del modulo separati da spazi. */
  cifrato: string;
  /** Testo in chiaro atteso, solo lettere. */
  chiaro: string;
}

/** La chiave del giorno di un messaggio storico, come la scrive `src/content/missioni.yaml`. */
export interface MissionKey {
  modello: ModelId;
  riflettore: string;
  rotori: readonly string[];
  /** Ringstellung in lettere, `A` = 01. */
  anelli: string;
  /** Coppie del pannello separate da spazi. */
  spine: string;
}

/** Una missione come arriva al simulatore: dati serializzabili, già controllati dalla build. */
export interface Mission extends MissionKey {
  id: string;
  titolo: string;
  parti: readonly MissionPart[];
  contesto: string;
  procedura: string;
  traduzione: string;
  fonti: readonly { titolo: string; autori: string; url?: string | undefined }[];
  lezione?: { titolo: string; href: string } | undefined;
}

/** Configurazione della macchina per una parte del messaggio. */
export function missionConfig(key: MissionKey, part: Pick<MissionPart, 'posizioni'>): MachineConfig {
  return {
    model: key.modello,
    rotors: key.rotori,
    rings: key.anelli,
    positions: part.posizioni,
    reflector: key.riflettore,
    plugboard: key.spine.split(' ').filter(Boolean),
  };
}
