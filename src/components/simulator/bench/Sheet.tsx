import { useId, useLayoutEffect, useMemo, useRef, useState, type SubmitEvent } from 'react';
import { defaultConfig, encodeConfig, groupLetters, MODELS, prepareText, type MachineConfig } from '@/engine';
import { t, tf } from '@/i18n';
import { missionConfig, type Mission } from '@/lib/missioni';
import { copyText } from '../labels.ts';
import { tapeLetters } from '../session.ts';
import { useSimulator } from '../store.ts';
import { panelDomId } from './Panel.tsx';
import { textOptions } from './Panels.tsx';
import { useBench } from './ui.ts';

/** Una voce del menu «Carica una chiave». */
interface Preset {
  id: string;
  label: string;
  config: MachineConfig;
  /** Per i messaggi storici: la missione e il testo cifrato della parte, da mettere in «Digita». */
  mission?: { id: string; ciphertext: string };
}

/** Chiavi di prova, in fondo al menu dopo i messaggi storici di `src/content/missioni.yaml`. */
const TEST_PRESETS: Preset[] = [
  { id: 'base', label: t('bench.preset.base'), config: defaultConfig('I') },
  {
    id: 'cavi',
    label: t('bench.preset.cables'),
    config: {
      model: 'I',
      rotors: ['III', 'I', 'V'],
      rings: 'CKM',
      positions: 'QRS',
      reflector: 'B',
      plugboard: ['AQ', 'BJ', 'CW', 'DH', 'EV', 'FM', 'GT', 'IX', 'KZ', 'LP'],
    },
  },
];

/** Una voce per ogni parte di ogni messaggio storico. */
function missionPresets(missions: readonly Mission[]): Preset[] {
  return missions.flatMap((mission) =>
    mission.parti.map((part, index) => ({
      id: mission.parti.length > 1 ? `${mission.id}-${index + 1}` : mission.id,
      label:
        mission.parti.length > 1
          ? tf('bench.mission.part', { title: mission.titolo, number: index + 1 })
          : mission.titolo,
      config: missionConfig(mission, part),
      // Il testo cifrato va nel campo nei gruppi del modulo originale.
      mission: { id: mission.id, ciphertext: part.cifrato },
    })),
  );
}

interface MessageProps {
  perRow?: number;
  minRows?: number;
  compact?: boolean;
}

const MANUAL = 'manuale';
/** Gruppi per riga del messaggio e righe mostrate anche a foglio vuoto. */
const PER_ROW = 6;
const MIN_ROWS = 4;

