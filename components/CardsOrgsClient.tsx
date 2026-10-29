"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import {
  UserCheck,
  Plus,
  ArrowRight,
  Shield,
  Trash2,
  Edit2,
  Globe,
  Palette,
  Sparkles,
  X,
  Check,
  CreditCard,
  Building2,
  ExternalLink,
} from "lucide-react";

export interface CardFieldDef {
  key: string;
  label: string;
  showOnCard: boolean;
  showOnValidation: boolean;
}

export interface CustomDomainItem {
  id: string;
  domain: string;
}

export interface OrgItem {
  id: string;
  slug: string;
  name: string;
  logo_url: string | null;
  primary_color: string;
  card_template: string;
  card_fields?: CardFieldDef[] | null;
  custom_domain_id?: string | null;
  custom_domains?: any;
  created_at: string;
}

const PRESETS: Record<string, { label: string; fields: CardFieldDef[] }> = {
  council: {
    label: "Conselho (OAB, CRECI, CRM)",
    fields: [
      { key: "registry_number", label: "Registro / Inscrição", showOnCard: true, showOnValidation: true },
      { key: "specialty", label: "Especialidade / Seccional", showOnCard: true, showOnValidation: true },
      { key: "cpf", label: "CPF", showOnCard: false, showOnValidation: true },
    ],
  },
  club: {
    label: "Clube / Associação",
    fields: [
      { key: "category", label: "Categoria de Sócio", showOnCard: true, showOnValidation: true },
      { key: "blood_type", label: "Tipo Sanguíneo", showOnCard: true, showOnValidation: true },
      { key: "cpf", label: "CPF", showOnCard: false, showOnValidation: true },
    ],
  },
  event: {
    label: "Evento / Credenciamento",
    fields: [
      { key: "access_type", label: "Acesso (VIP / Geral)", showOnCard: true, showOnValidation: true },
      { key: "company", label: "Empresa / Entidade", showOnCard: true, showOnValidation: true },
    ],
  },
};

