@extends('layouts.admin')

@section('title', __('app.settings'))

@section('content')
<div class="container-fluid">
    <div class="d-flex justify-content-between align-items-center mb-4">
        <h4 class="mb-0 fw-bold">@lang('app.settings')</h4>
    </div>

    <form action="{{ route('settings.update') }}" method="POST">
        @csrf
        <div class="card border-0 shadow-sm mb-4">
            <div class="card-header bg-white py-3">
                <h6 class="mb-0 fw-semibold"><i class="fas fa-store me-2"></i>@lang('app.store_info')</h6>
            </div>
            <div class="card-body">
                <div class="row g-3">
                    <div class="col-md-6">
                        <label class="form-label">@lang('app.store_name')</label>
                        <input type="text" name="store_name" class="form-control" value="{{ $settings['store_name'] ?? config('app.name') }}">
                    </div>
                    <div class="col-md-6">
                        <label class="form-label">@lang('app.store_phone')</label>
                        <input type="text" name="store_phone" class="form-control" value="{{ $settings['store_phone'] ?? '' }}">
                    </div>
                    <div class="col-md-6">
                        <label class="form-label">@lang('app.store_email')</label>
                        <input type="email" name="store_email" class="form-control" value="{{ $settings['store_email'] ?? '' }}">
                    </div>
                    <div class="col-md-6">
                        <label class="form-label">@lang('app.tax_rate')</label>
                        <input type="number" name="tax_rate" class="form-control" value="{{ $settings['tax_rate'] ?? 0 }}" min="0" max="100">
                    </div>
                    <div class="col-md-6">
                        <label class="form-label">@lang('app.currency')</label>
                        <input type="text" name="currency" class="form-control" value="{{ $settings['currency'] ?? 'IDR' }}">
                    </div>
                    <div class="col-md-12">
                        <label class="form-label">@lang('app.store_address')</label>
                        <textarea name="store_address" class="form-control" rows="2">{{ $settings['store_address'] ?? '' }}</textarea>
                    </div>
                </div>
            </div>
        </div>

        <div class="card border-0 shadow-sm mb-4">
            <div class="card-header bg-white py-3">
                <h6 class="mb-0 fw-semibold"><i class="fas fa-receipt me-2"></i>@lang('app.receipt_settings')</h6>
            </div>
            <div class="card-body">
                <div class="row g-3">
                    <div class="col-md-12">
                        <label class="form-label">@lang('app.receipt_footer')</label>
                        <textarea name="receipt_footer" class="form-control" rows="3" placeholder="@lang('app.thank_you')">{{ $settings['receipt_footer'] ?? '' }}</textarea>
                        <small class="text-muted">@lang('app.receipt_footer_hint')</small>
                    </div>
                </div>
            </div>
        </div>

        <div class="col-12 mb-4">
            <button type="submit" class="btn btn-primary"><i class="fas fa-save me-1"></i>@lang('app.save')</button>
        </div>
    </form>
</div>
@endsection
