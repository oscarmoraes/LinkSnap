"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { generatePixPayload } from "@/utils/pix";
import QRCode from "qrcode";
import {
  ExternalLink,
  MessageSquare,
  ShoppingBag,
  Copy,
  Check,
  QrCode,
  Send,
  ChevronDown,
  ChevronUp,
  Share2,
  Tag,
} from "lucide-react";

export interface PublicBioBlock {
  id: string;
  type: string;
  position: number;
  data: {
    title?: string;
    subtitle?: string;
    url?: string;
    badge?: string;
    start_at?: string;
    end_at?: string;
    price?: string;
    oldPrice?: string;
    imageUrl?: string;
    coupon?: string;
    pixKey?: string;
    beneficiary?: string;
    city?: string;
    amount?: string;
    description?: string;
    phone?: string;
    message?: string;
    buttonText?: string;
    placeholderContact?: string;
  };
}

export interface PublicBioTheme {
  bg: string;
  text: string;
  cardBg: string;
  cardText: string;
  accent: string;
  verified?: boolean;
  hideBranding?: boolean;
}

function normalizeExternalUrl(rawUrl?: string): string {
  if (!rawUrl) return "#";
  const trimmed = rawUrl.trim();
  if (!trimmed || trimmed === "https://") return "#";
  if (/^(https?:\/\/|mailto:|tel:)/i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export default function PublicBioClient({
  pageId,
  userId,
  pageTitle,
  layout,
  theme,
  blocks,
}: {
  pageId: string;
  userId: string;
  pageTitle: string;
  layout: string;
  theme: PublicBioTheme;
  blocks: PublicBioBlock[];
}) {
  const supabase = createClient();

  // Estado para controle do bloco Pix expandido
  const [expandedPixId, setExpandedPixId] = useState<string | null>(null);
  const [pixQrMap, setPixQrMap] = useState<Record<string, { payload: string; dataUrl: string }>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Estado para formulários de captura de leads (por bloco)
  const [leadStates, setLeadStates] = useState<
    Record<
      string,
      {
        name: string;
        contact: string;
        message: string;
        sending: boolean;
        sent: boolean;
        error: string;
      }
    >
  >({});

  // Contabiliza clique silenciosamente via RPC
  const trackBlockClick = (blockId: string) => {
    try {
      supabase
        .rpc("increment_bio_block_click", { p_block_id: blockId })
        .then(() => {});
    } catch {
      // Fallback silencioso
    }
  };

  // Gera QR Code Pix quando um bloco Pix é aberto
  useEffect(() => {
    if (!expandedPixId) return;
    if (pixQrMap[expandedPixId]) return;

    const block = blocks.find((b) => b.id === expandedPixId);
    if (!block || !block.data.pixKey) return;

    const payload = generatePixPayload({
      key: block.data.pixKey,
      name: block.data.beneficiary || pageTitle || "RECEBEDOR",
      city: block.data.city || "BRASIL",
      amount: block.data.amount || undefined,
    });

    QRCode.toDataURL(payload, {
      width: 240,
      margin: 1,
      color: {
        dark: "#111827",
        light: "#FFFFFF",
      },
    })
      .then((dataUrl) => {
        setPixQrMap((prev) => ({
          ...prev,
          [expandedPixId]: { payload, dataUrl },
        }));
      })
      .catch(() => {
        setPixQrMap((prev) => ({
          ...prev,
          [expandedPixId]: { payload, dataUrl: "" },
        }));
      });
  }, [expandedPixId, blocks, pageTitle, pixQrMap]);

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2200);
  };

  const getLeadFormState = (blockId: string) => {
    return (
      leadStates[blockId] || {
        name: "",
        contact: "",
        message: "",
        sending: false,
        sent: false,
        error: "",
      }
    );
  };

  const updateLeadField = (
    blockId: string,
    field: "name" | "contact" | "message",
    value: string
  ) => {
    const current = getLeadFormState(blockId);
    setLeadStates({
      ...leadStates,
      [blockId]: {
        ...current,
        [field]: value,
        error: "",
      },
    });
  };

  const handleSubmitLead = async (e: React.FormEvent, blockId: string) => {
    e.preventDefault();
    const current = getLeadFormState(blockId);

    if (!current.name.trim() || !current.contact.trim()) {
      setLeadStates({
        ...leadStates,
        [blockId]: { ...current, error: "Preencha seu nome e contato." },
      });
      return;
    }

    setLeadStates({
      ...leadStates,
      [blockId]: { ...current, sending: true, error: "" },
    });

    trackBlockClick(blockId);

    const { error } = await supabase.from("bio_leads").insert({
      bio_page_id: pageId,
      user_id: userId,
      name: current.name.trim(),
      contact: current.contact.trim(),
      message: current.message.trim() || null,
    });

    if (error) {
      setLeadStates({
        ...leadStates,
        [blockId]: {
          ...current,
          sending: false,
          error: "Não foi possível enviar agora. Tente novamente.",
        },
      });
      return;
    }

    setLeadStates({
      ...leadStates,
      [blockId]: {
        name: "",
        contact: "",
        message: "",
        sending: false,
        sent: true,
        error: "",
      },
    });
  };

  if (!blocks || blocks.length === 0) {
    return (
      <div
        className="mt-8 w-full rounded-2xl border p-6 text-center text-xs opacity-60"
        style={{
          backgroundColor: theme.cardBg || "#F4F4F5",
          color: theme.cardText || "#18181B",
          borderColor: "rgba(128,128,128,0.2)",
        }}
      >
        Nenhum link ativo configurado nesta página no momento.
      </div>
    );
  }

  return (
    <div
      className={`mt-7 w-full ${
        layout === "grid" ? "grid grid-cols-1 sm:grid-cols-2 gap-3" : "space-y-3"
      }`}
    >
      {blocks.map((block) => {
        const bData = block.data || {};

        // 1. BLOCO CABEÇALHO / SEÇÃO
        if (block.type === "header") {
          return (
            <div
              key={block.id}
              className="col-span-full pt-4 pb-1 text-center text-xs font-bold uppercase tracking-wider opacity-75"
            >
              {bData.title || "Seção"}
            </div>
          );
        }

        // 2. BLOCO WHATSAPP
        if (block.type === "whatsapp") {
          let cleanPhone = (bData.phone || "").replace(/\D/g, "");
          if (cleanPhone.length > 0 && cleanPhone.length <= 11) {
            cleanPhone = `55${cleanPhone}`;
          }
          const wppUrl = cleanPhone
            ? `https://wa.me/${cleanPhone}${
                bData.message ? `?text=${encodeURIComponent(bData.message)}` : ""
              }`
            : "#";

          return (
            <a
              key={block.id}
              href={wppUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackBlockClick(block.id)}
              className={`flex w-full items-center justify-between rounded-2xl border p-4 text-sm font-semibold transition active:scale-[0.99] ${
                layout === "card"
                  ? "shadow-md"
                  : layout === "minimal"
                  ? "border-transparent"
                  : "shadow-sm"
              }`}
              style={{
                backgroundColor: theme.cardBg || "#F4F4F5",
                color: theme.cardText || "#18181B",
                borderColor: "rgba(16, 185, 129, 0.35)",
              }}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-500 text-white shrink-0 shadow-sm">
                  <MessageSquare className="h-5 w-5" />
                </span>
                <div className="min-w-0 text-left">
                  <span className="block font-bold truncate">
                    {bData.title || "Conversar no WhatsApp"}
                  </span>
                  {bData.subtitle && (
                    <span className="block text-xs font-normal opacity-75 truncate mt-0.5">
                      {bData.subtitle}
                    </span>
                  )}
                </div>
              </div>
              <ExternalLink className="h-4 w-4 shrink-0 text-emerald-500 ml-2" />
            </a>
          );
        }

        // 3. BLOCO PIX NA BIO (Com QR Code expansível + Copia e Cola)
        if (block.type === "pix") {
          const isExpanded = expandedPixId === block.id;
          const qrInfo = pixQrMap[block.id];

          return (
            <div
              key={block.id}
              className="col-span-full rounded-2xl border overflow-hidden transition shadow-sm"
              style={{
                backgroundColor: theme.cardBg || "#F4F4F5",
                color: theme.cardText || "#18181B",
                borderColor: isExpanded
                  ? theme.accent || "#2563EB"
                  : "rgba(128,128,128,0.22)",
              }}
            >
              <button
                type="button"
                onClick={() => {
                  if (!isExpanded) trackBlockClick(block.id);
                  setExpandedPixId(isExpanded ? null : block.id);
                }}
                className="flex w-full items-center justify-between p-4 text-left transition hover:opacity-95"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className="grid h-10 w-10 place-items-center rounded-xl text-white shrink-0 shadow-sm"
                    style={{ backgroundColor: theme.accent || "#2563EB" }}
                  >
                    <QrCode className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm truncate">
                        {bData.title || "Pagar via Pix"}
                      </span>
                      <span
                        className="rounded px-1.5 py-0.5 text-[10px] font-bold uppercase text-white"
                        style={{ backgroundColor: theme.accent || "#2563EB" }}
                      >
                        PIX
                      </span>
                    </div>
                    <span className="block text-xs opacity-75 truncate mt-0.5">
                      {bData.amount
                        ? `Valor: R$ ${bData.amount} • Toque para abrir QR Code`
                        : bData.description || "Toque para ver QR Code e Copia e Cola"}
                    </span>
                  </div>
                </div>
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4 shrink-0 opacity-60" />
                ) : (
                  <ChevronDown className="h-4 w-4 shrink-0 opacity-60" />
                )}
              </button>

              {isExpanded && (
                <div className="border-t border-black/10 p-4 space-y-3 text-center bg-black/5">
                  {bData.description && (
                    <p className="text-xs opacity-85">{bData.description}</p>
                  )}

                  {qrInfo?.dataUrl ? (
                    <div className="mx-auto w-fit rounded-2xl bg-white p-3 shadow-md border border-zinc-200">
                      <img
                        src={qrInfo.dataUrl}
                        alt="QR Code Pix"
                        className="h-44 w-44 mx-auto"
                      />
                    </div>
                  ) : !bData.pixKey ? (
                    <div className="py-4 text-xs opacity-70">
                      Chave Pix não configurada pelo criador.
                    </div>
                  ) : (
                    <div className="py-6 text-xs opacity-70">Gerando QR Code Pix...</div>
                  )}

                  <div className="space-y-1 text-xs">
                    {bData.beneficiary && (
                      <p className="font-semibold">
                        Recebedor: <span className="opacity-80">{bData.beneficiary}</span>
                      </p>
                    )}
                    {bData.amount && (
                      <p className="font-bold text-emerald-500 text-sm">
                        Valor: R$ {bData.amount}
                      </p>
                    )}
                    <p className="font-mono text-[11px] opacity-70 truncate px-2">
                      Chave: {bData.pixKey}
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 pt-1">
                    {qrInfo?.payload && (
                      <button
                        type="button"
                        onClick={() =>
                          handleCopyText(`pix-payload-${block.id}`, qrInfo.payload)
                        }
                        className="flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 px-4 text-xs font-bold text-white shadow-sm transition active:scale-[0.99]"
                        style={{ backgroundColor: theme.accent || "#2563EB" }}
                      >
                        {copiedId === `pix-payload-${block.id}` ? (
                          <>
                            <Check className="h-4 w-4" /> Código Pix Copiado!
                          </>
                        ) : (
                          <>
                            <Copy className="h-4 w-4" /> Copiar Código Pix Copia e Cola
                          </>
                        )}
                      </button>
                    )}

                    {bData.pixKey && (
                      <button
                        type="button"
                        onClick={() =>
                          handleCopyText(`pix-key-${block.id}`, bData.pixKey || "")
                        }
                        className="rounded-xl border border-current/20 py-2.5 px-3 text-xs font-semibold transition hover:bg-black/5"
                      >
                        {copiedId === `pix-key-${block.id}`
                          ? "Chave Copiada!"
                          : "Copiar Chave"}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        }

        // 4. BLOCO PRODUTO / VITRINE
        if (block.type === "product") {
          return (
            <div
              key={block.id}
              className="col-span-full rounded-2xl border p-4 shadow-sm transition"
              style={{
                backgroundColor: theme.cardBg || "#F4F4F5",
                color: theme.cardText || "#18181B",
                borderColor: "rgba(128,128,128,0.22)",
              }}
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3.5">
                {bData.imageUrl ? (
                  <img
                    src={bData.imageUrl}
                    alt={bData.title || "Produto"}
                    className="h-20 w-20 rounded-xl object-cover shrink-0 border border-black/10"
                  />
                ) : (
                  <div
                    className="h-20 w-20 rounded-xl flex items-center justify-center shrink-0 text-white shadow-sm"
                    style={{ backgroundColor: theme.accent || "#2563EB" }}
                  >
                    <ShoppingBag className="h-8 w-8" />
                  </div>
                )}

                <div className="flex-1 min-w-0 text-left space-y-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {bData.badge && (
                      <span
                        className="rounded-md px-2 py-0.5 text-[10px] font-bold uppercase text-white"
                        style={{ backgroundColor: theme.accent || "#2563EB" }}
                      >
                        {bData.badge}
                      </span>
                    )}
                    <h3 className="text-sm font-bold leading-snug">
                      {bData.title || "Produto em Destaque"}
                    </h3>
                  </div>

                  <div className="flex items-baseline gap-2">
                    {bData.oldPrice && (
                      <span className="text-xs line-through opacity-60">
                        {bData.oldPrice}
                      </span>
                    )}
                    {bData.price && (
                      <span className="text-base font-extrabold text-emerald-500">
                        {bData.price}
                      </span>
                    )}
                  </div>

                  {bData.coupon && (
                    <div className="pt-0.5">
                      <button
                        type="button"
                        onClick={() =>
                          handleCopyText(`coupon-${block.id}`, bData.coupon || "")
                        }
                        className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-current/35 px-3 py-1.5 font-mono text-xs font-semibold transition hover:bg-black/5 active:scale-[0.98]"
                      >
                        <Tag className="h-3.5 w-3.5" />
                        {copiedId === `coupon-${block.id}` ? (
                          <span>Cupom {bData.coupon} Copiado!</span>
                        ) : (
                          <span>Cupom: {bData.coupon} (Copiar)</span>
                        )}
                      </button>
                    </div>
                  )}
                </div>

                <a
                  href={normalizeExternalUrl(bData.url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackBlockClick(block.id)}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:opacity-95 active:scale-[0.99] shrink-0"
                  style={{ backgroundColor: theme.accent || "#2563EB" }}
                >
                  Comprar Agora
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          );
        }

        // 5. BLOCO FORMULÁRIO DE CAPTURA DE LEADS
        if (block.type === "lead_form") {
          const formState = getLeadFormState(block.id);

          return (
            <div
              key={block.id}
              className="col-span-full rounded-2xl border p-4 sm:p-5 shadow-sm text-left space-y-3"
              style={{
                backgroundColor: theme.cardBg || "#F4F4F5",
                color: theme.cardText || "#18181B",
                borderColor: "rgba(128,128,128,0.22)",
              }}
            >
              <div>
                <h3 className="text-sm font-bold">
                  {bData.title || "Receba Novidades e Ofertas"}
                </h3>
                {bData.subtitle && (
                  <p className="text-xs opacity-75 mt-0.5">{bData.subtitle}</p>
                )}
              </div>

              {formState.sent ? (
                <div className="rounded-xl bg-emerald-500/15 border border-emerald-500/30 p-3.5 text-center space-y-1">
                  <Check className="h-5 w-5 text-emerald-500 mx-auto" />
                  <p className="text-xs font-bold">Contato enviado com sucesso!</p>
                  <p className="text-[11px] opacity-80">
                    Obrigado! Entraremos em contato em breve.
                  </p>
                </div>
              ) : (
                <form
                  onSubmit={(e) => handleSubmitLead(e, block.id)}
                  className="space-y-2.5"
                >
                  <input
                    type="text"
                    required
                    value={formState.name}
                    onChange={(e) => updateLeadField(block.id, "name", e.target.value)}
                    placeholder="Seu nome *"
                    className="w-full rounded-xl border border-black/15 bg-white px-3.5 py-2.5 text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none"
                  />
                  <input
                    type="text"
                    required
                    value={formState.contact}
                    onChange={(e) =>
                      updateLeadField(block.id, "contact", e.target.value)
                    }
                    placeholder={
                      bData.placeholderContact || "Seu WhatsApp ou E-mail *"
                    }
                    className="w-full rounded-xl border border-black/15 bg-white px-3.5 py-2.5 text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none"
                  />
                  <input
                    type="text"
                    value={formState.message}
                    onChange={(e) =>
                      updateLeadField(block.id, "message", e.target.value)
                    }
                    placeholder="Mensagem opcional"
                    className="w-full rounded-xl border border-black/15 bg-white px-3.5 py-2 text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none"
                  />

                  {formState.error && (
                    <p className="text-[11px] font-semibold text-red-500">
                      {formState.error}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={formState.sending}
                    className="w-full flex items-center justify-center gap-2 rounded-xl py-2.5 px-4 text-xs font-bold text-white shadow-sm transition hover:opacity-95 disabled:opacity-50"
                    style={{ backgroundColor: theme.accent || "#2563EB" }}
                  >
                    <Send className="h-3.5 w-3.5" />
                    {formState.sending
                      ? "Enviando..."
                      : bData.buttonText || "Quero Receber"}
                  </button>
                </form>
              )}
            </div>
          );
        }

        // 6. BLOCO LINK PADRÃO
        const safeHref = normalizeExternalUrl(bData.url);
        return (
          <a
            key={block.id}
            href={safeHref}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackBlockClick(block.id)}
            className={`flex w-full items-center justify-between rounded-2xl border p-4 text-sm font-semibold transition active:scale-[0.99] ${
              layout === "card"
                ? "shadow-md"
                : layout === "minimal"
                ? "border-transparent"
                : "shadow-sm"
            }`}
            style={{
              backgroundColor: theme.cardBg || "#F4F4F5",
              color: theme.cardText || "#18181B",
              borderColor:
                layout === "minimal" ? "transparent" : "rgba(128,128,128,0.28)",
            }}
          >
            <div className="min-w-0 flex-1 pr-3 text-left">
              <div className="flex items-center gap-2">
                <span className="truncate font-bold">{bData.title || "Link"}</span>
                {bData.badge && (
                  <span
                    className="rounded-md px-2 py-0.5 text-[10px] font-bold uppercase text-white shrink-0"
                    style={{ backgroundColor: theme.accent || "#2563EB" }}
                  >
                    {bData.badge}
                  </span>
                )}
              </div>
              {bData.subtitle && (
                <span className="block text-xs font-normal opacity-75 truncate mt-0.5">
                  {bData.subtitle}
                </span>
              )}
              {bData.url && bData.url !== "https://" && (
                <span className="block font-mono text-[10px] font-normal opacity-55 truncate mt-0.5">
                  {bData.url.replace(/^https?:\/\//, "")}
                </span>
              )}
            </div>
            <ExternalLink className="h-4 w-4 shrink-0 opacity-60" />
          </a>
        );
      })}
    </div>
  );
}
