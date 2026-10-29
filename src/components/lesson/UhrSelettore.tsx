import { useId, useState } from 'react';
import { mod, toIndex, toLetter, uhrMaps } from '@/engine';
import { t, tf } from '@/i18n';
import { parsePairs } from '@/components/simulator/config-edit.ts';

interface Props {
  /** Le 10 coppie del foglio chiave: la prima lettera riceve la spina rossa (a), la seconda la nera (b). */
  coppie?: string;
  posizione?: number;
}

const SETTINGS = 40;
const pad = (setting: number) => String(setting).padStart(2, '0');

/**
 * L’Uhr al posto dei cavi: per ogni posizione del selettore mostra dove va ciascuna delle 20
 * lettere collegate e se la sostituzione è ancora reciproca.
 */
export default function UhrSelettore({ coppie = 'AZ BN GI KL PC ED QT HV MF JR', posizione = 0 }: Props) {
  const id = useId();
  const pairs = parsePairs(coppie).pairs;
  const [setting, setSetting] = useState(mod(posizione, SETTINGS));
  const { forward } = uhrMaps(pairs, setting);

  const plugs = pairs.flatMap((pair, i) => [
    { letter: pair[0] ?? '', plug: `${i + 1}a`, red: true },
    { letter: pair[1] ?? '', plug: `${i + 1}b`, red: false },
  ]);
  const target = (letter: string) => toLetter(forward[toIndex(letter)] ?? 0);
  // Una lettera che non torna indietro: X va in Y, ma Y non va in X.
  const broken = plugs.find(({ letter }) => target(target(letter)) !== letter);
  const move = (delta: number) => setSetting((current) => mod(current + delta, SETTINGS));
  const button = 'rounded-md border border-border bg-surface px-3 py-2 font-mono hover:border-accent';

  return (
    <figure className="my-8 font-sans text-base">
      <div className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-4">
        <div className="flex flex-wrap items-center gap-2">
          <label htmlFor={`${id}-setting`} className="basis-full font-semibold sm:basis-auto">
            {t('sim.uhr.setting')}
          </label>
          <button type="button" className={button} aria-label={t('lesson.uhr.previous')} onClick={() => move(-1)}>
            −
          </button>
          <select
            id={`${id}-setting`}
            className="rounded-md border border-border bg-surface px-2 py-2 font-mono"
            value={setting}
            onChange={(event) => setSetting(Number(event.target.value))}
          >
            {Array.from({ length: SETTINGS }, (_, i) => (
              <option key={i} value={i}>
                {pad(i)}
              </option>
            ))}
          </select>
          <button type="button" className={button} aria-label={t('lesson.uhr.next')} onClick={() => move(1)}>
            +
          </button>
        </div>
        <table className="w-full table-fixed border-collapse text-center font-mono text-sm">
          <caption className="sr-only">{tf('lesson.uhr.caption', { setting: pad(setting) })}</caption>
          <tbody>
            {[0, 1].map((half) => (
              <tr key={half}>
                <th scope="row" className="sr-only">
                  {t(half === 0 ? 'lesson.uhr.rowFirst' : 'lesson.uhr.rowSecond')}
                </th>
                {plugs.slice(half * 10, half * 10 + 10).map(({ letter, plug, red }) => (
                  <td key={plug} className="border border-border px-0.5 py-1">
                    <span
                      className={`block text-xs ${red ? 'text-plug-red' : 'text-text'}`}
                      title={t(red ? 'lesson.uhr.red' : 'lesson.uhr.black')}
                    >
                      {plug}
                    </span>
                    <span className="block font-bold">{letter}</span>
                    <span aria-hidden="true" className="block text-text-muted">
                      ↓
                    </span>
                    <span className="sr-only">→</span>
                    <span className="block">{target(letter)}</span>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <p className="rounded-md bg-surface-muted px-3 py-2" aria-live="polite">
          {broken
            ? tf('lesson.uhr.oneWay', {
                setting: pad(setting),
                from: broken.letter,
                to: target(broken.letter),
                back: target(target(broken.letter)),
              })
            : tf('lesson.uhr.reciprocal', { setting: pad(setting) })}
        </p>
      </div>
    </figure>
  );
}
