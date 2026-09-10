"use client";

import { useMemo, useState } from "react";
import { Plus, Minus, Trash2, Search, ScanBarcode, CreditCard, ArrowRight, Check } from "lucide-react";
import type { ProductUnit } from "@/lib/types";
import { rupiah, paymentMethodLabels, unitLabels } from "@/lib/utils";
import { Card, btn } from "@/components/ui";
import { checkout } from "@/app/actions/sales";
import { quickCreateCustomer } from "@/app/actions/customers";
import { BarcodeScanner } from "@/components/pos/BarcodeScanner";

type PosProduct = {
  id: number;
  name: string;
  sku: string;
  barcode: string | null;
  unit: ProductUnit;
  stock: number;
  min_stock: number;
  retail_price: number;
  wholesale_price: number;
  reseller_price: number;
};

type Tier = "retail" | "wholesale" | "reseller";

type CartItem = {
  product_id: number;
  name: string;
  unit: ProductUnit;
  price: number;
  qty: number;
  stock: number;
};

const tierLabels: Record<Tier, string> = {
  retail: "Retail",
  wholesale: "Grosir",
  reseller: "Reseller",
};

const priceFields: Record<Tier, "retail_price" | "wholesale_price" | "reseller_price"> = {
  retail: "retail_price",
  wholesale: "wholesale_price",
  reseller: "reseller_price",
};

