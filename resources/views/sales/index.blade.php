@extends('layouts.admin')

@section('title', __('app.sales_history'))

@section('content')
<div class="container-fluid">
    <div class="d-flex justify-content-between align-items-center mb-4">
        <h4 class="mb-0 fw-bold">@lang('app.sales_history')</h4>
    </div>

    <div class="card border-0 shadow-sm">
        <div class="card-body">
            <form method="GET" class="row g-2 mb-3">
                <div class="col-md-3">
                    <input type="text" name="search" class="form-control" placeholder="@lang('app.search') @lang('app.invoice')..." value="{{ request('search') }}">
                </div>
                <div class="col-md-2">
                    <select name="payment_method" class="form-select">
                        <option value="">@lang('app.all_payments')</option>
                        <option value="cash" {{ request('payment_method') == 'cash' ? 'selected' : '' }}>@lang('app.cash')</option>
                        <option value="transfer" {{ request('payment_method') == 'transfer' ? 'selected' : '' }}>@lang('app.transfer')</option>
                        <option value="qris" {{ request('payment_method') == 'qris' ? 'selected' : '' }}>@lang('app.qris')</option>
                        <option value="ewallet" {{ request('payment_method') == 'ewallet' ? 'selected' : '' }}>@lang('app.ewallet')</option>
                        <option value="credit" {{ request('payment_method') == 'credit' ? 'selected' : '' }}>@lang('app.credit')</option>
                        <option value="debit" {{ request('payment_method') == 'debit' ? 'selected' : '' }}>@lang('app.debit')</option>
                        <option value="receivable" {{ request('payment_method') == 'receivable' ? 'selected' : '' }}>@lang('app.receivable')</option>
                    </select>
                </div>
                <div class="col-md-2">
                    <select name="status" class="form-select">
                        <option value="">@lang('app.all_status')</option>
                        <option value="completed" {{ request('status') == 'completed' ? 'selected' : '' }}>@lang('app.completed')</option>
                        <option value="pending" {{ request('status') == 'pending' ? 'selected' : '' }}>@lang('app.pending')</option>
                        <option value="cancelled" {{ request('status') == 'cancelled' ? 'selected' : '' }}>@lang('app.cancelled')</option>
                    </select>
                </div>
                <div class="col-md-2">
                    <input type="date" name="date_from" class="form-control" value="{{ request('date_from') }}" placeholder="@lang('app.from')">
                </div>
                <div class="col-md-2">
                    <input type="date" name="date_to" class="form-control" value="{{ request('date_to') }}" placeholder="@lang('app.to')">
                </div>
                <div class="col-md-1">
                    <button type="submit" class="btn btn-outline-primary w-100"><i class="fas fa-search"></i></button>
                </div>
                <div class="col-md-1">
                    <a href="{{ route('sales.index') }}" class="btn btn-outline-secondary w-100"><i class="fas fa-undo"></i></a>
                </div>
            </form>

            <div class="row g-2 mb-3">
                <div class="col-md-4">
                    <div class="bg-light rounded p-3 border">
                        <small class="text-muted">@lang('app.grand_total')</small>
                        <h5 class="mb-0 fw-bold text-primary">Rp {{ number_format($totals->total_grand, 0, ',', '.') }}</h5>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="bg-light rounded p-3 border">
                        <small class="text-muted">@lang('app.paid')</small>
                        <h5 class="mb-0 fw-bold text-success">Rp {{ number_format($totals->total_paid, 0, ',', '.') }}</h5>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="bg-light rounded p-3 border">
                        <small class="text-muted">@lang('app.change')</small>
                        <h5 class="mb-0 fw-bold text-warning">Rp {{ number_format($totals->total_change, 0, ',', '.') }}</h5>
                    </div>
                </div>
            </div>

            <div class="table-responsive">
                <table class="table table-hover align-middle">
                    <thead class="table-light">
                        <tr>
                            <th>@lang('app.invoice')</th>
                            <th>@lang('app.customer')</th>
                            <th>@lang('app.cashier')</th>
                            <th class="text-end">@lang('app.total')</th>
                            <th class="text-end">@lang('app.paid')</th>
                            <th class="text-end">@lang('app.change')</th>
                            <th>@lang('app.payment_method')</th>
                            <th class="text-center">@lang('app.status')</th>
                            <th class="text-center">@lang('app.date')</th>
                            <th class="text-end">@lang('app.actions')</th>
                        </tr>
                    </thead>
                    <tbody>
                        @forelse($sales as $sale)
                        <tr>
                            <td><code>{{ $sale->invoice_number }}</code></td>
                            <td>{{ $sale->customer->name ?? 'Walk-in' }}</td>
                            <td>{{ $sale->user->name ?? '-' }}</td>
                            <td class="text-end">Rp {{ number_format($sale->grand_total, 0, ',', '.') }}</td>
                            <td class="text-end">Rp {{ number_format($sale->paid_amount, 0, ',', '.') }}</td>
                            <td class="text-end">Rp {{ number_format($sale->change_amount, 0, ',', '.') }}</td>
                            <td><span class="badge bg-info">{{ ucfirst($sale->payment_method) }}</span></td>
                            <td class="text-center">
                                @if($sale->status === 'completed')
                                    <span class="badge bg-success">@lang('app.completed')</span>
                                @elseif($sale->status === 'cancelled')
                                    <span class="badge bg-danger">@lang('app.cancelled')</span>
                                @else
                                    <span class="badge bg-warning">@lang('app.pending')</span>
                                @endif
                            </td>
                            <td class="text-center">{{ $sale->created_at->format('d M Y H:i') }}</td>
                            <td class="text-end">
                                <a href="{{ route('sales.show', $sale) }}" class="btn btn-sm btn-outline-info"><i class="fas fa-eye"></i></a>
                            </td>
                        </tr>
                        @empty
                        <tr>
                            <td colspan="10" class="text-center text-muted py-4">@lang('app.no_data')</td>
                        </tr>
                        @endforelse
                    </tbody>
                </table>
            </div>
            {{ $sales->withQueryString()->links() }}
        </div>
    </div>
</div>
@endsection
