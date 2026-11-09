import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { createMachine, decodeConfigOrThrow, initialState, pressKey } from '../engine/index.ts';
import { impronta, leggiCopione, lezioneDellaPagina } from './copione-3d.ts';
import {
  avanzamento,
  quadroDelPasso,
  segmentiDelPercorso,
  senzaTag,
  STADI,
  testoDellaVoce,
  trattiFino,
  type Durate,
  type PassoCopione,
} from './lezione-3d.ts';

/*
 * La lezione animata della pagina 3D (fase 5d): il copione, il percorso della corrente che viene dalla
 * traccia del motore, il quadro di ogni passo e l’audio.
 */

const radice = join(import.meta.dirname, '..', '..');
const sorgente = readFileSync(join(radice, 'src', 'content', 'lezione-3d', 'it.yaml'), 'utf8');
const copione = leggiCopione(sorgente);
const config = decodeConfigOrThrow(copione.configurazione);
const machine = createMachine(config);
const press = pressKey(machine, initialState(machine), copione.lettera);
const segmenti = segmentiDelPercorso(press);
const durate = JSON.parse(readFileSync(join(radice, 'public', 'lezione-3d', 'it', 'durate.json'), 'utf8')) as Durate;
const indiceDi = (id: string) => copione.passi.findIndex((p) => p.id === id);

/** I nodi del `.glb`, dal blocco JSON (come in `pezzi.test.ts`). */
function nomiDelModello(): Set<string> {
  const dati = readFileSync(join(radice, 'public', 'modelli', 'enigma-i.glb'));
  const lunghezza = dati.readUInt32LE(12);
  const gltf = JSON.parse(dati.subarray(20, 20 + lunghezza).toString('utf8')) as { nodes?: { name?: string }[] };
  return new Set((gltf.nodes ?? []).flatMap((n) => (n.name ? [n.name] : [])));
}

describe('copione', () => {
  it('è un’Enigma I con una lettera sola, e il motore la cifra', () => {
    expect(config.model).toBe('I');
    expect(press.output).toMatch(/^[A-Z]$/);
  });

  it('sottotitolo e voce nominano la lampada che il motore accende', () => {
    const lampada = copione.passi.find((p) => p.azione === 'lampada')!;
    expect(lampada.testo).toContain(`lampada ${press.output}`);
    expect(senzaTag(testoDellaVoce(lampada))).toContain(`lampada ${press.output}`);
  });

  it('i tag audio stanno solo nel testo della voce', () => {
    expect(copione.passi.filter((p) => /[[\]]/.test(p.testo)).map((p) => p.id)).toEqual([]);
    expect(senzaTag('Si accende. [pause] La macchina [slowly] cifra.')).toBe('Si accende. La macchina cifra.');
  });

  it('i nodi di fantasma ed evidenzia sono nel modello', () => {
    const nomi = nomiDelModello();
    const mancanti = copione.passi.flatMap((p) => [...p.fantasma, ...p.evidenzia]).filter((n) => !nomi.has(n));
    expect(mancanti).toEqual([]);
  });

  it('il gruppo lampade si scioglie nelle ventisei lampade', () => {
    const dentro = copione.passi[indiceDi('ingresso')]!;
    expect(dentro.fantasma.filter((n) => n.startsWith('lampada_'))).toHaveLength(26);
  });

  it('rifiuta un copione con le azioni fuori ordine o un segnale senza stadio', () => {
    const passi = (righe: string) => `configurazione: ${copione.configurazione}\nlettera: A\npassi:\n${righe}`;
    const passo = (id: string, extra = '') => `  - id: ${id}\n    testo: x\n    camera: insieme\n${extra}`;
    expect(() =>
      leggiCopione(
        passi(
          passo('a', '    azione: passo\n') +
            passo('b', '    azione: premi\n') +
            passo('c', '    azione: segnale\n    fino: spine-ritorno\n') +
            passo('d', '    azione: lampada\n') +
            passo('e', '    azione: prova\n'),
        ),
      ),
    ).toThrow(/in quest’ordine/);
    expect(() => leggiCopione(passi(passo('a', '    azione: segnale\n') + passo('b', '    azione: prova\n')))).toThrow(
      /fino/,
    );
  });
});

