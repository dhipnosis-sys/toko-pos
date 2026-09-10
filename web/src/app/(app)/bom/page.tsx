import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/dal";
import { rupiah, formatDateOnly } from "@/lib/utils";
import { Card, EmptyState, PageHeader, Badge } from "@/components/ui";
import { Flash, Table, THead, Th, Td } from "@/components/Flash";
import { DeleteButton } from "@/components/DeleteButton";
import { deleteBom } from "@/app/actions/bom";

export default async function BomListPage(props: PageProps<"/bom">) {
  await getCurrentUser();
  const supabase = await createClient();
  const { data: boms } = await supabase
    .from("bill_of_materials")
    .select(
      "id, name, quantity, unit, finished_good_type, finished_good_name, profit_type, profit_value, labor_cost, overhead_cost, created_at, product:products(name), items:bill_of_material_items(id)"
    )
    .order("name");

  return (
    <div>
      <PageHeader
        title="BOM / Resep"
        subtitle="Resep pembuatan produk dan simulasi HPP"
        action={
          <Link
            href="/bom/create"
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
          >
            + Buat BOM
          </Link>
        }
      />
      <Flash searchParams={props.searchParams} />

      <Card>
        {!boms || boms.length === 0 ? (
          <EmptyState message="Belum ada BOM. Buat resep pertama Anda." />
        ) : (
          <Table>
            <THead>
              <Th>Nama</Th>
              <Th>Hasil Jadi</Th>
              <Th>Batch</Th>
              <Th>Jumlah Bahan</Th>
              <Th>Dibuat</Th>
              <Th right>Aksi</Th>
            </THead>
            <tbody className="divide-y divide-gray-100">
              {boms.map((b: any) => (
                <tr key={b.id} className="hover:bg-gray-50">
                  <Td>
                    <Link href={"/bom/" + b.id} className="font-medium text-gray-900 hover:text-emerald-700">
                      {b.name}
                    </Link>
                  </Td>
                  <Td>
                    {b.finished_good_type === "product" ? (
                      b.product?.name || "Produk dihapus"
                    ) : (
                      <Badge className="bg-sky-100 text-sky-700">
                        {b.finished_good_name || "Manual"}
                      </Badge>
                    )}
                  </Td>
                  <Td>
                    {b.quantity} {b.unit || ""}
                  </Td>
                  <Td>{b.items?.length || 0} bahan</Td>
                  <Td>{formatDateOnly(b.created_at)}</Td>
                  <Td right>
                    <span className="inline-flex items-center gap-2">
                      <Link
                        href={"/bom/" + b.id + "/edit"}
                        className="rounded-lg bg-gray-50 border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100"
                      >
                        Edit
                      </Link>
                      <DeleteButton action={deleteBom} id={b.id} confirmText="Hapus?" />
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