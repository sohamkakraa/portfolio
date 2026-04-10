"use client";

import { useCallback, useState } from "react";
import "react-easy-crop/react-easy-crop.css";
import Cropper, { type Area, type Point } from "react-easy-crop";
import { X } from "lucide-react";
import { getCroppedImageBlob } from "@/lib/canvas-crop";

type ImageCropDialogProps = {
  open: boolean;
  imageSrc: string | null;
  aspect: number;
  title: string;
  onClose: () => void;
  onComplete: (file: File) => void | Promise<void>;
  outputFileName?: string;
};

export default function ImageCropDialog({
  open,
  imageSrc,
  aspect,
  title,
  onClose,
  onComplete,
  outputFileName = "image.jpg",
}: ImageCropDialogProps) {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [busy, setBusy] = useState(false);

  const onCropComplete = useCallback((_croppedArea: Area, croppedAreaPixelsInner: Area) => {
    setCroppedAreaPixels(croppedAreaPixelsInner);
  }, []);

  const handleApply = async () => {
    if (!imageSrc || !croppedAreaPixels) return;
    setBusy(true);
    try {
      const blob = await getCroppedImageBlob(imageSrc, croppedAreaPixels, "image/jpeg", 0.92);
      const file = new File([blob], outputFileName.replace(/\.[^.]+$/, ".jpg"), {
        type: "image/jpeg",
      });
      await onComplete(file);
      onClose();
    } finally {
      setBusy(false);
    }
  };

  if (!open || !imageSrc) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="flex max-h-[90dvh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-[color:var(--border)] bg-[color:var(--bg-surface)] shadow-2xl">
        <div className="flex items-center justify-between border-b border-[color:var(--border)] px-4 py-3">
          <h2 className="text-sm font-bold text-[color:var(--fg)]">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-[color:var(--fg-muted)] hover:bg-[color:var(--bg-elevated)] hover:text-[color:var(--fg)]"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>
        <div className="relative h-72 w-full bg-black sm:h-80">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>
        <div className="space-y-3 border-t border-[color:var(--border)] p-4">
          <label className="flex items-center gap-3 text-xs text-[color:var(--fg-muted)]">
            <span className="w-14 shrink-0">Zoom</span>
            <input
              type="range"
              min={1}
              max={3}
              step={0.02}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="flex-1 accent-[color:var(--accent)]"
            />
          </label>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="btn-secondary !py-2 !px-4 !text-[10px]">
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void handleApply()}
              disabled={busy || !croppedAreaPixels}
              className="btn-primary !py-2 !px-4 !text-[10px] disabled:opacity-50"
            >
              {busy ? "Saving…" : "Apply & upload"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
