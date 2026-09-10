import { notFound } from "next/navigation";
import { requireRole } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { Flash } from "@/components/Flash";
import BomForm from "@/components/bom/BomForm";
import { updateBom } from "@/app/actions/bom";

export default async function EditBomPage(props: PageProps<"/bom/[id]/edit">) {
  await requireRole(["owner", "warehouse"]);
  const { id } = await props.params;
  const bomId = Number(id);
  if (Number.isNaN(bomId)) notFound();

  const supabase = await createClient();
  const { data: bom } = await supabase
    .from("bill_of_materials")
    .select("*, items:bill_of_material_items(*)")
    .eq("id", bomId)
    .single();
  if (!bom) notFound();

  const { data: products } = await supabase
    .from("products")
    .select("id, name, unit, retail_price")
    .eq("is_active", true)
    .order("name");

  return (
    <div className="max-w-4xl">
      <h1 className="mb-5 text-xl font-bold text-gray-900">Edit BOM</h1>
      <Flash searchParams={props.searchParams} />
      <BomForm
        products={(products || []).map((p: any) => ({
          id: p.id,
          name: p.name,
          unit: p.unit,
          retail_price: p.retail_price,
        }))}
        action={updateBom.bind(null, bomId)}
        backHref="/bom"
        defaults={{
          name: bom.name,
          finished_good_type: bom.finished_good_type,
          product_id: bom.product_id,
          finished_good_name: bom.finished_good_name,
          finished_good_unit: bom.finished_good_unit,
          quantity: Number(bom.quantity),
          labor_cost: bom.labor_cost,
          overhead_cost: bom.overhead_cost,
          profit_type: bom.profit_type,
          profit_value: bom.profit_value,
          notes: bom.notes,
          items: (bom.items || []).map((it: any) => ({
            item_type: it.item_type,
            product_id: it.product_id,
            item_name: it.item_name,
            item_unit: it.item_unit,
            quantity: Number(it.quantity),
            unit_cost: it.unit_cost,
          })),
        }}
      />
    </div>
  );
}