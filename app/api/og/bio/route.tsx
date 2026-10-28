import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "edge";

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
  return createClient(url, key, {
    auth: { persistSession: false },
  });
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const handle = (searchParams.get("handle") || "user").toLowerCase();
    const slug = (searchParams.get("slug") || "").toLowerCase();

    let pageTitle = `@${handle}`;
    let pageDesc = "Links oficiais, catálogo, Pix e canais de contato.";
    let avatarUrl: string | null = null;

    try {
      const supabase = getSupabase();
      const { data: profile } = await supabase
        .from("profiles")
        .select("id, handle, full_name, avatar_url")
        .eq("handle", handle)
        .maybeSingle();

      if (profile) {
        if (profile.full_name) pageTitle = profile.full_name;
        if (profile.avatar_url) avatarUrl = profile.avatar_url;

        if (slug) {
          const { data: page } = await supabase
            .from("bio_pages")
            .select("title, description, avatar_url")
            .eq("user_id", profile.id)
            .eq("slug", slug)
            .maybeSingle();

          if (page) {
            if (page.title) pageTitle = page.title;
            if (page.description) pageDesc = page.description;
            if (page.avatar_url) avatarUrl = page.avatar_url;
          }
        }
      }
    } catch {
      // Fallback gracioso se o banco estiver inacessível
    }

    const initials = (pageTitle || handle).substring(0, 2).toUpperCase();

    return new ImageResponse(
      (
        <div
          style={{
            height: "100%",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: "#0B0F19",
            backgroundImage: "radial-gradient(circle at 50% 0%, #1E3A8A 0%, #0B0F19 70%)",
            padding: "50px 48px",
            fontFamily: "system-ui, -apple-system, sans-serif",
          }}
        >
          {/* Top Bar com Logo LinkSnap */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              width: "100%",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div
                style={{
                  height: "44px",
                  width: "44px",
                  borderRadius: "12px",
                  backgroundColor: "#2563EB",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#FFFFFF",
                  fontWeight: 900,
                  fontSize: "24px",
                  boxShadow: "0 4px 14px rgba(37, 99, 235, 0.4)",
                }}
              >
                <span>L</span>
              </div>
              <span
                style={{
                  color: "#FFFFFF",
                  fontSize: "26px",
                  fontWeight: 800,
                  letterSpacing: "-0.5px",
                }}
              >
                LinkSnap
              </span>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                backgroundColor: "rgba(255, 255, 255, 0.08)",
                border: "1px solid rgba(255, 255, 255, 0.15)",
                padding: "8px 18px",
                borderRadius: "9999px",
                color: "#60A5FA",
                fontSize: "14px",
                fontWeight: 700,
              }}
            >
              <span>✦ Bio Oficial Verificada</span>
            </div>
          </div>

          {/* Card Central */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              maxWidth: "850px",
            }}
          >
            {/* Avatar */}
            <div
              style={{
                height: "120px",
                width: "120px",
                borderRadius: "9999px",
                border: "4px solid #3B82F6",
                backgroundColor: "#1E293B",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#FFFFFF",
                fontSize: "44px",
                fontWeight: 800,
                marginBottom: "20px",
                boxShadow: "0 10px 30px rgba(0, 0, 0, 0.5)",
                overflow: "hidden",
              }}
            >
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarUrl}
                  alt=""
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                <span>{initials}</span>
              )}
            </div>

            {/* Nome / Título */}
            <div
              style={{
                display: "flex",
                color: "#FFFFFF",
                fontSize: "46px",
                fontWeight: 900,
                letterSpacing: "-1px",
                lineHeight: 1.1,
                marginBottom: "10px",
                textAlign: "center",
              }}
            >
              <span>{pageTitle}</span>
            </div>

            {/* Handle */}
            <div
              style={{
                display: "flex",
                color: "#93C5FD",
                fontSize: "20px",
                fontWeight: 600,
                fontFamily: "monospace",
                marginBottom: "12px",
              }}
            >
              <span>@{handle}</span>
            </div>

            {/* Descrição */}
            <div
              style={{
                display: "flex",
                color: "#94A3B8",
                fontSize: "19px",
                fontWeight: 400,
                lineHeight: 1.4,
                maxWidth: "650px",
                textAlign: "center",
              }}
            >
              <span>
                {pageDesc.length > 115 ? `${pageDesc.substring(0, 112)}...` : pageDesc}
              </span>
            </div>
          </div>

          {/* Rodapé */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              width: "100%",
              borderTop: "1px solid rgba(255, 255, 255, 0.1)",
              paddingTop: "18px",
            }}
          >
            <div
              style={{
                display: "flex",
                color: "#64748B",
                fontSize: "14px",
                fontWeight: 500,
              }}
            >
              <span>Acesse pelo navegador em celular ou computador</span>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                color: "#E2E8F0",
                fontSize: "14px",
                fontWeight: 600,
              }}
            >
              <span>linksnap.com.br</span>
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (err: any) {
    return new ImageResponse(
      (
        <div
          style={{
            height: "100%",
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#0B0F19",
            color: "#FFFFFF",
            fontSize: "36px",
            fontWeight: 800,
          }}
        >
          <span>LinkSnap • Bio Oficial</span>
        </div>
      ),
      { width: 1200, height: 630 }
    );
  }
}
