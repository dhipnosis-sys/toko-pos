import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Deteksi offline + retry otomatis navigasi/prefetch/Server Action yang
    // gagal karena jaringan. Juga mengekspos hook `useOffline` dari next/offline.
    useOffline: true,
  },

  async headers() {
    return [
      {
        // Service worker tidak boleh di-cache browser/CDN agar update
        // segera terdeteksi.
        source: "/sw.js",
        headers: [
          {
            key: "Content-Type",
            value: "application/javascript; charset=utf-8",
          },
          {
            key: "Cache-Control",
            value: "no-cache, no-store, must-revalidate",
          },
        ],
      },
      {
        source: "/manifest.webmanifest",
        headers: [
          {
            key: "Content-Type",
            value: "application/manifest+json; charset=utf-8",
          },
          {
            key: "Cache-Control",
            value: "no-cache, must-revalidate",
          },
        ],
      },
      {
        source: "/offline.html",
        headers: [
          {
            key: "Cache-Control",
            value: "no-cache, must-revalidate",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
