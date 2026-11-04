import { t, tf } from '@/i18n';
import { KEYBOARD_ROWS } from '../keys.ts';
import { useSimulator } from '../store.ts';

/**
 * Lampade sopra i tasti, come sulla macchina. La lampada accesa si scalda dopo il passaggio del
 * segnale (`--lamp-delay`); a ogni tasto la chiave React cambia e l’animazione riparte da capo,
 * senza accodarsi. Nel passo passo la lampada si accende solo quando il segnale la raggiunge.
 */
export default function BenchKeyboard() {
  const last = useSimulator((s) => s.session.presses.at(-1));
  const locked = useSimulator((s) => s.session.machine === null);
  const trace = useSimulator((s) => s.trace);
  const pulse = useSimulator((s) => s.pulse);
  const press = useSimulator((s) => s.press);
  const reached = trace === null || (last !== undefined && trace > last.stages.length);
  const lit = reached ? last?.output : undefined;

  return (
    <section aria-label={t('bench.machine')} className="bench-machine">
      <div aria-hidden="true" className="bench-rows lamps">
        {KEYBOARD_ROWS.map((row) => (
          <div key={row}>
            {[...row].map((letter) => {
              const on = lit === letter;
              return (
                <span
                  key={on ? `${letter}-${pulse}` : letter}
                  className="lamp"
                  data-lamp={letter}
                  data-lit={on || undefined}
                  data-warm={on && pulse > 0 ? '' : undefined}
                >
                  {letter}
                </span>
              );
            })}
          </div>
        ))}
      </div>
      <div role="group" aria-label={t('sim.keyboard.title')} className="bench-rows keys">
        {KEYBOARD_ROWS.map((row) => (
          <div key={row}>
            {[...row].map((letter) => {
              const struck = pulse > 0 && last?.input === letter;
              return (
                // Il pulsante non si rimonta (perderebbe il fuoco): l’animazione riparte alternando
                // due nomi uguali, «a» e «b», a ogni tasto.
                <button
                  key={letter}
                  type="button"
                  className="key"
                  data-struck={struck ? (pulse % 2 ? 'a' : 'b') : undefined}
                  disabled={locked}
                  onClick={() => press(letter)}
                >
                  {letter}
                </button>
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
