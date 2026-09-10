import { notFound } from "next/navigation";
import { requireRole } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { Flash } from "@/components/Flash";
import { CustomerForm } from "@/components/forms/CustomerForm";
import { updateCustomer } from "@/app/actions/customers";

export default async function EditCustomerPage(props: PageProps<"/customers/[id]/edit">) {
  await requireRole(["owner", "cashier"]);
  const { id } = await props.params;
  const customerId = Number(id);
  if (Number.isNaN(customerId)) notFound();

  const supabase = await createClient();
  const { data: customer } = await supabase
    .from("customers")
    .select("*")
    .eq("id", customerId)
    .single();
  if (!customer) notFound();

  return (
    <div className="max-w-2xl">
      <h1 className="mb-5 text-xl font-bold text-gray-900">Edit Pelanggan</h1>
      <Flash searchParams={props.searchParams} />
      <CustomerForm
        action={updateCustomer.bind(null, customerId)}
        backHref="/customers"
        defaults={{
          name: customer.name,
          phone: customer.phone,
          email: customer.email,
          address: customer.address,
          city: customer.city,
          debt_limit: customer.debt_limit,
          notes: customer.notes,
        }}
        submitLabel="Simpan Perubahan"
      />
    </div>
  );
}