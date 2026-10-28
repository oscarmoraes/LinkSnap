"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Globe,
  Plus,
  Check,
  Copy,
  ExternalLink,
  Trash2,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Sparkles,
  Zap,
  ArrowRight,
  Server,
  HelpCircle,
  Layers,
  ChevronRight,
} from "lucide-react";

export interface CustomDomainItem {
  id: string;
  domain: string;
  target_type: string;
  target_id: string | null;
  status: "pending" | "active" | "failed" | "revoked";
  verification_token: string | null;
  ssl_status: string;
  created_at: string;
  bio_pages?:
    | {
        id: string;
        title: string;
        slug: string;
      }
    | {
        id: string;
        title: string;
        slug: string;
      }[]
    | null;
}

export interface BioOption {
  id: string;
  title: string;
  slug: string;
  is_primary: boolean;
}

interface CustomDomainsClientProps {
  initialDomains: CustomDomainItem[];
  bios: BioOption[];
  planTier: string;
  handle: string;
}

export default function CustomDomainsClient({
  initialDomains,
  bios,
  planTier,
  handle,
}: CustomDomainsClientProps) {
  const router = useRouter();
  const [domains, setDomains] = useState<CustomDomainItem[]>(initialDomains);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newDomain, setNewDomain] = useState("");
  const [selectedBioId, setSelectedBioId] = useState<string>(
    bios.find((b) => b.is_primary)?.id || bios[0]?.id || ""
  );
  const [submitting, setSubmitting] = useState(false);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{
    id?: string;
    type: "success" | "error" | "warning";
    message: string;
  } | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const isPro = planTier === "pro" || planTier === "enterprise";
  const maxDomains = planTier === "enterprise" ? 5 : 1;
  const currentCount = domains.length;
  const canAddMore = isPro && currentCount < maxDomains;

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleAddDomain = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDomain.trim()) return;

    setSubmitting(true);
    setFeedback(null);

    try {
      const res = await fetch("/api/domains", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          domain: newDomain.trim(),
          targetId: selectedBioId || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Falha ao adicionar domínio.");
      }

      setDomains([data.domain, ...domains]);
      setNewDomain("");
      setIsAddModalOpen(false);
      setFeedback({
        type: "success",
        message:
          "Domínio cadastrado com sucesso! Configure agora os registros CNAME no seu provedor de DNS.",
      });
      router.refresh();
    } catch (err: any) {
      setFeedback({
        type: "error",
        message: err.message || "Erro ao conectar domínio.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyDns = async (domainId: string) => {
    setVerifyingId(domainId);
    setFeedback(null);

    try {
      const res = await fetch("/api/domains/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domainId }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Falha ao consultar DNS.");
      }

      if (data.verified) {
        setDomains(
          domains.map((d) =>
            d.id === domainId ? { ...d, status: "active", ssl_status: "active" } : d
          )
        );
        setFeedback({
          id: domainId,
          type: "success",
          message: data.message || "Domínio verificado e ativo com sucesso!",
        });
      } else {
        setFeedback({
          id: domainId,
          type: "warning",
          message:
            data.message ||
            "Apontamento CNAME ainda não detectado. Aguarde a propagação e tente novamente.",
        });
      }
    } catch (err: any) {
      setFeedback({
        id: domainId,
        type: "error",
        message: err.message || "Erro ao verificar DNS.",
      });
    } finally {
      setVerifyingId(null);
    }
  };

  const handleDeleteDomain = async (domainId: string, domainName: string) => {
    if (
      !confirm(
        `Tem certeza que deseja remover o domínio ${domainName}? Os visitantes que acessarem por ele deixarão de visualizar sua bio.`
      )
    ) {
      return;
    }

    try {
      const res = await fetch(`/api/domains?domainId=${domainId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Falha ao remover domínio.");
      }

      setDomains(domains.filter((d) => d.id !== domainId));
      setFeedback({
        type: "success",
        message: `Domínio ${domainName} removido com sucesso.`,
      });
      router.refresh();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleUpdateTarget = async (domainId: string, targetId: string) => {
    try {
      const res = await fetch("/api/domains", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domainId, targetId }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Falha ao atualizar destino.");
      }

      setDomains(
        domains.map((d) =>
          d.id === domainId ? { ...d, target_id: targetId } : d
        )
      );
      setFeedback({
        type: "success",
        message: "Página de Bio vinculada ao domínio atualizada com sucesso!",
      });
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* 1. Header com Navegação */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-200 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs text-zinc-500 mb-1">
            <Link href="/dashboard/settings" className="hover:text-zinc-900 transition">
              Configurações
            </Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-zinc-800 font-semibold">Domínios Próprios</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 flex items-center gap-2">
            <Globe className="h-6 w-6 text-blue-600" />
            Domínios Próprios Personalizados
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            Conecte seu próprio domínio (ex: <span className="font-mono text-zinc-700">links.suaempresa.com.br</span>) para fortalecer sua marca e elevar a conversão.
          </p>
        </div>

        {/* Botão de Adicionar Domínio (se PRO) */}
        {isPro && (
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            disabled={!canAddMore}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 px-4 py-2.5 text-xs font-semibold text-white shadow-xs transition disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
          >
            <Plus className="h-4 w-4" />
            Conectar Domínio
          </button>
        )}
      </div>

      {/* 2. Feedback Global */}
      {feedback && (
        <div
          className={`rounded-2xl p-4 text-xs font-medium flex items-start gap-3 border ${
            feedback.type === "success"
              ? "bg-emerald-50 border-emerald-300 text-emerald-900"
              : feedback.type === "warning"
              ? "bg-amber-50 border-amber-300 text-amber-900"
              : "bg-rose-50 border-rose-300 text-rose-900"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
          ) : feedback.type === "warning" ? (
            <Clock className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
          )}
          <div className="flex-1">
            <span>{feedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-zinc-400 hover:text-zinc-700 ml-2"
          >
            ×
          </button>
        </div>
      )}

      {/* 3. Caso 1: Usuário no Plano FREE -> Vitrine de Upgrade PRO */}
      {!isPro ? (
        <div className="rounded-3xl border-2 border-dashed border-blue-200 bg-gradient-to-b from-blue-50/60 to-white p-8 sm:p-12 text-center space-y-6 shadow-sm">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-500/20">
            <Globe className="h-8 w-8" />
          </div>

          <div className="max-w-xl mx-auto space-y-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-blue-800">
              <Sparkles className="h-3.5 w-3.5 text-blue-700" />
              Recurso Exclusivo do Plano PRO
            </span>
            <h2 className="text-2xl font-black tracking-tight text-zinc-900 sm:text-3xl">
              Tenha autoridade total com seu próprio domínio
            </h2>
            <p className="text-sm text-zinc-600 leading-relaxed">
              Troque o endereço padrão pelo nome oficial do seu negócio ou projeto. Seus clientes acessarão diretamente pela sua marca.
            </p>
          </div>

          {/* Comparativo Visual Antes e Depois */}
          <div className="max-w-lg mx-auto grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
            <div className="rounded-2xl border border-zinc-200 bg-white p-4 space-y-1 opacity-70">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                Plano Gratuito
              </span>
              <p className="font-mono text-xs text-zinc-700 truncate">
                linksnap.com.br/b/@{handle}
              </p>
              <span className="text-[10px] text-zinc-400">Endereço compartilhado</span>
            </div>

            <div className="rounded-2xl border-2 border-blue-600 bg-blue-50/40 p-4 space-y-1 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 flex items-center gap-1">
                <Check className="h-3 w-3 text-blue-600" />
                No Plano PRO
              </span>
              <p className="font-mono text-xs font-bold text-blue-900 truncate">
                links.suaempresa.com.br
              </p>
              <span className="text-[10px] text-blue-700 font-semibold">100% White-Label & SSL Grátis</span>
            </div>
          </div>

          {/* CTA para Upgrade Mercado Pago */}
          <div className="pt-2">
            <Link
              href="/dashboard/settings#plan"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 px-6 py-3.5 text-sm font-bold text-white shadow-md shadow-blue-500/25 transition"
            >
              <Zap className="h-4 w-4" />
              Fazer Upgrade para o Plano PRO
              <ArrowRight className="h-4 w-4" />
            </Link>
            <p className="text-xs text-zinc-400 mt-2">
              A partir de R$ 19,90/mês com ativação imediata via Pix ou Cartão.
            </p>
          </div>
        </div>
      ) : (
        /* Caso 2: Usuário PRO -> Painel de Gestão de Domínios */
        <div className="space-y-6">
          {/* Card de Cota de Domínios */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-600 shrink-0">
                <Server className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider">
                  Cota de Domínios no Plano {planTier.toUpperCase()}
                </h3>
                <p className="text-sm font-semibold text-zinc-700">
                  {currentCount} de {maxDomains} domínio(s) configurado(s)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <span>Certificado SSL automático incluído</span>
            </div>
          </div>

          {/* Lista de Domínios Conectados */}
          {domains.length === 0 ? (
            <div className="rounded-3xl border border-zinc-200 bg-white p-8 sm:p-12 text-center space-y-4 shadow-xs">
              <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-zinc-100 text-zinc-500">
                <Globe className="h-6 w-6" />
              </div>
              <div className="max-w-md mx-auto space-y-1">
                <h3 className="text-base font-bold text-zinc-900">
                  Nenhum domínio próprio conectado ainda
                </h3>
                <p className="text-xs text-zinc-500">
                  Você tem direito a conectar seu domínio próprio no Plano PRO. Comece clicando no botão abaixo.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 px-4 py-2.5 text-xs font-semibold text-white shadow-xs transition"
              >
                <Plus className="h-4 w-4" />
                Conectar Primeiro Domínio
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {domains.map((dom) => {
                const isPending = dom.status === "pending";
                const isActive = dom.status === "active";
                const targetBio = bios.find((b) => b.id === dom.target_id);

                return (
                  <div
                    key={dom.id}
                    className="rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6 shadow-xs space-y-5"
                  >
                    {/* Topo do Card de Domínio */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-zinc-100 pb-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`grid h-10 w-10 place-items-center rounded-xl shrink-0 ${
                            isActive
                              ? "bg-emerald-50 text-emerald-600"
                              : "bg-amber-50 text-amber-600"
                          }`}
                        >
                          <Globe className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-base font-extrabold text-zinc-900">
                              {dom.domain}
                            </span>
                            <span
                              className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${
                                isActive
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : "bg-amber-50 text-amber-700 border-amber-200"
                              }`}
                            >
                              {isActive ? "Ativo & Conectado" : "Aguardando DNS"}
                            </span>
                          </div>
                          <p className="text-xs text-zinc-500 mt-0.5">
                            Adicionado em {new Date(dom.created_at).toLocaleDateString("pt-BR")}
                          </p>
                        </div>
                      </div>

                      {/* Ações do Domínio */}
                      <div className="flex items-center gap-2 shrink-0">
                        {isActive && (
                          <a
                            href={`https://${dom.domain}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 transition"
                          >
                            <span>Abrir Site</span>
                            <ExternalLink className="h-3.5 w-3.5 text-zinc-400" />
                          </a>
                        )}

                        <button
                          type="button"
                          onClick={() => handleVerifyDns(dom.id)}
                          disabled={verifyingId === dom.id}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition disabled:opacity-50"
                        >
                          <RefreshCw
                            className={`h-3.5 w-3.5 ${
                              verifyingId === dom.id ? "animate-spin" : ""
                            }`}
                          />
                          <span>
                            {verifyingId === dom.id
                              ? "Verificando..."
                              : isPending
                              ? "Verificar DNS"
                              : "Revalidar DNS"}
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteDomain(dom.id, dom.domain)}
                          className="p-1.5 rounded-xl text-zinc-400 hover:text-rose-600 hover:bg-rose-50 transition"
                          title="Remover Domínio"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* Seletor de Bio Page de Destino */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-50 border border-zinc-200 rounded-xl p-3.5">
                      <div className="space-y-0.5">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1">
                          <Layers className="h-3.5 w-3.5 text-blue-600" />
                          Página de Bio vinculada:
                        </span>
                        <p className="text-xs text-zinc-700">
                          Ao acessar <span className="font-mono font-semibold">{dom.domain}</span>, o visitante verá:
                        </p>
                      </div>

                      <select
                        value={dom.target_id || ""}
                        onChange={(e) => handleUpdateTarget(dom.id, e.target.value)}
                        className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-800 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 min-w-[200px]"
                      >
                        <option value="">Bio Principal Automática</option>
                        {bios.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.title} (/b/{handle}/{b.slug})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Guia de Configuração de DNS (se Pendente) */}
                    {isPending && (
                      <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 space-y-3">
                        <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
                          <HelpCircle className="h-4 w-4 text-amber-600 shrink-0" />
                          Como configurar o DNS na sua hospedagem (Registro.br, Cloudflare, GoDaddy):
                        </div>
                        <p className="text-xs text-zinc-600 leading-relaxed">
                          Acesse a zona de DNS do seu domínio e adicione o registro CNAME abaixo apontando para nossa infraestrutura:
                        </p>

                        <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
                          <table className="min-w-full text-xs text-left">
                            <thead className="bg-zinc-50 text-zinc-500 font-semibold border-b border-zinc-200 text-[11px] uppercase tracking-wider">
                              <tr>
                                <th className="px-3.5 py-2">Tipo</th>
                                <th className="px-3.5 py-2">Nome / Entrada</th>
                                <th className="px-3.5 py-2">Destino / Valor</th>
                                <th className="px-3.5 py-2 text-right">Ação</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-100 font-mono text-zinc-800">
                              <tr>
                                <td className="px-3.5 py-2 font-bold text-blue-700">CNAME</td>
                                <td className="px-3.5 py-2">
                                  {dom.domain.split(".").slice(0, -2).join(".") || "@"}
                                </td>
                                <td className="px-3.5 py-2 select-all font-semibold">
                                  cname.linksnap-xi.vercel.app
                                </td>
                                <td className="px-3.5 py-2 text-right font-sans">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      copyToClipboard(
                                        "cname.linksnap-xi.vercel.app",
                                        `cname_${dom.id}`
                                      )
                                    }
                                    className="inline-flex items-center gap-1 rounded bg-zinc-100 hover:bg-zinc-200 px-2 py-1 text-[11px] text-zinc-700 font-medium transition"
                                  >
                                    {copiedKey === `cname_${dom.id}` ? (
                                      <>
                                        <Check className="h-3 w-3 text-emerald-600" />
                                        <span>Copiado</span>
                                      </>
                                    ) : (
                                      <>
                                        <Copy className="h-3 w-3" />
                                        <span>Copiar</span>
                                      </>
                                    )}
                                  </button>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>

                        <div className="flex items-center justify-between pt-1">
                          <span className="text-[11px] text-zinc-500">
                            Após salvar no seu provedor, clique em <strong>Verificar DNS</strong> acima.
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 4. Modal para Adicionar Novo Domínio */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-zinc-200 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <h2 className="text-base font-bold text-zinc-900 flex items-center gap-2">
                <Globe className="h-5 w-5 text-blue-600" />
                Conectar Domínio Próprio
              </h2>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-700 text-lg leading-none"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleAddDomain} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1">
                  Nome do Domínio ou Subdomínio *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="ex: links.minhamarca.com.br"
                    value={newDomain}
                    onChange={(e) => setNewDomain(e.target.value)}
                    className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-900 font-mono placeholder-zinc-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                  />
                </div>
                <span className="text-[11px] text-zinc-500 mt-1 block">
                  Recomendado: utilize um subdomínio como <span className="font-mono">links.seudominio.com</span> ou <span className="font-mono">bio.seudominio.com</span>.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1">
                  Página de Bio de Destino
                </label>
                <select
                  value={selectedBioId}
                  onChange={(e) => setSelectedBioId(e.target.value)}
                  className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-xs font-semibold text-zinc-800 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                >
                  {bios.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.title} {b.is_primary ? "(Principal)" : ""} — /b/{handle}/{b.slug}
                    </option>
                  ))}
                </select>
                <span className="text-[11px] text-zinc-500 mt-1 block">
                  Esta será a página exibida quando alguém acessar seu domínio.
                </span>
              </div>

              <div className="pt-3 border-t border-zinc-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="rounded-xl border border-zinc-300 bg-white px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 px-4 py-2 text-xs font-semibold text-white shadow-xs transition disabled:opacity-50"
                >
                  {submitting ? "Cadastrando..." : "Salvar e Continuar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
