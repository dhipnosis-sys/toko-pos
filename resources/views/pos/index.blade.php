@extends('layouts.pos')

@section('title', __('app.pos'))

@push('styles')
<style>
/* ===== Step Flow ===== */
.pos-step {
    flex: 1;
    width: 100%;
    display: flex;
    flex-direction: column;
    min-height: 0;
}
.pos-step-hidden {
    display: none !important;
}
.pos-step-header {
    padding: 0.6rem 1rem;
    border-bottom: 1px solid #e9ecef;
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: #fff;
    flex-shrink: 0;
}
.btn-step-back {
    background: none;
    border: none;
    color: #059669;
    font-size: 1.1rem;
    padding: 0.25rem 0.5rem;
}
.btn-step-back:hover {
    background: #f0fdf4;
    border-radius: 8px;
}
.pos-step-body {
    flex: 1;
    overflow-y: auto;
    padding: 1rem;
}
.pos-step-footer {
    padding: 0.75rem 1rem;
    border-top: 1px solid #e9ecef;
    background: #fff;
    flex-shrink: 0;
}

/* ===== Product Cards ===== */
.product-card {
    border: 1px solid #e9ecef;
    border-radius: 12px;
    background: #fff;
    transition: all 0.2s ease;
    text-align: center;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    position: relative;
    min-height: 140px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.04);
}
.product-card:hover {
    border-color: #059669;
    box-shadow: 0 4px 16px rgba(5, 150, 105, 0.12);
}
.product-card .product-card-img {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f0fdf4;
    font-size: 1.8rem;
    min-height: 60px;
}
.product-card .product-card-img img {
    max-width: 100%;
    max-height: 100%;
    object-fit: cover;
}
.product-card-body {
    padding: 0.5rem 0.4rem;
    display: flex;
    flex-direction: column;
    gap: 2px;
    flex: 1;
    justify-content: center;
}
.product-card-name {
    font-weight: 600;
    font-size: 0.78rem;
    color: #1a1a2e;
    line-height: 1.3;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}
.product-card-price {
    font-size: 0.82rem;
    font-weight: 700;
    color: #059669;
}

/* ===== Product Add Button ===== */
.product-card-add {
    position: absolute;
    bottom: 4px;
    right: 4px;
    display: flex;
    align-items: center;
    gap: 3px;
    padding: 0;
    border: none;
    background: none;
    cursor: default;
    z-index: 2;
}
.product-card-add .add-icon {
    width: 26px;
    height: 26px;
    border-radius: 50%;
    border: 2px solid #059669;
    background: #fff;
    color: #059669;
    font-size: 1rem;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.15s;
    line-height: 1;
    flex-shrink: 0;
}
.product-card-add .add-icon:hover {
    background: #059669;
    color: #fff;
    transform: scale(1.1);
}
.product-card-add .add-qty {
    display: none;
    align-items: center;
    gap: 3px;
}
.product-card-add .minus-btn {
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: #dc2626;
    color: #fff;
    font-size: 0.85rem;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.15s;
    line-height: 1;
    flex-shrink: 0;
}
.product-card-add .minus-btn:hover {
    background: #b91c1c;
    transform: scale(1.1);
}
.product-card-add .qty-text {
    font-size: 0.72rem;
    font-weight: 700;
    color: #fff;
    background: #059669;
    padding: 0 7px;
    height: 20px;
    line-height: 20px;
    border-radius: 10px;
    min-width: 18px;
    text-align: center;
}

/* ===== Photo Toggle ===== */
.pos-products.hide-photos .product-card-img {
    display: none;
}
.pos-products.hide-photos .product-card-body {
    padding: 0.6rem 0.4rem;
}
.pos-products.hide-photos .product-card-name {
    font-size: 0.82rem;
}
.hide-photos-btn-active {
    background: #059669 !important;
    color: #fff !important;
    border-color: #059669 !important;
}

/* ===== Floating Cart Bar ===== */
.cart-float {
    flex-shrink: 0;
    padding: 0.6rem 1rem;
    background: #fff;
    border-top: 2px solid #059669;
    display: flex;
    justify-content: space-between;
    align-items: center;
    box-shadow: 0 -2px 10px rgba(0,0,0,0.06);
}
.cart-float-info {
    font-size: 0.85rem;
    color: #1a1a2e;
}
.cart-float-info strong {
    color: #059669;
}
.btn-float-continue {
    white-space: nowrap;
    padding: 0.4rem 1rem;
    font-size: 0.85rem;
    border-radius: 8px;
    font-weight: 600;
}

