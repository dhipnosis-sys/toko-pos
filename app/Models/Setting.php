<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;

class Setting extends Model
{
    use HasFactory;

    protected $fillable = [
        'key',
        'value',
    ];

    public static function getValue(string $key, mixed $default = ''): mixed
    {
        return static::where('key', $key)->value('value') ?? $default;
    }

    public static function getAll(): array
    {
        return static::pluck('value', 'key')->toArray();
    }
}
