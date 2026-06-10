<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="csrf-token" content="{{ csrf_token() }}">

        <title>{{ config('app.name', 'Laravel') }}</title>

        <!-- Fonts -->
        <link rel="preconnect" href="https://fonts.bunny.net">
        <link href="https://fonts.bunny.net/css?family=figtree:400,500,600&display=swap" rel="stylesheet" />

        <!-- Bootstrap Icons -->
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">

        <!-- Scripts -->
        @vite(['resources/css/app.css', 'resources/js/app.js'])
    </head>
    <body class="font-sans text-gray-900 antialiased">
        <div class="min-h-screen flex flex-col sm:justify-center items-center pt-6 sm:pt-0 bg-green-50">
            <div>
                <a href="/">
                    <img src="{{ asset('images/Gemini_Generated_Image_bzd277bzd277bzd2.png') }}" alt="Logo" class="w-full sm:max-w-md" style="height: auto;">
                </a>
            </div>

            <div class="w-full sm:max-w-md mt-6 px-6 py-4 bg-white shadow-md overflow-hidden sm:rounded-lg">
                <div class="text-right mb-3">
                    <a href="{{ route('lang.switch', 'id') }}" class="text-sm {{ App::getLocale() == 'id' ? 'font-bold text-indigo-600' : 'text-gray-500' }} hover:text-indigo-600 mr-2">ID</a>
                    <span class="text-gray-300">|</span>
                    <a href="{{ route('lang.switch', 'en') }}" class="text-sm ml-2 {{ App::getLocale() == 'en' ? 'font-bold text-indigo-600' : 'text-gray-500' }} hover:text-indigo-600">EN</a>
                </div>
                {{ $slot }}
            </div>
        </div>
    </body>
</html>
