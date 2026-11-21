import { requireRole } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader, Label, Input, Textarea, btn, Select } from "@/components/ui";
import { Flash, LinkBack } from "@/components/Flash";
import { updateSettings } from "@/app/actions/settings";
import { PushOptIn } from "@/components/pwa/PushOptIn";

export default async function SettingsPage(props: PageProps<"/settings">) {
  await requireRole("owner");
  const supabase = await createClient();
  const { data: settings } = await supabase.from("settings").select("key, value");
  const map: Record<string, string> = {};
  (settings || []).forEach((s: any) => (map[s.key] = s.value || ""));

  return (
    <div className="max-w-3xl">
      <Flash searchParams={props.searchParams} />
      <Card>
        <CardHeader title="Pengaturan Toko" subtitle="Informasi muncul di struk dan laporan" />
        <form action={updateSettings} className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="store_name" required>
                Nama Toko
              </Label>
              <Input id="store_name" name="store_name" defaultValue={map.store_name || "Warung Nuhahade"} />
            </div>
            <div>
              <Label htmlFor="store_phone">Telepon Toko</Label>
              <Input id="store_phone" name="store_phone" defaultValue={map.store_phone || ""} />
            </div>
            <div>
              <Label htmlFor="store_email">Email Toko</Label>
              <Input id="store_email" name="store_email" type="email" defaultValue={map.store_email || ""} />
            </div>
            <div>
              <Label htmlFor="tax_rate">Pajak (%)</Label>
              <Input id="tax_rate" name="tax_rate" type="number" min={0} max={100} step={0.5} defaultValue={map.tax_rate || "0"} />
            </div>
            <div>
              <Label htmlFor="currency">Mata Uang</Label>
              <Select id="currency" name="currency" defaultValue={map.currency || "IDR"}>
                <option value="IDR">IDR — Rupiah</option>
                <option value="USD">USD</option>
                <option value="MYR">MYR</option>
              </Select>
            </div>
          </div>
          <div>
            <Label htmlFor="store_address">Alamat Toko</Label>
            <Textarea id="store_address" name="store_address" rows={2} defaultValue={map.store_address || ""} />
          </div>
          <div>
            <Label htmlFor="receipt_footer">Teks Bawah Struk</Label>
            <Textarea id="receipt_footer" name="receipt_footer" rows={2} defaultValue={map.receipt_footer || ""} />
          </div>

          <div className="border-t border-slate-200 pt-4">
            <p className="text-sm font-semibold text-gray-900">Jenis Notifikasi</p>
            <p className="mb-3 text-xs text-slate-500">
              Dikirim push ke perangkat yang sudah mengaktifkan notifikasi.
            </p>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  name="notify_low_stock"
                  defaultChecked={map.notify_low_stock !== "0"}
                  className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                />
                Stok menipis (owner &amp; gudang)
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  name="notify_debt"
                  defaultChecked={map.notify_debt !== "0"}
                  className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                />
                Piutang pelanggan — baru &amp; jatuh tempo
              </label>
            </div>
          </div>

          <div className="border-t border-slate-200 pt-4">
            <p className="text-sm font-semibold text-gray-900">Perangkat</p>
            <p className="mb-3 text-xs text-slate-500">
              Aktifkan notifikasi di perangkat ini, lalu kirim notifikasi uji untuk memastikannya berfungsi.
            </p>
            <PushOptIn variant="settings" />
          </div>

          <div className="flex items-center justify-between pt-2">
            <LinkBack href="/dashboard" label="Kembali" />
            <button type="submit" className={btn.primary}>
              Simpan Pengaturan
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
}