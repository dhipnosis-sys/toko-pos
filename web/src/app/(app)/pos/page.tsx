import { getCurrentUser } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { Flash } from "@/components/Flash";
import POSClient, { type PosDigitalType } from "@/components/pos/POSClient";

export default async function PosPage(props: PageProps<"/pos">) {
  const profile = await getCurrentUser();
  const supabase = await createClient();

  const [{ data: products }, { data: customers }, { data: digitalTypes }, { data: modal }] =
    await Promise.all([
      supabase
        .from("products")
        .select(
          "id, name, sku, barcode, unit, stock, min_stock, retail_price, wholesale_price, reseller_price, units:product_units(id, unit, factor, retail_price, wholesale_price, reseller_price, is_default)"
        )
        .eq("is_active", true)
        .order("name"),
      supabase.from("customers").select("id, name, phone, city, address").order("name"),
      supabase.from("digital_types").select("id, name, reduces_balance, is_active").eq("is_active", true).order("name"),
      supabase.from("digital_modal").select("balance").eq("id", 1).single(),
    ]);

  const digitalTypesProp: PosDigitalType[] = (digitalTypes || []).map((t: any) => ({
    id: t.id,
    name: t.name,
    reduces_balance: t.reduces_balance,
  }));

  const productsProp = (products || []).map((p: any) => ({
    id: p.id,
    name: p.name,
    sku: p.sku,
    barcode: p.barcode,
    unit: p.unit,
    stock: Number(p.stock),
    min_stock: Number(p.min_stock),
    retail_price: p.retail_price,
    wholesale_price: p.wholesale_price,
    reseller_price: p.reseller_price,
    units: (p.units || []).map((u: any) => ({
      unit: u.unit,
      factor: Number(u.factor),
      retail_price: u.retail_price,
      wholesale_price: u.wholesale_price,
      reseller_price: u.reseller_price,
      is_default: u.is_default,
    })),
  }));

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Kasir</h1>
          <p className="text-sm text-gray-500 mt-1">Pilih produk & layanan digital, isi keranjang, selesaikan pembayaran.</p>
        </div>
      </div>
      <Flash searchParams={props.searchParams} />
      <POSClient
        products={productsProp}
        customers={customers || []}
        profileName={profile.name}
        digitalTypes={digitalTypesProp}
        digitalModalBalance={Number(modal?.balance || 0)}
      />
    </div>
  );
}