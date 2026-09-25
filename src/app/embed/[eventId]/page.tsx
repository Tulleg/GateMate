import { formatCurrency } from "@/lib/utils";

interface PageProps {
  params: Promise<{ eventId: string }>;
}

export default async function EmbedWidgetPage({ params }: PageProps) {
  const { eventId } = await params;

  return (
    <div className="bg-slate-900 text-white p-4 rounded-xl border border-slate-800 shadow-xl max-w-sm mx-auto">
      <div className="text-xs text-indigo-400 font-semibold mb-1">GateMate Embedded Checkout</div>
      <h2 className="text-lg font-bold mb-2">Event Ticket Widget ({eventId})</h2>
      <p className="text-xs text-slate-400 mb-4">Select ticket tier & purchase directly without leaving host site.</p>
      
      <div className="space-y-2 mb-4">
        <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex justify-between items-center text-sm">
          <span>Standard Pass</span>
          <span className="font-bold">{formatCurrency(2900)}</span>
        </div>
      </div>

      <button className="w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 font-medium text-sm text-white transition-colors">
        Checkout Now
      </button>
    </div>
  );
}
