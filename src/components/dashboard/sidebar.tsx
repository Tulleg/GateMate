"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Ticket, LayoutDashboard, Calendar, QrCode, Shield, PlusCircle, Settings, Scale } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { name: "Overview", href: "/organizer", icon: LayoutDashboard },
  { name: "My Events", href: "/organizer/events", icon: Calendar },
  { name: "Create Event", href: "/organizer/events/new", icon: PlusCircle },
  { name: "Gate Check-In", href: "/check-in/evt_tech_conf_2026", icon: QrCode },
  { name: "Rechtliches & Impressum", href: "/organizer/settings/legal", icon: Scale },
  { name: "Settings", href: "/organizer/settings", icon: Settings },
  { name: "Superadmin", href: "/admin", icon: Shield },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between p-4 shrink-0 min-h-screen">
      <div className="space-y-6">
        {/* Brand Header */}
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="p-2 rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/30">
            <Ticket className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-white text-lg leading-none">GateMate</h2>
            <p className="text-xs text-slate-400 mt-1">Organizer Hub</p>
          </div>
        </div>

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
        </nav>
      </div>

      {/* User Profile Footer */}
      <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center font-bold text-xs text-white">
            EO
          </div>
          <div className="truncate">
            <p className="text-xs font-semibold text-white truncate">Demo Organizer</p>
            <p className="text-[10px] text-slate-400 truncate">organizer@gatemate.io</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
