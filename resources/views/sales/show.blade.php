@extends('layouts.admin')

@section('title', __('app.sale_detail'))

@section('content')
<div class="container-fluid">
    <div class="d-flex justify-content-between align-items-center mb-4">
        <h4 class="mb-0 fw-bold">@lang('app.sale_detail')</h4>
        <div>
            <a href="{{ route('pos.print', $sale) }}" class="btn btn-outline-primary" target="_blank"><i class="fas fa-print me-1"></i>@lang('app.print_receipt')</a>
            <a href="{{ route('sales.index') }}" class="btn btn-outline-secondary"><i class="fas fa-arrow-left me-1"></i>@lang('app.back')</a>
        </div>
    </div>

    <div class="row g-3">
        <div class="col-md-4">
            <div class="card border-0 shadow-sm">
                <div class="card-body">
                    <h6 class="fw-semibold mb-3">@lang('app.sale_info')</h6>
                    <table class="table table-sm">
                        <tr><td>@lang('app.invoice')</td><td><code>{{ $sale->invoice_number }}</code></td></tr>
                        <tr><td>@lang('app.date')</td><td>{{ $sale->created_at->format('d M Y H:i') }}</td></tr>
                        <tr><td>@lang('app.customer')</td><td>{{ $sale->customer->name ?? 'Walk-in' }}</td></tr>
                        <tr><td>@lang('app.cashier')</td><td>{{ $sale->user->name ?? '-' }}</td></tr>
                        <tr><td>@lang('app.payment_method')</td><td><span class="badge bg-info">{{ ucfirst($sale->payment_method) }}</span></td></tr>
                        <tr>
                            <td>@lang('app.status')</td>
                            <td>
                                @if($sale->status === 'completed')
                                    <span class="badge bg-success">@lang('app.completed')</span>
                                @elseif($sale->status === 'cancelled')
                                    <span class="badge bg-danger">@lang('app.cancelled')</span>
                                @else
                                    <span class="badge bg-warning">@lang('app.pending')</span>
                                @endif
                            </td>
                        </tr>
                    </table>
                </div>
            </div>

            <div class="card border-0 shadow-sm mt-3">
                <div class="card-body">
                    <h6 class="fw-semibold mb-3">@lang('app.payment_summary')</h6>
                    <table class="table table-sm">
                        <tr><td>@lang('app.subtotal')</td><td class="text-end">Rp {{ number_format($sale->subtotal, 0, ',', '.') }}</td></tr>
                        <tr><td>@lang('app.discount')</td><td class="text-end">Rp {{ number_format($sale->discount, 0, ',', '.') }}</td></tr>
                        <tr><td>@lang('app.tax')</td><td class="text-end">Rp {{ number_format($sale->tax, 0, ',', '.') }}</td></tr>
                        <tr class="table-primary"><td><strong>@lang('app.grand_total')</strong></td><td class="text-end"><strong>Rp {{ number_format($sale->grand_total, 0, ',', '.') }}</strong></td></tr>
                        <tr><td>@lang('app.paid')</td><td class="text-end">Rp {{ number_format($sale->paid_amount, 0, ',', '.') }}</td></tr>
                        <tr><td>@lang('app.change')</td><td class="text-end">Rp {{ number_format($sale->change_amount, 0, ',', '.') }}</td></tr>
                    </table>
                </div>
            </div>
        </div>

        <div class="col-md-8">
            <div class="card border-0 shadow-sm">
                <div class="card-header bg-white border-0 py-3">
                    <h6 class="mb-0 fw-semibold">@lang('app.items_list')</h6>
                </div>
                <div class="card-body p-0">
                    <div class="table-responsive">
                        <table class="table align-middle mb-0">
                            <thead class="table-light">
                                <tr>
                                    <th>@lang('app.product_name')</th>
                                    <th class="text-center">@lang('app.quantity')</th>
                                    <th class="text-end">@lang('app.unit_price')</th>
                                    <th class="text-end">@lang('app.subtotal')</th>
                                </tr>
                            </thead>
                            <tbody>
                                @foreach($sale->items as $item)
                                <tr>
                                    <td>{{ $item->product->name ?? '-' }}</td>
                                    <td class="text-center">{{ $item->quantity }}</td>
                                    <td class="text-end">Rp {{ number_format($item->unit_price, 0, ',', '.') }}</td>
                                    <td class="text-end">Rp {{ number_format($item->subtotal, 0, ',', '.') }}</td>
                                </tr>
                                @endforeach
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            @if($sale->notes)
            <div class="card border-0 shadow-sm mt-3">
                <div class="card-body">
                    <h6 class="fw-semibold mb-2">@lang('app.notes')</h6>
                    <p class="mb-0">{{ $sale->notes }}</p>
                </div>
            </div>
            @endif

            <div class="card border-0 shadow-sm mt-3">
                <div class="card-body">
                    <h6 class="fw-semibold mb-3">@lang('app.payment_history')</h6>
                    <div class="table-responsive">
                        <table class="table table-sm">
                            <thead>
                                <tr>
                                    <th>@lang('app.payment_method')</th>
                                    <th class="text-end">@lang('app.amount')</th>
                                    <th>@lang('app.notes')</th>
                                    <th class="text-center">@lang('app.date')</th>
                                </tr>
                            </thead>
                            <tbody>
                                @forelse($sale->payments as $payment)
                                <tr>
                                    <td><span class="badge bg-info">{{ ucfirst($payment->payment_method) }}</span></td>
                                    <td class="text-end">Rp {{ number_format($payment->amount, 0, ',', '.') }}</td>
                                    <td>{{ $payment->notes ?? '-' }}</td>
                                    <td class="text-center">{{ $payment->created_at->format('d M Y H:i') }}</td>
                                </tr>
                                @empty
                                <tr><td colspan="4" class="text-center text-muted">@lang('app.no_payments')</td></tr>
                                @endforelse
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
@endsection
