/**
 * ESC/POS encoder for 58mm thermal receipt (32 columns, font A).
 * Pure TS, no Node deps — works in browser.
 */

// ==== Constants ====
const ESC = 0x1b;
const GS = 0x1d;

// ==== Command builders ====
function cmd(...bytes: number[]): Uint8Array {
  return new Uint8Array(bytes);
}

const INIT = cmd(ESC, 0x40);                // ESC @ — init
const ALIGN_LEFT = cmd(ESC, 0x61, 0x00);    // ESC a 0
const ALIGN_CENTER = cmd(ESC, 0x61, 0x01);  // ESC a 1
const ALIGN_RIGHT = cmd(ESC, 0x61, 0x02);   // ESC a 2
const BOLD_ON = cmd(ESC, 0x45, 0x01);       // ESC E 1
const BOLD_OFF = cmd(ESC, 0x45, 0x00);      // ESC E 0
const FONT_NORMAL = cmd(GS, 0x21, 0x00);    // GS ! 0
const FEED_1 = cmd(ESC, 0x64, 0x01);        // ESC d 1
const FEED_2 = cmd(ESC, 0x64, 0x02);
const FEED_3 = cmd(ESC, 0x64, 0x03);
const CUT_PARTIAL = cmd(GS, 0x56, 0x01);    // GS V 1 (partial cut)
const CUT_FULL = cmd(GS, 0x56, 0x00);       // GS V 0 (full cut)
const LINE_SPACING_24 = cmd(ESC, 0x33, 0x18); // ESC 3 24 (default 24 dots)

// ==== Text encoding ====
/** Sanitize to ASCII-safe for thermal printers (CP437 subset). */
function sanitize(str: string): string {
  return str
    .replace(/[—–]/g, "-")      // en/em dash
    .replace(/[""]/g, '"')      // smart quotes
    .replace(/['']/g, "'")      // smart apostrophes
    .replace(/•/g, "*")         // bullet
    .replace(/…/g, "...")       // ellipsis
    .replace(/[^\x00-\x7F]/g, "?"); // fallback for any other non-ASCII
}

const encoder = new TextEncoder();
function txt(s: string): Uint8Array {
  return encoder.encode(sanitize(s));
}

/** Pad left to fit within width. */
function padLeft(s: string, width: number): string {
  return s.padStart(width);
}

/** Pad right. */
function padRight(s: string, width: number): string {
  return s.padEnd(width);
}

/** Truncate with ellipsis if too long. */
function trunc(s: string, max: number): string {
  if (s.length <= max) return s;
  return s.slice(0, max - 1) + "…";
}

/** Build a row: left text + right text, width 32. */
function row(left: string, right: string, width = 32): Uint8Array {
  const L = trunc(left, width - right.length - 1);
  const gap = width - L.length - right.length;
  return txt(L + " ".repeat(Math.max(1, gap)) + right);
}

/** Build a single centered line. */
function centerLine(s: string, width = 32): Uint8Array {
  const t = trunc(s, width);
  const pad = Math.max(0, Math.floor((width - t.length) / 2));
  return txt(" ".repeat(pad) + t);
}

/** Build a divider line. */
function divider(width = 32): Uint8Array {
  return txt("-".repeat(width));
}

/** Concatenate Uint8Arrays. */
function concat(...arrays: Uint8Array[]): Uint8Array {
  const total = arrays.reduce((a, b) => a + b.length, 0);
  const out = new Uint8Array(total);
  let off = 0;
  for (const a of arrays) {
    out.set(a, off);
    off += a.length;
  }
  return out;
}

// ==== Receipt data types ====
export type ReceiptItem = {
  name: string;
  qty: number;
  unit: string;
  unitPrice: string;    // formatted "Rp xxxx"
  subtotal: string;     // formatted "Rp xxxx"
  note?: string;
};

export type ReceiptData = {
  storeName: string;
  storeAddress?: string;
  storePhone?: string;
  invoice: string;
  date: string;
  cashier: string;
  customer: string;
  payment: string;
  items: ReceiptItem[];
  subtotal: string;     // "Rp xxxx"
  discount?: string;    // "Rp xxxx"
  digitalTotal?: string; // "Rp xxxx"
  total: string;        // "Rp xxxx"
  paid: string;         // "Rp xxxx"
  change?: string;      // "Rp xxxx"
  footer1?: string;
  footer2?: string;
};

