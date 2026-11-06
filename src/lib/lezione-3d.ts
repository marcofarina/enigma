import { toLetter } from '../engine/alphabet.ts';
import type { KeyPress, Stage } from '../engine/machine.ts';

/*
 * La lezione animata della pagina 3D (fase 5d di docs/piano.md, decisioni D16–D19). Il copione è un
 * dato, `src/content/lezione-3d/it.yaml`: questo modulo ne dà i tipi e i conti che non toccano
 * three.js né React, così si provano senza WebGL. La lettura del file, con lo schema, sta in
 * `copione-3d.ts`, che resta fuori dal bundle del browser.
 */

/** Le inquadrature con nome che il copione può chiedere; direzione e pezzi inquadrati stanno in `geometria.ts`. */
export const INQUADRATURE = ['insieme', 'tastiera', 'pannello', 'rotori', 'riflettore'] as const;
export type Inquadratura = (typeof INQUADRATURE)[number];

/**
 * Che cosa fa la scena in un passo. `premi` abbassa il tasto, `passo` fa avanzare i rotori, `segnale`
 * accende il percorso della corrente fino a uno stadio della traccia, `lampada` porta la corrente
 * alla lampada e la accende, `prova` («ora prova tu») restituisce la tastiera.
 */
export const AZIONI = ['premi', 'passo', 'segnale', 'lampada', 'prova'] as const;
export type Azione = (typeof AZIONI)[number];

/** Gli stadi della traccia dell’Enigma I, nell’ordine in cui la corrente li attraversa. */
export const STADI = [
  'spine-andata',
  'ingresso-andata',
  'rotore-destro-andata',
  'rotore-centrale-andata',
  'rotore-sinistro-andata',
  'riflettore',
  'rotore-sinistro-ritorno',
  'rotore-centrale-ritorno',
  'rotore-destro-ritorno',
  'ingresso-ritorno',
  'spine-ritorno',
] as const;
export type IdStadio = (typeof STADI)[number];

export interface PassoCopione {
  id: string;
  /** Una o due frasi: il sottotitolo, e il testo della voce se manca `voce`. */
  testo: string;
  /**
   * Il testo che legge la voce, quando non è uguale al sottotitolo: numeri romani e sigle scritti come
   * si pronunciano, e i tag audio di ElevenLabs fra parentesi quadre (`[pause]`), che a schermo non
   * vanno. Dice le stesse cose di `testo`.
   */
  voce?: string | undefined;
  camera: Inquadratura;
  /** Nodi del modello che diventano semitrasparenti, con i soli spigoli principali. */
  fantasma: string[];
  /** Nodi del modello con il contorno, come il pezzo di una scheda. */
  evidenzia: string[];
  azione?: Azione | undefined;
  /** Con `azione: segnale`, lo stadio fino a cui si accende il percorso. */
  fino?: IdStadio | undefined;
  /** L’azione dura tutto il passo, al rallentatore; altrimenti va alla velocità vera, all’inizio del passo. */
  rallenta: boolean;
}

export interface Copione {
  /** La configurazione nel formato della query della home (`v=1&m=I&…`). */
  configurazione: string;
  /** La lettera che si preme. */
  lettera: string;
  passi: PassoCopione[];
}

/** Il testo che legge la voce: `voce` se c’è, altrimenti il sottotitolo. */
export const testoDellaVoce = (passo: Pick<PassoCopione, 'testo' | 'voce'>): string => passo.voce ?? passo.testo;

/** Il testo della voce senza i tag audio fra parentesi quadre, per una voce che non li conosce. */
export const senzaTag = (testo: string): string =>
  testo
    .replace(/\[[^\]]*\]/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();

/** Per ogni passo, quanti secondi dura il suo audio e l’impronta del testo da cui è stato fatto. */
export type Durate = Record<string, { durata: number; hash: string }>;

/**
 * Gruppi di nodi che il copione può nominare in `fantasma` ed `evidenzia` al posto dei nodi uno per
 * uno: `lampade` sono le ventisei lampade, che non stanno sotto un nodo comune.
 */
