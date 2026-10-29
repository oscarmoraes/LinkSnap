import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    "placeholder-anon-key";

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: "" });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({ name, value: "", ...options, maxAge: 0 });
        },
      },
    }
  );

  // 1. Roteamento Multi-Tenant de Domínios Customizados (Plano PRO)
  const testHost = request.nextUrl.searchParams.get("__test_host");
  const host = (testHost || request.headers.get("x-forwarded-host") || request.headers.get("host") || "")
    .toLowerCase()
    .split(":")[0];

  const isSystemHost =
    !host ||
    host === "localhost" ||
    host === "127.0.0.1" ||
    host === "linksnap.com.br" ||
    host === "linksnap-xi.vercel.app" ||
    host.endsWith(".vercel.app");

  if (!isSystemHost) {
    // É uma requisição vinda de um domínio próprio do cliente
    try {
      const { data: customDomain } = await supabase
        .from("custom_domains")
        .select(`
          id,
          domain,
          target_id,
          user_id,
          bio_pages!target_id (
            slug,
            profiles (
              handle
            )
          )
        `)
        .eq("domain", host)
        .eq("status", "active")
        .maybeSingle();

      if (customDomain) {
        let handle = "";
        let slug = "";

        const bp: any = customDomain.bio_pages;
        if (bp) {
          slug = bp.slug;
          handle = bp.profiles?.handle;
        }

        // Se target_id não estava setado, busca a bio primária do dono do domínio
        if (!handle || !slug) {
          const { data: primaryBio } = await supabase
            .from("bio_pages")
            .select("slug, profiles(handle)")
            .eq("user_id", customDomain.user_id)
            .eq("is_primary", true)
            .maybeSingle();

          if (primaryBio) {
            slug = primaryBio.slug;
            // @ts-ignore
            handle = primaryBio.profiles?.handle;
          }
        }

        const pathname = request.nextUrl.pathname;

        // Se for a raiz do domínio customizado, reescreve diretamente para a Bio pública do cliente!
        if (pathname === "/" || pathname === "") {
          if (handle && slug) {
            const rewriteUrl = request.nextUrl.clone();
            rewriteUrl.pathname = `/b/${handle}/${slug}`;
            return NextResponse.rewrite(rewriteUrl);
          }
        } else {
          // Se for um link encurtado próprio (ex: /whatsapp, /promo, /ebook)
          // Se for uma rota do sistema ou rotas públicas especiais (carteirinhas /c/ ou bio /b/)
          const isSystemSubpath =
            pathname.startsWith("/_next") ||
            pathname.startsWith("/api") ||
            pathname.startsWith("/c/") ||
            pathname.startsWith("/b/") ||
            pathname.startsWith("/favicon.ico") ||
            pathname.startsWith("/robots.txt") ||
            pathname.startsWith("/sitemap.xml");

          if (!isSystemSubpath) {
            const pathSlug = pathname.replace(/^\/+/, "").split("/")[0];
            if (pathSlug) {
              const rewriteUrl = request.nextUrl.clone();
              rewriteUrl.pathname = `/r/_d/${customDomain.id}/${pathSlug}`;
              return NextResponse.rewrite(rewriteUrl);
            }
          }
        }
      }
    } catch (domainErr) {
      console.warn("Erro ao processar roteamento de domínio customizado:", domainErr);
    }
  }

  // 2. Autenticação e Proteção do Dashboard
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Proteção da rota /dashboard
  if (request.nextUrl.pathname.startsWith("/dashboard") && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirectedFrom", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  // Se já estiver logado e tentar acessar /login, manda para /dashboard
  if (request.nextUrl.pathname.startsWith("/login") && user) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return response;
}
