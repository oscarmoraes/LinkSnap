import { createClient } from "@/utils/supabase/server";
import { headers } from "next/headers";
import WhatsAppToolClient from "@/components/WhatsAppToolClient";

export const dynamic = "force-dynamic";

export default async function WhatsAppToolPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const [{ data: items }, { data: profile }] = await Promise.all([
    supabase
      .from("tool_items")
      .select("id, name, payload, link_id, created_at")
      .eq("user_id", user.id)
      .eq("type", "whatsapp")
      .order("created_at", { ascending: false }),
    supabase
      .from("profiles")
      .select("handle")
      .eq("id", user.id)
      .single(),
  ]);

  const headersList = headers();
  const host = headersList.get("host") || "localhost:3000";
  const protocol = headersList.get("x-forwarded-proto") || "http";
  const origin = `${protocol}://${host}`;

  const userHandle = profile?.handle || user.email?.split("@")[0] || "user";

  return (
    <WhatsAppToolClient
      initialItems={items || []}
      userId={user.id}
      userHandle={userHandle}
      origin={origin}
    />
  );
}
