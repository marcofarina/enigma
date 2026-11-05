import { describe, expect, it } from 'vitest';
import {
  createMachine,
  defaultConfig,
  encodeConfig,
  initialState,
  mod,
  pressKey,
  toIndex,
  type MachineConfig,
} from '@/engine';
import {
  angoloNottolino,
  DURATA_CLIP,
  inquadratura,
  letteraDelNodo,
  offsetAtlante,
  PASSO,
  posizioneSelettore,
  puntoContatto,
  rampa,
  rotazioniRotore,
  segmentiCablaggio,
  tempoClip,
} from './geometria.ts';
import { queryPerIlSimulatore, sessioneDallaQuery } from './configurazione.ts';
import { press } from '../simulator/session.ts';

/** Angolo nel mondo, in passi, del contatto `c` di un rotore girato di `rotore` radianti (convenzione-3d, «Angoli»). */
const angoloNelMondo = (c: number, rotore: number) => mod(Math.round(c - rotore / PASSO));

describe('rotazioni dei rotori', () => {
  it('a riposo, con anello e posizione su A, niente gira', () => {
    expect(rotazioniRotore(0, 0)).toEqual({ rotore: 0, anello: 0 });
  });

  it('l’anello mostra in alto il numero della posizione', () => {
    for (let posizione = 0; posizione < 26; posizione++) {
      for (const anello of [0, 1, 7, 25]) {
        const r = rotazioniRotore(posizione, anello);
        // La faccia k (da 1) sta a (k − 1) passi nell’anello; in alto c’è quella a 0 nel mondo.
        const faccia = mod(Math.round((r.rotore + r.anello) / PASSO)) + 1;
        expect(faccia).toBe(posizione + 1);
      }
    }
  });

  it('il cablaggio si allinea ai contatti fissi come nel motore', () => {
    const config: MachineConfig = { ...defaultConfig('I'), rotors: ['II', 'IV', 'V'], rings: 'BUL', positions: 'QEV' };
    const machine = createMachine(config);
    let state = initialState(machine);
    for (const letter of 'ENIGMAKOMMTANCHERMAREXXDOPPIOPASSO') {
      const result = pressKey(machine, state, letter);
      for (const stage of result.stages) {
        if (stage.kind !== 'rotor' || stage.slot === undefined || stage.coreInput === undefined) continue;
        const posizione = result.state.positions[stage.slot] ?? 0;
        const anello = toIndex(config.rings[stage.slot] ?? 'A');
        const { rotore } = rotazioniRotore(posizione, anello);
        // Il contatto del nucleo su cui entra il segnale sta davanti al contatto fisso d’ingresso.
        expect(angoloNelMondo(stage.coreInput, rotore)).toBe(stage.input);
      }
      state = result.state;
    }
  });
});

describe('atlante', () => {
  it('sposta la texture sulla cella della lettera', () => {
    expect(offsetAtlante(0)).toEqual({ x: 0, y: 0 });
    expect(offsetAtlante(7)).toEqual({ x: 7 / 8, y: 0 });
    expect(offsetAtlante(8)).toEqual({ x: 0, y: 1 / 8 });
    expect(offsetAtlante(25)).toEqual({ x: 1 / 8, y: 3 / 8 });
  });

  it('legge la lettera dai nomi dei nodi', () => {
    expect(letteraDelNodo('tasto_q', 'tasto')).toBe('Q');
    expect(letteraDelNodo('lampada_e', 'lampada')).toBe('E');
    expect(letteraDelNodo('lampada_e', 'tasto')).toBeNull();
    expect(letteraDelNodo('tastiera', 'tasto')).toBeNull();
  });
});

describe('configurazione della pagina 3D', () => {
  it('senza query parte dall’Enigma I di base', () => {
    const { session, avviso } = sessioneDallaQuery('');
    expect(session.config).toEqual(defaultConfig('I'));
    expect(avviso.tipo).toBe('nessuno');
  });

  it('legge un link dell’Enigma I con il messaggio', () => {
    const query = queryPerIlSimulatore(press(press(sessioneDallaQuery('').session, 'C'), 'D'));
    const { session, avviso } = sessioneDallaQuery(`?${query}`);
    expect(avviso.tipo).toBe('nessuno');
    expect(session.presses.map((p) => p.input).join('')).toBe('CD');
  });

  it('con un altro modello avvisa e ricorda il link', () => {
    const { session, avviso } = sessioneDallaQuery(`?${encodeConfig(defaultConfig('M4'))}`);
    expect(session.config.model).toBe('I');
    expect(avviso).toMatchObject({ tipo: 'altro-modello' });
  });

  it('con un link guasto avvisa e parte dalla configurazione di base', () => {
    expect(sessioneDallaQuery('?v=1&m=I&r=XX').avviso.tipo).toBe('link-non-valido');
  });
});

