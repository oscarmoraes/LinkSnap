"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import {
  Smartphone,
  Plus,
  ExternalLink,
  Copy,
  Check,
  Trash2,
  Eye,
  Star,
  Settings,
  ArrowRight,
  Layers,
  Users,
  Sparkles,
} from "lucide-react";
import BioLeadsTable, { BioLeadItem } from "@/components/BioLeadsTable";

interface BioPageItem {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  layout: string;
  is_primary: boolean;
  is_active: boolean;
  views: number;
  created_at: string;
}

export default function BioListClient({
  initialBios,
  initialLeads = [],
  handle,
  origin,
  userId,
  planTier = "free",
  defaultTab = "bios",
}: {
  initialBios: BioPageItem[];
  initialLeads?: BioLeadItem[];
  handle: string;
  origin: string;
  userId: string;
  planTier?: string;
  defaultTab?: "bios" | "leads";
}) {
  const isPro = planTier === "pro" || planTier === "enterprise";
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const [bios, setBios] = useState<BioPageItem[]>(initialBios);
  const [leads, setLeads] = useState<BioLeadItem[]>(initialLeads);
  const [activeTab, setActiveTab] = useState<"bios" | "leads">(defaultTab);
  const [newTitle, setNewTitle] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [showProQuotaModal, setShowProQuotaModal] = useState(false);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  // Sincronizar com query param ?tab=leads caso mude na URL
  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam === "leads") {
      setActiveTab("leads");
    } else if (tabParam === "bios") {
      setActiveTab("bios");
    }
  }, [searchParams]);

  const handleTabChange = (tab: "bios" | "leads") => {
    setActiveTab(tab);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      if (tab === "leads") {
        url.searchParams.set("tab", "leads");
      } else {
        url.searchParams.delete("tab");
      }
      window.history.replaceState(null, "", url.toString());
    }
  };

  const handleOpenCreate = () => {
    if (!isPro && bios.length >= 1) {
      setShowProQuotaModal(true);
      return;
    }
    setIsCreating(!isCreating);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    if (!isPro && bios.length >= 1) {
      setShowProQuotaModal(true);
      return;
    }

    const slug = (newSlug.trim() || Math.random().toString(36).substring(2, 8))
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, "");

    try {
      const { data, error } = await supabase
        .from("bio_pages")
        .insert({
          user_id: userId,
          title: newTitle.trim(),
          slug,
          is_primary: bios.length === 0,
        })
        .select()
        .single();

      if (error) {
        if (error.code === "23505") {
          alert("Você já possui uma Bio Page com este slug. Escolha outro.");
          return;
        }
        throw error;
      }

      if (data) {
        // Redireciona imediatamente para o editor em tela cheia da nova página!
        router.push(`/dashboard/bio/${data.id}`);
      }
    } catch (err: any) {
      alert("Erro ao criar Bio Page: " + err.message);
    }
  };

  const handleSetPrimary = async (id: string) => {
    try {
      await supabase.from("bio_pages").update({ is_primary: false }).eq("user_id", userId);
      await supabase.from("bio_pages").update({ is_primary: true }).eq("id", id);
      setBios(bios.map((b) => ({ ...b, is_primary: b.id === id })));
    } catch (err: any) {
      alert("Erro ao definir primária: " + err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta Bio Page?")) return;
    try {
      const { error } = await supabase.from("bio_pages").delete().eq("id", id);
      if (error) throw error;
      setBios(bios.filter((b) => b.id !== id));
    } catch (err: any) {
      alert("Erro ao excluir: " + err.message);
    }
  };

  const handleCopy = async (url: string, id: string) => {
    await navigator.clipboard.writeText(url);
    setCopiedSlug(id);
    setTimeout(() => setCopiedSlug(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
            {activeTab === "bios" ? "Bio Pages (Linktree)" : "Gestão de Leads da Bio"}
          </h1>
          <p className="text-xs text-zinc-600 font-medium mt-1">
            {activeTab === "bios" ? (
              <>
                Crie múltiplas páginas de perfil com layouts personalizados em{" "}
                <code className="rounded bg-blue-50 border border-blue-200 px-1.5 py-0.5 text-blue-700 font-mono font-bold">
                  /b/{handle}/slug
                </code>.
              </>
            ) : (
              "Visualize, filtre, contate no WhatsApp e exporte os contatos capturados pelos formulários das suas Bio Pages."
            )}
          </p>
        </div>

        {activeTab === "bios" && (
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition"
          >
            <Plus className="h-3.5 w-3.5" />
            {isCreating ? "Fechar" : "Criar Nova Bio Page"}
          </button>
        )}
      </div>

      {/* Abas de Navegação */}
      <div className="flex items-center gap-2 border-b border-zinc-200 -mt-2">
        <button
          type="button"
          onClick={() => handleTabChange("bios")}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-bold transition ${
            activeTab === "bios"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-zinc-500 hover:text-zinc-800"
          }`}
        >
          <span>📱 Minhas Bio Pages</span>
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
              activeTab === "bios"
                ? "bg-blue-100 text-blue-700"
                : "bg-zinc-100 text-zinc-600"
            }`}
          >
            {bios.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange("leads")}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-bold transition ${
            activeTab === "leads"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-zinc-500 hover:text-zinc-800"
          }`}
        >
          <span>👥 Leads Capturados</span>
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
              activeTab === "leads"
                ? "bg-blue-100 text-blue-700"
                : "bg-zinc-100 text-zinc-600"
            }`}
          >
            {leads.length}
          </span>
        </button>
      </div>

      {/* ABA 1: MINHAS BIO PAGES */}
      {activeTab === "bios" && (
        <div className="space-y-6 animate-in fade-in">
          {/* Formulário de Criação Rápida */}
          {isCreating && (
            !isPro && bios.length >= 1 ? (
              <div className="rounded-xl border border-amber-300 bg-amber-50/80 p-5 shadow-sm space-y-3 animate-in fade-in">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-amber-500 text-white">
                      <Sparkles className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-amber-950 uppercase tracking-wider">
                        Limite de 1 Bio Page Atingido (Plano Free)
                      </h3>
                      <p className="text-xs text-amber-900 mt-1 leading-relaxed">
                        No plano gratuito você tem direito a <strong>1 Bio Page ativa</strong>. Faça upgrade para o <strong>LinkSnap PRO</strong> para criar até <strong>5 Bio Pages</strong>, conectar domínio próprio, instalar Meta Pixel e ocultar a marca do rodapé.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsCreating(false)}
                      className="rounded-lg border border-amber-200 bg-white px-3 py-1.5 text-xs text-amber-800 hover:bg-amber-50"
                    >
                      Fechar
                    </button>
                    <Link
                      href="/dashboard/settings#plan"
                      className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 px-4 py-2 text-xs font-bold text-white shadow-xs transition"
                    >
                      Fazer Upgrade PRO ⚡
                    </Link>
                  </div>
                </div>
              </div>
            ) : (
              <form
                onSubmit={handleCreate}
                className="rounded-xl border border-blue-200 bg-blue-50/40 p-5 shadow-sm space-y-3 animate-in fade-in"
              >
                <h2 className="text-xs font-bold uppercase tracking-wider text-blue-900">
                  Nova Página de Bio
                </h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-700 mb-1">
                      Título da Página *
                    </label>
                    <input
                      type="text"
                      required
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      placeholder="Ex: Minha Bio Pessoal, Lançamento do Curso, etc."
                      className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs text-zinc-900 focus:border-blue-600 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-700 mb-1">
                      Slug da URL (Opcional)
                    </label>
                    <div className="flex items-center rounded-lg border border-zinc-300 bg-white px-2.5 py-1.5 focus-within:border-blue-600">
                      <span className="text-[11px] text-zinc-400 font-mono">/b/{handle}/</span>
                      <input
                        type="text"
                        value={newSlug}
                        onChange={(e) => setNewSlug(e.target.value)}
                        placeholder="versao-1"
                        className="w-full bg-transparent text-xs text-blue-700 font-mono focus:outline-none pl-1 border-transparent"
                      />
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsCreating(false)}
                    className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs text-zinc-600 hover:bg-zinc-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="rounded-lg bg-blue-600 hover:bg-blue-700 px-4 py-1.5 text-xs font-semibold text-white shadow-sm"
                  >
                    Continuar para o Editor ➔
                  </button>
                </div>
              </form>
            )
          )}

          {/* Grid de Bio Pages */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {bios.length === 0 ? (
              <div className="col-span-full rounded-xl border border-dashed border-zinc-300 p-12 text-center">
                <Smartphone className="mx-auto h-10 w-10 text-zinc-400" />
                <h3 className="mt-3 text-sm font-semibold text-zinc-900">Nenhuma Bio Page criada ainda</h3>
                <p className="mt-1 text-xs text-zinc-500 max-w-sm mx-auto">
                  Crie sua primeira página de bio com botões, links de WhatsApp, redes sociais e layout customizável.
                </p>
                <button
                  onClick={() => setIsCreating(true)}
                  className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700"
                >
                  Criar Primeira Bio Page
                </button>
              </div>
            ) : (
              bios.map((bio) => {
                const bioUrl = `${origin}/b/${handle}/${bio.slug}`;
                const leadsCountForThisBio = leads.filter((l) => l.bio_page_id === bio.id).length;

                return (
                  <div
                    key={bio.id}
                    className="group relative flex flex-col justify-between rounded-xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:border-blue-400 hover:shadow-md"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50/80 border border-blue-200/70 rounded px-2 py-0.5 truncate">
                          /b/{handle}/{bio.slug}
                        </span>
                        {bio.is_primary && (
                          <span className="flex items-center gap-1 rounded bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-900 border border-amber-300">
                            <Star className="h-2.5 w-2.5 fill-amber-500 text-amber-600" /> Principal
                          </span>
                        )}
                      </div>

                      <h3 className="mt-3 text-base font-bold text-zinc-900 truncate">{bio.title}</h3>
                      <p className="text-xs text-zinc-500 mt-0.5 line-clamp-2">
                        {bio.description || "Sem descrição"}
                      </p>

                      <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-zinc-500">
                        <span className="flex items-center gap-1">
                          <Eye className="h-3.5 w-3.5 text-zinc-400" />
                          <strong>{Number(bio.views || 0).toLocaleString("pt-BR")}</strong> views
                        </span>
                        <span className="h-3 w-px bg-zinc-200"></span>
                        <button
                          type="button"
                          onClick={() => handleTabChange("leads")}
                          className="flex items-center gap-1 text-zinc-600 hover:text-blue-600 font-medium"
                          title="Ver leads desta bio"
                        >
                          <Users className="h-3.5 w-3.5 text-zinc-400" />
                          <strong>{leadsCountForThisBio}</strong> leads
                        </button>
                        <span className="h-3 w-px bg-zinc-200"></span>
                        <span className="capitalize">{bio.layout}</span>
                      </div>
                    </div>

                    <div className="mt-5 border-t border-zinc-200 pt-3 flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleCopy(bioUrl, bio.id)}
                          className="rounded-lg border border-zinc-200 bg-white p-1.5 text-zinc-600 hover:bg-zinc-100"
                          title="Copiar Link"
                        >
                          {copiedSlug === bio.id ? (
                            <Check className="h-3.5 w-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </button>
                        <a
                          href={bioUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-lg border border-zinc-200 bg-white p-1.5 text-zinc-600 hover:bg-zinc-100"
                          title="Abrir página pública"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                        {!bio.is_primary && (
                          <button
                            onClick={() => handleSetPrimary(bio.id)}
                            className="rounded-lg border border-zinc-200 bg-white p-1.5 text-zinc-400 hover:text-amber-600 hover:bg-zinc-100"
                            title="Definir como principal (/b/handle)"
                          >
                            <Star className="h-3.5 w-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(bio.id)}
                          className="rounded-lg border border-zinc-200 bg-white p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50"
                          title="Excluir"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <Link
                        href={`/dashboard/bio/${bio.id}`}
                        className="flex items-center gap-1 rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-zinc-800 transition"
                      >
                        Editar
                        <ArrowRight className="h-3 w-3" />
                      </Link>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ABA 2: LEADS CAPTURADOS */}
      {activeTab === "leads" && (
        <BioLeadsTable
          initialLeads={leads}
          bios={bios.map((b) => ({ id: b.id, title: b.title, slug: b.slug }))}
          handle={handle}
          origin={origin}
          onLeadDeleted={(deletedId) => {
            setLeads((prev) => prev.filter((l) => l.id !== deletedId));
          }}
          onSwitchToBiosTab={() => handleTabChange("bios")}
        />
      )}
      {/* Modal de Upgrade PRO para Cota de Bio Pages */}
      {showProQuotaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl border border-amber-200 bg-white p-6 shadow-2xl space-y-5 animate-in zoom-in-95">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-amber-100 text-amber-700 border border-amber-200 shadow-xs">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <span className="inline-block rounded-full bg-amber-100 border border-amber-300 px-2 py-0.5 text-[10px] font-extrabold text-amber-800">
                    LIMITE DO PLANO FREE 🔒
                  </span>
                  <h3 className="text-base font-bold text-zinc-900 mt-0.5">
                    Desbloqueie até 5 Bio Pages
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowProQuotaModal(false)}
                className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 transition"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-zinc-600 leading-relaxed">
              No plano gratuito você tem direito a <strong>1 Bio Page ativa</strong>. Faça upgrade para o <strong>LinkSnap PRO</strong> para criar até <strong>5 Bio Pages independentes</strong>, conectar domínio próprio (.com.br), instalar Meta Pixel/GTM e remover o rodapé da marca.
            </p>

            <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 space-y-2">
              <div className="flex items-baseline justify-between">
                <span className="text-xs font-bold text-amber-950">LinkSnap PRO</span>
                <span className="text-base font-extrabold text-zinc-900">
                  R$ 19,90<span className="text-xs font-normal text-zinc-600">/mês</span>
                </span>
              </div>
              <p className="text-[11px] text-zinc-600">
                Ou R$ 199/ano no ciclo anual (apenas R$ 14,90/mês). Ativação instantânea via Pix ou Cartão.
              </p>
              <ul className="text-[11px] text-zinc-700 space-y-1 pt-1">
                <li className="flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  <span>Até 5 Bio Pages simultâneas (/b/seunome/...)</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  <span>1 Domínio próprio com SSL grátis incluso</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  <span>Vitrines de produtos, afiliados e captura de leads</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  <span>Selo Verificado Azul e páginas sem marca d&apos;água</span>
                </li>
              </ul>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowProQuotaModal(false)}
                className="rounded-lg border border-zinc-200 bg-white px-3.5 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 transition"
              >
                Voltar
              </button>
              <Link
                href="/dashboard/settings#plan"
                className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 px-4 py-2 text-xs font-bold text-white shadow-sm transition"
              >
                Fazer Upgrade PRO ⚡
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
