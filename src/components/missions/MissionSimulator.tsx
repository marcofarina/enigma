import { useMemo } from 'react';
import type { MachineConfig } from '@/engine';
import { t, tf } from '@/i18n';
import ExerciseSimulator from '@/components/exercises/ExerciseSimulator.tsx';
import { tapeLetters } from '@/components/simulator/session.ts';
import { useSimulator } from '@/components/simulator/store.ts';
import { missionProgress } from '@/missions/progress.ts';

interface Props {
  config: MachineConfig;
  cipher: string;
  plain: string;
}

function Progress({ cipher, plain }: Omit<Props, 'config'>) {
  const session = useSimulator((s) => s.session);
  const { input, output } = useMemo(() => tapeLetters(session), [session]);
  const progress = missionProgress(input, output, cipher, plain);
  const text = {
    empty: t('mission.progress.empty'),
    other: t('mission.progress.other'),
    ok: progress.kind === 'ok' ? tf('mission.progress.ok', { done: progress.done, total: progress.total }) : '',
    wrong: progress.kind === 'wrong' ? tf('mission.progress.wrong', { at: progress.at }) : '',
    solved: t('mission.progress.solved'),
  }[progress.kind];
  return (
    <p
      role="status"
      data-mission={progress.kind}
      className={[
        'rounded-lg border-2 px-4 py-3',
        progress.kind === 'solved' ? 'border-accent font-semibold' : 'border-border',
      ].join(' ')}
    >
      {text}
    </p>
  );
}

/** Simulatore con la chiave del giorno già impostata e la verifica della decifrazione. */
export default function MissionSimulator({ config, cipher, plain }: Props) {
  return (
    <ExerciseSimulator initial={config} hint={t('mission.simulatorHint')} textInput>
      <Progress cipher={cipher} plain={plain} />
    </ExerciseSimulator>
  );
}
