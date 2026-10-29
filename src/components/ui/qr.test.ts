import { describe, expect, it } from 'vitest';
import { QR_QUIET_ZONE, qrPath } from './qr.ts';

describe('codice QR', () => {
  it('ha il margine e i tre riquadri di posizionamento', () => {
    const { size, d } = qrPath('https://marcofarina.github.io/enigma/simulatore/?v=1&m=I');
    // Versione 1 = 21 moduli, poi quattro moduli in più per ogni versione.
    expect((size - 2 * QR_QUIET_ZONE - 21) % 4).toBe(0);
    // Gli angoli in alto a sinistra, in alto a destra e in basso a sinistra iniziano dopo il margine.
    const q = QR_QUIET_ZONE;
    const inner = size - 2 * q;
    for (const [x, y] of [
      [q, q],
      [q + inner - 1, q],
      [q, q + inner - 1],
    ])
      expect(d).toContain(`M${x} ${y}h1v1h-1z`);
    expect(d).not.toContain('M0 0h1');
  });

  it('cresce con la lunghezza del testo', () => {
    expect(qrPath('x'.repeat(200)).size).toBeGreaterThan(qrPath('x').size);
  });
});
