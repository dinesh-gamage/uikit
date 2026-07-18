import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type DragEvent,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import { cx } from '../utils/cx';
import { Field } from '../field/Field';
import type { FieldBaseProps } from '../types';
import { formatBytes, validateFile } from './file-utils';
import './file-input.scss';

export type FileInputValue = File | File[] | string | null;

export interface FileInputProps extends FieldBaseProps {
  /** File(s), or a string URL for an already-uploaded file. */
  value?: FileInputValue;
  onChange: (value: File | File[] | null, isValid: boolean) => void;
  /** Mime types ('image/*', 'application/pdf') and/or extensions ('.csv'). */
  accept?: string[];
  multiple?: boolean;
  /** Max size per file, in bytes. */
  maxSize?: number;
  mode?: 'compact' | 'expanded';
  showPreview?: boolean;
  dropzoneLabel?: ReactNode;
}

const IMAGE_URL_RE = /\.(png|jpe?g|gif|webp|svg|avif|bmp)(\?.*)?$/i;

function urlFileName(url: string): string {
  const last = url.split('/').pop()?.split('?')[0];
  try {
    return decodeURIComponent(last || url);
  } catch {
    return last || url;
  }
}

function RemoveGlyph() {
  return (
    <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        d="m4.1 3 3.9 3.9L11.9 3 13 4.1 9.1 8l3.9 3.9-1.1 1.1L8 9.1 4.1 13 3 11.9 6.9 8 3 4.1z"
      />
    </svg>
  );
}

function DocGlyph() {
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        d="M4 1h5l4 4v10H4a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1Zm5 1.5V5h2.5L9 2.5ZM5.5 8h5v1h-5V8Zm0 2.5h5v1h-5v-1Z"
      />
    </svg>
  );
}

export function FileInput({
  value = null,
  onChange,
  accept,
  multiple = false,
  maxSize,
  mode = 'expanded',
  showPreview = true,
  dropzoneLabel,
  label,
  hint,
  error,
  required,
  disabled,
  size = 'md',
  className,
  id,
}: FileInputProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const nativeRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [internalError, setInternalError] = useState<string | null>(null);

  const files: File[] = useMemo(() => {
    if (value instanceof File) return [value];
    if (Array.isArray(value)) return value;
    return [];
  }, [value]);
  const urlValue = typeof value === 'string' ? value : null;
  const hasValue = files.length > 0 || !!urlValue;

  const previews = useMemo(() => {
    const map = new Map<File, string>();
    if (mode === 'expanded' && showPreview) {
      for (const file of files) {
        if (file.type.startsWith('image/')) map.set(file, URL.createObjectURL(file));
      }
    }
    return map;
  }, [files, mode, showPreview]);

  useEffect(() => {
    return () => {
      previews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [previews]);

  const openPicker = () => {
    if (!disabled) nativeRef.current?.click();
  };

  const handleFiles = (list: FileList | null) => {
    const picked = Array.from(list ?? []);
    if (picked.length === 0) return;
    const selection = multiple ? picked : picked.slice(0, 1);
    const problems = selection
      .map((file) => validateFile(file, accept, maxSize))
      .filter((message): message is string => message != null);
    setInternalError(problems.length > 0 ? problems[0] : null);
    onChange(multiple ? selection : selection[0], problems.length === 0);
  };

  const removeAt = (index: number) => {
    const next = files.filter((_, i) => i !== index);
    setInternalError(null);
    onChange(multiple ? (next.length > 0 ? next : null) : null, true);
  };

  const clearAll = () => {
    setInternalError(null);
    onChange(null, true);
  };

  const onDragOver = (e: DragEvent) => {
    e.preventDefault();
    if (!disabled) setDragging(true);
  };

  const onDragLeave = () => setDragging(false);

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (disabled) return;
    handleFiles(e.dataTransfer.files);
  };

  const onDropzoneKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openPicker();
    }
  };

  const displayError = error ?? internalError;
  const compactNames = files.length > 0 ? files.map((f) => f.name).join(', ') : urlValue ? urlFileName(urlValue) : '';

  return (
    <Field
      label={label}
      hint={hint}
      error={displayError}
      required={required}
      disabled={disabled}
      size={size}
      className={className}
      htmlFor={inputId}
    >
      <div
        className={cx('uikit-file', `uikit-file--${size}`, {
          'uikit-file--disabled': !!disabled,
          'uikit-file--error': !!displayError,
          'uikit-file--dragging': dragging,
        })}
      >
        <input
          ref={nativeRef}
          id={inputId}
          type="file"
          className="uikit-file__native"
          accept={accept?.join(',')}
          multiple={multiple}
          disabled={disabled}
          onChange={(e) => {
            handleFiles(e.target.files);
            e.target.value = '';
          }}
        />
        {mode === 'expanded' ? (
          <>
            <div
              className="uikit-file__dropzone"
              role="button"
              tabIndex={disabled ? -1 : 0}
              aria-disabled={disabled || undefined}
              onClick={openPicker}
              onKeyDown={onDropzoneKeyDown}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
            >
              <span className="uikit-file__dropzone-label">
                {dropzoneLabel ??
                  (multiple ? 'Drag & drop files here, or click to browse' : 'Drag & drop a file here, or click to browse')}
              </span>
            </div>
            {hasValue && (
              <ul className="uikit-file__list">
                {urlValue && (
                  <li className="uikit-file__item">
                    {showPreview && IMAGE_URL_RE.test(urlValue) ? (
                      <img className="uikit-file__thumb" src={urlValue} alt="" />
                    ) : (
                      <span className="uikit-file__doc">
                        <DocGlyph />
                      </span>
                    )}
                    <span className="uikit-file__name">{urlFileName(urlValue)}</span>
                    <button
                      type="button"
                      className="uikit-file__remove"
                      aria-label={`Remove ${urlFileName(urlValue)}`}
                      disabled={disabled}
                      onClick={clearAll}
                    >
                      <RemoveGlyph />
                    </button>
                  </li>
                )}
                {files.map((file, i) => (
                  <li key={`${file.name}-${i}`} className="uikit-file__item">
                    {previews.has(file) ? (
                      <img className="uikit-file__thumb" src={previews.get(file)} alt="" />
                    ) : (
                      <span className="uikit-file__doc">
                        <DocGlyph />
                      </span>
                    )}
                    <span className="uikit-file__name">{file.name}</span>
                    <span className="uikit-file__size">{formatBytes(file.size)}</span>
                    <button
                      type="button"
                      className="uikit-file__remove"
                      aria-label={`Remove ${file.name}`}
                      disabled={disabled}
                      onClick={() => removeAt(i)}
                    >
                      <RemoveGlyph />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </>
        ) : (
          <div className="uikit-file__row">
            <button type="button" className="uikit-file__browse" disabled={disabled} onClick={openPicker}>
              {multiple ? 'Choose files' : 'Choose file'}
            </button>
            <span className={cx('uikit-file__names', { 'uikit-file__names--empty': !hasValue })}>
              {hasValue ? compactNames : 'No file selected'}
            </span>
            {hasValue && !disabled && (
              <button type="button" className="uikit-file__clear" aria-label="Clear selection" onClick={clearAll}>
                <RemoveGlyph />
              </button>
            )}
          </div>
        )}
      </div>
    </Field>
  );
}
