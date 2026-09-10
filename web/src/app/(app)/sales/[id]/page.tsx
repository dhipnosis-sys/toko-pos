import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/dal";
import { rupiah, formatDateTime, paymentMethodLabels, unitLabels } from "@/lib/utils";
import { Card, CardHeader, StatusBadge } from "@/components/ui";
import { Flash, Table, THead, Th, Td, LinkBack } from "@/components/Flash";

export default async function SaleDetailPage(props: PageProps<"/sales/[id]">) {
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
      .select("id, customer_identifier, amount, admin_fee, cost, profit, total_charged, digital_type:digital_types(name)")
      .eq("sale_id", saleId)
      .order("id"),
  ]);
  if (!sale) notFound();

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{sale.invoice_number}</h1>
          <p className="text-sm text-gray-500 mt-1">
            {formatDateTime(sale.created_at)} · Kasir {sale.profile?.name || "-"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={"/sales/" + sale.id + "/print"}
            className="rounded-lg bg-gray-50 border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            Cetak Struk
          </Link>
          <LinkBack href="/sales" />
        </div>
      </div>
      <Flash searchParams={props.searchParams} />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="px-5 py-4">
          <p className="text-sm text-gray-500">Pelanggan</p>
          <p className="mt-1 font-semibold text-gray-900">{sale.customer?.name || "Umum"}</p>
          {sale.customer?.phone && <p className="text-xs text-gray-400">{sale.customer.phone}</p>}
        </Card>
        <Card className="px-5 py-4">
          <p className="text-sm text-gray-500">Metode Bayar</p>
          <p className="mt-1 font-semibold text-gray-900">
            {paymentMethodLabels[sale.payment_method] || sale.payment_method}
          </p>
        </Card>
        <Card className="px-5 py-4">
          <p className="text-sm text-gray-500">Status</p>
          <p className="mt-1"><StatusBadge status={sale.status} /></p>
        </Card>
        <Card className="px-5 py-4">
          <p className="text-sm text-gray-500">Total</p>
          <p className="mt-1 text-lg font-bold text-emerald-600">{rupiah(sale.grand_total)}</p>
        </Card>
      </div>

      <Card>
        <CardHeader title="Item Penjualan" subtitle={String((sale.items || []).length) + " produk" + ((digitalSales || []).length ? " + " + (digitalSales || []).length + " layanan digital" : "")} />
        <Table>
          <THead>
            <Th>Produk</Th>
            <Th right>Harga</Th>
            <Th right>Qty</Th>
            <Th right>Subtotal</Th>
          </THead>
          <tbody className="divide-y divide-gray-100">
            {(sale.items || []).map((it: any) => (
              <tr key={it.id}>
                <Td>
                  <span className="font-medium text-gray-900">{it.product?.name || "Produk #" + it.product_id}</span>
                  <span className="ml-2 text-xs text-gray-400">
                    {unitLabels[it.unit || it.product?.unit || "pcs"]}
                  </span>
                </Td>
                <Td right>{rupiah(it.unit_price)}</Td>
                <Td right>{it.quantity}</Td>
                <Td right>{rupiah(it.subtotal)}</Td>
              </tr>
            ))}
            {(digitalSales || []).map((d: any) => (
              <tr key={"d" + d.id}>
                <Td>
                  <span className="font-medium text-amber-700">{d.digital_type?.name || "Digital"}</span>
                  <span className="ml-2 text-xs text-gray-400">{d.customer_identifier}</span>
                </Td>
                <Td right>{rupiah(d.amount + d.admin_fee)}</Td>
                <Td right>-</Td>
                <Td right>{rupiah(d.total_charged)}</Td>
              </tr>
            ))}
          </tbody>
        </Table>
        <div className="px-5 py-4 space-y-1.5 bg-gray-50 border-t border-gray-100">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Subtotal</span>
            <span>{rupiah(sale.subtotal)}</span>
          </div>
          {Number(sale.discount) > 0 && (
            <div className="flex justify-between text-sm text-gray-600">
              <span>Diskon</span>
              <span>-{rupiah(sale.discount)}</span>
            </div>
          )}
          {Number(sale.tax) > 0 && (
            <div className="flex justify-between text-sm text-gray-600">
              <span>Pajak</span>
              <span>{rupiah(sale.tax)}</span>
            </div>
          )}
          {(digitalSales || []).length > 0 && (
            <div className="flex justify-between text-sm text-gray-600">
              <span>Layanan Digital</span>
              <span>
                {rupiah(
                  (digitalSales as any[]).reduce((a: number, d: any) => a + Number(d.total_charged || 0), 0)
                )}
              </span>
            </div>
          )}
          <div className="flex justify-between text-base font-bold text-gray-900">
            <span>Total</span>
            <span>{rupiah(sale.grand_total)}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-600">
            <span>Dibayar</span>
            <span>{rupiah(sale.paid_amount)}</span>
          </div>
          {Number(sale.change_amount) > 0 && (
            <div className="flex justify-between text-sm text-emerald-600">
              <span>Kembalian</span>
              <span>{rupiah(sale.change_amount)}</span>
            </div>
          )}
          {sale.notes && (
            <p className="pt-2 text-xs text-gray-500">Catatan: {sale.notes}</p>
          )}
        </div>
      </Card>
    </div>
  );
}