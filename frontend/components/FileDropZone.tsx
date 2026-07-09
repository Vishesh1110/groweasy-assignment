"use client";

import { useCallback, useRef, useState } from "react";

interface Props {
  onFile: (file: File) => void;
  fileName: string | null;
}

export default function FileDropzone({ onFile, fileName }: Props) {
  const [isOver, setIsOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    (files: FileList | null) => {
      const file = files?.[0];
      if (!file) return;
      if (!file.name.toLowerCase().endsWith(".csv")) {
        alert("Please upload a .csv file.");
        return;
      }
      onFile(file);
    },
    [onFile]
  );

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setIsOver(true);
      }}
      onDragLeave={() => setIsOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsOver(false);
        handleFiles(e.dataTransfer.files);
      }}
      onClick={() => inputRef.current?.click()}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
      className={`group relative cursor-pointer rounded-lg border-2 border-dashed p-10 text-center transition-colors
        ${isOver ? "border-accent bg-accent/5" : "border-line bg-panel hover:border-mute"}`}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-line/60 text-accent">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="M4 15v3a2 2 0 002 2h12a2 2 0 002-2v-3M7 9l5-5 5 5M12 4v12" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      {fileName ? (
        <>
          <p className="font-mono text-sm text-accent">{fileName}</p>
          <p className="mt-1 text-xs text-mute">Drop another file, or click to replace it.</p>
        </>
      ) : (
        <>
          <p className="font-display text-base font-medium text-slate-100">
            Drag your lead export here
          </p>
          <p className="mt-1 text-sm text-mute">
            or click to browse — .csv from Facebook, Google Ads, Excel, or any CRM
          </p>
        </>
      )}
    </div>
  );
}
