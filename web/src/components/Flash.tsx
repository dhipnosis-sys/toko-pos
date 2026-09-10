import Link from "next/link";
import type { ReactNode } from "react";

const messages: Record<string, string> = {
  saved: "Berhasil disimpan",
  updated: "Perubahan tersimpan",
  deleted: "Data dihapus",
  processed: "Produksi diproses",
  cancelled: "Produksi dibatalkan",
  cost: "HPP berhasil diterapkan ke produk",
  logout: "Berhasil keluar",
  name: "Nama wajib diisi",
  sku: "SKU wajib diisi",
  unit: "Unit produk tidak valid",
  items: "Minimal satu item wajib diisi",
  bom: "Resep / BOM wajib dipilih",
  qty: "Jumlah harus angka valid dan lebih dari 0",
  required: "Semua kolom wajib diisi dengan benar",
  role: "Role tidak valid atau operasi tidak diizinkan",
  self: "Tidak dapat menghapus akun sendiri",
  inuse: "Data sudah dipakai di transaksi lain, tidak bisa dihapus",
  completed: "Produksi selesai tidak bisa dihapus",
  inactive: "Akun Anda dinonaktifkan. Hubungi pemilik toko.",
  invalid: "Kredensial tidak valid",
  amount: "Nominal harus lebih dari 0",
  digital: "Transaksi digital tersimpan",
  topup: "Saldo modal ditambah",
  type: "Jenis digital tersimpan",
  category: "Kategori wajib dipilih",
  empty: "Belum ada data",
};

function decodeParam(value: string | string[] | undefined): string {
  if (!value) return "";
  if (Array.isArray(value)) return value[0] || "";
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

async function loadParams(searchParams: Promise<Record<string, string | string[] | undefined>>) {
  const sp = await searchParams;
  return {
    ok: decodeParam(sp.ok),
    err: decodeParam(sp.err),
  };
}

export async function Flash({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { ok, err } = await loadParams(searchParams);
  if (!ok && !err) return null;

  if (ok) {
    return (
      <div className="mb-5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
        {messages[ok] || ok}
      </div>
    );
  }

  return (
    <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      {messages[err] || err}
    </div>
  );
}

export function LinkBack({ href, label = "Kembali" }: { href: string; label?: string }) {
  return (
    <Link
      href={href}
      className="rounded-lg bg-white border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
    >
      {label}
    </Link>
  );
}

export function Table({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 text-sm">{children}</table>
    </div>
  );
}

export function THead({ children }: { children: ReactNode }) {
  return (
    <thead className="bg-gray-50">
      <tr>{children}</tr>
    </thead>
  );
}

export function Th({ children, right }: { children?: ReactNode; right?: boolean }) {
  return (
    <th
      className={`px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 ${
        right ? "text-right" : "text-left"
      }`}
    >
      {children}
    </th>
  );
}

export function Td({ children, right, colSpan }: { children?: ReactNode; right?: boolean; colSpan?: number }) {
  return (
    <td
      colSpan={colSpan}
      className={`px-4 py-3 whitespace-nowrap text-gray-700 ${right ? "text-right" : ""}`}
    >
      {children}
    </td>
  );
}