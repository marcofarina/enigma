import { useId, useMemo, useState } from 'react';
import { t, tf } from '@/i18n';
import { EXERCISES, randomSeedFrom } from '@/exercises/catalog.ts';
import { isSeed } from '@/exercises/random.ts';
import { classSeeds, generateSheet, type DailyKey, type Sheet } from '@/exercises/sheets.ts';
import Blocks from './Blocks.tsx';

const SEED_PARAM = 'seme';
const COPIES_PARAM = 'copie';
const MAX_COPIES = 40;
const DEFAULT_EXTRAS = ['posizioni', 'impossibile', 'pannello'];

function readParams(): { seed: number; copies: number } {
  const params = new URLSearchParams(window.location.search);
  const seed = Number(params.get(SEED_PARAM));
  const copies = Number(params.get(COPIES_PARAM));
  return {
    seed: isSeed(seed) ? seed : randomSeedFrom(Math.random),
    copies: Number.isInteger(copies) && copies >= 1 && copies <= MAX_COPIES ? copies : 1,
  };
}

function writeParams(seed: number, copies: number) {
  const params = new URLSearchParams(window.location.search);
  params.set(SEED_PARAM, String(seed));
  params.set(COPIES_PARAM, String(copies));
  window.history.replaceState(null, '', `?${params.toString()}`);
}

const ring = (value: number) => String(value).padStart(2, '0');

/** Riga vuota su cui scrivere a penna. */
function WriteLine({ label }: { label: string }) {
  return (
    <p className="flex items-end gap-2">
      <span className="shrink-0 text-sm">{label}</span>
      <span aria-hidden="true" className="h-7 flex-1 border-b border-text" />
    </p>
  );
}

