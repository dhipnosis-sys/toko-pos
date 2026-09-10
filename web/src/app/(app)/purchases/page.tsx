import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/dal";
import { rupiah, formatDateTime } from "@/lib/utils";
import { Card, EmptyState, PageHeader, StatusBadge } from "@/components/ui";
import { Flash, Table, THead, Th, Td } from "@/components/Flash";
import { SearchBox } from "@/components/SearchBox";

export default async function PurchasesPage(props: PageProps<"/purchases">) {
  await getCurrentUser();
  const sp = await props.searchParams;
  const search = typeof sp.q === "string" ? sp.q.trim() : "";
  const status = typeof sp.status === "string" ? sp.status : "all";

  const supabase = await createClient();
  let query = supabase
    .from("purchases")
    .select("id, invoice_number, grand_total, status, created_at, supplier:suppliers(name)")
    .order("created_at", { ascending: false });
  if (search) query = query.ilike("invoice_number", `%${search}%`);
  if (status !== "all") query = query.eq("status", status);
  const { data: purchases } = await query;

  return (
    <div>
      <PageHeader
        title="Pembelian"
        subtitle="Riwayat pembelian stok dari supplier"
        action={
          <Link
            href="/purchases/create"
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
          >
            + Pembelian Baru
          </Link>
        }
      />
      <Flash searchParams={props.searchParams} />

      <Card>
        <div className="px-5 py-4 border-b border-gray-100 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-gray-500">{purchases?.length || 0} transaksi</p>
            <SearchBox placeholder="Cari no. invoice..." defaultValue={search} />
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {[
              ["all", "Semua"],
              ["completed", "Selesai"],
              ["pending", "Menunggu"],
            ].map(([key, label]) => (
              <Link
                key={key}
                href={"/purchases?status=" + key}
                className={
                  "rounded-full px-3 py-1 font-medium " +
                  (status === key
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200")
                }
              >
                {label}
              </Link>
            ))}
          </div>
        </div>

        {!purchases || purchases.length === 0 ? (
          <EmptyState message={search ? "Tidak ditemukan" : "Belum ada pembelian"} />
        ) : (
          <Table>
            <THead>
              <Th>Invoice</Th>
              <Th>Tanggal</Th>
              <Th>Supplier</Th>
              <Th right>Total</Th>
              <Th>Status</Th>
              <Th right>Aksi</Th>
            </THead>
            <tbody className="divide-y divide-gray-100">
              {purchases.map((s: any) => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <Td>
                    <Link href={"/purchases/" + s.id} className="font-medium text-gray-900 hover:text-emerald-700">
                      {s.invoice_number}
                    </Link>
                  </Td>
                  <Td>{formatDateTime(s.created_at)}</Td>
                  <Td>{s.supplier?.name || "Umum"}</Td>
                  <Td right>{rupiah(s.grand_total)}</Td>
                  <Td>
                    <StatusBadge status={s.status} />
                  </Td>
                  <Td right>
                    <Link
                      href={"/purchases/" + s.id}
                      className="rounded-lg bg-gray-50 border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100"
                    >
                      Detail
                    </Link>
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