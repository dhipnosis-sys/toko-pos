import { requireRole } from "@/lib/dal";
import { Flash } from "@/components/Flash";
import { SupplierForm } from "@/components/forms/SupplierForm";
import { createSupplier } from "@/app/actions/suppliers";

export default async function CreateSupplierPage(props: PageProps<"/suppliers/create">) {
  await requireRole(["owner", "warehouse"]);

  return (
    <div className="max-w-2xl">
      <h1 className="mb-5 text-xl font-bold text-gray-900">Tambah Supplier</h1>
      <Flash searchParams={props.searchParams} />
      <SupplierForm action={createSupplier} backHref="/suppliers" submitLabel="Simpan Supplier" />
    </div>
  );
}