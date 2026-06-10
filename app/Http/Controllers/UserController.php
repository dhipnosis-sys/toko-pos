<?php

namespace App\Http\Controllers;

use App\Models\Role;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    public function index()
    {
        $users = User::orderBy('name')->paginate(15);
        return view('users.index', compact('users'));
    }

    public function create()
    {
        $roles = Role::orderBy('name')->get();
        return view('users.create', compact('roles'));
    }

    public function store(Request $request)
    {
        $roleNames = Role::pluck('name')->implode(',');
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255|unique:users,email',
            'password' => 'required|string|min:8',
            'role' => 'required|in:' . $roleNames,
            'phone' => 'nullable|string|max:50',
            'is_active' => 'boolean',
        ]);

        User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => $request->role,
            'phone' => $request->phone,
            'is_active' => $request->boolean('is_active', true),
        ]);

        return redirect()->route('users.index')->with('success', __('app.success_created', ['data' => __('app.user')]));
    }

    public function edit(User $user)
    {
        $roles = Role::orderBy('name')->get();
        return view('users.edit', compact('user', 'roles'));
    }

    public function update(Request $request, User $user)
    {
        $roleNames = Role::pluck('name')->implode(',');
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255|unique:users,email,' . $user->id,
            'password' => 'nullable|string|min:8',
            'role' => 'required|in:' . $roleNames,
            'phone' => 'nullable|string|max:50',
            'is_active' => 'boolean',
        ]);

        $data = $request->only(['name', 'email', 'role', 'phone', 'is_active']);
        $data['is_active'] = $request->boolean('is_active', true);

        if ($request->filled('password')) {
            $data['password'] = Hash::make($request->password);
        }

        $user->update($data);

        return redirect()->route('users.index')->with('success', __('app.success_updated', ['data' => __('app.user')]));
    }

    public function resetPassword(User $user)
    {
        $user->update(['password' => Hash::make('password')]);
        return redirect()->route('users.index')->with('success', __('app.password_reset_success'));
    }

    public function destroy(User $user)
    {
        if ($user->id === auth()->id()) {
            return back()->with('error', 'Cannot delete yourself.');
        }
        $user->delete();
        return redirect()->route('users.index')->with('success', __('app.success_deleted', ['data' => __('app.user')]));
    }
}
