"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import QRCode from "qrcode";
import Papa from "papaparse";
import { toPng } from "html-to-image";
import {
  ArrowLeft,
  Plus,
  Upload,
  Download,
  Trash2,
  ExternalLink,
  Edit2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Eye,
  Camera,
  Globe,
  Sparkles,
  Phone,
  Mail,
  X,
  CreditCard,
  Building2,
} from "lucide-react";

export interface CardFieldDef {
  key: string;
  label: string;
  showOnCard: boolean;
  showOnValidation: boolean;
}

export interface MemberItem {
  id: string;
  code: string;
  full_name: string;
  role: string | null;
  department: string | null;
  registration: string | null;
  photo_url: string | null;
  email: string | null;
  phone: string | null;
  valid_until: string | null;
  status: string;
  extra: Record<string, any> | null;
  created_at?: string;
}

export interface OrgData {
  id: string;
  slug: string;
  name: string;
  logo_url: string | null;
  primary_color: string;
  card_template: string;
  card_fields?: CardFieldDef[] | null;
  custom_domain_id?: string | null;
  custom_domains?: any;
}

export default function OrgMembersClient({
  org,
  initialMembers,
  origin,
}: {
  org: OrgData;
  initialMembers: MemberItem[];
  origin: string;
}) {
  const supabase = createClient();
  const [members, setMembers] = useState<MemberItem[]>(initialMembers);
  const [selectedMember, setSelectedMember] = useState<MemberItem | null>(
    initialMembers[0] || null
  );
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");
  const badgeRef = useRef<HTMLDivElement>(null);

  // Estados de Modais
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<MemberItem | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Campos do Formulário do Membro
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("");
  const [department, setDepartment] = useState("");
  const [registration, setRegistration] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [status, setStatus] = useState("active");
  const [extraFields, setExtraFields] = useState<Record<string, string>>({});

  // Extrai o domínio customizado (pode vir como objeto ou array pelo join do Supabase)
  const orgDomain = Array.isArray(org.custom_domains)
    ? org.custom_domains[0]?.domain
    : org.custom_domains?.domain;

  // URL base para validação
  const getValidationUrl = (code: string) => {
    if (orgDomain) {
      return `https://${orgDomain}/c/${org.slug}/${code}`;
    }
    return `${origin}/c/${org.slug}/${code}`;
  };

  // Atualiza QR Code do membro selecionado
  useEffect(() => {
    if (selectedMember) {
      const verifyUrl = getValidationUrl(selectedMember.code);
      QRCode.toDataURL(verifyUrl, {
        width: 300,
        margin: 1,
        color: {
          dark: "#000000",
          light: "#ffffff",
        },
      })
        .then(setQrCodeDataUrl)
        .catch(() => {});
    }
  }, [selectedMember, org.slug, orgDomain, origin]);

  const openCreateModal = () => {
    setEditingMember(null);
    setFullName("");
    setRole("");
    setDepartment("");
    setRegistration("");
    setPhotoUrl("");
    setEmail("");
    setPhone("");
    setValidUntil("");
    setStatus("active");
    setExtraFields({});
    setIsModalOpen(true);
  };

  const openEditModal = (member: MemberItem) => {
    setEditingMember(member);
    setFullName(member.full_name);
    setRole(member.role || "");
    setDepartment(member.department || "");
    setRegistration(member.registration || "");
    setPhotoUrl(member.photo_url || "");
    setEmail(member.email || "");
    setPhone(member.phone || "");
    setValidUntil(member.valid_until || "");
    setStatus(member.status || "active");
    setExtraFields(member.extra || {});
    setIsModalOpen(true);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("A imagem deve ter no máximo 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === "string") {
        setPhotoUrl(event.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) return;

    setIsSaving(true);
    try {
      const payload = {
        org_id: org.id,
        full_name: fullName.trim(),
        role: role.trim() || null,
        department: department.trim() || null,
        registration: registration.trim() || null,
        photo_url: photoUrl.trim() || null,
        email: email.trim() || null,
        phone: phone.trim() || null,
        valid_until: validUntil || null,
        status,
        extra: extraFields,
      };

      if (editingMember) {
        // Atualizar
        const { data, error } = await supabase
          .from("card_members")
          .update(payload)
          .eq("id", editingMember.id)
          .select()
          .single();

        if (error) throw error;

        const updatedList = members.map((m) => (m.id === editingMember.id ? data : m));
        setMembers(updatedList);
        if (selectedMember?.id === editingMember.id) {
          setSelectedMember(data);
        }
        setIsModalOpen(false);
      } else {
        // Criar
        const code = Math.random().toString(36).substring(2, 8).toUpperCase();
        const { data, error } = await supabase
          .from("card_members")
          .insert({
            ...payload,
            code,
          })
          .select()
          .single();

        if (error) throw error;

        setMembers([data, ...members]);
        setSelectedMember(data);
        setIsModalOpen(false);
      }
    } catch (err: any) {
      alert("Erro ao salvar membro: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleStatus = async (member: MemberItem) => {
    const nextStatus = member.status === "active" ? "suspended" : "active";
    try {
      const { data, error } = await supabase
        .from("card_members")
        .update({ status: nextStatus })
        .eq("id", member.id)
        .select()
        .single();

      if (error) throw error;

      const updated = members.map((m) => (m.id === member.id ? data : m));
      setMembers(updated);
      if (selectedMember?.id === member.id) {
        setSelectedMember(data);
      }
    } catch (err: any) {
      alert("Erro ao alterar status: " + err.message);
    }
  };

  const handleDeleteMember = async (id: string) => {
    if (!confirm("Tem certeza que deseja remover este membro? A carteirinha dele não será mais válida.")) return;
    try {
      const { error } = await supabase.from("card_members").delete().eq("id", id);
      if (error) throw error;
      const updated = members.filter((m) => m.id !== id);
      setMembers(updated);
      if (selectedMember?.id === id) {
        setSelectedMember(updated[0] || null);
      }
    } catch (err: any) {
      alert("Erro ao remover: " + err.message);
    }
  };

  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const rows = results.data as any[];
        if (rows.length === 0) {
          alert("Arquivo CSV vazio.");
          return;
        }

        const newMembers = rows.map((row) => {
          const extra: Record<string, any> = {};
          // Mapeia colunas não-padrão para extra
          Object.keys(row).forEach((k) => {
            const lk = k.toLowerCase().trim();
            if (
              ![
                "nome", "name", "full_name",
                "cargo", "role",
                "setor", "department", "departamento",
                "matricula", "registration",
                "email", "e-mail",
                "telefone", "phone", "whatsapp", "celular",
                "validade", "valid_until",
              ].includes(lk)
            ) {
              if (row[k]) extra[k] = row[k];
            }
          });

          return {
            org_id: org.id,
            code: Math.random().toString(36).substring(2, 8).toUpperCase(),
            full_name: row.nome || row.name || row.Nome || "Membro",
            role: row.cargo || row.role || row.Cargo || null,
            department: row.setor || row.department || row.departamento || row.Setor || null,
            registration: row.matricula || row.registration || row.Matricula || null,
            email: row.email || row["e-mail"] || null,
            phone: row.telefone || row.phone || row.whatsapp || row.celular || null,
            valid_until: row.validade || row.valid_until || null,
            status: "active",
            extra,
          };
        });

        try {
          const { data, error } = await supabase
            .from("card_members")
            .insert(newMembers)
            .select();

          if (error) throw error;
          if (data) {
            setMembers([...data, ...members]);
            if (!selectedMember && data[0]) setSelectedMember(data[0]);
            alert(`${data.length} membros importados com sucesso!`);
            setIsImporting(false);
          }
        } catch (err: any) {
          alert("Erro ao importar CSV: " + err.message);
        }
      },
    });
  };

  const downloadBadgePng = async () => {
    if (!badgeRef.current || !selectedMember) return;
    try {
      const dataUrl = await toPng(badgeRef.current, {
        cacheBust: true,
        pixelRatio: 2,
      });
      const link = document.createElement("a");
      link.download = `carteirinha-${selectedMember.code}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err: any) {
      alert("Erro ao gerar imagem: " + err.message);
    }
  };

  const cardTemplate = org.card_template || "vertical";
  const fieldsToShowOnCard = (
    Array.isArray(org.card_fields) ? org.card_fields : []
  ).filter((f) => f && typeof f === "object" && f.showOnCard);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-200 pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/cards"
            className="rounded-lg border border-zinc-200 p-2 text-zinc-600 hover:bg-zinc-100 transition"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>

          <div className="flex items-center gap-2.5">
            {org.logo_url ? (
              <img
                src={org.logo_url}
                alt={org.name}
                className="h-9 w-9 rounded-lg object-contain border border-zinc-200 bg-white p-0.5 shadow-2xs"
              />
            ) : (
              <div
                className="h-9 w-9 rounded-lg flex items-center justify-center font-bold text-white shadow-2xs"
                style={{ backgroundColor: org.primary_color }}
              >
                {org.name.substring(0, 2).toUpperCase()}
              </div>
            )}
            <div>
              <h1 className="text-xl font-bold tracking-tight text-zinc-900 flex items-center gap-2">
                {org.name}
                <span
                  className="h-3 w-3 rounded-full border border-black/10"
                  style={{ backgroundColor: org.primary_color }}
                  title={`Cor: ${org.primary_color}`}
                />
              </h1>
              <div className="flex items-center gap-2 text-xs">
                <span className="font-mono text-blue-600 font-bold">/c/{org.slug}</span>
                {orgDomain && (
                  <span className="flex items-center gap-1 font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200 text-[11px]">
                    <Globe className="h-3 w-3" /> {orgDomain}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsImporting(!isImporting)}
            className="flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 px-3 py-2 text-xs font-semibold text-zinc-700 shadow-2xs transition"
          >
            <Upload className="h-3.5 w-3.5 text-zinc-500" />
            Importar CSV
          </button>
          <button
            onClick={openCreateModal}
            className="flex items-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 px-3.5 py-2 text-xs font-semibold text-white shadow-2xs transition"
          >
            <Plus className="h-3.5 w-3.5" />
            Novo Membro
          </button>
        </div>
      </div>

      {/* Box Importação CSV */}
      {isImporting && (
        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-5 space-y-3 animate-in fade-in">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase text-zinc-700">Importação em Lote via CSV</h3>
            <button onClick={() => setIsImporting(false)} className="text-zinc-400 hover:text-zinc-700">
              <X className="h-4 w-4" />
            </button>
          </div>
          <p className="text-xs text-zinc-500">
            Envie uma planilha CSV com as colunas: <code>nome</code>, <code>cargo</code>, <code>setor</code>, <code>matricula</code>, <code>telefone</code>, <code>email</code>. Colunas extras serão salvas nos campos personalizados.
          </p>
          <input
            type="file"
            accept=".csv"
            onChange={handleCsvUpload}
            className="block w-full text-xs text-zinc-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer"
          />
        </div>
      )}

      {/* Grid Principal: Lista à Esquerda, Visualizador à Direita */}
      <div className="grid gap-6 lg:grid-cols-12 items-start">
        {/* TABELA DE MEMBROS (7 Colunas) */}
        <div className="lg:col-span-7 rounded-xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
          <div className="border-b border-zinc-200 px-5 py-3 flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-zinc-500">
              Membros Cadastrados ({members.length})
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[500px]">
              <thead className="bg-zinc-50 text-[11px] font-semibold uppercase text-zinc-500 border-b border-zinc-200">
                <tr>
                  <th className="px-4 py-3">Membro</th>
                  <th className="px-4 py-3">Código</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {members.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-10 text-center text-zinc-400">
                      Nenhum membro cadastrado ainda nesta equipe.
                    </td>
                  </tr>
                ) : (
                  members.map((m) => {
                    const isSelected = selectedMember?.id === m.id;
                    const isActive = m.status === "active";

                    return (
                      <tr
                        key={m.id}
                        onClick={() => setSelectedMember(m)}
                        className={`cursor-pointer transition ${
                          isSelected ? "bg-blue-50/70" : "hover:bg-zinc-50"
                        }`}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div
                              className="h-8 w-8 rounded-full border border-black/10 bg-zinc-100 flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden"
                              style={{ color: org.primary_color }}
                            >
                              {m.photo_url ? (
                                <img src={m.photo_url} alt="" className="h-full w-full object-cover" />
                              ) : (
                                m.full_name.substring(0, 2).toUpperCase()
                              )}
                            </div>
                            <div>
                              <p className="font-bold text-zinc-900 leading-tight">{m.full_name}</p>
                              <p className="text-[11px] text-zinc-500">
                                {m.role || "Membro"} {m.department ? `• ${m.department}` : ""}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-3 font-mono font-bold text-blue-700">{m.code}</td>

                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleStatus(m);
                            }}
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase transition ${
                              isActive
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                                : "bg-red-50 text-red-700 border border-red-200 hover:bg-red-100"
                            }`}
                            title="Clique para alternar status"
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                isActive ? "bg-emerald-600" : "bg-red-600"
                              }`}
                            />
                            {isActive ? "Ativo" : "Suspenso"}
                          </button>
                        </td>

                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openEditModal(m);
                              }}
                              className="rounded p-1.5 text-zinc-400 hover:text-blue-600 hover:bg-blue-50 transition"
                              title="Editar Membro"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteMember(m.id);
                              }}
                              className="rounded p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 transition"
                              title="Remover Membro"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* PREVIEW DO CRACHÁ / CARTEIRINHA (5 Colunas) */}
        <div className="lg:col-span-5 sticky top-4 flex flex-col items-center space-y-4">
          {selectedMember ? (
            <>
              {/* === TEMPLATE VERTICAL (Crachá Vertical) === */}
              {cardTemplate === "vertical" && (
                <div
                  ref={badgeRef}
                  className="w-72 rounded-2xl border-2 border-zinc-200 bg-white p-5 shadow-xl text-center relative overflow-hidden"
                >
                  <div
                    className="absolute top-0 left-0 right-0 h-3"
                    style={{ backgroundColor: org.primary_color }}
                  />

                  <div className="pt-2">
                    {/* Top Header: Logo ou Nome */}
                    {org.logo_url ? (
                      <div className="flex items-center justify-center gap-1.5 mb-1">
                        <img src={org.logo_url} alt="" className="h-5 object-contain" />
                        <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-700">
                          {org.name}
                        </span>
                      </div>
                    ) : (
                      <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                        {org.name}
                      </span>
                    )}

                    {/* Foto */}
                    <div
                      className="mx-auto my-3 h-20 w-20 rounded-full border-2 bg-zinc-100 flex items-center justify-center font-bold text-2xl shadow-xs overflow-hidden"
                      style={{ borderColor: org.primary_color, color: org.primary_color }}
                    >
                      {selectedMember.photo_url ? (
                        <img
                          src={selectedMember.photo_url}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        selectedMember.full_name.substring(0, 2).toUpperCase()
                      )}
                    </div>

                    <h3 className="text-base font-bold text-zinc-900 leading-tight">
                      {selectedMember.full_name}
                    </h3>
                    <p className="text-xs font-semibold mt-0.5" style={{ color: org.primary_color }}>
                      {selectedMember.role || "Membro"}
                    </p>
                    <p className="text-[11px] text-zinc-500">{selectedMember.department || "Geral"}</p>

                    {/* Campos Personalizados do Crachá */}
                    {fieldsToShowOnCard.length > 0 && selectedMember.extra && (
                      <div className="mt-2.5 pt-2 border-t border-zinc-100 text-[11px] space-y-0.5 text-zinc-600">
                        {fieldsToShowOnCard.map((f) => {
                          const val = selectedMember.extra?.[f.key];
                          if (!val) return null;
                          return (
                            <div key={f.key} className="flex justify-between px-2">
                              <span className="text-zinc-400">{f.label}:</span>
                              <span className="font-semibold text-zinc-800">{val}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* QR Code de Validação Oficial */}
                    {qrCodeDataUrl && (
                      <div className="mx-auto my-3 h-28 w-28 rounded-xl border border-zinc-200 p-1 flex items-center justify-center bg-white shadow-2xs">
                        <img src={qrCodeDataUrl} alt="QR Validação" className="h-full w-full" />
                      </div>
                    )}

                    <div className="flex justify-between items-center text-[10px] font-mono text-zinc-400 border-t border-zinc-200 pt-2">
                      <span>ID: {selectedMember.code}</span>
                      <span
                        className={`font-bold ${
                          selectedMember.status === "active" ? "text-emerald-600" : "text-red-600"
                        }`}
                      >
                        ● {selectedMember.status === "active" ? "VÁLIDO" : "SUSPENSO"}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* === TEMPLATE HORIZONTAL (Carteirinha Horizontal) === */}
              {cardTemplate === "horizontal" && (
                <div
                  ref={badgeRef}
                  className="w-[360px] rounded-2xl border-2 border-zinc-200 bg-white p-4 shadow-xl relative overflow-hidden flex flex-col justify-between"
                  style={{ minHeight: "220px" }}
                >
                  <div
                    className="absolute top-0 left-0 bottom-0 w-3"
                    style={{ backgroundColor: org.primary_color }}
                  />

                  <div className="pl-3">
                    {/* Header da Carteirinha */}
                    <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
                      <div className="flex items-center gap-1.5">
                        {org.logo_url && (
                          <img src={org.logo_url} alt="" className="h-5 object-contain" />
                        )}
                        <span className="text-xs font-bold uppercase tracking-wider text-zinc-800">
                          {org.name}
                        </span>
                      </div>
                      <span className="font-mono text-[10px] font-bold text-zinc-400">
                        CREDENTIAL ID
                      </span>
                    </div>

                    {/* Corpo Horizontal: Foto à esquerda, Dados ao Centro, QR à Direita */}
                    <div className="mt-3 flex items-center gap-3">
                      <div
                        className="h-20 w-16 rounded-lg border-2 bg-zinc-100 flex items-center justify-center font-bold text-lg shadow-2xs shrink-0 overflow-hidden"
                        style={{ borderColor: org.primary_color, color: org.primary_color }}
                      >
                        {selectedMember.photo_url ? (
                          <img
                            src={selectedMember.photo_url}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          selectedMember.full_name.substring(0, 2).toUpperCase()
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-bold text-zinc-900 truncate">
                          {selectedMember.full_name}
                        </h3>
                        <p className="text-xs font-semibold truncate" style={{ color: org.primary_color }}>
                          {selectedMember.role || "Membro"}
                        </p>
                        <p className="text-[10px] text-zinc-500 truncate">
                          {selectedMember.department || "Geral"}
                        </p>

                        {fieldsToShowOnCard.slice(0, 2).map((f) => {
                          const val = selectedMember.extra?.[f.key];
                          if (!val) return null;
                          return (
                            <p key={f.key} className="text-[10px] text-zinc-600 truncate mt-0.5">
                              <span className="text-zinc-400">{f.label}:</span>{" "}
                              <strong>{val}</strong>
                            </p>
                          );
                        })}
                      </div>

                      {qrCodeDataUrl && (
                        <div className="h-16 w-16 rounded-lg border border-zinc-200 p-0.5 flex items-center justify-center bg-white shadow-2xs shrink-0">
                          <img src={qrCodeDataUrl} alt="QR" className="h-full w-full" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Rodapé da Carteirinha */}
                  <div className="pl-3 mt-3 border-t border-zinc-100 pt-2 flex items-center justify-between text-[10px] font-mono text-zinc-400">
                    <span>REG: {selectedMember.registration || selectedMember.code}</span>
                    <span
                      className={`font-bold ${
                        selectedMember.status === "active" ? "text-emerald-600" : "text-red-600"
                      }`}
                    >
                      ● {selectedMember.status === "active" ? "AUTORIZADO" : "SUSPENSO"}
                    </span>
                  </div>
                </div>
              )}

              {/* === TEMPLATE EXECUTIVE (Tema Dark Executivo) === */}
              {cardTemplate === "executive" && (
                <div
                  ref={badgeRef}
                  className="w-72 rounded-2xl border border-zinc-800 bg-zinc-950 p-5 shadow-2xl text-center relative overflow-hidden text-zinc-100"
                >
                  <div
                    className="absolute top-0 left-0 right-0 h-1"
                    style={{ backgroundColor: org.primary_color }}
                  />

                  <div className="pt-2">
                    {/* Top Header */}
                    <div className="flex items-center justify-center gap-1.5 mb-2">
                      {org.logo_url && (
                        <img src={org.logo_url} alt="" className="h-4 object-contain brightness-200" />
                      )}
                      <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                        {org.name}
                      </span>
                    </div>

                    {/* Foto com anel neon/cor */}
                    <div
                      className="mx-auto my-3 h-20 w-20 rounded-full border-2 bg-zinc-900 flex items-center justify-center font-bold text-2xl shadow-lg overflow-hidden"
                      style={{ borderColor: org.primary_color }}
                    >
                      {selectedMember.photo_url ? (
                        <img
                          src={selectedMember.photo_url}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span style={{ color: org.primary_color }}>
                          {selectedMember.full_name.substring(0, 2).toUpperCase()}
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-bold text-white tracking-tight">
                      {selectedMember.full_name}
                    </h3>
                    <p className="text-xs font-semibold mt-0.5" style={{ color: org.primary_color }}>
                      {selectedMember.role || "Executive Member"}
                    </p>
                    <p className="text-[10px] text-zinc-500 uppercase tracking-wider">
                      {selectedMember.department || "Corporate"}
                    </p>

                    {/* Campos Personalizados */}
                    {fieldsToShowOnCard.length > 0 && selectedMember.extra && (
                      <div className="mt-3 pt-2 border-t border-zinc-800 text-[10px] space-y-0.5 text-zinc-400">
                        {fieldsToShowOnCard.map((f) => {
                          const val = selectedMember.extra?.[f.key];
                          if (!val) return null;
                          return (
                            <div key={f.key} className="flex justify-between px-2">
                              <span className="text-zinc-500">{f.label}:</span>
                              <span className="font-semibold text-zinc-200">{val}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* QR Code com borda clara */}
                    {qrCodeDataUrl && (
                      <div className="mx-auto my-3 h-24 w-24 rounded-xl border border-zinc-700 p-1 flex items-center justify-center bg-white shadow-md">
                        <img src={qrCodeDataUrl} alt="QR Validação" className="h-full w-full" />
                      </div>
                    )}

                    <div className="flex justify-between items-center text-[10px] font-mono text-zinc-500 border-t border-zinc-800 pt-2">
                      <span>PASS: #{selectedMember.code}</span>
                      <span
                        className={`font-bold ${
                          selectedMember.status === "active" ? "text-emerald-400" : "text-red-400"
                        }`}
                      >
                        ● {selectedMember.status === "active" ? "VERIFIED" : "INACTIVE"}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Ações do Crachá */}
              <div className="flex gap-2 w-72">
                <button
                  type="button"
                  onClick={downloadBadgePng}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 py-2 text-xs font-semibold text-white shadow-sm transition"
                >
                  <Download className="h-3.5 w-3.5" />
                  Baixar PNG (Alta Resolução)
                </button>
                <a
                  href={getValidationUrl(selectedMember.code)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 px-3 py-2 text-xs font-semibold text-zinc-700 shadow-sm transition"
                  title="Abrir página pública de validação"
                >
                  <Eye className="h-3.5 w-3.5" />
                  Ver Página
                </a>
              </div>
            </>
          ) : (
            <div className="w-72 rounded-xl border border-dashed border-zinc-300 p-8 text-center text-xs text-zinc-400 bg-white">
              Selecione ou cadastre um membro para visualizar o crachá oficial.
            </div>
          )}
        </div>
      </div>

      {/* MODAL DE CRIAÇÃO / EDIÇÃO DE MEMBRO */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl border border-zinc-200 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
              <div>
                <h2 className="text-base font-bold text-zinc-900">
                  {editingMember ? "Editar Membro" : "Novo Membro da Equipe"}
                </h2>
                <p className="text-xs text-zinc-500">
                  Insira os dados cadastrais, foto e campos específicos desta credencial.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMember} className="mt-4 space-y-4">
              {/* Foto do Membro */}
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Foto do Membro
                </label>
                <div className="flex items-center gap-3">
                  <div className="h-16 w-16 rounded-full border border-zinc-200 bg-zinc-50 flex items-center justify-center overflow-hidden shrink-0 shadow-2xs">
                    {photoUrl ? (
                      <img src={photoUrl} alt="Preview" className="h-full w-full object-cover" />
                    ) : (
                      <Camera className="h-6 w-6 text-zinc-400" />
                    )}
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="block w-full text-[11px] text-zinc-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-[11px] file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                    />
                    <input
                      type="url"
                      value={photoUrl.startsWith("data:") ? "" : photoUrl}
                      onChange={(e) => setPhotoUrl(e.target.value)}
                      placeholder="Ou cole a URL direta da foto (https://...)"
                      className="w-full rounded border border-zinc-200 px-2 py-1 text-xs text-zinc-700 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Dados Básicos */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Ex: Dra. Juliana Silveira"
                    className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs text-zinc-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">Cargo / Função</label>
                  <input
                    type="text"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    placeholder="Ex: Advogada Associada"
                    className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs text-zinc-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">Setor / Departamento</label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="Ex: Direito Civil"
                    className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs text-zinc-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">Matrícula / Inscrição</label>
                  <input
                    type="text"
                    value={registration}
                    onChange={(e) => setRegistration(e.target.value)}
                    placeholder="Ex: 248.910"
                    className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs text-zinc-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">Validade da Credencial</label>
                  <input
                    type="date"
                    value={validUntil}
                    onChange={(e) => setValidUntil(e.target.value)}
                    className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs text-zinc-900 focus:outline-none"
                  />
                </div>
              </div>

              {/* Contato (WhatsApp e Email) */}
              <div className="grid gap-3 sm:grid-cols-2 pt-1 border-t border-zinc-100">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1 flex items-center gap-1">
                    <Phone className="h-3 w-3 text-emerald-600" /> WhatsApp / Telefone
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Ex: 11999998888"
                    className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs text-zinc-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1 flex items-center gap-1">
                    <Mail className="h-3 w-3 text-blue-600" /> E-mail
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="membro@empresa.com"
                    className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs text-zinc-900 focus:outline-none"
                  />
                </div>
              </div>

              {/* Campos Personalizados (Definidos na Organização) */}
              {Array.isArray(org.card_fields) && org.card_fields.length > 0 && (
                <div className="pt-2 border-t border-zinc-100 space-y-2">
                  <h4 className="text-xs font-bold uppercase text-zinc-700 flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-blue-600" />
                    Campos Específicos da Equipe
                  </h4>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {org.card_fields.map((f) => (
                      <div key={f.key}>
                        <label className="block text-[11px] font-semibold text-zinc-600 mb-0.5">
                          {f.label}
                        </label>
                        <input
                          type="text"
                          value={extraFields[f.key] || ""}
                          onChange={(e) =>
                            setExtraFields({ ...extraFields, [f.key]: e.target.value })
                          }
                          placeholder={`Digite ${f.label.toLowerCase()}`}
                          className="w-full rounded border border-zinc-300 bg-white px-2.5 py-1.5 text-xs text-zinc-900 focus:outline-none"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Status */}
              <div className="pt-2 border-t border-zinc-100 flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-700">Status da Credencial</span>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-bold text-zinc-800"
                >
                  <option value="active">● Ativa & Válida</option>
                  <option value="suspended">● Suspensa</option>
                </select>
              </div>

              {/* Ações */}
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
                  {isSaving ? "Salvando..." : editingMember ? "Salvar Alterações" : "Cadastrar Membro"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
