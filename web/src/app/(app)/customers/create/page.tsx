import { requireRole } from "@/lib/dal";
import { Flash } from "@/components/Flash";
import { CustomerForm } from "@/components/forms/CustomerForm";
import { createCustomer } from "@/app/actions/customers";

export default async function CreateCustomerPage(props: PageProps<"/customers/create">) {
  await requireRole(["owner", "cashier"]);

  return (
    <div className="max-w-2xl">
      <h1 className="mb-5 text-xl font-bold text-gray-900">Tambah Pelanggan</h1>
      <Flash searchParams={props.searchParams} />
      <CustomerForm action={createCustomer} backHref="/customers" submitLabel="Simpan Pelanggan" />
    </div>
  );
}