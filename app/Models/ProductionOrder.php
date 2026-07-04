<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProductionOrder extends Model
{
    use HasFactory;

    protected $fillable = [
        'order_number',
        'product_id',
        'bill_of_material_id',
        'finished_good_type',
        'finished_good_name',
        'quantity',
        'status',
        'total_raw_material_cost',
        'total_labor_cost',
        'total_overhead_cost',
        'total_cost',
        'cost_per_unit',
        'apply_cost_price',
        'started_at',
        'completed_at',
        'notes',
        'user_id',
    ];

    protected $casts = [
        'apply_cost_price' => 'boolean',
        'started_at' => 'datetime',
        'completed_at' => 'datetime',
    ];

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function billOfMaterial()
    {
        return $this->belongsTo(BillOfMaterial::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function items()
    {
        return $this->hasMany(ProductionOrderItem::class);
    }
}
