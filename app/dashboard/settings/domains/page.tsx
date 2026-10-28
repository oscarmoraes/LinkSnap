import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import CustomDomainsClient from "@/components/CustomDomainsClient";

export const dynamic = "force-dynamic";

export default async function CustomDomainsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [profileRes, biosRes, domainsRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, handle, full_name, plan_tier")
      .eq("id", user.id)
      .single(),
    supabase
      .from("bio_pages")
      .select("id, title, slug, is_primary")
      .eq("user_id", user.id)
      .order("is_primary", { ascending: false }),
    supabase
      .from("custom_domains")
      .select("id, domain, target_type, target_id, status, verification_token, ssl_status, created_at, bio_pages(id, title, slug)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
  ]);

  const profile = profileRes.data || {
    id: user.id,
    handle: user.email?.split("@")[0] || "user",
    full_name: null,
    plan_tier: "free",
  };

  return (
    <CustomDomainsClient
      initialDomains={(domainsRes.data as any) || []}
      bios={biosRes.data || []}
      planTier={profile.plan_tier || "free"}
      handle={profile.handle || "user"}
    />
  );
}
