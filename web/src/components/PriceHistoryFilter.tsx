"use client";

import { useRouter, useSearchParams } from "next/navigation";

export function PriceHistoryFilter({
  products,
  suppliers,
}: {
  products: { id: number; name: string }[];
  suppliers: { id: number; name: string }[];
}) {
  const router = useRouter();
  const sp = useSearchParams();
  const product = sp.get("product") || "";
  const supplier = sp.get("supplier") || "";

  function apply(key: string, value: string) {
    const params = new URLSearchParams(sp.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.replace("/price-history?" + params.toString());
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-500">Produk</label>
        <select
          value={product}
          onChange={(e) => apply("product", e.target.value)}
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <option value="">Semua produk</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-500">Supplier</label>
        <select
          value={supplier}
          onChange={(e) => apply("supplier", e.target.value)}
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <option value="">Semua supplier</option>
          {suppliers.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}