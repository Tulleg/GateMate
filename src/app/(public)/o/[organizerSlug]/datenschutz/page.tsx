import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ShieldCheck, Building2 } from "lucide-react";
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
    title: `Datenschutzerklärung | ${organizer?.legalName || organizer?.name || "Veranstalter"}`,
    description: `Datenschutzerklärung und Hinweise zur Datenverarbeitung von ${organizer?.legalName || organizer?.name}`,
  };
}

export default async function OrganizerDatenschutzPage({ params }: PageProps) {
  const { organizerSlug } = await params;

  const records = await db.select().from(users).where(eq(users.organizerSlug, organizerSlug));
  const organizer = records[0];

  if (!organizer) {
    notFound();
  }

  // 302 Redirect if configured as URL
  if (organizer.legalMode === "url" && organizer.privacyUrl && organizer.privacyUrl.trim()) {
    redirect(organizer.privacyUrl);
  }
  if (organizer.privacyUrl && organizer.privacyUrl.trim() && (!organizer.privacyContent || !organizer.privacyContent.trim())) {
    redirect(organizer.privacyUrl);
  }

  const defaultPrivacyText = `# Datenschutzerklärung

Wir nehmen den Schutz Ihrer persönlichen Daten sehr ernst. Nachfolgend informieren wir Sie über die Erhebung und Verarbeitung personenbezogener Daten beim Ticketkauf über GateMate.

1. **Verantwortlicher**:
${organizer.legalName || organizer.name || "Veranstalter"}  
${organizer.street || ""}  
${organizer.zip || ""} ${organizer.city || ""}  
E-Mail: ${organizer.email || "Siehe Veranstalterprofil"}  

2. **Datenverarbeitung beim Ticketkauf**:
Beim Kauf von Eintrittskarten erheben wir Ihren Namen und Ihre E-Mail-Adresse zur Erfüllung des Kaufvertrags und der Ticketzustellung (Art. 6 Abs. 1 lit. b DSGVO).

3. **Zahlungsabwicklung**:
Die Zahlungsabwicklung erfolgt über den zertifizierten Zahlungsdienstleister Stripe.
`;

  const contentToRender = organizer.privacyContent && organizer.privacyContent.trim()
    ? organizer.privacyContent
    : defaultPrivacyText;

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
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          <span className="font-bold text-white text-sm">Datenschutzerklärung</span>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-10 space-y-8">
        {/* Profile Card */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 flex items-center gap-4 shadow-xl">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center font-bold text-lg">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">{organizer.legalName || organizer.name}</h1>
            <p className="text-xs text-slate-400 mt-0.5">{formatLegalAddress(organizer)}</p>
          </div>
        </div>

        {/* Datenschutz Document Body */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 space-y-6 shadow-2xl">
          <MarkdownRenderer content={contentToRender} />
        </div>
      </main>
    </div>
  );
}
