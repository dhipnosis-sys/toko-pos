@extends('layouts.admin')

@section('title', __('app.add_role'))

@section('content')
<div class="container-fluid">
    <div class="d-flex justify-content-between align-items-center mb-4">
        <h4 class="mb-0 fw-bold">@lang('app.add_role')</h4>
        <a href="{{ route('roles.index') }}" class="btn btn-outline-secondary"><i class="fas fa-arrow-left me-1"></i>@lang('app.back')</a>
    </div>

    <div class="card border-0 shadow-sm">
        <div class="card-body">
            <form action="{{ route('roles.store') }}" method="POST">
                @csrf

                <div class="row g-3 mb-4">
                    <div class="col-md-6">
                        <label class="form-label">@lang('app.role_name') <span class="text-danger">*</span></label>
                        <input type="text" name="name" class="form-control @error('name') is-invalid @enderror" value="{{ old('name') }}" required placeholder="e.g. supervisor">
                        @error('name') <div class="invalid-feedback">{{ $message }}</div> @enderror
                        <small class="text-muted">@lang('app.only_letters_numbers_underscore')</small>
                    </div>
                    <div class="col-md-6">
                        <label class="form-label">@lang('app.display_name') <span class="text-danger">*</span></label>
                        <input type="text" name="display_name" class="form-control @error('display_name') is-invalid @enderror" value="{{ old('display_name') }}" required>
                        @error('display_name') <div class="invalid-feedback">{{ $message }}</div> @enderror
                    </div>
                    <div class="col-md-12">
                        <label class="form-label">@lang('app.description')</label>
                        <textarea name="description" class="form-control" rows="2">{{ old('description') }}</textarea>
                    </div>
                </div>

                <h6 class="fw-semibold mb-3">@lang('app.permissions')</h6>

                @foreach($permissions as $group => $perms)
                <div class="card border mb-3">
                    <div class="card-header bg-light py-2">
                        <div class="form-check">
                            <input class="form-check-input group-check" type="checkbox" data-group="{{ $group }}" id="group_{{ Str::slug($group) }}">
                            <label class="form-check-label fw-semibold" for="group_{{ Str::slug($group) }}">{{ $group }}</label>
                        </div>
                    </div>
                    <div class="card-body py-2">
                        <div class="row">
                            @foreach($perms as $perm)
                            <div class="col-md-4">
                                <div class="form-check">
                                    <input class="form-check-input perm-check" type="checkbox" name="permissions[]" value="{{ $perm->id }}" id="perm_{{ $perm->id }}" {{ in_array($perm->id, old('permissions', [])) ? 'checked' : '' }}>
                                    <label class="form-check-label small" for="perm_{{ $perm->id }}">{{ $perm->display_name }}</label>
                                </div>
                            </div>
                            @endforeach
                        </div>
                    </div>
                </div>
                @endforeach

                <div class="mt-4">
                    <button type="submit" class="btn btn-primary"><i class="fas fa-save me-1"></i>@lang('app.save')</button>
                </div>
            </form>
        </div>
    </div>
</div>

@push('scripts')
<script>
    document.querySelectorAll('.group-check').forEach(function(cb) {
        cb.addEventListener('change', function() {
            const group = this.dataset.group;
            document.querySelectorAll('.perm-check').forEach(function(p) {
                if (p.closest('.card') && p.closest('.card').querySelector('.group-check').dataset.group === group) {
                    p.checked = cb.checked;
                }
            });
        });
    });
</script>
@endpush
@endsection
