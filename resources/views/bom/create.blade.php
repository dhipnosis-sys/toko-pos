@extends('layouts.admin')

@section('title', 'Buat BOM')

@section('content')
<div class="container-fluid">
    <div class="d-flex justify-content-between align-items-center mb-4">
        <h4 class="mb-0 fw-bold"><i class="fas fa-plus-circle me-2"></i>Buat BOM</h4>
        <a href="{{ route('bom.index') }}" class="btn btn-outline-secondary"><i class="fas fa-arrow-left me-1"></i>Kembali</a>
    </div>

    <form action="{{ route('bom.store') }}" method="POST" id="bomForm">
        @csrf
        <div class="row">
            <div class="col-md-5">
                <div class="card border-0 shadow-sm mb-3">
                    <div class="card-body">
                        <h6 class="fw-semibold mb-3">Informasi BOM</h6>

                        <div class="mb-3">
                            <label class="form-label">Tipe Produk Jadi <span class="text-danger">*</span></label>
                            <select name="finished_good_type" class="form-select" onchange="toggleFgType(this)">
                                <option value="product" {{ old('finished_good_type', 'product') === 'product' ? 'selected' : '' }}>Dari Produk (tercatat di inventory)</option>
                                <option value="manual" {{ old('finished_good_type') === 'manual' ? 'selected' : '' }}>Manual (referensi saja)</option>
                            </select>
                        </div>

                        <div id="fgProduct" style="display:{{ old('finished_good_type') === 'manual' ? 'none' : 'block' }}">
                            <div class="mb-3">
                                <label class="form-label">Produk Jadi <span class="text-danger">*</span></label>
                                <select name="product_id" class="form-select">
                                    <option value="">-- Pilih Produk --</option>
                                    @foreach($products as $p)
                                        <option value="{{ $p->id }}" {{ old('product_id') == $p->id ? 'selected' : '' }}>
                                            {{ $p->name }} ({{ $p->sku }})
                                        </option>
                                    @endforeach
                                </select>
                            </div>
                        </div>

                        <div id="fgManual" style="display:{{ old('finished_good_type') === 'manual' ? 'block' : 'none' }}">
                            <div class="row g-2 mb-3">
                                <div class="col-8">
                                    <label class="form-label">Nama Barang <span class="text-danger">*</span></label>
                                    <input type="text" name="finished_good_name" class="form-control" value="{{ old('finished_good_name') }}" placeholder="Contoh: Nasi Goreng Spesial">
                                </div>
                                <div class="col-4">
                                    <label class="form-label">Satuan</label>
                                    <input type="text" name="finished_good_unit" class="form-control" value="{{ old('finished_good_unit') }}" placeholder="porsi">
                                </div>
                            </div>
                        </div>

                        <div class="mb-3">
                            <label class="form-label">Nama BOM <span class="text-danger">*</span></label>
                            <input type="text" name="name" class="form-control" value="{{ old('name') }}" required placeholder="Contoh: Resep Nasi Goreng Original">
                        </div>
                        <div class="row g-2 mb-3">
                            <div class="col-6">
                                <label class="form-label">Qty Produk <span class="text-danger">*</span></label>
                                <input type="number" name="quantity" class="form-control" value="{{ old('quantity', 1) }}" min="0.01" step="0.01" required>
                            </div>
                            <div class="col-6">
                                <label class="form-label">Satuan</label>
                                <input type="text" name="unit" class="form-control" value="{{ old('unit') }}" placeholder="porsi, pack, kg">
                            </div>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Catatan</label>
                            <textarea name="notes" class="form-control" rows="2">{{ old('notes') }}</textarea>
                        </div>
                    </div>
                </div>
            </div>

            <div class="col-md-7">
                <div class="card border-0 shadow-sm mb-3">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-center mb-3">
                            <h6 class="fw-semibold mb-0">Bahan Baku</h6>
                            <button type="button" class="btn btn-sm btn-success" onclick="addRow()"><i class="fas fa-plus me-1"></i>Tambah Bahan</button>
                        </div>
                        <div class="table-responsive">
                            <table class="table table-sm" id="itemsTable">
                                <thead class="table-light">
                                    <tr>
                                        <th style="width:90px">Tipe</th>
                                        <th>Bahan Baku</th>
                                        <th style="width:100px">Qty</th>
                                        <th style="width:120px">Harga Satuan</th>
                                        <th style="width:40px"></th>
                                    </tr>
                                </thead>
                                <tbody id="itemsBody">
                                </tbody>
                            </table>
                        </div>
                        <small class="text-muted">Pilih "Produk" jika bahan terdaftar di inventory. Pilih "Manual" jika bahan sekali pakai / tidak perlu stok.</small>
                    </div>
                </div>

                <div class="card border-0 shadow-sm mb-3">
                    <div class="card-body">
                        <h6 class="fw-semibold mb-3">Biaya & Laba</h6>
                        <div class="row g-2 mb-3">
                            <div class="col-4">
                                <label class="form-label">Tenaga Kerja</label>
                                <input type="number" name="labor_cost" class="form-control" value="{{ old('labor_cost', 0) }}" min="0">
                            </div>
                            <div class="col-4">
                                <label class="form-label">Overhead</label>
                                <input type="number" name="overhead_cost" class="form-control" value="{{ old('overhead_cost', 0) }}" min="0">
                            </div>
                            <div class="col-4">
                                <label class="form-label">Laba (% / Rp)</label>
                                <div class="input-group">
                                    <input type="number" name="profit_value" class="form-control" value="{{ old('profit_value', 0) }}" min="0">
                                    <select name="profit_type" class="form-select" style="max-width:80px">
                                        <option value="percentage" {{ old('profit_type', 'percentage') === 'percentage' ? 'selected' : '' }}>%</option>
                                        <option value="amount" {{ old('profit_type') === 'amount' ? 'selected' : '' }}>Rp</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="card border-0 shadow-sm mb-3">
                    <div class="card-body bg-light">
                        <h6 class="fw-semibold mb-2"><i class="fas fa-calculator me-1"></i>Live HPP</h6>
                        <div id="liveHpp">
                            <p class="text-muted small mb-0">Isi bahan baku dan biaya untuk melihat estimasi HPP</p>
                        </div>
                    </div>
                </div>

                <button type="submit" class="btn btn-primary btn-lg w-100"><i class="fas fa-save me-1"></i>Simpan BOM</button>
            </div>
        </div>
    </form>
