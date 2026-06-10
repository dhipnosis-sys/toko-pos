<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\Customer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class POSController extends Controller
{
    public function index()
    {
        $products = Product::where('is_active', true)
            ->with('category')
            ->orderBy('name')
            ->get();
        $categories = \App\Models\Category::orderBy('name')->get();
        $customers = Customer::orderBy('name')->get();
        return view('pos.index', compact('products', 'categories', 'customers'));
    }

    public function getProducts(Request $request)
    {
        $query = Product::where('is_active', true)->with('category');

        if ($request->search) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('barcode', 'like', "%{$search}%")
                  ->orWhere('sku', 'like', "%{$search}%");
            });
        }

        if ($request->category_id) {
            $query->where('category_id', $request->category_id);
        }

        return response()->json($query->orderBy('name')->get());
    }

    public function getProduct(Product $product)
    {
        return response()->json($product->load('category'));
    }

    public function checkout(Request $request)
    {
        $request->validate([
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.price' => 'required|integer|min:0',
            'payment_method' => 'required|in:cash,transfer,qris,ewallet,credit,debit,receivable',
            'paid_amount' => 'required|integer|min:0',
            'discount' => 'nullable|integer|min:0',
            'customer_id' => 'nullable|exists:customers,id',
        ]);

        try {
            DB::beginTransaction();

            $subtotal = 0;
            foreach ($request->items as $item) {
                $product = Product::findOrFail($item['product_id']);
                if ($product->stock < $item['quantity']) {
                    return response()->json([
                        'success' => false,
                        'message' => "Stok {$product->name} tidak mencukupi. Tersedia: {$product->stock}"
                    ], 422);
                }
                $subtotal += $item['price'] * $item['quantity'];
            }

            $discount = $request->discount ?? 0;
            $grandTotal = $subtotal - $discount;
            $changeAmount = max(0, $request->paid_amount - $grandTotal);

            $invoice = 'INV-' . date('Ymd') . '-' . strtoupper(Str::random(6));

            $sale = Sale::create([
                'user_id' => auth()->id(),
                'customer_id' => $request->customer_id,
                'invoice_number' => $invoice,
                'subtotal' => $subtotal,
                'discount' => $discount,
                'tax' => 0,
                'grand_total' => $grandTotal,
                'paid_amount' => $request->paid_amount,
                'change_amount' => $changeAmount,
                'payment_method' => $request->payment_method,
                'status' => 'completed',
                'notes' => $request->notes,
            ]);

            foreach ($request->items as $item) {
                $product = Product::findOrFail($item['product_id']);
                SaleItem::create([
                    'sale_id' => $sale->id,
                    'product_id' => $product->id,
                    'quantity' => $item['quantity'],
                    'unit_price' => $item['price'],
                    'cost_price' => $product->cost_price,
                    'subtotal' => $item['price'] * $item['quantity'],
                ]);
                $product->decrement('stock', $item['quantity']);
            }

            if ($request->customer_id) {
                $customer = Customer::find($request->customer_id);
                $customer->increment('total_purchases', $grandTotal);
                $customer->increment('total_paid', $request->paid_amount);
                if ($request->payment_method === 'receivable' || $grandTotal > $request->paid_amount) {
                    $debtAmount = $grandTotal - $request->paid_amount;
                    $customer->increment('total_debt', $debtAmount);
                }
            }

            $sale->payments()->create([
                'amount' => $request->paid_amount,
                'payment_method' => $request->payment_method,
                'notes' => __('app.payment') . ' ' . __('app.for') . ' ' . $invoice,
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'sale_id' => $sale->id,
                'invoice' => $invoice,
                'change' => $changeAmount,
                'print_url' => route('pos.print', $sale),
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => __('app.error') . ': ' . $e->getMessage()
            ], 500);
        }
    }

    public function printReceipt(Sale $sale)
    {
        $sale->load('items.product', 'user', 'customer');
        return view('pos.receipt', compact('sale'));
    }
}
