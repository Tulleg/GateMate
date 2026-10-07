"use client";

import { useState, useRef, DragEvent, ChangeEvent } from "react";
import { Upload, Image as ImageIcon, X, Loader2, Link as LinkIcon, CheckCircle2, AlertCircle } from "lucide-react";

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  disabled?: boolean;
  label?: string;
}

export function ImageUpload({ value, onChange, disabled, label = "Titelbild / Banner (Event-Bild)" }: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (file: File) => {
    setError(null);

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"];
    if (!allowedTypes.includes(file.type)) {
      setError("Ungültiges Dateiformat. Erlaubt sind JPG, PNG, WEBP, GIF und SVG.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Dateigröße darf maximal 5 MB betragen.");
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/events/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Fehler beim Hochladen");
      }

      onChange(data.url);
    } catch (err: any) {
      setError(err.message || "Upload fehlgeschlagen. Bitte erneut versuchen.");
    } finally {
      setIsUploading(false);
    }
  };

  const onDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (disabled || isUploading) return;
    setIsDragging(true);
  };

  const onDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled || isUploading) return;

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleUpload(files[0]);
    }
  };

  const onFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleUpload(files[0]);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="font-semibold text-slate-300 block text-xs">{label}</label>
        <button
          type="button"
          disabled={disabled || isUploading}
          onClick={() => setShowUrlInput(!showUrlInput)}
          className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors disabled:opacity-50"
        >
          <LinkIcon className="w-3 h-3" />
          {showUrlInput ? "Zurück zum Upload" : "Oder Bild-URL eingeben"}
        </button>
      </div>

      {showUrlInput ? (
        <div className="relative">
          <ImageIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="url"
            disabled={disabled || isUploading}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="https://... oder /uploads/..."
            className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
          />
        </div>
      ) : value ? (
        <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 group">
          <div className="aspect-[21/9] sm:aspect-[2.4/1] w-full overflow-hidden relative">
            <img src={value} alt="Event Banner Vorschau" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
              <button
                type="button"
                disabled={disabled}
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg transition-colors flex items-center gap-1.5"
              >
                <Upload className="w-3.5 h-3.5" /> Bild ändern
              </button>
              <button
                type="button"
                disabled={disabled}
                onClick={() => onChange("")}
                className="px-3 py-1.5 rounded-xl bg-red-600/80 hover:bg-red-600 text-white text-xs font-semibold shadow-lg transition-colors flex items-center gap-1.5"
              >
                <X className="w-3.5 h-3.5" /> Entfernen
              </button>
            </div>
          </div>
          <div className="p-2.5 bg-slate-900/90 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" /> Bild geladen
            </span>
            <span className="truncate max-w-[250px] text-[11px] text-slate-500 font-mono">{value}</span>
          </div>
        </div>
      ) : (
        <div
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={() => !disabled && !isUploading && fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-2 ${
            isDragging
              ? "border-indigo-500 bg-indigo-500/10 text-indigo-300 scale-[1.01]"
              : "border-slate-800 bg-slate-950/60 hover:bg-slate-900/60 hover:border-slate-700 text-slate-400"
          } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          {isUploading ? (
            <div className="flex flex-col items-center gap-2 py-4">
              <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
              <p className="text-xs font-semibold text-indigo-300">Bild wird hochgeladen...</p>
            </div>
          ) : (
            <>
              <div className="p-3 rounded-full bg-slate-900 border border-slate-800 text-indigo-400 mb-1">
                <Upload className="w-6 h-6" />
              </div>
              <p className="text-xs font-semibold text-slate-200">
                Klicken zum Auswählen <span className="text-slate-500 font-normal">oder Bild hierhin ziehen</span>
              </p>
              <p className="text-[11px] text-slate-500">
                Empfohlen: PNG, JPG, WEBP (16:9 Format, max. 5 MB)
              </p>
            </>
          )}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
        onChange={onFileSelect}
        className="hidden"
        disabled={disabled || isUploading}
      />

      {error && (
        <div className="flex items-center gap-1.5 text-xs text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-xl">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
