<?php

namespace Database\Seeders;

use App\Models\Setting;
use Illuminate\Database\Seeder;

class SettingSeeder extends Seeder
{
    public function run()
    {
        $settings = [
            ['key' => 'store_name', 'value' => 'Toko Retail'],
            ['key' => 'store_address', 'value' => 'Jl. Raya No. 1'],
            ['key' => 'store_phone', 'value' => '021-1234567'],
            ['key' => 'store_email', 'value' => 'toko@tokopos.local'],
            ['key' => 'receipt_footer', 'value' => 'Terima Kasih - Belanja Lagi Ya!'],
            ['key' => 'tax_rate', 'value' => '0'],
            ['key' => 'currency_symbol', 'value' => 'Rp'],
        ];

        foreach ($settings as $setting) {
            Setting::create($setting);
        }
    }
}
