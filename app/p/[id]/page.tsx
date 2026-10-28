import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import QRCode from "qrcode";
import PixPublicClient from "./PixPublicClient";

export const dynamic = "force-dynamic";

function getAnonSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export default async function PublicPixPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = getAnonSupabase();
  if (!supabase) return notFound();

  const { data, error } = await supabase.rpc("get_public_tool_item", {
    p_public_id: params.id,
  });

  if (error || !data || data.length === 0) {
    return notFound();
  }

  const item = data[0];
  if (item.type !== "pix" || !item.payload?.pixCode) {
    return notFound();
  }

  const qrCodeUrl = await QRCode.toDataURL(item.payload.pixCode, {
    width: 380,
    margin: 2,
    color: {
      dark: "#09090b",
      light: "#FFFFFF",
    },
  });

  return (
    <PixPublicClient
      title={item.name}
      beneficiary={item.payload.beneficiary}
      city={item.payload.city}
      amount={item.payload.amount}
      pixCode={item.payload.pixCode}
      qrCodeUrl={qrCodeUrl}
    />
  );
}
