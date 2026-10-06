import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, BookOpen, Building2, ShieldCheck } from "lucide-react";
import { formatLegalAddress } from "@/lib/legal";
import { MarkdownRenderer } from "@/components/ui/markdown-renderer";

interface PageProps {
  params: Promise<{ organizerSlug: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { organizerSlug } = await params;
  const records = await db.select().from(users).where(eq(users.organizerSlug, organizerSlug));
  const organizer = records[0];

  return {
    title: `Impressum | ${organizer?.legalName || organizer?.name || "Veranstalter"}`,
    description: `Impressum und Anbieterkennzeichnung von ${organizer?.legalName || organizer?.name}`,
  };
}

export default async function OrganizerImpressumPage({ params }: PageProps) {
  const { organizerSlug } = await params;

  const records = await db.select().from(users).where(eq(users.organizerSlug, organizerSlug));
  const organizer = records[0];

  if (!organizer) {
    notFound();
  }

  // 302 Redirect if configured as URL
  if (organizer.legalMode === "url" && organizer.impressumUrl && organizer.impressumUrl.trim()) {
    redirect(organizer.impressumUrl);
  }
  if (organizer.impressumUrl && organizer.impressumUrl.trim() && (!organizer.impressumContent || !organizer.impressumContent.trim())) {
    redirect(organizer.impressumUrl);
  }

  const defaultImpressumText = `# Impressum

**Angaben gemäß § 5 DDG / Art. 30 DSA (KYTC)**

${organizer.legalName || organizer.name || "Veranstalter"}  
${organizer.legalForm ? `Rechtsform: ${organizer.legalForm}\n` : ""}${organizer.street || ""}  
${organizer.zip || ""} ${organizer.city || ""}  
${organizer.country || "Deutschland"}  

**Kontakt:**  
E-Mail: ${organizer.email || "Siehe Veranstalterprofil"}  
${organizer.phone ? `Telefon: ${organizer.phone}\n` : ""}
${organizer.registrationCouncil || organizer.registrationNumber ? `**Registereintrag:**\n${[organizer.registrationCouncil, organizer.registrationNumber].filter(Boolean).join(", ")}\n` : ""}
${organizer.vatId ? `**Umsatzsteuer-ID:**\nUmsatzsteuer-Identifikationsnummer gemäß § 27 a Umsatzsteuergesetz: ${organizer.vatId}` : ""}
${organizer.isSmallBusiness ? "\n**Umsatzsteuer-Hinweis:**\nGemäß § 19 UStG wird keine Umsatzsteuer berechnet." : ""}
`;

  const contentToRender = organizer.impressumContent && organizer.impressumContent.trim()
    ? organizer.impressumContent
    : defaultImpressumText;

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
          <BookOpen className="w-5 h-5 text-indigo-400" />
          <span className="font-bold text-white text-sm">Impressum &amp; Anbieterkennzeichnung</span>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-5xl mx-auto px-4 sm:px-8 pt-10 space-y-8">
        {/* Profile Card */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 flex items-center gap-4 shadow-xl">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center font-bold text-lg">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">{organizer.legalName || organizer.name}</h1>
            <p className="text-xs text-slate-400 mt-0.5">{formatLegalAddress(organizer)}</p>
          </div>
        </div>

        {/* Impressum Document Body */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 space-y-6 shadow-2xl">
          <MarkdownRenderer content={contentToRender} />
        </div>

        {/* Footer Attribution */}
        <div className="text-center text-slate-500 text-xs pt-4 border-t border-slate-900 flex items-center justify-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-500" /> Hoster &amp; Technischer Dienstleister: GateMate Platform
        </div>
      </main>
    </div>
  );
}
