@extends('layouts.admin')

@section('title', __('app.role_management'))

@section('content')
<div class="container-fluid">
    <div class="d-flex justify-content-between align-items-center mb-4">
        <h4 class="mb-0 fw-bold">@lang('app.role_management')</h4>
        <a href="{{ route('roles.create') }}" class="btn btn-primary"><i class="fas fa-plus me-1"></i>@lang('app.add_role')</a>
    </div>

    <div class="card border-0 shadow-sm">
        <div class="card-body">
            <div class="table-responsive">
                <table class="table table-hover align-middle">
                    <thead class="table-light">
                        <tr>
                            <th>@lang('app.role_name')</th>
                            <th>@lang('app.display_name')</th>
                            <th>@lang('app.description')</th>
                            <th class="text-center">@lang('app.users_count')</th>
                            <th class="text-center">@lang('app.status')</th>
                            <th class="text-end">@lang('app.actions')</th>
                        </tr>
                    </thead>
                    <tbody>
                        @forelse($roles as $role)
                        <tr>
                            <td><code>{{ $role->name }}</code></td>
                            <td>{{ $role->display_name }}</td>
                            <td>{{ $role->description ?? '-' }}</td>
                            <td class="text-center">{{ $role->users_count }}</td>
                            <td class="text-center">
                                @if($role->is_system)
                                    <span class="badge bg-info">@lang('app.system_role')</span>
                                @else
                                    <span class="badge bg-success">@lang('app.active')</span>
                                @endif
                            </td>
                            <td class="text-end">
                                <a href="{{ route('roles.edit', $role) }}" class="btn btn-sm btn-outline-primary"><i class="fas fa-edit"></i></a>
                                @if(!$role->is_system)
                                <form action="{{ route('roles.destroy', $role) }}" method="POST" class="d-inline" onsubmit="return confirm('@lang('app.confirm_delete', ['data' => $role->display_name])')">
                                    @csrf @method('DELETE')
                                    <button type="submit" class="btn btn-sm btn-outline-danger"><i class="fas fa-trash"></i></button>
                                </form>
                                @endif
                            </td>
                        </tr>
                        @empty
                        <tr>
                            <td colspan="6" class="text-center text-muted py-4">@lang('app.no_data')</td>
                        </tr>
                        @endforelse
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</div>
@endsection
