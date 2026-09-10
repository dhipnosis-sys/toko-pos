import { requireRole } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { Flash } from "@/components/Flash";
import BomForm from "@/components/bom/BomForm";
import { createBom } from "@/app/actions/bom";

export default async function CreateBomPage(props: PageProps<"/bom/create">) {
  await requireRole(["owner", "warehouse"]);
  const supabase = await createClient();
  const { data: products } = await supabase
    .from("products")
    .select("id, name, unit, retail_price")
    .eq("is_active", true)
    .order("name");

  return (
    <div className="max-w-4xl">
      <h1 className="mb-5 text-xl font-bold text-gray-900">Buat BOM Baru</h1>
      <Flash searchParams={props.searchParams} />
      <BomForm
        products={(products || []).map((p: any) => ({
          id: p.id,
          name: p.name,
          unit: p.unit,
          retail_price: p.retail_price,
        }))}
        action={createBom}
        backHref="/bom"
      />
    </div>
  );
}