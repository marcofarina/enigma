import { useMemo, useState } from 'react';
import { ALPHABET, cycles, toLetter, type MachineConfig } from '@/engine';
import { t, tf } from '@/i18n';
import { chains, characteristic, indicatorProducts, intercepts, partialProduct } from '@/cryptanalysis/rejewski.ts';
import { createRng, int, pick, shuffle } from '@/exercises/random.ts';

/** Una giornata del 1935 circa: tre rotori, sei cavi, la stessa posizione di partenza per tutti. */
function dayKey(seed: number): MachineConfig {
  const rng = createRng(seed);
  const letters = () => Array.from({ length: 3 }, () => toLetter(int(rng, 0, 25))).join('');
  const shuffled = shuffle(rng, [...ALPHABET]);
  return {
    model: 'I',
    rotors: shuffle(rng, ['I', 'II', 'III']),
    rings: letters(),
    positions: letters(),
    reflector: pick(rng, ['A', 'B']),
    plugboard: Array.from({ length: 6 }, (_, i) => `${shuffled[2 * i]}${shuffled[2 * i + 1]}`),
  };
}

const PAIRS = ['1 → 4', '2 → 5', '3 → 6'] as const;
const BATCH = 10;

/**
 * Gli indicatori di una giornata, intercettati a gruppi di dieci. Da ciascuno si legge dove va la
 * prima lettera nella quarta (e la seconda nella quinta, la terza nella sesta); quando le tabelle
 * sono complete si vedono i cicli, che vanno sempre a coppie di uguale lunghezza.
 */
export default function CicliRejewski() {
  const [seed, setSeed] = useState(1938);
  const [count, setCount] = useState(0);
  const [compare, setCompare] = useState(false);
  const key = useMemo(() => dayKey(seed), [seed]);
  const all = useMemo(() => intercepts(key, createRng(seed + 1), 200), [key, seed]);
  const indicators = all.slice(0, count).map((i) => i.indicator);
  const plugged = useMemo(() => characteristic(key), [key]);
  // Gli stessi prodotti con il pannello vuoto: cambiano le lettere dei cicli, non le lunghezze.
  const cycleText = (config: MachineConfig) =>
    indicatorProducts(config).map((map) =>
      cycles(map)
        .sort((a, b) => b.length - a.length || (a[0] ?? 0) - (b[0] ?? 0))
        .map((cycle) => `(${cycle.map(toLetter).join('')})`)
        .join(' '),
    );
  const withCables = useMemo(() => cycleText(key), [key]);
  const withoutCables = useMemo(() => cycleText({ ...key, plugboard: [] }), [key]);

  const button = 'min-h-11 rounded-md border-2 border-border bg-surface px-3 font-semibold hover:border-accent';

  return (
    <figure className="my-8 font-sans text-base">
      <div className="flex flex-col gap-5 rounded-xl border border-border bg-surface p-4">
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" className={button} onClick={() => setCount((c) => Math.min(c + BATCH, all.length))}>
            {t('lesson.rejewski.intercept')}
          </button>
          <button
            type="button"
            className={button}
            onClick={() => {
              setSeed((s) => s + 7);
              setCount(0);
            }}
          >
            {t('lesson.rejewski.newDay')}
          </button>
          <p aria-live="polite" className="text-text-muted">
            {tf('lesson.rejewski.count', { count })}
          </p>
        </div>

        {count > 0 && (
          <div
            className="max-h-32 overflow-y-auto rounded-md bg-surface-muted p-2 font-mono text-sm"
            // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
            tabIndex={0}
            role="region"
            aria-label={t('lesson.rejewski.indicators')}
          >
            <ul className="m-0 flex list-none flex-wrap gap-x-3 gap-y-1 ps-0">
              {indicators.map((indicator, i) => (
                <li key={i}>
                  {indicator.slice(0, 3)} {indicator.slice(3)}
                </li>
              ))}
            </ul>
          </div>
        )}

        {PAIRS.map((label, k) => {
          const table = partialProduct(indicators, k);
          const known = table.filter((x) => x !== null).length;
          const parts = chains(table);
          return (
            <section
              key={label}
              aria-label={tf('lesson.rejewski.product', { pair: label })}
              className="flex flex-col gap-2"
            >
              <h3 className="font-semibold">
                {tf('lesson.rejewski.product', { pair: label })}{' '}
                <span className="font-normal text-text-muted">· {tf('lesson.rejewski.known', { known })}</span>
              </h3>
              <div className="overflow-x-auto">
                <table className="border-collapse font-mono text-sm">
                  <caption className="sr-only">{tf('lesson.rejewski.tableCaption', { pair: label })}</caption>
                  <tbody>
                    <tr>
                      <th scope="row" className="pe-2 text-left font-sans font-normal text-text-muted">
                        {t('lesson.rejewski.from')}
                      </th>
                      {[...ALPHABET].map((letter) => (
                        <td key={letter} className="w-6 text-center">
                          {letter}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <th scope="row" className="pe-2 text-left font-sans font-normal text-text-muted">
                        {t('lesson.rejewski.to')}
                      </th>
                      {table.map((value, i) => (
                        <td key={i} className="w-6 text-center font-bold">
                          {value === null ? <span className="font-normal text-text-muted">·</span> : toLetter(value)}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
              {parts.length > 0 && (
                <p className="flex flex-wrap gap-x-1 gap-y-2 font-mono">
                  {parts.map(({ letters, closed }) => (
                    <span
                      key={letters[0]}
                      className={
                        closed
                          ? 'rounded-md bg-surface-muted px-1.5'
                          : 'rounded-md border border-dashed border-border px-1.5'
                      }
                    >
                      {closed ? `(${letters.map(toLetter).join('')})` : `${letters.map(toLetter).join('')}…`}
                    </span>
                  ))}
                </p>
              )}
              {known === 26 && (
                <p className="text-sm">{tf('lesson.rejewski.structure', { lengths: (plugged[k] ?? []).join(', ') })}</p>
              )}
            </section>
          );
        })}

        <div className="flex flex-col gap-2 border-t border-border pt-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              className="h-5 w-5"
              checked={compare}
              onChange={(e) => setCompare(e.target.checked)}
            />
            {t('lesson.rejewski.compare')}
          </label>
          {compare && (
            <table className="w-full border-collapse text-sm">
              <caption className="sr-only">{t('lesson.rejewski.compareCaption')}</caption>
              <thead>
                <tr className="border-b border-border text-left">
                  <th scope="col" className="py-1 pe-3 font-semibold">
                    {t('lesson.rejewski.pair')}
                  </th>
                  <th scope="col" className="py-1 pe-3 font-semibold">
                    {t('lesson.rejewski.withCables')}
                  </th>
                  <th scope="col" className="py-1 font-semibold">
                    {t('lesson.rejewski.withoutCables')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {PAIRS.map((label, k) => (
                  <tr key={label} className="border-b border-border">
                    <th scope="row" className="py-1 pe-3 text-left font-normal">
                      {label}
                    </th>
                    <td className="break-all py-1 pe-3 font-mono">{withCables[k]}</td>
                    <td className="break-all py-1 font-mono">{withoutCables[k]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
      <figcaption className="mt-2 text-sm text-text-muted">{t('lesson.rejewski.caption')}</figcaption>
    </figure>
  );
}
