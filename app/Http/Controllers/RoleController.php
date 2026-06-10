<?php

namespace App\Http\Controllers;

use App\Models\Role;
use App\Models\Permission;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class RoleController extends Controller
{
    public function index()
    {
        $roles = Role::withCount('users')->orderBy('name')->get();
        return view('roles.index', compact('roles'));
    }

    public function create()
    {
        $permissions = Permission::orderBy('group')->orderBy('name')->get()->groupBy('group');
        return view('roles.create', compact('permissions'));
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:50|unique:roles,name|alpha_dash',
            'display_name' => 'required|string|max:100',
            'description' => 'nullable|string|max:255',
            'permissions' => 'nullable|array',
            'permissions.*' => 'exists:permissions,id',
        ]);

        $role = Role::create([
            'name' => $request->name,
            'display_name' => $request->display_name,
            'description' => $request->description,
            'is_system' => false,
        ]);

        if ($request->permissions) {
            $role->permissions()->sync($request->permissions);
        }

        return redirect()->route('roles.index')
            ->with('success', __('app.success_created', ['data' => $role->display_name]));
    }

    public function edit(Role $role)
    {
        $permissions = Permission::orderBy('group')->orderBy('name')->get()->groupBy('group');
        $role->load('permissions');
        return view('roles.edit', compact('role', 'permissions'));
    }

    public function update(Request $request, Role $role)
    {
        $rules = [
            'display_name' => 'required|string|max:100',
            'description' => 'nullable|string|max:255',
            'permissions' => 'nullable|array',
            'permissions.*' => 'exists:permissions,id',
        ];

        if (!$role->is_system) {
            $rules['name'] = 'required|string|max:50|alpha_dash|unique:roles,name,' . $role->id;
        }

        $request->validate($rules);

        $data = [
            'display_name' => $request->display_name,
            'description' => $request->description,
        ];

        if (!$role->is_system) {
            $data['name'] = $request->name;
        }

        $role->update($data);
        $role->permissions()->sync($request->permissions ?? []);

        return redirect()->route('roles.index')
            ->with('success', __('app.success_updated', ['data' => $role->display_name]));
    }

    public function destroy(Role $role)
    {
        if ($role->is_system) {
            return back()->with('error', __('app.cannot_delete_system_role'));
        }

        if ($role->users()->exists()) {
            return back()->with('error', __('app.role_has_users'));
        }

        $role->permissions()->detach();
        $role->delete();

        return redirect()->route('roles.index')
            ->with('success', __('app.success_deleted', ['data' => $role->display_name]));
    }
}
