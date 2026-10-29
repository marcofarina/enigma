import { InvalidConfigError, validateConfig, type ConfigIssue, type MachineConfig } from './config.ts';
import { isModelId } from './models.ts';

/**
 * Codifica la configurazione in una query string leggibile e stabile, usata per i link
 * condivisibili e per i QR code del libro. Esempio:
 * `v=1&m=M4&w=Beta-II-IV-I&r=AAAV&p=VJNA&u=B-thin&s=AT.BL.DF.GJ.HM.NW.OP.QY.RZ.VX`
 */

export const CODEC_VERSION = '1';

export function encodeConfig(config: MachineConfig): string {
  const params = new URLSearchParams();
  params.set('v', CODEC_VERSION);
  params.set('m', config.model);
  params.set('w', config.rotors.join('-'));
  params.set('r', config.rings);
  params.set('p', config.positions);
  params.set('u', config.reflector);
  if (config.reflectorPosition && config.reflectorPosition !== 'A') params.set('up', config.reflectorPosition);
  if (config.plugboard && config.plugboard.length > 0) params.set('s', config.plugboard.join('.'));
  if (config.uhr !== undefined) params.set('uhr', String(config.uhr));
  if (config.ukwD) params.set('d', config.ukwD.join('.'));
  return params.toString();
}

export type DecodeResult = { ok: true; config: MachineConfig } | { ok: false; issues: ConfigIssue[] };

const list = (value: string | null) => (value ? value.split('.').filter(Boolean) : undefined);

/** Decodifica e valida. Accetta una query string con o senza `?` iniziale. */
export function decodeConfig(query: string): DecodeResult {
  const params = new URLSearchParams(query.replace(/^\?/, ''));
  const version = params.get('v');
  if (version !== CODEC_VERSION) {
    return {
      ok: false,
      issues: [{ field: 'model', message: `Versione del link non supportata (${version ?? 'assente'}).` }],
    };
  }
  const model = params.get('m') ?? '';
  if (!isModelId(model))
    return { ok: false, issues: [{ field: 'model', message: `Il modello «${model}» non esiste.` }] };

  const config: MachineConfig = {
    model,
    rotors: (params.get('w') ?? '').split('-').filter(Boolean),
    rings: (params.get('r') ?? '').toUpperCase(),
    positions: (params.get('p') ?? '').toUpperCase(),
    reflector: params.get('u') ?? '',
  };
  const reflectorPosition = params.get('up');
  const plugboard = list(params.get('s')?.toUpperCase() ?? null);
  const uhr = params.get('uhr');
  const ukwD = list(params.get('d')?.toUpperCase() ?? null);
  const full: MachineConfig = {
    ...config,
    ...(reflectorPosition ? { reflectorPosition: reflectorPosition.toUpperCase() } : {}),
    ...(plugboard ? { plugboard } : {}),
    ...(uhr !== null ? { uhr: Number(uhr) } : {}),
    ...(ukwD ? { ukwD } : {}),
  };

  const issues = validateConfig(full);
  return issues.length > 0 ? { ok: false, issues } : { ok: true, config: full };
}

/** Come `decodeConfig`, ma lancia `InvalidConfigError` se il link non è valido. */
export function decodeConfigOrThrow(query: string): MachineConfig {
  const result = decodeConfig(query);
  if (!result.ok) throw new InvalidConfigError(result.issues);
  return result.config;
}
