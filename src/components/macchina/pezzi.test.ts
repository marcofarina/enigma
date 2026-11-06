import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';
import { faseDelPezzo, indiceDeiNodi, schedaDelClic, type AnelloCatena } from './pezzi.ts';

/*
 * Le schede dei pezzi (fase 5c): i conti del clic e la coerenza di `src/content/pezzi.yaml` con il
 * modello, le lezioni e le fonti.
 */

const radice = join(import.meta.dirname, '..', '..', '..');
const contenuti = join(radice, 'src', 'content');

interface Voce {
  id: string;
  nome: string;
  nodi: string[];
  descrizione: string;
  lezione: string;
  fonti?: string[];
}

const voci = parse(readFileSync(join(contenuti, 'pezzi.yaml'), 'utf8')) as Voce[];

/** I nodi del `.glb`: basta il blocco JSON, che meshopt non comprime. */
interface NodoGltf {
  name?: string;
  children?: number[];
  extras?: Record<string, unknown>;
}
function nodiDelModello(): NodoGltf[] {
  const dati = readFileSync(join(radice, 'public', 'modelli', 'enigma-i.glb'));
  const lunghezza = dati.readUInt32LE(12);
  const gltf = JSON.parse(dati.subarray(20, 20 + lunghezza).toString('utf8')) as { nodes?: NodoGltf[] };
  return gltf.nodes ?? [];
}
const nodi = nodiDelModello();

/** Per ogni nodo con un nome, la catena fino alla radice: il nodo, il padre, il nonno… */
function catene(): Map<string, AnelloCatena[]> {
  const padre = new Map<number, number>();
  nodi.forEach((n, i) => n.children?.forEach((figlio) => padre.set(figlio, i)));
  const risultato = new Map<string, AnelloCatena[]>();
  nodi.forEach((n, i) => {
    if (!n.name) return;
    const catena: AnelloCatena[] = [];
    for (let j: number | undefined = i; j !== undefined; j = padre.get(j)) {
      const nodo = nodi[j]!;
      const fase = nodo.extras?.['fase'];
      catena.push({ nome: nodo.name ?? '', fase: typeof fase === 'number' ? fase : undefined });
    }
    risultato.set(n.name, catena);
  });
  return risultato;
}
const catenePerNome = catene();
const indice = indiceDeiNodi(voci);

describe('conti delle schede', () => {
  const catena = (...anelli: [string, number?][]): AnelloCatena[] => anelli.map(([nome, fase]) => ({ nome, fase }));
  const prova = new Map([
    ['rotore', 'rotore'],
    ['anello', 'anello'],
  ]);

  it('risale al primo antenato con una scheda', () => {
    expect(schedaDelClic(catena(['tacca'], ['anello', 3], ['rotore', 2], ['scena']), prova, 3)).toBe('anello');
    expect(schedaDelClic(catena(['vite'], ['scena']), prova, 0)).toBeNull();
  });

  it('un pezzo staccabile conta da solo solo dalla sua fase', () => {
    const anello = catena(['anello', 3], ['rotore', 2], ['scena']);
    expect(schedaDelClic(anello, prova, 2)).toBe('rotore');
    expect(schedaDelClic(anello, prova, 3)).toBe('anello');
    // Il rotore non ha un padre con una scheda: si apre a ogni fase.
    expect(schedaDelClic(catena(['rotore', 2], ['scena']), prova, 0)).toBe('rotore');
  });

  it('la fase del pezzo è la sua o quella del primo antenato', () => {
    const fasi = new Map([
      ['tacca', catena(['tacca'], ['anello', 3], ['rotore', 2])],
      ['piastra', catena(['piastra'], ['scena'])],
    ]);
    expect(faseDelPezzo({ nodi: ['tacca'] }, fasi)).toBe(3);
    expect(faseDelPezzo({ nodi: ['piastra'] }, fasi)).toBeNull();
  });
});

describe('src/content/pezzi.yaml', () => {
  it('ha id e nodi senza doppioni', () => {
    const ids = voci.map((v) => v.id);
    expect(new Set(ids).size).toBe(ids.length);
    const tutti = voci.flatMap((v) => v.nodi);
    expect(new Set(tutti).size).toBe(tutti.length);
  });

  it('ogni nodo è un nodo del .glb', () => {
    const nomi = new Set(nodi.map((n) => n.name));
    expect(voci.flatMap((v) => v.nodi).filter((nodo) => !nomi.has(nodo))).toEqual([]);
  });

  it('ogni nodo che lo smontaggio muove ha una scheda', () => {
    const conFase = nodi.filter((n) => n.extras?.['fase'] !== undefined).map((n) => n.name ?? '');
    expect(conFase.length).toBeGreaterThan(0);
    expect(conFase.filter((nome) => !indice.has(nome))).toEqual([]);
  });

  it('ogni lezione esiste', () => {
    const lezioni = new Set<string>();
    const cartella = join(contenuti, 'lezioni', 'it');
    for (const file of readdirSync(cartella, { recursive: true, encoding: 'utf8' })) {
      if (!file.endsWith('.mdx')) continue;
      const sorgente = readFileSync(join(cartella, file), 'utf8');
      const sezione = /^sezione:\s*(\S+)/m.exec(sorgente)?.[1];
      const slug = file
        .split('/')
        .at(-1)!
        .replace(/^\d+-/, '')
        .replace(/\.mdx$/, '');
      lezioni.add(`${sezione}/${slug}/`);
    }
    expect(voci.filter((v) => !lezioni.has(v.lezione)).map((v) => v.lezione)).toEqual([]);
  });

  it('ogni fonte è in fonti.yaml', () => {
    const fonti = new Set(
      (parse(readFileSync(join(contenuti, 'fonti.yaml'), 'utf8')) as { id: string }[]).map((f) => f.id),
    );
    expect(voci.flatMap((v) => v.fonti ?? []).filter((id) => !fonti.has(id))).toEqual([]);
  });

  it('sul modello vero: l’anello apre il rotore finché i rotori sono chiusi', () => {
    const anello = catenePerNome.get('rotore_destro_anello')!;
    expect(schedaDelClic(anello, indice, 0)).toBe('rotore-destro');
    expect(schedaDelClic(anello, indice, 3)).toBe('anello');
    expect(schedaDelClic(catenePerNome.get('rotore_destro_tacca')!, indice, 4)).toBe('anello');
    expect(schedaDelClic(catenePerNome.get('tasto_q')!, indice, 0)).toBe('tastiera');
  });

  it('sul modello vero: la fase del pezzo, o nessuna', () => {
    const fase = (id: string) =>
      faseDelPezzo(
        voci.find((v) => v.id === id)!,
        catenePerNome,
      );
    expect(fase('anello')).toBe(3);
    expect(fase('rotore-sinistro')).toBe(2);
    expect(fase('batteria')).toBe(4);
    expect(fase('lampade')).toBeNull();
    expect(fase('ruota-ingresso')).toBeNull();
  });
});
