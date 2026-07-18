import { useEffect, useId, useRef, useState, type KeyboardEvent, type PointerEvent as ReactPointerEvent } from 'react';
import { cx } from '../utils/cx';
import { Field } from '../field/Field';
import { Dropdown, DropdownIndicator } from '../dropdown';
import type { FieldBaseProps } from '../types';
import { formatColor, hsvToRgb, parseColor, rgbToHsv, type HSV } from './color-utils';
import './color-picker.scss';

const DEFAULT_PRESETS = [
  '#e5484d',
  '#f5a623',
  '#f5d90a',
  '#30a46c',
  '#0091ff',
  '#4f6df5',
  '#8e4ec6',
  '#d6409f',
  '#1a2130',
  '#ffffff',
];

export interface ColorPickerProps extends FieldBaseProps {
  value: string;
  onChange: (value: string) => void;
  /** Output format for onChange. Default 'hex'. */
  format?: 'hex' | 'rgba';
  /** Show the alpha slider and allow alpha in the output. Default false. */
  showAlpha?: boolean;
  /** Swatch presets shown in the panel. */
  presets?: string[];
  /** Show a clear button that resets the value to ''. Default true. */
  clearable?: boolean;
  placeholder?: string;
  fullWidth?: boolean;
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

export function ColorPicker({
  value,
  onChange,
  format = 'hex',
  showAlpha = false,
  presets = DEFAULT_PRESETS,
  clearable = true,
  placeholder = 'Pick a color',
  fullWidth,
  label,
  hint,
  error,
  required,
  disabled,
  size = 'md',
  className,
  id,
}: ColorPickerProps) {
  const autoId = useId();
  const triggerId = id ?? autoId;
  const triggerRef = useRef<HTMLDivElement>(null);
  const squareRef = useRef<HTMLDivElement>(null);
  const hueRef = useRef<HTMLDivElement>(null);
  const alphaRef = useRef<HTMLDivElement>(null);

  const [open, setOpen] = useState(false);
  const parsedInitial = parseColor(value);
  const [hsv, setHsvState] = useState<HSV>(() => (parsedInitial ? rgbToHsv(parsedInitial.r, parsedInitial.g, parsedInitial.b) : { h: 220, s: 0, v: 100 }));
  const [alpha, setAlphaState] = useState(parsedInitial?.a ?? 1);
  const [text, setText] = useState('');
  const lastEmitted = useRef<string | null>(null);
  const textFocused = useRef(false);

  const hasValue = parseColor(value) != null;

  // Resync working HSV/alpha when the value changes for reasons other than our own onChange.
  useEffect(() => {
    if (value === lastEmitted.current) return;
    const parsed = parseColor(value);
    if (parsed) {
      setHsvState(rgbToHsv(parsed.r, parsed.g, parsed.b));
      setAlphaState(parsed.a);
    }
  }, [value]);

  const rgb = hsvToRgb(hsv.h, hsv.s, hsv.v);
  const effectiveAlpha = showAlpha ? alpha : 1;
  const workingHex = formatColor({ ...rgb, a: effectiveAlpha }, 'hex');
  const displayText = hasValue ? formatColor({ ...rgb, a: effectiveAlpha }, format) : '';

  useEffect(() => {
    if (!textFocused.current) setText(displayText);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayText, open]);

  const commit = (nextHsv: HSV, nextAlpha: number) => {
    const nextRgb = hsvToRgb(nextHsv.h, nextHsv.s, nextHsv.v);
    const out = formatColor({ ...nextRgb, a: showAlpha ? nextAlpha : 1 }, format);
    lastEmitted.current = out;
    onChange(out);
  };

  const applyColor = (colorText: string) => {
    const parsed = parseColor(colorText);
    if (!parsed) {
      setText(displayText);
      return;
    }
    const nextHsv = rgbToHsv(parsed.r, parsed.g, parsed.b);
    const nextAlpha = showAlpha ? parsed.a : 1;
    setHsvState(nextHsv);
    setAlphaState(nextAlpha);
    commit(nextHsv, nextAlpha);
  };

  const toggle = () => {
    if (disabled) return;
    setOpen((o) => !o);
  };

  const onTriggerKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (disabled) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setOpen(true);
    }
  };

  const dragSquare = (clientX: number, clientY: number) => {
    const el = squareRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = clamp(clientX - rect.left, 0, rect.width);
    const y = clamp(clientY - rect.top, 0, rect.height);
    const s = rect.width === 0 ? 0 : (x / rect.width) * 100;
    const v = rect.height === 0 ? 0 : 100 - (y / rect.height) * 100;
    const next = { ...hsv, s, v };
    setHsvState(next);
    commit(next, alpha);
  };

  const onSquarePointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    dragSquare(e.clientX, e.clientY);
  };
  const onSquarePointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.buttons !== 1) return;
    dragSquare(e.clientX, e.clientY);
  };

  const onSquareKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const step = e.shiftKey ? 10 : 1;
    let { s, v } = hsv;
    if (e.key === 'ArrowRight') s = clamp(s + step, 0, 100);
    else if (e.key === 'ArrowLeft') s = clamp(s - step, 0, 100);
    else if (e.key === 'ArrowUp') v = clamp(v + step, 0, 100);
    else if (e.key === 'ArrowDown') v = clamp(v - step, 0, 100);
    else return;
    e.preventDefault();
    const next = { ...hsv, s, v };
    setHsvState(next);
    commit(next, alpha);
  };

  const dragHue = (clientX: number) => {
    const el = hueRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = clamp(clientX - rect.left, 0, rect.width);
    const h = rect.width === 0 ? 0 : (x / rect.width) * 360;
    const next = { ...hsv, h };
    setHsvState(next);
    commit(next, alpha);
  };

  const onHuePointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    dragHue(e.clientX);
  };
  const onHuePointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.buttons !== 1) return;
    dragHue(e.clientX);
  };
  const onHueKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const step = e.shiftKey ? 10 : 1;
    let h = hsv.h;
    if (e.key === 'ArrowRight') h = clamp(h + step, 0, 360);
    else if (e.key === 'ArrowLeft') h = clamp(h - step, 0, 360);
    else return;
    e.preventDefault();
    const next = { ...hsv, h };
    setHsvState(next);
    commit(next, alpha);
  };

  const dragAlpha = (clientX: number) => {
    const el = alphaRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = clamp(clientX - rect.left, 0, rect.width);
    const a = rect.width === 0 ? 0 : x / rect.width;
    setAlphaState(a);
    commit(hsv, a);
  };
  const onAlphaPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    dragAlpha(e.clientX);
  };
  const onAlphaPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.buttons !== 1) return;
    dragAlpha(e.clientX);
  };
  const onAlphaKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const step = e.shiftKey ? 0.1 : 0.01;
    let a = alpha;
    if (e.key === 'ArrowRight') a = clamp(a + step, 0, 1);
    else if (e.key === 'ArrowLeft') a = clamp(a - step, 0, 1);
    else return;
    e.preventDefault();
    setAlphaState(a);
    commit(hsv, a);
  };

  const clear = () => {
    lastEmitted.current = '';
    onChange('');
  };

  const hueCss = `hsl(${hsv.h}, 100%, 50%)`;

  return (
    <Field label={label} hint={hint} error={error} required={required} disabled={disabled} size={size} className={className} htmlFor={triggerId}>
      <div
        ref={triggerRef}
        id={triggerId}
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-disabled={disabled || undefined}
        className={cx('uikit-color-picker', `uikit-color-picker--${size}`, {
          'uikit-color-picker--disabled': !!disabled,
          'uikit-color-picker--error': !!error,
          'uikit-color-picker--full': !!fullWidth,
        })}
        onClick={toggle}
        onKeyDown={onTriggerKeyDown}
      >
        <span className="uikit-color-picker__dot" aria-hidden="true">
          {hasValue && <span className="uikit-color-picker__dot-fill" style={{ background: workingHex }} />}
        </span>
        <span className={cx('uikit-color-picker__value', { 'uikit-color-picker__value--placeholder': !hasValue })}>
          {hasValue ? displayText : placeholder}
        </span>
        {clearable && hasValue && !disabled && (
          <button
            type="button"
            className="uikit-color-picker__clear"
            aria-label="Clear color"
            onClick={(e) => {
              e.stopPropagation();
              clear();
            }}
          >
            <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true" focusable="false">
              <path
                fill="currentColor"
                d="m4.1 3 3.9 3.9L11.9 3 13 4.1 9.1 8l3.9 3.9-1.1 1.1L8 9.1 4.1 13 3 11.9 6.9 8 3 4.1z"
              />
            </svg>
          </button>
        )}
        <DropdownIndicator open={open} />
      </div>

      <Dropdown open={open} onClose={() => setOpen(false)} anchorRef={triggerRef} position="bottom-start" minWidth={260}>
        <div className="uikit-color-picker__panel">
          <div
            ref={squareRef}
            className="uikit-color-picker__square"
            style={{ ['--uikit-cp-hue' as any]: hueCss }}
            role="slider"
            tabIndex={0}
            aria-label="Saturation and brightness"
            aria-valuetext={`saturation ${Math.round(hsv.s)}, brightness ${Math.round(hsv.v)}`}
            onPointerDown={onSquarePointerDown}
            onPointerMove={onSquarePointerMove}
            onKeyDown={onSquareKeyDown}
          >
            <span
              className="uikit-color-picker__square-knob"
              style={{ left: `${hsv.s}%`, top: `${100 - hsv.v}%` }}
            />
          </div>

          <div
            ref={hueRef}
            className="uikit-color-picker__hue"
            role="slider"
            tabIndex={0}
            aria-label="Hue"
            aria-valuemin={0}
            aria-valuemax={360}
            aria-valuenow={Math.round(hsv.h)}
            onPointerDown={onHuePointerDown}
            onPointerMove={onHuePointerMove}
            onKeyDown={onHueKeyDown}
          >
            <span className="uikit-color-picker__hue-knob" style={{ left: `${(hsv.h / 360) * 100}%` }} />
          </div>

          {showAlpha && (
            <div
              ref={alphaRef}
              className="uikit-color-picker__alpha"
              role="slider"
              tabIndex={0}
              aria-label="Alpha"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(alpha * 100)}
              onPointerDown={onAlphaPointerDown}
              onPointerMove={onAlphaPointerMove}
              onKeyDown={onAlphaKeyDown}
            >
              <span
                className="uikit-color-picker__alpha-fill"
                style={{ background: `linear-gradient(to right, transparent, rgb(${rgb.r}, ${rgb.g}, ${rgb.b}))` }}
              />
              <span className="uikit-color-picker__alpha-knob" style={{ left: `${alpha * 100}%` }} />
            </div>
          )}

          {presets.length > 0 && (
            <div className="uikit-color-picker__presets">
              {presets.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  className="uikit-color-picker__preset"
                  style={{ background: preset }}
                  aria-label={`Use color ${preset}`}
                  onClick={() => applyColor(preset)}
                />
              ))}
            </div>
          )}

          <div className="uikit-color-picker__input-row">
            <span className="uikit-color-picker__preview" aria-hidden="true">
              {hasValue && <span className="uikit-color-picker__preview-fill" style={{ background: workingHex }} />}
            </span>
            <input
              type="text"
              className="uikit-color-picker__text"
              value={text}
              spellCheck={false}
              onFocus={() => {
                textFocused.current = true;
              }}
              onChange={(e) => setText(e.target.value)}
              onBlur={() => {
                textFocused.current = false;
                applyColor(text);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  (e.target as HTMLInputElement).blur();
                }
              }}
            />
          </div>
        </div>
      </Dropdown>
    </Field>
  );
}
