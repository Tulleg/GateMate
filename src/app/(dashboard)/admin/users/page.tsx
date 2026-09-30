import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { users } from "@/db/schema";
import { Sidebar } from "@/components/dashboard/sidebar";
import { UserManagementTable } from "@/components/dashboard/user-management-table";
import { Users, ShieldCheck, Shield, Scale } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const cookieStore = await cookies();
  const role = cookieStore.get("gatemate_role")?.value;

  // Access control: strictly restrict to superadmin
  if (role !== "superadmin") {
    redirect("/login");
  }

  const allUsersList = await db.select().from(users);

  const formattedUsers = allUsersList.map((u) => ({
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role as "superadmin" | "organizer",
    organizerSlug: u.organizerSlug,
    stripeConnectedAccountId: u.stripeConnectedAccountId,
    createdAt: u.createdAt ? u.createdAt.toISOString() : new Date().toISOString(),
  }));

  const superadminsCount = formattedUsers.filter((u) => u.role === "superadmin").length;
  const organizersCount = formattedUsers.filter((u) => u.role === "organizer").length;

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-50">
      <Sidebar />

      <main className="flex-1 p-8 space-y-8 overflow-y-auto">
        {/* Page Header */}
        <div className="border-b border-slate-800/80 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-extrabold tracking-tight text-white">Userverwaltung &amp; Rechtesteuerung</h1>
              <span className="px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Platform Admin
              </span>
            </div>
            <p className="text-sm text-slate-400 mt-1">
              Zentrale Verwaltung aller Plattform-Benutzer, Systemrollen (Superadmin, Organizer) und Zugangsdaten.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs flex items-center gap-2 border border-slate-700 transition-colors"
            >
              <Shield className="w-4 h-4 text-red-400" /> Superadmin Portal
            </Link>
            <Link
              href="/admin/legal"
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs flex items-center gap-2 border border-slate-700 transition-colors"
            >
              <Scale className="w-4 h-4 text-emerald-400" /> Plattform-Rechtstexte
            </Link>
          </div>
        </div>

        {/* User Role Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
            <div className="flex justify-between items-center text-slate-400 text-xs font-semibold uppercase tracking-wider">
              <span>Superadmins</span>
              <Shield className="w-4 h-4 text-red-400" />
            </div>
            <p className="text-2xl font-bold text-white">{superadminsCount}</p>
            <p className="text-[11px] text-red-400">Vollzugriff / Root Kontrolle</p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
            <div className="flex justify-between items-center text-slate-400 text-xs font-semibold uppercase tracking-wider">
              <span>Organizers</span>
              <Users className="w-4 h-4 text-indigo-400" />
            </div>
            <p className="text-2xl font-bold text-white">{organizersCount}</p>
            <p className="text-[11px] text-indigo-400">Veranstalter-Konten</p>
          </div>
        </div>

        {/* User Management Table */}
        <UserManagementTable initialUsers={formattedUsers} />
      </main>
    </div>
  );
}
