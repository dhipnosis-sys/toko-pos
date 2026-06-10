<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run()
    {
        User::create([
            'name' => 'Owner',
            'email' => 'owner@tokopos.local',
            'password' => Hash::make('password'),
            'role' => 'owner',
            'phone' => '08123456789',
            'is_active' => true,
        ]);

        User::create([
            'name' => 'Kasir 1',
            'email' => 'kasir@tokopos.local',
            'password' => Hash::make('password'),
            'role' => 'cashier',
            'phone' => '08123456788',
            'is_active' => true,
        ]);

        User::create([
            'name' => 'Gudang 1',
            'email' => 'gudang@tokopos.local',
            'password' => Hash::make('password'),
            'role' => 'warehouse',
            'phone' => '08123456787',
            'is_active' => true,
        ]);
    }
}
