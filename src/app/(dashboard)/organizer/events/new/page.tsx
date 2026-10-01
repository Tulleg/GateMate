import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/dashboard/sidebar";
import { EventForm } from "@/components/dashboard/event-form";

export default async function CreateEventPage() {
  const cookieStore = await cookies();
  const role = cookieStore.get("gatemate_role")?.value;

  if (role === "superadmin") {
    redirect("/admin");
  }

  return (
    <div className="flex flex-col md:flex-row min-h-dvh bg-slate-950 text-slate-50 overflow-x-hidden">
      <Sidebar />

      <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-8 overflow-y-auto min-w-0">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Neues Event erstellen</h1>
          <p className="text-sm text-slate-400 mt-1">
            Event-Details, Veranstaltungsort, Bannerbild und individuelle Ticket-Kategorien konfigurieren.
          </p>
        </div>

        <EventForm />
      </main>
    </div>
  );
}
