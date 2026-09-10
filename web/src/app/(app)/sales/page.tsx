import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/dal";
import { rupiah, formatDateTime, paymentMethodLabels } from "@/lib/utils";
import { Card, EmptyState, PageHeader, StatusBadge } from "@/components/ui";
import { Flash, Table, THead, Th, Td } from "@/components/Flash";
import { SearchBox } from "@/components/SearchBox";

export default async function SalesPage(props: PageProps<"/sales">) {
  await getCurrentUser();
  const sp = await props.searchParams;
  const search = typeof sp.q === "string" ? sp.q.trim() : "";
  const status = typeof sp.status === "string" ? sp.status : "all";

  const supabase = await createClient();
  let query = supabase
    .from("sales")
    .select("id, invoice_number, grand_total, paid_amount, payment_method, status, created_at, customer:customers(name)")
    .order("created_at", { ascending: false });
  if (search) query = query.ilike("invoice_number", `%${search}%`);
  if (status !== "all") query = query.eq("status", status);
  const { data: sales } = await query;

  return (
    <div>
      <PageHeader
        title="Penjualan"
        subtitle="Riwayat transaksi penjualan"
        action={
          <Link
            href="/pos"
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
          >
            + Penjualan Baru
          </Link>
        }
      />
      <Flash searchParams={props.searchParams} />

      <Card>
        <div className="px-5 py-4 border-b border-gray-100 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-gray-500">{sales?.length || 0} transaksi</p>
            <SearchBox placeholder="Cari no. invoice..." defaultValue={search} />
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {[
              ["all", "Semua"],
              ["completed", "Selesai"],
              ["pending", "Menunggu"],
              ["cancelled", "Dibatalkan"],
            ].map(([key, label]) => (
              <Link
                key={key}
                href={"/sales?status=" + key}
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

        {!sales || sales.length === 0 ? (
          <EmptyState message={search ? "Tidak ditemukan" : "Belum ada penjualan"} />
        ) : (
          <Table>
            <THead>
              <Th>Invoice</Th>
              <Th>Tanggal</Th>
              <Th>Pelanggan</Th>
              <Th>Metode</Th>
              <Th right>Total</Th>
              <Th right>Dibayar</Th>
              <Th>Status</Th>
              <Th right>Aksi</Th>
            </THead>
            <tbody className="divide-y divide-gray-100">
              {sales.map((s: any) => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <Td>
                    <Link href={"/sales/" + s.id} className="font-medium text-gray-900 hover:text-emerald-700">
                      {s.invoice_number}
                    </Link>
                  </Td>
                  <Td>{formatDateTime(s.created_at)}</Td>
                  <Td>{s.customer?.name || "Umum"}</Td>
                  <Td>{paymentMethodLabels[s.payment_method] || s.payment_method}</Td>
                  <Td right>{rupiah(s.grand_total)}</Td>
                  <Td right>{rupiah(s.paid_amount)}</Td>
                  <Td>
                    <StatusBadge status={s.status} />
                  </Td>
                  <Td right>
                    <span className="inline-flex items-center gap-2">
                      <Link
                        href={"/sales/" + s.id}
                        className="rounded-lg bg-gray-50 border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100"
                      >
                        Detail
                      </Link>
                      <Link
                        href={"/sales/" + s.id + "/print"}
                        className="rounded-lg bg-gray-50 border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100"
                      >
                        Cetak
                      </Link>
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