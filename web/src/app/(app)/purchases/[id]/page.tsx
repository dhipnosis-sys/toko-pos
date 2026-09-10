import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/dal";
import { rupiah, formatDateTime, unitLabels } from "@/lib/utils";
import { Card, CardHeader, StatusBadge } from "@/components/ui";
import { Flash, Table, THead, Th, Td, LinkBack } from "@/components/Flash";

export default async function PurchaseDetailPage(props: PageProps<"/purchases/[id]">) {
  await getCurrentUser();
  const { id } = await props.params;
  const purchaseId = Number(id);
  if (Number.isNaN(purchaseId)) notFound();

  const supabase = await createClient();
  const { data: purchase } = await supabase
    .from("purchases")
    .select("*, supplier:suppliers(name, phone), profile:profiles(name), items:purchase_items(*, product:products(name, unit))")
    .eq("id", purchaseId)
    .single();
  if (!purchase) notFound();

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{purchase.invoice_number}</h1>
          <p className="text-sm text-gray-500 mt-1">
            {formatDateTime(purchase.created_at)} · oleh {purchase.profile?.name || "-"}
          </p>
        </div>
        <LinkBack href="/purchases" />
      </div>
      <Flash searchParams={props.searchParams} />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="px-5 py-4">
          <p className="text-sm text-gray-500">Supplier</p>
          <p className="mt-1 font-semibold text-gray-900">{purchase.supplier?.name || "Umum"}</p>
          {purchase.supplier?.phone && <p className="text-xs text-gray-400">{purchase.supplier.phone}</p>}
        </Card>
        <Card className="px-5 py-4">
          <p className="text-sm text-gray-500">Status</p>
          <p className="mt-1"><StatusBadge status={purchase.status} /></p>
        </Card>
        <Card className="px-5 py-4">
          <p className="text-sm text-gray-500">Total</p>
          <p className="mt-1 text-lg font-bold text-emerald-600">{rupiah(purchase.grand_total)}</p>
        </Card>
      </div>

      <Card>
        <CardHeader title="Item Pembelian" subtitle={String((purchase.items || []).length) + " produk"} />
        <Table>
          <THead>
            <Th>Produk</Th>
            <Th right>Harga Modal</Th>
            <Th right>Qty</Th>
            <Th right>Subtotal</Th>
          </THead>
          <tbody className="divide-y divide-gray-100">
            {(purchase.items || []).map((it: any) => (
              <tr key={it.id}>
                <Td>
                  <span className="font-medium text-gray-900">
                    {it.product?.name || "Produk #" + it.product_id}
                  </span>
                  {it.product?.unit && (
                    <span className="ml-2 text-xs text-gray-400">{unitLabels[it.product.unit]}</span>
                  )}
                </Td>
                <Td right>{rupiah(it.cost_price)}</Td>
                <Td right>{it.quantity}</Td>
                <Td right>{rupiah(it.subtotal)}</Td>
              </tr>
            ))}
          </tbody>
        </Table>
        <div className="px-5 py-4 bg-gray-50 border-t border-gray-100">
          <div className="flex justify-between text-base font-bold text-gray-900">
            <span>Total</span>
            <span>{rupiah(purchase.grand_total)}</span>
          </div>
          {purchase.notes && (
            <p className="pt-2 text-xs text-gray-500">Catatan: {purchase.notes}</p>
          )}
        </div>
      </Card>
    </div>
  );
}