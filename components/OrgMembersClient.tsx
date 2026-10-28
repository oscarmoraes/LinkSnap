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
  UserCheck,
  Check,
  QrCode,
  X,
  FileSpreadsheet,
  AlertCircle,
  Eye,
} from "lucide-react";

interface MemberItem {
  id: string;
  code: string;
  full_name: string;
  role: string | null;
  department: string | null;
  registration: string | null;
  photo_url: string | null;
  valid_until: string | null;
  status: string;
}

interface OrgData {
  id: string;
  slug: string;
  name: string;
  logo_url: string | null;
  primary_color: string;
  card_template: string;
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
  const [isAdding, setIsAdding] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [selectedMember, setSelectedMember] = useState<MemberItem | null>(
    initialMembers[0] || null
  );
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");
  const badgeRef = useRef<HTMLDivElement>(null);

  // Form de novo membro
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [dept, setDept] = useState("");
  const [reg, setReg] = useState("");
  const [validUntil, setValidUntil] = useState("");

  // Atualiza QR Code do membro selecionado
  useEffect(() => {
    if (selectedMember) {
      const verifyUrl = `${origin}/c/${org.slug}/${selectedMember.code}`;
      QRCode.toDataURL(verifyUrl, { width: 260, margin: 1 })
        .then(setQrCodeDataUrl)
        .catch(() => {});
    }
  }, [selectedMember, org.slug, origin]);

  const handleCreateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const code = Math.random().toString(36).substring(2, 8).toUpperCase();

