import { Card, Label, Input, Textarea, btn } from "@/components/ui";
import { LinkBack } from "@/components/Flash";

export function CustomerFields({
  defaults,
}: {
  defaults?: {
    name?: string;
    phone?: string | null;
    email?: string | null;
    address?: string | null;
    city?: string | null;
    debt_limit?: number;
    notes?: string | null;
  };
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div>
        <Label htmlFor="name" required>
          Nama Pelanggan
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
      <div className="sm:col-span-2">
        <Label htmlFor="address">Alamat</Label>
        <Textarea id="address" name="address" rows={2} defaultValue={defaults?.address || ""} />
      </div>
      <div>
        <Label htmlFor="debt_limit">Batas Piutang (Rp)</Label>
        <Input
          id="debt_limit"
          name="debt_limit"
          type="number"
          min={0}
          step={1000}
          defaultValue={defaults?.debt_limit ?? 0}
        />
      </div>
      <div>
        <Label htmlFor="notes">Catatan</Label>
        <Input id="notes" name="notes" defaultValue={defaults?.notes || ""} />
      </div>
    </div>
  );
}

export function CustomerForm({
  action,
  backHref,
  defaults,
  submitLabel,
}: {
  action: (formData: FormData) => Promise<void>;
  backHref: string;
  defaults?: Parameters<typeof CustomerFields>[0]["defaults"];
  submitLabel: string;
}) {
  return (
    <Card>
      <form action={action} className="p-6 space-y-4">
        <CustomerFields defaults={defaults} />
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