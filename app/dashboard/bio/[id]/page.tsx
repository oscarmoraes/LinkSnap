import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import BioEditorClient from "@/components/BioEditorClient";

export const dynamic = "force-dynamic";

export default async function BioEditorPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [profileRes, pageRes, blocksRes, leadsRes] = await Promise.all([
    supabase.from("profiles").select("handle").eq("id", user.id).single(),
    supabase
      .from("bio_pages")
      .select("*")
      .eq("id", params.id)
      .eq("user_id", user.id)
      .single(),
    supabase
      .from("bio_blocks")
      .select("id, type, data, position, clicks")
      .eq("bio_page_id", params.id)
      .order("position", { ascending: true }),
    supabase
      .from("bio_leads")
      .select("id, name, contact, message, created_at")
      .eq("bio_page_id", params.id)
      .order("created_at", { ascending: false }),
  ]);

  if (!pageRes.data) {
    notFound();
  }

  const handle = profileRes.data?.handle || user.email?.split("@")[0] || "user";

  const headersList = headers();
  const host = headersList.get("host") || "localhost:3000";
  const protocol = headersList.get("x-forwarded-proto") || "http";
  const origin = `${protocol}://${host}`;

  return (
    <BioEditorClient
      initialPage={pageRes.data}
      initialBlocks={blocksRes.data || []}
      initialLeads={leadsRes.data || []}
      handle={handle}
      origin={origin}
    />
  );
}
