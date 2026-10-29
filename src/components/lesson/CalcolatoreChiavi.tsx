import { useId, useState } from 'react';
import { keySpace, log2, type KeySpaceFactorId, type KeySpaceOptions } from '@/engine';
import { t, tf, type UiKey } from '@/i18n';
import { groupDigits, scientific } from '@/lib/format';

const PRESETS = {
  enigmaI: { rotors: 5, reflectors: 1, thinRotors: 0, rings: 2, cables: 10, doubleStep: false },
  m4: { rotors: 8, reflectors: 2, thinRotors: 2, rings: 2, cables: 10, doubleStep: false },
} satisfies Record<string, KeySpaceOptions>;
type Preset = keyof typeof PRESETS;

const FACTOR_LABELS: Record<KeySpaceFactorId, UiKey> = {
  rotorOrder: 'lesson.keyspace.rotorOrder',
  reflector: 'lesson.keyspace.reflector',
  thinRotor: 'lesson.keyspace.thinRotor',
  rings: 'lesson.keyspace.rings',
  positions: 'lesson.keyspace.positions',
  plugboard: 'lesson.keyspace.plugboard',
};

/** Come si ottiene ciascun fattore, scritto per esteso. */
function calculation(id: KeySpaceFactorId, options: KeySpaceOptions): string {
  const n = options.rotors;
  switch (id) {
    case 'rotorOrder':
      return `${n} × ${n - 1} × ${n - 2}`;
    case 'reflector':
      return String(Math.max(1, options.reflectors));
    case 'thinRotor':
      return String(Math.max(1, options.thinRotors));
    case 'rings':
      return options.rings === 0 ? '1' : Array.from({ length: options.rings }, () => '26').join(' × ');
    case 'positions': {
      const three = options.doubleStep ? '(26³ − 650)' : '26³';
      return options.thinRotors > 0 ? `${three} × 26` : three;
    }
    case 'plugboard':
      return tf(options.cables === 1 ? 'lesson.keyspace.cableOne' : 'lesson.keyspace.cables', {
        count: options.cables,
      });
  }
}

/**
 * Calcolatore delle impostazioni possibili di Enigma, con i cablaggi noti a chi attacca (principio
 * di Kerckhoffs). Parte dall’Enigma I o dalla M4 e permette di cambiare ogni fattore.
 */
export default function CalcolatoreChiavi() {
  const id = useId();
  const [options, setOptions] = useState<KeySpaceOptions>(PRESETS.enigmaI);
  const change = (patch: Partial<KeySpaceOptions>) => setOptions((current) => ({ ...current, ...patch }));
  const { factors, total } = keySpace(options);
  const bits = log2(total).toLocaleString('it-IT', { maximumFractionDigits: 1 });
  const select = 'rounded-md border border-border bg-surface px-2 py-2';
  const isPreset = (preset: Preset) => JSON.stringify(PRESETS[preset]) === JSON.stringify(options);

  return (
    <figure className="my-8 font-sans text-base">
      <div className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-4">
        <div role="group" aria-labelledby={`${id}-presets`} className="flex flex-wrap items-center gap-2">
          <span id={`${id}-presets`} className="font-semibold">
            {t('lesson.keyspace.presets')}
          </span>
          {(Object.keys(PRESETS) as Preset[]).map((preset) => (
            <button
              key={preset}
              type="button"
              aria-pressed={isPreset(preset)}
              onClick={() => setOptions(PRESETS[preset])}
              className="min-h-11 rounded-md border-2 border-border bg-surface px-3 hover:border-accent aria-pressed:border-accent aria-pressed:bg-surface-muted"
            >
              {t(preset === 'enigmaI' ? 'lesson.keyspace.enigmaI' : 'lesson.keyspace.m4')}
            </button>
          ))}
        </div>
        <div className="grid gap-3 text-sm sm:grid-cols-2">
          <label className="flex items-center justify-between gap-2">
            {t('lesson.keyspace.rotorsAvailable')}
            <select
              className={select}
              value={options.rotors}
              onChange={(e) => change({ rotors: Number(e.target.value) })}
            >
              {[3, 4, 5, 6, 7, 8].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center justify-between gap-2">
            {t('lesson.keyspace.reflectorsAvailable')}
            <select
              className={select}
              value={options.reflectors}
              onChange={(e) => change({ reflectors: Number(e.target.value) })}
            >
              {[1, 2].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center justify-between gap-2">
            {t('lesson.keyspace.thinRotorChoice')}
            <select
              className={select}
              value={options.thinRotors}
              onChange={(e) => change({ thinRotors: Number(e.target.value) })}
            >
              <option value={0}>{t('lesson.keyspace.thinNone')}</option>
              <option value={2}>{t('lesson.keyspace.thinTwo')}</option>
            </select>
          </label>
          <label className="flex items-center justify-between gap-2">
            {t('lesson.keyspace.ringsCounted')}
            <select
              className={select}
              value={options.rings}
              onChange={(e) => change({ rings: Number(e.target.value) })}
            >
              <option value={0}>{t('lesson.keyspace.ringsNone')}</option>
              <option value={2}>{t('lesson.keyspace.ringsTwo')}</option>
              <option value={3}>{t('lesson.keyspace.ringsThree')}</option>
            </select>
          </label>
          <label className="flex items-center justify-between gap-2 sm:col-span-2">
            <span>
              {t('lesson.keyspace.cablesLabel')} <output className="font-mono font-bold">{options.cables}</output>
            </span>
            <input
              type="range"
              min={0}
              max={13}
              value={options.cables}
              onChange={(e) => change({ cables: Number(e.target.value) })}
              className="w-1/2 accent-accent"
            />
          </label>
          <label className="flex items-center gap-2 sm:col-span-2">
            <input
              type="checkbox"
              className="h-5 w-5"
              checked={options.doubleStep}
              onChange={(e) => change({ doubleStep: e.target.checked })}
            />
            {t('lesson.keyspace.doubleStep')}
          </label>
        </div>
        <table className="w-full border-collapse text-sm">
          <caption className="sr-only">{t('lesson.keyspace.caption')}</caption>
          <thead>
            <tr className="border-b border-border text-left">
              <th scope="col" className="py-1 pe-2">
                {t('lesson.keyspace.factor')}
              </th>
              <th scope="col" className="py-1 text-right">
                {t('lesson.keyspace.value')}
              </th>
            </tr>
          </thead>
          <tbody>
            {factors.map(({ id: factor, value }) => (
              <tr key={factor} className="border-b border-border">
                <th scope="row" className="py-1 pe-2 text-left font-normal">
                  {t(FACTOR_LABELS[factor])}
                  <span className="block font-mono text-text-muted">{calculation(factor, options)}</span>
                </th>
                {/* Gli spazi tra i gruppi di cifre possono andare a capo sugli schermi stretti. */}
                <td className="py-1 text-right font-mono">{groupDigits(value, ' ')}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <th scope="row" className="py-1 pe-2 text-left">
                {t('lesson.keyspace.total')}
              </th>
              <td className="py-1 text-right font-mono font-bold">{groupDigits(total, ' ')}</td>
            </tr>
          </tfoot>
        </table>
        <p aria-live="polite" className="rounded-md bg-surface-muted px-3 py-2">
          {tf('lesson.keyspace.summary', { scientific: scientific(total), bits })}
        </p>
      </div>
    </figure>
  );
}
