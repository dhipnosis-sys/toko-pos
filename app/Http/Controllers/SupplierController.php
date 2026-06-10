<?php

namespace App\Http\Controllers;

use App\Models\Supplier;
use App\Models\Purchase;
use Illuminate\Http\Request;

class SupplierController extends Controller
{
    public function index()
    {
        $suppliers = Supplier::withCount('purchases')->orderBy('name')->paginate(15);
        return view('suppliers.index', compact('suppliers'));
    }

    public function create()
    {
        return view('suppliers.create');
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'nullable|string|max:50',
            'email' => 'nullable|email|max:255',
            'address' => 'nullable|string',
            'city' => 'nullable|string|max:100',
            'tax_id' => 'nullable|string|max:100',
            'notes' => 'nullable|string',
        ]);

        Supplier::create($request->only([
            'name', 'phone', 'email', 'address', 'city', 'tax_id', 'notes'
        ]));

        return redirect()->route('suppliers.index')->with('success', __('app.success_created', ['data' => __('app.supplier')]));
    }

    public function edit(Supplier $supplier)
    {
        return view('suppliers.edit', compact('supplier'));
    }

    public function update(Request $request, Supplier $supplier)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'nullable|string|max:50',
            'email' => 'nullable|email|max:255',
            'address' => 'nullable|string',
            'city' => 'nullable|string|max:100',
            'tax_id' => 'nullable|string|max:100',
            'notes' => 'nullable|string',
        ]);

        $supplier->update($request->only([
            'name', 'phone', 'email', 'address', 'city', 'tax_id', 'notes'
        ]));

        return redirect()->route('suppliers.index')->with('success', __('app.success_updated', ['data' => __('app.supplier')]));
    }

    public function destroy(Supplier $supplier)
    {
        if ($supplier->purchases()->count() > 0) {
            return back()->with('error', 'Cannot delete supplier with associated purchases.');
        }
        $supplier->delete();
        return redirect()->route('suppliers.index')->with('success', __('app.success_deleted', ['data' => __('app.supplier')]));
    }

    public function payForm(Supplier $supplier)
    {
        return view('suppliers.pay', compact('supplier'));
    }

    public function payStore(Request $request, Supplier $supplier)
    {
        $request->validate([
            'amount' => 'required|integer|min:1',
            'payment_method' => 'required|in:cash,transfer,qris,ewallet',
            'notes' => 'nullable|string',
        ]);

        $supplier->increment('total_paid', $request->amount);
        $supplier->decrement('total_debt', $request->amount);

        $supplier->payments()->create([
            'amount' => $request->amount,
            'payment_method' => $request->payment_method,
            'notes' => $request->notes,
        ]);

        return redirect()->route('suppliers.index')->with('success', __('app.success_created', ['data' => __('app.payment')]));
    }
}
