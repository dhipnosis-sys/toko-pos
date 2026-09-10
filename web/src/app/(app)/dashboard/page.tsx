import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/dal";
import {
  rupiah,
  formatDateTime,
  todayStartISO,
  monthStartISO,
  daysAgoISO,
  paymentMethodLabels,
} from "@/lib/utils";
import { Card, CardHeader, StatCard, StatusBadge, EmptyState, Badge } from "@/components/ui";
import { Table, THead, Th, Td } from "@/components/Flash";
import { DashboardChart } from "@/components/DashboardChart";

const DAYS = 30;

function labelDate(d: Date): string {
  return d.toLocaleDateString("id-ID", { day: "2-digit", month: "short" });
}

export default async function DashboardPage() {
  const profile = await getCurrentUser();
  const supabase = await createClient();
  const today = todayStartISO();
  const month = monthStartISO();
  const chartStart = daysAgoISO(DAYS - 1);

  const [
    { count: salesToday },
    ,
    ,
    { count: lowStockTotal },
    { data: recentSales },
    { data: chartSales },
    { data: lowStock },
  ] = await Promise.all([
    supabase.from("sales").select("id", { count: "exact", head: true }).gte("created_at", today).eq("status", "completed"),
    supabase.from("sales").select("id", { count: "exact", head: true }).gte("created_at", month).eq("status", "completed"),
    supabase.from("products").select("id", { count: "exact", head: true }),
    supabase.rpc("count_low_stock"),
    supabase
      .from("sales")
      .select("id, invoice_number, grand_total, payment_method, status, created_at, customer:customers(name)")
      .eq("status", "completed")
      .order("created_at", { ascending: false })
      .limit(8),
    supabase
      .from("sales")
      .select("created_at, grand_total")
      .eq("status", "completed")
      .gte("created_at", chartStart),
    supabase
      .from("products")
      .select("id, name, sku, stock, min_stock, unit")
      .eq("is_active", true)
      .order("stock", { ascending: true })
      .limit(6),
  ]);

  const totalLowStock = Number(lowStockTotal) || 0;
  const actuallyLow = lowStock
    ? lowStock.filter((p: any) => Number(p.stock) <= Number(p.min_stock))
    : [];

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
            Halo, {profile.name} 👋
          </h1>
          <p className="text-sm text-gray-500 mt-1">Ringkasan toko Anda hari ini.</p>
        </div>
        <Link
          href="/pos"
          className="hidden sm:inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-700"
        >
          Buat Penjualan
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Omzet Hari Ini" value={rupiah(chartData[chartData.length - 1]?.total || 0)} />
        <StatCard
          label="Omzet 30 Hari"
          value={rupiah(chartData.reduce((a, b) => a + b.total, 0))}
        />
        <StatCard label="Transaksi Hari Ini" value={String(salesToday || 0)} />
        <StatCard
          label="Stok Menipis"
          value={String(totalLowStock)}
          accent="text-amber-600"
          sub={String(actuallyLow.length) + " terendah"}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader title="Grafik Penjualan" subtitle={"30 hari terakhir" + " (omzet)"} />
          <div className="p-5">
            <DashboardChart data={chartData} />
          </div>
        </Card>

        <Card>
          <CardHeader title="Stok Menipis" action={<Link href="/products" className="text-sm text-emerald-600 hover:underline">Lihat semua</Link>} />
          <div className="divide-y divide-gray-100">
            {actuallyLow.length === 0 ? (
              <div className="px-5 py-6 text-sm text-gray-400">Semua stok aman</div>
            ) : (
              actuallyLow.map((p: any) => (
                <div key={p.id} className="px-5 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{p.name}</p>
                    <p className="text-xs text-gray-400">{p.sku}</p>
                  </div>
                  <Badge className="bg-red-50 text-red-600">
                    {p.stock} / {p.min_stock} {p.unit}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader
          title="Penjualan Terbaru"
          action={<Link href="/sales" className="text-sm text-emerald-600 hover:underline">Lihat semua</Link>}
        />
        {!recentSales || recentSales.length === 0 ? (
          <EmptyState message="Belum ada penjualan" />
        ) : (
          <Table>
            <THead>
              <Th>Invoice</Th>
              <Th>Waktu</Th>
              <Th>Pelanggan</Th>
              <Th>Metode</Th>
              <Th right>Total</Th>
              <Th>Status</Th>
            </THead>
            <tbody className="divide-y divide-gray-100">
              {recentSales.map((s: any) => (
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
                  <Td>
                    <StatusBadge status={s.status} />
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