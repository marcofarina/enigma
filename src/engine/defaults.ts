import { expectedRotorCount, type MachineConfig } from './config.ts';
import { MODELS, rotorNames, type ModelId, type ModelSpec } from './models.ts';

/** Riflettore proposto di default: il B (il più diffuso) se esiste, altrimenti il primo del catalogo. */
export function defaultReflector(model: ModelSpec): string {
  const names = Object.keys(model.reflectors);
  return names.find((name) => name === 'B' || name === 'B-thin') ?? names[0] ?? '';
}

/** Rotori proposti per un modello e un riflettore: il primo sottile se serve, poi i primi rotori normali. */
export function defaultRotors(model: ModelSpec, reflector: string): string[] {
  const { regular, thin } = rotorNames(model);
  const count = expectedRotorCount(model, reflector);
  return count === 4 ? [thin[0] ?? '', ...regular.slice(0, 3)] : regular.slice(0, count);
}

/** Configurazione di partenza valida per un modello: anelli e posizioni tutti su A, nessun cavo. */
export function defaultConfig(id: ModelId): MachineConfig {
  const model = MODELS[id];
  const reflector = defaultReflector(model);
  const rotors = defaultRotors(model, reflector);
  return {
    model: id,
    rotors,
    rings: 'A'.repeat(rotors.length),
    positions: 'A'.repeat(rotors.length),
    reflector,
  };
}
