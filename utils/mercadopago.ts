export interface PlanConfig {
  tier: "pro" | "enterprise";
  cycle: "monthly" | "yearly";
  name: string;
  price: number;
  description: string;
}

export const PLANS: Record<string, PlanConfig> = {
  "pro_monthly": {
    tier: "pro",
    cycle: "monthly",
    name: "LinkSnap PRO Mensal",
    price: 19.90,
    description: "Plano PRO Mensal: Domínio próprio, Bio Pro completa, QR Codes e Analytics avançado.",
  },
  "pro_yearly": {
    tier: "pro",
    cycle: "yearly",
    name: "LinkSnap PRO Anual (2 meses grátis)",
    price: 199.00,
    description: "Plano PRO Anual com desconto: 12 meses de acesso com todas as vantagens PRO.",
  },
  "enterprise_monthly": {
    tier: "enterprise",
    cycle: "monthly",
    name: "LinkSnap Business / Equipes Mensal",
    price: 49.90,
    description: "Plano Equipes: Múltiplas marcas, crachás ilimitados e relatórios executivos.",
  },
  "enterprise_yearly": {
    tier: "enterprise",
    cycle: "yearly",
    name: "LinkSnap Business / Equipes Anual",
    price: 499.00,
    description: "Plano Equipes Anual: Gestão unificada de marcas e carteirinhas digitais com desconto.",
  },
};

export function getMercadoPagoAccessToken(): string | null {
  return process.env.MERCADO_PAGO_ACCESS_TOKEN || null;
}

export async function createCheckoutPreference({
  planKey,
  userId,
  userEmail,
  userName,
  appUrl,
}: {
  planKey: string;
  userId: string;
  userEmail: string;
  userName?: string;
  appUrl: string;
}) {
  const token = getMercadoPagoAccessToken();
  const plan = PLANS[planKey];

  if (!plan) {
    throw new Error(`Plano inválido selecionado: ${planKey}`);
  }

  if (!token) {
    // Modo Demonstração / Sandbox sem token
    return {
      isSimulated: true,
      initPoint: null,
      message:
        "MERCADO_PAGO_ACCESS_TOKEN não configurado no ambiente. Configure suas credenciais do Mercado Pago para gerar checkouts reais.",
    };
  }

  const payload = {
    items: [
      {
        id: planKey,
        title: plan.name,
        description: plan.description,
        quantity: 1,
        currency_id: "BRL",
        unit_price: plan.price,
      },
    ],
    payer: {
      email: userEmail,
      name: userName || undefined,
    },
    back_urls: {
      success: `${appUrl}/dashboard/settings?billing=success`,
      failure: `${appUrl}/dashboard/settings?billing=failure`,
      pending: `${appUrl}/dashboard/settings?billing=pending`,
    },
    auto_return: "approved",
    notification_url: `${appUrl}/api/webhooks/mercadopago`,
    external_reference: JSON.stringify({
      userId,
      planTier: plan.tier,
      cycle: plan.cycle,
      planKey,
    }),
    statement_descriptor: "LINKSNAP PRO",
  };

  const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error("Erro Mercado Pago API:", errorData);
    throw new Error(
      errorData.message ||
        `Erro ${response.status} ao criar preferência de pagamento no Mercado Pago.`
    );
  }

  const data = await response.json();

  return {
    isSimulated: false,
    preferenceId: data.id,
    initPoint: data.init_point,
    sandboxInitPoint: data.sandbox_init_point,
  };
}

export async function getPaymentDetails(paymentId: string | number) {
  const token = getMercadoPagoAccessToken();
  if (!token) {
    throw new Error("MERCADO_PAGO_ACCESS_TOKEN ausente");
  }

  const response = await fetch(
    `https://api.mercadopago.com/v1/payments/${paymentId}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    console.error("Erro ao buscar detalhes do pagamento:", err);
    throw new Error(err.message || "Falha ao consultar pagamento no Mercado Pago");
  }

  return response.json();
}
