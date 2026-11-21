/**
 * Helper VAPID yang AMAN diimpor dari client component.
 * Hanya membaca `NEXT_PUBLIC_*` (di-inline oleh Next.js) — tidak ada
 * akses ke secret di sini. Untuk kunci privat lihat `vapid-server.ts`.
 */

export function getVapidPublicKey(): string | null {
  return process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim() || null;
}

/** Konversi URL-safe base64 → Uint8Array (dipakai saat pushManager.subscribe). */
export function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i);
  return output;
}
