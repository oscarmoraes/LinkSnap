"use client";

import { useState, useMemo } from "react";
import { createClient } from "@/utils/supabase/client";
import QRCode from "qrcode";
import {
  Link2,
  Search,
  Copy,
  Check,
  QrCode,
  ArrowUpRight,
  Trash2,
  Pin,
  Archive,
  BarChart3,
  Loader2,
  X,
  Download,
  Plus,
  Tag,
  Edit2,
  Save,
  MessageSquare,
  DollarSign,
  Wifi,
  Compass,
  Sparkles,
  Lock,
  Calendar,
  Clock,
  Shield,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import Link from "next/link";

async function hashPassword(str: string): Promise<string> {
  const enc = new TextEncoder().encode(str);
  const buf = await crypto.subtle.digest("SHA-256", enc);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export interface LinkItem {
  id: string;
  short_code: string;
  long_url: string;
  title: string | null;
  clicks: number;
  is_custom_slug: boolean;
  tags?: string[] | null;
  pinned?: boolean;
  archived?: boolean;
  source_type?: string | null;
  link_scope?: "global" | "branded" | null;
  branded_handle?: string | null;
  password_hash?: string | null;
  starts_at?: string | null;
  expires_at?: string | null;
  created_at: string;
}

export default function LinksManagerClient({
  initialLinks,
  origin,
  userId,
  userHandle,
  planTier = "free",
}: {
  initialLinks: LinkItem[];
  origin: string;
  userId: string;
  userHandle: string;
  planTier?: string;
}) {
  const isPro = planTier === "pro" || planTier === "enterprise";
  const supabase = createClient();
  const [links, setLinks] = useState<LinkItem[]>(initialLinks);

  // Form de criação
  const [longUrl, setLongUrl] = useState("");
  const [customSlug, setCustomSlug] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [scope, setScope] = useState<"global" | "branded">("global");
  const [loading, setLoading] = useState(false);

  // Recursos Avançados (PRO)
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [password, setPassword] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [expiresAt, setExpiresAt] = useState("");

  // Interações
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "top" | "custom" | "pinned" | "archived">("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [selectedQr, setSelectedQr] = useState<{ url: string; code: string; title: string; qrDataUrl: string } | null>(null);
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Estado de Edição
  const [editingLink, setEditingLink] = useState<LinkItem | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editLongUrl, setEditLongUrl] = useState("");
  const [editSlug, setEditSlug] = useState("");
  const [editTags, setEditTags] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  const getFullUrl = (link: LinkItem) => {
    if (link.link_scope === "branded") {
      return `${origin}/r/${link.branded_handle || userHandle}/${link.short_code}`;
    }
    return `${origin}/r/${link.short_code}`;
  };

  const filteredLinks = useMemo(() => {
    return links
      .filter((link) => {
        // Filtro de aba
        if (activeTab === "pinned" && !link.pinned) return false;
        if (activeTab === "archived") return Boolean(link.archived);
        if (link.archived) return false;
        if (activeTab === "custom" && !link.is_custom_slug) return false;

        // Filtro de origem
        if (sourceFilter !== "all") {
          const s = link.source_type || "direct";
          if (s !== sourceFilter) return false;
        }

        // Filtro de busca
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        const matchesCode = link.short_code.toLowerCase().includes(q);
        const matchesUrl = link.long_url.toLowerCase().includes(q);
        const matchesTitle = (link.title || "").toLowerCase().includes(q);
        const matchesTags = (link.tags || []).some((t) => t.toLowerCase().includes(q));

        return matchesCode || matchesUrl || matchesTitle || matchesTags;
      })
      .sort((a, b) => {
        if (activeTab === "top") return b.clicks - a.clicks;
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
  }, [links, activeTab, sourceFilter, searchQuery]);

  const handleCreateLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!longUrl) return;

    setLoading(true);
    setStatusMsg(null);

    try {
      let code = customSlug.trim();
      let isCustom = false;

      if (code) {
        if (!/^[a-zA-Z0-9_-]{3,32}$/.test(code)) {
          throw new Error("O slug customizado deve ter entre 3 e 32 caracteres.");
        }
        isCustom = true;
      } else {
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        const arr = new Uint8Array(6);
        crypto.getRandomValues(arr);
        code = Array.from(arr, (v) => chars[v % chars.length]).join("");
      }

      const parsed = new URL(longUrl);
      if (!["http:", "https:"].includes(parsed.protocol)) {
        throw new Error("Use uma URL válida com http:// ou https://");
      }

      const linkTitle = parsed.hostname.replace(/^www\./, "");
      const tags = tagsInput
        ? tagsInput
            .split(",")
            .map((t) => t.trim().toLowerCase())
            .filter(Boolean)
        : [];

      const isBranded = scope === "branded";
      if (isBranded && !isPro) {
        throw new Error("Links com marca própria (/r/@handle/...) são exclusivos do plano PRO.");
      }

      if (!isPro && links.length >= 20) {
        throw new Error("Limite de 20 links do plano Free atingido. Faça upgrade para o LinkSnap PRO.");
      }

      let passwordHash: string | null = null;
      if (password.trim()) {
        if (!isPro) throw new Error("A proteção por senha é um recurso exclusivo do plano PRO.");
        passwordHash = await hashPassword(password.trim());
      }

      let parsedStartsAt: string | null = null;
      if (startsAt) {
        if (!isPro) throw new Error("O agendamento de links é um recurso exclusivo do plano PRO.");
        parsedStartsAt = new Date(startsAt).toISOString();
      }

      let parsedExpiresAt: string | null = null;
      if (expiresAt) {
        if (!isPro) throw new Error("A data de expiração de links é um recurso exclusivo do plano PRO.");
        parsedExpiresAt = new Date(expiresAt).toISOString();
      }

      const { data, error } = await supabase
        .from("links")
        .insert({
          user_id: userId,
          short_code: code,
          long_url: parsed.toString(),
          title: linkTitle,
          is_custom_slug: isCustom,
          tags,
          source_type: "direct",
          link_scope: isBranded ? "branded" : "global",
          branded_handle: isBranded ? userHandle : null,
          password_hash: passwordHash,
          starts_at: parsedStartsAt,
          expires_at: parsedExpiresAt,
        })
        .select()
        .single();

      if (error) {
        if (error.code === "23505") {
          throw new Error("Este código/slug já está em uso. Escolha outro.");
        }
        throw error;
      }

      if (data) {
        setLinks([data, ...links]);
        setLongUrl("");
        setCustomSlug("");
        setTagsInput("");
        setPassword("");
        setStartsAt("");
        setExpiresAt("");

        const fullUrl = getFullUrl(data);
        setStatusMsg({ type: "success", text: `Link ${fullUrl} criado com sucesso!` });

        const qrDataUrl = await QRCode.toDataURL(fullUrl, { width: 360, margin: 2 });
        setSelectedQr({ url: fullUrl, code: data.short_code, title: linkTitle, qrDataUrl });
      }
    } catch (err: any) {
      setStatusMsg({ type: "error", text: err.message || "Erro ao criar o link curto." });
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async (link: LinkItem) => {
    const url = getFullUrl(link);
    await navigator.clipboard.writeText(url);
    setCopiedId(link.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const togglePin = async (link: LinkItem) => {
    const updated = !link.pinned;
    try {
      const { error } = await supabase
        .from("links")
        .update({ pinned: updated })
        .eq("id", link.id)
        .select();

      if (error) throw error;
      setLinks(links.map((l) => (l.id === link.id ? { ...l, pinned: updated } : l)));
    } catch (err: any) {
      alert("Erro ao fixar link: " + (err.message || "Permissão negada. Execute o patch SQL no Supabase."));
    }
  };

  const toggleArchive = async (link: LinkItem) => {
    const updated = !link.archived;
    try {
      const { error } = await supabase
        .from("links")
        .update({ archived: updated })
        .eq("id", link.id)
        .select();

      if (error) throw error;
      setLinks(links.map((l) => (l.id === link.id ? { ...l, archived: updated } : l)));
    } catch (err: any) {
      alert("Erro ao arquivar link: " + (err.message || "Permissão negada. Execute o patch SQL no Supabase."));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja remover este link?")) return;
    try {
      const { error } = await supabase
        .from("links")
        .delete()
        .eq("id", id)
        .select();

      if (error) throw error;
      setLinks(links.filter((l) => l.id !== id));
    } catch (err: any) {
      alert("Erro ao remover link: " + (err.message || "Permissão negada. Execute o patch SQL no Supabase."));
    }
  };

  const openQrModal = async (link: LinkItem) => {
    const shortUrl = getFullUrl(link);
    const qrDataUrl = await QRCode.toDataURL(shortUrl, { width: 360, margin: 2 });
    setSelectedQr({
      url: shortUrl,
      code: link.short_code,
      title: link.title || link.short_code,
      qrDataUrl,
    });
  };

  const handleStartEdit = (link: LinkItem) => {
    setEditingLink(link);
    setEditTitle(link.title || "");
    setEditLongUrl(link.long_url);
    setEditSlug(link.short_code);
    setEditTags((link.tags || []).join(", "));
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLink) return;

    setSavingEdit(true);
    try {
      const cleanSlug = editSlug.trim();
      if (!/^[a-zA-Z0-9_-]{3,32}$/.test(cleanSlug)) {
        throw new Error("O slug deve ter entre 3 e 32 caracteres (apenas letras, números, hífen e underline).");
      }

      const parsed = new URL(editLongUrl);
      if (!["http:", "https:"].includes(parsed.protocol)) {
        throw new Error("Informe uma URL válida com http:// ou https://");
      }

      const tags = editTags
        ? editTags
            .split(",")
            .map((t) => t.trim().toLowerCase())
            .filter(Boolean)
        : [];

      const { data, error } = await supabase
        .from("links")
        .update({
          title: editTitle.trim() || null,
          long_url: parsed.toString(),
          short_code: cleanSlug,
          tags,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editingLink.id)
        .select()
        .single();

      if (error) {
        if (error.code === "23505") {
          throw new Error("Este slug já está em uso por outro link.");
        }
        throw error;
      }

      if (data) {
        setLinks(links.map((l) => (l.id === editingLink.id ? data : l)));
        setEditingLink(null);
      }
    } catch (err: any) {
      alert("Erro ao salvar alterações: " + err.message);
    } finally {
      setSavingEdit(false);
    }
  };

  const renderSourceBadge = (source?: string | null) => {
    switch (source) {
      case "whatsapp":
        return (
          <span className="inline-flex items-center gap-1 rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700 border border-emerald-100">
            <MessageSquare className="h-2.5 w-2.5" /> WhatsApp
          </span>
        );
      case "pix":
        return (
          <span className="inline-flex items-center gap-1 rounded bg-teal-50 px-1.5 py-0.5 text-[10px] font-medium text-teal-700 border border-teal-100">
            <DollarSign className="h-2.5 w-2.5" /> Pix
          </span>
        );
      case "wifi":
        return (
          <span className="inline-flex items-center gap-1 rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-700 border border-blue-100">
            <Wifi className="h-2.5 w-2.5" /> Wi-Fi
          </span>
        );
      case "utm":
        return (
          <span className="inline-flex items-center gap-1 rounded bg-indigo-50 px-1.5 py-0.5 text-[10px] font-medium text-indigo-700 border border-indigo-100">
            <Compass className="h-2.5 w-2.5" /> UTM
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium text-zinc-600">
            <Link2 className="h-2.5 w-2.5" /> Direto
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Meus Links</h1>
          <p className="text-xs text-zinc-500 mt-1">
            Gerencie, categorize, edite e acompanhe o engajamento dos seus links curtos e campanhas.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-zinc-500">
            Total de links: <strong className="text-zinc-900">{links.length}</strong>
            {!isPro && <span className="text-zinc-400"> / 20</span>}
          </span>
          <span
            className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
              isPro
                ? "bg-amber-100 text-amber-900 border border-amber-200"
                : "bg-zinc-100 text-zinc-700 border border-zinc-200"
            }`}
          >
            {isPro ? "PRO ⚡" : "Free"}
          </span>
        </div>
      </div>

      {/* Alerta de Cota Atingida no Plano Free */}
      {!isPro && links.length >= 20 && (
        <div className="rounded-xl border border-amber-300 bg-amber-50/80 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-2xs">
          <div className="flex items-start gap-3">
            <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-amber-500 text-white">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-amber-900">
                Limite do Plano Free Atingido (20/20 links)
              </h4>
              <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
                Você utilizou todos os 20 links inclusos na sua conta gratuita. Faça upgrade para o <strong>LinkSnap PRO</strong> para criar links ilimitados, usar links com sua marca, proteção por senha e agendamento.
              </p>
            </div>
          </div>
          <Link
            href="/dashboard/settings#plan"
            className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 px-3.5 py-2 text-xs font-bold text-white shadow-xs transition"
          >
            Fazer Upgrade PRO ⚡
          </Link>
        </div>
      )}

      {/* Formulário de Criação em Página Inteira */}
      <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-500">
            Encurtar Novo Link
          </h2>

          <div className="flex items-center gap-1 bg-zinc-100 rounded-lg p-0.5 text-[11px]">
            <button
              type="button"
              onClick={() => setScope("global")}
              className={`px-2 py-0.5 rounded-md font-medium transition-colors ${
                scope === "global"
                  ? "bg-white text-zinc-900 shadow-xs"
                  : "text-zinc-500 hover:text-zinc-800"
              }`}
            >
              Global (/r/...)
            </button>
            <button
              type="button"
              onClick={() => {
                if (!isPro) {
                  setStatusMsg({
                    type: "error",
                    text: "Links com marca própria (/r/@handle/...) são exclusivos do plano PRO. Faça upgrade para desbloquear!",
                  });
                  return;
                }
                setScope("branded");
              }}
              className={`px-2 py-0.5 rounded-md font-medium transition-colors flex items-center gap-1 ${
                scope === "branded"
                  ? "bg-white text-blue-700 shadow-xs"
                  : "text-zinc-500 hover:text-zinc-800"
              }`}
            >
              <span>Com sua marca (/r/@{userHandle}/...)</span>
              {!isPro && (
                <span className="rounded bg-amber-200/80 px-1 py-0.2 text-[9px] font-bold text-amber-900 border border-amber-300">
                  PRO
                </span>
              )}
            </button>
          </div>
        </div>

        <form onSubmit={handleCreateLink} className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-12">
            <div className="sm:col-span-6">
              <label className="block text-[11px] font-semibold text-zinc-600 mb-1">
                URL de Destino *
              </label>
              <input
                type="url"
                required
                value={longUrl}
                onChange={(e) => setLongUrl(e.target.value)}
                placeholder="https://meusite.com/pagina-importante"
                className="w-full rounded-lg border border-zinc-300 bg-white shadow-xs px-3 py-2 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-blue-600 focus:outline-none"
              />
            </div>

            <div className="sm:col-span-3">
              <label className="block text-[11px] font-semibold text-zinc-600 mb-1">
                Slug Personalizado (Opcional)
              </label>
              <div className="flex items-center rounded-lg border border-zinc-300 bg-white shadow-xs px-2 py-1.5 focus-within:border-blue-600">
                <span className="text-[11px] text-zinc-400 font-mono">
                  {scope === "branded" ? `/r/@${userHandle}/` : `/r/`}
                </span>
                <input
                  type="text"
                  value={customSlug}
                  onChange={(e) => setCustomSlug(e.target.value)}
                  placeholder="promocao-2026"
                  className="w-full bg-transparent text-xs text-blue-700 font-mono focus:outline-none pl-1 border-transparent"
                />
              </div>
            </div>

            <div className="sm:col-span-3">
              <label className="block text-[11px] font-semibold text-zinc-600 mb-1">
                Tags (separadas por vírgula)
              </label>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="marketing, vendas"
                className="w-full rounded-lg border border-zinc-300 bg-white shadow-xs px-3 py-2 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-blue-600 focus:outline-none"
              />
            </div>
          </div>

          {/* Opções Avançadas: Senha e Agendamento */}
          <div className="pt-2 border-t border-zinc-100">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-1.5 text-[11px] font-semibold text-zinc-600 hover:text-zinc-900 transition"
            >
              <Shield className="h-3.5 w-3.5 text-blue-600" />
              <span>Proteção por Senha & Agendamento de Datas</span>
              {!isPro && (
                <span className="rounded bg-amber-100 px-1 py-0.2 text-[9px] font-bold text-amber-800 border border-amber-200">
                  PRO 🔒
                </span>
              )}
              {showAdvanced ? (
                <ChevronUp className="h-3.5 w-3.5 text-zinc-400" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5 text-zinc-400" />
              )}
            </button>

            {showAdvanced && (
              <div className="mt-3 p-3.5 rounded-xl border border-zinc-200 bg-zinc-50/70 space-y-3">
                {!isPro && (
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-amber-900 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                    <span>
                      Proteção por Senha e Agendamento são recursos exclusivos para assinantes <strong>PRO</strong>.
                    </span>
                    <Link href="/dashboard/settings#plan" className="font-bold underline hover:text-amber-950 shrink-0">
                      Fazer Upgrade PRO ⚡
                    </Link>
                  </div>
                )}
                <div className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-700 mb-1 flex items-center gap-1">
                      <Lock className="h-3 w-3 text-zinc-500" /> Proteger com Senha
                    </label>
                    <input
                      type="password"
                      disabled={!isPro}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={isPro ? "Digite uma senha..." : "Exclusivo PRO"}
                      className="w-full rounded-lg border border-zinc-300 bg-white px-2.5 py-1.5 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-blue-600 focus:outline-none disabled:bg-zinc-100 disabled:text-zinc-400"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-700 mb-1 flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-zinc-500" /> Início (Ativo a partir de)
                    </label>
                    <input
                      type="datetime-local"
                      disabled={!isPro}
                      value={startsAt}
                      onChange={(e) => setStartsAt(e.target.value)}
                      className="w-full rounded-lg border border-zinc-300 bg-white px-2.5 py-1.5 text-xs text-zinc-900 focus:border-blue-600 focus:outline-none disabled:bg-zinc-100 disabled:text-zinc-400"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-700 mb-1 flex items-center gap-1">
                      <Clock className="h-3 w-3 text-zinc-500" /> Término (Expira em)
                    </label>
                    <input
                      type="datetime-local"
                      disabled={!isPro}
                      value={expiresAt}
                      onChange={(e) => setExpiresAt(e.target.value)}
                      className="w-full rounded-lg border border-zinc-300 bg-white px-2.5 py-1.5 text-xs text-zinc-900 focus:border-blue-600 focus:outline-none disabled:bg-zinc-100 disabled:text-zinc-400"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={loading || (!isPro && links.length >= 20)}
              className="flex items-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 px-4 py-2 text-xs font-semibold text-white shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Plus className="h-3.5 w-3.5" />
              )}
              {!isPro && links.length >= 20 ? "Limite de 20 Links Atingido" : "Encurtar Link"}
            </button>
          </div>
        </form>

        {statusMsg && (
          <div
            className={`mt-3 rounded-lg p-3 text-xs ${
              statusMsg.type === "success"
                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                : "bg-red-50 text-red-800 border border-red-200"
            }`}
          >
            {statusMsg.text}
          </div>
        )}
      </div>

      {/* Barra de Filtros, Origem e Busca */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-1 border-b border-zinc-200 sm:border-0 pb-2 sm:pb-0">
          {(
            [
              { id: "all", label: "Todos" },
              { id: "pinned", label: "Fixados" },
              { id: "top", label: "Mais Clicados" },
              { id: "custom", label: "Customizados" },
              { id: "archived", label: "Arquivados" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                activeTab === tab.id
                  ? "bg-zinc-900 text-white shadow-xs"
                  : "text-zinc-600 hover:bg-zinc-100"
              }`}
            >
              {tab.label}
            </button>
          ))}

          <span className="hidden sm:block h-4 w-px bg-zinc-200 mx-1" />

          {/* Seletor de Origem */}
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="rounded-lg border border-zinc-300 bg-white shadow-xs px-2.5 py-1 text-xs text-zinc-700 focus:border-blue-600 focus:outline-none"
          >
            <option value="all">Todas Origens</option>
            <option value="direct">Direto</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="pix">Pix</option>
            <option value="wifi">Wi-Fi</option>
            <option value="utm">UTM</option>
          </select>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por código, URL ou tag..."
            className="w-full rounded-lg border border-zinc-300 bg-white shadow-xs pl-9 pr-3 py-1.5 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-blue-600 focus:outline-none"
          />
        </div>
      </div>

      {/* Tabela de Links */}
      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50/50 text-[11px] font-semibold text-zinc-500">
                <th className="py-3 px-4">Link Curto & Destino</th>
                <th className="py-3 px-3">Origem & Escopo</th>
                <th className="py-3 px-3">Tags</th>
                <th className="py-3 px-3 text-center">Cliques</th>
                <th className="py-3 px-3">Data</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {filteredLinks.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-xs text-zinc-400">
                    Nenhum link encontrado com os filtros atuais.
                  </td>
                </tr>
              ) : (
                filteredLinks.map((link) => {
                  const fullUrl = getFullUrl(link);
                  return (
                    <tr
                      key={link.id}
                      className={`hover:bg-zinc-50/70 transition ${
                        link.pinned ? "bg-amber-50/20" : ""
                      }`}
                    >
                      {/* Código e Destino */}
                      <td className="py-3 px-4 max-w-xs sm:max-w-md">
                        <div className="flex items-center gap-1.5">
                          {link.pinned && (
                            <Pin className="h-3 w-3 fill-amber-500 text-amber-500 shrink-0" />
                          )}
                          <a
                            href={fullUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-mono font-bold text-blue-700 bg-blue-50/80 border border-blue-200/70 rounded px-1.5 py-0.5 hover:underline flex items-center gap-1 truncate"
                          >
                            {link.link_scope === "branded" ? `@${link.branded_handle || userHandle}/` : ""}
                            {link.short_code}
                            <ArrowUpRight className="h-3 w-3 text-blue-500" />
                          </a>
                          {link.password_hash && (
                            <span
                              className="inline-flex items-center gap-0.5 rounded bg-amber-50 px-1.5 py-0.5 text-[9px] font-semibold text-amber-800 border border-amber-200 shrink-0"
                              title="Link Protegido por Senha"
                            >
                              <Lock className="h-2.5 w-2.5" /> Senha
                            </span>
                          )}
                          {(link.starts_at || link.expires_at) && (
                            <span
                              className="inline-flex items-center gap-0.5 rounded bg-indigo-50 px-1.5 py-0.5 text-[9px] font-semibold text-indigo-800 border border-indigo-200 shrink-0"
                              title="Link com Agendamento de Data"
                            >
                              <Calendar className="h-2.5 w-2.5" /> Agendado
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-zinc-600 truncate mt-1" title={link.long_url}>
                          {link.title && <span className="font-semibold text-zinc-800 mr-1.5">{link.title} •</span>}
                          {link.long_url}
                        </div>
                      </td>

                      {/* Origem & Escopo */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="flex flex-col items-start gap-1">
                          {renderSourceBadge(link.source_type)}
                          <span className="text-[10px] font-mono text-zinc-400">
                            {link.link_scope === "branded" ? "Marca" : "Global"}
                          </span>
                        </div>
                      </td>

                      {/* Tags */}
                      <td className="py-3 px-3">
                        <div className="flex flex-wrap gap-1 max-w-[140px]">
                          {link.tags && link.tags.length > 0 ? (
                            link.tags.map((tag, idx) => (
                              <span
                                key={idx}
                                className="rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] text-zinc-600 font-medium"
                              >
                                #{tag}
                              </span>
                            ))
                          ) : (
                            <span className="text-zinc-300 text-[11px]">—</span>
                          )}
                        </div>
                      </td>

                      {/* Cliques */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 font-semibold text-zinc-800">
                          <BarChart3 className="h-3 w-3 text-zinc-400" />
                          {link.clicks.toLocaleString()}
                        </span>
                      </td>

                      {/* Data */}
                      <td className="py-3 px-3 whitespace-nowrap text-zinc-400 text-[11px]">
                        {new Date(link.created_at).toLocaleDateString("pt-BR")}
                      </td>

                      {/* Ações */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            title="Copiar link curto"
                            onClick={() => handleCopy(link)}
                            className="rounded p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition"
                          >
                            {copiedId === link.id ? (
                              <Check className="h-3.5 w-3.5 text-emerald-500" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                          </button>

                          <button
                            title="Ver QR Code"
                            onClick={() => openQrModal(link)}
                            className="rounded p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition"
                          >
                            <QrCode className="h-3.5 w-3.5" />
                          </button>

                          <button
                            title="Editar link"
                            onClick={() => handleStartEdit(link)}
                            className="rounded p-1.5 text-zinc-400 hover:text-blue-600 hover:bg-blue-50 transition"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>

                          <button
                            title={link.pinned ? "Desafixar" : "Fixar no topo"}
                            onClick={() => togglePin(link)}
                            className={`rounded p-1.5 transition ${
                              link.pinned
                                ? "text-amber-500 hover:bg-amber-50"
                                : "text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100"
                            }`}
                          >
                            <Pin className="h-3.5 w-3.5" />
                          </button>

                          <button
                            title={link.archived ? "Desarquivar" : "Arquivar link"}
                            onClick={() => toggleArchive(link)}
                            className={`rounded p-1.5 transition ${
                              link.archived
                                ? "text-blue-600 hover:bg-blue-50"
                                : "text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100"
                            }`}
                          >
                            <Archive className="h-3.5 w-3.5" />
                          </button>

                          <button
                            title="Excluir link"
                            onClick={() => handleDelete(link.id)}
                            className="rounded p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 transition"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal / Slide-over de Edição */}
      {editingLink && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg bg-white rounded-xl border border-zinc-200 p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
              <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-1.5">
                <Edit2 className="h-4 w-4 text-blue-600" />
                Editar Link Curto
              </h3>
              <button
                onClick={() => setEditingLink(null)}
                className="rounded p-1 text-zinc-400 hover:text-zinc-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Título de Identificação
                </label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="Ex: Minha Landing Page"
                  className="w-full rounded-lg border border-zinc-300 bg-white shadow-xs px-3 py-2 text-xs text-zinc-900 focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  URL de Destino
                </label>
                <input
                  type="url"
                  required
                  value={editLongUrl}
                  onChange={(e) => setEditLongUrl(e.target.value)}
                  className="w-full rounded-lg border border-zinc-300 bg-white shadow-xs px-3 py-2 text-xs text-zinc-900 font-mono focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Slug / Código
                </label>
                <div className="flex items-center rounded-lg border border-zinc-300 px-3 py-2 bg-white shadow-xs">
                  <span className="text-xs text-zinc-400 font-mono">
                    {editingLink.link_scope === "branded" ? `/r/@${userHandle}/` : `/r/`}
                  </span>
                  <input
                    type="text"
                    required
                    value={editSlug}
                    onChange={(e) => setEditSlug(e.target.value)}
                    className="w-full bg-transparent text-xs font-mono font-bold text-blue-700 focus:outline-none pl-1 border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Tags (separadas por vírgula)
                </label>
                <input
                  type="text"
                  value={editTags}
                  onChange={(e) => setEditTags(e.target.value)}
                  placeholder="marketing, vendas"
                  className="w-full rounded-lg border border-zinc-300 bg-white shadow-xs px-3 py-2 text-xs text-zinc-900 focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-200">
                <button
                  type="button"
                  onClick={() => setEditingLink(null)}
                  className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-600 hover:bg-zinc-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 flex items-center gap-1.5"
                >
                  <Save className="h-3.5 w-3.5" />
                  {savingEdit ? "Salvando..." : "Salvar Alterações"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de QR Code */}
      {selectedQr && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl space-y-4 text-center">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-zinc-900">QR Code do Link</h3>
              <button
                onClick={() => setSelectedQr(null)}
                className="rounded p-1 text-zinc-400 hover:text-zinc-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl inline-block">
              <img src={selectedQr.qrDataUrl} alt="QR Code" className="h-52 w-52 object-contain" />
            </div>

            <div className="space-y-1">
              <div className="text-xs font-bold text-zinc-800 font-mono truncate">
                {selectedQr.url}
              </div>
              <div className="text-[11px] text-zinc-500 truncate">
                Destino: {selectedQr.title}
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <a
                href={selectedQr.qrDataUrl}
                download={`qrcode-${selectedQr.code}.png`}
                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-zinc-900 px-3 py-2 text-xs font-semibold text-white hover:bg-zinc-800 transition"
              >
                <Download className="h-3.5 w-3.5" />
                Baixar Imagem
              </a>
              <button
                onClick={() => setSelectedQr(null)}
                className="rounded-lg border border-zinc-200 px-3 py-2 text-xs font-semibold text-zinc-600 hover:bg-zinc-50"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