export const GRUPPI_NODI: Readonly<Record<string, readonly string[]>> = {
  lampade: Array.from({ length: 26 }, (_, i) => `lampada_${String.fromCharCode(97 + i)}`),
};

/** I nodi di un elenco del copione, con i gruppi sciolti. */
export const nodiDi = (nomi: readonly string[]): string[] => nomi.flatMap((nome) => GRUPPI_NODI[nome] ?? [nome]);

/** Lo slot di un rotore, da sinistra, come nome di uno stadio. */
const NOME_SLOT = ['sinistro', 'centrale', 'destro'] as const;

/** Il nome di uno stadio della traccia, come lo scrive il copione. */
export function idStadio(stage: Stage): IdStadio {
  const verso = stage.direction === 'backward' ? 'ritorno' : 'andata';
  switch (stage.kind) {
    case 'plugboard':
      return `spine-${verso}` as IdStadio;
    case 'entry':
      return `ingresso-${verso}` as IdStadio;
    case 'reflector':
      return 'riflettore';
    case 'rotor':
      return `rotore-${NOME_SLOT[stage.slot ?? 0]}-${verso}` as IdStadio;
  }
}

/** Un punto del percorso, con un nome: la scena lo trova fra le ancore del modello o sulle facce dei rotori. */
export type Punto =
  | { tipo: 'tasto' | 'presa' | 'lampada'; lettera: string }
  | { tipo: 'ingresso' | 'riflettore'; contatto: number }
  | { tipo: 'rotore'; slot: number; faccia: 'destra' | 'sinistra'; contatto: number };

/** Un tratto diritto del percorso, che appartiene a uno stadio della traccia (o alla lampada). */
export interface Segmento {
  stadio: IdStadio | 'lampada';
  da: Punto;
  a: Punto;
  /** Dal riflettore in poi la corrente torna: la scena usa il colore del ritorno. */
  ritorno: boolean;
}

const uguali = (p: Punto, q: Punto) => JSON.stringify(p) === JSON.stringify(q);

/**
 * Il percorso della corrente per un tasto, tratto per tratto, dagli stadi della traccia del motore:
 * è giusto per costruzione. I tratti vanno diritti da un punto all’altro e non seguono i fili veri,
 * che corrono sotto la piastra.
 *
 * I contatti dei rotori sono quelli fissi, numerati come le lettere della ruota d’ingresso: lì
 * entra e esce la corrente, qualunque sia la posizione del rotore. La faccia destra di un rotore è
 * quella verso la ruota d’ingresso.
 */
export function segmentiDelPercorso(press: KeyPress): Segmento[] {
  const segmenti: Segmento[] = [];
  let ultimo: Punto = { tipo: 'tasto', lettera: press.input };
  let ritorno = false;
  const vai = (stadio: Segmento['stadio'], a: Punto) => {
    if (!uguali(ultimo, a)) segmenti.push({ stadio, da: ultimo, a, ritorno });
    ultimo = a;
  };
  for (const stage of press.stages) {
    const stadio = idStadio(stage);
    if (stage.kind === 'reflector') ritorno = true;
    switch (stage.kind) {
      case 'plugboard':
        // Dal tasto (o dalla ruota d’ingresso) alla presa della lettera, poi lungo il cavo, se c’è.
        vai(stadio, { tipo: 'presa', lettera: toLetter(stage.input) });
        vai(stadio, { tipo: 'presa', lettera: toLetter(stage.output) });
        break;
      case 'entry':
        vai(stadio, { tipo: 'ingresso', contatto: stage.direction === 'backward' ? stage.output : stage.input });
        break;
      case 'reflector':
        vai(stadio, { tipo: 'riflettore', contatto: stage.input });
        vai(stadio, { tipo: 'riflettore', contatto: stage.output });
        break;
      case 'rotor': {
        const slot = stage.slot ?? 0;
        const [entra, esce] =
          stage.direction === 'backward' ? (['sinistra', 'destra'] as const) : (['destra', 'sinistra'] as const);
        vai(stadio, { tipo: 'rotore', slot, faccia: entra, contatto: stage.input });
        vai(stadio, { tipo: 'rotore', slot, faccia: esce, contatto: stage.output });
        break;
      }
    }
  }
  vai('lampada', { tipo: 'lampada', lettera: press.output });
  return segmenti;
}

