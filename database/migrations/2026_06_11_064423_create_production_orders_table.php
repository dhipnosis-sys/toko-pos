<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('production_orders', function (Blueprint $table) {
            $table->id();
            $table->string('order_number')->unique();
            $table->foreignId('product_id')->constrained()->onDelete('cascade');
            $table->foreignId('bill_of_material_id')->nullable()->constrained()->onDelete('set null');
            $table->integer('quantity');
            $table->string('status')->default('planned');
            $table->integer('total_raw_material_cost')->default(0);
            $table->integer('total_labor_cost')->default(0);
            $table->integer('total_overhead_cost')->default(0);
            $table->integer('total_cost')->default(0);
            $table->integer('cost_per_unit')->default(0);
            $table->boolean('apply_cost_price')->default(false);
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->text('notes')->nullable();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('production_orders');
    }
};
