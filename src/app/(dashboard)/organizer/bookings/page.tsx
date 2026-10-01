import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/dashboard/sidebar";
import { BookingsClient } from "@/components/dashboard/bookings-client";

export const dynamic = "force-dynamic";

export default async function OrganizerBookingsPage() {
  const cookieStore = await cookies();
  const role = cookieStore.get("gatemate_role")?.value;
  if (role === "superadmin") {
    redirect("/admin");
  }

  let organizerId = cookieStore.get("gatemate_user_id")?.value;

  if (!organizerId) {
    if (process.env.ENABLE_DEMO_ACCOUNTS === "true") {
      organizerId = "user_organizer_01";
    } else {
      redirect("/login");
    }
  }

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-50">
      <Sidebar />

      <main className="flex-1 p-8 overflow-y-auto">
        <BookingsClient />
      </main>
    </div>
  );
}
