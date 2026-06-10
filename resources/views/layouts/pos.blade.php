<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>@yield('title', 'POS') — {{ config('app.name', 'Toko') }}</title>

    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <link rel="preconnect" href="https://fonts.bunny.net">
    <link href="https://fonts.bunny.net/css?family=inter:400,500,600,700&display=swap" rel="stylesheet" />

    @vite(['resources/css/app.css'])
    @stack('styles')
</head>
<body class="pos-body">
    <div class="pos-wrapper">
        <div class="position-fixed bottom-0 end-0 m-3 z-3">
            <div class="btn-group btn-group-sm shadow-sm">
                <a href="{{ route('lang.switch', 'id') }}" class="btn {{ App::getLocale() == 'id' ? 'btn-primary' : 'btn-light' }} border">ID</a>
                <a href="{{ route('lang.switch', 'en') }}" class="btn {{ App::getLocale() == 'en' ? 'btn-primary' : 'btn-light' }} border">EN</a>
            </div>
        </div>
        @yield('content')
    </div>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>
    @stack('scripts')
</body>
</html>
