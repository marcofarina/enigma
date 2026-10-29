import { useMemo } from 'react';
import { qrPath } from './qr.ts';

interface Props {
  text: string;
  /** Testo alternativo: che cosa si apre inquadrando il codice. */
  label: string;
  className?: string;
}

/**
 * Codice QR in SVG. I colori restano scuro su chiaro anche nel tema scuro, perché molti lettori
 * non riconoscono i codici invertiti.
 */
export default function QrCode({ text, label, className = '' }: Props) {
  const { size, d } = useMemo(() => qrPath(text), [text]);
  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label={label}
      shapeRendering="crispEdges"
      className={`block ${className}`}
    >
      <rect width={size} height={size} className="fill-qr-light" />
      <path d={d} className="fill-qr-dark" />
    </svg>
  );
}
