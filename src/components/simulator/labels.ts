import { MODELS, type MachineConfig } from '@/engine';
import { t, tf } from '@/i18n';

/** Nome dello slot di un rotore, da sinistra: “sottile”, “sinistro”, “centrale”, “destro”. */
export function slotName(config: MachineConfig, slot: number): string {
  const count = config.rotors.length;
  const fromRight = count - 1 - slot;
  if (fromRight === 0) return t('sim.slot.right');
  if (fromRight === 1) return t('sim.slot.middle');
  if (fromRight === 2) return t('sim.slot.left');
  return t('sim.slot.thin');
}

export function reflectorLabel(name: string): string {
  if (name === 'UKW') return 'UKW';
  const thin = name.match(/^(\w)-thin$/);
  return thin ? tf('sim.config.reflectorThin', { name: thin[1] ?? '' }) : `UKW-${name}`;
}

export function reflectorShortLabel(config: MachineConfig): string {
  return config.reflector === 'UKW' ? 'UKW' : `UKW-${config.reflector.replace('-thin', '')}`;
}

export function hasSettableReflector(config: MachineConfig): boolean {
  return MODELS[config.model].reflectorSettable;
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
