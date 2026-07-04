@extends('layouts.admin')

@section('title', __('app.edit_product'))

@section('content')
<div class="container-fluid">
    <div class="d-flex justify-content-between align-items-center mb-4">
        <h4 class="mb-0 fw-bold">@lang('app.edit_product')</h4>
        <a href="{{ route('products.index') }}" class="btn btn-outline-secondary"><i class="fas fa-arrow-left me-1"></i>@lang('app.back')</a>
    </div>

    <div class="card border-0 shadow-sm">
        <div class="card-body">
            <form action="{{ route('products.update', $product) }}" method="POST">
                @csrf @method('PUT')

                <div class="row g-3">
                    <div class="col-md-6">
                        <label class="form-label">@lang('app.name') <span class="text-danger">*</span></label>
                        <input type="text" name="name" class="form-control @error('name') is-invalid @enderror" value="{{ old('name', $product->name) }}" required>
                        @error('name') <div class="invalid-feedback">{{ $message }}</div> @enderror
                    </div>
                    <div class="col-md-3">
                        <label class="form-label">@lang('app.sku') <span class="text-danger">*</span></label>
                        <input type="text" name="sku" class="form-control @error('sku') is-invalid @enderror" value="{{ old('sku', $product->sku) }}" required>
                        @error('sku') <div class="invalid-feedback">{{ $message }}</div> @enderror
                    </div>
                    <div class="col-md-3">
                        <label class="form-label">@lang('app.barcode')</label>
                        <div class="input-group">
                            <input type="text" name="barcode" class="form-control @error('barcode') is-invalid @enderror" value="{{ old('barcode', $product->barcode) }}">
                            <button type="button" class="btn btn-outline-secondary" onclick="startScanner('input[name=barcode]')" title="Scan Barcode">
                                <i class="fas fa-camera"></i>
                            </button>
                        </div>
                        @error('barcode') <div class="invalid-feedback">{{ $message }}</div> @enderror
                    </div>
                    <div class="col-md-4">
                        <label class="form-label">@lang('app.category') <span class="text-danger">*</span></label>
                        <select name="category_id" class="form-select @error('category_id') is-invalid @enderror" required>
                            <option value="">@lang('app.select_category')</option>
                            @foreach($categories as $cat)
                                <option value="{{ $cat->id }}" {{ old('category_id', $product->category_id) == $cat->id ? 'selected' : '' }}>{{ $cat->name }}</option>
                            @endforeach
                        </select>
                        @error('category_id') <div class="invalid-feedback">{{ $message }}</div> @enderror
                    </div>
                    <div class="col-md-4">
                        <label class="form-label">@lang('app.supplier')</label>
                        <select name="supplier_id" class="form-select @error('supplier_id') is-invalid @enderror">
                            <option value="">@lang('app.select_supplier')</option>
                            @foreach($suppliers as $sup)
                                <option value="{{ $sup->id }}" {{ old('supplier_id', $product->supplier_id) == $sup->id ? 'selected' : '' }}>{{ $sup->name }}</option>
                            @endforeach
                        </select>
                        @error('supplier_id') <div class="invalid-feedback">{{ $message }}</div> @enderror
                    </div>
                    <div class="col-md-4">
                        <label class="form-label">@lang('app.unit') <span class="text-danger">*</span></label>
                        <select name="unit" class="form-select @error('unit') is-invalid @enderror" required>
                            <option value="pcs" {{ old('unit', $product->unit) == 'pcs' ? 'selected' : '' }}>@lang('app.units_pcs')</option>
                            <option value="pack" {{ old('unit', $product->unit) == 'pack' ? 'selected' : '' }}>@lang('app.units_pack')</option>
                            <option value="box" {{ old('unit', $product->unit) == 'box' ? 'selected' : '' }}>@lang('app.units_box')</option>
                        </select>
                        @error('unit') <div class="invalid-feedback">{{ $message }}</div> @enderror
                    </div>
                    <div class="col-md-3">
                        <label class="form-label">@lang('app.cost_price') <span class="text-danger">*</span></label>
                        <input type="number" name="cost_price" class="form-control @error('cost_price') is-invalid @enderror" value="{{ old('cost_price', $product->cost_price) }}" min="0" required>
                        @error('cost_price') <div class="invalid-feedback">{{ $message }}</div> @enderror
                    </div>
                    <div class="col-md-3">
                        <label class="form-label">@lang('app.retail_price') <span class="text-danger">*</span></label>
                        <input type="number" name="retail_price" class="form-control @error('retail_price') is-invalid @enderror" value="{{ old('retail_price', $product->retail_price) }}" min="0" required>
                        @error('retail_price') <div class="invalid-feedback">{{ $message }}</div> @enderror
                    </div>
                    <div class="col-md-3">
                        <label class="form-label">@lang('app.wholesale_price') <span class="text-danger">*</span></label>
                        <input type="number" name="wholesale_price" class="form-control @error('wholesale_price') is-invalid @enderror" value="{{ old('wholesale_price', $product->wholesale_price) }}" min="0" required>
                        @error('wholesale_price') <div class="invalid-feedback">{{ $message }}</div> @enderror
                    </div>
                    <div class="col-md-3">
                        <label class="form-label">@lang('app.reseller_price') <span class="text-danger">*</span></label>
                        <input type="number" name="reseller_price" class="form-control @error('reseller_price') is-invalid @enderror" value="{{ old('reseller_price', $product->reseller_price) }}" min="0" required>
                        @error('reseller_price') <div class="invalid-feedback">{{ $message }}</div> @enderror
                    </div>
                    <div class="col-md-3">
                        <label class="form-label">@lang('app.stock_qty') <span class="text-danger">*</span></label>
                        <input type="number" name="stock" class="form-control @error('stock') is-invalid @enderror" value="{{ old('stock', $product->stock) }}" min="0" required>
                        @error('stock') <div class="invalid-feedback">{{ $message }}</div> @enderror
                    </div>
                    <div class="col-md-3">
                        <label class="form-label">@lang('app.min_stock') <span class="text-danger">*</span></label>
                        <input type="number" name="min_stock" class="form-control @error('min_stock') is-invalid @enderror" value="{{ old('min_stock', $product->min_stock) }}" min="0" required>
                        @error('min_stock') <div class="invalid-feedback">{{ $message }}</div> @enderror
                    </div>
                    <div class="col-md-12">
                        <label class="form-label">@lang('app.description')</label>
                        <textarea name="description" class="form-control @error('description') is-invalid @enderror" rows="3">{{ old('description', $product->description) }}</textarea>
                        @error('description') <div class="invalid-feedback">{{ $message }}</div> @enderror
                    </div>
                    <div class="col-md-12">
                        <div class="form-check">
                            <input type="checkbox" name="is_active" class="form-check-input" value="1" id="isActive" {{ old('is_active', $product->is_active) ? 'checked' : '' }}>
                            <label class="form-check-label" for="isActive">@lang('app.active')</label>
                        </div>
                    </div>
                    <div class="col-12">
                        <button type="submit" class="btn btn-primary"><i class="fas fa-save me-1"></i>@lang('app.update')</button>
                    </div>
                </div>
            </form>
        </div>
    </div>
