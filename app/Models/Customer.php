<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Customer extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'phone',
        'email',
        'address',
        'city',
        'debt_limit',
        'total_purchases',
        'total_paid',
        'total_debt',
        'notes',
    ];

    public function sales()
    {
        return $this->hasMany(Sale::class);
    }
}
