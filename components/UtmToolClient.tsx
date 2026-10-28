"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { createShortLink } from "@/utils/shortlink";
import ShortLinkPanel from "./ShortLinkPanel";
import {
  Compass,
  Copy,
  Check,
  Trash2,
  Clock,
  ExternalLink,
  Sparkles,
} from "lucide-react";

interface UtmToolItem {
  id: string;
  name: string;
  payload: {
    baseUrl: string;
    source: string;
    medium: string;
    campaign: string;
    term?: string;
    content?: string;
    finalUrl: string;
    shortUrl?: string;
  };
  link_id?: string | null;
  created_at: string;
}

export default function UtmToolClient({
  initialItems,
  userId,
  userHandle,
  origin,
}: {
  initialItems: UtmToolItem[];
  userId: string;
  userHandle: string;
  origin: string;
}) {
  const supabase = createClient();
  const [items, setItems] = useState<UtmToolItem[]>(initialItems);

  // Form State
  const [name, setName] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [source, setSource] = useState("");
  const [medium, setMedium] = useState("");
  const [campaign, setCampaign] = useState("");
  const [term, setTerm] = useState("");
  const [content, setContent] = useState("");

  // Encurtador (Ligado por padrão)
  const [createShortEnabled, setCreateShortEnabled] = useState(true);
  const [scope, setScope] = useState<"global" | "branded">("global");
  const [customSlug, setCustomSlug] = useState("");
  const [shortUrl, setShortUrl] = useState<string | null>(null);
  const [shortening, setShortening] = useState(false);

  // Result State
  const [finalUrl, setFinalUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);

  // Fast presets
  const applyPreset = (presetSource: string, presetMedium: string, presetCampaign: string) => {
    setSource(presetSource);
    setMedium(presetMedium);
    if (!campaign) setCampaign(presetCampaign);
  };

  const buildUrl = (base: string, s: string, m: string, c: string, t: string, cnt: string) => {
    if (!base.trim()) return "";
    try {
      let urlStr = base.trim();
      if (!urlStr.startsWith("http://") && !urlStr.startsWith("https://")) {
        urlStr = "https://" + urlStr;
      }
      const u = new URL(urlStr);
      if (s.trim()) u.searchParams.set("utm_source", s.trim());
      if (m.trim()) u.searchParams.set("utm_medium", m.trim());
      if (c.trim()) u.searchParams.set("utm_campaign", c.trim());
      if (t.trim()) u.searchParams.set("utm_term", t.trim());
      if (cnt.trim()) u.searchParams.set("utm_content", cnt.trim());
      return u.toString();
    } catch {
      return "";
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!baseUrl.trim()) {
      alert("Informe a URL de Destino.");
      return;
    }
    if (!source.trim()) {
      alert("Informe a Origem (utm_source).");
      return;
    }

    const generated = buildUrl(baseUrl, source, medium, campaign, term, content);
    if (!generated) {
      alert("URL de destino inválida.");
      return;
    }
    setFinalUrl(generated);

    setSaving(true);
    let createdShort: string | null = null;

    try {
      const itemName = name.trim() || `${source} / ${medium || "geral"} - ${campaign || "campanha"}`;
      const { data: itemData, error: itemError } = await supabase
        .from("tool_items")
        .insert({
          user_id: userId,
          type: "utm",
          name: itemName,
          payload: {
            baseUrl: baseUrl.trim(),
            source: source.trim(),
            medium: medium.trim(),
            campaign: campaign.trim(),
            term: term.trim() || undefined,
            content: content.trim() || undefined,
            finalUrl: generated,
          },
        })
        .select()
        .single();

      if (!itemError && itemData) {
        if (createShortEnabled) {
          try {
            const shortRes = await createShortLink({
              supabase,
              userId,
              longUrl: generated,
              title: itemName,
              sourceType: "utm",
              tags: ["utm", source],
              scope,
              userHandle,
              customSlug: customSlug || undefined,
              toolItemId: itemData.id,
              origin,
            });
            createdShort = shortRes.fullShortUrl;
            itemData.link_id = shortRes.id;
          } catch (shortErr: any) {
            console.error("Erro ao encurtar:", shortErr);
          }
        }
        setItems([itemData, ...items]);
      }
      setShortUrl(createdShort);
    } catch (err: any) {
      alert("Erro ao salvar histórico: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleManualShorten = async (targetUrl: string, title: string, toolItemId?: string) => {
    setShortening(true);
    try {
      const res = await createShortLink({
        supabase,
        userId,
        longUrl: targetUrl,
        title,
        sourceType: "utm",
        tags: ["utm", source || "campanha"],
        scope,
        userHandle,
        customSlug: customSlug || undefined,
        toolItemId,
        origin,
      });
      setShortUrl(res.fullShortUrl);
      if (toolItemId) {
        setItems(items.map((i) => (i.id === toolItemId ? { ...i, link_id: res.id } : i)));
      }
    } catch (err: any) {
      alert("Erro ao encurtar: " + err.message);
    } finally {
      setShortening(false);
    }
  };

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDeleteItem = async (id: string) => {
    try {
      await supabase.from("tool_items").delete().eq("id", id);
      setItems(items.filter((i) => i.id !== id));
    } catch (err: any) {
      alert("Erro ao remover: " + err.message);
    }
  };

  const handleLoadItem = (item: UtmToolItem) => {
    setBaseUrl(item.payload.baseUrl || "");
    setSource(item.payload.source || "");
    setMedium(item.payload.medium || "");
    setCampaign(item.payload.campaign || "");
    setTerm(item.payload.term || "");
    setContent(item.payload.content || "");
    setFinalUrl(item.payload.finalUrl || "");
    setShortUrl(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-zinc-200 pb-5">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 flex items-center gap-2">
          <Compass className="h-6 w-6 text-indigo-600" />
          Construtor de Parâmetros UTM para Campanhas
        </h1>
        <p className="text-xs text-zinc-500 mt-1">
          Rastreie de onde vêm suas vendas e acessos com parâmetros padrão de analytics e gere links curtos com o encurtador LinkSnap.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-12 items-start">
        {/* Formulário (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <form
            onSubmit={handleGenerate}
            className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm space-y-4"
          >
            {/* Presets Rápidos */}
            <div className="space-y-1.5 pb-2 border-b border-zinc-200">
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                Preenchimento Rápido:
              </span>
              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => applyPreset("instagram", "bio", "linkinbio")}
                  className="rounded-md border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-100"
                >
                  Instagram Bio
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset("instagram", "stories", "stories-diario")}
                  className="rounded-md border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-100"
                >
                  Instagram Stories
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset("meta", "cpc", "trafego-pago")}
                  className="rounded-md border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-100"
                >
                  Meta Ads
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset("google", "cpc", "search-ads")}
                  className="rounded-md border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-100"
                >
                  Google Ads
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset("newsletter", "email", "semanal")}
                  className="rounded-md border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-100"
                >
                  E-mail Marketing
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1">
                  URL de Destino *
                </label>
                <input
                  type="text"
                  required
                  placeholder="https://seusite.com.br/pagina-de-vendas"
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 font-mono"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1">
                    Origem da Campanha (utm_source) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: instagram, google, newsletter"
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                    className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1">
                    Mídia / Formato (utm_medium)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: bio, stories, cpc, email, banner"
                    value={medium}
                    onChange={(e) => setMedium(e.target.value)}
                    className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1">
                    Nome da Campanha (utm_campaign)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: blackfriday, lancamento-2026"
                    value={campaign}
                    onChange={(e) => setCampaign(e.target.value)}
                    className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1">
                    Termo / Palavra-chave (utm_term)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: tenis-corrida, software-link"
                    value={term}
                    onChange={(e) => setTerm(e.target.value)}
                    className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1">
                    Conteúdo / Variação do Anúncio (utm_content)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: banner-azul, video-depoimento-1"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                  />
                </div>
              </div>
            </div>

            {/* Painel do Encurtador (Ligado por padrão) */}
            <ShortLinkPanel
              shortUrl={shortUrl}
              loading={saving || shortening}
              createShortEnabled={createShortEnabled}
              onCreateShortToggle={setCreateShortEnabled}
              scope={scope}
              onScopeChange={setScope}
              customSlug={customSlug}
              onCustomSlugChange={setCustomSlug}
              userHandle={userHandle}
              onManualCreate={finalUrl ? () => handleManualShorten(finalUrl, name || `UTM: ${source}`) : undefined}
            />

            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 transition-colors flex items-center justify-center gap-2"
            >
              <Compass className="h-4 w-4" />
              {saving ? "Gerando..." : "Gerar Link Rastreado & Encurtar"}
            </button>
          </form>

          {/* Resultado Gerado */}
          {finalUrl && (
            <div className="rounded-xl border border-indigo-200 bg-indigo-50/30 p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  URL Completa com Parâmetros UTM:
                </label>
                <div className="rounded-lg border border-zinc-200 bg-white p-3 text-xs font-mono text-zinc-900 break-all select-all">
                  {finalUrl}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleCopy(finalUrl)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-zinc-800 shadow-sm"
                >
                  {copied ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                      Copiado!
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      Copiar URL Longa
                    </>
                  )}
                </button>

                <a
                  href={finalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-white border border-zinc-200 px-3.5 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 shadow-sm"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Testar Link
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Histórico (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-bold text-zinc-900 mb-3 flex items-center gap-2">
              <Clock className="h-4 w-4 text-zinc-500" />
              Links UTM Recentes ({items.length})
            </h2>

            {items.length === 0 ? (
              <div className="py-8 text-center text-xs text-zinc-400">
                Nenhum link UTM criado ainda. Monte seu primeiro rastreamento ao lado!
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="group rounded-lg border border-zinc-200 bg-zinc-50/50 p-3 hover:bg-white hover:border-zinc-300 transition-all flex items-start justify-between gap-3"
                  >
                    <div
                      className="cursor-pointer space-y-1 flex-1 min-w-0"
                      onClick={() => handleLoadItem(item)}
                    >
                      <div className="font-semibold text-xs text-zinc-900 truncate">
                        {item.name}
                      </div>
                      <div className="text-[11px] text-zinc-500 truncate">
                        {item.payload.baseUrl}
                      </div>
                      <div className="flex flex-wrap gap-1 pt-0.5">
                        <span className="rounded bg-indigo-50 px-1.5 py-0.5 text-[10px] font-medium text-indigo-700 border border-indigo-100">
                          {item.payload.source}
                        </span>
                        {item.payload.medium && (
                          <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium text-zinc-600">
                            {item.payload.medium}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        title="Copiar URL"
                        onClick={() => handleCopy(item.payload.finalUrl)}
                        className="rounded p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                      <button
                        title="Excluir"
                        onClick={() => handleDeleteItem(item.id)}
                        className="rounded p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
