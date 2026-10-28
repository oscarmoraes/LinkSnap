"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { createShortLink } from "@/utils/shortlink";
import ShortLinkPanel from "./ShortLinkPanel";
import QRCode from "qrcode";
import {
  MessageSquare,
  Copy,
  Check,
  Download,
  Trash2,
  ExternalLink,
  Clock,
  Link2,
} from "lucide-react";

interface ToolItem {
  id: string;
  name: string;
  payload: {
    phone: string;
    message: string;
    url: string;
  };
  link_id?: string | null;
  created_at: string;
}

export default function WhatsAppToolClient({
  initialItems,
  userId,
  userHandle,
  origin,
}: {
  initialItems: ToolItem[];
  userId: string;
  userHandle: string;
  origin: string;
}) {
  const supabase = createClient();
  const [items, setItems] = useState<ToolItem[]>(initialItems);

  // Formulário
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");

  // Encurtador (ligado por padrão)
  const [createShortEnabled, setCreateShortEnabled] = useState(true);
  const [scope, setScope] = useState<"global" | "branded">("global");
  const [customSlug, setCustomSlug] = useState("");
  const [shortUrl, setShortUrl] = useState<string | null>(null);
  const [shortening, setShortening] = useState(false);

  // Resultado
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [generatedUrl, setGeneratedUrl] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = phone.replace(/\D/g, "");
    if (cleanPhone.length < 8) {
      alert("Informe um número válido com DDD.");
      return;
    }

    const textEncoded = encodeURIComponent(message.trim());
    const finalUrl = `https://wa.me/${cleanPhone}${textEncoded ? `?text=${textEncoded}` : ""}`;
    setGeneratedUrl(finalUrl);

    const qrData = await QRCode.toDataURL(finalUrl, { width: 300, margin: 2 });
    setQrCodeUrl(qrData);

    setSaving(true);
    let createdShort: string | null = null;

    try {
      const itemName = name.trim() || `WhatsApp (${cleanPhone.slice(-4)})`;
      const { data: itemData, error: itemError } = await supabase
        .from("tool_items")
        .insert({
          user_id: userId,
          type: "whatsapp",
          name: itemName,
          payload: { phone: cleanPhone, message: message.trim(), url: finalUrl },
        })
        .select()
        .single();

      if (!itemError && itemData) {
        // Encurtamento automático
        if (createShortEnabled) {
          try {
            const shortRes = await createShortLink({
              supabase,
              userId,
              longUrl: finalUrl,
              title: itemName,
              sourceType: "whatsapp",
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
    } catch {
      // Ignored
    } finally {
      setShortUrl(createdShort);
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
        sourceType: "whatsapp",
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

  const handleDeleteItem = async (id: string) => {
    try {
      await supabase.from("tool_items").delete().eq("id", id);
      setItems(items.filter((i) => i.id !== id));
    } catch (err: any) {
      alert("Erro ao remover: " + err.message);
    }
  };

  const handleCopy = async (url: string) => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-zinc-200 pb-5">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 flex items-center gap-2">
          <MessageSquare className="h-6 w-6 text-emerald-600" />
          Gerador de Link WhatsApp (wa.me)
        </h1>
        <p className="text-xs text-zinc-500 mt-1">
          Crie links diretos para conversa no WhatsApp com mensagem personalizada, link curto LinkSnap e QR Code para balcões.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-12 items-start">
        {/* Formulário & Preview (7 colunas) */}
        <div className="lg:col-span-7 space-y-6">
          <form onSubmit={handleGenerate} className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1">
                Nome de Identificação (Opcional)
              </label>
              <input
                type="text"
                placeholder="Ex: Suporte Vendas, Balcão Loja Centro"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1">
                Número do WhatsApp com DDD *
              </label>
              <input
                type="text"
                required
                placeholder="Ex: 5511999998888 ou 11999998888"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 font-mono"
              />
              <span className="text-[11px] text-zinc-400 mt-1 block">
                Digite apenas os números com DDD (se não informar 55, o Brasil será assumido).
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1">
                Mensagem Padrão Pré-preenchida (Opcional)
              </label>
              <textarea
                rows={3}
                placeholder="Ex: Olá! Vim pelo site e gostaria de saber mais sobre os planos."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 resize-none"
              />
            </div>

            {/* Painel de Opções do Link Curto */}
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
              onManualCreate={generatedUrl ? () => handleManualShorten(generatedUrl, name || "WhatsApp") : undefined}
            />

            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:ring-offset-2 transition-colors flex items-center justify-center gap-2"
            >
              <MessageSquare className="h-4 w-4" />
              {saving ? "Gerando..." : "Gerar Link WhatsApp & QR Code"}
            </button>
          </form>

          {/* Resultado Gerado */}
          {generatedUrl && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-emerald-900 uppercase tracking-wider">
                  Link Direto Criado com Sucesso:
                </span>
                <a
                  href={generatedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-medium text-emerald-700 hover:text-emerald-900 flex items-center gap-1"
                >
                  Abrir no WhatsApp <ExternalLink className="h-3 w-3" />
                </a>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={generatedUrl}
                  className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-mono text-zinc-700 focus:outline-none select-all"
                />
                <button
                  type="button"
                  onClick={() => handleCopy(generatedUrl)}
                  className="rounded-lg bg-zinc-900 px-3 py-2 text-xs font-semibold text-white hover:bg-zinc-800 transition-colors shrink-0 flex items-center gap-1.5"
                >
                  {copied ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-400" /> Copiado!
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" /> Copiar
                    </>
                  )}
                </button>
              </div>

              {qrCodeUrl && (
                <div className="pt-2 flex flex-col sm:flex-row items-center gap-4 border-t border-emerald-100">
                  <div className="bg-white p-2 rounded-lg border border-zinc-200 shadow-sm shrink-0">
                    <img src={qrCodeUrl} alt="QR Code WhatsApp" className="h-32 w-32 object-contain" />
                  </div>
                  <div className="space-y-2 text-center sm:text-left">
                    <h3 className="text-xs font-bold text-zinc-900">QR Code para Balcão ou Impressão</h3>
                    <p className="text-[11px] text-zinc-500">
                      Imprima este QR Code em adesivos ou placas para seus clientes abrirem conversa na hora.
                    </p>
                    <a
                      href={qrCodeUrl}
                      download="whatsapp-qrcode.png"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-700 bg-white border border-zinc-200 rounded-md px-3 py-1.5 hover:bg-zinc-50 shadow-sm"
                    >
                      <Download className="h-3.5 w-3.5" /> Baixar Imagem PNG
                    </a>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Histórico Recente (5 colunas) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-bold text-zinc-900 mb-3 flex items-center gap-2">
              <Clock className="h-4 w-4 text-zinc-500" />
              Links Salvos ({items.length})
            </h2>

            {items.length === 0 ? (
              <div className="py-8 text-center text-xs text-zinc-400">
                Nenhum link salvo ainda. Crie o seu primeiro ao lado!
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="group rounded-lg border border-zinc-200 bg-zinc-50/50 p-3 hover:bg-white hover:border-zinc-300 transition-all flex items-start justify-between gap-3"
                  >
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="font-semibold text-xs text-zinc-900 truncate">
                        {item.name}
                      </div>
                      <div className="text-[11px] text-zinc-500 font-mono truncate">
                        +{item.payload.phone}
                      </div>
                      {item.payload.message && (
                        <div className="text-[11px] text-zinc-400 italic truncate">
                          &ldquo;{item.payload.message}&rdquo;
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        title="Copiar link direto"
                        onClick={() => handleCopy(item.payload.url)}
                        className="rounded p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                      <a
                        href={item.payload.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Testar no WhatsApp"
                        className="rounded p-1.5 text-zinc-400 hover:text-emerald-600 hover:bg-emerald-50"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
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
