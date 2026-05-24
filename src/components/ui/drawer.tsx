"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

type DrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  side?: "right" | "left";
  className?: string;
};

export function Drawer({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  side = "right",
  className,
}: DrawerProps) {
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onOpenChange(false);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        aria-label="Close drawer"
        className="absolute inset-0 bg-black/30 backdrop-blur-[1px]"
        onClick={() => onOpenChange(false)}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "absolute top-0 h-full w-full max-w-140 overflow-hidden border-[#e0e3e5] bg-white shadow-[0_20px_60px_rgba(0,0,0,0.18)]",
          side === "right" ? "right-0 border-l" : "left-0 border-r",
          className
        )}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-start justify-between gap-4 border-b border-[#e0e3e5] px-6 py-5">
            <div>
              <h2 className="text-[22px] font-semibold leading-7 tracking-[-0.02em] text-[#191c1e]">
                {title}
              </h2>
              {description ? (
                <p className="mt-1 text-[14px] leading-5.5 text-[#434653]">{description}</p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full text-[#434653] transition hover:bg-[#eceef0] focus:outline-none focus:ring-2 focus:ring-[#003c90] focus:ring-offset-2"
              aria-label="Close drawer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">{children}</div>

          {footer ? <div className="border-t border-[#e0e3e5] px-6 py-4">{footer}</div> : null}
        </div>
      </aside>
    </div>
  );
}