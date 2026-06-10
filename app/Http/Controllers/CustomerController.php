<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use Illuminate\Http\Request;

class CustomerController extends Controller
{
    public function index()
    {
        $customers = Customer::withCount('sales')->orderBy('name')->paginate(15);
        return view('customers.index', compact('customers'));
    }

    public function create()
    {
        return view('customers.create');
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'nullable|string|max:50',
            'email' => 'nullable|email|max:255',
            'address' => 'nullable|string',
            'city' => 'nullable|string|max:100',
            'debt_limit' => 'required|integer|min:0',
            'notes' => 'nullable|string',
        ]);

        Customer::create($request->only([
            'name', 'phone', 'email', 'address', 'city', 'debt_limit', 'notes'
        ]));

        return redirect()->route('customers.index')->with('success', __('app.success_created', ['data' => __('app.customer')]));
    }

    public function edit(Customer $customer)
    {
        return view('customers.edit', compact('customer'));
    }

    public function update(Request $request, Customer $customer)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'nullable|string|max:50',
            'email' => 'nullable|email|max:255',
            'address' => 'nullable|string',
            'city' => 'nullable|string|max:100',
            'debt_limit' => 'required|integer|min:0',
            'notes' => 'nullable|string',
        ]);

        $customer->update($request->only([
            'name', 'phone', 'email', 'address', 'city', 'debt_limit', 'notes'
        ]));

        return redirect()->route('customers.index')->with('success', __('app.success_updated', ['data' => __('app.customer')]));
    }

    public function destroy(Customer $customer)
    {
        if ($customer->sales()->count() > 0) {
            return back()->with('error', 'Cannot delete customer with associated sales.');
        }
        $customer->delete();
        return redirect()->route('customers.index')->with('success', __('app.success_deleted', ['data' => __('app.customer')]));
    }
}
