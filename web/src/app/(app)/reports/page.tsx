import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/dal";
import {
  rupiah,
  formatDateOnly,
  formatDateTime,
  todayStartISO,
  monthStartISO,
  daysAgoISO,
  paymentMethodLabels,
  unitLabels,
} from "@/lib/utils";
import { Card, CardHeader, StatCard, StatusBadge, EmptyState, Badge } from "@/components/ui";
import { Table, THead, Th, Td } from "@/components/Flash";
import { DashboardChart } from "@/components/DashboardChart";
import ExportReportButton from "@/components/reports/ExportReportButton";

const DAYS = 30;

function labelDate(d: Date): string {
  return d.toLocaleDateString("id-ID", { day: "2-digit", month: "short" });
}

const tabs = [
  ["penjualan", "Penjualan"],
  ["barang", "Barang Terlaris"],
  ["piutang", "Hutang & Piutang"],
];

export default async function ReportsPage(props: PageProps<"/reports">) {
  await getCurrentUser();
  const tab = typeof (await props.searchParams).tab === "string" ? (await props.searchParams).tab : "penjualan";

  const supabase = await createClient();
  const today = todayStartISO();
  const month = monthStartISO();
  const chartStart = daysAgoISO(DAYS - 1);

  const [{ count: salesToday }, { data: chartSales }, { data: methodSales }, { data: topItems }, { data: customerDebts }, { data: supplierDebts }, { data: todaySales }, { data: digitalMonth }, { data: recentDigital }] =
    await Promise.all([
      supabase.from("sales").select("id", { count: "exact", head: true }).gte("created_at", today).eq("status", "completed"),
      supabase.from("sales").select("created_at, grand_total").eq("status", "completed").gte("created_at", chartStart),
      supabase.from("sales").select("payment_method, grand_total").eq("status", "completed").gte("created_at", month),
      supabase
        .from("sale_items")
        .select("quantity, subtotal, product:products(name, unit)")
        .gte("created_at", chartStart)
        .order("created_at", { ascending: false })
        .limit(600),
      supabase.from("customers").select("id, name, total_debt").gt("total_debt", 0).order("total_debt", { ascending: false }),
      supabase.from("suppliers").select("id, name, total_debt").gt("total_debt", 0).order("total_debt", { ascending: false }),
      supabase
        .from("sales")
        .select("id, invoice_number, grand_total, payment_method, status, created_at, customer:customers(name)")
        .eq("status", "completed")
        .gte("created_at", chartStart)
        .order("created_at", { ascending: false }),
      supabase
        .from("digital_sales")
        .select("total_charged, profit, digital_type:digital_types(name)")
        .gte("created_at", month),
      supabase
        .from("digital_sales")
        .select(
          "id, invoice_number, customer_identifier, amount, admin_fee, profit, total_charged, created_at, digital_type:digital_types(name), sale:sales(id, invoice_number)"
        )
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

  const byDay = new Map<string, number>();
  for (let i = DAYS - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    byDay.set(labelDate(d), 0);
  }
  for (const s of chartSales || []) {
    const key = labelDate(new Date(s.created_at));
    if (byDay.has(key)) byDay.set(key, byDay.get(key)! + Number(s.grand_total));
  }
  const chartData = [...byDay.entries()].map(([label, total]) => ({ label, total }));

  const byMethod = new Map<string, number>();
  for (const s of methodSales || []) {
    byMethod.set(s.payment_method, byMethod.get(s.payment_method)! + Number(s.grand_total));
  }

  const productMap = new Map<string, { name: string; unit: string; qty: number; revenue: number }>();
  for (const it of topItems || []) {
    const prod: any = Array.isArray(it.product) ? it.product[0] : it.product;
    const name = prod?.name || "Produk dihapus";
    const cur = productMap.get(name) || { name, unit: prod?.unit || "pcs", qty: 0, revenue: 0 };
    cur.qty += Number(it.quantity);
    cur.revenue += Number(it.subtotal);
    productMap.set(name, cur);
  }
  const topProducts = [...productMap.values()].sort((a, b) => b.qty - a.qty).slice(0, 8);
  const maxQty = Math.max(1, topProducts[0]?.qty || 1);

  const monthSalesTotal = [...byMethod.values()].reduce((a, b) => a + b, 0);

  const digitalTypeMap = new Map<string, { name: string; qty: number; total: number; profit: number }>();
  for (const d of digitalMonth || []) {
    const type: any = Array.isArray(d.digital_type) ? d.digital_type[0] : d.digital_type;
    const name = type?.name || "-";
    const cur = digitalTypeMap.get(name) || { name, qty: 0, total: 0, profit: 0 };
    cur.qty += 1;
    cur.total += Number(d.total_charged || 0);
    cur.profit += Number(d.profit || 0);
    digitalTypeMap.set(name, cur);
  }
  const digitalBreakdown = [...digitalTypeMap.values()].sort((a, b) => b.total - a.total);
  const digitalMonthTotal = digitalBreakdown.reduce((a, b) => a + b.total, 0);
  const digitalMonthProfit = digitalBreakdown.reduce((a, b) => a + b.profit, 0);

  return (
    <div className="space-y-6">
      <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Laporan</h1>

      <div className="flex flex-wrap items-center gap-2 text-sm">
        {tabs.map(([key, label]) => (
          <Link
            key={key}
            href={"/reports?tab=" + key}
            className={
              "rounded-full px-4 py-1.5 font-medium " +
              (tab === key
                ? "bg-emerald-600 text-white"
                : "bg-white border border-gray-300 text-gray-600 hover:bg-gray-50")
            }
          >
            {label}
          </Link>
        ))}
      </div>

      {tab === "penjualan" && (
        <>
          <div className="flex items-center justify-end">
            <ExportReportButton />
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Omzet Hari Ini" value={rupiah(chartData[chartData.length - 1]?.total || 0)} sub={String(salesToday || 0) + " transaksi"} />
            <StatCard label="Omzet Bulan Ini" value={rupiah(monthSalesTotal)} />
            <StatCard label="Omzet 30 Hari" value={rupiah(chartData.reduce((a, b) => a + b.total, 0))} />
            <StatCard label="Transaksi 30 Hari" value={String(todaySales?.length || 0)} />
          </div>

          <Card>
            <CardHeader title="Grafik Omzet" subtitle="30 hari terakhir" />
            <div className="p-5">
              <DashboardChart data={chartData} />
            </div>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader title="Metode Pembayaran" subtitle="Bulan ini" />
              <div className="p-5 space-y-3">
                {[...byMethod.entries()].length === 0 && <p className="text-sm text-gray-400">Belum ada data</p>}
                {[...byMethod.entries()].map(([method, total]) => {
                  const pct = monthSalesTotal ? Math.max(2, (total / monthSalesTotal) * 100) : 0;
                  return (
                    <div key={method}>
                      <div className="mb-1 flex justify-between text-sm">
                        <span className="text-gray-700">{paymentMethodLabels[method] || method}</span>
                        <span className="font-medium text-gray-900">{rupiah(total)}</span>
                      </div>
                      <div className="h-2 rounded-full bg-gray-100">
                        <div className="h-2 rounded-full bg-emerald-500" style={{ width: pct + "%" }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            <Card>
              <CardHeader
                title="Transaksi Terbaru"
                action={<Link href="/sales" className="text-sm text-emerald-600 hover:underline">Semua</Link>}
              />
              {!todaySales || todaySales.length === 0 ? (
                <EmptyState message="Belum ada data" />
              ) : (
                <Table>
                  <THead>
                    <Th>Invoice</Th>
                    <Th>Tanggal</Th>
                    <Th right>Total</Th>
                  </THead>
                  <tbody className="divide-y divide-gray-100">
                    {todaySales.slice(0, 6).map((s: any) => (
                      <tr key={s.id} className="hover:bg-gray-50">
                        <Td>{s.invoice_number}</Td>
                        <Td>{formatDateOnly(s.created_at)}</Td>
                        <Td right>{rupiah(s.grand_total)}</Td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card>
          </div>

          <Card>
            <CardHeader
              title="Penjualan Digital"
              subtitle={"Bulan ini · " + rupiah(digitalMonthTotal) + " · Profit admin " + rupiah(digitalMonthProfit)}
              action={<Link href="/digital" className="text-sm text-emerald-600 hover:underline">Semua</Link>}
            />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 lg:divide-x divide-gray-100">
              <div className="p-5">
                {digitalBreakdown.length === 0 ? (
                  <EmptyState message="Belum ada transaksi digital bulan ini" />
                ) : (
                  <div className="space-y-3">
                    {digitalBreakdown.map((d) => (
                      <div key={d.name}>
                        <div className="mb-1 flex items-center justify-between text-sm">
                          <span className="text-gray-800">{d.name}</span>
                          <span className="text-xs text-gray-500">{d.qty} transaksi</span>
                        </div>
                        <div className="mb-1 flex items-center justify-between text-sm">
                          <span className="text-gray-500 text-xs">Nilai: {rupiah(d.total)}</span>
                          <span className="text-emerald-600 text-xs">Profit: {rupiah(d.profit)}</span>
                        </div>
                        <div className="h-2 rounded-full bg-gray-100">
                          <div
                            className="h-2 rounded-full bg-sky-500"
                            style={{ width: (d.total / Math.max(1, digitalBreakdown[0].total)) * 100 + "%" }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="p-5">
                {!recentDigital || recentDigital.length === 0 ? (
                  <EmptyState message="Belum ada transaksi digital" />
                ) : (
                  <Table>
                    <THead>
                      <Th>Invoice</Th>
                      <Th>Jenis</Th>
                      <Th>Tanggal</Th>
                      <Th right>Total</Th>
                    </THead>
                    <tbody className="divide-y divide-gray-100">
                      {recentDigital.map((d: any) => (
                        <tr key={d.id} className="hover:bg-gray-50">
                          <Td>
                            <Link href={"/sales/" + (Array.isArray(d.sale) ? d.sale[0]?.id : d.sale?.id)} className="text-emerald-600 hover:underline">
                              {d.invoice_number || "-"}
                            </Link>
                          </Td>
                          <Td>{(Array.isArray(d.digital_type) ? d.digital_type[0] : d.digital_type)?.name || "-"}</Td>
                          <Td>{formatDateTime(d.created_at)}</Td>
                          <Td right>{rupiah(d.total_charged)}</Td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                )}
              </div>
            </div>
          </Card>
        </>
      )}

      {tab === "barang" && (
        <Card>
          <CardHeader title="Produk Terlaris" subtitle="Berdasarkan jumlah terjual 30 hari terakhir" />
          <div className="p-5 space-y-4">
            {topProducts.length === 0 && <p className="text-sm text-gray-400">Belum ada data</p>}
            {topProducts.map((p, idx) => (
              <div key={p.name}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="text-gray-800">
                    {idx + 1}. {p.name}
                  </span>
                  <span className="text-gray-500 text-xs">
                    {p.qty} {unitLabels[p.unit]} · {rupiah(p.revenue)}
                  </span>
                </div>
                <div className="h-2.5 rounded-full bg-gray-100">
                  <div
                    className="h-2.5 rounded-full bg-emerald-500"
                    style={{ width: (p.qty / maxQty) * 100 + "%" }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {tab === "piutang" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader title="Piutang Pelanggan" subtitle={String(customerDebts?.length || 0) + " pelanggan"} />
            {!customerDebts || customerDebts.length === 0 ? (
              <EmptyState message="Tidak ada piutang" />
            ) : (
              <Table>
                <THead>
                  <Th>Pelanggan</Th>
                  <Th right>Piutang</Th>
                </THead>
                <tbody className="divide-y divide-gray-100">
                  {customerDebts.map((c: any) => (
                    <tr key={c.id} className="hover:bg-gray-50">
                      <Td>
                        <Link href={"/customers/" + c.id} className="text-gray-900 hover:text-emerald-700">
                          {c.name}
                        </Link>
                      </Td>
                      <Td right>
                        <Badge className="bg-red-50 text-red-600">{rupiah(c.total_debt)}</Badge>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </Card>
          <Card>
            <CardHeader title="Hutang ke Supplier" subtitle={String(supplierDebts?.length || 0) + " supplier"} />
            {!supplierDebts || supplierDebts.length === 0 ? (
              <EmptyState message="Tidak ada hutang" />
            ) : (
              <Table>
                <THead>
                  <Th>Supplier</Th>
                  <Th right>Hutang</Th>
                  <Th right>Aksi</Th>
                </THead>
                <tbody className="divide-y divide-gray-100">
                  {supplierDebts.map((c: any) => (
                    <tr key={c.id} className="hover:bg-gray-50">
                      <Td>
                        <Link href={"/suppliers/" + c.id} className="text-gray-900 hover:text-emerald-700">
                          {c.name}
                        </Link>
                      </Td>
                      <Td right>
                        <Badge className="bg-amber-50 text-amber-600">{rupiah(c.total_debt)}</Badge>
                      </Td>
                      <Td right>
                        <Link href={"/suppliers/" + c.id + "/pay"} className="text-xs text-emerald-600 hover:underline">
                          Bayar
                        </Link>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}