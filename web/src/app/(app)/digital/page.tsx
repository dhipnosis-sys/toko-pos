import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/dal";
import { rupiah, formatDateTime, paymentMethodLabels, todayStartISO, monthStartISO } from "@/lib/utils";
import { Card, CardHeader, PageHeader, Badge, StatCard, EmptyState, Label, Input, Textarea, btn } from "@/components/ui";
import { Flash, Table, THead, Th, Td } from "@/components/Flash";
import { topUpDigitalModal, saveDigitalType, toggleDigitalType } from "@/app/actions/digital";

type Tx = {
  id: number;
  invoice_number: string | null;
  customer_identifier: string;
  amount: number;
  admin_fee: number;
  cost: number;
  profit: number;
  total_charged: number;
  payment_method: string;
  created_at: string;
  digital_type: { id: number; name: string } | null;
  sale: { id: number; invoice_number: string } | null;
  user: { name: string } | null;
};

function normalize(r: any, key: string) {
  return Array.isArray(r[key]) ? r[key][0] : r[key] || null;
}

export default async function DigitalPage(props: PageProps<"/digital">) {
  const profile = await requireRole(["owner", "cashier"]);
  const isOwner = profile.role === "owner";
  const sp = await props.searchParams;
  const filterType = typeof sp.type === "string" ? Number(sp.type) || 0 : 0;

  const supabase = await createClient();
  const todayISO = todayStartISO();
  const monthISO = monthStartISO();

  const [{ data: types }, { data: modal }, { data: txs }, { data: today }, { data: month }] =
    await Promise.all([
      supabase.from("digital_types").select("id, name, reduces_balance, is_active").order("name"),
      supabase.from("digital_modal").select("balance").eq("id", 1).single(),
      supabase
        .from("digital_sales")
        .select(
          "id, invoice_number, customer_identifier, amount, admin_fee, cost, profit, total_charged, payment_method, created_at, user:profiles(id, name), digital_type:digital_types(id, name), sale:sales(id, invoice_number)"
        )
        .order("created_at", { ascending: false })
        .limit(100),
      supabase.from("digital_sales").select("total_charged, profit").gte("created_at", todayISO),
      supabase.from("digital_sales").select("total_charged, profit").gte("created_at", monthISO),
    ]);

  const sum = (rows: any[] | null, key: string) =>
    (rows || []).reduce((acc: number, r: any) => acc + Number(r[key] || 0), 0);

  const todayTotal = sum(today, "total_charged");
  const todayProfit = sum(today, "profit");
  const monthTotal = sum(month, "total_charged");
  const monthProfit = sum(month, "profit");

  const rows: Tx[] = (txs || [])
    .filter((r: any) => (filterType ? Number(r.transaction_type_id) === filterType : true))
    .map((r: any) => ({
      id: r.id,
      invoice_number: r.invoice_number,
      customer_identifier: r.customer_identifier,
      amount: r.amount,
      admin_fee: r.admin_fee,
      cost: r.cost,
      profit: r.profit,
      total_charged: r.total_charged,
      payment_method: r.payment_method,
      created_at: r.created_at,
      digital_type: normalize(r, "digital_type"),
      sale: normalize(r, "sale"),
      user: normalize(r, "user"),
    }));

  const modalBalance = Number(modal?.balance || 0);
  const activeTypes = (types || []).filter((t: any) => t.is_active);

  return (
    <div>
      <PageHeader
        title="Penjualan Digital"
        subtitle="Layanan digital dicatat bersama transaksi di kasir (POS)"
        action={
          <Link href="/pos" className={btn.primary}>
            Buka Kasir (POS)
          </Link>
        }
      />

      <Flash searchParams={props.searchParams} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Omzet Digital Hari Ini" value={rupiah(todayTotal)} />
        <StatCard label="Omzet Digital Bulan Ini" value={rupiah(monthTotal)} />
        <StatCard label="Keuntungan Admin Hari Ini" value={rupiah(todayProfit)} accent="text-emerald-600" />
        <StatCard label="Keuntungan Admin Bulan Ini" value={rupiah(monthProfit)} accent="text-emerald-600" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader title="Modal Digital (Gabung)" subtitle="Satu saldo untuk semua layanan digital" />
            <div className="p-5">
              <p className="text-sm text-gray-500">Saldo saat ini</p>
              <p className="mt-1 text-2xl font-bold text-emerald-700">{rupiah(modalBalance)}</p>
              <p className="mt-1 text-xs text-gray-400">
                Dipotong oleh layanan berlabel &quot;kurangi saldo&quot;.
              </p>

              {isOwner && (
                <form action={topUpDigitalModal} className="mt-4 space-y-2">
                  <div>
                    <Label htmlFor="topup-amount" required>
                      Tambah Modal (Rp)
                    </Label>
                    <Input id="topup-amount" name="amount" type="number" min={1} required />
                  </div>
                  <div>
                    <Label htmlFor="topup-notes">Catatan</Label>
                    <Input id="topup-notes" name="notes" placeholder="opsional" />
                  </div>
                  <button type="submit" className={btn.primary + " w-full"}>
                    + Tambah Modal
                  </button>
                </form>
              )}
            </div>
          </Card>

          <Card>
            <CardHeader title="Jenis Layanan" subtitle={(types || []).length + " jenis"} />
            <div className="divide-y divide-gray-100">
              {(types || []).map((t: any) => (
                <div key={t.id} className="p-4 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-gray-900">{t.name}</p>
                      <Badge className={t.reduces_balance ? "bg-sky-100 text-sky-700" : "bg-amber-100 text-amber-700"}>
                        {t.reduces_balance ? "Kurangi saldo" : "Tanpa saldo"}
                      </Badge>
                      <Badge className={t.is_active ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}>
                        {t.is_active ? "Aktif" : "Nonaktif"}
                      </Badge>
                    </div>
                  </div>
                  {isOwner && (
                    <form action={toggleDigitalType}>
                      <input type="hidden" name="type_id" value={t.id} />
                      <input type="hidden" name="is_active" value={t.is_active ? "off" : "on"} />
                      <button type="submit" className="text-xs text-gray-500 hover:text-gray-800 underline">
                        {t.is_active ? "Nonaktifkan" : "Aktifkan"}
                      </button>
                    </form>
                  )}
                </div>
              ))}
              {(types || []).length === 0 && <EmptyState message="Belum ada jenis digital" />}
            </div>
            {isOwner && (
              <div className="border-t border-gray-100 p-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Tambah Jenis Digital</p>
                <form action={saveDigitalType} className="space-y-2">
                  <div>
                    <Label htmlFor="new-type-name" required>
                      Nama Jenis
                    </Label>
                    <Input id="new-type-name" name="name" placeholder="mis. Pulsa, BPJS, ..." required />
                  </div>
                  <label className="flex items-center gap-2 text-sm text-gray-600">
                    <input type="checkbox" name="reduces_balance" defaultChecked className="accent-emerald-600" />
                    Transaksi mengurangi saldo modal
                  </label>
                  <button type="submit" className={btn.secondary + " w-full"}>
                    Simpan Jenis
                  </button>
                </form>
              </div>
            )}
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card>
            <CardHeader title="Riwayat Transaksi Digital" subtitle="100 transaksi terakhir" />
            <form method="get" className="px-5 py-3 border-b border-gray-100 flex flex-wrap items-center gap-2">
              <select
                name="type"
                defaultValue={filterType || ""}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
              >
                <option value="">Semua jenis</option>
                {(activeTypes as any[]).map((t: any) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
              <button type="submit" className={btn.secondary}>
                Filter
              </button>
              {filterType > 0 && (
                <a href="/digital" className="text-sm text-emerald-600 hover:underline">
                  reset
                </a>
              )}
            </form>
            {rows.length === 0 ? (
              <EmptyState message="Belum ada transaksi digital" />
            ) : (
              <Table>
                <THead>
                  <Th>Tanggal</Th>
                  <Th>Invoice</Th>
                  <Th>Jenis</Th>
                  <Th>Nomor / ID</Th>
                  <Th right>Nominal</Th>
                  <Th right>Admin</Th>
                  <Th right>Profit</Th>
                  <Th right>Total</Th>
                  <Th>Metode</Th>
                </THead>
                <tbody className="divide-y divide-gray-100">
                  {rows.map((r) => (
                    <tr key={r.id} className="hover:bg-gray-50">
                      <Td>{formatDateTime(r.created_at)}</Td>
                      <Td>
                        {r.sale ? (
                          <a href={"/sales/" + (r as any).sale?.id} className="text-emerald-600 hover:underline">
                            <span className="text-emerald-600">{r.sale.invoice_number}</span>
                          </a>
                        ) : (
                          <span className="text-gray-400">{r.invoice_number || "-"}</span>
                        )}
                      </Td>
                      <Td>{r.digital_type?.name || "-"}</Td>
                      <Td>{r.customer_identifier}</Td>
                      <Td right>{rupiah(r.amount)}</Td>
                      <Td right>{rupiah(r.admin_fee)}</Td>
                      <Td right>
                        <span className={r.profit >= 0 ? "text-emerald-600" : "text-red-600"}>
                          {rupiah(r.profit)}
                        </span>
                      </Td>
                      <Td right>{rupiah(r.total_charged)}</Td>
                      <Td>{paymentMethodLabels[r.payment_method] || r.payment_method}</Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}