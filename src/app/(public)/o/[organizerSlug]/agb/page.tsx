import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, FileText, Building2, Hash } from "lucide-react";
import { formatLegalAddress } from "@/lib/legal";
import { getPublishedDocument } from "@/lib/legal-server";
import { MarkdownRenderer } from "@/components/ui/markdown-renderer";

interface PageProps {
  params: Promise<{ organizerSlug: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { organizerSlug } = await params;
  const records = await db.select().from(users).where(eq(users.organizerSlug, organizerSlug));
  const organizer = records[0];

  return {
    title: `AGB | ${organizer?.legalName || organizer?.name || "Veranstalter"}`,
    description: `Allgemeine Geschäftsbedingungen von ${organizer?.legalName || organizer?.name}`,
  };
}

export default async function OrganizerAgbPage({ params }: PageProps) {
  const { organizerSlug } = await params;

  const records = await db.select().from(users).where(eq(users.organizerSlug, organizerSlug));
  const organizer = records[0];

  if (!organizer) {
    notFound();
  }

  // Fetch published document entry if present
  const doc = await getPublishedDocument({ organizerId: organizer.id, documentType: "organizer_agb" });

  // 302 Redirect if configured as URL
  if (doc?.url || (organizer.legalMode === "url" && organizer.termsUrl)) {
    const redirectTarget = doc?.url || organizer.termsUrl;
    if (redirectTarget && redirectTarget.trim()) redirect(redirectTarget);
  }

  const defaultTermsText = `# Allgemeine Geschäftsbedingungen (AGB)

1. **Geltungsbereich**:
Diese Geschäftsbedingungen gelten für den Erwerb von Veranstaltungstickets bei ${organizer.legalName || organizer.name || "dem Veranstalter"}.

2. **Vertragspartner**:
Vertragspartner des Ticketkäufers ist:  
${organizer.legalName || organizer.name || "Veranstalter"}  
${organizer.street || ""}  
${organizer.zip || ""} ${organizer.city || ""}  

3. **Widerrufsrecht**:
Gemäß § 312g Abs. 2 Nr. 9 BGB besteht bei Dienstleistungen im Zusammenhang mit Freizeitbetätigungen, die für einen spezifischen Termin oder Zeitraum erbracht werden, kein Widerrufsrecht.
`;

  const contentToRender = doc?.content || organizer.termsContent || defaultTermsText;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 selection:bg-indigo-500 selection:text-white pb-20">
      {/* Header */}
      <header className="px-6 py-4 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-40 flex items-center justify-between">
        <Link
          href={`/o/${organizerSlug}`}
          className="flex items-center gap-2 text-slate-400 hover:text-white text-xs font-medium transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Zurück zum Veranstalterprofil
        </Link>
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-purple-400" />
          <span className="font-bold text-white text-sm">Allgemeine Geschäftsbedingungen (AGB)</span>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-10 space-y-8">
        {/* Profile Card */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center font-bold text-lg">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">{organizer.legalName || organizer.name}</h1>
              <p className="text-xs text-slate-400 mt-0.5">{formatLegalAddress(organizer)}</p>
            </div>
          </div>
          {doc && (
            <span className="px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-mono text-xs font-bold">
              Version {doc.version}
            </span>
          )}
        </div>

        {/* AGB Document Body */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 space-y-6 shadow-2xl">
          <MarkdownRenderer content={contentToRender} />

          {doc?.hash && (
            <div className="pt-4 border-t border-slate-800 text-[10px] text-slate-500 font-mono flex items-center gap-1.5">
              <Hash className="w-3.5 h-3.5 text-indigo-400 shrink-0" /> SHA-256 Hash: {doc.hash}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
