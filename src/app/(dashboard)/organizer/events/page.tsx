import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { events, ticketTiers, orders } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { Sidebar } from "@/components/dashboard/sidebar";
import { EventsList } from "@/components/dashboard/events-list";
import Link from "next/link";
import { PlusCircle } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function OrganizerEventsPage() {
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

  const organizerEvents = await db
    .select()
    .from(events)
    .where(eq(events.organizerId, organizerId))
    .orderBy(desc(events.createdAt));


  const eventsWithStats = await Promise.all(
    organizerEvents.map(async (event) => {
      const tiers = await db.select().from(ticketTiers).where(eq(ticketTiers.eventId, event.id));
      const eventOrders = await db.select().from(orders).where(eq(orders.eventId, event.id));

      const eventRevenue = eventOrders.reduce((acc, o) => acc + (o.status === "completed" ? o.totalCents : 0), 0);
      const eventSold = tiers.reduce((acc, t) => acc + t.quantitySold, 0);

      return {
        ...event,
        tiers,
        eventRevenue,
        eventSold,
      };
    })
  );

  return (
    <div className="flex flex-col md:flex-row min-h-dvh bg-slate-950 text-slate-50 overflow-x-hidden">
      <Sidebar />

      <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-8 overflow-y-auto min-w-0">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white">Event-Verwaltung</h1>
            <p className="text-sm text-slate-400 mt-1">
              Events erstellen, Ticket-Kategorien konfigurieren, Iframe-Widgets nutzen und Gate-Scanner starten.
            </p>
          </div>
          <Link
            href="/organizer/events/new"
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs flex items-center gap-2 shadow-lg shadow-indigo-600/20 transition-all self-start md:self-auto"
          >
            <PlusCircle className="w-4 h-4" /> Neues Event erstellen
          </Link>
        </div>

        <EventsList events={eventsWithStats} />
      </main>
    </div>
  );
}
