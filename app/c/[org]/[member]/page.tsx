import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import type { Metadata } from "next";
import PublicMemberCardClient from "@/components/PublicMemberCardClient";

export const dynamic = "force-dynamic";

function getSupabase() {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    "https://placeholder.supabase.co";
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    "";

  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false },
  });
}

export async function generateMetadata({
  params,
}: {
  params: { org: string; member: string };
}): Promise<Metadata> {
  const supabase = getSupabase();
  if (!supabase) return { title: "Validação de Credencial" };

  try {
    const { data: org } = await supabase
      .from("organizations")
      .select("id, name")
      .eq("slug", params.org.toLowerCase())
      .maybeSingle();

    if (!org) return { title: "Equipe não encontrada" };

    const { data: member } = await supabase
      .from("card_members")
      .select("full_name, role")
      .eq("org_id", org.id)
      .eq("code", params.member.toUpperCase())
      .maybeSingle();

    return {
      title: `${member?.full_name || "Membro"} — Validação de Credencial | ${org.name}`,
      description: `Validação oficial da carteirinha e credencial de ${member?.full_name || "membro"} emitida por ${org.name}.`,
    };
  } catch {
    return { title: "Validação de Credencial" };
  }
}

export default async function PublicMemberCardValidationPage({
  params,
}: {
  params: { org: string; member: string };
}) {
  const supabase = getSupabase();
  if (!supabase) notFound();

  try {
    const { data: org } = await supabase
      .from("organizations")
      .select("id, slug, name, primary_color, logo_url, card_fields, card_template")
      .eq("slug", params.org.toLowerCase())
      .maybeSingle();

    if (!org) notFound();

    const { data: member } = await supabase
      .from("card_members")
      .select(
        "id, code, full_name, role, department, registration, photo_url, email, phone, valid_until, status, extra"
      )
      .eq("org_id", org.id)
      .eq("code", params.member.toUpperCase())
      .maybeSingle();

    if (!member) notFound();

    return <PublicMemberCardClient org={org} member={member} />;
  } catch (err) {
    console.error("Erro ao validar credencial:", err);
    notFound();
  }
}
