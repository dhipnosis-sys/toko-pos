@extends('layouts.admin')

@section('title', __('app.customers'))

@section('content')
<div class="container-fluid">
    <div class="d-flex justify-content-between align-items-center mb-4">
        <h4 class="mb-0 fw-bold">@lang('app.customers')</h4>
        <a href="{{ route('customers.create') }}" class="btn btn-primary"><i class="fas fa-plus me-1"></i>@lang('app.add')</a>
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
                            <th class="text-center">@lang('app.sales')</th>
                            <th class="text-end">@lang('app.actions')</th>
                        </tr>
                    </thead>
                    <tbody>
                        @forelse($customers as $customer)
                        <tr>
                            <td>{{ $customer->name }}</td>
                            <td>{{ $customer->phone ?? '-' }}</td>
                            <td>{{ $customer->email ?? '-' }}</td>
                            <td>{{ $customer->city ?? '-' }}</td>
                            <td class="text-end">Rp {{ number_format($customer->total_purchases, 0, ',', '.') }}</td>
                            <td class="text-end">Rp {{ number_format($customer->total_paid, 0, ',', '.') }}</td>
                            <td class="text-end">
                                <span class="{{ $customer->total_debt > 0 ? 'text-danger fw-bold' : '' }}">
                                    Rp {{ number_format($customer->total_debt, 0, ',', '.') }}
                                </span>
                            </td>
                            <td class="text-center">{{ $customer->sales_count }}</td>
                            <td class="text-end">
                                <a href="{{ route('customers.edit', $customer) }}" class="btn btn-sm btn-outline-primary"><i class="fas fa-edit"></i></a>
                                <form action="{{ route('customers.destroy', $customer) }}" method="POST" class="d-inline" onsubmit="return confirm('@lang('app.confirm_delete', ['data' => __('app.customer')])')">
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
            {{ $customers->links() }}
        </div>
    </div>
</div>
@endsection
