import { describe, expect, it } from 'vitest';
import { cablePath, machineLayout, WIDTH } from './layout.ts';

const three = [
  { name: 'I', thin: false },
  { name: 'II', thin: false },
  { name: 'III', thin: false },
];

describe('geometria della vista Macchina', () => {
  it('mette 26 lampade, 26 tasti e 26 prese dentro la cassetta', () => {
    const layout = machineLayout({ rotors: three, reflectorWindow: false, plugboard: true });
    for (const points of [layout.lamps, layout.keys, layout.sockets]) {
      expect(Object.keys(points)).toHaveLength(26);
      for (const { x } of Object.values(points)) {
        expect(x).toBeGreaterThan(layout.deck.x);
        expect(x).toBeLessThan(layout.deck.x + layout.deck.width);
      }
    }
    expect(layout.width).toBe(WIDTH);
  });

  it('centra le finestrelle e aggiunge quella del riflettore dove si regola', () => {
    const m4 = machineLayout({
      rotors: [{ name: 'Beta', thin: true }, ...three],
      reflectorWindow: false,
      plugboard: true,
    });
    expect(m4.windows).toHaveLength(4);
    expect(m4.windows[0]?.thin).toBe(true);
    const first = m4.windows[0];
    const last = m4.windows.at(-1);
    expect(first && last && first.x + last.x + last.width).toBeCloseTo(WIDTH, 0);

    const g = machineLayout({ rotors: three, reflectorWindow: true, plugboard: false });
    expect(g.windows.map((w) => w.slot)).toEqual([-1, 0, 1, 2]);
    expect(g.sockets).toEqual({});
    expect(g.height).toBeLessThan(m4.height);
  });

  it('fa pendere i cavi sotto le prese', () => {
    const d = cablePath({ x: 0, y: 100 }, { x: 200, y: 120 });
    const bottom = Number(d.split(' ')[5]);
    expect(bottom).toBeGreaterThan(120);
    // Con un limite, il punto più basso della curva (a 3/4 dei controlli) non lo supera.
    const limited = Number(cablePath({ x: 0, y: 100 }, { x: 600, y: 120 }, 150).split(' ')[5]);
    expect(120 + (limited - 120) * 0.75).toBeLessThanOrEqual(150);
  });
});
