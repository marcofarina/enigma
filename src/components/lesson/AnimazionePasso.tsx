import { useEffect, useMemo, useState } from 'react';
import {
  createMachine,
  defaultConfig,
  initialState,
  MODELS,
  step,
  toLetter,
  windowLetters,
  type MachineState,
} from '@/engine';
import { t, tf } from '@/i18n';

interface Props {
  /** Rotori da sinistra a destra (Enigma I). */
  rotori?: string;
  inizio?: string;
}

interface Entry {
  state: MachineState;
  moved: boolean[];
}

const SLOT_KEYS = ['lesson.step.left', 'lesson.step.middle', 'lesson.step.right'] as const;

/**
 * Il movimento dei rotori, un tasto alla volta. Segnala quale rotore è sulla tacca e quale
 * avanza, così il doppio passo del rotore centrale diventa visibile.
 */
export default function AnimazionePasso({ rotori = 'I-II-III', inizio = 'ADU' }: Props) {
  const names = rotori.split('-');
  const machine = useMemo(
    () => createMachine({ ...defaultConfig('I'), rotors: names, positions: inizio }),
    // La macchina dipende solo dalle props, che in una lezione non cambiano.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rotori, inizio],
  );
  const [history, setHistory] = useState<Entry[]>(() => [
    { state: initialState(machine), moved: [false, false, false] },
  ]);
  const [playing, setPlaying] = useState(false);
  const current = history.at(-1) ?? { state: initialState(machine), moved: [false, false, false] };
  const notches = names.map((name) => MODELS.I.rotors[name]?.notches ?? '');

  const advance = () =>
    setHistory((h) => {
      const last = h.at(-1);
      if (!last) return h;
      const result = step(machine, last.state);
      return [...h, { state: result.state, moved: result.moved }];
    });

  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(advance, 900);
    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, machine]);

  const atNotch = (slot: number) => notches[slot]?.includes(toLetter(current.state.positions[slot] ?? 0)) ?? false;
  const movedNames = current.moved.flatMap((m, slot) => (m ? [t(SLOT_KEYS[slot] ?? 'lesson.step.right')] : []));

  return (
    <figure className="my-8 font-sans text-base">
      <div className="flex flex-col items-center gap-4 rounded-xl border border-border bg-surface p-4">
        <div className="flex gap-4" role="group" aria-label={t('lesson.step.windows')}>
          {names.map((name, slot) => (
            <div key={slot} className="flex flex-col items-center gap-1">
              <span className="text-xs text-text-muted">{t(SLOT_KEYS[slot] ?? 'lesson.step.right')}</span>
              <span
                key={`${history.length}-${slot}`}
                className={[
                  'flex h-16 w-14 items-center justify-center rounded-md border-2 font-mono text-3xl font-bold',
                  current.moved[slot] ? 'animate-scatto border-signal-forward' : 'border-border',
                  'bg-surface-muted',
                ].join(' ')}
              >
                {toLetter(current.state.positions[slot] ?? 0)}
              </span>
              <span className="font-mono text-sm">{name}</span>
              <span className={atNotch(slot) ? 'text-xs font-semibold text-accent' : 'text-xs text-text-muted'}>
                {atNotch(slot) ? t('lesson.step.atNotch') : tf('lesson.step.notch', { letter: notches[slot] ?? '' })}
              </span>
            </div>
          ))}
        </div>
        <p className="text-center text-sm" aria-live="polite">
          {history.length === 1
            ? t('lesson.step.ready')
            : tf('lesson.step.moved', { count: history.length - 1, rotors: movedNames.join(', ') })}
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          <button
            type="button"
            className="rounded-md bg-accent px-4 py-2 font-semibold text-accent-contrast"
            onClick={advance}
          >
            {t('lesson.step.press')}
          </button>
          <button
            type="button"
            className="rounded-md border border-border px-3 py-2 hover:border-accent"
            aria-pressed={playing}
            onClick={() => setPlaying((p) => !p)}
          >
            {playing ? t('lesson.step.pause') : t('lesson.step.play')}
          </button>
          <button
            type="button"
            className="rounded-md border border-border px-3 py-2 hover:border-accent disabled:opacity-50"
            disabled={history.length === 1}
            onClick={() => setHistory((h) => (h.length > 1 ? h.slice(0, -1) : h))}
          >
            {t('lesson.step.back')}
          </button>
          <button
            type="button"
            className="rounded-md border border-border px-3 py-2 hover:border-accent"
            onClick={() => {
              setPlaying(false);
              setHistory((h) => h.slice(0, 1));
            }}
          >
            {t('lesson.step.reset')}
          </button>
        </div>
        <ol
          aria-label={t('lesson.step.log')}
          className="m-0 flex max-w-full list-none flex-wrap justify-center gap-x-2 gap-y-1 p-0 font-mono text-sm"
        >
          {history.slice(-12).map((entry, i, list) => (
            <li
              key={history.length - list.length + i}
              className={i === list.length - 1 ? 'font-bold' : 'text-text-muted'}
            >
              {windowLetters(entry.state)}
            </li>
          ))}
        </ol>
      </div>
    </figure>
  );
}