function KeyTable({ sheet }: { sheet: Sheet }) {
  const head = 'border border-border px-1.5 py-1 text-left align-bottom font-sans text-xs font-semibold';
  const cell = 'border border-border px-1.5 py-0.5 whitespace-nowrap';
  return (
    <table className="sheet-keys w-full border-collapse font-mono text-xs">
      <caption className="mb-2 text-left font-sans text-sm">
        {tf('sheet.keys.caption', { number: sheet.number })}
      </caption>
      <thead>
        <tr>
          <th scope="col" className={head}>
            {t('sheet.keys.number')}
          </th>
          <th scope="col" className={head}>
            {t('sheet.keys.day')}
          </th>
          <th scope="col" className={head}>
            {t('sheet.keys.rotors')}
          </th>
          <th scope="col" className={head}>
            {t('sheet.keys.rings')}
          </th>
          <th scope="col" className={head}>
            {t('sheet.keys.plugboard')}
          </th>
          <th scope="col" className={head}>
            {t('sheet.keys.identifiers')}
          </th>
        </tr>
      </thead>
      <tbody>
        {sheet.keys.map((key: DailyKey) => (
          <tr key={key.day}>
            <td className={cell}>{sheet.number}</td>
            <th scope="row" className={`${cell} text-right font-semibold`}>
              {key.day}
            </th>
            <td className={cell}>{key.rotors.join(' ')}</td>
            <td className={cell}>{key.rings.map(ring).join(' ')}</td>
            <td className={`${cell} tracking-wide`}>{key.plugboard.join(' ')}</td>
            <td className={cell}>{key.identifiers.join(' ')}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function SheetView({ sheet, first }: { sheet: Sheet; first: boolean }) {
  return (
    <article
      aria-label={tf('sheet.title', { seed: sheet.seed })}
      className={`sheet flex flex-col gap-5 rounded-xl border border-border bg-surface p-4 sm:p-6 ${first ? '' : 'page-break'}`}
    >
      <header className="flex flex-col gap-2">
        <h2 className="text-xl font-semibold">{tf('sheet.title', { seed: sheet.seed })}</h2>
        <div className="grid gap-x-6 sm:grid-cols-3">
          <WriteLine label={t('sheet.name')} />
          <WriteLine label={t('sheet.class')} />
          <WriteLine label={t('sheet.date')} />
        </div>
      </header>
      <section className="flex flex-col gap-2">
        <h3 className="text-lg font-semibold">{t('sheet.keys.title')}</h3>
        <p className="text-sm">{t('sheet.keys.hint')}</p>
        <div
          className="overflow-x-auto"
          // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
          tabIndex={0}
          role="region"
          aria-label={tf('sheet.keys.caption', { number: sheet.number })}
        >
          <KeyTable sheet={sheet} />
        </div>
      </section>
      {sheet.messages.length > 0 && (
        <section className="page-break flex flex-col gap-4">
          <h3 className="text-lg font-semibold">{t('sheet.messages.title')}</h3>
          <p>{t('sheet.messages.hint')}</p>
          <ol className="flex flex-col gap-5">
            {sheet.messages.map((message, i) => (
              <li key={i} className="flex flex-col gap-2 break-inside-avoid">
                <p className="font-semibold">{tf('sheet.messages.header', { number: i + 1, day: message.day })}</p>
                <p className="font-mono text-lg tracking-wider">
                  <span className="sr-only">{t('sheet.messages.indicator')}: </span>
                  {message.start} {message.encryptedKey}
                </p>
                <p className="font-mono text-lg tracking-wider">{message.cipher}</p>
                <WriteLine label={t('sheet.messages.key')} />
                <WriteLine label={t('ex.label.plain')} />
                <WriteLine label="" />
              </li>
            ))}
          </ol>
        </section>
      )}
      {sheet.extras.map((extra) => (
        <section key={extra.id} className="flex flex-col gap-3">
          <h3 className="text-lg font-semibold">{extra.title}</h3>
          <Blocks blocks={extra.variant.blocks} />
          <WriteLine label={extra.variant.answer.label} />
        </section>
      ))}
    </article>
  );
}

function Solutions({ sheets }: { sheets: Sheet[] }) {
  return (
    <section aria-labelledby="soluzioni" className="sheet page-break flex flex-col gap-4">
      <h2 id="soluzioni" className="text-xl font-semibold">
        {t('sheet.solutions')}
      </h2>
      {sheets.map((sheet) => (
        <div key={sheet.seed} className="flex flex-col gap-1 break-inside-avoid border-t border-border pt-2">
          <h3 className="font-semibold">{tf('sheet.title', { seed: sheet.seed })}</h3>
          {sheet.messages.map((message, i) => (
            <p key={i}>
              {tf('sheet.solutions.message', {
                number: i + 1,
                key: message.messageKey,
                plain: message.plain,
              })}
            </p>
          ))}
          {sheet.extras.map((extra) => (
            <p key={extra.id}>
              <span className="font-semibold">{extra.title}:</span> {extra.variant.solution.join(' ')}
            </p>
          ))}
        </div>
      ))}
    </section>
  );
}

export default function SheetGenerator() {
  const id = useId();
  const [initial] = useState(readParams);
  const [seed, setSeed] = useState(initial.seed);
  const [copies, setCopies] = useState(initial.copies);
  const [messages, setMessages] = useState(2);
  const [extras, setExtras] = useState<string[]>(DEFAULT_EXTRAS);
  const [solutions, setSolutions] = useState(true);
  const [seedDraft, setSeedDraft] = useState(String(initial.seed));

  const sheets = useMemo(
    () => classSeeds(seed, copies).map((s) => generateSheet(s, { messages, extras })),
    [seed, copies, messages, extras],
  );

  const update = (nextSeed: number, nextCopies: number) => {
    setSeed(nextSeed);
    setCopies(nextCopies);
    setSeedDraft(String(nextSeed));
    writeParams(nextSeed, nextCopies);
  };
  const toggle = (exerciseId: string) =>
    setExtras((current) =>
      current.includes(exerciseId) ? current.filter((x) => x !== exerciseId) : [...current, exerciseId],
    );

  const field = 'rounded-md border border-border bg-surface px-2 py-2 font-mono';
  const button = 'min-h-11 rounded-md border-2 border-border bg-surface px-4 font-semibold hover:border-accent';
  const last = classSeeds(seed, copies).at(-1) ?? seed;

  return (
    <div className="flex flex-col gap-8">
      <form
        className="no-print flex flex-col gap-4 rounded-xl border border-border bg-surface-muted p-4 sm:p-6"
        onSubmit={(event) => {
          event.preventDefault();
          window.print();
        }}
      >
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex flex-col gap-1">
            <label htmlFor={`${id}-seed`} className="text-sm font-semibold">
              {t('sheet.form.seed')}
            </label>
            <input
              id={`${id}-seed`}
              type="text"
              inputMode="numeric"
              autoComplete="off"
              value={seedDraft}
              onChange={(e) => {
                setSeedDraft(e.target.value);
                const next = Number(e.target.value);
                if (isSeed(next)) update(next, copies);
              }}
              className={`${field} w-28`}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor={`${id}-copies`} className="text-sm font-semibold">
              {t('sheet.form.copies')}
            </label>
            <input
              id={`${id}-copies`}
              type="number"
              min={1}
              max={MAX_COPIES}
              value={copies}
              onChange={(e) => {
                const next = Math.round(Number(e.target.value));
                if (next >= 1 && next <= MAX_COPIES) update(seed, next);
              }}
              className={`${field} w-24`}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor={`${id}-messages`} className="text-sm font-semibold">
              {t('sheet.form.messages')}
            </label>
            <select
              id={`${id}-messages`}
              value={messages}
              onChange={(e) => setMessages(Number(e.target.value))}
              className={field}
            >
              {[0, 1, 2, 3].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
          <button type="button" className={button} onClick={() => update(randomSeedFrom(Math.random), copies)}>
            {t('sheet.form.newSeries')}
          </button>
        </div>
        <p className="text-sm text-text-muted">
          {copies === 1
            ? tf('sheet.form.rangeOne', { seed })
            : tf('sheet.form.range', { first: seed, last, count: copies })}
        </p>
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 text-sm font-semibold">{t('sheet.form.extras')}</legend>
          <div className="grid gap-x-6 gap-y-1 sm:grid-cols-2 lg:grid-cols-3">
            {EXERCISES.map((exercise) => (
              <label key={exercise.id} className="flex min-h-8 items-start gap-2">
                <input
                  type="checkbox"
                  checked={extras.includes(exercise.id)}
                  onChange={() => toggle(exercise.id)}
                  className="mt-0.5 size-5 shrink-0"
                />
                <span>
                  {exercise.title} <span className="text-sm text-text-muted">· {t(`ex.level${exercise.level}`)}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>
        <label className="flex min-h-8 items-center gap-2">
          <input
            type="checkbox"
            checked={solutions}
            onChange={(e) => setSolutions(e.target.checked)}
            className="size-5"
          />
          {t('sheet.form.solutions')}
        </label>
        <div>
          <button type="submit" className={`${button} border-accent`}>
            {t('sheet.form.print')}
          </button>
        </div>
      </form>
      <div className="flex flex-col gap-8">
        {sheets.map((sheet, i) => (
          <SheetView key={sheet.seed} sheet={sheet} first={i === 0} />
        ))}
        {solutions && <Solutions sheets={sheets} />}
      </div>
    </div>
  );
}
