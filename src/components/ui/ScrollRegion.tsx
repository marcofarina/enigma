import type { ReactNode } from 'react';

interface Props {
  /** Nome accessibile: una delle due props è obbligatoria. */
  label?: string;
  labelledBy?: string;
  className?: string;
  children: ReactNode;
}

/**
 * Area che scorre in orizzontale quando il contenuto non entra, e riceve il focus da tastiera
 * per poterla scorrere (WCAG 2.1.1). Con `role="region"` e un nome è un punto di riferimento
 * per i lettori di schermo.
 */
export default function ScrollRegion({ label, labelledBy, className = '', children }: Props) {
  return (
    <div
      className={`overflow-x-auto ${className}`.trim()}
      // La regola considera `region` non interattivo; qui il focus serve proprio a scorrere (WCAG 2.1.1).
      // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
      tabIndex={0}
      role="region"
      aria-label={label}
      aria-labelledby={labelledBy}
    >
      {children}
    </div>
  );
}
