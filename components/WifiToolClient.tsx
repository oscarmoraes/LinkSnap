"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { createShortLink, generateRandomCode } from "@/utils/shortlink";
import ShortLinkPanel from "./ShortLinkPanel";
import QRCode from "qrcode";
import {
  Wifi,
  Download,
  Trash2,
  Clock,
  Eye,
  EyeOff,
  ShieldCheck,
  Printer,
  ExternalLink,
} from "lucide-react";

interface WifiToolItem {
  id: string;
  name: string;
  payload: {
    ssid: string;
    encryption: "WPA" | "WEP" | "nopass";
    password?: string;
    hidden?: boolean;
    wifiString: string;
  };
  link_id?: string | null;
  public_id?: string | null;
  created_at: string;
}

export default function WifiToolClient({
  initialItems,
  userId,
  userHandle,
  origin,
}: {
  initialItems: WifiToolItem[];
  userId: string;
  userHandle: string;
  origin: string;
}) {
  const supabase = createClient();
  const [items, setItems] = useState<WifiToolItem[]>(initialItems);

  // Form
  const [name, setName] = useState("");
  const [ssid, setSsid] = useState("");
  const [encryption, setEncryption] = useState<"WPA" | "WEP" | "nopass">("WPA");
  const [password, setPassword] = useState("");
  const [hidden, setHidden] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Encurtador (Ligado por padrão)
  const [createShortEnabled, setCreateShortEnabled] = useState(true);
  const [scope, setScope] = useState<"global" | "branded">("global");
  const [customSlug, setCustomSlug] = useState("");
  const [shortUrl, setShortUrl] = useState<string | null>(null);
  const [shortening, setShortening] = useState(false);

  // Result
  const [wifiString, setWifiString] = useState("");
  const [publicUrl, setPublicUrl] = useState<string | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [saving, setSaving] = useState(false);

  const escapeWifi = (str: string) => {
    return str.replace(/([\\;,":])/g, "\\$1");
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!ssid.trim()) {
      alert("Informe o nome da rede (SSID).");
      return;
    }

    if (encryption !== "nopass" && !password.trim()) {
      alert("Informe a senha da rede ou selecione 'Rede Aberta'.");
      return;
    }

    const escapedSsid = escapeWifi(ssid.trim());
    const escapedPass = encryption !== "nopass" ? escapeWifi(password.trim()) : "";
    const hiddenStr = hidden ? "true" : "false";

    let payload = `WIFI:T:${encryption};S:${escapedSsid};`;
    if (encryption !== "nopass") {
      payload += `P:${escapedPass};`;
    }
    payload += `H:${hiddenStr};;`;

    setWifiString(payload);

    try {
      const qrData = await QRCode.toDataURL(payload, {
        width: 350,
        margin: 2,
        color: {
          dark: "#09090b",
          light: "#FFFFFF",
        },
      });
      setQrCodeUrl(qrData);

      setSaving(true);
      const itemName = name.trim() || `Wi-Fi: ${ssid.trim()}`;
      const publicId = generateRandomCode(8);
      const generatedPublicUrl = `${origin}/w/${publicId}`;
      setPublicUrl(generatedPublicUrl);

      const { data: itemData, error: itemError } = await supabase
        .from("tool_items")
        .insert({
          user_id: userId,
          type: "wifi",
          name: itemName,
          public_id: publicId,
          is_public: true,
          payload: {
            ssid: ssid.trim(),
            encryption,
            password: encryption !== "nopass" ? password.trim() : undefined,
            hidden,
            wifiString: payload,
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
              sourceType: "wifi",
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
      alert("Erro ao gerar QR Code Wi-Fi: " + err.message);
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
        sourceType: "wifi",
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

  const handleLoadItem = async (item: WifiToolItem) => {
    setName(item.name || "");
    setSsid(item.payload.ssid || "");
    setEncryption(item.payload.encryption || "WPA");
    setPassword(item.payload.password || "");
    setHidden(item.payload.hidden || false);
    setWifiString(item.payload.wifiString || "");

    if (item.public_id) {
      setPublicUrl(`${origin}/w/${item.public_id}`);
    }

    if (item.payload.wifiString) {
      const qrData = await QRCode.toDataURL(item.payload.wifiString, {
        width: 350,
        margin: 2,
      });
      setQrCodeUrl(qrData);
    }
  };

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Acesso Wi-Fi - ${ssid}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #fff; }
            .card { border: 2px dashed #09090b; padding: 40px; text-align: center; border-radius: 20px; max-width: 360px; }
            h1 { font-size: 24px; margin: 0 0 8px; color: #09090b; }
            p { font-size: 14px; color: #71717a; margin: 0 0 20px; }
            img { width: 220px; height: 220px; }
            .details { margin-top: 20px; font-size: 13px; color: #27272a; border-top: 1px solid #e4e4e7; padding-top: 15px; }
            .details strong { color: #09090b; }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>Conecte-se ao Wi-Fi</h1>
            <p>Aponte a câmera do seu celular para conectar automaticamente</p>
            <img src="${qrCodeUrl}" />
            <div class="details">
              <div>Rede: <strong>${ssid}</strong></div>
              ${password ? `<div>Senha: <strong>${password}</strong></div>` : ""}
            </div>
          </div>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-zinc-200 pb-5">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 flex items-center gap-2">
          <Wifi className="h-6 w-6 text-blue-600" />
          Gerador de QR Code Wi-Fi & Página de Conexão
        </h1>
        <p className="text-xs text-zinc-500 mt-1">
          Crie placas e QR Codes para seus clientes ou equipe conectarem ao Wi-Fi instantaneamente, além de links curtos LinkSnap com página de acesso.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-12 items-start">
        {/* Formulário & Preview (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <form
            onSubmit={handleGenerate}
            className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm space-y-4"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1">
                  Nome do Local / Identificador
                </label>
                <input
                  type="text"
                  placeholder="Ex: Recepção, Sala de Reunião, Cafeteria"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1">
                  Nome da Rede (SSID) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: MinhaEmpresa_5G"
                  value={ssid}
                  onChange={(e) => setSsid(e.target.value)}
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1">
                  Tipo de Segurança
                </label>
                <select
                  value={encryption}
                  onChange={(e) => setEncryption(e.target.value as any)}
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                >
                  <option value="WPA">WPA / WPA2 / WPA3 (Padrão)</option>
                  <option value="WEP">WEP (Antigo)</option>
                  <option value="nopass">Rede Aberta (Sem senha)</option>
                </select>
              </div>

              {encryption !== "nopass" && (
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1">
                    Senha da Rede *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      placeholder="Senha da rede Wi-Fi"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 pr-10 text-sm text-zinc-900 placeholder-zinc-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-zinc-400 hover:text-zinc-600"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              )}

              <div className="sm:col-span-2 flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="hiddenNetwork"
                  checked={hidden}
                  onChange={(e) => setHidden(e.target.checked)}
                  className="h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-600"
                />
                <label htmlFor="hiddenNetwork" className="text-xs text-zinc-600 cursor-pointer">
                  Esta rede é oculta (não transmite o SSID publicamente)
                </label>
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
              onManualCreate={publicUrl ? () => handleManualShorten(publicUrl, name || `Wi-Fi ${ssid}`) : undefined}
            />

            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 transition-colors flex items-center justify-center gap-2"
            >
              <Wifi className="h-4 w-4" />
              {saving ? "Gerando..." : "Gerar QR Code de Conexão Wi-Fi"}
            </button>
          </form>

          {/* Resultado Gerado */}
          {qrCodeUrl && (
            <div className="rounded-xl border border-blue-200 bg-blue-50/30 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-blue-900 text-sm font-semibold">
                  <ShieldCheck className="h-5 w-5 text-blue-600" />
                  QR Code Wi-Fi Pronto para Conexão
                </div>
                {publicUrl && (
                  <a
                    href={publicUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-medium text-blue-700 hover:text-blue-900 flex items-center gap-1"
                  >
                    Abrir Página Pública de Conexão <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-12 items-center">
                <div className="sm:col-span-5 flex flex-col items-center gap-2">
                  <div className="rounded-lg border border-zinc-200 bg-white p-3 shadow-sm">
                    <img src={qrCodeUrl} alt="QR Code Wi-Fi" className="h-44 w-44 object-contain" />
                  </div>
                </div>

                <div className="sm:col-span-7 space-y-3">
                  <div className="rounded-lg bg-white border border-zinc-200 p-3 space-y-1.5 text-xs">
                    <div>
                      <span className="text-zinc-500">SSID:</span>{" "}
                      <span className="font-semibold text-zinc-900 font-mono">{ssid}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500">Segurança:</span>{" "}
                      <span className="font-medium text-zinc-800">{encryption}</span>
                    </div>
                    {password && (
                      <div>
                        <span className="text-zinc-500">Senha:</span>{" "}
                        <span className="font-mono text-zinc-800">{password}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <a
                      href={qrCodeUrl}
                      download={`wifi-${ssid.replace(/\s+/g, "-").toLowerCase()}.png`}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-white border border-zinc-200 px-3 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 shadow-sm"
                    >
                      <Download className="h-3.5 w-3.5" />
                      Baixar Imagem PNG
                    </a>

                    <button
                      onClick={handlePrint}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 px-3 py-2 text-xs font-semibold text-white hover:bg-zinc-800 shadow-sm"
                    >
                      <Printer className="h-3.5 w-3.5" />
                      Imprimir Placa Display
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Histórico (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-bold text-zinc-900 mb-3 flex items-center gap-2">
              <Clock className="h-4 w-4 text-zinc-500" />
              Redes Wi-Fi Salvas ({items.length})
            </h2>

            {items.length === 0 ? (
              <div className="py-8 text-center text-xs text-zinc-400">
                Nenhuma rede salva ainda. Crie o seu primeiro QR Wi-Fi ao lado!
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
                      <div className="text-[11px] text-zinc-600 font-mono truncate">
                        SSID: {item.payload.ssid}
                      </div>
                      <div className="text-[10px] text-zinc-400">
                        {item.payload.encryption} • {item.payload.password ? "Com senha" : "Aberta"}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {item.public_id && (
                        <a
                          href={`${origin}/w/${item.public_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Abrir página pública de Wi-Fi"
                          className="rounded p-1.5 text-zinc-400 hover:text-blue-600 hover:bg-blue-50"
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
          </div>
        </div>
      </div>
    </div>
  );
}
