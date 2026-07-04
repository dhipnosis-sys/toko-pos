<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\POSController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\SupplierController;
use App\Http\Controllers\CustomerController;
use App\Http\Controllers\PurchaseController;
use App\Http\Controllers\SaleController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\BOMController;
use App\Http\Controllers\ProductionController;
use App\Http\Controllers\SettingController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return redirect()->route('login');
});

Route::get('lang/{locale}', function ($locale) {
    if (in_array($locale, ['en', 'id'])) {
        session()->put('locale', $locale);
    }
    return redirect()->back();
})->name('lang.switch');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
    
    // POS
    Route::get('/pos', [POSController::class, 'index'])->name('pos');
    Route::post('/pos/add-to-cart', [POSController::class, 'addToCart'])->name('pos.add-to-cart');
    Route::post('/pos/checkout', [POSController::class, 'checkout'])->name('pos.checkout');
    Route::get('/pos/products', [POSController::class, 'getProducts'])->name('pos.products');
    Route::get('/pos/product/{product}', [POSController::class, 'getProduct'])->name('pos.product');
    Route::get('/pos/lookup-barcode/{barcode}', [POSController::class, 'lookupBarcode'])->name('pos.lookup-barcode');
    Route::get('/pos/print/{sale}', [POSController::class, 'printReceipt'])->name('pos.print');
    
    // Products
    Route::resource('products', ProductController::class);
    Route::get('/products/{product}/stock', [ProductController::class, 'stockHistory'])->name('products.stock');
    Route::get('/products/search/ajax', [ProductController::class, 'searchAjax'])->name('products.search.ajax');
    
    // Categories
    Route::resource('categories', CategoryController::class);
    
    // Suppliers
    Route::resource('suppliers', SupplierController::class);
    Route::get('/suppliers/{supplier}/pay', [SupplierController::class, 'payForm'])->name('suppliers.pay');
    Route::post('/suppliers/{supplier}/pay', [SupplierController::class, 'payStore'])->name('suppliers.pay.store');
    
    // Customers
    Route::resource('customers', CustomerController::class);
    
    // Purchases (Stock In)
    Route::resource('purchases', PurchaseController::class);
    Route::post('/purchases/{purchase}/complete', [PurchaseController::class, 'complete'])->name('purchases.complete');
    
    // Sales
    Route::resource('sales', SaleController::class)->only(['index', 'show']);
    
    // Analytics / Reports
    Route::get('/analytics', [ReportController::class, 'index'])->name('analytics');
    
    // User / Role Management (owner only)
    Route::resource('users', UserController::class)->middleware('role:owner');
    Route::post('/users/{user}/reset-password', [UserController::class, 'resetPassword'])->name('users.reset-password')->middleware('role:owner');
    
    // Settings
    Route::get('/settings', [SettingController::class, 'index'])->name('settings.index');
    Route::post('/settings', [SettingController::class, 'update'])->name('settings.update');

    // BOM / Bill of Materials
    Route::resource('bom', BOMController::class);
    Route::post('/bom/simulate-hpp', [BOMController::class, 'simulateHpp'])->name('bom.simulate-hpp');
    Route::post('/bom/save-cost-price', [BOMController::class, 'saveCostPrice'])->name('bom.save-cost-price');

    // Production Orders
    Route::resource('production', ProductionController::class);
    Route::post('/production/{production}/process', [ProductionController::class, 'process'])->name('production.process');
    Route::post('/production/{production}/cancel', [ProductionController::class, 'cancel'])->name('production.cancel');
    Route::post('/production/{production}/apply-cost-price', [ProductionController::class, 'applyCostPrice'])->name('production.apply-cost-price');

    // Roles (owner only)
    Route::resource('roles', RoleController::class)->middleware('role:owner');
});

// Breeze profile routes
Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__.'/auth.php';