/** Quanto dura un’azione alla velocità vera, in secondi: il tasto scende, i rotori scattano (come in `Scena.tsx`). */
const DURATA_VERA: Record<Azione, number> = { premi: 0.14, passo: 0.18, segnale: 0, lampada: 0, prova: 0 };

/** A che punto è l’azione di un passo, da 0 a 1, dopo `t` secondi su `durata`. */
export function avanzamento(passo: PassoCopione, t: number, durata: number): number {
  const vera = passo.azione ? DURATA_VERA[passo.azione] : 0;
  const totale = passo.rallenta ? durata : vera;
  if (totale <= 0) return 1;
  return Math.min(Math.max(t / totale, 0), 1);
}

/** Che cosa mostra la scena a un istante della lezione. */
export interface Quadro {
  camera: Inquadratura;
  fantasma: readonly string[];
  evidenzia: readonly string[];
  /** Il tasto della lettera è giù: dal passo `premi` fino a «ora prova tu». */
  tastoGiu: boolean;
  /** I rotori fra lo stato di prima (0) e quello dopo il tasto (1). */
  passo: number;
  /** I tratti accesi: da `da` ad `a` tratti, con `u` da 0 a 1 la parte già percorsa fra i due. */
  segnale: { da: number; a: number; u: number };
  lampada: boolean;
  /** «Ora prova tu»: la scena torna allo store della pagina e la tastiera cifra di nuovo. */
  prova: boolean;
}

/** Quanti tratti del percorso arrivano fino allo stadio dato, compreso. */
export function trattiFino(segmenti: readonly Segmento[], stadio: IdStadio | 'lampada'): number {
  if (stadio === 'lampada') return segmenti.length;
  const fino = STADI.indexOf(stadio);
  let n = 0;
  segmenti.forEach((s, i) => {
    if (s.stadio !== 'lampada' && STADI.indexOf(s.stadio) <= fino) n = i + 1;
  });
  return n;
}

/**
 * Il quadro al passo `indice`, `t` secondi dopo il suo inizio. Ogni passo lascia la scena come l’ha
 * portata la sua azione: il quadro somma le azioni dei passi precedenti, finite, e quella del passo
 * corrente al suo punto. Così «passo precedente» e «passo successivo» non devono ricordare niente.
 */
export function quadroDelPasso(
  copione: Copione,
  segmenti: readonly Segmento[],
  durate: Durate,
  indice: number,
  t: number,
): Quadro {
  const passo = copione.passi[indice];
  if (!passo) throw new Error(`La lezione non ha il passo ${indice}.`);
  const quadro: Quadro = {
    camera: passo.camera,
    fantasma: passo.fantasma,
    evidenzia: passo.evidenzia,
    tastoGiu: false,
    passo: 0,
    segnale: { da: 0, a: 0, u: 1 },
    lampada: false,
    prova: false,
  };
  for (let i = 0; i <= indice; i++) {
    const p = copione.passi[i]!;
    const u = i === indice ? avanzamento(p, t, durate[p.id]?.durata ?? 0) : 1;
    const acceso = quadro.segnale.a;
    switch (p.azione) {
      case 'premi':
        quadro.tastoGiu = u > 0;
        break;
      case 'passo':
        quadro.passo = u;
        break;
      case 'segnale':
        quadro.segnale = { da: acceso, a: trattiFino(segmenti, p.fino ?? 'spine-andata'), u };
        break;
      case 'lampada':
        quadro.segnale = { da: acceso, a: segmenti.length, u };
        quadro.lampada = u >= 1;
        break;
      case 'prova':
        quadro.prova = true;
        quadro.tastoGiu = false;
        break;
      case undefined:
        break;
    }
    if (i < indice) quadro.segnale = { ...quadro.segnale, da: quadro.segnale.a, u: 1 };
  }
  return quadro;
}
