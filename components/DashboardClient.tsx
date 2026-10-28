"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import QRCode from "qrcode";
import {
  BarChart3,
  Copy,
  Link2,
  Loader2,
  LogOut,
  QrCode,
  Sparkles,
  Trash2,
  Check,
  Search,
  X,
  ArrowUpRight,
  Zap,
  UserCheck,
  Smartphone,
  MessageSquare,
  Wifi,
  DollarSign,
  Plus,
  Compass,
  Download,
  Share2,
} from "lucide-react";

interface LinkItem {
  id: string;
  short_code: string;
  long_url: string;
  title: string | null;
  clicks: number;
  is_custom_slug: boolean;
  created_at: string;
}

interface BioLinkItem {
  title: string;
  url: string;
}

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  plan_tier: string;
  avatar_url?: string | null;
  bio_username?: string | null;
  bio_title?: string | null;
  bio_description?: string | null;
  bio_links?: BioLinkItem[] | null;
  badge_data?: any | null;
}

type ActiveTool = "none" | "bio" | "idcard" | "whatsapp" | "pix" | "wifi" | "utm";

export default function DashboardClient({
  initialLinks,
  profile,
  origin,
}: {
  initialLinks: LinkItem[];
  profile: Profile;
  origin: string;
}) {
  const router = useRouter();
  const supabase = createClient();

  // Estado geral
  const [links, setLinks] = useState<LinkItem[]>(initialLinks);
  const [longUrl, setLongUrl] = useState("");
  const [customSlug, setCustomSlug] = useState("");
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedQr, setSelectedQr] = useState<{ url: string; code: string; title: string; qrDataUrl: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "custom" | "top">("all");
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [activeTool, setActiveTool] = useState<ActiveTool>("none");

  // Estado da Ferramenta 1: Bio Link (Linktree)
  const [bioUsername, setBioUsername] = useState(profile.bio_username || "");
  const [bioTitle, setBioTitle] = useState(profile.bio_title || profile.full_name || "");
  const [bioDesc, setBioDesc] = useState(profile.bio_description || "");
  const [bioLinks, setBioLinks] = useState<BioLinkItem[]>(profile.bio_links || [
    { title: "Meu Site Oficial", url: "https://exemplo.com" },
    { title: "Fale Comigo no WhatsApp", url: "https://wa.me/55" },
  ]);
  const [savingBio, setSavingBio] = useState(false);

  // Estado da Ferramenta 2: Carteirinha Digital / ID Badge
  const [idName, setIdName] = useState(profile.full_name || "Seu Nome");
  const [idRole, setIdRole] = useState("Membro / Desenvolvedor");
  const [idOrg, setIdOrg] = useState("LinkSnap SaaS");
  const [idCode, setIdCode] = useState(profile.id.substring(0, 8).toUpperCase());
  const [badgeQr, setBadgeQr] = useState<string>("");

  // Estado da Ferramenta 3: WhatsApp Link
  const [waPhone, setWaPhone] = useState("");
  const [waMsg, setWaMsg] = useState("");

  // Estado da Ferramenta 4: Pix
  const [pixKey, setPixKey] = useState("");
  const [pixName, setPixName] = useState("");
  const [pixCity, setPixCity] = useState("");
  const [pixAmount, setPixAmount] = useState("");
  const [pixQr, setPixQr] = useState<string | null>(null);

  // Estado da Ferramenta 5: Wi-Fi
  const [wifiSsid, setWifiSsid] = useState("");
  const [wifiPass, setWifiPass] = useState("");
  const [wifiType, setWifiType] = useState<"WPA" | "WEP" | "nopass">("WPA");
  const [wifiQr, setWifiQr] = useState<string | null>(null);

  // Estado da Ferramenta 6: UTM Builder
  const [utmBase, setUtmBase] = useState("");
  const [utmSource, setUtmSource] = useState("instagram");
  const [utmMedium, setUtmMedium] = useState("stories");
  const [utmCampaign, setUtmCampaign] = useState("promocao");

  const totalClicks = useMemo(
    () => links.reduce((sum, item) => sum + Number(item.clicks || 0), 0),
    [links]
  );
  const linkLimit = profile.plan_tier === "pro" ? 999999 : 20;
  const isNearLimit = profile.plan_tier === "free" && links.length >= 20;

  // Gera o QR Code da Carteirinha automaticamente
  useEffect(() => {
    const targetUrl = bioUsername ? `${origin}/b/${bioUsername}` : origin;
    QRCode.toDataURL(targetUrl, { width: 250, margin: 1, color: { dark: "#000000", light: "#ffffff" } })
      .then(setBadgeQr)
      .catch(() => {});
  }, [bioUsername, origin]);

  // Filtragem dinâmica de links
  const filteredLinks = useMemo(() => {
    return links
      .filter((link) => {
        const matchesSearch =
          link.short_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
          link.long_url.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (link.title && link.title.toLowerCase().includes(searchQuery.toLowerCase()));

        if (!matchesSearch) return false;
        if (filterType === "custom") return link.is_custom_slug;
        return true;
      })
      .sort((a, b) => {
        if (filterType === "top") return Number(b.clicks) - Number(a.clicks);
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
  }, [links, searchQuery, filterType]);

  const handleCreateLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!longUrl) return;

    if (isNearLimit) {
      setStatusMsg({
        type: "error",
        text: "Limite de 20 links atingido no plano gratuito. Upgrade via Mercado Pago em breve.",
      });
      return;
    }

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

      const { data, error } = await supabase
        .from("links")
        .insert({
          user_id: profile.id,
          short_code: code,
          long_url: parsed.toString(),
          title: linkTitle,
          is_custom_slug: isCustom,
        })
        .select()
        .single();

      if (error) {
        if (error.code === "23505") {
          throw new Error("Este slug já está em uso por outro link. Escolha outro.");
        }
        throw error;
      }

      if (data) {
        setLinks([data, ...links]);
        setLongUrl("");
        setCustomSlug("");
        setStatusMsg({ type: "success", text: `Link /r/${data.short_code} criado com sucesso!` });

        const shortUrl = `${origin}/r/${data.short_code}`;
        const qrDataUrl = await QRCode.toDataURL(shortUrl, { width: 360, margin: 2 });
        setSelectedQr({ url: shortUrl, code: data.short_code, title: linkTitle, qrDataUrl });
      }
    } catch (err: any) {
      setStatusMsg({ type: "error", text: err.message || "Erro ao criar o link curto." });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveBio = async () => {
    if (!bioUsername.trim()) {
      alert("Defina um username para sua página de bio (ex: seunome).");
      return;
    }
    const cleanUser = bioUsername.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "");
    setSavingBio(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          bio_username: cleanUser,
          bio_title: bioTitle.trim(),
          bio_description: bioDesc.trim(),
          bio_links: bioLinks,
        })
        .eq("id", profile.id);

      if (error) throw error;
      setBioUsername(cleanUser);
      alert(`Página de perfil salva com sucesso! Acesse em: ${origin}/b/${cleanUser}`);
      setActiveTool("none");
    } catch (err: any) {
      alert("Erro ao salvar Bio Link: " + (err.message || "Verifique se o username já está em uso."));
    } finally {
      setSavingBio(false);
    }
  };

  const handleGenerateWhatsApp = () => {
    const cleanPhone = waPhone.replace(/\D/g, "");
    if (cleanPhone.length < 8) {
      alert("Informe um número de telefone com DDD válido.");
      return;
    }
    const textEncoded = encodeURIComponent(waMsg.trim());
    const finalUrl = `https://wa.me/${cleanPhone}${textEncoded ? `?text=${textEncoded}` : ""}`;
    setLongUrl(finalUrl);
    setCustomSlug("wpp-" + cleanPhone.slice(-4));
    setActiveTool("none");
  };

  const handleGenerateUtm = () => {
    if (!utmBase) {
      alert("Informe a URL base.");
      return;
    }
    try {
      const url = new URL(utmBase);
      if (utmSource) url.searchParams.set("utm_source", utmSource);
      if (utmMedium) url.searchParams.set("utm_medium", utmMedium);
      if (utmCampaign) url.searchParams.set("utm_campaign", utmCampaign);
      setLongUrl(url.toString());
      setActiveTool("none");
    } catch {
      alert("Informe uma URL válida.");
    }
  };

  const handleGenerateWifi = async () => {
    if (!wifiSsid) {
      alert("Informe o nome da rede (SSID).");
      return;
    }
    const wifiString = `WIFI:S:${wifiSsid};T:${wifiType};P:${wifiPass};;`;
    const qrData = await QRCode.toDataURL(wifiString, { width: 300, margin: 2 });
    setWifiQr(qrData);
  };

  const handleGeneratePix = async () => {
    if (!pixKey) {
      alert("Informe a chave Pix.");
      return;
    }
    // Formato padrão payload Pix simples de exibição
    const pixPayload = `PIX|CHAVE:${pixKey}|NOME:${pixName || "LinkSnap"}|CIDADE:${pixCity || "BRASIL"}|VALOR:${pixAmount || "0.00"}`;
    const qrData = await QRCode.toDataURL(pixPayload, { width: 300, margin: 2 });
    setPixQr(qrData);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Deseja realmente remover este link?")) return;
    try {
      const { error } = await supabase.from("links").delete().eq("id", id);
      if (error) throw error;
      setLinks((prev) => prev.filter((l) => l.id !== id));
      if (selectedQr?.code && links.find((l) => l.id === id)?.short_code === selectedQr.code) {
        setSelectedQr(null);
      }
    } catch (err: any) {
      alert("Falha ao excluir link: " + err.message);
    }
  };

  const handleCopy = async (code: string, id: string) => {
    const url = `${origin}/r/${code}`;
    await navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const openQrModal = async (link: LinkItem) => {
    const shortUrl = `${origin}/r/${link.short_code}`;
    const qrDataUrl = await QRCode.toDataURL(shortUrl, { width: 360, margin: 2 });
    setSelectedQr({
      url: shortUrl,
      code: link.short_code,
      title: link.title || link.short_code,
      qrDataUrl,
    });
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <div className="flex h-screen max-h-screen flex-col overflow-hidden bg-black text-[#ededed] antialiased">
      {/* 1. Header Compacto Estilo Vercel + Google (Above-the-Fold) */}
      <header className="z-30 shrink-0 border-b border-[#222222] bg-[#0c0d0e]/90 px-4 py-2.5 backdrop-blur-xl sm:px-6">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
          {/* Logo & Marca */}
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="flex items-center gap-2.5 group">
              <span className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-sm font-black text-white shadow-md shadow-blue-900/40 transition group-hover:scale-105">
                L
              </span>
              <span className="text-base font-bold tracking-tight text-white">LinkSnap</span>
            </Link>
            <span className="hidden items-center gap-1 rounded-full border border-blue-500/20 bg-blue-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-blue-400 sm:inline-flex">
              Vercel + Google Edition
            </span>
          </div>

          {/* Micro Stats em Linha */}
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="flex items-center gap-3 rounded-full border border-[#222222] bg-[#141517] px-3 py-1 text-xs text-neutral-300">
              <div className="flex items-center gap-1.5">
                <span className="text-neutral-500">Links:</span>
                <span className="font-semibold text-white">
                  {links.length}
                  {profile.plan_tier === "free" && <span className="text-neutral-500">/20</span>}
                </span>
              </div>
              <span className="h-3 w-px bg-[#333333]"></span>
              <div className="flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-[#0f9d58]"></span>
                </span>
                <span className="font-semibold text-[#0f9d58]">{totalClicks.toLocaleString("pt-BR")}</span>
                <span className="hidden text-neutral-500 sm:inline">cliques</span>
              </div>
            </div>

            {/* Badge de Plano (Com menção a Mercado Pago no Checkout Pro) */}
            <button
              onClick={() =>
                alert("O checkout via Mercado Pago (PIX e Cartão) estará disponível no próximo passo do projeto!")
              }
              className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider transition ${
                profile.plan_tier === "pro"
                  ? "border border-amber-500/30 bg-amber-500/10 text-amber-400"
                  : "border border-blue-500/20 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20"
              }`}
              title="Assinar Pro via Mercado Pago"
            >
              {profile.plan_tier === "pro" ? "PRO ⚡" : "FREE (Upgrade)"}
            </button>

            {/* Sair */}
            <button
              onClick={handleSignOut}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#222222] text-neutral-400 transition hover:bg-[#1f2023] hover:text-[#ea4335]"
              title="Sair da Conta"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* 2. Barra de Atalhos para Micro-Serviços (Categoria A + Carteirinha + Bio) */}
      <div className="shrink-0 border-b border-[#222222] bg-[#0c0d0e]/60 px-4 py-2 sm:px-6">
        <div className="mx-auto flex max-w-7xl items-center gap-2 overflow-x-auto text-xs custom-scrollbar">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 pr-1">Ferramentas:</span>

          <button
            onClick={() => setActiveTool("bio")}
            className="flex items-center gap-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-blue-300 transition hover:bg-blue-500/20 whitespace-nowrap font-medium"
          >
            <Smartphone className="h-3 w-3 text-blue-400" />
            Bio Link (Linktree)
          </button>

          <button
            onClick={() => setActiveTool("idcard")}
            className="flex items-center gap-1.5 rounded-full border border-purple-500/30 bg-purple-500/10 px-3 py-1 text-purple-300 transition hover:bg-purple-500/20 whitespace-nowrap font-medium"
          >
            <UserCheck className="h-3 w-3 text-purple-400" />
            Carteirinha ID
          </button>

          <button
            onClick={() => setActiveTool("whatsapp")}
            className="flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-emerald-300 transition hover:bg-emerald-500/20 whitespace-nowrap font-medium"
          >
            <MessageSquare className="h-3 w-3 text-emerald-400" />
            WhatsApp wa.me
          </button>

          <button
            onClick={() => setActiveTool("pix")}
            className="flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-amber-300 transition hover:bg-amber-500/20 whitespace-nowrap font-medium"
          >
            <DollarSign className="h-3 w-3 text-amber-400" />
            QR Code Pix
          </button>

          <button
            onClick={() => setActiveTool("wifi")}
            className="flex items-center gap-1.5 rounded-full border border-[#333333] bg-[#141517] px-3 py-1 text-neutral-300 transition hover:bg-[#1f2023] whitespace-nowrap"
          >
            <Wifi className="h-3 w-3 text-neutral-400" />
            QR Code Wi-Fi
          </button>

          <button
            onClick={() => setActiveTool("utm")}
            className="flex items-center gap-1.5 rounded-full border border-[#333333] bg-[#141517] px-3 py-1 text-neutral-300 transition hover:bg-[#1f2023] whitespace-nowrap"
          >
            <Compass className="h-3 w-3 text-neutral-400" />
            UTM Builder
          </button>
        </div>
      </div>

      {/* 3. Conteúdo Principal 100% Above-the-fold no Desktop */}
      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col overflow-hidden px-4 py-3 sm:px-6">
        {/* Floating Utility Bar: Barra de Encurtamento (Vercel Style) */}
        <div className="relative z-20 shrink-0 py-1">
          <form
            onSubmit={handleCreateLink}
            className="group relative flex flex-col gap-2 rounded-2xl border border-[#222222] bg-[#0c0d0e] p-2 shadow-2xl backdrop-blur-2xl transition-all focus-within:border-blue-500/60 focus-within:ring-2 focus-within:ring-blue-500/20 sm:flex-row sm:items-center sm:rounded-full sm:p-1.5"
          >
            <div className="flex min-w-0 flex-1 items-center gap-2 px-3">
              <Link2 className="h-4 w-4 shrink-0 text-blue-500" />
              <input
                type="url"
                required
                value={longUrl}
                onChange={(e) => setLongUrl(e.target.value)}
                placeholder="Cole qualquer URL longa (ex: https://meusite.com/oferta)..."
                className="w-full bg-transparent text-xs text-white placeholder:text-neutral-500 focus:outline-none sm:text-sm"
              />
            </div>

            <div className="hidden h-5 w-px bg-[#222222] sm:block"></div>

            <div className="flex items-center gap-2 px-2 sm:px-0">
              <div className="flex items-center rounded-lg bg-[#141517] px-2.5 py-1 text-xs border border-[#222222]">
                <span className="text-[11px] text-neutral-500 font-mono">/r/</span>
                <input
                  type="text"
                  value={customSlug}
                  onChange={(e) => setCustomSlug(e.target.value)}
                  placeholder="slug-opcional"
                  className="w-24 bg-transparent text-xs text-blue-300 placeholder:text-neutral-600 focus:outline-none sm:w-28 font-mono"
                />
              </div>

              <button
                type="submit"
                disabled={loading || isNearLimit}
                className="flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-blue-600/20 transition disabled:cursor-not-allowed disabled:opacity-50 sm:rounded-full"
              >
                {loading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <>
                    <Zap className="h-3.5 w-3.5" />
                    <span>Encurtar</span>
                    <span className="hidden text-[10px] opacity-75 sm:inline font-mono">↵</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Feedback Toast Inline */}
          {statusMsg && (
            <div
              className={`mt-2 flex items-center justify-between rounded-xl px-3 py-1.5 text-xs ${
                statusMsg.type === "success"
                  ? "border border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
                  : "border border-rose-500/20 bg-rose-500/10 text-rose-300"
              }`}
            >
              <span>{statusMsg.text}</span>
              <button onClick={() => setStatusMsg(null)} className="opacity-70 hover:opacity-100">
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>

        {/* 4. Feed de Links com Rolagem Interna Fixa */}
        <div className="mt-3 flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-[#222222] bg-[#0c0d0e]/80 backdrop-blur-md">
          {/* Barra de Filtro e Busca */}
          <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-[#222222] px-4 py-2.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-neutral-300">
                Links Recentes
              </span>
              <span className="rounded-full bg-[#141517] border border-[#222222] px-2 py-0.5 text-[10px] font-mono text-neutral-300">
                {filteredLinks.length}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative flex items-center">
                <Search className="absolute left-2.5 h-3.5 w-3.5 text-neutral-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar por nome, destino ou slug..."
                  className="w-44 rounded-lg border border-[#222222] bg-[#141517] py-1 pl-8 pr-2.5 text-xs text-white placeholder:text-neutral-600 focus:border-blue-500 focus:outline-none sm:w-60"
                />
              </div>

              <div className="flex items-center rounded-lg border border-[#222222] bg-[#141517] p-0.5 text-[11px]">
                <button
                  onClick={() => setFilterType("all")}
                  className={`rounded-md px-2 py-0.5 transition ${
                    filterType === "all" ? "bg-blue-600 text-white font-medium" : "text-neutral-400 hover:text-white"
                  }`}
                >
                  Todos
                </button>
                <button
                  onClick={() => setFilterType("top")}
                  className={`rounded-md px-2 py-0.5 transition ${
                    filterType === "top" ? "bg-blue-600 text-white font-medium" : "text-neutral-400 hover:text-white"
                  }`}
                >
                  Cliques
                </button>
                <button
                  onClick={() => setFilterType("custom")}
                  className={`rounded-md px-2 py-0.5 transition ${
                    filterType === "custom" ? "bg-blue-600 text-white font-medium" : "text-neutral-400 hover:text-white"
                  }`}
                >
                  Slugs VIP
                </button>
              </div>
            </div>
          </div>

          {/* Área Rolável Interna dos Cards */}
          <div className="custom-scrollbar flex-1 space-y-1.5 overflow-y-auto p-2 sm:p-3">
            {filteredLinks.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center py-12 text-center text-neutral-500">
                <Link2 className="h-8 w-8 stroke-1 text-neutral-600" />
                <p className="mt-2 text-xs font-medium">Nenhum link correspondente encontrado.</p>
                <p className="text-[11px] text-neutral-600">Cole uma URL na barra acima para encurtar.</p>
              </div>
            ) : (
              filteredLinks.map((link) => {
                const shortUrl = `${origin}/r/${link.short_code}`;

                return (
                  <div
                    key={link.id}
                    className="group relative rounded-xl border border-[#222222] bg-[#141517]/80 p-2.5 transition-all hover:border-blue-500/40 hover:bg-[#141517] sm:p-3"
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0 flex-1 pr-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-semibold text-blue-400 hover:text-blue-300">
                            /r/{link.short_code}
                          </span>
                          {link.is_custom_slug && (
                            <span className="rounded-full border border-purple-500/30 bg-purple-500/10 px-1.5 py-0.2 text-[9px] font-semibold text-purple-300">
                              VIP
                            </span>
                          )}
                          <span className="text-[11px] text-neutral-400 truncate font-medium">
                            {link.title || "Link sem título"}
                          </span>
                        </div>
                        <a
                          href={link.long_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-0.5 block truncate text-[11px] text-neutral-500 hover:text-neutral-300"
                        >
                          {link.long_url}
                        </a>
                      </div>

                      <div className="flex items-center justify-between gap-3 sm:justify-end">
                        <div className="flex items-center gap-1.5 rounded-lg bg-black px-2.5 py-1 text-xs border border-[#222222]">
                          <BarChart3 className="h-3.5 w-3.5 text-[#0f9d58]" />
                          <span className="font-mono font-semibold text-neutral-200">
                            {Number(link.clicks || 0).toLocaleString("pt-BR")}
                          </span>
                          <span className="text-[10px] text-neutral-500">cliques</span>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleCopy(link.short_code, link.id)}
                            className="flex items-center gap-1 rounded-lg border border-[#222222] bg-neutral-900 px-2.5 py-1 text-xs font-medium text-neutral-200 transition hover:bg-neutral-800"
                          >
                            {copiedId === link.id ? (
                              <>
                                <Check className="h-3 w-3 text-emerald-400" />
                                <span className="text-emerald-400 text-[11px]">Copiado!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="h-3 w-3 text-neutral-400" />
                                <span className="text-[11px]">Copiar</span>
                              </>
                            )}
                          </button>

                          <button
                            onClick={() => openQrModal(link)}
                            className="flex items-center gap-1 rounded-lg border border-[#222222] bg-neutral-900 px-2 py-1 text-xs font-medium text-neutral-300 transition hover:bg-neutral-800 hover:text-blue-400"
                          >
                            <QrCode className="h-3 w-3 text-blue-400" />
                            <span className="hidden sm:inline text-[11px]">QR Code</span>
                          </button>

                          <a
                            href={shortUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded-lg border border-[#222222] bg-neutral-900 p-1 text-neutral-400 transition hover:bg-neutral-800 hover:text-white"
                          >
                            <ArrowUpRight className="h-3.5 w-3.5" />
                          </a>

                          <button
                            onClick={() => handleDelete(link.id)}
                            className="rounded-lg border border-[#222222] bg-neutral-900 p-1 text-neutral-500 transition hover:bg-rose-500/10 hover:text-rose-400"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </main>

      {/* ========================================================
          MODAIS E DRAWERS DE SERVIÇOS (CATEGORIA A & CARTEIRINHA)
         ======================================================== */}

      {/* MODAL 1: Bio Link (Linktree) Builder */}
      {activeTool === "bio" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-lg rounded-3xl border border-[#333333] bg-[#0c0d0e] p-6 shadow-2xl">
            <button
              onClick={() => setActiveTool("none")}
              className="absolute right-4 top-4 rounded-full border border-[#222222] p-1.5 text-neutral-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <Smartphone className="h-5 w-5 text-blue-400" />
              <h3 className="text-base font-bold text-white">Criador de Página de Perfil (Linktree)</h3>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-neutral-400 font-medium mb-1">Seu Link Público</label>
                <div className="flex items-center rounded-xl border border-[#222222] bg-black px-3 py-1.5 font-mono text-blue-400">
                  <span>{origin}/b/</span>
                  <input
                    type="text"
                    value={bioUsername}
                    onChange={(e) => setBioUsername(e.target.value)}
                    placeholder="seunome"
                    className="w-full bg-transparent text-white focus:outline-none pl-1"
                  />
                </div>
              </div>

              <div>
                <label className="block text-neutral-400 font-medium mb-1">Título do Perfil</label>
                <input
                  type="text"
                  value={bioTitle}
                  onChange={(e) => setBioTitle(e.target.value)}
                  placeholder="Ex: Oscar Moraes | Tech Lead"
                  className="w-full rounded-xl border border-[#222222] bg-black px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-neutral-400 font-medium mb-1">Bio / Descrição</label>
                <textarea
                  value={bioDesc}
                  onChange={(e) => setBioDesc(e.target.value)}
                  placeholder="Ex: Criador de soluções SaaS, IA e projetos web."
                  rows={2}
                  className="w-full rounded-xl border border-[#222222] bg-black px-3 py-1.5 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Lista de botões da Bio */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-neutral-400 font-medium">Botões de Links</label>
                  <button
                    type="button"
                    onClick={() => setBioLinks([...bioLinks, { title: "Novo Link", url: "https://" }])}
                    className="flex items-center gap-1 text-[11px] text-blue-400 hover:text-blue-300"
                  >
                    <Plus className="h-3 w-3" /> Adicionar Botão
                  </button>
                </div>

                <div className="max-h-40 overflow-y-auto space-y-2 custom-scrollbar pr-1">
                  {bioLinks.map((item, idx) => (
                    <div key={idx} className="flex gap-2 items-center bg-[#141517] p-2 rounded-xl border border-[#222222]">
                      <input
                        type="text"
                        value={item.title}
                        onChange={(e) => {
                          const updated = [...bioLinks];
                          updated[idx].title = e.target.value;
                          setBioLinks(updated);
                        }}
                        placeholder="Título do Botão"
                        className="w-1/3 bg-transparent text-white border-b border-[#333333] pb-0.5 text-xs focus:outline-none"
                      />
                      <input
                        type="url"
                        value={item.url}
                        onChange={(e) => {
                          const updated = [...bioLinks];
                          updated[idx].url = e.target.value;
                          setBioLinks(updated);
                        }}
                        placeholder="https://..."
                        className="flex-1 bg-transparent text-neutral-400 border-b border-[#333333] pb-0.5 text-xs focus:outline-none"
                      />
                      <button
                        onClick={() => setBioLinks(bioLinks.filter((_, i) => i !== idx))}
                        className="text-neutral-500 hover:text-rose-400 p-1"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  disabled={savingBio}
                  onClick={handleSaveBio}
                  className="flex-1 rounded-xl bg-blue-600 hover:bg-blue-500 py-2.5 text-center font-semibold text-white shadow-lg transition"
                >
                  {savingBio ? "Salvando..." : "Salvar & Publicar Página de Bio"}
                </button>

                {bioUsername && (
                  <a
                    href={`${origin}/b/${bioUsername}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-xl border border-[#222222] bg-[#141517] px-4 py-2.5 text-center text-neutral-300 hover:text-white flex items-center gap-1"
                  >
                    <span>Ver</span>
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Carteirinha Digital / ID Badge */}
      {activeTool === "idcard" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-md rounded-3xl border border-[#333333] bg-[#0c0d0e] p-6 shadow-2xl">
            <button
              onClick={() => setActiveTool("none")}
              className="absolute right-4 top-4 rounded-full border border-[#222222] p-1.5 text-neutral-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <UserCheck className="h-5 w-5 text-purple-400" />
              <h3 className="text-base font-bold text-white">Carteirinha de Identificação Digital</h3>
            </div>

            {/* Visualização da Carteirinha Estilo Credencial Tech */}
            <div className="mx-auto my-3 w-72 rounded-2xl border-2 border-purple-500/40 bg-gradient-to-b from-[#161618] to-[#08080a] p-5 shadow-2xl text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-500 via-purple-500 to-emerald-400"></div>

              <div className="mx-auto mt-2 h-16 w-16 rounded-full border-2 border-purple-400 bg-neutral-900 p-0.5 shadow-lg flex items-center justify-center font-bold text-lg text-purple-300">
                {idName.substring(0, 2).toUpperCase()}
              </div>

              <h4 className="mt-3 font-bold text-white text-sm">{idName}</h4>
              <p className="text-[11px] text-purple-300 font-medium">{idRole}</p>
              <p className="text-[10px] text-neutral-500">{idOrg}</p>

              {/* QR Code de Validação da Carteirinha */}
              {badgeQr && (
                <div className="mx-auto my-3 h-28 w-28 rounded-xl bg-white p-1.5 shadow-lg flex items-center justify-center">
                  <img src={badgeQr} alt="QR Carteirinha" className="h-full w-full" />
                </div>
              )}

              <div className="flex justify-between items-center text-[9px] font-mono text-neutral-500 border-t border-[#222222] pt-2">
                <span>ID: {idCode}</span>
                <span className="text-emerald-400">● ATIVO</span>
              </div>
            </div>

            {/* Customização rápida */}
            <div className="grid grid-cols-2 gap-2 text-xs mt-4">
              <div>
                <label className="text-[10px] text-neutral-400">Nome</label>
                <input
                  type="text"
                  value={idName}
                  onChange={(e) => setIdName(e.target.value)}
                  className="w-full bg-black border border-[#222222] rounded-lg px-2 py-1 text-white"
                />
              </div>
              <div>
                <label className="text-[10px] text-neutral-400">Cargo / Função</label>
                <input
                  type="text"
                  value={idRole}
                  onChange={(e) => setIdRole(e.target.value)}
                  className="w-full bg-black border border-[#222222] rounded-lg px-2 py-1 text-white"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              {badgeQr && (
                <a
                  href={badgeQr}
                  download={`carteirinha-${idCode}.png`}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 py-2.5 text-center text-xs font-semibold text-white shadow-lg"
                >
                  <Download className="h-3.5 w-3.5" />
                  Baixar QR Code da Carteirinha
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Gerador WhatsApp (wa.me) */}
      {activeTool === "whatsapp" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-md rounded-3xl border border-[#333333] bg-[#0c0d0e] p-6 shadow-2xl">
            <button
              onClick={() => setActiveTool("none")}
              className="absolute right-4 top-4 rounded-full border border-[#222222] p-1.5 text-neutral-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <MessageSquare className="h-5 w-5 text-emerald-400" />
              <h3 className="text-base font-bold text-white">Gerador de Link WhatsApp (wa.me)</h3>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-neutral-400 font-medium mb-1">Telefone com DDD</label>
                <input
                  type="tel"
                  value={waPhone}
                  onChange={(e) => setWaPhone(e.target.value)}
                  placeholder="Ex: 5511999998888"
                  className="w-full rounded-xl border border-[#222222] bg-black px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-neutral-400 font-medium mb-1">Mensagem Automática (Opcional)</label>
                <textarea
                  value={waMsg}
                  onChange={(e) => setWaMsg(e.target.value)}
                  placeholder="Olá! Vi seu link e gostaria de mais informações..."
                  rows={3}
                  className="w-full rounded-xl border border-[#222222] bg-black px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <button
                type="button"
                onClick={handleGenerateWhatsApp}
                className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-500 py-2.5 font-semibold text-white shadow-lg transition mt-2"
              >
                Inserir no Encurtador & Gerar Link Curto
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: QR Code Pix */}
      {activeTool === "pix" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-md rounded-3xl border border-[#333333] bg-[#0c0d0e] p-6 shadow-2xl">
            <button
              onClick={() => setActiveTool("none")}
              className="absolute right-4 top-4 rounded-full border border-[#222222] p-1.5 text-neutral-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <DollarSign className="h-5 w-5 text-amber-400" />
              <h3 className="text-base font-bold text-white">Gerador de QR Code Pix</h3>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-neutral-400 font-medium mb-1">Chave Pix (E-mail, CPF, Tel ou Aleatória)</label>
                <input
                  type="text"
                  value={pixKey}
                  onChange={(e) => setPixKey(e.target.value)}
                  placeholder="suachave@email.com"
                  className="w-full rounded-xl border border-[#222222] bg-black px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-neutral-400 font-medium mb-1">Nome do Beneficiário</label>
                  <input
                    type="text"
                    value={pixName}
                    onChange={(e) => setPixName(e.target.value)}
                    placeholder="Seu Nome"
                    className="w-full rounded-xl border border-[#222222] bg-black px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-neutral-400 font-medium mb-1">Valor R$ (Opcional)</label>
                  <input
                    type="text"
                    value={pixAmount}
                    onChange={(e) => setPixAmount(e.target.value)}
                    placeholder="29.90"
                    className="w-full rounded-xl border border-[#222222] bg-black px-3 py-2 text-white"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleGeneratePix}
                className="w-full rounded-xl bg-amber-600 hover:bg-amber-500 py-2.5 font-semibold text-white shadow-lg transition"
              >
                Gerar QR Code Pix
              </button>

              {pixQr && (
                <div className="text-center pt-2">
                  <div className="mx-auto w-40 h-40 bg-white p-2 rounded-xl shadow-lg flex items-center justify-center my-2">
                    <img src={pixQr} alt="QR Pix" className="h-full w-full" />
                  </div>
                  <a
                    href={pixQr}
                    download="pix-qrcode.png"
                    className="text-amber-400 hover:underline text-[11px] font-medium"
                  >
                    Baixar Imagem PNG do Pix
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: QR Code Wi-Fi */}
      {activeTool === "wifi" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-md rounded-3xl border border-[#333333] bg-[#0c0d0e] p-6 shadow-2xl">
            <button
              onClick={() => setActiveTool("none")}
              className="absolute right-4 top-4 rounded-full border border-[#222222] p-1.5 text-neutral-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <Wifi className="h-5 w-5 text-neutral-300" />
              <h3 className="text-base font-bold text-white">QR Code para Conexão Wi-Fi</h3>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-neutral-400 font-medium mb-1">Nome da Rede (SSID)</label>
                <input
                  type="text"
                  value={wifiSsid}
                  onChange={(e) => setWifiSsid(e.target.value)}
                  placeholder="MinhaRede_5G"
                  className="w-full rounded-xl border border-[#222222] bg-black px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-neutral-400 font-medium mb-1">Senha da Rede</label>
                <input
                  type="password"
                  value={wifiPass}
                  onChange={(e) => setWifiPass(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-[#222222] bg-black px-3 py-2 text-white"
                />
              </div>

              <button
                type="button"
                onClick={handleGenerateWifi}
                className="w-full rounded-xl bg-neutral-800 hover:bg-neutral-700 py-2.5 font-semibold text-white shadow-lg transition"
              >
                Gerar QR Code Wi-Fi
              </button>

              {wifiQr && (
                <div className="text-center pt-2">
                  <div className="mx-auto w-40 h-40 bg-white p-2 rounded-xl shadow-lg flex items-center justify-center my-2">
                    <img src={wifiQr} alt="QR WiFi" className="h-full w-full" />
                  </div>
                  <a
                    href={wifiQr}
                    download="wifi-qrcode.png"
                    className="text-blue-400 hover:underline text-[11px] font-medium"
                  >
                    Baixar Imagem PNG do Wi-Fi
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 6: UTM Builder */}
      {activeTool === "utm" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-md rounded-3xl border border-[#333333] bg-[#0c0d0e] p-6 shadow-2xl">
            <button
              onClick={() => setActiveTool("none")}
              className="absolute right-4 top-4 rounded-full border border-[#222222] p-1.5 text-neutral-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <Compass className="h-5 w-5 text-blue-400" />
              <h3 className="text-base font-bold text-white">Criador de Parâmetros UTM</h3>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-neutral-400 font-medium mb-1">URL Base</label>
                <input
                  type="url"
                  value={utmBase}
                  onChange={(e) => setUtmBase(e.target.value)}
                  placeholder="https://seusite.com/oferta"
                  className="w-full rounded-xl border border-[#222222] bg-black px-3 py-2 text-white"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-neutral-400 font-medium">Origem (Source)</label>
                  <input
                    type="text"
                    value={utmSource}
                    onChange={(e) => setUtmSource(e.target.value)}
                    placeholder="instagram"
                    className="w-full rounded-xl border border-[#222222] bg-black px-2 py-1.5 text-white"
                  />
                </div>
                <div>
                  <label className="text-neutral-400 font-medium">Mídia (Medium)</label>
                  <input
                    type="text"
                    value={utmMedium}
                    onChange={(e) => setUtmMedium(e.target.value)}
                    placeholder="stories"
                    className="w-full rounded-xl border border-[#222222] bg-black px-2 py-1.5 text-white"
                  />
                </div>
                <div>
                  <label className="text-neutral-400 font-medium">Campanha</label>
                  <input
                    type="text"
                    value={utmCampaign}
                    onChange={(e) => setUtmCampaign(e.target.value)}
                    placeholder="black-friday"
                    className="w-full rounded-xl border border-[#222222] bg-black px-2 py-1.5 text-white"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleGenerateUtm}
                className="w-full rounded-xl bg-blue-600 hover:bg-blue-500 py-2.5 font-semibold text-white shadow-lg transition"
              >
                Aplicar e Preencher no Encurtador
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 7: QR Code do Link Encurtado (Apple/Vercel style) */}
      {selectedQr && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-sm rounded-3xl border border-[#333333] bg-[#0c0d0e] p-6 shadow-2xl">
            <button
              onClick={() => setSelectedQr(null)}
              className="absolute right-4 top-4 rounded-full border border-[#222222] p-1.5 text-neutral-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="text-center">
              <span className="inline-flex items-center gap-1 rounded-full border border-blue-500/20 bg-blue-500/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase text-blue-400">
                QR Code Dinâmico
              </span>
              <h3 className="mt-2 text-base font-bold text-white truncate">{selectedQr.title}</h3>
              <p className="mt-0.5 font-mono text-xs text-blue-400 truncate">{selectedQr.url}</p>

              <div className="mx-auto my-5 flex w-48 items-center justify-center rounded-2xl bg-white p-3 shadow-2xl">
                <img src={selectedQr.qrDataUrl} alt="QR Code" className="h-40 w-40" />
              </div>

              <div className="flex flex-col gap-2">
                <a
                  href={selectedQr.qrDataUrl}
                  download={`qrcode-${selectedQr.code}.png`}
                  className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 py-2.5 text-xs font-semibold text-white shadow-lg shadow-blue-600/20 transition"
                >
                  <Download className="h-3.5 w-3.5" />
                  Baixar Imagem PNG (Alta Resolução)
                </a>

                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(selectedQr.url);
                    alert("Link curto copiado!");
                  }}
                  className="rounded-xl border border-[#222222] bg-[#141517] py-2 text-xs font-medium text-neutral-300 hover:bg-[#1f2023]"
                >
                  Copiar Link Curto
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
