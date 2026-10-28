import { createClient } from "@/utils/supabase/server";
import LandingClient from "@/components/LandingClient";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return <LandingClient isLoggedIn={Boolean(user)} />;
}
