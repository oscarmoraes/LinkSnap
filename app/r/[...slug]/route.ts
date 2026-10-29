import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import crypto from "crypto";

export const dynamic = "force-dynamic";

function getAdminSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;
  return createSupabaseClient(url, key, {
    auth: { persistSession: false },
  });
}

function hashSha256(str: string): string {
  return crypto.createHash("sha256").update(str.trim()).digest("hex");
}

function sanitizeDestinationUrl(rawUrl: string): string {
  if (!rawUrl) return "/";
  const trimmed = rawUrl.trim();
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

function renderHtmlPage({
  title,
  subtitle,
  badge,
  badgeType = "info",
  contentHtml,
}: {
  title: string;
  subtitle?: string;
  badge?: string;
  badgeType?: "info" | "warning" | "error" | "lock";
  contentHtml: string;
}) {
  const badgeColors = {
    info: "background: #EFF6FF; color: #1D4ED8; border: 1px solid #BFDBFE;",
    warning: "background: #FFFBEB; color: #B45309; border: 1px solid #FDE68A;",
    error: "background: #FEF2F2; color: #B91C1C; border: 1px solid #FECACA;",
    lock: "background: #F4F4F5; color: #27272A; border: 1px solid #E4E4E7;",
  };

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title} — LinkSnap</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      background-color: #F8FAFC;
      color: #0F172A;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .card {
      background: #FFFFFF;
      border: 1px solid #E2E8F0;
      border-radius: 20px;
      padding: 36px 32px;
      max-width: 440px;
      width: 100%;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01);
      text-align: center;
    }
    .brand {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 24px;
      text-decoration: none;
      color: #0F172A;
      font-weight: 800;
      font-size: 18px;
    }
    .brand-icon {
      height: 32px;
      width: 32px;
      border-radius: 8px;
      background: #2563EB;
      color: #FFFFFF;
      display: grid;
      place-items: center;
      font-size: 16px;
      font-weight: 900;
    }
    .badge {
      display: inline-flex;
      align-items: center;
      padding: 4px 12px;
      border-radius: 9999px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 16px;
      ${badgeColors[badgeType]}
    }
    h1 {
      font-size: 20px;
      font-weight: 800;
      letter-spacing: -0.5px;
      margin-bottom: 8px;
      color: #0F172A;
    }
    p {
      font-size: 13px;
      line-height: 1.5;
      color: #64748B;
      margin-bottom: 24px;
    }
    .input-group {
      text-align: left;
      margin-bottom: 16px;
    }
    label {
      display: block;
      font-size: 11px;
      font-weight: 700;
      color: #334155;
      margin-bottom: 6px;
    }
    input[type="password"] {
      width: 100%;
      padding: 12px 14px;
      border: 1px solid #CBD5E1;
      border-radius: 10px;
      font-size: 16px;
      background: #FFFFFF;
      color: #0F172A;
      outline: none;
      transition: border-color 0.15s, box-shadow 0.15s;
    }
    input[type="password"]:focus {
      border-color: #2563EB;
      box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
    }
    button {
      width: 100%;
      padding: 12px 16px;
      background: #2563EB;
      color: #FFFFFF;
      border: none;
      border-radius: 10px;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
      transition: background 0.15s;
    }
    button:hover {
      background: #1D4ED8;
    }
    .error-msg {
      background: #FEF2F2;
      border: 1px solid #FECACA;
      color: #B91C1C;
      padding: 10px 14px;
      border-radius: 10px;
      font-size: 12px;
      font-weight: 600;
      margin-bottom: 16px;
      text-align: left;
    }
    .footer {
      margin-top: 24px;
      font-size: 11px;
      color: #94A3B8;
    }
    .footer a {
      color: #64748B;
      text-decoration: none;
      font-weight: 600;
    }
    .footer a:hover {
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <div class="card">
    <a href="/" class="brand">
      <div class="brand-icon">L</div>
      <span>LinkSnap</span>
    </a>
    ${badge ? `<div class="badge">${badge}</div>` : ""}
    <h1>${title}</h1>
    ${subtitle ? `<p>${subtitle}</p>` : ""}
    ${contentHtml}
  </div>
  <div class="footer">
    Plataforma de Links Seguros • <a href="/">LinkSnap</a>
  </div>
</body>
</html>`;
}

async function findLink(slugParts: string[]) {
  const supabase = getAdminSupabase();
  if (!supabase) return { error: "Database offline", link: null };

  if (slugParts.length === 1) {
    const code = slugParts[0];
    const { data: link, error } = await supabase
      .from("links")
      .select("id, user_id, short_code, long_url, title, is_active, link_scope, branded_handle, password_hash, starts_at, expires_at")
      .eq("short_code", code)
      .eq("link_scope", "global")
      .maybeSingle();

    return { link, error };
  } else if (slugParts.length === 2) {
    const [handle, slug] = slugParts;

    // Buscar dono pelo handle
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("handle", handle.toLowerCase())
      .maybeSingle();

    let ownerId = profile?.id;
    if (!ownerId) {
      const { data: history } = await supabase
        .from("handle_history")
        .select("user_id")
        .eq("old_handle", handle.toLowerCase())
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      ownerId = history?.user_id;
    }

    if (!ownerId) {
      return { link: null, error: "Perfil não encontrado" };
    }

    const { data: link, error } = await supabase
      .from("links")
      .select("id, user_id, short_code, long_url, title, is_active, link_scope, branded_handle, password_hash, starts_at, expires_at, custom_domain_id")
      .eq("user_id", ownerId)
      .eq("short_code", slug)
      .eq("link_scope", "branded")
      .maybeSingle();

    return { link, error };
  } else if (slugParts.length === 3 && slugParts[0] === "_d") {
    const [_, domainId, slug] = slugParts;

    // 1. Tenta buscar link explicitamente configurado com este custom_domain_id
    const { data: domainLink } = await supabase
      .from("links")
      .select("id, user_id, short_code, long_url, title, is_active, link_scope, branded_handle, password_hash, starts_at, expires_at, custom_domain_id")
      .eq("custom_domain_id", domainId)
      .eq("short_code", slug)
      .maybeSingle();

    if (domainLink) {
      return { link: domainLink, error: null };
    }

    // 2. Fallback: busca qualquer link ativo pertencente ao dono deste domínio personalizado
    const { data: domainRec } = await supabase
      .from("custom_domains")
      .select("user_id")
      .eq("id", domainId)
      .single();

    if (domainRec?.user_id) {
      const { data: userLink } = await supabase
        .from("links")
        .select("id, user_id, short_code, long_url, title, is_active, link_scope, branded_handle, password_hash, starts_at, expires_at, custom_domain_id")
        .eq("user_id", domainRec.user_id)
        .eq("short_code", slug)
        .maybeSingle();

      if (userLink) {
        return { link: userLink, error: null };
      }
    }

    return { link: null, error: "Link não encontrado neste domínio personalizado" };
  }

  return { link: null, error: "Formato de rota inválido" };
}

async function recordClick(linkId: string, request: NextRequest) {
  const supabase = getAdminSupabase();
  if (!supabase) return;

  const referrer = request.headers.get("referer") || null;
  const userAgent = request.headers.get("user-agent") || null;
  const rawCountry = request.headers.get("x-vercel-ip-country");
  const country = rawCountry ? rawCountry.trim().substring(0, 2).toUpperCase() : null;

  let device = "desktop";
  if (userAgent) {
    if (/mobile/i.test(userAgent)) device = "mobile";
    else if (/tablet|ipad/i.test(userAgent)) device = "tablet";
  }

  try {
    const { data: current } = await supabase
      .from("links")
      .select("clicks")
      .eq("id", linkId)
      .single();

    const newClicks = (Number(current?.clicks) || 0) + 1;
    await supabase
      .from("links")
      .update({ clicks: newClicks, updated_at: new Date().toISOString() })
      .eq("id", linkId);
  } catch (e) {
    console.error("Erro ao atualizar contagem de cliques:", e);
  }

  // Insere clique analítico
  await supabase.from("link_clicks").insert({
    link_id: linkId,
    referrer,
    country_code: country,
    device_type: device,
    browser: userAgent ? userAgent.substring(0, 60) : null,
  });
}

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string[] } }
) {
  const slugParts = params.slug;

  if (!slugParts || slugParts.length === 0 || slugParts.length > 3) {
    return new NextResponse("Link não encontrado ou formato inválido.", { status: 404 });
  }

  try {
    const { link, error } = await findLink(slugParts);

    if (error || !link || !link.is_active) {
      if (slugParts.length === 3 && slugParts[0] === "_d") {
        // Redireciona para a raiz do domínio próprio (a bio do usuário) caso o link não exista
        return NextResponse.redirect(new URL("/", request.url), { status: 302 });
      }

      return new NextResponse(
        renderHtmlPage({
          title: "Link não encontrado",
          subtitle: "O link solicitado não existe, foi desativado ou foi removido pelo criador.",
          badge: "404 Inativo",
          badgeType: "error",
          contentHtml: `<a href="/" style="display:inline-block; padding:10px 18px; background:#2563EB; color:#FFF; border-radius:8px; text-decoration:none; font-size:12px; font-weight:700;">Conhecer o LinkSnap</a>`,
        }),
        { status: 404, headers: { "Content-Type": "text/html; charset=utf-8" } }
      );
    }

    const now = new Date();

    // 1. Verificação de Agendamento (Starts At)
    if (link.starts_at) {
      const startDate = new Date(link.starts_at);
      if (startDate > now) {
        const formatted = startDate.toLocaleString("pt-BR", {
          dateStyle: "long",
          timeStyle: "short",
        });
        return new NextResponse(
          renderHtmlPage({
            title: "Link Agendado",
            badge: "Em Breve",
            badgeType: "info",
            subtitle: `Este link foi agendado pelo criador e estará disponível para acesso a partir de:`,
            contentHtml: `
              <div style="background:#F1F5F9; border:1px solid #CBD5E1; border-radius:12px; padding:14px; font-weight:700; color:#1E293B; margin-bottom:20px; font-size:14px;">
                📅 ${formatted}
              </div>
              <p style="font-size:12px; color:#64748B;">Volte neste endereço na data informada para acessar o conteúdo oficial.</p>
            `,
          }),
          { status: 403, headers: { "Content-Type": "text/html; charset=utf-8" } }
        );
      }
    }

    // 2. Verificação de Expiração (Expires At)
    if (link.expires_at) {
      const expireDate = new Date(link.expires_at);
      if (expireDate < now) {
        const formatted = expireDate.toLocaleString("pt-BR", {
          dateStyle: "long",
          timeStyle: "short",
        });
        return new NextResponse(
          renderHtmlPage({
            title: "Link Expirado",
            badge: "Encerrado",
            badgeType: "warning",
            subtitle: `O período de validade deste link foi encerrado e ele não aceita mais acessos:`,
            contentHtml: `
              <div style="background:#FFFBEB; border:1px solid #FDE68A; border-radius:12px; padding:14px; font-weight:700; color:#92400E; margin-bottom:20px; font-size:14px;">
                ⏳ Expirou em ${formatted}
              </div>
              <p style="font-size:12px; color:#64748B;">Entre em contato com o criador ou responsável pelo link para obter um novo acesso.</p>
            `,
          }),
          { status: 410, headers: { "Content-Type": "text/html; charset=utf-8" } }
        );
      }
    }

    // 3. Verificação de Proteção por Senha
    if (link.password_hash) {
      return new NextResponse(
        renderHtmlPage({
          title: "Acesso Protegido por Senha",
          badge: "Segurança Ativa",
          badgeType: "lock",
          subtitle: `Este link foi protegido pelo criador. Insira a senha autorizada para continuar para o destino.`,
          contentHtml: `
            <form method="POST" action="">
              <div class="input-group">
                <label for="password">Digite a Senha de Acesso</label>
                <input type="password" id="password" name="password" required autofocus placeholder="••••••••" autocomplete="current-password" />
              </div>
              <button type="submit">Desbloquear e Acessar Link ➔</button>
            </form>
          `,
        }),
        { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } }
      );
    }

    // 4. Sem restrições: registra clique e redireciona imediatamente
    await recordClick(link.id, request);

    const destination = sanitizeDestinationUrl(link.long_url);
    return NextResponse.redirect(destination, {
      status: 302,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch (err: any) {
    console.error("Erro no redirecionamento:", err);
    return new NextResponse("Erro ao processar redirecionamento.", { status: 502 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string[] } }
) {
  const slugParts = params.slug;

  if (!slugParts || slugParts.length === 0 || slugParts.length > 3) {
    return new NextResponse("Link não encontrado.", { status: 404 });
  }

  try {
    const { link, error } = await findLink(slugParts);

    if (error || !link || !link.is_active) {
      return new NextResponse("Link não encontrado.", { status: 404 });
    }

    // Ler senha do formulário
    const formData = await request.formData();
    const enteredPassword = (formData.get("password") as string) || "";

    if (!enteredPassword) {
      return new NextResponse(
        renderHtmlPage({
          title: "Acesso Protegido por Senha",
          badge: "Segurança Ativa",
          badgeType: "lock",
          subtitle: "Por favor, informe a senha de acesso.",
          contentHtml: `
            <div class="error-msg">⚠️ A senha não pode ser vazia.</div>
            <form method="POST" action="">
              <div class="input-group">
                <label for="password">Digite a Senha de Acesso</label>
                <input type="password" id="password" name="password" required autofocus placeholder="••••••••" />
              </div>
              <button type="submit">Desbloquear e Acessar Link ➔</button>
            </form>
          `,
        }),
        { status: 400, headers: { "Content-Type": "text/html; charset=utf-8" } }
      );
    }

    const hashed = hashSha256(enteredPassword);

    if (hashed !== link.password_hash) {
      return new NextResponse(
        renderHtmlPage({
          title: "Acesso Protegido por Senha",
          badge: "Segurança Ativa",
          badgeType: "lock",
          subtitle: "Este link foi protegido pelo criador. Insira a senha autorizada para continuar.",
          contentHtml: `
            <div class="error-msg">🔒 Senha incorreta. Verifique e tente novamente.</div>
            <form method="POST" action="">
              <div class="input-group">
                <label for="password">Digite a Senha de Acesso</label>
                <input type="password" id="password" name="password" required autofocus placeholder="••••••••" />
              </div>
              <button type="submit">Desbloquear e Acessar Link ➔</button>
            </form>
          `,
        }),
        { status: 401, headers: { "Content-Type": "text/html; charset=utf-8" } }
      );
    }

    // Senha correta: registra clique e redireciona
    await recordClick(link.id, request);

    const destination = sanitizeDestinationUrl(link.long_url);
    return NextResponse.redirect(destination, {
      status: 303, // 303 See Other garante GET no destino
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch (err: any) {
    console.error("Erro na verificação de senha:", err);
    return new NextResponse("Erro ao verificar senha.", { status: 500 });
  }
}
