import { SupabaseClient } from "@supabase/supabase-js";

export interface CreateShortLinkParams {
  supabase: SupabaseClient;
  userId: string;
  longUrl: string;
  title?: string;
  sourceType?: "direct" | "whatsapp" | "pix" | "wifi" | "utm";
  tags?: string[];
  scope?: "global" | "branded";
  userHandle?: string;
  customSlug?: string;
  toolItemId?: string;
  origin: string;
}

export interface ShortLinkResult {
  id: string;
  shortCode: string;
  fullShortUrl: string;
  linkScope: "global" | "branded";
}

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

export function generateRandomCode(length = 6): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("");
}

export async function createShortLink({
  supabase,
  userId,
  longUrl,
  title,
  sourceType = "direct",
  tags = [],
  scope = "global",
  userHandle,
  customSlug,
  toolItemId,
  origin,
}: CreateShortLinkParams): Promise<ShortLinkResult> {
  const isBranded = scope === "branded" && Boolean(userHandle);
  let shortCode = customSlug?.trim() ? customSlug.trim() : generateRandomCode(6);

  // Validação básica do slug
  if (customSlug?.trim() && !/^[A-Za-z0-9_-]{3,32}$/.test(customSlug.trim())) {
    throw new Error("O slug customizado deve ter entre 3 e 32 caracteres (apenas letras, números, hífen e underline).");
  }

  let attempts = 0;
  let lastError: any = null;

  while (attempts < 5) {
    attempts++;
    const { data, error } = await supabase
      .from("links")
      .insert({
        user_id: userId,
        short_code: shortCode,
        long_url: longUrl,
        title: title || `Link ${sourceType}`,
        is_custom_slug: Boolean(customSlug?.trim()),
        tags: tags.length > 0 ? tags : [sourceType],
        source_type: sourceType,
        link_scope: isBranded ? "branded" : "global",
        branded_handle: isBranded ? userHandle : null,
      })
      .select("id, short_code, link_scope, branded_handle")
      .single();

    if (!error && data) {
      // Se tiver toolItemId, vincula na tabela tool_items
      if (toolItemId) {
        await supabase
          .from("tool_items")
          .update({ link_id: data.id })
          .eq("id", toolItemId);
      }

      const fullShortUrl = isBranded
        ? `${origin}/r/${userHandle}/${data.short_code}`
        : `${origin}/r/${data.short_code}`;

      return {
        id: data.id,
        shortCode: data.short_code,
        fullShortUrl,
        linkScope: data.link_scope as "global" | "branded",
      };
    }

    lastError = error;
    // Se for erro de unicidade (código já existe) e não for customSlug, tenta outro código aleatório
    if (error?.code === "23505" && !customSlug?.trim()) {
      shortCode = generateRandomCode(6);
    } else {
      break;
    }
  }

  if (lastError?.code === "23505") {
    throw new Error(`O código/slug "${shortCode}" já está em uso. Por favor, escolha outro.`);
  }

  throw new Error(lastError?.message || "Falha ao criar o link curto.");
}
