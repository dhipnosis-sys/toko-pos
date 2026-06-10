<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Product;
use App\Models\Supplier;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class SampleProductSeeder extends Seeder
{
    public function run()
    {
        $supplierNames = [
            'PT Indofood Sukses Makmur',
            'PT Unilever Indonesia',
            'PT Nestle Indonesia',
            'PT Mayora Indah',
            'PT Wings Group',
        ];

        foreach ($supplierNames as $i => $name) {
            Supplier::create([
                'name' => $name,
                'phone' => '021-123400' . ($i + 1),
                'email' => strtolower(str_replace(' ', '', $name)) . '@example.com',
                'address' => 'Jl. ' . str_replace('PT ', '', $name) . ' No. ' . ($i + 1),
                'city' => 'Jakarta',
            ]);
        }

        $supplierIds = Supplier::pluck('id')->toArray();

        $categories = Category::all();
        $catMap = $categories->pluck('id', 'name');

        $products = [
            ['name' => 'Indomie Goreng', 'category' => 'Mie Instan', 'supplier' => 0, 'cost_price' => 2500, 'retail_price' => 3500, 'wholesale_price' => 3200, 'reseller_price' => 3000, 'stock' => 200, 'min_stock' => 20, 'unit' => 'pcs', 'barcode' => '8991002101115'],
            ['name' => 'Indomie Kuah Soto', 'category' => 'Mie Instan', 'supplier' => 0, 'cost_price' => 2500, 'retail_price' => 3500, 'wholesale_price' => 3200, 'reseller_price' => 3000, 'stock' => 180, 'min_stock' => 20, 'unit' => 'pcs', 'barcode' => '8991002101122'],
            ['name' => 'Bimoli Minyak Goreng 1L', 'category' => 'Bumbu Dapur', 'supplier' => 4, 'cost_price' => 15000, 'retail_price' => 18000, 'wholesale_price' => 17000, 'reseller_price' => 16500, 'stock' => 60, 'min_stock' => 10, 'unit' => 'pcs', 'barcode' => '8991002101133'],
            ['name' => 'Tepung Terigu Segitiga Biru 1Kg', 'category' => 'Makanan Pokok', 'supplier' => 0, 'cost_price' => 10000, 'retail_price' => 12000, 'wholesale_price' => 11500, 'reseller_price' => 11000, 'stock' => 45, 'min_stock' => 10, 'unit' => 'pcs', 'barcode' => '8991002101144'],
            ['name' => 'Gula Pasir Gulaku 1Kg', 'category' => 'Makanan Pokok', 'supplier' => 0, 'cost_price' => 13000, 'retail_price' => 15000, 'wholesale_price' => 14500, 'reseller_price' => 14000, 'stock' => 80, 'min_stock' => 15, 'unit' => 'pcs', 'barcode' => '8991002101155'],
            ['name' => 'Beras Slyip Super 5Kg', 'category' => 'Makanan Pokok', 'supplier' => 0, 'cost_price' => 60000, 'retail_price' => 68000, 'wholesale_price' => 65000, 'reseller_price' => 63000, 'stock' => 30, 'min_stock' => 5, 'unit' => 'pcs', 'barcode' => '8991002101166'],
            ['name' => 'Kopi Kapal Api 200gr', 'category' => 'Minuman', 'supplier' => 4, 'cost_price' => 12000, 'retail_price' => 14500, 'wholesale_price' => 13800, 'reseller_price' => 13200, 'stock' => 55, 'min_stock' => 10, 'unit' => 'pcs', 'barcode' => '8991002101177'],
            ['name' => 'Teh Botol Sosro 500ml', 'category' => 'Minuman Ringan', 'supplier' => 0, 'cost_price' => 4500, 'retail_price' => 6000, 'wholesale_price' => 5500, 'reseller_price' => 5200, 'stock' => 120, 'min_stock' => 20, 'unit' => 'pcs', 'barcode' => '8991002101188'],
            ['name' => 'Coca Cola 390ml', 'category' => 'Minuman Ringan', 'supplier' => 0, 'cost_price' => 5000, 'retail_price' => 6500, 'wholesale_price' => 6000, 'reseller_price' => 5700, 'stock' => 90, 'min_stock' => 15, 'unit' => 'pcs', 'barcode' => '8991002101199'],
            ['name' => 'Aqua 600ml', 'category' => 'Minuman Ringan', 'supplier' => 0, 'cost_price' => 2500, 'retail_price' => 3500, 'wholesale_price' => 3200, 'reseller_price' => 3000, 'stock' => 200, 'min_stock' => 30, 'unit' => 'pcs', 'barcode' => '8991002101205'],
            ['name' => 'Kacang Garuda 200gr', 'category' => 'Makanan Ringan', 'supplier' => 0, 'cost_price' => 8000, 'retail_price' => 10500, 'wholesale_price' => 9800, 'reseller_price' => 9300, 'stock' => 40, 'min_stock' => 8, 'unit' => 'pcs', 'barcode' => '8991002101216'],
            ['name' => 'Wafer Tango 180gr', 'category' => 'Makanan Ringan', 'supplier' => 3, 'cost_price' => 7000, 'retail_price' => 9500, 'wholesale_price' => 8800, 'reseller_price' => 8400, 'stock' => 65, 'min_stock' => 10, 'unit' => 'pcs', 'barcode' => '8991002101227'],
            ['name' => 'Susu Kental Manis Frisian Flag 380gr', 'category' => 'Produk Susu', 'supplier' => 2, 'cost_price' => 9000, 'retail_price' => 11500, 'wholesale_price' => 10800, 'reseller_price' => 10300, 'stock' => 50, 'min_stock' => 10, 'unit' => 'pcs', 'barcode' => '8991002101238'],
            ['name' => 'Susu Ultra Milk 250ml', 'category' => 'Produk Susu', 'supplier' => 2, 'cost_price' => 5500, 'retail_price' => 7000, 'wholesale_price' => 6600, 'reseller_price' => 6300, 'stock' => 75, 'min_stock' => 15, 'unit' => 'pcs', 'barcode' => '8991002101249'],
            ['name' => 'Mie Sedaap Goreng', 'category' => 'Mie Instan', 'supplier' => 4, 'cost_price' => 2400, 'retail_price' => 3300, 'wholesale_price' => 3000, 'reseller_price' => 2800, 'stock' => 150, 'min_stock' => 20, 'unit' => 'pcs', 'barcode' => '8991002101250'],
            ['name' => 'Roti Tawar Sari Roti', 'category' => 'Roti & Kue', 'supplier' => 0, 'cost_price' => 10000, 'retail_price' => 13000, 'wholesale_price' => 12000, 'reseller_price' => 11500, 'stock' => 25, 'min_stock' => 5, 'unit' => 'pcs', 'barcode' => '8991002101261'],
            ['name' => 'Sabun Lifebuoy 70gr', 'category' => 'Perawatan Diri', 'supplier' => 1, 'cost_price' => 3000, 'retail_price' => 4500, 'wholesale_price' => 4000, 'reseller_price' => 3800, 'stock' => 80, 'min_stock' => 15, 'unit' => 'pcs', 'barcode' => '8991002101272'],
            ['name' => 'Shampoo Sunsilk 70ml', 'category' => 'Perawatan Diri', 'supplier' => 1, 'cost_price' => 4000, 'retail_price' => 5500, 'wholesale_price' => 5100, 'reseller_price' => 4800, 'stock' => 60, 'min_stock' => 10, 'unit' => 'pcs', 'barcode' => '8991002101283'],
            ['name' => 'Pasta Gigi Pepsodent 75gr', 'category' => 'Perawatan Diri', 'supplier' => 1, 'cost_price' => 5000, 'retail_price' => 7000, 'wholesale_price' => 6500, 'reseller_price' => 6000, 'stock' => 70, 'min_stock' => 10, 'unit' => 'pcs', 'barcode' => '8991002101294'],
            ['name' => 'Sabun Cuci Piring Sunlight 450ml', 'category' => 'Kebersihan Rumah', 'supplier' => 1, 'cost_price' => 7000, 'retail_price' => 9500, 'wholesale_price' => 8800, 'reseller_price' => 8400, 'stock' => 40, 'min_stock' => 8, 'unit' => 'pcs', 'barcode' => '8991002101305'],
            ['name' => 'Pembersih Lantai So Klin 500ml', 'category' => 'Kebersihan Rumah', 'supplier' => 1, 'cost_price' => 8000, 'retail_price' => 10500, 'wholesale_price' => 9800, 'reseller_price' => 9400, 'stock' => 35, 'min_stock' => 8, 'unit' => 'pcs', 'barcode' => '8991002101316'],
            ['name' => 'Kecap Manis ABC 550ml', 'category' => 'Bumbu Dapur', 'supplier' => 0, 'cost_price' => 11000, 'retail_price' => 14000, 'wholesale_price' => 13000, 'reseller_price' => 12500, 'stock' => 30, 'min_stock' => 8, 'unit' => 'pcs', 'barcode' => '8991002101327'],
            ['name' => 'Kecap Inggris ABC 135ml', 'category' => 'Bumbu Dapur', 'supplier' => 0, 'cost_price' => 8000, 'retail_price' => 11000, 'wholesale_price' => 10000, 'reseller_price' => 9500, 'stock' => 20, 'min_stock' => 5, 'unit' => 'pcs', 'barcode' => '8991002101338'],
            ['name' => 'Saos Sambal ABC 340ml', 'category' => 'Bumbu Dapur', 'supplier' => 0, 'cost_price' => 9000, 'retail_price' => 12000, 'wholesale_price' => 11000, 'reseller_price' => 10500, 'stock' => 35, 'min_stock' => 8, 'unit' => 'pcs', 'barcode' => '8991002101349'],
        ];

        foreach ($products as $item) {
            $categoryId = $catMap[$item['category']] ?? null;
            if (!$categoryId) continue;

            $supplierId = $supplierIds[$item['supplier']] ?? null;

            Product::create([
                'category_id' => $categoryId,
                'supplier_id' => $supplierId,
                'name' => $item['name'],
                'slug' => Str::slug($item['name']),
                'sku' => 'SKU-' . Str::padLeft(Product::count() + 1, 4, '0'),
                'barcode' => $item['barcode'],
                'description' => $item['name'],
                'cost_price' => $item['cost_price'],
                'retail_price' => $item['retail_price'],
                'wholesale_price' => $item['wholesale_price'],
                'reseller_price' => $item['reseller_price'],
                'stock' => $item['stock'],
                'min_stock' => $item['min_stock'],
                'unit' => $item['unit'],
                'is_active' => true,
            ]);
        }
    }
}
