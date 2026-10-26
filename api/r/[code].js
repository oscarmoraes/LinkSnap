export default async function handler(request, response) {
  const { code } = request.query;
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (typeof code !== "string" || !/^[A-Za-z0-9_-]{6}$/.test(code)) {
    return response.status(404).send("Link não encontrado.");
  }
  if (!supabaseUrl || !serviceRoleKey) {
    console.error("As variáveis SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórias.");
    return response.status(500).send("Serviço de redirecionamento não configurado.");
  }

  try {
    const rpcResponse = await fetch(`${supabaseUrl.replace(/\/$/, "")}/rest/v1/rpc/resolve_and_count_click`, {
      method: "POST",
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ p_short_code: code }),
    });

    if (!rpcResponse.ok) {
      console.error("Falha ao resolver link no Supabase:", rpcResponse.status, await rpcResponse.text());
      return response.status(502).send("Não foi possível abrir este link agora.");
    }

    const longUrl = await rpcResponse.json();
    if (typeof longUrl !== "string") {
      return response.status(404).send("Link não encontrado.");
    }

    const destination = new URL(longUrl);
    if (!["http:", "https:"].includes(destination.protocol)) {
      console.error("URL de destino inválida para o código:", code);
      return response.status(502).send("O destino deste link é inválido.");
    }

    response.setHeader("Cache-Control", "no-store");
    return response.redirect(302, destination.toString());
  } catch (error) {
    console.error("Erro ao redirecionar link:", error);
    return response.status(502).send("Não foi possível abrir este link agora.");
  }
}
