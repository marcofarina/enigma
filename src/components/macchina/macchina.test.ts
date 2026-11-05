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
  angoloPiuVicinoA,
  DISTANZA_MASSIMA,
  DISTANZA_MINIMA,
  distanzaDopoLoZoom,
  DURATA_CLIP,
  inquadra,
  letteraDelNodo,
  MARGINE_SCENA,
  offsetAtlante,
  PASSO,
  PEZZI,
  pezzoDelNodo,
  POLARE_MASSIMO,
  puntoContatto,
  rampa,
  rotazioniRotore,
  segmentiCablaggio,
  tempoClip,
  velocitaSmontaggio,
  versoLaCamera,
  VISTE,
  type Direzione,
  type Scatola,
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

describe('tempo della clip', () => {
  it('non esce da 0 e dalla durata', () => {
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

  it('i pezzi impiegano un secondo per fase, ma al più 2,5 secondi in tutto', () => {
    expect(velocitaSmontaggio(0, 1)).toBe(1);
    expect(velocitaSmontaggio(2, 1)).toBe(1);
    expect(velocitaSmontaggio(0, 4)).toBeCloseTo(4 / 2.5);
  });
});

/** Dove cade nello schermo (da −1 a 1) un punto, guardando da `direzione` verso `bersaglio` da `distanza`. */
function proietta(
  p: readonly [number, number, number],
  bersaglio: readonly [number, number, number],
  distanza: number,
  direzione: Direzione,
  fov: number,
  aspetto: number,
) {
  const verso = versoLaCamera(direzione);
  const destra = [Math.cos(direzione.azimut), 0, -Math.sin(direzione.azimut)] as const;
  const su = [
    verso[1] * destra[2] - verso[2] * destra[1],
    verso[2] * destra[0] - verso[0] * destra[2],
    verso[0] * destra[1] - verso[1] * destra[0],
  ] as const;
  const q = [p[0] - bersaglio[0], p[1] - bersaglio[1], p[2] - bersaglio[2]] as const;
  const dot = (a: readonly number[], b: readonly number[]) => a[0]! * b[0]! + a[1]! * b[1]! + a[2]! * b[2]!;
  const profondita = distanza - dot(q, verso);
  const tanV = Math.tan(fov / 2);
  return { x: dot(q, destra) / (profondita * tanV * aspetto), y: dot(q, su) / (profondita * tanV) };
}

describe('viste della camera', () => {
  const FOV = (22.9 * Math.PI) / 180;
  // La macchina esplosa è più alta e profonda di quella chiusa: due scatole da provare.
  const scatole: Scatola[] = [
    { min: [-0.14, 0, -0.17], max: [0.14, 0.16, 0.17] },
    { min: [-0.14, 0, -0.3], max: [0.14, 0.35, 0.2] },
  ];

  it('l’ingombro sta nel quadro con almeno il 6 % di margine per lato, e un lato lo tocca', () => {
    for (const scatola of scatole) {
      for (const direzione of [...VISTE, { azimut: 0.576, polare: 1.05 }]) {
        for (const aspetto of [1.47, 1.17, 2]) {
          const { bersaglio, distanza } = inquadra(scatola, direzione, FOV, aspetto);
          const massimo = { x: 0, y: 0 };
          for (const x of [scatola.min[0], scatola.max[0]]) {
            for (const y of [scatola.min[1], scatola.max[1]]) {
              for (const z of [scatola.min[2], scatola.max[2]]) {
                const punto = proietta([x, y, z], bersaglio, distanza, direzione, FOV, aspetto);
                massimo.x = Math.max(massimo.x, Math.abs(punto.x));
                massimo.y = Math.max(massimo.y, Math.abs(punto.y));
              }
            }
          }
          const limite = 1 - 2 * MARGINE_SCENA;
          expect(Math.max(massimo.x, massimo.y)).toBeCloseTo(limite, 6);
          expect(massimo.x).toBeLessThanOrEqual(limite + 1e-9);
          expect(massimo.y).toBeLessThanOrEqual(limite + 1e-9);
        }
      }
    }
  });

  it('il bersaglio è il centro della scatola e una scatola più grande vuole più distanza', () => {
    const piccola = inquadra(scatole[0]!, VISTE[0]!, FOV, 1.47);
    const grande = inquadra(scatole[1]!, VISTE[0]!, FOV, 1.47);
    expect(piccola.bersaglio[0]).toBeCloseTo(0);
    expect(piccola.bersaglio[1]).toBeCloseTo(0.08);
    expect(grande.distanza).toBeGreaterThan(piccola.distanza);
  });

  it('una scena più stretta allontana la camera', () => {
    const larga = inquadra(scatole[0]!, VISTE[0]!, FOV, 2).distanza;
    const stretta = inquadra(scatole[0]!, VISTE[0]!, FOV, 0.8).distanza;
    expect(stretta).toBeGreaterThan(larga);
  });

  it('le quattro viste hanno una direzione propria e inquadrano nodi che esistono', () => {
    expect(VISTE.map((v) => v.id)).toEqual(['fronte', 'alto', 'rotori', 'pannello']);
    const direzioni = VISTE.map((v) =>
      versoLaCamera(v)
        .map((n) => n.toFixed(2))
        .join(),
    );
    expect(new Set(direzioni).size).toBe(VISTE.length);
    for (const vista of VISTE) {
      expect(vista.polare).toBeGreaterThanOrEqual(0);
      expect(vista.polare).toBeLessThanOrEqual(POLARE_MASSIMO);
      for (const nodo of vista.nodi ?? []) expect(PEZZI).toContain(nodo);
    }
  });

  it('«Fronte» guarda dal davanti (+Z), «Dall’alto» dall’alto, «Pannello a spine» quasi di taglio', () => {
    const fronte = versoLaCamera(VISTE.find((v) => v.id === 'fronte')!);
    expect(fronte[2]).toBeGreaterThan(Math.abs(fronte[0]));
    expect(fronte[2]).toBeGreaterThan(fronte[1]);
    const alto = versoLaCamera(VISTE.find((v) => v.id === 'alto')!);
    expect(alto[1]).toBeGreaterThan(0.99);
    const pannello = versoLaCamera(VISTE.find((v) => v.id === 'pannello')!);
    expect(pannello[2]).toBeGreaterThan(0.9);
  });
});

describe('zoom', () => {
  it('ogni passo avvicina o allontana, e si ferma ai limiti', () => {
    expect(distanzaDopoLoZoom(1, 1)).toBeLessThan(1);
    expect(distanzaDopoLoZoom(1, -1)).toBeGreaterThan(1);
    expect(distanzaDopoLoZoom(distanzaDopoLoZoom(1, 1), -1)).toBeCloseTo(1);
    expect(distanzaDopoLoZoom(DISTANZA_MINIMA, 1)).toBe(DISTANZA_MINIMA);
    expect(distanzaDopoLoZoom(DISTANZA_MASSIMA, -1)).toBe(DISTANZA_MASSIMA);
    expect(distanzaDopoLoZoom(10, 1)).toBe(DISTANZA_MASSIMA);
  });

  it('un angolo equivalente più vicino non rifà i giri già fatti', () => {
    const giro = 2 * Math.PI;
    expect(angoloPiuVicinoA(3 * giro + 0.2, 0.5)).toBeCloseTo(3 * giro + 0.5);
    expect(angoloPiuVicinoA(-giro, 0.1)).toBeCloseTo(-giro + 0.1);
    expect(angoloPiuVicinoA(0.2, 0.5)).toBeCloseTo(0.5);
  });
});

describe('pezzi della macchina', () => {
  it('il doppio clic riconosce i pezzi e i loro sottopezzi, non i tasti', () => {
    expect(pezzoDelNodo('rotore_centrale')).toBe('rotore_centrale');
    expect(pezzoDelNodo('rotore_destro_anello')).toBe('rotore_destro');
    expect(pezzoDelNodo('rotore_sinistro_nucleo')).toBe('rotore_sinistro');
    expect(pezzoDelNodo('lampada_q')).toBe('lampada_q');
    expect(pezzoDelNodo('pannello_spine')).toBe('pannello_spine');
    expect(pezzoDelNodo('nottolino_centrale')).toBe('nottolino_centrale');
    expect(pezzoDelNodo('tasto_q')).toBeNull();
    expect(pezzoDelNodo('Scene')).toBeNull();
    expect(pezzoDelNodo('ancora_presa_a')).toBeNull();
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