/* ===== Cart Review Items ===== */
.cart-review-item {
    background: #fff;
    border: 1px solid #e9ecef;
    border-radius: 10px;
    padding: 0.65rem;
    margin-bottom: 0.5rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
}
.cart-review-item:last-child {
    margin-bottom: 0;
}
.cart-review-info {
    flex: 1;
    min-width: 0;
}
.cart-review-name {
    font-weight: 600;
    font-size: 0.85rem;
    color: #1a1a2e;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}
.cart-review-price {
    font-size: 0.72rem;
    color: #6c757d;
}
.cart-review-qty {
    display: flex;
    align-items: center;
    gap: 0.3rem;
    flex-shrink: 0;
}
.cart-review-qty .btn {
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    border-radius: 50%;
    font-size: 0.8rem;
}
.cart-review-qty span {
    font-weight: 700;
    font-size: 0.9rem;
    min-width: 20px;
    text-align: center;
    color: #1a1a2e;
}
.cart-review-subtotal {
    font-weight: 600;
    font-size: 0.82rem;
    color: #059669;
    min-width: 60px;
    text-align: right;
}
.cart-review-remove {
    color: #dc3545;
    background: none;
    border: none;
    padding: 0.25rem;
    cursor: pointer;
    font-size: 0.85rem;
    flex-shrink: 0;
}

/* ===== Payment ===== */
.payment-method {
    font-size: 0.72rem;
    padding: 0.5rem 0.25rem;
    white-space: nowrap;
    border-radius: 8px;
}

/* ===== Mobile Specific ===== */
@media (max-width: 991.98px) {
    .pos-step-header { padding: 0.4rem 0.6rem; }
    .pos-step-header h6 { font-size: 0.85rem; }
    .pos-step-body { padding: 0.6rem; }
    .pos-step-footer { padding: 0.5rem 0.6rem; }
    .pos-header { padding: 0.35rem 0.6rem; flex-shrink: 0; }
    .pos-header h5 { font-size: 0.85rem; }
    .pos-header .btn-sm { font-size: 0.7rem; padding: 0.2rem 0.4rem; }
    .pos-search { padding: 0.35rem 0.6rem; flex-shrink: 0; }
    .pos-search .form-control { font-size: 0.8rem; }
    .pos-search .input-group-text { font-size: 0.8rem; }
    .pos-search .input-group { margin-top: 0 !important; }
    .pos-search .input-group.mt-1 { margin-top: 0.25rem !important; }
    .pos-categories { padding: 0.25rem 0.5rem; overflow-x: auto; flex-wrap: nowrap; flex-shrink: 0; }
    .pos-categories .btn { flex-shrink: 0; font-size: 0.65rem; padding: 0.2rem 0.4rem; }
    .pos-products { flex: 1; min-height: 0; grid-template-columns: repeat(auto-fill, minmax(85px, 1fr)); gap: 0.35rem; padding: 0.4rem; }
    .product-card .product-card-img { flex: 1; min-height: 30px; font-size: 1rem; }
    .product-card-body { padding: 0.35rem 0.25rem; gap: 1px; }
    .product-card-name { font-size: 0.65rem; }
    .product-card-price { font-size: 0.7rem; }
    .product-card-sku { display: none; }
    .product-card-add { width: 22px; height: 22px; font-size: 0.8rem; bottom: 2px; right: 2px; }
    .pos-products.hide-photos .product-card-body { padding: 0.45rem 0.3rem; }
    .pos-products.hide-photos .product-card-name { font-size: 0.75rem; }
    .cart-float { padding: 0.4rem 0.6rem; }
    .cart-float-info { font-size: 0.75rem; }
    .btn-float-continue { font-size: 0.78rem; padding: 0.3rem 0.8rem; }
    .cart-review-item { padding: 0.5rem; gap: 0.4rem; }
    .cart-review-name { font-size: 0.78rem; }
    .cart-review-price { font-size: 0.65rem; }
    .cart-review-qty .btn { width: 24px; height: 24px; font-size: 0.7rem; }
    .cart-review-qty span { font-size: 0.8rem; min-width: 16px; }
    .cart-review-subtotal { font-size: 0.75rem; min-width: 50px; }
    #paymentMethods .col { flex: 0 0 auto; width: auto; }
    .payment-method { font-size: 0.6rem; padding: 0.35rem 0.2rem; }
    .btn-lg { font-size: 0.85rem; padding: 0.4rem; }
}

@media (max-width: 575.98px) {
    .pos-products { grid-template-columns: repeat(3, 1fr); gap: 0.25rem; padding: 0.3rem; }
    .product-card .product-card-img { flex: 1; min-height: 24px; font-size: 0.85rem; }
    .product-card-body { padding: 0.25rem 0.2rem; }
    .product-card-name { font-size: 0.6rem; }
    .product-card-price { font-size: 0.65rem; }
    .product-card-add { width: 20px; height: 20px; font-size: 0.7rem; }
    .pos-step-body { padding: 0.4rem; }
    .cart-review-item { padding: 0.4rem; }
    .cart-review-name { font-size: 0.72rem; }
}
</style>
@endpush

@section('content')
<div class="pos-container">

    <!-- ===== STEP 1: Products ===== -->
    <div class="pos-step" id="stepProducts" style="position:fixed;top:0;left:0;right:0;bottom:0;display:flex;flex-direction:column;">
        <div class="pos-header" style="flex-shrink:0;">
            <div class="d-flex align-items-center gap-2">
                <a href="{{ route('dashboard') }}" class="btn btn-outline-secondary btn-sm">
                    <i class="fas fa-arrow-left"></i>
                </a>
                <h5 class="mb-0 fw-bold" style="font-size:0.95rem"><i class="fas fa-cash-register me-1"></i>@lang('app.pos')</h5>
            </div>
            <div class="d-flex align-items-center gap-2">
                <button class="btn btn-sm btn-outline-secondary" id="togglePhotosBtn" title="@lang('app.show_photos')">
                    <i class="fas fa-images"></i>
                </button>
                <div class="btn-group btn-group-sm">
                    <a href="{{ route('lang.switch', 'id') }}" class="btn {{ App::getLocale() == 'id' ? 'btn-primary' : 'btn-outline-secondary' }}">ID</a>
                    <a href="{{ route('lang.switch', 'en') }}" class="btn {{ App::getLocale() == 'en' ? 'btn-primary' : 'btn-outline-secondary' }}">EN</a>
                </div>
                <span class="badge bg-primary" style="font-size:0.8rem" id="clock"></span>
            </div>
        </div>

        <div class="pos-search" style="flex-shrink:0;">
            <div class="input-group input-group-sm">
                <span class="input-group-text bg-white"><i class="fas fa-search"></i></span>
                <input type="text" id="productSearch" class="form-control" placeholder="@lang('app.search_product')" autofocus>
            </div>
            <div class="input-group input-group-sm mt-1">
                <span class="input-group-text bg-white"><i class="fas fa-qrcode"></i></span>
                <input type="text" id="barcodeInput" class="form-control" placeholder="@lang('app.scan_barcode')">
                <button type="button" class="btn btn-outline-secondary" id="scanBarcodeBtn" title="Scan dari Kamera">
                    <i class="fas fa-camera"></i>
                </button>
            </div>
        </div>

        <div class="pos-categories" style="flex-shrink:0;">
            <button class="btn btn-sm category-filter active" data-id="">@lang('app.all')</button>
            @foreach($categories ?? [] as $category)
            <button class="btn btn-sm btn-outline-secondary category-filter" data-id="{{ $category->id }}">{{ $category->name }}</button>
            @endforeach
        </div>

        <div class="pos-products" id="productGrid" style="flex:1;min-height:0;overflow-y:auto;display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:0.6rem;padding:0.75rem;align-content:start;">
            @forelse($products ?? [] as $product)
            <div class="product-card" tabindex="0" role="button"
                 data-id="{{ $product->id }}"
                 data-name="{{ $product->name }}"
                 data-price="{{ $product->price }}"
                 data-stock="{{ $product->stock }}"
                 data-sku="{{ $product->sku }}"
                 data-barcode="{{ $product->barcode }}"
                 data-category-id="{{ $product->category_id }}">
                <div class="product-card-img">
                    @if($product->image)
                        <img src="{{ asset('storage/' . $product->image) }}" alt="{{ $product->name }}">
                    @else
                        <i class="fas fa-box-open text-muted"></i>
                    @endif
                </div>
                <div class="product-card-body">
                    <span class="product-card-name">{{ $product->name }}</span>
                    <strong class="product-card-price">Rp {{ number_format($product->price, 0, ',', '.') }}</strong>
                </div>
                <button class="product-card-add" title="Tambah">
                    <span class="add-icon" onclick="event.stopPropagation(); addToCart(this.parentElement)">+</span>
                    <span class="add-qty" style="display:none">
                        <span class="minus-btn" onclick="event.stopPropagation(); removeFromCart(this.parentElement.parentElement)">−</span>
                        <span class="qty-text"></span>
                    </span>
                </button>
            </div>
            @empty
            <div class="text-center text-muted py-5 w-100">
                <i class="fas fa-box-open fa-3x mb-3"></i>
                <p>@lang('app.no_products')</p>
            </div>
            @endforelse
        </div>

        <!-- Floating Cart Bar -->
        <div class="cart-float" id="cartFloat" style="display:none;flex-shrink:0;">
            <div class="cart-float-info">
                <i class="fas fa-shopping-cart me-1"></i>
                <span id="cartFloatCount">0</span> item
                <span class="mx-1">·</span>
                <strong id="cartFloatTotal">Rp 0</strong>
            </div>
            <button class="btn btn-success btn-float-continue" id="btnContinue" onclick="showStep('cart')">
                Lanjutkan <i class="fas fa-arrow-right ms-1"></i>
            </button>
        </div>
    </div>

    <!-- ===== STEP 2: Cart Review ===== -->
    <div class="pos-step pos-step-hidden" id="stepCart">
        <div class="pos-step-header">
            <button class="btn btn-sm btn-step-back" onclick="showStep('products')">
                <i class="fas fa-arrow-left"></i>
            </button>
            <h6 class="mb-0 fw-bold"><i class="fas fa-shopping-cart me-2"></i>Daftar Belanja</h6>
            <button class="btn btn-sm btn-outline-danger" onclick="clearCart(); showStep('products')">
                <i class="fas fa-trash"></i>
            </button>
        </div>

        <div class="pos-step-body" id="cartReviewBody">
            <div class="text-center text-muted py-5" id="emptyCartMsg">
                <i class="fas fa-cart-plus fa-3x mb-3"></i>
                <p>@lang('app.cart_empty')</p>
            </div>
        </div>

        <div class="pos-step-footer" id="cartFooter" style="display:none">
            <div class="d-flex justify-content-between mb-1">
                <span class="text-muted small">@lang('app.subtotal')</span>
                <span id="reviewSubtotal" class="fw-semibold">Rp 0</span>
            </div>
            <div class="d-flex justify-content-between align-items-center mb-1">
                <span class="text-muted small">@lang('app.discount')</span>
                <div class="d-flex align-items-center gap-1">
                    <input type="number" id="reviewDiscount" class="form-control form-control-sm text-end"
                           style="width:75px" value="0" min="0" oninput="updateReviewTotals()">
                    <select id="reviewDiscountType" class="form-select form-select-sm"
                            style="width:55px" onchange="updateReviewTotals()">
                        <option value="fixed">Rp</option>
                        <option value="percent">%</option>
                    </select>
                </div>
            </div>
            <hr class="my-1">
            <div class="d-flex justify-content-between align-items-center mb-2">
                <strong>@lang('app.grand_total')</strong>
                <strong class="text-primary fs-5" id="reviewGrandTotal">Rp 0</strong>
            </div>
            <button class="btn btn-primary btn-lg w-100" id="btnPay" onclick="showStep('payment')">
                Bayar <i class="fas fa-arrow-right ms-1"></i>
            </button>
        </div>
    </div>

    <!-- ===== STEP 3: Payment ===== -->
    <div class="pos-step pos-step-hidden" id="stepPayment">
        <div class="pos-step-header">
            <button class="btn btn-sm btn-step-back" onclick="showStep('cart')">
                <i class="fas fa-arrow-left"></i>
            </button>
            <h6 class="mb-0 fw-bold"><i class="fas fa-credit-card me-2"></i>Pembayaran</h6>
        </div>

        <div class="pos-step-body">
            <div class="mb-3">
                <label class="form-label small text-muted">Metode Pembayaran</label>
                <div class="row g-1" id="paymentMethods">
                    @foreach(['cash' => 'Tunai', 'transfer' => 'Transfer', 'qris' => 'QRIS', 'ewallet' => 'E-Wallet', 'credit' => 'Kredit', 'debit' => 'Debit', 'receivable' => 'Piutang'] as $val => $label)
                    <div class="col">
                        <button class="btn btn-outline-primary btn-sm w-100 payment-method {{ $val === 'cash' ? 'active' : '' }}"
                                data-method="{{ $val }}" onclick="selectPayment(this)">
                            {{ $label }}
                        </button>
                    </div>
                    @endforeach
                </div>
            </div>

            <div class="d-flex justify-content-between align-items-center mb-3 p-3 bg-light rounded">
                <span class="text-muted">@lang('app.grand_total')</span>
                <strong class="fs-4 text-primary" id="paymentGrandTotal">Rp 0</strong>
            </div>

            <div class="mb-3" id="cashReceivedGroup">
                <label class="form-label small text-muted">Jumlah Tunai Diterima</label>
                <input type="number" id="paymentCashReceived" class="form-control form-control-lg"
                       placeholder="0" value="0" oninput="updatePaymentChange()">
                <div class="d-flex justify-content-between mt-1">
                    <span class="small text-muted">Kembalian</span>
                    <span class="fw-bold text-success fs-5" id="paymentChangeDue">Rp 0</span>
                </div>
            </div>
        </div>

        <div class="pos-step-footer">
            <button class="btn btn-primary btn-lg w-100 fw-bold" id="checkoutBtn" onclick="checkout()" disabled>
                <i class="fas fa-check-circle me-2"></i>@lang('app.checkout')
            </button>
            <button class="btn btn-outline-secondary w-100 mt-1" onclick="printReceipt()" disabled>
                <i class="fas fa-print me-2"></i>Cetak Struk
            </button>
        </div>
    </div>
</div>

@push('scripts')
<script>
let cart = [];
let selectedPayment = 'cash';
const settings = {
    store_name: '{{ \App\Models\Setting::getValue("store_name", config("app.name")) }}',
    store_address: '{{ \App\Models\Setting::getValue("store_address") }}',
    store_phone: '{{ \App\Models\Setting::getValue("store_phone") }}',
    receipt_footer: '{{ \App\Models\Setting::getValue("receipt_footer") }}',
};
const lang = {
    cart_empty: '{{ __("app.cart_empty") }}',
    click_to_add: '{{ __("app.click_to_add") }}',
    out_of_stock: '{{ __("app.out_of_stock") }}',
    clear_cart: '{{ __("app.clear_cart") }}',
    transaction_success: '{{ __("app.transaction_success") }}',
    processing: '{{ __("app.processing") }}',
    product_not_found: '{{ __("app.product_not_found") }}',
    insufficient_cash: '{{ __("app.insufficient_cash") }}',
    error: '{{ __("app.error") }}',
    thank_you: '{{ __("app.thank_you") }}',
};

// ===== Step Navigation =====
function showStep(step) {
    document.querySelectorAll('.pos-step').forEach(el => el.classList.add('pos-step-hidden'));
    document.getElementById('step' + step.charAt(0).toUpperCase() + step.slice(1)).classList.remove('pos-step-hidden');
    if (step === 'cart') renderCartReview();
    if (step === 'payment') {
        document.getElementById('paymentGrandTotal').textContent = 'Rp ' + getGrandTotal().toLocaleString('id-ID');
        document.getElementById('cashReceivedGroup').style.display = selectedPayment === 'cash' ? 'block' : 'none';
        updatePaymentChange();
    }
}

// ===== Clock =====
function updateClock() {
    const now = new Date();
    document.getElementById('clock').textContent = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}
setInterval(updateClock, 1000);
updateClock();

// ===== Product Search =====
document.getElementById('productSearch').addEventListener('input', function() {
    const q = this.value.toLowerCase();
    document.querySelectorAll('.product-card').forEach(card => {
        const name = card.dataset.name.toLowerCase();
        const sku = (card.dataset.sku || '').toLowerCase();
        const barcode = (card.dataset.barcode || '').toLowerCase();
        card.style.display = name.includes(q) || sku.includes(q) || barcode.includes(q) ? '' : 'none';
    });
});

// ===== Barcode Scan =====
document.getElementById('barcodeInput').addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
        e.preventDefault();
        const barcode = this.value.trim();
        if (barcode) {
            handleBarcode(barcode, this);
        }
    }
});

