/**
 * Kunci VAPID untuk sisi server SAJA.
 * `VAPID_PRIVATE_KEY` tidak boleh pernah sampai ke browser — jangan impor
 * file ini dari komponen client.
 */

export function getVapidKeys(): { publicKey: string; privateKey: string } | null {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim();
  const privateKey = process.env.VAPID_PRIVATE_KEY?.trim();
  if (!publicKey || !privateKey) return null;
  return { publicKey, privateKey };
}

// web-push menerima format mailto: atau https:
export function getVapidSubject(): string {
  return process.env.VAPID_SUBJECT?.trim() || "mailto:admin@warungnuhahade.shop";
}
