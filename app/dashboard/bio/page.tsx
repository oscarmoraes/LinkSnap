import { createClient } from "@/utils/supabase/server";
import { headers } from "next/headers";
import BioListClient from "@/components/BioListClient";

export const dynamic = "force-dynamic";

export default async function BioPage({
  searchParams,
}: {
  searchParams?: { tab?: string };
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const [profileRes, biosRes, leadsRes] = await Promise.all([
    supabase.from("profiles").select("handle, plan_tier").eq("id", user.id).single(),
    supabase
      .from("bio_pages")
      .select("id, slug, title, description, layout, is_primary, is_active, views, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("bio_leads")
      .select("id, bio_page_id, name, contact, message, created_at, bio_pages(title, slug)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
  ]);

  const handle = profileRes.data?.handle || user.email?.split("@")[0] || "user";
  const planTier = profileRes.data?.plan_tier || "free";
  const bios = biosRes.data || [];
  const leads = (leadsRes.data || []) as any;

  const headersList = headers();
  const host = headersList.get("host") || "localhost:3000";
  const protocol = headersList.get("x-forwarded-proto") || "http";
  const origin = `${protocol}://${host}`;

  return (
    <BioListClient
      initialBios={bios}
      initialLeads={leads}
      handle={handle}
      origin={origin}
      userId={user.id}
      planTier={planTier}
      defaultTab={searchParams?.tab === "leads" ? "leads" : "bios"}
    />
  );
}
