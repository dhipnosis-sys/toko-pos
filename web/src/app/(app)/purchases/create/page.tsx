import { requireRole } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { Flash } from "@/components/Flash";
import PurchaseForm from "@/components/purchases/PurchaseForm";

export default async function CreatePurchasePage(props: PageProps<"/purchases/create">) {
  await requireRole(["owner", "warehouse"]);
  const supabase = await createClient();
  const [{ data: products }, { data: suppliers }] = await Promise.all([
    supabase
      .from("products")
      .select(
        "id, name, sku, unit, cost_price, units:product_units(id, unit, factor, retail_price, wholesale_price, reseller_price, is_default)"
      )
      .eq("is_active", true)
      .order("name"),
    supabase.from("suppliers").select("id, name").order("name"),
  ]);

  return (
    <div>
      <h1 className="mb-5 text-xl font-bold text-gray-900">Tambah Pembelian</h1>
      <Flash searchParams={props.searchParams} />
      <PurchaseForm
        products={
          (products || []).map((p: any) => ({
            id: p.id,
            name: p.name,
            sku: p.sku,
            unit: p.unit,
            cost_price: p.cost_price,
            units: (p.units || []).map((u: any) => ({
              unit: u.unit,
              factor: Number(u.factor),
              is_default: u.is_default,
            })),
          })) as any[]
        }
        suppliers={suppliers || []}
      />
    </div>
  );
}