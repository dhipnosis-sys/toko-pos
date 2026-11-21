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
const FONT_NORMAL = cmd(GS, 0x21, 0x00);    // GS ! 0  — 1x1
const FONT_DOUBLE_H = cmd(GS, 0x21, 0x10);  // GS ! 16 — 2x tinggi, 1x lebar
const FONT_DOUBLE = cmd(GS, 0x21, 0x11);    // GS ! 17 — 2x tinggi + 2x lebar
const FONT_A = cmd(ESC, 0x4d, 0x00);        // ESC M 0 — Font A (12x24 dot)
const FONT_B = cmd(ESC, 0x4d, 0x01);        // ESC M 1 — Font B (9x17 dot, lebih kecil)
const FEED_1 = cmd(ESC, 0x64, 0x01);        // ESC d 1
const FEED_2 = cmd(ESC, 0x64, 0x02);
const FEED_3 = cmd(ESC, 0x64, 0x03);
const CUT_PARTIAL = cmd(GS, 0x56, 0x01);    // GS V 1 (partial cut)
const CUT_FULL = cmd(GS, 0x56, 0x00);       // GS V 0 (full cut)
const LINE_SPACING_20 = cmd(ESC, 0x33, 20); // ESC 3 20 (font B)
const LINE_SPACING_24 = cmd(ESC, 0x33, 24); // ESC 3 24 (font normal)
const LINE_SPACING_48 = cmd(ESC, 0x33, 48); // ESC 3 48 (font 2x tinggi)

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

/** Truncate if too long (ASCII-safe marker, so column width stays exact). */
function trunc(s: string, max: number): string {
  if (max <= 0) return "";
  if (s.length <= max) return s;
  return s.slice(0, max - 1) + ".";
}

/**
 * Build a row: left text + right text on one line of `width` columns.
 * If the value is too long to sit next to the label, it goes on its own line
 * so numbers are never cut off (important for 16-column "Ekstra" mode).
 */
function row(left: string, right: string, width = 32): Uint8Array {
  if (left.length + right.length + 1 <= width) {
    const gap = width - left.length - right.length;
    return txt(left + " ".repeat(gap) + right);
  }
  if (right.length >= width) {
    return txt(trunc(left, width) + "\n" + right);
  }
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
export type ReceiptFontSize = "small" | "normal" | "large" | "xlarge";

/**
 * Build ESC/POS bytes for a 58mm receipt.
 *
 * fontSize:
 * - "small"  Font B (9x17 dot) → 42 kolom, paling kecil
 * - "normal" Font A 1x1        → 32 kolom
 * - "large"  2x tinggi (default) → 32 kolom, tetap terbaca jelas
 * - "xlarge" 2x tinggi + 2x lebar → 16 kolom, layout ditumpuk
 */
export function buildEscposReceipt(
  data: ReceiptData,
  opts: { fontSize?: ReceiptFontSize } = {}
): Uint8Array {
  const fontSize = opts.fontSize ?? "large";
  const W = fontSize === "xlarge" ? 16 : fontSize === "small" ? 42 : 32;
  const FONT =
    fontSize === "small"
      ? concat(FONT_NORMAL, FONT_B)   // ukuran 1x1 + Font B (lebih kecil)
      : fontSize === "normal"
      ? concat(FONT_B, FONT_A)        // kembalikan ke Font A bila sebelumnya Font B
      : FONT_DOUBLE_H;
  const STORE_FONT = fontSize === "xlarge" ? FONT_DOUBLE : FONT;
  const LINE_SPACING =
    fontSize === "small"
      ? LINE_SPACING_20
      : fontSize === "normal"
      ? LINE_SPACING_24
      : LINE_SPACING_48;

  const parts: Uint8Array[] = [
    INIT,
    LINE_SPACING,
    FONT,
    ALIGN_CENTER,
    BOLD_ON,
    STORE_FONT,
    txt(trunc(sanitize(data.storeName), W)),
    FONT,
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

  if (W >= 32) {
    // === Tabel 4 kolom: 42 kolom (Font B) atau 32 kolom (Font A) ===
    const NAME_W = W >= 40 ? 16 : 14;
    const QTY_W = W >= 40 ? 4 : 5;
    const PRICE_W = W >= 40 ? 11 : 6;
    const SUB_W = W >= 40 ? 11 : 7;
    // Font B: kolom lebih lebar, jadi nominal tampil tanpa "Rp " agar utuh.
    const money = (s: string) => (W >= 40 ? s.replace(/^Rp\s*/i, "") : s);

    parts.push(
      txt(
        padRight("Item", NAME_W) +
          padRight("Qty", QTY_W) +
          padRight("Harga", PRICE_W) +
          padLeft("Sub", SUB_W)
      ),
      FEED_1,
      divider(W),
      FEED_1
    );

    for (const it of data.items) {
      const nameLines = wrapText(sanitize(it.name), NAME_W - 1);
      for (const ln of nameLines) {
        parts.push(txt(padRight(ln, W)), FEED_1);
      }
      if (it.note) {
        parts.push(txt(padRight(trunc("  " + it.note, W), W)), FEED_1);
      }
      parts.push(
        txt(
          " ".repeat(NAME_W) +
            padRight(String(it.qty), QTY_W) +
            padRight(trunc(money(it.unitPrice), PRICE_W), PRICE_W) +
            padLeft(trunc(money(it.subtotal), SUB_W), SUB_W)
        ),
        FEED_1
      );
    }
  } else {
    // === Lebar 16 kolom (Ekstra): layout ditumpuk, angka tetap utuh ===
    const unitPriceW = Math.floor((W - 3) / 2); // "x Rp xxx"
    for (const it of data.items) {
      const nameLines = wrapText(sanitize(it.name), W);
      for (const ln of nameLines) {
        parts.push(txt(padRight(ln, W)), FEED_1);
      }
      if (it.note) {
        parts.push(txt(padRight(trunc("  " + it.note, W), W)), FEED_1);
      }
      parts.push(
        row(`${it.qty} x`, trunc(it.unitPrice, Math.max(4, unitPriceW)), W),
        FEED_1
      );
      parts.push(row("", it.subtotal, W), FEED_1);
    }
  }

  parts.push(divider(W), FEED_1);

  // Totals
  parts.push(row("Subtotal", data.subtotal, W), FEED_1);
  if (data.discount) parts.push(row("Diskon", `-${data.discount}`, W), FEED_1);
  if (data.digitalTotal) parts.push(row("Digital", data.digitalTotal, W), FEED_1);
  parts.push(
    BOLD_ON,
    STORE_FONT,
    row("Total", data.total, W),
    FONT,
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