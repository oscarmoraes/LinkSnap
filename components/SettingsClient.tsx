"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
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
  Sparkles,
  Loader2,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Layers,
  Crown,
  Info,
  QrCode,
  Globe,
  ChevronRight,
} from "lucide-react";
import { PixCheckoutModal } from "@/components/PixCheckoutModal";

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
  initialSubscription?: {
    id: string;
    status: string;
    plan_tier: string;
    current_period_end: string | null;
    mp_payment_id: string | null;
    created_at: string;
  } | null;
  userEmail: string;
}

export default function SettingsClient({
  initialProfile,
  initialSubscription,
  userEmail,
}: SettingsClientProps) {
  const supabase = createClient();
  const router = useRouter();
  const searchParams = useSearchParams();

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

  // Estado de Assinatura & Planos
  const [currentPlanTier, setCurrentPlanTier] = useState(initialProfile.plan_tier || "free");
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [selectedTier, setSelectedTier] = useState<"pro" | "enterprise">("pro");
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");
  const [devModalOpen, setDevModalOpen] = useState(false);
  const [devModalMessage, setDevModalMessage] = useState("");
  const [simulating, setSimulating] = useState(false);

  // Estado do Modal de Pix Transparente
  const [pixModalOpen, setPixModalOpen] = useState(false);
  const [pixModalData, setPixModalData] = useState<{
    qrCode: string;
    qrCodeBase64: string;
    ticketUrl?: string;
  } | null>(null);

  // Status de retorno do checkout do Mercado Pago
  const billingStatus = searchParams.get("billing");

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

  const handlePixCheckout = async () => {
    setCheckoutLoading(true);
    setCheckoutError("");

    const planKey = `${selectedTier}_${billingCycle}`;

    try {
      const orderRes = await fetch("/api/mercadopago/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planKey, paymentMethod: "pix" }),
      });

      const orderData = await orderRes.json();

      if (!orderRes.ok) {
        throw new Error(orderData.error || "Falha ao gerar Pix com Mercado Pago.");
      }

      if (orderData.pix?.qrCodeBase64) {
        setPixModalData({
          qrCode: orderData.pix.qrCode,
          qrCodeBase64: orderData.pix.qrCodeBase64,
          ticketUrl: orderData.pix.ticketUrl,
        });
        setPixModalOpen(true);
      } else {
        throw new Error("QR Code Pix não retornado.");
      }
    } catch (err: any) {
      setCheckoutError(err.message || "Erro inesperado ao gerar Pix.");
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleMercadoPagoCheckout = async () => {
    setCheckoutLoading(true);
    setCheckoutError("");

    const planKey = `${selectedTier}_${billingCycle}`;

    try {
      const res = await fetch("/api/mercadopago/create-preference", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planKey }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Falha ao iniciar checkout no Mercado Pago.");
      }

      if (data.isSimulated) {
        setDevModalMessage(data.message);
        setDevModalOpen(true);
      } else if (data.initPoint) {
        window.location.href = data.initPoint;
      } else {
        throw new Error("Link de pagamento do Mercado Pago não retornado.");
      }
    } catch (err: any) {
      setCheckoutError(err.message || "Erro inesperado ao conectar ao Mercado Pago.");
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleSimulateActivation = async (targetPlan: "free" | "pro" | "enterprise") => {
    setSimulating(true);
    try {
      const res = await fetch("/api/mercadopago/simulate-activation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetPlan }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Falha ao simular plano.");

      setCurrentPlanTier(data.planTier);
      setDevModalOpen(false);
      router.refresh();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSimulating(false);
    }
  };

  const isPro = currentPlanTier === "pro" || currentPlanTier === "enterprise";

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="border-b border-zinc-200 pb-5">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 flex items-center gap-2">
          <Settings className="h-6 w-6 text-zinc-700" />
          Configurações da Conta & Assinatura
        </h1>
        <p className="text-xs text-zinc-500 mt-1">
          Gerencie o nome da sua marca, workspace, identificador público (@handle) e plano de assinatura.
        </p>
      </div>

      {/* Banner de Feedback de Pagamento Mercado Pago */}
      {billingStatus === "success" && (
        <div className="rounded-2xl bg-emerald-50 border border-emerald-300 p-4 shadow-sm flex items-start gap-3">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-bold text-emerald-900">
              Pagamento Aprovado com Sucesso! 🎉
            </h3>
            <p className="text-xs text-emerald-700 mt-0.5">
              Sua assinatura via Mercado Pago foi confirmada. Todos os recursos PRO, domínios próprios e páginas sem restrições estão liberados.
            </p>
          </div>
        </div>
      )}

      {billingStatus === "pending" && (
        <div className="rounded-2xl bg-amber-50 border border-amber-300 p-4 shadow-sm flex items-start gap-3">
          <Clock className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-bold text-amber-900">
              Pagamento Aguardando Compensação
            </h3>
            <p className="text-xs text-amber-700 mt-0.5">
              Seu pagamento via Pix ou boleto está sendo processado pelo Mercado Pago. Assim que compensado, seu plano será promovido automaticamente.
            </p>
          </div>
        </div>
      )}

      {billingStatus === "failure" && (
        <div className="rounded-2xl bg-rose-50 border border-rose-300 p-4 shadow-sm flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-bold text-rose-900">
              Pagamento Não Concluído
            </h3>
            <p className="text-xs text-rose-700 mt-0.5">
              A transação no Mercado Pago foi cancelada ou recusada pela operadora. Tente novamente com outro cartão ou via Pix instantâneo.
            </p>
          </div>
        </div>
      )}

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

        {/* Bloco de Assinatura & Checkout Mercado Pago (5 cols) */}
        <div className="md:col-span-5 space-y-4">
          <div id="plan" className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm space-y-5 scroll-mt-20">
            {/* Header da Seção de Plano */}
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-blue-600" />
                <h2 className="text-sm font-bold text-zinc-900">
                  Assinatura & Plano
                </h2>
              </div>
              <span
                className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider border ${
                  isPro
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-zinc-100 text-zinc-700 border-zinc-200"
                }`}
              >
                {currentPlanTier}
              </span>
            </div>

            {/* Caso 1: Usuário já é PRO ou Enterprise */}
            {isPro ? (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-emerald-900 font-bold text-sm">
                    <Crown className="h-4 w-4 text-amber-500" />
                    Plano {currentPlanTier.toUpperCase()} Ativo
                  </div>
                  <span className="text-[10px] bg-emerald-600 text-white font-bold px-2 py-0.5 rounded-full">
                    Ativo
                  </span>
                </div>

                <p className="text-xs text-zinc-600">
                  Você possui acesso irrestrito a todos os recursos profissionais da plataforma.
                </p>

                <ul className="text-xs text-zinc-700 space-y-1.5 pt-1">
                  <li className="flex items-center gap-1.5">
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Domínios próprios personalizados</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Bio Pro com 6 blocos & Selo Verificado</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                    <span>100% White-Label (sem marca LinkSnap)</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Crachás e carteirinhas digitais</span>
                  </li>
                </ul>

                {initialSubscription?.current_period_end && (
                  <div className="pt-2 border-t border-emerald-200/60 text-[11px] text-zinc-500 flex items-center justify-between">
                    <span>Renovação:</span>
                    <span className="font-semibold text-zinc-700">
                      {new Date(initialSubscription.current_period_end).toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                )}

                <div className="pt-2">
                  <Link
                    href="/dashboard/settings/domains"
                    className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50/70 hover:bg-blue-100/70 px-3.5 py-2 text-xs font-bold text-blue-800 transition shadow-2xs"
                  >
                    <Globe className="h-4 w-4 text-blue-600" />
                    <span>Configurar Domínios Próprios</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </div>

                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => handleSimulateActivation("free")}
                    disabled={simulating}
                    className="w-full text-center text-[11px] font-medium text-zinc-500 hover:text-zinc-700 underline"
                  >
                    {simulating ? "Processando..." : "Simular downgrade para Free (Teste)"}
                  </button>
                </div>
              </div>
            ) : (
              /* Caso 2: Usuário está no Plano Free -> Motor de Upgrade com Mercado Pago */
              <div className="space-y-4">
                {/* Seletor Mensal vs Anual */}
                <div className="flex items-center justify-center p-1 rounded-xl bg-zinc-100 border border-zinc-200">
                  <button
                    type="button"
                    onClick={() => setBillingCycle("monthly")}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
                      billingCycle === "monthly"
                        ? "bg-white text-zinc-900 shadow-xs"
                        : "text-zinc-500 hover:text-zinc-800"
                    }`}
                  >
                    Mensal
                  </button>
                  <button
                    type="button"
                    onClick={() => setBillingCycle("yearly")}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition relative ${
                      billingCycle === "yearly"
                        ? "bg-white text-zinc-900 shadow-xs"
                        : "text-zinc-500 hover:text-zinc-800"
                    }`}
                  >
                    Anual
                    <span className="ml-1 text-[9px] bg-emerald-100 text-emerald-700 px-1 py-0.2 rounded font-extrabold">
                      -17%
                    </span>
                  </button>
                </div>

                {/* Seletor de Planos */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedTier("pro")}
                    className={`p-3 rounded-xl border text-left transition ${
                      selectedTier === "pro"
                        ? "border-blue-600 bg-blue-50/30 ring-1 ring-blue-600"
                        : "border-zinc-200 bg-zinc-50/50 hover:bg-zinc-50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-zinc-900">PRO</span>
                      <Zap className="h-3.5 w-3.5 text-blue-600" />
                    </div>
                    <div className="mt-2 text-base font-black text-zinc-900">
                      {billingCycle === "monthly" ? "R$ 19,90" : "R$ 199"}
                      <span className="text-[10px] font-normal text-zinc-500">
                        {billingCycle === "monthly" ? "/mês" : "/ano"}
                      </span>
                    </div>
                    <span className="text-[10px] text-zinc-500 mt-1 block">
                      Criadores & Lojas
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedTier("enterprise")}
                    className={`p-3 rounded-xl border text-left transition ${
                      selectedTier === "enterprise"
                        ? "border-blue-600 bg-blue-50/30 ring-1 ring-blue-600"
                        : "border-zinc-200 bg-zinc-50/50 hover:bg-zinc-50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-zinc-900">Business</span>
                      <Crown className="h-3.5 w-3.5 text-amber-500" />
                    </div>
                    <div className="mt-2 text-base font-black text-zinc-900">
                      {billingCycle === "monthly" ? "R$ 49,90" : "R$ 499"}
                      <span className="text-[10px] font-normal text-zinc-500">
                        {billingCycle === "monthly" ? "/mês" : "/ano"}
                      </span>
                    </div>
                    <span className="text-[10px] text-zinc-500 mt-1 block">
                      Equipes & Agências
                    </span>
                  </button>
                </div>

                {/* Benefícios do Plano Escolhido */}
                <div className="rounded-xl bg-zinc-50 border border-zinc-200 p-3.5 space-y-2 text-xs text-zinc-700">
                  <span className="font-bold text-zinc-900 block text-[11px] uppercase tracking-wider">
                    Incluso no {selectedTier === "pro" ? "LinkSnap PRO" : "Plano Business"}:
                  </span>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5">
                      <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                      <span>{selectedTier === "pro" ? "1 Domínio Próprio incluso" : "Até 5 Domínios Próprios"}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                      <span>Bio Pro sem limites com 6 blocos</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                      <span>Selo Verificado Azul e Pix 0% taxa</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                      <span>Remoção da marca LinkSnap</span>
                    </div>
                    {selectedTier === "enterprise" && (
                      <div className="flex items-center gap-1.5">
                        <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                        <span>Crachás e carteirinhas ilimitadas</span>
                      </div>
                    )}
                  </div>
                </div>

                {checkoutError && (
                  <div className="text-xs text-rose-700 bg-rose-50 border border-rose-200 p-2.5 rounded-lg flex items-center gap-1.5">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{checkoutError}</span>
                  </div>
                )}

                {/* Botões de Pagamento: Pix Direto ou Cartão / Checkout Completo */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={handlePixCheckout}
                    disabled={checkoutLoading}
                    className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 py-3 text-xs sm:text-sm font-bold text-white shadow-md shadow-emerald-500/20 transition disabled:opacity-60"
                  >
                    {checkoutLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Gerando Pix...
                      </>
                    ) : (
                      <>
                        <QrCode className="h-4 w-4" />
                        <span>Pagar com Pix</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleMercadoPagoCheckout}
                    disabled={checkoutLoading}
                    className="flex items-center justify-center gap-2 rounded-xl bg-[#009EE3] hover:bg-[#0089C7] py-3 text-xs sm:text-sm font-bold text-white shadow-md shadow-blue-500/20 transition disabled:opacity-60"
                  >
                    {checkoutLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Carregando...
                      </>
                    ) : (
                      <>
                        <CreditCard className="h-4 w-4" />
                        <span>Pagar com Cartão</span>
                        <ExternalLink className="h-3 w-3 opacity-70" />
                      </>
                    )}
                  </button>
                </div>

                {/* Selos de Confiança Mercado Pago */}
                <div className="pt-1 flex flex-wrap items-center justify-between text-[10px] text-zinc-500 border-t border-zinc-100">
                  <span className="flex items-center gap-1">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                    Pix Instantâneo
                  </span>
                  <span>Cartão até 12x</span>
                  <span>Cancele quando quiser</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal Educativo de Desenvolvedor / Simulação */}
      {devModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-zinc-200 space-y-4">
            <div className="flex items-center gap-2 text-zinc-900 font-bold text-base">
              <Info className="h-5 w-5 text-blue-600" />
              Credencial do Mercado Pago
            </div>

            <p className="text-xs text-zinc-600 leading-relaxed">
              O fluxo de pagamento está pronto e integrado! Para emitir cobranças reais na sua conta, adicione a variável de ambiente:
            </p>

            <div className="rounded-lg bg-zinc-900 p-3 font-mono text-[11px] text-emerald-400 select-all">
              MERCADO_PAGO_ACCESS_TOKEN=APP_USR-...
            </div>

            <p className="text-[11px] text-zinc-500">
              Você pode obter o Access Token no painel do{" "}
              <a
                href="https://www.mercadopago.com.br/developers"
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 underline font-semibold"
              >
                Mercado Pago Developers
              </a>
              .
            </p>

            <div className="pt-2 border-t border-zinc-200 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => handleSimulateActivation("pro")}
                disabled={simulating}
                className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 py-2.5 text-xs font-bold text-white transition flex items-center justify-center gap-2"
              >
                {simulating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Zap className="h-4 w-4" />
                )}
                Simular Ativação PRO Imediata (Ambiente de Testes)
              </button>

              <button
                type="button"
                onClick={() => setDevModalOpen(false)}
                className="w-full rounded-xl border border-zinc-300 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 transition"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Pagamento Pix Transparente (Orders API) */}
      <PixCheckoutModal
        isOpen={pixModalOpen}
        onClose={() => setPixModalOpen(false)}
        pixData={pixModalData}
        planName={selectedTier === "pro" ? "LinkSnap PRO" : "Plano Business"}
        priceFormatted={
          selectedTier === "pro"
            ? billingCycle === "monthly" ? "R$ 19,90" : "R$ 199,00"
            : billingCycle === "monthly" ? "R$ 49,90" : "R$ 499,00"
        }
      />
    </div>
  );
}
