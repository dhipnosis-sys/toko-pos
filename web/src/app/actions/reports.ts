"use server";

import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/dal";
import { dayRangeISO } from "@/lib/utils";

function esc(value: unknown): string {
  const s = String(value ?? "");
  if (/[",\r\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
  return s;
}

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const p = (n: number) => String(n).padStart(2, "0");
  return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate()) + " " + p(d.getHours()) + ":" + p(d.getMinutes());
}

function csvLine(...cols: (string | number)[]): string {
  return cols.map(esc).join(",");
}

export async function exportReport(formData: FormData) {
  await requireRole(["owner", "cashier"]);
  const supabase = await createClient();

  const from = String(formData.get("from") || "");
  const to = String(formData.get("to") || "");
  const range = dayRangeISO(from, to);
  if (!range) return { error: "range" };

  const [{ data: sales }, { data: items }, { data: digital }] = await Promise.all([
    supabase
      .from("sales")
      .select(
        "id, invoice_number, grand_total, subtotal, discount, payment_method, status, created_at, customer:customers(name)"
      )
      .gte("created_at", range.start)
      .lte("created_at", range.end)
      .order("created_at", { ascending: false })
      .limit(50000),
    supabase
      .from("sale_items")
      .select(
        "quantity, unit, unit_price, subtotal, created_at, sale:sales(invoice_number), product:products(name)"
      )
      .gte("created_at", range.start)
      .lte("created_at", range.end)
      .order("created_at", { ascending: false })
      .limit(50000),
    supabase
      .from("digital_sales")
      .select(
        "invoice_number, customer_identifier, amount, admin_fee, cost, profit, total_charged, created_at, digital_type:digital_types(name)"
      )
      .gte("created_at", range.start)
      .lte("created_at", range.end)
      .order("created_at", { ascending: false })
      .limit(50000),
  ]);

  const lines: string[] = [];

  lines.push(csvLine("PENJUALAN PER INVOICE"));
  lines.push(csvLine("Invoice", "Tanggal", "Pelanggan", "Metode", "Subtotal", "Diskon", "Total"));
  let salesTotal = 0;
  for (const s of sales || []) {
    const cust: any = Array.isArray(s.customer) ? s.customer[0] : s.customer;
    salesTotal += Number(s.grand_total || 0);
    lines.push(
      csvLine(
        s.invoice_number,
        fmtDate(s.created_at),
        cust?.name || "Umum",
        s.payment_method,
        Number(s.subtotal || 0),
        Number(s.discount || 0),
        Number(s.grand_total || 0)
      )
    );
  }
  lines.push(csvLine("TOTAL", "", "", "", "", "", salesTotal));
  lines.push("");

  lines.push(csvLine("RINCIAN BARANG"));
  lines.push(csvLine("Invoice", "Tanggal", "Produk", "Satuan", "Qty", "Harga/Unit", "Subtotal"));
  for (const it of items || []) {
    const sale: any = Array.isArray(it.sale) ? it.sale[0] : it.sale;
    const prod: any = Array.isArray(it.product) ? it.product[0] : it.product;
    lines.push(
      csvLine(
        sale?.invoice_number || "",
        fmtDate(it.created_at),
        prod?.name || "Produk dihapus",
        it.unit,
        Number(it.quantity),
        Number(it.unit_price),
        Number(it.subtotal)
      )
    );
  }
  lines.push("");

  lines.push(csvLine("RINCIAN DIGITAL"));
  lines.push(
    csvLine("Tanggal", "Invoice", "Jenis", "Nomor/ID", "Nominal", "Biaya Admin", "Biaya Modal", "Profit", "Total Dibebankan")
  );
  let digitalTotal = 0;
  let digitalProfit = 0;
  for (const d of digital || []) {
    const type: any = Array.isArray(d.digital_type) ? d.digital_type[0] : d.digital_type;
    digitalTotal += Number(d.total_charged || 0);
    digitalProfit += Number(d.profit || 0);
    lines.push(
      csvLine(
        fmtDate(d.created_at),
        d.invoice_number || "",
        type?.name || "-",
        d.customer_identifier,
        Number(d.amount),
        Number(d.admin_fee),
        Number(d.cost),
        Number(d.profit),
        Number(d.total_charged)
      )
    );
  }
  lines.push(csvLine("TOTAL", "", "", "", "", "", "", digitalProfit, digitalTotal));

  return {
    fileName: "laporan-penjualan-" + from + "_" + to + ".csv",
    csv: "\uFEFF" + lines.join("\r\n"),
  };
}