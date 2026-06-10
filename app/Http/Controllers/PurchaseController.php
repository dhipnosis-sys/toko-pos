<?php

namespace App\Http\Controllers;

use App\Models\Purchase;
use App\Models\PurchaseItem;
use App\Models\Product;
use App\Models\Supplier;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class PurchaseController extends Controller
{
    public function index()
    {
        $purchases = Purchase::with(['supplier', 'user'])
            ->orderByDesc('created_at')
            ->paginate(15);
        return view('purchases.index', compact('purchases'));
    }

    public function create()
    {
        $suppliers = Supplier::orderBy('name')->get();
        $products = Product::where('is_active', true)->orderBy('name')->get();
        return view('purchases.create', compact('suppliers', 'products'));
    }

    public function store(Request $request)
    {
        $request->validate([
            'supplier_id' => 'nullable|exists:suppliers,id',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.cost_price' => 'required|integer|min:0',
            'notes' => 'nullable|string',
        ]);

        try {
            DB::beginTransaction();

            $subtotal = 0;
            foreach ($request->items as $item) {
                $subtotal += $item['cost_price'] * $item['quantity'];
            }

            $invoice = 'PO-' . date('Ymd') . '-' . strtoupper(Str::random(6));

            $purchase = Purchase::create([
                'user_id' => auth()->id(),
                'supplier_id' => $request->supplier_id,
                'invoice_number' => $invoice,
                'subtotal' => $subtotal,
                'grand_total' => $subtotal,
                'status' => 'completed',
                'notes' => $request->notes,
            ]);

            foreach ($request->items as $item) {
                PurchaseItem::create([
                    'purchase_id' => $purchase->id,
                    'product_id' => $item['product_id'],
                    'quantity' => $item['quantity'],
                    'cost_price' => $item['cost_price'],
                    'subtotal' => $item['cost_price'] * $item['quantity'],
                ]);

                $product = Product::findOrFail($item['product_id']);
                $product->increment('stock', $item['quantity']);
            }

            if ($request->supplier_id) {
                $supplier = Supplier::find($request->supplier_id);
                $supplier->increment('total_purchases', $subtotal);
                $supplier->increment('total_debt', $subtotal);
            }

            DB::commit();

            return redirect()->route('purchases.show', $purchase)
                ->with('success', __('app.success_created', ['data' => __('app.purchase_order')]));
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with('error', 'Error: ' . $e->getMessage())
                ->withInput();
        }
    }

    public function show(Purchase $purchase)
    {
        $purchase->load(['items.product', 'supplier', 'user']);
        return view('purchases.show', compact('purchase'));
    }

    public function complete(Purchase $purchase)
    {
        if ($purchase->status === 'completed') {
            return back()->with('error', 'Purchase is already completed.');
        }

        $purchase->update(['status' => 'completed']);

        foreach ($purchase->items as $item) {
            $item->product->increment('stock', $item->quantity);
        }

        return redirect()->route('purchases.index')->with('success', __('app.success_updated', ['data' => __('app.purchase_order')]));
    }
}
