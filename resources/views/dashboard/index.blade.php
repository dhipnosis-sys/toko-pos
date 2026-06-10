@extends('layouts.admin')

@section('title', __('app.dashboard'))

@section('content')
<div class="container-fluid">
    <div class="d-flex justify-content-between align-items-center mb-4">
        <h4 class="mb-0 fw-bold">@lang('app.dashboard')</h4>
        <span class="text-muted">{{ now()->format('l, d F Y') }}</span>
    </div>

    <div class="row g-3 mb-4">
        <div class="col-md-3">
            <div class="card border-0 shadow-sm dashboard-card">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-start">
                        <div>
                            <p class="text-muted mb-1 small">@lang('app.today_sales')</p>
                            <h3 class="fw-bold mb-0">Rp {{ number_format($todaySales ?? 0, 0, ',', '.') }}</h3>
                            <small class="text-success"><i class="fas fa-arrow-up me-1"></i>{{ $todayCount ?? 0 }} @lang('app.sales_count')</small>
                        </div>
                        <div class="icon-shape bg-primary-subtle text-primary rounded p-3">
                            <i class="fas fa-shopping-cart fa-lg"></i>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="col-md-3">
            <div class="card border-0 shadow-sm dashboard-card">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-start">
                        <div>
                            <p class="text-muted mb-1 small">@lang('app.monthly_sales')</p>
                            <h3 class="fw-bold mb-0">Rp {{ number_format($monthlySales ?? 0, 0, ',', '.') }}</h3>
                            <small class="text-info"><i class="fas fa-calendar me-1"></i>@lang('app.this_month')</small>
                        </div>
                        <div class="icon-shape bg-info-subtle text-info rounded p-3">
                            <i class="fas fa-chart-bar fa-lg"></i>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="col-md-3">
            <div class="card border-0 shadow-sm dashboard-card">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-start">
                        <div>
                            <p class="text-muted mb-1 small">@lang('app.total_products')</p>
                            <h3 class="fw-bold mb-0">{{ $totalProducts ?? 0 }}</h3>
                            <small class="text-secondary"><i class="fas fa-box me-1"></i>@lang('app.products')</small>
                        </div>
                        <div class="icon-shape bg-warning-subtle text-warning rounded p-3">
                            <i class="fas fa-cubes fa-lg"></i>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="col-md-3">
            <div class="card border-0 shadow-sm dashboard-card">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-start">
                        <div>
                            <p class="text-muted mb-1 small">@lang('app.low_stock')</p>
                            <h3 class="fw-bold mb-0">{{ $lowStockCount ?? 0 }}</h3>
                            <small class="text-danger"><i class="fas fa-exclamation-triangle me-1"></i>@lang('app.low_stock')</small>
                        </div>
                        <div class="icon-shape bg-danger-subtle text-danger rounded p-3">
                            <i class="fas fa-exclamation fa-lg"></i>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <div class="row g-3 mb-4">
        <div class="col-md-8">
            <div class="card border-0 shadow-sm">
                <div class="card-header bg-white border-0 d-flex justify-content-between align-items-center py-3">
                    <h5 class="mb-0 fw-semibold"><i class="fas fa-chart-line me-2 text-primary"></i>@lang('app.sales_trend') (30 @lang('app.days'))</h5>
                </div>
                <div class="card-body">
                    <canvas id="salesChart" height="250"></canvas>
                </div>
            </div>
        </div>
        <div class="col-md-4">
            <div class="card border-0 shadow-sm mb-3">
                <div class="card-header bg-white border-0 py-3">
                    <h5 class="mb-0 fw-semibold"><i class="fas fa-coins me-2 text-success"></i>@lang('app.cashflow_summary')</h5>
                </div>
                <div class="card-body">
                    <div class="d-flex justify-content-between mb-2">
                        <span class="text-muted">@lang('app.revenue')</span>
                        <span class="fw-semibold text-success">Rp {{ number_format($totalRevenue ?? 0, 0, ',', '.') }}</span>
                    </div>
                    <div class="d-flex justify-content-between mb-2">
                        <span class="text-muted">@lang('app.cost')</span>
                        <span class="fw-semibold text-danger">Rp {{ number_format($totalCost ?? 0, 0, ',', '.') }}</span>
                    </div>
                    <hr>
                    <div class="d-flex justify-content-between">
                        <span class="fw-semibold">@lang('app.profit')</span>
                        <span class="fw-bold text-primary">Rp {{ number_format($totalProfit ?? 0, 0, ',', '.') }}</span>
                    </div>
                </div>
            </div>
            <div class="card border-0 shadow-sm">
                <div class="card-header bg-white border-0 py-3">
                    <h5 class="mb-0 fw-semibold"><i class="fas fa-fire me-2 text-orange"></i>@lang('app.top_products')</h5>
                </div>
                <div class="card-body p-0">
                    <div class="list-group list-group-flush">
                        @forelse($topProducts ?? [] as $item)
                            <div class="list-group-item border-0 d-flex justify-content-between align-items-center py-2 px-3">
                                <div class="small">{{ $item->product?->name ?? 'N/A' }}</div>
                                <span class="badge bg-primary rounded-pill">{{ $item->total_qty }}</span>
                            </div>
                        @empty
                            <div class="text-center text-muted py-3 small">@lang('app.no_data')</div>
                        @endforelse
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
@endsection

@push('scripts')
<script>
    const ctx = document.getElementById('salesChart').getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: @json($chartLabels ?? []),
            datasets: [{
                label: '@lang("app.revenue")',
                data: @json($chartValues ?? []),
                borderColor: '#4361ee',
                backgroundColor: 'rgba(67, 97, 238, 0.1)',
                fill: true,
                tension: 0.4,
                pointRadius: 3,
                pointBackgroundColor: '#4361ee',
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
                        callback: function(value) { return 'Rp' + value.toLocaleString('id-ID'); }
                    }
                }
            }
        }
    });
</script>
@endpush
