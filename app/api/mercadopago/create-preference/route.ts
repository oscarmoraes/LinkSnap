import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { createCheckoutPreference, PLANS } from "@/utils/mercadopago";

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
    const { planKey = "pro_monthly" } = body;

    if (!PLANS[planKey]) {
      return NextResponse.json(
        { error: "Plano inválido especificado." },
        { status: 400 }
      );
    }

    // Identificar a URL base correta da aplicação
    const requestUrl = new URL(request.url);
    const forwardedHost = request.headers.get("x-forwarded-host");
    const forwardedProto = request.headers.get("x-forwarded-proto") || "https";
    const appUrl = forwardedHost
      ? `${forwardedProto}://${forwardedHost}`
      : requestUrl.origin;

    const result = await createCheckoutPreference({
      planKey,
      userId: user.id,
      userEmail: user.email || "",
      userName: user.user_metadata?.full_name || undefined,
      appUrl,
    });

    // Se criou uma preferência real, registra intenção no banco
    if (!result.isSimulated && result.preferenceId) {
      try {
        const adminSupabase = createAdminClient();
        await adminSupabase.from("subscriptions").insert({
          user_id: user.id,
          status: "pending",
          plan_tier: PLANS[planKey].tier,
          mp_preference_id: result.preferenceId,
          mp_status: "pending",
        });
      } catch (dbErr) {
        console.warn("Aviso ao registrar intenção de assinatura:", dbErr);
      }
    }

    return NextResponse.json({
      success: true,
      ...result,
      plan: PLANS[planKey],
    });
  } catch (error: any) {
    console.error("Erro ao gerar checkout Mercado Pago:", error);
    return NextResponse.json(
      { error: error.message || "Erro interno ao processar checkout." },
      { status: 500 }
    );
  }
}
