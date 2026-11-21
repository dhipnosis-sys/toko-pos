import { createAdminClient } from "@/lib/supabase/admin";
import {
  isNotifyEnabled,
  notifyOnce,
  notifyRoles,
} from "@/lib/notifications";

/**
 * Pemicu notifikasi bisnis (server only).
 *
 * Semua fungsi di sini dibungkus try/catch dan TIDAK PERNAH melempar error —
 * kegagalan notifikasi tidak boleh menggagalkan transaksi.
 *
 * Dipanggil dari server action melalui `after()` dari `next/server` agar
 * tidak menambah latensi pada respons ke pengguna.
 */

type StockRow = {
  id: number;
  name: string;
  stock: string | number;
  min_stock: string | number;
};

type StockSnap = { name: string; stock: number; min_stock: number };
export type StockSnapshot = Map<number, StockSnap>;

/** Tanggal hari ini menurut WIB (UTC+7), format YYYY-MM-DD. */
export function todayWIB(): string {
  return new Date(Date.now() + 7 * 3600 * 1000).toISOString().slice(0, 10);
}

function cleanIds(list: Array<number | null | undefined>): number[] {
  return [...new Set(list.filter((n): n is number => typeof n === "number" && n > 0))];
}

/** Ambil stok & min_stock untuk produk tertentu — dipakai sebelum transaksi. */
export async function snapshotStock(productIds: number[]): Promise<StockSnapshot> {
  const map: StockSnapshot = new Map();
  const ids = cleanIds(productIds);
  if (!ids.length) return map;

  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("products")
      .select("id, name, stock, min_stock")
      .in("id", ids);
    if (error || !data) return map;

    for (const row of data as StockRow[]) {
      map.set(row.id, {
        name: row.name,
        stock: Number(row.stock),
        min_stock: Number(row.min_stock),
      });
    }
  } catch (err) {
    console.warn("[push] snapshotStock gagal:", err);
  }
  return map;
}

/**
 * Kirim notifikasi untuk produk yang BARU turun ke bawah/equal min_stock
 * setelah transaksi. Produk yang sudah lama rendah tidak dikirim ulang.
 */
export async function notifyNewlyLowStock(
  before: StockSnapshot,
  productIds: number[]
): Promise<void> {
  try {
    const ids = cleanIds(productIds);
    if (!ids.length || before.size === 0) return;
    if (!(await isNotifyEnabled("notify_low_stock"))) return;

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("products")
      .select("id, name, stock, min_stock")
      .in("id", ids);
    if (error || !data?.length) return;

    const newly: string[] = [];
    for (const row of data as StockRow[]) {
      const prev = before.get(row.id);
      if (!prev) continue;

      const stock = Number(row.stock);
      const minStock = Number(row.min_stock);
      const wasLow = prev.stock <= prev.min_stock;
      const isLow = stock <= minStock;

      if (isLow && !wasLow) {
        newly.push(`${row.name} — sisa ${stock}`);
      }
    }
    if (!newly.length) return;

    const shown = newly.slice(0, 5);
    const extra = newly.length - shown.length;

    await notifyRoles(["owner", "warehouse"], {
      title: "⚠️ Stok menipis",
      body:
        shown.join("\n") + (extra > 0 ? `\n+${extra} produk lainnya` : ""),
      url: "/products",
    });
  } catch (err) {
    console.warn("[push] notifyNewlyLowStock gagal:", err);
  }
}

/** Ambil total piutang pelanggan sebelum transaksi — dipakai untuk delta. */
export async function snapshotCustomerDebt(
  customerId: number | null
): Promise<number | null> {
  if (!customerId) return null;
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("customers")
      .select("total_debt")
      .eq("id", customerId)
      .maybeSingle();
    if (!data) return null;
    return Number(data.total_debt ?? 0);
  } catch (err) {
    console.warn("[push] snapshotCustomerDebt gagal:", err);
    return null;
  }
}

