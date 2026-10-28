import { createClient } from "@/utils/supabase/server";
import { headers } from "next/headers";
import LinksManagerClient from "@/components/LinksManagerClient";

export const dynamic = "force-dynamic";

export default async function LinksPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const [{ data: links }, { data: profile }] = await Promise.all([
    supabase
      .from("links")
      .select("id, short_code, long_url, title, clicks, is_custom_slug, tags, pinned, archived, source_type, link_scope, branded_handle, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("profiles")
      .select("handle")
      .eq("id", user.id)
      .single(),
  ]);

  const headersList = headers();
  const host = headersList.get("host") || "localhost:3000";
  const protocol = headersList.get("x-forwarded-proto") || "http";
  const origin = `${protocol}://${host}`;

  const userHandle = profile?.handle || user.email?.split("@")[0] || "user";

  return (
    <LinksManagerClient
      initialLinks={links || []}
      origin={origin}
      userId={user.id}
      userHandle={userHandle}
    />
  );
}