export default function POSClient({
  products,
  customers,
  profileName,
}: {
  products: PosProduct[];
  customers: {
    id: number;
    name: string;
    phone?: string | null;
    city?: string | null;
    address?: string | null;
  }[];
  profileName: string;
}) {
  const [step, setStep] = useState<"items" | "cart" | "payment">("items");
  const [search, setSearch] = useState("");
  const [scanInput, setScanInput] = useState("");
  const [showScanner, setShowScanner] = useState(false);
  const [tier, setTier] = useState<Tier>("retail");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerId, setCustomerId] = useState("");
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [addingCustomer, setAddingCustomer] = useState(false);
  const [addError, setAddError] = useState("");
  const [custList, setCustList] = useState(customers);
  const [method, setMethod] = useState("cash");
  const [paidAmount, setPaidAmount] = useState("0");
  const [discount, setDiscount] = useState("0");
  const [notes, setNotes] = useState("");
  const [pending, setPending] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        (p.barcode && p.barcode.toLowerCase().includes(q))
    );
  }, [search, products]);

  function priceOf(p: PosProduct): number {
    return Number(p[priceFields[tier]]) || Number(p.retail_price) || 0;
  }

  function addToCart(p: PosProduct) {
    setErrorMsg("");
    const existing = cart.find((c) => c.product_id === p.id);
    if (existing && existing.qty >= p.stock) {
      setErrorMsg("Stok tidak cukup untuk " + p.name);
      return;
    }
    if (!existing && p.stock < 1) {
      setErrorMsg("Stok " + p.name + " habis");
      return;
    }
    setCart((prev) => {
      const found = prev.find((c) => c.product_id === p.id);
      if (found) {
        return prev.map((c) =>
          c.product_id === p.id ? { ...c, qty: Math.min(c.qty + 1, p.stock) } : c
        );
      }
      return [
        ...prev,
        { product_id: p.id, name: p.name, unit: p.unit, price: priceOf(p), qty: 1, stock: p.stock },
      ];
    });
  }

  function changeQty(productId: number, delta: number) {
    setCart((prev) =>
      prev
        .map((c) =>
          c.product_id === productId
            ? { ...c, qty: Math.min(Math.max(c.qty + delta, 1), c.stock) }
            : c
        )
        .filter((c) => c.qty > 0)
    );
  }

  function removeItem(productId: number) {
    setCart((prev) => prev.filter((c) => c.product_id !== productId));
  }

  function handleScan(code: string) {
    const p = products.find(
      (x) => x.barcode === code || x.sku === code || x.barcode === code.trim()
    );
    if (p) {
      addToCart(p);
      setSearch("");
    } else {
      setErrorMsg("Barcode tidak ditemukan: " + code);
    }
  }

  function clearCart() {
    setCart([]);
    setCustomerId("");
    setMethod("cash");
    setPaidAmount("0");
    setDiscount("0");
    setNotes("");
    setErrorMsg("");
  }

  function customerLabel(c: {
    id: number;
    name: string;
    phone?: string | null;
    city?: string | null;
    address?: string | null;
  }): string {
    const extra = c.phone || c.city || c.address || "";
    return extra ? c.name + " · " + extra : c.name;
  }

  function openAddCustomer() {
    setAddError("");
    setNewName("");
    setNewPhone("");
    setShowAddCustomer(true);
  }

  async function saveNewCustomer() {
    const name = newName.trim();
    if (!name) {
      setAddError("Nama wajib diisi");
      return;
    }
    setAddingCustomer(true);
    setAddError("");
    const fd = new FormData();
    fd.set("name", name);
    fd.set("phone", newPhone.trim());
    const res: any = await quickCreateCustomer(fd);
    setAddingCustomer(false);
    if (res && res.error) {
      setAddError(
        res.error === "phone_taken"
          ? "Nomor telepon sudah dipakai pelanggan lain"
          : res.error === "name"
            ? "Nama wajib diisi"
            : String(res.error)
      );
      return;
    }
    setCustList((prev) => [
      ...prev,
      { id: res.id, name: res.name, phone: res.phone || null },
    ]);
    setCustomerId(String(res.id));
    setShowAddCustomer(false);
  }

  const subtotal = cart.reduce((a, c) => a + c.price * c.qty, 0);
  const discountNum = Math.min(subtotal, Math.max(0, Number(discount) || 0));
  const total = subtotal - discountNum;
  const paidNum = method === "receivable" ? 0 : Math.max(0, Number(paidAmount) || 0);
  const change = Math.max(0, paidNum - total);

  async function submitSale() {
    if (cart.length === 0) return;
    if (method === "receivable" && !customerId) {
      setErrorMsg("Pilih pelanggan untuk pembayaran piutang");
      return;
    }
    setPending(true);
    setErrorMsg("");
    const fd = new FormData();
    fd.set("item_count", String(cart.length));
    cart.forEach((c, i) => {
      fd.set(`items[${i}].product_id`, String(c.product_id));
      fd.set(`items[${i}].quantity`, String(c.qty));
      fd.set(`items[${i}].price`, String(c.price));
    });
    if (customerId) fd.set("customer_id", customerId);
    fd.set("payment_method", method);
    fd.set("paid_amount", String(paidNum));
    fd.set("discount", String(discountNum));
    if (notes) fd.set("notes", notes);
    await checkout(fd);
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      {errorMsg && (
        <div className="lg:col-span-3 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
          {errorMsg}
        </div>
      )}

      {/* Step 1: product picker */}
      <div className={"lg:col-span-2 space-y-4 " + (step !== "items" ? "hidden lg:block" : "")}>
        <Card>
          <div className="p-4 space-y-3">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <span className="absolute inset-y-0 left-3 flex items-center text-gray-400">
                  <Search size={16} />
                </span>
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari produk / SKU / barcode..."
                  className="w-full rounded-lg border border-gray-300 bg-white pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <input
                value={scanInput}
                onChange={(e) => setScanInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && scanInput.trim()) {
                    handleScan(scanInput.trim());
                    setScanInput("");
                  }
                }}
                placeholder="Scanner barcode..."
                className="w-40 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <button
                type="button"
                onClick={() => setShowScanner(true)}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <ScanBarcode size={16} />
                <span className="hidden sm:inline">Kamera</span>
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-gray-500">Tingkat Harga:</span>
              {(["retail", "wholesale", "reseller"] as Tier[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTier(t)}
                  className={
                    "rounded-full px-3 py-1 text-xs font-medium " +
                    (tier === t
                      ? "bg-emerald-600 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200")
                  }
                >
                  {tierLabels[t]}
                </button>
              ))}
              <span className="ml-auto text-xs text-gray-400">{products.length} produk</span>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
          {filtered.map((p) => {
            const low = p.stock <= p.min_stock;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => addToCart(p)}
                className="rounded-xl border border-gray-200 bg-white p-3 text-left hover:border-emerald-400 hover:shadow-sm transition"
              >
                <p className="text-sm font-semibold text-gray-900 leading-snug line-clamp-2">
                  {p.name}
                </p>
                <p className="mt-1 text-xs text-gray-400">
                  {p.sku}
                  {p.barcode ? " · " + p.barcode : ""}
                </p>
                <div className="mt-2 flex items-center justify-between">
                  <p className="text-sm font-bold text-emerald-600">{rupiah(priceOf(p))}</p>
                  <span
                    className={
                      "rounded px-1.5 py-0.5 text-[10px] font-medium " +
                      (low ? "bg-red-50 text-red-600" : "bg-gray-100 text-gray-500")
                    }
                  >
                    {p.stock} {unitLabels[p.unit]}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Right column: summary / cart / payment */}
      <div className="space-y-4">
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-semibold text-gray-900">Kasir: {profileName}</p>
              <p className="text-[11px] text-gray-400">Keranjang {cart.length} item</p>
            </div>
            {cart.length > 0 && (
              <button
                type="button"
                onClick={clearCart}
                className="text-xs text-red-500 hover:underline"
              >
                Kosongkan
              </button>
            )}
          </div>

          {step === "cart" ? (
            <div className="max-h-[340px] space-y-2 overflow-y-auto pr-1">
              {cart.map((c) => (
                <div key={c.product_id} className="rounded-lg border border-gray-100 p-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-gray-900">{c.name}</p>
                    <button type="button" onClick={() => removeItem(c.product_id)} className="text-gray-300 hover:text-red-500">
                      <Trash2 size={15} />
                    </button>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => changeQty(c.product_id, -1)}
                        className="rounded border border-gray-200 p-1 hover:bg-gray-100"
                      >
                        <Minus size={13} />
                      </button>
                      <span className="w-8 text-center text-sm font-semibold">{c.qty}</span>
                      <button
                        type="button"
                        onClick={() => changeQty(c.product_id, 1)}
                        disabled={c.qty >= c.stock}
                        className="rounded border border-gray-200 p-1 hover:bg-gray-100 disabled:opacity-40"
                      >
                        <Plus size={13} />
                      </button>
                    </div>
                    <p className="text-sm font-bold text-gray-900">
                      {rupiah(c.price * c.qty)}
                      <span className="ml-1 text-[10px] font-normal text-gray-400">
                        @{rupiah(c.price)}
                      </span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : step === "payment" ? (
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">Pelanggan</label>
                <div className="flex gap-2">
                  <select
                    value={customerId}
                    onChange={(e) => setCustomerId(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">Umum (tanpa nama)</option>
                    {custList.map((c) => (
                      <option key={c.id} value={c.id}>
                        {customerLabel(c)}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={openAddCustomer}
                    className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-gray-300 bg-white px-2.5 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
                  >
                    <Plus size={14} /> Tambah
                  </button>
                </div>
                {showAddCustomer && (
                  <div className="mt-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 space-y-2">
                    <p className="text-xs font-semibold text-emerald-700">Pelanggan baru</p>
                    <input
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="Nama pelanggan *"
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <input
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value)}
                      placeholder="Telepon / WA (untuk pembeda)"
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    {addError && <p className="text-xs text-red-600">{addError}</p>}
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={addingCustomer}
                        onClick={saveNewCustomer}
                        className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-40"
                      >
                        {addingCustomer ? "Menyimpan..." : "Simpan & Pilih"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowAddCustomer(false)}
                        className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
                      >
                        Batal
                      </button>
                    </div>
                  </div>
                )}
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">Catatan</label>
                <input
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="opsional"
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">Diskon (Rp)</label>
                <input
                  type="number"
                  min={0}
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">Metode Pembayaran</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {Object.entries(paymentMethodLabels).map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => {
                        setMethod(value);
                        if (value === "receivable") setPaidAmount("0");
                      }}
                      className={
                        "rounded-lg border px-2 py-1.5 text-xs font-medium " +
                        (method === value
                          ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                          : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50")
                      }
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              {method !== "receivable" && (
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-500">
                    Uang Diterima (Rp)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <div className="mt-1.5 flex gap-1.5">
                    {[0, 1000, 5000, 10000, 20000, 50000, 100000].map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() =>
                          setPaidAmount(String(Math.max(v, paidNum)))
                        }
                        className="rounded border border-gray-200 px-2 py-0.5 text-[11px] text-gray-600 hover:bg-gray-100"
                      >
                        {v ? rupiah(v) : "Tdk"}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {method === "receivable" && (
                <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
                  Dicatat sebagai piutang. Pilih pelanggan terlebih dahulu.
                </p>
              )}
            </div>
          ) : (
            <div className="max-h-[340px] overflow-y-auto pr-1">
              {cart.length === 0 ? (
                <p className="py-10 text-center text-sm text-gray-400">Keranjang kosong</p>
              ) : (
                cart.map((c) => (
                  <div key={c.product_id} className="flex items-center justify-between py-1.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm text-gray-800">
                        {c.name} <span className="text-gray-400">×{c.qty}</span>
                      </p>
                      <p className="text-[11px] text-gray-400">@{rupiah(c.price)}</p>
                    </div>
                    <p className="text-sm font-semibold">{rupiah(c.price * c.qty)}</p>
                  </div>
                ))
              )}
            </div>
          )}

          <div className="mt-3 space-y-1.5 border-t border-gray-100 pt-3">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Subtotal</span>
              <span>{rupiah(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>Diskon</span>
              <span>-{rupiah(discountNum)}</span>
            </div>
            <div className="flex justify-between text-base font-bold text-gray-900">
              <span>Total</span>
              <span>{rupiah(total)}</span>
            </div>
            {step === "payment" && method !== "receivable" && (
              <>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Dibayar</span>
                  <span>{rupiah(paidNum)}</span>
                </div>
                <div className="flex justify-between text-sm font-semibold text-emerald-600">
                  <span>Kembalian</span>
                  <span>{rupiah(change)}</span>
                </div>
              </>
            )}
          </div>

          <div className="mt-4 flex flex-col gap-2">
            {step === "items" && (
              <button
                type="button"
                disabled={cart.length === 0}
                onClick={() => setStep("cart")}
                className={btn.primary + " w-full disabled:opacity-40"}
              >
                <CreditCard size={16} /> Lanjut ke Keranjang ({cart.length})
              </button>
            )}
            {step === "cart" && (
              <>
                <button
                  type="button"
                  onClick={() => setStep("payment")}
                  className={btn.primary + " w-full"}
                >
                  Lanjut Pembayaran <ArrowRight size={15} />
                </button>
                <button type="button" onClick={() => setStep("items")} className={btn.secondary + " w-full"}>
                  Kembali Pilih Produk
                </button>
              </>
            )}
            {step === "payment" && (
              <>
                <button
                  type="button"
                  onClick={submitSale}
                  disabled={pending || total < 0}
                  className={btn.primary + " w-full"}
                >
                  <Check size={16} /> {pending ? "Memproses..." : "Selesaikan Transaksi"}
                </button>
                <button type="button" onClick={() => setStep("cart")} className={btn.secondary + " w-full"}>
                  Kembali
                </button>
              </>
            )}
          </div>
        </Card>
      </div>

      {showScanner && <BarcodeScanner onScan={handleScan} onClose={() => setShowScanner(false)} />}
    </div>
  );
}