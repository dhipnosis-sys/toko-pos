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
        Schema::table('bill_of_material_items', function (Blueprint $table) {
            $table->dropForeign(['product_id']);
        });

        DB::statement('ALTER TABLE bill_of_material_items MODIFY product_id BIGINT UNSIGNED NULL');

        Schema::table('bill_of_material_items', function (Blueprint $table) {
            $table->foreign('product_id')->references('id')->on('products')->onDelete('set null');
            $table->string('item_type', 20)->default('product')->after('id');
            $table->string('item_name')->nullable()->after('product_id');
            $table->string('item_unit', 50)->nullable()->after('item_name');
            $table->integer('unit_cost')->default(0)->after('item_unit');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('bill_of_material_items', function (Blueprint $table) {
            $table->dropForeign(['product_id']);
        });

        DB::statement('ALTER TABLE bill_of_material_items MODIFY product_id BIGINT UNSIGNED NOT NULL');

        Schema::table('bill_of_material_items', function (Blueprint $table) {
            $table->foreign('product_id')->references('id')->on('products')->onDelete('cascade');
            $table->dropColumn(['item_type', 'item_name', 'item_unit', 'unit_cost']);
        });
    }
};
