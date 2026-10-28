import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { targetPlan = "pro" } = body;

    const adminSupabase = createAdminClient();

    const { error: profileError } = await adminSupabase
      .from("profiles")
      .update({
        plan_tier: targetPlan,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (profileError) {
      throw profileError;
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    await adminSupabase.from("subscriptions").insert({
      user_id: user.id,
      status: targetPlan === "free" ? "cancelled" : "active",
      plan_tier: targetPlan,
      mp_payment_id: `SIMULATED_${Date.now()}`,
      mp_status: targetPlan === "free" ? "cancelled" : "approved",
      current_period_end: expiresAt.toISOString(),
    });

    return NextResponse.json({ success: true, planTier: targetPlan });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
