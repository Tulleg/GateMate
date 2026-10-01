"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Ticket,
  LayoutDashboard,
  Calendar,
  QrCode,
  Shield,
  PlusCircle,
  Settings,
  Scale,
  LogOut,
  Users,
  Receipt,
  Mail,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
}

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isAdmin, setIsAdmin] = useState(pathname.startsWith("/admin"));
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const isSuperAdmin = pathname.startsWith("/admin") || document.cookie.includes("gatemate_role=superadmin");
    if (isSuperAdmin) {
      setIsAdmin(true);
    }

    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated && data.user) {
          setUser(data.user);
          if (data.user.role === "superadmin") {
            setIsAdmin(true);
          }
        }
      })
      .catch(() => {});
  }, [pathname]);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/sign-out", { method: "POST" });
    } catch {
      // Ignore network errors during signout
    }
    router.push("/login");
  };

  const organizerNavItems = [
    { name: "Übersicht", href: "/organizer", icon: LayoutDashboard },
    { name: "Meine Events", href: "/organizer/events", icon: Calendar },
    { name: "Buchungen & Exporte", href: "/organizer/bookings", icon: Receipt },
    { name: "Event erstellen", href: "/organizer/events/new", icon: PlusCircle },
    { name: "Gate Check-In", href: "/organizer/events", icon: QrCode },
    { name: "Rechtliches & Impressum", href: "/organizer/settings/legal", icon: Scale },
    { name: "Einstellungen", href: "/organizer/settings", icon: Settings },
  ];

  const adminNavItems = [
    { name: "Superadmin Portal", href: "/admin", icon: Shield },
    { name: "Nachrichten & DSA", href: "/admin/messages", icon: Mail },
    { name: "User- & Rollenverwaltung", href: "/admin/users", icon: Users },
    { name: "Plattform-Rechtstexte", href: "/admin/legal", icon: Scale },
  ];

  const effectiveIsAdmin = isAdmin || pathname.startsWith("/admin");
  const navItems = effectiveIsAdmin ? adminNavItems : organizerNavItems;

  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : effectiveIsAdmin ? "SA" : "EO";

  const renderNavLinks = () => (
    <nav className="space-y-1">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setMobileMenuOpen(false)}
            className={cn(
              "flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-medium transition-all min-h-[44px]",
              isActive
                ? "bg-indigo-600/10 text-indigo-400 border border-indigo-500/20"
                : "text-slate-400 hover:text-white hover:bg-slate-800/60"
            )}
          >
            <Icon className={cn("w-4 h-4 shrink-0", isActive ? "text-indigo-400" : "text-slate-400")} />
            <span>{item.name}</span>
          </Link>
        );
      })}

      <button
        onClick={handleLogout}
        className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all text-left mt-2 border border-transparent hover:border-red-500/20 min-h-[44px]"
      >
        <LogOut className="w-4 h-4 text-red-400 shrink-0" />
        <span>Abmelden</span>
      </button>
    </nav>
  );

  const renderUserProfile = () => (
    <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 flex items-center justify-between gap-2">
      <div className="flex items-center gap-2 min-w-0">
        <div
          className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs text-white shrink-0",
            effectiveIsAdmin ? "bg-gradient-to-tr from-red-500 to-rose-600" : "bg-gradient-to-tr from-indigo-500 to-purple-500"
          )}
        >
          {initials}
        </div>
        <div className="truncate">
          <p className="text-xs font-semibold text-white truncate">
            {user?.name || (effectiveIsAdmin ? "GateMate Admin" : "Veranstalter")}
          </p>
          <p className="text-[10px] text-slate-400 truncate">
            {user?.email || (effectiveIsAdmin ? "admin" : "organizer")}
          </p>
        </div>
      </div>
      <button
        onClick={handleLogout}
        title="Abmelden"
        className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center"
      >
        <LogOut className="w-4 h-4" />
      </button>
    </div>
  );

  return (
    <>
      {/* Mobile Top Header (Visible on < 768px) */}
      <header className="md:hidden sticky top-0 z-40 w-full bg-slate-900/95 border-b border-slate-800 px-4 py-3 flex items-center justify-between backdrop-blur-md">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-indigo-600 text-white shadow-md shadow-indigo-600/30">
            <Ticket className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-white text-base leading-none">GateMate</h2>
            <p className="text-[10px] text-slate-400 mt-0.5">{effectiveIsAdmin ? "Admin-Portal" : "Veranstalter-Hub"}</p>
          </div>
        </Link>

        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-xl bg-slate-800 text-slate-200 hover:text-white border border-slate-700/80 transition-all min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label="Navigation öffnen"
        >
          {mobileMenuOpen ? <X className="w-5 h-5 text-indigo-400" /> : <Menu className="w-5 h-5 text-indigo-400" />}
        </button>
      </header>

      {/* Mobile Slide-over Drawer Backdrop & Drawer Container */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative w-72 max-w-[85vw] bg-slate-900 border-r border-slate-800 z-50 flex flex-col justify-between p-4 shadow-2xl overflow-y-auto">
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <Link href="/" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-indigo-600 text-white shadow-md shadow-indigo-600/30">
                    <Ticket className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-bold text-white text-base leading-none">GateMate</h2>
                    <p className="text-[10px] text-slate-400 mt-0.5">{effectiveIsAdmin ? "Admin-Portal" : "Veranstalter-Hub"}</p>
                  </div>
                </Link>

                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {renderNavLinks()}
            </div>

            <div className="pt-4 mt-auto border-t border-slate-800">
              {renderUserProfile()}
            </div>
          </div>
        </div>
      )}

      {/* Desktop Fixed Sidebar (Visible on >= 768px) */}
      <aside className="hidden md:flex w-64 bg-slate-900 border-r border-slate-800 flex-col justify-between p-4 shrink-0 min-h-screen">
        <div className="space-y-6">
          {/* Brand Header */}
          <Link href="/" className="flex items-center gap-3 px-2 py-2 hover:opacity-80 transition-opacity">
            <div className="p-2 rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/30">
              <Ticket className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-white text-lg leading-none">GateMate</h2>
              <p className="text-xs text-slate-400 mt-1">{effectiveIsAdmin ? "Admin-Portal" : "Veranstalter-Hub"}</p>
            </div>
          </Link>

          {/* Navigation Links */}
          {renderNavLinks()}
        </div>

        {/* User Profile Footer */}
        {renderUserProfile()}
      </aside>
    </>
  );
}

