"use client";

import React, { useState } from "react";
import { Copy, Check, QrCode, ShieldCheck, X, Loader2, AlertCircle } from "lucide-react";

interface PixModalProps {
  isOpen: boolean;
  onClose: () => void;
  pixData: {
    qrCode: string;
    qrCodeBase64: string;
    ticketUrl?: string;
  } | null;
  planName: string;
  priceFormatted: string;
  orderId?: string;
}

export function PixCheckoutModal({
  isOpen,
  onClose,
  pixData,
  planName,
  priceFormatted,
  orderId,
}: PixModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !pixData) return null;

  const handleCopy = () => {
    if (pixData.qrCode) {
      navigator.clipboard.writeText(pixData.qrCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-zinc-100 flex flex-col items-center text-center">
        {/* Botão Fechar */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-full transition"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header do Modal */}
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 mb-3">
          <QrCode className="h-6 w-6" />
        </div>

        <h3 className="text-lg font-black text-zinc-900">Pague com Pix</h3>
        <p className="text-xs text-zinc-500 mt-0.5">
          Ativação instantânea do plano <strong className="text-zinc-800">{planName}</strong>
        </p>

        <div className="my-3 px-3 py-1.5 rounded-full bg-emerald-100/60 text-emerald-800 font-black text-sm tracking-tight">
          {priceFormatted}
        </div>

        {/* QR Code Renderizado */}
        <div className="mt-2 p-3 bg-white border-2 border-zinc-200 rounded-2xl shadow-xs">
          {pixData.qrCodeBase64 ? (
            <img
              src={`data:image/png;base64,${pixData.qrCodeBase64}`}
              alt="QR Code Pix Mercado Pago"
              className="w-48 h-48 object-contain"
            />
          ) : (
            <div className="w-48 h-48 flex items-center justify-center bg-zinc-50 text-zinc-400 text-xs">
              QR Code não disponível
            </div>
          )}
        </div>

        {/* Pix Copia e Cola */}
        <div className="w-full mt-4 space-y-2">
          <label className="text-[11px] font-bold text-zinc-600 block text-left">
            Código Pix Copia e Cola:
          </label>
          <div className="relative flex items-center">
            <input
              type="text"
              readOnly
              value={pixData.qrCode || ""}
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-mono text-zinc-600 pr-24 focus:outline-hidden select-all"
            />
            <button
              onClick={handleCopy}
              className={`absolute right-1 top-1 bottom-1 px-3 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                copied
                  ? "bg-emerald-600 text-white"
                  : "bg-zinc-900 hover:bg-zinc-800 text-white shadow-xs"
              }`}
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5" />
                  Copiado!
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  Copiar
                </>
              )}
            </button>
          </div>
        </div>

        {/* Instruções de Pagamento */}
        <div className="mt-4 w-full rounded-xl bg-zinc-50 border border-zinc-100 p-3 text-left space-y-1.5">
          <div className="flex items-start gap-2 text-[11px] text-zinc-600">
            <span className="font-bold text-zinc-900 shrink-0">1.</span>
            <span>Abra o aplicativo do seu banco ou carteira digital (Nubank, Itaú, Mercado Pago, etc).</span>
          </div>
          <div className="flex items-start gap-2 text-[11px] text-zinc-600">
            <span className="font-bold text-zinc-900 shrink-0">2.</span>
            <span>Escolha a opção <strong>Pagar com Pix</strong> e aponte a câmera ou use <strong>Pix Copia e Cola</strong>.</span>
          </div>
          <div className="flex items-start gap-2 text-[11px] text-zinc-600">
            <span className="font-bold text-zinc-900 shrink-0">3.</span>
            <span>Confirme o pagamento. Seu plano é liberado automaticamente em poucos segundos!</span>
          </div>
        </div>

        {/* Footer Seguro */}
        <div className="mt-4 flex items-center gap-1.5 text-[10px] text-zinc-400">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
          <span>Processado com segurança via Mercado Pago Orders API</span>
        </div>
      </div>
    </div>
  );
}