</div>
@push('scripts')
<script>
let scannerInstance = null;

function startScanner(inputSelector) {
    const input = document.querySelector(inputSelector);
    if (!input) return;

    if (scannerInstance) {
        stopScanner();
        return;
    }

    const overlay = document.createElement('div');
    overlay.id = 'scanner-overlay';
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.85);z-index:9999;display:flex;flex-direction:column;align-items:center;justify-content:center;';
    overlay.innerHTML = '<div id="scanner-box" style="width:280px;height:280px;background:#000;border-radius:12px;overflow:hidden;"></div>' +
        '<button type="button" class="btn btn-light mt-3" onclick="stopScanner()"><i class="fas fa-times me-1"></i>Tutup</button>' +
        '<p class="text-white-50 mt-2 small">Arahkan kamera ke barcode produk</p>';
    document.body.appendChild(overlay);

    scannerInstance = new Html5Qrcode('scanner-box');
    scannerInstance.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 240, height: 120 } },
        function(decodedText) {
            input.value = decodedText;
            stopScanner();
        },
        function() {}
    ).catch(function(err) {
        alert('Tidak dapat mengakses kamera: ' + err);
        stopScanner();
    });
}

function stopScanner() {
    if (scannerInstance) {
        scannerInstance.stop().then(function() {
            scannerInstance = null;
            var el = document.getElementById('scanner-overlay');
            if (el) el.remove();
        }).catch(function() {
            scannerInstance = null;
            var el = document.getElementById('scanner-overlay');
            if (el) el.remove();
        });
    } else {
        var el = document.getElementById('scanner-overlay');
        if (el) el.remove();
    }
}
</script>
@endpush
@endsection
