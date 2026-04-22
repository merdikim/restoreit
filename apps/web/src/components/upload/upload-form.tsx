import { useEffect, useState } from 'react';

export function UploadForm(props: {
  isSubmitting?: boolean;
  error?: string | null;
  onSubmit: (values: { file: File }) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
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
      className="gap-8"
      onSubmit={(event) => {
        event.preventDefault();
        if (!file) return;
        props.onSubmit({ file });
      }}
    >
      <div className="space-y-4 flex items-center gap-10">
        <label className="flex min-h-75 cursor-pointer flex-col items-center justify-center rounded-[28px] border border-dashed border-(--line) bg-white/70 p-8 text-center">
          <span className="text-lg font-semibold">Drop an old photo or browse</span>
          <span className="mt-2 text-sm text-(--muted)">JPG, PNG, WEBP up to 15MB</span>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          />
        </label>
        {previewUrl ? (
          <img src={previewUrl} alt="Selected preview" className="min-h-72 max-w-75 w-full rounded-[28px] object-cover" />
        ) : null}
      </div>
      <div>
        {props.error ? <p className="text-sm text-(--danger) text-center py-4">{props.error}</p> : null}
        <button
          disabled={!file || props.isSubmitting}
          className="w-full rounded-full bg-(--brand) px-5 py-3 font-semibold text-white disabled:opacity-60"
          type="submit"
        >
          {props.isSubmitting ? 'Uploading...' : 'Create restoration job'}
        </button>
      </div>
    </form>
  );
}
