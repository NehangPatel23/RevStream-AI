"use client";

import Link from "next/link";
import { Archive, Bell, Check, CircleAlert, Info, Sparkles } from "lucide-react";
import { Drawer } from "@/components/ui/drawer";
import { cn } from "@/lib/utils";
import type { ShellNotification } from "@/lib/app-shell";

type NotificationCenterProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  notifications: ShellNotification[];
  onMarkRead: (id: string) => void;
  onDismiss: (id: string) => void;
  onDismissAll: () => void;
};

const severityIcon = {
  info: Info,
  success: Sparkles,
  warning: Bell,
  critical: CircleAlert,
};

export function NotificationCenter({
  open,
  onOpenChange,
  notifications,
  onMarkRead,
  onDismiss,
  onDismissAll,
}: NotificationCenterProps) {
  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      title="Notifications"
      description="Recent updates, alerts, and recommendation activity."
      footer={
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onDismissAll}
            className="inline-flex h-10 items-center gap-2 rounded-full border border-[#c3c6d5] px-4 text-[14px] font-semibold text-[#191c1e] transition hover:bg-[#f2f4f6]"
          >
            <Archive className="h-4 w-4" />
            Archive all
          </button>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="inline-flex h-10 items-center gap-2 rounded-full bg-[#003c90] px-4 text-[14px] font-semibold text-white transition hover:opacity-95"
          >
            <Check className="h-4 w-4" />
            Done
          </button>
        </div>
      }
    >
      <div className="space-y-3">
        {notifications.length ? (
          notifications.map((item) => {
            const Icon = severityIcon[item.severity];

            return (
              <article
                key={item.id}
                className={cn(
                  "rounded-[18px] border p-4 transition",
                  item.unread ? "border-[#c3c6d5] bg-white" : "border-[#e0e3e5] bg-[#f8fafc]"
                )}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#eceef0] text-[#003c90]">
                    <Icon className="h-5 w-5" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-[15px] font-semibold text-[#191c1e]">{item.title}</h3>
                          {item.unread ? (
                            <span className="h-2 w-2 rounded-full bg-[#003c90]" />
                          ) : null}
                        </div>
                        <p className="mt-1 text-[14px] leading-5.5 text-[#434653]">
                          {item.description}
                        </p>
                      </div>
                      <span className="text-[12px] font-semibold text-[#737784]">{item.time}</span>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      {item.href ? (
                        <Link
                          href={item.href}
                          onClick={() => onMarkRead(item.id)}
                          className="inline-flex h-9 items-center rounded-full bg-[#d0e1fb] px-3 text-[13px] font-semibold text-[#003c90]"
                        >
                          {item.actionLabel ?? "Open"}
                        </Link>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => onMarkRead(item.id)}
                        className="inline-flex h-9 items-center rounded-full border border-[#c3c6d5] px-3 text-[13px] font-semibold text-[#191c1e] transition hover:bg-[#f2f4f6]"
                      >
                        Mark read
                      </button>
                      <button
                        type="button"
                        onClick={() => onDismiss(item.id)}
                        className="inline-flex h-9 items-center rounded-full border border-transparent px-3 text-[13px] font-semibold text-[#737784] transition hover:bg-[#eceef0]"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            );
          })
        ) : (
          <div className="flex min-h-105 items-center justify-center rounded-3xl border border-dashed border-[#e0e3e5] bg-[radial-gradient(circle_at_top,#ffffff_0%,#f8fafc_60%,#eef2f7_100%)] px-6">
            <div className="max-w-[320px] text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-[0_8px_24px_rgba(0,0,0,0.08)]">
                <Bell className="h-7 w-7 text-[#003c90]" />
              </div>
              <h3 className="mt-4 text-[22px] font-semibold tracking-[-0.02em] text-[#191c1e]">
                No notifications
              </h3>
              <p className="mt-2 text-[14px] leading-6 text-[#434653]">
                You are all caught up. New alerts and pricing updates will appear here.
              </p>
            </div>
          </div>
        )}
      </div>
    </Drawer>
  );
}