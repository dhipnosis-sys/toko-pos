import { notFound } from "next/navigation";
import { requireRole } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { rupiah, paymentMethodLabels } from "@/lib/utils";
import { Card, CardHeader, Label, Input, Select, Textarea, btn } from "@/components/ui";
import { Flash, LinkBack } from "@/components/Flash";
import { recordSupplierPayment } from "@/app/actions/suppliers";

export default async function PaySupplierPage(props: PageProps<"/suppliers/[id]/pay">) {
  await requireRole(["owner", "warehouse"]);
  const { id } = await props.params;
  const supplierId = Number(id);
  if (Number.isNaN(supplierId)) notFound();

  const supabase = await createClient();
  const { data: supplier } = await supabase
    .from("suppliers")
    .select("id, name, total_debt")
    .eq("id", supplierId)
    .single();
  if (!supplier) notFound();

  const debt = supplier.total_debt;

  return (
    <div className="max-w-2xl">
      <Flash searchParams={props.searchParams} />
      <Card>
        <CardHeader
          title={"Bayar Hutang ke " + supplier.name}
          subtitle={debt > 0 ? "Sisa hutang: " + rupiah(debt) : "Tidak ada hutang"}
        />
        <form action={recordSupplierPayment} className="p-6 space-y-4">
          <input type="hidden" name="supplier_id" value={supplierId} />
          <div>
            <Label htmlFor="amount" required>
              Jumlah Pembayaran (Rp)
            </Label>
            <Input
              id="amount"
              name="amount"
              type="number"
              min={1}
              step={1000}
              defaultValue={debt > 0 ? String(debt) : ""}
              required
            />
          </div>
          <div>
            <Label htmlFor="payment_method">Metode Pembayaran</Label>
            <Select id="payment_method" name="payment_method" defaultValue="cash">
              {Object.entries(paymentMethodLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="notes">Catatan</Label>
            <Input id="notes" name="notes" placeholder="opsional" />
          </div>
          <div className="flex items-center justify-between pt-2">
            <LinkBack href={"/suppliers/" + supplierId} label="Kembali" />
            <button type="submit" className={btn.primary}>
              Simpan Pembayaran
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
}