<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\Permission;
use Illuminate\Database\Seeder;

class RolePermissionSeeder extends Seeder
{
    public function run(): void
    {
        $permissions = [
            ['name' => 'view_dashboard', 'display_name' => 'View Dashboard', 'group' => 'Dashboard'],

            ['name' => 'view_products', 'display_name' => 'View Products', 'group' => 'Products'],
            ['name' => 'create_product', 'display_name' => 'Create Product', 'group' => 'Products'],
            ['name' => 'edit_product', 'display_name' => 'Edit Product', 'group' => 'Products'],
            ['name' => 'delete_product', 'display_name' => 'Delete Product', 'group' => 'Products'],

            ['name' => 'view_categories', 'display_name' => 'View Categories', 'group' => 'Categories'],
            ['name' => 'create_category', 'display_name' => 'Create Category', 'group' => 'Categories'],
            ['name' => 'edit_category', 'display_name' => 'Edit Category', 'group' => 'Categories'],
            ['name' => 'delete_category', 'display_name' => 'Delete Category', 'group' => 'Categories'],

            ['name' => 'view_suppliers', 'display_name' => 'View Suppliers', 'group' => 'Suppliers'],
            ['name' => 'create_supplier', 'display_name' => 'Create Supplier', 'group' => 'Suppliers'],
            ['name' => 'edit_supplier', 'display_name' => 'Edit Supplier', 'group' => 'Suppliers'],
            ['name' => 'delete_supplier', 'display_name' => 'Delete Supplier', 'group' => 'Suppliers'],

            ['name' => 'view_customers', 'display_name' => 'View Customers', 'group' => 'Customers'],
            ['name' => 'create_customer', 'display_name' => 'Create Customer', 'group' => 'Customers'],
            ['name' => 'edit_customer', 'display_name' => 'Edit Customer', 'group' => 'Customers'],
            ['name' => 'delete_customer', 'display_name' => 'Delete Customer', 'group' => 'Customers'],

            ['name' => 'view_purchases', 'display_name' => 'View Purchases', 'group' => 'Purchases'],
            ['name' => 'create_purchase', 'display_name' => 'Create Purchase', 'group' => 'Purchases'],
            ['name' => 'show_purchase', 'display_name' => 'Show Purchase', 'group' => 'Purchases'],
            ['name' => 'delete_purchase', 'display_name' => 'Delete Purchase', 'group' => 'Purchases'],

            ['name' => 'view_sales', 'display_name' => 'View Sales', 'group' => 'Sales'],
            ['name' => 'create_sale', 'display_name' => 'Create Sale (POS)', 'group' => 'Sales'],
            ['name' => 'show_sale', 'display_name' => 'Show Sale', 'group' => 'Sales'],
            ['name' => 'delete_sale', 'display_name' => 'Delete Sale', 'group' => 'Sales'],

            ['name' => 'view_reports', 'display_name' => 'View Reports', 'group' => 'Reports'],

            ['name' => 'view_settings', 'display_name' => 'View Settings', 'group' => 'Settings'],
            ['name' => 'manage_users', 'display_name' => 'Manage Users', 'group' => 'Settings'],
            ['name' => 'manage_roles', 'display_name' => 'Manage Roles', 'group' => 'Settings'],
            ['name' => 'manage_settings', 'display_name' => 'Update Settings', 'group' => 'Settings'],
        ];

        foreach ($permissions as $p) {
            Permission::firstOrCreate(['name' => $p['name']], $p);
        }

        $roles = [
            'owner' => [
                'display_name' => 'Owner',
                'description' => 'Full access to all features',
                'is_system' => true,
                'permissions' => array_column($permissions, 'name'),
            ],
            'cashier' => [
                'display_name' => 'Cashier',
                'description' => 'POS operations and sales viewing',
                'is_system' => true,
                'permissions' => [
                    'view_dashboard',
                    'view_products',
                    'view_customers', 'create_customer', 'edit_customer',
                    'view_sales', 'create_sale', 'show_sale',
                    'view_reports',
                ],
            ],
            'warehouse' => [
                'display_name' => 'Warehouse Staff',
                'description' => 'Product and stock management',
                'is_system' => true,
                'permissions' => [
                    'view_dashboard',
                    'view_products', 'create_product', 'edit_product',
                    'view_categories', 'create_category', 'edit_category',
                    'view_suppliers', 'create_supplier', 'edit_supplier',
                    'view_purchases', 'create_purchase', 'show_purchase',
                ],
            ],
        ];

        foreach ($roles as $name => $data) {
            $role = Role::firstOrCreate(
                ['name' => $name],
                [
                    'display_name' => $data['display_name'],
                    'description' => $data['description'],
                    'is_system' => $data['is_system'],
                ]
            );
            $permIds = Permission::whereIn('name', $data['permissions'])->pluck('id');
            $role->permissions()->sync($permIds);
        }
    }
}
