/**
 * Fallback loading untuk semua halaman di dalam App Shell.
 * Selain menampilkan skeleton saat navigasi, file ini juga memastikan
 * sidebar / top bar tetap terlihat ketika perangkat sedang offline
 * (request navigasi ditahan oleh `experimental.useOffline` sampai online).
 */
export default function Loading() {
  return (
    <div className="animate-pulse" aria-busy="true">
      <div className="h-7 w-48 rounded-lg bg-slate-200" />
      <div className="mt-2 h-4 w-72 max-w-full rounded bg-slate-200" />

      <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="h-3 w-20 rounded bg-slate-200" />
            <div className="mt-3 h-6 w-24 rounded bg-slate-200" />
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-4">
        <div className="h-4 w-32 rounded bg-slate-200" />
        <div className="mt-4 space-y-3">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="h-4 w-full rounded bg-slate-100" />
          ))}
        </div>
      </div>
    </div>
  );
}
