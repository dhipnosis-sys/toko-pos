@extends('layouts.admin')

@section('title', 'Production Orders')

@section('content')
<div class="container-fluid">
    <div class="d-flex justify-content-between align-items-center mb-4">
        <h4 class="mb-0 fw-bold"><i class="fas fa-cogs me-2"></i>Production Orders</h4>
        <a href="{{ route('production.create') }}" class="btn btn-primary"><i class="fas fa-plus me-1"></i>Buat Produksi</a>
    </div>

    <div class="card border-0 shadow-sm">
        <div class="card-body">
            @if($orders->isEmpty())
                <p class="text-muted text-center py-4">Belum ada production order.</p>
            @else
                <div class="table-responsive">
                    <table class="table table-hover align-middle">
                        <thead class="table-light">
                            <tr>
                                <th>Order #</th>
                                <th>Produk</th>
                                <th class="text-end">Qty</th>
                                <th class="text-end">Total Biaya</th>
                                <th class="text-end">HPP/Unit</th>
                                <th>Status</th>
                                <th>Tanggal</th>
                                <th class="text-end">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            @foreach($orders as $o)
                                <tr>
                                    <td><a href="{{ route('production.show', $o) }}"><code>{{ $o->order_number }}</code></a></td>
                                    <td>
                                        @if($o->product)
                                            {{ $o->product->name }}
                                        @else
                                            {{ $o->finished_good_name ?? '—' }}
                                            <span class="badge bg-secondary bg-opacity-10 text-secondary ms-1">Manual</span>
                                        @endif
                                    </td>
                                    <td class="text-end">{{ number_format($o->quantity) }}</td>
                                    <td class="text-end">Rp {{ number_format($o->total_cost, 0, ',', '.') }}</td>
                                    <td class="text-end fw-bold {{ $o->apply_cost_price ? 'text-success' : '' }}">
                                        Rp {{ number_format($o->cost_per_unit, 0, ',', '.') }}
                                        @if($o->apply_cost_price) <i class="fas fa-check-circle text-success" title="Cost price applied"></i> @endif
                                    </td>
                                    <td>
                                        <span class="badge bg-{{ $o->status === 'completed' ? 'success' : ($o->status === 'cancelled' ? 'secondary' : 'warning') }}">
                                            {{ ucfirst($o->status) }}
                                        </span>
                                    </td>
                                    <td>{{ $o->created_at->format('d/m/Y H:i') }}</td>
                                    <td class="text-end">
                                        <a href="{{ route('production.show', $o) }}" class="btn btn-sm btn-outline-info"><i class="fas fa-eye"></i></a>
                                        @if($o->status === 'planned')
                                            <form action="{{ route('production.cancel', $o) }}" method="POST" class="d-inline" onsubmit="return confirm('Batalkan order?')">
                                                @csrf
                                                <button class="btn btn-sm btn-outline-secondary"><i class="fas fa-times"></i></button>
                                            </form>
                                            <form action="{{ route('production.destroy', $o) }}" method="POST" class="d-inline" onsubmit="return confirm('Hapus order?')">
                                                @csrf @method('DELETE')
                                                <button class="btn btn-sm btn-outline-danger"><i class="fas fa-trash"></i></button>
                                            </form>
                                        @endif
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
