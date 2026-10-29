import { decodeConfig, encodeConfig, prepareText, type ConfigIssue, type MachineConfig } from '@/engine';

/** Parametro facoltativo del link con il messaggio da digitare all’apertura. */
const MESSAGE_PARAM = 't';

/** Query string di un link condivisibile: la configurazione e, se richiesto, il messaggio. */
export function shareQuery(config: MachineConfig, message = ''): string {
  const query = encodeConfig(config);
  return message ? `${query}&${MESSAGE_PARAM}=${message}` : query;
}

export type SharedLink =
  | { kind: 'none' }
  | { kind: 'ok'; config: MachineConfig; message: string }
  | { kind: 'invalid'; issues: ConfigIssue[] };

/** Legge la query string con cui è stata aperta la pagina. */
export function readSharedLink(search: string): SharedLink {
  const params = new URLSearchParams(search.replace(/^\?/, ''));
  if (!params.has('v') && !params.has('m')) return { kind: 'none' };
  const result = decodeConfig(search);
  if (!result.ok) return { kind: 'invalid', issues: result.issues };
  return { kind: 'ok', config: result.config, message: prepareText(params.get(MESSAGE_PARAM) ?? '') };
}
