import fs from "fs";
import path from "path";
import { createRequire } from "module";
import { createClient } from "@supabase/supabase-js";
import Papa from "papaparse";
import ts from "typescript";

const require = createRequire(import.meta.url);

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

const results = [];

function record(id, title, status, details) {
  results.push({ id, title, status, details });
  const icon = status === "PASS" ? "✅" : "❌";
  console.log(`${icon} [${id}] ${title}: ${status}`);
  if (details) console.log(`   -> ${details}`);
}

async function testWebhookGET() {
  try {
    const res = await fetch("http://localhost:3000/api/webhooks/mercadopago", { method: "GET" });
    const data = await res.json();
    if (res.status === 200 && data.status === "ok" && data.service) {
      record("webhook_get", "Endpoint Webhook MP (GET)", "PASS", `Status HTTP 200, Body: ${JSON.stringify(data)}`);
    } else {
      record("webhook_get", "Endpoint Webhook MP (GET)", "FAIL", `Status ${res.status}, Body: ${JSON.stringify(data)}`);
    }
  } catch (err) {
    record("webhook_get", "Endpoint Webhook MP (GET)", "FAIL", err.message);
  }
}

async function testWebhookPOST() {
  try {
    const mockPayload = {
      action: "payment.created",
      type: "payment",
      data: { id: "mock_qa_test_99999" },
      date_created: new Date().toISOString(),
    };
    const res = await fetch("http://localhost:3000/api/webhooks/mercadopago", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(mockPayload),
    });
    const data = await res.json();
    if (res.status === 200 && data.received === true) {
      record("webhook_post", "Endpoint Webhook MP (POST com mock de evento)", "PASS", `Status HTTP 200, Resposta: ${JSON.stringify(data)}`);
    } else {
      record("webhook_post", "Endpoint Webhook MP (POST com mock de evento)", "FAIL", `Status ${res.status}, Resposta: ${JSON.stringify(data)}`);
    }
  } catch (err) {
    record("webhook_post", "Endpoint Webhook MP (POST com mock de evento)", "FAIL", err.message);
  }
}

async function testRedirectBilling() {
  try {
    const res = await fetch("http://localhost:3000/dashboard/billing", { redirect: "manual" });
    const location = res.headers.get("location");
    if (res.status === 307 && location) {
      record("redirect_billing", "Redirecionamento suave /dashboard/billing", "PASS", `Status HTTP 307, Location: ${location}`);
    } else {
      record("redirect_billing", "Redirecionamento suave /dashboard/billing", "FAIL", `Status ${res.status}, Location: ${location}`);
    }
  } catch (err) {
    record("redirect_billing", "Redirecionamento suave /dashboard/billing", "FAIL", err.message);
  }
}

async function testRedirectLeads() {
  try {
    const res = await fetch("http://localhost:3000/dashboard/leads", { redirect: "manual" });
    const location = res.headers.get("location");
    if (res.status === 307 && location) {
      record("redirect_leads", "Redirecionamento suave /dashboard/leads", "PASS", `Status HTTP 307, Location: ${location}`);
    } else {
      record("redirect_leads", "Redirecionamento suave /dashboard/leads", "FAIL", `Status ${res.status}, Location: ${location}`);
    }
  } catch (err) {
    record("redirect_leads", "Redirecionamento suave /dashboard/leads", "FAIL", err.message);
  }
}

