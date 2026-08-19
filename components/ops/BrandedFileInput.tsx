'use client';

import { useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { formatBytes } from '@/lib/format-bytes';

type Props = {
  name?: string;
  required?: boolean;
  accept?: string;
  hint?: string;
  className?: string;
};

export default function BrandedFileInput({
  name = 'file',
  required,
  accept,
  hint,
  className = '',
}: Props) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);

  function applyFile(next: File | null) {
    setFile(next);
    if (!inputRef.current) return;
    if (!next) {
      inputRef.current.value = '';
      return;
    }
    const transfer = new DataTransfer();
    transfer.items.add(next);
    inputRef.current.files = transfer.files;
  }

  return (
    <div className={className}>
      <input
        ref={inputRef}
        id={inputId}
        name={name}
        type="file"
        required={required}
        accept={accept}
        className="sr-only"
        onChange={(e) => applyFile(e.target.files?.[0] ?? null)}
      />

      <label
        htmlFor={inputId}
        onDragEnter={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setDragging(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const dropped = e.dataTransfer.files?.[0] ?? null;
          if (dropped) applyFile(dropped);
        }}
        className={`group flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed px-4 py-6 text-center transition ${
          dragging
            ? 'border-codiva-primary bg-codiva-primary/5'
            : file
              ? 'border-codiva-primary/40 bg-white'
              : 'border-zinc-300 bg-white hover:border-codiva-primary/50 hover:bg-zinc-50'
        }`}
      >
        <span
          className={`flex h-10 w-10 items-center justify-center rounded-full ${
            file ? 'bg-codiva-primary text-white' : 'bg-zinc-100 text-codiva-primary'
          }`}
          aria-hidden
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 16V7m0 0 3.5 3.5M12 7 8.5 10.5M6 16.5V18a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-1.5"
            />
          </svg>
        </span>

        {file ? (
          <>
            <p className="max-w-full truncate text-sm font-medium text-zinc-900">{file.name}</p>
            <p className="text-xs text-zinc-500">{t('ops.fileInput.change', { size: formatBytes(file.size) })}</p>
          </>
        ) : (
          <>
            <p className="text-sm font-medium text-zinc-900">
              <span className="text-codiva-primary">{t('ops.fileInput.select')}</span>
              <span className="text-zinc-500">{t('ops.fileInput.orDrop')}</span>
            </p>
            <p className="text-xs text-zinc-500">{hint ?? t('ops.fileInput.defaultHint')}</p>
          </>
        )}
      </label>

      {file && (
        <button
          type="button"
          onClick={() => applyFile(null)}
          className="mt-2 text-xs font-medium text-zinc-500 hover:text-zinc-800"
        >
          {t('ops.fileInput.remove')}
        </button>
      )}
    </div>
  );
}
