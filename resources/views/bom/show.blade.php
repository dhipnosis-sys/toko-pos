@extends('layouts.admin')

@section('title', $bom->name)

@section('content')
<div class="container-fluid">
    <div class="d-flex justify-content-between align-items-center mb-4">
        <h4 class="mb-0 fw-bold"><i class="fas fa-clipboard-list me-2"></i>{{ $bom->name }}</h4>
        <div>
            <a href="{{ route('bom.edit', $bom) }}" class="btn btn-warning"><i class="fas fa-edit me-1"></i>Edit</a>
            <a href="{{ route('bom.index') }}" class="btn btn-outline-secondary"><i class="fas fa-arrow-left me-1"></i>Kembali</a>
        </div>
    </div>

    <div class="row">
        <div class="col-md-5">
            <div class="card border-0 shadow-sm mb-3">
                <div class="card-body">
                    <h6 class="fw-semibold mb-3">Informasi BOM</h6>
                    <table class="table table-sm">
                        <tr>
                            <td>Produk Jadi</td>
                            <td class="fw-medium">
                                @if($bom->finished_good_type === 'product' && $bom->product)
                                    {{ $bom->product->name }}
                                    <span class="badge bg-info bg-opacity-10 text-info ms-1">Produk</span>
                                @else
                                    {{ $bom->finished_good_name ?? '—' }}
                                    <span class="badge bg-secondary bg-opacity-10 text-secondary ms-1">Manual</span>
                                @endif
                            </td>
                        </tr>
                        <tr><td>Qty Produk</td><td class="fw-medium">{{ number_format($bom->quantity, 0) }} {{ $bom->unit }}</td></tr>
                        <tr><td>Tenaga Kerja</td><td class="fw-medium">Rp {{ number_format($bom->labor_cost, 0, ',', '.') }}</td></tr>
                        <tr><td>Overhead</td><td class="fw-medium">Rp {{ number_format($bom->overhead_cost, 0, ',', '.') }}</td></tr>
                        <tr>
                            <td>Laba</td>
                            <td class="fw-medium">
                                @if($bom->profit_type === 'percentage')
                                    {{ $bom->profit_value }}%
                                @else
                                    Rp {{ number_format($bom->profit_value, 0, ',', '.') }}
                                @endif
                            </td>
                        </tr>
                        @if($bom->notes)<tr><td>Catatan</td><td>{{ $bom->notes }}</td></tr>@endif
                    </table>
                </div>
            </div>

            <div class="card border-0 shadow-sm mb-3">
                <div class="card-body">
                    <h6 class="fw-semibold mb-3">Komposisi Bahan Baku</h6>
                    <table class="table table-sm">
                        <thead class="table-light">
                            <tr><th>Bahan</th><th class="text-end">Qty untuk {{ number_format($bom->quantity, 0) }} {{ $bom->unit }}</th><th class="text-end">Harga</th></tr>
                        </thead>
                        <tbody>
                            @foreach($bom->items as $item)
                                <tr>
                                    <td>
                                        @if($item->item_type === 'product' && $item->product)
                                            {{ $item->product->name }}
                                            <span class="badge bg-info bg-opacity-10 text-info ms-1">Stok: {{ number_format($item->product->stock) }}</span>
                                        @else
                                            {{ $item->item_name ?? '—' }}
                                            <span class="badge bg-secondary bg-opacity-10 text-secondary ms-1">Manual</span>
                                        @endif
                                    </td>
                                    <td class="text-end">{{ number_format($item->quantity, 2) }} {{ $item->item_type === 'product' && $item->product ? $item->product->unit : ($item->item_unit ?? '—') }}</td>
                                    <td class="text-end">Rp {{ number_format($item->item_type === 'product' && $item->product ? ($item->product->cost_price ?? 0) : ($item->unit_cost ?? 0), 0, ',', '.') }}</td>
                                </tr>
                            @endforeach
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <div class="col-md-7">
            <div class="card border-0 shadow-sm mb-3">
                <div class="card-header bg-white">
                    <h6 class="mb-0 fw-semibold"><i class="fas fa-calculator me-2"></i>Simulasi HPP</h6>
                </div>
                <div class="card-body">
                    <div class="row g-2 mb-3">
                        <div class="col-3">
                            <label class="form-label small">Jumlah Produksi</label>
                            <input type="number" id="simQty" class="form-control" value="1" min="1" oninput="simulateHpp()">
                        </div>
                        <div class="col-3">
                            <label class="form-label small">Tenaga Kerja (Rp)</label>
                            <input type="number" id="simLabor" class="form-control" value="{{ $bom->labor_cost }}" min="0" oninput="simulateHpp()">
                        </div>
                        <div class="col-3">
                            <label class="form-label small">Overhead (Rp)</label>
                            <input type="number" id="simOverhead" class="form-control" value="{{ $bom->overhead_cost }}" min="0" oninput="simulateHpp()">
                        </div>
                        <div class="col-3">
                            <label class="form-label small">Laba</label>
                            <div class="input-group input-group-sm">
                                <input type="number" id="simProfitVal" class="form-control" value="{{ $bom->profit_value }}" min="0" oninput="simulateHpp()">
                                <select id="simProfitType" class="form-select" style="max-width:60px" onchange="simulateHpp()">
                                    <option value="percentage" {{ $bom->profit_type === 'percentage' ? 'selected' : '' }}>%</option>
                                    <option value="amount" {{ $bom->profit_type === 'amount' ? 'selected' : '' }}>Rp</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div id="hppResult">
                        <p class="text-muted text-center small">Masukkan jumlah produksi untuk melihat HPP</p>
                    </div>
                </div>
            </div>

            @if($bom->productionOrders->count() > 0)
            <div class="card border-0 shadow-sm">
                <div class="card-header bg-white">
                    <h6 class="mb-0 fw-semibold"><i class="fas fa-history me-2"></i>Riwayat Produksi</h6>
                </div>
                <div class="card-body p-0">
                    <table class="table table-sm mb-0">
                        <thead class="table-light">
                            <tr>
                                <th>Order</th>
                                <th>Produk</th>
                                <th class="text-end">Qty</th>
                                <th class="text-end">Total Biaya</th>
                                <th class="text-end">HPP/Unit</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            @foreach($bom->productionOrders as $po)
                                <tr>
                                    <td><a href="{{ route('production.show', $po) }}">{{ $po->order_number }}</a></td>
                                    <td>
                                        @if($po->product)
                                            {{ $po->product->name }}
                                        @else
                                            {{ $po->finished_good_name ?? '—' }}
                                        @endif
                                    </td>
                                    <td class="text-end">{{ $po->quantity }}</td>
                                    <td class="text-end">Rp {{ number_format($po->total_cost, 0, ',', '.') }}</td>
                                    <td class="text-end">Rp {{ number_format($po->cost_per_unit, 0, ',', '.') }}</td>
                                    <td><span class="badge bg-{{ $po->status === 'completed' ? 'success' : ($po->status === 'cancelled' ? 'secondary' : 'warning') }}">{{ $po->status }}</span></td>
                                </tr>
                            @endforeach
                        </tbody>
                    </table>
                </div>
            </div>
            @endif
        </div>
    </div>
