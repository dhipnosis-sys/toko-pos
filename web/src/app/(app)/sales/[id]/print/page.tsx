import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/dal";
import { ReceiptPrinter } from "@/components/ReceiptPrinter";
import { rupiah, getSetting, unitLabels, paymentMethodLabels } from "@/lib/utils";
import { buildReceiptLines, type ReceiptData, type ReceiptItem } from "@/lib/escpos";

/** dd/mm/yy hh:mm — format tanggal pada struk thermal. */
function receiptDate(iso: string | null | undefined): string {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${String(d.getFullYear()).slice(-2)} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

export default async function SalePrintPage(props: PageProps<"/sales/[id]/print">) {
  await getCurrentUser();
  const { id } = await props.params;
  const saleId = Number(id);
  if (Number.isNaN(saleId)) notFound();

  const supabase = await createClient();
  const [{ data: sale }, { data: digitalSales }] = await Promise.all([
    supabase
      .from("sales")
      .select("*, customer:customers(name, phone), profile:profiles(name), items:sale_items(*, product:products(name, unit))")
      .eq("id", saleId)
      .single(),
    supabase
      .from("digital_sales")
      .select("id, customer_identifier, amount, admin_fee, cost, total_charged, digital_type:digital_types(name)")
      .eq("sale_id", saleId)
      .order("id"),
  ]);
  if (!sale) notFound();

  const { data: settings } = await supabase.from("settings").select("key, value");
  const map: Record<string, string> = {};
  (settings || []).forEach((s: any) => (map[s.key] = s.value));
  const storeName = getSetting(map, "store_name", "Warung Nuhahade");
  const storeAddress = getSetting(map, "store_address");
  const storePhone = getSetting(map, "store_phone");

  const digitalTotal = (digitalSales || []).reduce(
    (a: number, d: any) => a + Number(d.total_charged || 0),
    0
  );

  // Data terstruktur untuk printer Bluetooth (ESC/POS 58mm).
  const receiptItems: ReceiptItem[] = [
    ...(sale.items || []).map((it: any) => ({
      name: it.product?.name || "Produk #" + it.product_id,
      qty: Number(it.quantity),
      unit: it.unit || it.product?.unit || "pcs",
      unitPrice: rupiah(it.unit_price),
      subtotal: rupiah(it.subtotal),
      note: unitLabels[it.unit || it.product?.unit || "pcs"],
    })),
    ...(digitalSales || []).map((d: any) => ({
      name: d.digital_type?.name || "Digital",
      qty: 1,
      unit: "pcs",
      unitPrice: rupiah(Number(d.amount) + Number(d.admin_fee)),
      subtotal: rupiah(d.total_charged),
      note: d.customer_identifier || undefined,
    })),
  ];

  const receipt: ReceiptData = {
    storeName,
    storeAddress: storeAddress || undefined,
    storePhone: storePhone || undefined,
    invoice: sale.invoice_number,
    date: receiptDate(sale.created_at),
    cashier: sale.profile?.name || "-",
    customer: sale.customer?.name || "Umum",
    payment: paymentMethodLabels[sale.payment_method] || sale.payment_method,
    items: receiptItems,
    subtotal: rupiah(sale.subtotal),
    discount: Number(sale.discount) > 0 ? rupiah(sale.discount) : undefined,
    digitalTotal: digitalTotal > 0 ? rupiah(digitalTotal) : undefined,
    total: rupiah(sale.grand_total),
    paid: rupiah(sale.paid_amount),
    change: Number(sale.change_amount) > 0 ? rupiah(sale.change_amount) : undefined,
    footer1: "Terima kasih sudah belanja!",
    footer2: "Barang yang sudah dibeli tidak dapat dikembalikan",
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 print:bg-white print:p-0">
      <div className="mx-auto max-w-sm print:max-w-none">
        <div className="no-print mb-4 space-y-2">
          <ReceiptPrinter receipt={receipt} />
          <Link
            href={"/sales/" + sale.id}
            className="block rounded-lg bg-white border border-gray-300 px-4 py-2 text-center text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Kembali
          </Link>
        </div>

        <pre className="receipt-print mx-auto w-full max-w-sm overflow-hidden whitespace-pre rounded-xl bg-white p-5 font-mono text-xs leading-tight text-gray-900 shadow print:w-[58mm] print:max-w-none print:rounded-none print:p-0 print:text-[10px] print:shadow-none">{buildReceiptLines(receipt).map((line, i) => (<span key={i} className={line.bold ? "font-bold" : undefined}>{line.text.replace(/\s+$/, "")}{"\n"}</span>))}</pre>
      </div>
    </div>
  );
}