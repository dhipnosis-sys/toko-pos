import { Card, Label, Input, Textarea, btn } from "@/components/ui";
import { LinkBack } from "@/components/Flash";

export function SupplierFields({
  defaults,
}: {
  defaults?: {
    name?: string;
    phone?: string | null;
    email?: string | null;
    address?: string | null;
    city?: string | null;
    tax_id?: string | null;
    opening_balance?: number;
    notes?: string | null;
  };
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div>
        <Label htmlFor="name" required>
          Nama Supplier
        </Label>
        <Input id="name" name="name" defaultValue={defaults?.name} required />
      </div>
      <div>
        <Label htmlFor="phone">Telepon / HP</Label>
        <Input id="phone" name="phone" defaultValue={defaults?.phone || ""} placeholder="08xxxx" />
      </div>
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" defaultValue={defaults?.email || ""} />
      </div>
      <div>
        <Label htmlFor="city">Kota</Label>
        <Input id="city" name="city" defaultValue={defaults?.city || ""} />
      </div>
      <div>
        <Label htmlFor="tax_id">NPWP</Label>
        <Input id="tax_id" name="tax_id" defaultValue={defaults?.tax_id || ""} />
      </div>
      <div>
        <Label htmlFor="opening_balance">Saldo Awal Hutang (Rp)</Label>
        <Input
          id="opening_balance"
          name="opening_balance"
          type="number"
          min={0}
          step={1000}
          defaultValue={defaults?.opening_balance ?? 0}
        />
      </div>
      <div className="sm:col-span-2">
        <Label htmlFor="address">Alamat</Label>
        <Textarea id="address" name="address" rows={2} defaultValue={defaults?.address || ""} />
      </div>
      <div className="sm:col-span-2">
        <Label htmlFor="notes">Catatan</Label>
        <Textarea id="notes" name="notes" rows={2} defaultValue={defaults?.notes || ""} />
      </div>
    </div>
  );
}

export function SupplierForm({
  action,
  backHref,
  defaults,
  submitLabel,
}: {
  action: (formData: FormData) => Promise<void>;
  backHref: string;
  defaults?: Parameters<typeof SupplierFields>[0]["defaults"];
  submitLabel: string;
}) {
  return (
    <Card>
      <form action={action} className="p-6 space-y-4">
        <SupplierFields defaults={defaults} />
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