function handleBarcode(barcode, inputEl) {
    const skuCard = document.querySelector(`.product-card[data-sku="${barcode}"]`);
    const barcodeCard = document.querySelector(`.product-card[data-barcode="${barcode}"]`);
    const card = skuCard || barcodeCard;
    if (card) {
        addToCart(card.querySelector('.product-card-add'));
        if (inputEl) inputEl.value = '';
        return;
    }
    fetch('/pos/lookup-barcode/' + encodeURIComponent(barcode))
        .then(function(r) { return r.json(); })
        .then(function(data) {
            if (data.found && data.product) {
                var p = data.product;
                var fakeBtn = {
                    closest: function() {
                        return {
                            dataset: {
                                id: String(p.id),
                                name: p.name,
                                price: p.retail_price || p.price || 0,
                                stock: p.stock || 0
                            },
                            querySelector: function() { return fakeBtn; }
                        };
                    },
                    classList: { add: function(){}, remove: function(){} },
                    querySelector: function() { return { style: { display: 'none' }, textContent: '' }; }
                };
                addToCart(fakeBtn);
                if (inputEl) inputEl.value = '';
            } else {
                alert(lang.product_not_found + ' ' + barcode);
            }
        })
        .catch(function() {
            alert(lang.product_not_found + ' ' + barcode);
        });
}

