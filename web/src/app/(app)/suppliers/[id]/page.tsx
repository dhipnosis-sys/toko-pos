import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/dal";
import { rupiah, formatDateTime, paymentMethodLabels } from "@/lib/utils";
import { Card, CardHeader, Badge, StatusBadge, EmptyState } from "@/components/ui";
import { Flash, Table, THead, Th, Td, LinkBack } from "@/components/Flash";

export default async function SupplierDetailPage(props: PageProps<"/suppliers/[id]">) {
  await getCurrentUser();
  const { id } = await props.params;
  const supplierId = Number(id);
  if (Number.isNaN(supplierId)) notFound();

  const supabase = await createClient();
  const { data: supplier } = await supabase
    .from("suppliers")
    .select("*")
    .eq("id", supplierId)
    .single();
  if (!supplier) notFound();

  const { data: purchases } = await supabase
    .from("purchases")
    .select("id, invoice_number, grand_total, status, created_at")
    .eq("supplier_id", supplierId)
    .order("created_at", { ascending: false });

  const { data: payments } = await supabase
    .from("payments")
    .select("amount, payment_method, notes, created_at")
    .eq("payable_type", "supplier")
    .eq("payable_id", supplierId)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{supplier.name}</h1>
          <p className="text-sm text-gray-500 mt-1">Terdaftar {formatDateTime(supplier.created_at)}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={"/suppliers/" + supplierId + "/pay"}
            className="inline-flex items-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
          >
            Bayar Hutang
          </Link>
          <LinkBack href="/suppliers" />
        </div>
      </div>
      <Flash searchParams={props.searchParams} />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="px-5 py-4">
          <p className="text-sm text-gray-500">Total Pembelian</p>
          <p className="mt-1 text-xl font-bold text-gray-900">{rupiah(supplier.total_purchases)}</p>
        </Card>
        <Card className="px-5 py-4">
          <p className="text-sm text-gray-500">Total Dibayar</p>
          <p className="mt-1 text-xl font-bold text-emerald-600">{rupiah(supplier.total_paid)}</p>
        </Card>
        <Card className="px-5 py-4">
          <p className="text-sm text-gray-500">Sisa Hutang</p>
          <p className="mt-1 text-xl font-bold text-red-600">{rupiah(supplier.total_debt)}</p>
        </Card>
        <Card className="px-5 py-4">
          <p className="text-sm text-gray-500">Saldo Awal</p>
          <p className="mt-1 text-xl font-bold text-gray-900">{rupiah(supplier.opening_balance)}</p>
        </Card>
      </div>

      <Card>
        <CardHeader title="Info Kontak" />
        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-500">Telepon</p>
            <p className="mt-0.5 text-gray-900">{supplier.phone || "-"}</p>
          </div>
          <div>
            <p className="text-gray-500">Email</p>
            <p className="mt-0.5 text-gray-900">{supplier.email || "-"}</p>
          </div>
          <div>
            <p className="text-gray-500">Kota</p>
            <p className="mt-0.5 text-gray-900">{supplier.city || "-"}</p>
          </div>
          <div>
            <p className="text-gray-500">NPWP</p>
            <p className="mt-0.5 text-gray-900">{supplier.tax_id || "-"}</p>
          </div>
          <div className="sm:col-span-2">
            <p className="text-gray-500">Alamat</p>
            <p className="mt-0.5 text-gray-900">{supplier.address || "-"}</p>
          </div>
          {supplier.notes && (
            <div className="sm:col-span-2">
              <p className="text-gray-500">Catatan</p>
              <p className="mt-0.5 text-gray-900">{supplier.notes}</p>
            </div>
          )}
        </div>
      </Card>

      <Card>
        <CardHeader title="Riwayat Pembelian" subtitle={String(purchases?.length || 0) + " transaksi"} />
        {!purchases || purchases.length === 0 ? (
          <EmptyState message="Belum ada pembelian" />
        ) : (
          <Table>
            <THead>
              <Th>Invoice</Th>
              <Th>Tanggal</Th>
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

      <Card>
        <CardHeader title="Pembayaran ke Supplier" subtitle={String(payments?.length || 0) + " pembayaran"} />
        {!payments || payments.length === 0 ? (
          <EmptyState message="Belum ada pembayaran" />
        ) : (
          <Table>
            <THead>
              <Th>Tanggal</Th>
              <Th>Metode</Th>
              <Th>Catatan</Th>
              <Th right>Jumlah</Th>
            </THead>
            <tbody className="divide-y divide-gray-100">
              {payments.map((p: any) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <Td>{formatDateTime(p.created_at)}</Td>
                  <Td>{paymentMethodLabels[p.payment_method] || p.payment_method}</Td>
                  <Td>{p.notes || "-"}</Td>
                  <Td right>
                    <Badge className="bg-emerald-50 text-emerald-700">{rupiah(p.amount)}</Badge>
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