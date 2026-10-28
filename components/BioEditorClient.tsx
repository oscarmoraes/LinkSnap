"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  ExternalLink,
  Eye,
  Check,
  Palette,
  Layout,
  MessageSquare,
  DollarSign,
  Link2,
  ShoppingBag,
  Users,
  Type,
  BadgeCheck,
  Calendar,
  Download,
  Tag,
  Image as ImageIcon,
  Copy,
  Sparkles,
  QrCode,
  Send,
  MousePointerClick,
} from "lucide-react";

export interface BioBlockData {
  // Common / Link
  title?: string;
  subtitle?: string;
  url?: string;
  badge?: string;
  start_at?: string;
  end_at?: string;
  // Product / Vitrine
  price?: string;
  oldPrice?: string;
  imageUrl?: string;
  coupon?: string;
  // Pix
  pixKey?: string;
  beneficiary?: string;
  city?: string;
  amount?: string;
  description?: string;
  // WhatsApp
  phone?: string;
  message?: string;
  // Lead Form
  buttonText?: string;
  placeholderContact?: string;
}

export interface BioBlock {
  id?: string;
  type: string;
  data: BioBlockData;
  position: number;
  clicks?: number;
}

export interface BioLead {
  id: string;
  name: string;
  contact: string;
  message?: string | null;
  created_at: string;
}

export interface BioTheme {
  bg: string;
  text: string;
  cardBg: string;
  cardText: string;
  accent: string;
  verified?: boolean;
  hideBranding?: boolean;
  presetName?: string;
}

export interface BioPageData {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  avatar_url: string | null;
  layout: string;
  theme: BioTheme;
  views?: number;
}

const THEME_PRESETS: { name: string; label: string; theme: Omit<BioTheme, "verified" | "hideBranding"> }[] = [
  {
    name: "clean",
    label: "Claro Clean",
    theme: {
      bg: "#FFFFFF",
      text: "#111827",
      cardBg: "#EFF2F6",
      cardText: "#18181B",
      accent: "#2563EB",
    },
  },
  {
    name: "dark",
    label: "Dark Elegance",
    theme: {
      bg: "#09090B",
      text: "#FAFAFA",
      cardBg: "#18181B",
      cardText: "#F4F4F5",
      accent: "#3B82F6",
    },
  },
  {
    name: "emerald",
    label: "Emerald Sales",
    theme: {
      bg: "#ECFDF5",
      text: "#064E3B",
      cardBg: "#FFFFFF",
      cardText: "#065F46",
      accent: "#059669",
    },
  },
  {
    name: "royal",
    label: "Royal Blue",
    theme: {
      bg: "#0F172A",
      text: "#F8FAFC",
      cardBg: "#1E293B",
      cardText: "#F1F5F9",
      accent: "#6366F1",
    },
  },
  {
    name: "sunset",
    label: "Sunset Creator",
    theme: {
      bg: "#FFF7ED",
      text: "#431407",
      cardBg: "#FFFFFF",
      cardText: "#7C2D12",
      accent: "#EA580C",
    },
  },
];

