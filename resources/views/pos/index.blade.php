@extends('layouts.pos')

@section('title', __('app.pos'))

@push('styles')
<style>
/* Override Bootstrap button styles on product cards */
.product-card {
    border: 1px solid #e9ecef;
    border-radius: 10px;
    padding: 0;
    background: #fff;
    cursor: pointer;
    transition: all 0.2s;
    text-align: center;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    width: 100%;
    outline: none;
    box-shadow: none;
}
.product-card:hover {
    border-color: #4361ee;
    box-shadow: 0 2px 12px rgba(67, 97, 238, 0.15);
    transform: translateY(-2px);
}
.product-card:active {
    transform: scale(0.97);
}
.product-card .product-card-img {
    height: 90px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f8f9fa;
    font-size: 2rem;
    flex-shrink: 0;
}
.product-card .product-card-img img {
    max-width: 100%;
    max-height: 100%;
    object-fit: cover;
}
.product-card .product-card-body {
    padding: 0.5rem;
    display: flex;
    flex-direction: column;
    gap: 2px;
    flex: 1;
}
.product-card-name {
    font-weight: 600;
    font-size: 0.8rem;
    color: #333;
    line-height: 1.2;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}
.product-card-sku {
    font-size: 0.65rem;
}
.product-card-price {
    font-size: 0.85rem;
    color: #4361ee;
}
.product-card-stock {
    font-size: 0.65rem;
}

/* Fix pos-products grid */
.pos-products {
    flex: 1;
    overflow-y: auto;
    padding: 1rem 1.5rem;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 0.75rem;
    align-content: start;
}

/* Cart item improvements */
.cart-item {
    background: #fff;
    border: 1px solid #e9ecef;
    border-radius: 8px;
    padding: 0.75rem;
    margin-bottom: 0.5rem;
}
.cart-item:last-child {
    margin-bottom: 0;
}

/* Payment method buttons - ensure proper sizing */
.payment-method {
    font-size: 0.72rem;
    padding: 0.35rem 0.25rem;
    white-space: nowrap;
}

/* Fix scroll on mobile */
@media (max-width: 768px) {
    .pos-left, .pos-right {
        height: auto !important;
        min-height: 50vh;
    }
    .pos-container {
        overflow-y: auto;
    }
}
</style>
@endpush

