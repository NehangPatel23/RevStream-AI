"use client";

import { useMemo } from "react";
import { Download, FileDown, Link as LinkIcon, Share2 } from "lucide-react";
import { appToast } from "@/lib/toast";

type ExportActionsProps = {
  title: string;
  shareUrl: string;
};

function escapeCsv(value: string) {
  if (/[,"\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

function triggerDownload(filename: string, content: BlobPart, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function escapePdfText(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function buildSimplePdf(lines: string[]) {
  const sanitized = lines.slice(0, 24).map(escapePdfText);

  const contentCommands = [
    "BT",
    "/F1 16 Tf",
    "72 760 Td",
    `(${sanitized[0] ?? "RevStream AI Report"}) Tj`,
    "/F1 11 Tf",
    ...sanitized.slice(1).flatMap((line) => [`0 -20 Td`, `(${line}) Tj`]),
    "ET",
  ].join("\n");

  const objects = [
    "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n",
    "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n",
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n',
    '4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n',
    `5 0 obj\n<< /Length ${new TextEncoder().encode(contentCommands).length} >>\nstream\n${contentCommands}\nendstream\nendobj\n`,
  ];

  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [0];

  for (const object of objects) {
    offsets.push(new TextEncoder().encode(pdf).length);
    pdf += object;
  }

  const xrefStart = new TextEncoder().encode(pdf).length;
  const xrefLines = [
    "xref",
    "0 6",
    "0000000000 65535 f ",
    ...offsets.slice(1).map((offset) => `${offset.toString().padStart(10, "0")} 00000 n `),
    "trailer",
    "<< /Size 6 /Root 1 0 R >>",
    "startxref",
    `${xrefStart}`,
    "%%EOF",
  ].join("\n");

  pdf += xrefLines;
  return pdf;
}

export function ExportActions({ title, shareUrl }: ExportActionsProps) {
  const clipboardValue = useMemo(() => shareUrl, [shareUrl]);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(clipboardValue);
      appToast.success({ title: "Share link copied" });
    } catch {
      appToast.error({ title: "Could not copy link" });
    }
  };

  const exportCsv = () => {
    const rows = [
      ["Title", title],
      ["Share URL", shareUrl],
      ["Generated At", new Date().toLocaleString()],
    ];
    const csv = rows.map((row) => row.map(escapeCsv).join(",")).join("\n");
    triggerDownload(`${title.toLowerCase().replace(/\s+/g, "-")}.csv`, csv, "text/csv;charset=utf-8");
    appToast.success({ title: "CSV downloaded" });
  };

  const exportPdf = () => {
    const pdf = buildSimplePdf([
      `${title} report`,
      `Share URL: ${shareUrl}`,
      `Generated at: ${new Date().toLocaleString()}`,
      "This is a lightweight client-side PDF export.",
    ]);
    triggerDownload(
      `${title.toLowerCase().replace(/\s+/g, "-")}.pdf`,
      pdf,
      "application/pdf"
    );
    appToast.success({ title: "PDF downloaded" });
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={exportPdf}
        className="inline-flex h-10 items-center gap-2 rounded-full border border-[#c3c6d5] bg-white px-4 text-[14px] font-semibold text-[#191c1e] transition hover:bg-[#f2f4f6]"
      >
        <FileDown className="h-4 w-4" />
        Export PDF
      </button>
      <button
        type="button"
        onClick={exportCsv}
        className="inline-flex h-10 items-center gap-2 rounded-full border border-[#c3c6d5] bg-white px-4 text-[14px] font-semibold text-[#191c1e] transition hover:bg-[#f2f4f6]"
      >
        <Download className="h-4 w-4" />
        Export CSV
      </button>
      <button
        type="button"
        onClick={copyLink}
        className="inline-flex h-10 items-center gap-2 rounded-full border border-[#c3c6d5] bg-white px-4 text-[14px] font-semibold text-[#191c1e] transition hover:bg-[#f2f4f6]"
      >
        <LinkIcon className="h-4 w-4" />
        Copy share link
      </button>
      <button
        type="button"
        onClick={() =>
          appToast.message({
            title: "Report download queued",
            description: "A polished report export can be wired to your backend later.",
          })
        }
        className="inline-flex h-10 items-center gap-2 rounded-full bg-[#003c90] px-4 text-[14px] font-semibold text-white transition hover:opacity-95"
      >
        <Share2 className="h-4 w-4" />
        Download report
      </button>
    </div>
  );
}