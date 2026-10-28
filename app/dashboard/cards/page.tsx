import { createClient } from "@/utils/supabase/server";
import CardsOrgsClient from "@/components/CardsOrgsClient";

export const dynamic = "force-dynamic";

export default async function CardsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: orgs } = await supabase
    .from("organizations")
    .select("id, slug, name, logo_url, primary_color, card_template, created_at")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  return <CardsOrgsClient initialOrgs={orgs || []} userId={user.id} />;
}
