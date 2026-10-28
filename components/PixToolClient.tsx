"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { generatePixPayload } from "@/utils/pix";
import { createShortLink, generateRandomCode } from "@/utils/shortlink";
import ShortLinkPanel from "./ShortLinkPanel";
import QRCode from "qrcode";
import {
  DollarSign,
  Copy,
  Check,
  Download,
  Trash2,
  Clock,
  QrCode,
  ShieldCheck,
  Info,
  ExternalLink,
} from "lucide-react";

interface PixToolItem {
  id: string;
  name: string;
  payload: {
    key: string;
    beneficiary: string;
    city: string;
    amount?: string;
    txid?: string;
    pixCode: string;
  };
  link_id?: string | null;
  public_id?: string | null;
  created_at: string;
}

export default function PixToolClient({
  initialItems,
  userId,
  userHandle,
  origin,
}: {
  initialItems: PixToolItem[];
  userId: string;
  userHandle: string;
  origin: string;
}) {
  const supabase = createClient();
  const [items, setItems] = useState<PixToolItem[]>(initialItems);

  // Form State
  const [name, setName] = useState("");
  const [keyType, setKeyType] = useState<"cpf_cnpj" | "email" | "phone" | "random">("cpf_cnpj");
  const [pixKey, setPixKey] = useState("");
  const [beneficiary, setBeneficiary] = useState("");
  const [city, setCity] = useState("BRASIL");
  const [amount, setAmount] = useState("");
  const [txid, setTxid] = useState("");

  // Encurtador (Ligado por padrão)
  const [createShortEnabled, setCreateShortEnabled] = useState(true);
  const [scope, setScope] = useState<"global" | "branded">("global");
  const [customSlug, setCustomSlug] = useState("");
  const [shortUrl, setShortUrl] = useState<string | null>(null);
  const [shortening, setShortening] = useState(false);

  // Result State
  const [pixCode, setPixCode] = useState("");
  const [publicUrl, setPublicUrl] = useState<string | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!pixKey.trim()) {
      alert("Informe a Chave Pix.");
      return;
    }
    if (!beneficiary.trim()) {
      alert("Informe o nome do titular / beneficiário.");
      return;
    }

    try {
      const payload = generatePixPayload({
        key: pixKey.trim(),
        name: beneficiary.trim(),
        city: city.trim() || "BRASIL",
        amount: amount ? amount.replace(",", ".") : undefined,
        txid: txid.trim() || "***",
      });

      setPixCode(payload);

      const qrData = await QRCode.toDataURL(payload, {
        width: 350,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
      });
      setQrCodeUrl(qrData);

      setSaving(true);
      const itemName = name.trim() || `Pix (${beneficiary.split(" ")[0]})`;
      const publicId = generateRandomCode(8);
      const generatedPublicUrl = `${origin}/p/${publicId}`;
      setPublicUrl(generatedPublicUrl);

      const { data: itemData, error: itemError } = await supabase
        .from("tool_items")
        .insert({
          user_id: userId,
          type: "pix",
          name: itemName,
          public_id: publicId,
          is_public: true,
          payload: {
            key: pixKey.trim(),
            beneficiary: beneficiary.trim(),
            city: city.trim() || "BRASIL",
            amount: amount || undefined,
            txid: txid.trim() || "***",
            pixCode: payload,
          },
        })
        .select()
        .single();

      let createdShort: string | null = null;
      if (!itemError && itemData) {
        if (createShortEnabled) {
          try {
            const shortRes = await createShortLink({
              supabase,
              userId,
              longUrl: generatedPublicUrl,
              title: itemName,
              sourceType: "pix",
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
      alert("Erro ao gerar payload Pix: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleManualShorten = async (targetPublicUrl: string, title: string, toolItemId?: string) => {
    setShortening(true);
    try {
      const res = await createShortLink({
        supabase,
        userId,
        longUrl: targetPublicUrl,
        title,
        sourceType: "pix",
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

  const handleLoadItem = async (item: PixToolItem) => {
    setPixKey(item.payload.key || "");
    setBeneficiary(item.payload.beneficiary || "");
    setCity(item.payload.city || "BRASIL");
    setAmount(item.payload.amount || "");
    setTxid(item.payload.txid || "");
    setPixCode(item.payload.pixCode || "");

    if (item.public_id) {
      setPublicUrl(`${origin}/p/${item.public_id}`);
    }

    if (item.payload.pixCode) {
      const qrData = await QRCode.toDataURL(item.payload.pixCode, {
        width: 350,
        margin: 2,
      });
      setQrCodeUrl(qrData);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-zinc-200 pb-5">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 flex items-center gap-2">
          <DollarSign className="h-6 w-6 text-emerald-600" />
          Gerador de Pix BR Code Oficial
        </h1>
        <p className="text-xs text-zinc-500 mt-1">
          Gere códigos Pix Copia e Cola, QR Codes bancários e links encurtados com página de cobrança oficial pronta para enviar por mensagem.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-12 items-start">
        {/* Formulário & Resultado (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <form
            onSubmit={handleGenerate}
            className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm space-y-4"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1">
                  Identificador Interno (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ex: Doação Site, Cobrança Produto X"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1">
                  Tipo de Chave
                </label>
                <select
                  value={keyType}
                  onChange={(e) => setKeyType(e.target.value as any)}
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                >
                  <option value="cpf_cnpj">CPF / CNPJ</option>
                  <option value="email">E-mail</option>
                  <option value="phone">Telefone (+55...)</option>
                  <option value="random">Chave Aleatória (EVP)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1">
                  Chave Pix *
                </label>
                <input
                  type="text"
                  required
                  placeholder={
                    keyType === "phone"
                      ? "+5511999998888"
                      : keyType === "email"
                      ? "financeiro@suaempresa.com"
                      : "000.000.000-00"
                  }
                  value={pixKey}
                  onChange={(e) => setPixKey(e.target.value)}
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1">
                  Nome do Titular *
                </label>
                <input
                  type="text"
                  required
                  maxLength={25}
                  placeholder="Ex: Maria Silva"
                  value={beneficiary}
                  onChange={(e) => setBeneficiary(e.target.value)}
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
                <span className="text-[10px] text-zinc-400">Até 25 caracteres</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1">
                  Cidade do Titular
                </label>
                <input
                  type="text"
                  maxLength={15}
                  placeholder="Ex: SAO PAULO"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1">
                  Valor em R$ (Opcional)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-sm text-zinc-400">R$</span>
                  <input
                    type="text"
                    placeholder="0,00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full rounded-lg border border-zinc-300 bg-white pl-10 pr-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                  />
                </div>
                <span className="text-[10px] text-zinc-400">Deixe em branco para valor livre</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1">
                  Identificador TxID (Opcional)
                </label>
                <input
                  type="text"
                  maxLength={25}
                  placeholder="Ex: PEDIDO123"
                  value={txid}
                  onChange={(e) => setTxid(e.target.value)}
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 uppercase"
                />
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
              onManualCreate={publicUrl ? () => handleManualShorten(publicUrl, name || `Pix ${beneficiary}`) : undefined}
            />

            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:ring-offset-2 transition-colors flex items-center justify-center gap-2"
            >
              <QrCode className="h-4 w-4" />
              {saving ? "Gerando..." : "Gerar QR Code, Código & Link Pix"}
            </button>
          </form>

          {/* Resultado Gerado */}
          {pixCode && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-800 text-sm font-semibold">
                  <ShieldCheck className="h-5 w-5 text-emerald-600" />
                  BR Code Válido Gerado com Sucesso
                </div>
                {publicUrl && (
                  <a
                    href={publicUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-medium text-emerald-700 hover:text-emerald-900 flex items-center gap-1"
                  >
                    Abrir Página Pública de Pagamento <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-12 items-center">
                {qrCodeUrl && (
                  <div className="sm:col-span-5 flex flex-col items-center gap-2">
                    <div className="rounded-lg border border-zinc-200 bg-white p-3 shadow-sm">
                      <img src={qrCodeUrl} alt="QR Code Pix" className="h-44 w-44 object-contain" />
                    </div>
                    <a
                      href={qrCodeUrl}
                      download={`pix-${beneficiary.replace(/\s+/g, "-").toLowerCase()}.png`}
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-700 hover:text-zinc-900 bg-white border border-zinc-200 rounded-md px-3 py-1.5 shadow-sm"
                    >
                      <Download className="h-3.5 w-3.5" />
                      Baixar Imagem QR
                    </a>
                  </div>
                )}

                <div className="sm:col-span-7 space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1">
                      Código Pix Copia e Cola:
                    </label>
                    <div className="relative">
                      <textarea
                        readOnly
                        rows={3}
                        value={pixCode}
                        className="w-full rounded-lg border border-zinc-200 bg-white p-2.5 text-xs font-mono text-zinc-800 focus:outline-none select-all"
                      />
                    </div>
                  </div>

                  <button
                    onClick={() => handleCopy(pixCode)}
                    className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-zinc-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-zinc-800 transition-colors"
                  >
                    {copied ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-400" />
                        Código Copiado!
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        Copiar Código Pix
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Histórico / Gerenciamento (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-bold text-zinc-900 mb-3 flex items-center gap-2">
              <Clock className="h-4 w-4 text-zinc-500" />
              Chaves e Cobranças Salvas ({items.length})
            </h2>

            {items.length === 0 ? (
              <div className="py-8 text-center text-xs text-zinc-400">
                Nenhuma cobrança salva ainda. Gere seu primeiro Pix ao lado!
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
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-xs text-zinc-900 truncate">
                          {item.name}
                        </span>
                        {item.payload.amount && (
                          <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800">
                            R$ {item.payload.amount}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-zinc-600 font-mono truncate">
                        {item.payload.key}
                      </div>
                      <div className="text-[10px] text-zinc-400">
                        {item.payload.beneficiary} • {item.payload.city}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        title="Copiar código Pix"
                        onClick={() => handleCopy(item.payload.pixCode)}
                        className="rounded p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                      {item.public_id && (
                        <a
                          href={`${origin}/p/${item.public_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Abrir página pública de pagamento"
                          className="rounded p-1.5 text-zinc-400 hover:text-emerald-600 hover:bg-emerald-50"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      )}
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

            <div className="mt-4 pt-3 border-t border-zinc-200 flex items-start gap-2 text-[11px] text-zinc-400">
              <Info className="h-3.5 w-3.5 text-zinc-400 shrink-0 mt-0.5" />
              <span>
                Todos os códigos gerados respeitam as normas EMVCo do Banco Central do Brasil com checagem de integridade CRC16.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
