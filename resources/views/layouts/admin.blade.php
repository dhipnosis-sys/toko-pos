<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>@yield('title', config('app.name', 'Toko POS')) — {{ config('app.name', 'Toko') }}</title>

    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <link rel="preconnect" href="https://fonts.bunny.net">
    <link href="https://fonts.bunny.net/css?family=inter:400,500,600,700&display=swap" rel="stylesheet" />

    @vite(['resources/css/app.css'])
    @stack('styles')
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html, body { height: 100%; font-family: 'Inter', sans-serif; background: #f4f6f9; }

        .wrapper { display: flex; min-height: 100vh; }

        .sidebar {
            width: 250px; min-height: 100vh; background: #1a1a2e; color: #fff;
            display: flex; flex-direction: column; position: fixed; top: 0; left: 0; z-index: 1000;
            transition: width 0.25s ease;
        }
        .sidebar.collapsed { width: 65px; }
        .sidebar.collapsed .sidebar-brand span,
        .sidebar.collapsed .nav-link span,
        .sidebar.collapsed .nav-divider span { display: none; }
        .sidebar.collapsed .nav-divider { text-align: center; font-size: 0; }
        .sidebar.collapsed .nav-divider::after { content: '—'; color: rgba(255,255,255,0.3); font-size: 0.75rem; }
        .sidebar.collapsed .nav-link { justify-content: center; padding: 0.75rem 0; }
        .sidebar.collapsed .nav-link i { margin: 0; font-size: 1.2rem; }

        .sidebar-header { padding: 1rem 1.25rem; border-bottom: 1px solid rgba(255,255,255,0.08); flex-shrink: 0; }
        .sidebar-brand { color: #fff; text-decoration: none; font-size: 1.15rem; font-weight: 700; display: flex; align-items: center; gap: 0.5rem; white-space: nowrap; }
        .sidebar-brand:hover { color: #e0e0e0; }

        .sidebar-nav { padding: 0.5rem 0; flex: 1; overflow-y: auto; list-style: none; }
        .sidebar-nav .nav-item { list-style: none; }
        .sidebar-nav .nav-link {
            color: rgba(255,255,255,0.65); padding: 0.7rem 1.25rem; display: flex; align-items: center; gap: 0.75rem;
            text-decoration: none; white-space: nowrap; transition: all 0.15s; border-left: 3px solid transparent; font-size: 0.9rem;
        }
        .sidebar-nav .nav-link i { width: 20px; text-align: center; font-size: 1rem; flex-shrink: 0; }
        .sidebar-nav .nav-link:hover { color: #fff; background: rgba(255,255,255,0.06); }
        .sidebar-nav .nav-link.active { color: #fff; background: rgba(67, 97, 238, 0.2); border-left-color: #4361ee; }

        .nav-divider { padding: 0.75rem 1.25rem 0.25rem; list-style: none; }
        .nav-divider span { font-size: 0.65rem; text-transform: uppercase; letter-spacing: 1.2px; color: rgba(255,255,255,0.35); font-weight: 600; }

        .main-content { margin-left: 250px; flex: 1; display: flex; flex-direction: column; min-height: 100vh; transition: margin-left 0.25s ease; }
        .main-content.expanded { margin-left: 65px; }

        .topbar { background: #fff; border-bottom: 1px solid #e9ecef; padding: 0.6rem 1.5rem; position: sticky; top: 0; z-index: 999; flex-shrink: 0; }
        .sidebar-toggle { color: #6c757d; font-size: 1.2rem; padding: 0; text-decoration: none; border: none; background: none; cursor: pointer; }
        .sidebar-toggle:hover { color: #343a40; }

        .content { flex: 1; padding: 1.5rem; }

        .avatar-initial { width: 32px; height: 32px; background: #4361ee; color: #fff; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.85rem; font-weight: 600; flex-shrink: 0; }

        @media (max-width: 992px) {
            .sidebar { width: 65px; }
            .sidebar .sidebar-brand span, .sidebar .nav-link span, .sidebar .nav-divider span { display: none; }
            .sidebar .nav-divider { text-align: center; font-size: 0; }
            .sidebar .nav-divider::after { content: '—'; color: rgba(255,255,255,0.3); font-size: 0.75rem; }
            .sidebar .nav-link { justify-content: center; padding: 0.75rem 0; }
            .sidebar .nav-link i { margin: 0; font-size: 1.2rem; }
            .main-content { margin-left: 65px; }
        }
    </style>
</head>
<body>
    <div class="wrapper">
        <nav id="sidebar" class="sidebar">
            <div class="sidebar-header">
                <a href="{{ route('dashboard') }}" class="sidebar-brand">
                    <i class="fas fa-store"></i>
                    <span>{{ \App\Models\Setting::getValue('store_name', config('app.name', 'Toko POS')) }}</span>
                </a>
            </div>

            <ul class="sidebar-nav">
                <li class="nav-item">
                    <a href="{{ route('dashboard') }}" class="nav-link {{ request()->routeIs('dashboard') ? 'active' : '' }}">
                        <i class="fas fa-tachometer-alt"></i>
                        <span>@lang('app.dashboard')</span>
                    </a>
                </li>
                <li class="nav-item">
                    <a href="{{ route('pos') }}" class="nav-link {{ request()->routeIs('pos') ? 'active' : '' }}">
                        <i class="fas fa-cash-register"></i>
                        <span>@lang('app.pos')</span>
                    </a>
                </li>
                <li class="nav-divider"><span>@lang('app.products')</span></li>
                <li class="nav-item">
                    <a href="{{ route('products.index') }}" class="nav-link {{ request()->routeIs('products.*') ? 'active' : '' }}">
                        <i class="fas fa-box"></i>
                        <span>@lang('app.products')</span>
                    </a>
                </li>
                <li class="nav-item">
                    <a href="{{ route('categories.index') }}" class="nav-link {{ request()->routeIs('categories.*') ? 'active' : '' }}">
                        <i class="fas fa-tags"></i>
                        <span>@lang('app.categories')</span>
                    </a>
                </li>
                <li class="nav-item">
                    <a href="{{ route('purchases.index') }}" class="nav-link {{ request()->routeIs('purchases.*') ? 'active' : '' }}">
                        <i class="fas fa-dolly"></i>
                        <span>@lang('app.stock_in')</span>
                    </a>
                </li>
                <li class="nav-item">
                    <a href="{{ route('suppliers.index') }}" class="nav-link {{ request()->routeIs('suppliers.*') ? 'active' : '' }}">
                        <i class="fas fa-truck"></i>
                        <span>@lang('app.suppliers')</span>
                    </a>
                </li>
                <li class="nav-divider"><span>@lang('app.sales_history')</span></li>
                <li class="nav-item">
                    <a href="{{ route('customers.index') }}" class="nav-link {{ request()->routeIs('customers.*') ? 'active' : '' }}">
                        <i class="fas fa-users"></i>
                        <span>@lang('app.customers')</span>
                    </a>
                </li>
                <li class="nav-item">
                    <a href="{{ route('sales.index') }}" class="nav-link {{ request()->routeIs('sales.*') ? 'active' : '' }}">
                        <i class="fas fa-receipt"></i>
                        <span>@lang('app.sales_history')</span>
                    </a>
                </li>
                <li class="nav-item">
                    <a href="{{ route('analytics') }}" class="nav-link {{ request()->routeIs('analytics') ? 'active' : '' }}">
                        <i class="fas fa-chart-line"></i>
                        <span>@lang('app.analytics')</span>
                    </a>
                </li>
                @if(auth()->user() && auth()->user()->role === 'owner')
                <li class="nav-divider"><span>@lang('app.settings')</span></li>
                <li class="nav-item">
                    <a href="{{ route('settings.index') }}" class="nav-link {{ request()->routeIs('settings.*') ? 'active' : '' }}">
                        <i class="fas fa-cog"></i>
                        <span>@lang('app.settings')</span>
                    </a>
                </li>
                <li class="nav-item">
                    <a href="{{ route('users.index') }}" class="nav-link {{ request()->routeIs('users.*') ? 'active' : '' }}">
                        <i class="fas fa-user-shield"></i>
                        <span>@lang('app.user_management')</span>
                    </a>
                </li>
                <li class="nav-item">
                    <a href="{{ route('roles.index') }}" class="nav-link {{ request()->routeIs('roles.*') ? 'active' : '' }}">
                        <i class="fas fa-key"></i>
                        <span>@lang('app.role_management')</span>
                    </a>
                </li>
                @endif
            </ul>
        </nav>

        <div class="main-content">
            <nav class="topbar">
                <div class="d-flex align-items-center justify-content-between">
                    <button id="sidebarToggle" class="sidebar-toggle">
                        <i class="fas fa-bars"></i>
                    </button>
                    <div class="d-flex align-items-center gap-2">
                        <a href="{{ route('lang.switch', 'id') }}" class="btn btn-sm {{ App::getLocale() == 'id' ? 'btn-primary' : 'btn-outline-secondary' }}" title="Bahasa Indonesia">ID</a>
                        <a href="{{ route('lang.switch', 'en') }}" class="btn btn-sm {{ App::getLocale() == 'en' ? 'btn-primary' : 'btn-outline-secondary' }}" title="English">EN</a>
                    </div>
                    <div class="dropdown">
                        <button class="btn btn-link dropdown-toggle text-dark text-decoration-none p-0" type="button" data-bs-toggle="dropdown">
                            <div class="d-flex align-items-center gap-2">
                                <div class="avatar-initial">{{ strtoupper(substr(Auth::user()->name, 0, 1)) }}</div>
                                <span class="d-none d-md-inline" style="font-size:0.9rem;">{{ Auth::user()->name }}</span>
                            </div>
                        </button>
                        <ul class="dropdown-menu dropdown-menu-end shadow-sm">
                            <li><a class="dropdown-item" href="{{ route('profile.edit') }}"><i class="fas fa-user me-2"></i>@lang('app.profile')</a></li>
                            <li><hr class="dropdown-divider"></li>
                            <li>
                                <form method="POST" action="{{ route('logout') }}">
                                    @csrf
                                    <button type="submit" class="dropdown-item"><i class="fas fa-sign-out-alt me-2"></i>@lang('app.log_out')</button>
                                </form>
                            </li>
                        </ul>
                    </div>
                </div>
            </nav>

            <div class="content">
                @if (session('success'))
                    <div class="alert alert-success alert-dismissible fade show" role="alert">{{ session('success') }}<button type="button" class="btn-close" data-bs-dismiss="alert"></button></div>
                @endif
                @if (session('error'))
                    <div class="alert alert-danger alert-dismissible fade show" role="alert">{{ session('error') }}<button type="button" class="btn-close" data-bs-dismiss="alert"></button></div>
                @endif
                @yield('content')
            </div>
        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"></script>
    <script>
        document.getElementById('sidebarToggle')?.addEventListener('click', function() {
            document.getElementById('sidebar').classList.toggle('collapsed');
            document.querySelector('.main-content').classList.toggle('expanded');
        });
    </script>
    @stack('scripts')
</body>
</html>