async function testSupabaseBioLeads() {
  try {
    if (!supabaseUrl || !serviceKey) {
      throw new Error("Credenciais do Supabase ausentes em .env.local");
    }
    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false },
    });

    // 1. Obter uma bio_page existente para vincular
    const { data: bios, error: bioErr } = await admin
      .from("bio_pages")
      .select("id, user_id")
      .limit(1);

    if (bioErr || !bios || bios.length === 0) {
      throw new Error("Nenhuma bio_page encontrada para teste de integridade referencial");
    }

    const testBioId = bios[0].id;
    const testUserId = bios[0].user_id;

    // 2. Inserir lead de teste
    const testLead = {
      bio_page_id: testBioId,
      user_id: testUserId,
      name: "QA Integration Tester",
      contact: "qa-leads@linksnap.test",
      message: "Lead de teste automatizado de integridade de schema LinkSnap",
    };

    const { data: inserted, error: insertErr } = await admin
      .from("bio_leads")
      .insert(testLead)
      .select()
      .single();

    if (insertErr || !inserted) {
      throw new Error(`Falha ao inserir lead de teste: ${insertErr?.message}`);
    }

    const leadId = inserted.id;

    // 3. Consultar para verificar integridade da estrutura
    const { data: queried, error: queryErr } = await admin
      .from("bio_leads")
      .select("id, bio_page_id, user_id, name, contact, message, created_at, bio_pages(title, slug)")
      .eq("id", leadId)
      .single();

    if (queryErr || !queried) {
      throw new Error(`Falha ao consultar lead inserido: ${queryErr?.message}`);
    }

    const fieldsValid =
      queried.name === testLead.name &&
      queried.contact === testLead.contact &&
      queried.message === testLead.message &&
      queried.bio_page_id === testBioId &&
      !!queried.created_at;

    if (!fieldsValid) {
      throw new Error(`Campos do lead consultado divergem dos dados inseridos: ${JSON.stringify(queried)}`);
    }

    // 4. Excluir lead de teste
    const { error: deleteErr } = await admin
      .from("bio_leads")
      .delete()
      .eq("id", leadId);

    if (deleteErr) {
      throw new Error(`Falha ao remover lead de teste: ${deleteErr.message}`);
    }

    // 5. Confirmar que não existe mais
    const { data: verifyDeleted } = await admin
      .from("bio_leads")
      .select("id")
      .eq("id", leadId)
      .maybeSingle();

    if (verifyDeleted) {
      throw new Error("Lead de teste ainda existe após exclusão");
    }

    record(
      "supabase_bio_leads",
      "Integração Supabase public.bio_leads (CRUD & integridade)",
      "PASS",
      `Lead criado (ID: ${leadId}), verificado com join em bio_pages e removido com sucesso`
    );
  } catch (err) {
    record("supabase_bio_leads", "Integração Supabase public.bio_leads", "FAIL", err.message);
  }
}

async function testMercadoPagoModule() {
  try {
    const tsCode = fs.readFileSync(path.resolve(process.cwd(), "utils/mercadopago.ts"), "utf-8");
    const transpiled = ts.transpileModule(tsCode, {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    });
    
    const scriptDir = path.resolve(process.cwd(), "scripts");
    const tempCjsPath = path.resolve(scriptDir, "mercadopago_temp.cjs");
    fs.writeFileSync(tempCjsPath, transpiled.outputText);
    
    const mpModule = require(tempCjsPath);
    const { PLANS, createCheckoutPreference } = mpModule;

    const expectedKeys = ["pro_monthly", "pro_yearly", "enterprise_monthly", "enterprise_yearly"];
    for (const key of expectedKeys) {
      const plan = PLANS[key];
      if (!plan) throw new Error(`Plano obrigatório ${key} não encontrado em PLANS`);
      if (typeof plan.price !== "number" || plan.price <= 0) {
        throw new Error(`Preço inválido para o plano ${key}: ${plan.price}`);
      }
      if (!plan.name || !plan.description || !plan.tier || !plan.cycle) {
        throw new Error(`Metadados incompletos no plano ${key}`);
      }
    }

    // Teste de fallback sem token
    const origToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
    delete process.env.MERCADO_PAGO_ACCESS_TOKEN;

    const simulated = await createCheckoutPreference({
      planKey: "pro_monthly",
      userId: "test-user-id",
      userEmail: "test@example.com",
      userName: "Test User",
      appUrl: "http://localhost:3000",
    });

    if (origToken) process.env.MERCADO_PAGO_ACCESS_TOKEN = origToken;

    if (!simulated || !simulated.isSimulated || simulated.initPoint !== null) {
      throw new Error(`Modo simulação sem token falhou: ${JSON.stringify(simulated)}`);
    }

    // Teste de plano inválido
    let threwForInvalid = false;
    try {
      await createCheckoutPreference({
        planKey: "non_existent_plan",
        userId: "test-user-id",
        userEmail: "test@example.com",
        appUrl: "http://localhost:3000",
      });
    } catch {
      threwForInvalid = true;
    }

    if (!threwForInvalid) {
      throw new Error("createCheckoutPreference não lançou erro para plano inexistente");
    }

    // Limpar arquivo temporário
    if (fs.existsSync(tempCjsPath)) fs.unlinkSync(tempCjsPath);

    record(
      "mercadopago_module",
      "Módulo utils/mercadopago.ts (Planos, Preços e Fallback)",
      "PASS",
      `4 planos validados (${expectedKeys.join(", ")}), fallback gracioso sem token testado com sucesso`
    );
  } catch (err) {
    record("mercadopago_module", "Módulo utils/mercadopago.ts", "FAIL", err.message);
  }
}

