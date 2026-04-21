import { useEffect, useState } from 'react';

import type { EnhancementType } from '@/types';
import { enhancementLabels } from '@/lib/utils';

const options: EnhancementType[] = ['restore', 'colorize', 'upscale', 'face_enhance', 'all_in_one'];

export function UploadForm(props: {
  isSubmitting?: boolean;
  error?: string | null;
  onSubmit: (values: { file: File; enhancements: EnhancementType[] }) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [selected, setSelected] = useState<EnhancementType[]>(['restore']);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }

    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [file]);

  return (
    <form
      className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]"
      onSubmit={(event) => {
        event.preventDefault();
        if (!file) return;
        props.onSubmit({ file, enhancements: selected });
      }}
    >
      <div className="space-y-4">
        <label className="flex min-h-[300px] cursor-pointer flex-col items-center justify-center rounded-[28px] border border-dashed border-[var(--line)] bg-white/70 p-8 text-center">
          <span className="text-lg font-semibold">Drop an old photo or browse</span>
          <span className="mt-2 text-sm text-[var(--muted)]">JPG, PNG, WEBP up to 15MB</span>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          />
        </label>
        {previewUrl ? (
          <img src={previewUrl} alt="Selected preview" className="h-72 w-full rounded-[28px] object-cover" />
        ) : null}
      </div>
      <div className="space-y-5 rounded-[28px] border border-[var(--line)] bg-[var(--surface)] p-6">
        <div>
          <h2 className="text-2xl font-semibold">Restoration Options</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Choose a single preset or stack focused enhancements.
          </p>
        </div>
        <div className="space-y-3">
          {options.map((option) => (
            <label
              key={option}
              className="flex items-center gap-3 rounded-2xl border border-[var(--line)] bg-white px-4 py-3"
            >
              <input
                type="checkbox"
                checked={selected.includes(option)}
                onChange={(event) => {
                  if (option === 'all_in_one') {
                    setSelected(event.target.checked ? ['all_in_one'] : []);
                    return;
                  }

                  setSelected((current) => {
                    const next = current.filter((item) => item !== 'all_in_one');
                    return event.target.checked ? [...next, option] : next.filter((item) => item !== option);
                  });
                }}
              />
              <span>{enhancementLabels[option]}</span>
            </label>
          ))}
        </div>
        {props.error ? <p className="text-sm text-[var(--danger)]">{props.error}</p> : null}
        <button
          disabled={!file || selected.length === 0 || props.isSubmitting}
          className="w-full rounded-full bg-[var(--brand)] px-5 py-3 font-semibold text-white disabled:opacity-60"
          type="submit"
        >
          {props.isSubmitting ? 'Uploading...' : 'Create restoration job'}
        </button>
      </div>
    </form>
  );
}
