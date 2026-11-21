"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AlertTriangle, Bluetooth, BluetoothConnected, Loader2, Printer, Trash2, CheckCircle, XCircle } from "lucide-react";
import { buildEscposReceipt, chunkBytes, type ReceiptData, type ReceiptFontSize } from "@/lib/escpos";

/** Known BLE thermal printer service UUIDs (common ones). */
const KNOWN_SERVICE_UUIDS = [
  // Nordic UART / many Chinese BLE printers
  "000018f0-0000-1000-8000-00805f9b34fb",
  // Generic custom service (Rongta, XPrinter, etc.)
  "0000ff00-0000-1000-8000-00805f9b34fb",
  "0000ffe0-0000-1000-8000-00805f9b34fb",
  // Microchip/ISSC
  "49535343-fe7d-4ae5-8fa9-9fafd205e455",
];

const STORAGE_KEY = "toko-selected-bluetooth-printer";
const FONT_SIZE_KEY = "toko-receipt-font-size";

/** Device info stored in localStorage (name + id) for auto-reconnect. */
type SavedPrinter = {
  name: string;
  id: string; // device.id (bluetooth device id, not stable across browsers, but okay for same browser)
};

/** Status untuk UI. */
type PrintStatus =
  | "idle"
  | "scanning"
  | "connecting"
  | "sending"
  | "success"
  | "error";

