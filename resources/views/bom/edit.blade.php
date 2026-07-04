@extends('layouts.admin')

@section('title', 'Edit BOM')

@section('content')
<div class="container-fluid">
    <div class="d-flex justify-content-between align-items-center mb-4">
        <h4 class="mb-0 fw-bold"><i class="fas fa-edit me-2"></i>Edit BOM</h4>
        <a href="{{ route('bom.index') }}" class="btn btn-outline-secondary"><i class="fas fa-arrow-left me-1"></i>Kembali</a>
    </div>

    <form action="{{ route('bom.update', $bom) }}" method="POST" id="bomForm">
        @csrf @method('PUT')
        <div class="row">
            <div class="col-md-5">
                <div class="card border-0 shadow-sm mb-3">
                    <div class="card-body">
                        <h6 class="fw-semibold mb-3">Informasi BOM</h6>

                        <div class="mb-3">
                            <label class="form-label">Tipe Produk Jadi <span class="text-danger">*</span></label>
                            <select name="finished_good_type" class="form-select" onchange="toggleFgType(this)">
                                <option value="product" {{ $bom->finished_good_type === 'product' ? 'selected' : '' }}>Dari Produk (tercatat di inventory)</option>
                                <option value="manual" {{ $bom->finished_good_type === 'manual' ? 'selected' : '' }}>Manual (referensi saja)</option>
                            </select>
                        </div>

                        <div id="fgProduct" style="display:{{ $bom->finished_good_type === 'manual' ? 'none' : 'block' }}">
                            <div class="mb-3">
                                <label class="form-label">Produk Jadi <span class="text-danger">*</span></label>
                                <select name="product_id" class="form-select">
                                    <option value="">-- Pilih Produk --</option>
                                    @foreach($products as $p)
                                        <option value="{{ $p->id }}" {{ $bom->product_id == $p->id ? 'selected' : '' }}>{{ $p->name }} ({{ $p->sku }})</option>
                                    @endforeach
                                </select>
                            </div>
                        </div>

                        <div id="fgManual" style="display:{{ $bom->finished_good_type === 'manual' ? 'block' : 'none' }}">
                            <div class="row g-2 mb-3">
                                <div class="col-8">
                                    <label class="form-label">Nama Barang <span class="text-danger">*</span></label>
                                    <input type="text" name="finished_good_name" class="form-control" value="{{ old('finished_good_name', $bom->finished_good_name) }}" placeholder="Contoh: Nasi Goreng Spesial">
                                </div>
                                <div class="col-4">
                                    <label class="form-label">Satuan</label>
                                    <input type="text" name="finished_good_unit" class="form-control" value="{{ old('finished_good_unit', $bom->finished_good_unit) }}" placeholder="porsi">
                                </div>
                            </div>
                        </div>

                        <div class="mb-3">
                            <label class="form-label">Nama BOM <span class="text-danger">*</span></label>
                            <input type="text" name="name" class="form-control" value="{{ old('name', $bom->name) }}" required>
                        </div>
                        <div class="row g-2 mb-3">
                            <div class="col-6">
                                <label class="form-label">Qty Produk</label>
                                <input type="number" name="quantity" class="form-control" value="{{ old('quantity', $bom->quantity) }}" min="0.01" step="0.01" required>
                            </div>
                            <div class="col-6">
                                <label class="form-label">Satuan</label>
                                <input type="text" name="unit" class="form-control" value="{{ old('unit', $bom->unit) }}" placeholder="porsi, pack, kg">
                            </div>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Catatan</label>
                            <textarea name="notes" class="form-control" rows="2">{{ old('notes', $bom->notes) }}</textarea>
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
                                <input type="number" name="labor_cost" class="form-control" value="{{ old('labor_cost', $bom->labor_cost) }}" min="0">
                            </div>
                            <div class="col-4">
                                <label class="form-label">Overhead</label>
                                <input type="number" name="overhead_cost" class="form-control" value="{{ old('overhead_cost', $bom->overhead_cost) }}" min="0">
                            </div>
                            <div class="col-4">
                                <label class="form-label">Laba (% / Rp)</label>
                                <div class="input-group">
                                    <input type="number" name="profit_value" class="form-control" value="{{ old('profit_value', $bom->profit_value) }}" min="0">
                                    <select name="profit_type" class="form-select" style="max-width:80px">
                                        <option value="percentage" {{ $bom->profit_type === 'percentage' ? 'selected' : '' }}>%</option>
                                        <option value="amount" {{ $bom->profit_type === 'amount' ? 'selected' : '' }}>Rp</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <button type="submit" class="btn btn-primary btn-lg w-100"><i class="fas fa-save me-1"></i>Simpan Perubahan</button>
            </div>
        </div>
    </form>
