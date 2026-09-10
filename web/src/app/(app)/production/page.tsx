import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/dal";
import { rupiah, formatDateTime, unitLabels } from "@/lib/utils";
import { Card, EmptyState, PageHeader, StatusBadge, Badge } from "@/components/ui";
import { Flash, Table, THead, Th, Td } from "@/components/Flash";
import { DeleteButton } from "@/components/DeleteButton";
import { deleteProduction } from "@/app/actions/production";

export default async function ProductionListPage(props: PageProps<"/production">) {
  await getCurrentUser();
  const supabase = await createClient();
  const { data: orders } = await supabase
    .from("production_orders")
    .select(
      "id, order_number, quantity, status, total_cost, cost_per_unit, apply_cost_price, created_at, finished_good_type, finished_good_name, product:products(name), profile:profiles(name)"
    )
    .order("created_at", { ascending: false });

  return (
    <div>
      <PageHeader
        title="Produksi"
        subtitle="Order produksi dari BOM"
        action={
          <Link
            href="/production/create"
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
          >
            + Order Produksi
          </Link>
        }
      />
      <Flash searchParams={props.searchParams} />

      <Card>
        {!orders || orders.length === 0 ? (
          <EmptyState message="Belum ada order produksi" />
        ) : (
          <Table>
            <THead>
              <Th>Order</Th>
              <Th>Hasil Jadi</Th>
              <Th right>Qty</Th>
              <Th right>Biaya</Th>
              <Th right>HPP / Unit</Th>
              <Th>Status</Th>
              <Th>Dibuat</Th>
              <Th right>Aksi</Th>
            </THead>
            <tbody className="divide-y divide-gray-100">
              {orders.map((o: any) => (
                <tr key={o.id} className="hover:bg-gray-50">
                  <Td>
                    <Link href={"/production/" + o.id} className="font-medium text-gray-900 hover:text-emerald-700">
                      {o.order_number}
                    </Link>
                    <div className="text-xs text-gray-400">oleh {o.profile?.name || "-"}</div>
                  </Td>
                  <Td>
                    {o.finished_good_type === "product" ? (
                      o.product?.name || "Produk dihapus"
                    ) : (
                      <Badge className="bg-sky-100 text-sky-700">{o.finished_good_name || "Manual"}</Badge>
                    )}
                  </Td>
                  <Td right>{o.quantity}</Td>
                  <Td right>{rupiah(o.total_cost)}</Td>
                  <Td right>{rupiah(o.cost_per_unit)}</Td>
                  <Td>
                    <StatusBadge status={o.status} />
                    {o.status === "completed" && o.apply_cost_price && (
                      <span className="ml-1 text-[10px] text-emerald-600">HPP diterapkan</span>
                    )}
                  </Td>
                  <Td>{formatDateTime(o.created_at)}</Td>
                  <Td right>
                    <span className="inline-flex items-center gap-2">
                      <Link
                        href={"/production/" + o.id}
                        className="rounded-lg bg-gray-50 border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100"
                      >
                        Detail
                      </Link>
                      {o.status === "planned" && (
                        <DeleteButton action={deleteProduction} id={o.id} confirmText="Hapus?" />
                      )}
                    </span>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    </div>
  );
}