"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export type CommandPaletteAction = {
  id: string;
  label: string;
  description: string;
  icon: string;
  group: string;
  keywords?: string[];
  shortcut?: string;
  onSelect: () => void;
};

type CommandPaletteProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  actions: CommandPaletteAction[];
};

function Icon({ name, className = "" }: { name: string; className?: string }) {
  return <span className={`material-symbols-outlined ${className}`}>{name}</span>;
}

const GROUP_ORDER = ["Navigate", "Properties", "Actions", "Reports"];

function normalize(value: string) {
  return value.trim().toLowerCase();
}

export function CommandPalette({ open, onOpenChange, actions }: CommandPaletteProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [shouldRender, setShouldRender] = useState(open);

  useEffect(() => {
    let timeoutId: number | undefined;

    if (open) {
      setShouldRender(true);
      timeoutId = window.setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 0);
    } else {
      timeoutId = window.setTimeout(() => {
        setShouldRender(false);
      }, 180);
    }

    return () => {
      if (timeoutId) window.clearTimeout(timeoutId);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  const visibleActions = useMemo(() => {
    const normalizedQuery = normalize(query);

    const indexed = actions
      .map((action, index) => ({ action, index }))
      .filter(({ action }) => {
        if (!normalizedQuery) return true;

        const haystack = [
          action.label,
          action.description,
          action.group,
          ...(action.keywords ?? []),
        ]
          .join(" ")
          .toLowerCase();

        return haystack.includes(normalizedQuery);
      })
      .sort((left, right) => {
        const leftGroup = GROUP_ORDER.indexOf(left.action.group);
        const rightGroup = GROUP_ORDER.indexOf(right.action.group);

        if (leftGroup !== rightGroup) {
          return (leftGroup === -1 ? GROUP_ORDER.length : leftGroup) - (rightGroup === -1 ? GROUP_ORDER.length : rightGroup);
        }

        return left.index - right.index;
      });

    return indexed;
  }, [actions, query]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  useEffect(() => {
    if (!visibleActions.length) {
      setActiveIndex(0);
      return;
    }

    setActiveIndex((current) => Math.min(current, visibleActions.length - 1));
  }, [visibleActions.length]);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onOpenChange(false);
        return;
      }

      if (!visibleActions.length) return;

      if (event.key === "ArrowDown") {
        event.preventDefault();
        setActiveIndex((current) => Math.min(current + 1, visibleActions.length - 1));
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        setActiveIndex((current) => Math.max(current - 1, 0));
      }

      if (event.key === "Enter") {
        event.preventDefault();
        const entry = visibleActions[activeIndex];
        if (entry) {
          entry.action.onSelect();
          onOpenChange(false);
          setQuery("");
          setActiveIndex(0);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeIndex, onOpenChange, open, visibleActions]);

  if (!shouldRender) return null;

  const grouped = GROUP_ORDER.map((group) => ({
    group,
    items: visibleActions.filter(({ action }) => action.group === group),
  })).filter((entry) => entry.items.length > 0);

  const extraGroups = Array.from(
    new Set(visibleActions.map(({ action }) => action.group).filter((group) => !GROUP_ORDER.includes(group)))
  ).map((group) => ({
    group,
    items: visibleActions.filter(({ action }) => action.group === group),
  }));

  const sections = [...grouped, ...extraGroups];

  return (
    <div className="fixed inset-0 z-[100]">
      <div
        className="absolute inset-0 bg-black/35 backdrop-blur-[2px]"
        aria-hidden="true"
        onClick={() => onOpenChange(false)}
      />

      <div className="relative mx-auto mt-[8vh] w-full max-w-[820px] px-4">
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Command palette"
          className={cn(
            "overflow-hidden rounded-[24px] border border-[#e0e3e5] bg-white shadow-[0_24px_80px_rgba(0,0,0,0.22)] transition-all duration-200",
            open ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
          )}
        >
          <div className="flex items-center gap-3 border-b border-[#e0e3e5] px-5 py-4">
            <div className="relative flex-1">
              <Icon
                name="search"
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[20px] text-[#737784]"
              />
              <input
                ref={inputRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search pages, properties, or actions..."
                className="h-12 w-full rounded-[14px] border border-[#c3c6d5] bg-[#f8fafc] pl-11 pr-4 text-[15px] text-[#191c1e] outline-none placeholder:text-[#737784] focus:border-[#003c90]"
              />
            </div>

            <div className="hidden items-center gap-2 rounded-full border border-[#d9dee4] bg-[#f8fafc] px-3 py-2 text-[12px] font-semibold uppercase tracking-[0.08em] text-[#434653] sm:inline-flex">
              <span>⌘</span>
              <span>K</span>
            </div>
          </div>

          <div className="max-h-[72vh] overflow-y-auto p-3">
            {sections.length ? (
              <div className="space-y-4">
                {sections.map((section) => (
                  <div key={section.group}>
                    <div className="px-3 pb-2 text-[12px] font-semibold uppercase tracking-[0.12em] text-[#737784]">
                      {section.group}
                    </div>

                    <div className="space-y-1">
                      {section.items.map(({ action, index }) => {
                        const active = index === activeIndex;

                        return (
                          <button
                            key={action.id}
                            type="button"
                            onMouseEnter={() => setActiveIndex(index)}
                            onClick={() => {
                              action.onSelect();
                              onOpenChange(false);
                              setQuery("");
                              setActiveIndex(0);
                            }}
                            className={cn(
                              "flex w-full items-start gap-3 rounded-[18px] px-4 py-3 text-left transition",
                              active ? "bg-[#d0e1fb]" : "hover:bg-[#f8fafc]"
                            )}
                          >
                            <div
                              className={cn(
                                "mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                                active ? "bg-white text-[#003c90]" : "bg-[#eceef0] text-[#737784]"
                              )}
                            >
                              <Icon name={action.icon} className="text-[22px]" />
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-3">
                                <div className="text-[15px] font-semibold text-[#191c1e]">
                                  {action.label}
                                </div>
                                {action.shortcut ? (
                                  <span className="rounded-full border border-[#d9dee4] bg-white px-2.5 py-1 text-[12px] font-semibold text-[#434653]">
                                    {action.shortcut}
                                  </span>
                                ) : null}
                              </div>
                              <div className="mt-1 text-[13px] leading-5 text-[#434653]">
                                {action.description}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex min-h-[280px] flex-col items-center justify-center rounded-[20px] border border-dashed border-[#e0e3e5] bg-[radial-gradient(circle_at_top,#ffffff_0%,#f8fafc_60%,#eef2f7_100%)] px-6 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-[0_8px_24px_rgba(0,0,0,0.08)]">
                  <Icon name="search" className="text-[28px] text-[#003c90]" />
                </div>
                <h3 className="mt-4 text-[22px] font-semibold tracking-[-0.02em] text-[#191c1e]">
                  No matches
                </h3>
                <p className="mt-2 max-w-[340px] text-[14px] leading-6 text-[#434653]">
                  Try a property name, a page, or an action like recommendation, rules, or export.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}