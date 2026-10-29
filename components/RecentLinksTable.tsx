"use client";

import { useState } from "react";
import Link from "next/link";
import { Link2, Copy, Check, ExternalLink, ArrowRight } from "lucide-react";

export interface DashboardLinkItem {
  id: string;
  short_code: string;
  long_url: string;
  title: string | null;
  clicks: number;
  is_custom_slug: boolean;
  created_at: string;
  custom_domain_id?: string | null;
  custom_domains?: { domain?: string } | { domain?: string }[] | any;
}

interface RecentLinksTableProps {
  links: DashboardLinkItem[];
  userHandle: string;
}

export default function RecentLinksTable({ links, userHandle }: RecentLinksTableProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const getDomainName = (link: DashboardLinkItem) => {
    if (Array.isArray(link.custom_domains)) {
      return link.custom_domains[0]?.domain;
    }
    return link.custom_domains?.domain;
  };

  const handleCopy = async (link: DashboardLinkItem) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const cd = getDomainName(link);
    const fullUrl = cd ? `https://${cd}/${link.short_code}` : `${origin}/r/${link.short_code}`;
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopiedId(link.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // fallback
    }
  };

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch {
      return "";
    }
  };

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white shadow-xs overflow-hidden">
      {/* Header da Seção */}
      <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-50/70 px-5 py-4">
        <div className="flex items-center gap-2.5">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-blue-50 text-blue-600 border border-blue-200/60">
            <Link2 className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-zinc-900">Links Recentes</h2>
              <span className="rounded-full bg-zinc-200 px-2 py-0.5 text-[10px] font-bold text-zinc-800 border border-zinc-300">
                {links.length}
              </span>
            </div>
            <p className="text-[11px] text-zinc-600">Últimos links encurtados no seu workspace</p>
          </div>
        </div>

        <Link
          href="/dashboard/links"
          className="group flex items-center gap-1 rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-bold text-blue-700 hover:text-blue-800 hover:border-blue-300 hover:bg-blue-50/50 transition shadow-2xs"
        >
          <span>Gerenciar Todos</span>
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>

      {/* Lista de Itens */}
      <div className="divide-y divide-zinc-200">
        {links.length === 0 ? (
          <div className="p-10 text-center">
            <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-blue-50 text-blue-600 border border-blue-200">
              <Link2 className="h-6 w-6" />
            </div>
            <p className="text-sm font-bold text-zinc-900">Nenhum link criado ainda</p>
            <p className="mx-auto mt-1 max-w-sm text-xs text-zinc-600">
              Crie seu primeiro link curto para compartilhar no WhatsApp, Instagram ou campanhas com métricas de cliques.
            </p>
            <Link
              href="/dashboard/links"
              className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-700 transition"
            >
              Encurtar Primeiro Link
            </Link>
          </div>
        ) : (
          links.slice(0, 6).map((link) => {
            const isCopied = copiedId === link.id;
            return (
              <div
                key={link.id}
                className="group flex flex-col gap-2 p-4 transition hover:bg-zinc-50/80 sm:flex-row sm:items-center sm:justify-between"
              >
                {/* Info do Link */}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {(() => {
                      const domainName = getDomainName(link);
                      return (
                        <>
                          <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50/80 border border-blue-200/70 rounded px-1.5 py-0.5 hover:underline">
                            {domainName ? `${domainName}/${link.short_code}` : `/r/${link.short_code}`}
                          </span>

                          {domainName ? (
                            <span className="rounded bg-purple-50 px-2 py-0.5 text-[9px] font-bold text-purple-700 border border-purple-200">
                              🌐 Domínio Próprio
                            </span>
                          ) : link.is_custom_slug ? (
                            <span className="rounded bg-purple-50 px-2 py-0.5 text-[9px] font-bold text-purple-700 border border-purple-200">
                              @{userHandle}
                            </span>
                          ) : null}
                        </>
                      );
                    })()}

                    <span className="truncate text-xs font-bold text-zinc-900">
                      {link.title || "Sem título"}
                    </span>
                  </div>

                  <p className="truncate text-[11px] text-zinc-600 mt-1 max-w-xl font-mono">
                    {link.long_url}
                  </p>

                  <div className="mt-1 flex items-center gap-3 text-[10px] text-zinc-500 font-medium">
                    <span>Criado em {formatDate(link.created_at)}</span>
                  </div>
                </div>

                {/* Métricas e Ações */}
                <div className="flex items-center justify-between gap-4 shrink-0 sm:justify-end">
                  {/* Cliques */}
                  <div className="rounded-lg bg-zinc-100 border border-zinc-200 px-2.5 py-1 text-right">
                    <span className="font-mono text-xs font-bold text-zinc-900">
                      {Number(link.clicks || 0).toLocaleString("pt-BR")}
                    </span>
                    <span className="ml-1 text-[10px] text-zinc-600 font-semibold">cliques</span>
                  </div>

                  {/* Botões de Ação */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleCopy(link)}
                      className={`flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition ${
                        isCopied
                          ? "border-emerald-400 bg-emerald-50 text-emerald-800"
                          : "border-zinc-300 bg-white text-zinc-800 hover:bg-zinc-100"
                      }`}
                      title="Copiar link curto"
                    >
                      {isCopied ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-600" />
                          <span className="text-[10px] font-bold">Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5 text-zinc-600" />
                          <span className="text-[10px]">Copiar</span>
                        </>
                      )}
                    </button>

                    <a
                      href={`/r/${link.short_code}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-lg border border-zinc-200 bg-white p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 transition"
                      title="Abrir link em nova aba"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
