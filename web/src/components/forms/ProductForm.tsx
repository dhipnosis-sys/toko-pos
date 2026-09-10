import { Card, Label, Input, Select, Textarea, btn } from "@/components/ui";
import { LinkBack } from "@/components/Flash";
import { unitLabels } from "@/lib/utils";

export function ProductFields({
  categories,
  suppliers,
  defaults,
}: {
  categories: { id: number; name: string }[];
  suppliers: { id: number; name: string }[];
  defaults?: {
    category_id?: number | null;
    supplier_id?: number | null;
    name?: string;
    sku?: string;
    barcode?: string | null;
    unit?: string;
    cost_price?: number;
    retail_price?: number;
    wholesale_price?: number;
    reseller_price?: number;
    stock?: number;
    min_stock?: number;
    description?: string | null;
    notes?: string | null;
    is_active?: boolean;
  };
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="sm:col-span-2">
        <Label htmlFor="name" required>
          Nama Produk
        </Label>
        <Input id="name" name="name" defaultValue={defaults?.name} required placeholder="contoh: Kopi Susu Gula Aren" />
      </div>
      <div>
        <Label htmlFor="category_id">Kategori</Label>
        <Select id="category_id" name="category_id" defaultValue={defaults?.category_id ?? ""}>
          <option value="">Tanpa kategori</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <Label htmlFor="supplier_id">Supplier</Label>
        <Select id="supplier_id" name="supplier_id" defaultValue={defaults?.supplier_id ?? ""}>
          <option value="">Tanpa supplier</option>
          {suppliers.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <Label htmlFor="sku" required>
          SKU
        </Label>
        <Input id="sku" name="sku" defaultValue={defaults?.sku} required placeholder="contoh: KSG-001" />
      </div>
      <div>
        <Label htmlFor="barcode">Barcode</Label>
        <Input id="barcode" name="barcode" defaultValue={defaults?.barcode || ""} placeholder="scan / kode unik" />
      </div>
      <div>
        <Label htmlFor="unit">Satuan</Label>
        <Select id="unit" name="unit" defaultValue={defaults?.unit || "pcs"}>
          {Object.entries(unitLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="stock">Stok Awal</Label>
          <Input id="stock" name="stock" type="number" min={0} defaultValue={defaults?.stock ?? 0} />
        </div>
        <div>
          <Label htmlFor="min_stock">Stok Minimal</Label>
          <Input id="min_stock" name="min_stock" type="number" min={0} defaultValue={defaults?.min_stock ?? 0} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="cost_price">Harga Modal (Rp)</Label>
          <Input id="cost_price" name="cost_price" type="number" min={0} step={100} defaultValue={defaults?.cost_price ?? 0} />
        </div>
        <div>
          <Label htmlFor="retail_price">Harga Retail (Rp)</Label>
          <Input id="retail_price" name="retail_price" type="number" min={0} step={100} defaultValue={defaults?.retail_price ?? 0} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="wholesale_price">Harga Grosir (Rp)</Label>
          <Input id="wholesale_price" name="wholesale_price" type="number" min={0} step={100} defaultValue={defaults?.wholesale_price ?? 0} />
        </div>
        <div>
          <Label htmlFor="reseller_price">Harga Reseller (Rp)</Label>
          <Input id="reseller_price" name="reseller_price" type="number" min={0} step={100} defaultValue={defaults?.reseller_price ?? 0} />
        </div>
      </div>
      <div className="sm:col-span-2">
        <Label htmlFor="description">Deskripsi</Label>
        <Textarea id="description" name="description" rows={2} defaultValue={defaults?.description || ""} />
      </div>
      <div className="sm:col-span-2">
        <Label htmlFor="notes">Catatan</Label>
        <Textarea id="notes" name="notes" rows={2} defaultValue={defaults?.notes || ""} />
      </div>
      <div className="sm:col-span-2">
        <label className="inline-flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            name="is_active"
            defaultChecked={defaults?.is_active ?? true}
            className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
          />
          Produk aktif (tampil di POS)
        </label>
      </div>
    </div>
  );
}

export function ProductForm({
  action,
  backHref,
  categories,
  suppliers,
  defaults,
  submitLabel,
}: {
  action: (formData: FormData) => Promise<void>;
  backHref: string;
  categories: { id: number; name: string }[];
  suppliers: { id: number; name: string }[];
  defaults?: Parameters<typeof ProductFields>[0]["defaults"];
  submitLabel: string;
}) {
  return (
    <Card>
      <form action={action} className="p-6 space-y-4">
        <ProductFields categories={categories} suppliers={suppliers} defaults={defaults} />
        <div className="flex items-center justify-between pt-2">
          <LinkBack href={backHref} />
          <button type="submit" className={btn.primary}>
            {submitLabel}
          </button>
        </div>
      </form>
    </Card>
  );
}