import type { ReactNode } from 'react';
import type { Tone } from '../types';

export interface ToneIconProps {
  tone: Tone;
  className?: string;
}

/** Small inline SVG icon for a tone: check, cross, triangle or info mark. */
export function ToneIcon({ tone, className }: ToneIconProps) {
  let shape: ReactNode;
  switch (tone) {
    case 'success':
      shape = (
        <>
          <circle cx="8" cy="8" r="6.25" />
          <path d="M5.2 8.3l2 2 3.8-4.4" />
        </>
      );
      break;
    case 'danger':
      shape = (
        <>
          <circle cx="8" cy="8" r="6.25" />
          <path d="M6 6l4 4M10 6l-4 4" />
        </>
      );
      break;
    case 'warning':
      shape = (
        <>
          <path d="M8 2.4L14.5 13.6H1.5L8 2.4z" />
          <path d="M8 6.6v3" />
          <circle cx="8" cy="11.4" r="0.9" fill="currentColor" stroke="none" />
        </>
      );
      break;
    default:
      // info, neutral, primary
      shape = (
        <>
          <circle cx="8" cy="8" r="6.25" />
          <path d="M8 7.6v3.2" />
          <circle cx="8" cy="5.2" r="0.9" fill="currentColor" stroke="none" />
        </>
      );
  }
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {shape}
    </svg>
  );
}

/** Small inline SVG cross used by close buttons. */
export function CloseIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M2.5 2.5l7 7M9.5 2.5l-7 7" />
    </svg>
  );
}
