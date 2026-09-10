import { notFound } from "next/navigation";
import { requireRole } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { Flash } from "@/components/Flash";
import { SupplierForm } from "@/components/forms/SupplierForm";
import { updateSupplier } from "@/app/actions/suppliers";

export default async function EditSupplierPage(props: PageProps<"/suppliers/[id]/edit">) {
  await requireRole(["owner", "warehouse"]);
  const { id } = await props.params;
  const supplierId = Number(id);
  if (Number.isNaN(supplierId)) notFound();

  const supabase = await createClient();
  const { data: supplier } = await supabase
    .from("suppliers")
    .select("*")
    .eq("id", supplierId)
    .single();
  if (!supplier) notFound();

  return (
    <div className="max-w-2xl">
      <h1 className="mb-5 text-xl font-bold text-gray-900">Edit Supplier</h1>
      <Flash searchParams={props.searchParams} />
      <SupplierForm
        action={updateSupplier.bind(null, supplierId)}
        backHref="/suppliers"
        defaults={{
          name: supplier.name,
          phone: supplier.phone,
          email: supplier.email,
          address: supplier.address,
          city: supplier.city,
          tax_id: supplier.tax_id,
          opening_balance: supplier.opening_balance,
          notes: supplier.notes,
        }}
        submitLabel="Simpan Perubahan"
      />
    </div>
  );
}