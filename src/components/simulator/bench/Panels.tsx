import { useId, useState } from 'react';
import { MODELS, prepareText, UKW_D_FIXED_PAIR, groupLetters } from '@/engine';
import { t, tf } from '@/i18n';
import { url } from '@/lib/url';
import QrCode from '@/components/ui/QrCode.tsx';
import {
  changePlugboard,
  changeUhr,
  changeUkwD,
  defaultUkwDPairs,
  formatPairs,
  parsePairs,
  togglePlug,
} from '../config-edit.ts';
import { KEYBOARD_ROWS } from '../keys.ts';
import { copyText } from '../labels.ts';
import { tapeLetters } from '../session.ts';
import { shareQuery } from '../share.ts';
import { useSimulator } from '../store.ts';
import Panel from './Panel.tsx';
import { useBench } from './ui.ts';

/** «nessun cavo», «un cavo», «7 cavi». */
export function cableCount(count: number): string {
  if (count === 0) return t('bench.plugs.none');
  if (count === 1) return t('bench.plugs.one');
  return tf('bench.plugs.many', { count });
}

interface BoardProps {
  pairs: readonly string[];
  onChange: (pairs: string[]) => void;
  label: string;
  gridLabel: string;
  /** Coppia fissa, mostrata ma non modificabile (J–Y nell’UKW-D). */
  locked?: string;
}

/**
 * Prese disposte come sulla macchina (QWERTZ) e campo delle coppie. Due clic su prese libere le
 * collegano, un clic su una presa collegata stacca il cavo, la presa in attesa ha il bordo ambra.
 */
function SocketBoard({ pairs, onChange, label, gridLabel, locked }: BoardProps) {
  const id = useId();
  const [pending, setPending] = useState<string | null>(null);
  // Il campo mostra ciò che si sta scrivendo; uscendo torna alla forma normalizzata.
  const [draft, setDraft] = useState<string | null>(null);
  const partner = new Map<string, string>();
  for (const pair of [...pairs, ...(locked ? [locked] : [])]) {
    const [a = '', b = ''] = pair;
    partner.set(a, b);
    partner.set(b, a);
  }
  const socketLabel = (letter: string) => {
    const other = partner.get(letter);
    if (other && locked?.includes(letter)) return tf('sim.pairs.locked', { letter, other });
    if (other) return tf('sim.pairs.connected', { letter, other });
    if (pending === letter) return tf('sim.pairs.waiting', { letter });
    return tf('sim.pairs.free', { letter });
  };

  return (
    <>
      <div role="group" aria-label={gridLabel} className="sockets">
        {KEYBOARD_ROWS.map((row) => (
          <div key={row}>
            {[...row].map((letter) => {
              const other = partner.get(letter);
              return (
                <button
                  key={letter}
                  type="button"
                  className="socket"
                  data-plugged={other ? '' : undefined}
                  data-waiting={pending === letter ? '' : undefined}
                  disabled={Boolean(locked?.includes(letter))}
                  aria-label={socketLabel(letter)}
                  aria-pressed={pending === letter}
                  onClick={() => {
                    const next = togglePlug(pairs, pending, letter);
                    setPending(next.pending);
                    setDraft(null);
                    onChange(next.pairs);
                  }}
                >
                  <b aria-hidden="true">{letter}</b>
                  <small aria-hidden="true">{other ?? ''}</small>
                </button>
              );
            })}
          </div>
        ))}
      </div>
      <label className="stack" htmlFor={`${id}-pairs`}>
        {label}
      </label>
      <input
        id={`${id}-pairs`}
        type="text"
        autoComplete="off"
        spellCheck={false}
        style={{ marginTop: '-0.5rem' }}
        value={draft ?? formatPairs(pairs)}
        onChange={(event) => {
          setDraft(event.target.value);
          setPending(null);
          onChange(parsePairs(event.target.value).pairs);
        }}
        onBlur={() => setDraft(null)}
      />
    </>
  );
}

export function PlugPanel() {
  const config = useSimulator((s) => s.session.config);
  const configure = useSimulator((s) => s.configure);
  const pairs = config.plugboard ?? [];
  const model = MODELS[config.model];
  return (
    <Panel
      id="plugs"
      place="left"
      title={
        <>
          {t('bench.plugs.title')} <span>{cableCount(pairs.length)}</span>
        </>
      }
    >
      <SocketBoard
        pairs={pairs}
        label={t('sim.plugboard.label')}
        gridLabel={t('sim.plugboard.grid')}
        onChange={(next) => configure((c) => changePlugboard(c, next))}
      />
      <p className="panel-hint">{t('bench.plugs.hint')}</p>
      {model.uhr && (
        <div className="panel-section">
          <label className="check">
            <input
              type="checkbox"
              checked={config.uhr !== undefined}
              onChange={(event) => configure((c) => changeUhr(c, event.target.checked ? 0 : undefined))}
            />
            {t('sim.uhr.enable')}
          </label>
          {config.uhr !== undefined && (
            <label className="stack">
              <span>
                {t('sim.uhr.setting')}: <b className="typed">{String(config.uhr).padStart(2, '0')}</b>
              </span>
              <input
                type="range"
                min={0}
                max={39}
                step={1}
                value={config.uhr}
                onChange={(event) => configure((c) => changeUhr(c, Number(event.target.value)))}
              />
            </label>
          )}
          <p className="panel-hint">{t('sim.uhr.hint')}</p>
        </div>
      )}
    </Panel>
  );
}

