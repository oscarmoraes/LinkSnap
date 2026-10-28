"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import {
  Settings,
  User,
  CreditCard,
  Check,
  Zap,
  ExternalLink,
  Save,
  AlertCircle,
  Building,
  Image as ImageIcon,
  Sparkles,
} from "lucide-react";

interface SettingsClientProps {
  initialProfile: {
    id: string;
    handle: string | null;
    full_name: string | null;
    avatar_url: string | null;
    brand_name?: string | null;
    brand_logo_url?: string | null;
    plan_tier: string;
  };
  userEmail: string;
}

export default function SettingsClient({
  initialProfile,
  userEmail,
}: SettingsClientProps) {
  const supabase = createClient();
  const router = useRouter();

  // Dados de Usuário
  const [handle, setHandle] = useState(initialProfile.handle || "");
  const [fullName, setFullName] = useState(initialProfile.full_name || "");
  const [avatarUrl, setAvatarUrl] = useState(initialProfile.avatar_url || "");

  // Dados da Marca / Workspace
  const [brandName, setBrandName] = useState(initialProfile.brand_name || "");
  const [brandLogoUrl, setBrandLogoUrl] = useState(initialProfile.brand_logo_url || "");

  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg("");
    setErrorMsg("");

    const cleanHandle = handle.toLowerCase().replace(/[^a-z0-9_-]/g, "");

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          handle: cleanHandle || null,
          full_name: fullName.trim() || null,
          avatar_url: avatarUrl.trim() || null,
          brand_name: brandName.trim() || null,
          brand_logo_url: brandLogoUrl.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", initialProfile.id);

      if (error) {
        if (error.code === "23505") {
          throw new Error("Este @handle já está sendo utilizado por outro usuário.");
        }
        throw error;
      }

      setSuccessMsg("Configurações e nome da marca salvos com sucesso!");
      router.refresh();
      setTimeout(() => setSuccessMsg(""), 3500);
    } catch (err: any) {
      setErrorMsg(err.message || "Falha ao atualizar perfil");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="border-b border-zinc-200 pb-5">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 flex items-center gap-2">
          <Settings className="h-6 w-6 text-zinc-700" />
          Configurações da Conta & Marca
        </h1>
        <p className="text-xs text-zinc-500 mt-1">
          Gerencie o nome da sua marca, workspace, identificador público (@handle) e plano de assinatura.
        </p>
      </div>

      {successMsg && (
        <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800 flex items-center gap-2">
          <Check className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-xs text-red-800 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-12 items-start">
        {/* Formulário Principal (7 cols) */}
        <div className="md:col-span-7 space-y-6">
          <form onSubmit={handleSaveProfile} className="space-y-6">
            {/* Bloco 1: Identidade da Marca / Workspace */}
            <div className="rounded-xl border border-blue-200 bg-white p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
                <h2 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                  <Building className="h-4 w-4 text-blue-600" />
                  Identidade da Marca & Workspace
                </h2>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                  Exibição Global
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1">
                  Nome da sua Marca / Empresa *
                </label>
                <input
                  type="text"
                  placeholder="Ex: Minha Empresa, Studio Digital, Loja X"
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 font-semibold placeholder-zinc-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
                <span className="text-[10px] text-zinc-400 mt-1 block">
                  Aparece no topo do seu painel de controle, no menu de workspaces e nas suas páginas públicas.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1">
                  URL do Logotipo da Marca (Opcional)
                </label>
                <div className="relative">
                  <input
                    type="url"
                    placeholder="https://seusite.com.br/logo.png"
                    value={brandLogoUrl}
                    onChange={(e) => setBrandLogoUrl(e.target.value)}
                    className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs text-zinc-900 placeholder-zinc-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                  />
                </div>
                <span className="text-[10px] text-zinc-400 mt-1 block">
                  Link direto para imagem (PNG, SVG ou JPG quadrado ou retangular pequeno).
                </span>
              </div>

              {/* Pré-visualização da Marca no Topo */}
              <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-3 space-y-2">
                <span className="text-[10px] font-semibold uppercase text-zinc-500 tracking-wider flex items-center gap-1">
                  <Sparkles className="h-3 w-3 text-amber-500" />
                  Como aparecerá no menu superior:
                </span>
                <div className="flex items-center gap-2.5 bg-white border border-zinc-200 rounded-lg p-2.5 shadow-xs max-w-xs">
                  {brandLogoUrl ? (
                    <img
                      src={brandLogoUrl}
                      alt="Logo Preview"
                      className="h-8 w-8 rounded-lg object-contain border border-zinc-200"
                      onError={(e) => ((e.target as HTMLElement).style.display = "none")}
                    />
                  ) : !brandName || brandName.toLowerCase() === "linksnap" ? (
                    <img
                      src="/brand/logo-mark.svg"
                      alt="LinkSnap"
                      className="h-8 w-8 rounded-lg object-contain shadow-xs"
                    />
                  ) : (
                    <span className="grid h-8 w-8 place-items-center rounded-lg bg-blue-600 text-sm font-black text-white shadow-xs uppercase">
                      {(brandName || "M").charAt(0)}
                    </span>
                  )}
                  <div className="flex flex-col">
                    <span className="text-sm font-bold tracking-tight text-zinc-900 leading-tight">
                      {brandName || "LinkSnap"}
                    </span>
                    <span className="text-[10px] text-zinc-400 leading-none">
                      Workspace
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bloco 2: Perfil Pessoal & Handle */}
            <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm space-y-4">
              <h2 className="text-sm font-bold text-zinc-900 flex items-center gap-2 border-b border-zinc-200 pb-3">
                <User className="h-4 w-4 text-zinc-500" />
                Dados do Usuário & Perfil
              </h2>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1">
                  E-mail (Autenticação)
                </label>
                <input
                  type="text"
                  disabled
                  value={userEmail}
                  className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-500 font-mono cursor-not-allowed"
                />
                <span className="text-[10px] text-zinc-400">Gerenciado pelo provedor de login</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1">
                  Identificador Único (@handle) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-sm text-zinc-400 font-mono">@</span>
                  <input
                    type="text"
                    required
                    placeholder="seunome"
                    value={handle}
                    onChange={(e) => setHandle(e.target.value)}
                    className="w-full rounded-lg border border-zinc-300 bg-white pl-8 pr-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 font-mono"
                  />
                </div>
                <span className="text-[10px] text-zinc-400">
                  Usado nos seus links com marca e páginas: /b/{handle || "seu-handle"} e /r/@{handle || "seu-handle"}/...
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1">
                  Nome do Administrador
                </label>
                <input
                  type="text"
                  placeholder="Ex: Carlos Eduardo"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1">
                  URL da Foto de Perfil Pessoal (Avatar)
                </label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-zinc-900 px-4 py-2.5 text-xs font-semibold text-white hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-2 transition-colors shadow-sm"
            >
              <Save className="h-4 w-4" />
              {saving ? "Salvando Alterações..." : "Salvar Marca e Perfil"}
            </button>
          </form>
        </div>

        {/* Plano & Assinatura (5 cols) */}
        <div className="md:col-span-5 space-y-4">
          <div id="plan" className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm space-y-4 scroll-mt-20">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-zinc-500" />
                Assinatura & Plano
              </h2>
              <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-700 border border-blue-100">
                Plano {initialProfile.plan_tier}
              </span>
            </div>

            <div className="rounded-lg bg-zinc-50 border border-zinc-200 p-4 space-y-3">
              <div className="flex items-baseline justify-between">
                <span className="text-xs font-semibold text-zinc-900">Plano Atual</span>
                <span className="text-lg font-bold text-zinc-900">R$ 0<span className="text-xs font-normal text-zinc-500">/mês</span></span>
              </div>
              <ul className="text-xs text-zinc-600 space-y-1.5 pt-1">
                <li className="flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                  Links e Encurtador Ilimitados
                </li>
                <li className="flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                  Bio Pages (/b/[handle])
                </li>
                <li className="flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                  Carteirinhas de Equipe (/c)
                </li>
                <li className="flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                  Personalização de Marca & Workspace
                </li>
              </ul>
            </div>

            {/* Upgrade CTA com Mercado Pago */}
            <div className="rounded-lg border border-blue-200 bg-blue-50/40 p-4 space-y-3">
              <div className="flex items-center gap-2 text-blue-900 font-semibold text-xs">
                <Zap className="h-4 w-4 text-blue-600" />
                Upgrade para Plano PRO / Equipes
              </div>
              <p className="text-[11px] text-zinc-600">
                Tenha suporte a domínios próprios, múltiplos administradores de crachás e relatórios detalhados.
              </p>
              <div className="text-xs text-zinc-500 flex items-center gap-1">
                <span>Checkout via:</span>
                <span className="font-semibold text-zinc-800">Mercado Pago (Pix & Cartão)</span>
              </div>
              <button
                type="button"
                onClick={() => alert("Módulo de checkout Mercado Pago pronto para conexão de credenciais.")}
                className="w-full rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition-colors flex items-center justify-center gap-1.5"
              >
                Ver Planos no Mercado Pago
                <ExternalLink className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
