<?php

namespace App\Http\Controllers;

use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\Purchase;
use App\Models\Product;
use App\Models\Customer;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReportController extends Controller
{
    public function index(Request $request)
    {
        $period = $request->period ?? 'monthly';
        $dateFrom = $request->date_from ? Carbon::parse($request->date_from) : Carbon::now()->startOfMonth();
        $dateTo = $request->date_to ? Carbon::parse($request->date_to)->endOfDay() : Carbon::now();

        $salesQuery = Sale::where('status', 'completed')
            ->where('created_at', '>=', $dateFrom)
            ->where('created_at', '<=', $dateTo);

        $totalSales = (clone $salesQuery)->sum('grand_total');
        $totalTransactions = (clone $salesQuery)->count();

        $totalCost = SaleItem::whereHas('sale', fn($q) => $q->where('status', 'completed')
            ->where('created_at', '>=', $dateFrom)
            ->where('created_at', '<=', $dateTo))
            ->select(DB::raw('SUM(quantity * cost_price) as total'))
            ->value('total') ?? 0;

        $totalProfit = $totalSales - $totalCost;

        $paymentMethods = (clone $salesQuery)
            ->select('payment_method', DB::raw('COUNT(*) as count'), DB::raw('SUM(grand_total) as total'))
            ->groupBy('payment_method')
            ->get();

        $topProducts = SaleItem::whereHas('sale', fn($q) => $q->where('status', 'completed')
            ->where('created_at', '>=', $dateFrom)
            ->where('created_at', '<=', $dateTo))
            ->select('product_id', DB::raw('SUM(quantity) as total_qty'), DB::raw('SUM(subtotal) as total_revenue'))
            ->groupBy('product_id')
            ->orderByDesc('total_qty')
            ->take(10)
            ->with('product')
            ->get();

        $dailySales = (clone $salesQuery)
            ->select(DB::raw('DATE(created_at) as date'), DB::raw('SUM(grand_total) as total'))
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        $customers = Customer::withCount(['sales' => fn($q) => $q->where('status', 'completed')
            ->where('created_at', '>=', $dateFrom)
            ->where('created_at', '<=', $dateTo)])
            ->orderByDesc('sales_count')
            ->take(10)
            ->get();

        return view('reports.index', compact(
            'totalSales', 'totalTransactions', 'totalCost', 'totalProfit',
            'paymentMethods', 'topProducts', 'dailySales', 'customers',
            'period', 'dateFrom', 'dateTo'
        ));
    }
}