</div>
@endsection

@push('scripts')
<script>
const productData = @json($products->map(fn($p) => ['id' => $p->id, 'text' => $p->name . ' (' . $p->sku . ')', 'cost_price' => $p->cost_price ?? 0]));

function toggleFgType(select) {
    const isManual = select.value === 'manual';
    document.getElementById('fgProduct').style.display = isManual ? 'none' : 'block';
    document.getElementById('fgManual').style.display = isManual ? 'block' : 'none';
    const prodSelect = document.querySelector('[name="product_id"]');
    const nameInput = document.querySelector('[name="finished_good_name"]');
    if (prodSelect) prodSelect.required = !isManual;
    if (nameInput) nameInput.required = isManual;
    calcHpp();
}
toggleFgType(document.querySelector('[name="finished_good_type"]'));

function getUnitCost(row) {
    const type = row.querySelector('[name$="[item_type]"]').value;
    if (type === 'product') {
        const prodId = row.querySelector('[name$="[product_id]"]').value;
        if (!prodId) return 0;
        const prod = productData.find(p => p.id == prodId);
        return prod ? (prod.cost_price || 0) : 0;
    }
    return parseFloat(row.querySelector('[name$="[unit_cost]"]').value) || 0;
}

function getQty(row) {
    return parseFloat(row.querySelector('[name$="[quantity]"]').value) || 0;
}

function calcHpp() {
    const rows = document.querySelectorAll('#itemsBody tr');
    const bomQty = parseFloat(document.querySelector('[name="quantity"]').value) || 1;
    const labor = parseFloat(document.querySelector('[name="labor_cost"]').value) || 0;
    const overhead = parseFloat(document.querySelector('[name="overhead_cost"]').value) || 0;
    const profitVal = parseFloat(document.querySelector('[name="profit_value"]').value) || 0;
    const profitType = document.querySelector('[name="profit_type"]').value;

    let rawTotal = 0;
    let detailRows = '';
    rows.forEach(row => {
        const qty = getQty(row);
        const unitCost = getUnitCost(row);
        const sub = qty * unitCost;
        rawTotal += sub;
        const type = row.querySelector('[name$="[item_type]"]').value;
        const nameEl = type === 'product'
            ? row.querySelector('[name$="[product_id]"] option:checked')
            : row.querySelector('[name$="[item_name]"]');
        const name = nameEl ? (nameEl.text || nameEl.value || '—') : '—';
        detailRows += `<tr><td>${name}</td><td class="text-end">${qty.toFixed(2)}</td><td class="text-end">Rp ${(unitCost).toLocaleString('id-ID')}</td><td class="text-end">Rp ${(sub).toLocaleString('id-ID')}</td></tr>`;
    });

    const totalCost = rawTotal + labor + overhead;
    const costPerUnit = bomQty > 0 ? Math.round(totalCost / bomQty) : 0;

    let profitAmount = 0;
    if (profitType === 'percentage') {
        profitAmount = Math.round(totalCost * profitVal / 100);
    } else {
        profitAmount = profitVal;
    }
    const suggestedPrice = totalCost + profitAmount;

    if (rows.length === 0) {
        document.getElementById('liveHpp').innerHTML = '<p class="text-muted small mb-0">Isi bahan baku dan biaya untuk melihat estimasi HPP</p>';
        return;
    }

    document.getElementById('liveHpp').innerHTML = `
        <div class="small">
            <div class="d-flex justify-content-between"><span>Bahan Baku</span><span class="fw-medium">Rp ${rawTotal.toLocaleString('id-ID')}</span></div>
            <div class="d-flex justify-content-between"><span>Tenaga Kerja</span><span class="fw-medium">Rp ${labor.toLocaleString('id-ID')}</span></div>
            <div class="d-flex justify-content-between"><span>Overhead</span><span class="fw-medium">Rp ${overhead.toLocaleString('id-ID')}</span></div>
            <hr class="my-1">
            <div class="d-flex justify-content-between"><strong>Total Biaya</strong><strong>Rp ${totalCost.toLocaleString('id-ID')}</strong></div>
            <div class="d-flex justify-content-between"><span class="text-primary fw-bold">HPP/Unit</span><span class="text-primary fw-bold fs-6">Rp ${costPerUnit.toLocaleString('id-ID')}</span></div>
            ${profitAmount > 0 ? `
            <hr class="my-1">
            <div class="d-flex justify-content-between"><span>Laba (${profitType === 'percentage' ? profitVal + '%' : 'Rp ' + profitVal.toLocaleString('id-ID')})</span><span class="text-success fw-medium">+ Rp ${profitAmount.toLocaleString('id-ID')}</span></div>
            <div class="d-flex justify-content-between"><strong class="text-success">Harga Jual</strong><strong class="text-success">Rp ${suggestedPrice.toLocaleString('id-ID')}</strong></div>
            ` : ''}
            ${detailRows ? `<hr class="my-1"><table class="table table-sm table-bordered mb-0 mt-1"><thead class="table-light"><tr><th>Bahan</th><th class="text-end">Qty</th><th class="text-end">Harga</th><th class="text-end">Sub</th></tr></thead><tbody>${detailRows}</tbody></table>` : ''}
        </div>
    `;
}