function DailyKey({ missions }: { missions: readonly Mission[] }) {
  const config = useSimulator((s) => s.session.config);
  const configure = useSimulator((s) => s.configure);
  const missionId = useBench((s) => s.mission);
  const historic = useMemo(() => missionPresets(missions), [missions]);
  const presets = useMemo(() => [...historic, ...TEST_PRESETS], [historic]);
  const encoded = encodeConfig(config);
  const preset = presets.find((p) => encodeConfig(p.config) === encoded)?.id ?? MANUAL;
  const plugs = config.plugboard ?? [];
  const plugText =
    config.uhr !== undefined
      ? `${plugs.join(' ')} · ${tf('bench.key.uhr', { setting: String(config.uhr).padStart(2, '0') })}`
      : plugs.length > 0
        ? plugs.join(' ')
        : t('bench.plugs.none');

  return (
    <>
      <div className="sheet-row">
        <h2>{t('bench.key.title')}</h2>
        <select
          aria-label={t('bench.key.load')}
          className="field"
          value={preset}
          onChange={(event) => {
            const chosen = presets.find((p) => p.id === event.target.value);
            if (!chosen) return;
            configure(() => chosen.config);
            useBench.setState(
              chosen.mission ? { mission: chosen.mission.id, text: chosen.mission.ciphertext } : { mission: null },
            );
          }}
        >
          <option value={MANUAL} disabled={preset !== MANUAL}>
            {t('bench.key.manual')}
          </option>
          {historic.length > 0 && (
            <optgroup label={t('bench.key.historic')}>
              {historic.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </optgroup>
          )}
          <optgroup label={t('bench.key.tests')}>
            {TEST_PRESETS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </optgroup>
        </select>
      </div>
      <dl className="key-table" data-columns={MODELS[config.model].plugboard ? 4 : 3}>
        <div>
          <dt>{t('bench.key.rotors')}</dt>
          <dd>{config.rotors.join(' ')}</dd>
        </div>
        <div>
          <dt>{t('bench.key.rings')}</dt>
          <dd>{[...config.rings].map((letter) => String(letter.charCodeAt(0) - 64).padStart(2, '0')).join(' ')}</dd>
        </div>
        {MODELS[config.model].plugboard && (
          <div>
            <dt>{t('bench.key.plugs')}</dt>
            <dd className="small">{plugText}</dd>
          </div>
        )}
        <div>
          <dt>{t('bench.key.start')}</dt>
          <dd>{config.positions}</dd>
        </div>
      </dl>
      <MissionRow mission={missions.find((m) => m.id === missionId)} preset={preset} />
    </>
  );
}

/** La riga del messaggio storico caricato, con il pulsante che apre il contesto. */
function MissionRow({ mission, preset }: { mission: Mission | undefined; preset: string }) {
  const open = useBench((s) => s.panel === 'mission');
  const togglePanel = useBench((s) => s.togglePanel);
  if (!mission) return null;
  const count = mission.parti.length;
  const part = count > 1 && preset.startsWith(`${mission.id}-`) ? Number(preset.slice(mission.id.length + 1)) : null;
  return (
    <div className="sheet-row sheet-mission">
      <p>
        <span className="sheet-mission-label">{t('bench.mission.label')}</span> {mission.titolo}
        {part !== null && `, ${tf('bench.mission.partOf', { number: part, count })}`}
      </p>
      <button
        type="button"
        className="sbtn"
        aria-expanded={open}
        aria-controls={open ? panelDomId('mission') : undefined}
        onClick={(event) => togglePanel('mission', event.currentTarget)}
      >
        {t('bench.mission.open')}
      </button>
    </div>
  );
}

/**
 * Il messaggio: due righe di lettere, tasti e lampade, a gruppi di cinque. La versione ridotta
 * mette quattro gruppi per riga e non ha «Ripeti».
 */
export function Message({ perRow = PER_ROW, minRows = MIN_ROWS, compact = false }: MessageProps) {
  const id = useId();
  const session = useSimulator((s) => s.session);
  const pulse = useSimulator((s) => s.pulse);
  const undo = useSimulator((s) => s.undo);
  const redo = useSimulator((s) => s.redo);
  const reset = useSimulator((s) => s.reset);
  const [status, setStatus] = useState('');
  const { input, output } = useMemo(() => tapeLetters(session), [session]);
  const box = useRef<HTMLDivElement>(null);

  const groups = Math.ceil(output.length / 5);
  const cells = Math.max(minRows * perRow, Math.ceil((groups + 1) / perRow) * perRow);
  const current = output.length > 0 ? groups - 1 : -1;

  // Il foglio segue l’ultima riga, come il nastro di una telescrivente.
  useLayoutEffect(() => {
    const element = box.current;
    if (element) element.scrollTop = element.scrollHeight;
  }, [output.length]);

  return (
    <section aria-labelledby={`${id}-title`} style={{ display: 'contents' }}>
      <div className="sheet-row sheet-rule">
        <h2 id={`${id}-title`}>{t('bench.message.title')}</h2>
        <div>
          <button
            type="button"
            className="sbtn"
            title={t('bench.message.undoTitle')}
            disabled={session.presses.length === 0}
            onClick={undo}
          >
            {t('sim.tape.undo')}
          </button>
          {!compact && (
            <button type="button" className="sbtn" disabled={session.undone.length === 0} onClick={redo}>
              {t('sim.tape.redo')}
            </button>
          )}
          <button type="button" className="sbtn" disabled={session.presses.length === 0} onClick={reset}>
            {t('sim.tape.reset')}
          </button>
          <button
            type="button"
            className="sbtn"
            title={t('sim.tape.copyOutput')}
            disabled={output.length === 0}
            onClick={async () =>
              setStatus(t((await copyText(groupLetters(output))) ? 'sim.tape.copied' : 'sim.tape.copyFailed'))
            }
          >
            {t('sim.tape.copy')}
          </button>
        </div>
      </div>
      <p className="sr-only" aria-live="polite">
        {status}
      </p>
      {/* Per i lettori di schermo le due righe del messaggio, intere; a vista i gruppi. */}
      <p className="sr-only">
        {t('sim.tape.input')}: <span data-tape="input">{input ? groupLetters(input) : t('sim.tape.empty')}</span>
      </p>
      <p className="sr-only">
        {t('sim.tape.output')}: <span data-tape="output">{output ? groupLetters(output) : t('sim.tape.empty')}</span>
      </p>
      <div
        ref={box}
        aria-hidden="true"
        className="message"
        style={perRow === PER_ROW ? undefined : { gridTemplateColumns: `repeat(${perRow}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: cells }, (_, g) => {
          const typed = input.slice(g * 5, g * 5 + 5);
          const lit = output.slice(g * 5, g * 5 + 5);
          const isCurrent = g === current;
          return (
            <div key={g} className="group" data-current={isCurrent || undefined}>
              <span className="group-in">{typed}</span>
              <span className="group-out">
                {isCurrent && pulse > 0 ? (
                  <>
                    {lit.slice(0, -1)}
                    <span key={pulse} className="ink-new">
                      {lit.slice(-1)}
                    </span>
                  </>
                ) : (
                  lit
                )}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function TypeText() {
  const id = useId();
  const locked = useSimulator((s) => s.session.machine === null);
  const typing = useSimulator((s) => s.typing);
  const autoType = useSimulator((s) => s.autoType);
  const stopTyping = useSimulator((s) => s.stopTyping);
  const punctuation = useBench((s) => s.punctuation);
  const digits = useBench((s) => s.digits);
  const optionsOpen = useBench((s) => s.panel === 'options');
  const togglePanel = useBench((s) => s.togglePanel);
  const text = useBench((s) => s.text);
  const letters = prepareText(text, textOptions(punctuation, digits));

  const onSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (typing) {
      stopTyping();
      return;
    }
    autoType(letters);
  };

  return (
    <form className="type-row" onSubmit={onSubmit}>
      <label htmlFor={`${id}-text`} className="sr-only">
        {t('sim.text.label')}
      </label>
      <input
        id={`${id}-text`}
        className="field"
        autoComplete="off"
        spellCheck={false}
        value={text}
        onChange={(event) => useBench.setState({ text: event.target.value })}
      />
      <button
        type="button"
        className="sbtn"
        aria-expanded={optionsOpen}
        aria-controls={optionsOpen ? panelDomId('options') : undefined}
        onClick={(event) => togglePanel('options', event.currentTarget)}
      >
        {t('bench.text.options')}
      </button>
      <button type="submit" className="sbtn sbtn-main" disabled={!typing && (locked || letters.length === 0)}>
        {typing ? t('bench.text.stop') : t('bench.text.submit')}
      </button>
    </form>
  );
}

export default function Sheet({ invalidLink, missions }: { invalidLink: boolean; missions: readonly Mission[] }) {
  return (
    <section aria-label={t('bench.sheet')} className="sheet">
      {invalidLink && (
        <p role="status" className="sheet-status">
          {t('sim.share.invalid')}
        </p>
      )}
      <DailyKey missions={missions} />
      <Message />
      <TypeText />
    </section>
  );
}
