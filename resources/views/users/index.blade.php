@extends('layouts.admin')

@section('title', __('app.user_management'))

@section('content')
<div class="container-fluid">
    <div class="d-flex justify-content-between align-items-center mb-4">
        <h4 class="mb-0 fw-bold">@lang('app.user_management')</h4>
        <a href="{{ route('users.create') }}" class="btn btn-primary"><i class="fas fa-plus me-1"></i>@lang('app.add_user')</a>
    </div>

    <div class="card border-0 shadow-sm">
        <div class="card-body">
            <div class="table-responsive">
                <table class="table table-hover align-middle">
                    <thead class="table-light">
                        <tr>
                            <th>@lang('app.name')</th>
                            <th>@lang('app.email')</th>
                            <th>@lang('app.phone')</th>
                            <th class="text-center">@lang('app.role')</th>
                            <th class="text-center">@lang('app.status')</th>
                            <th class="text-center">@lang('app.date')</th>
                            <th class="text-end">@lang('app.actions')</th>
                        </tr>
                    </thead>
                    <tbody>
                        @forelse($users as $user)
                        <tr>
                            <td>{{ $user->name }}</td>
                            <td>{{ $user->email }}</td>
                            <td>{{ $user->phone ?? '-' }}</td>
                            <td class="text-center">
                                @php
                                    $roleColors = ['owner' => 'danger', 'cashier' => 'primary', 'warehouse' => 'warning'];
                                    $color = $roleColors[$user->role] ?? 'secondary';
                                @endphp
                                <span class="badge bg-{{ $color }}">{{ $user->roleModel?->display_name ?? $user->role }}</span>
                            </td>
                            <td class="text-center">
                                @if($user->is_active)
                                    <span class="badge bg-success">@lang('app.active')</span>
                                @else
                                    <span class="badge bg-secondary">@lang('app.inactive')</span>
                                @endif
                            </td>
                            <td class="text-center">{{ $user->created_at->format('d M Y') }}</td>
                            <td class="text-end">
                                <a href="{{ route('users.edit', $user) }}" class="btn btn-sm btn-outline-primary"><i class="fas fa-edit"></i></a>
                                @if($user->id !== auth()->id())
                                <form action="{{ route('users.destroy', $user) }}" method="POST" class="d-inline" onsubmit="return confirm('@lang('app.confirm_delete', ['data' => __('app.user')])')">
                                    @csrf @method('DELETE')
                                    <button type="submit" class="btn btn-sm btn-outline-danger"><i class="fas fa-trash"></i></button>
                                </form>
                                @endif
                                <form action="{{ route('users.reset-password', $user) }}" method="POST" class="d-inline" onsubmit="return confirm('{{ __('app.reset_password') }}?')">
                                    @csrf
                                    <button type="submit" class="btn btn-sm btn-outline-warning" title="@lang('app.reset_password')"><i class="fas fa-key"></i></button>
                                </form>
                            </td>
                        </tr>
                        @empty
                        <tr>
                            <td colspan="7" class="text-center text-muted py-4">@lang('app.no_data')</td>
                        </tr>
                        @endforelse
                    </tbody>
                </table>
            </div>
            {{ $users->links() }}
        </div>
    </div>
</div>
@endsection