export function UkwDPanel() {
  const wired = useSimulator((s) => s.session.config.ukwD);
  const pairs = wired ?? [];
  const configure = useSimulator((s) => s.configure);
  return (
    <Panel
      id="ukwd"
      place="left"
      title={
        <>
          {t('sim.ukwd.title')} <span>{tf('sim.ukwd.count', { count: pairs.length })}</span>
        </>
      }
    >
      <SocketBoard
        pairs={pairs}
        locked={UKW_D_FIXED_PAIR}
        label={t('sim.ukwd.label')}
        gridLabel={t('sim.ukwd.grid')}
        onChange={(next) => configure((c) => changeUkwD(c, next))}
      />
      <p className="panel-hint">{t('sim.ukwd.hint')}</p>
      <button type="button" className="ctl" onClick={() => configure((c) => changeUkwD(c, defaultUkwDPairs()))}>
        {t('sim.ukwd.reset')}
      </button>
    </Panel>
  );
}

/** Come «Digita» riduce il testo alle 26 lettere della tastiera. */
export function textOptions(punctuation: boolean, digits: boolean) {
  return {
    punctuation: punctuation ? ('x' as const) : ('drop' as const),
    digits: digits ? ('spell' as const) : ('drop' as const),
  };
}

export function OptionsPanel() {
  const text = useBench((s) => s.text);
  const punctuation = useBench((s) => s.punctuation);
  const digits = useBench((s) => s.digits);
  const letters = prepareText(text, textOptions(punctuation, digits));
  return (
    <Panel id="options" place="bottom" title={t('bench.text.optionsTitle')}>
      <label className="check">
        <input
          type="checkbox"
          checked={punctuation}
          onChange={(event) => useBench.setState({ punctuation: event.target.checked })}
        />
        {t('sim.text.punctuation')}
      </label>
      <label className="check">
        <input
          type="checkbox"
          checked={digits}
          onChange={(event) => useBench.setState({ digits: event.target.checked })}
        />
        {t('sim.text.digits')}
      </label>
      <p className="panel-hint typed">
        {tf('sim.text.preview', { count: letters.length })}
        {letters && ` — ${groupLetters(letters)}`}
      </p>
    </Panel>
  );
}

export function SharePanel() {
  const id = useId();
  const session = useSimulator((s) => s.session);
  const [withMessage, setWithMessage] = useState(false);
  const [status, setStatus] = useState('');
  const [showQr, setShowQr] = useState(false);
  const message = withMessage ? tapeLetters(session).input : '';
  const link = `${window.location.origin}${url()}?${shareQuery(session.config, message)}`;

  return (
    <Panel id="share" place="right" title={t('sim.share.title')}>
      <label htmlFor={`${id}-link`} className="sr-only">
        {t('sim.share.label')}
      </label>
      <div className="share-link">
        <input id={`${id}-link`} readOnly value={link} onFocus={(event) => event.target.select()} />
        <button
          type="button"
          className="ctl"
          onClick={async () => setStatus(t((await copyText(link)) ? 'sim.tape.copied' : 'sim.tape.copyFailed'))}
        >
          {t('sim.share.copy')}
        </button>
      </div>
      <label className="check">
        <input type="checkbox" checked={withMessage} onChange={(event) => setWithMessage(event.target.checked)} />
        {t('sim.share.includeMessage')}
      </label>
      <p className="panel-hint" aria-live="polite">
        {status}
      </p>
      <button
        type="button"
        className="ctl"
        style={{ alignSelf: 'flex-start' }}
        aria-expanded={showQr}
        aria-controls={`${id}-qr`}
        onClick={() => setShowQr(!showQr)}
      >
        {showQr ? t('sim.share.hideQr') : t('sim.share.showQr')}
      </button>
      <div id={`${id}-qr`} hidden={!showQr}>
        {showQr && (
          <figure style={{ margin: 0 }}>
            <QrCode text={link} label={t('sim.share.qrLabel')} className="qr" />
            <figcaption className="panel-hint" style={{ marginTop: '0.5rem' }}>
              {t('sim.share.qrHint')}
            </figcaption>
          </figure>
        )}
      </div>
    </Panel>
  );
}
