import { notFound } from "next/navigation";
import { requireRole } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { rupiah, paymentMethodLabels } from "@/lib/utils";
import { Card, CardHeader, Label, Input, Select, btn } from "@/components/ui";
import { Flash, LinkBack } from "@/components/Flash";
import { recordCustomerPayment } from "@/app/actions/customers";

export default async function PayCustomerPage(props: PageProps<"/customers/[id]/pay">) {
  await requireRole(["owner", "cashier"]);
  const { id } = await props.params;
  const customerId = Number(id);
  if (Number.isNaN(customerId)) notFound();

  const supabase = await createClient();
  const { data: customer } = await supabase
    .from("customers")
    .select("id, name, total_debt")
    .eq("id", customerId)
    .single();
  if (!customer) notFound();

  const debt = customer.total_debt;

  return (
    <div className="max-w-2xl">
      <Flash searchParams={props.searchParams} />
      <Card>
        <CardHeader
          title={"Bayar Piutang " + customer.name}
          subtitle={debt > 0 ? "Sisa piutang: " + rupiah(debt) : "Tidak ada piutang"}
        />
        <form action={recordCustomerPayment} className="p-6 space-y-4">
          <input type="hidden" name="customer_id" value={customerId} />
          <div>
            <Label htmlFor="amount" required>
              Jumlah Pembayaran (Rp)
            </Label>
            <Input
              id="amount"
              name="amount"
              type="number"
              min={1}
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
            <LinkBack href={"/customers/" + customerId} label="Kembali" />
            <button type="submit" className={btn.primary}>
              Simpan Pembayaran
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
}