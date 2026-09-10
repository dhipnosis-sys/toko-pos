import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/dal";
import { rupiah, formatDateOnly } from "@/lib/utils";
import { Card, EmptyState, PageHeader, Badge } from "@/components/ui";
import { Flash, Table, THead, Th, Td } from "@/components/Flash";
import { DeleteButton } from "@/components/DeleteButton";
import { SearchBox } from "@/components/SearchBox";
import { deleteCustomer } from "@/app/actions/customers";

export default async function CustomersPage(props: PageProps<"/customers">) {
  await getCurrentUser();
  const q = (await props.searchParams).q;
  const search = typeof q === "string" ? q.trim() : "";

  const supabase = await createClient();
  let query = supabase
    .from("customers")
    .select("id, name, phone, city, total_debt, debt_limit, created_at")
    .order("name");
  if (search) {
    query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%,city.ilike.%${search}%`);
  }
  const { data: customers } = await query;

  return (
    <div>
      <PageHeader
        title="Pelanggan"
        subtitle="Data pelanggan dan piutang"
        action={
          <Link
            href="/customers/create"
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
          >
            + Pelanggan
          </Link>
        }
      />
      <Flash searchParams={props.searchParams} />
      <Card>
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between gap-3">
          <p className="text-sm text-gray-500">{customers?.length || 0} pelanggan</p>
          <SearchBox placeholder="Cari nama / telepon / kota..." />
        </div>
        {!customers || customers.length === 0 ? (
          <EmptyState message={search ? "Tidak ditemukan" : "Belum ada pelanggan"} />
        ) : (
          <Table>
            <THead>
              <Th>Nama</Th>
              <Th>Telepon</Th>
              <Th>Kota</Th>
              <Th right>Piutang</Th>
              <Th right>Limit</Th>
              <Th>Terdaftar</Th>
              <Th right>Aksi</Th>
            </THead>
            <tbody className="divide-y divide-gray-100">
              {customers.map((c: any) => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <Td>
                    <Link href={"/customers/" + c.id} className="font-medium text-gray-900 hover:text-emerald-700">
                      {c.name}
                    </Link>
                  </Td>
                  <Td>{c.phone || "-"}</Td>
                  <Td>{c.city || "-"}</Td>
                  <Td right>
                    {Number(c.total_debt) > 0 ? (
                      <Badge className="bg-red-50 text-red-600">{rupiah(c.total_debt)}</Badge>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </Td>
                  <Td right>{rupiah(c.debt_limit)}</Td>
                  <Td>{formatDateOnly(c.created_at)}</Td>
                  <Td right>
                    <span className="inline-flex items-center gap-2">
                      {Number(c.total_debt) > 0 && (
                        <Link
                          href={"/customers/" + c.id + "/pay"}
                          className="rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-100"
                        >
                          Bayar
                        </Link>
                      )}
                      <Link
                        href={"/customers/" + c.id + "/edit"}
                        className="rounded-lg bg-gray-50 border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100"
                      >
                        Edit
                      </Link>
                      <DeleteButton
                        action={deleteCustomer}
                        id={c.id}
                        confirmText="Hapus?"
                      />
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