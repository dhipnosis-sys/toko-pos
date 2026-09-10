import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/dal";
import { PrintButton } from "@/components/PrintButton";
import { rupiah, formatDateTime, getSetting, unitLabels, paymentMethodLabels } from "@/lib/utils";

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

  return (
    <div className="min-h-screen bg-gray-100 p-4 print:bg-white print:p-0">
      <div className="mx-auto max-w-sm print:max-w-none">
        <div className="mb-4 hidden print:block" />
        <div className="no-print mb-4 flex justify-center gap-2">
          <PrintButton />
          <Link
            href={"/sales/" + sale.id}
            className="rounded-lg bg-white border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Kembali
          </Link>
        </div>

        <div className="receipt-print rounded-xl bg-white p-5 shadow print:rounded-none print:shadow-none print:p-2">
          <div className="text-center">
            <h1 className="text-lg font-bold uppercase tracking-wide text-gray-900">{storeName}</h1>
            {storeAddress && <p className="text-xs text-gray-600">{storeAddress}</p>}
            {storePhone && <p className="text-xs text-gray-600">Telp: {storePhone}</p>}
          </div>

          <div className="my-3 border-t border-dashed border-gray-300" />

          <div className="text-xs text-gray-700 space-y-0.5">
            <div className="flex justify-between">
              <span>Invoice</span>
              <span className="font-medium">{sale.invoice_number}</span>
            </div>
            <div className="flex justify-between">
              <span>Tanggal</span>
              <span>{formatDateTime(sale.created_at)}</span>
            </div>
            <div className="flex justify-between">
              <span>Kasir</span>
              <span>{sale.profile?.name || "-"}</span>
            </div>
            <div className="flex justify-between">
              <span>Pelanggan</span>
              <span>{sale.customer?.name || "Umum"}</span>
            </div>
            <div className="flex justify-between">
              <span>Metode</span>
              <span>{paymentMethodLabels[sale.payment_method] || sale.payment_method}</span>
            </div>
          </div>

          <div className="my-3 border-t border-dashed border-gray-300" />

          <table className="w-full text-xs text-gray-800">
            <thead>
              <tr className="border-b border-gray-200 text-gray-500">
                <th className="pb-1 text-left font-medium">Item</th>
                <th className="pb-1 text-center font-medium">Qty</th>
                <th className="pb-1 text-right font-medium">Harga</th>
                <th className="pb-1 text-right font-medium">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {(sale.items || []).map((it: any) => (
                <tr key={it.id}>
                  <td className="py-1">
                    <div className="max-w-[140px] leading-tight">
                      {it.product?.name || "Produk #" + it.product_id}
                    </div>
                    <div className="text-[10px] text-gray-400">
                      {unitLabels[it.unit || it.product?.unit || "pcs"]}
                    </div>
                  </td>
                  <td className="py-1 text-center">{it.quantity}</td>
                  <td className="py-1 text-right">{rupiah(it.unit_price)}</td>
                  <td className="py-1 text-right">{rupiah(it.subtotal)}</td>
                </tr>
              ))}
              {(digitalSales || []).map((d: any) => (
                <tr key={"d" + d.id}>
                  <td className="py-1">
                    <div className="max-w-[140px] leading-tight">{d.digital_type?.name || "Digital"}</div>
                    <div className="text-[10px] text-gray-400">{d.customer_identifier}</div>
                  </td>
                  <td className="py-1 text-center">-</td>
                  <td className="py-1 text-right">{rupiah(d.amount + d.admin_fee)}</td>
                  <td className="py-1 text-right">{rupiah(d.total_charged)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="my-3 border-t border-dashed border-gray-300" />

          <div className="space-y-1 text-xs text-gray-800">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{rupiah(sale.subtotal)}</span>
            </div>
            {Number(sale.discount) > 0 && (
              <div className="flex justify-between">
                <span>Diskon</span>
                <span>-{rupiah(sale.discount)}</span>
              </div>
            )}
            {(digitalSales || []).length > 0 && (
              <div className="flex justify-between">
                <span>Layanan Digital</span>
                <span>
                  {rupiah(
                    (digitalSales as any[]).reduce((a: number, d: any) => a + Number(d.total_charged || 0), 0)
                  )}
                </span>
              </div>
            )}
            <div className="flex justify-between text-sm font-bold text-gray-900">
              <span>Total</span>
              <span>{rupiah(sale.grand_total)}</span>
            </div>
            <div className="flex justify-between">
              <span>Dibayar</span>
              <span>{rupiah(sale.paid_amount)}</span>
            </div>
            {Number(sale.change_amount) > 0 && (
              <div className="flex justify-between">
                <span>Kembalian</span>
                <span>{rupiah(sale.change_amount)}</span>
              </div>
            )}
          </div>

          <div className="my-3 border-t border-dashed border-gray-300" />
          <p className="text-center text-xs text-gray-600">
            Terima kasih atas kunjungan Anda!
            <br />
            Barang yang sudah dibeli tidak dapat ditukar.
          </p>
        </div>
      </div>
    </div>
  );
}