describe('selettore dello smontaggio', () => {
  it('su un valore intero dice la fase, in mezzo dice fra quali', () => {
    expect(posizioneSelettore(0)).toEqual({ fase: 0 });
    expect(posizioneSelettore(4)).toEqual({ fase: 4 });
    expect(posizioneSelettore(2.003)).toEqual({ fase: 2 });
    expect(posizioneSelettore(0.4)).toEqual({ da: 0, a: 1 });
    expect(posizioneSelettore(3.5)).toEqual({ da: 3, a: 4 });
    expect(posizioneSelettore(9)).toEqual({ fase: 4 });
  });

  it('il tempo della clip non esce da 0 e dalla durata', () => {
    expect(tempoClip(-1)).toBe(0);
    expect(tempoClip(2.5)).toBe(2.5);
    expect(tempoClip(4)).toBeLessThan(DURATA_CLIP);
    expect(tempoClip(4)).toBeGreaterThan(DURATA_CLIP - 0.001);
  });

  it('la rampa va da 0 a 1 fra i due estremi', () => {
    expect(rampa(1.9, 2, 3)).toBe(0);
    expect(rampa(2.5, 2, 3)).toBe(0.5);
    expect(rampa(4, 2, 3)).toBe(1);
  });

  it('la camera sale e si allontana man mano che si smonta', () => {
    let prima = inquadratura(0);
    for (let v = 0.25; v <= 4; v += 0.25) {
      const ora = inquadratura(v);
      expect(ora.y).toBeGreaterThanOrEqual(prima.y);
      expect(ora.scala).toBeGreaterThanOrEqual(prima.scala);
      prima = ora;
    }
    expect(inquadratura(0)).toEqual({ y: 0.055, scala: 1 });
  });
});

describe('cablaggio dei rotori', () => {
  it('i contatti stanno sul cerchio, il primo in alto e l’angolo cresce verso il retro', () => {
    const r = 0.035;
    const a = puntoContatto(0, r);
    expect(a.y).toBeCloseTo(r);
    expect(a.z).toBeCloseTo(0);
    const quartoDiGiro = puntoContatto(6.5, r);
    expect(quartoDiGiro.y).toBeCloseTo(0);
    expect(quartoDiGiro.z).toBeCloseTo(-r);
    for (let i = 0; i < 26; i++) {
      const p = puntoContatto(i, r);
      expect(Math.hypot(p.y, p.z)).toBeCloseTo(r);
    }
  });

  it('ogni linea va dal contatto d’ingresso a quello a cui il cablaggio lo collega', () => {
    const machine = createMachine({ ...defaultConfig('I'), rotors: ['II', 'IV', 'V'] });
    const cablaggio = machine.rotors[0]!.forward;
    const punti = segmentiCablaggio(cablaggio, 0.035, 0.0135, -0.014);
    expect(punti).toHaveLength(26 * 6);
    for (let i = 0; i < 26; i++) {
      const da = puntoContatto(i, 0.035);
      const a = puntoContatto(cablaggio[i]!, 0.035);
      const k = i * 6;
      expect([punti[k], punti[k + 3]]).toEqual([expect.closeTo(0.0135), expect.closeTo(-0.014)]);
      expect(punti[k + 1]).toBeCloseTo(da.y);
      expect(punti[k + 2]).toBeCloseTo(da.z);
      expect(punti[k + 4]).toBeCloseTo(a.y);
      expect(punti[k + 5]).toBeCloseTo(a.z);
    }
  });

  it('rotori diversi hanno cablaggi diversi', () => {
    const a = segmentiCablaggio(
      createMachine({ ...defaultConfig('I'), rotors: ['I', 'II', 'III'] }).rotors[2]!.forward,
      0.035,
      1,
      0,
    );
    const b = segmentiCablaggio(
      createMachine({ ...defaultConfig('I'), rotors: ['I', 'II', 'IV'] }).rotors[2]!.forward,
      0.035,
      1,
      0,
    );
    expect(Array.from(a)).not.toEqual(Array.from(b));
  });
});

describe('nottolini', () => {
  it('vanno e tornano, e quello in presa spinge di più', () => {
    expect(angoloNottolino(0, true)).toBe(0);
    expect(angoloNottolino(1, true)).toBeCloseTo(0);
    expect(angoloNottolino(0.5, true)).toBeGreaterThan(angoloNottolino(0.5, false));
    expect(angoloNottolino(0.5, false)).toBeGreaterThan(0);
  });
});
