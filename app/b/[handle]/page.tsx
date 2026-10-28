import { notFound, redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
  return createClient(url, key, {
    auth: { persistSession: false },
    global: {
      fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }),
    },
  });
}

export default async function PublicBioHandlePage({
  params,
}: {
  params: { handle: string };
}) {
  const supabase = getSupabase();

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, handle")
    .eq("handle", params.handle.toLowerCase())
    .single();

  if (!profile) notFound();

  // Busca a bio primária ou a primeira bio ativa
  let { data: primaryBio } = await supabase
    .from("bio_pages")
    .select("slug")
    .eq("user_id", profile.id)
    .eq("is_primary", true)
    .eq("is_active", true)
    .single();

  if (!primaryBio) {
    const { data: firstBio } = await supabase
      .from("bio_pages")
      .select("slug")
      .eq("user_id", profile.id)
      .eq("is_active", true)
      .order("created_at", { ascending: true })
      .limit(1)
      .single();
    primaryBio = firstBio;
  }

  if (primaryBio) {
    redirect(`/b/${profile.handle}/${primaryBio.slug}`);
  }

  notFound();
}
