import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/dal";
import { rupiah, formatDateTime, paymentMethodLabels } from "@/lib/utils";
import { Card, CardHeader, Badge, StatusBadge, EmptyState } from "@/components/ui";
import { Flash, Table, THead, Th, Td, LinkBack } from "@/components/Flash";

export default async function CustomerDetailPage(props: PageProps<"/customers/[id]">) {
  await getCurrentUser();
  const { id } = await props.params;
  const customerId = Number(id);
  if (Number.isNaN(customerId)) notFound();

  const supabase = await createClient();
  const { data: customer } = await supabase
    .from("customers")
    .select("*")
    .eq("id", customerId)
    .single();
  if (!customer) notFound();

  const { data: sales } = await supabase
    .from("sales")
    .select("id, invoice_number, grand_total, paid_amount, payment_method, status, created_at")
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false });

  const { data: payments } = await supabase
    .from("payments")
    .select("amount, payment_method, notes, created_at")
    .eq("payable_type", "sale")
    .in("payable_id", sales?.map((s) => s.id) || [])
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{customer.name}</h1>
          <p className="text-sm text-gray-500 mt-1">
            Terdaftar {formatDateTime(customer.created_at)}
          </p>
        </div>
        <LinkBack href="/customers" />
      </div>
      <Flash searchParams={props.searchParams} />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="px-5 py-4">
          <p className="text-sm text-gray-500">Total Belanja</p>
          <p className="mt-1 text-xl font-bold text-gray-900">{rupiah(customer.total_purchases)}</p>
        </Card>
        <Card className="px-5 py-4">
          <p className="text-sm text-gray-500">Total Bayar</p>
          <p className="mt-1 text-xl font-bold text-emerald-600">{rupiah(customer.total_paid)}</p>
        </Card>
        <Card className="px-5 py-4">
          <p className="text-sm text-gray-500">Sisa Piutang</p>
          <p className="mt-1 text-xl font-bold text-red-600">{rupiah(customer.total_debt)}</p>
        </Card>
        <Card className="px-5 py-4">
          <p className="text-sm text-gray-500">Batas Piutang</p>
          <p className="mt-1 text-xl font-bold text-gray-900">{rupiah(customer.debt_limit)}</p>
        </Card>
      </div>

      <Card>
        <CardHeader title="Info Kontak" />
        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-500">Telepon</p>
            <p className="mt-0.5 text-gray-900">{customer.phone || "-"}</p>
          </div>
          <div>
            <p className="text-gray-500">Email</p>
            <p className="mt-0.5 text-gray-900">{customer.email || "-"}</p>
          </div>
          <div>
            <p className="text-gray-500">Kota</p>
            <p className="mt-0.5 text-gray-900">{customer.city || "-"}</p>
          </div>
          <div>
            <p className="text-gray-500">Alamat</p>
            <p className="mt-0.5 text-gray-900">{customer.address || "-"}</p>
          </div>
          {customer.notes && (
            <div className="sm:col-span-2">
              <p className="text-gray-500">Catatan</p>
              <p className="mt-0.5 text-gray-900">{customer.notes}</p>
            </div>
          )}
        </div>
      </Card>

      <Card>
        <CardHeader title="Riwayat Transaksi" subtitle={String(sales?.length || 0) + " transaksi"} />
        {!sales || sales.length === 0 ? (
          <EmptyState message="Belum ada transaksi" />
        ) : (
          <Table>
            <THead>
              <Th>Invoice</Th>
              <Th>Tanggal</Th>
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
                  <Td>{paymentMethodLabels[s.payment_method] || s.payment_method}</Td>
                  <Td right>{rupiah(s.grand_total)}</Td>
                  <Td right>{rupiah(s.paid_amount)}</Td>
                  <Td>
                    <StatusBadge status={s.status} />
                  </Td>
                  <Td right>
                    <Link
                      href={"/sales/" + s.id}
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
        <CardHeader title="Pembayaran Piutang" subtitle={String(payments?.length || 0) + " pembayaran"} />
        {!payments || payments.length === 0 ? (
          <EmptyState message="Belum ada pembayaran piutang" />
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