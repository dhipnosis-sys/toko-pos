"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Tags,
  Truck,
  Users,
  ClipboardList,
  BarChart3,
  FlaskConical,
  Factory,
  Settings,
  UserCog,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/types";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: ("owner" | "cashier" | "warehouse")[];
};

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["owner", "cashier", "warehouse"] },
  { href: "/pos", label: "Kasir (POS)", icon: ShoppingCart, roles: ["owner", "cashier"] },
  { href: "/products", label: "Produk", icon: Package, roles: ["owner", "warehouse"] },
  { href: "/categories", label: "Kategori", icon: Tags, roles: ["owner", "warehouse"] },
  { href: "/suppliers", label: "Supplier", icon: Truck, roles: ["owner", "warehouse"] },
  { href: "/customers", label: "Pelanggan", icon: Users, roles: ["owner", "cashier"] },
  { href: "/purchases", label: "Pembelian", icon: ClipboardList, roles: ["owner", "warehouse"] },
  { href: "/sales", label: "Penjualan", icon: BarChart3, roles: ["owner", "cashier"] },
  { href: "/reports", label: "Laporan", icon: BarChart3, roles: ["owner", "cashier"] },
  { href: "/bom", label: "Bill of Material", icon: FlaskConical, roles: ["owner", "warehouse"] },
  { href: "/production", label: "Produksi", icon: Factory, roles: ["owner", "warehouse"] },
  { href: "/settings", label: "Pengaturan", icon: Settings, roles: ["owner"] },
  { href: "/users", label: "Pengguna", icon: UserCog, roles: ["owner"] },
  { href: "/profile", label: "Profil", icon: UserCog, roles: ["owner", "cashier", "warehouse"] },
];

const roleLabels: Record<string, string> = {
  owner: "Owner",
  cashier: "Kasir",
  warehouse: "Gudang",
};

export function Sidebar({ profile }: { profile: Profile }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const items = NAV_ITEMS.filter((i) => i.roles.includes(profile.role));

  async function logout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  function NavList({ onNavigate }: { onNavigate?: () => void }) {
    return (
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {items.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                active
                  ? "bg-white/20 text-white"
                  : "text-emerald-50/80 hover:bg-white/10 hover:text-white"
              }`}
            >
              <item.icon className="w-5 h-5 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    );
  }

  function ProfileFooter({ onLogout }: { onLogout?: () => void }) {
    return (
      <div className="px-3 pb-4">
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-black/10">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">
              {profile.name}
            </p>
            <p className="text-xs text-emerald-100/70">
              {roleLabels[profile.role]}
            </p>
          </div>
          <button
            onClick={() => {
              onLogout?.();
              logout();
            }}
            title="Keluar"
            className="text-emerald-100/80 hover:text-white"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 inset-x-0 z-40 bg-emerald-800 text-white flex items-center justify-between px-4 py-3 shadow">
        <div className="flex items-center gap-2 font-semibold">
          <span className="text-lg">🧺</span> Warung Nuhahade
        </div>
        <button onClick={() => setOpen(true)} aria-label="Buka menu">
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 w-64 flex-col bg-gradient-to-b from-emerald-800 to-emerald-900 text-white">
        <div className="px-6 py-6 flex items-center gap-2 border-b border-white/10">
          <span className="text-2xl">🧺</span>
          <div>
            <p className="font-bold">Warung Nuhahade</p>
            <p className="text-xs text-emerald-100/70">POS &amp; Inventori</p>
          </div>
        </div>
        <NavList />
        <ProfileFooter />
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 w-72 flex flex-col bg-gradient-to-b from-emerald-800 to-emerald-900 text-white shadow-xl">
            <div className="px-4 py-4 flex items-center justify-between border-b border-white/10">
              <span className="font-bold">Warung Nuhahade</span>
              <button onClick={() => setOpen(false)} aria-label="Tutup menu">
                <X className="w-6 h-6" />
              </button>
            </div>
            <NavList onNavigate={() => setOpen(false)} />
            <ProfileFooter onLogout={() => setOpen(false)} />
          </aside>
        </div>
      )}
    </>
  );
}