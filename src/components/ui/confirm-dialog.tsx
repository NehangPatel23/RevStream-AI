"use client";

import { useEffect } from "react";
import { cn } from "@/lib/utils";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  danger?: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel = "Cancel",
  danger = false,
  onClose,
  onConfirm,
}: ConfirmDialogProps) {
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/25 px-4 py-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-description"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-130 rounded-[20px] border border-[#e0e3e5] bg-white p-6 shadow-[0_18px_50px_rgba(0,0,0,0.18)]">
        <h3
          id="confirm-dialog-title"
          className="text-[24px] font-semibold leading-8 tracking-[-0.02em] text-[#191c1e]"
        >
          {title}
        </h3>

        <p
          id="confirm-dialog-description"
          className="mt-2 text-[14px] leading-5.5 text-[#434653]"
        >
          {description}
        </p>

        <div className="mt-6 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-[10px] border border-[#737784] bg-white px-4 py-2 text-[14px] font-medium text-[#191c1e] hover:bg-[#f7f9fb]"
          >
            {cancelLabel}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            className={cn(
              "rounded-[10px] px-4 py-2 text-[14px] font-medium text-white",
              danger ? "bg-[#ba1a1a] hover:bg-[#9f1414]" : "bg-[#003c90] hover:bg-[#0f52ba]"
            )}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}