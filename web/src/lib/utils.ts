export function rupiah(n: number): string {
  return "Rp " + (n || 0).toLocaleString("id-ID");
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "-";
  const d = new Date(iso);
  return d.toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDateOnly(iso: string | null | undefined): string {
  if (!iso) return "-";
  const d = new Date(iso);
  return d.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function randomCode(length = 6): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let out = "";
  for (let i = 0; i < length; i++) {
    out += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return out;
}

export function invoiceNumber(prefix: "INV" | "PO" | "PRD"): string {
  const d = new Date();
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(
    d.getDate()
  ).padStart(2, "0")}`;
  return `${prefix}-${ymd}-${randomCode(prefix === "PRD" ? 5 : 6)}`;
}

export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}

export const paymentMethodLabels: Record<string, string> = {
  cash: "Tunai",
  transfer: "Transfer",
  qris: "QRIS",
  ewallet: "E-Wallet",
  credit: "Kredit",
  debit: "Debit",
  receivable: "Piutang",
};

export const unitLabels: Record<string, string> = {
  pcs: "Pcs",
  pack: "Pack",
  box: "Box",
  karung: "Karung",
  kg: "Kg",
  ltr: "Liter",
};

export const statusLabels: Record<string, string> = {
  completed: "Selesai",
  pending: "Menunggu",
  cancelled: "Dibatalkan",
  planned: "Direncanakan",
};

export function getSetting(
  settings: Record<string, string>,
  key: string,
  fallback = ""
): string {
  return key in settings ? settings[key] || fallback : fallback;
}

export function todayStartISO(): string {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return now.toISOString();
}

export function monthStartISO(): string {
  const now = new Date();
  now.setDate(1);
  now.setHours(0, 0, 0, 0);
  return now.toISOString();
}

export function daysAgoISO(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

export function dayRangeISO(from: string, to: string): { start: string; end: string } | null {
  if (!from || !to) return null;
  const f = new Date(from + "T00:00:00");
  const t = new Date(to + "T23:59:59.999");
  if (isNaN(f.getTime()) || isNaN(t.getTime()) || f > t) return null;
  return { start: f.toISOString(), end: t.toISOString() };
}

export function isLowStock(p: { stock: number; min_stock: number }): boolean {
  return p.stock <= p.min_stock;
}