export default function CardsOrgsClient({
  initialOrgs,
  userId,
  userDomains,
}: {
  initialOrgs: OrgItem[];
  userId: string;
  userDomains: CustomDomainItem[];
}) {
  const router = useRouter();
  const supabase = createClient();
  const [orgs, setOrgs] = useState<OrgItem[]>(initialOrgs);

  // Estado do Modal (Criação ou Edição)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOrg, setEditingOrg] = useState<OrgItem | null>(null);

  // Form Fields
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [color, setColor] = useState("#2563EB");
  const [logoUrl, setLogoUrl] = useState("");
  const [template, setTemplate] = useState("vertical");
  const [customDomainId, setCustomDomainId] = useState<string>("");
  const [cardFields, setCardFields] = useState<CardFieldDef[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const openCreateModal = () => {
    setEditingOrg(null);
    setName("");
    setSlug("");
    setColor("#2563EB");
    setLogoUrl("");
    setTemplate("vertical");
    setCustomDomainId("");
    setCardFields([]);
    setIsModalOpen(true);
  };

  const openEditModal = (org: OrgItem) => {
    setEditingOrg(org);
    setName(org.name);
    setSlug(org.slug);
    setColor(org.primary_color || "#2563EB");
    setLogoUrl(org.logo_url || "");
    setTemplate(org.card_template || "vertical");
    setCustomDomainId(org.custom_domain_id || "");
    setCardFields(Array.isArray(org.card_fields) ? org.card_fields : []);
    setIsModalOpen(true);
  };

  const applyPreset = (presetKey: string) => {
    const preset = PRESETS[presetKey];
    if (preset) {
      setCardFields([...preset.fields]);
    }
  };

  const addCustomField = () => {
    setCardFields([
      ...cardFields,
      {
        key: `field_${Date.now()}`,
        label: "Novo Campo",
        showOnCard: true,
        showOnValidation: true,
      },
    ]);
  };

  const updateCustomField = (index: number, patch: Partial<CardFieldDef>) => {
    const updated = [...cardFields];
    updated[index] = { ...updated[index], ...patch };
    setCardFields(updated);
  };

  const removeCustomField = (index: number) => {
    setCardFields(cardFields.filter((_, i) => i !== index));
  };

  const handleSaveOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const orgSlug = (slug.trim() || name.trim())
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, "");

    setIsSaving(true);
    try {
      const payload = {
        owner_id: userId,
        name: name.trim(),
        slug: orgSlug,
        primary_color: color,
        logo_url: logoUrl.trim() || null,
        card_template: template,
        custom_domain_id: customDomainId || null,
        card_fields: cardFields,
      };

      if (editingOrg) {
        // Atualizar
        const { data, error } = await supabase
          .from("organizations")
          .update(payload)
          .eq("id", editingOrg.id)
          .select(`
            id,
            slug,
            name,
            logo_url,
            primary_color,
            card_template,
            card_fields,
            custom_domain_id,
            custom_domains (
              id,
              domain
            ),
            created_at
          `)
          .single();

        if (error) {
          if (error.code === "23505") {
            alert("Já existe uma equipe registrada com esse slug. Escolha outro.");
            return;
          }
          throw error;
        }

        setOrgs(orgs.map((o) => (o.id === editingOrg.id ? data : o)));
        setIsModalOpen(false);
      } else {
        // Criar
        const { data, error } = await supabase
          .from("organizations")
          .insert(payload)
          .select(`
            id,
            slug,
            name,
            logo_url,
            primary_color,
            card_template,
            card_fields,
            custom_domain_id,
            custom_domains (
              id,
              domain
            ),
            created_at
          `)
          .single();

        if (error) {
          if (error.code === "23505") {
            alert("Já existe uma equipe registrada com esse slug. Escolha outro.");
            return;
          }
          throw error;
        }

        if (data) {
          setOrgs([data, ...orgs]);
          setIsModalOpen(false);
          router.push(`/dashboard/cards/${data.id}`);
        }
      }
    } catch (err: any) {
      alert("Erro ao salvar equipe: " + err.message);
    } finally {
      setIsSaving(false);
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
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 flex items-center gap-2">
            <Building2 className="h-6 w-6 text-blue-600" />
            Carteirinhas & Credenciais Corporativas
          </h1>
          <p className="text-xs text-zinc-600 font-medium mt-1">
            Gere crachás digitais, carteirinhas de membros e credenciais com validação pública oficial em{" "}
            <code className="rounded bg-blue-50 border border-blue-200 px-1.5 py-0.5 text-blue-700 font-mono font-bold">
              /c/[empresa]/[membro]
            </code>{" "}
            ou via seu domínio próprio.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition"
        >
          <Plus className="h-3.5 w-3.5" />
          Cadastrar Nova Equipe
        </button>
      </div>

      {/* Grid de Equipes */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {orgs.length === 0 ? (
          <div className="col-span-full rounded-2xl border border-dashed border-zinc-300 p-12 text-center bg-white shadow-sm">
            <UserCheck className="mx-auto h-12 w-12 text-zinc-400" />
            <h3 className="mt-3 text-sm font-semibold text-zinc-900">Nenhuma equipe cadastrada</h3>
            <p className="mt-1 text-xs text-zinc-500 max-w-md mx-auto">
              Crie sua primeira organização ou empresa para emitir crachás com QR Code, campos personalizados e página pública de verificação.
            </p>
            <button
              onClick={openCreateModal}
              className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              Criar Primeira Equipe
            </button>
          </div>
        ) : (
          orgs.map((org) => {
            const domainName = Array.isArray(org.custom_domains)
              ? org.custom_domains[0]?.domain
              : org.custom_domains?.domain;
            const fieldsCount = Array.isArray(org.card_fields) ? org.card_fields.length : 0;

            return (
              <div
                key={org.id}
                className="group relative flex flex-col justify-between rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:border-blue-400 hover:shadow-md"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      {org.logo_url ? (
                        <img
                          src={org.logo_url}
                          alt={org.name}
                          className="h-10 w-10 rounded-lg object-contain border border-zinc-200 bg-zinc-50 p-0.5 shadow-xs"
                        />
                      ) : (
                        <div
                          className="h-10 w-10 rounded-lg flex items-center justify-center font-bold text-white shadow-xs"
                          style={{ backgroundColor: org.primary_color }}
                        >
                          {org.name.substring(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <h3 className="text-base font-bold text-zinc-900 line-clamp-1">{org.name}</h3>
                        <span className="font-mono text-[11px] font-bold text-blue-700 bg-blue-50/80 border border-blue-200/60 rounded px-1.5 py-0.5">
                          /c/{org.slug}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <span
                        className="h-4 w-4 rounded-full border border-black/10 shadow-xs"
                        style={{ backgroundColor: org.primary_color }}
                        title={`Cor: ${org.primary_color}`}
                      />
                    </div>
                  </div>

                  {/* Informações da Equipe */}
                  <div className="mt-4 space-y-1.5 text-xs text-zinc-600 border-t border-zinc-100 pt-3">
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-500">Modelo de Crachá:</span>
                      <span className="font-semibold text-zinc-800 capitalize">
                        {org.card_template === "horizontal"
                          ? "Carteirinha Horizontal"
                          : org.card_template === "executive"
                          ? "Dark Executivo"
                          : "Crachá Vertical"}
                      </span>
                    </div>

                    {domainName && (
                      <div className="flex items-center justify-between text-emerald-700">
                        <span className="flex items-center gap-1 text-[11px] font-medium">
                          <Globe className="h-3 w-3" /> Domínio Próprio:
                        </span>
                        <span className="font-mono font-bold text-[11px] truncate max-w-[150px]">
                          {domainName}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <span className="text-zinc-500">Campos Extras:</span>
                      <span className="font-medium text-zinc-700">
                        {fieldsCount > 0 ? `${fieldsCount} configurado(s)` : "Padrão"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Rodapé de Ações */}
                <div className="mt-5 border-t border-zinc-100 pt-3 flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(org)}
                      className="rounded-lg border border-zinc-200 bg-white p-2 text-zinc-500 hover:text-blue-600 hover:bg-blue-50 transition"
                      title="Configurações & Modelo"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteOrg(org.id)}
                      className="rounded-lg border border-zinc-200 bg-white p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 transition"
                      title="Excluir Equipe"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <Link
                    href={`/dashboard/cards/${org.id}`}
                    className="flex items-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs transition"
                  >
                    Gerenciar Membros
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* MODAL DE CRIAÇÃO / EDIÇÃO */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl border border-zinc-200 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
              <div>
                <h2 className="text-base font-bold text-zinc-900">
                  {editingOrg ? `Configurar Equipe: ${editingOrg.name}` : "Cadastrar Nova Equipe"}
                </h2>
                <p className="text-xs text-zinc-500">
                  Defina a identidade visual, template do crachá e os campos do formulário dos membros.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveOrg} className="mt-4 space-y-4">
              {/* Nome & Slug */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Nome da Empresa / Equipe *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: ACME Tech, OAB Seccional, Clube Náutico"
                    className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs text-zinc-900 focus:border-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
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
              </div>

              {/* Logo URL & Cor Primária */}
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    URL do Logo da Empresa
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="url"
                      value={logoUrl}
                      onChange={(e) => setLogoUrl(e.target.value)}
                      placeholder="https://exemplo.com/logo.png"
                      className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs text-zinc-900 focus:border-blue-600 focus:outline-none"
                    />
                    {logoUrl && (
                      <img
                        src={logoUrl}
                        alt="Preview"
                        className="h-8 w-8 rounded border border-zinc-200 object-contain bg-zinc-50"
                        onError={(e) => (e.currentTarget.style.display = "none")}
                      />
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Cor Primária
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

              {/* Seletor de Template & Domínio Próprio */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Modelo do Crachá / Carteirinha
                  </label>
                  <select
                    value={template}
                    onChange={(e) => setTemplate(e.target.value)}
                    className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs text-zinc-900 focus:border-blue-600 focus:outline-none"
                  >
                    <option value="vertical">Crachá Vertical Corporativo (Padrão)</option>
                    <option value="horizontal">Carteirinha Horizontal (Documento)</option>
                    <option value="executive">Dark Executivo (Moderno / Noturno)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Domínio Customizado (Opcional)
                  </label>
                  <select
                    value={customDomainId}
                    onChange={(e) => setCustomDomainId(e.target.value)}
                    className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs text-zinc-900 focus:border-blue-600 focus:outline-none"
                  >
                    <option value="">Padrão (linksnap.com.br)</option>
                    {userDomains.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.domain}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Construtor de Campos Dinâmicos (card_fields) */}
              <div className="border border-zinc-200 rounded-xl p-4 bg-zinc-50/70 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-700 flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-blue-600" />
                      Campos Personalizados dos Membros
                    </h4>
                    <p className="text-[11px] text-zinc-500">
                      Adicione informações específicas para esta equipe (ex: CPF, CRM, OAB, Lote).
                    </p>
                  </div>

                  {/* Presets Rápidos */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] text-zinc-400 font-semibold uppercase">Presets:</span>
                    {Object.entries(PRESETS).map(([k, p]) => (
                      <button
                        key={k}
                        type="button"
                        onClick={() => applyPreset(k)}
                        className="rounded bg-white border border-zinc-200 px-2 py-1 text-[10px] font-semibold text-zinc-700 hover:border-blue-500 hover:text-blue-600 transition shadow-2xs"
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Lista de Campos */}
                <div className="space-y-2 pt-1">
                  {cardFields.length === 0 ? (
                    <p className="text-[11px] text-zinc-400 italic py-2 text-center bg-white rounded-lg border border-dashed border-zinc-200">
                      Nenhum campo personalizado ativo. Apenas Nome, Cargo, Setor e Matrícula serão solicitados.
                    </p>
                  ) : (
                    cardFields.map((field, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 bg-white p-2.5 rounded-lg border border-zinc-200 shadow-2xs"
                      >
                        <div className="flex-1">
                          <label className="block text-[10px] font-semibold text-zinc-500 mb-0.5">
                            Rótulo Exibido
                          </label>
                          <input
                            type="text"
                            value={field.label}
                            onChange={(e) => updateCustomField(idx, { label: e.target.value })}
                            placeholder="Ex: Nº OAB"
                            className="w-full rounded border border-zinc-200 px-2 py-1 text-xs text-zinc-900 focus:outline-none"
                          />
                        </div>

                        <div className="w-28">
                          <label className="block text-[10px] font-semibold text-zinc-500 mb-0.5">
                            Identificador (Chave)
                          </label>
                          <input
                            type="text"
                            value={field.key}
                            onChange={(e) => updateCustomField(idx, { key: e.target.value })}
                            placeholder="oab"
                            className="w-full rounded border border-zinc-200 px-2 py-1 text-xs font-mono text-zinc-700 focus:outline-none"
                          />
                        </div>

                        <div className="flex items-center gap-3 pt-3 px-2">
                          <label className="flex items-center gap-1 text-[11px] text-zinc-600 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={field.showOnCard}
                              onChange={(e) => updateCustomField(idx, { showOnCard: e.target.checked })}
                              className="rounded text-blue-600"
                            />
                            No Crachá
                          </label>
                          <label className="flex items-center gap-1 text-[11px] text-zinc-600 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={field.showOnValidation}
                              onChange={(e) =>
                                updateCustomField(idx, { showOnValidation: e.target.checked })
                              }
                              className="rounded text-blue-600"
                            />
                            Na Validação
                          </label>
                        </div>

                        <div className="pt-3">
                          <button
                            type="button"
                            onClick={() => removeCustomField(idx)}
                            className="p-1 text-zinc-400 hover:text-red-600 rounded"
                            title="Remover campo"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}

                  <button
                    type="button"
                    onClick={addCustomField}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 py-1"
                  >
                    <Plus className="h-3.5 w-3.5" /> Adicionar Outro Campo
                  </button>
                </div>
              </div>

              {/* Ações do Modal */}
              <div className="flex justify-end gap-2 pt-3 border-t border-zinc-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-xs font-medium text-zinc-600 hover:bg-zinc-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="rounded-lg bg-blue-600 hover:bg-blue-700 px-5 py-2 text-xs font-semibold text-white shadow-sm disabled:opacity-50"
                >
                  {isSaving ? "Salvando..." : editingOrg ? "Salvar Alterações" : "Criar & Continuar ➔"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
