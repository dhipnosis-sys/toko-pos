# AGENTS.md — Toko

Laravel 11 POS & Inventory Management application.

## Stack
- **Backend:** Laravel 11, PHP 8.0.30
- **Database:** MariaDB 10.4.32 (via XAMPP)
- **Frontend:** Blade + Bootstrap 5, Chart.js
- **Auth:** Laravel Breeze

## Developer Commands
- `php composer.phar <cmd>` — run Composer (installed locally)
- `php composer.phar create-project laravel/laravel . --prefer-dist` — recreate project
- `php artisan serve` — start dev server
- `php artisan make:migration` / `make:model` / `make:controller` — scaffold
- `npm run build` — build frontend assets
- `npm run dev` — watch & compile assets
- `php artisan migrate` — run migrations
- `php artisan db:seed` — seed database

## Database
- Host: `127.0.0.1` (or `localhost`)
- Port: `3306`
- User: `root` (no password by default)
- Create a new database via `CREATE DATABASE toko_pos;` in phpMyAdmin or MySQL CLI.

## Architecture Notes
- POS system with role-based access: Owner, Cashier, Warehouse Staff
- Multi-unit product support (pcs, pack, box)
- Multiple price tiers (retail, wholesale, reseller)
- Payment methods: cash, transfer, QRIS, e-wallet, credit, debit, receivable
- Receipt printing support

## Key Directories
- `app/Http/Controllers/` — controllers
- `app/Models/` — Eloquent models
- `app/Http/Livewire/` — Livewire components (if used)
- `resources/views/` — Blade templates
- `database/migrations/` — DB migrations
- `database/seeders/` — Seeders
- `routes/web.php` — web routes
- `public/` — public assets (compiled CSS/JS)

## Conventions
- All prices stored in integer (rupiah in sen/cent) to avoid float issues
- Timestamps: `created_at`, `updated_at` automatically managed
- Soft deletes used for products, suppliers, categories
- Transactions use database transactions for atomicity
