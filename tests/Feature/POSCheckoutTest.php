<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Tests\TestCase;

class POSCheckoutTest extends TestCase
{
    use DatabaseTransactions;

    private User $user;
    private Product $product1;
    private Product $product2;

    protected function setUp(): void
    {
        parent::setUp();

        $category = Category::create(['name' => 'Test Category', 'slug' => 'test-category']);

        $this->product1 = Product::create([
            'category_id' => $category->id,
            'name' => 'Produk Test 1',
            'slug' => 'produk-test-1',
            'sku' => 'TST001',
            'retail_price' => 15000,
            'wholesale_price' => 13000,
            'reseller_price' => 12000,
            'cost_price' => 10000,
            'stock' => 50,
            'unit' => 'pcs',
        ]);

        $this->product2 = Product::create([
            'category_id' => $category->id,
            'name' => 'Produk Test 2',
            'slug' => 'produk-test-2',
            'sku' => 'TST002',
            'retail_price' => 25000,
            'wholesale_price' => 22000,
            'reseller_price' => 20000,
            'cost_price' => 18000,
            'stock' => 30,
            'unit' => 'pcs',
        ]);

        $this->user = User::factory()->create();
        $this->actingAs($this->user);
    }

    public function test_checkout_with_valid_items()
    {
        $response = $this->postJson(route('pos.checkout'), [
            'items' => [
                ['product_id' => $this->product1->id, 'quantity' => 2, 'price' => 15000],
                ['product_id' => $this->product2->id, 'quantity' => 1, 'price' => 25000],
            ],
            'payment_method' => 'cash',
            'paid_amount' => 60000,
            'discount' => 0,
        ]);

        $response->assertOk()
                 ->assertJson(['success' => true]);

        $this->product1->refresh();
        $this->product2->refresh();
        $this->assertEquals(48, $this->product1->stock);
        $this->assertEquals(29, $this->product2->stock);
    }

    public function test_checkout_with_percent_discount()
    {
        $response = $this->postJson(route('pos.checkout'), [
            'items' => [
                ['product_id' => $this->product1->id, 'quantity' => 2, 'price' => 15000],
            ],
            'payment_method' => 'transfer',
            'paid_amount' => 27000,
            'discount' => 3000,
        ]);

        $response->assertOk()
                 ->assertJson(['success' => true]);
    }

    public function test_checkout_insufficient_stock()
    {
        $response = $this->postJson(route('pos.checkout'), [
            'items' => [
                ['product_id' => $this->product1->id, 'quantity' => 999, 'price' => 15000],
            ],
            'payment_method' => 'cash',
            'paid_amount' => 999999,
        ]);

        $response->assertStatus(422);
    }

    public function test_checkout_all_payment_methods()
    {
        $methods = ['cash', 'transfer', 'qris', 'ewallet', 'credit', 'debit', 'receivable'];

        foreach ($methods as $method) {
            $response = $this->postJson(route('pos.checkout'), [
                'items' => [
                    ['product_id' => $this->product1->id, 'quantity' => 1, 'price' => 15000],
                ],
                'payment_method' => $method,
                'paid_amount' => 15000,
            ]);

            $response->assertOk()
                     ->assertJson(['success' => true]);
        }
    }

    public function test_checkout_without_items_fails()
    {
        $response = $this->postJson(route('pos.checkout'), [
            'items' => [],
            'payment_method' => 'cash',
            'paid_amount' => 0,
        ]);

        $response->assertStatus(422);
    }

    public function test_checkout_requires_authentication()
    {
        auth()->logout();

        $response = $this->postJson(route('pos.checkout'), [
            'items' => [
                ['product_id' => $this->product1->id, 'quantity' => 1, 'price' => 15000],
            ],
            'payment_method' => 'cash',
            'paid_amount' => 15000,
        ]);

        $response->assertStatus(401);
    }
}
