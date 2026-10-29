import { useMemo } from 'react';
import { t, tf } from '@/i18n';
import { KEYBOARD_ROWS } from './keys.ts';
import { hasSettableReflector, slotName } from './labels.ts';
import RotorWheel from './RotorWheel.tsx';
import { windows } from './session.ts';
import { useSimulator } from './store.ts';

/** Finestrelle dei rotori (e del riflettore, dove si regola). */
export function Windows() {
  const session = useSimulator((s) => s.session);
  const setWindow = useSimulator((s) => s.setWindow);
  const setReflectorWindow = useSimulator((s) => s.setReflectorWindow);
  const letters = useMemo(() => windows(session), [session]);
  const { config } = session;

  return (
    <section aria-label={t('sim.windows.title')} className="flex flex-col items-center gap-2">
      <div className="flex items-end gap-3">
        {hasSettableReflector(config) && (
          <div className="flex flex-col items-center gap-1 border-r border-border pr-3">
            <RotorWheel
              label={t('sim.wheel.reflectorLabel')}
              letter={letters.reflector}
              onChange={setReflectorWindow}
            />
            <span className="text-xs text-text-muted">{t('sim.windows.reflector')}</span>
          </div>
        )}
        {config.rotors.map((name, slot) => (
          <div key={slot} className="flex flex-col items-center gap-1">
            <RotorWheel
              label={tf('sim.wheel.label', { slot: slotName(config, slot) })}
              letter={letters.rotors[slot] ?? 'A'}
              onChange={(letter) => setWindow(slot, letter)}
            />
            <span className="font-mono text-xs text-text-muted">{name}</span>
          </div>
        ))}
      </div>
      <p className="max-w-md text-center text-sm text-text-muted">{t('sim.windows.hint')}</p>
    </section>
  );
}

export function Lampboard() {
  const last = useSimulator((s) => s.session.presses.at(-1));
  return (
    <section aria-label={t('sim.lamps.title')} className="flex flex-col items-center gap-1">
      <div aria-hidden="true" className="flex flex-col items-center gap-1 sm:gap-1.5">
        {KEYBOARD_ROWS.map((row) => (
          <div key={row} className="flex gap-1 sm:gap-1.5">
            {[...row].map((letter) => {
              const lit = last?.output === letter;
              return (
                <span
                  key={letter}
                  data-lamp={letter}
                  data-lit={lit || undefined}
                  className={[
                    'flex h-8 w-8 items-center justify-center rounded-full border-2 font-mono font-bold sm:h-10 sm:w-10',
                    lit
                      ? 'border-lamp-on bg-lamp-on text-lamp-on-text shadow-[0_0_14px_var(--color-lamp-on)]'
                      : 'border-border bg-surface-muted text-text-muted',
                  ].join(' ')}
                >
                  {letter}
                </span>
              );
            })}
          </div>
        ))}
      </div>
      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {last ? tf('sim.live.pressed', { input: last.input, output: last.output }) : ''}
      </p>
    </section>
  );
}

export function Keyboard() {
  const locked = useSimulator((s) => s.session.machine === null);
  const press = useSimulator((s) => s.press);
  return (
    <section aria-label={t('sim.keyboard.title')} className="flex flex-col items-center gap-1.5">
      {KEYBOARD_ROWS.map((row) => (
        <div key={row} className="flex gap-1 sm:gap-1.5">
          {[...row].map((letter) => (
            <button
              key={letter}
              type="button"
              disabled={locked}
              onClick={() => press(letter)}
              className="h-11 w-8 rounded-md border-2 border-border bg-surface font-mono text-lg font-bold text-text shadow-[0_3px_0_var(--color-border)] hover:border-accent active:translate-y-0.5 active:shadow-none disabled:cursor-not-allowed disabled:opacity-50 sm:h-12 sm:w-11"
            >
              {letter}
            </button>
          ))}
        </div>
      ))}
      {locked && <p className="text-sm text-text-muted">{t('sim.keyboard.locked')}</p>}
    </section>
  );
}

export function Issues() {
  const issues = useSimulator((s) => s.session.issues);
  if (issues.length === 0) return null;
  return (
    <div role="status" className="rounded-lg border-2 border-accent bg-surface p-4">
      <p className="font-semibold">{t('sim.issues.title')}</p>
      <ul className="mt-1 list-disc ps-5 text-sm">
        {issues.map((issue) => (
          <li key={`${issue.field}-${issue.message}`}>{issue.message}</li>
        ))}
      </ul>
    </div>
  );
}
