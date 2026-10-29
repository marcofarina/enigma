import { useEffect, useRef, type KeyboardEvent } from 'react';
import { prepareText, toIndex, toLetter } from '@/engine';
import { t } from '@/i18n';

interface Props {
  label: string;
  letter: string;
  onChange: (letter: string) => void;
}

/**
 * Finestrella con la rotella del rotore. Si gira con le frecce (Home e Fine vanno ad A e Z),
 * con la rotella del mouse, con i pulsanti o digitando direttamente una lettera.
 */
export default function RotorWheel({ label, letter, onChange }: Props) {
  const wheel = useRef<HTMLDivElement>(null);
  const index = toIndex(letter);
  const shift = (delta: number) => onChange(toLetter(index + delta));

  // La rotella si registra a mano: i gestori di React sono passivi e non possono bloccare lo scorrimento.
  const latest = useRef(shift);
  useEffect(() => {
    latest.current = shift;
  });
  useEffect(() => {
    const element = wheel.current;
    if (!element) return;
    const onWheel = (event: WheelEvent) => {
      if (event.deltaY === 0) return;
      event.preventDefault();
      latest.current(event.deltaY > 0 ? 1 : -1);
    };
    element.addEventListener('wheel', onWheel, { passive: false });
    return () => element.removeEventListener('wheel', onWheel);
  }, []);

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const moves: Record<string, () => void> = {
      ArrowUp: () => shift(1),
      ArrowRight: () => shift(1),
      ArrowDown: () => shift(-1),
      ArrowLeft: () => shift(-1),
      PageUp: () => shift(5),
      PageDown: () => shift(-5),
      Home: () => onChange('A'),
      End: () => onChange('Z'),
    };
    const move = moves[event.key];
    const typed = event.key.length === 1 && !event.ctrlKey && !event.metaKey ? prepareText(event.key) : '';
    if (move) move();
    else if (typed.length === 1) onChange(typed);
    else return;
    // La lettera digitata qui gira il rotore e non deve arrivare alla tastiera della macchina.
    event.preventDefault();
  };

  return (
    <div className="flex flex-col items-center gap-1">
      <button
        type="button"
        tabIndex={-1}
        className="h-8 w-12 rounded-md border border-border bg-surface text-text-muted hover:border-accent"
        aria-label={`${label}: ${t('sim.wheel.up')}`}
        onClick={() => shift(1)}
      >
        ▲
      </button>
      <div
        ref={wheel}
        role="spinbutton"
        tabIndex={0}
        aria-label={label}
        aria-valuemin={1}
        aria-valuemax={26}
        aria-valuenow={index + 1}
        aria-valuetext={letter}
        onKeyDown={onKeyDown}
        className="flex w-14 cursor-ns-resize select-none flex-col items-center rounded-md border-2 border-border bg-surface-muted py-1 font-mono"
      >
        <span aria-hidden="true" className="text-sm text-text-muted">
          {toLetter(index - 1)}
        </span>
        <span className="rounded bg-surface px-2 text-3xl font-bold leading-tight text-text">{letter}</span>
        <span aria-hidden="true" className="text-sm text-text-muted">
          {toLetter(index + 1)}
        </span>
      </div>
      <button
        type="button"
        tabIndex={-1}
        className="h-8 w-12 rounded-md border border-border bg-surface text-text-muted hover:border-accent"
        aria-label={`${label}: ${t('sim.wheel.down')}`}
        onClick={() => shift(-1)}
      >
        ▼
      </button>
    </div>
  );
}
