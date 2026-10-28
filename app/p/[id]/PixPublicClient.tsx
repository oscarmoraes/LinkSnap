"use client";

import { useState } from "react";
import { Copy, Check, ShieldCheck, DollarSign, Download } from "lucide-react";

interface PixPublicClientProps {
  title: string;
  beneficiary: string;
  city?: string;
  amount?: string;
  pixCode: string;
  qrCodeUrl: string;
}

export default function PixPublicClient({
  title,
  beneficiary,
  city,
  amount,
  pixCode,
  qrCodeUrl,
}: PixPublicClientProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(pixCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <main className="min-h-screen w-full bg-zinc-50 flex flex-col items-center justify-center p-4 antialiased">
      <div className="w-full max-w-md bg-white rounded-2xl border border-zinc-200 shadow-sm p-6 sm:p-8 space-y-6 text-center">
        {/* Header */}
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-100 mb-2">
            <ShieldCheck className="h-4 w-4" />
            Pagamento Pix Oficial
          </div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900">
            {title || "Cobrança Pix"}
          </h1>
          <p className="text-xs text-zinc-500">
            Beneficiário: <strong className="text-zinc-800">{beneficiary}</strong>
            {city && ` • ${city}`}
          </p>
        </div>

        {/* Valor */}
        {amount ? (
          <div className="bg-zinc-50 rounded-xl p-3 border border-zinc-100">
            <span className="text-xs text-zinc-400 uppercase tracking-wider block">Valor a Pagar</span>
            <span className="text-3xl font-black text-zinc-900 tracking-tight">
              R$ {amount}
            </span>
          </div>
        ) : (
          <div className="bg-zinc-50 rounded-xl p-2.5 border border-zinc-100 text-xs text-zinc-500 font-medium">
            Valor livre (informe o valor no seu app bancário)
          </div>
        )}

        {/* QR Code */}
        <div className="flex flex-col items-center">
          <div className="p-3 bg-white border border-zinc-200 rounded-xl shadow-xs">
            <img
              src={qrCodeUrl}
              alt="QR Code Pix"
              className="h-56 w-56 object-contain"
            />
          </div>
          <span className="text-[11px] text-zinc-400 mt-2">
            Aponte a câmera no app do seu banco
          </span>
        </div>

        {/* Copia e Cola */}
        <div className="space-y-2 text-left">
          <label className="block text-xs font-semibold text-zinc-700">
            Código Copia e Cola:
          </label>
          <div className="relative">
            <textarea
              readOnly
              rows={3}
              value={pixCode}
              className="w-full rounded-lg border border-zinc-200 bg-zinc-50 p-2.5 text-xs font-mono text-zinc-800 focus:outline-none select-all resize-none"
            />
          </div>

          <button
            onClick={handleCopy}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors shadow-sm"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 text-emerald-200" />
                Código Pix Copiado com Sucesso!
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                Copiar Código Pix
              </>
            )}
          </button>
        </div>

        {/* Instruções */}
        <div className="border-t border-zinc-100 pt-4 text-left space-y-1.5 text-xs text-zinc-500">
          <p className="font-semibold text-zinc-700">Como pagar?</p>
          <ol className="list-decimal list-inside space-y-0.5 text-[11px]">
            <li>Abra o aplicativo do seu banco</li>
            <li>Selecione a opção Pix</li>
            <li>Escolha Ler QR Code ou Pix Copia e Cola</li>
            <li>Confirme os dados e finalize o pagamento</li>
          </ol>
        </div>
      </div>

      <div className="mt-6 text-center text-xs text-zinc-400">
        Criado com <span className="font-semibold text-zinc-600">LinkSnap</span>
      </div>
    </main>
  );
}
