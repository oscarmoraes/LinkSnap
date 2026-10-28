import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { domainId } = body;

    if (!domainId) {
      return NextResponse.json({ error: "domainId obrigatório" }, { status: 400 });
    }

    const { data: domainRecord, error: domainError } = await supabase
      .from("custom_domains")
      .select("*")
      .eq("id", domainId)
      .eq("user_id", user.id)
      .single();

    if (domainError || !domainRecord) {
      return NextResponse.json({ error: "Domínio não encontrado" }, { status: 404 });
    }

    const domainName = domainRecord.domain;
    let isVerified = false;
    let reason = "";

    // 1. Consulta CNAME via Google DNS-over-HTTPS
    try {
      const cnameUrl = `https://dns.google/resolve?name=${encodeURIComponent(domainName)}&type=CNAME`;
      const res = await fetch(cnameUrl, { cache: "no-store" });

      if (res.ok) {
        const dnsData = await res.json();
        const answers = dnsData.Answer || [];

        for (const ans of answers) {
          const target = (ans.data || "").toLowerCase().replace(/\.$/, "");
          if (
            target.includes("linksnap-xi.vercel.app") ||
            target.includes("vercel-dns.com") ||
            target.includes("cname.linksnap") ||
            target.includes("vercel.app")
          ) {
            isVerified = true;
            break;
          }
        }
      }
    } catch (dnsErr) {
      console.warn("Erro ao consultar CNAME DNS:", dnsErr);
    }

    // 2. Se Cloudflare Proxy estiver ativo ou mascarando o CNAME, verifica conexão HTTP direta
    if (!isVerified) {
      try {
        const pingRes = await fetch(`https://${domainName}`, {
          method: "HEAD",
          cache: "no-store",
          headers: { "x-linksnap-verify": "true" },
        });
        if (
          pingRes.headers.get("x-vercel-id") ||
          pingRes.headers.get("x-matched-path") ||
          (pingRes.headers.get("server") || "").toLowerCase().includes("vercel")
        ) {
          isVerified = true;
        }
      } catch (pingErr) {
        // Ignora falha temporária de handshake
      }
    }

    // 3. Consulta registro A caso o usuário tenha apontado a raiz para 76.76.21.21
    if (!isVerified) {
      try {
        const aUrl = `https://dns.google/resolve?name=${encodeURIComponent(domainName)}&type=A`;
        const aRes = await fetch(aUrl, { cache: "no-store" });
        if (aRes.ok) {
          const aData = await aRes.json();
          const answers = aData.Answer || [];
          for (const ans of answers) {
            if (ans.data === "76.76.21.21") {
              isVerified = true;
              break;
            }
          }
        }
      } catch (aErr) {
        console.warn("Erro ao consultar registro A DNS:", aErr);
      }
    }

    // 4. Se ainda não respondeu, checa registro TXT de desafio
    if (!isVerified && domainRecord.verification_token) {
      try {
        const challengeHost = `_linksnap-challenge.${domainName}`;
        const txtUrl = `https://dns.google/resolve?name=${encodeURIComponent(challengeHost)}&type=TXT`;
        const res = await fetch(txtUrl, { cache: "no-store" });

        if (res.ok) {
          const dnsData = await res.json();
          const answers = dnsData.Answer || [];

          for (const ans of answers) {
            const txtVal = (ans.data || "").replace(/['"]/g, "").trim();
            if (txtVal === domainRecord.verification_token) {
              isVerified = true;
              break;
            }
          }
        }
      } catch (txtErr) {
        console.warn("Erro ao consultar TXT DNS:", txtErr);
      }
    }

    if (isVerified) {
      // Atualiza status para 'active'
      await supabase
        .from("custom_domains")
        .update({
          status: "active",
          ssl_status: "active",
          updated_at: new Date().toISOString(),
        })
        .eq("id", domainId);

      return NextResponse.json({
        verified: true,
        status: "active",
        message: "Apontamento DNS validado com sucesso! O domínio agora está ativo.",
      });
    } else {
      return NextResponse.json({
        verified: false,
        status: "pending",
        message:
          "O apontamento CNAME ainda não foi detectado pelos servidores DNS globais. A propagação costuma levar de 5 a 30 minutos.",
      });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
