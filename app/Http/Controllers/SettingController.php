<?php

namespace App\Http\Controllers;

use App\Models\Setting;
use Illuminate\Http\Request;

class SettingController extends Controller
{
    public function index()
    {
        $settings = Setting::pluck('value', 'key')->toArray();
        return view('settings.index', compact('settings'));
    }

    public function update(Request $request)
    {
        $request->validate([
            'store_name' => 'required|string|max:255',
            'store_address' => 'nullable|string',
            'store_phone' => 'nullable|string|max:50',
            'store_email' => 'nullable|email|max:255',
            'tax_rate' => 'nullable|integer|min:0|max:100',
            'currency' => 'nullable|string|max:10',
            'receipt_footer' => 'nullable|string',
        ]);

        foreach ($request->all() as $key => $value) {
            if (in_array($key, ['_token', '_method'])) continue;
            Setting::updateOrCreate(
                ['key' => $key],
                ['value' => $value ?? '']
            );
        }

        return redirect()->route('settings.index')->with('success', __('app.success_updated', ['data' => __('app.settings')]));
    }
}