// ===== Photo Toggle =====
(function() {
    const productGrid = document.getElementById('productGrid');
    const toggleBtn = document.getElementById('togglePhotosBtn');
    const savedPhotoPref = localStorage.getItem('pos_show_photos');
    const isMobile = window.innerWidth < 992;

    function updateToggleBtn() {
        const hidden = productGrid.classList.contains('hide-photos');
        toggleBtn.classList.toggle('btn-outline-secondary', !hidden);
        toggleBtn.classList.toggle('hide-photos-btn-active', hidden);
    }

    if (savedPhotoPref === null ? isMobile : savedPhotoPref === 'false') {
        productGrid.classList.add('hide-photos');
    }
    updateToggleBtn();

    toggleBtn.addEventListener('click', function() {
        productGrid.classList.toggle('hide-photos');
        localStorage.setItem('pos_show_photos', !productGrid.classList.contains('hide-photos'));
        updateToggleBtn();
    });
})();
document.querySelectorAll('.category-filter').forEach(btn => {
    btn.addEventListener('click', function() {
        document.querySelectorAll('.category-filter').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        const id = this.dataset.id;
        document.querySelectorAll('.product-card').forEach(card => {
            if (!id || card.dataset.categoryId === id) {
                card.style.display = '';
            } else {
                card.style.display = 'none';
            }
        });
    });
});

