<?php

namespace App\Http\Controllers;

use App\Models\BillOfMaterial;
use App\Models\Product;
use App\Models\ProductionOrder;
use App\Models\ProductionOrderItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ProductionController extends Controller
{
    public function index()
    {
        $orders = ProductionOrder::with('product', 'user', 'items.product')->latest()->get();
        return view('production.index', compact('orders'));
    }

    public function create()
    {
        $products = Product::where('is_active', true)->orderBy('name')->get();
        $boms = BillOfMaterial::with('product')->get();
        return view('production.create', compact('products', 'boms'));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'product_id' => 'nullable|exists:products,id',
            'bill_of_material_id' => 'nullable|exists:bill_of_materials,id',
            'quantity' => 'required|integer|min:1',
            'notes' => 'nullable|string',
        ]);

        DB::beginTransaction();
        try {
            $orderNumber = 'PO-' . date('Ymd') . '-' . strtoupper(Str::random(6));

            $fgType = 'product';
            $fgName = null;
            if ($validated['bill_of_material_id']) {
                $bom = BillOfMaterial::with('items')->find($validated['bill_of_material_id']);
                $fgType = $bom->finished_good_type;
                $fgName = $bom->finished_good_type === 'manual' ? $bom->finished_good_name : null;
            }

            $laborCost = $validated['bill_of_material_id'] ? ($bom->labor_cost ?? 0) : 0;
            $overheadCost = $validated['bill_of_material_id'] ? ($bom->overhead_cost ?? 0) : 0;

            $order = ProductionOrder::create([
                'order_number' => $orderNumber,
                'product_id' => $validated['product_id'],
                'bill_of_material_id' => $validated['bill_of_material_id'] ?? null,
                'finished_good_type' => $fgType,
                'finished_good_name' => $fgName,
                'quantity' => $validated['quantity'],
                'status' => 'planned',
                'total_labor_cost' => $laborCost,
                'total_overhead_cost' => $overheadCost,
                'user_id' => auth()->id(),
                'notes' => $validated['notes'] ?? null,
            ]);

            if ($validated['bill_of_material_id']) {
                foreach ($bom->items as $item) {
                    $qtyPlanned = ($item->quantity / $bom->quantity) * $validated['quantity'];

                    if ($item->item_type === 'product' && $item->product) {
                        $unitCost = $item->product->cost_price ?? 0;
                        $prodId = $item->product_id;
                    } else {
                        $unitCost = $item->unit_cost ?? 0;
                        $prodId = null;
                    }

                    $subtotal = (int) ($qtyPlanned * $unitCost);

                    ProductionOrderItem::create([
                        'production_order_id' => $order->id,
                        'product_id' => $prodId,
                        'item_type' => $item->item_type,
                        'item_name' => $item->item_type === 'manual' ? $item->item_name : null,
                        'quantity_planned' => $qtyPlanned,
                        'unit_cost' => $unitCost,
                        'subtotal' => $subtotal,
                    ]);
                }

                $rawCost = $order->items()->sum('subtotal');
                $totalCost = $rawCost + $laborCost + $overheadCost;
                $costPerUnit = $validated['quantity'] > 0 ? (int) round($totalCost / $validated['quantity']) : 0;

                $order->update([
                    'total_raw_material_cost' => $rawCost,
                    'total_cost' => $totalCost,
                    'cost_per_unit' => $costPerUnit,
                ]);
            }

            DB::commit();
            return redirect()->route('production.index')->with('success', 'Production order berhasil dibuat');
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with('error', 'Gagal: ' . $e->getMessage());
        }
    }

    public function show(ProductionOrder $production)
    {
        $production->load('product', 'user', 'items.product', 'billOfMaterial');
        return view('production.show', compact('production'));
    }

    public function process(ProductionOrder $production)
    {
        if ($production->status !== 'planned') {
            return back()->with('error', 'Hanya order dengan status planned yang bisa diproses');
        }

        DB::beginTransaction();
        try {
            $production->load('items.product');

            foreach ($production->items as $item) {
                $qtyToUse = $item->quantity_planned;

                if ($item->product) {
                    $product = $item->product;
                    if ($product->stock < $qtyToUse) {
                        DB::rollBack();
                        return back()->with('error', "Stok {$product->name} tidak mencukupi. Tersedia: {$product->stock}, dibutuhkan: {$qtyToUse}");
                    }
                    $product->decrement('stock', $qtyToUse);
                }

                $item->update([
                    'quantity_used' => $qtyToUse,
                    'subtotal' => (int) ($qtyToUse * $item->unit_cost),
                ]);
            }

            $rawCost = $production->items()->sum('subtotal');
            $totalCost = $rawCost + $production->total_labor_cost + $production->total_overhead_cost;
            $costPerUnit = $totalCost > 0
                ? (int) round($totalCost / $production->quantity)
                : ($production->cost_per_unit);

            $production->update([
                'status' => 'completed',
                'total_raw_material_cost' => $rawCost,
                'total_cost' => $totalCost,
                'cost_per_unit' => $costPerUnit,
                'started_at' => now(),
                'completed_at' => now(),
            ]);

            $productName = null;
            $suggestedPricePerUnit = 0;
            if ($production->product) {
                $production->product->increment('stock', $production->quantity);
                $productName = $production->product->name;
            } elseif ($production->finished_good_type === 'manual') {
                $bom = $production->billOfMaterial;
                $sku = 'PRD-' . date('Ymd') . '-' . strtoupper(Str::random(5));
                $unit = $bom ? ($bom->finished_good_unit ?? 'pcs') : 'pcs';

                if ($bom) {
                    $profitAmount = $bom->profit_type === 'percentage'
                        ? (int) round($totalCost * $bom->profit_value / 100)
                        : $bom->profit_value;
                    $suggestedPrice = $totalCost + $profitAmount;
                    $suggestedPricePerUnit = $production->quantity > 0 ? (int) round($suggestedPrice / $production->quantity) : 0;
                }

                $productName = $production->finished_good_name ?? 'Produksi #' . $production->order_number;
                $slug = Str::slug($productName) . '-' . Str::random(6);

                $newProduct = Product::create([
                    'name' => $productName,
                    'slug' => $slug,
                    'sku' => $sku,
                    'cost_price' => $costPerUnit,
                    'retail_price' => $suggestedPricePerUnit,
                    'wholesale_price' => 0,
                    'reseller_price' => 0,
                    'stock' => $production->quantity,
                    'unit' => $unit,
                    'is_active' => true,
                ]);

                $production->update(['product_id' => $newProduct->id]);
                $productName = $newProduct->name;
            }

            DB::commit();
            $msg = 'Produksi berhasil.';
            if ($productName) $msg .= ' Produk "' . $productName . '" telah ditambahkan ke daftar produk dengan stok ' . $production->quantity . '.';
            return redirect()->route('production.show', $production)->with('success', $msg);
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with('error', 'Gagal: ' . $e->getMessage());
        }
    }

    public function destroy(ProductionOrder $production)
    {
        if ($production->status === 'completed') {
            return back()->with('error', 'Tidak bisa hapus order yang sudah selesai');
        }
        $production->items()->delete();
        $production->delete();
        return redirect()->route('production.index')->with('success', 'Production order dihapus');
    }

    public function cancel(ProductionOrder $production)
    {
        if ($production->status !== 'planned') {
            return back()->with('error', 'Hanya order planned yang bisa dibatalkan');
        }
        $production->update(['status' => 'cancelled']);
        return redirect()->route('production.index')->with('success', 'Production order dibatalkan');
    }

    public function applyCostPrice(ProductionOrder $production)
    {
        if ($production->status !== 'completed') {
            return back()->with('error', 'Hanya order completed yang bisa apply cost price');
        }

        if (!$production->product) {
            return back()->with('error', 'Tidak bisa apply cost price untuk barang manual (tidak terdaftar di produk)');
        }

        $production->product->update(['cost_price' => $production->cost_per_unit]);
        $production->update(['apply_cost_price' => true]);

        return redirect()->route('production.show', $production)->with('success', 'Cost price produk berhasil diupdate ke Rp ' . number_format($production->cost_per_unit, 0, ',', '.'));
    }
}
