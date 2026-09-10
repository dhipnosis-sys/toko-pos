"use client";

import { useMemo, useState } from "react";
import { rupiah, paymentMethodLabels } from "@/lib/utils";
import { Card, CardHeader, Label, Input, Select, Textarea, btn } from "@/components/ui";
import { LinkBack } from "@/components/Flash";
import { saveDigitalSale } from "@/app/actions/digital";

export type DigitalTypeOption = {
  id: number;
  name: string;
  reduces_balance: boolean;
  balance: number;
};

const DIGITAL_METHODS = ["cash", "transfer", "qris", "ewallet", "credit", "debit"];

export function DigitalSaleForm({ types }: { types: DigitalTypeOption[] }) {
  const [typeId, setTypeId] = useState<number>(types[0]?.id || 0);
  const [cost, setCost] = useState<string>("");

  const selected = useMemo(
    () => types.find((t) => t.id === typeId) || null,
    [types, typeId]
  );

  const costVal = Math.max(0, Math.round(Number(cost) || 0));
  const insufficient =
    !!selected && selected.reduces_balance && costVal > selected.balance;

  return (
    <Card>
      <CardHeader
        title="Transaksi Digital Baru"
        subtitle="Pilih jenis layanan dan isi detail transaksi"
      />
      <form action={saveDigitalSale} className="p-6 space-y-4" onSubmit={(e) => insufficient && e.preventDefault()}>
        <div>
          <Label htmlFor="type_id" required>
            Jenis Layanan
          </Label>
          <Select
            id="type_id"
            name="type_id"
            value={typeId}
            onChange={(e) => setTypeId(Number(e.target.value))}
            required
          >
            {types.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </Select>
          {selected && (
            <p className="mt-1 text-xs text-gray-500">
              {selected.reduces_balance
                ? "Jenis ini mengurangi saldo modal. Saldo saat ini: " + rupiah(selected.balance)
                : "Jenis ini tidak menggunakan saldo modal (cashout)."}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="identifier" required>
            Nomor / ID Pelanggan
          </Label>
          <Input
            id="identifier"
            name="identifier"
            placeholder="No. Meter PLN / No. Tagihan / No. Tujuan"
            required
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <Label htmlFor="amount">Nominal (Rp)</Label>
            <Input id="amount" name="amount" type="number" min={0} defaultValue={0} />
          </div>
          <div>
            <Label htmlFor="admin_fee">Biaya Admin (Rp)</Label>
            <Input id="admin_fee" name="admin_fee" type="number" min={0} defaultValue={0} />
          </div>
          <div>
            <Label htmlFor="cost">Biaya Modal (Rp)</Label>
            <Input
              id="cost"
              name="cost"
              type="number"
              min={0}
              defaultValue={0}
              value={cost}
              onChange={(e) => setCost(e.target.value)}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="payment_method">Metode Pembayaran</Label>
            <Select id="payment_method" name="payment_method" defaultValue="cash">
              {DIGITAL_METHODS.map((m) => (
                <option key={m} value={m}>
                  {paymentMethodLabels[m] || m}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="notes">Catatan</Label>
            <Textarea id="notes" name="notes" placeholder="opsional" rows={2} />
          </div>
        </div>

        {insufficient && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            Saldo modal tidak cukup. Saldo {selected!.name}: {rupiah(selected!.balance)}, biaya yang dimasukkan:{" "}
            {rupiah(costVal)}.
          </p>
        )}

        <div className="flex items-center justify-between pt-2">
          <LinkBack href="/digital" label="Kembali" />
          <button type="submit" className={btn.primary} disabled={insufficient}>
            Simpan Transaksi
          </button>
        </div>
      </form>
    </Card>
  );
}