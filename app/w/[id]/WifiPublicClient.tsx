"use client";

import { useState } from "react";
import { Wifi, Copy, Check, Eye, EyeOff } from "lucide-react";

interface WifiPublicClientProps {
  title: string;
  ssid: string;
  encryption: string;
  password?: string;
  qrCodeUrl: string;
}

export default function WifiPublicClient({
  title,
  ssid,
  encryption,
  password,
  qrCodeUrl,
}: WifiPublicClientProps) {
  const [copied, setCopied] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleCopyPass = async () => {
    if (!password) return;
    await navigator.clipboard.writeText(password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <main className="min-h-screen w-full bg-zinc-50 flex flex-col items-center justify-center p-4 antialiased">
      <div className="w-full max-w-md bg-white rounded-2xl border border-zinc-200 shadow-sm p-6 sm:p-8 space-y-6 text-center">
        {/* Header */}
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-100 mb-2">
            <Wifi className="h-4 w-4" />
            Conexão Wi-Fi Rápida
          </div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900">
            {title || "Acesso à Rede Wi-Fi"}
          </h1>
          <p className="text-xs text-zinc-500">
            Aponte a câmera do seu celular para conectar automaticamente
          </p>
        </div>

        {/* QR Code */}
        <div className="flex flex-col items-center">
          <div className="p-3 bg-white border border-zinc-200 rounded-xl shadow-xs">
            <img
              src={qrCodeUrl}
              alt="QR Code Wi-Fi"
              className="h-56 w-56 object-contain"
            />
          </div>
        </div>

        {/* Detalhes da Rede */}
        <div className="bg-zinc-50 rounded-xl p-4 border border-zinc-200 text-left space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-500 font-medium">Nome da Rede (SSID):</span>
            <span className="font-bold text-zinc-900 font-mono text-sm">{ssid}</span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-500 font-medium">Segurança:</span>
            <span className="text-zinc-700">{encryption}</span>
          </div>

          {password ? (
            <div className="pt-2 border-t border-zinc-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-500 font-medium">Senha:</span>
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  {showPass ? (
                    <>
                      <EyeOff className="h-3.5 w-3.5" />
                      Ocultar
                    </>
                  ) : (
                    <>
                      <Eye className="h-3.5 w-3.5" />
                      Visualizar
                    </>
                  )}
                </button>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type={showPass ? "text" : "password"}
                  readOnly
                  value={password}
                  className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-mono text-zinc-800 focus:outline-none select-all"
                />
                <button
                  onClick={handleCopyPass}
                  className="rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-zinc-800 shrink-0 flex items-center gap-1"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? "Copiada" : "Copiar"}
                </button>
              </div>
            </div>
          ) : (
            <div className="text-xs text-emerald-700 font-medium pt-1">
              ✓ Rede aberta sem senha necessária
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 text-center text-xs text-zinc-400">
        Criado com <span className="font-semibold text-zinc-600">LinkSnap</span>
      </div>
    </main>
  );
}
