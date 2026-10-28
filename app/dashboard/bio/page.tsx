import { createClient } from "@/utils/supabase/server";
import { headers } from "next/headers";
import BioListClient from "@/components/BioListClient";

export const dynamic = "force-dynamic";

export default async function BioPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const [profileRes, biosRes] = await Promise.all([
    supabase.from("profiles").select("handle").eq("id", user.id).single(),
    supabase
      .from("bio_pages")
      .select("id, slug, title, description, layout, is_primary, is_active, views, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
  ]);

  const handle = profileRes.data?.handle || user.email?.split("@")[0] || "user";
  const bios = biosRes.data || [];

  const headersList = headers();
  const host = headersList.get("host") || "localhost:3000";
  const protocol = headersList.get("x-forwarded-proto") || "http";
  const origin = `${protocol}://${host}`;

  return (
    <BioListClient
      initialBios={bios}
      handle={handle}
      origin={origin}
      userId={user.id}
    />
  );
}
