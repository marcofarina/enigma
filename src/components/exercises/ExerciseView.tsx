import { useId, useMemo, useState, type SubmitEvent } from 'react';
import { t, tf } from '@/i18n';
import { url } from '@/lib/url';
import { shareQuery } from '@/components/simulator/share.ts';
import { exerciseById, isCorrect, randomSeedFrom } from '@/exercises/catalog.ts';
import { loadProgress, markSolved } from '@/exercises/progress.ts';
import { isSeed } from '@/exercises/random.ts';
import Blocks from './Blocks.tsx';
import ExerciseSimulator from './ExerciseSimulator.tsx';

const SEED_PARAM = 'seme';

/** Il seme del link, se valido; altrimenti uno nuovo, scritto nell’indirizzo per poterlo condividere. */
function initialSeed(): number {
  const fromLink = Number(new URLSearchParams(window.location.search).get(SEED_PARAM));
  const seed = isSeed(fromLink) ? fromLink : randomSeedFrom(Math.random);
  if (seed !== fromLink) showSeed(seed);
  return seed;
}

function showSeed(seed: number) {
  const params = new URLSearchParams(window.location.search);
  params.set(SEED_PARAM, String(seed));
  window.history.replaceState(null, '', `?${params.toString()}${window.location.hash}`);
}

type Feedback = 'correct' | 'wrong' | 'empty' | null;

export default function ExerciseView({ exerciseId }: { exerciseId: string }) {
  const id = useId();
  const exercise = exerciseById(exerciseId);
  const [seed, setSeed] = useState(initialSeed);
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [solved, setSolved] = useState(() => loadProgress()[exerciseId] ?? []);
  const [seedDraft, setSeedDraft] = useState('');
  const variant = useMemo(() => exercise?.generate(seed), [exercise, seed]);
  if (!exercise || !variant) return null;

  const goTo = (next: number) => {
    setSeed(next);
    showSeed(next);
    setAnswer('');
    setFeedback(null);
  };
  const check = (event: SubmitEvent) => {
    event.preventDefault();
    if (!answer.trim()) {
      setFeedback('empty');
      return;
    }
    const correct = isCorrect(variant, answer);
    setFeedback(correct ? 'correct' : 'wrong');
    if (correct) setSolved(markSolved(exercise.id, seed)[exercise.id] ?? []);
  };
  const openSeed = (event: SubmitEvent) => {
    event.preventDefault();
    const next = Number(seedDraft);
    if (isSeed(next)) goTo(next);
    setSeedDraft('');
  };

  const button = 'min-h-11 rounded-md border-2 border-border bg-surface px-4 font-semibold hover:border-accent';
  const message: Record<Exclude<Feedback, null>, string> = {
    correct: t('ex.correct'),
    wrong: t('ex.wrong'),
    empty: t('ex.empty'),
  };
  const replay = variant.replay
    ? `${url('simulatore/')}?${shareQuery(variant.replay.config, variant.replay.message)}`
    : null;

  return (
    <div className="flex flex-col gap-8">
      <section
        aria-labelledby={`${id}-variant`}
        className="flex flex-col gap-5 rounded-xl border border-border bg-surface p-4 sm:p-6"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id={`${id}-variant`} className="text-xl font-semibold">
            {tf('ex.variant', { seed })}
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            <form onSubmit={openSeed} className="flex items-center gap-2">
              <label htmlFor={`${id}-seed`} className="text-sm">
                {t('ex.seedLabel')}
              </label>
              <input
                id={`${id}-seed`}
                type="text"
                inputMode="numeric"
                autoComplete="off"
                value={seedDraft}
                onChange={(e) => setSeedDraft(e.target.value)}
                className="w-24 rounded-md border border-border bg-surface px-2 py-2 font-mono"
              />
              <button type="submit" className={button}>
                {t('ex.goToSeed')}
              </button>
            </form>
            <button type="button" className={button} onClick={() => goTo(randomSeedFrom(Math.random))}>
              {t('ex.newVariant')}
            </button>
          </div>
        </div>
        <Blocks blocks={variant.blocks} />
        <form onSubmit={check} className="flex flex-col gap-2">
          <label htmlFor={`${id}-answer`} className="font-semibold">
            {variant.answer.label}
          </label>
          <div className="flex flex-wrap gap-2">
            <input
              id={`${id}-answer`}
              type="text"
              inputMode={variant.answer.kind === 'number' ? 'numeric' : 'text'}
              autoComplete="off"
              spellCheck={false}
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              className="min-w-0 flex-1 rounded-md border border-border bg-surface px-3 py-2 font-mono text-lg uppercase tracking-wider"
            />
            <button type="submit" className={`${button} border-accent`}>
              {t('ex.check')}
            </button>
          </div>
          <p role="status" className="min-h-6 font-semibold">
            {feedback ? message[feedback] : solved.includes(seed) ? t('ex.solvedBefore') : ''}
          </p>
        </form>
        <details className="rounded-lg border border-border bg-surface-muted px-4 py-3">
          <summary className="cursor-pointer font-semibold">{t('ex.showSolution')}</summary>
          <div className="mt-2 flex flex-col gap-2">
            {variant.solution.map((line) => (
              <p key={line}>{line}</p>
            ))}
            {replay && (
              <p>
                <a href={replay} className="underline">
                  {t('ex.replay')}
                </a>
              </p>
            )}
          </div>
        </details>
        <p className="text-sm text-text-muted">{tf('ex.solved', { count: solved.length })}</p>
      </section>
      {exercise.simulator && <ExerciseSimulator />}
    </div>
  );
}
