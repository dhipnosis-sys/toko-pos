"use client";

import { useMemo, useState } from "react";
import { Factory, Save } from "lucide-react";
import { rupiah } from "@/lib/utils";
import { Card, btn } from "@/components/ui";
import { createProduction } from "@/app/actions/production";

type BomOption = {
  id: number;
  name: string;
  quantity: number;
  labor_cost: number;
  overhead_cost: number;
  finishedLabel: string;
};

export default function ProductionForm({ boms }: { boms: BomOption[] }) {
  const [bomId, setBomId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState("");
  const [pending, setPending] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const selected = useMemo(() => boms.find((b) => String(b.id) === bomId), [bomId, boms]);

  async function submit() {
    if (!bomId) {
      setErrorMsg("Pilih BOM / resep terlebih dahulu");
      return;
    }
    if (Number(quantity) < 1) {
      setErrorMsg("Jumlah produksi minimal 1");
      return;
    }
    setPending(true);
    setErrorMsg("");
    const fd = new FormData();
    fd.set("bill_of_material_id", bomId);
    fd.set("quantity", String(quantity));
    if (notes) fd.set("notes", notes);
    await createProduction(fd);
  }

  return (
    <div className="max-w-2xl">
      {errorMsg && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
          {errorMsg}
        </div>
      )}
      <Card className="p-6 space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Pilih BOM / Resep *</label>
          <select
            value={bomId}
            onChange={(e) => setBomId(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">Pilih BOM...</option>
            {boms.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} — {b.finishedLabel}
              </option>
            ))}
          </select>
          {selected && (
            <div className="mt-2 rounded-lg bg-gray-50 border border-gray-100 px-3 py-2 text-xs text-gray-600 space-y-1">
              <p>Hasil jadi: {selected.finishedLabel}</p>
              <p>Batch standar: {selected.quantity}</p>
              <p>
                Estimasi biaya bahan untuk batch standar:{" "}
                {rupiah(selected.labor_cost + selected.overhead_cost)} (tanpa bahan baku)
              </p>
            </div>
          )}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Jumlah Produksi *</label>
          <input
            type="number"
            min={1}
            value={quantity}
            onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <p className="mt-1 text-xs text-gray-400">
            Kebutuhan bahan akan dihitung proporsional terhadap batch BOM.
          </p>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Catatan</label>
          <input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center justify-between pt-2">
          <a
            href="/production"
            className="rounded-lg bg-white border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Batal
          </a>
          <button type="button" onClick={submit} disabled={pending} className={btn.primary}>
            <Factory size={16} /> {pending ? "Menyimpan..." : "Buat Order Produksi"}
          </button>
        </div>
      </Card>
    </div>
  );
}