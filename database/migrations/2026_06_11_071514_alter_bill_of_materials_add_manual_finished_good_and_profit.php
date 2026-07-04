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
        Schema::table('bill_of_materials', function (Blueprint $table) {
            $table->dropForeign(['product_id']);
        });

        DB::statement('ALTER TABLE bill_of_materials MODIFY product_id BIGINT UNSIGNED NULL');

        Schema::table('bill_of_materials', function (Blueprint $table) {
            $table->foreign('product_id')->references('id')->on('products')->onDelete('set null');
            $table->string('finished_good_type', 20)->default('product')->after('product_id');
            $table->string('finished_good_name')->nullable()->after('finished_good_type');
            $table->string('finished_good_unit', 50)->nullable()->after('finished_good_name');
            $table->string('profit_type', 20)->default('percentage')->after('notes');
            $table->integer('profit_value')->default(0)->after('profit_type');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('bill_of_materials', function (Blueprint $table) {
            $table->dropForeign(['product_id']);
        });

        DB::statement('ALTER TABLE bill_of_materials MODIFY product_id BIGINT UNSIGNED NOT NULL');

        Schema::table('bill_of_materials', function (Blueprint $table) {
            $table->foreign('product_id')->references('id')->on('products')->onDelete('cascade');
            $table->dropColumn(['finished_good_type', 'finished_good_name', 'finished_good_unit', 'profit_type', 'profit_value']);
        });
    }
};
