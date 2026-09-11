"use client";

import { useState, useTransition } from "react";
import { Download, FileSpreadsheet } from "lucide-react";
import { btn } from "@/components/ui";
import { exportReport } from "@/app/actions/reports";

function localDate(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate());
}

export default function ExportReportButton() {
  const now = new Date();
  const first = new Date(now.getFullYear(), now.getMonth(), 1);
  const [from, setFrom] = useState(localDate(first));
  const [to, setTo] = useState(localDate(now));
  const [err, setErr] = useState("");
  const [pending, startTransition] = useTransition();

  function submit() {
    if (!from || !to) {
      setErr("Pilih rentang tanggal");
      return;
    }
    if (new Date(from) > new Date(to)) {
      setErr("Tanggal 'Dari' tidak boleh melewati 'Sampai'");
      return;
    }
    setErr("");
    const fd = new FormData();
    fd.set("from", from);
    fd.set("to", to);
    startTransition(async () => {
      const res: any = await exportReport(fd);
      if (res?.error) {
        setErr("Rentang tanggal tidak valid");
        return;
      }
      const blob = new Blob([res.csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = res.fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <input
        type="date"
        value={from}
        onChange={(e) => setFrom(e.target.value)}
        className="rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
      />
      <span className="text-xs text-gray-400">s/d</span>
      <input
        type="date"
        value={to}
        onChange={(e) => setTo(e.target.value)}
        className="rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
      />
      <button
        type="button"
        disabled={pending}
        onClick={submit}
        className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-40"
      >
        {pending ? <Download size={15} className="animate-pulse" /> : <FileSpreadsheet size={15} />}
        {pending ? "Menyiapkan..." : "Export Excel"}
      </button>
      {err && <span className="text-xs text-red-600">{err}</span>}
    </div>
  );
}