@section('content')
<div class="pos-container">
    <div class="pos-left">
        <div class="pos-header">
            <div class="d-flex align-items-center gap-3">
                <a href="{{ route('dashboard') }}" class="btn btn-outline-secondary btn-sm">
                    <i class="fas fa-arrow-left"></i>
                </a>
                <h5 class="mb-0 fw-bold"><i class="fas fa-cash-register me-2"></i>@lang('app.pos')</h5>
            </div>
            <div class="d-flex align-items-center gap-2">
                <span class="badge bg-primary fs-6" id="clock"></span>
            </div>
        </div>

        <div class="pos-search">
            <div class="input-group input-group-lg">
                <span class="input-group-text bg-white"><i class="fas fa-search"></i></span>
                <input type="text" id="productSearch" class="form-control form-control-lg" placeholder="@lang('app.search_product')" autofocus>
            </div>
            <div class="input-group mt-2">
                <span class="input-group-text bg-white"><i class="fas fa-qrcode"></i></span>
                <input type="text" id="barcodeInput" class="form-control" placeholder="@lang('app.scan_barcode')">
            </div>
        </div>

        <div class="pos-categories">
            <button class="btn btn-sm category-filter active" data-id="">@lang('app.all')</button>
            @foreach($categories ?? [] as $category)
            <button class="btn btn-sm btn-outline-secondary category-filter" data-id="{{ $category->id }}">{{ $category->name }}</button>
            @endforeach
        </div>

        <div class="pos-products" id="productGrid">
            @forelse($products ?? [] as $product)
            <div class="product-card" tabindex="0" role="button"
                 data-id="{{ $product->id }}"
                 data-name="{{ $product->name }}"
                 data-price="{{ $product->price }}"
                 data-stock="{{ $product->stock }}"
                 data-sku="{{ $product->sku }}">
                <div class="product-card-img">
                    @if($product->image)
                        <img src="{{ asset('storage/' . $product->image) }}" alt="{{ $product->name }}">
                    @else
                        <i class="fas fa-box-open text-muted"></i>
                    @endif
                </div>
                <div class="product-card-body">
                    <small class="product-card-name">{{ $product->name }}</small>
                    <small class="product-card-sku text-muted">{{ $product->sku ?? '' }}</small>
                    <strong class="product-card-price">Rp {{ number_format($product->price, 0, ',', '.') }}</strong>
                    <small class="product-card-stock text-muted">@lang('app.stock_qty'): {{ $product->stock }}</small>
                </div>
            </div>
            @empty
            <div class="text-center text-muted py-5 w-100">
                <i class="fas fa-box-open fa-3x mb-3"></i>
                <p>@lang('app.no_products')</p>
            </div>
            @endforelse
        </div>
    </div>

    <div class="pos-right">
        <div class="cart-header">
            <h6 class="mb-0 fw-bold"><i class="fas fa-shopping-cart me-2"></i>@lang('app.cart')</h6>
            <button class="btn btn-sm btn-outline-danger" id="clearCartBtn" onclick="clearCart()">
                <i class="fas fa-trash"></i>
            </button>
        </div>

        <div class="cart-items" id="cartItems">
            <div class="text-center text-muted py-5" id="emptyCart">
                <i class="fas fa-cart-plus fa-3x mb-3"></i>
                <p>@lang('app.cart_empty')</p>
                <small>@lang('app.click_to_add')</small>
            </div>
        </div>

        <div class="cart-summary">
            <div class="d-flex justify-content-between mb-2">
                <span class="text-muted">@lang('app.subtotal')</span>
                <span id="subtotal">Rp 0</span>
            </div>
            <div class="d-flex justify-content-between mb-2">
                <span class="text-muted">@lang('app.discount')</span>
                <div class="d-flex align-items-center gap-1">
                    <input type="number" id="discountInput" class="form-control form-control-sm text-end" style="width:100px" value="0" min="0" onchange="updateTotals()">
                    <select id="discountType" class="form-select form-select-sm" style="width:70px" onchange="updateTotals()">
                        <option value="fixed">Rp</option>
                        <option value="percent">%</option>
                    </select>
                </div>
            </div>
            <hr>
            <div class="d-flex justify-content-between mb-3">
                <strong class="fs-5">@lang('app.grand_total')</strong>
                <strong class="fs-5 text-primary" id="grandTotal">Rp 0</strong>
            </div>

            <div class="mb-3">
                <label class="form-label small text-muted">@lang('app.payment_method')</label>
                <div class="row g-1" id="paymentMethods">
                    @foreach(['cash' => __('app.cash'), 'transfer' => __('app.transfer'), 'qris' => __('app.qris'), 'ewallet' => __('app.ewallet'), 'credit' => __('app.credit'), 'debit' => __('app.debit'), 'receivable' => __('app.receivable')] as $val => $label)
                    <div class="col">
                        <button class="btn btn-outline-primary btn-sm w-100 payment-method {{ $val === 'cash' ? 'active' : '' }}" data-method="{{ $val }}" onclick="selectPayment(this)">
                            {{ $label }}
                        </button>
                    </div>
                    @endforeach
                </div>
            </div>

            <div class="mb-3" id="cashReceivedGroup">
                <label class="form-label small text-muted">@lang('app.cash_received')</label>
                <input type="number" id="cashReceived" class="form-control" placeholder="0" value="0" onchange="updateChange()">
                <div class="d-flex justify-content-between mt-1">
                    <span class="small text-muted">@lang('app.change_due')</span>
                    <span class="fw-bold text-success" id="changeDue">Rp 0</span>
                </div>
            </div>

            <div class="d-grid gap-2">
                <button class="btn btn-primary btn-lg fw-bold" id="checkoutBtn" onclick="checkout()" disabled>
                    <i class="fas fa-check-circle me-2"></i>@lang('app.checkout')
                </button>
                <button class="btn btn-outline-secondary" onclick="printReceipt()" disabled>
                    <i class="fas fa-print me-2"></i>@lang('app.print')
                </button>
            </div>
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

function updateClock() {
    const now = new Date();
    document.getElementById('clock').textContent = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}
setInterval(updateClock, 1000);
updateClock();

document.getElementById('productSearch').addEventListener('input', function() {
    const q = this.value.toLowerCase();
    document.querySelectorAll('.product-card').forEach(card => {
        const name = card.dataset.name.toLowerCase();
        card.style.display = name.includes(q) ? '' : 'none';
    });
});

document.getElementById('barcodeInput').addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
        e.preventDefault();
        const barcode = this.value.trim();
        if (barcode) {
            const card = document.querySelector(`.product-card[data-sku="${barcode}"]`);
            if (card) {
                card.click();
                this.value = '';
            } else {
                alert(lang.product_not_found + ' ' + barcode);
            }
        }
    }
});

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

document.querySelectorAll('.product-card').forEach(card => {
    card.addEventListener('click', function() {
        addToCart(this.dataset.id, this.dataset.name, parseInt(this.dataset.price), parseInt(this.dataset.stock));
    });
    card.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            this.click();
        }
    });
});

function addToCart(id, name, price, stock) {
    const existing = cart.find(item => item.id === id);
    if (existing) {
        if (existing.qty >= stock) {
            alert('@lang('app.insufficient_stock', ['product' => '', 'stock' => ''])');
            return;
        }
        existing.qty++;
    } else {
        if (stock < 1) {
            alert(lang.out_of_stock);
            return;
        }
        cart.push({ id, name, price, stock, qty: 1 });
    }
    renderCart();
}

