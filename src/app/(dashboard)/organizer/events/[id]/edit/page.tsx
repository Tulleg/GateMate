import { Sidebar } from "@/components/dashboard/sidebar";
import { EditEventForm } from "@/components/dashboard/edit-event-form";
import { getPlatformFeePercent } from "@/lib/platform-settings";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditEventPage({ params }: PageProps) {
  const { id } = await params;
  const platformFeePercent = await getPlatformFeePercent();

  return (
    <div className="flex flex-col md:flex-row min-h-dvh md:h-dvh md:overflow-hidden bg-slate-950 text-slate-50">
      <Sidebar />

      <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-8 overflow-y-auto min-w-0 md:h-full">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Event bearbeiten</h1>
          <p className="text-sm text-slate-400 mt-1">
            Passen Sie Event-Details, Ticket-Kontingente und Veröffentlichungseinstellungen an oder stornieren Sie das Event.
          </p>
        </div>

        <EditEventForm eventId={id} platformFeePercent={platformFeePercent} />
      </main>
    </div>
  );
}
