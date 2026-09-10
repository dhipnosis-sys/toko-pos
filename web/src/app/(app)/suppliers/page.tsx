import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/dal";
import { rupiah } from "@/lib/utils";
import { Card, EmptyState, PageHeader, Badge, btn } from "@/components/ui";
import { Flash, Table, THead, Th, Td } from "@/components/Flash";
import { DeleteButton } from "@/components/DeleteButton";
import { SearchBox } from "@/components/SearchBox";
import { deleteSupplier } from "@/app/actions/suppliers";

export default async function SuppliersPage(props: PageProps<"/suppliers">) {
  await getCurrentUser();
  const q = (await props.searchParams).q;
  const search = typeof q === "string" ? q.trim() : "";

  const supabase = await createClient();
  let query = supabase
    .from("suppliers")
    .select("id, name, phone, city, total_purchases, total_paid, total_debt, opening_balance")
    .order("name");
  if (search) {
    query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%,city.ilike.%${search}%`);
  }
  const { data: suppliers } = await query;

  return (
    <div>
      <PageHeader
        title="Supplier"
        subtitle="Pemasok barang dan catatan hutang"
        action={
          <Link
            href="/suppliers/create"
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
          >
            + Supplier
          </Link>
        }
      />
      <Flash searchParams={props.searchParams} />
      <Card>
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between gap-3">
          <p className="text-sm text-gray-500">{suppliers?.length || 0} supplier</p>
          <SearchBox placeholder="Cari nama / telepon / kota..." />
        </div>
        {!suppliers || suppliers.length === 0 ? (
          <EmptyState message={search ? "Tidak ditemukan" : "Belum ada supplier"} />
        ) : (
          <Table>
            <THead>
              <Th>Nama</Th>
              <Th>Telepon</Th>
              <Th>Kota</Th>
              <Th right>Total Beli</Th>
              <Th right>Total Bayar</Th>
              <Th right>Hutang</Th>
              <Th right>Aksi</Th>
            </THead>
            <tbody className="divide-y divide-gray-100">
              {suppliers.map((s: any) => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <Td>
                    <Link href={"/suppliers/" + s.id} className="font-medium text-gray-900 hover:text-emerald-700">
                      {s.name}
                    </Link>
                  </Td>
                  <Td>{s.phone || "-"}</Td>
                  <Td>{s.city || "-"}</Td>
                  <Td right>{rupiah(s.total_purchases)}</Td>
                  <Td right>{rupiah(s.total_paid)}</Td>
                  <Td right>
                    {Number(s.total_debt) > 0 ? (
                      <Badge className="bg-red-50 text-red-600">{rupiah(s.total_debt)}</Badge>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </Td>
                  <Td right>
                    <span className="inline-flex items-center gap-2">
                      <Link
                        href={"/suppliers/" + s.id + "/pay"}
                        className={`${btn.small} ${btn.secondary}`}
                      >
                        Bayar
                      </Link>
                      <Link
                        href={"/suppliers/" + s.id + "/edit"}
                        className="rounded-lg bg-gray-50 border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100"
                      >
                        Edit
                      </Link>
                      <DeleteButton action={deleteSupplier} id={s.id} confirmText="Hapus?" />
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