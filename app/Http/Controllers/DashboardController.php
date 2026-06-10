<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\Purchase;
use App\Models\Customer;
use App\Models\Supplier;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function index()
    {
        $today = Carbon::today();
        $startOfMonth = Carbon::now()->startOfMonth();

        $todaySales = Sale::whereDate('created_at', $today)
            ->where('status', 'completed')
            ->sum('grand_total');
        $todayCount = Sale::whereDate('created_at', $today)
            ->where('status', 'completed')
            ->count();

        $monthlySales = Sale::whereBetween('created_at', [$startOfMonth, Carbon::now()])
            ->where('status', 'completed')
            ->sum('grand_total');

        $totalProducts = Product::count();
        $lowStockCount = Product::whereColumn('stock', '<=', 'min_stock')->count();

        $topProducts = SaleItem::select('product_id', DB::raw('SUM(quantity) as total_qty'), DB::raw('SUM(subtotal) as total_revenue'))
            ->whereHas('sale', function ($q) use ($startOfMonth) {
                $q->where('created_at', '>=', $startOfMonth)->where('status', 'completed');
            })
            ->groupBy('product_id')
            ->orderByDesc('total_qty')
            ->take(5)
            ->with('product')
            ->get();

        $chartData = Sale::where('created_at', '>=', Carbon::now()->subDays(30))
            ->where('status', 'completed')
            ->select(DB::raw('DATE(created_at) as date'), DB::raw('SUM(grand_total) as total'))
            ->groupBy('date')
            ->orderBy('date')
            ->get()
            ->keyBy('date');

        $chartLabels = [];
        $chartValues = [];
        for ($i = 29; $i >= 0; $i--) {
            $date = Carbon::now()->subDays($i)->format('Y-m-d');
            $chartLabels[] = Carbon::now()->subDays($i)->format('d M');
            $chartValues[] = (int) ($chartData[$date]->total ?? 0);
        }

        $totalRevenue = Sale::where('status', 'completed')->sum('grand_total');
        $totalCost = SaleItem::whereHas('sale', fn($q) => $q->where('status', 'completed'))
            ->select(DB::raw('SUM(quantity * cost_price) as total'))
            ->value('total') ?? 0;
        $totalProfit = $totalRevenue - $totalCost;

        $monthlyProfit = SaleItem::whereHas('sale', fn($q) => $q->where('status', 'completed'))
            ->join('sales', 'sale_items.sale_id', '=', 'sales.id')
            ->where('sales.created_at', '>=', Carbon::now()->subMonths(12))
            ->select(
                DB::raw("DATE_FORMAT(sales.created_at, '%Y-%m') as month"),
                DB::raw('SUM(sale_items.subtotal) as revenue'),
                DB::raw('SUM(sale_items.quantity * sale_items.cost_price) as cost')
            )
            ->groupBy('month')
            ->orderBy('month')
            ->get();

        return view('dashboard.index', compact(
            'todaySales', 'todayCount', 'monthlySales',
            'totalProducts', 'lowStockCount',
            'topProducts', 'chartLabels', 'chartValues',
            'totalRevenue', 'totalCost', 'totalProfit',
            'monthlyProfit'
        ));
    }
}