</div>
@endsection

@push('scripts')
<script>
const products = @json($products->map(fn($p) => ['id' => $p->id, 'text' => $p->name . ' (' . $p->sku . ')']));
const items = @json($bom->items->map(fn($i) => [
    'id' => $i->id,
    'item_type' => $i->item_type,
    'product_id' => $i->product_id,
    'item_name' => $i->item_name,
    'item_unit' => $i->item_unit,
    'quantity' => $i->quantity,
    'unit_cost' => $i->unit_cost,
]));

function toggleFgType(select) {
    const isManual = select.value === 'manual';
    document.getElementById('fgProduct').style.display = isManual ? 'none' : 'block';
    document.getElementById('fgManual').style.display = isManual ? 'block' : 'none';
    const prodSelect = document.querySelector('[name="product_id"]');
    const nameInput = document.querySelector('[name="finished_good_name"]');
    if (prodSelect) prodSelect.required = !isManual;
    if (nameInput) nameInput.required = isManual;
}
toggleFgType(document.querySelector('[name="finished_good_type"]'));

let rowIndex = 0;
function addRow(data) {
    const tbody = document.getElementById('itemsBody');
    const tr = document.createElement('tr');
    const idx = rowIndex++;
    const type = data ? (data.item_type || 'product') : 'product';
    tr.innerHTML = `
        <td>
            <input type="hidden" name="items[${idx}][id]" value="${data && data.id ? data.id : ''}">
            <select name="items[${idx}][item_type]" class="form-select form-select-sm" onchange="toggleItemType(this)">
                <option value="product" ${type === 'product' ? 'selected' : ''}>Produk</option>
                <option value="manual" ${type === 'manual' ? 'selected' : ''}>Manual</option>
            </select>
        </td>
        <td>
            <div class="item-product" style="display:${type === 'product' ? 'block' : 'none'}">
                <select name="items[${idx}][product_id]" class="form-select form-select-sm">
                    <option value="">-- Pilih --</option>
                    ${products.map(p => `<option value="${p.id}" ${data && data.product_id == p.id ? 'selected' : ''}>${p.text}</option>`).join('')}
                </select>
            </div>
            <div class="item-manual" style="display:${type === 'manual' ? 'block' : 'none'}">
                <div class="input-group input-group-sm">
                    <input type="text" name="items[${idx}][item_name]" class="form-control" placeholder="Nama bahan" value="${data && data.item_name ? data.item_name : ''}">
                    <input type="text" name="items[${idx}][item_unit]" class="form-control" placeholder="Satuan" style="max-width:70px" value="${data && data.item_unit ? data.item_unit : ''}">
                </div>
            </div>
        </td>
        <td><input type="number" name="items[${idx}][quantity]" class="form-control form-control-sm" step="0.01" min="0.01" required value="${data ? parseFloat(data.quantity) : ''}"></td>
        <td><input type="number" name="items[${idx}][unit_cost]" class="form-control form-control-sm" min="0" value="${data ? (data.unit_cost || 0) : 0}" placeholder="0"></td>
        <td><button type="button" class="btn btn-sm btn-outline-danger" onclick="this.closest('tr').remove()"><i class="fas fa-times"></i></button></td>
    `;
    tbody.appendChild(tr);
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
}

items.forEach(i => addRow(i));
if (items.length === 0) addRow();
</script>
@endpush
