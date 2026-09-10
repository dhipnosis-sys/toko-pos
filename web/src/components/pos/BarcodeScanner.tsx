"use client";

import { useEffect, useRef, useState } from "react";

export function BarcodeScanner({
  onScan,
  onClose,
}: {
  onScan: (code: string) => void;
  onClose: () => void;
}) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState("");
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let scanner: any = null;

    async function start() {
      try {
        if (!mountRef.current) return;
        const { Html5Qrcode } = await import("html5-qrcode");
        scanner = new Html5Qrcode("pos-scanner");
        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 220, height: 220 } },
          (decodedText: string) => {
            onScan(decodedText.trim());
            if (scanner) scanner.stop().catch(() => {});
            onClose();
          },
          () => {}
        );
        if (!cancelled) setScanning(true);
      } catch (e: any) {
        if (!cancelled) setError("Kamera tidak tersedia atau tidak diizinkan.");
      }
    }
    start();

    return () => {
      cancelled = true;
      if (scanner && scanner.isScanning) {
        scanner.stop().catch(() => {});
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-4 shadow-xl">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">
            {scanning ? "Arahkan kamera ke barcode" : "Menyiapkan kamera..."}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-sm text-gray-500 hover:bg-gray-100"
          >
            Tutup
          </button>
        </div>
        <div className="overflow-hidden rounded-xl bg-black">
          <div id="pos-scanner" ref={mountRef} />
        </div>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </div>
    </div>
  );
}