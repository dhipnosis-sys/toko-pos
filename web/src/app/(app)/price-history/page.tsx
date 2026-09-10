import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/dal";
import { rupiah, formatDateTime, unitLabels } from "@/lib/utils";
import { Card, EmptyState, PageHeader, Badge } from "@/components/ui";
import { Table, THead, Th, Td } from "@/components/Flash";
import { PriceHistoryFilter } from "@/components/PriceHistoryFilter";

type Row = {
  id: number;
  quantity: number;
  cost_price: number;
  subtotal: number;
  product: { id: number; name: string; unit: string } | null;
  purchase: {
    id: number;
    invoice_number: string;
    created_at: string;
    supplier: { id: number; name: string } | null;
  } | null;
};

export default async function PriceHistoryPage(props: PageProps<"/price-history">) {
  await getCurrentUser();
  const sp = await props.searchParams;
  const productId = typeof sp.product === "string" ? Number(sp.product) || 0 : 0;
  const supplierId = typeof sp.supplier === "string" ? Number(sp.supplier) || 0 : 0;

  const supabase = await createClient();
  const [{ data: products }, { data: suppliers }] = await Promise.all([
    supabase.from("products").select("id, name").order("name"),
    supabase.from("suppliers").select("id, name").order("name"),
  ]);

  let query = supabase
    .from("purchase_items")
    .select(
      "id, quantity, cost_price, subtotal, product:products(id, name, unit), purchase:purchases(id, invoice_number, created_at, supplier_id, supplier:suppliers(id, name))"
    )
    .order("created_at", { referencedTable: "purchase", ascending: false });
  if (productId) query = query.eq("product_id", productId);
  if (supplierId) query = query.eq("purchase.supplier_id", supplierId);

  const { data: raw } = await query;
  const rows: Row[] = (raw || [])
    .map((r: any) => ({
      id: r.id,
      quantity: r.quantity,
      cost_price: r.cost_price,
      subtotal: r.subtotal,
      product: Array.isArray(r.product) ? r.product[0] : r.product,
      purchase: (() => {
        const p = Array.isArray(r.purchase) ? r.purchase[0] : r.purchase;
        if (!p) return null;
        return {
          ...p,
          supplier: Array.isArray(p.supplier) ? p.supplier[0] : p.supplier,
        };
      })(),
    }))
    .sort((a, b) => {
      const ta = a.purchase?.created_at || "";
      const tb = b.purchase?.created_at || "";
      return ta < tb ? 1 : ta > tb ? -1 : 0;
    });

  const selectedProduct =
    products?.find((p: any) => Number(p.id) === productId) || null;

  const summaryBySupplier = new Map<string, Row>();
  for (const r of rows) {
    const key = r.purchase?.supplier?.name || "Umum";
    if (!summaryBySupplier.has(key)) summaryBySupplier.set(key, r);
  }
  const summaries = Array.from(summaryBySupplier.entries()).map(([name, r]) => ({
    name,
    cost: r.cost_price,
    date: r.purchase?.created_at,
  }));
  const cheapest = summaries.length
    ? Math.min(...summaries.map((s) => s.cost))
    : 0;

  return (
    <div>
      <PageHeader
        title="Riwayat Harga"
        subtitle="Tracking harga beli dari setiap supplier"
      />

      <Card>
        <div className="px-5 py-4 border-b border-gray-100">
          <PriceHistoryFilter
            products={products || []}
            suppliers={suppliers || []}
          />
        </div>

        {productId && summaries.length > 0 && (
          <div className="px-5 py-5 border-b border-gray-100">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-900">{selectedProduct?.name || "Barang"}</p>
                <p className="text-xs text-gray-500">Harga terakhir per supplier</p>
              </div>
              <p className="text-xs text-gray-400">{rows.length} transaksi</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {summaries.map((s) => (
                <div
                  key={s.name}
                  className={
                    "rounded-xl border p-4 " +
                    (s.cost === cheapest && summaries.length > 1
                      ? "border-emerald-200 bg-emerald-50"
                      : "border-gray-200 bg-gray-50")
                  }
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-gray-700">{s.name}</p>
                    {s.cost === cheapest && summaries.length > 1 && (
                      <Badge className="bg-emerald-100 text-emerald-700">Termurah</Badge>
                    )}
                  </div>
                  <p className="mt-1 text-lg font-bold text-gray-900">{rupiah(s.cost)}</p>
                  <p className="text-xs text-gray-400">{formatDateTime(s.date)}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {rows.length === 0 ? (
          <EmptyState message="Belum ada riwayat pembelian" />
        ) : (
          <Table>
            <THead>
              <Th>Tanggal</Th>
              <Th>Produk</Th>
              <Th>Supplier</Th>
              <Th>Invoice</Th>
              <Th right>Qty</Th>
              <Th right>Harga/Unit</Th>
              <Th right>Total</Th>
            </THead>
            <tbody className="divide-y divide-gray-100">
              {rows.map((r: any) => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <Td>{formatDateTime(r.purchase?.created_at)}</Td>
                  <Td>
                    <div className="font-medium text-gray-900">{r.product?.name}</div>
                    {!productId && (
                      <a
                        href={"/price-history?product=" + r.product?.id}
                        className="text-xs text-emerald-600 hover:underline"
                      >
                        lihat riwayat
                      </a>
                    )}
                  </Td>
                  <Td>{r.purchase?.supplier?.name || "Umum"}</Td>
                  <Td>
                    <a
                      href={"/purchases/" + r.purchase?.id}
                      className="text-emerald-600 hover:underline"
                    >
                      {r.purchase?.invoice_number}
                    </a>
                  </Td>
                  <Td right>
                    {r.quantity} {unitLabels[r.product?.unit] || r.product?.unit || ""}
                  </Td>
                  <Td right>{rupiah(r.cost_price)}</Td>
                  <Td right>{rupiah(r.subtotal)}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    </div>
  );
}