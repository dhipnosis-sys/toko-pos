"use client";

import { useState } from "react";
import { ScanBarcode } from "lucide-react";
import { Label, Input } from "@/components/ui";
import { BarcodeScanner } from "@/components/pos/BarcodeScanner";

export default function BarcodeField({ defaultValue = "" }: { defaultValue?: string }) {
  const [value, setValue] = useState(defaultValue);
  const [showScanner, setShowScanner] = useState(false);

  return (
    <div>
      <Label htmlFor="barcode">Barcode</Label>
      <div className="flex gap-2">
        <Input
          id="barcode"
          name="barcode"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="scan / kode unik"
          className="flex-1"
        />
        <button
          type="button"
          onClick={() => setShowScanner(true)}
          title="Scan Barcode"
          className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <ScanBarcode size={16} />
          <span className="hidden sm:inline">Scan</span>
        </button>
      </div>
      {showScanner && (
        <BarcodeScanner
          onScan={(code) => {
            setValue(code);
            setShowScanner(false);
          }}
          onClose={() => setShowScanner(false)}
        />
      )}
    </div>
  );
}