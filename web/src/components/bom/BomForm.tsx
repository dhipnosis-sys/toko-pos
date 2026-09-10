"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Save } from "lucide-react";
import { rupiah } from "@/lib/utils";
import type { ProductUnit } from "@/lib/types";
import { Card, btn } from "@/components/ui";

type BomProduct = { id: number; name: string; unit: ProductUnit; retail_price: number };
type BomItem = {
  itemType: "product" | "manual";
  productId: string;
  itemName: string;
  itemUnit: string;
  quantity: number;
  unitCost: number;
};

export default function BomForm({
  products,
  action,
  backHref,
  defaults,
}: {
  products: BomProduct[];
  action: (formData: FormData) => Promise<void>;
  backHref: string;
  defaults?: {
    name?: string;
    finished_good_type?: "product" | "manual";
    product_id?: number | null;
    finished_good_name?: string | null;
    finished_good_unit?: string | null;
    quantity?: number;
    labor_cost?: number;
    overhead_cost?: number;
    profit_type?: "percentage" | "amount";
    profit_value?: number;
    notes?: string | null;
    items?: {
      item_type: "product" | "manual";
      product_id?: number | null;
      item_name?: string | null;
      item_unit?: string | null;
      quantity?: number;
      unit_cost?: number;
    }[];
  };
}) {
  const [finishedGoodType, setFinishedGoodType] = useState<"product" | "manual">(
    defaults?.finished_good_type || "product"
  );
  const [productId, setProductId] = useState(String(defaults?.product_id || ""));
  const [fgName, setFgName] = useState(defaults?.finished_good_name || "");
  const [fgUnit, setFgUnit] = useState(defaults?.finished_good_unit || "");
  const [name, setName] = useState(defaults?.name || "");
  const [quantity, setQuantity] = useState(defaults?.quantity ?? 1);
  const [laborCost, setLaborCost] = useState(defaults?.labor_cost ?? 0);
  const [overheadCost, setOverheadCost] = useState(defaults?.overhead_cost ?? 0);
  const [profitType, setProfitType] = useState<"percentage" | "amount">(
    defaults?.profit_type || "percentage"
  );
  const [profitValue, setProfitValue] = useState(defaults?.profit_value ?? 0);
  const [notes, setNotes] = useState(defaults?.notes || "");
  const [rows, setRows] = useState<BomItem[]>(
    (defaults?.items || []).map((it) => ({
      itemType: it.item_type,
      productId: it.product_id ? String(it.product_id) : "",
      itemName: it.item_name || "",
      itemUnit: it.item_unit || "",
      quantity: Number(it.quantity || 0),
      unitCost: Number(it.unit_cost || 0),
    }))
  );
  const [pending, setPending] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    const fg = productId
      ? products.find((p) => String(p.id) === productId)
      : null;
    if (fg) {
      setName(name.trim() || defaultName(fg.name));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  function defaultName(base: string) {
    return "BOM " + base;
  }

  function addRow() {
    setRows((prev) => [
      ...prev,
      { itemType: "product", productId: "", itemName: "", itemUnit: "", quantity: 1, unitCost: 0 },
    ]);
  }

  function updateRow(i: number, patch: Partial<BomItem>) {
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }

  const rawCost = rows.reduce((a, r) => a + r.quantity * r.unitCost, 0);
  const baseTotal = rawCost + laborCost + overheadCost;
  const profitAmount =
    profitType === "percentage" ? (baseTotal * profitValue) / 100 : profitValue;
  const suggestedPrice = baseTotal + profitAmount;

  function validate(): string[] {
    const errs: string[] = [];
    if (!name.trim()) errs.push("Nama BOM wajib diisi");
    if (finishedGoodType === "product" && !productId) errs.push("Pilih produk hasil jadi");
    if (finishedGoodType === "manual" && !fgName.trim()) errs.push("Nama hasil jadi wajib diisi");
    if (quantity < 1) errs.push("Kuantitas batch minimal 1");
    if (rows.length === 0) errs.push("Minimal satu item bahan");
    rows.forEach((r, i) => {
      if (r.itemType === "product" && !r.productId) errs.push("Baris " + (i + 1) + ": pilih produk");
      if (r.itemType === "manual" && !r.itemName.trim()) errs.push("Baris " + (i + 1) + ": nama bahan wajib");
      if (r.quantity <= 0) errs.push("Baris " + (i + 1) + ": kuantitas harus > 0");
    });
    return errs;
  }

  async function submit() {
    const errs = validate();
    setErrors(errs);
    if (errs.length > 0) return;
    setPending(true);
    const fd = new FormData();
    fd.set("name", name.trim());
    fd.set("finished_good_type", finishedGoodType);
    fd.set("product_id", finishedGoodType === "product" ? productId : "");
    fd.set("finished_good_name", finishedGoodType === "manual" ? fgName.trim() : "");
    fd.set("finished_good_unit", finishedGoodType === "manual" ? fgUnit.trim() : "");
    fd.set("quantity", String(quantity));
    fd.set("labor_cost", String(laborCost));
    fd.set("overhead_cost", String(overheadCost));
    fd.set("profit_type", profitType);
    fd.set("profit_value", String(profitValue));
    fd.set("notes", notes.trim());
    fd.set("item_count", String(rows.length));
    rows.forEach((r, i) => {
      fd.set(`items[${i}].item_type`, r.itemType);
      fd.set(`items[${i}].product_id`, r.itemType === "product" ? r.productId : "");
      fd.set(`items[${i}].item_name`, r.itemType === "manual" ? r.itemName.trim() : "");
      fd.set(`items[${i}].item_unit`, r.itemType === "manual" ? r.itemUnit.trim() : "");
      fd.set(`items[${i}].quantity`, String(r.quantity));
      fd.set(`items[${i}].unit_cost`, String(r.unitCost));
    });
    await action(fd);
  }

  return (
    <Card>
      <form onSubmit={(e) => e.preventDefault()} className="p-6 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Nama BOM *</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="contoh: BOM Kopi Susu"
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Kuantitas Batch</label>
            <input
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Hasil Jadi</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setFinishedGoodType("product")}
              className={
                "rounded-lg px-4 py-2 text-sm font-medium border " +
                (finishedGoodType === "product"
                  ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                  : "border-gray-200 bg-white text-gray-600")
              }
            >
              Dari Produk
            </button>
            <button
              type="button"
              onClick={() => setFinishedGoodType("manual")}
              className={
                "rounded-lg px-4 py-2 text-sm font-medium border " +
                (finishedGoodType === "manual"
                  ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                  : "border-gray-200 bg-white text-gray-600")
              }
            >
              Manual (bukan produk)
            </button>
          </div>
          {finishedGoodType === "product" ? (
            <select
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              className="mt-3 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">Pilih produk hasil jadi...</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          ) : (
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                value={fgName}
                onChange={(e) => setFgName(e.target.value)}
                placeholder="Nama hasil jadi (manual)"
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <input
                value={fgUnit}
                onChange={(e) => setFgUnit(e.target.value)}
                placeholder="Satuan (mis. porsi, bungkus)"
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          )}
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">Bahan (per batch)</label>
            <button type="button" onClick={addRow} className="inline-flex items-center gap-1 text-sm text-emerald-600 hover:underline">
              <Plus size={15} /> Tambah bahan
            </button>
          </div>
          <div className="space-y-2">
            {rows.map((r, i) => (
              <div key={i} className="rounded-lg border border-gray-100 p-2.5 grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                <div className="sm:col-span-2">
                  <select
                    value={r.itemType}
                    onChange={(e) => updateRow(i, { itemType: e.target.value as "product" | "manual" })}
                    className="w-full rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="product">Produk</option>
                    <option value="manual">Manual</option>
                  </select>
                </div>
                <div className="sm:col-span-4">
                  {r.itemType === "product" ? (
                    <select
                      value={r.productId}
                      onChange={(e) => {
                        const p = products.find((x) => String(x.id) === e.target.value);
                        updateRow(i, {
                          productId: e.target.value,
                          itemName: p?.name || "",
                          itemUnit: p?.unit || "",
                        });
                      }}
                      className="w-full rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="">Pilih produk...</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      value={r.itemName}
                      onChange={(e) => updateRow(i, { itemName: e.target.value })}
                      placeholder="Nama bahan"
                      className="w-full rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  )}
                </div>
                <div className="sm:col-span-2">
                  <input
                    value={r.itemUnit}
                    onChange={(e) => updateRow(i, { itemUnit: e.target.value })}
                    placeholder="Satuan"
                    className="w-full rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div className="sm:col-span-1">
                  <input
                    type="number"
                    min={0.001}
                    step={0.001}
                    value={r.quantity}
                    onChange={(e) => updateRow(i, { quantity: Math.max(0, Number(e.target.value) || 0) })}
                    className="w-full rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div className="sm:col-span-2">
                  <input
                    type="number"
                    min={0}
                    step={100}
                    value={r.unitCost}
                    onChange={(e) => updateRow(i, { unitCost: Math.max(0, Number(e.target.value) || 0) })}
                    className="w-full rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div className="sm:col-span-1 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setRows((prev) => prev.filter((_, idx) => idx !== i))}
                    className="text-gray-300 hover:text-red-500"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
            {rows.length === 0 && (
              <p className="py-4 text-center text-sm text-gray-400">Belum ada bahan — klik "Tambah bahan"</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Tenaga Kerja (Rp)</label>
            <input type="number" min={0} value={laborCost} onChange={(e) => setLaborCost(Math.max(0, Number(e.target.value) || 0))} className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Overhead (Rp)</label>
            <input type="number" min={0} value={overheadCost} onChange={(e) => setOverheadCost(Math.max(0, Number(e.target.value) || 0))} className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Profit</label>
            <select value={profitType} onChange={(e) => setProfitType(e.target.value as "percentage" | "amount")} className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm">
              <option value="percentage">Persen (%)</option>
              <option value="amount">Nominal (Rp)</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">{profitType === "percentage" ? "Persen (%)" : "Nominal (Rp)"}</label>
            <input type="number" min={0} value={profitValue} onChange={(e) => setProfitValue(Math.max(0, Number(e.target.value) || 0))} className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm" />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Catatan</label>
          <input value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm" />
        </div>

        <div className="rounded-lg bg-gray-50 border border-gray-100 p-4 text-sm space-y-1">
          <div className="flex justify-between text-gray-600">
            <span>Bahan baku</span>
            <span>{rupiah(rawCost)}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>Tenaga kerja + overhead</span>
            <span>{rupiah(laborCost + overheadCost)}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>Profit</span>
            <span>{rupiah(profitAmount)}</span>
          </div>
          <div className="flex justify-between font-semibold text-gray-900">
            <span>Harga jual disarankan</span>
            <span>{rupiah(suggestedPrice)}</span>
          </div>
        </div>

        {errors.length > 0 && (
          <ul className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 space-y-0.5">
            {errors.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        )}

        <div className="flex justify-between pt-2">
          <a href={backHref} className="rounded-lg bg-white border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
            Batal
          </a>
          <button type="button" onClick={submit} disabled={pending} className={btn.primary}>
            <Save size={16} /> {pending ? "Menyimpan..." : "Simpan BOM"}
          </button>
        </div>
      </form>
    </Card>
  );
}