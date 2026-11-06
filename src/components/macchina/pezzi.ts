/*
 * Le schede dei pezzi della pagina 3D (fase 5c di docs/piano/fase-5c.md): i tipi che la pagina passa
 * all’isola e i conti che non toccano three.js, così si provano senza WebGL. I dati stanno in
 * `src/content/pezzi.yaml`.
 */

/** Una scheda, come la pagina la passa all’isola: lezione e fonti già risolte alla build. */
export interface Pezzo {
  id: string;
  nome: string;
  /** I nodi del modello che aprono la scheda e che la scheda evidenzia. */
  nodi: readonly string[];
  descrizione: string;
  lezione: { href: string; titolo: string };
  fonti: readonly { autori: string; titolo: string; url?: string | undefined }[];
}

/** Un nodo della catena che va dalla mesh colpita alla radice: il nome e la sua `extras.fase`, se ce l’ha. */
export interface AnelloCatena {
  nome: string;
  fase?: number | undefined;
}

/** Da nome di nodo a id della scheda. */
export function indiceDeiNodi(pezzi: readonly Pick<Pezzo, 'id' | 'nodi'>[]): Map<string, string> {
  const indice = new Map<string, string>();
  for (const { id, nodi } of pezzi) for (const nodo of nodi) indice.set(nodo, id);
  return indice;
}

/**
 * La scheda che apre un clic: risale la catena dal nodo colpito al primo che ha una scheda. Un pezzo
 * che lo smontaggio stacca da un altro pezzo con la sua scheda (l’anello dal rotore) conta da solo
 * solo quando la fase scelta lo ha staccato: a rotori chiusi un clic sull’anello apre il rotore.
 */
export function schedaDelClic(
  catena: readonly AnelloCatena[],
  indice: ReadonlyMap<string, string>,
  faseScelta: number,
): string | null {
  const conScheda = catena.filter((nodo) => indice.has(nodo.nome));
  for (const [i, nodo] of conScheda.entries()) {
    const haUnPadreConScheda = i < conScheda.length - 1;
    const staccato = nodo.fase === undefined || nodo.fase <= faseScelta;
    if (!haUnPadreConScheda || staccato) return indice.get(nodo.nome) ?? null;
  }
  return null;
}

/**
 * La fase dello smontaggio in cui si vede il pezzo: la `fase` del primo dei suoi nodi, o del primo
 * antenato che ce l’ha; `null` se il pezzo non si muove (la scheda allora non ha il pulsante).
 * `catene` dà, per ogni nodo, la catena fino alla radice a partire dal nodo stesso.
 */
export function faseDelPezzo(
  pezzo: Pick<Pezzo, 'nodi'>,
  catene: ReadonlyMap<string, readonly AnelloCatena[]>,
): number | null {
  const primo = pezzo.nodi[0];
  const catena = primo === undefined ? undefined : catene.get(primo);
  return catena?.find((nodo) => nodo.fase !== undefined)?.fase ?? null;
}