export function ReceiptPrinter({
  receipt,
}: {
  receipt: ReceiptData;
}) {
  const [status, setStatus] = useState<PrintStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [printerName, setPrinterName] = useState<string | null>(null);
  const [available, setAvailable] = useState<boolean | null>(null);
  const [isAndroid, setIsAndroid] = useState(false);
  const [rawbtStatus, setRawbtStatus] = useState<"idle" | "sending">("idle");
  const [fontSize, setFontSize] = useState<ReceiptFontSize>("large");
  const deviceRef = useRef<BluetoothDevice | null>(null);
  const charRef = useRef<BluetoothRemoteGATTCharacteristic | null>(null);

  // Check Bluetooth API availability
  useEffect(() => {
    const hasBT = "bluetooth" in navigator;
    setAvailable(hasBT);
    if (!hasBT) setError("Web Bluetooth tidak didukung di browser ini (butuh Chrome/Edge, HTTPS).");
    // Android detection (untuk tombol RawBT — bridge Bluetooth Classic SPP)
    setIsAndroid(/Android/i.test(navigator.userAgent));
  }, []);

  // Load saved printer name
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved: SavedPrinter = JSON.parse(raw);
        setPrinterName(saved.name);
      }
    } catch {
      /* ignore */
    }
    try {
      const saved = localStorage.getItem(FONT_SIZE_KEY);
      if (saved === "small" || saved === "normal" || saved === "large" || saved === "xlarge") {
        setFontSize(saved);
      }
    } catch {
      /* ignore */
    }
  }, []);

  /** Sanitize error for display. */
  const safeError = (e: unknown): string => {
    if (e instanceof DOMException) return e.name === "NotFoundError" ? "Tidak ada printer dipilih / tidak ditemukan." : e.message;
    if (e instanceof Error) return e.message;
    return String(e);
  };

  /** Delay helper. */
  const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

  /** Pilih ukuran huruf struk (disimpan agar tidak diatur ulang tiap cetak). */
  const changeFontSize = (value: ReceiptFontSize) => {
    setFontSize(value);
    try {
      localStorage.setItem(FONT_SIZE_KEY, value);
    } catch {
      /* ignore */
    }
  };

  /** Find writable characteristic in a service. */
  async function findWritableChar(service: BluetoothRemoteGATTService): Promise<BluetoothRemoteGATTCharacteristic | null> {
    const chars = await service.getCharacteristics();
    for (const c of chars) {
      if (c.properties.write || c.properties.writeWithoutResponse) {
        return c;
      }
    }
    return null;
  }

  /** Connect to device, discover service/char. */
  async function connectToDevice(device: BluetoothDevice): Promise<BluetoothRemoteGATTCharacteristic | null> {
    setStatus("connecting");
    await device.gatt?.connect();
    for (const uuid of KNOWN_SERVICE_UUIDS) {
      try {
        const service = await device.gatt?.getPrimaryService(uuid);
        if (service) {
          const char = await findWritableChar(service);
          if (char) return char;
        }
      } catch {
        /* service not found, try next */
      }
    }
    // Fallback: enumerate all services & characteristics
    const services = await device.gatt?.getPrimaryServices();
    if (services) {
      for (const svc of services) {
        const char = await findWritableChar(svc);
        if (char) return char;
      }
    }
    return null;
  }

  /** Write bytes in chunks (BLE MTU safe). */
  async function writeChunks(char: BluetoothRemoteGATTCharacteristic, bytes: Uint8Array): Promise<void> {
    const chunks = chunkBytes(bytes, 20); // safe MTU
    for (const chunk of chunks) {
      // Copy ke ArrayBuffer baru (TS: BufferSource butuh ArrayBuffer, bukan SharedArrayBuffer)
      const buffer = new ArrayBuffer(chunk.byteLength);
      new Uint8Array(buffer).set(chunk);
      if (char.properties.writeWithoutResponse) {
        await char.writeValueWithoutResponse(buffer);
      } else {
        await char.writeValue(buffer);
      }
      await delay(12); // breathing room for printer buffer
    }
  }

  /** Print via Web Bluetooth. */
  const printBluetooth = useCallback(async () => {
    if (!available) {
      setError("Bluetooth tidak tersedia.");
      return;
    }
    setError(null);
    setStatus("scanning");
    try {
      let device: BluetoothDevice | null = null;

      // If we have saved printer, try filter by name (faster, no picker)
      const savedName = printerName;
      if (savedName) {
        try {
          device = await navigator.bluetooth.requestDevice({
            filters: [{ name: savedName }],
            optionalServices: KNOWN_SERVICE_UUIDS,
          });
        } catch {
          // Saved printer not in range/available -> fall through to full picker
        }
      }

      // Full picker (user pilih by name)
      if (!device) {
        device = await navigator.bluetooth.requestDevice({
          acceptAllDevices: true,
          optionalServices: KNOWN_SERVICE_UUIDS,
        });
      }

      // Save chosen printer name for next time
      if (device.name) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ name: device.name, id: device.id }));
        setPrinterName(device.name);
      }

      // Connect & find writable char
      const char = await connectToDevice(device);
      if (!char) throw new Error("Tidak ditemukan service/characteristic yang bisa ditulis. Pastikan printer mendukung BLE thermal (bukan Bluetooth Classic SPP).");

      charRef.current = char;
      deviceRef.current = device;

      // Listen disconnect to cleanup
      device.addEventListener("gattserverdisconnected", () => {
        charRef.current = null;
        deviceRef.current = null;
      });

      // Build & send ESC/POS
      setStatus("sending");
      const payload = buildEscposReceipt(receipt, { fontSize });
      await writeChunks(char, payload);

      setStatus("success");
      setError(null);
      // Reset status after 3s
      setTimeout(() => setStatus("idle"), 3000);
    } catch (e) {
      const msg = safeError(e);
      console.error("[thermal-print] error:", e);
      setError(msg);
      setStatus("error");
    }
  }, [available, printerName, receipt, fontSize]);

  /** Fallback: browser print (CSS @page 58mm). */
  const printBrowser = useCallback(() => {
    window.print();
  }, []);

  /** Encode bytes to base64 (chunked, aman untuk data besar). */
  const bytesToBase64 = (bytes: Uint8Array): string => {
    let binary = "";
    const CHUNK = 0x2000; // 8192 — hindari stack overflow
    for (let i = 0; i < bytes.length; i += CHUNK) {
      binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
    }
    return btoa(binary);
  };

  /**
   * Cetak via RawBT (Android) — jembatan untuk printer Bluetooth Classic (SPP)
   * yang tidak bisa dijangkau Web Bluetooth / dialog print Android.
   * Format intent: rawbt:base64,<data> (dengan fallback Play Store).
   */
  const printRawBT = useCallback(() => {
    try {
      setError(null);
      setRawbtStatus("sending");
      const payload = buildEscposReceipt(receipt, { fontSize });
      const b64 = bytesToBase64(payload);
      const intentUrl = `intent:base64,${b64}#Intent;scheme=rawbt;package=ru.a402d.rawbtprinter;end;`;
      // Intent harus dipicu dari gesture user — ini di dalam onClick, jadi aman.
      window.location.href = intentUrl;
      setTimeout(() => setRawbtStatus("idle"), 2500);
    } catch (e) {
      setRawbtStatus("idle");
      const msg = safeError(e);
      console.error("[rawbt] error:", e);
      setError(msg);
      setStatus("error");
    }
  }, [receipt, fontSize]);

  /** Clear saved printer. */
  const clearSaved = () => {
    localStorage.removeItem(STORAGE_KEY);
    setPrinterName(null);
  };

  // Selector ukuran huruf struk (berlaku untuk RawBT & Web Bluetooth).
  const fontSizeSection = (
    <div className="rounded-lg border border-gray-200 bg-white p-3 space-y-2">
      <p className="text-xs font-medium text-gray-700">Ukuran tulisan struk</p>
      <div className="grid grid-cols-4 gap-1 rounded-lg bg-gray-100 p-1">
        {(
          [
            { key: "small", label: "Kecil" },
            { key: "normal", label: "Normal" },
            { key: "large", label: "Besar" },
            { key: "xlarge", label: "Ekstra" },
          ] as { key: ReceiptFontSize; label: string }[]
        ).map((opt) => (
          <button
            key={opt.key}
            type="button"
            onClick={() => changeFontSize(opt.key)}
            className={`rounded-md px-1 py-1.5 text-[11px] font-medium transition ${
              fontSize === opt.key
                ? "bg-white text-emerald-700 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
      <p className="text-[11px] leading-snug text-gray-500">
        Default <b>Besar</b> (2× tinggi). Pilih <b>Kecil</b> (Font B) kalau masih
        terlalu besar, atau <b>Ekstra</b> kalau kurang besar.
      </p>
    </div>
  );

  // Tombol RawBT (Android) — jembatan untuk printer Bluetooth Classic (SPP),
  // yang tidak bisa dijangkau Web Bluetooth maupun dialog print Android.
  const rawbtSection = isAndroid ? (
    <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 space-y-2">
      <p className="text-xs text-emerald-800 leading-snug">
        <b>Printer Bluetooth Classic (SPP)</b> — pakai aplikasi <b>RawBT</b> (gratis).
        Pairing printer di aplikasi RawBT dulu, lalu tekan tombol ini. Tanpa dialog PDF.
      </p>
      <button
        type="button"
        onClick={printRawBT}
        className="w-full flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700"
      >
        <Printer className="w-4 h-4" />
        {rawbtStatus === "sending" ? "Membuka RawBT…" : "Cetak via RawBT (Bluetooth)"}
      </button>
    </div>
  ) : null;

  // Render fallback + error info even when Web Bluetooth unavailable
  if (available === false) {
    return (
      <div className="space-y-3 no-print">
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-700 text-sm flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>Web Bluetooth tidak didukung di browser ini (butuh Chrome/Edge, HTTPS).</span>
        </div>
        {fontSizeSection}
        {rawbtSection}
        {/* Fallback */}
        <div className="border-t border-gray-200 pt-2">
          <p className="text-xs text-gray-500 mb-2 text-center">
            Gunakan cetak via browser (dialog sistem) — sudah diatur 58mm tanpa margin.
          </p>
          <button
            type="button"
            onClick={printBrowser}
            className="w-full flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <Printer className="w-4 h-4" />
            Cetak via Browser (Dialog)
          </button>
        </div>
      </div>
    );
  }

  // available === null (initial) atau true → render normal
  return (
    <div className="space-y-3 no-print">
      {fontSizeSection}
      {rawbtSection}

      {/* Bluetooth Print */}
      {available && (
        <>
          <button
            type="button"
            onClick={printBluetooth}
            disabled={status !== "idle" && status !== "error" && status !== "success"}
            className={`w-full flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition ${
              status === "sending" || status === "connecting"
                ? "bg-amber-500 text-white cursor-wait"
                : status === "success"
                ? "bg-emerald-600 text-white"
                : "bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
            }`}
          >
            {status === "sending" && <Loader2 className="w-4 h-4 animate-spin" />}
            {status === "connecting" && <Loader2 className="w-4 h-4 animate-spin" />}
            {status === "success" && <CheckCircle className="w-4 h-4" />}
            {status === "error" && <XCircle className="w-4 h-4" />}
            {(status === "idle" || status === "error") && <Printer className="w-4 h-4" />}
            <span className="truncate">
              {status === "idle"
                ? "Cetak ke Printer Bluetooth"
                : status === "scanning"
                ? "Memilih printer…"
                : status === "connecting"
                ? "Menghubungkan…"
                : status === "sending"
                ? "Mengirim data…"
                : status === "success"
                ? "Terkirim ✓"
                : "Gagal — coba lagi"}
            </span>
          </button>

          {/* Printer info & clear */}
          {printerName && (
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <BluetoothConnected className="w-3 h-3" />
                Terhubung ke: <span className="font-medium">{printerName}</span>
              </span>
              <button
                type="button"
                onClick={clearSaved}
                className="text-red-500 hover:underline"
                title="Ganti printer lain"
              >
                <Trash2 className="w-3 h-3 inline" />
              </button>
            </div>
          )}
        </>
      )}

      {/* Fallback */}
      <div className="border-t border-gray-200 pt-2">
        <p className="text-xs text-gray-500 mb-2 text-center">
          Catatan: dialog print Android tidak menampilkan printer Bluetooth. Untuk thermal
          Bluetooth, gunakan tombol <b>RawBT</b> di atas.
        </p>
        <button
          type="button"
          onClick={printBrowser}
          className="w-full flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <Printer className="w-4 h-4" />
          Cetak via Browser (Dialog)
        </button>
      </div>

      {/* Error message */}
      {error && status === "error" && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-red-700 text-sm flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}