</div>
@endsection

@push('scripts')
<script>
function simulateHpp() {
    const bomId = {{ $bom->id }};
    const qty = document.getElementById('simQty').value || 1;
    const labor = document.getElementById('simLabor').value || 0;
    const overhead = document.getElementById('simOverhead').value || 0;
    const profitVal = document.getElementById('simProfitVal').value || 0;
    const profitType = document.getElementById('simProfitType').value;

    fetch('{{ route("bom.simulate-hpp") }}', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': '{{ csrf_token() }}' },
        body: JSON.stringify({ bom_id: bomId, quantity: qty, labor_cost: labor, overhead_cost: overhead, profit_type: profitType, profit_value: profitVal })
    })
    .then(r => r.json())
    .then(d => {
        if (!d.success) return;
        let html = `
            <div class="bg-light rounded p-3 mb-3">
                <div class="d-flex justify-content-between mb-1">
                    <span>Bahan Baku</span>
                    <span class="fw-medium">Rp ${d.raw_material_cost.toLocaleString('id-ID')}</span>
                </div>
                <div class="d-flex justify-content-between mb-1">
                    <span>Tenaga Kerja Langsung</span>
                    <span class="fw-medium">Rp ${d.labor_cost.toLocaleString('id-ID')}</span>
                </div>
                <div class="d-flex justify-content-between mb-1">
                    <span>Overhead Pabrik</span>
                    <span class="fw-medium">Rp ${d.overhead_cost.toLocaleString('id-ID')}</span>
                </div>
                <hr class="my-1">
                <div class="d-flex justify-content-between">
                    <strong>Total Biaya Manufaktur</strong>
                    <strong>Rp ${d.total_cost.toLocaleString('id-ID')}</strong>
                </div>
                <div class="d-flex justify-content-between mt-1">
                    <span class="text-muted small">Untuk ${d.production_qty} unit</span>
                    <strong class="text-primary fs-5">Rp ${d.cost_per_unit.toLocaleString('id-ID')} / unit</strong>
                </div>
                ${d.profit_amount > 0 ? `
                <hr class="my-1">
                <div class="d-flex justify-content-between">
                    <span>Laba (${d.profit_type === 'percentage' ? d.profit_value + '%' : 'Rp ' + d.profit_value.toLocaleString('id-ID')})</span>
                    <span class="fw-medium text-success">+ Rp ${d.profit_amount.toLocaleString('id-ID')}</span>
                </div>
                <div class="d-flex justify-content-between">
                    <strong>Harga Jual yang Disarankan</strong>
                    <strong class="text-success fs-5">Rp ${d.suggested_price.toLocaleString('id-ID')}</strong>
                </div>
                <div class="d-flex justify-content-between mt-1">
                    <span class="text-muted small">Per unit</span>
                    <strong class="text-success">Rp ${d.suggested_price_per_unit.toLocaleString('id-ID')} / unit</strong>
                </div>
                ` : ''}
            </div>
            <div class="table-responsive">
                <table class="table table-sm table-bordered mb-0">
                    <thead class="table-light"><tr><th>Bahan</th><th class="text-end">Qty</th><th class="text-end">Harga</th><th class="text-end">Subtotal</th></tr></thead>
                    <tbody>
                        ${d.details.map(det => `
                            <tr>
                                <td>${det.product_name}</td>
                                <td class="text-end">${det.qty_needed.toFixed(2)} ${det.unit}</td>
                                <td class="text-end">Rp ${det.unit_cost.toLocaleString('id-ID')}</td>
                                <td class="text-end">Rp ${det.subtotal.toLocaleString('id-ID')}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            <div class="mt-3 d-flex gap-2">
                ${d.finished_good_type === 'product' ? `
                    <button class="btn btn-success" onclick="saveCostPrice(${d.cost_per_unit}, ${d.product_id})">
                        <i class="fas fa-check me-1"></i>Simpan HPP Rp ${d.cost_per_unit.toLocaleString('id-ID')} ke Produk
                    </button>
                ` : ''}
                <a href="{{ route('production.create') }}?bom_id=${bomId}&product_id=${d.product_id || ''}&quantity=${d.production_qty}" class="btn btn-primary">
                    <i class="fas fa-cog me-1"></i>Produksi Sekarang
                </a>
            </div>
        `;
        document.getElementById('hppResult').innerHTML = html;
    });
}

function saveCostPrice(costPrice, productId) {
    fetch('{{ route("bom.save-cost-price") }}', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': '{{ csrf_token() }}' },
        body: JSON.stringify({ product_id: productId, cost_price: costPrice })
    })
    .then(r => r.json())
    .then(d => {
        if (d.success) alert(d.message);
    });
}

document.addEventListener('DOMContentLoaded', simulateHpp);
</script>
@endpush
