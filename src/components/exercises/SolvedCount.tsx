import { useState } from 'react';
import { tf, t } from '@/i18n';
import { loadProgress } from '@/exercises/progress.ts';

/** Varianti risolte di un esercizio, lette dal browser. */
export default function SolvedCount({ exerciseId }: { exerciseId: string }) {
  const [count] = useState(() => loadProgress()[exerciseId]?.length ?? 0);
  return <span className="text-sm text-text-muted">{count > 0 ? tf('ex.solved', { count }) : t('ex.notSolved')}</span>;
}
