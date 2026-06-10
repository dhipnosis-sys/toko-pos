@extends('layouts.admin')

@section('title', __('app.new_purchase'))

@push('styles')
<style>
    .item-row { background: #f8f9fa; border-radius: 8px; padding: 12px; margin-bottom: 8px; }
    .product-search-wrapper { position: relative; }
    .product-search-results {
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        z-index: 1050;
        max-height: 250px;
        overflow-y: auto;
        display: none;
        background: #fff;
        border: 1px solid #dee2e6;
        border-radius: 6px;
        box-shadow: 0 4px 16px rgba(0,0,0,0.12);
    }
    .product-search-results.show { display: block; }
    .product-search-results .dropdown-item {
        padding: 8px 12px;
        cursor: pointer;
        border-bottom: 1px solid #f1f1f1;
    }
    .product-search-results .dropdown-item:hover,
    .product-search-results .dropdown-item.active {
        background: #e9ecef;
    }
    .product-search-results .dropdown-item:last-child { border-bottom: none; }
    .product-search-selected {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        background: #e8f0fe;
        border-radius: 6px;
        padding: 4px 10px;
        font-size: 0.9rem;
    }
    .product-search-selected .remove-selected {
        cursor: pointer;
        color: #dc3545;
        font-weight: bold;
    }
</style>
@endpush

@section('content')
<div class="container-fluid">
    <div class="d-flex justify-content-between align-items-center mb-4">
        <h4 class="mb-0 fw-bold">@lang('app.new_purchase')</h4>
        <a href="{{ route('purchases.index') }}" class="btn btn-outline-secondary"><i class="fas fa-arrow-left me-1"></i>@lang('app.back')</a>
    </div>

    <div class="card border-0 shadow-sm">
        <div class="card-body">
            <form action="{{ route('purchases.store') }}" method="POST" id="purchaseForm">
                @csrf

                <div class="row g-3 mb-4">
                    <div class="col-md-6">
                        <label class="form-label">@lang('app.supplier')</label>
                        <select name="supplier_id" class="form-select @error('supplier_id') is-invalid @enderror">
                            <option value="">@lang('app.select_supplier')</option>
                            @foreach($suppliers as $sup)
                                <option value="{{ $sup->id }}" {{ old('supplier_id') == $sup->id ? 'selected' : '' }}>{{ $sup->name }}</option>
                            @endforeach
                        </select>
                        @error('supplier_id') <div class="invalid-feedback">{{ $message }}</div> @enderror
                    </div>
                    <div class="col-md-12">
                        <label class="form-label">@lang('app.notes')</label>
                        <textarea name="notes" class="form-control" rows="2">{{ old('notes') }}</textarea>
                    </div>
                </div>

                <h6 class="fw-semibold mb-3">@lang('app.items')</h6>
                @error('items') <div class="alert alert-danger">{{ $message }}</div> @enderror

                <div id="itemsContainer">
                    <div class="item-row">
                        <div class="row g-2 align-items-end">
                            <div class="col-md-5">
                                <label class="form-label small">@lang('app.product_name') <span class="text-danger">*</span></label>
                                <div class="product-search-wrapper">
                                    <input type="text" class="form-control product-search-input" placeholder="@lang('app.search_product')" autocomplete="off" required>
                                    <input type="hidden" name="items[0][product_id]" class="product-id-input">
                                    <div class="product-search-results"></div>
                                </div>
                            </div>
                            <div class="col-md-2">
                                <label class="form-label small">@lang('app.quantity') <span class="text-danger">*</span></label>
                                <input type="number" name="items[0][quantity]" class="form-control qty-input" value="1" min="1" required>
                            </div>
                            <div class="col-md-3">
                                <label class="form-label small">@lang('app.cost_price') <span class="text-danger">*</span></label>
                                <input type="number" name="items[0][cost_price]" class="form-control cost-input" value="0" min="0" required>
                            </div>
                            <div class="col-md-2">
                                <button type="button" class="btn btn-outline-danger btn-sm w-100 remove-item" onclick="this.closest('.item-row').remove()"><i class="fas fa-times"></i></button>
                            </div>
                        </div>
                    </div>
                </div>

                <button type="button" class="btn btn-outline-primary btn-sm mt-2" onclick="addItem()"><i class="fas fa-plus me-1"></i>@lang('app.add_item')</button>

                <div class="mt-4">
                    <button type="submit" class="btn btn-primary"><i class="fas fa-save me-1"></i>@lang('app.save')</button>
                </div>
            </form>
        </div>
    </div>
</div>

@push('scripts')
<script>
let itemIndex = 1;
const searchUrl = '{{ route("products.search.ajax") }}';

function addItem() {
    const container = document.getElementById('itemsContainer');
    const html = `
        <div class="item-row">
            <div class="row g-2 align-items-end">
                <div class="col-md-5">
                    <label class="form-label small">@lang('app.product_name') <span class="text-danger">*</span></label>
                    <div class="product-search-wrapper">
                        <input type="text" class="form-control product-search-input" placeholder="@lang('app.search_product')" autocomplete="off" required>
                        <input type="hidden" name="items[${itemIndex}][product_id]" class="product-id-input">
                        <div class="product-search-results"></div>
                    </div>
                </div>
                <div class="col-md-2">
                    <label class="form-label small">@lang('app.quantity') <span class="text-danger">*</span></label>
                    <input type="number" name="items[${itemIndex}][quantity]" class="form-control qty-input" value="1" min="1" required>
                </div>
                <div class="col-md-3">
                    <label class="form-label small">@lang('app.cost_price') <span class="text-danger">*</span></label>
                    <input type="number" name="items[${itemIndex}][cost_price]" class="form-control cost-input" value="0" min="0" required>
                </div>
                <div class="col-md-2">
                    <button type="button" class="btn btn-outline-danger btn-sm w-100 remove-item" onclick="this.closest('.item-row').remove()"><i class="fas fa-times"></i></button>
                </div>
            </div>
        </div>
    `;
    container.insertAdjacentHTML('beforeend', html);
    itemIndex++;
}

document.addEventListener('input', function(e) {
    if (e.target.classList.contains('product-search-input')) {
        const wrapper = e.target.closest('.product-search-wrapper');
        const results = wrapper.querySelector('.product-search-results');
        const q = e.target.value.trim();

        if (q.length < 1) {
            results.classList.remove('show');
            wrapper.querySelector('.product-id-input').value = '';
            return;
        }

        fetch(searchUrl + '?q=' + encodeURIComponent(q))
            .then(res => res.json())
            .then(products => {
                results.innerHTML = '';
                if (products.length === 0) {
                    results.innerHTML = '<div class="dropdown-item text-muted">@lang('app.no_data')</div>';
                } else {
                    products.forEach(p => {
                        const div = document.createElement('div');
                        div.className = 'dropdown-item';
                        div.dataset.id = p.id;
                        div.dataset.price = p.cost_price;
                        div.innerHTML = '<strong>' + p.name + '</strong>' +
                            (p.sku ? ' <code>' + p.sku + '</code>' : '') +
                            (p.barcode ? ' <small class="text-muted">(' + p.barcode + ')</small>' : '') +
                            ' — <span class="text-primary">Rp ' + Number(p.cost_price).toLocaleString('id-ID') + '</span>';
                        div.addEventListener('click', function() {
                            selectProduct(wrapper, p.id, p.name, p.cost_price);
                        });
                        results.appendChild(div);
                    });
                }
                results.classList.add('show');
            });
    }
});

document.addEventListener('blur', function(e) {
    if (e.target.classList.contains('product-search-input')) {
        setTimeout(() => {
            const wrapper = e.target.closest('.product-search-wrapper');
            if (wrapper) {
                wrapper.querySelector('.product-search-results').classList.remove('show');
            }
        }, 200);
    }
}, true);

document.addEventListener('focus', function(e) {
    if (e.target.classList.contains('product-search-input')) {
        const wrapper = e.target.closest('.product-search-wrapper');
        const results = wrapper.querySelector('.product-search-results');
        if (results.children.length > 0) {
            results.classList.add('show');
        }
    }
}, true);

function selectProduct(wrapper, id, name, costPrice) {
    wrapper.querySelector('.product-id-input').value = id;
    const searchInput = wrapper.querySelector('.product-search-input');
    searchInput.value = name;
    searchInput.setAttribute('readonly', true);
    wrapper.querySelector('.product-search-results').classList.remove('show');
    wrapper.querySelector('.cost-input').value = costPrice;
}

document.getElementById('purchaseForm').addEventListener('submit', function(e) {
    let valid = true;
    document.querySelectorAll('.product-search-wrapper').forEach(w => {
        if (!w.querySelector('.product-id-input').value) {
            valid = false;
            w.querySelector('.product-search-input').classList.add('is-invalid');
        } else {
            w.querySelector('.product-search-input').classList.remove('is-invalid');
        }
    });
    if (!valid) {
        e.preventDefault();
        alert('@lang('app.select_product')');
    }
});
</script>
@endpush
@endsection
