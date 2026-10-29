import { createClient } from "@/utils/supabase/server";
import CardsOrgsClient from "@/components/CardsOrgsClient";

export const dynamic = "force-dynamic";

export default async function CardsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Busca plano do usuário para feature gating de crachás/equipes
  const { data: profile } = await supabase
    .from("profiles")
    .select("plan_tier")
    .eq("id", user.id)
    .single();

  const planTier = profile?.plan_tier || "free";

  // Busca domínios customizados ativos do usuário
  const { data: userDomains } = await supabase
    .from("custom_domains")
    .select("id, domain")
    .eq("user_id", user.id)
    .eq("status", "active")
    .order("domain", { ascending: true });

  // Busca organizações do usuário com campos completos
  const { data: orgs } = await supabase
    .from("organizations")
    .select(`
      id,
      slug,
      name,
      logo_url,
      primary_color,
      card_template,
      card_fields,
      custom_domain_id,
      custom_domains (
        id,
        domain
      ),
      created_at
    `)
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <CardsOrgsClient
      initialOrgs={orgs || []}
      userId={user.id}
      userDomains={userDomains || []}
      planTier={planTier}
    />
  );
}
