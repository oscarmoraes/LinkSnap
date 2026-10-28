import fs from "fs";
import path from "path";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

// Carregar .env.local
const envPath = path.resolve(process.cwd(), ".env.local");
let env = {};
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, "utf-8");
  content.split("\n").forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
      const idx = trimmed.indexOf("=");
      const key = trimmed.slice(0, idx).trim();
      const val = trimmed.slice(idx + 1).trim();
      env[key] = val;
    }
  });
}

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false },
});

const results = [];
function record(title, passed, details) {
  results.push({ title, passed, details });
  console.log(`${passed ? "✅ PASS" : "❌ FAIL"} - ${title}`);
  if (details) console.log(`   ${details}`);
}

async function run() {
  console.log("=== INICIANDO SUÍTE DE TESTES: RECURSOS AVANÇADOS, COTAS & OPENGRAPH ===");

  // 1. Teste de Colunas no Banco
  try {
    const { data: cols, error } = await supabase
      .from("links")
      .select("password_hash, starts_at, expires_at")
      .limit(1);

    if (error) throw error;
    record("Verificação de Colunas em 'links' (password_hash, starts_at, expires_at)", true, "Colunas presentes e acessíveis");
  } catch (err) {
    record("Verificação de Colunas em 'links'", false, err.message);
  }

  try {
    const { data: cols, error } = await supabase
      .from("bio_pages")
      .select("meta_pixel_id, gtm_id, hide_branding")
      .limit(1);

    if (error) throw error;
    record("Verificação de Colunas em 'bio_pages' (meta_pixel_id, gtm_id, hide_branding)", true, "Colunas presentes e acessíveis");
  } catch (err) {
    record("Verificação de Colunas em 'bio_pages'", false, err.message);
  }

  // 2. Teste do Gerador de OpenGraph (/api/og/bio)
  try {
    const res = await fetch("http://127.0.0.1:3000/api/og/bio?handle=test&slug=principal");
    const contentType = res.headers.get("content-type");
    if (res.status === 200 && contentType && contentType.includes("image/png")) {
      record("Endpoint OpenGraph Dinâmico (/api/og/bio)", true, `Status 200, Content-Type: ${contentType}`);
    } else {
      record("Endpoint OpenGraph Dinâmico (/api/og/bio)", false, `Status ${res.status}, Content-Type: ${contentType}`);
    }
  } catch (err) {
    record("Endpoint OpenGraph Dinâmico (/api/og/bio)", false, err.message);
  }

  // 3. Teste de Link Protegido por Senha
  const testCode = "qa_pwd_" + Math.random().toString(36).substring(2, 7);
  const testPassword = "supersecret123";
  const passwordHash = crypto.createHash("sha256").update(testPassword).digest("hex");

  try {
    // Insere link com senha
    const { data: inserted, error: insErr } = await supabase
      .from("links")
      .insert({
        short_code: testCode,
        long_url: "https://example.com/sucesso-senha",
        title: "QA Teste Link Protegido",
        link_scope: "global",
        password_hash: passwordHash,
        is_active: true,
      })
      .select()
      .single();

    if (insErr) throw insErr;

    // GET deve retornar 200 com HTML pedindo senha
    const getRes = await fetch(`http://127.0.0.1:3000/r/${testCode}`);
    const getText = await getRes.text();
    const hasPrompt = getText.includes("Acesso Protegido por Senha") && getText.includes('type="password"');

    if (getRes.status === 200 && hasPrompt) {
      record("Página Intermediária de Senha (/r/[code] GET)", true, "Exibe tela de desbloqueio com campo de senha");
    } else {
      record("Página Intermediária de Senha (/r/[code] GET)", false, `Status ${getRes.status}, Prompt presente: ${hasPrompt}`);
    }

    // POST com senha errada deve retornar 401
    const wrongBody = new URLSearchParams({ password: "wrongpassword" });
    const wrongRes = await fetch(`http://127.0.0.1:3000/r/${testCode}`, {
      method: "POST",
      body: wrongBody,
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });
    const wrongText = await wrongRes.text();
    const hasErrorMsg = wrongText.includes("Senha incorreta");

    if (wrongRes.status === 401 && hasErrorMsg) {
      record("Validação de Senha Incorreta (/r/[code] POST)", true, "Retorna 401 e mensagem de erro");
    } else {
      record("Validação de Senha Incorreta (/r/[code] POST)", false, `Status ${wrongRes.status}, Msg: ${hasErrorMsg}`);
    }

    // POST com senha correta deve redirecionar (status 303 ou redirect)
    const correctBody = new URLSearchParams({ password: testPassword });
    const correctRes = await fetch(`http://127.0.0.1:3000/r/${testCode}`, {
      method: "POST",
      body: correctBody,
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      redirect: "manual",
    });

    const location = correctRes.headers.get("location");
    if ((correctRes.status === 303 || correctRes.status === 302) && location === "https://example.com/sucesso-senha") {
      record("Desbloqueio com Senha Correta (/r/[code] POST)", true, `Redirecionou status ${correctRes.status} para ${location}`);
    } else {
      record("Desbloqueio com Senha Correta (/r/[code] POST)", false, `Status ${correctRes.status}, Location: ${location}`);
    }

    // Limpa link de teste
    await supabase.from("links").delete().eq("id", inserted.id);
  } catch (err) {
    record("Fluxo Completo de Senha", false, err.message);
  }

  // 4. Teste de Link Expirado (Expires At)
  const expiredCode = "qa_exp_" + Math.random().toString(36).substring(2, 7);
  try {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: expLink, error: expInsErr } = await supabase
      .from("links")
      .insert({
        short_code: expiredCode,
        long_url: "https://example.com/expirado",
        title: "QA Teste Link Expirado",
        link_scope: "global",
        expires_at: yesterday,
        is_active: true,
      })
      .select()
      .single();

    if (expInsErr) throw expInsErr;

    const expRes = await fetch(`http://127.0.0.1:3000/r/${expiredCode}`);
    const expText = await expRes.text();
    const isExpiredNoticed = expText.includes("Link Expirado");

    if (expRes.status === 410 && isExpiredNoticed) {
      record("Bloqueio de Link Expirado (/r/[code] GET)", true, "Retorna status 410 Gone com aviso informativo elegante");
    } else {
      record("Bloqueio de Link Expirado (/r/[code] GET)", false, `Status ${expRes.status}, Aviso: ${isExpiredNoticed}`);
    }

    await supabase.from("links").delete().eq("id", expLink.id);
  } catch (err) {
    record("Bloqueio de Link Expirado", false, err.message);
  }

  // 5. Teste de Link Agendado (Starts At)
  const scheduledCode = "qa_sched_" + Math.random().toString(36).substring(2, 7);
  try {
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const { data: schedLink, error: schedInsErr } = await supabase
      .from("links")
      .insert({
        short_code: scheduledCode,
        long_url: "https://example.com/agendado",
        title: "QA Teste Link Agendado",
        link_scope: "global",
        starts_at: tomorrow,
        is_active: true,
      })
      .select()
      .single();

    if (schedInsErr) throw schedInsErr;

    const schedRes = await fetch(`http://127.0.0.1:3000/r/${scheduledCode}`);
    const schedText = await schedRes.text();
    const isSchedNoticed = schedText.includes("Link Agendado");

    if (schedRes.status === 403 && isSchedNoticed) {
      record("Bloqueio de Link Agendado para o Futuro (/r/[code] GET)", true, "Retorna status 403 Forbidden com aviso de data de início");
    } else {
      record("Bloqueio de Link Agendado para o Futuro (/r/[code] GET)", false, `Status ${schedRes.status}, Aviso: ${isSchedNoticed}`);
    }

    await supabase.from("links").delete().eq("id", schedLink.id);
  } catch (err) {
    record("Bloqueio de Link Agendado", false, err.message);
  }

  console.log("\n=== RESUMO FINAL DOS TESTES ===");
  const passCount = results.filter((r) => r.passed).length;
  console.log(`Total: ${results.length} | Aprovados: ${passCount} | Falhas: ${results.length - passCount}`);
  if (passCount === results.length) {
    console.log("🎉 100% DE CONFORMIDADE! TODOS OS RECURSOS OPERANDO COM PERFEIÇÃO.");
  }
}

run();
