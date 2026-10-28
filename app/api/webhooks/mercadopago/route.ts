import { NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";

export async function GET(request: Request) {
  return NextResponse.json({ status: "ok", service: "LinkSnap MP Webhook" });
}

export async function POST(request: Request) {
  try {
    const url = new URL(request.url);
    let body: any = {};
    try {
      body = await request.json();
    } catch {
      // Body vazio ou text/plain
    }

    // 1. Identificar se recebemos uma notificação de Order ou de Payment
    const dataId =
      url.searchParams.get("data.id") ||
      url.searchParams.get("id") ||
      body?.data?.id ||
      body?.id;

    const topic =
      url.searchParams.get("type") ||
      url.searchParams.get("topic") ||
      body?.type ||
      body?.action;

    console.log(`[MercadoPago Webhook] Recebido: topic=${topic}, id=${dataId}`);

    if (!dataId) {
      return NextResponse.json({ received: true, note: "Sem ID identificado" });
    }

    const token = process.env.MERCADO_PAGO_ACCESS_TOKEN;
    if (!token) {
      return NextResponse.json({ error: "Token não configurado" }, { status: 500 });
    }

    let isApproved = false;
    let externalRef = "";
    let resourceId = String(dataId);

    // 2. Tentar buscar como ORDER (Orders API - padrão do Checkout Transparente e Pix)
    if (String(dataId).startsWith("ORD") || topic === "order" || topic?.includes("order")) {
      const orderRes = await fetch(`https://api.mercadopago.com/v1/orders/${dataId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (orderRes.ok) {
        const orderData = await orderRes.json();
        externalRef = orderData.external_reference || "";
        isApproved = orderData.status === "processed" || orderData.status === "paid";
      }
    }

    // 3. Se não foi tratado como Order ou falhou, tenta buscar como PAYMENT
    if (!isApproved && !externalRef) {
      const payRes = await fetch(`https://api.mercadopago.com/v1/payments/${dataId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (payRes.ok) {
        const payData = await payRes.json();
        externalRef = payData.external_reference || "";
        isApproved = payData.status === "approved";
      }
    }

    console.log(`[MercadoPago Webhook] Status: isApproved=${isApproved}, extRef=${externalRef}`);

    // 4. Se o pagamento/ordem foi aprovado, processar ativação do plano no Supabase
    if (isApproved && externalRef) {
      const adminSupabase = createAdminClient();

      // Formato compacto: ls_9cc8a47bd3634cd8_pro_monthly_... ou JSON
      let userId = "";
      let planTier = "pro";
      let cycle = "monthly";

      if (externalRef.startsWith("ls_")) {
        const parts = externalRef.split("_");
        const shortUser = parts[1]; // prefixo do UUID sem traços
        planTier = parts[2] || "pro";
        cycle = parts[3] || "monthly";

        // Localizar o usuário real no Supabase pelo início do UUID
        const { data: profiles } = await adminSupabase
          .from("profiles")
          .select("id");

        const matchedProfile = profiles?.find((p) =>
          p.id.replace(/-/g, "").startsWith(shortUser)
        );

        if (matchedProfile) {
          userId = matchedProfile.id;
        }
      } else {
        try {
          const parsed = JSON.parse(externalRef);
          userId = parsed.userId;
          planTier = parsed.planTier || "pro";
          cycle = parsed.cycle || "monthly";
        } catch {
          userId = externalRef;
        }
      }

      if (userId) {
        // Atualiza perfil do usuário
        const { error: profileError } = await adminSupabase
          .from("profiles")
          .update({
            plan_tier: planTier,
            updated_at: new Date().toISOString(),
          })
          .eq("id", userId);

        if (profileError) {
          console.error("[MercadoPago Webhook] Erro ao atualizar perfil:", profileError);
        } else {
          console.log(`[MercadoPago Webhook] Usuário ${userId} promovido com sucesso para ${planTier}!`);
        }

        // Registrar subscription
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + (cycle === "yearly" ? 365 : 30));

        await adminSupabase.from("subscriptions").insert({
          user_id: userId,
          status: "active",
          plan_tier: planTier,
          mp_payment_id: resourceId,
          mp_status: "approved",
          current_period_end: expiresAt.toISOString(),
          updated_at: new Date().toISOString(),
        });
      }
    }

    return NextResponse.json({ received: true, approved: isApproved });
  } catch (err: any) {
    console.error("[MercadoPago Webhook] Erro:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