// ===== Add to Cart =====
function addToCart(btn) {
    const card = btn.closest('.product-card');
    const id = card.dataset.id;
    const name = card.dataset.name;
    const price = parseInt(card.dataset.price);
    const stock = parseInt(card.dataset.stock);

    const existing = cart.find(item => item.id === id);
    if (existing) {
        if (existing.qty >= stock) {
            alert('Stok tidak mencukupi!');
            return;
        }
        existing.qty++;
    } else {
        if (stock < 1) {
            alert(lang.out_of_stock);
            return;
        }
        cart.push({ id, name, price, stock, qty: 1 });
        // Pindah card ke atas grid biar keliatan
        var grid = document.getElementById('productGrid');
        if (grid && card && card.nodeType === 1) grid.prepend(card);
    }

    updateProductBadge(btn, id);
    updateCartFloat();
}

// ===== Remove from Cart (decrement/hapus) =====
function removeFromCart(btn) {
    var card = btn.closest('.product-card');
    var id = card.dataset.id;
    var existing = cart.find(function(i) { return i.id === id; });
    if (!existing) return;

    if (existing.qty > 1) {
        existing.qty--;
    } else {
        cart = cart.filter(function(i) { return i.id !== id; });
    }

    updateProductBadge(btn, id);
    updateCartFloat();
}

