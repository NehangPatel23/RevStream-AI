"use client";

import { useEffect, useId, useState } from "react";
import { cn } from "@/lib/utils";

export type ExplanationSection = {
  title: string;
  summary: string;
  bullets: string[];
  icon: string;
  tone?: "blue" | "green" | "amber" | "red";
};

type ExplanationPanelProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  subtitle: string;
  summary: string;
  confidenceLabel: string;
  currentRate: string;
  recommendedRate: string;
  deltaLabel: string;
  sections: readonly ExplanationSection[];
  primaryActionLabel?: string;
  onPrimaryAction?: () => void;
};

function Icon({ name, className = "" }: { name: string; className?: string }) {
  return <span className={`material-symbols-outlined ${className}`}>{name}</span>;
}

const toneStyles = {
  blue: {
    accent: "text-[#003c90]",
    badge: "bg-[#d0e1fb] text-[#003c90]",
    border: "border-[#c3d5f7]",
  },
  green: {
    accent: "text-[#27835d]",
    badge: "bg-[#dff3ea] text-[#27835d]",
    border: "border-[#8fd0b2]",
  },
  amber: {
    accent: "text-[#9c6a0a]",
    badge: "bg-[#fff2d6] text-[#9c6a0a]",
    border: "border-[#f1b889]",
  },
  red: {
    accent: "text-[#ba1a1a]",
    badge: "bg-[#ffe3e3] text-[#ba1a1a]",
    border: "border-[#f4b8b8]",
  },
} as const;

