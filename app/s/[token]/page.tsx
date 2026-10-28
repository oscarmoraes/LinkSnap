import { createClient } from "@/utils/supabase/server";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import AnalyticsClient from "@/components/AnalyticsClient";
import Link from "next/link";
import { BarChart3 } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function SharedAnalyticsReportPage({
  params,
}: {
  params: { token: string };
}) {
  const supabase = await createClient();

  const { data: report, error } = await supabase.rpc(
    "get_shared_analytics_report",
    { p_token: params.token }
  );

  if (error || !report) {
    notFound();
  }

  const headersList = headers();
  const host = headersList.get("host") || "localhost:3000";
  const protocol = headersList.get("x-forwarded-proto") || "http";
  const origin = `${protocol}://${host}`;

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-zinc-900">
      <header className="sticky top-0 z-30 border-b border-zinc-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
              <BarChart3 className="h-4 w-4" />
            </div>
            <div>
              <span className="text-sm font-bold text-zinc-900">
                {report.brandName || "linkSnap"}
              </span>
              <span className="ml-2 rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700 border border-blue-200">
                Relatório Compartilhado
              </span>
            </div>
          </div>

          <Link
            href="/"
            className="text-xs font-medium text-zinc-500 hover:text-zinc-900 transition-colors"
          >
            Criado com linkSnap
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <AnalyticsClient
          userId={report.userId}
          userHandle={report.userHandle}
          brandName={report.brandName}
          initialShareToken={params.token}
          origin={origin}
          links={report.links || []}
          clicks={report.clicks || []}
          bios={report.bios || []}
          leadsCount={report.leadsCount || 0}
          isPublicReport={true}
        />
      </main>
    </div>
  );
}
