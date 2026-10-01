"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Ticket, LayoutDashboard, Calendar, QrCode, Shield, PlusCircle, Settings, Scale, LogOut, Users, Receipt } from "lucide-react";
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
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const isSuperAdmin = pathname.startsWith("/admin") || document.cookie.includes("gatemate_role=superadmin");
    setIsAdmin(isSuperAdmin);

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

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/sign-out", { method: "POST" });
    } catch {
      // Ignore network errors during signout
    }
    router.push("/login");
  };

  const organizerNavItems = [
    { name: "Overview", href: "/organizer", icon: LayoutDashboard },
    { name: "My Events", href: "/organizer/events", icon: Calendar },
    { name: "Buchungen & Exporte", href: "/organizer/bookings", icon: Receipt },
    { name: "Create Event", href: "/organizer/events/new", icon: PlusCircle },
    { name: "Gate Check-In", href: "/organizer/events", icon: QrCode },
    { name: "Rechtliches & Impressum", href: "/organizer/settings/legal", icon: Scale },
    { name: "Settings", href: "/organizer/settings", icon: Settings },
  ];

  const adminNavItems = [
    { name: "Superadmin Portal", href: "/admin", icon: Shield },
    { name: "User- & Rollenverwaltung", href: "/admin/users", icon: Users },
    { name: "Plattform-Rechtstexte", href: "/admin/legal", icon: Scale },
  ];

  const navItems = isAdmin ? adminNavItems : organizerNavItems;

  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : isAdmin ? "SA" : "EO";

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between p-4 shrink-0 min-h-screen">
      <div className="space-y-6">
        {/* Brand Header */}
        <Link href="/" className="flex items-center gap-3 px-2 py-2 hover:opacity-80 transition-opacity">
          <div className="p-2 rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/30">
            <Ticket className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-white text-lg leading-none">GateMate</h2>
            <p className="text-xs text-slate-400 mt-1">{isAdmin ? "Admin Portal" : "Organizer Hub"}</p>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                  isActive
                    ? "bg-indigo-600/10 text-indigo-400 border border-indigo-500/20"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                )}
              >
                <Icon className={cn("w-4 h-4", isActive ? "text-indigo-400" : "text-slate-400")} />
                {item.name}
              </Link>
            );
          })}

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all text-left mt-2 border border-transparent hover:border-red-500/20"
          >
            <LogOut className="w-4 h-4 text-red-400" />
            Abmelden
          </button>
        </nav>
      </div>

      {/* User Profile Footer */}
      <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs text-white shrink-0",
            isAdmin ? "bg-gradient-to-tr from-red-500 to-rose-600" : "bg-gradient-to-tr from-indigo-500 to-purple-500"
          )}>
            {initials}
          </div>
          <div className="truncate">
            <p className="text-xs font-semibold text-white truncate">
              {user?.name || (isAdmin ? "GateMate Admin" : "Veranstalter")}
            </p>
            <p className="text-[10px] text-slate-400 truncate">
              {user?.email || (isAdmin ? "admin" : "organizer")}
            </p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          title="Abmelden"
          className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors shrink-0"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
}
