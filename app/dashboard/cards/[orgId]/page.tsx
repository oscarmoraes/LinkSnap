import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import OrgMembersClient from "@/components/OrgMembersClient";

export const dynamic = "force-dynamic";

export default async function OrgMembersPage({
  params,
}: {
  params: { orgId: string };
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [orgRes, membersRes] = await Promise.all([
    supabase
      .from("organizations")
      .select("id, slug, name, logo_url, primary_color, card_template")
      .eq("id", params.orgId)
      .eq("owner_id", user.id)
      .single(),
    supabase
      .from("card_members")
      .select("id, code, full_name, role, department, registration, photo_url, valid_until, status")
      .eq("org_id", params.orgId)
      .order("created_at", { ascending: false }),
  ]);

  if (!orgRes.data) {
    notFound();
  }

  const headersList = headers();
  const host = headersList.get("host") || "localhost:3000";
  const protocol = headersList.get("x-forwarded-proto") || "http";
  const origin = `${protocol}://${host}`;

  return (
    <OrgMembersClient
      org={orgRes.data}
      initialMembers={membersRes.data || []}
      origin={origin}
    />
  );
}
