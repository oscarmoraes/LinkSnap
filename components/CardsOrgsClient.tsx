"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import {
  UserCheck,
  Plus,
  Users,
  ArrowRight,
  Shield,
  Layers,
  Trash2,
  ExternalLink,
} from "lucide-react";

interface OrgItem {
  id: string;
  slug: string;
  name: string;
  logo_url: string | null;
  primary_color: string;
  card_template: string;
  created_at: string;
}

export default function CardsOrgsClient({
  initialOrgs,
  userId,
}: {
  initialOrgs: OrgItem[];
  userId: string;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [orgs, setOrgs] = useState<OrgItem[]>(initialOrgs);
  const [isCreating, setIsCreating] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [color, setColor] = useState("#2563EB");

  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const orgSlug = (slug.trim() || name.trim())
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, "");

    try {
      const { data, error } = await supabase
        .from("organizations")
        .insert({
          owner_id: userId,
          name: name.trim(),
          slug: orgSlug,
          primary_color: color,
        })
        .select()
        .single();

      if (error) {
        if (error.code === "23505") {
          alert("Já existe uma equipe registrada com esse slug. Escolha outro.");
          return;
        }
        throw error;
      }

      if (data) {
        router.push(`/dashboard/cards/${data.id}`);
      }
    } catch (err: any) {
      alert("Erro ao criar equipe: " + err.message);
    }
  };

  const handleDeleteOrg = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta equipe e todas as suas carteirinhas?")) return;
    try {
      const { error } = await supabase.from("organizations").delete().eq("id", id);
      if (error) throw error;
      setOrgs(orgs.filter((o) => o.id !== id));
    } catch (err: any) {
      alert("Erro ao excluir: " + err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
            Carteirinhas & Identificação de Equipes
          </h1>
          <p className="text-xs text-zinc-600 font-medium mt-1">
            Gere credenciais, crachás digitais e carteirinhas para empresas, eventos e equipes com validação pública em{" "}
            <code className="rounded bg-blue-50 border border-blue-200 px-1.5 py-0.5 text-blue-700 font-mono font-bold">
              /c/empresa/membro
            </code>.
          </p>
        </div>

        <button
          onClick={() => setIsCreating(!isCreating)}
          className="flex items-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition"
        >
          <Plus className="h-3.5 w-3.5" />
          {isCreating ? "Fechar" : "Criar Nova Equipe"}
        </button>
      </div>

      {/* Formulário de Criação Rápida */}
      {isCreating && (
        <form
          onSubmit={handleCreateOrg}
          className="rounded-xl border border-blue-200 bg-blue-50/40 p-5 shadow-sm space-y-3 animate-in fade-in"
        >
          <h2 className="text-xs font-bold uppercase tracking-wider text-blue-900">
            Cadastrar Nova Equipe / Empresa
          </h2>
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className="block text-[11px] font-semibold text-zinc-700 mb-1">
                Nome da Equipe / Empresa *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: ACME Tech, Evento Dev 2026"
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs text-zinc-900 focus:border-blue-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-zinc-700 mb-1">
                Slug da URL (/c/slug)
              </label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="acme-tech"
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs font-mono text-blue-700 focus:border-blue-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-zinc-700 mb-1">
                Cor Primária do Crachá
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="h-8 w-12 rounded cursor-pointer border border-zinc-200 bg-white p-0.5"
                />
                <span className="font-mono text-xs text-zinc-600">{color}</span>
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
              Criar & Gerenciar Membros ➔
            </button>
          </div>
        </form>
      )}

      {/* Grid de Equipes */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {orgs.length === 0 ? (
          <div className="col-span-full rounded-xl border border-dashed border-zinc-300 p-12 text-center">
            <UserCheck className="mx-auto h-10 w-10 text-zinc-400" />
            <h3 className="mt-3 text-sm font-semibold text-zinc-900">Nenhuma equipe cadastrada</h3>
            <p className="mt-1 text-xs text-zinc-500 max-w-sm mx-auto">
              Crie uma equipe para gerar carteirinhas digitais com QR Code e página de validação individual para cada membro.
            </p>
            <button
              onClick={() => setIsCreating(true)}
              className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700"
            >
              Criar Primeira Equipe
            </button>
          </div>
        ) : (
          orgs.map((org) => (
            <div
              key={org.id}
              className="group relative flex flex-col justify-between rounded-xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:border-blue-400 hover:shadow-md"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50/80 border border-blue-200/60 rounded px-2 py-0.5 truncate">
                    /c/{org.slug}
                  </span>
                  <span
                    className="h-3 w-3 rounded-full border border-black/10 shadow-sm"
                    style={{ backgroundColor: org.primary_color }}
                    title={`Cor: ${org.primary_color}`}
                  ></span>
                </div>

                <h3 className="mt-3 text-base font-bold text-zinc-900 truncate">{org.name}</h3>
                <p className="text-xs text-zinc-600 mt-0.5">
                  Modelo: <strong className="capitalize text-zinc-800">{org.card_template}</strong>
                </p>
              </div>

              <div className="mt-6 border-t border-zinc-200 pt-3 flex items-center justify-between">
                <button
                  onClick={() => handleDeleteOrg(org.id)}
                  className="rounded-lg border border-zinc-200 bg-white p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50"
                  title="Excluir Equipe"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>

                <Link
                  href={`/dashboard/cards/${org.id}`}
                  className="flex items-center gap-1 rounded-lg bg-blue-600 hover:bg-blue-700 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition"
                >
                  Gerenciar Membros
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
