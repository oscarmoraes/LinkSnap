import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import {
  Link2,
  Smartphone,
  UserCheck,
  TrendingUp,
  Plus,
  Sparkles,
  Zap,
  CheckCircle2,
  ArrowRight,
  ExternalLink,
  MessageSquare,
  DollarSign,
  Wifi,
  Compass,
} from "lucide-react";
import RecentLinksTable from "@/components/RecentLinksTable";

export const dynamic = "force-dynamic";

export default async function DashboardOverviewPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Busca dados em paralelo
  const [profileRes, linksRes, biosRes, orgsRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, handle, brand_name, plan_tier")
      .eq("id", user.id)
      .single(),
    supabase
      .from("links")
      .select("id, short_code, long_url, title, clicks, is_custom_slug, created_at, custom_domain_id, custom_domains(domain)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("bio_pages")
      .select("id, slug, title, views, is_primary, is_active")
      .eq("user_id", user.id),
    supabase
      .from("organizations")
      .select("id, slug, name, card_template")
      .eq("owner_id", user.id),
  ]);

  const profile = profileRes.data || {
    id: user.id,
    handle: user.email ? user.email.split("@")[0].toLowerCase().replace(/[^a-z0-9_-]/g, "") : "user",
    brand_name: "LinkSnap",
    plan_tier: "free",
  };

  const links = linksRes.data || [];
  const bios = biosRes.data || [];
  const orgs = orgsRes.data || [];

  const totalClicks = links.reduce((sum, item) => sum + Number(item.clicks || 0), 0);
  const totalBioViews = bios.reduce((sum, item) => sum + Number(item.views || 0), 0);

  const userHandle = profile.handle || "user";
  const planTier = profile.plan_tier || "free";
  const isPro = planTier === "pro" || planTier === "enterprise";

  // Verificações do Onboarding em 3 Passos
  const step1Done = bios.length > 0;
  const step2Done = links.length > 0;
  const step3Done = orgs.length > 0 || totalClicks > 0;
  const completedStepsCount = (step1Done ? 1 : 0) + (step2Done ? 1 : 0) + (step3Done ? 1 : 0);
  const progressPercent = Math.round((completedStepsCount / 3) * 100);

  return (
    <div className="space-y-7 pb-10">
      {/* 1. TOP HEADER DO PAINEL */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Visão Geral</h1>
            <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-semibold text-zinc-600">
              @{userHandle}
            </span>
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            Resumo unificado da performance da sua Bio Page, links encurtados e crachás de equipe.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/dashboard/bio"
            className="flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 px-3.5 py-2 text-xs font-bold text-zinc-700 shadow-2xs transition"
          >
            <Smartphone className="h-3.5 w-3.5 text-purple-600" />
            Nova Bio
          </Link>
          <Link
            href="/dashboard/links"
            className="flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 px-4 py-2 text-xs font-bold text-white shadow-xs transition"
          >
            <Plus className="h-3.5 w-3.5" />
            Novo Link Curto
          </Link>
        </div>
      </div>

      {/* 2. BARRA DE STATUS DO PLANO E COTAS */}
      <div
        className={`rounded-2xl border p-4 sm:p-5 shadow-xs transition-all ${
          isPro
            ? "border-amber-200/90 bg-linear-to-r from-amber-50 via-orange-50 to-amber-100/50"
            : "border-blue-100 bg-linear-to-r from-blue-50/70 via-indigo-50/40 to-slate-50"
        }`}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div
              className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${
                isPro ? "bg-amber-500 text-white shadow-xs" : "bg-blue-600 text-white shadow-xs"
              }`}
            >
              {isPro ? <Sparkles className="h-5 w-5" /> : <Zap className="h-5 w-5" />}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span
                  className={`rounded-md px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                    isPro
                      ? "bg-amber-200 text-amber-900 border border-amber-300"
                      : "bg-blue-100 text-blue-900 border border-blue-200"
                  }`}
                >
                  {isPro ? "Plano PRO Ativo ⚡" : "Plano Free"}
                </span>
                <span className="text-xs font-bold text-zinc-900">
                  {isPro ? "Workspace Profissional" : "Recursos Essenciais"}
                </span>
              </div>

              <p className="mt-1 text-xs text-zinc-600">
                {isPro ? (
                  <span>
                    <strong>Bios ilimitadas ativas</strong> • Links com sua marca (/r/@{userHandle}/...) • Domínios Próprios • Senha & Agendamento liberados.
                  </span>
                ) : (
                  <span>
                    <strong>1 Bio ativa</strong> • 20 links inclusos • Faça upgrade para desbloquear links com @{userHandle}, senha, agendamento e domínio próprio.
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="shrink-0 self-end sm:self-center">
            <Link
              href="/dashboard/settings#plan"
              className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition shadow-xs ${
                isPro
                  ? "border border-amber-300 bg-white text-amber-900 hover:bg-amber-50"
                  : "bg-linear-to-r from-amber-500 to-amber-600 text-white hover:from-amber-600 hover:to-amber-700 shadow-amber-500/20"
              }`}
            >
              {isPro ? (
                <>
                  <span>Gerenciar Assinatura</span>
                  <ArrowRight className="h-3.5 w-3.5 text-amber-600" />
                </>
              ) : (
                <>
                  <Zap className="h-3.5 w-3.5 fill-white" />
                  <span>Fazer Upgrade PRO ⚡</span>
                </>
              )}
            </Link>
          </div>
        </div>

        {/* Indicadores de Consumo de Cotas */}
        {!isPro ? (
          <div className="mt-4 pt-4 border-t border-blue-100/80 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Cota de Links */}
            <div>
              <div className="flex items-center justify-between text-[11px] font-semibold text-zinc-700 mb-1.5">
                <span className="flex items-center gap-1.5">
                  <Link2 className="h-3.5 w-3.5 text-blue-600" />
                  Links Encurtados
                </span>
                <span className="text-zinc-600 font-mono">
                  {links.length} / 20 ({Math.min(100, Math.round((links.length / 20) * 100))}%)
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-blue-200/60 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    links.length >= 20
                      ? "bg-red-500"
                      : links.length >= 15
                      ? "bg-amber-500"
                      : "bg-blue-600"
                  }`}
                  style={{ width: `${Math.min(100, (links.length / 20) * 100)}%` }}
                />
              </div>
              {links.length >= 20 && (
                <p className="mt-1 text-[10px] font-bold text-red-600">
                  ⚠️ Limite de 20 links atingido. Novos links bloqueados até o upgrade.
                </p>
              )}
            </div>

            {/* Cota de Bio Pages */}
            <div>
              <div className="flex items-center justify-between text-[11px] font-semibold text-zinc-700 mb-1.5">
                <span className="flex items-center gap-1.5">
                  <Smartphone className="h-3.5 w-3.5 text-purple-600" />
                  Bio Pages
                </span>
                <span className="text-zinc-600 font-mono">
                  {bios.length} / 1 ({Math.min(100, Math.round((bios.length / 1) * 100))}%)
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-blue-200/60 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    bios.length >= 1 ? "bg-amber-500" : "bg-purple-600"
                  }`}
                  style={{ width: `${Math.min(100, (bios.length / 1) * 100)}%` }}
                />
              </div>
              {bios.length >= 1 && (
                <p className="mt-1 text-[10px] text-zinc-500">
                  Faça upgrade para PRO para criar até 5 Bio Pages e ter domínio próprio.
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="mt-3 pt-3 border-t border-amber-200/60 flex flex-wrap items-center gap-4 text-[11px] font-semibold text-amber-950">
            <span className="flex items-center gap-1 text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-md border border-emerald-200">
              ✓ Links Ilimitados ({links.length} criados)
            </span>
            <span className="flex items-center gap-1 text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded-md border border-blue-200">
              ✓ {bios.length} de 5 Bio Pages utilizadas
            </span>
            <span className="flex items-center gap-1 text-purple-700 bg-purple-100/70 px-2 py-0.5 rounded-md border border-purple-200">
              ✓ Domínios Próprios Liberados
            </span>
          </div>
        )}
      </div>

      {/* 3. CARD DE ONBOARDING GUIADO EM 3 PASSOS */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6 shadow-xs space-y-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-zinc-900">
                Onboarding Guiado LinkSnap
              </h2>
              <span
                className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                  completedStepsCount === 3
                    ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                    : "bg-blue-50 text-blue-700 border border-blue-200"
                }`}
              >
                {completedStepsCount} de 3 passos concluídos ({progressPercent}%)
              </span>
            </div>
            <p className="text-xs text-zinc-500 mt-0.5">
              Configure sua presença digital e impulsione a conversão da sua marca em minutos.
            </p>
          </div>

          {/* Barra de Progresso Visual */}
          <div className="w-full sm:w-44">
            <div className="h-2 w-full rounded-full bg-zinc-100 overflow-hidden">
              <div
                className="h-2 rounded-full bg-emerald-500 transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Os 3 Passos */}
        <div className="grid gap-4 md:grid-cols-3">
          {/* Passo 1 */}
          <div
            className={`rounded-xl border p-4 transition ${
              step1Done
                ? "border-emerald-200 bg-emerald-50/30"
                : "border-zinc-200 bg-zinc-50/50 hover:border-zinc-300"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-purple-100 text-purple-700">
                <Smartphone className="h-4 w-4" />
              </span>
              {step1Done ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 fill-emerald-100" />
                  Concluído
                </span>
              ) : (
                <span className="rounded bg-zinc-200/80 px-2 py-0.5 text-[10px] font-bold text-zinc-600">
                  Passo 1
                </span>
              )}
            </div>

            <h3 className="text-xs font-bold text-zinc-900 leading-tight">
              1. Personalize sua Bio Page
            </h3>
            <p className="mt-1 text-[11px] text-zinc-500 leading-normal">
              Reivindique <span className="font-mono text-zinc-700 font-medium">/b/@{userHandle}</span>, adicione links das redes, catálogo e chave Pix com 0% de taxa.
            </p>

            <div className="mt-3.5 pt-2 border-t border-zinc-100">
              <Link
                href="/dashboard/bio"
                className={`inline-flex items-center gap-1 text-xs font-bold ${
                  step1Done
                    ? "text-emerald-700 hover:text-emerald-800"
                    : "text-blue-600 hover:text-blue-700"
                }`}
              >
                <span>{step1Done ? "Editar Bio Page" : "Configurar Agora"}</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>

          {/* Passo 2 */}
          <div
            className={`rounded-xl border p-4 transition ${
              step2Done
                ? "border-emerald-200 bg-emerald-50/30"
                : "border-zinc-200 bg-zinc-50/50 hover:border-zinc-300"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-blue-100 text-blue-700">
                <Link2 className="h-4 w-4" />
              </span>
              {step2Done ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 fill-emerald-100" />
                  Concluído
                </span>
              ) : (
                <span className="rounded bg-zinc-200/80 px-2 py-0.5 text-[10px] font-bold text-zinc-600">
                  Passo 2
                </span>
              )}
            </div>

            <h3 className="text-xs font-bold text-zinc-900 leading-tight">
              2. Encurte seu 1º Link com Marca ou Pix
            </h3>
            <p className="mt-1 text-[11px] text-zinc-500 leading-normal">
              Gere links curtos rastreáveis com métricas de cliques por dispositivo, país e redes sociais.
            </p>

            <div className="mt-3.5 pt-2 border-t border-zinc-100">
              <Link
                href="/dashboard/links"
                className={`inline-flex items-center gap-1 text-xs font-bold ${
                  step2Done
                    ? "text-emerald-700 hover:text-emerald-800"
                    : "text-blue-600 hover:text-blue-700"
                }`}
              >
                <span>{step2Done ? "Ver Meus Links" : "Criar 1º Link"}</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>

          {/* Passo 3 */}
          <div
            className={`rounded-xl border p-4 transition ${
              step3Done
                ? "border-emerald-200 bg-emerald-50/30"
                : "border-zinc-200 bg-zinc-50/50 hover:border-zinc-300"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-amber-100 text-amber-700">
                <UserCheck className="h-4 w-4" />
              </span>
              {step3Done ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 fill-emerald-100" />
                  Concluído
                </span>
              ) : (
                <span className="rounded bg-zinc-200/80 px-2 py-0.5 text-[10px] font-bold text-zinc-600">
                  Passo 3
                </span>
              )}
            </div>

            <h3 className="text-xs font-bold text-zinc-900 leading-tight">
              3. Crachás de Equipe ou Analytics
            </h3>
            <p className="mt-1 text-[11px] text-zinc-500 leading-normal">
              Crie crachás com validação QR para sua equipe ou acompanhe relatórios detalhados de cliques.
            </p>

            <div className="mt-3.5 pt-2 border-t border-zinc-100">
              <Link
                href={orgs.length > 0 ? "/dashboard/cards" : "/dashboard/analytics"}
                className={`inline-flex items-center gap-1 text-xs font-bold ${
                  step3Done
                    ? "text-emerald-700 hover:text-emerald-800"
                    : "text-blue-600 hover:text-blue-700"
                }`}
              >
                <span>{step3Done ? "Acessar Equipes / Analytics" : "Explorar Agora"}</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* 4. GRID DE MÉTRICAS PRINCIPAIS (4 KPIs) */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* KPI 1 */}
        <Link
          href="/dashboard/links"
          className="group rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs transition hover:border-blue-400 hover:shadow-sm"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">
              Total de Links
            </span>
            <div className="grid h-8 w-8 place-items-center rounded-xl bg-blue-50 text-blue-600 transition group-hover:scale-110">
              <Link2 className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-black tracking-tight text-zinc-900">{links.length}</p>
          <div className="mt-1.5 flex items-center justify-between text-xs text-zinc-500">
            <span>Links encurtados ativos</span>
            <span className="font-semibold text-blue-600 group-hover:underline">Gerenciar</span>
          </div>
        </Link>

        {/* KPI 2 */}
        <Link
          href="/dashboard/analytics"
          className="group rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs transition hover:border-emerald-400 hover:shadow-sm"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">
              Cliques nos Links
            </span>
            <div className="grid h-8 w-8 place-items-center rounded-xl bg-emerald-50 text-emerald-600 transition group-hover:scale-110">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-black tracking-tight text-zinc-900">
            {totalClicks.toLocaleString("pt-BR")}
          </p>
          <div className="mt-1.5 flex items-center justify-between text-xs text-zinc-500">
            <span>Acessos acumulados</span>
            <span className="font-semibold text-emerald-600 group-hover:underline">Ver Analytics</span>
          </div>
        </Link>

        {/* KPI 3 */}
        <Link
          href="/dashboard/bio"
          className="group rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs transition hover:border-purple-400 hover:shadow-sm"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">
              Bio Pages
            </span>
            <div className="grid h-8 w-8 place-items-center rounded-xl bg-purple-50 text-purple-600 transition group-hover:scale-110">
              <Smartphone className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-black tracking-tight text-zinc-900">{bios.length}</p>
          <div className="mt-1.5 flex items-center justify-between text-xs text-zinc-500">
            <span>{totalBioViews.toLocaleString("pt-BR")} visualizações</span>
            <span className="font-semibold text-purple-600 group-hover:underline">Editar Bio</span>
          </div>
        </Link>

        {/* KPI 4 */}
        <Link
          href="/dashboard/cards"
          className="group rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs transition hover:border-amber-400 hover:shadow-sm"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">
              Equipes & Cards
            </span>
            <div className="grid h-8 w-8 place-items-center rounded-xl bg-amber-50 text-amber-600 transition group-hover:scale-110">
              <UserCheck className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-black tracking-tight text-zinc-900">{orgs.length}</p>
          <div className="mt-1.5 flex items-center justify-between text-xs text-zinc-500">
            <span>Equipes e crachás</span>
            <span className="font-semibold text-amber-600 group-hover:underline">Ver Cards</span>
          </div>
        </Link>
      </div>

      {/* 5. LISTA DE LINKS RECENTES (TABELA DE ALTO CONTRASTE) */}
      <RecentLinksTable links={(links as any) || []} userHandle={userHandle} />

      {/* 6. UTILITÁRIOS RÁPIDOS & QR CODES (LINKS COMPACTOS) */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs">
        <div className="flex items-center justify-between mb-3 border-b border-zinc-100 pb-3">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-500">
              Utilitários Rápidos & QR Codes
            </h2>
            <p className="text-[11px] text-zinc-400">
              Geradores pontuais para campanhas, cobranças Pix e atendimento
            </p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Link
            href="/dashboard/tools/whatsapp"
            className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white p-3.5 transition hover:border-emerald-500 hover:shadow-xs group"
          >
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-emerald-50 text-emerald-600 group-hover:scale-105 transition">
              <MessageSquare className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-zinc-900 group-hover:text-emerald-700 transition">
                WhatsApp wa.me
              </p>
              <p className="text-[11px] text-zinc-500 truncate">Link direto com mensagem</p>
            </div>
          </Link>

          <Link
            href="/dashboard/tools/pix"
            className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white p-3.5 transition hover:border-amber-500 hover:shadow-xs group"
          >
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-amber-50 text-amber-600 group-hover:scale-105 transition">
              <DollarSign className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-zinc-900 group-hover:text-amber-700 transition">
                Pix BR Code
              </p>
              <p className="text-[11px] text-zinc-500 truncate">Cobrança e QR Code 0% taxa</p>
            </div>
          </Link>

          <Link
            href="/dashboard/tools/wifi"
            className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white p-3.5 transition hover:border-sky-500 hover:shadow-xs group"
          >
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-sky-50 text-sky-600 group-hover:scale-105 transition">
              <Wifi className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-zinc-900 group-hover:text-sky-700 transition">
                QR Code Wi-Fi
              </p>
              <p className="text-[11px] text-zinc-500 truncate">Conexão rápida de visitantes</p>
            </div>
          </Link>

          <Link
            href="/dashboard/tools/utm"
            className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white p-3.5 transition hover:border-indigo-500 hover:shadow-xs group"
          >
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-indigo-50 text-indigo-600 group-hover:scale-105 transition">
              <Compass className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-zinc-900 group-hover:text-indigo-700 transition">
                UTM Builder
              </p>
              <p className="text-[11px] text-zinc-500 truncate">Parâmetros para marketing</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