export default function BioEditorClient({
  initialPage,
  initialBlocks,
  initialLeads = [],
  handle,
  origin,
}: {
  initialPage: BioPageData;
  initialBlocks: BioBlock[];
  initialLeads?: BioLead[];
  handle: string;
  origin: string;
}) {
  const router = useRouter();
  const supabase = createClient();

  const [page, setPage] = useState<BioPageData>({
    ...initialPage,
    theme: {
      bg: initialPage.theme?.bg || "#FFFFFF",
      text: initialPage.theme?.text || "#111827",
      cardBg: initialPage.theme?.cardBg || "#EFF2F6",
      cardText: initialPage.theme?.cardText || "#18181B",
      accent: initialPage.theme?.accent || "#2563EB",
      verified: initialPage.theme?.verified ?? false,
      hideBranding: initialPage.theme?.hideBranding ?? false,
    },
  });
  const [blocks, setBlocks] = useState<BioBlock[]>(initialBlocks);
  const [leads, setLeads] = useState<BioLead[]>(initialLeads);
  const [activeTab, setActiveTab] = useState<"editor" | "leads">("editor");
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  const publicUrl = `${origin}/b/${handle}/${page.slug}`;

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const handleAddBlock = (type: string) => {
    let defaultData: BioBlockData = {};
    if (type === "link") {
      defaultData = {
        title: "Meu Link Oficial",
        subtitle: "Clique para acessar",
        url: "https://",
        badge: "",
        start_at: "",
        end_at: "",
      };
    } else if (type === "product") {
      defaultData = {
        title: "Mentoria / Produto Digital",
        price: "R$ 97,00",
        oldPrice: "R$ 197,00",
        imageUrl: "",
        coupon: "OFF10",
        url: "https://",
        badge: "OFERTA",
      };
    } else if (type === "pix") {
      defaultData = {
        title: "Pagar ou Apoiar via Pix",
        pixKey: "",
        beneficiary: page.title || "Recebedor",
        city: "SAO PAULO",
        amount: "",
        description: "Pagamento rápido com QR Code Oficial",
      };
    } else if (type === "whatsapp") {
      defaultData = {
        title: "Atendimento no WhatsApp",
        subtitle: "Resposta rápida em horário comercial",
        phone: "5511999998888",
        message: "Olá! Vim pela sua página de Bio.",
      };
    } else if (type === "lead_form") {
      defaultData = {
        title: "Receba Novidades e Ofertas VIP",
        subtitle: "Deixe seu contato para entrarmos em contato com você.",
        buttonText: "Quero Receber",
        placeholderContact: "Seu WhatsApp ou E-mail",
      };
    } else if (type === "header") {
      defaultData = {
        title: "Destaques & Links",
      };
    }

    const newBlock: BioBlock = {
      type,
      data: defaultData,
      position: blocks.length,
      clicks: 0,
    };
    setBlocks([...blocks, newBlock]);
  };

  const handleUpdateBlockData = (index: number, key: keyof BioBlockData, value: string) => {
    setBlocks((prev) =>
      prev.map((block, idx) =>
        idx === index
          ? { ...block, data: { ...block.data, [key]: value } }
          : block
      )
    );
  };

  const handleRemoveBlock = (index: number) => {
    setBlocks(blocks.filter((_, i) => i !== index));
  };

  const handleMoveBlock = (index: number, direction: "up" | "down") => {
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === blocks.length - 1) return;

    const newBlocks = [...blocks];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    const temp = newBlocks[index];
    newBlocks[index] = newBlocks[targetIndex];
    newBlocks[targetIndex] = temp;

    newBlocks.forEach((b, idx) => (b.position = idx));
    setBlocks(newBlocks);
  };

  const handleApplyPreset = (preset: (typeof THEME_PRESETS)[number]) => {
    setPage({
      ...page,
      theme: {
        ...page.theme,
        ...preset.theme,
      },
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setSavedSuccess(false);

    try {
      const cleanSlug = page.slug.toLowerCase().replace(/[^a-z0-9_-]/g, "") || "principal";

      // 1. Atualiza bio_page
      const { error: pageErr } = await supabase
        .from("bio_pages")
        .update({
          title: page.title,
          description: page.description,
          slug: cleanSlug,
          layout: page.layout,
          theme: page.theme,
          avatar_url: page.avatar_url,
        })
        .eq("id", page.id);

      if (pageErr) throw pageErr;

      // 2. Sincroniza blocos (limpa e recria mantendo cliques se existir)
      const { error: deleteErr } = await supabase
        .from("bio_blocks")
        .delete()
        .eq("bio_page_id", page.id);

      if (deleteErr) throw deleteErr;

      if (blocks.length > 0) {
        const blocksToInsert = blocks.map((b, idx) => ({
          bio_page_id: page.id,
          position: idx,
          type: b.type,
          data: b.data,
          clicks: b.clicks || 0,
          is_active: true,
        }));
        const { data: insertedBlocks, error: blockErr } = await supabase
          .from("bio_blocks")
          .insert(blocksToInsert)
          .select("id, type, data, position, clicks");

        if (blockErr) throw blockErr;
        if (insertedBlocks) {
          setBlocks(insertedBlocks);
        }
      }

      setPage((prev) => ({ ...prev, slug: cleanSlug }));
      router.refresh();
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err: any) {
      alert("Erro ao salvar: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteLead = async (leadId: string) => {
    const { error } = await supabase.from("bio_leads").delete().eq("id", leadId);
    if (!error) {
      setLeads(leads.filter((l) => l.id !== leadId));
    } else {
      alert("Erro ao excluir contato: " + error.message);
    }
  };

  const handleExportLeadsCsv = () => {
    if (leads.length === 0) return;
    const headers = ["Nome", "Contato", "Mensagem", "Data"];
    const rows = leads.map((l) => [
      `"${(l.name || "").replace(/"/g, '""')}"`,
      `"${(l.contact || "").replace(/"/g, '""')}"`,
      `"${(l.message || "").replace(/"/g, '""')}"`,
      `"${new Date(l.created_at).toLocaleString("pt-BR")}"`,
    ]);
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `leads-bio-${page.slug}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isBlockScheduledActive = (b: BioBlock) => {
    const now = new Date();
    if (b.data.start_at) {
      const start = new Date(b.data.start_at);
      if (!isNaN(start.getTime()) && start > now) return false;
    }
    if (b.data.end_at) {
      const end = new Date(b.data.end_at);
      if (!isNaN(end.getTime()) && end < now) return false;
    }
    return true;
  };

  const getBlockTypeBadge = (type: string) => {
    switch (type) {
      case "link":
        return { label: "Link Padrão", color: "bg-blue-50 text-blue-700 border-blue-200" };
      case "product":
        return { label: "Vitrine / Produto", color: "bg-purple-50 text-purple-700 border-purple-200" };
      case "pix":
        return { label: "Pix na Bio", color: "bg-amber-50 text-amber-800 border-amber-200" };
      case "whatsapp":
        return { label: "WhatsApp", color: "bg-emerald-50 text-emerald-700 border-emerald-200" };
      case "lead_form":
        return { label: "Captura de Leads", color: "bg-indigo-50 text-indigo-700 border-indigo-200" };
      case "header":
        return { label: "Cabeçalho / Seção", color: "bg-zinc-100 text-zinc-700 border-zinc-300" };
      default:
        return { label: type, color: "bg-zinc-100 text-zinc-700 border-zinc-200" };
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header do Editor */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-200 pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/bio"
            className="rounded-lg border border-zinc-200 bg-white p-2 text-zinc-600 hover:bg-zinc-100 transition"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-zinc-900">
                {page.title || "Editor de Bio"}
              </h1>
              {page.theme.verified && (
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700 border border-blue-200">
                  <BadgeCheck className="h-3.5 w-3.5 text-blue-600" /> Verificado
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <p className="font-mono text-xs text-blue-600 truncate max-w-[260px] sm:max-w-md">
                {publicUrl}
              </p>
              <button
                type="button"
                onClick={handleCopyUrl}
                className="inline-flex items-center gap-1 rounded border border-zinc-200 bg-zinc-50 px-1.5 py-0.5 text-[10px] font-medium text-zinc-600 hover:bg-zinc-100"
              >
                {copiedUrl ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                {copiedUrl ? "Copiado" : "Copiar"}
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Seletor de Abas (Editor vs Leads Capturados) */}
          <div className="flex rounded-lg border border-zinc-200 bg-zinc-100 p-0.5">
            <button
              type="button"
              onClick={() => setActiveTab("editor")}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                activeTab === "editor"
                  ? "bg-white text-zinc-900 shadow-sm"
                  : "text-zinc-600 hover:text-zinc-900"
              }`}
            >
              Editor & Blocos
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("leads")}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                activeTab === "leads"
                  ? "bg-white text-zinc-900 shadow-sm"
                  : "text-zinc-600 hover:text-zinc-900"
              }`}
            >
              <Users className="h-3.5 w-3.5 text-indigo-600" />
              Leads Capturados ({leads.length})
            </button>
          </div>

          <a
            href={publicUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 shadow-sm"
          >
            <Eye className="h-3.5 w-3.5 text-zinc-500" />
            Ver Página
          </a>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 px-4 py-2 text-xs font-semibold text-white shadow-sm transition disabled:opacity-50"
          >
            {savedSuccess ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-300" /> Salvo com Sucesso!
              </>
            ) : (
              <>
                <Save className="h-3.5 w-3.5" /> {saving ? "Salvando..." : "Salvar Alterações"}
              </>
            )}
          </button>
        </div>
      </div>

      {/* ABA DE LEADS CAPTURADOS */}
      {activeTab === "leads" ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-200 pb-4">
            <div>
              <h2 className="text-base font-bold text-zinc-900 flex items-center gap-2">
                <Users className="h-4 w-4 text-indigo-600" />
                Contatos Capturados na Bio ({leads.length})
              </h2>
              <p className="text-xs text-zinc-500 mt-0.5">
                Todos os visitantes que preencheram o bloco de &ldquo;Formulário de Captura&rdquo; nesta página aparecem aqui.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleExportLeadsCsv}
                disabled={leads.length === 0}
                className="flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 disabled:opacity-40"
              >
                <Download className="h-3.5 w-3.5" />
                Exportar CSV
              </button>
            </div>
          </div>

          {leads.length === 0 ? (
            <div className="rounded-xl border border-dashed border-zinc-200 p-10 text-center space-y-2">
              <Users className="h-8 w-8 text-zinc-400 mx-auto" />
              <p className="text-sm font-semibold text-zinc-700">Nenhum lead capturado ainda</p>
              <p className="text-xs text-zinc-500 max-w-md mx-auto">
                Adicione um bloco de <strong>Captura de Leads</strong> no editor da sua Bio para coletar Nome, WhatsApp ou E-mail dos seus visitantes.
              </p>
              <button
                type="button"
                onClick={() => {
                  setActiveTab("editor");
                  handleAddBlock("lead_form");
                }}
                className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-indigo-700"
              >
                <Plus className="h-3.5 w-3.5" /> Adicionar Bloco de Captura Agora
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-zinc-200 text-[11px] font-bold uppercase text-zinc-500 bg-zinc-50/60">
                    <th className="py-2.5 px-3">Nome</th>
                    <th className="py-2.5 px-3">WhatsApp / E-mail</th>
                    <th className="py-2.5 px-3">Mensagem</th>
                    <th className="py-2.5 px-3">Data</th>
                    <th className="py-2.5 px-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 text-xs">
                  {leads.map((lead) => {
                    const digits = (lead.contact || "").replace(/\D/g, "");
                    const isPhone = digits.length >= 10;
                    const whatsappLink = isPhone
                      ? `https://wa.me/${digits.startsWith("55") ? digits : `55${digits}`}?text=${encodeURIComponent(
                          `Olá ${lead.name}! Recebi seu contato pela minha página de Bio.`
                        )}`
                      : null;

                    return (
                      <tr key={lead.id} className="hover:bg-zinc-50/80">
                        <td className="py-3 px-3 font-semibold text-zinc-900">{lead.name}</td>
                        <td className="py-3 px-3 font-mono text-zinc-700">{lead.contact}</td>
                        <td className="py-3 px-3 text-zinc-600 max-w-xs truncate">
                          {lead.message || <span className="text-zinc-400">—</span>}
                        </td>
                        <td className="py-3 px-3 text-zinc-500 whitespace-nowrap">
                          {new Date(lead.created_at).toLocaleString("pt-BR", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                        <td className="py-3 px-3 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5">
                            {whatsappLink && (
                              <a
                                href={whatsappLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-100"
                              >
                                <MessageSquare className="h-3 w-3" /> Chamar no Whats
                              </a>
                            )}
                            <button
                              type="button"
                              onClick={() => handleDeleteLead(lead.id)}
                              className="rounded-lg border border-zinc-200 p-1.5 text-zinc-400 hover:text-red-600 hover:border-red-200"
                              title="Excluir lead"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        /* Grid Principal: 2 Colunas (Editor à esquerda, Preview ao vivo à direita) */
        <div className="grid gap-6 lg:grid-cols-12 items-start">
          {/* COLUNA ESQUERDA: Configurações, Aparência & Blocos (7 colunas) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Card 1: Informações Básicas e Credibilidade */}
            <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-blue-600" />
                  Perfil, Credibilidade & Aparência
                </h2>
                <span className="text-[11px] text-zinc-400">
                  {page.views || 0} visualizações
                </span>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-600 mb-1">
                    Título / Nome na Bio *
                  </label>
                  <input
                    type="text"
                    value={page.title}
                    onChange={(e) => setPage({ ...page, title: e.target.value })}
                    className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs text-zinc-900 focus:border-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-zinc-600 mb-1">
                    Slug da URL (/b/{handle}/...)
                  </label>
                  <input
                    type="text"
                    value={page.slug}
                    onChange={(e) => setPage({ ...page, slug: e.target.value })}
                    className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs font-mono text-blue-700 focus:border-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-600 mb-1">
                    URL da Foto de Perfil / Logo (Avatar)
                  </label>
                  <input
                    type="url"
                    value={page.avatar_url || ""}
                    onChange={(e) => setPage({ ...page, avatar_url: e.target.value })}
                    placeholder="https://exemplo.com/foto.jpg"
                    className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs text-zinc-900 focus:border-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-zinc-600 mb-1">
                    Bio / Descrição Curta
                  </label>
                  <input
                    type="text"
                    value={page.description || ""}
                    onChange={(e) => setPage({ ...page, description: e.target.value })}
                    placeholder="Especialista em vendas, loja oficial..."
                    className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs text-zinc-900 focus:border-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              {/* Toggles de Credibilidade e White-label */}
              <div className="grid gap-3 sm:grid-cols-2 pt-1">
                <label className="flex items-center justify-between rounded-xl border border-zinc-200 bg-zinc-50/70 p-3 cursor-pointer hover:bg-zinc-50">
                  <div className="flex items-center gap-2.5">
                    <BadgeCheck className="h-4 w-4 text-blue-600 shrink-0" />
                    <div>
                      <span className="block text-xs font-semibold text-zinc-900">
                        Selo Verificado Azul
                      </span>
                      <span className="block text-[10px] text-zinc-500">
                        Exibe check oficial ao lado do nome
                      </span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={Boolean(page.theme.verified)}
                    onChange={(e) =>
                      setPage({
                        ...page,
                        theme: { ...page.theme, verified: e.target.checked },
                      })
                    }
                    className="h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
                  />
                </label>

                <label className="flex items-center justify-between rounded-xl border border-zinc-200 bg-zinc-50/70 p-3 cursor-pointer hover:bg-zinc-50">
                  <div className="flex items-center gap-2.5">
                    <Sparkles className="h-4 w-4 text-amber-600 shrink-0" />
                    <div>
                      <span className="block text-xs font-semibold text-zinc-900">
                        Ocultar marca LinkSnap
                      </span>
                      <span className="block text-[10px] text-zinc-500">
                        Remove selo do rodapé público
                      </span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={Boolean(page.theme.hideBranding)}
                    onChange={(e) =>
                      setPage({
                        ...page,
                        theme: { ...page.theme, hideBranding: e.target.checked },
                      })
                    }
                    className="h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
                  />
                </label>
              </div>

              {/* Presets Rápidos de Tema de Cores */}
              <div>
                <label className="block text-[11px] font-semibold text-zinc-600 mb-2 flex items-center gap-1.5">
                  <Palette className="h-3.5 w-3.5 text-zinc-500" />
                  Temas de Cores Profissionais
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {THEME_PRESETS.map((preset) => {
                    const isSelected =
                      page.theme.bg.toLowerCase() === preset.theme.bg.toLowerCase() &&
                      page.theme.accent.toLowerCase() === preset.theme.accent.toLowerCase();
                    return (
                      <button
                        key={preset.name}
                        type="button"
                        onClick={() => handleApplyPreset(preset)}
                        className={`flex flex-col items-center gap-1.5 rounded-xl border p-2.5 text-center transition ${
                          isSelected
                            ? "border-blue-600 bg-blue-50/60 ring-1 ring-blue-600"
                            : "border-zinc-200 bg-zinc-50 hover:bg-zinc-100"
                        }`}
                      >
                        <div className="flex items-center gap-1">
                          <span
                            className="h-4 w-4 rounded-full border border-zinc-300"
                            style={{ backgroundColor: preset.theme.bg }}
                          />
                          <span
                            className="h-4 w-4 rounded-full border border-zinc-300"
                            style={{ backgroundColor: preset.theme.cardBg }}
                          />
                          <span
                            className="h-4 w-4 rounded-full"
                            style={{ backgroundColor: preset.theme.accent }}
                          />
                        </div>
                        <span className="text-[11px] font-semibold text-zinc-800">
                          {preset.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Cores Customizadas Finas */}
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 pt-1">
                <div>
                  <label className="block text-[10px] font-medium text-zinc-500 mb-1">Fundo</label>
                  <input
                    type="color"
                    value={page.theme.bg || "#FFFFFF"}
                    onChange={(e) =>
                      setPage({ ...page, theme: { ...page.theme, bg: e.target.value } })
                    }
                    className="h-8 w-full cursor-pointer rounded border border-zinc-200 bg-white p-0.5"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-zinc-500 mb-1">Texto</label>
                  <input
                    type="color"
                    value={page.theme.text || "#111827"}
                    onChange={(e) =>
                      setPage({ ...page, theme: { ...page.theme, text: e.target.value } })
                    }
                    className="h-8 w-full cursor-pointer rounded border border-zinc-200 bg-white p-0.5"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-zinc-500 mb-1">Botão</label>
                  <input
                    type="color"
                    value={page.theme.cardBg || "#F4F4F5"}
                    onChange={(e) =>
                      setPage({ ...page, theme: { ...page.theme, cardBg: e.target.value } })
                    }
                    className="h-8 w-full cursor-pointer rounded border border-zinc-200 bg-white p-0.5"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-zinc-500 mb-1">
                    Texto Botão
                  </label>
                  <input
                    type="color"
                    value={page.theme.cardText || "#18181B"}
                    onChange={(e) =>
                      setPage({ ...page, theme: { ...page.theme, cardText: e.target.value } })
                    }
                    className="h-8 w-full cursor-pointer rounded border border-zinc-200 bg-white p-0.5"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-zinc-500 mb-1">Destaque</label>
                  <input
                    type="color"
                    value={page.theme.accent || "#2563EB"}
                    onChange={(e) =>
                      setPage({ ...page, theme: { ...page.theme, accent: e.target.value } })
                    }
                    className="h-8 w-full cursor-pointer rounded border border-zinc-200 bg-white p-0.5"
                  />
                </div>
              </div>

              {/* Layout Picker */}
              <div>
                <label className="block text-[11px] font-semibold text-zinc-600 mb-2 flex items-center gap-1.5">
                  <Layout className="h-3.5 w-3.5 text-zinc-500" />
                  Estilo / Layout dos Blocos
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: "classic", label: "Classic" },
                    { id: "card", label: "Card Sombra" },
                    { id: "minimal", label: "Minimal" },
                    { id: "grid", label: "Grid 2 Col" },
                  ].map((l) => (
                    <button
                      key={l.id}
                      type="button"
                      onClick={() => setPage({ ...page, layout: l.id })}
                      className={`rounded-lg border p-2 text-center text-xs font-medium transition ${
                        page.layout === l.id
                          ? "border-blue-600 bg-blue-50 text-blue-700 font-bold"
                          : "border-zinc-200 bg-zinc-50 text-zinc-600 hover:bg-zinc-100"
                      }`}
                    >
                      {l.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Card 2: Lista de Blocos Ricos */}
            <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm space-y-4">
              <div className="space-y-3 border-b border-zinc-200 pb-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                    Adicionar Bloco Rico ({blocks.length} ativos)
                  </h2>
                </div>

                {/* Barra de 6 Tipos de Blocos Ricos */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleAddBlock("link")}
                    className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 hover:bg-blue-50 hover:border-blue-200 p-2.5 text-left transition"
                  >
                    <span className="grid h-7 w-7 place-items-center rounded-lg bg-blue-100 text-blue-700 shrink-0">
                      <Link2 className="h-4 w-4" />
                    </span>
                    <div>
                      <span className="block text-xs font-bold text-zinc-900">Link Padrão</span>
                      <span className="block text-[10px] text-zinc-500">Com selo e agendamento</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAddBlock("product")}
                    className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 hover:bg-purple-50 hover:border-purple-200 p-2.5 text-left transition"
                  >
                    <span className="grid h-7 w-7 place-items-center rounded-lg bg-purple-100 text-purple-700 shrink-0">
                      <ShoppingBag className="h-4 w-4" />
                    </span>
                    <div>
                      <span className="block text-xs font-bold text-zinc-900">Produto / Vitrine</span>
                      <span className="block text-[10px] text-zinc-500">Foto, preço e cupom</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAddBlock("pix")}
                    className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 hover:bg-amber-50 hover:border-amber-200 p-2.5 text-left transition"
                  >
                    <span className="grid h-7 w-7 place-items-center rounded-lg bg-amber-100 text-amber-800 shrink-0">
                      <DollarSign className="h-4 w-4" />
                    </span>
                    <div>
                      <span className="block text-xs font-bold text-zinc-900">Receber Pix</span>
                      <span className="block text-[10px] text-zinc-500">QR Code + Copia e Cola</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAddBlock("whatsapp")}
                    className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 hover:bg-emerald-50 hover:border-emerald-200 p-2.5 text-left transition"
                  >
                    <span className="grid h-7 w-7 place-items-center rounded-lg bg-emerald-100 text-emerald-700 shrink-0">
                      <MessageSquare className="h-4 w-4" />
                    </span>
                    <div>
                      <span className="block text-xs font-bold text-zinc-900">Botão WhatsApp</span>
                      <span className="block text-[10px] text-zinc-500">Mensagem pronta</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAddBlock("lead_form")}
                    className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 hover:bg-indigo-50 hover:border-indigo-200 p-2.5 text-left transition"
                  >
                    <span className="grid h-7 w-7 place-items-center rounded-lg bg-indigo-100 text-indigo-700 shrink-0">
                      <Users className="h-4 w-4" />
                    </span>
                    <div>
                      <span className="block text-xs font-bold text-zinc-900">Captura de Leads</span>
                      <span className="block text-[10px] text-zinc-500">Coleta Whats/E-mail</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAddBlock("header")}
                    className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 p-2.5 text-left transition"
                  >
                    <span className="grid h-7 w-7 place-items-center rounded-lg bg-zinc-200 text-zinc-700 shrink-0">
                      <Type className="h-4 w-4" />
                    </span>
                    <div>
                      <span className="block text-xs font-bold text-zinc-900">Cabeçalho</span>
                      <span className="block text-[10px] text-zinc-500">Divisor de seção</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Lista de Blocos Configurados */}
              <div className="space-y-3">
                {blocks.length === 0 ? (
                  <div className="p-8 text-center text-xs text-zinc-400 border border-dashed border-zinc-200 rounded-xl">
                    Nenhum bloco adicionado ainda. Escolha um dos 6 formatos acima para montar sua página.
                  </div>
                ) : (
                  blocks.map((block, idx) => {
                    const badgeInfo = getBlockTypeBadge(block.type);
                    const activeSchedule = isBlockScheduledActive(block);

                    return (
                      <div
                        key={idx}
                        className="flex items-start gap-2.5 rounded-xl border border-zinc-200 bg-zinc-50/70 p-4 transition hover:bg-zinc-50"
                      >
                        {/* Botões de Ordem */}
                        <div className="flex flex-col gap-1 pt-1">
                          <button
                            type="button"
                            onClick={() => handleMoveBlock(idx, "up")}
                            disabled={idx === 0}
                            className="rounded border border-zinc-200 bg-white px-1.5 py-0.5 text-zinc-500 hover:text-zinc-900 disabled:opacity-30 text-[10px]"
                          >
                            ▲
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveBlock(idx, "down")}
                            disabled={idx === blocks.length - 1}
                            className="rounded border border-zinc-200 bg-white px-1.5 py-0.5 text-zinc-500 hover:text-zinc-900 disabled:opacity-30 text-[10px]"
                          >
                            ▼
                          </button>
                        </div>

                        {/* Conteúdo do Bloco */}
                        <div className="flex-1 space-y-2.5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span
                                className={`rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase ${badgeInfo.color}`}
                              >
                                {badgeInfo.label}
                              </span>
                              {typeof block.clicks === "number" && block.type !== "header" && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-zinc-500">
                                  <MousePointerClick className="h-3 w-3" /> {block.clicks} cliques
                                </span>
                              )}
                              {!activeSchedule && (
                                <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800">
                                  Fora do período agendado
                                </span>
                              )}
                            </div>

                            <button
                              type="button"
                              onClick={() => handleRemoveBlock(idx)}
                              className="text-zinc-400 hover:text-red-600 p-1"
                              title="Remover bloco"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>

                          {/* BLOCO: HEADER */}
                          {block.type === "header" && (
                            <input
                              type="text"
                              value={block.data.title || ""}
                              onChange={(e) => handleUpdateBlockData(idx, "title", e.target.value)}
                              placeholder="Título da Seção (ex: Meus Cursos & Produtos)"
                              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-bold text-zinc-900 focus:border-blue-600 focus:outline-none"
                            />
                          )}

                          {/* BLOCO: LINK PADRÃO */}
                          {block.type === "link" && (
                            <div className="space-y-2">
                              <div className="grid gap-2 sm:grid-cols-3">
                                <div className="sm:col-span-2">
                                  <input
                                    type="text"
                                    value={block.data.title || ""}
                                    onChange={(e) =>
                                      handleUpdateBlockData(idx, "title", e.target.value)
                                    }
                                    placeholder="Título do botão *"
                                    className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-900 focus:border-blue-600 focus:outline-none"
                                  />
                                </div>
                                <div>
                                  <input
                                    type="text"
                                    value={block.data.badge || ""}
                                    onChange={(e) =>
                                      handleUpdateBlockData(idx, "badge", e.target.value)
                                    }
                                    placeholder="Selo (ex: NOVO, 🔥)"
                                    className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs text-zinc-700 focus:border-blue-600 focus:outline-none"
                                  />
                                </div>
                              </div>

                              <div className="grid gap-2 sm:grid-cols-2">
                                <input
                                  type="text"
                                  value={block.data.subtitle || ""}
                                  onChange={(e) =>
                                    handleUpdateBlockData(idx, "subtitle", e.target.value)
                                  }
                                  placeholder="Subtítulo opcional"
                                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs text-zinc-600 focus:border-blue-600 focus:outline-none"
                                />
                                <input
                                  type="url"
                                  value={block.data.url || ""}
                                  onChange={(e) =>
                                    handleUpdateBlockData(idx, "url", e.target.value)
                                  }
                                  placeholder="https://destino.com.br"
                                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-mono text-blue-700 focus:border-blue-600 focus:outline-none"
                                />
                              </div>

                              {/* Agendamento de Início e Fim */}
                              <div className="grid gap-2 sm:grid-cols-2 pt-1 border-t border-zinc-200/60">
                                <div>
                                  <label className="block text-[10px] font-medium text-zinc-500 mb-0.5 flex items-center gap-1">
                                    <Calendar className="h-3 w-3" /> Mostrar a partir de (opcional)
                                  </label>
                                  <input
                                    type="datetime-local"
                                    value={block.data.start_at || ""}
                                    onChange={(e) =>
                                      handleUpdateBlockData(idx, "start_at", e.target.value)
                                    }
                                    className="w-full rounded-lg border border-zinc-300 bg-white px-2.5 py-1 text-[11px] text-zinc-700 focus:outline-none"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] font-medium text-zinc-500 mb-0.5 flex items-center gap-1">
                                    <Calendar className="h-3 w-3" /> Ocultar após (opcional)
                                  </label>
                                  <input
                                    type="datetime-local"
                                    value={block.data.end_at || ""}
                                    onChange={(e) =>
                                      handleUpdateBlockData(idx, "end_at", e.target.value)
                                    }
                                    className="w-full rounded-lg border border-zinc-300 bg-white px-2.5 py-1 text-[11px] text-zinc-700 focus:outline-none"
                                  />
                                </div>
                              </div>
                            </div>
                          )}

                          {/* BLOCO: PRODUTO / VITRINE */}
                          {block.type === "product" && (
                            <div className="space-y-2">
                              <div className="grid gap-2 sm:grid-cols-3">
                                <div className="sm:col-span-2">
                                  <input
                                    type="text"
                                    value={block.data.title || ""}
                                    onChange={(e) =>
                                      handleUpdateBlockData(idx, "title", e.target.value)
                                    }
                                    placeholder="Nome do Produto *"
                                    className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-900 focus:border-blue-600 focus:outline-none"
                                  />
                                </div>
                                <div>
                                  <input
                                    type="text"
                                    value={block.data.badge || ""}
                                    onChange={(e) =>
                                      handleUpdateBlockData(idx, "badge", e.target.value)
                                    }
                                    placeholder="Badge (ex: 50% OFF)"
                                    className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs text-purple-700 font-semibold focus:border-blue-600 focus:outline-none"
                                  />
                                </div>
                              </div>

                              <div className="grid gap-2 sm:grid-cols-3">
                                <input
                                  type="text"
                                  value={block.data.price || ""}
                                  onChange={(e) =>
                                    handleUpdateBlockData(idx, "price", e.target.value)
                                  }
                                  placeholder="Preço Por (ex: R$ 97,00)"
                                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-bold text-emerald-700 focus:outline-none"
                                />
                                <input
                                  type="text"
                                  value={block.data.oldPrice || ""}
                                  onChange={(e) =>
                                    handleUpdateBlockData(idx, "oldPrice", e.target.value)
                                  }
                                  placeholder="Preço De (ex: R$ 197,00)"
                                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs text-zinc-500 focus:outline-none"
                                />
                                <input
                                  type="text"
                                  value={block.data.coupon || ""}
                                  onChange={(e) =>
                                    handleUpdateBlockData(idx, "coupon", e.target.value)
                                  }
                                  placeholder="Cupom (ex: VIP10)"
                                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-mono uppercase text-zinc-800 focus:outline-none"
                                />
                              </div>

                              <div className="grid gap-2 sm:grid-cols-2">
                                <input
                                  type="url"
                                  value={block.data.imageUrl || ""}
                                  onChange={(e) =>
                                    handleUpdateBlockData(idx, "imageUrl", e.target.value)
                                  }
                                  placeholder="URL da Foto do Produto (opcional)"
                                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs text-zinc-600 focus:outline-none"
                                />
                                <input
                                  type="url"
                                  value={block.data.url || ""}
                                  onChange={(e) =>
                                    handleUpdateBlockData(idx, "url", e.target.value)
                                  }
                                  placeholder="Link de Checkout / Compra *"
                                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-mono text-blue-700 focus:outline-none"
                                />
                              </div>
                            </div>
                          )}

                          {/* BLOCO: PIX NA BIO */}
                          {block.type === "pix" && (
                            <div className="space-y-2">
                              <div className="grid gap-2 sm:grid-cols-2">
                                <input
                                  type="text"
                                  value={block.data.title || ""}
                                  onChange={(e) =>
                                    handleUpdateBlockData(idx, "title", e.target.value)
                                  }
                                  placeholder="Título do botão Pix *"
                                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-900 focus:outline-none"
                                />
                                <input
                                  type="text"
                                  value={block.data.pixKey || ""}
                                  onChange={(e) =>
                                    handleUpdateBlockData(idx, "pixKey", e.target.value)
                                  }
                                  placeholder="Chave Pix (CPF, CNPJ, E-mail, Celular ou Aleatória) *"
                                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-mono text-amber-900 focus:outline-none"
                                />
                              </div>

                              <div className="grid gap-2 sm:grid-cols-3">
                                <input
                                  type="text"
                                  value={block.data.beneficiary || ""}
                                  onChange={(e) =>
                                    handleUpdateBlockData(idx, "beneficiary", e.target.value)
                                  }
                                  placeholder="Nome do Recebedor"
                                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs text-zinc-700 focus:outline-none"
                                />
                                <input
                                  type="text"
                                  value={block.data.city || ""}
                                  onChange={(e) =>
                                    handleUpdateBlockData(idx, "city", e.target.value)
                                  }
                                  placeholder="Cidade (ex: SAO PAULO)"
                                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs text-zinc-700 focus:outline-none"
                                />
                                <input
                                  type="text"
                                  value={block.data.amount || ""}
                                  onChange={(e) =>
                                    handleUpdateBlockData(idx, "amount", e.target.value)
                                  }
                                  placeholder="Valor opcional (ex: 49.90)"
                                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-mono text-emerald-700 focus:outline-none"
                                />
                              </div>

                              <input
                                type="text"
                                value={block.data.description || ""}
                                onChange={(e) =>
                                  handleUpdateBlockData(idx, "description", e.target.value)
                                }
                                placeholder="Instrução curta exibida no modal de pagamento Pix"
                                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs text-zinc-600 focus:outline-none"
                              />
                            </div>
                          )}

                          {/* BLOCO: WHATSAPP */}
                          {block.type === "whatsapp" && (
                            <div className="space-y-2">
                              <div className="grid gap-2 sm:grid-cols-2">
                                <input
                                  type="text"
                                  value={block.data.title || ""}
                                  onChange={(e) =>
                                    handleUpdateBlockData(idx, "title", e.target.value)
                                  }
                                  placeholder="Título do Botão WhatsApp *"
                                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-900 focus:outline-none"
                                />
                                <input
                                  type="text"
                                  value={block.data.subtitle || ""}
                                  onChange={(e) =>
                                    handleUpdateBlockData(idx, "subtitle", e.target.value)
                                  }
                                  placeholder="Subtítulo (ex: Atendimento imediato)"
                                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs text-zinc-600 focus:outline-none"
                                />
                              </div>
                              <div className="grid gap-2 sm:grid-cols-2">
                                <input
                                  type="tel"
                                  value={block.data.phone || ""}
                                  onChange={(e) =>
                                    handleUpdateBlockData(idx, "phone", e.target.value)
                                  }
                                  placeholder="DDI + DDD + Número (ex: 5511999998888)"
                                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-mono text-emerald-800 focus:outline-none"
                                />
                                <input
                                  type="text"
                                  value={block.data.message || ""}
                                  onChange={(e) =>
                                    handleUpdateBlockData(idx, "message", e.target.value)
                                  }
                                  placeholder="Mensagem pré-preenchida"
                                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs text-zinc-600 focus:outline-none"
                                />
                              </div>
                            </div>
                          )}

                          {/* BLOCO: FORMULÁRIO DE CAPTURA DE LEADS */}
                          {block.type === "lead_form" && (
                            <div className="space-y-2">
                              <div className="grid gap-2 sm:grid-cols-2">
                                <input
                                  type="text"
                                  value={block.data.title || ""}
                                  onChange={(e) =>
                                    handleUpdateBlockData(idx, "title", e.target.value)
                                  }
                                  placeholder="Título do Formulário (ex: Entre na Lista VIP)"
                                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-900 focus:outline-none"
                                />
                                <input
                                  type="text"
                                  value={block.data.buttonText || ""}
                                  onChange={(e) =>
                                    handleUpdateBlockData(idx, "buttonText", e.target.value)
                                  }
                                  placeholder="Texto do Botão (ex: Enviar Contato)"
                                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-semibold text-indigo-700 focus:outline-none"
                                />
                              </div>
                              <div className="grid gap-2 sm:grid-cols-2">
                                <input
                                  type="text"
                                  value={block.data.subtitle || ""}
                                  onChange={(e) =>
                                    handleUpdateBlockData(idx, "subtitle", e.target.value)
                                  }
                                  placeholder="Subtítulo explicativo"
                                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs text-zinc-600 focus:outline-none"
                                />
                                <input
                                  type="text"
                                  value={block.data.placeholderContact || ""}
                                  onChange={(e) =>
                                    handleUpdateBlockData(
                                      idx,
                                      "placeholderContact",
                                      e.target.value
                                    )
                                  }
                                  placeholder="Placeholder (ex: Seu WhatsApp com DDD)"
                                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs text-zinc-600 focus:outline-none"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Barra de Ação Inferior dos Blocos */}
              <div className="flex items-center justify-between border-t border-zinc-200 pt-4">
                <p className="text-xs text-zinc-500">
                  Lembre-se de salvar após editar os blocos ou cores.
                </p>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 px-5 py-2.5 text-xs font-bold text-white shadow-sm transition disabled:opacity-50"
                >
                  {savedSuccess ? (
                    <>
                      <Check className="h-4 w-4 text-emerald-300" /> Alterações Salvas!
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" /> {saving ? "Salvando..." : "Salvar Alterações"}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* COLUNA DIREITA: Mockup de Celular com Preview ao Vivo (5 colunas) */}
          <div className="lg:col-span-5 sticky top-4 flex justify-center">
            <div className="w-full max-w-[340px] rounded-[42px] border-[8px] border-zinc-900 bg-black p-3 shadow-2xl">
              {/* Notch */}
              <div className="mx-auto mb-2.5 h-4 w-28 rounded-full bg-zinc-900" />

              {/* Tela do Celular */}
              <div
                className="h-[580px] rounded-[30px] p-4 overflow-y-auto flex flex-col items-center justify-between text-center transition-colors"
                style={{
                  backgroundColor: page.theme.bg || "#FFFFFF",
                  color: page.theme.text || "#111827",
                }}
              >
                <div className="w-full pt-3">
                  {/* Avatar Preview */}
                  <div
                    className="mx-auto h-20 w-20 rounded-full border-2 flex items-center justify-center font-bold text-xl shadow-md overflow-hidden"
                    style={{
                      borderColor: page.theme.accent || "#2563EB",
                      backgroundColor: page.theme.cardBg || "#F4F4F5",
                      color: page.theme.accent || "#2563EB",
                    }}
                  >
                    {page.avatar_url ? (
                      <img
                        src={page.avatar_url}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      (page.title || handle).substring(0, 2).toUpperCase()
                    )}
                  </div>

                  {/* Nome + Selo Verificado Azul */}
                  <div className="mt-3 flex items-center justify-center gap-1 px-2">
                    <h3 className="text-sm font-bold truncate">{page.title}</h3>
                    {page.theme.verified && (
                      <span title="Conta Verificada" className="inline-flex">
                        <BadgeCheck className="h-4 w-4 shrink-0 text-blue-500 fill-blue-500/15" />
                      </span>
                    )}
                  </div>

                  <p className="font-mono text-[10px] opacity-70 mt-0.5">@{handle}</p>

                  {page.description && (
                    <p className="mt-1.5 text-[11px] opacity-80 line-clamp-2 px-2 leading-relaxed">
                      {page.description}
                    </p>
                  )}

                  {/* Blocos Preview */}
                  <div
                    className={`mt-5 w-full ${
                      page.layout === "grid"
                        ? "grid grid-cols-2 gap-2 text-left"
                        : "space-y-2.5 text-left"
                    }`}
                  >
                    {blocks.length === 0 ? (
                      <p className="col-span-2 text-center text-[10px] opacity-50 py-6">
                        Adicione blocos para visualizar sua Bio ao vivo
                      </p>
                    ) : (
                      blocks.map((b, i) => {
                        const d = b.data || {};
                        const scheduledOk = isBlockScheduledActive(b);

                        if (b.type === "header") {
                          return (
                            <div
                              key={i}
                              className="col-span-2 pt-3 pb-1 text-center text-[10px] font-bold uppercase tracking-wider opacity-70"
                            >
                              {d.title || "Seção"}
                            </div>
                          );
                        }

                        if (b.type === "product") {
                          return (
                            <div
                              key={i}
                              className="col-span-2 rounded-xl border p-2.5 shadow-sm transition"
                              style={{
                                backgroundColor: page.theme.cardBg || "#F4F4F5",
                                color: page.theme.cardText || "#18181B",
                                borderColor: "rgba(128,128,128,0.2)",
                              }}
                            >
                              <div className="flex items-center gap-2.5">
                                {d.imageUrl ? (
                                  <img
                                    src={d.imageUrl}
                                    alt={d.title || ""}
                                    className="h-14 w-14 rounded-lg object-cover shrink-0 border border-black/10"
                                  />
                                ) : (
                                  <div
                                    className="h-14 w-14 rounded-lg flex items-center justify-center shrink-0"
                                    style={{
                                      backgroundColor: page.theme.accent || "#2563EB",
                                      color: "#FFFFFF",
                                    }}
                                  >
                                    <ShoppingBag className="h-6 w-6" />
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    {d.badge && (
                                      <span
                                        className="rounded px-1.5 py-0.5 text-[8px] font-bold uppercase text-white"
                                        style={{
                                          backgroundColor: page.theme.accent || "#2563EB",
                                        }}
                                      >
                                        {d.badge}
                                      </span>
                                    )}
                                    <p className="text-xs font-bold truncate">
                                      {d.title || "Produto"}
                                    </p>
                                  </div>
                                  <div className="flex items-baseline gap-1.5 mt-0.5">
                                    {d.oldPrice && (
                                      <span className="text-[10px] line-through opacity-60">
                                        {d.oldPrice}
                                      </span>
                                    )}
                                    {d.price && (
                                      <span className="text-xs font-extrabold text-emerald-500">
                                        {d.price}
                                      </span>
                                    )}
                                  </div>
                                  {d.coupon && (
                                    <span className="mt-1 inline-block rounded border border-dashed border-current/30 px-1.5 py-0.5 font-mono text-[9px]">
                                      Cupom: {d.coupon}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        }

                        if (b.type === "lead_form") {
                          return (
                            <div
                              key={i}
                              className="col-span-2 rounded-xl border p-3 space-y-2 shadow-sm"
                              style={{
                                backgroundColor: page.theme.cardBg || "#F4F4F5",
                                color: page.theme.cardText || "#18181B",
                                borderColor: "rgba(128,128,128,0.2)",
                              }}
                            >
                              <p className="text-xs font-bold">
                                {d.title || "Receba novidades"}
                              </p>
                              {d.subtitle && (
                                <p className="text-[10px] opacity-75">{d.subtitle}</p>
                              )}
                              <div className="rounded-lg border border-black/10 bg-white/80 px-2.5 py-1.5 text-[10px] text-zinc-400">
                                Seu nome...
                              </div>
                              <div className="rounded-lg border border-black/10 bg-white/80 px-2.5 py-1.5 text-[10px] text-zinc-400">
                                {d.placeholderContact || "Seu WhatsApp ou E-mail"}
                              </div>
                              <div
                                className="w-full rounded-lg py-1.5 text-center text-[10px] font-bold text-white"
                                style={{
                                  backgroundColor: page.theme.accent || "#2563EB",
                                }}
                              >
                                {d.buttonText || "Enviar"}
                              </div>
                            </div>
                          );
                        }

                        if (b.type === "pix") {
                          return (
                            <div
                              key={i}
                              className="col-span-2 flex items-center justify-between rounded-xl border p-3 text-xs font-semibold shadow-sm"
                              style={{
                                backgroundColor: page.theme.cardBg || "#F4F4F5",
                                color: page.theme.cardText || "#18181B",
                                borderColor: page.theme.accent || "#F59E0B",
                              }}
                            >
                              <div className="flex items-center gap-2 truncate">
                                <QrCode
                                  className="h-4 w-4 shrink-0"
                                  style={{ color: page.theme.accent || "#2563EB" }}
                                />
                                <div className="truncate">
                                  <span className="block truncate">
                                    {d.title || "Pagar via Pix"}
                                  </span>
                                  {d.amount && (
                                    <span className="block text-[9px] opacity-75">
                                      R$ {d.amount} • QR Code e Copia e Cola
                                    </span>
                                  )}
                                </div>
                              </div>
                              <span
                                className="rounded-md px-1.5 py-0.5 text-[9px] font-bold text-white shrink-0"
                                style={{
                                  backgroundColor: page.theme.accent || "#2563EB",
                                }}
                              >
                                PIX
                              </span>
                            </div>
                          );
                        }

                        const safePreviewHref =
                          b.type === "whatsapp"
                            ? `https://wa.me/${(d.phone || "").replace(/\D/g, "")}${
                                d.message ? `?text=${encodeURIComponent(d.message)}` : ""
                              }`
                            : d.url && d.url !== "https://"
                            ? /^(https?:\/\/|mailto:|tel:)/i.test(d.url.trim())
                              ? d.url.trim()
                              : `https://${d.url.trim()}`
                            : "#";

                        return (
                          <a
                            key={i}
                            href={safePreviewHref}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`block rounded-xl border p-2.5 text-xs font-semibold transition hover:opacity-90 ${
                              page.layout === "card"
                                ? "shadow-md"
                                : page.layout === "minimal"
                                ? "border-transparent"
                                : "shadow-sm"
                            } ${!scheduledOk ? "opacity-40" : ""}`}
                            style={{
                              backgroundColor: page.theme.cardBg || "#F4F4F5",
                              color: page.theme.cardText || "#18181B",
                              borderColor:
                                page.layout === "minimal"
                                  ? "transparent"
                                  : "rgba(128,128,128,0.28)",
                            }}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5">
                                  {b.type === "whatsapp" && (
                                    <MessageSquare className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                                  )}
                                  {b.type === "link" && (
                                    <Link2
                                      className="h-3.5 w-3.5 shrink-0"
                                      style={{ color: page.theme.accent || "#2563EB" }}
                                    />
                                  )}
                                  <span className="truncate block">
                                    {d.title || "Botão"}
                                  </span>
                                  {d.badge && (
                                    <span
                                      className="rounded px-1.5 py-0.5 text-[8px] font-bold uppercase text-white shrink-0"
                                      style={{
                                        backgroundColor: page.theme.accent || "#2563EB",
                                      }}
                                    >
                                      {d.badge}
                                    </span>
                                  )}
                                </div>
                                {d.subtitle && (
                                  <span className="block text-[10px] font-normal opacity-75 truncate mt-0.5">
                                    {d.subtitle}
                                  </span>
                                )}
                                {b.type === "link" && d.url && d.url !== "https://" && (
                                  <span className="block font-mono text-[9px] font-normal opacity-55 truncate mt-0.5">
                                    {d.url.replace(/^https?:\/\//, "")}
                                  </span>
                                )}
                              </div>
                              <ExternalLink className="h-3 w-3 shrink-0 opacity-50" />
                            </div>
                          </a>
                        );
                      })
                    )}
                  </div>
                </div>

                {!page.theme.hideBranding && (
                  <p className="text-[9px] opacity-50 pt-4 pb-1">
                    Criado com <strong>LinkSnap</strong>
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
