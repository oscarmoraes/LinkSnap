import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";

// 1. Listar domínios do usuário logado
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { data: domains, error } = await supabase
      .from("custom_domains")
      .select("id, domain, target_type, target_id, status, verification_token, ssl_status, created_at, bio_pages(id, title, slug)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ domains: domains || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// 2. Adicionar novo domínio customizado
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Verifica o plano do usuário
    const { data: profile } = await supabase
      .from("profiles")
      .select("plan_tier")
      .eq("id", user.id)
      .single();

    const planTier = profile?.plan_tier || "free";
    if (planTier !== "pro" && planTier !== "enterprise") {
      return NextResponse.json(
        {
          error:
            "Domínios próprios personalizados são um recurso exclusivo dos planos PRO e Business. Faça o upgrade para conectar seu domínio.",
        },
        { status: 403 }
      );
    }

    // Verifica limite de domínios por plano
    const { count } = await supabase
      .from("custom_domains")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id);

    const maxDomains = planTier === "enterprise" ? 5 : 1;
    if ((count || 0) >= maxDomains) {
      return NextResponse.json(
        {
          error: `Você atingiu o limite de ${maxDomains} domínio(s) do seu plano atual (${planTier.toUpperCase()}).`,
        },
        { status: 400 }
      );
    }

    const body = await request.json();
    let rawDomain = (body.domain || "").trim().toLowerCase();

    // Sanitização e validação de domínio
    rawDomain = rawDomain.replace(/^https?:\/\//, "").replace(/\/.*$/, "");

    const domainRegex = /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
    if (!domainRegex.test(rawDomain)) {
      return NextResponse.json(
        { error: "Formato de domínio inválido. Exemplo: links.minhamarca.com.br" },
        { status: 400 }
      );
    }

    // Não permitir conectar os próprios domínios do sistema
    if (
      rawDomain === "linksnap.com.br" ||
      rawDomain.endsWith(".vercel.app") ||
      rawDomain === "localhost"
    ) {
      return NextResponse.json(
        { error: "Este domínio é reservado pelo sistema." },
        { status: 400 }
      );
    }

    const targetId = body.targetId || null;

    const { data: newDomain, error } = await supabase
      .from("custom_domains")
      .insert({
        user_id: user.id,
        domain: rawDomain,
        target_type: "bio",
        target_id: targetId,
        status: "pending",
        ssl_status: "initializing",
      })
      .select("id, domain, target_type, target_id, status, verification_token, ssl_status, created_at")
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "Este domínio já está cadastrado no sistema por outro workspace." },
          { status: 409 }
        );
      }
      throw error;
    }

    return NextResponse.json({ success: true, domain: newDomain });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// 3. Atualizar destino do domínio (ex: trocar bio page)
export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { domainId, targetId } = body;

    if (!domainId) {
      return NextResponse.json({ error: "domainId obrigatório" }, { status: 400 });
    }

    const { error } = await supabase
      .from("custom_domains")
      .update({
        target_id: targetId || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", domainId)
      .eq("user_id", user.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// 4. Excluir domínio
export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const domainId = searchParams.get("domainId");

    if (!domainId) {
      return NextResponse.json({ error: "domainId obrigatório" }, { status: 400 });
    }

    const { error } = await supabase
      .from("custom_domains")
      .delete()
      .eq("id", domainId)
      .eq("user_id", user.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
