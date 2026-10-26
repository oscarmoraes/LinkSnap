const CODE_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

function getSupabaseConfig() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing server-side Supabase environment variables.");
  }

  return {
    restUrl: `${supabaseUrl.replace(/\/$/, "")}/rest/v1`,
    serviceRoleKey,
  };
}

function supabaseHeaders(serviceRoleKey, extraHeaders = {}) {
  return {
    apikey: serviceRoleKey,
    Authorization: `Bearer ${serviceRoleKey}`,
    ...extraHeaders,
  };
}

function createShortCode() {
  const values = new Uint8Array(6);
  crypto.getRandomValues(values);
  return Array.from(values, (value) => CODE_ALPHABET[value % CODE_ALPHABET.length]).join("");
}

export default async function handler(request, response) {
  if (request.method !== "GET" && request.method !== "POST") {
    response.setHeader("Allow", "GET, POST");
    return response.status(405).json({ error: "Método não permitido." });
  }

  let config;
  try {
    config = getSupabaseConfig();
  } catch (error) {
    console.error(error.message);
    return response.status(500).json({ error: "Serviço de links não configurado." });
  }

  if (request.method === "GET") {
    try {
      const query = new URLSearchParams({
        select: "id,short_code,long_url,clicks,created_at",
        order: "created_at.desc",
        limit: "100",
      });
      const upstream = await fetch(`${config.restUrl}/links?${query}`, {
        headers: supabaseHeaders(config.serviceRoleKey),
      });

      if (!upstream.ok) {
        console.error("Supabase links query failed:", upstream.status, await upstream.text());
        return response.status(502).json({ error: "Não foi possível carregar os links." });
      }

      return response.status(200).json({ links: await upstream.json() });
    } catch (error) {
      console.error("Failed to load links:", error);
      return response.status(502).json({ error: "Não foi possível carregar os links." });
    }
  }

  const longUrl = request.body && request.body.long_url;
  if (typeof longUrl !== "string" || longUrl.length > 2048) {
    return response.status(400).json({ error: "Informe uma URL válida de até 2048 caracteres." });
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(longUrl);
  } catch {
    return response.status(400).json({ error: "Informe uma URL válida." });
  }
  if (!["http:", "https:"].includes(parsedUrl.protocol) || parsedUrl.username || parsedUrl.password) {
    return response.status(400).json({ error: "Use uma URL HTTP ou HTTPS válida." });
  }

  try {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const shortCode = createShortCode();
      const upstream = await fetch(`${config.restUrl}/links?select=short_code`, {
        method: "POST",
        headers: supabaseHeaders(config.serviceRoleKey, {
          "Content-Type": "application/json",
          Prefer: "return=representation",
        }),
        body: JSON.stringify({ short_code: shortCode, long_url: parsedUrl.toString() }),
      });

      if (upstream.ok) {
        const rows = await upstream.json();
        return response.status(201).json({ short_code: rows[0].short_code });
      }

      const details = await upstream.text();
      if (upstream.status === 409 || details.includes("23505")) continue;

      console.error("Supabase link insert failed:", upstream.status, details);
      return response.status(502).json({ error: "Não foi possível criar o link." });
    }

    return response.status(503).json({ error: "Não foi possível gerar um código exclusivo. Tente novamente." });
  } catch (error) {
    console.error("Failed to create link:", error);
    return response.status(502).json({ error: "Não foi possível criar o link." });
  }
}
