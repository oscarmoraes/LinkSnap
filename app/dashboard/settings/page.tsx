import { createClient } from "@/utils/supabase/server";
import SettingsClient from "@/components/SettingsClient";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, handle, full_name, avatar_url, brand_name, brand_logo_url, plan_tier")
    .eq("id", user.id)
    .single();

  return (
    <SettingsClient
      initialProfile={
        profile || {
          id: user.id,
          handle: user.email?.split("@")[0] || "user",
          full_name: null,
          avatar_url: null,
          brand_name: null,
          brand_logo_url: null,
          plan_tier: "free",
        }
      }
      userEmail={user.email || ""}
    />
  );
}
