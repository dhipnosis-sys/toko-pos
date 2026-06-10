@extends('layouts.admin')

@section('title', __('app.analytics'))

@section('content')
<div class="container-fluid">
    <div class="d-flex justify-content-between align-items-center mb-4">
        <h4 class="mb-0 fw-bold">@lang('app.analytics')</h4>
    </div>

    <div class="card border-0 shadow-sm mb-4">
        <div class="card-body">
            <form method="GET" class="row g-2 align-items-end">
                <div class="col-md-3">
                    <label class="form-label small">@lang('app.period')</label>
                    <select name="period" class="form-select">
                        <option value="daily" {{ $period == 'daily' ? 'selected' : '' }}>@lang('app.daily')</option>
                        <option value="weekly" {{ $period == 'weekly' ? 'selected' : '' }}>@lang('app.weekly')</option>
                        <option value="monthly" {{ $period == 'monthly' ? 'selected' : '' }}>@lang('app.monthly')</option>
                        <option value="yearly" {{ $period == 'yearly' ? 'selected' : '' }}>@lang('app.yearly')</option>
                        <option value="custom" {{ $period == 'custom' ? 'selected' : '' }}>@lang('app.custom')</option>
                    </select>
                </div>
                <div class="col-md-3">
                    <label class="form-label small">@lang('app.from')</label>
                    <input type="date" name="date_from" class="form-control" value="{{ $dateFrom->format('Y-m-d') }}">
                </div>
                <div class="col-md-3">
                    <label class="form-label small">@lang('app.to')</label>
                    <input type="date" name="date_to" class="form-control" value="{{ $dateTo->format('Y-m-d') }}">
                </div>
                <div class="col-md-3">
                    <button type="submit" class="btn btn-primary w-100"><i class="fas fa-sync me-1"></i>@lang('app.update_report')</button>
                </div>
            </form>
        </div>
    </div>

    <div class="row g-3 mb-4">
        <div class="col-md-3">
            <div class="card border-0 shadow-sm">
                <div class="card-body">
                    <p class="text-muted small mb-1">@lang('app.total_sales')</p>
                    <h4 class="fw-bold mb-0">Rp {{ number_format($totalSales ?? 0, 0, ',', '.') }}</h4>
                </div>
            </div>
        </div>
        <div class="col-md-3">
            <div class="card border-0 shadow-sm">
                <div class="card-body">
                    <p class="text-muted small mb-1">@lang('app.transactions')</p>
                    <h4 class="fw-bold mb-0">{{ $totalTransactions ?? 0 }}</h4>
                </div>
            </div>
        </div>
        <div class="col-md-3">
            <div class="card border-0 shadow-sm">
                <div class="card-body">
                    <p class="text-muted small mb-1">@lang('app.total_cost')</p>
                    <h4 class="fw-bold mb-0">Rp {{ number_format($totalCost ?? 0, 0, ',', '.') }}</h4>
                </div>
            </div>
        </div>
        <div class="col-md-3">
            <div class="card border-0 shadow-sm">
                <div class="card-body">
                    <p class="text-muted small mb-1">@lang('app.net_profit')</p>
                    <h4 class="fw-bold mb-0 {{ ($totalProfit ?? 0) >= 0 ? 'text-success' : 'text-danger' }}">
                        Rp {{ number_format($totalProfit ?? 0, 0, ',', '.') }}
                    </h4>
                </div>
            </div>
        </div>
    </div>

    <div class="row g-3 mb-4">
        <div class="col-md-6">
            <div class="card border-0 shadow-sm">
                <div class="card-header bg-white border-0 py-3">
                    <h6 class="mb-0 fw-semibold">@lang('app.payment_methods')</h6>
                </div>
                <div class="card-body p-0">
                    <div class="table-responsive">
                        <table class="table align-middle mb-0">
                            <thead class="table-light">
                                <tr>
                                    <th>@lang('app.payment_method')</th>
                                    <th class="text-center">@lang('app.count')</th>
                                    <th class="text-end">@lang('app.total')</th>
                                </tr>
                            </thead>
                            <tbody>
                                @forelse($paymentMethods ?? [] as $pm)
                                <tr>
                                    <td><span class="badge bg-info">{{ ucfirst($pm->payment_method) }}</span></td>
                                    <td class="text-center">{{ $pm->count }}</td>
                                    <td class="text-end">Rp {{ number_format($pm->total, 0, ',', '.') }}</td>
                                </tr>
                                @empty
                                <tr><td colspan="3" class="text-center text-muted py-3">@lang('app.no_data')</td></tr>
                                @endforelse
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
        <div class="col-md-6">
            <div class="card border-0 shadow-sm">
                <div class="card-header bg-white border-0 py-3">
                    <h6 class="mb-0 fw-semibold">@lang('app.top_products')</h6>
                </div>
                <div class="card-body p-0">
                    <div class="table-responsive">
                        <table class="table align-middle mb-0">
                            <thead class="table-light">
                                <tr>
                                    <th>#</th>
                                    <th>@lang('app.product_name')</th>
                                    <th class="text-center">@lang('app.quantity')</th>
                                    <th class="text-end">@lang('app.total')</th>
                                </tr>
                            </thead>
                            <tbody>
                                @forelse($topProducts ?? [] as $item)
                                <tr>
                                    <td>{{ $loop->iteration }}</td>
                                    <td>{{ $item->product->name ?? '-' }}</td>
                                    <td class="text-center">{{ $item->total_qty }}</td>
                                    <td class="text-end">Rp {{ number_format($item->total_revenue, 0, ',', '.') }}</td>
                                </tr>
                                @empty
                                <tr><td colspan="4" class="text-center text-muted py-3">@lang('app.no_data')</td></tr>
                                @endforelse
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <div class="row g-3">
        <div class="col-md-8">
            <div class="card border-0 shadow-sm">
                <div class="card-header bg-white border-0 py-3">
                    <h6 class="mb-0 fw-semibold">@lang('app.daily_sales')</h6>
                </div>
                <div class="card-body">
                    <canvas id="dailySalesChart" height="250"></canvas>
                </div>
            </div>
        </div>
        <div class="col-md-4">
            <div class="card border-0 shadow-sm">
                <div class="card-header bg-white border-0 py-3">
                    <h6 class="mb-0 fw-semibold">@lang('app.top_customers')</h6>
                </div>
                <div class="card-body p-0">
                    <div class="table-responsive">
                        <table class="table align-middle mb-0">
                            <thead class="table-light">
                                <tr>
                                    <th>#</th>
                                    <th>@lang('app.customer')</th>
                                    <th class="text-center">@lang('app.sales')</th>
                                </tr>
                            </thead>
                            <tbody>
                                @forelse($customers ?? [] as $customer)
                                <tr>
                                    <td>{{ $loop->iteration }}</td>
                                    <td>{{ $customer->name }}</td>
                                    <td class="text-center">{{ $customer->sales_count }}</td>
                                </tr>
                                @empty
                                <tr><td colspan="3" class="text-center text-muted py-3">@lang('app.no_data')</td></tr>
                                @endforelse
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

@push('scripts')
<script>
document.addEventListener('DOMContentLoaded', function() {
    const ctx = document.getElementById('dailySalesChart')?.getContext('2d');
    if (!ctx) return;

    const sales = @json($dailySales ?? []);
    const labels = sales.map(s => s.date);
    const data = sales.map(s => s.total);

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: '@lang('app.sales_chart')',
                data: data,
                backgroundColor: 'rgba(67, 97, 238, 0.7)',
                borderColor: '#4361ee',
                borderWidth: 1,
                borderRadius: 4,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return 'Rp ' + value.toLocaleString('id-ID');
                        }
                    }
                },
                x: { grid: { display: false } }
            }
        }
    });
});
</script>
@endpush
@endsection
