<?php

namespace App\Http\Controllers;

use App\Models\BillOfMaterial;
use App\Models\BillOfMaterialItem;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class BOMController extends Controller
{
    public function index()
    {
        $boms = BillOfMaterial::with('product', 'items.product')->latest()->get();
        return view('bom.index', compact('boms'));
    }

    public function create()
    {
        $products = Product::where('is_active', true)->orderBy('name')->get();
        return view('bom.create', compact('products'));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'product_id' => 'nullable|exists:products,id',
            'finished_good_type' => 'required|in:product,manual',
            'finished_good_name' => 'nullable|string|max:255',
            'finished_good_unit' => 'nullable|string|max:50',
            'name' => 'required|string|max:255',
            'quantity' => 'required|numeric|min:0.01',
            'unit' => 'nullable|string|max:50',
            'labor_cost' => 'nullable|integer|min:0',
            'overhead_cost' => 'nullable|integer|min:0',
            'profit_type' => 'required|in:percentage,amount',
            'profit_value' => 'nullable|integer|min:0',
            'notes' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.item_type' => 'required|in:product,manual',
            'items.*.product_id' => 'nullable|exists:products,id',
            'items.*.item_name' => 'nullable|string|max:255',
            'items.*.item_unit' => 'nullable|string|max:50',
            'items.*.quantity' => 'required|numeric|min:0.01',
            'items.*.unit_cost' => 'nullable|integer|min:0',
        ]);

        DB::beginTransaction();
        try {
            $bom = BillOfMaterial::create([
                'product_id' => $validated['finished_good_type'] === 'product' ? $validated['product_id'] : null,
                'finished_good_type' => $validated['finished_good_type'],
                'finished_good_name' => $validated['finished_good_type'] === 'manual' ? $validated['finished_good_name'] : null,
                'finished_good_unit' => $validated['finished_good_type'] === 'manual' ? $validated['finished_good_unit'] : null,
                'name' => $validated['name'],
                'quantity' => $validated['quantity'],
                'unit' => $validated['unit'] ?? null,
                'labor_cost' => $validated['labor_cost'] ?? 0,
                'overhead_cost' => $validated['overhead_cost'] ?? 0,
                'profit_type' => $validated['profit_type'],
                'profit_value' => $validated['profit_value'] ?? 0,
                'notes' => $validated['notes'] ?? null,
            ]);

            foreach ($validated['items'] as $item) {
                $data = [
                    'bill_of_material_id' => $bom->id,
                    'item_type' => $item['item_type'],
                    'quantity' => $item['quantity'],
                ];
                if ($item['item_type'] === 'product') {
                    $data['product_id'] = $item['product_id'];
                    $data['unit_cost'] = 0;
                } else {
                    $data['item_name'] = $item['item_name'];
                    $data['item_unit'] = $item['item_unit'] ?? null;
                    $data['unit_cost'] = $item['unit_cost'] ?? 0;
                }
                BillOfMaterialItem::create($data);
            }

            DB::commit();
            return redirect()->route('bom.index')->with('success', 'BOM berhasil dibuat');
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with('error', 'Gagal: ' . $e->getMessage());
        }
    }

    public function show(BillOfMaterial $bom)
    {
        $bom->load('product', 'items.product');
        $products = Product::where('is_active', true)->orderBy('name')->get();
        return view('bom.show', compact('bom', 'products'));
    }

    public function edit(BillOfMaterial $bom)
    {
        $bom->load('items');
        $products = Product::where('is_active', true)->orderBy('name')->get();
        return view('bom.edit', compact('bom', 'products'));
    }

    public function update(Request $request, BillOfMaterial $bom)
    {
        $validated = $request->validate([
            'product_id' => 'nullable|exists:products,id',
            'finished_good_type' => 'required|in:product,manual',
            'finished_good_name' => 'nullable|string|max:255',
            'finished_good_unit' => 'nullable|string|max:50',
            'name' => 'required|string|max:255',
            'quantity' => 'required|numeric|min:0.01',
            'unit' => 'nullable|string|max:50',
            'labor_cost' => 'nullable|integer|min:0',
            'overhead_cost' => 'nullable|integer|min:0',
            'profit_type' => 'required|in:percentage,amount',
            'profit_value' => 'nullable|integer|min:0',
            'notes' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.id' => 'nullable|exists:bill_of_material_items,id',
            'items.*.item_type' => 'required|in:product,manual',
            'items.*.product_id' => 'nullable|exists:products,id',
            'items.*.item_name' => 'nullable|string|max:255',
            'items.*.item_unit' => 'nullable|string|max:50',
            'items.*.quantity' => 'required|numeric|min:0.01',
            'items.*.unit_cost' => 'nullable|integer|min:0',
        ]);

        DB::beginTransaction();
        try {
            $bom->update([
                'product_id' => $validated['finished_good_type'] === 'product' ? $validated['product_id'] : null,
                'finished_good_type' => $validated['finished_good_type'],
                'finished_good_name' => $validated['finished_good_type'] === 'manual' ? $validated['finished_good_name'] : null,
                'finished_good_unit' => $validated['finished_good_type'] === 'manual' ? $validated['finished_good_unit'] : null,
                'name' => $validated['name'],
                'quantity' => $validated['quantity'],
                'unit' => $validated['unit'] ?? null,
                'labor_cost' => $validated['labor_cost'] ?? 0,
                'overhead_cost' => $validated['overhead_cost'] ?? 0,
                'profit_type' => $validated['profit_type'],
                'profit_value' => $validated['profit_value'] ?? 0,
                'notes' => $validated['notes'] ?? null,
            ]);

            $keepIds = [];
            foreach ($validated['items'] as $item) {
                $data = [
                    'item_type' => $item['item_type'],
                    'quantity' => $item['quantity'],
                    'unit_cost' => 0,
                ];
                if ($item['item_type'] === 'product') {
                    $data['product_id'] = $item['product_id'];
                    $data['item_name'] = null;
                    $data['item_unit'] = null;
                } else {
                    $data['product_id'] = null;
                    $data['item_name'] = $item['item_name'];
                    $data['item_unit'] = $item['item_unit'] ?? null;
                    $data['unit_cost'] = $item['unit_cost'] ?? 0;
                }

                if (!empty($item['id'])) {
                    $bomItem = BillOfMaterialItem::find($item['id']);
                    if ($bomItem) {
                        $bomItem->update($data);
                        $keepIds[] = $bomItem->id;
                    }
                } else {
                    $data['bill_of_material_id'] = $bom->id;
                    $new = BillOfMaterialItem::create($data);
                    $keepIds[] = $new->id;
                }
            }

            $bom->items()->whereNotIn('id', $keepIds)->delete();
            DB::commit();
            return redirect()->route('bom.index')->with('success', 'BOM berhasil diubah');
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with('error', 'Gagal: ' . $e->getMessage());
        }
    }

    public function destroy(BillOfMaterial $bom)
    {
        $bom->items()->delete();
        $bom->delete();
        return redirect()->route('bom.index')->with('success', 'BOM berhasil dihapus');
    }

    public function simulateHpp(Request $request)
    {
        $request->validate([
            'bom_id' => 'required|exists:bill_of_materials,id',
            'quantity' => 'required|numeric|min:1',
            'labor_cost' => 'nullable|integer|min:0',
            'overhead_cost' => 'nullable|integer|min:0',
            'profit_type' => 'nullable|in:percentage,amount',
            'profit_value' => 'nullable|integer|min:0',
        ]);

        $bom = BillOfMaterial::with('items.product')->findOrFail($request->bom_id);
        $prodQty = $request->quantity;
        $laborCost = $request->labor_cost ?? $bom->labor_cost;
        $overheadCost = $request->overhead_cost ?? $bom->overhead_cost;
        $profitType = $request->profit_type ?? $bom->profit_type;
        $profitValue = $request->profit_value ?? $bom->profit_value;

        $rawMaterialTotal = 0;
        $details = [];

        foreach ($bom->items as $item) {
            $qtyNeeded = ($item->quantity / $bom->quantity) * $prodQty;

            if ($item->item_type === 'product' && $item->product) {
                $unitCost = $item->product->cost_price ?? 0;
                $name = $item->product->name;
                $unit = $item->product->unit;
            } else {
                $unitCost = $item->unit_cost ?? 0;
                $name = $item->item_name ?? '—';
                $unit = $item->item_unit ?? '—';
            }

            $subtotal = $qtyNeeded * $unitCost;
            $rawMaterialTotal += $subtotal;

            $details[] = [
                'product_name' => $name,
                'qty_needed' => $qtyNeeded,
                'unit' => $unit,
                'unit_cost' => $unitCost,
                'subtotal' => (int) $subtotal,
            ];
        }

        $totalCost = $rawMaterialTotal + $laborCost + $overheadCost;
        $costPerUnit = $prodQty > 0 ? (int) round($totalCost / $prodQty) : 0;

        $profitAmount = 0;
        if ($profitType === 'percentage') {
            $profitAmount = (int) round($totalCost * $profitValue / 100);
        } else {
            $profitAmount = $profitValue;
        }
        $suggestedPrice = $totalCost + $profitAmount;
        $suggestedPricePerUnit = $prodQty > 0 ? (int) round($suggestedPrice / $prodQty) : 0;

        $finishedGoodName = $bom->finished_good_type === 'product' && $bom->product
            ? $bom->product->name
            : ($bom->finished_good_name ?? '—');

        return response()->json([
            'success' => true,
            'product_name' => $finishedGoodName,
            'product_id' => $bom->product_id,
            'finished_good_type' => $bom->finished_good_type,
            'production_qty' => $prodQty,
            'raw_material_cost' => (int) $rawMaterialTotal,
            'labor_cost' => (int) $laborCost,
            'overhead_cost' => (int) $overheadCost,
            'total_cost' => (int) $totalCost,
            'cost_per_unit' => $costPerUnit,
            'profit_type' => $profitType,
            'profit_value' => $profitValue,
            'profit_amount' => $profitAmount,
            'suggested_price' => $suggestedPrice,
            'suggested_price_per_unit' => $suggestedPricePerUnit,
            'details' => $details,
        ]);
    }

    public function saveCostPrice(Request $request)
    {
        $request->validate([
            'product_id' => 'required|exists:products,id',
            'cost_price' => 'required|integer|min:0',
        ]);

        $product = Product::findOrFail($request->product_id);
        $product->update(['cost_price' => $request->cost_price]);

        return response()->json([
            'success' => true,
            'message' => 'Harga pokok berhasil disimpan ke produk',
        ]);
    }
}
