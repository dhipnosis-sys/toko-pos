<?php

namespace App\Http\Controllers;

use App\Models\Sale;
use Illuminate\Http\Request;

class SaleController extends Controller
{
    public function index(Request $request)
    {
        $query = Sale::with(['user', 'customer', 'items']);

        if ($request->search) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('invoice_number', 'like', "%{$search}%")
                  ->orWhereHas('customer', function($cq) use ($search) {
                      $cq->where('name', 'like', "%{$search}%");
                  });
            });
        }

        if ($request->payment_method) {
            $query->where('payment_method', $request->payment_method);
        }

        if ($request->status) {
            $query->where('status', $request->status);
        }

        if ($request->date_from) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }

        if ($request->date_to) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        $sales = $query->orderByDesc('created_at')->paginate(15);

        $totals = Sale::where(function($q) use ($request) {
                if ($request->search) {
                    $s = $request->search;
                    $q->where(function($sq) use ($s) {
                        $sq->where('invoice_number', 'like', "%{$s}%")
                          ->orWhereHas('customer', fn($cq) => $cq->where('name', 'like', "%{$s}%"));
                    });
                }
                if ($request->payment_method) $q->where('payment_method', $request->payment_method);
                if ($request->status) $q->where('status', $request->status);
                if ($request->date_from) $q->whereDate('created_at', '>=', $request->date_from);
                if ($request->date_to) $q->whereDate('created_at', '<=', $request->date_to);
            })
            ->selectRaw('COALESCE(SUM(grand_total),0) as total_grand, COALESCE(SUM(paid_amount),0) as total_paid, COALESCE(SUM(change_amount),0) as total_change')
            ->first();

        return view('sales.index', compact('sales', 'totals'));
    }

    public function show(Sale $sale)
    {
        $sale->load(['items.product', 'user', 'customer', 'payments']);
        return view('sales.show', compact('sale'));
    }
}
