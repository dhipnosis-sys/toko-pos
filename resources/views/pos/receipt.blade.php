@php
    $storeName = \App\Models\Setting::getValue('store_name', config('app.name'));
    $storeAddress = \App\Models\Setting::getValue('store_address');
    $storePhone = \App\Models\Setting::getValue('store_phone');
    $receiptFooter = \App\Models\Setting::getValue('receipt_footer', __('app.thank_you'));
@endphp
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>@lang('app.receipt') - {{ $sale->invoice_number }}</title>
    <style>
        body {
            font-family: 'Courier New', monospace;
            font-size: 12px;
            width: 280px;
            margin: 0 auto;
            padding: 10px;
        }
        .header { text-align: center; margin-bottom: 10px; }
        .header h3 { margin: 0; }
        .footer { text-align: center; margin-top: 8px; }
        table { width: 100%; border-collapse: collapse; }
        td, th { padding: 4px 2px; }
        .text-center { text-align: center; }
        .text-end { text-align: right; }
        hr { border-top: 1px dashed #000; }
    </style>
</head>
<body>
    <div class="header">
        <h3>{{ $storeName }}</h3>
        @if($storeAddress)<small>{{ $storeAddress }}</small><br>@endif
        @if($storePhone)<small>{{ $storePhone }}</small><br>@endif
        <small>@lang('app.receipt')</small><br>
        <small>{{ $sale->created_at->format('d/m/Y H:i') }}</small><br>
        <small>@lang('app.invoice'): {{ $sale->invoice_number }}</small><br>
        <small>@lang('app.cashier'): {{ $sale->user->name ?? '-' }}</small>
        @if($sale->customer)
            <br><small>@lang('app.customer'): {{ $sale->customer->name }}</small>
        @endif
    </div>
    <hr>
    <table>
        <tr><th>@lang('app.item')</th><th class="text-center">@lang('app.quantity')</th><th class="text-end">@lang('app.unit_price')</th><th class="text-end">@lang('app.total')</th></tr>
        @foreach($sale->items as $item)
        <tr>
            <td>{{ $item->product->name ?? '-' }}</td>
            <td class="text-center">{{ $item->quantity }}</td>
            <td class="text-end">Rp {{ number_format($item->unit_price, 0, ',', '.') }}</td>
            <td class="text-end">Rp {{ number_format($item->subtotal, 0, ',', '.') }}</td>
        </tr>
        @endforeach
    </table>
    <hr>
    <div style="display:flex;justify-content:space-between;">
        <span>@lang('app.subtotal')</span>
        <span>Rp {{ number_format($sale->subtotal, 0, ',', '.') }}</span>
    </div>
    @if($sale->discount > 0)
    <div style="display:flex;justify-content:space-between;">
        <span>@lang('app.discount')</span>
        <span>Rp {{ number_format($sale->discount, 0, ',', '.') }}</span>
    </div>
    @endif
    <div style="display:flex;justify-content:space-between;">
        <strong>@lang('app.grand_total')</strong>
        <strong>Rp {{ number_format($sale->grand_total, 0, ',', '.') }}</strong>
    </div>
    <hr>
    <div style="display:flex;justify-content:space-between;">
        <span>@lang('app.paid')</span>
        <span>Rp {{ number_format($sale->paid_amount, 0, ',', '.') }}</span>
    </div>
    <div style="display:flex;justify-content:space-between;">
        <span>@lang('app.change')</span>
        <span>Rp {{ number_format($sale->change_amount, 0, ',', '.') }}</span>
    </div>
    <hr>
    <div class="header">
        <small>@lang('app.payment_method'): {{ ucfirst($sale->payment_method) }}</small>
    </div>
    @if($receiptFooter)
    <div class="footer">
        <small>{{ $receiptFooter }}</small>
    </div>
    @endif
    <script>window.print();</script>
</body>
</html>