/**
 * Notifikasi piutang baru setelah penjualan tempo.
 * `prevTotalDebt` diambil sebelum transaksi sehingga bisa dihitung selisihnya
 * tanpa menduplikasi rumus kalkulasi checkout.
 */
export async function notifyNewReceivable(
  customerId: number | null,
  prevTotalDebt: number | null
): Promise<void> {
  try {
    if (!customerId) return;
    if (!(await isNotifyEnabled("notify_debt"))) return;

    const admin = createAdminClient();
    const { data: customer } = await admin
      .from("customers")
      .select("id, name, total_debt")
      .eq("id", customerId)
      .maybeSingle();
    if (!customer) return;

    const totalDebt = Number(customer.total_debt ?? 0);
    const added =
      prevTotalDebt !== null && totalDebt > prevTotalDebt
        ? totalDebt - prevTotalDebt
        : 0;

    const detail =
      added > 0
        ? `Rp ${added.toLocaleString("id-ID")} (total piutang Rp ${totalDebt.toLocaleString("id-ID")})`
        : `total piutang Rp ${totalDebt.toLocaleString("id-ID")}`;

    await notifyRoles(["owner", "cashier"], {
      title: "🧾 Piutang baru",
      body: `${customer.name} — ${detail}`,
      url: `/customers/${customerId}`,
    });
  } catch (err) {
    console.warn("[push] notifyNewReceivable gagal:", err);
  }
}

/**
 * Cek piutang jatuh tempo untuk satu pelanggan.
 * Mengirim maksimal 1x per hari per pelanggan (anti-spam via push_sent_log).
 */
export async function checkCustomerOverdue(customerId: number | null): Promise<void> {
  try {
    if (!customerId) return;
    if (!(await isNotifyEnabled("notify_debt"))) return;

    const admin = createAdminClient();
    const { data: customer } = await admin
      .from("customers")
      .select("id, name, total_debt, debt_due_date")
      .eq("id", customerId)
      .maybeSingle();
    if (!customer) return;

    await sendOverdueIfDue({
      id: customer.id as number,
      name: customer.name as string,
      total_debt: Number(customer.total_debt ?? 0),
      debt_due_date: customer.debt_due_date as string | null,
    });
  } catch (err) {
    console.warn("[push] checkCustomerOverdue gagal:", err);
  }
}

type CustomerDue = {
  id: number;
  name: string;
  total_debt: number;
  debt_due_date: string | null;
};

async function sendOverdueIfDue(c: CustomerDue): Promise<boolean> {
  if (!c.debt_due_date || c.total_debt <= 0) return false;

  const today = todayWIB();
  if (c.debt_due_date > today) return false; // belum jatuh tempo

  return notifyOnce(
    "overdue",
    `${c.id}:${today}`,
    ["owner", "cashier"],
    {
      title: "⏰ Piutang jatuh tempo",
      body: `${c.name} — Rp ${c.total_debt.toLocaleString("id-ID")} jatuh tempo ${c.debt_due_date}`,
      url: `/customers/${c.id}`,
    }
  );
}

/**
 * Sweep semua piutang jatuh tempo — dipanggil oleh Vercel Cron.
 * Mengembalikan jumlah pelanggan yang dikirimi notifikasi.
 */
export async function checkAllOverdue(): Promise<number> {
  if (!(await isNotifyEnabled("notify_debt"))) return 0;

  const admin = createAdminClient();
  const today = todayWIB();

  const { data, error } = await admin
    .from("customers")
    .select("id, name, total_debt, debt_due_date")
    .not("debt_due_date", "is", null)
    .lte("debt_due_date", today)
    .gt("total_debt", 0)
    .limit(100);

  if (error || !data?.length) return 0;

  // Paralel agar selesai cepat (durasi fungsi serverless terbatas).
  const results = await Promise.all(
    (data as CustomerDue[]).map((row) => sendOverdueIfDue(row))
  );
  return results.filter(Boolean).length;
}
