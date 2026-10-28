"use client";

import { useState } from "react";
import { Link2, Copy, Check, ExternalLink, QrCode, Sparkles } from "lucide-react";
import QRCode from "qrcode";

interface ShortLinkPanelProps {
  shortUrl: string | null;
  loading?: boolean;
  createShortEnabled: boolean;
  onCreateShortToggle: (enabled: boolean) => void;
  scope: "global" | "branded";
  onScopeChange: (scope: "global" | "branded") => void;
  customSlug: string;
  onCustomSlugChange: (slug: string) => void;
  userHandle?: string;
  isPro?: boolean;
  onManualCreate?: () => void;
}

export default function ShortLinkPanel({
  shortUrl,
  loading = false,
  createShortEnabled,
  onCreateShortToggle,
  scope,
  onScopeChange,
  customSlug,
  onCustomSlugChange,
  userHandle,
  isPro = false,
  onManualCreate,
}: ShortLinkPanelProps) {
  const [copied, setCopied] = useState(false);
  const [qrModalUrl, setQrModalUrl] = useState<string | null>(null);

  const handleCopy = async () => {
    if (!shortUrl) return;
    await navigator.clipboard.writeText(shortUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShowQr = async () => {
    if (!shortUrl) return;
    const dataUrl = await QRCode.toDataURL(shortUrl, { width: 320, margin: 2 });
    setQrModalUrl(dataUrl);
  };

  return (
    <div className="rounded-xl border border-blue-300 bg-blue-50/70 p-4 space-y-3.5">
      {/* Opções de Criação */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-blue-200 pb-3">
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={createShortEnabled}
            onChange={(e) => onCreateShortToggle(e.target.checked)}
            className="h-4 w-4 rounded border-blue-300 text-blue-600 focus:ring-blue-600"
          />
          <span className="text-xs font-semibold text-blue-900 flex items-center gap-1.5">
            <Link2 className="h-3.5 w-3.5 text-blue-600" />
            Criar Link Encurtador LinkSnap
          </span>
        </label>

        {createShortEnabled && (
          <div className="flex items-center gap-1 bg-white border border-blue-200 rounded-lg p-0.5 text-[11px]">
            <button
              type="button"
              onClick={() => onScopeChange("global")}
              className={`px-2 py-0.5 rounded-md font-medium transition-colors ${
                scope === "global"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-zinc-600 hover:text-zinc-900"
              }`}
            >
              Global (/r/...)
            </button>
            <button
              type="button"
              onClick={() => {
                if (!isPro) {
                  alert("Links com marca própria (/r/@handle/...) são exclusivos do plano PRO.");
                  return;
                }
                onScopeChange("branded");
              }}
              className={`px-2 py-0.5 rounded-md font-medium transition-colors flex items-center gap-1 ${
                scope === "branded"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-zinc-600 hover:text-zinc-900"
              }`}
            >
              <span>Com sua marca (/r/@{userHandle || "você"}/...)</span>
              {!isPro && (
                <span className="rounded bg-amber-200 px-1 py-0.2 text-[9px] font-bold text-amber-900">
                  PRO
                </span>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Campo de Slug Customizado quando ativo */}
      {createShortEnabled && (
        <div className="flex items-center gap-2 text-xs">
          <span className="text-zinc-500 shrink-0">Slug opcional:</span>
          <div className="relative flex-1">
            <input
              type="text"
              placeholder={scope === "branded" ? "ex: pix-loja, wifi-sala" : "ex: meu-atalho"}
              value={customSlug}
              onChange={(e) => onCustomSlugChange(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ""))}
              className="w-full rounded-md border border-blue-300 bg-white px-2.5 py-1 text-xs text-zinc-800 placeholder-zinc-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 font-mono"
            />
          </div>
        </div>
      )}

      {/* Link Curto Gerado */}
      {shortUrl && (
        <div className="rounded-lg bg-white border border-blue-200 p-3 space-y-2.5 shadow-xs">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-blue-900 flex items-center gap-1">
              <Sparkles className="h-3.5 w-3.5 text-blue-600" />
              Link Curto Criado:
            </span>
            <span className="text-[10px] font-mono text-zinc-400 uppercase">
              {scope === "branded" ? "Personalizado" : "Global"}
            </span>
          </div>

          <div className="flex items-center justify-between gap-2 bg-zinc-50 rounded-lg p-2 border border-zinc-200">
            <a
              href={shortUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-mono font-bold text-blue-700 hover:underline truncate"
            >
              {shortUrl}
            </a>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={handleCopy}
                className="rounded-md bg-zinc-900 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-zinc-800 transition-colors flex items-center gap-1"
              >
                {copied ? (
                  <>
                    <Check className="h-3 w-3 text-emerald-400" />
                    Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" />
                    Copiar
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleShowQr}
                title="Ver QR Code do link curto"
                className="rounded-md border border-zinc-200 bg-white p-1 text-zinc-600 hover:bg-zinc-100"
              >
                <QrCode className="h-3.5 w-3.5" />
              </button>

              <a
                href={shortUrl}
                target="_blank"
                rel="noopener noreferrer"
                title="Abrir link"
                className="rounded-md border border-zinc-200 bg-white p-1 text-zinc-600 hover:bg-zinc-100"
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Botão manual caso não tenha sido gerado */}
      {!shortUrl && onManualCreate && (
        <button
          type="button"
          disabled={loading}
          onClick={onManualCreate}
          className="w-full rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 transition-colors flex items-center justify-center gap-1.5"
        >
          <Link2 className="h-3.5 w-3.5" />
          {loading ? "Criando link curto..." : "Gerar Link Curto LinkSnap"}
        </button>
      )}

      {/* Mini Modal de QR Code */}
      {qrModalUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-xs bg-white rounded-xl p-5 shadow-lg space-y-3 text-center border border-zinc-200">
            <h3 className="text-xs font-bold text-zinc-900">QR Code do Link Curto</h3>
            <div className="p-2 border border-zinc-200 rounded-lg inline-block">
              <img src={qrModalUrl} alt="QR Code" className="h-44 w-44 object-contain" />
            </div>
            <p className="text-[11px] font-mono text-zinc-500 truncate">{shortUrl}</p>
            <button
              onClick={() => setQrModalUrl(null)}
              className="w-full rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-zinc-800"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