function renderCart() {
    const container = document.getElementById('cartItems');

    if (cart.length === 0) {
        container.innerHTML = `
            <div class="text-center text-muted py-5">
                <i class="fas fa-cart-plus fa-3x mb-3"></i>
                <p>${lang.cart_empty}</p>
                <small>${lang.click_to_add}</small>
            </div>
        `;
        document.getElementById('checkoutBtn').disabled = true;
        document.querySelector('button[onclick="printReceipt()"]').disabled = true;
        updateTotals();
        return;
    }

    document.getElementById('checkoutBtn').disabled = false;
    document.querySelector('button[onclick="printReceipt()"]').disabled = false;

    let html = '';
    cart.forEach((item, idx) => {
        html += `
            <div class="cart-item">
                <div class="cart-item-info">
                    <div class="cart-item-name">${item.name}</div>
                    <div class="cart-item-price">Rp ${item.price.toLocaleString('id-ID')}</div>
                </div>
                <div class="cart-item-actions">
                    <button class="btn btn-sm btn-outline-secondary" onclick="updateQty(${idx}, -1)">−</button>
                    <span class="cart-item-qty">${item.qty}</span>
                    <button class="btn btn-sm btn-outline-secondary" onclick="updateQty(${idx}, 1)">+</button>
                    <span class="cart-item-subtotal ms-2 fw-semibold">Rp ${(item.price * item.qty).toLocaleString('id-ID')}</span>
                    <button class="btn btn-sm btn-outline-danger ms-1" onclick="removeItem(${idx})"><i class="fas fa-times"></i></button>
                </div>
            </div>
        `;
    });
    container.innerHTML = html;
    updateTotals();
}

function updateQty(idx, delta) {
    const item = cart[idx];
    const newQty = item.qty + delta;
    if (newQty < 1) {
        cart.splice(idx, 1);
    } else if (newQty > item.stock) {
        alert('@lang('app.insufficient_stock', ['product' => '', 'stock' => ''])');
        return;
    } else {
        item.qty = newQty;
    }
    renderCart();
}

function removeItem(idx) {
    cart.splice(idx, 1);
    renderCart();
}

function clearCart() {
    if (cart.length === 0) return;
    if (confirm(lang.clear_cart)) {
        cart = [];
        renderCart();
    }
}

function updateTotals() {
    const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
    const discountVal = parseInt(document.getElementById('discountInput').value) || 0;
    const discountType = document.getElementById('discountType').value;
    let discount = discountType === 'percent' ? Math.round(subtotal * discountVal / 100) : discountVal;
    if (discount > subtotal) discount = subtotal;
    const grandTotal = subtotal - discount;

    document.getElementById('subtotal').textContent = 'Rp ' + subtotal.toLocaleString('id-ID');
    document.getElementById('grandTotal').textContent = 'Rp ' + grandTotal.toLocaleString('id-ID');
    updateChange();
}

function updateChange() {
    const grandTotal = getGrandTotal();
    const cashReceived = parseInt(document.getElementById('cashReceived').value) || 0;
    const change = cashReceived - grandTotal;
    document.getElementById('changeDue').textContent = 'Rp ' + (change > 0 ? change : 0).toLocaleString('id-ID');
}

function getGrandTotal() {
    const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
    const discountVal = parseInt(document.getElementById('discountInput').value) || 0;
    const discountType = document.getElementById('discountType').value;
    let discount = discountType === 'percent' ? Math.round(subtotal * discountVal / 100) : discountVal;
    if (discount > subtotal) discount = subtotal;
    return subtotal - discount;
}

function selectPayment(btn) {
    document.querySelectorAll('.payment-method').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    selectedPayment = btn.dataset.method;
    const cashGroup = document.getElementById('cashReceivedGroup');
    cashGroup.style.display = selectedPayment === 'cash' ? 'block' : 'none';
}

function checkout() {
    if (cart.length === 0) return;
    const grandTotal = getGrandTotal();
    if (selectedPayment === 'cash') {
        const cashReceived = parseInt(document.getElementById('cashReceived').value) || 0;
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

    document.getElementById('checkoutBtn').disabled = true;
    document.getElementById('checkoutBtn').innerHTML = '<span class="spinner-border spinner-border-sm"></span> ' + lang.processing;

    const discountVal = parseInt(document.getElementById('discountInput').value) || 0;
    const discountType = document.getElementById('discountType').value;
    const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
    const discount = discountType === 'percent' ? Math.round(subtotal * discountVal / 100) : discountVal;
    const cashReceived = parseInt(document.getElementById('cashReceived').value) || 0;
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
            discount: discount > grandTotal ? grandTotal : discount
        })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            alert(lang.transaction_success);
            const printUrl = data.print_url;
            cart = [];
            document.getElementById('discountInput').value = 0;
            document.getElementById('cashReceived').value = 0;
            renderCart();
            if (printUrl) {
                const printWin = window.open(printUrl, 'receipt', 'width=400,height=600');
                if (printWin) printWin.focus();
            }
        } else {
            alert(lang.error + ': ' + (data.message || 'Transaction failed'));
        }
    })
    .catch(err => {
        alert(lang.error);
        console.error(err);
    })
    .finally(() => {
        document.getElementById('checkoutBtn').disabled = false;
        document.getElementById('checkoutBtn').innerHTML = '<i class="fas fa-check-circle me-2"></i>@lang('app.checkout')';
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
</script>
@endpush
@endsection
