"use client";

import { useState, useMemo } from "react";
import { createClient } from "@/utils/supabase/client";
import {
  BarChart3,
  Globe,
  Smartphone,
  Clock,
  Share2,
  Copy,
  Check,
  ExternalLink,
  Download,
  RefreshCw,
  MousePointerClick,
  Eye,
  Users,
  Link2,
  Sparkles,
  ArrowUpRight,
} from "lucide-react";

interface ClickEvent {
  id: string;
  link_id: string;
  clicked_at: string;
  referrer: string | null;
  country_code: string | null;
  device_type: string | null;
  browser: string | null;
}

interface LinkSummary {
  id: string;
  short_code: string;
  long_url: string;
  title: string | null;
  clicks: number;
  source_type: string | null;
  link_scope: string | null;
  branded_handle: string | null;
}

interface BioSummary {
  id: string;
  slug: string;
  title: string;
  views: number;
  totalBlockClicks: number;
}

interface AnalyticsClientProps {
  userId: string;
  userHandle: string;
  brandName: string;
  initialShareToken: string | null;
  origin: string;
  links: LinkSummary[];
  clicks: ClickEvent[];
  bios: BioSummary[];
  leadsCount: number;
  isPublicReport?: boolean;
}

export default function AnalyticsClient({
  userId,
  userHandle,
  brandName,
  initialShareToken,
  origin,
  links,
  clicks,
  bios,
  leadsCount,
  isPublicReport = false,
}: AnalyticsClientProps) {
  const supabase = createClient();
  const [period, setPeriod] = useState<"7d" | "30d" | "90d" | "all">("30d");
  const [shareToken, setShareToken] = useState<string | null>(initialShareToken);
  const [generatingToken, setGeneratingToken] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);

  // Filtra eventos de clique pelo período selecionado
  const filteredClicks = useMemo(() => {
    if (period === "all") return clicks;
    const days = period === "7d" ? 7 : period === "30d" ? 30 : 90;
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    return clicks.filter((c) => new Date(c.clicked_at).getTime() >= cutoff);
  }, [clicks, period]);

  // Totais gerais
  const totalLinkClicks = useMemo(
    () => links.reduce((acc, l) => acc + Number(l.clicks || 0), 0),
    [links]
  );
  const totalBioViews = useMemo(
    () => bios.reduce((acc, b) => acc + Number(b.views || 0), 0),
    [bios]
  );
  const totalBioBlockClicks = useMemo(
    () => bios.reduce((acc, b) => acc + Number(b.totalBlockClicks || 0), 0),
    [bios]
  );

  // Agrupamento por Dia (últimos 14 dias para o gráfico de evolução)
  const dailySeries = useMemo(() => {
    const daysCount = period === "7d" ? 7 : 14;
    const map = new Map<string, { label: string; count: number }>();

    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().slice(0, 10);
      const label = d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
      map.set(key, { label, count: 0 });
    }

    filteredClicks.forEach((c) => {
      const key = new Date(c.clicked_at).toISOString().slice(0, 10);
      const item = map.get(key);
      if (item) item.count += 1;
    });

    return Array.from(map.values());
  }, [filteredClicks, period]);

  const maxDailyCount = Math.max(...dailySeries.map((d) => d.count), 1);

  // Distribuição por Horário (00h - 23h)
  const hourlyDistribution = useMemo(() => {
    const hours = Array.from({ length: 24 }, (_, h) => ({
      hour: `${String(h).padStart(2, "0")}h`,
      count: 0,
    }));

    filteredClicks.forEach((c) => {
      const h = new Date(c.clicked_at).getHours();
      if (hours[h]) hours[h].count += 1;
    });

    return hours;
  }, [filteredClicks]);

  const maxHourCount = Math.max(...hourlyDistribution.map((h) => h.count), 1);

  const peakHour = useMemo(() => {
    const total = hourlyDistribution.reduce((s, h) => s + h.count, 0);
    if (total === 0) return "Sem dados no período";
    const sorted = [...hourlyDistribution].sort((a, b) => b.count - a.count);
    return `${sorted[0].hour} (${sorted[0].count} cliques)`;
  }, [hourlyDistribution]);

  // Origem do Tráfego (Referrer categorizado)
  const sourceBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredClicks.forEach((c) => {
      const ref = (c.referrer || "").toLowerCase();
      let label = "Direto / QR Code";
      if (ref.includes("instagram.com") || ref.includes("l.instagram")) label = "Instagram";
      else if (ref.includes("whatsapp") || ref.includes("wa.me")) label = "WhatsApp";
      else if (ref.includes("tiktok.com")) label = "TikTok";
      else if (ref.includes("google.")) label = "Google";
      else if (ref.includes("facebook.com") || ref.includes("fb.")) label = "Facebook";
      else if (ref.includes("youtube.com") || ref.includes("youtu.be")) label = "YouTube";
      else if (ref.includes("t.co") || ref.includes("twitter.com") || ref.includes("x.com")) label = "X / Twitter";
      else if (ref.trim() !== "") {
        try {
          label = new URL(c.referrer!).hostname.replace(/^www\./, "");
        } catch {
          label = "Outros Sites";
        }
      }
      counts[label] = (counts[label] || 0) + 1;
    });

    const total = filteredClicks.length || 1;
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, count]) => ({
        name,
        count,
        pct: Math.round((count / total) * 100),
      }));
  }, [filteredClicks]);

  // Dispositivos
  const deviceBreakdown = useMemo(() => {
    const counts: Record<string, number> = { Mobile: 0, Desktop: 0, Tablet: 0 };
    filteredClicks.forEach((c) => {
      const d = (c.device_type || "desktop").toLowerCase();
      if (d === "mobile") counts.Mobile += 1;
      else if (d === "tablet") counts.Tablet += 1;
      else counts.Desktop += 1;
    });
    const total = filteredClicks.length || 1;
    return Object.entries(counts)
      .filter(([, count]) => count > 0 || filteredClicks.length === 0)
      .map(([name, count]) => ({
        name,
        count,
        pct: filteredClicks.length === 0 ? 0 : Math.round((count / total) * 100),
      }));
  }, [filteredClicks]);

  // Localização (País)
  const countryBreakdown = useMemo(() => {
    const names: Record<string, string> = {
      BR: "Brasil",
      US: "Estados Unidos",
      PT: "Portugal",
      AR: "Argentina",
      MX: "México",
      ES: "Espanha",
    };
    const counts: Record<string, number> = {};
    filteredClicks.forEach((c) => {
      const code = (c.country_code || "BR").toUpperCase();
      const label = names[code] || code;
      counts[label] = (counts[label] || 0) + 1;
    });
    const total = filteredClicks.length || 1;
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({
        name,
        count,
        pct: Math.round((count / total) * 100),
      }));
  }, [filteredClicks]);

  // Gerar ou rotacionar token de compartilhamento público
  const handleGenerateShareToken = async () => {
    setGeneratingToken(true);
    try {
      const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
      const arr = new Uint8Array(12);
      crypto.getRandomValues(arr);
      const token = Array.from(arr, (v) => chars[v % chars.length]).join("");

      const { error } = await supabase
        .from("profiles")
        .update({ analytics_share_token: token, updated_at: new Date().toISOString() })
        .eq("id", userId);

      if (error) throw error;
      setShareToken(token);
    } catch (err: any) {
      alert("Erro ao gerar link de relatório: " + err.message);
    } finally {
      setGeneratingToken(false);
    }
  };

  const handleDisableShareToken = async () => {
    setGeneratingToken(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ analytics_share_token: null, updated_at: new Date().toISOString() })
        .eq("id", userId);

      if (error) throw error;
      setShareToken(null);
    } catch (err: any) {
      alert("Erro ao desativar link: " + err.message);
    } finally {
      setGeneratingToken(false);
    }
  };

  const shareUrl = shareToken ? `${origin}/s/${shareToken}` : null;

  const handleCopyShareUrl = async () => {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2000);
  };

  const handleExportCsv = () => {
    const rows = [
      ["Tipo", "Identificador", "Título / Destino", "Cliques / Views"],
      ...links.map((l) => [
        `Link (${l.source_type || "direto"})`,
        l.link_scope === "branded" ? `/r/@${l.branded_handle || userHandle}/${l.short_code}` : `/r/${l.short_code}`,
        l.long_url,
        String(l.clicks),
      ]),
      ...bios.map((b) => [
        "Bio Page",
        `/b/${userHandle}/${b.slug}`,
        b.title,
        `${b.views} views / ${b.totalBlockClicks} cliques`,
      ]),
    ];

    const csvContent =
      "data:text/csv;charset=utf-8," +
      rows.map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");

    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `relatorio-analytics-${userHandle}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 flex items-center gap-2">
              <BarChart3 className="h-6 w-6 text-blue-600" />
              {isPublicReport ? `Relatório em Tempo Real — ${brandName}` : "Analytics & Desempenho"}
            </h1>
            {isPublicReport && (
              <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700">
                Ao Vivo
              </span>
            )}
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            {isPublicReport
              ? `Métricas auditadas de acessos, origens de tráfego, horários de pico e conversão de @${userHandle}.`
              : "Acompanhe de onde vem cada clique, horários de maior engajamento, dispositivos e compartilhe relatórios com clientes."}
          </p>
        </div>

        {/* Seletor de Período & Exportação */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 rounded-lg border border-zinc-200 bg-zinc-50 p-1 text-xs">
            {(
              [
                { id: "7d", label: "7 dias" },
                { id: "30d", label: "30 dias" },
                { id: "90d", label: "90 dias" },
                { id: "all", label: "Tudo" },
              ] as const
            ).map((p) => (
              <button
                key={p.id}
                onClick={() => setPeriod(p.id)}
                className={`rounded-md px-2.5 py-1 font-semibold transition ${
                  period === p.id
                    ? "bg-white text-zinc-900 shadow-xs border border-zinc-200/80"
                    : "text-zinc-500 hover:text-zinc-900"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <button
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 shadow-xs"
          >
            <Download className="h-3.5 w-3.5" />
            Exportar CSV
          </button>
        </div>
      </div>

      {/* Barra de Compartilhamento para Agências / Clientes (Apenas no Dashboard privado) */}
      {!isPublicReport && (
        <div className="rounded-xl border border-blue-200 bg-blue-50/40 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold text-blue-950">
              <Share2 className="h-4 w-4 text-blue-600" />
              Relatório Compartilhável para Clientes e Parceiros (Sem Senha)
            </div>
            <p className="text-[11px] text-zinc-600">
              Envie um link exclusivo para seu cliente ou patrocinador acompanhar as métricas em tempo real sem precisar de login.
            </p>
          </div>

          {shareUrl ? (
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <div className="flex items-center rounded-lg border border-blue-200 bg-white px-3 py-1.5 text-xs font-mono text-blue-700 max-w-[260px] truncate">
                {shareUrl}
              </div>
              <button
                onClick={handleCopyShareUrl}
                className="inline-flex items-center gap-1 rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-zinc-800"
              >
                {copiedShare ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                {copiedShare ? "Copiado!" : "Copiar Link"}
              </button>
              <a
                href={shareUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 bg-white p-1.5 text-zinc-600 hover:bg-zinc-100"
                title="Abrir relatório público"
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
              <button
                onClick={handleDisableShareToken}
                disabled={generatingToken}
                className="text-[11px] text-red-600 hover:underline px-2"
              >
                Revogar
              </button>
            </div>
          ) : (
            <button
              onClick={handleGenerateShareToken}
              disabled={generatingToken}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 shadow-xs shrink-0"
            >
              <Sparkles className="h-3.5 w-3.5" />
              {generatingToken ? "Gerando..." : "Ativar Link de Relatório Público"}
            </button>
          )}
        </div>
      )}

      {/* 4 KPIs Principais */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-zinc-500">
            <span>Cliques em Links Curtos</span>
            <MousePointerClick className="h-4 w-4 text-blue-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-zinc-900">
            {totalLinkClicks.toLocaleString("pt-BR")}
          </div>
          <div className="mt-1 text-[11px] text-zinc-400">
            {filteredClicks.length} cliques rastreados no período
          </div>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-zinc-500">
            <span>Visitas nas Bio Pages</span>
            <Eye className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-zinc-900">
            {totalBioViews.toLocaleString("pt-BR")}
          </div>
          <div className="mt-1 text-[11px] text-zinc-400">
            Em {bios.length} {bios.length === 1 ? "página ativa" : "páginas ativas"}
          </div>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-zinc-500">
            <span>Cliques na Bio (Botões/Pix/Loja)</span>
            <Link2 className="h-4 w-4 text-indigo-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-zinc-900">
            {totalBioBlockClicks.toLocaleString("pt-BR")}
          </div>
          <div className="mt-1 text-[11px] text-zinc-400">
            CTR médio:{" "}
            {totalBioViews > 0
              ? `${Math.min(100, Math.round((totalBioBlockClicks / totalBioViews) * 100))}%`
              : "0%"}
          </div>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-zinc-500">
            <span>Contatos / Leads Capturados</span>
            <Users className="h-4 w-4 text-amber-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-zinc-900">
            {leadsCount.toLocaleString("pt-BR")}
          </div>
          <div className="mt-1 text-[11px] text-zinc-400">
            Horário de pico: <strong className="text-zinc-700">{peakHour}</strong>
          </div>
        </div>
      </div>

      {/* Gráficos de Evolução Diária & Horário do Dia */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Evolução por Dia (7 cols) */}
        <div className="lg:col-span-7 rounded-xl border border-zinc-200 bg-white p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-zinc-900">Evolução Diária de Cliques</h2>
              <p className="text-[11px] text-zinc-400">Desempenho nos últimos dias</p>
            </div>
            <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md">
              {dailySeries.reduce((s, d) => s + d.count, 0)} cliques
            </span>
          </div>

          <div className="h-44 flex items-end gap-2 pt-6 pb-2 border-b border-zinc-200">
            {dailySeries.map((day, idx) => {
              const heightPct = Math.max(6, Math.round((day.count / maxDailyCount) * 100));
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 group">
                  <span className="text-[10px] font-mono text-zinc-500 opacity-0 group-hover:opacity-100 transition">
                    {day.count}
                  </span>
                  <div className="w-full bg-zinc-200 rounded-t-md h-32 flex items-end overflow-hidden">
                    <div
                      className="w-full bg-blue-600 group-hover:bg-blue-700 rounded-t-md transition-all"
                      style={{ height: `${day.count === 0 ? 4 : heightPct}%`, opacity: day.count === 0 ? 0.25 : 1 }}
                    />
                  </div>
                  <span className="text-[10px] text-zinc-400 font-mono">{day.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Distribuição por Horário (5 cols) */}
        <div className="lg:col-span-5 rounded-xl border border-zinc-200 bg-white p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-zinc-900 flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-zinc-500" />
                Cliques por Horário do Dia
              </h2>
              <p className="text-[11px] text-zinc-400">Descubra a melhor hora para postar</p>
            </div>
          </div>

          <div className="h-44 flex items-end gap-1 pt-6 pb-2 border-b border-zinc-200">
            {hourlyDistribution.map((h, idx) => {
              const heightPct = Math.max(6, Math.round((h.count / maxHourCount) * 100));
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-1 group" title={`${h.hour}: ${h.count} cliques`}>
                  <div className="w-full bg-zinc-200 rounded-t h-32 flex items-end overflow-hidden">
                    <div
                      className="w-full bg-emerald-600 group-hover:bg-emerald-700 rounded-t transition-all"
                      style={{ height: `${h.count === 0 ? 4 : heightPct}%`, opacity: h.count === 0 ? 0.2 : 1 }}
                    />
                  </div>
                  {idx % 4 === 0 && (
                    <span className="text-[9px] text-zinc-400 font-mono">{h.hour}</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3 Colunas: Origem, Dispositivo e Localização */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Origem do Tráfego */}
        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
            <ArrowUpRight className="h-4 w-4 text-blue-600" />
            Origem do Tráfego
          </h3>
          {sourceBreakdown.length === 0 ? (
            <p className="text-xs text-zinc-400 py-6 text-center">Nenhum clique registrado no período.</p>
          ) : (
            <div className="space-y-3">
              {sourceBreakdown.map((item, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-zinc-800">{item.name}</span>
                    <span className="text-zinc-500 font-mono">
                      {item.count} ({item.pct}%)
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-zinc-200 overflow-hidden">
                    <div className="h-full rounded-full bg-blue-600" style={{ width: `${item.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Dispositivos */}
        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
            <Smartphone className="h-4 w-4 text-emerald-600" />
            Dispositivos
          </h3>
          <div className="space-y-3">
            {deviceBreakdown.map((item, i) => (
              <div key={i} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-zinc-800">{item.name}</span>
                  <span className="text-zinc-500 font-mono">
                    {item.count} ({item.pct}%)
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-zinc-200 overflow-hidden">
                  <div className="h-full rounded-full bg-emerald-600" style={{ width: `${item.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Países / Regiões */}
        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
            <Globe className="h-4 w-4 text-indigo-600" />
            Localização (Países)
          </h3>
          {countryBreakdown.length === 0 ? (
            <p className="text-xs text-zinc-400 py-6 text-center">Sem dados geográficos ainda.</p>
          ) : (
            <div className="space-y-3">
              {countryBreakdown.map((item, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-zinc-800">{item.name}</span>
                    <span className="text-zinc-500 font-mono">
                      {item.count} ({item.pct}%)
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-zinc-200 overflow-hidden">
                    <div className="h-full rounded-full bg-indigo-600" style={{ width: `${item.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Ranking de Top Links & Bio Pages */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Links Curtos */}
        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-xs space-y-3">
          <h3 className="text-sm font-bold text-zinc-900">Links Mais Clicados</h3>
          {links.length === 0 ? (
            <p className="text-xs text-zinc-400 py-6 text-center">Nenhum link criado ainda.</p>
          ) : (
            <div className="divide-y divide-zinc-200">
              {[...links]
                .sort((a, b) => b.clicks - a.clicks)
                .slice(0, 6)
                .map((link) => (
                  <div key={link.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                    <div className="min-w-0">
                      <div className="font-mono font-bold text-blue-600 truncate">
                        {link.link_scope === "branded"
                          ? `/r/@${link.branded_handle || userHandle}/${link.short_code}`
                          : `/r/${link.short_code}`}
                      </div>
                      <div className="text-[11px] text-zinc-400 truncate">{link.title || link.long_url}</div>
                    </div>
                    <span className="rounded-md bg-zinc-100 px-2.5 py-1 font-mono font-bold text-zinc-800 shrink-0">
                      {link.clicks} cliques
                    </span>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Performance das Bio Pages */}
        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-xs space-y-3">
          <h3 className="text-sm font-bold text-zinc-900">Desempenho das Bio Pages</h3>
          {bios.length === 0 ? (
            <p className="text-xs text-zinc-400 py-6 text-center">Nenhuma página de Bio criada ainda.</p>
          ) : (
            <div className="divide-y divide-zinc-200">
              {bios.map((bio) => (
                <div key={bio.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                  <div className="min-w-0">
                    <div className="font-semibold text-zinc-900 truncate">{bio.title}</div>
                    <div className="font-mono text-[11px] text-zinc-400">/b/{userHandle}/{bio.slug}</div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="rounded-md bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 font-mono text-[11px] font-semibold">
                      {bio.views} visitas
                    </span>
                    <span className="rounded-md bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 font-mono text-[11px] font-semibold">
                      {bio.totalBlockClicks} cliques
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
