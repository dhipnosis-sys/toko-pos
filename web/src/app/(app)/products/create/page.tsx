import Link from "next/link";
import { requireRole } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { Flash } from "@/components/Flash";
import { ProductForm } from "@/components/forms/ProductForm";
import { createProduct } from "@/app/actions/products";

export default async function CreateProductPage(props: PageProps<"/products/create">) {
  await requireRole(["owner", "warehouse"]);
  const supabase = await createClient();
  const { data: categories } = await supabase.from("categories").select("id, name").order("name");
  const { data: suppliers } = await supabase.from("suppliers").select("id, name").order("name");

  return (
    <div className="max-w-3xl">
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Tambah Produk</h1>
        <Link href="/categories/create" className="text-sm text-emerald-600 hover:underline">
          + Buat kategori
        </Link>
      </div>
      <Flash searchParams={props.searchParams} />
      <ProductForm
        action={createProduct}
        backHref="/products"
        categories={categories || []}
        suppliers={suppliers || []}
        submitLabel="Simpan Produk"
      />
    </div>
  );
}