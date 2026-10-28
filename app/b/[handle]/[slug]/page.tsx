import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { BadgeCheck } from "lucide-react";
import type { Metadata } from "next";
import PublicBioClient, { PublicBioBlock, PublicBioTheme } from "@/components/PublicBioClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
  return createClient(url, key, {
    auth: { persistSession: false },
    global: {
      fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }),
    },
  });
}

export async function generateMetadata({
  params,
}: {
  params: { handle: string; slug: string };
}): Promise<Metadata> {
  const supabase = getSupabase();
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, handle, full_name, avatar_url")
    .eq("handle", params.handle.toLowerCase())
    .single();

  if (!profile) return { title: "Perfil não encontrado — LinkSnap" };

  const { data: page } = await supabase
    .from("bio_pages")
    .select("title, description, avatar_url")
    .eq("user_id", profile.id)
    .eq("slug", params.slug.toLowerCase())
    .single();

  const title = page?.title || profile.full_name || `@${params.handle}`;
  const description =
    page?.description ||
    `Conheça os links oficiais, Pix e catálogo de @${profile.handle} no LinkSnap.`;

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://linksnap-xi.vercel.app";
  const ogImageUrl = `${baseUrl}/api/og/bio?handle=${params.handle.toLowerCase()}&slug=${params.slug.toLowerCase()}`;
  const bioUrl = `${baseUrl}/b/${params.handle.toLowerCase()}/${params.slug.toLowerCase()}`;

  return {
    title: `${title} — LinkSnap Bio`,
    description,
    openGraph: {
      title: `${title} — LinkSnap Bio`,
      description,
      url: bioUrl,
      siteName: "LinkSnap",
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: `${title} no LinkSnap`,
        },
      ],
      locale: "pt_BR",
      type: "profile",
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} — LinkSnap Bio`,
      description,
      images: [ogImageUrl],
    },
  };
}

export default async function PublicBioSlugPage({
  params,
}: {
  params: { handle: string; slug: string };
}) {
  const supabase = getSupabase();

  // 1. Busca perfil pelo handle com plano
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, handle, full_name, avatar_url, plan_tier")
    .eq("handle", params.handle.toLowerCase())
    .single();

  if (!profile) notFound();

  const isPro = profile.plan_tier === "pro" || profile.plan_tier === "enterprise";

  // 2. Busca bio_page pelo slug
  const { data: page } = await supabase
    .from("bio_pages")
    .select("*")
    .eq("user_id", profile.id)
    .eq("slug", params.slug.toLowerCase())
    .eq("is_active", true)
    .single();

  if (!page) notFound();

  // 3. Incrementa visualização assincronamente
  supabase
    .from("bio_pages")
    .update({ views: Number(page.views || 0) + 1 })
    .eq("id", page.id)
    .then(() => {});

  // 4. Busca blocos ativos
  const { data: rawBlocks } = await supabase
    .from("bio_blocks")
    .select("id, type, data, position")
    .eq("bio_page_id", page.id)
    .eq("is_active", true)
    .order("position", { ascending: true });

  // 5. Filtra blocos agendados (start_at no futuro ou end_at no passado são ocultados automaticamente)
  const now = new Date();
  const visibleBlocks: PublicBioBlock[] = (rawBlocks || []).filter((b: any) => {
    const d = b.data || {};
    if (d.start_at) {
      const start = new Date(d.start_at);
      if (!isNaN(start.getTime()) && start > now) return false;
    }
    if (d.end_at) {
      const end = new Date(d.end_at);
      if (!isNaN(end.getTime()) && end < now) return false;
    }
    return true;
  });

  const theme: PublicBioTheme = page.theme || {
    bg: "#FFFFFF",
    text: "#111827",
    cardBg: "#F4F4F5",
    cardText: "#18181B",
    accent: "#2563EB",
    verified: false,
    hideBranding: false,
  };

  // Trava de White-Label: só oculta a marca se o criador for PRO ou Enterprise
  const hideBranding = isPro && Boolean(page.hide_branding || theme.hideBranding);

  const avatar = page.avatar_url || profile.avatar_url;

  // Sanitizar IDs de rastreamento
  const cleanPixelId = isPro && page.meta_pixel_id ? page.meta_pixel_id.replace(/[^a-zA-Z0-9_-]/g, "") : null;
  const cleanGtmId = isPro && page.gtm_id ? page.gtm_id.replace(/[^a-zA-Z0-9_-]/g, "") : null;

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-between p-4 sm:p-6 antialiased transition-colors"
      style={{
        backgroundColor: theme.bg || "#FFFFFF",
        color: theme.text || "#111827",
      }}
    >
      {/* Injeção de Meta (Facebook) Pixel */}
      {cleanPixelId && (
        <script
          dangerouslySetInnerHTML={{
            __html: `
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '${cleanPixelId}');
              fbq('track', 'PageView');
            `,
          }}
        />
      )}

      {/* Injeção de Google Tag Manager (GTM) */}
      {cleanGtmId && (
        <>
          <script
            dangerouslySetInnerHTML={{
              __html: `
                (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
                new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
                j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
                'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
                })(window,document,'script','dataLayer','${cleanGtmId}');
              `,
            }}
          />
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${cleanGtmId}`}
              height="0"
              width="0"
              style={{ display: "none", visibility: "hidden" }}
            />
          </noscript>
        </>
      )}
      <div className="w-full max-w-md mx-auto pt-8 pb-12 flex flex-col items-center">
        {/* Avatar */}
        <div className="relative">
          <div
            className="h-24 w-24 rounded-full border-2 flex items-center justify-center font-bold text-2xl shadow-md overflow-hidden"
            style={{
              borderColor: theme.accent || "#2563EB",
              backgroundColor: theme.cardBg || "#F4F4F5",
              color: theme.accent || "#2563EB",
            }}
          >
            {avatar ? (
              <img src={avatar} alt="" className="h-full w-full object-cover" />
            ) : (
              (page.title || profile.full_name || params.handle)
                .substring(0, 2)
                .toUpperCase()
            )}
          </div>
        </div>

        {/* Nome & Selo Verificado Azul */}
        <div className="mt-4 flex items-center justify-center gap-1.5">
          <h1 className="text-xl font-bold tracking-tight text-center">
            {page.title}
          </h1>
          {theme.verified && (
            <BadgeCheck
              className="h-5 w-5 shrink-0 text-blue-500 fill-blue-500/15"
              aria-label="Conta Verificada"
            />
          )}
        </div>

        <p className="font-mono text-xs opacity-75 mt-0.5">@{profile.handle}</p>

        {page.description && (
          <p className="mt-2 text-xs opacity-80 text-center max-w-xs leading-relaxed">
            {page.description}
          </p>
        )}

        {/* Lista de Blocos Interativos (Vitrine, Pix QR Code, Lead Form, WhatsApp, Links) */}
        <PublicBioClient
          pageId={page.id}
          userId={profile.id}
          pageTitle={page.title}
          layout={page.layout || "classic"}
          theme={theme}
          blocks={visibleBlocks}
        />
      </div>

      {!hideBranding && (
        <footer className="py-4 text-center">
          <a
            href="/"
            className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white/90 px-3.5 py-1.5 text-[11px] font-medium text-zinc-700 shadow-sm hover:text-zinc-900 transition"
          >
            <span className="grid h-4 w-4 place-items-center rounded bg-blue-600 text-[9px] font-bold text-white">
              L
            </span>
            Criado com <strong>LinkSnap</strong>
          </a>
        </footer>
      )}
    </div>
  );
}
