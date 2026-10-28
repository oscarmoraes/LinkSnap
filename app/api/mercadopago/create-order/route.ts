import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { PLANS } from "@/utils/mercadopago";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Não autorizado. Faça login para continuar." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      planKey = "pro_monthly",
      paymentMethod = "pix", // 'pix' ou 'credit_card'
      cardToken,
      installments = 1,
      identification,
    } = body;

    const plan = PLANS[planKey];
    if (!plan) {
      return NextResponse.json(
        { error: "Plano inválido especificado." },
        { status: 400 }
      );
    }

    const token = process.env.MERCADO_PAGO_ACCESS_TOKEN;
    if (!token) {
      return NextResponse.json(
        { error: "Credenciais do Mercado Pago não configuradas." },
        { status: 500 }
      );
    }

    const amountFormatted = plan.price.toFixed(2);
    const idempotencyKey = crypto.randomUUID();

    // Sanitizar dados do pagador para evitar strings vazias
    const fullName = (user.user_metadata?.full_name || "").trim();
    const nameParts = fullName ? fullName.split(/\s+/) : [];
    const firstName = nameParts[0] || "Cliente";
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : "LinkSnap";

    // Construção do payload da nova Orders API (/v1/orders)
    const orderPayload: any = {
      type: "online",
      processing_mode: "automatic",
      total_amount: amountFormatted,
      external_reference: `linksnap_${user.id}_${planKey}_${Date.now()}`,
      payer: {
        email: user.email || "usuario@linksnap.com.br",
        first_name: firstName,
        last_name: lastName,
      },
      items: [
        {
          title: plan.name,
          description: plan.description,
          quantity: 1,
          unit_price: amountFormatted,
        },
      ],
      transactions: {
        payments: [] as any[],
      },
    };

    if (paymentMethod === "pix") {
      orderPayload.transactions.payments.push({
        amount: amountFormatted,
        payment_method: {
          id: "pix",
          type: "bank_transfer",
        },
      });
    } else if (paymentMethod === "credit_card") {
      if (!cardToken) {
        return NextResponse.json(
          { error: "Token do cartão não fornecido." },
          { status: 400 }
        );
      }
      orderPayload.transactions.payments.push({
        amount: amountFormatted,
        token: cardToken,
        installments: Number(installments),
        payment_method: {
          id: body.paymentMethodId || "credit_card",
          type: "credit_card",
        },
      });
    }

    // Chamada oficial da Orders API
    const mpResponse = await fetch("https://api.mercadopago.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        "X-Idempotency-Key": idempotencyKey,
      },
      body: JSON.stringify(orderPayload),
    });

    const orderData = await mpResponse.json();

    if (!mpResponse.ok) {
      console.error("Erro da Orders API:", orderData);
      return NextResponse.json(
        {
          error:
            orderData.message ||
            orderData.errors?.[0]?.message ||
            "Falha ao gerar ordem no Mercado Pago.",
          details: orderData,
        },
        { status: mpResponse.status }
      );
    }

    const firstPayment = orderData.transactions?.payments?.[0];
    const pixData = firstPayment?.payment_method?.id === "pix"
      ? {
          qrCode: firstPayment.payment_method.qr_code,
          qrCodeBase64: firstPayment.payment_method.qr_code_base64,
          ticketUrl: firstPayment.payment_method.ticket_url,
        }
      : null;

    // Registrar no banco (Subscriptions) com status pendente ou ativo
    try {
      const adminSupabase = createAdminClient();
      await adminSupabase.from("subscriptions").insert({
        user_id: user.id,
        status: firstPayment?.status === "approved" ? "active" : "pending",
        plan_tier: plan.tier,
        mp_preference_id: orderData.id,
        mp_status: firstPayment?.status || orderData.status,
      });
    } catch (dbErr) {
      console.warn("Aviso ao registrar assinatura no Supabase:", dbErr);
    }

    return NextResponse.json({
      success: true,
      orderId: orderData.id,
      status: orderData.status,
      paymentStatus: firstPayment?.status,
      paymentId: firstPayment?.id,
      pix: pixData,
      plan,
    });
  } catch (error: any) {
    console.error("Erro ao criar ordem de pagamento:", error);
    return NextResponse.json(
      { error: error.message || "Erro interno ao processar ordem." },
      { status: 500 }
    );
  }
}
