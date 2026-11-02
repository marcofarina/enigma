import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { licenseLabel } from './images.ts';

const root = join(import.meta.dirname, '..');

describe('immagini di terzi', () => {
  it('ogni file ha i suoi crediti e ogni voce ha il suo file', () => {
    const files = readdirSync(join(root, 'assets', 'immagini')).sort();
    const yaml = readFileSync(join(root, 'content', 'immagini.yaml'), 'utf8');
    const credited = [...yaml.matchAll(/^\s+file:\s*(\S+)\s*$/gm)].map((match) => match[1]).sort();
    expect(credited).toEqual(files);
  });

  it('scrive le licenze in forma leggibile', () => {
    expect(licenseLabel('CC-BY-SA-4.0')).toBe('CC BY-SA 4.0');
    expect(licenseLabel('CC-BY-2.0')).toBe('CC BY 2.0');
    expect(licenseLabel('CC-BY-SA-3.0-DE')).toBe('CC BY-SA 3.0 DE');
    expect(licenseLabel('CC0-1.0')).toBe('CC0');
    expect(licenseLabel('PD')).toBe('pubblico dominio');
  });
});
