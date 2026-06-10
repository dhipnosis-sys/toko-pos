@extends('layouts.admin')

@section('title', __('app.stock_in'))

@section('content')
<div class="container-fluid">
    <div class="d-flex justify-content-between align-items-center mb-4">
        <h4 class="mb-0 fw-bold">@lang('app.stock_in')</h4>
        <a href="{{ route('purchases.create') }}" class="btn btn-primary"><i class="fas fa-plus me-1"></i>@lang('app.new_purchase')</a>
    </div>

    <div class="card border-0 shadow-sm">
        <div class="card-body">
            <div class="table-responsive">
                <table class="table table-hover align-middle">
                    <thead class="table-light">
                        <tr>
                            <th>@lang('app.invoice')</th>
                            <th>@lang('app.supplier')</th>
                            <th>@lang('app.user')</th>
                            <th class="text-end">@lang('app.subtotal')</th>
                            <th class="text-end">@lang('app.grand_total')</th>
                            <th class="text-center">@lang('app.status')</th>
                            <th class="text-center">@lang('app.date')</th>
                            <th class="text-end">@lang('app.actions')</th>
                        </tr>
                    </thead>
                    <tbody>
                        @forelse($purchases as $purchase)
                        <tr>
                            <td><code>{{ $purchase->invoice_number }}</code></td>
                            <td>{{ $purchase->supplier->name ?? '-' }}</td>
                            <td>{{ $purchase->user->name ?? '-' }}</td>
                            <td class="text-end">Rp {{ number_format($purchase->subtotal, 0, ',', '.') }}</td>
                            <td class="text-end">Rp {{ number_format($purchase->grand_total, 0, ',', '.') }}</td>
                            <td class="text-center">
                                @if($purchase->status === 'completed')
                                    <span class="badge bg-success">@lang('app.completed')</span>
                                @else
                                    <span class="badge bg-warning">@lang('app.pending')</span>
                                @endif
                            </td>
                            <td class="text-center">{{ $purchase->created_at->format('d M Y H:i') }}</td>
                            <td class="text-end">
                                <a href="{{ route('purchases.show', $purchase) }}" class="btn btn-sm btn-outline-info"><i class="fas fa-eye"></i></a>
                            </td>
                        </tr>
                        @empty
                        <tr>
                            <td colspan="8" class="text-center text-muted py-4">@lang('app.no_data')</td>
                        </tr>
                        @endforelse
                    </tbody>
                </table>
            </div>
            {{ $purchases->links() }}
        </div>
    </div>
</div>
@endsection
