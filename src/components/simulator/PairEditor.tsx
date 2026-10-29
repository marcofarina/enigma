import { useId, useState } from 'react';
import { tf } from '@/i18n';
import { formatPairs, parsePairs, togglePlug } from './config-edit.ts';
import { KEYBOARD_ROWS } from './keys.ts';

interface Props {
  label: string;
  /** Nome del gruppo di prese, per chi usa un lettore di schermo. */
  gridLabel: string;
  hint: string;
  pairs: readonly string[];
  onChange: (pairs: string[]) => void;
  /** Coppia fissa mostrata ma non modificabile (J–Y nell’UKW-D). */
  locked?: string;
  /** Testo aggiuntivo sotto il campo, per esempio il numero di cavi. */
  status?: string;
}

/**
 * Editor di coppie di lettere, usato per il pannello a spine e per l’UKW-D. Le coppie si
 * scrivono nel campo oppure si collegano facendo clic su due prese, disposte come sulla
 * macchina (QWERTZ).
 */
export default function PairEditor({ label, gridLabel, hint, pairs, onChange, locked, status }: Props) {
  const id = useId();
  // Il campo mostra ciò che si sta scrivendo; uscendo dal campo torna alla forma normalizzata.
  const [draft, setDraft] = useState<string | null>(null);
  const [pending, setPending] = useState<string | null>(null);
  const partner = new Map<string, string>();
  for (const pair of [...pairs, ...(locked ? [locked] : [])]) {
    const [a = '', b = ''] = pair;
    partner.set(a, b);
    partner.set(b, a);
  }
  const typedPending = draft === null ? '' : parsePairs(draft).pending;

  const onPlug = (letter: string) => {
    const next = togglePlug(pairs, pending, letter);
    setPending(next.pending);
    setDraft(null);
    onChange(next.pairs);
  };

  const plugLabel = (letter: string) => {
    const other = partner.get(letter);
    if (locked?.includes(letter) && other) return tf('sim.pairs.locked', { letter, other });
    if (other) return tf('sim.pairs.connected', { letter, other });
    if (pending === letter) return tf('sim.pairs.waiting', { letter });
    return tf('sim.pairs.free', { letter });
  };

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={`${id}-text`} className="text-sm font-semibold">
        {label}
      </label>
      <input
        id={`${id}-text`}
        type="text"
        autoComplete="off"
        spellCheck={false}
        aria-describedby={`${id}-hint ${id}-status`}
        className="rounded-md border border-border bg-surface px-3 py-2 font-mono uppercase tracking-wider"
        value={draft ?? formatPairs(pairs)}
        onChange={(event) => {
          setDraft(event.target.value);
          setPending(null);
          onChange(parsePairs(event.target.value).pairs);
        }}
        onBlur={() => setDraft(null)}
      />
      <p id={`${id}-hint`} className="text-sm text-text-muted">
        {hint}
      </p>
      <div className="flex flex-col items-center gap-1" role="group" aria-label={gridLabel}>
        {KEYBOARD_ROWS.map((row) => (
          <div key={row} className="flex gap-1">
            {[...row].map((letter) => {
              const other = partner.get(letter);
              const isLocked = Boolean(locked?.includes(letter));
              return (
                <button
                  key={letter}
                  type="button"
                  disabled={isLocked}
                  aria-label={plugLabel(letter)}
                  aria-pressed={pending === letter}
                  onClick={() => onPlug(letter)}
                  className={[
                    'flex h-11 w-7 flex-col items-center justify-center rounded-md border font-mono text-sm leading-none',
                    pending === letter
                      ? 'border-accent bg-accent text-accent-contrast'
                      : other
                        ? 'border-text bg-surface-muted text-text'
                        : 'border-border bg-surface text-text',
                    isLocked ? 'cursor-not-allowed opacity-80' : 'hover:border-accent',
                  ].join(' ')}
                >
                  <span aria-hidden="true" className="font-bold">
                    {letter}
                  </span>
                  <span aria-hidden="true" className={pending === letter ? 'text-xs' : 'text-xs text-text-muted'}>
                    {other ?? '·'}
                  </span>
                </button>
              );
            })}
          </div>
        ))}
      </div>
      <p id={`${id}-status`} className="text-sm text-text-muted" aria-live="polite">
        {status}
        {typedPending ? ` ${tf('sim.pairs.pending', { letter: typedPending })}` : ''}
      </p>
    </div>
  );
}
