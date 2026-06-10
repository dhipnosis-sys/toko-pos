@extends('layouts.admin')

@section('title', __('app.purchase_detail'))

@section('content')
<div class="container-fluid">
    <div class="d-flex justify-content-between align-items-center mb-4">
        <h4 class="mb-0 fw-bold">@lang('app.purchase_detail')</h4>
        <a href="{{ route('purchases.index') }}" class="btn btn-outline-secondary"><i class="fas fa-arrow-left me-1"></i>@lang('app.back')</a>
    </div>

    <div class="row g-3">
        <div class="col-md-4">
            <div class="card border-0 shadow-sm">
                <div class="card-body">
                    <h6 class="fw-semibold mb-3">@lang('app.purchase_info')</h6>
                    <table class="table table-sm">
                        <tr><td>@lang('app.invoice')</td><td><code>{{ $purchase->invoice_number }}</code></td></tr>
                        <tr><td>@lang('app.date')</td><td>{{ $purchase->created_at->format('d M Y H:i') }}</td></tr>
                        <tr><td>@lang('app.supplier')</td><td>{{ $purchase->supplier->name ?? '-' }}</td></tr>
                        <tr><td>@lang('app.user')</td><td>{{ $purchase->user->name ?? '-' }}</td></tr>
                        <tr>
                            <td>@lang('app.status')</td>
                            <td>
                                @if($purchase->status === 'completed')
                                    <span class="badge bg-success">@lang('app.completed')</span>
                                @else
                                    <span class="badge bg-warning">@lang('app.pending')</span>
                                @endif
                            </td>
                        </tr>
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
                                    <th class="text-end">@lang('app.cost_price')</th>
                                    <th class="text-end">@lang('app.subtotal')</th>
                                </tr>
                            </thead>
                            <tbody>
                                @foreach($purchase->items as $item)
                                <tr>
                                    <td>{{ $item->product->name ?? '-' }}</td>
                                    <td class="text-center">{{ $item->quantity }}</td>
                                    <td class="text-end">Rp {{ number_format($item->cost_price, 0, ',', '.') }}</td>
                                    <td class="text-end">Rp {{ number_format($item->subtotal, 0, ',', '.') }}</td>
                                </tr>
                                @endforeach
                            </tbody>
                            <tfoot class="table-light">
                                <tr>
                                    <th colspan="3" class="text-end">@lang('app.subtotal')</th>
                                    <th class="text-end">Rp {{ number_format($purchase->subtotal, 0, ',', '.') }}</th>
                                </tr>
                                <tr>
                                    <th colspan="3" class="text-end">@lang('app.grand_total')</th>
                                    <th class="text-end">Rp {{ number_format($purchase->grand_total, 0, ',', '.') }}</th>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            </div>

            @if($purchase->notes)
            <div class="card border-0 shadow-sm mt-3">
                <div class="card-body">
                    <h6 class="fw-semibold mb-2">@lang('app.notes')</h6>
                    <p class="mb-0">{{ $purchase->notes }}</p>
                </div>
            </div>
            @endif

            @if($purchase->status !== 'completed')
            <form action="{{ route('purchases.complete', $purchase) }}" method="POST" class="mt-3">
                @csrf
                <button type="submit" class="btn btn-success" onclick="return confirm('@lang('app.complete_confirm')')">
                    <i class="fas fa-check me-1"></i>@lang('app.complete_purchase')
                </button>
            </form>
            @endif
        </div>
    </div>
</div>
@endsection
