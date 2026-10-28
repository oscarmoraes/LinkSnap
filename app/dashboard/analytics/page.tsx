import { createClient } from "@/utils/supabase/server";
import { headers } from "next/headers";
import AnalyticsClient from "@/components/AnalyticsClient";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const [
    { data: profile },
    { data: links },
    { data: bioPages },
    { count: leadsCount },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("handle, brand_name, analytics_share_token")
      .eq("id", user.id)
      .single(),
    supabase
      .from("links")
      .select("id, short_code, long_url, title, clicks, source_type, link_scope, branded_handle")
      .eq("user_id", user.id)
      .order("clicks", { ascending: false }),
    supabase
      .from("bio_pages")
      .select("id, slug, title, views")
      .eq("user_id", user.id)
      .order("views", { ascending: false }),
    supabase
      .from("bio_leads")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id),
  ]);

  const linkIds = (links || []).map((l) => l.id);
  const bioIds = (bioPages || []).map((b) => b.id);

  const [{ data: clicks }, { data: bioBlocks }] = await Promise.all([
    linkIds.length > 0
      ? supabase
          .from("link_clicks")
          .select("id, link_id, clicked_at, referrer, country_code, device_type, browser")
          .in("link_id", linkIds)
          .order("clicked_at", { ascending: false })
          .limit(2000)
      : Promise.resolve({ data: [] }),
    bioIds.length > 0
      ? supabase
          .from("bio_blocks")
          .select("bio_id, clicks")
          .in("bio_id", bioIds)
      : Promise.resolve({ data: [] }),
  ]);

  const blockClicksByBio = new Map<string, number>();
  for (const block of bioBlocks || []) {
    blockClicksByBio.set(
      block.bio_id,
      (blockClicksByBio.get(block.bio_id) || 0) + (block.clicks || 0)
    );
  }

  const biosSummary = (bioPages || []).map((b) => ({
    id: b.id,
    slug: b.slug,
    title: b.title || b.slug,
    views: b.views || 0,
    totalBlockClicks: blockClicksByBio.get(b.id) || 0,
  }));

  const headersList = headers();
  const host = headersList.get("host") || "localhost:3000";
  const protocol = headersList.get("x-forwarded-proto") || "http";
  const origin = `${protocol}://${host}`;

  const userHandle = profile?.handle || user.email?.split("@")[0] || "user";
  const brandName = profile?.brand_name || "linkSnap";

  return (
    <AnalyticsClient
      userId={user.id}
      userHandle={userHandle}
      brandName={brandName}
      initialShareToken={profile?.analytics_share_token || null}
      origin={origin}
      links={links || []}
      clicks={clicks || []}
      bios={biosSummary}
      leadsCount={leadsCount || 0}
      isPublicReport={false}
    />
  );
}
