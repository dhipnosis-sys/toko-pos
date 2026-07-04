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
        Schema::table('production_orders', function (Blueprint $table) {
            $table->dropForeign(['product_id']);
        });

        DB::statement('ALTER TABLE production_orders MODIFY product_id BIGINT UNSIGNED NULL');

        Schema::table('production_orders', function (Blueprint $table) {
            $table->foreign('product_id')->references('id')->on('products')->onDelete('set null');
            $table->string('finished_good_type', 20)->default('product')->after('product_id');
            $table->string('finished_good_name')->nullable()->after('finished_good_type');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('production_orders', function (Blueprint $table) {
            $table->dropForeign(['product_id']);
            $table->dropColumn(['finished_good_type', 'finished_good_name']);
        });

        DB::statement('ALTER TABLE production_orders MODIFY product_id BIGINT UNSIGNED NOT NULL');

        Schema::table('production_orders', function (Blueprint $table) {
            $table->foreign('product_id')->references('id')->on('products')->onDelete('cascade');
        });
    }
};
