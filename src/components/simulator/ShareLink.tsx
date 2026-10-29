import { useId, useState } from 'react';
import { t } from '@/i18n';
import { url } from '@/lib/url';
import QrCode from '@/components/ui/QrCode.tsx';
import { copyText } from './labels.ts';
import { tapeLetters } from './session.ts';
import { shareQuery } from './share.ts';
import { useSimulator } from './store.ts';

export default function ShareLink() {
  const id = useId();
  const session = useSimulator((s) => s.session);
  const [withMessage, setWithMessage] = useState(false);
  const [status, setStatus] = useState('');
  const [showQr, setShowQr] = useState(false);
  if (!session.machine) return null;

  const message = withMessage ? tapeLetters(session).input : '';
  const link = `${window.location.origin}${url('simulatore/')}?${shareQuery(session.config, message)}`;

  return (
    <section aria-labelledby={`${id}-title`} className="flex flex-col gap-2">
      <h2 id={`${id}-title`} className="text-xl font-semibold">
        {t('sim.share.title')}
      </h2>
      <label htmlFor={`${id}-link`} className="sr-only">
        {t('sim.share.label')}
      </label>
      <div className="flex gap-2">
        <input
          id={`${id}-link`}
          readOnly
          value={link}
          onFocus={(e) => e.target.select()}
          className="min-w-0 flex-1 rounded-md border border-border bg-surface-muted px-3 py-2 font-mono text-sm"
        />
        <button
          type="button"
          className="rounded-md border border-border bg-surface px-3 py-2 text-sm hover:border-accent"
          onClick={async () => setStatus(t((await copyText(link)) ? 'sim.tape.copied' : 'sim.tape.copyFailed'))}
        >
          {t('sim.share.copy')}
        </button>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          className="h-5 w-5"
          checked={withMessage}
          onChange={(e) => setWithMessage(e.target.checked)}
        />
        {t('sim.share.includeMessage')}
      </label>
      <p className="text-sm text-text-muted" aria-live="polite">
        {status}
      </p>
      <div>
        <button
          type="button"
          aria-expanded={showQr}
          aria-controls={`${id}-qr`}
          className="min-h-11 rounded-md border border-border bg-surface px-3 py-2 text-sm hover:border-accent"
          onClick={() => setShowQr(!showQr)}
        >
          {showQr ? t('sim.share.hideQr') : t('sim.share.showQr')}
        </button>
      </div>
      <div id={`${id}-qr`} hidden={!showQr}>
        {showQr && (
          <figure className="flex flex-col items-start gap-2">
            <QrCode text={link} label={t('sim.share.qrLabel')} className="w-56 rounded-md lim:w-96" />
            <figcaption className="max-w-sm text-sm text-text-muted">{t('sim.share.qrHint')}</figcaption>
          </figure>
        )}
      </div>
    </section>
  );
}
