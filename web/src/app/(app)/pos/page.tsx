import { getCurrentUser } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { Flash } from "@/components/Flash";
import POSClient from "@/components/pos/POSClient";

export default async function PosPage(props: PageProps<"/pos">) {
  const profile = await getCurrentUser();
  const supabase = await createClient();

  const [{ data: products }, { data: customers }] = await Promise.all([
    supabase
      .from("products")
      .select(
        "id, name, sku, barcode, unit, stock, min_stock, retail_price, wholesale_price, reseller_price"
      )
      .eq("is_active", true)
      .order("name"),
    supabase.from("customers").select("id, name").order("name"),
  ]);

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Kasir</h1>
          <p className="text-sm text-gray-500 mt-1">Pilih produk, isi keranjang, selesaikan pembayaran.</p>
        </div>
      </div>
      <Flash searchParams={props.searchParams} />
      <POSClient
        products={(products || []).map((p: any) => ({
          id: p.id,
          name: p.name,
          sku: p.sku,
          barcode: p.barcode,
          unit: p.unit,
          stock: p.stock,
          min_stock: p.min_stock,
          retail_price: p.retail_price,
          wholesale_price: p.wholesale_price,
          reseller_price: p.reseller_price,
        }))}
        customers={customers || []}
        profileName={profile.name}
      />
    </div>
  );
}