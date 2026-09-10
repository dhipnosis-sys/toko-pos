"use client";

import { useMemo, useState } from "react";
import { Plus, Trash2, Search, Save } from "lucide-react";
import { rupiah, unitLabels } from "@/lib/utils";
import type { ProductUnit } from "@/lib/types";
import { Card, btn } from "@/components/ui";
import { createPurchase } from "@/app/actions/purchases";

type PurchaseProduct = {
  id: number;
  name: string;
  sku: string;
  unit: ProductUnit;
  cost_price: number;
  units?: { unit: string; factor: number; is_default?: boolean }[];
};

type Row = {
  product_id: number;
  name: string;
  sku: string;
  unit: ProductUnit;
  factor: number;
  quantity: number;
  cost_price: number;
};

function unitFactor(p: PurchaseProduct, unit: string): number {
  const row = (p.units || []).find((u) => u.unit === unit);
  return row && row.factor > 0 ? row.factor : 1;
}

export default function PurchaseForm({
  products,
  suppliers,
}: {
  products: PurchaseProduct[];
  suppliers: { id: number; name: string }[];
}) {
  const [search, setSearch] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [notes, setNotes] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [pending, setPending] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)
    );
  }, [search, products]);

  function addRow(p: PurchaseProduct) {
    setErrorMsg("");
    setRows((prev) => {
      const found = prev.find((r) => r.product_id === p.id);
      if (found) {
        return prev.map((r) =>
          r.product_id === p.id ? { ...r, quantity: r.quantity + 1 } : r
        );
      }
      return [
        ...prev,
        {
          product_id: p.id,
          name: p.name,
          sku: p.sku,
          unit: p.unit,
          factor: unitFactor(p, p.unit),
          quantity: 1,
          cost_price: p.cost_price,
        },
      ];
    });
  }

  function updateRow(productId: number, patch: Partial<Row>) {
    setRows((prev) => prev.map((r) => (r.product_id === productId ? { ...r, ...patch } : r)));
  }

  function changeUnit(productId: number, unit: string) {
    const p = products.find((x) => x.id === productId);
    if (!p) return;
    const factor = unitFactor(p, unit);
    setRows((prev) =>
      prev.map((r) =>
        r.product_id === productId
          ? {
              ...r,
              unit: unit as ProductUnit,
              factor,
              cost_price: Math.round(r.cost_price / Math.max(r.factor, 0.001) * factor),
            }
          : r
      )
    );
  }

  const decimalUnit = (u: string) => u === "kg" || u === "ltr";
  const total = rows.reduce((a, r) => a + r.quantity * r.cost_price, 0);

  async function submit() {
    if (rows.length === 0) {
      setErrorMsg("Minimal satu produk wajib diisi");
      return;
    }
    setPending(true);
    setErrorMsg("");
    const fd = new FormData();
    if (supplierId) fd.set("supplier_id", supplierId);
    if (notes) fd.set("notes", notes);
    fd.set("item_count", String(rows.length));
    rows.forEach((r, i) => {
      fd.set(`items[${i}].product_id`, String(r.product_id));
      fd.set(`items[${i}].quantity`, String(r.quantity));
      fd.set(`items[${i}].unit`, r.unit);
      fd.set(`items[${i}].cost_price`, String(r.cost_price));
    });
    await createPurchase(fd);
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      {errorMsg && (
        <div className="lg:col-span-3 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
          {errorMsg}
        </div>
      )}

      {/* product picker */}
      <div className="lg:col-span-2 space-y-4">
        <Card>
          <div className="p-4">
            <div className="relative">
              <span className="absolute inset-y-0 left-3 flex items-center text-gray-400">
                <Search size={16} />
              </span>
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari produk untuk dibeli..."
                className="w-full rounded-lg border border-gray-300 bg-white pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
        </Card>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {filtered.slice(0, 24).map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => addRow(p)}
              className="rounded-xl border border-gray-200 bg-white p-3 text-left hover:border-emerald-400 transition"
            >
              <p className="text-sm font-semibold text-gray-900 line-clamp-2">{p.name}</p>
              <p className="mt-1 text-xs text-gray-400">{p.sku}</p>
              <div className="mt-2 flex items-center justify-between">
                <p className="text-xs font-semibold text-gray-500">{rupiah(p.cost_price)}</p>
                <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-500">
                  {unitLabels[p.unit]}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* form */}
      <div>
        <Card className="p-4 space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Supplier</label>
            <select
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">Umum (tanpa supplier)</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="max-h-[340px] space-y-2 overflow-y-auto pr-1">
            {rows.length === 0 && (
              <p className="py-6 text-center text-sm text-gray-400">
                Pilih produk di sebelah kiri
              </p>
            )}
            {rows.map((r) => {
              const p = products.find((x) => x.id === r.product_id);
              const units = (p?.units && p.units.length ? p.units : [{ unit: r.unit, factor: 1 }]) as {
                unit: string;
                factor: number;
              }[];
              return (
                <div key={r.product_id} className="rounded-lg border border-gray-100 p-2.5 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-gray-900">{r.name}</p>
                    <button
                      type="button"
                      onClick={() => setRows((prev) => prev.filter((x) => x.product_id !== r.product_id))}
                      className="text-gray-300 hover:text-red-500"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="mb-1 block text-[10px] font-medium text-gray-400">Satuan</label>
                      <select
                        value={r.unit}
                        onChange={(e) => changeUnit(r.product_id, e.target.value)}
                        className="w-full rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        {units.map((u) => (
                          <option key={u.unit} value={u.unit}>
                            {unitLabels[u.unit]}
                            {u.factor !== 1 ? " ×" + u.factor : ""}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-[10px] font-medium text-gray-400">Qty</label>
                      <input
                        type="number"
                        min={0}
                        step={decimalUnit(r.unit) ? 0.5 : 1}
                        value={r.quantity}
                        onChange={(e) => updateRow(r.product_id, { quantity: Math.max(0, Number(e.target.value) || 0) })}
                        className="w-full rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-[10px] font-medium text-gray-400">
                      Harga per {unitLabels[r.unit]} (Rp)
                    </label>
                    <input
                      type="number"
                      min={0}
                      step={100}
                      value={r.cost_price}
                      onChange={(e) => updateRow(r.product_id, { cost_price: Math.max(0, Number(e.target.value) || 0) })}
                      className="w-full rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <p className="text-xs text-gray-500 text-right">{rupiah(r.quantity * r.cost_price)}</p>
                </div>
              );
            })}
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Catatan</label>
            <input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="opsional"
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex items-center justify-between border-t border-gray-100 pt-3">
            <span className="text-sm text-gray-600">
              Total: <strong className="text-gray-900">{rupiah(total)}</strong>
            </span>
          </div>

          <button
            type="button"
            onClick={submit}
            disabled={pending || rows.length === 0}
            className={btn.primary + " w-full disabled:opacity-40"}
          >
            <Save size={16} /> {pending ? "Memproses..." : "Simpan Pembelian"}
          </button>
        </Card>
      </div>
    </div>
  );
}