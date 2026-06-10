@extends('layouts.admin')

@section('title', __('app.products'))

@section('content')
<div class="container-fluid">
    <div class="d-flex justify-content-between align-items-center mb-4">
        <h4 class="mb-0 fw-bold">@lang('app.products')</h4>
        <a href="{{ route('products.create') }}" class="btn btn-primary"><i class="fas fa-plus me-1"></i>@lang('app.add_product')</a>
    </div>

    <div class="card border-0 shadow-sm">
        <div class="card-body">
            <form method="GET" class="row g-2 mb-3" id="filterForm">
                <div class="col-md-5">
                    <input type="text" name="search" class="form-control" placeholder="@lang('app.search_product')" value="{{ request('search') }}" id="searchInput">
                </div>
                <div class="col-md-3">
                    <select name="category_id" class="form-select" id="categorySelect">
                        <option value="">@lang('app.all_categories_option')</option>
                        @foreach($categories as $cat)
                            <option value="{{ $cat->id }}" {{ request('category_id') == $cat->id ? 'selected' : '' }}>{{ $cat->name }}</option>
                        @endforeach
                    </select>
                </div>
                <div class="col-md-4 d-flex gap-2">
                    <a href="{{ route('products.index') }}" class="btn btn-outline-secondary"><i class="fas fa-undo me-1"></i>@lang('app.reset')</a>
                </div>
            </form>

            @push('scripts')
            <script>
                let searchTimeout;
                document.getElementById('searchInput').addEventListener('input', function() {
                    clearTimeout(searchTimeout);
                    searchTimeout = setTimeout(() => {
                        document.getElementById('filterForm').submit();
                    }, 400);
                });
                document.getElementById('categorySelect').addEventListener('change', function() {
                    document.getElementById('filterForm').submit();
                });
            </script>
            @endpush

            <div class="table-responsive">
                <table class="table table-hover align-middle">
                    <thead class="table-light">
                        <tr>
                            <th>@lang('app.name')</th>
                            <th>@lang('app.sku')</th>
                            <th>@lang('app.category')</th>
                            <th>@lang('app.unit')</th>
                            <th class="text-end">@lang('app.stock_qty')</th>
                            <th class="text-end">@lang('app.min_stock')</th>
                            <th class="text-end">@lang('app.retail_price')</th>
                            <th class="text-center">@lang('app.status')</th>
                            <th class="text-end">@lang('app.actions')</th>
                        </tr>
                    </thead>
                    <tbody>
                        @forelse($products as $product)
                        <tr>
                            <td>{{ $product->name }}</td>
                            <td><code>{{ $product->sku }}</code></td>
                            <td>{{ $product->category->name ?? '-' }}</td>
                            <td>{{ $product->unit }}</td>
                            <td class="text-end">
                                <span class="{{ $product->stock <= $product->min_stock ? 'text-danger fw-bold' : '' }}">
                                    {{ $product->stock }}
                                </span>
                            </td>
                            <td class="text-end">{{ $product->min_stock }}</td>
                            <td class="text-end">Rp {{ number_format($product->retail_price, 0, ',', '.') }}</td>
                            <td class="text-center">
                                @if($product->is_active)
                                    <span class="badge bg-success">@lang('app.active')</span>
                                @else
                                    <span class="badge bg-secondary">@lang('app.inactive')</span>
                                @endif
                            </td>
                            <td class="text-end">
                                <a href="{{ route('products.edit', $product) }}" class="btn btn-sm btn-outline-primary"><i class="fas fa-edit"></i></a>
                                <form action="{{ route('products.destroy', $product) }}" method="POST" class="d-inline" onsubmit="return confirm('@lang('app.confirm_delete', ['data' => __('app.product_name')])')">
                                    @csrf @method('DELETE')
                                    <button type="submit" class="btn btn-sm btn-outline-danger"><i class="fas fa-trash"></i></button>
                                </form>
                            </td>
                        </tr>
                        @empty
                        <tr>
                            <td colspan="9" class="text-center text-muted py-4">@lang('app.no_data')</td>
                        </tr>
                        @endforelse
                    </tbody>
                </table>
            </div>

            {{ $products->withQueryString()->links() }}
        </div>
    </div>
</div>
@endsection