// ==== Main builder ====
export function buildEscposReceipt(data: ReceiptData): Uint8Array {
  const W = 32;
  const parts: Uint8Array[] = [
    INIT,
    LINE_SPACING_24,
    FONT_NORMAL,
    ALIGN_CENTER,
    BOLD_ON,
    txt(trunc(data.storeName, W)),
    FEED_1,
    BOLD_OFF,
  ];

  if (data.storeAddress) parts.push(centerLine(data.storeAddress, W), FEED_1);
  if (data.storePhone) parts.push(centerLine(`Telp: ${data.storePhone}`, W), FEED_1);

  parts.push(divider(W), FEED_1, ALIGN_LEFT);

  // Header info
  parts.push(row("Invoice", data.invoice, W), FEED_1);
  parts.push(row("Tanggal", data.date, W), FEED_1);
  parts.push(row("Kasir", data.cashier, W), FEED_1);
  parts.push(row("Pelanggan", data.customer, W), FEED_1);
  parts.push(row("Metode", data.payment, W), FEED_1);

  parts.push(divider(W), FEED_1);

  // Items header
  parts.push(
    txt(
      padRight("Item", 14) +
        padRight("Qty", 5) +
        padRight("Harga", 6) +
        padLeft("Sub", 7)
    ),
    FEED_1,
    divider(W),
    FEED_1
  );

  for (const it of data.items) {
    // Item name (wrap if > 13 chars)
    const name = sanitize(it.name);
    const nameLines = wrapText(name, 13);
    for (const ln of nameLines) {
      parts.push(txt(padRight(ln, 14) + " ".repeat(18)), FEED_1);
    }
    // Unit note
    if (it.note) {
      parts.push(txt(padRight("  " + it.note, 14) + " ".repeat(18)), FEED_1);
    }
    // Qty + Price + Subtotal
    const price = trunc(it.unitPrice, 6);
    const sub = trunc(it.subtotal, 7);
    const qtyStr = String(it.qty);
    parts.push(
      txt(
        " ".repeat(14) +
          padRight(qtyStr, 5) +
          padRight(price, 6) +
          padLeft(sub, 7)
      ),
      FEED_1
    );
  }

  parts.push(divider(W), FEED_1);

  // Totals
  parts.push(row("Subtotal", data.subtotal, W), FEED_1);
  if (data.discount) parts.push(row("Diskon", `-${data.discount}`, W), FEED_1);
  if (data.digitalTotal) parts.push(row("Digital", data.digitalTotal, W), FEED_1);
  parts.push(
    BOLD_ON,
    row("Total", data.total, W),
    BOLD_OFF,
    FEED_1
  );
  parts.push(row("Dibayar", data.paid, W), FEED_1);
  if (data.change && Number(data.change.replace(/[^\d]/g, "")) > 0) {
    parts.push(row("Kembalian", data.change, W), FEED_1);
  }

  parts.push(divider(W), FEED_1, FEED_1, ALIGN_CENTER);
  if (data.footer1) parts.push(centerLine(data.footer1, W), FEED_1);
  if (data.footer2) parts.push(centerLine(data.footer2, W), FEED_1);

  parts.push(FEED_2, CUT_PARTIAL, FEED_1);

  return concat(...parts);
}

/** Wrap text to lines of maxLen. */
function wrapText(text: string, maxLen: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    if ((cur + " " + w).trim().length <= maxLen) {
      cur = (cur + " " + w).trim();
    } else {
      if (cur) lines.push(cur);
      cur = w;
    }
  }
  if (cur) lines.push(cur);
  return lines;
}

// ==== Helper to chunk for BLE write (max ~20 bytes per packet safe) ====
export function chunkBytes(bytes: Uint8Array, maxLen = 20): Uint8Array[] {
  const chunks: Uint8Array[] = [];
  for (let i = 0; i < bytes.length; i += maxLen) {
    chunks.push(bytes.slice(i, i + maxLen));
  }
  return chunks;
}