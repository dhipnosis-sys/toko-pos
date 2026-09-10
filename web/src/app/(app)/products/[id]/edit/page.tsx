import { notFound } from "next/navigation";
import { requireRole } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { Flash } from "@/components/Flash";
import { ProductForm } from "@/components/forms/ProductForm";
import { updateProduct } from "@/app/actions/products";

export default async function EditProductPage(props: PageProps<"/products/[id]/edit">) {
  await requireRole(["owner", "warehouse"]);
  const { id } = await props.params;
  const productId = Number(id);
  if (Number.isNaN(productId)) notFound();

  const supabase = await createClient();
  const { data: product } = await supabase
    .from("products")
    .select("*")
    .eq("id", productId)
    .single();
  if (!product) notFound();

  const { data: categories } = await supabase.from("categories").select("id, name").order("name");
  const { data: suppliers } = await supabase.from("suppliers").select("id, name").order("name");

  return (
    <div className="max-w-3xl">
      <h1 className="mb-5 text-xl font-bold text-gray-900">Edit Produk</h1>
      <Flash searchParams={props.searchParams} />
      <ProductForm
        action={updateProduct.bind(null, productId)}
        backHref="/products"
        categories={categories || []}
        suppliers={suppliers || []}
        defaults={{
          category_id: product.category_id,
          supplier_id: product.supplier_id,
          name: product.name,
          sku: product.sku,
          barcode: product.barcode,
          unit: product.unit,
          cost_price: product.cost_price,
          retail_price: product.retail_price,
          wholesale_price: product.wholesale_price,
          reseller_price: product.reseller_price,
          stock: product.stock,
          min_stock: product.min_stock,
          description: product.description,
          notes: product.notes,
          is_active: product.is_active,
        }}
        submitLabel="Simpan Perubahan"
      />
    </div>
  );
}