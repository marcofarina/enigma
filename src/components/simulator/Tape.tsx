import { useId, useMemo, useState, type SubmitEvent } from 'react';
import { groupLetters, prepareText } from '@/engine';
import { t, tf } from '@/i18n';
import { copyText } from './labels.ts';
import { tapeLetters } from './session.ts';
import { useSimulator } from './store.ts';

const button =
  'rounded-md border border-border bg-surface px-3 py-2 text-sm hover:border-accent disabled:cursor-not-allowed disabled:opacity-50';

function TapeLine({
  kind,
  label,
  copyLabel,
  letters,
}: {
  kind: string;
  label: string;
  copyLabel: string;
  letters: string;
}) {
  const id = useId();
  const [status, setStatus] = useState('');
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between gap-2">
        <h3 id={`${id}-label`} className="text-sm font-semibold">
          {label}{' '}
          <span className="font-normal text-text-muted">
            · {tf(letters.length === 1 ? 'sim.tape.countOne' : 'sim.tape.count', { count: letters.length })}
          </span>
        </h3>
        <button
          type="button"
          className={button}
          aria-label={copyLabel}
          disabled={letters.length === 0}
          onClick={async () =>
            setStatus(t((await copyText(groupLetters(letters))) ? 'sim.tape.copied' : 'sim.tape.copyFailed'))
          }
        >
          {t('sim.tape.copy')}
        </button>
      </div>
      <p
        data-tape={kind}
        aria-labelledby={`${id}-label`}
        className="min-h-12 break-words rounded-md border border-border bg-surface-muted px-3 py-2 font-mono text-lg tracking-wider"
      >
        {letters ? groupLetters(letters) : <span className="text-base text-text-muted">{t('sim.tape.empty')}</span>}
      </p>
      <p className="text-sm text-text-muted" aria-live="polite">
        {status}
      </p>
    </div>
  );
}

/** Il nastro; `heading` a falso lo nasconde dove un titolo romperebbe la struttura della pagina (lezioni). */
export default function Tape({ heading = true }: { heading?: boolean }) {
  const titleId = useId();
  const session = useSimulator((s) => s.session);
  const undo = useSimulator((s) => s.undo);
  const redo = useSimulator((s) => s.redo);
  const reset = useSimulator((s) => s.reset);
  const { input, output } = useMemo(() => tapeLetters(session), [session]);

  return (
    <section aria-labelledby={titleId} className="flex flex-col gap-3">
      <h2 id={titleId} className={heading ? 'text-xl font-semibold' : 'sr-only'}>
        {t('sim.tape.title')}
      </h2>
      <div className="flex flex-col gap-2">
        <TapeLine kind="input" label={t('sim.tape.input')} copyLabel={t('sim.tape.copyInput')} letters={input} />
        <TapeLine kind="output" label={t('sim.tape.output')} copyLabel={t('sim.tape.copyOutput')} letters={output} />
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" className={button} disabled={session.presses.length === 0} onClick={undo}>
          {t('sim.tape.undo')}
        </button>
        <button type="button" className={button} disabled={session.undone.length === 0} onClick={redo}>
          {t('sim.tape.redo')}
        </button>
        <button type="button" className={button} disabled={session.presses.length === 0} onClick={reset}>
          {t('sim.tape.reset')}
        </button>
      </div>
      <p className="text-sm text-text-muted">{t('sim.tape.undoNote')}</p>
    </section>
  );
}

/** Digita un testo libero, dopo averlo ridotto alle 26 lettere della tastiera. */
export function TextInput() {
  const id = useId();
  const locked = useSimulator((s) => s.session.machine === null);
  const pressAll = useSimulator((s) => s.pressAll);
  const [text, setText] = useState('');
  const [punctuation, setPunctuation] = useState(false);
  const [digits, setDigits] = useState(false);
  const letters = prepareText(text, { punctuation: punctuation ? 'x' : 'drop', digits: digits ? 'spell' : 'drop' });

  const onSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    pressAll(letters);
    setText('');
  };

  return (
    <section aria-labelledby={`${id}-title`}>
      <h2 id={`${id}-title`} className="mb-2 text-xl font-semibold">
        {t('sim.text.title')}
      </h2>
      <form className="flex flex-col gap-2" onSubmit={onSubmit}>
        <label htmlFor={`${id}-text`} className="text-sm font-semibold">
          {t('sim.text.label')}
        </label>
        <textarea
          id={`${id}-text`}
          rows={3}
          className="rounded-md border border-border bg-surface px-3 py-2"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              className="h-5 w-5"
              checked={punctuation}
              onChange={(e) => setPunctuation(e.target.checked)}
            />
            {t('sim.text.punctuation')}
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" className="h-5 w-5" checked={digits} onChange={(e) => setDigits(e.target.checked)} />
            {t('sim.text.digits')}
          </label>
        </div>
        <p className="break-words font-mono text-sm text-text-muted">
          {tf('sim.text.preview', { count: letters.length })}
          {letters && ` — ${groupLetters(letters)}`}
        </p>
        <button
          type="submit"
          disabled={locked || letters.length === 0}
          className="self-start rounded-md bg-accent px-4 py-2 font-semibold text-accent-contrast disabled:cursor-not-allowed disabled:opacity-50"
        >
          {t('sim.text.submit')}
        </button>
      </form>
    </section>
  );
}
