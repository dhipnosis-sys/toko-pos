import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/dal";
import { rupiah, formatDateTime, unitLabels } from "@/lib/utils";
import { Card, CardHeader, StatusBadge as UiStatusBadge, Badge, EmptyState } from "@/components/ui";
import { Flash, Table, THead, Th, Td, LinkBack } from "@/components/Flash";
import {
  processProduction,
  cancelProduction,
  applyProductionCost,
} from "@/app/actions/production";

export default async function ProductionDetailPage(props: PageProps<"/production/[id]">) {
  await getCurrentUser();
  const { id } = await props.params;
  const orderId = Number(id);
  if (Number.isNaN(orderId)) notFound();

  const supabase = await createClient();
  const { data: order } = await supabase
    .from("production_orders")
    .select("*, product:products(name, unit), profile:profiles(name), items:production_order_items(*, product:products(name, unit))")
    .eq("id", orderId)
    .single();
  if (!order) notFound();

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{order.order_number}</h1>
          <p className="text-sm text-gray-500 mt-1">
            {formatDateTime(order.created_at)} · oleh {order.profile?.name || "-"}
          </p>
        </div>
        <LinkBack href="/production" />
      </div>
      <Flash searchParams={props.searchParams} />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="px-5 py-4">
          <p className="text-sm text-gray-500">Hasil Jadi</p>
          <p className="mt-1 font-semibold text-gray-900">
            {order.finished_good_type === "product"
              ? order.product?.name || "Produk dihapus"
              : order.finished_good_name || "Manual"}
          </p>
        </Card>
        <Card className="px-5 py-4">
          <p className="text-sm text-gray-500">Jumlah</p>
          <p className="mt-1 font-semibold text-gray-900">
            {order.quantity}{" "}
            {order.finished_good_type === "product"
              ? unitLabels[order.product?.unit || "pcs"] || ""
              : ""}
          </p>
        </Card>
        <Card className="px-5 py-4">
          <p className="text-sm text-gray-500">Status</p>
          <p className="mt-1"><UiStatusBadge status={order.status} /></p>
        </Card>
        <Card className="px-5 py-4">
          <p className="text-sm text-gray-500">Total Biaya / HPP per Unit</p>
          <p className="mt-1 text-lg font-bold text-gray-900">
            {rupiah(order.total_cost)} / {rupiah(order.cost_per_unit)}
          </p>
        </Card>
      </div>

      <Card>
        <CardHeader title="Bahan Terpakai" />
        {!order.items || order.items.length === 0 ? (
          <EmptyState message="Belum ada bahan" />
        ) : (
          <Table>
            <THead>
              <Th>Bahan</Th>
              <Th>Tipe</Th>
              <Th right>Rencana</Th>
              <Th right>Terpakai</Th>
              <Th right>Harga</Th>
              <Th right>Total</Th>
            </THead>
            <tbody className="divide-y divide-gray-100">
              {(order.items || []).map((it: any) => (
                <tr key={it.id}>
                  <Td>{it.item_type === "product" ? it.product?.name : it.item_name || "Manual"}</Td>
                  <Td>
                    {it.item_type === "product" ? (
                      <Badge className="bg-gray-100 text-gray-600">Produk</Badge>
                    ) : (
                      <Badge className="bg-sky-100 text-sky-700">Manual</Badge>
                    )}
                  </Td>
                  <Td right>{it.quantity_planned}</Td>
                  <Td right>{it.quantity_used > 0 ? it.quantity_used : "-"}</Td>
                  <Td right>{rupiah(it.unit_cost)}</Td>
                  <Td right>{rupiah(it.subtotal)}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
        <div className="px-5 py-4 bg-gray-50 border-t border-gray-100 space-y-1.5 text-sm">
          <div className="flex justify-between text-gray-600">
            <span>Bahan baku</span>
            <span>{rupiah(order.total_raw_material_cost)}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>Tenaga kerja</span>
            <span>{rupiah(order.total_labor_cost)}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>Overhead</span>
            <span>{rupiah(order.total_overhead_cost)}</span>
          </div>
          <div className="flex justify-between font-semibold text-gray-900">
            <span>Total biaya</span>
            <span>{rupiah(order.total_cost)}</span>
          </div>
          {order.notes && <p className="pt-2 text-xs text-gray-500">Catatan: {order.notes}</p>}
        </div>
      </Card>

      {/* Actions */}
      <Card className="p-5">
        <div className="flex flex-wrap items-center gap-3">
          {order.status === "planned" && (
            <>
              <form action={processProduction.bind(null, orderId)}>
                <button
                  type="submit"
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
                >
                  Proses Produksi (gunakan stok bahan)
                </button>
              </form>
              <form action={cancelProduction.bind(null, orderId)}>
                <button
                  type="submit"
                  className="rounded-lg bg-red-50 border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-100"
                >
                  Batalkan
                </button>
              </form>
            </>
          )}
          {order.status === "completed" && (
            <form action={applyProductionCost.bind(null, orderId)}>
              <button
                type="submit"
                disabled={order.apply_cost_price}
                className={
                  "rounded-lg px-4 py-2 text-sm font-medium " +
                  (order.apply_cost_price
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-gray-900 text-white hover:bg-gray-800")
                }
              >
                {order.apply_cost_price
                  ? "HPP sudah diterapkan ke produk"
                  : "Terapkan HPP ke harga modal produk"}
              </button>
            </form>
          )}
        </div>
      </Card>
    </div>
  );
}