export function ExplanationPanel({
  open,
  onOpenChange,
  title,
  subtitle,
  summary,
  confidenceLabel,
  currentRate,
  recommendedRate,
  deltaLabel,
  sections,
  primaryActionLabel,
  onPrimaryAction,
}: ExplanationPanelProps) {
  const titleId = useId();
  const descriptionId = useId();
  const [shouldRender, setShouldRender] = useState(open);

  useEffect(() => {
    let timer: number | undefined;

    if (open) {
      setShouldRender(true);
      timer = window.setTimeout(() => {
        const closeButton = document.getElementById(`${titleId}-close`);
        closeButton?.focus();
      }, 0);
    } else {
      timer = window.setTimeout(() => {
        setShouldRender(false);
      }, 220);
    }

    return () => {
      if (timer) window.clearTimeout(timer);
    };
  }, [open, titleId]);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onOpenChange(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onOpenChange, open]);

  if (!shouldRender) return null;

  const variance = `${currentRate} → ${recommendedRate}`;

  return (
    <div className="fixed inset-0 z-[90]">
      <div
        className={cn(
          "absolute inset-0 bg-black/30 backdrop-blur-[2px] transition-opacity duration-200",
          open ? "opacity-100" : "opacity-0"
        )}
        onClick={() => onOpenChange(false)}
        aria-hidden="true"
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className={cn(
          "absolute right-0 top-0 flex h-full w-full max-w-[780px] flex-col border-l border-[#e0e3e5] bg-[#f8fafc] shadow-[0_24px_80px_rgba(0,0,0,0.24)] transition-transform duration-200 ease-out",
          open ? "translate-x-0" : "translate-x-4"
        )}
      >
        <div className="flex items-center justify-between gap-4 border-b border-[#e0e3e5] bg-white px-6 py-5">
          <div className="min-w-0">
            <div className="text-[12px] font-semibold uppercase tracking-[0.1em] text-[#737784]">
              AI explanation
            </div>
            <h2
              id={titleId}
              className="mt-1 text-[24px] font-semibold leading-8 tracking-[-0.02em] text-[#191c1e]"
            >
              {title}
            </h2>
            <p id={descriptionId} className="mt-1 text-[14px] leading-6 text-[#434653]">
              {subtitle}
            </p>
          </div>

          <button
            id={`${titleId}-close`}
            type="button"
            onClick={() => onOpenChange(false)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-[#434653] transition hover:bg-[#f2f4f6]"
            aria-label="Close explanation drawer"
          >
            <Icon name="close" className="text-[22px]" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="space-y-5">
            <section className="rounded-[20px] border border-[#e0e3e5] bg-white p-5 shadow-[0_4px_10px_rgba(0,0,0,0.04)]">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="text-[12px] font-semibold uppercase tracking-[0.1em] text-[#737784]">
                    Model summary
                  </div>
                  <p className="mt-2 text-[15px] leading-6 text-[#191c1e]">{summary}</p>
                </div>

                <div className="shrink-0 rounded-full border border-[#c3d5f7] bg-[#d0e1fb] px-3 py-1 text-[12px] font-semibold text-[#003c90]">
                  {confidenceLabel}
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-[16px] border border-[#e0e3e5] bg-[#f8fafc] p-4">
                  <div className="text-[12px] font-semibold uppercase tracking-[0.1em] text-[#737784]">
                    Current rate
                  </div>
                  <div className="mt-1 text-[24px] font-semibold tracking-[-0.03em] text-[#191c1e]">
                    {currentRate}
                  </div>
                </div>

                <div className="rounded-[16px] border border-[#e0e3e5] bg-[#f8fafc] p-4">
                  <div className="text-[12px] font-semibold uppercase tracking-[0.1em] text-[#737784]">
                    Recommended
                  </div>
                  <div className="mt-1 text-[24px] font-semibold tracking-[-0.03em] text-[#003c90]">
                    {recommendedRate}
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between gap-3 rounded-[16px] bg-[#f2f4f6] px-4 py-3">
                <span className="text-[14px] font-medium text-[#434653]">Rate movement</span>
                <span className="text-[14px] font-semibold text-[#1d59c1]">{variance}</span>
              </div>

              <div className="mt-3 text-[13px] font-semibold text-[#27835d]">{deltaLabel}</div>
            </section>

            <div className="space-y-4">
              {sections.map((section) => {
                const tone = toneStyles[section.tone ?? "blue"];

                return (
                  <section
                    key={section.title}
                    className="rounded-[20px] border border-[#e0e3e5] bg-white p-5 shadow-[0_4px_10px_rgba(0,0,0,0.04)]"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={cn(
                          "flex h-11 w-11 shrink-0 items-center justify-center rounded-full",
                          tone.badge
                        )}
                      >
                        <Icon name={section.icon} className="text-[22px]" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-[16px] font-semibold text-[#191c1e]">{section.title}</h3>
                          <span className={cn("rounded-full px-2.5 py-1 text-[12px] font-semibold", tone.badge)}>
                            Insight
                          </span>
                        </div>
                        <p className="mt-2 text-[14px] leading-6 text-[#434653]">{section.summary}</p>

                        <ul className="mt-4 space-y-2">
                          {section.bullets.map((bullet) => (
                            <li key={bullet} className="flex gap-3 text-[14px] leading-6 text-[#434653]">
                              <span className={cn("mt-2 h-1.5 w-1.5 shrink-0 rounded-full", tone.badge)} />
                              <span>{bullet}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </section>
                );
              })}
            </div>
          </div>
        </div>

        <div className="border-t border-[#e0e3e5] bg-[#f8fafc]/95 px-6 py-4 backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-[13px] leading-5 text-[#434653]">
              The model is designed to stay slightly ahead of the market without chasing every comp move.
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="inline-flex h-10 items-center rounded-full border border-[#c3c6d5] px-4 text-[14px] font-semibold text-[#191c1e] transition hover:bg-white"
              >
                Close
              </button>

              {primaryActionLabel ? (
                <button
                  type="button"
                  onClick={onPrimaryAction}
                  className="inline-flex h-10 items-center rounded-full bg-[#003c90] px-4 text-[14px] font-semibold text-white transition hover:bg-[#0f52ba]"
                >
                  {primaryActionLabel}
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}