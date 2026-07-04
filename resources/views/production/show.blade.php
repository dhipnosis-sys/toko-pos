@extends('layouts.admin')

@section('title', 'Production Order ' . $production->order_number)

@section('content')
<div class="container-fluid">
    <div class="d-flex justify-content-between align-items-center mb-4">
        <h4 class="mb-0 fw-bold"><i class="fas fa-cogs me-2"></i>Production Order <code>{{ $production->order_number }}</code></h4>
        <div>
            @if($production->status === 'completed' && !$production->apply_cost_price && $production->product)
                <form action="{{ route('production.apply-cost-price', $production) }}" method="POST" class="d-inline">
                    @csrf
                    <button class="btn btn-success"><i class="fas fa-check me-1"></i>Apply HPP ke Produk</button>
                </form>
            @endif
            <a href="{{ route('production.index') }}" class="btn btn-outline-secondary"><i class="fas fa-arrow-left me-1"></i>Kembali</a>
        </div>
    </div>

    <div class="row">
        <div class="col-md-5">
            <div class="card border-0 shadow-sm mb-3">
                <div class="card-body">
                    <h6 class="fw-semibold mb-3">Informasi Order</h6>
                    <table class="table table-sm">
                        <tr><td>Order #</td><td><code>{{ $production->order_number }}</code></td></tr>
                        <tr>
                            <td>Produk Jadi</td>
                            <td class="fw-medium">
                                @if($production->product)
                                    {{ $production->product->name }}
                                @else
                                    {{ $production->finished_good_name ?? '—' }}
                                    <span class="badge bg-secondary bg-opacity-10 text-secondary ms-1">Manual</span>
                                @endif
                            </td>
                        </tr>
                        <tr><td>Jumlah</td><td class="fw-medium">{{ number_format($production->quantity) }}</td></tr>
                        <tr><td>BOM</td><td>{{ $production->billOfMaterial->name ?? '-' }}</td></tr>
                        <tr><td>Status</td>
                            <td><span class="badge bg-{{ $production->status === 'completed' ? 'success' : ($production->status === 'cancelled' ? 'secondary' : 'warning') }}">{{ ucfirst($production->status) }}</span></td>
                        </tr>
                        <tr><td>Dibuat Oleh</td><td>{{ $production->user->name }}</td></tr>
                        @if($production->started_at)
                            <tr><td>Mulai</td><td>{{ $production->started_at->format('d/m/Y H:i') }}</td></tr>
                        @endif
                        @if($production->completed_at)
                            <tr><td>Selesai</td><td>{{ $production->completed_at->format('d/m/Y H:i') }}</td></tr>
                        @endif
                        @if($production->notes)
                            <tr><td>Catatan</td><td>{{ $production->notes }}</td></tr>
                        @endif
                    </table>
                </div>
            </div>

            @if($production->status === 'completed')
            <div class="card border-0 shadow-sm mb-3">
                <div class="card-body">
                    <h6 class="fw-semibold mb-3">Ringkasan Biaya</h6>
                    <table class="table table-sm">
                        <tr><td>Bahan Baku</td><td class="text-end fw-medium">Rp {{ number_format($production->total_raw_material_cost, 0, ',', '.') }}</td></tr>
                        <tr><td>Tenaga Kerja</td><td class="text-end fw-medium">Rp {{ number_format($production->total_labor_cost, 0, ',', '.') }}</td></tr>
                        <tr><td>Overhead</td><td class="text-end fw-medium">Rp {{ number_format($production->total_overhead_cost, 0, ',', '.') }}</td></tr>
                        <tr class="table-active">
                            <td><strong>Total Biaya Manufaktur</strong></td>
                            <td class="text-end"><strong>Rp {{ number_format($production->total_cost, 0, ',', '.') }}</strong></td>
                        </tr>
                        <tr>
                            <td><strong>HPP per Unit</strong></td>
                            <td class="text-end"><strong class="text-primary fs-5">Rp {{ number_format($production->cost_per_unit, 0, ',', '.') }}</strong></td>
                        </tr>
                    </table>
                </div>
            </div>
            @endif
        </div>

        <div class="col-md-7">
            <div class="card border-0 shadow-sm mb-3">
                <div class="card-header bg-white">
                    <div class="d-flex justify-content-between align-items-center">
                        <h6 class="mb-0 fw-semibold">Bahan Baku</h6>
                        @if($production->status === 'planned')
                            <form action="{{ route('production.process', $production) }}" method="POST" class="d-inline" onsubmit="return confirm('Proses produksi? Stok bahan baku akan berkurang dan stok barang jadi bertambah.')">
                                @csrf
                                <button class="btn btn-success btn-sm"><i class="fas fa-play me-1"></i>Proses Produksi</button>
                            </form>
                        @endif
                    </div>
                </div>
                <div class="card-body p-0">
                    <table class="table table-sm mb-0">
                        <thead class="table-light">
                            <tr>
                                <th>Bahan Baku</th>
                                <th class="text-end">Stok Tersedia</th>
                                <th class="text-end">Jumlah Pakai</th>
                                <th class="text-end">Harga Satuan</th>
                                <th class="text-end">Subtotal</th>
                            </tr>
                        </thead>
                        <tbody>
                            @foreach($production->items as $item)
                                <tr>
                                    <td>
                                        @if($item->item_type === 'product' && $item->product)
                                            {{ $item->product->name }}
                                        @else
                                            {{ $item->item_name ?? '—' }}
                                            <span class="badge bg-secondary bg-opacity-10 text-secondary ms-1">Manual</span>
                                        @endif
                                    </td>
                                    <td class="text-end">
                                        @if($item->product)
                                            {{ number_format($item->product->stock) }} {{ $item->product->unit }}
                                        @else
                                            —
                                        @endif
                                    </td>
                                    <td class="text-end">{{ number_format($item->quantity_used ?: $item->quantity_planned, 2) }}</td>
                                    <td class="text-end">Rp {{ number_format($item->unit_cost, 0, ',', '.') }}</td>
                                    <td class="text-end fw-medium">Rp {{ number_format($item->subtotal, 0, ',', '.') }}</td>
                                </tr>
                            @endforeach
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>
</div>
@endsection
