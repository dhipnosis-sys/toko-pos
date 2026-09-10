"use client";

import { useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import type { ProductUnit, ProductUnitRow } from "@/lib/types";
import { unitLabels } from "@/lib/utils";

const allUnits: ProductUnit[] = ["pcs", "pack", "box", "karung", "kg", "ltr"];

function defaultFactor(unit: ProductUnit): number {
  switch (unit) {
    case "karung":
      return 25;
    case "ltr":
      return 0.8;
    default:
      return 1;
  }
}

type Row = {
  unit: ProductUnit;
  factor: number;
  retail_price: number;
  wholesale_price: number;
  reseller_price: number;
};

export default function ProductUnitsEditor({
  defaults,
}: {
  defaults?: { unit?: string | null; units?: ProductUnitRow[] };
}) {
  const primary = (defaults?.unit || "pcs") as ProductUnit;

  const [primaryUnit, setPrimaryUnit] = useState<ProductUnit>(primary);
  const [rows, setRows] = useState<Row[]>(() => {
    const have = defaults?.units?.length
      ? defaults.units.map((u) => ({
          unit: u.unit,
          factor: Number(u.factor) || 1,
          retail_price: Number(u.retail_price) || 0,
          wholesale_price: Number(u.wholesale_price) || 0,
          reseller_price: Number(u.reseller_price) || 0,
        }))
      : [];
    if (!have.find((r) => r.unit === primary)) {
      have.push({ unit: primary, factor: 1, retail_price: 0, wholesale_price: 0, reseller_price: 0 });
    }
    return have;
  });
  const [adding, setAdding] = useState(false);

  const available = useMemo(
    () => allUnits.filter((u) => !rows.find((r) => r.unit === u)),
    [rows]
  );

  function addUnit(unit: ProductUnit) {
    setRows((prev) => [
      ...prev,
      { unit, factor: defaultFactor(unit), retail_price: 0, wholesale_price: 0, reseller_price: 0 },
    ]);
    setAdding(false);
  }

  function removeUnit(unit: ProductUnit) {
    if (unit === primaryUnit) return;
    setRows((prev) => prev.filter((r) => r.unit !== unit));
  }

  function patchUnit(unit: ProductUnit, patch: Partial<Row>) {
    setRows((prev) => prev.map((r) => (r.unit === unit ? { ...r, ...patch } : r)));
  }

  function changePrimary(unit: ProductUnit) {
    setPrimaryUnit(unit);
    setRows((prev) => {
      if (prev.find((r) => r.unit === unit)) return prev;
      return [...prev, { unit, factor: 1, retail_price: 0, wholesale_price: 0, reseller_price: 0 }];
    });
  }

  const json = JSON.stringify(
    rows.map((r) => ({
      unit: r.unit,
      factor: Number(r.factor) || 0,
      retail_price: Math.max(0, Math.round(Number(r.retail_price) || 0)),
      wholesale_price: Math.max(0, Math.round(Number(r.wholesale_price) || 0)),
      reseller_price: Math.max(0, Math.round(Number(r.reseller_price) || 0)),
    }))
  );

  return (
    <div className="rounded-lg border border-gray-200 overflow-hidden">
      <input type="hidden" name="unit" value={primaryUnit} />
      <input type="hidden" name="units_json" value={json} />

      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
        <p className="text-sm font-semibold text-gray-900">Satuan & Konversi</p>
        <p className="text-xs text-gray-500 mt-0.5">
          Stok dihitung dalam satuan utama. Contoh beras: utama Kg, karung = 25, liter = 0,8 (sesuai
          warungmu).
        </p>
      </div>

      <div className="p-4 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Satuan Utama (stok)</label>
            <select
              value={primaryUnit}
              onChange={(e) => changePrimary(e.target.value as ProductUnit)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {allUnits.map((u) => (
                <option key={u} value={u}>
                  {unitLabels[u]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Mulai menambah satuan</label>
            {available.length === 0 ? (
              <p className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-400">
                Semua satuan terdaftar
              </p>
            ) : adding ? (
              <select
                autoFocus
                value=""
                onChange={(e) => {
                  if (e.target.value) addUnit(e.target.value as ProductUnit);
                }}
                className="w-full rounded-lg border border-emerald-400 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">Pilih satuan...</option>
                {available.map((u) => (
                  <option key={u} value={u}>
                    {unitLabels[u]}
                  </option>
                ))}
              </select>
            ) : (
              <button
                type="button"
                onClick={() => setAdding(true)}
                className="w-full inline-flex items-center justify-center gap-1 rounded-lg border border-dashed border-gray-300 px-3 py-2 text-sm text-gray-500 hover:border-emerald-400 hover:text-emerald-600"
              >
                <Plus size={14} /> Tambah Satuan
              </button>
            )}
          </div>
        </div>

        <div className="space-y-2">
          {rows.map((r) => {
            const isPrimary = r.unit === primaryUnit;
            return (
              <div
                key={r.unit}
                className={"rounded-lg border p-3 " + (isPrimary ? "border-emerald-300 bg-emerald-50/50" : "border-gray-200")}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-gray-900">
                    {unitLabels[r.unit]} {isPrimary && <span className="text-[10px] text-emerald-600"> · utama</span>}
                  </p>
                  {!isPrimary && (
                    <button
                      type="button"
                      onClick={() => removeUnit(r.unit)}
                      className="text-gray-300 hover:text-red-500"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
                <div className="mt-2 grid grid-cols-4 gap-2">
                  <div>
                    <label className="mb-1 block text-[10px] font-medium text-gray-400">
                      1 {unitLabels[r.unit]} = (utama)
                    </label>
                    <input
                      type="number"
                      min={0}
                      step={0.001}
                      value={r.factor}
                      disabled={isPrimary}
                      onChange={(e) => patchUnit(r.unit, { factor: Number(e.target.value) || 0 })}
                      className="w-full rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-gray-100 disabled:text-gray-400"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[10px] font-medium text-gray-400">Retail (Rp)</label>
                    <input
                      type="number"
                      min={0}
                      step={100}
                      value={r.retail_price}
                      onChange={(e) => patchUnit(r.unit, { retail_price: Number(e.target.value) || 0 })}
                      className="w-full rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[10px] font-medium text-gray-400">Grosir (Rp)</label>
                    <input
                      type="number"
                      min={0}
                      step={100}
                      value={r.wholesale_price}
                      onChange={(e) => patchUnit(r.unit, { wholesale_price: Number(e.target.value) || 0 })}
                      className="w-full rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[10px] font-medium text-gray-400">Reseller (Rp)</label>
                    <input
                      type="number"
                      min={0}
                      step={100}
                      value={r.reseller_price}
                      onChange={(e) => patchUnit(r.unit, { reseller_price: Number(e.target.value) || 0 })}
                      className="w-full rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}