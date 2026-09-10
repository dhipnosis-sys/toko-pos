import { requireRole } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { Flash } from "@/components/Flash";
import ProductionForm from "@/components/production/ProductionForm";
import { unitLabels } from "@/lib/utils";

export default async function CreateProductionPage(props: PageProps<"/production/create">) {
  await requireRole(["owner", "warehouse"]);
  const supabase = await createClient();
  const { data: boms } = await supabase
    .from("bill_of_materials")
    .select("id, name, quantity, labor_cost, overhead_cost, finished_good_type, finished_good_name, product:products(name)");

  return (
    <div>
      <h1 className="mb-5 text-xl font-bold text-gray-900">Buat Order Produksi</h1>
      <Flash searchParams={props.searchParams} />
      <ProductionForm
        boms={(boms || []).map((b: any) => ({
          id: b.id,
          name: b.name,
          quantity: Number(b.quantity),
          labor_cost: b.labor_cost,
          overhead_cost: b.overhead_cost,
          finishedLabel:
            b.finished_good_type === "product"
              ? b.product?.name || "Produk dihapus"
              : b.finished_good_name || "Manual",
          unit: b.quantity,
        }))}
      />
    </div>
  );
}