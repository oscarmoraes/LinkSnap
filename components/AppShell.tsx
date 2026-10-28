"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import {
  LayoutDashboard,
  Link2,
  Smartphone,
  UserCheck,
  BarChart3,
  MessageSquare,
  DollarSign,
  Wifi,
  Compass,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronRight,
  ChevronDown,
  Sparkles,
  Plus,
  Zap,
  ExternalLink,
} from "lucide-react";

interface AppShellProps {
  children: React.ReactNode;
  userEmail: string;
  userHandle: string;
  brandName?: string;
  brandLogoUrl?: string | null;
  planTier: string;
}

export default function AppShell({
  children,
  userEmail,
  userHandle,
  brandName = "LinkSnap",
  brandLogoUrl = null,
  planTier,
}: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [quickCreateOpen, setQuickCreateOpen] = useState(false);
  const [toolsExpanded, setToolsExpanded] = useState(() =>
    pathname.startsWith("/dashboard/tools")
  );

  const quickCreateRef = useRef<HTMLDivElement>(null);
  const mobileQuickCreateRef = useRef<HTMLDivElement>(null);

  // Fecha dropdown ao navegar
  useEffect(() => {
    setQuickCreateOpen(false);
    setMobileMenuOpen(false);
    if (pathname.startsWith("/dashboard/tools")) {
      setToolsExpanded(true);
    }
  }, [pathname]);

  // Fecha dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        quickCreateRef.current &&
        !quickCreateRef.current.contains(event.target as Node) &&
        mobileQuickCreateRef.current &&
        !mobileQuickCreateRef.current.contains(event.target as Node)
      ) {
        setQuickCreateOpen(false);
      }
    };
    if (quickCreateOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [quickCreateOpen]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  // Os 5 Pilares Principais do Produto
  const coreNavItems = [
    { label: "Visão Geral", href: "/dashboard", icon: LayoutDashboard },
    { label: "Bio Pages", href: "/dashboard/bio", icon: Smartphone },
    { label: "Meus Links", href: "/dashboard/links", icon: Link2 },
    { label: "Carteirinhas", href: "/dashboard/cards", icon: UserCheck },
    { label: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
  ];

  // Utilitários e Geradores Rápidos
  const toolItems = [
    { label: "WhatsApp wa.me", href: "/dashboard/tools/whatsapp", icon: MessageSquare, desc: "Link direto com mensagem" },
    { label: "Pix BR Code", href: "/dashboard/tools/pix", icon: DollarSign, desc: "Cobrança instantânea" },
    { label: "QR Code Wi-Fi", href: "/dashboard/tools/wifi", icon: Wifi, desc: "Acesso fácil à rede" },
    { label: "UTM Builder", href: "/dashboard/tools/utm", icon: Compass, desc: "Parâmetros de campanha" },
  ];

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  const isPro = planTier === "pro" || planTier === "enterprise";

  const getBreadcrumbTitle = () => {
    if (pathname === "/dashboard") return "Visão Geral";
    if (pathname === "/dashboard/bio") return "Bio Pages";
    if (pathname.startsWith("/dashboard/bio/")) return "Editor de Bio";
    if (pathname === "/dashboard/links") return "Meus Links";
    if (pathname === "/dashboard/cards") return "Carteirinhas";
    if (pathname.startsWith("/dashboard/cards/")) return "Equipe & Crachás";
    if (pathname === "/dashboard/analytics") return "Analytics";
    if (pathname === "/dashboard/settings") return "Configurações";
    if (pathname === "/dashboard/tools/whatsapp") return "WhatsApp wa.me";
    if (pathname === "/dashboard/tools/pix") return "Pix BR Code";
    if (pathname === "/dashboard/tools/wifi") return "QR Code Wi-Fi";
    if (pathname === "/dashboard/tools/utm") return "UTM Builder";
    return pathname.split("/")[2]?.replace(/-/g, " ") || "Painel";
  };

  return (
    <div className="flex h-screen w-full flex-col bg-white text-zinc-900 antialiased overflow-hidden">
      {/* 1. TOPBAR FIXA (56px) */}
      <header className="z-30 flex h-14 shrink-0 items-center justify-between border-b border-zinc-200 bg-white px-4 sm:px-6 shadow-xs">
        {/* Esquerda: Menu Mobile, Logo & Breadcrumb */}
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-lg p-1.5 text-zinc-600 hover:bg-zinc-100 md:hidden shrink-0"
            aria-label="Abrir menu lateral"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          <Link href="/dashboard" className="flex items-center gap-2.5 shrink-0 group">
            {brandLogoUrl ? (
              <img
                src={brandLogoUrl}
                alt={brandName}
                className="h-8 w-8 rounded-lg object-contain border border-zinc-200"
              />
            ) : !brandName || brandName.toLowerCase() === "linksnap" ? (
              <img
                src="/brand/logo-mark.svg"
                alt="LinkSnap"
                className="h-8 w-8 rounded-lg object-contain shadow-xs transition group-hover:scale-105"
              />
            ) : (
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-blue-600 text-sm font-black text-white shadow-sm uppercase">
                {(brandName || "L").charAt(0)}
              </span>
            )}
            <div className="flex flex-col">
              <span className="text-sm font-bold tracking-tight text-zinc-900 leading-tight truncate max-w-[120px] sm:max-w-[180px]">
                {brandName}
              </span>
              <span className="text-[10px] text-zinc-400 font-normal leading-none">
                Workspace
              </span>
            </div>
          </Link>

          <span className="hidden h-4 w-px bg-zinc-200 md:block"></span>

          {/* Breadcrumb Desktop */}
          <nav className="hidden items-center gap-1.5 text-xs text-zinc-500 md:flex truncate">
            <span className="text-zinc-400">Workspace</span>
            <ChevronRight className="h-3 w-3 text-zinc-300 shrink-0" />
            <span className="font-semibold text-zinc-900 truncate">
              {getBreadcrumbTitle()}
            </span>
          </nav>
        </div>

        {/* Direita: Badge do Plano e Ações Rápidas */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Badge do Plano com Link Direto para Upgrade / Gerenciamento */}
          <Link
            href="/dashboard/settings#plan"
            className={`group flex items-center gap-1.5 sm:gap-2 rounded-full border px-2.5 py-1 text-xs font-semibold transition-all shadow-xs ${
              isPro
                ? "border-amber-400 bg-amber-50 text-amber-900 hover:border-amber-500 hover:bg-amber-100"
                : "border-blue-300 bg-blue-50 text-blue-900 hover:bg-blue-100 hover:border-blue-400"
            }`}
            title={
              isPro
                ? "Plano PRO Ativo - Clique para gerenciar sua assinatura"
                : "Plano FREE - Clique para fazer upgrade para PRO"
            }
          >
            <span className="hidden sm:inline font-mono text-zinc-700 font-semibold text-[11px]">
              @{userHandle}
            </span>
            <span className="hidden sm:inline h-3.5 w-px bg-zinc-300"></span>

            {isPro ? (
              <span className="flex items-center gap-1 font-bold text-amber-900 text-[11px]">
                <Sparkles className="h-3.5 w-3.5 fill-amber-500 text-amber-600 animate-pulse" />
                PRO ⚡
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <span className="rounded bg-white px-1.5 py-0.5 text-[9px] font-black text-blue-700 uppercase border border-blue-200 shadow-2xs">
                  FREE
                </span>
                <span className="flex items-center gap-1 rounded-full bg-amber-600 hover:bg-amber-700 px-2.5 py-0.5 text-[10px] font-bold text-white shadow-2xs transition">
                  <Zap className="h-2.5 w-2.5 fill-white text-white" />
                  <span>Upgrade</span>
                </span>
              </span>
            )}
          </Link>

          {/* Botão de Sair */}
          <button
            onClick={handleSignOut}
            className="flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-600 transition hover:bg-zinc-50 hover:text-red-600 hover:border-red-200"
            title="Encerrar sessão"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Sair</span>
          </button>
        </div>
      </header>

      {/* 2. ÁREA DE CORPO: SIDEBAR + MAIN AREA */}
      <div className="flex flex-1 overflow-hidden">
        {/* SIDEBAR DESKTOP */}
        <aside className="hidden w-64 shrink-0 flex-col justify-between border-r border-zinc-200 bg-white p-3 md:flex">
          <div className="space-y-4">
            {/* BOTÃO SUSPENSO: ✨ CRIAR RÁPIDO */}
            <div className="relative" ref={quickCreateRef}>
              <button
                type="button"
                onClick={() => setQuickCreateOpen(!quickCreateOpen)}
                className="flex w-full items-center justify-between gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 px-3.5 py-2.5 text-xs font-bold text-white shadow-xs transition focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
              >
                <span className="flex items-center gap-2">
                  <Sparkles className="h-3.5 w-3.5 text-amber-300 fill-amber-300" />
                  <span>Criar Rápido</span>
                </span>
                <Plus
                  className={`h-4 w-4 transition-transform duration-200 ${
                    quickCreateOpen ? "rotate-45" : ""
                  }`}
                />
              </button>

              {/* Menu Suspenso de Criação Rápida */}
              {quickCreateOpen && (
                <div className="absolute left-0 top-full mt-2 w-72 rounded-xl border border-zinc-200 bg-white p-2 shadow-xl z-50 animate-in fade-in zoom-in-95 duration-150">
                  <p className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                    Ações Principais
                  </p>
                  <div className="space-y-0.5">
                    <Link
                      href="/dashboard/bio"
                      onClick={() => setQuickCreateOpen(false)}
                      className="flex items-center justify-between rounded-lg px-2.5 py-2 text-xs font-medium text-zinc-800 hover:bg-zinc-100 transition group"
                    >
                      <span className="flex items-center gap-2.5">
                        <span className="grid h-7 w-7 place-items-center rounded-lg bg-purple-50 text-purple-600 group-hover:scale-105 transition">
                          <Smartphone className="h-3.5 w-3.5" />
                        </span>
                        <div>
                          <p className="font-semibold text-zinc-900 leading-none">Nova Bio Page</p>
                          <p className="text-[10px] text-zinc-400 mt-0.5">Página de links /b/@handle</p>
                        </div>
                      </span>
                      <span className="rounded bg-purple-100 px-1.5 py-0.2 text-[9px] font-bold text-purple-700">
                        Bio
                      </span>
                    </Link>

                    <Link
                      href="/dashboard/links"
                      onClick={() => setQuickCreateOpen(false)}
                      className="flex items-center justify-between rounded-lg px-2.5 py-2 text-xs font-medium text-zinc-800 hover:bg-zinc-100 transition group"
                    >
                      <span className="flex items-center gap-2.5">
                        <span className="grid h-7 w-7 place-items-center rounded-lg bg-blue-50 text-blue-600 group-hover:scale-105 transition">
                          <Link2 className="h-3.5 w-3.5" />
                        </span>
                        <div>
                          <p className="font-semibold text-zinc-900 leading-none">Encurtar Link</p>
                          <p className="text-[10px] text-zinc-400 mt-0.5">Link curto rastreável /r/</p>
                        </div>
                      </span>
                      <span className="rounded bg-blue-100 px-1.5 py-0.2 text-[9px] font-bold text-blue-700">
                        Link
                      </span>
                    </Link>

                    <Link
                      href="/dashboard/cards"
                      onClick={() => setQuickCreateOpen(false)}
                      className="flex items-center justify-between rounded-lg px-2.5 py-2 text-xs font-medium text-zinc-800 hover:bg-zinc-100 transition group"
                    >
                      <span className="flex items-center gap-2.5">
                        <span className="grid h-7 w-7 place-items-center rounded-lg bg-amber-50 text-amber-600 group-hover:scale-105 transition">
                          <UserCheck className="h-3.5 w-3.5" />
                        </span>
                        <div>
                          <p className="font-semibold text-zinc-900 leading-none">Nova Carteirinha</p>
                          <p className="text-[10px] text-zinc-400 mt-0.5">Crachá de equipe com QR</p>
                        </div>
                      </span>
                      <span className="rounded bg-amber-100 px-1.5 py-0.2 text-[9px] font-bold text-amber-800">
                        Equipe
                      </span>
                    </Link>
                  </div>

                  <div className="my-1.5 border-t border-zinc-100"></div>

                  <p className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                    Utilitários Rápidos
                  </p>
                  <div className="space-y-0.5">
                    {toolItems.map((tool) => {
                      const Icon = tool.icon;
                      return (
                        <Link
                          key={tool.href}
                          href={tool.href}
                          onClick={() => setQuickCreateOpen(false)}
                          className="flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs text-zinc-700 hover:bg-zinc-100 transition"
                        >
                          <Icon className="h-3.5 w-3.5 text-zinc-500" />
                          <span className="truncate">{tool.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* SEÇÃO PRINCIPAL: OS 5 PILARES DO PRODUTO */}
            <div>
              <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">
                Plataforma
              </p>
              <div className="space-y-1">
                {coreNavItems.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold transition-all ${
                        active
                          ? "bg-blue-600 text-white shadow-xs"
                          : "text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950"
                      }`}
                    >
                      <Icon
                        className={`h-4 w-4 shrink-0 ${
                          active ? "text-white" : "text-zinc-600"
                        }`}
                      />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* SEÇÃO SUTIL RECOLHÍVEL: UTILITÁRIOS & QR */}
            <div className="pt-2 border-t border-zinc-200">
              <button
                type="button"
                onClick={() => setToolsExpanded(!toolsExpanded)}
                className="flex w-full items-center justify-between rounded-lg px-3 py-1.5 text-[11px] font-medium text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950 transition"
              >
                <span className="flex items-center gap-1.5 font-semibold">
                  <span>Utilitários & QR</span>
                  {pathname.startsWith("/dashboard/tools") && (
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-600"></span>
                  )}
                </span>
                <ChevronDown
                  className={`h-3.5 w-3.5 text-zinc-500 transition-transform duration-200 ${
                    toolsExpanded ? "rotate-180" : ""
                  }`}
                />
              </button>

              {toolsExpanded && (
                <div className="mt-1 space-y-0.5 animate-in fade-in duration-150 pl-2 border-l border-zinc-200 ml-3">
                  {toolItems.map((tool) => {
                    const Icon = tool.icon;
                    const active = pathname === tool.href;
                    return (
                      <Link
                        key={tool.href}
                        href={tool.href}
                        className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs transition ${
                          active
                            ? "bg-blue-50 font-bold text-blue-700"
                            : "text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950"
                        }`}
                      >
                        <Icon
                          className={`h-3.5 w-3.5 shrink-0 ${
                            active ? "text-blue-600" : "text-zinc-500"
                          }`}
                        />
                        <span className="truncate">{tool.label}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* RODAPÉ DA SIDEBAR: CONFIGURAÇÕES & STATUS */}
          <div className="space-y-2 border-t border-zinc-200 pt-3">
            <Link
              href="/dashboard/settings"
              className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold transition ${
                isActive("/dashboard/settings")
                  ? "bg-zinc-900 text-white"
                  : "text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950"
              }`}
            >
              <Settings className="h-4 w-4 shrink-0 text-zinc-600" />
              <span>Configurações</span>
            </Link>

            {/* Banner de Upgrade Sutil no Rodapé para Free */}
            {!isPro && (
              <div className="rounded-xl border border-amber-300 bg-amber-50/90 p-3 text-xs shadow-2xs">
                <div className="flex items-center gap-1.5 font-bold text-amber-950">
                  <Sparkles className="h-3.5 w-3.5 text-amber-600 fill-amber-500" />
                  <span>Plano LinkSnap Pro</span>
                </div>
                <p className="mt-1 text-[11px] text-amber-900 leading-tight">
                  Links com sua @marca, crachás digitais e analytics sem limites.
                </p>
                <Link
                  href="/dashboard/settings#plan"
                  className="mt-2 block w-full rounded-lg bg-amber-600 hover:bg-amber-700 py-1.5 text-center text-[11px] font-bold text-white shadow-xs transition"
                >
                  Conhecer Planos
                </Link>
              </div>
            )}
          </div>
        </aside>

        {/* SIDEBAR MOBILE (DRAWER) */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-40 flex md:hidden">
            <div
              className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
              onClick={() => setMobileMenuOpen(false)}
            ></div>
            <div className="relative flex w-72 max-w-xs flex-1 flex-col justify-between bg-white p-4 shadow-xl z-50 animate-in slide-in-from-left duration-200">
              <div className="space-y-5 overflow-y-auto">
                <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
                  <div className="flex items-center gap-2">
                    <img
                      src="/brand/logo-mark.svg"
                      alt="LinkSnap"
                      className="h-7 w-7 rounded-lg object-contain shadow-2xs"
                    />
                    <span className="font-bold text-sm text-zinc-900">{brandName}</span>
                  </div>
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100"
                    aria-label="Fechar menu"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Botão de Criação Rápida Mobile */}
                <div className="space-y-1">
                  <p className="px-2 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                    Ações Rápidas
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <Link
                      href="/dashboard/bio"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex flex-col items-center gap-1 rounded-xl border border-purple-200 bg-purple-50/60 p-2.5 text-center transition active:bg-purple-100"
                    >
                      <Smartphone className="h-4 w-4 text-purple-600" />
                      <span className="text-[11px] font-bold text-purple-900">Nova Bio</span>
                    </Link>
                    <Link
                      href="/dashboard/links"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex flex-col items-center gap-1 rounded-xl border border-blue-200 bg-blue-50/60 p-2.5 text-center transition active:bg-blue-100"
                    >
                      <Link2 className="h-4 w-4 text-blue-600" />
                      <span className="text-[11px] font-bold text-blue-900">Encurtar Link</span>
                    </Link>
                  </div>
                </div>

                {/* 5 Pilares Mobile */}
                <div>
                  <p className="px-2 text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
                    Plataforma
                  </p>
                  <div className="space-y-1">
                    {coreNavItems.map((item) => {
                      const Icon = item.icon;
                      const active = isActive(item.href);
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setMobileMenuOpen(false)}
                          className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold ${
                            active
                              ? "bg-blue-600 text-white"
                              : "text-zinc-700 hover:bg-zinc-100"
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                          <span>{item.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>

                {/* Utilitários Mobile */}
                <div>
                  <p className="px-2 text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
                    Utilitários & QR Codes
                  </p>
                  <div className="space-y-1">
                    {toolItems.map((tool) => {
                      const Icon = tool.icon;
                      const active = pathname === tool.href;
                      return (
                        <Link
                          key={tool.href}
                          href={tool.href}
                          onClick={() => setMobileMenuOpen(false)}
                          className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium ${
                            active
                              ? "bg-blue-50 text-blue-700 font-bold"
                              : "text-zinc-600 hover:bg-zinc-100"
                          }`}
                        >
                          <Icon className="h-3.5 w-3.5 text-zinc-500" />
                          <span>{tool.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Rodapé Mobile Drawer */}
              <div className="border-t border-zinc-200 pt-3 space-y-2">
                <Link
                  href="/dashboard/settings"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold ${
                    isActive("/dashboard/settings")
                      ? "bg-zinc-900 text-white"
                      : "text-zinc-700 hover:bg-zinc-100"
                  }`}
                >
                  <Settings className="h-4 w-4" />
                  <span>Configurações</span>
                </Link>

                <div className="flex items-center justify-between px-2 pt-2 text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-zinc-600 font-semibold">@{userHandle}</span>
                    <span className="rounded bg-zinc-100 px-1.5 py-0.2 text-[9px] font-bold uppercase text-zinc-600">
                      {planTier}
                    </span>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="flex items-center gap-1 text-xs font-semibold text-red-600 hover:underline"
                  >
                    <LogOut className="h-3.5 w-3.5" /> Sair
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3. ÁREA DE TRABALHO CENTRAL */}
        <main className="flex-1 overflow-y-auto bg-[#F8FAFC] p-4 sm:p-6 lg:p-8 custom-scrollbar">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