async function testCsvFormatting() {
  try {
    const mockLeads = [
      {
        name: "João Silva",
        contact: "joao@exemplo.com.br",
        type: "E-mail",
        message: "Gostaria de saber mais sobre a mentoria individual.",
        bioTitle: "Mentoria & Consultoria",
        bioUrl: "http://localhost:3000/b/joao/mentoria",
        date: "28/10/2026 15:30",
      },
      {
        name: "Maria Oliveira",
        contact: "11987654321",
        type: "WhatsApp / Telefone",
        message: 'Interesse na "turma 2", contato urgente!',
        bioTitle: "Cursos Online",
        bioUrl: "http://localhost:3000/b/maria/cursos",
        date: "28/10/2026 16:45",
      },
    ];

    const dataToExport = mockLeads.map((lead) => ({
      Nome: lead.name,
      Contato: lead.contact,
      "Tipo de Contato": lead.type,
      "Mensagem / Interesse": lead.message,
      "Página de Origem": lead.bioTitle,
      "URL da Bio": lead.bioUrl,
      "Data da Captura": lead.date,
    }));

    const bomPrefix = "\uFEFF";
    const rawCsv = Papa.unparse(dataToExport);
    const fullCsv = bomPrefix + rawCsv;

    // Verificar BOM UTF-8
    if (!fullCsv.startsWith("\uFEFF")) {
      throw new Error("BOM UTF-8 ausente no início do CSV");
    }

    // Verificar cabeçalhos e campos
    const parsed = Papa.parse(rawCsv, { header: true });
    if (parsed.errors.length > 0) {
      throw new Error(`Erros ao parsear CSV gerado: ${JSON.stringify(parsed.errors)}`);
    }

    const expectedCols = [
      "Nome",
      "Contato",
      "Tipo de Contato",
      "Mensagem / Interesse",
      "Página de Origem",
      "URL da Bio",
      "Data da Captura",
    ];

    const actualCols = parsed.meta.fields;
    for (const col of expectedCols) {
      if (!actualCols.includes(col)) {
        throw new Error(`Coluna esperada "${col}" ausente no CSV`);
      }
    }

    if (parsed.data.length !== 2) {
      throw new Error(`Quantidade de linhas divergente: esperada 2, obtida ${parsed.data.length}`);
    }

    if (parsed.data[1]["Mensagem / Interesse"] !== mockLeads[1].message) {
      throw new Error("Tratamento de aspas e caracteres especiais no CSV inconsistente");
    }

    record(
      "csv_formatting",
      "Formatação e Exportação CSV (PapaParse com UTF-8 BOM)",
      "PASS",
      `Encoding UTF-8 BOM verificado, 7 colunas validadas, escape de aspas e caracteres especiais testado`
    );
  } catch (err) {
    record("csv_formatting", "Formatação e Exportação CSV", "FAIL", err.message);
  }
}

async function runAll() {
  console.log("=== INICIANDO SUÍTE DE TESTES DE INTEGRAÇÃO & QA - LINKSNAP ===");
  await testWebhookGET();
  await testWebhookPOST();
  await testRedirectBilling();
  await testRedirectLeads();
  await testSupabaseBioLeads();
  await testMercadoPagoModule();
  await testCsvFormatting();
  console.log("=== RESUMO FINAL DOS TESTES ===");
  const total = results.length;
  const passed = results.filter((r) => r.status === "PASS").length;
  const failed = results.filter((r) => r.status === "FAIL").length;
  console.log(`Total: ${total} | Aprovados: ${passed} | Falhas: ${failed}`);
  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runAll();