function setupCalc(el) {
    if (el) {
        el.addEventListener('change', calcHpp);
        el.addEventListener('input', calcHpp);
    }
}

let rowIndex = 0;
function addRow(data) {
    const tbody = document.getElementById('itemsBody');
    const tr = document.createElement('tr');
    const idx = rowIndex++;
    const type = data ? (data.item_type || 'product') : 'product';
    tr.innerHTML = `
        <td>
            <select name="items[${idx}][item_type]" class="form-select form-select-sm" onchange="toggleItemType(this)">
                <option value="product" ${type === 'product' ? 'selected' : ''}>Produk</option>
                <option value="manual" ${type === 'manual' ? 'selected' : ''}>Manual</option>
            </select>
        </td>
        <td>
            <div class="item-product" style="display:${type === 'product' ? 'block' : 'none'}">
                <select name="items[${idx}][product_id]" class="form-select form-select-sm" onchange="calcHpp()">
                    <option value="">-- Pilih --</option>
                    ${productData.map(p => `<option value="${p.id}" ${data && data.product_id == p.id ? 'selected' : ''}>${p.text}</option>`).join('')}
                </select>
            </div>
            <div class="item-manual" style="display:${type === 'manual' ? 'block' : 'none'}">
                <div class="input-group input-group-sm">
                    <input type="text" name="items[${idx}][item_name]" class="form-control" placeholder="Nama bahan" value="${data && data.item_name ? data.item_name : ''}">
                    <input type="text" name="items[${idx}][item_unit]" class="form-control" placeholder="Satuan" style="max-width:70px" value="${data && data.item_unit ? data.item_unit : ''}">
                </div>
            </div>
        </td>
        <td><input type="number" name="items[${idx}][quantity]" class="form-control form-control-sm" step="0.01" min="0.01" required value="${data ? data.quantity : ''}" oninput="calcHpp()"></td>
        <td><input type="number" name="items[${idx}][unit_cost]" class="form-control form-control-sm" min="0" value="${data ? (data.unit_cost || 0) : 0}" placeholder="0" oninput="calcHpp()"></td>
        <td><button type="button" class="btn btn-sm btn-outline-danger" onclick="this.closest('tr').remove();calcHpp()"><i class="fas fa-times"></i></button></td>
    `;
    tbody.appendChild(tr);
    calcHpp();
}

function toggleItemType(select) {
    const tr = select.closest('tr');
    const isManual = select.value === 'manual';
    tr.querySelector('.item-product').style.display = isManual ? 'none' : 'block';
    tr.querySelector('.item-manual').style.display = isManual ? 'block' : 'none';
    const prodSelect = tr.querySelector('[name$="[product_id]"]');
    const nameInput = tr.querySelector('[name$="[item_name]"]');
    if (prodSelect) prodSelect.required = !isManual;
    if (nameInput) nameInput.required = isManual;
    calcHpp();
}

document.querySelectorAll('[name="quantity"], [name="labor_cost"], [name="overhead_cost"], [name="profit_value"], [name="profit_type"]').forEach(el => {
    el.addEventListener('input', calcHpp);
    el.addEventListener('change', calcHpp);
});

@if(old('items'))
    @foreach(old('items') as $item)
        addRow({
            item_type: '{{ $item['item_type'] ?? 'product' }}',
            product_id: {{ $item['product_id'] ?? 'null' }},
            item_name: '{{ $item['item_name'] ?? '' }}',
            item_unit: '{{ $item['item_unit'] ?? '' }}',
            quantity: {{ $item['quantity'] }},
            unit_cost: {{ $item['unit_cost'] ?? 0 }}
        });
    @endforeach
@endif
</script>
@endpush
