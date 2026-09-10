import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/dal";
import { rupiah, unitLabels } from "@/lib/utils";
import { Card, EmptyState, PageHeader, Badge } from "@/components/ui";
import { Flash, Table, THead, Th, Td } from "@/components/Flash";
import { DeleteButton } from "@/components/DeleteButton";
import { SearchBox } from "@/components/SearchBox";
import { deleteProduct } from "@/app/actions/products";

export default async function ProductsPage(props: PageProps<"/products">) {
  await getCurrentUser();
  const sp = await props.searchParams;
  const search = typeof sp.q === "string" ? sp.q.trim() : "";
  const catFilter = typeof sp.category === "string" ? sp.category.trim() : "";
  const scope = typeof sp.scope === "string" ? sp.scope : "all";

  const supabase = await createClient();
  const { data: categories } = await supabase
    .from("categories")
    .select("id, name")
    .order("name");

  let query = supabase
    .from("products")
    .select(
      "id, name, sku, barcode, unit, stock, min_stock, cost_price, retail_price, is_active, category:categories(name)"
    )
    .order("name");
  if (search) {
    query = query.or(`name.ilike.%${search}%,sku.ilike.%${search}%,barcode.ilike.%${search}%`);
  }
  if (catFilter) query = query.eq("category_id", Number(catFilter));
  if (scope === "active") query = query.eq("is_active", true);
  if (scope === "inactive") query = query.eq("is_active", false);
  if (scope === "low") {
    // fetch a wider set and filter client-side since stock vs min_stock is column comparison
  }

  const { data: products } = await query;

  let display = products || [];
  if (scope === "low") {
    display = display.filter((p: any) => Number(p.stock) <= Number(p.min_stock));
  }

  return (
    <div>
      <PageHeader
        title="Produk"
        subtitle="Daftar barang, harga, dan stok"
        action={
          <Link
            href="/products/create"
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
          >
            + Produk
          </Link>
        }
      />
      <Flash searchParams={props.searchParams} />

      <Card>
        <div className="px-5 py-4 border-b border-gray-100 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-gray-500">{display.length} produk</p>
            <SearchBox placeholder="Cari nama / SKU / barcode..." defaultValue={search} />
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {[
              ["all", "Semua"],
              ["active", "Aktif"],
              ["inactive", "Nonaktif"],
              ["low", "Stok Menipis"],
            ].map(([key, label]) => (
              <Link
                key={key}
                href={"/products?scope=" + key}
                className={
                  "rounded-full px-3 py-1 font-medium " +
                  (scope === key
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200")
                }
              >
                {label}
              </Link>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <Link
              href={"/products?scope=" + scope}
              className={"rounded-full px-3 py-1 font-medium " + (!catFilter ? "bg-sky-100 text-sky-700" : "bg-gray-100 text-gray-600 hover:bg-gray-200")}
            >
              Semua Kategori
            </Link>
            {(categories || []).map((c: any) => (
              <Link
                key={c.id}
                href={"/products?scope=" + scope + "&category=" + c.id}
                className={
                  "rounded-full px-3 py-1 font-medium " +
                  (String(c.id) === catFilter
                    ? "bg-sky-100 text-sky-700"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200")
                }
              >
                {c.name}
              </Link>
            ))}
          </div>
        </div>

        {display.length === 0 ? (
          <EmptyState message={search ? "Tidak ditemukan" : "Belum ada produk"} />
        ) : (
          <Table>
            <THead>
              <Th>Produk</Th>
              <Th>Kategori</Th>
              <Th>Satuan</Th>
              <Th right>Stok</Th>
              <Th right>Harga Retail</Th>
              <Th right>Margin</Th>
              <Th>Status</Th>
              <Th right>Aksi</Th>
            </THead>
            <tbody className="divide-y divide-gray-100">
              {display.map((p: any) => {
                const low = Number(p.stock) <= Number(p.min_stock);
                const margin =
                  Number(p.retail_price) - Number(p.cost_price);
                return (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <Td>
                      <div className="font-medium text-gray-900">{p.name}</div>
                      <div className="text-xs text-gray-400">
                        {p.sku}
                        {p.barcode ? " · " + p.barcode : ""}
                      </div>
                    </Td>
                    <Td>{p.category?.name || "-"}</Td>
                    <Td>{unitLabels[p.unit] || p.unit}</Td>
                    <Td right>
                      {low ? (
                        <Badge className="bg-red-50 text-red-600">
                          {p.stock} / {p.min_stock}
                        </Badge>
                      ) : (
                        <span>
                          {p.stock}
                          <span className="text-gray-400 ml-1">min {p.min_stock}</span>
                        </span>
                      )}
                    </Td>
                    <Td right>{rupiah(p.retail_price)}</Td>
                    <Td right>{rupiah(margin)}</Td>
                    <Td>
                      {p.is_active ? (
                        <Badge className="bg-emerald-100 text-emerald-700">Aktif</Badge>
                      ) : (
                        <Badge className="bg-gray-100 text-gray-500">Nonaktif</Badge>
                      )}
                    </Td>
                    <Td right>
                      <span className="inline-flex items-center gap-2">
                        <Link
                          href={"/price-history?product=" + p.id}
                          className="rounded-lg bg-gray-50 border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100"
                        >
                          Riwayat Harga
                        </Link>
                        <Link
                          href={"/products/" + p.id + "/edit"}
                          className="rounded-lg bg-gray-50 border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100"
                        >
                          Edit
                        </Link>
                        <DeleteButton action={deleteProduct} id={p.id} confirmText="Hapus?" />
                      </span>
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        )}
      </Card>
    </div>
  );
}