function updateProductBadge(btn, id) {
    var item = cart.find(function(i) { return i.id === id; });
    var qtySpan = btn.querySelector('.add-qty');
    var qtyText = btn.querySelector('.qty-text');

    if (item) {
        qtySpan.style.display = 'inline-flex';
        if (qtyText) qtyText.textContent = item.qty;
    } else {
        qtySpan.style.display = 'none';
    }
}

function updateCartFloat() {
    const floatBar = document.getElementById('cartFloat');
    const count = cart.reduce((sum, item) => sum + item.qty, 0);
    const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

    if (count === 0) {
        floatBar.style.display = 'none';
        return;
    }
    floatBar.style.display = 'flex';
    document.getElementById('cartFloatCount').textContent = count;
    document.getElementById('cartFloatTotal').textContent = 'Rp ' + total.toLocaleString('id-ID');
}

function refreshAllBadges() {
    document.querySelectorAll('.product-card-add').forEach(function(btn) {
        var card = btn.closest('.product-card');
        var id = card.dataset.id;
        var item = cart.find(function(i) { return i.id === id; });
        var qtySpan = btn.querySelector('.add-qty');
        var qtyText = btn.querySelector('.qty-text');
        if (item) {
            qtySpan.style.display = 'inline-flex';
            if (qtyText) qtyText.textContent = item.qty;
        } else {
            qtySpan.style.display = 'none';
        }
    });
}

// ===== Cart Review =====
function renderCartReview() {
    const body = document.getElementById('cartReviewBody');
    const footer = document.getElementById('cartFooter');
    const emptyMsg = document.getElementById('emptyCartMsg');

    if (!body) return;

    body.innerHTML = '';

    if (cart.length === 0) {
        if (emptyMsg) {
            body.appendChild(emptyMsg);
            emptyMsg.style.display = '';
        }
        if (footer) footer.style.display = 'none';
        return;
    }

    if (emptyMsg) emptyMsg.style.display = 'none';
    if (footer) footer.style.display = '';

    var fragment = document.createDocumentFragment();

    cart.forEach(function(item, idx) {
        var div = document.createElement('div');
        div.className = 'cart-review-item';

        // info
        var info = document.createElement('div');
        info.className = 'cart-review-info';
        var nameDiv = document.createElement('div');
        nameDiv.className = 'cart-review-name';
        nameDiv.textContent = item.name;
        var priceDiv = document.createElement('div');
        priceDiv.className = 'cart-review-price';
        priceDiv.textContent = 'Rp ' + Number(item.price).toLocaleString('id-ID');
        info.appendChild(nameDiv);
        info.appendChild(priceDiv);

        // qty controls
        var qtyDiv = document.createElement('div');
        qtyDiv.className = 'cart-review-qty';
        var minusBtn = document.createElement('button');
        minusBtn.className = 'btn btn-outline-secondary review-qty-btn';
        minusBtn.dataset.idx = idx;
        minusBtn.dataset.delta = '-1';
        minusBtn.textContent = '\u2212';
        var qtySpan = document.createElement('span');
        qtySpan.textContent = item.qty;
        var plusBtn = document.createElement('button');
        plusBtn.className = 'btn btn-outline-secondary review-qty-btn';
        plusBtn.dataset.idx = idx;
        plusBtn.dataset.delta = '1';
        plusBtn.textContent = '+';
        qtyDiv.appendChild(minusBtn);
        qtyDiv.appendChild(qtySpan);
        qtyDiv.appendChild(plusBtn);

        // subtotal
        var subDiv = document.createElement('div');
        subDiv.className = 'cart-review-subtotal';
        subDiv.textContent = 'Rp ' + Number(item.price * item.qty).toLocaleString('id-ID');

        // remove button
        var removeBtn = document.createElement('button');
        removeBtn.className = 'cart-review-remove';
        removeBtn.dataset.idx = idx;
        removeBtn.innerHTML = '&times;';

        div.appendChild(info);
        div.appendChild(qtyDiv);
        div.appendChild(subDiv);
        div.appendChild(removeBtn);
        fragment.appendChild(div);
    });

    body.appendChild(fragment);
    updateReviewTotals();
}

// ===== Cart Review Event Delegation =====
document.getElementById('cartReviewBody').addEventListener('click', function(e) {
    var target = e.target.closest('button');
    if (!target) return;

    var idx = target.dataset.idx;
    if (idx === undefined) return;
    idx = parseInt(idx);

    if (target.classList.contains('review-qty-btn')) {
        var delta = parseInt(target.dataset.delta);
        reviewUpdateQty(idx, delta);
    } else if (target.classList.contains('cart-review-remove')) {
        reviewRemoveItem(idx);
    }
});

