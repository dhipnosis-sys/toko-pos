<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BillOfMaterialItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'bill_of_material_id',
        'product_id',
        'item_type',
        'item_name',
        'item_unit',
        'quantity',
        'unit_cost',
    ];

    public function billOfMaterial()
    {
        return $this->belongsTo(BillOfMaterial::class);
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }
}
