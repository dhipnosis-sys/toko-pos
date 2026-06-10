<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Payment extends Model
{
    use HasFactory;

    protected $fillable = [
        'payable_type',
        'payable_id',
        'amount',
        'payment_method',
        'notes',
    ];

    public function payable()
    {
        return $this->morphTo();
    }
}
