import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { CheckCircle2, XCircle, ShieldCheck, ExternalLink } from "lucide-react";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
  return createClient(url, key);
}

export async function generateMetadata({
  params,
}: {
  params: { org: string; member: string };
}): Promise<Metadata> {
  const supabase = getSupabase();
  const { data: org } = await supabase
    .from("organizations")
    .select("id, name")
    .eq("slug", params.org.toLowerCase())
    .single();

  if (!org) return { title: "Equipe não encontrada" };

  const { data: member } = await supabase
    .from("card_members")
    .select("full_name, role")
    .eq("org_id", org.id)
    .eq("code", params.member.toUpperCase())
    .single();

  return {
    title: `${member?.full_name || "Membro"} — Validação de Credencial | ${org.name}`,
    description: `Validação oficial da carteirinha e credencial de ${member?.full_name || "membro"}.`,
  };
}

export default async function PublicMemberCardValidationPage({
  params,
}: {
  params: { org: string; member: string };
}) {
  const supabase = getSupabase();

  const { data: org } = await supabase
    .from("organizations")
    .select("id, slug, name, primary_color, logo_url")
    .eq("slug", params.org.toLowerCase())
    .single();

  if (!org) notFound();

  const { data: member } = await supabase
    .from("card_members")
    .select("id, code, full_name, role, department, registration, photo_url, valid_until, status")
    .eq("org_id", org.id)
    .eq("code", params.member.toUpperCase())
    .single();

  if (!member) notFound();

  const isActive = member.status === "active";

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-between p-4 sm:p-6 text-zinc-900 antialiased">
      <div className="w-full max-w-md mx-auto pt-8 pb-12">
        {/* Card Central de Validação */}
        <div className="rounded-3xl border border-zinc-200 bg-white p-6 sm:p-8 shadow-xl text-center relative overflow-hidden">
          {/* Faixa Superior com cor da Equipe */}
          <div
            className="absolute top-0 left-0 right-0 h-3"
            style={{ backgroundColor: org.primary_color }}
          ></div>

          {/* Badge de Status Oficial */}
          <div className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider mb-4 border"
            style={{
              backgroundColor: isActive ? "#F0FDF4" : "#FEF2F2",
              color: isActive ? "#15803D" : "#B91C1C",
              borderColor: isActive ? "#BBF7D0" : "#FECACA",
            }}
          >
            {isActive ? (
              <>
                <CheckCircle2 className="h-4 w-4" />
                Credencial Ativa & Válida
              </>
            ) : (
              <>
                <XCircle className="h-4 w-4" />
                Credencial Suspensa
              </>
            )}
          </div>

          {/* Nome da Empresa */}
          <p className="text-xs font-bold uppercase tracking-wider text-zinc-400">
            {org.name}
          </p>

          {/* Foto ou Avatar */}
          <div
            className="mx-auto my-4 h-24 w-24 rounded-full border-2 bg-zinc-100 flex items-center justify-center font-bold text-3xl shadow-md overflow-hidden"
            style={{ borderColor: org.primary_color, color: org.primary_color }}
          >
            {member.photo_url ? (
              <img src={member.photo_url} alt="" className="h-full w-full object-cover" />
            ) : (
              member.full_name.substring(0, 2).toUpperCase()
            )}
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">{member.full_name}</h1>
          <p className="text-sm font-semibold mt-1" style={{ color: org.primary_color }}>
            {member.role || "Membro da Equipe"}
          </p>
          <p className="text-xs text-zinc-500 mt-0.5">{member.department || "Departamento Geral"}</p>

          {/* Tabela de Dados Oficiais da Carteirinha */}
          <div className="mt-6 rounded-2xl border border-zinc-100 bg-zinc-50/75 p-4 text-left text-xs space-y-2.5">
            <div className="flex justify-between">
              <span className="text-zinc-500">Código de Validação</span>
              <span className="font-mono font-bold text-zinc-900">{member.code}</span>
            </div>
            {member.registration && (
              <div className="flex justify-between">
                <span className="text-zinc-500">Matrícula / ID</span>
                <span className="font-medium text-zinc-900">{member.registration}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-zinc-500">Status</span>
              <span className="font-bold text-emerald-600 capitalize">{member.status}</span>
            </div>
            {member.valid_until && (
              <div className="flex justify-between">
                <span className="text-zinc-500">Válido até</span>
                <span className="font-medium text-zinc-900">
                  {new Date(member.valid_until).toLocaleDateString("pt-BR")}
                </span>
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-zinc-100 flex items-center justify-center gap-1.5 text-xs text-zinc-400">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <span>Autenticidade verificada no LinkSnap</span>
          </div>
        </div>
      </div>

      <footer className="py-4 text-center">
        <a
          href="/"
          className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3 py-1 text-[11px] font-medium text-zinc-600 shadow-sm hover:text-zinc-900"
        >
          <span className="grid h-4 w-4 place-items-center rounded bg-blue-600 text-[9px] font-bold text-white">
            L
          </span>
          LinkSnap • Validação Segura de Credenciais
        </a>
      </footer>
    </div>
  );
}
