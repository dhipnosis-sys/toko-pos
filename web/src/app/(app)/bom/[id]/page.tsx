import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/dal";
import { rupiah, formatDateOnly } from "@/lib/utils";
import { Card, CardHeader, Badge, EmptyState } from "@/components/ui";
import { Flash, Table, THead, Th, Td, LinkBack } from "@/components/Flash";

export default async function BomDetailPage(props: PageProps<"/bom/[id]">) {
  await getCurrentUser();
  const { id } = await props.params;
  const bomId = Number(id);
  if (Number.isNaN(bomId)) notFound();

  const supabase = await createClient();
  const { data: bom } = await supabase
    .from("bill_of_materials")
    .select("*, product:products(name), items:bill_of_material_items(*, product:products(name, unit))")
    .eq("id", bomId)
    .single();
  if (!bom) notFound();

  const raw = (bom.items || []).reduce(
    (a: number, it: any) => a + Number(it.quantity) * Number(it.unit_cost),
    0
  );
  const totalCost = raw + bom.labor_cost + bom.overhead_cost;
  const profit =
    bom.profit_type === "percentage"
      ? (totalCost * bom.profit_value) / 100
      : bom.profit_value;
  const suggested = totalCost + profit;

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{bom.name}</h1>
          <p className="text-sm text-gray-500 mt-1">
            Hasil jadi:{" "}
            {bom.finished_good_type === "product" ? bom.product?.name : bom.finished_good_name || "Manual"}{" "}
            · Dibuat {formatDateOnly(bom.created_at)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/production/create"
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
          >
            Jalankan Produksi
          </Link>
          <LinkBack href="/bom" />
        </div>
      </div>
      <Flash searchParams={props.searchParams} />

      <Card>
        <CardHeader title="Rincian Bahan" subtitle={"Batch produksi: " + bom.quantity + (bom.unit ? " " + bom.unit : "")} />
        {!bom.items || bom.items.length === 0 ? (
          <EmptyState message="Belum ada bahan" />
        ) : (
          <Table>
            <THead>
              <Th>Bahan</Th>
              <Th>Tipe</Th>
              <Th right>Qty</Th>
              <Th right>Harga Satuan</Th>
              <Th right>Subtotal</Th>
            </THead>
            <tbody className="divide-y divide-gray-100">
              {(bom.items || []).map((it: any) => (
                <tr key={it.id}>
                  <Td>
                    <span className="font-medium text-gray-900">
                      {it.item_type === "product" ? it.product?.name : it.item_name || "Manual"}
                    </span>
                  </Td>
                  <Td>
                    {it.item_type === "product" ? (
                      <Badge className="bg-gray-100 text-gray-600">Produk</Badge>
                    ) : (
                      <Badge className="bg-sky-100 text-sky-700">Manual</Badge>
                    )}
                  </Td>
                  <Td right>
                    {it.quantity} {it.item_unit || it.product?.unit || ""}
                  </Td>
                  <Td right>{rupiah(it.unit_cost)}</Td>
                  <Td right>{rupiah(Number(it.quantity) * Number(it.unit_cost))}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
        <div className="px-5 py-4 bg-gray-50 border-t border-gray-100 space-y-1.5 text-sm">
          <div className="flex justify-between text-gray-600">
            <span>Bahan baku</span>
            <span>{rupiah(raw)}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>Tenaga kerja</span>
            <span>{rupiah(bom.labor_cost)}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>Overhead</span>
            <span>{rupiah(bom.overhead_cost)}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>Profit ({bom.profit_type === "percentage" ? bom.profit_value + "%" : "nominal"})</span>
            <span>{rupiah(profit)}</span>
          </div>
          <div className="flex justify-between font-semibold text-gray-900 pt-1">
            <span>Total biaya</span>
            <span>{rupiah(totalCost)}</span>
          </div>
          <div className="flex justify-between text-emerald-600 font-semibold">
            <span>Harga jual disarankan</span>
            <span>{rupiah(suggested)}</span>
          </div>
          {bom.notes && <p className="pt-2 text-xs text-gray-500">Catatan: {bom.notes}</p>}
        </div>
      </Card>
    </div>
  );
}