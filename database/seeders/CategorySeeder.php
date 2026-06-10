<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class CategorySeeder extends Seeder
{
    public function run()
    {
        $categories = [
            'Makanan Ringan', 'Minuman', 'Makanan Pokok', 'Bumbu Dapur',
            'Produk Susu', 'Roti & Kue', 'Perawatan Diri', 'Kebersihan Rumah',
            'Alat Tulis', 'Minuman Ringan', 'Mie Instan', 'Sembako',
        ];

        foreach ($categories as $name) {
            Category::create([
                'name' => $name,
                'slug' => Str::slug($name),
                'description' => 'Kategori ' . $name,
            ]);
        }
    }
}
