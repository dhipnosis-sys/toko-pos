import { NextResponse } from "next/server";
import { checkAllOverdue } from "@/lib/notify-triggers";

/**
 * Vercel Cron — pengecekan piutang jatuh tempo.
 * Dijadwalkan harian oleh `vercel.json` dan diamankan dengan CRON_SECRET
 * (Vercel mengirim `Authorization: Bearer <CRON_SECRET>` otomatis).
 *
 * Catatan: pemicu utama tetap event-driven (checkout & pembayaran piutang),
 * jadi meski cron gagal/jalan, notifikasi tetap terkirim pada kasus nyata.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json(
      { ok: false, error: "CRON_SECRET belum diatur di environment." },
      { status: 503 }
    );
  }

  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const sent = await checkAllOverdue();
    return NextResponse.json({ ok: true, sent });
  } catch (err) {
    console.error("[cron] overdue-debt gagal:", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
