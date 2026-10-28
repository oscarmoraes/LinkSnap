import { NextResponse } from "next/server";
import { getPaymentDetails } from "@/utils/mercadopago";
import { createAdminClient } from "@/utils/supabase/admin";

export async function GET(request: Request) {
  // Mercado Pago envia GET para verificar a existência do webhook
  return NextResponse.json({ status: "ok", service: "LinkSnap MP Webhook" });
}

export async function POST(request: Request) {
  try {
    const url = new URL(request.url);
    let body: any = {};
    try {
      body = await request.json();
    } catch {
      // Body vazio ou formulário
    }

    // Identificar o ID do pagamento
    const paymentId =
      url.searchParams.get("data.id") ||
      url.searchParams.get("id") ||
      body?.data?.id ||
      body?.id;

    const topic =
      url.searchParams.get("type") ||
      url.searchParams.get("topic") ||
      body?.type ||
      body?.action;

    console.log(`[MercadoPago Webhook] Evento recebido: topic=${topic}, paymentId=${paymentId}`);

    if (!paymentId) {
      return NextResponse.json({ received: true, note: "Sem paymentId para processar" });
    }

    // Busca detalhes do pagamento na API oficial do Mercado Pago
    const payment = await getPaymentDetails(paymentId);
    console.log(`[MercadoPago Webhook] Status do pagamento ${paymentId}: ${payment?.status}`);

    if (payment && payment.status === "approved") {
      let extRef: any = null;
      try {
        extRef = JSON.parse(payment.external_reference);
      } catch {
        extRef = { userId: payment.external_reference, planTier: "pro", cycle: "monthly" };
      }

      const userId = extRef?.userId;
      const planTier = extRef?.planTier || "pro";
      const cycle = extRef?.cycle || "monthly";

      if (userId) {
        const adminSupabase = createAdminClient();

        // Calcula a data de expiração da assinatura
        const expiresAt = new Date();
        if (cycle === "yearly") {
          expiresAt.setDate(expiresAt.getDate() + 365);
        } else {
          expiresAt.setDate(expiresAt.getDate() + 30);
        }

        // 1. Atualiza o perfil do usuário para o plano PRO / Enterprise
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
          console.log(`[MercadoPago Webhook] Perfil ${userId} promovido com sucesso para ${planTier}!`);
        }

        // 2. Registra o histórico na tabela subscriptions
        const { error: subError } = await adminSupabase.from("subscriptions").insert({
          user_id: userId,
          status: "active",
          plan_tier: planTier,
          mp_payment_id: String(paymentId),
          mp_status: "approved",
          current_period_end: expiresAt.toISOString(),
          updated_at: new Date().toISOString(),
        });

        if (subError) {
          console.warn("[MercadoPago Webhook] Aviso ao registrar subscription:", subError);
        }
      }
    }

    return NextResponse.json({ received: true, status: payment?.status });
  } catch (err: any) {
    console.error("[MercadoPago Webhook] Exceção:", err);
    // Retorna 200 para evitar que o Mercado Pago fique re-tentando indefinidamente caso ocorra erro interno
    return NextResponse.json({ received: true, error: err.message }, { status: 200 });
  }
}
