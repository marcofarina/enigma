import { useEffect, useId, useMemo, useState } from 'react';
import { MODELS } from '@/engine';
import { t, tf } from '@/i18n';
import { windows } from '@/components/simulator/session.ts';
import { useSimulator } from '@/components/simulator/store.ts';
import MachineIllustration from './MachineIllustration.tsx';

/** La vista “Macchina” del simulatore: l’illustrazione segue la sessione e la traccia passo-passo. */
export default function MachineView({ heading = true }: { heading?: boolean }) {
  const id = useId();
  const session = useSimulator((s) => s.session);
  const trace = useSimulator((s) => s.trace);
  const { config } = session;
  const model = MODELS[config.model];
  const letters = useMemo(() => windows(session), [session]);
  const last = session.presses.at(-1);
  const lit = last && (trace === null || trace > last.stages.length) ? last.output : null;

  // Il tasto resta abbassato per un attimo dopo ogni pressione: si ricorda quale pressione è già
  // stata “rilasciata”.
  const count = session.presses.length;
  const [released, setReleased] = useState(count);
  useEffect(() => {
    const timer = window.setTimeout(() => setReleased(count), 180);
    return () => window.clearTimeout(timer);
  }, [count]);
  const pressed = last && released !== count ? last.input : null;

  const rotors = config.rotors.map((name) => ({ name, thin: Boolean(model.rotors[name]?.thin) }));
  const pairs = model.plugboard ? (config.plugboard ?? []) : [];
  const description = [
    tf('sim.machine.descModel', { model: model.label, rotors: config.rotors.join(' '), windows: letters.rotors }),
    last ? tf('sim.machine.descLamp', { input: last.input, output: lit ?? '—' }) : t('sim.machine.descIdle'),
    model.plugboard
      ? pairs.length > 0
        ? tf('sim.machine.descCables', { count: pairs.length, pairs: pairs.join(' ') })
        : t('sim.machine.descNoCables')
      : t('sim.machine.descNoPlugboard'),
  ].join(' ');

  return (
    <section aria-labelledby={`${id}-title`} className="flex flex-col gap-2">
      <h2 id={`${id}-title`} className={heading ? 'text-xl font-semibold' : 'sr-only'}>
        {t('sim.machine.title')}
      </h2>
      {heading && <p className="text-sm text-text-muted">{t('sim.machine.hint')}</p>}
      <MachineIllustration
        rotors={rotors}
        reflectorWindow={model.reflectorSettable}
        plugboard={model.plugboard}
        windows={letters.rotors}
        reflectorLetter={letters.reflector}
        pairs={pairs}
        lit={lit}
        pressed={pressed}
        {...(config.uhr === undefined ? {} : { uhr: config.uhr })}
        title={t('sim.machine.title')}
        description={description}
        className="mx-auto block w-full max-w-3xl"
      />
    </section>
  );
}
