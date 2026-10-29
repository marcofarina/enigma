import { ALPHABET, MODEL_IDS, MODELS, rotorNames, UKW_D_FIXED_PAIR, type MachineConfig, type ModelId } from '@/engine';
import { t, tf } from '@/i18n';
import {
  changeModel,
  changePlugboard,
  changeReflector,
  changeRing,
  changeRotor,
  changeUhr,
  changeUkwD,
  defaultUkwDPairs,
} from './config-edit.ts';
import { reflectorLabel, slotName } from './labels.ts';
import PairEditor from './PairEditor.tsx';
import { useSimulator } from './store.ts';

const fieldset = 'flex flex-col gap-3 rounded-lg border border-border bg-surface p-4';
const legend = 'px-1 text-base font-semibold';
const select = 'rounded-md border border-border bg-surface px-2 py-2 text-text';

export default function ConfigPanel() {
  const config = useSimulator((s) => s.session.config);
  const configure = useSimulator((s) => s.configure);
  const model = MODELS[config.model];
  const reflector = model.reflectors[config.reflector];
  const names = rotorNames(model);
  const update = (change: (c: MachineConfig) => MachineConfig) => configure(change);
  const featured = MODEL_IDS.filter((id) => MODELS[id].featured);
  const others = MODEL_IDS.filter((id) => !MODELS[id].featured);
  const count = config.rotors.length;
  const plugboard = config.plugboard ?? [];

  return (
    <section aria-labelledby="config-title" className="flex flex-col gap-4">
      <h2 id="config-title" className="text-xl font-semibold">
        {t('sim.config.title')}
      </h2>

      <fieldset className={fieldset}>
        <legend className={legend}>{t('sim.config.model')}</legend>
        <label className="flex flex-col gap-1 text-sm">
          <select
            aria-label={t('sim.config.model')}
            className={select}
            value={config.model}
            onChange={(e) => update((c) => changeModel(c, e.target.value as ModelId))}
          >
            <optgroup label={t('sim.config.featured')}>
              {featured.map((id) => (
                <option key={id} value={id}>
                  {MODELS[id].label}
                </option>
              ))}
            </optgroup>
            <optgroup label={t('sim.config.others')}>
              {others.map((id) => (
                <option key={id} value={id}>
                  {MODELS[id].label}
                </option>
              ))}
            </optgroup>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-semibold">{t('sim.config.reflector')}</span>
          <select
            aria-label={t('sim.config.reflector')}
            className={select}
            value={config.reflector}
            onChange={(e) => update((c) => changeReflector(c, e.target.value))}
          >
            {Object.keys(model.reflectors).map((name) => (
              <option key={name} value={name}>
                {reflectorLabel(name)}
              </option>
            ))}
          </select>
        </label>
      </fieldset>

      <fieldset className={fieldset}>
        <legend className={legend}>{t('sim.config.rotors')}</legend>
        <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))` }}>
          {config.rotors.map((name, slot) => {
            const thin = count === 4 && slot === 0;
            return (
              <label key={slot} className="flex flex-col gap-1 text-sm">
                <span className="text-text-muted">{slotName(config, slot)}</span>
                <select
                  className={`${select} font-mono`}
                  aria-label={tf('sim.slot.rotor', { slot: slotName(config, slot) })}
                  value={name}
                  onChange={(e) => update((c) => changeRotor(c, slot, e.target.value))}
                >
                  {(thin ? names.thin : names.regular).map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
            );
          })}
        </div>
        <p className="text-sm text-text-muted">{t('sim.config.rotorsHint')}</p>
        <p className="mt-1 text-sm font-semibold">{t('sim.config.rings')}</p>
        <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))` }}>
          {config.rotors.map((_, slot) => (
            <select
              key={slot}
              className={`${select} font-mono`}
              aria-label={tf('sim.slot.ring', { slot: slotName(config, slot) })}
              value={config.rings[slot] ?? 'A'}
              onChange={(e) => update((c) => changeRing(c, slot, e.target.value))}
            >
              {[...ALPHABET].map((letter, i) => (
                <option key={letter} value={letter}>
                  {tf('sim.config.ringOption', { letter, number: String(i + 1).padStart(2, '0') })}
                </option>
              ))}
            </select>
          ))}
        </div>
      </fieldset>

      {model.plugboard && (
        <fieldset className={fieldset}>
          <legend className={legend}>{t('sim.plugboard.title')}</legend>
          <PairEditor
            label={t('sim.plugboard.label')}
            gridLabel={t('sim.plugboard.grid')}
            hint={t('sim.plugboard.hint')}
            pairs={plugboard}
            onChange={(pairs) => update((c) => changePlugboard(c, pairs))}
            status={tf('sim.plugboard.count', { count: plugboard.length })}
          />
          {model.uhr && (
            <div className="flex flex-col gap-2 border-t border-border pt-3">
              <p className="font-semibold">{t('sim.uhr.title')}</p>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="h-5 w-5"
                  checked={config.uhr !== undefined}
                  onChange={(e) => update((c) => changeUhr(c, e.target.checked ? 0 : undefined))}
                />
                {t('sim.uhr.enable')}
              </label>
              {config.uhr !== undefined && (
                <label className="flex flex-col gap-1 text-sm">
                  <span>
                    {t('sim.uhr.setting')}: <strong className="font-mono">{String(config.uhr).padStart(2, '0')}</strong>
                  </span>
                  <input
                    type="range"
                    min={0}
                    max={39}
                    step={1}
                    value={config.uhr}
                    onChange={(e) => update((c) => changeUhr(c, Number(e.target.value)))}
                  />
                </label>
              )}
              <p className="text-sm text-text-muted">{t('sim.uhr.hint')}</p>
            </div>
          )}
        </fieldset>
      )}

      {reflector?.rewirable && (
        <fieldset className={fieldset}>
          <legend className={legend}>{t('sim.ukwd.title')}</legend>
          <PairEditor
            label={t('sim.ukwd.label')}
            gridLabel={t('sim.ukwd.grid')}
            hint={t('sim.ukwd.hint')}
            pairs={config.ukwD ?? []}
            locked={UKW_D_FIXED_PAIR}
            onChange={(pairs) => update((c) => changeUkwD(c, pairs))}
            status={tf('sim.ukwd.count', { count: (config.ukwD ?? []).length })}
          />
          <button
            type="button"
            className="self-start rounded-md border border-border px-3 py-2 text-sm hover:border-accent"
            onClick={() => update((c) => changeUkwD(c, defaultUkwDPairs()))}
          >
            {t('sim.ukwd.reset')}
          </button>
        </fieldset>
      )}
    </section>
  );
}
