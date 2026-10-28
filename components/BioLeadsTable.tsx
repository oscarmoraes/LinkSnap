"use client";

import { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import Papa from "papaparse";
import { createClient } from "@/utils/supabase/client";
import {
  Users,
  Calendar,
  Award,
  Search,
  Download,
  Trash2,
  ExternalLink,
  Mail,
  MessageCircle,
  Copy,
  Check,
  X,
  Filter,
  Plus,
  ArrowRight,
  HelpCircle,
  Clock,
  Sparkles,
} from "lucide-react";

export interface BioLeadItem {
  id: string;
  bio_page_id: string;
  name: string;
  contact: string;
  message: string | null;
  created_at: string;
  bio_pages?:
    | {
        title: string;
        slug: string;
      }
    | {
        title: string;
        slug: string;
      }[]
    | null;
}

export interface BioPageRef {
  id: string;
  title: string;
  slug: string;
}

interface BioLeadsTableProps {
  initialLeads: BioLeadItem[];
  bios: BioPageRef[];
  handle: string;
  origin: string;
  onLeadCountChange?: (count: number) => void;
  onLeadDeleted?: (id: string) => void;
  onSwitchToBiosTab?: () => void;
}

export default function BioLeadsTable({
  initialLeads,
  bios,
  handle,
  origin,
  onLeadCountChange,
  onLeadDeleted,
  onSwitchToBiosTab,
}: BioLeadsTableProps) {
  const supabase = createClient();
  const [leads, setLeads] = useState<BioLeadItem[]>(initialLeads);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBioId, setSelectedBioId] = useState<string>("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [expandedMessageId, setExpandedMessageId] = useState<string | null>(null);

  // Helper para extrair informações da bio page vinculada ao lead
  const getBioInfo = useCallback(
    (lead: BioLeadItem) => {
      let bp: { title: string; slug: string } | null = null;
      if (Array.isArray(lead.bio_pages) && lead.bio_pages.length > 0) {
        bp = lead.bio_pages[0];
      } else if (lead.bio_pages && !Array.isArray(lead.bio_pages)) {
        bp = lead.bio_pages;
      }
      if (!bp) {
        const found = bios.find((b) => b.id === lead.bio_page_id);
        if (found) bp = { title: found.title, slug: found.slug };
      }
      return bp;
    },
    [bios]
  );

  // Métricas
  const totalLeads = leads.length;

  const leadsLast7Days = useMemo(() => {
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return leads.filter((l) => new Date(l.created_at).getTime() >= sevenDaysAgo).length;
  }, [leads]);

  const topConvertingBio = useMemo(() => {
    if (leads.length === 0) return null;

    const countMap: Record<string, number> = {};
    leads.forEach((l) => {
      countMap[l.bio_page_id] = (countMap[l.bio_page_id] || 0) + 1;
    });

    let topId = "";
    let max = 0;
    for (const [id, count] of Object.entries(countMap)) {
      if (count > max) {
        max = count;
        topId = id;
      }
    }

    if (!topId || max === 0) return null;
    const bioObj = bios.find((b) => b.id === topId);
    const fallbackTitle =
      leads.find((l) => l.bio_page_id === topId)?.name || "Página de Bio";

    return {
      title: bioObj?.title || fallbackTitle,
      count: max,
      percent: Math.round((max / leads.length) * 100),
    };
  }, [leads, bios]);

  // Filtros aplicados
  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      const matchesBio =
        selectedBioId === "all" || lead.bio_page_id === selectedBioId;
      if (!matchesBio) return false;

      if (!searchQuery.trim()) return true;
      const query = searchQuery.toLowerCase().trim();
      const nameMatches = lead.name.toLowerCase().includes(query);
      const contactMatches = (lead.contact || "").toLowerCase().includes(query);
      const messageMatches = (lead.message || "").toLowerCase().includes(query);

      const bioInfo = getBioInfo(lead);
      const bioTitleMatches = bioInfo?.title.toLowerCase().includes(query) ?? false;

      return nameMatches || contactMatches || messageMatches || bioTitleMatches;
    });
  }, [leads, selectedBioId, searchQuery, getBioInfo]);

  // Ação de Excluir Lead
  const handleDeleteLead = async (id: string, name: string) => {
    if (
      !confirm(
        `Tem certeza que deseja excluir o lead de "${name}"? Esta ação não pode ser desfeita.`
      )
    ) {
      return;
    }

    setDeletingId(id);
    try {
      const { error } = await supabase.from("bio_leads").delete().eq("id", id);
      if (error) throw error;

      const updated = leads.filter((l) => l.id !== id);
      setLeads(updated);
      if (onLeadDeleted) onLeadDeleted(id);
      if (onLeadCountChange) onLeadCountChange(updated.length);
    } catch (err: any) {
      alert("Erro ao excluir lead: " + (err.message || "Tente novamente."));
    } finally {
      setDeletingId(null);
    }
  };

  // Copiar contato para área de transferência
  const handleCopyContact = async (contact: string, id: string) => {
    await navigator.clipboard.writeText(contact);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Exportar para CSV com PapaParse
  const handleExportCSV = () => {
    if (filteredLeads.length === 0) return;

    const dataToExport = filteredLeads.map((lead) => {
      const bioInfo = getBioInfo(lead);
      const isEmail = lead.contact.includes("@");
      const digits = lead.contact.replace(/\D/g, "");
      const isPhone = !isEmail && digits.length >= 10;

      let contactType = "Outro";
      if (isEmail) contactType = "E-mail";
      else if (isPhone) contactType = "WhatsApp / Telefone";

      return {
        Nome: lead.name,
        Contato: lead.contact,
        "Tipo de Contato": contactType,
        "Mensagem / Interesse": lead.message || "",
        "Página de Origem": bioInfo?.title || "Bio",
        "URL da Bio": bioInfo ? `${origin}/b/${handle}/${bioInfo.slug}` : "",
        "Data da Captura": new Date(lead.created_at).toLocaleString("pt-BR", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
    });

    const csvContent = "\uFEFF" + Papa.unparse(dataToExport);
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `leads-linksnap-${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* 1. CARDS DE MÉTRICAS NO TOPO */}
      <div className="grid gap-4 sm:grid-cols-3">
        {/* Card 1: Total de Leads */}
        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm hover:border-zinc-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
              Total de Leads
            </span>
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-blue-50 text-blue-600">
              <Users className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold tracking-tight text-zinc-900">
              {totalLeads.toLocaleString("pt-BR")}
            </span>
            <span className="text-xs text-zinc-500 font-medium">contatos</span>
          </div>
          <p className="mt-1 text-xs text-zinc-400">
            Cadastros capturados em todas as suas bios
          </p>
        </div>

        {/* Card 2: Últimos 7 dias */}
        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm hover:border-zinc-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
              Últimos 7 Dias
            </span>
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-50 text-emerald-600">
              <Calendar className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold tracking-tight text-zinc-900">
              {leadsLast7Days.toLocaleString("pt-BR")}
            </span>
            <span className="text-xs text-emerald-600 font-semibold">novos leads</span>
          </div>
          <p className="mt-1 text-xs text-zinc-400">
            {totalLeads > 0
              ? `${Math.round((leadsLast7Days / totalLeads) * 100)}% de todo o histórico capturado`
              : "Nenhum lead nesta semana"}
          </p>
        </div>

        {/* Card 3: Página com mais conversões */}
        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm hover:border-zinc-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
              Top Conversão
            </span>
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-amber-50 text-amber-600">
              <Award className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-2">
            {topConvertingBio ? (
              <>
                <p className="text-base font-bold text-zinc-900 truncate">
                  {topConvertingBio.title}
                </p>
                <p className="mt-0.5 text-xs text-zinc-500">
                  <strong className="text-zinc-900 font-bold">
                    {topConvertingBio.count}
                  </strong>{" "}
                  leads ({topConvertingBio.percent}% do total)
                </p>
              </>
            ) : (
              <>
                <span className="text-2xl font-bold tracking-tight text-zinc-400">
                  —
                </span>
                <p className="mt-1 text-xs text-zinc-400">Sem conversões registradas</p>
              </>
            )}
          </div>
          <p className="mt-1 text-xs text-zinc-400">
            Página de Bio mais eficiente em captura
          </p>
        </div>
      </div>

      {/* 2. BARRA DE FERRAMENTAS E FILTROS */}
      <div className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          {/* Campo de Busca */}
          <div className="relative flex-1 max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nome, contato ou mensagem..."
              className="w-full rounded-lg border border-zinc-300 bg-zinc-50/50 py-2 pl-9 pr-8 text-xs text-zinc-900 placeholder-zinc-400 transition focus:border-blue-600 focus:bg-white focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                title="Limpar busca"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Seletor de Bio Page */}
          <div className="flex items-center gap-2">
            <Filter className="h-3.5 w-3.5 text-zinc-400 hidden sm:block" />
            <select
              value={selectedBioId}
              onChange={(e) => setSelectedBioId(e.target.value)}
              className="rounded-lg border border-zinc-300 bg-zinc-50/50 py-2 px-3 text-xs font-medium text-zinc-700 transition focus:border-blue-600 focus:bg-white focus:outline-none"
            >
              <option value="all">Todas as Bio Pages ({leads.length})</option>
              {bios.map((b) => {
                const countForBio = leads.filter((l) => l.bio_page_id === b.id).length;
                return (
                  <option key={b.id} value={b.id}>
                    {b.title} ({countForBio})
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        {/* Botão de Exportar CSV */}
        <div className="flex items-center justify-between sm:justify-end gap-2 border-t border-zinc-100 pt-3 md:border-t-0 md:pt-0">
          <span className="text-[11px] text-zinc-500 font-medium">
            Exibindo <strong>{filteredLeads.length}</strong> de{" "}
            <strong>{totalLeads}</strong> leads
          </span>

          <button
            type="button"
            onClick={handleExportCSV}
            disabled={filteredLeads.length === 0}
            className="flex items-center gap-1.5 rounded-lg border border-zinc-300 bg-white hover:bg-zinc-50 px-3.5 py-2 text-xs font-semibold text-zinc-800 shadow-sm transition disabled:opacity-40 disabled:cursor-not-allowed"
            title={
              filteredLeads.length === 0
                ? "Nenhum lead disponível para exportar"
                : "Baixar planilha em formato CSV"
            }
          >
            <Download className="h-3.5 w-3.5 text-zinc-600" />
            <span>Exportar CSV</span>
          </button>
        </div>
      </div>

      {/* 3. TABELA OU EMPTY STATES */}
      {leads.length === 0 ? (
        /* Empty State Geral (nenhum lead coletado) */
        <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-12 text-center shadow-sm">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-indigo-50 text-indigo-600">
            <Users className="h-7 w-7" />
          </div>
          <h3 className="mt-4 text-base font-bold text-zinc-900">
            Nenhum lead capturado ainda
          </h3>
          <p className="mt-1.5 text-xs text-zinc-500 max-w-md mx-auto leading-relaxed">
            Adicione um bloco de <strong>Captura de Leads</strong> no editor da sua
            página de Bio para coletar contatos de clientes, interessados e novos
            inscritos na sua lista.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            {bios.length > 0 ? (
              <Link
                href={`/dashboard/bio/${bios[0].id}`}
                className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 px-4 py-2 text-xs font-bold text-white shadow-sm transition"
              >
                <Sparkles className="h-3.5 w-3.5" /> Adicionar Bloco na Minha Bio
              </Link>
            ) : (
              <button
                type="button"
                onClick={onSwitchToBiosTab}
                className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 px-4 py-2 text-xs font-bold text-white shadow-sm transition"
              >
                <Plus className="h-3.5 w-3.5" /> Criar Primeira Bio Page
              </button>
            )}
            {onSwitchToBiosTab && (
              <button
                type="button"
                onClick={onSwitchToBiosTab}
                className="inline-flex items-center gap-1 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 px-4 py-2 text-xs font-medium text-zinc-700 transition"
              >
                Ver minhas Bio Pages
                <ArrowRight className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>
      ) : filteredLeads.length === 0 ? (
        /* Empty State de Filtro / Busca sem resultados */
        <div className="rounded-xl border border-zinc-200 bg-white p-10 text-center shadow-sm">
          <Search className="mx-auto h-8 w-8 text-zinc-400" />
          <h4 className="mt-3 text-sm font-bold text-zinc-800">
            Nenhum lead encontrado para este filtro
          </h4>
          <p className="mt-1 text-xs text-zinc-500">
            Tente buscar com outro termo ou redefinir o seletor de Bio Page.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery("");
              setSelectedBioId("all");
            }}
            className="mt-4 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
          >
            Limpar Filtros
          </button>
        </div>
      ) : (
        /* Tabela Clean White High-Definition */
        <div className="rounded-xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50/70 text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                  <th className="py-3 px-4">Nome</th>
                  <th className="py-3 px-4">Contato</th>
                  <th className="py-3 px-4">Mensagem / Interesse</th>
                  <th className="py-3 px-4">Bio de Origem</th>
                  <th className="py-3 px-4">Data e Hora</th>
                  <th className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 text-xs">
                {filteredLeads.map((lead) => {
                  const bioInfo = getBioInfo(lead);
                  const isEmail = lead.contact.includes("@");
                  const digits = lead.contact.replace(/\D/g, "");
                  const isPhone = !isEmail && digits.length >= 10;

                  // Atalho WhatsApp wa.me
                  const whatsappLink = isPhone
                    ? `https://wa.me/${digits.startsWith("55") ? digits : `55${digits}`}?text=${encodeURIComponent(
                        `Olá ${lead.name}! Recebi seu contato através da minha Bio no LinkSnap.`
                      )}`
                    : null;

                  // Atalho Mailto
                  const emailLink = isEmail
                    ? `mailto:${lead.contact}?subject=${encodeURIComponent(
                        "Contato LinkSnap"
                      )}`
                    : null;

                  // Iniciais para avatar
                  const initials = lead.name
                    .split(" ")
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((n) => n[0].toUpperCase())
                    .join("");

                  const isExpanded = expandedMessageId === lead.id;

                  return (
                    <tr
                      key={lead.id}
                      className="group hover:bg-blue-50/30 transition-colors"
                    >
                      {/* Coluna 1: Nome com Avatar */}
                      <td className="py-3.5 px-4 font-medium text-zinc-900">
                        <div className="flex items-center gap-2.5">
                          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-zinc-100 font-mono text-[10px] font-bold text-zinc-700 group-hover:bg-blue-100 group-hover:text-blue-800 transition">
                            {initials || "L"}
                          </span>
                          <span className="font-semibold text-zinc-900 truncate max-w-[160px]">
                            {lead.name}
                          </span>
                        </div>
                      </td>

                      {/* Coluna 2: Contato + Atalhos */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col gap-1 items-start">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-xs text-zinc-800 font-medium">
                              {lead.contact}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopyContact(lead.contact, lead.id)}
                              className="rounded p-0.5 text-zinc-400 hover:text-zinc-700 transition"
                              title="Copiar contato"
                            >
                              {copiedId === lead.id ? (
                                <Check className="h-3 w-3 text-emerald-600" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </button>
                          </div>

                          {/* Botão de Ação Rápida: WhatsApp ou Email */}
                          {whatsappLink && (
                            <a
                              href={whatsappLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 rounded bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 px-2 py-0.5 text-[10px] font-bold text-emerald-700 transition"
                            >
                              <MessageCircle className="h-3 w-3" />
                              Conversar no WhatsApp
                            </a>
                          )}

                          {emailLink && (
                            <a
                              href={emailLink}
                              className="inline-flex items-center gap-1 rounded bg-blue-50 hover:bg-blue-100 border border-blue-200/80 px-2 py-0.5 text-[10px] font-bold text-blue-700 transition"
                            >
                              <Mail className="h-3 w-3" />
                              Enviar E-mail
                            </a>
                          )}
                        </div>
                      </td>

                      {/* Coluna 3: Mensagem / Interesse */}
                      <td className="py-3.5 px-4 text-zinc-600 max-w-xs">
                        {lead.message ? (
                          <div>
                            <p
                              className={`leading-relaxed text-zinc-700 ${
                                isExpanded ? "whitespace-pre-wrap" : "line-clamp-2"
                              }`}
                            >
                              {lead.message}
                            </p>
                            {lead.message.length > 80 && (
                              <button
                                type="button"
                                onClick={() =>
                                  setExpandedMessageId(isExpanded ? null : lead.id)
                                }
                                className="mt-0.5 text-[10px] font-semibold text-blue-600 hover:underline"
                              >
                                {isExpanded ? "Ver menos" : "Ver mensagem completa"}
                              </button>
                            )}
                          </div>
                        ) : (
                          <span className="text-zinc-400 italic">Sem mensagem</span>
                        )}
                      </td>

                      {/* Coluna 4: Bio de Origem (Badge Clicável) */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {bioInfo ? (
                          <a
                            href={`${origin}/b/${handle}/${bioInfo.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 rounded-md bg-purple-50 hover:bg-purple-100 border border-purple-200/80 px-2 py-1 text-xs font-semibold text-purple-700 transition max-w-[170px] truncate"
                            title={`Abrir ${bioInfo.title} (/b/${handle}/${bioInfo.slug})`}
                          >
                            <span className="truncate">{bioInfo.title}</span>
                            <ExternalLink className="h-3 w-3 shrink-0 opacity-60" />
                          </a>
                        ) : (
                          <span className="text-zinc-400 text-xs">Bio desativada</span>
                        )}
                      </td>

                      {/* Coluna 5: Data e Hora Formatada */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-zinc-500 font-medium">
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-zinc-400" />
                          <span>
                            {new Date(lead.created_at).toLocaleString("pt-BR", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </td>

                      {/* Coluna 6: Ações */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleDeleteLead(lead.id, lead.name)}
                          disabled={deletingId === lead.id}
                          className="rounded-lg border border-zinc-200 bg-white p-1.5 text-zinc-400 hover:border-red-200 hover:bg-red-50 hover:text-red-600 transition disabled:opacity-50"
                          title="Excluir este lead"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Rodapé da tabela com informações de resumo */}
          <div className="flex items-center justify-between border-t border-zinc-200 bg-zinc-50/50 px-4 py-2.5 text-[11px] text-zinc-500">
            <span>
              Mostrando <strong>{filteredLeads.length}</strong> registro(s)
            </span>
            <span>LinkSnap Bio Lead Management</span>
          </div>
        </div>
      )}
    </div>
  );
}
