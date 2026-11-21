/**
 * ESC/POS encoder for 58mm thermal receipt — fixed 32 columns (Font A).
 * Pure TS, no Node deps — works in browser and in the HTML preview.
 */

// ==== Constants ====
const ESC = 0x1b;
const GS = 0x1d;
const W = 32; // 58mm = 32 karakter per baris (Font A)

// ==== Command builders ====
function cmd(...bytes: number[]): Uint8Array {
  return new Uint8Array(bytes);
}

const INIT = cmd(ESC, 0x40);                // ESC @ — init
const ALIGN_LEFT = cmd(ESC, 0x61, 0x00);    // ESC a 0
const BOLD_ON = cmd(ESC, 0x45, 0x01);       // ESC E 1
const BOLD_OFF = cmd(ESC, 0x45, 0x00);      // ESC E 0
const FONT_NORMAL = cmd(GS, 0x21, 0x00);    // GS ! 0 — 1x1
const FEED_1 = cmd(ESC, 0x64, 0x01);        // ESC d 1
const FEED_4 = cmd(ESC, 0x64, 0x04);        // ESC d 4 — 4 baris kosong
const CUT_PARTIAL = cmd(GS, 0x56, 0x01);    // GS V 1 (potong sebagian)
const LINE_SPACING_24 = cmd(ESC, 0x33, 24); // ESC 3 24 (default Font A)

// ==== Text encoding ====
/** Sanitize to ASCII-safe for thermal printers (CP437 subset). */
function sanitize(str: string): string {
  return str
    .replace(/[—–]/g, "-")
    .replace(/[""]/g, '"')
    .replace(/['']/g, "'")
    .replace(/•/g, "*")
    .replace(/…/g, "...")
    .replace(/[^\x00-\x7F]/g, "?");
}

const encoder = new TextEncoder();
function txt(s: string): Uint8Array {
  return encoder.encode(sanitize(s));
}

function trunc(s: string, max: number): string {
  if (max <= 0) return "";
  if (s.length <= max) return s;
  return s.slice(0, max - 1) + ".";
}

function center(s: string, width = W): string {
  const t = trunc(sanitize(s), width);
  const pad = Math.max(0, Math.floor((width - t.length) / 2));
  return " ".repeat(pad) + t;
}

/** Baris label di kiri, nilai di kanan. */
function row(left: string, right: string, width = W): string {
  const L = sanitize(left);
  const R = sanitize(right);
  if (L.length + R.length + 1 <= width) {
    return L + " ".repeat(width - L.length - R.length) + R;
  }
  const room = Math.max(0, width - R.length - 1);
  const shortened = trunc(L, room);
  return shortened + " ".repeat(Math.max(1, width - shortened.length - R.length)) + R;
}

/** Nominal pada baris item: "Rp 3.500" -> "3.500". */
function amount(s: string): string {
  return sanitize(s).replace(/^Rp\s*/i, "");
}

/** Nominal rata kanan dengan titik ribuan: "Rp 75.000" -> "Rp  75.000". */
function rupiahAligned(s: string): string {
  const m = sanitize(s).match(/^Rp\s*(.*)$/);
  return m ? "Rp " + m[1].padStart(7) : sanitize(s);
}

function formatQty(n: number): string {
  const v = Number(n) || 0;
  return Number.isInteger(v) ? String(v) : String(v).replace(".", ",");
}

/** Bungkus teks, termasuk kata yang lebih panjang dari batas. */
function wrapText(text: string, maxLen: number): string[] {
  const words = sanitize(text).split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let cur = "";
  for (const word of words) {
    if (word.length > maxLen) {
      if (cur) {
        lines.push(cur);
        cur = "";
      }
      for (let i = 0; i < word.length; i += maxLen) {
        lines.push(word.slice(i, i + maxLen));
      }
      continue;
    }
    const next = cur ? `${cur} ${word}` : word;
    if (next.length <= maxLen) {
      cur = next;
    } else {
      if (cur) lines.push(cur);
      cur = word;
    }
  }
  if (cur) lines.push(cur);
  return lines.length ? lines : [""];
}