function reviewUpdateQty(idx, delta) {
    const item = cart[idx];
    const newQty = item.qty + delta;
    if (newQty < 1) {
        cart.splice(idx, 1);
    } else if (newQty > item.stock) {
        alert('Stok tidak mencukupi!');
        return;
    } else {
        item.qty = newQty;
    }
    refreshAllBadges();
    updateCartFloat();
    renderCartReview();
}

function reviewRemoveItem(idx) {
    cart.splice(idx, 1);
    refreshAllBadges();
    updateCartFloat();
    renderCartReview();
}

function updateReviewTotals() {
    const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
    const discountVal = parseInt(document.getElementById('reviewDiscount').value) || 0;
    const discountType = document.getElementById('reviewDiscountType').value;
    let discount = discountType === 'percent' ? Math.round(subtotal * discountVal / 100) : discountVal;
    if (discount > subtotal) discount = subtotal;
    const grandTotal = subtotal - discount;
    document.getElementById('reviewSubtotal').textContent = 'Rp ' + subtotal.toLocaleString('id-ID');
    document.getElementById('reviewGrandTotal').textContent = 'Rp ' + grandTotal.toLocaleString('id-ID');
}

function getGrandTotal() {
    const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
    const discountVal = parseInt(document.getElementById('reviewDiscount').value) || 0;
    const discountType = document.getElementById('reviewDiscountType').value;
    let discount = discountType === 'percent' ? Math.round(subtotal * discountVal / 100) : discountVal;
    return Math.max(subtotal - discount, 0);
}

function clearCart() {
    if (cart.length === 0) return;
    if (confirm(lang.clear_cart)) {
        cart = [];
        document.getElementById('reviewDiscount').value = 0;
        document.getElementById('paymentCashReceived').value = 0;
        refreshAllBadges();
        updateCartFloat();
        renderCartReview();
    }
}

// ===== Payment =====
function selectPayment(btn) {
    document.querySelectorAll('#paymentMethods .payment-method').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    selectedPayment = btn.dataset.method;
    document.getElementById('cashReceivedGroup').style.display = selectedPayment === 'cash' ? 'block' : 'none';
    updatePaymentChange();
}

function updatePaymentChange() {
    const grandTotal = getGrandTotal();
    const cashReceived = parseInt(document.getElementById('paymentCashReceived').value) || 0;
    const change = cashReceived - grandTotal;
    document.getElementById('paymentGrandTotal').textContent = 'Rp ' + grandTotal.toLocaleString('id-ID');
    document.getElementById('paymentChangeDue').textContent = 'Rp ' + Math.max(change, 0).toLocaleString('id-ID');
    const checkoutBtn = document.getElementById('checkoutBtn');
    if (selectedPayment === 'cash') {
        checkoutBtn.disabled = cashReceived < grandTotal || cart.length === 0;
    } else {
        checkoutBtn.disabled = cart.length === 0;
    }
}

function checkout() {
    if (cart.length === 0) return;
    const grandTotal = getGrandTotal();
    if (selectedPayment === 'cash') {
        const cashReceived = parseInt(document.getElementById('paymentCashReceived').value) || 0;
        if (cashReceived < grandTotal) {
            alert(lang.insufficient_cash);
            return;
        }
    }

    const items = cart.map(item => ({
        product_id: item.id,
        quantity: item.qty,
        price: item.price
    }));

    const checkoutBtn = document.getElementById('checkoutBtn');
    checkoutBtn.disabled = true;
    checkoutBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> ' + lang.processing;

    const discountVal = parseInt(document.getElementById('reviewDiscount').value) || 0;
    const discountType = document.getElementById('reviewDiscountType').value;
    const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
    const discount = discountType === 'percent' ? Math.round(subtotal * discountVal / 100) : discountVal;
    const cashReceived = parseInt(document.getElementById('paymentCashReceived').value) || 0;
    const paidAmount = selectedPayment === 'cash' ? cashReceived : grandTotal;

    fetch('{{ route("pos.checkout") }}', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': '{{ csrf_token() }}'
        },
        body: JSON.stringify({
            items: items,
            payment_method: selectedPayment,
            paid_amount: paidAmount,
            discount: Math.min(discount, grandTotal)
        })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            alert(lang.transaction_success);
            const printUrl = data.print_url;
            cart = [];
            document.getElementById('reviewDiscount').value = 0;
            document.getElementById('paymentCashReceived').value = 0;
            document.getElementById('reviewDiscountType').value = 'fixed';
            refreshAllBadges();
            updateCartFloat();
            showStep('products');
            if (printUrl) {
                const printWin = window.open(printUrl, 'receipt', 'width=380,height=600');
                if (printWin) printWin.focus();
            }
        } else {
            alert(lang.error + ': ' + (data.message || 'Transaksi gagal'));
        }
    })
    .catch(err => {
        alert(lang.error);
        console.error(err);
    })
    .finally(() => {
        checkoutBtn.disabled = false;
        checkoutBtn.innerHTML = '<i class="fas fa-check-circle me-2"></i>@lang('app.checkout')';
    });
}

