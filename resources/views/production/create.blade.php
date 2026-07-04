@extends('layouts.admin')

@section('title', 'Buat Production Order')

@section('content')
<div class="container-fluid">
    <div class="d-flex justify-content-between align-items-center mb-4">
        <h4 class="mb-0 fw-bold"><i class="fas fa-plus-circle me-2"></i>Buat Production Order</h4>
        <a href="{{ route('production.index') }}" class="btn btn-outline-secondary"><i class="fas fa-arrow-left me-1"></i>Kembali</a>
    </div>

    <form action="{{ route('production.store') }}" method="POST">
        @csrf
        <div class="card border-0 shadow-sm">
            <div class="card-body">
                <div class="row g-3">
                    <div class="col-md-4">
                        <label class="form-label">Bill of Material</label>
                        <select name="bill_of_material_id" class="form-select" onchange="selectBom(this)">
                            <option value="">-- Pilih BOM --</option>
                            @foreach($boms as $bom)
                                @php
                                    $fgName = $bom->finished_good_type === 'product' && $bom->product ? $bom->product->name : ($bom->finished_good_name ?? '—');
                                @endphp
                                <option value="{{ $bom->id }}"
                                    data-fg-type="{{ $bom->finished_good_type }}"
                                    data-product-id="{{ $bom->product_id }}"
                                    data-fg-name="{{ $bom->finished_good_name ?? '' }}"
                                    {{ request('bom_id') == $bom->id ? 'selected' : '' }}>
                                    {{ $bom->name }} ({{ $fgName }})
                                </option>
                            @endforeach
                        </select>
                    </div>
                    <div class="col-md-4" id="fgProductField">
                        <label class="form-label">Produk Jadi <span class="text-danger">*</span></label>
                        <select name="product_id" class="form-select" id="productSelect">
                            <option value="">-- Pilih Produk --</option>
                            @foreach($products as $p)
                                <option value="{{ $p->id }}" {{ request('product_id') == $p->id ? 'selected' : '' }}>{{ $p->name }} (Stok: {{ $p->stock }})</option>
                            @endforeach
                        </select>
                    </div>
                    <div class="col-md-4" id="fgManualField" style="display:none">
                        <label class="form-label">Produk Jadi</label>
                        <input type="text" class="form-control" id="fgManualName" readonly>
                    </div>
                    <div class="col-md-2">
                        <label class="form-label">Jumlah <span class="text-danger">*</span></label>
                        <input type="number" name="quantity" class="form-control" value="{{ request('quantity', 1) }}" min="1" required>
                    </div>
                    <div class="col-md-12">
                        <label class="form-label">Catatan</label>
                        <textarea name="notes" class="form-control" rows="2">{{ old('notes') }}</textarea>
                    </div>
                </div>
                <button type="submit" class="btn btn-primary mt-3"><i class="fas fa-save me-1"></i>Buat Production Order</button>
            </div>
        </div>
    </form>
</div>
@endsection

@push('scripts')
<script>
function selectBom(select) {
    const opt = select.options[select.selectedIndex];
    const prodField = document.getElementById('fgProductField');
    const manualField = document.getElementById('fgManualField');
    const prodSelect = document.querySelector('[name="product_id"]');
    const manualInput = document.getElementById('fgManualName');

    if (!opt || !opt.value) {
        prodField.style.display = 'block';
        manualField.style.display = 'none';
        prodSelect.required = true;
        return;
    }

    const fgType = opt.dataset.fgType;

    if (fgType === 'product') {
        prodField.style.display = 'block';
        manualField.style.display = 'none';
        prodSelect.required = true;
        prodSelect.value = opt.dataset.productId || '';
    } else {
        prodField.style.display = 'none';
        manualField.style.display = 'block';
        prodSelect.required = false;
        prodSelect.value = '';
        manualInput.value = opt.dataset.fgName || '—';
    }
}

document.addEventListener('DOMContentLoaded', function() {
    const bomSelect = document.querySelector('[name="bill_of_material_id"]');
    if (bomSelect.value) selectBom(bomSelect);
});
</script>
@endpush
