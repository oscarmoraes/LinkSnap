import { createClient } from "@/utils/supabase/server";
import SettingsClient from "@/components/SettingsClient";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const [profileRes, subRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, handle, full_name, avatar_url, brand_name, brand_logo_url, plan_tier")
      .eq("id", user.id)
      .single(),
    supabase
      .from("subscriptions")
      .select("id, status, plan_tier, current_period_end, mp_payment_id, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  return (
    <SettingsClient
      initialProfile={
        profileRes.data || {
          id: user.id,
          handle: user.email?.split("@")[0] || "user",
          full_name: null,
          avatar_url: null,
          brand_name: null,
          brand_logo_url: null,
          plan_tier: "free",
        }
      }
      initialSubscription={subRes.data || null}
      userEmail={user.email || ""}
    />
  );
}