function printReceipt() {
    if (cart.length === 0) return;
    const total = getGrandTotal();
    let itemsHtml = '';
    cart.forEach(item => {
        itemsHtml += `<tr>
            <td>${item.name}</td>
            <td class="text-center">${item.qty}</td>
            <td class="text-end">Rp ${item.price.toLocaleString('id-ID')}</td>
            <td class="text-end">Rp ${(item.price * item.qty).toLocaleString('id-ID')}</td>
        </tr>`;
    });

    const discountVal = parseInt(document.getElementById('reviewDiscount').value) || 0;
    const discountType = document.getElementById('reviewDiscountType').value;
    const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
    let discount = discountType === 'percent' ? Math.round(subtotal * discountVal / 100) : discountVal;
    if (discount > subtotal) discount = subtotal;

    const footerText = settings.receipt_footer || lang.thank_you;
    const printWin = window.open('', '_blank', 'width=300,height=600');
    printWin.document.write(`
        <html><head><title>@lang('app.receipt')</title>
        <style>
            body { font-family: 'Courier New', monospace; font-size: 12px; width: 280px; margin: 0 auto; padding: 10px; }
            table { width: 100%; border-collapse: collapse; }
            td, th { padding: 4px 2px; }
            .text-center { text-align: center; }
            .text-end { text-align: right; }
            hr { border-top: 1px dashed #000; }
            .header { text-align: center; margin-bottom: 10px; }
            .footer { text-align: center; margin-top: 8px; }
        </style>
        </head><body>
        <div class="header">
            <h3 style="margin:0;">${settings.store_name}</h3>
            ${settings.store_address ? `<small>${settings.store_address}</small><br>` : ''}
            ${settings.store_phone ? `<small>${settings.store_phone}</small><br>` : ''}
            <small>@lang('app.receipt')</small><br>
            <small>${new Date().toLocaleString('id-ID')}</small>
        </div>
        <hr>
        <table>
            <tr><th>@lang('app.item')</th><th class="text-center">@lang('app.quantity')</th><th class="text-end">@lang('app.unit_price')</th><th class="text-end">@lang('app.total')</th></tr>
            ${itemsHtml}
        </table>
        ${discount > 0 ? `<hr><div style="display:flex;justify-content:space-between;"><span>@lang('app.discount')</span><span>Rp ${discount.toLocaleString('id-ID')}</span></div>` : ''}
        <hr>
        <div style="display:flex;justify-content:space-between;">
            <strong>@lang('app.grand_total')</strong>
            <strong>Rp ${total.toLocaleString('id-ID')}</strong>
        </div>
        <hr>
        ${footerText ? `<div class="footer"><small>${footerText}</small></div>` : ''}
        <script>window.print();window.close();<\/script>
        </body></html>
    `);
    printWin.document.close();
}

// ===== Discount & Cash Events =====
document.getElementById('reviewDiscount')?.addEventListener('input', function() {
    renderCartReview();
});
document.getElementById('reviewDiscountType')?.addEventListener('change', function() {
    renderCartReview();
});
document.getElementById('paymentCashReceived')?.addEventListener('input', function() {
    updatePaymentChange();
});

// ===== Camera Barcode Scanner =====
let posScanner = null;

document.getElementById('scanBarcodeBtn').addEventListener('click', function() {
    if (posScanner) {
        stopPosScanner();
        return;
    }

    var overlay = document.createElement('div');
    overlay.id = 'pos-scanner-overlay';
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.85);z-index:9999;display:flex;flex-direction:column;align-items:center;justify-content:center;';
    overlay.innerHTML = '<div id="pos-scanner-box" style="width:280px;height:280px;background:#000;border-radius:12px;overflow:hidden;"></div>' +
        '<button type="button" class="btn btn-light mt-3" onclick="stopPosScanner()"><i class="fas fa-times me-1"></i>Tutup</button>' +
        '<p class="text-white-50 mt-2 small">Arahkan kamera ke barcode produk</p>';
    document.body.appendChild(overlay);

    posScanner = new Html5Qrcode('pos-scanner-box');
    posScanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 240, height: 120 } },
        function(decodedText) {
            document.getElementById('barcodeInput').value = decodedText;
            stopPosScanner();
            handleBarcode(decodedText, document.getElementById('barcodeInput'));
        },
        function() {}
    ).catch(function(err) {
        alert('Tidak dapat mengakses kamera: ' + err);
        stopPosScanner();
    });
});

function stopPosScanner() {
    if (posScanner) {
        posScanner.stop().then(function() {
            posScanner = null;
            var el = document.getElementById('pos-scanner-overlay');
            if (el) el.remove();
        }).catch(function() {
            posScanner = null;
            var el = document.getElementById('pos-scanner-overlay');
            if (el) el.remove();
        });
    } else {
        var el = document.getElementById('pos-scanner-overlay');
        if (el) el.remove();
    }
}
</script>
@endpush
@endsection
