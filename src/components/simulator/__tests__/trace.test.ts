import { describe, expect, it } from 'vitest';
import { defaultConfig } from '@/engine';
import { createSession, press, pressAll } from '../session.ts';
import { describeTraceStep, traceOf } from '../trace.ts';

const session = (positions: string, plugboard: string[] = []) =>
  createSession({ ...defaultConfig('I'), positions, plugboard });

describe('traccia passo-passo', () => {
  it('non esiste prima del primo tasto', () => {
    expect(traceOf(session('AAA'))).toBeNull();
  });

  it('va dall’avanzamento dei rotori alla lampada, uno stadio alla volta', () => {
    const trace = traceOf(press(session('AAA'), 'A'));
    expect(trace).not.toBeNull();
    if (!trace) return;
    expect(trace.steps).toHaveLength(trace.press.stages.length + 2);
    expect(trace.steps[0]?.kind).toBe('step');
    expect(trace.steps.at(-1)).toEqual({ kind: 'lamp', input: 'A', output: 'B' });
    for (const step of trace.steps) {
      if (step.kind === 'stage') expect(step.map[step.stage.input]).toBe(step.stage.output);
    }
  });

  it('descrive l’avanzamento a partire dalla posizione precedente', () => {
    let s = session('ADU');
    s = pressAll(s, 'AA');
    const trace = traceOf(press(s, 'A'));
    if (!trace) throw new Error('traccia mancante');
    const config = s.config;
    expect(describeTraceStep(config, trace, trace.steps[0]!)).toBe(
      'Il tasto A fa avanzare i rotori prima di chiudere il circuito: AEW → BFX. Si muovono i rotori sinistro, centrale e destro.',
    );
    const first = traceOf(press(session('AAA'), 'A'));
    if (!first) throw new Error('traccia mancante');
    expect(describeTraceStep(config, first, first.steps[0]!)).toContain('AAA → AAB. Si muove il rotore destro.');
  });

  it('distingue i cavi collegati dalle prese libere', () => {
    const trace = traceOf(press(session('AAA', ['AQ']), 'A'));
    if (!trace) throw new Error('traccia mancante');
    const config = { ...defaultConfig('I'), plugboard: ['AQ'] };
    expect(describeTraceStep(config, trace, trace.steps[1]!)).toBe(
      'Pannello a spine, andata: la A è collegata con la Q.',
    );
    const lastStage = trace.steps.at(-2);
    if (!lastStage || lastStage.kind !== 'stage') throw new Error('stadio mancante');
    expect(describeTraceStep(config, trace, lastStage)).toMatch(/^Pannello a spine, ritorno:/);
  });

  it('descrive i rotori con finestrella, anello e cablaggio', () => {
    const trace = traceOf(press(session('AAA'), 'A'));
    if (!trace) throw new Error('traccia mancante');
    // Rotore III a destra, in posizione B dopo lo scatto: A entra nel contatto B del cablaggio, che porta a D.
    expect(describeTraceStep(defaultConfig('I'), trace, trace.steps[3]!)).toBe(
      'Rotore III (destro), andata, con B nella finestrella e anello A: la corrente entra dal contatto A, che tocca il contatto B del cablaggio; il filo porta a D, che corrisponde al contatto d’uscita C.',
    );
  });
});
