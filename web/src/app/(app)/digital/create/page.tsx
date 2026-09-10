import { requireRole } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { Card, EmptyState, PageHeader, btn } from "@/components/ui";
import { Flash, LinkBack } from "@/components/Flash";
import { DigitalSaleForm, type DigitalTypeOption } from "@/components/DigitalSaleForm";

export default async function DigitalCreatePage(props: PageProps<"/digital/create">) {
  await requireRole(["owner", "cashier"]);

  const supabase = await createClient();
  const { data: types } = await supabase
    .from("digital_types")
    .select("id, name, reduces_balance, is_active, balance")
    .eq("is_active", true)
    .order("name");

  const options: DigitalTypeOption[] = (types || []).map((t: any) => ({
    id: t.id,
    name: t.name,
    reduces_balance: t.reduces_balance,
    balance: t.balance,
  }));

  return (
    <div className="max-w-2xl">
      <PageHeader
        title="Transaksi Digital Baru"
        action={
          <LinkBack href="/digital" label="Kembali" />
        }
      />
      <Flash searchParams={props.searchParams} />
      {options.length === 0 ? (
        <Card>
          <EmptyState message="Belum ada jenis digital aktif. Tambahkan jenis dulu dari halaman Digital." />
        </Card>
      ) : (
        <DigitalSaleForm types={options} />
      )}
    </div>
  );
}