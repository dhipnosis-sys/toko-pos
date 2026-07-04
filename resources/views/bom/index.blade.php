@extends('layouts.admin')

@section('title', 'Bill of Materials')

@section('content')
<div class="container-fluid">
    <div class="d-flex justify-content-between align-items-center mb-4">
        <h4 class="mb-0 fw-bold"><i class="fas fa-clipboard-list me-2"></i>Bill of Materials</h4>
        <a href="{{ route('bom.create') }}" class="btn btn-primary"><i class="fas fa-plus me-1"></i>Buat BOM</a>
    </div>

    <div class="card border-0 shadow-sm">
        <div class="card-body">
            @if($boms->isEmpty())
                <p class="text-muted text-center py-4">Belum ada BOM. <a href="{{ route('bom.create') }}">Buat baru</a></p>
            @else
                <div class="table-responsive">
                    <table class="table table-hover align-middle">
                        <thead class="table-light">
                            <tr>
                                <th>Nama BOM</th>
                                <th>Produk Jadi</th>
                                <th class="text-center">Qty Produk</th>
                                <th class="text-end">Bahan Baku</th>
                                <th class="text-end">Total Biaya</th>
                                <th class="text-end">HPP/Unit</th>
                                <th class="text-end">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            @foreach($boms as $bom)
                                @php
                                    $rawTotal = $bom->items->sum(function($i) use ($bom) {
                                        $unitCost = $i->item_type === 'product' && $i->product ? ($i->product->cost_price ?? 0) : ($i->unit_cost ?? 0);
                                        return ($i->quantity / $bom->quantity) * $unitCost;
                                    });
                                    $totalCost = $rawTotal + $bom->labor_cost + $bom->overhead_cost;
                                    $hpp = $totalCost / max($bom->quantity, 1);
                                @endphp
                                <tr>
                                    <td><a href="{{ route('bom.show', $bom) }}" class="text-decoration-none fw-medium">{{ $bom->name }}</a></td>
                                    <td>
                                        @if($bom->finished_good_type === 'product' && $bom->product)
                                            {{ $bom->product->name }}
                                        @else
                                            {{ $bom->finished_good_name ?? '—' }}
                                            <span class="badge bg-secondary bg-opacity-10 text-secondary ms-1">Manual</span>
                                        @endif
                                    </td>
                                    <td class="text-center">{{ number_format($bom->quantity, 0) }} {{ $bom->unit }}</td>
                                    <td class="text-end">{{ $bom->items->count() }} item</td>
                                    <td class="text-end fw-medium">Rp {{ number_format((int) $totalCost, 0, ',', '.') }}</td>
                                    <td class="text-end text-primary fw-bold">Rp {{ number_format((int) $hpp, 0, ',', '.') }}</td>
                                    <td class="text-end">
                                        <a href="{{ route('bom.show', $bom) }}" class="btn btn-sm btn-outline-info"><i class="fas fa-calculator"></i></a>
                                        <a href="{{ route('bom.edit', $bom) }}" class="btn btn-sm btn-outline-warning"><i class="fas fa-edit"></i></a>
                                        <form action="{{ route('bom.destroy', $bom) }}" method="POST" class="d-inline" onsubmit="return confirm('Hapus BOM ini?')">
                                            @csrf @method('DELETE')
                                            <button class="btn btn-sm btn-outline-danger"><i class="fas fa-trash"></i></button>
                                        </form>
                                    </td>
                                </tr>
                            @endforeach
                        </tbody>
                    </table>
                </div>
            @endif
        </div>
    </div>
</div>
@endsection
