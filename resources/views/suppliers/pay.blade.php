@extends('layouts.admin')

@section('title', __('app.pay_debt'))

@section('content')
<div class="container-fluid">
    <div class="d-flex justify-content-between align-items-center mb-4">
        <h4 class="mb-0 fw-bold">@lang('app.pay_debt'): {{ $supplier->name }}</h4>
        <a href="{{ route('suppliers.index') }}" class="btn btn-outline-secondary"><i class="fas fa-arrow-left me-1"></i>@lang('app.back')</a>
    </div>

    <div class="row g-3">
        <div class="col-md-4">
            <div class="card border-0 shadow-sm">
                <div class="card-body">
                    <h6 class="fw-semibold">@lang('app.supplier_info')</h6>
                    <table class="table table-sm">
                        <tr><td>@lang('app.phone')</td><td>{{ $supplier->phone ?? '-' }}</td></tr>
                        <tr><td>@lang('app.email')</td><td>{{ $supplier->email ?? '-' }}</td></tr>
                        <tr><td>@lang('app.total_purchases')</td><td>Rp {{ number_format($supplier->total_purchases, 0, ',', '.') }}</td></tr>
                        <tr><td>@lang('app.total_paid')</td><td>Rp {{ number_format($supplier->total_paid, 0, ',', '.') }}</td></tr>
                        <tr class="table-danger">
                            <td><strong>@lang('app.outstanding_debt')</strong></td>
                            <td><strong>Rp {{ number_format($supplier->total_debt, 0, ',', '.') }}</strong></td>
                        </tr>
                    </table>
                </div>
            </div>
        </div>
        <div class="col-md-8">
            <div class="card border-0 shadow-sm">
                <div class="card-body">
                    <form action="{{ route('suppliers.pay.store', $supplier) }}" method="POST">
                        @csrf
                        <div class="row g-3">
                            <div class="col-md-6">
                                <label class="form-label">@lang('app.amount') <span class="text-danger">*</span></label>
                                <input type="number" name="amount" class="form-control @error('amount') is-invalid @enderror" value="{{ old('amount', $supplier->total_debt) }}" min="1" required>
                                @error('amount') <div class="invalid-feedback">{{ $message }}</div> @enderror
                            </div>
                            <div class="col-md-6">
                                <label class="form-label">@lang('app.payment_method') <span class="text-danger">*</span></label>
                                <select name="payment_method" class="form-select @error('payment_method') is-invalid @enderror" required>
                                    <option value="cash">@lang('app.cash')</option>
                                    <option value="transfer">@lang('app.transfer')</option>
                                    <option value="qris">@lang('app.qris')</option>
                                    <option value="ewallet">@lang('app.ewallet')</option>
                                </select>
                                @error('payment_method') <div class="invalid-feedback">{{ $message }}</div> @enderror
                            </div>
                            <div class="col-md-12">
                                <label class="form-label">@lang('app.notes')</label>
                                <textarea name="notes" class="form-control" rows="2">{{ old('notes') }}</textarea>
                            </div>
                            <div class="col-12">
                                <button type="submit" class="btn btn-success"><i class="fas fa-check me-1"></i>@lang('app.record_payment')</button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>
</div>
@endsection
