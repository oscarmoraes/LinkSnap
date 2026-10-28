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
    .select("id, handle, full_name")
    .eq("handle", params.handle.toLowerCase())
    .single();

  if (!profile) return { title: "Perfil não encontrado" };

  const { data: page } = await supabase
    .from("bio_pages")
    .select("title, description")
    .eq("user_id", profile.id)
    .eq("slug", params.slug.toLowerCase())
    .single();

  return {
    title: `${page?.title || profile.full_name || params.handle} — LinkSnap Bio`,
    description: page?.description || "Links oficiais, produtos, Pix e canais de contato.",
  };
}

export default async function PublicBioSlugPage({
  params,
}: {
  params: { handle: string; slug: string };
}) {
  const supabase = getSupabase();

  // 1. Busca perfil pelo handle
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, handle, full_name, avatar_url")
    .eq("handle", params.handle.toLowerCase())
    .single();

  if (!profile) notFound();

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

  const avatar = page.avatar_url || profile.avatar_url;

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-between p-4 sm:p-6 antialiased transition-colors"
      style={{
        backgroundColor: theme.bg || "#FFFFFF",
        color: theme.text || "#111827",
      }}
    >
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

      {!theme.hideBranding && (
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