// ==== Receipt data types ====
export type ReceiptItem = {
  name: string;
  qty: number;
  unit: string;
  unitPrice: string;    // diformat "Rp xxxx"
  subtotal: string;     // diformat "Rp xxxx"
  note?: string;
};

export type ReceiptData = {
  storeName: string;
  storeAddress?: string;
  storePhone?: string;
  invoice: string;
  date: string;         // "dd/mm/yy hh:mm"
  cashier: string;
  customer: string;
  payment: string;
  items: ReceiptItem[];
  subtotal: string;
  discount?: string;
  digitalTotal?: string;
  total: string;
  paid: string;
  change?: string;
  footer1?: string;
  footer2?: string;
};

// ==== Layout ====
export type ReceiptLine = { text: string; bold?: boolean };

/**
 * Susun struk 32 kolom. Dipakai baik untuk ESC/POS maupun preview HTML,
 * supaya tampilan di layar identik dengan hasil cetak.
 */
export function buildReceiptLines(data: ReceiptData): ReceiptLine[] {
  const lines: ReceiptLine[] = [];
  const add = (text: string, bold = false) => {
    lines.push({ text: sanitize(text).slice(0, W), bold });
  };
  const separator = "-".repeat(W);

  // Header toko
  add(center(data.storeName.toUpperCase()), true);
  if (data.storeAddress) add(center(data.storeAddress));
  const phone = (data.storePhone || "").replace(/^(WA|WhatsApp)\s*:\s*/i, "").trim();
  if (phone) add(center(`WA: ${phone}`));
  add(separator);

  // Info transaksi
  const no = `No: ${data.invoice}`;
  if (no.length + 1 + data.date.length <= W) {
    add(row(no, data.date));
  } else {
    add(no);
    add(row("", data.date));
  }
  add(`Kasir: ${data.cashier}`);
  add(separator);

  // Item
  for (const it of data.items) {
    for (const line of wrapText(it.name, W)) add(line);
    add(
      row(
        `  ${formatQty(it.qty)} x ${amount(it.unitPrice)}`,
        amount(it.subtotal)
      )
    );
  }
  add(separator);

  // Total
  const itemCount = data.items.reduce((sum, it) => sum + (Number(it.qty) || 0), 0);
  add(`Total Item: ${formatQty(itemCount)}`);
  add(row("TOTAL", rupiahAligned(data.total)), true);
  add(row("Tunai", rupiahAligned(data.paid)));
  add(row("Kembali", rupiahAligned(data.change || "Rp 0")));
  add(separator);

  // Footer
  add(center(data.footer1 || "Terima kasih sudah belanja!"));
  const footer2 =
    data.footer2 || "Barang yang sudah dibeli tidak dapat dikembalikan";
  for (const line of wrapText(footer2, 26)) add(center(line));

  return lines;
}

/** Versi teks polos (32 kolom) untuk preview di halaman cetak. */
export function buildReceiptText(data: ReceiptData): string {
  return buildReceiptLines(data)
    .map((line) => line.text.replace(/\s+$/, ""))
    .join("\n");
}

/** Byte ESC/POS yang dikirim ke RawBT / Web Bluetooth. */
export function buildEscposReceipt(data: ReceiptData): Uint8Array {
  const parts: Uint8Array[] = [INIT, LINE_SPACING_24, FONT_NORMAL, ALIGN_LEFT];
  for (const line of buildReceiptLines(data)) {
    if (line.bold) parts.push(BOLD_ON);
    parts.push(txt(line.text), FEED_1);
    if (line.bold) parts.push(BOLD_OFF);
  }
  parts.push(FEED_4, CUT_PARTIAL);
  return concat(...parts);
}

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

/** Helper to chunk for BLE write (max ~20 bytes per packet safe) */
export function chunkBytes(bytes: Uint8Array, maxLen = 20): Uint8Array[] {
  const chunks: Uint8Array[] = [];
  for (let i = 0; i < bytes.length; i += maxLen) {
    chunks.push(bytes.slice(i, i + maxLen));
  }
  return chunks;
}
