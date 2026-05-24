"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ShellCommand } from "@/lib/app-shell";

type CommandPaletteProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  commands: ShellCommand[];
};

export function AppCommandPalette({ open, onOpenChange, commands }: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    return commands.filter((command) => {
      if (!normalized) return true;
      const haystack = [
        command.label,
        command.description,
        command.group,
        ...(command.keywords ?? []),
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalized);
    });
  }, [commands, query]);

  useEffect(() => {
    const onHotkey = (event: KeyboardEvent) => {
      const isK = event.key.toLowerCase() === "k";
      if ((event.metaKey || event.ctrlKey) && isK) {
        event.preventDefault();
        onOpenChange(true);
      }

      if (event.key === "Escape" && open) {
        event.preventDefault();
        onOpenChange(false);
      }
    };

    window.addEventListener("keydown", onHotkey);
    return () => window.removeEventListener("keydown", onHotkey);
  }, [open, onOpenChange]);

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setActiveIndex(0);

    const t = window.setTimeout(() => inputRef.current?.focus(), 0);
    return () => window.clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (activeIndex >= filtered.length) setActiveIndex(0);
  }, [activeIndex, filtered.length]);

  if (!open) return null;

  const activate = (index: number) => {
    const command = filtered[index];
    if (!command) return;
    command.run();
    onOpenChange(false);
  };

  return (
    <div className="fixed inset-0 z-60 flex items-start justify-center bg-black/35 px-4 pt-24 backdrop-blur-[2px]">
      <div className="w-full max-w-190 overflow-hidden rounded-3xl border border-[#e0e3e5] bg-white shadow-[0_24px_80px_rgba(0,0,0,0.22)]">
        <div className="flex items-center gap-3 border-b border-[#e0e3e5] px-5 py-4">
          <Search className="h-5 w-5 text-[#737784]" />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "ArrowDown") {
                event.preventDefault();
                setActiveIndex((current) => Math.min(current + 1, Math.max(filtered.length - 1, 0)));
              }
              if (event.key === "ArrowUp") {
                event.preventDefault();
                setActiveIndex((current) => Math.max(current - 1, 0));
              }
              if (event.key === "Enter") {
                event.preventDefault();
                activate(activeIndex);
              }
              if (event.key === "Escape") {
                event.preventDefault();
                onOpenChange(false);
              }
            }}
            placeholder="Search properties, actions, exports, or views..."
            className="h-12 w-full border-0 bg-transparent text-[16px] text-[#191c1e] outline-none placeholder:text-[#737784]"
          />
          <span className="hidden rounded-full border border-[#c3c6d5] px-2 py-1 text-[12px] font-semibold text-[#434653] md:inline-flex">
            Esc
          </span>
        </div>

        <div className="max-h-115 overflow-y-auto p-3">
          {filtered.length ? (
            filtered.map((command, index) => (
              <button
                key={command.id}
                type="button"
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => activate(index)}
                className={cn(
                  "flex w-full items-start justify-between gap-4 rounded-2xl px-4 py-3 text-left transition",
                  index === activeIndex ? "bg-[#eceef0]" : "hover:bg-[#f2f4f6]"
                )}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[15px] font-semibold text-[#191c1e]">{command.label}</span>
                    {command.shortcut ? (
                      <span className="rounded-full bg-[#d0e1fb] px-2 py-0.5 text-[11px] font-semibold text-[#003c90]">
                        {command.shortcut}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-[13px] leading-5 text-[#434653]">
                    {command.description}
                  </p>
                </div>
                <span
                  className={cn(
                    "mt-0.5 rounded-full px-2 py-1 text-[11px] font-semibold",
                    command.danger ? "bg-[#fbeaea] text-[#ba1a1a]" : "bg-[#eceef0] text-[#434653]"
                  )}
                >
                  {command.group}
                </span>
              </button>
            ))
          ) : (
            <div className="px-4 py-12 text-center">
              <div className="text-[15px] font-semibold text-[#191c1e]">No matches</div>
              <p className="mt-2 text-[14px] text-[#434653]">Try a different search term.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}