<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\Category;
use App\Models\Supplier;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ProductController extends Controller
{
    public function index(Request $request)
    {
        $query = Product::with(['category', 'supplier']);

        if ($request->search) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('sku', 'like', "%{$search}%")
                  ->orWhere('barcode', 'like', "%{$search}%");
            });
        }

        if ($request->category_id) {
            $query->where('category_id', $request->category_id);
        }

        if ($request->has('is_active')) {
            $query->where('is_active', $request->is_active);
        }

        $products = $query->orderBy('name')->paginate(15);
        $categories = Category::orderBy('name')->get();

        return view('products.index', compact('products', 'categories'));
    }

    public function create()
    {
        $categories = Category::orderBy('name')->get();
        $suppliers = Supplier::orderBy('name')->get();
        return view('products.create', compact('categories', 'suppliers'));
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'category_id' => 'required|exists:categories,id',
            'supplier_id' => 'nullable|exists:suppliers,id',
            'sku' => 'required|string|max:100|unique:products,sku',
            'barcode' => 'nullable|string|max:100',
            'cost_price' => 'required|integer|min:0',
            'retail_price' => 'required|integer|min:0',
            'wholesale_price' => 'required|integer|min:0',
            'reseller_price' => 'required|integer|min:0',
            'stock' => 'required|integer|min:0',
            'min_stock' => 'required|integer|min:0',
            'unit' => 'required|in:pcs,pack,box',
            'description' => 'nullable|string',
            'notes' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        Product::create([
            'category_id' => $request->category_id,
            'supplier_id' => $request->supplier_id,
            'name' => $request->name,
            'slug' => Str::slug($request->name) . '-' . Str::random(4),
            'sku' => $request->sku,
            'barcode' => $request->barcode,
            'description' => $request->description,
            'cost_price' => $request->cost_price,
            'retail_price' => $request->retail_price,
            'wholesale_price' => $request->wholesale_price,
            'reseller_price' => $request->reseller_price,
            'stock' => $request->stock,
            'min_stock' => $request->min_stock,
            'unit' => $request->unit,
            'notes' => $request->notes,
            'image' => null,
            'is_active' => $request->boolean('is_active', true),
        ]);

        return redirect()->route('products.index')->with('success', __('app.success_created', ['data' => __('app.product_name')]));
    }

    public function edit(Product $product)
    {
        $categories = Category::orderBy('name')->get();
        $suppliers = Supplier::orderBy('name')->get();
        return view('products.edit', compact('product', 'categories', 'suppliers'));
    }

    public function update(Request $request, Product $product)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'category_id' => 'required|exists:categories,id',
            'supplier_id' => 'nullable|exists:suppliers,id',
            'sku' => 'required|string|max:100|unique:products,sku,' . $product->id,
            'barcode' => 'nullable|string|max:100',
            'cost_price' => 'required|integer|min:0',
            'retail_price' => 'required|integer|min:0',
            'wholesale_price' => 'required|integer|min:0',
            'reseller_price' => 'required|integer|min:0',
            'stock' => 'required|integer|min:0',
            'min_stock' => 'required|integer|min:0',
            'unit' => 'required|in:pcs,pack,box',
            'description' => 'nullable|string',
            'notes' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        $product->update([
            'category_id' => $request->category_id,
            'supplier_id' => $request->supplier_id,
            'name' => $request->name,
            'sku' => $request->sku,
            'barcode' => $request->barcode,
            'description' => $request->description,
            'cost_price' => $request->cost_price,
            'retail_price' => $request->retail_price,
            'wholesale_price' => $request->wholesale_price,
            'reseller_price' => $request->reseller_price,
            'stock' => $request->stock,
            'min_stock' => $request->min_stock,
            'unit' => $request->unit,
            'notes' => $request->notes,
            'is_active' => $request->boolean('is_active', true),
        ]);

        return redirect()->route('products.index')->with('success', __('app.success_updated', ['data' => __('app.product_name')]));
    }

    public function searchAjax(Request $request)
    {
        $query = Product::where('is_active', true);

        if ($request->q) {
            $q = $request->q;
            $query->where(function ($w) use ($q) {
                $w->where('name', 'like', "%{$q}%")
                  ->orWhere('sku', 'like', "%{$q}%")
                  ->orWhere('barcode', 'like', "%{$q}%");
            });
        }

        $products = $query->orderBy('name')->limit(20)->get(['id', 'name', 'sku', 'barcode', 'cost_price', 'retail_price']);

        return response()->json($products);
    }

    public function destroy(Product $product)
    {
        $product->delete();
        return redirect()->route('products.index')->with('success', __('app.success_deleted', ['data' => __('app.product_name')]));
    }
}
