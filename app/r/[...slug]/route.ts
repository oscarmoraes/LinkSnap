import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

function getAdminSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;
  return createSupabaseClient(url, key);
}

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string[] } }
) {
  const slugParts = params.slug;

  if (!slugParts || slugParts.length === 0 || slugParts.length > 2) {
    return new NextResponse("Link não encontrado ou formato inválido.", { status: 404 });
  }

  const supabase = getAdminSupabase();
  if (!supabase) {
    return new NextResponse("Configuração do banco de dados não encontrada.", { status: 500 });
  }

  const referrer = request.headers.get("referer") || null;
  const userAgent = request.headers.get("user-agent") || null;
  const country = request.headers.get("x-vercel-ip-country") || null;

  let device = "desktop";
  if (userAgent) {
    if (/mobile/i.test(userAgent)) device = "mobile";
    else if (/tablet|ipad/i.test(userAgent)) device = "tablet";
  }

  try {
    let longUrl: string | null = null;

    if (slugParts.length === 1) {
      // 1. Link Global: /r/[code]
      const code = slugParts[0];
      if (!/^[A-Za-z0-9_-]{3,32}$/.test(code)) {
        return new NextResponse("Código inválido.", { status: 404 });
      }

      const { data, error } = await supabase.rpc("resolve_and_count_click", {
        p_short_code: code,
        p_referrer: referrer,
        p_country: country,
        p_device: device,
        p_browser: userAgent ? userAgent.substring(0, 60) : null,
      });

      if (!error && data) {
        longUrl = data;
      }
    } else if (slugParts.length === 2) {
      // 2. Link Branded: /r/[handle]/[slug]
      const [handle, slug] = slugParts;
      if (!/^[A-Za-z0-9_-]{3,32}$/.test(handle) || !/^[A-Za-z0-9_-]{3,64}$/.test(slug)) {
        return new NextResponse("Formato inválido para link com marca.", { status: 404 });
      }

      const { data, error } = await supabase.rpc("resolve_branded_click", {
        p_handle: handle,
        p_slug: slug,
        p_referrer: referrer,
        p_country: country,
        p_device: device,
        p_browser: userAgent ? userAgent.substring(0, 60) : null,
      });

      if (!error && data) {
        longUrl = data;
      }
    }

    if (!longUrl || typeof longUrl !== "string") {
      return new NextResponse("Link não encontrado ou inativo.", { status: 404 });
    }

    const destination = new URL(longUrl);
    if (!["http:", "https:"].includes(destination.protocol)) {
      return new NextResponse("Destino inválido.", { status: 400 });
    }

    return NextResponse.redirect(destination.toString(), {
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
