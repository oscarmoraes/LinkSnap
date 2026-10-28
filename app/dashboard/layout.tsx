import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import AppShell from "@/components/AppShell";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  let { data: profile } = await supabase
    .from("profiles")
    .select("id, email, full_name, handle, brand_name, brand_logo_url, plan_tier")
    .eq("id", user.id)
    .single();

  if (!profile) {
    profile = {
      id: user.id,
      email: user.email || "",
      full_name: user.user_metadata?.full_name || null,
      handle: user.email ? user.email.split("@")[0].toLowerCase().replace(/[^a-z0-9_-]/g, "") : "user",
      brand_name: null,
      brand_logo_url: null,
      plan_tier: "free",
    };
  }

  return (
    <AppShell
      userEmail={profile.email}
      userHandle={profile.handle || "user"}
      brandName={profile.brand_name || profile.full_name || "LinkSnap"}
      brandLogoUrl={profile.brand_logo_url || null}
      planTier={profile.plan_tier}
    >
      {children}
    </AppShell>
  );
}
