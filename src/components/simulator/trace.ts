import {
  initialState,
  stageMap,
  toLetter,
  windowLetters,
  type KeyPress,
  type MachineConfig,
  type MachineState,
  type Stage,
} from '@/engine';
import { t, tf } from '@/i18n';
import { reflectorShortLabel, slotName } from './labels.ts';
import type { Session } from './session.ts';

/**
 * Traccia passo-passo dell’ultimo tasto: prima l’avanzamento dei rotori, poi uno stadio alla
 * volta, infine la lampada. L’indice di un passo coincide con il numero di stadi che lo schema
 * deve disegnare (`layoutSchematic(..., progress)`).
 */
export type TraceStep =
  | { kind: 'step'; before: MachineState; after: MachineState; moved: readonly boolean[]; reflectorMoved: boolean }
  | { kind: 'stage'; stage: Stage; map: number[] }
  | { kind: 'lamp'; input: string; output: string };

export interface Trace {
  press: KeyPress;
  steps: TraceStep[];
}

export function traceOf(session: Session): Trace | null {
  const press = session.presses.at(-1);
  if (!session.machine || !press) return null;
  const machine = session.machine;
  const before = session.presses.at(-2)?.state ?? initialState(machine);
  return {
    press,
    steps: [
      {
        kind: 'step',
        before,
        after: press.state,
        moved: press.step.moved,
        reflectorMoved: press.step.reflectorMoved,
      },
      ...press.stages.map((stage) => ({ kind: 'stage' as const, stage, map: stageMap(machine, press.state, stage) })),
      { kind: 'lamp', input: press.input, output: press.output },
    ],
  };
}

const list = new Intl.ListFormat('it', { type: 'conjunction' });

function describeStage(config: MachineConfig, state: MachineState, stage: Stage): string {
  const values = {
    direction: t(stage.direction === 'backward' ? 'sim.trace.backward' : 'sim.trace.forward'),
    input: toLetter(stage.input),
    output: toLetter(stage.output),
  };
  switch (stage.kind) {
    case 'plugboard':
      if (config.uhr !== undefined) return tf('sim.trace.uhr', values);
      return tf(stage.input === stage.output ? 'sim.trace.plugboardNone' : 'sim.trace.plugboardPair', values);
    case 'entry':
      return tf('sim.trace.entry', values);
    case 'rotor': {
      const slot = stage.slot ?? 0;
      return tf('sim.trace.rotor', {
        ...values,
        name: config.rotors[slot] ?? '',
        slot: slotName(config, slot),
        window: toLetter(state.positions[slot] ?? 0),
        ring: config.rings[slot] ?? 'A',
        coreInput: toLetter(stage.coreInput ?? 0),
        coreOutput: toLetter(stage.coreOutput ?? 0),
      });
    }
    case 'reflector':
      return tf('sim.trace.reflector', { ...values, name: reflectorShortLabel(config) });
  }
}

/** Frase che descrive un passo della traccia, letta anche dai lettori di schermo. */
export function describeTraceStep(config: MachineConfig, trace: Trace, step: TraceStep): string {
  switch (step.kind) {
    case 'step': {
      const rotors = config.rotors.map((_, slot) => slot).filter((slot) => step.moved[slot]);
      const text = tf(rotors.length === 1 ? 'sim.trace.stepOne' : 'sim.trace.stepMany', {
        input: trace.press.input,
        before: windowLetters(step.before),
        after: windowLetters(step.after),
        rotors: list.format(rotors.map((slot) => slotName(config, slot))),
      });
      return step.reflectorMoved ? `${text} ${t('sim.trace.stepReflector')}` : text;
    }
    case 'stage':
      return describeStage(config, trace.press.state, step.stage);
    case 'lamp':
      return tf('sim.trace.lamp', step);
  }
}
