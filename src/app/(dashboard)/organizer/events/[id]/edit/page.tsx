import { Sidebar } from "@/components/dashboard/sidebar";
import { EditEventForm } from "@/components/dashboard/edit-event-form";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditEventPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-50">
      <Sidebar />

      <main className="flex-1 p-8 space-y-8 overflow-y-auto">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Event bearbeiten</h1>
          <p className="text-sm text-slate-400 mt-1">
            Passen Sie Event-Details, Ticket-Kontingente und Veröffentlichungseinstellungen an oder stornieren Sie das Event.
          </p>
        </div>

        <EditEventForm eventId={id} />
      </main>
    </div>
  );
}
