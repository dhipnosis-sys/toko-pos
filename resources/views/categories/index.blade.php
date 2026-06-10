@extends('layouts.admin')

@section('title', __('app.categories'))

@section('content')
<div class="container-fluid">
    <div class="d-flex justify-content-between align-items-center mb-4">
        <h4 class="mb-0 fw-bold">@lang('app.categories')</h4>
        <a href="{{ route('categories.create') }}" class="btn btn-primary"><i class="fas fa-plus me-1"></i>@lang('app.add')</a>
    </div>

    <div class="card border-0 shadow-sm">
        <div class="card-body">
            <div class="table-responsive">
                <table class="table table-hover align-middle">
                    <thead class="table-light">
                        <tr>
                            <th>@lang('app.name')</th>
                            <th>@lang('app.description')</th>
                            <th class="text-center">@lang('app.products')</th>
                            <th class="text-end">@lang('app.actions')</th>
                        </tr>
                    </thead>
                    <tbody>
                        @forelse($categories as $category)
                        <tr>
                            <td>{{ $category->name }}</td>
                            <td>{{ str($category->description)->limit(60) ?? '-' }}</td>
                            <td class="text-center">{{ $category->products_count }}</td>
                            <td class="text-end">
                                <a href="{{ route('categories.edit', $category) }}" class="btn btn-sm btn-outline-primary"><i class="fas fa-edit"></i></a>
                                <form action="{{ route('categories.destroy', $category) }}" method="POST" class="d-inline" onsubmit="return confirm('@lang('app.confirm_delete', ['data' => __('app.category')])')">
                                    @csrf @method('DELETE')
                                    <button type="submit" class="btn btn-sm btn-outline-danger"><i class="fas fa-trash"></i></button>
                                </form>
                            </td>
                        </tr>
                        @empty
                        <tr>
                            <td colspan="4" class="text-center text-muted py-4">@lang('app.no_data')</td>
                        </tr>
                        @endforelse
                    </tbody>
                </table>
            </div>
            {{ $categories->links() }}
        </div>
    </div>
</div>
@endsection
