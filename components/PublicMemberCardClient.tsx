"use client";

import { useState } from "react";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ShieldCheck,
  Phone,
  Mail,
  UserPlus,
  ExternalLink,
  Building2,
  Calendar,
  CreditCard,
  Hash,
} from "lucide-react";

export interface CardFieldDef {
  key: string;
  label: string;
  showOnCard: boolean;
  showOnValidation: boolean;
}

export interface MemberData {
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
}

export interface OrgData {
  id: string;
  slug: string;
  name: string;
  primary_color: string;
  logo_url: string | null;
  card_fields?: CardFieldDef[] | null;
  card_template?: string | null;
}

export default function PublicMemberCardClient({
  org,
  member,
}: {
  org: OrgData;
  member: MemberData;
}) {
  const [downloadedVCard, setDownloadedVCard] = useState(false);

  // Verificação de Status e Validade
  const today = new Date().toISOString().split("T")[0];
  const isExpired = member.valid_until ? member.valid_until < today : false;
  const isSuspended = member.status === "suspended";
  const isValid = !isSuspended && !isExpired;

  // Sanitização de telefone para WhatsApp
  const cleanPhone = (member.phone || "").replace(/\D/g, "");
  const whatsappUrl = cleanPhone
    ? `https://wa.me/${cleanPhone.length <= 11 ? `55${cleanPhone}` : cleanPhone}`
    : "";

  // Campos personalizados para exibir na validação
  const validationFields = (org.card_fields || []).filter((f) => f.showOnValidation);

  // Geração e Download de vCard (.vcf)
  const handleDownloadVCard = () => {
    const names = member.full_name.trim().split(" ");
    const firstName = names[0] || "";
    const lastName = names.slice(1).join(" ") || "";

    let vcard = "BEGIN:VCARD\r\n";
    vcard += "VERSION:3.0\r\n";
    vcard += `N:${lastName};${firstName};;;\r\n`;
    vcard += `FN:${member.full_name}\r\n`;
    vcard += `ORG:${org.name}\r\n`;
    if (member.role) vcard += `TITLE:${member.role}\r\n`;
    if (member.department) vcard += `X-DEPARTMENT:${member.department}\r\n`;
    if (member.phone) vcard += `TEL;TYPE=CELL,VOICE:${member.phone}\r\n`;
    if (member.email) vcard += `EMAIL;TYPE=INTERNET,PREF:${member.email}\r\n`;
    if (member.photo_url && member.photo_url.startsWith("http")) {
      vcard += `PHOTO;VALUE=URI:${member.photo_url}\r\n`;
    }
    vcard += `NOTE:Credencial Oficial LinkSnap #${member.code} | ${org.name}\r\n`;
    vcard += "END:VCARD\r\n";

    const blob = new Blob([vcard], { type: "text/vcard;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const sanitizedFilename = member.full_name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "-")
      .replace(/-+/g, "-");
    link.download = `${sanitizedFilename}-contato.vcf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setDownloadedVCard(true);
    setTimeout(() => setDownloadedVCard(false), 3000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-100 to-zinc-50 flex flex-col items-center justify-between p-4 sm:p-6 text-zinc-900 antialiased selection:bg-blue-600 selection:text-white">
      <div className="w-full max-w-md mx-auto pt-6 pb-12 space-y-4">
        {/* Card Principal */}
        <div className="rounded-3xl border border-zinc-200/80 bg-white p-6 sm:p-8 shadow-xl text-center relative overflow-hidden backdrop-blur-xs">
          {/* Faixa Superior com cor da Equipe */}
          <div
            className="absolute top-0 left-0 right-0 h-3 shadow-xs"
            style={{ backgroundColor: org.primary_color }}
          />

          {/* Badge de Status Oficial */}
          <div className="pt-2">
            {isValid && (
              <div className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-bold uppercase tracking-wider mb-3 bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                Credencial Ativa & Válida
              </div>
            )}

            {isSuspended && (
              <div className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-bold uppercase tracking-wider mb-3 bg-red-50 text-red-700 border border-red-200 shadow-2xs">
                <XCircle className="h-4 w-4 text-red-600" />
                Credencial Suspensa
              </div>
            )}

            {isExpired && !isSuspended && (
              <div className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-bold uppercase tracking-wider mb-3 bg-amber-50 text-amber-700 border border-amber-200 shadow-2xs">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                Credencial Expirada
              </div>
            )}
          </div>

          {/* Cabeçalho da Organização */}
          <div className="flex items-center justify-center gap-2 mt-1 mb-2">
            {org.logo_url && (
              <img
                src={org.logo_url}
                alt={org.name}
                className="h-6 max-w-[120px] object-contain"
              />
            )}
            <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">
              {org.name}
            </p>
          </div>

          {/* Foto Grande do Membro */}
          <div
            className="mx-auto my-4 h-28 w-28 rounded-full border-3 bg-zinc-100 flex items-center justify-center font-bold text-3xl shadow-md overflow-hidden"
            style={{ borderColor: org.primary_color, color: org.primary_color }}
          >
            {member.photo_url ? (
              <img
                src={member.photo_url}
                alt={member.full_name}
                className="h-full w-full object-cover"
              />
            ) : (
              member.full_name.substring(0, 2).toUpperCase()
            )}
          </div>

          {/* Nome & Cargo */}
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 leading-tight">
            {member.full_name}
          </h1>
          <p className="text-sm font-semibold mt-1" style={{ color: org.primary_color }}>
            {member.role || "Membro da Equipe"}
          </p>
          <p className="text-xs text-zinc-500 mt-0.5">
            {member.department || "Departamento Corporativo"}
          </p>

          {/* Dados Oficiais */}
          <div className="mt-6 rounded-2xl border border-zinc-100 bg-zinc-50/80 p-4 text-left text-xs space-y-2.5">
            <div className="flex justify-between items-center">
              <span className="text-zinc-500 flex items-center gap-1">
                <Hash className="h-3.5 w-3.5 text-zinc-400" /> Código de Validação
              </span>
              <span className="font-mono font-bold text-zinc-900 text-sm">{member.code}</span>
            </div>

            {member.registration && (
              <div className="flex justify-between items-center border-t border-zinc-200/50 pt-2">
                <span className="text-zinc-500 flex items-center gap-1">
                  <CreditCard className="h-3.5 w-3.5 text-zinc-400" /> Matrícula / Registro
                </span>
                <span className="font-semibold text-zinc-900">{member.registration}</span>
              </div>
            )}

            {member.valid_until && (
              <div className="flex justify-between items-center border-t border-zinc-200/50 pt-2">
                <span className="text-zinc-500 flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 text-zinc-400" /> Validade
                </span>
                <span
                  className={`font-semibold ${
                    isExpired ? "text-amber-600 font-bold" : "text-zinc-900"
                  }`}
                >
                  {new Date(member.valid_until + "T00:00:00").toLocaleDateString("pt-BR")}
                </span>
              </div>
            )}

            {/* Campos Dinâmicos (extra) */}
            {validationFields.length > 0 && member.extra && (
              <>
                {validationFields.map((field) => {
                  const val = member.extra?.[field.key];
                  if (!val) return null;
                  return (
                    <div
                      key={field.key}
                      className="flex justify-between items-center border-t border-zinc-200/50 pt-2"
                    >
                      <span className="text-zinc-500">{field.label}</span>
                      <span className="font-semibold text-zinc-900">{val}</span>
                    </div>
                  );
                })}
              </>
            )}
          </div>

          {/* Botões de Ação Rápida (Cartão de Visita Digital) */}
          {isValid && (
            <div className="mt-5 space-y-2 pt-2 border-t border-zinc-100">
              <button
                type="button"
                onClick={handleDownloadVCard}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 py-3 px-4 text-xs font-bold text-white shadow-sm transition active:scale-[0.99]"
              >
                <UserPlus className="h-4 w-4" />
                {downloadedVCard ? "Contato Baixado!" : "Salvar na Agenda (vCard)"}
              </button>

              <div className="grid grid-cols-2 gap-2">
                {whatsappUrl ? (
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 py-2.5 px-3 text-xs font-bold text-emerald-800 transition"
                  >
                    <Phone className="h-3.5 w-3.5 text-emerald-600" />
                    WhatsApp
                  </a>
                ) : (
                  <div className="flex items-center justify-center gap-1.5 rounded-xl border border-zinc-100 bg-zinc-50 py-2.5 px-3 text-xs text-zinc-400">
                    <Phone className="h-3.5 w-3.5 text-zinc-300" />
                    Sem WhatsApp
                  </div>
                )}

                {member.email ? (
                  <a
                    href={`mailto:${member.email}`}
                    className="flex items-center justify-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 py-2.5 px-3 text-xs font-bold text-blue-800 transition"
                  >
                    <Mail className="h-3.5 w-3.5 text-blue-600" />
                    Enviar E-mail
                  </a>
                ) : (
                  <div className="flex items-center justify-center gap-1.5 rounded-xl border border-zinc-100 bg-zinc-50 py-2.5 px-3 text-xs text-zinc-400">
                    <Mail className="h-3.5 w-3.5 text-zinc-300" />
                    Sem E-mail
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Selo Oficial de Autenticidade */}
          <div className="mt-6 pt-4 border-t border-zinc-100 flex items-center justify-center gap-1.5 text-xs text-zinc-400 font-medium">
            <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>Documento oficial com assinatura e autenticidade criptográfica</span>
          </div>
        </div>

        {/* Rodapé White-Label */}
        <div className="text-center text-[11px] text-zinc-400 font-medium space-y-1">
          <p>© {new Date().getFullYear()} {org.name} — Todos os direitos reservados.</p>
          <p className="flex items-center justify-center gap-1 text-zinc-400">
            Powered by{" "}
            <a
              href="https://linksnap.com.br"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-zinc-600 hover:text-blue-600 transition"
            >
              LinkSnap
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
