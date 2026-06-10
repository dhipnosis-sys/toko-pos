@extends('layouts.admin')

@section('title', __('app.suppliers'))

@section('content')
<div class="container-fluid">
    <div class="d-flex justify-content-between align-items-center mb-4">
        <h4 class="mb-0 fw-bold">@lang('app.suppliers')</h4>
        <a href="{{ route('suppliers.create') }}" class="btn btn-primary"><i class="fas fa-plus me-1"></i>@lang('app.add_supplier')</a>
    </div>

    <div class="card border-0 shadow-sm">
        <div class="card-body">
            <div class="table-responsive">
                <table class="table table-hover align-middle">
                    <thead class="table-light">
                        <tr>
                            <th>@lang('app.name')</th>
                            <th>@lang('app.phone')</th>
                            <th>@lang('app.email')</th>
                            <th>@lang('app.city')</th>
                            <th class="text-end">@lang('app.total_purchases')</th>
                            <th class="text-end">@lang('app.total_paid')</th>
                            <th class="text-end">@lang('app.debt')</th>
                            <th class="text-center">@lang('app.purchases')</th>
                            <th class="text-end">@lang('app.actions')</th>
                        </tr>
                    </thead>
                    <tbody>
                        @forelse($suppliers as $supplier)
                        <tr>
                            <td>{{ $supplier->name }}</td>
                            <td>{{ $supplier->phone ?? '-' }}</td>
                            <td>{{ $supplier->email ?? '-' }}</td>
                            <td>{{ $supplier->city ?? '-' }}</td>
                            <td class="text-end">Rp {{ number_format($supplier->total_purchases, 0, ',', '.') }}</td>
                            <td class="text-end">Rp {{ number_format($supplier->total_paid, 0, ',', '.') }}</td>
                            <td class="text-end">
                                <span class="{{ $supplier->total_debt > 0 ? 'text-danger fw-bold' : '' }}">
                                    Rp {{ number_format($supplier->total_debt, 0, ',', '.') }}
                                </span>
                            </td>
                            <td class="text-center">{{ $supplier->purchases_count }}</td>
                            <td class="text-end">
                                <a href="{{ route('suppliers.pay', $supplier) }}" class="btn btn-sm btn-outline-success" title="@lang('app.pay_debt')"><i class="fas fa-money-bill"></i></a>
                                <a href="{{ route('suppliers.edit', $supplier) }}" class="btn btn-sm btn-outline-primary"><i class="fas fa-edit"></i></a>
                                <form action="{{ route('suppliers.destroy', $supplier) }}" method="POST" class="d-inline" onsubmit="return confirm('@lang('app.confirm_delete', ['data' => __('app.supplier')])')">
                                    @csrf @method('DELETE')
                                    <button type="submit" class="btn btn-sm btn-outline-danger"><i class="fas fa-trash"></i></button>
                                </form>
                            </td>
                        </tr>
                        @empty
                        <tr>
                            <td colspan="9" class="text-center text-muted py-4">@lang('app.no_data')</td>
                        </tr>
                        @endforelse
                    </tbody>
                </table>
            </div>
            {{ $suppliers->links() }}
        </div>
    </div>
</div>
@endsection