describe('percorso della corrente', () => {
  it('va dal tasto alla lampada e tocca gli stadi nell’ordine della traccia', () => {
    expect(segmenti[0]?.da).toEqual({ tipo: 'tasto', lettera: copione.lettera });
    expect(segmenti.at(-1)?.a).toEqual({ tipo: 'lampada', lettera: press.output });
    const stadi = segmenti.flatMap((s) => (s.stadio === 'lampada' ? [] : [STADI.indexOf(s.stadio)]));
    expect(stadi).toEqual([...stadi].sort((a, b) => a - b));
    expect(new Set(stadi).size).toBe(STADI.length);
  });

  it('i tratti si toccano: ognuno parte dove finisce il precedente', () => {
    segmenti.slice(1).forEach((s, i) => expect(s.da).toEqual(segmenti[i]!.a));
  });

  it('un cavo del pannello aggiunge il tratto fra le due prese, all’andata e al ritorno', () => {
    const prese = segmenti.filter((s) => s.da.tipo === 'presa' && s.a.tipo === 'presa');
    const plugboard = press.stages.filter((s) => s.kind === 'plugboard');
    expect(prese).toHaveLength(plugboard.filter((s) => s.input !== s.output).length);
  });

  it('nei rotori entra dalla faccia destra all’andata e dalla sinistra al ritorno, sui contatti della traccia', () => {
    for (const stage of press.stages.filter((s) => s.kind === 'rotor')) {
      const tratto = segmenti.find(
        (s) =>
          s.da.tipo === 'rotore' &&
          s.a.tipo === 'rotore' &&
          s.da.slot === stage.slot &&
          s.ritorno === (stage.direction === 'backward'),
      );
      expect(tratto?.da).toMatchObject({
        faccia: stage.direction === 'backward' ? 'sinistra' : 'destra',
        contatto: stage.input,
      });
      expect(tratto?.a).toMatchObject({ contatto: stage.output });
    }
  });

  it('il ritorno comincia al riflettore', () => {
    const primo = segmenti.findIndex((s) => s.ritorno);
    expect(segmenti[primo]?.stadio).toBe('riflettore');
    expect(segmenti.slice(primo).every((s) => s.ritorno)).toBe(true);
  });

  it('trattiFino conta i tratti fino allo stadio compreso', () => {
    expect(trattiFino(segmenti, 'spine-ritorno')).toBe(segmenti.length - 1);
    expect(trattiFino(segmenti, 'lampada')).toBe(segmenti.length);
    expect(trattiFino(segmenti, 'spine-andata')).toBeGreaterThan(0);
  });
});

describe('quadro dei passi', () => {
  const quadro = (id: string, t: number) => quadroDelPasso(copione, segmenti, durate, indiceDi(id), t);
  const durata = (id: string) => durate[id]!.durata;

  it('all’apertura il tasto è su, i rotori fermi, niente corrente', () => {
    expect(quadro('apertura', 0)).toMatchObject({ tastoGiu: false, passo: 0, lampada: false, prova: false });
    expect(quadro('apertura', 0).segnale.a).toBe(0);
  });

  it('al rallentatore il passo dei rotori dura tutto l’audio', () => {
    expect(quadro('passo', 0).passo).toBe(0);
    expect(quadro('passo', durata('passo') / 2).passo).toBeCloseTo(0.5);
    expect(quadro('passo', durata('passo')).passo).toBe(1);
    expect(quadro('spine-andata', 0).passo).toBe(1);
  });

  it('il segnale riparte da dove era arrivato il passo prima', () => {
    const q = quadro('rotori-andata', 0);
    expect(q.segnale.da).toBe(trattiFino(segmenti, 'rotore-destro-andata'));
    expect(q.segnale.a).toBe(trattiFino(segmenti, 'rotore-sinistro-andata'));
    expect(q.segnale.u).toBe(0);
  });

  it('la lampada si accende quando la corrente ci arriva, e resta accesa', () => {
    expect(quadro('lampada', 0).lampada).toBe(false);
    expect(quadro('lampada', durata('lampada')).lampada).toBe(true);
    expect(quadro('lampada', durata('lampada')).tastoGiu).toBe(true);
  });

  it('con «ora prova tu» il tasto torna su e la tastiera passa allo studente', () => {
    expect(quadro('prova', 0)).toMatchObject({ prova: true, tastoGiu: false, lampada: true });
  });

  it('senza rallentatore un’azione va alla velocità vera, all’inizio del passo', () => {
    const passo: PassoCopione = {
      id: 'x',
      testo: 'x',
      camera: 'insieme',
      fantasma: [],
      evidenzia: [],
      azione: 'passo',
      rallenta: false,
    };
    expect(avanzamento(passo, 0.09, 10)).toBeCloseTo(0.5);
    expect(avanzamento({ ...passo, azione: 'segnale' }, 0, 10)).toBe(1);
  });
});

describe('audio', () => {
  it('ogni passo ha il suo file e una durata fatta sul testo di adesso', () => {
    for (const passo of copione.passi) {
      expect(existsSync(join(radice, 'public', 'lezione-3d', 'it', `${passo.id}.m4a`)), passo.id).toBe(true);
      expect(durate[passo.id]?.hash, passo.id).toBe(impronta(testoDellaVoce(passo)));
      expect(durate[passo.id]?.durata, passo.id).toBeGreaterThan(1);
    }
    expect(Object.keys(durate)).toHaveLength(copione.passi.length);
  });

  it('la lezione dura fra uno e due minuti e venti (D17)', () => {
    const totale = Object.values(durate).reduce((s, d) => s + d.durata, 0);
    expect(totale).toBeGreaterThan(60);
    expect(totale).toBeLessThan(140);
  });

  it('la pagina legge copione e durate senza errori', () => {
    expect(lezioneDellaPagina(radice).copione.passi).toHaveLength(copione.passi.length);
  });
});
