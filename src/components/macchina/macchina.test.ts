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
import { letteraDelNodo, offsetAtlante, PASSO, rotazioniRotore } from './geometria.ts';
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