    try {
      const { data, error } = await supabase
        .from("card_members")
        .insert({
          org_id: org.id,
          code,
          full_name: name.trim(),
          role: role.trim() || null,
          department: dept.trim() || null,
          registration: reg.trim() || null,
          valid_until: validUntil || null,
          status: "active",
        })
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setMembers([data, ...members]);
        setSelectedMember(data);
        setName("");
        setRole("");
        setDept("");
        setReg("");
        setValidUntil("");
        setIsAdding(false);
      }
    } catch (err: any) {
      alert("Erro ao adicionar membro: " + err.message);
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

        const newMembers = rows.map((row) => ({
          org_id: org.id,
          code: Math.random().toString(36).substring(2, 8).toUpperCase(),
          full_name: row.nome || row.name || row.Nome || "Membro",
          role: row.cargo || row.role || row.Cargo || null,
          department: row.setor || row.department || row.Setor || null,
          registration: row.matricula || row.registration || row.Matricula || null,
          status: "active",
        }));

        try {
          const { data, error } = await supabase
            .from("card_members")
            .insert(newMembers)
            .select();

          if (error) throw error;
          if (data) {
            setMembers([...data, ...members]);
            alert(`${data.length} membros importados com sucesso!`);
            setIsImporting(false);
          }
        } catch (err: any) {
          alert("Erro ao importar CSV: " + err.message);
        }
      },
    });
  };

  const handleDeleteMember = async (id: string) => {
    if (!confirm("Remover este membro?")) return;
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

  const downloadBadgePng = async () => {
    if (!badgeRef.current || !selectedMember) return;
    try {
      const dataUrl = await toPng(badgeRef.current, { cacheBust: true, pixelRatio: 2 });
      const link = document.createElement("a");
      link.download = `carteirinha-${selectedMember.code}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err: any) {
      alert("Erro ao gerar imagem: " + err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-200 pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/cards"
            className="rounded-lg border border-zinc-200 p-2 text-zinc-600 hover:bg-zinc-100"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-zinc-900 flex items-center gap-2">
              {org.name}
              <span
                className="h-3 w-3 rounded-full border border-black/10"
                style={{ backgroundColor: org.primary_color }}
              ></span>
            </h1>
            <p className="font-mono text-xs text-blue-600">/c/{org.slug}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsImporting(!isImporting)}
            className="flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 px-3 py-2 text-xs font-semibold text-zinc-700 shadow-sm"
          >
            <Upload className="h-3.5 w-3.5 text-zinc-500" />
            Importar CSV
          </button>
          <button
            onClick={() => setIsAdding(!isAdding)}
            className="flex items-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 px-3.5 py-2 text-xs font-semibold text-white shadow-sm"
          >
            <Plus className="h-3.5 w-3.5" />
            Adicionar Membro
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
            Envie uma planilha CSV contendo as colunas: <code>nome</code>, <code>cargo</code>, <code>setor</code>, <code>matricula</code>.
          </p>
          <input
            type="file"
            accept=".csv"
            onChange={handleCsvUpload}
            className="block w-full text-xs text-zinc-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer"
          />
        </div>
      )}

      {/* Form de Novo Membro */}
      {isAdding && (
        <form
          onSubmit={handleCreateMember}
          className="rounded-xl border border-blue-200 bg-blue-50/40 p-5 space-y-3 animate-in fade-in"
        >
          <h3 className="text-xs font-bold uppercase text-blue-900">Novo Membro da Equipe</h3>
          <div className="grid gap-3 sm:grid-cols-4">
            <div>
              <label className="block text-[11px] font-semibold text-zinc-700 mb-1">Nome Completo *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Carlos Santos"
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs text-zinc-900 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-zinc-700 mb-1">Cargo / Função</label>
              <input
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="Ex: Desenvolvedor Senior"
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs text-zinc-900 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-zinc-700 mb-1">Setor / Departamento</label>
              <input
                type="text"
                value={dept}
                onChange={(e) => setDept(e.target.value)}
                placeholder="Ex: Engenharia"
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs text-zinc-900 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-zinc-700 mb-1">Matrícula / ID</label>
              <input
                type="text"
                value={reg}
                onChange={(e) => setReg(e.target.value)}
                placeholder="Ex: 2026-99"
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs text-zinc-900 focus:outline-none"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs text-zinc-600 hover:bg-zinc-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="rounded-lg bg-blue-600 hover:bg-blue-700 px-4 py-1.5 text-xs font-semibold text-white shadow-sm"
            >
              Cadastrar Membro
            </button>
          </div>
        </form>
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
                  <th className="px-4 py-3">Cargo/Setor</th>
                  <th className="px-4 py-3 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {members.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-zinc-400">
                      Nenhum membro cadastrado ainda nesta equipe.
                    </td>
                  </tr>
                ) : (
                  members.map((m) => (
                    <tr
                      key={m.id}
                      onClick={() => setSelectedMember(m)}
                      className={`cursor-pointer transition ${
                        selectedMember?.id === m.id ? "bg-blue-50/60" : "hover:bg-zinc-50"
                      }`}
                    >
                      <td className="px-4 py-3">
                        <p className="font-bold text-zinc-900">{m.full_name}</p>
                        <p className="text-[11px] text-zinc-400">Matrícula: {m.registration || "—"}</p>
                      </td>
                      <td className="px-4 py-3 font-mono font-bold text-blue-600">{m.code}</td>
                      <td className="px-4 py-3 text-zinc-600">
                        {m.role || "Membro"} {m.department ? `• ${m.department}` : ""}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteMember(m.id);
                          }}
                          className="rounded p-1 text-zinc-400 hover:text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* PREVIEW DO CRACHÁ / CARTEIRINHA (5 Colunas) */}
        <div className="lg:col-span-5 sticky top-4 flex flex-col items-center space-y-4">
          {selectedMember ? (
            <>
              {/* Card Imprimível */}
              <div
                ref={badgeRef}
                className="w-72 rounded-2xl border-2 border-zinc-200 bg-white p-5 shadow-xl text-center relative overflow-hidden"
              >
                {/* Faixa Superior com cor da Equipe */}
                <div
                  className="absolute top-0 left-0 right-0 h-3"
                  style={{ backgroundColor: org.primary_color }}
                ></div>

                <div className="pt-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                    {org.name}
                  </span>

                  <div
                    className="mx-auto my-3 h-20 w-20 rounded-full border-2 bg-zinc-100 flex items-center justify-center font-bold text-2xl shadow-sm overflow-hidden"
                    style={{ borderColor: org.primary_color, color: org.primary_color }}
                  >
                    {selectedMember.photo_url ? (
                      <img src={selectedMember.photo_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      selectedMember.full_name.substring(0, 2).toUpperCase()
                    )}
                  </div>

                  <h3 className="text-base font-bold text-zinc-900">{selectedMember.full_name}</h3>
                  <p className="text-xs font-semibold" style={{ color: org.primary_color }}>
                    {selectedMember.role || "Membro"}
                  </p>
                  <p className="text-[11px] text-zinc-500">{selectedMember.department || "Geral"}</p>

                  {/* QR Code de Validação Oficial */}
                  {qrCodeDataUrl && (
                    <div className="mx-auto my-3 h-28 w-28 rounded-xl border border-zinc-200 p-1 flex items-center justify-center bg-white shadow-sm">
                      <img src={qrCodeDataUrl} alt="QR Validação" className="h-full w-full" />
                    </div>
                  )}

                  <div className="flex justify-between items-center text-[10px] font-mono text-zinc-400 border-t border-zinc-200 pt-2">
                    <span>ID: {selectedMember.code}</span>
                    <span className="font-bold text-emerald-600">● VÁLIDO</span>
                  </div>
                </div>
              </div>

              {/* Ações do Crachá */}
              <div className="flex gap-2 w-72">
                <button
                  type="button"
                  onClick={downloadBadgePng}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 py-2 text-xs font-semibold text-white shadow-sm transition"
                >
                  <Download className="h-3.5 w-3.5" />
                  Baixar PNG
                </button>
                <a
                  href={`${origin}/c/${org.slug}/${selectedMember.code}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 px-3 py-2 text-xs font-semibold text-zinc-700 shadow-sm"
                >
                  <Eye className="h-3.5 w-3.5" />
                  Ver
                </a>
              </div>
            </>
          ) : (
            <div className="w-72 rounded-xl border border-dashed border-zinc-300 p-8 text-center text-xs text-zinc-400">
              Selecione ou cadastre um membro para visualizar o crachá.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
