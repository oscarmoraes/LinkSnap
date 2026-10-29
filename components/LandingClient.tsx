"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Check,
  X,
  Sparkles,
  Zap,
  Smartphone,
  UserCheck,
  QrCode,
  DollarSign,
  Wifi,
  Compass,
  BarChart3,
  ShieldCheck,
  ShoppingBag,
  MessageSquare,
  Users,
  Building,
  Globe,
  BadgeCheck,
  ChevronDown,
  Layers,
  ExternalLink,
  Copy,
  Clock,
  Star,
} from "lucide-react";

type ProfileId = "todos" | "creator" | "vendedor" | "profissional" | "empresas" | "agencia";

interface PlanFeature {
  text: string;
  included: boolean;
}

interface PricingPlan {
  name: string;
  subtitle: string;
  monthlyPrice: string;
  annualPrice: string;
  periodNote: string;
  badge?: string;
  highlighted?: boolean;
  ctaText: string;
  features: PlanFeature[];
}

interface ProfilePricingData {
  id: ProfileId;
  label: string;
  headline: string;
  subheadline: string;
  plans: PricingPlan[];
}

const PROFILE_AVATAR: Record<ProfileId, string> = {
  todos: "/landing/hero-creator-aurora.jpg",
  creator: "/landing/social-4.jpg",
  vendedor: "/landing/social-2.jpg",
  profissional: "/landing/social-3.jpg",
  empresas: "/landing/cracha-rafael.jpg",
  agencia: "/landing/social-1.jpg",
};

const PRICING_BY_PROFILE: Record<ProfileId, ProfilePricingData> = {
  todos: {
    id: "todos",
    label: "Visão Geral",
    headline: "Planos sob medida para cada fase do seu negócio",
    subheadline: "Comece grátis sem cartão ou desbloqueie recursos profissionais em Reais via Mercado Pago.",
    plans: [
      {
        name: "Gratuito",
        subtitle: "Para dar os primeiros passos e organizar seus links principais.",
        monthlyPrice: "R$ 0",
        annualPrice: "R$ 0",
        periodNote: "Grátis para sempre",
        ctaText: "Começar Grátis",
        features: [
          { text: "1 Página de Bio básica (/b/seunome)", included: true },
          { text: "Até 20 links encurtados globais", included: true },
          { text: "Gerador de link WhatsApp e QR Code Wi-Fi", included: true },
          { text: "Recebimento via Pix Oficial (0% de taxa)", included: true },
          { text: "Vitrine de Produtos com Preço e Cupom", included: false },
          { text: "Captura nativa de Leads na Bio", included: false },
          { text: "1 Domínio próprio (.com.br) e links com marca", included: false },
          { text: "Remoção da marca LinkSnap e Selo Verificado", included: false },
          { text: "Carteirinhas e Crachás de Equipe corporativos", included: false },
        ],
      },
      {
        name: "Pro Brasil",
        subtitle: "Ideal para criadores, vendedores, autônomos e pequenos negócios.",
        monthlyPrice: "R$ 19,90",
        annualPrice: "R$ 14,90",
        periodNote: "por mês",
        badge: "Mais Popular",
        highlighted: true,
        ctaText: "Assinar Pro com Pix ou Cartão",
        features: [
          { text: "Vitrine de Produtos & Infoprodutos ilimitada", included: true },
          { text: "Captura nativa de Leads (Nome + WhatsApp) na Bio", included: true },
          { text: "1 Domínio Próprio (.com.br) com SSL incluso", included: true },
          { text: "Selo Verificado Azul oficial", included: true },
          { text: "Links encurtados com marca (/r/@suamarca) ilimitados", included: true },
          { text: "Até 5 Bio Pages simultâneas ativas", included: true },
          { text: "Páginas 100% limpas sem marca d'água LinkSnap", included: true },
          { text: "Agendamento de campanhas e Construtor UTM", included: true },
          { text: "Carteirinhas de equipe corporativas", included: false },
        ],
      },
      {
        name: "Business & Equipes",
        subtitle: "Para empresas, clínicas, eventos e agências que gerenciam times.",
        monthlyPrice: "R$ 49,90",
        annualPrice: "R$ 34,90",
        periodNote: "por mês",
        badge: "Ecossistema Completo",
        ctaText: "Assinar Business",
        features: [
          { text: "Tudo do plano Pro Brasil incluso", included: true },
          { text: "Carteirinhas e Crachás de Equipe ilimitados (/c/empresa/membro)", included: true },
          { text: "Validação pública de status por QR Code em tempo real", included: true },
          { text: "Importação de equipe em lote via planilha CSV", included: true },
          { text: "Até 5 domínios próprios (.com.br) gerenciados", included: true },
          { text: "Relatórios públicos compartilháveis (sem login)", included: true },
          { text: "Download de crachás em PNG de alta resolução para gráfica", included: true },
          { text: "Suporte prioritário em português via WhatsApp", included: true },
        ],
      },
    ],
  },
  creator: {
    id: "creator",
    label: "Criador de Conteúdo",
    headline: "Transforme seguidores em fãs e monetize sua audiência em Reais",
    subheadline: "Pare de pagar em dólar por ferramentas limitadas. Tenha Pix na Bio, agenda de publis e vitrine de afiliados.",
    plans: [
      {
        name: "Creator Free",
        subtitle: "Para organizar suas redes sociais em um link único.",
        monthlyPrice: "R$ 0",
        annualPrice: "R$ 0",
        periodNote: "Grátis para sempre",
        ctaText: "Criar Bio Grátis",
        features: [
          { text: "1 Página de Bio personalizada (/b/seu-arroba)", included: true },
          { text: "Até 20 links encurtados para redes sociais", included: true },
          { text: "QR Code Pix para receber apoios (0% taxa)", included: true },
          { text: "Gerador de link WhatsApp com mensagem pronta", included: true },
          { text: "Vitrine de achadinhos e afiliados com preço e cupom", included: false },
          { text: "Captura de contatos e WhatsApp de seguidores VIPs", included: false },
          { text: "Domínio próprio e links curtos com seu @", included: false },
          { text: "Selo Verificado Azul e remoção do rodapé", included: false },
        ],
      },
      {
        name: "Afiliado & Creator PRO",
        subtitle: "Perfeito para influenciadores, streamers e afiliados profissionais.",
        monthlyPrice: "R$ 19,90",
        annualPrice: "R$ 14,90",
        periodNote: "por mês",
        badge: "Recomendado para você",
        highlighted: true,
        ctaText: "Destravar Creator PRO",
        features: [
          { text: "Vitrine de Achadinhos & Afiliados com foto, preço e cupom", included: true },
          { text: "Captura de Leads (Nome + WhatsApp) de seguidores VIPs", included: true },
          { text: "1 Domínio próprio ou links curtos com seu @ (/r/@voce/link)", included: true },
          { text: "Selo Verificado Azul de autenticidade no perfil", included: true },
          { text: "Links encurtados ilimitados para vídeos e stories", included: true },
          { text: "Até 5 Bio Pages independentes para nichos", included: true },
          { text: "Páginas sem marca d'água LinkSnap", included: true },
          { text: "Agendamento de links para publis e lançamentos", included: true },
        ],
      },
      {
        name: "Creator Studio & Equipe",
        subtitle: "Para criadores com assessoria, múltiplos canais ou staff.",
        monthlyPrice: "R$ 49,90",
        annualPrice: "R$ 34,90",
        periodNote: "por mês",
        ctaText: "Assinar Creator Studio",
        features: [
          { text: "Tudo do Afiliado & Creator PRO incluso", included: true },
          { text: "Crachás digitais para assessoria, gravação e staff", included: true },
          { text: "Validação pública de crachás de staff por QR Code", included: true },
          { text: "Até 5 domínios próprios para marcas e canais", included: true },
          { text: "Relatórios de cliques compartilháveis ao vivo para marcas", included: true },
          { text: "Importação em lote de equipe via CSV", included: true },
          { text: "Download em PNG de alta resolução para crachás", included: true },
          { text: "Suporte prioritário da equipe LinkSnap via WhatsApp", included: true },
        ],
      },
    ],
  },
  vendedor: {
    id: "vendedor",
    label: "Vendedor / Infoprodutor",
    headline: "Sua máquina de vendas para Hotmart, Kiwify, Shopee e WhatsApp",
    subheadline: "Exiba seus produtos com preço ancorado, cupom copiável, cobrança Pix direta e rastreamento UTM.",
    plans: [
      {
        name: "Balcão Inicial",
        subtitle: "Para validar seus primeiros produtos e atender no WhatsApp.",
        monthlyPrice: "R$ 0",
        annualPrice: "R$ 0",
        periodNote: "Grátis para sempre",
        ctaText: "Começar a Vender",
        features: [
          { text: "1 Página de Bio básica com botão direto para WhatsApp", included: true },
          { text: "Gerador de link wa.me com mensagem pronta", included: true },
          { text: "Gerador de QR Code Pix Copia e Cola sem taxas", included: true },
          { text: "Até 20 links curtos para rastrear cliques", included: true },
          { text: "Vitrine de Produtos com preço 'De/Por' e Cupom", included: false },
          { text: "Captura de Leads para recuperação de vendas", included: false },
          { text: "1 Domínio próprio da sua loja (.com.br)", included: false },
          { text: "Selo Verificado Azul e remoção de marca", included: false },
        ],
      },
      {
        name: "Infoprodutor & Vendas PRO",
        subtitle: "O plano favorito de infoprodutores, afiliados e lojas digitais.",
        monthlyPrice: "R$ 19,90",
        annualPrice: "R$ 14,90",
        periodNote: "por mês",
        badge: "Recomendado para você",
        highlighted: true,
        ctaText: "Impulsionar Minhas Vendas",
        features: [
          { text: "Vitrine de Produtos ilimitada (Hotmart, Kiwify, Shopee, Loja)", included: true },
          { text: "Cards com foto, preço promocional De/Por e cupom copiável", included: true },
          { text: "Captura nativa de Leads (Nome + WhatsApp) para recuperação", included: true },
          { text: "1 Domínio próprio da sua loja (.com.br) incluso com SSL", included: true },
          { text: "Links de campanha ilimitados com marca (/r/@loja/oferta)", included: true },
          { text: "Selo Verificado Azul para máxima credibilidade comercial", included: true },
          { text: "Agendamento automático de abertura e fecho de carrinho", included: true },
          { text: "Construtor de parâmetros UTM para tráfego pago", included: true },
        ],
      },
      {
        name: "Escala & Comercial Master",
        subtitle: "Para operações com time comercial, vendedores e lojas físicas.",
        monthlyPrice: "R$ 49,90",
        annualPrice: "R$ 34,90",
        periodNote: "por mês",
        ctaText: "Escalar Operação",
        features: [
          { text: "Tudo do Infoprodutor & Vendas PRO incluso", included: true },
          { text: "Crachás digitais verificáveis para time de vendedores", included: true },
          { text: "Evite golpes: cliente valida se o vendedor é oficial via QR", included: true },
          { text: "Até 5 domínios próprios para lojas e marcas", included: true },
          { text: "Importação de vendedores e promotores em lote via CSV", included: true },
          { text: "Relatórios de cliques e conversão compartilháveis com gestores", included: true },
          { text: "Placas QR Code Wi-Fi e Pix prontas para balcão físico", included: true },
          { text: "Suporte comercial prioritário via WhatsApp", included: true },
        ],
      },
    ],
  },
  profissional: {
    id: "profissional",
    label: "Profissional Liberal",
    headline: "Cartão de visitas digital, agendamento no WhatsApp e Pix para seu consultório",
    subheadline: "Para médicos, dentistas, advogados, corretores, personal trainers e prestadores de serviços.",
    plans: [
      {
        name: "Cartão Digital Free",
        subtitle: "Seu cartão de visitas interativo sempre atualizado.",
        monthlyPrice: "R$ 0",
        annualPrice: "R$ 0",
        periodNote: "Grátis para sempre",
        ctaText: "Criar Cartão Grátis",
        features: [
          { text: "1 Página profissional com bio, foto e especialidade", included: true },
          { text: "Até 20 links para contato e orientações", included: true },
          { text: "Botão de agendamento rápido via WhatsApp", included: true },
          { text: "QR Code Wi-Fi para recepção / sala de espera", included: true },
          { text: "Vitrine de Serviços, Consultas ou Procedimentos", included: false },
          { text: "Captura de contatos de pacientes/clientes na Bio", included: false },
          { text: "Domínio próprio profissional (.com.br)", included: false },
          { text: "Selo Verificado Azul e remoção da marca", included: false },
        ],
      },
      {
        name: "Consultório PRO",
        subtitle: "Transmita autoridade máxima e facilite a vida do seu cliente.",
        monthlyPrice: "R$ 19,90",
        annualPrice: "R$ 14,90",
        periodNote: "por mês",
        badge: "Recomendado para você",
        highlighted: true,
        ctaText: "Assinar Consultório PRO",
        features: [
          { text: "Vitrine de Serviços, Procedimentos e Pacotes com valores", included: true },
          { text: "Formulário de pré-atendimento (Nome + WhatsApp) na Bio", included: true },
          { text: "1 Domínio próprio profissional (.com.br) com SSL grátis", included: true },
          { text: "Selo Verificado Azul de autoridade e credibilidade", included: true },
          { text: "Links curtos elegantes (/r/@dr-nome/orientacoes) ilimitados", included: true },
          { text: "Até 5 Bio Pages para consultórios e especialidades", included: true },
          { text: "Página 100% limpa sem nenhuma marca d'água", included: true },
          { text: "Estatísticas de acessos e cliques no WhatsApp", included: true },
        ],
      },
      {
        name: "Clínica & Escritório Master",
        subtitle: "Para clínicas médicas, imobiliárias e escritórios com equipe.",
        monthlyPrice: "R$ 49,90",
        annualPrice: "R$ 34,90",
        periodNote: "por mês",
        ctaText: "Assinar Plano Clínica",
        features: [
          { text: "Tudo do Consultório PRO incluso", included: true },
          { text: "Crachás e carteirinhas digitais para médicos e secretárias", included: true },
          { text: "Validação online de registro profissional e vínculo por QR Code", included: true },
          { text: "Até 5 domínios próprios para filiais e clínicas", included: true },
          { text: "Importação rápida de equipe via planilha CSV", included: true },
          { text: "Download de crachás em alta resolução (PNG) para impressão PVC", included: true },
          { text: "Relatórios de atendimento e cliques compartilháveis", included: true },
          { text: "Suporte prioritário dedicado LinkSnap via WhatsApp", included: true },
        ],
      },
    ],
  },
  empresas: {
    id: "empresas",
    label: "Empresas & Equipes",
    headline: "Identificação de funcionários, crachás com QR Code ativo e links corporativos",
    subheadline: "Emita carteirinhas em lote via CSV, valide colaboradores em tempo real e proteja sua marca.",
    plans: [
      {
        name: "Teste Corporativo",
        subtitle: "Conheça a plataforma e valide o formato com sua equipe.",
        monthlyPrice: "R$ 0",
        annualPrice: "R$ 0",
        periodNote: "Grátis para sempre",
        ctaText: "Criar Conta Empresa",
        features: [
          { text: "1 Bio Page institucional básica (/b/empresa)", included: true },
          { text: "Até 20 links encurtados internos", included: true },
          { text: "Gerador de QR Code Wi-Fi para visitantes", included: true },
          { text: "Gerador de links WhatsApp corporativos", included: true },
          { text: "Carteirinhas e crachás de equipe corporativos", included: false },
          { text: "Emissão em lote de crachás via planilha CSV", included: false },
          { text: "Validação pública de status (Ativo/Desligado)", included: false },
          { text: "Domínio próprio corporativo (.com.br)", included: false },
        ],
      },
      {
        name: "Corporativo PRO",
        subtitle: "Ideal para empresas que querem links de marca e bio institucional.",
        monthlyPrice: "R$ 19,90",
        annualPrice: "R$ 14,90",
        periodNote: "por mês",
        badge: "Recomendado para você",
        highlighted: true,
        ctaText: "Assinar Corporativo PRO",
        features: [
          { text: "1 Domínio próprio corporativo (.com.br) incluso", included: true },
          { text: "Vitrine de Produtos e Serviços B2B", included: true },
          { text: "Captura de Leads corporativos (Nome + WhatsApp)", included: true },
          { text: "Selo Verificado Azul oficial para a empresa", included: true },
          { text: "Links encurtados ilimitados com marca (/r/@empresa)", included: true },
          { text: "Até 5 Bio Pages para departamentos e comunicados", included: true },
          { text: "Páginas institucionais sem marca d'água LinkSnap", included: true },
          { text: "Carteirinhas corporativas em lote (exclusivo Business)", included: false },
        ],
      },
      {
        name: "Business Corporate & Eventos",
        subtitle: "Para grandes equipes, redes de franquias, eventos e associações.",
        monthlyPrice: "R$ 49,90",
        annualPrice: "R$ 34,90",
        periodNote: "por mês",
        badge: "Máxima Capacidade",
        ctaText: "Assinar Corporate",
        features: [
          { text: "Tudo do Corporativo PRO incluso", included: true },
          { text: "Carteirinhas e Crachás de equipe ilimitados (/c/empresa/membro)", included: true },
          { text: "Validação pública de status por QR Code antifraude em tempo real", included: true },
          { text: "Importação de colaboradores em lote via planilha CSV", included: true },
          { text: "Até 5 domínios próprios para filiais, departamentos ou eventos", included: true },
          { text: "Desativação imediata de crachás de ex-colaboradores em 1 clique", included: true },
          { text: "Download em PNG de alta resolução para impressão gráfica em PVC", included: true },
          { text: "Relatórios públicos de acesso e auditoria compartilháveis", included: true },
        ],
      },
    ],
  },
  agencia: {
    id: "agencia",
    label: "Agências",
    headline: "Entregue páginas de alta conversão, links rastreáveis e relatórios para seus clientes",
    subheadline: "Compartilhe resultados em tempo real sem precisar criar login e senha para cada cliente.",
    plans: [
      {
        name: "Freelancer Inicial",
        subtitle: "Para social medias e gestores de tráfego iniciando.",
        monthlyPrice: "R$ 0",
        annualPrice: "R$ 0",
        periodNote: "Grátis para sempre",
        ctaText: "Testar Gratuitamente",
        features: [
          { text: "1 Página de Bio para portfólio de links", included: true },
          { text: "Até 20 links encurtados para clientes", included: true },
          { text: "Construtor básico de links para WhatsApp", included: true },
          { text: "Gerador de QR Code para materiais impressos", included: true },
          { text: "Relatórios públicos compartilháveis (sem login)", included: false },
          { text: "Construtor UTM com predefinições de campanhas", included: false },
          { text: "Vitrine de Imóveis / Produtos dos clientes", included: false },
          { text: "Domínio próprio e remoção da marca LinkSnap", included: false },
        ],
      },
      {
        name: "Agência & Imobiliária PRO",
        subtitle: "Gerencie campanhas, links UTM e páginas de vendas com velocidade.",
        monthlyPrice: "R$ 19,90",
        annualPrice: "R$ 14,90",
        periodNote: "por mês",
        badge: "Recomendado para você",
        highlighted: true,
        ctaText: "Assinar Plano Agência PRO",
        features: [
          { text: "Vitrine de Imóveis, Produtos e Catálogos de clientes", included: true },
          { text: "Captura de Leads na Bio com exportação para CRM", included: true },
          { text: "1 Domínio próprio (.com.br) incluso com SSL", included: true },
          { text: "Selo Verificado Azul e páginas sem marca LinkSnap", included: true },
          { text: "Construtor UTM nativo com salvamento de predefinições", included: true },
          { text: "Links encurtados ilimitados com marca (/r/@cliente)", included: true },
          { text: "Agendamento de campanhas sazonais e lançamentos", included: true },
          { text: "Carteirinhas corporativas em lote (exclusivo Business)", included: false },
        ],
      },
      {
        name: "Agência Scale & Imobiliária Master",
        subtitle: "Para agências consolidadas, imobiliárias e produtoras de eventos.",
        monthlyPrice: "R$ 49,90",
        annualPrice: "R$ 34,90",
        periodNote: "por mês",
        ctaText: "Assinar Agência Scale",
        features: [
          { text: "Tudo do Agência & Imobiliária PRO incluso", included: true },
          { text: "Carteirinhas e crachás digitais ilimitados para corretores e staff", included: true },
          { text: "Validação online de credenciais por QR Code antifraude", included: true },
          { text: "Até 5 domínios próprios gerenciados", included: true },
          { text: "Relatórios ao vivo compartilháveis por link (cliente vê sem senha)", included: true },
          { text: "Importação de corretores/equipes em lote via planilha CSV", included: true },
          { text: "Download de crachás em PNG alta resolução para gráfica", included: true },
          { text: "Atendimento prioritário VIP para agências e imobiliárias", included: true },
        ],
      },
    ],
  },
};

const FAQ_ITEMS = [
  {
    question: "Por que escolher o LinkSnap em vez de ferramentas estrangeiras em dólar?",
    answer:
      "Ferramentas gringas cobram entre US$ 9 e US$ 29 por mês (mais IOF no cartão internacional) e não possuem os recursos que o brasileiro realmente usa no dia a dia. O LinkSnap foi construído 100% para a realidade do Brasil: tem gerador de Pix Copia e Cola sem taxas, vitrine de produtos pronta para Hotmart, Kiwify, Shopee e Mercado Livre, foco total em conversão no WhatsApp, crachás digitais de equipe e planos acessíveis em Reais.",
  },
  {
    question: "O LinkSnap cobra alguma porcentagem sobre as minhas vendas ou Pix recebidos?",
    answer:
      "Zero! Nós cobramos 0% de comissão ou taxa de intermediação. Quando você configura sua chave Pix na sua Bio ou cria um link de cobrança (/p), o QR Code oficial padrão EMVCo é gerado diretamente para a sua chave bancária. O dinheiro sai do banco do seu cliente e cai direto na sua conta na mesma hora, sem passar por nós.",
  },
  {
    question: "Como funciona a Vitrine de Produtos e Infoprodutos na Bio?",
    answer:
      "Você pode cadastrar produtos físicos, cursos, mentorias ou links de afiliado com foto, título, preço promocional ('De R$ 197 por R$ 97'), tag de cupom de desconto copiável com 1 clique e botão de compra direta que leva para seu checkout (Hotmart, Kiwify, Eduzz, Shopee, Mercado Livre) ou direto para fechar pedido no seu WhatsApp com mensagem pré-preenchida.",
  },
  {
    question: "Como funcionam as Carteirinhas e Crachás de Equipe (/c/empresa/membro)?",
    answer:
      "Empresas, clínicas, escolas e organizadores de eventos podem criar crachás funcionais com foto, nome, cargo, matrícula e validade. Você pode cadastrar individualmente ou importar dezenas de colaboradores em segundos via planilha CSV. Cada crachá possui um QR Code único que, ao ser escaneado por qualquer celular, abre uma página pública de validação confirmando em tempo real se aquele profissional está ATIVO na empresa — evitando fraudes e trazendo máxima segurança.",
  },
  {
    question: "Como é feito o pagamento dos planos pagos? É seguro?",
    answer:
      "Todos os pagamentos são processados em Reais (R$) de forma 100% segura através do Mercado Pago, a maior instituição de pagamentos da América Latina. Você pode assinar usando Pix imediato (liberação na hora) ou Cartão de Crédito nacional, sem surpresas de câmbio ou taxas internacionais.",
  },
  {
    question: "Posso começar grátis e fazer upgrade depois sem perder meus links?",
    answer:
      "Sim! Você pode criar sua conta gratuita agora mesmo, reivindicar seu endereço (/b/seunome), criar links curtos, QR Codes de Wi-Fi e Pix sem precisar cadastrar cartão. Quando quiser liberar a vitrine de produtos completa, links com @suamarca, selo verificado ou crachás de equipe, basta fazer o upgrade em 1 minuto mantendo todos os seus links e estatísticas intactos.",
  },
];

export default function LandingClient({ isLoggedIn }: { isLoggedIn: boolean }) {
  const router = useRouter();
  const [handle, setHandle] = useState("");
  const [selectedProfile, setSelectedProfile] = useState<ProfileId>("todos");
  const [billingCycle, setBillingCycle] = useState<"anual" | "mensal">("anual");
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [copiedDemoPix, setCopiedDemoPix] = useState(false);

  const sanitizedHandle = handle
    .toLowerCase()
    .replace(/[^a-z0-9-_]/g, "")
    .slice(0, 30);

  const handleClaimSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoggedIn) {
      router.push("/dashboard/bio");
    } else {
      const targetHandle = sanitizedHandle || "sua-marca";
      router.push(`/login?handle=${encodeURIComponent(targetHandle)}`);
    }
  };

  const handleCopyDemoPix = () => {
    setCopiedDemoPix(true);
    setTimeout(() => setCopiedDemoPix(false), 2000);
  };

  const currentProfileData = PRICING_BY_PROFILE[selectedProfile];

  return (
    <div className="min-h-screen bg-[#FFFFFF] text-zinc-900 selection:bg-blue-600 selection:text-white">
      {/* 1. TOPBAR STICKY */}
      <header className="sticky top-0 z-50 border-b border-zinc-200 bg-white/95 shadow-xs backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2.5">
            <img
              src="/brand/logo-mark.svg"
              alt="LinkSnap"
              className="h-9 w-9 rounded-xl shadow-xs"
            />
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-black tracking-tight text-zinc-900">
                link<span className="text-blue-600">Snap</span>
              </span>
              <span className="hidden rounded-md border border-blue-300 bg-blue-50 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-700 sm:inline-block">
                BR
              </span>
            </div>
          </Link>

          <nav className="hidden items-center gap-7 md:flex">
            <a
              href="#recursos"
              className="text-sm font-medium text-zinc-600 transition hover:text-zinc-900"
            >
              Recursos
            </a>
            <a
              href="#feito-pro-brasil"
              className="text-sm font-medium text-zinc-600 transition hover:text-zinc-900"
            >
              Feito pro Brasil
            </a>
            <a
              href="#carteirinhas"
              className="text-sm font-medium text-zinc-600 transition hover:text-zinc-900"
            >
              Carteirinhas
            </a>
            <a
              href="#pricing"
              className="text-sm font-medium text-zinc-600 transition hover:text-zinc-900"
            >
              Planos e Preços
            </a>
            <a
              href="#faq"
              className="text-sm font-medium text-zinc-600 transition hover:text-zinc-900"
            >
              FAQ
            </a>
          </nav>

          <div className="flex items-center gap-3">
            {isLoggedIn ? (
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
              >
                Abrir Painel
                <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 hover:text-zinc-900"
                >
                  Entrar
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
                >
                  <span>Criar Conta Grátis</span>
                  <ArrowRight className="hidden h-4 w-4 sm:inline" />
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* 2. HERO INTERATIVO INSTIGANTE */}
      <section className="relative overflow-hidden border-b border-zinc-200 bg-[#FFFFFF] pt-12 pb-20 lg:pt-16 lg:pb-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-10">
            {/* Coluna Esquerda: Copy + Input Interativo */}
            <div className="lg:col-span-7">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3.5 py-1.5 text-xs font-bold text-blue-600">
                <Sparkles className="h-3.5 w-3.5" />
                <span>+10 Ferramentas em 1 só lugar • Feito para o Brasil</span>
              </div>

              <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-zinc-900 sm:text-5xl lg:text-[52px] lg:leading-[1.12]">
                Sua Bio de Vendas, Encurtador com Marca e{" "}
                <span className="text-blue-600">Crachás de Equipe</span> num só lugar.
              </h1>

              <p className="mt-5 max-w-2xl text-base leading-relaxed text-zinc-600 sm:text-lg">
                Receba por Pix sem taxas, atenda no WhatsApp, monte sua vitrine de produtos,
                encurte links com <code className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-sm font-semibold text-zinc-900">@suamarca</code> e emita carteirinhas digitais para sua equipe.
              </p>

              {/* Input Interativo "Reivindique seu Link" */}
              <form
                onSubmit={handleClaimSubmit}
                className="mt-8 max-w-xl rounded-2xl border-2 border-zinc-300 bg-zinc-50 p-2 shadow-md transition focus-within:border-blue-600 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-600/15"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <div className="flex flex-1 items-center rounded-xl border border-zinc-200 bg-white px-3.5 py-3 sm:border-transparent sm:bg-transparent sm:py-2">
                    <Globe className="mr-2 h-4 w-4 shrink-0 text-blue-600" />
                    <span className="select-none font-mono text-sm font-semibold text-zinc-500">
                      linksnap.com.br/b/
                    </span>
                    <input
                      type="text"
                      value={handle}
                      onChange={(e) => setHandle(e.target.value)}
                      placeholder="seu-nome"
                      aria-label="Digite seu nome ou marca para reivindicar seu link"
                      className="border-transparent w-full min-w-[100px] bg-transparent font-mono text-sm font-bold text-zinc-900 placeholder-zinc-400 focus:outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    className="inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700"
                  >
                    <span>Criar minha página grátis</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </form>

              {/* Micro-benefícios abaixo do input */}
              <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-semibold text-zinc-700">
                <span className="inline-flex items-center gap-1.5">
                  <Check className="h-4 w-4 text-emerald-600" /> Grátis para começar
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Check className="h-4 w-4 text-emerald-600" /> 0% de taxa sobre seu Pix
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Check className="h-4 w-4 text-emerald-600" /> Planos em R$ via Mercado Pago
                </span>
              </div>

              {/* Barra de Prova Social com Avatares Brasileiros Reais */}
              <div className="mt-6 flex flex-wrap items-center gap-4 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 shadow-xs sm:max-w-xl">
                <div className="flex -space-x-2.5">
                  <img
                    src="/landing/social-1.jpg"
                    alt="Criador brasileiro"
                    className="h-9 w-9 rounded-full border-2 border-white object-cover shadow-xs"
                  />
                  <img
                    src="/landing/social-2.jpg"
                    alt="Lojista brasileira"
                    className="h-9 w-9 rounded-full border-2 border-white object-cover shadow-xs"
                  />
                  <img
                    src="/landing/social-3.jpg"
                    alt="Profissional liberal"
                    className="h-9 w-9 rounded-full border-2 border-white object-cover shadow-xs"
                  />
                  <img
                    src="/landing/social-4.jpg"
                    alt="Influenciadora digital"
                    className="h-9 w-9 rounded-full border-2 border-white object-cover shadow-xs"
                  />
                </div>
                <div className="text-xs">
                  <div className="flex items-center gap-1 font-bold text-zinc-900">
                    <span className="text-amber-500">★★★★★</span>
                    <span>4.9/5 de aprovação</span>
                  </div>
                  <p className="text-zinc-600">
                    Escolhido por <strong className="font-semibold text-zinc-900">criadores, lojas e equipes</strong> em todo o Brasil
                  </p>
                </div>
              </div>

              {/* Mini-estatísticas / Social Proof */}
              <div className="mt-7 grid grid-cols-3 gap-4 border-t border-zinc-200 pt-6 sm:max-w-lg">
                <div>
                  <p className="text-xl font-extrabold text-zinc-900">0% Taxa</p>
                  <p className="text-xs text-zinc-600">No Pix direto na sua conta</p>
                </div>
                <div>
                  <p className="text-xl font-extrabold text-zinc-900">4 Rotas</p>
                  <p className="text-xs text-zinc-600">Bio, Links, Pix, Wi-Fi & Crachás</p>
                </div>
                <div>
                  <p className="text-xl font-extrabold text-zinc-900">100% BR</p>
                  <p className="text-xs text-zinc-600">Sem cobrança em dólar</p>
                </div>
              </div>
            </div>

            {/* Coluna Direita: Mockup Visual Rico com Fotos Reais e Gatilhos Flutuantes */}
            <div className="relative lg:col-span-5">
              {/* Badge Flutuante 1: Pix Recebido (Gatilho de Conversão) */}
              <div className="hidden sm:flex absolute -left-6 top-10 z-20 items-center gap-2.5 rounded-2xl border border-emerald-300 bg-white px-3.5 py-2.5 shadow-lg">
                <span className="relative flex h-3 w-3">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500"></span>
                </span>
                <div className="text-xs">
                  <p className="font-extrabold text-zinc-900">Pix Recebido • R$ 147,00</p>
                  <p className="text-[10px] font-semibold text-emerald-700">0% de taxa • Caiu na hora</p>
                </div>
              </div>

              {/* Badge Flutuante 2: Cupom Copiado (Gatilho de Conversão) */}
              <div className="hidden sm:flex absolute -right-4 bottom-24 z-20 items-center gap-2 rounded-2xl border border-amber-300 bg-white px-3.5 py-2 shadow-lg">
                <span className="rounded-lg bg-amber-100 px-2 py-1 font-mono text-[11px] font-extrabold text-amber-900">
                  PIX10
                </span>
                <div className="text-xs">
                  <p className="font-bold text-zinc-900">Cupom copiado 38x hoje</p>
                  <p className="text-[10px] text-zinc-500">+27% de conversão na Bio</p>
                </div>
              </div>

              {/* Container Principal do Mockup de Bio */}
              <div className="relative mx-auto max-w-md rounded-3xl border-2 border-zinc-200 bg-zinc-50 p-4 shadow-xl sm:p-5">
                {/* Barra de URL do Mockup */}
                <div className="mb-4 flex items-center justify-between rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs shadow-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                    <span className="font-mono font-semibold text-zinc-800">
                      linksnap.com.br/b/{sanitizedHandle || "studio-aurora"}
                    </span>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-md border border-blue-200 bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                    <BadgeCheck className="h-3 w-3" /> Verificado
                  </span>
                </div>

                {/* Card de Perfil dentro do Mockup */}
                <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-xs">
                  <div className="flex items-center gap-3.5">
                    <img
                      src="/landing/hero-creator-aurora.jpg"
                      alt="Studio Aurora Brasil"
                      className="h-14 w-14 shrink-0 rounded-2xl border border-zinc-200 object-cover shadow-xs"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <h3 className="truncate text-base font-bold text-zinc-900">
                          Studio Aurora Brasil
                        </h3>
                        <BadgeCheck className="h-4 w-4 shrink-0 text-blue-600" />
                      </div>
                      <p className="text-xs text-zinc-600">
                        Produtos autorais, consultoria & atendimento rápido no WhatsApp.
                      </p>
                    </div>
                  </div>

                  {/* 1. Botão WhatsApp Destaque */}
                  <div className="mt-4 flex items-center justify-between rounded-xl border border-emerald-300 bg-emerald-50/80 px-3.5 py-2.5 text-emerald-950 shadow-2xs">
                    <div className="flex items-center gap-2.5">
                      <div className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-600 text-white">
                        <MessageSquare className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold">Chamar no WhatsApp Agora</p>
                        <p className="text-[11px] text-emerald-700">
                          Mensagem pronta • Resposta em 2 min
                        </p>
                      </div>
                    </div>
                    <ExternalLink className="h-4 w-4 text-emerald-700" />
                  </div>

                  {/* 2. Vitrine de Produto com Foto Real, Preço e Cupom */}
                  <div className="mt-3 rounded-xl border border-zinc-200 bg-zinc-50 p-3 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-1 rounded-md border border-blue-200 bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                        <ShoppingBag className="h-3 w-3" /> Vitrine na Bio
                      </span>
                      <span className="rounded border border-amber-300 bg-amber-100 px-1.5 py-0.5 font-mono text-[10px] font-bold text-amber-900">
                        CUPOM: PIX10
                      </span>
                    </div>
                    <div className="mt-2.5 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <img
                          src="/landing/hero-product-kit.jpg"
                          alt="Kit Mentoria + Pack Templates Pro"
                          className="h-12 w-12 shrink-0 rounded-lg border border-zinc-200 object-cover shadow-2xs"
                        />
                        <div>
                          <p className="text-xs font-bold text-zinc-900">
                            Kit Mentoria + Pack Templates Pro
                          </p>
                          <div className="mt-0.5 flex items-baseline gap-1.5">
                            <span className="text-[11px] text-zinc-400 line-through">
                              R$ 197,00
                            </span>
                            <span className="text-sm font-extrabold text-zinc-900">
                              R$ 97,00
                            </span>
                          </div>
                        </div>
                      </div>
                      <span className="shrink-0 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs">
                        Comprar
                      </span>
                    </div>
                  </div>

                  {/* 3. Bloco QR Code Pix sem Taxas */}
                  <div className="mt-3 flex items-center justify-between rounded-xl border border-zinc-200 bg-white p-3 shadow-2xs">
                    <div className="flex items-center gap-2.5">
                      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-zinc-200 bg-zinc-50 text-zinc-900">
                        <QrCode className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-bold text-zinc-900">
                            Pagamento Rápido via Pix
                          </p>
                          <span className="rounded border border-emerald-300 bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-900">
                            0% taxa
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-500">
                          QR Code EMVCo oficial • Cai na hora
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyDemoPix}
                      className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-zinc-300 bg-zinc-50 px-2.5 py-1.5 text-[11px] font-semibold text-zinc-800 transition hover:bg-zinc-100"
                    >
                      {copiedDemoPix ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-600" />
                          <span className="text-emerald-700">Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          <span>Copia e Cola</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* 4. Mini Preview de Crachá de Equipe com Foto Real */}
                  <div className="mt-3 rounded-xl border border-blue-300 bg-blue-50/60 p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <img
                          src="/landing/cracha-camila.jpg"
                          alt="Camila Rocha"
                          className="h-10 w-10 shrink-0 rounded-lg border border-blue-200 object-cover shadow-2xs"
                        />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <p className="text-xs font-bold text-zinc-900">
                              Crachá Digital: Camila Rocha
                            </p>
                            <span className="inline-flex items-center rounded-full border border-emerald-300 bg-emerald-100 px-1.5 py-0.5 text-[9px] font-bold uppercase text-emerald-900">
                              Ativo
                            </span>
                          </div>
                          <p className="font-mono text-[10px] text-zinc-600">
                            /c/aurora/camila • Consultora Oficial
                          </p>
                        </div>
                      </div>
                      <QrCode className="h-5 w-5 text-blue-600" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. FAIXA DE CASOS DE USO / PERFIS (GRID) */}
      <section className="border-b border-zinc-200 bg-zinc-50 py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-center text-xs font-bold uppercase tracking-wider text-zinc-500">
            Desenvolvido para quem move a economia real e digital no Brasil
          </p>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <div className="flex items-center gap-2.5 rounded-xl border border-zinc-200 bg-white p-3.5 shadow-2xs">
              <Sparkles className="h-5 w-5 shrink-0 text-blue-600" />
              <div>
                <p className="text-xs font-bold text-zinc-900">Criadores</p>
                <p className="text-[11px] text-zinc-500">Bio, Publis & Pix</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 rounded-xl border border-zinc-200 bg-white p-3.5 shadow-2xs">
              <ShoppingBag className="h-5 w-5 shrink-0 text-blue-600" />
              <div>
                <p className="text-xs font-bold text-zinc-900">Infoprodutores</p>
                <p className="text-[11px] text-zinc-500">Hotmart & Kiwify</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 rounded-xl border border-zinc-200 bg-white p-3.5 shadow-2xs">
              <DollarSign className="h-5 w-5 shrink-0 text-blue-600" />
              <div>
                <p className="text-xs font-bold text-zinc-900">Lojas & E-commerce</p>
                <p className="text-[11px] text-zinc-500">Shopee, ML & Balcão</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 rounded-xl border border-zinc-200 bg-white p-3.5 shadow-2xs">
              <ShieldCheck className="h-5 w-5 shrink-0 text-blue-600" />
              <div>
                <p className="text-xs font-bold text-zinc-900">Clínicas & Liberais</p>
                <p className="text-[11px] text-zinc-500">Agendamento & Wi-Fi</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 rounded-xl border border-zinc-200 bg-white p-3.5 shadow-2xs">
              <Building className="h-5 w-5 shrink-0 text-blue-600" />
              <div>
                <p className="text-xs font-bold text-zinc-900">Eventos & Empresas</p>
                <p className="text-[11px] text-zinc-500">Crachás QR & Equipe</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 rounded-xl border border-zinc-200 bg-white p-3.5 shadow-2xs">
              <BarChart3 className="h-5 w-5 shrink-0 text-blue-600" />
              <div>
                <p className="text-xs font-bold text-zinc-900">Agências</p>
                <p className="text-[11px] text-zinc-500">UTMs & Relatórios</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. SEÇÃO "FEITO PRO BRASIL (RECURSOS QUE OS GRINGOS NÃO TÊM)" */}
      <section id="feito-pro-brasil" className="border-b border-zinc-200 bg-[#FFFFFF] py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-bold text-blue-600">
              <Star className="h-3.5 w-3.5" /> Feito pro Brasil
            </span>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-zinc-900 sm:text-4xl">
              Recursos que as ferramentas gringas simplesmente não têm
            </h2>
            <p className="mt-4 text-base text-zinc-600">
              Enquanto plataformas em dólar entregam apenas uma lista de links estáticos, o LinkSnap resolve o funil completo de atendimento e pagamento do brasileiro.
            </p>
          </div>

          <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Card 1: Pix Oficial */}
            <div className="flex flex-col justify-between rounded-2xl border border-zinc-200 bg-zinc-50 p-6 transition hover:border-blue-300">
              <div>
                <div className="flex items-center justify-between">
                  <div className="grid h-11 w-11 place-items-center rounded-xl bg-blue-600 text-white">
                    <DollarSign className="h-5 w-5" />
                  </div>
                  <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700">
                    0% de comissão
                  </span>
                </div>
                <h3 className="mt-5 text-lg font-bold text-zinc-900">
                  Pix Oficial Direto na Bio e Link <code className="text-blue-600">/p</code>
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-600">
                  Gere QR Code padrão EMVCo e código Copia e Cola na hora com valor fixo ou aberto. Sem intermediários, 0% de comissão: o pagamento cai direto na sua conta bancária.
                </p>
              </div>
              <div className="mt-6 rounded-xl border border-zinc-200 bg-white p-3 font-mono text-xs text-zinc-700">
                linksnap.com.br/p/consultoria-vip
              </div>
            </div>

            {/* Card 2: Vitrine de Produtos */}
            <div className="flex flex-col justify-between rounded-2xl border border-zinc-200 bg-zinc-50 p-6 transition hover:border-blue-300">
              <div>
                <div className="flex items-center justify-between">
                  <div className="grid h-11 w-11 place-items-center rounded-xl bg-blue-600 text-white">
                    <ShoppingBag className="h-5 w-5" />
                  </div>
                  <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-blue-600">
                    Alta Conversão
                  </span>
                </div>
                <h3 className="mt-5 text-lg font-bold text-zinc-900">
                  Vitrine de Produtos & Infoprodutos
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-600">
                  Monte cards de produtos com foto, ancoragem de preço promocional, cupom de desconto copiável e botão de compra direta para Hotmart, Kiwify, Shopee, Mercado Livre ou WhatsApp.
                </p>
              </div>
              <div className="mt-6 flex items-center justify-between rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs">
                <span className="font-semibold text-zinc-800">Curso + Cupom 20% OFF</span>
                <span className="font-bold text-blue-600">Comprar →</span>
              </div>
            </div>

            {/* Card 3: WhatsApp em 1º Lugar */}
            <div className="flex flex-col justify-between rounded-2xl border border-zinc-200 bg-zinc-50 p-6 transition hover:border-blue-300">
              <div>
                <div className="flex items-center justify-between">
                  <div className="grid h-11 w-11 place-items-center rounded-xl bg-blue-600 text-white">
                    <MessageSquare className="h-5 w-5" />
                  </div>
                  <span className="rounded-full border border-zinc-200 bg-white px-2.5 py-0.5 text-xs font-bold text-zinc-700">
                    wa.me + QR
                  </span>
                </div>
                <h3 className="mt-5 text-lg font-bold text-zinc-900">
                  WhatsApp em 1º Lugar
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-600">
                  No Brasil, a venda acontece no WhatsApp. Crie botões de destaque com mensagem pronta pré-preenchida e gere QR Codes prontos para imprimir e colocar no balcão ou embalagem.
                </p>
              </div>
              <div className="mt-6 rounded-xl border border-zinc-200 bg-white p-3 text-xs text-zinc-600">
                &ldquo;Olá! Vi o produto na Bio e quero fechar pedido...&rdquo;
              </div>
            </div>

            {/* Card 4: Captura de Leads na Bio */}
            <div className="flex flex-col justify-between rounded-2xl border border-zinc-200 bg-zinc-50 p-6 transition hover:border-blue-300">
              <div>
                <div className="flex items-center justify-between">
                  <div className="grid h-11 w-11 place-items-center rounded-xl bg-blue-600 text-white">
                    <Users className="h-5 w-5" />
                  </div>
                  <span className="rounded-full border border-zinc-200 bg-white px-2.5 py-0.5 text-xs font-bold text-zinc-700">
                    CRM & CSV
                  </span>
                </div>
                <h3 className="mt-5 text-lg font-bold text-zinc-900">
                  Captura de Leads Nativa na Bio
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-600">
                  Não perca visitantes curiosos. Ative um formulário nativo na sua página de Bio para o visitante deixar Nome e WhatsApp em troca de um cupom, orçamento ou lista VIP.
                </p>
              </div>
              <div className="mt-6 flex items-center justify-between rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-600">
                <span>Nome + (11) 99999-9999</span>
                <span className="font-bold text-blue-600">Exportar CSV</span>
              </div>
            </div>

            {/* Card 5: Agendamento Sazonal */}
            <div className="flex flex-col justify-between rounded-2xl border border-zinc-200 bg-zinc-50 p-6 transition hover:border-blue-300 md:col-span-2 lg:col-span-2">
              <div>
                <div className="flex items-center justify-between">
                  <div className="grid h-11 w-11 place-items-center rounded-xl bg-blue-600 text-white">
                    <Clock className="h-5 w-5" />
                  </div>
                  <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-blue-600">
                    Automação de Campanhas
                  </span>
                </div>
                <h3 className="mt-5 text-lg font-bold text-zinc-900">
                  Agendamento Sazonal de Links e Promoções
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-600">
                  Vai abrir carrinho de lançamento à meia-noite ou fazer uma ação relâmpago de Black Friday e Dia das Mães? Programe a data de início e fim de qualquer botão ou oferta para que eles entrem e saiam do ar automaticamente no dia certo, sem você precisar ficar acordado para editar a Bio.
                </p>
              </div>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-zinc-200 bg-white p-3 text-xs">
                  <span className="font-bold text-emerald-700">● Entrada automática:</span>{" "}
                  <span className="text-zinc-600">25/Nov às 00:00 (Black Friday)</span>
                </div>
                <div className="rounded-xl border border-zinc-200 bg-white p-3 text-xs">
                  <span className="font-bold text-zinc-700">● Expiração programada:</span>{" "}
                  <span className="text-zinc-600">30/Nov às 23:59 (Encerramento)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. SEÇÃO "MUITO ALÉM DA BIO: ECOSSISTEMA COMPLETO PARA EMPRESAS" */}
      <section id="carteirinhas" className="border-b border-zinc-200 bg-zinc-50 py-20">
        <div id="recursos" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-bold text-zinc-800">
              <Layers className="h-3.5 w-3.5 text-blue-600" /> Ecossistema Corporativo
            </span>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-zinc-900 sm:text-4xl">
              Muito além da Bio: infraestrutura completa para empresas e equipes
            </h2>
            <p className="mt-4 text-base text-zinc-600">
              Substitua 4 assinaturas diferentes por uma plataforma unificada para identificação de funcionários, links personalizados com marca, Wi-Fi corporativo e relatórios.
            </p>
          </div>

          {/* Destaque Principal: Carteirinhas & Crachás */}
          <div className="mt-12 rounded-3xl border border-zinc-200 bg-white p-6 shadow-xs sm:p-10">
            <div className="grid items-center gap-8 lg:grid-cols-12">
              <div className="lg:col-span-7">
                <div className="inline-flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-1 text-xs font-bold text-blue-600">
                  <UserCheck className="h-4 w-4" /> Exclusivo LinkSnap ID
                </div>
                <h3 className="mt-4 text-2xl font-extrabold text-zinc-900 sm:text-3xl">
                  Carteirinhas & Crachás de Equipe (<code className="text-blue-600">/c/empresa/membro</code>)
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-zinc-600 sm:text-base">
                  Crie identificação funcional profissional com foto, cargo, CPF/matrícula e departamento. Quando um cliente ou portaria escaneia o QR Code do crachá, o sistema confirma em tempo real se aquele colaborador ou representante ainda faz parte da empresa.
                </p>
                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <div className="flex items-start gap-2.5">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
                    <span className="text-xs font-medium text-zinc-700">
                      <strong>Importação em lote via CSV:</strong> gere dezenas de crachás em segundos a partir da sua planilha.
                    </span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
                    <span className="text-xs font-medium text-zinc-700">
                      <strong>Download PNG para impressão:</strong> arte pronta em alta resolução para crachá físico PVC ou celular.
                    </span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
                    <span className="text-xs font-medium text-zinc-700">
                      <strong>Validação pública por QR Code:</strong> proteção contra falsos funcionários e golpes no WhatsApp.
                    </span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
                    <span className="text-xs font-medium text-zinc-700">
                      <strong>Revogação imediata:</strong> desligou um membro? Desative o crachá em 1 clique no painel.
                    </span>
                  </div>
                </div>
              </div>

              {/* Card visual simulando o Crachá */}
              <div className="lg:col-span-5">
                <div className="mx-auto max-w-sm rounded-2xl border-2 border-zinc-200 bg-zinc-50 p-5 shadow-md">
                  <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4 text-blue-600" />
                      <span className="text-xs font-extrabold uppercase tracking-wider text-zinc-900">
                        Grupo Valmoria Logística
                      </span>
                    </div>
                    <span className="rounded-full border border-emerald-300 bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-900">
                      ● CREDENCIAL ATIVA
                    </span>
                  </div>
                  <div className="mt-4 flex items-center gap-4">
                    <img
                      src="/landing/cracha-rafael.jpg"
                      alt="Rafael Mendes"
                      className="h-16 w-16 shrink-0 rounded-2xl border border-zinc-200 object-cover shadow-xs"
                    />
                    <div>
                      <p className="text-base font-extrabold text-zinc-900">Rafael Mendes</p>
                      <p className="text-xs font-semibold text-blue-600">
                        Supervisor Técnico de Campo
                      </p>
                      <p className="mt-1 font-mono text-[11px] text-zinc-500">
                        Matrícula: #VL-2049 • Validade: 12/2027
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between rounded-xl border border-zinc-200 bg-white p-3 shadow-2xs">
                    <div>
                      <p className="text-[11px] font-bold text-zinc-900">
                        Verificação Pública por QR Code
                      </p>
                      <p className="font-mono text-[10px] text-zinc-500">
                        linksnap.com.br/c/valmoria/rafael
                      </p>
                    </div>
                    <QrCode className="h-8 w-8 text-zinc-900" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 3 Cards Complementares do Ecossistema */}
          <div className="mt-6 grid gap-6 md:grid-cols-3">
            {/* Encurtador Híbrido */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-6">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-600">
                <Zap className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-base font-bold text-zinc-900">
                Encurtador Híbrido com Marca
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-600">
                Escolha entre links curtos ultrarrápidos (<code className="rounded bg-zinc-100 px-1 py-0.5 font-mono text-xs">/r/codigo</code>) ou links exclusivos no namespace da sua marca (<code className="rounded bg-zinc-100 px-1 py-0.5 font-mono text-xs">/r/@suamarca/promo</code>) que geram muito mais cliques e confiança.
              </p>
            </div>

            {/* Placa Wi-Fi & Construtor UTM */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-6">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-600">
                <Wifi className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-base font-bold text-zinc-900">
                Placa QR Code Wi-Fi (<code className="text-blue-600">/w</code>) & UTM
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-600">
                Conecte clientes ao Wi-Fi do seu estabelecimento sem precisar ditar senha e utilize nosso Construtor UTM integrado para rastrear a origem exata de cada venda no tráfego pago.
              </p>
            </div>

            {/* Credibilidade Máxima */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-6">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-600">
                <BadgeCheck className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-base font-bold text-zinc-900">
                Selo Verificado & Relatórios Públicos
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-600">
                Destaque sua página com o Selo Verificado Azul ao lado do seu nome e compartilhe links de relatórios em tempo real com sócios, patrocinadores ou clientes sem precisar passar sua senha.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. SEÇÃO #PRICING DINÂMICA POR PERFIL */}
      <section id="pricing" className="border-b border-zinc-200 bg-[#FFFFFF] py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-bold text-blue-600">
              <Compass className="h-3.5 w-3.5" /> Planos Dinâmicos por Perfil
            </span>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-zinc-900 sm:text-4xl">
              Selecione seu perfil e veja a recomendação ideal
            </h2>
            <p className="mt-3 text-sm text-zinc-600 sm:text-base">
              Preços justos em Reais, sem variação cambial e com liberação imediata via{" "}
              <strong className="font-semibold text-zinc-900">
                Mercado Pago (Pix ou Cartão)
              </strong>
              .
            </p>
          </div>

          {/* Pills de Perfil Clicáveis */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
            {(Object.keys(PRICING_BY_PROFILE) as ProfileId[]).map((profileKey) => {
              const item = PRICING_BY_PROFILE[profileKey];
              const isActive = selectedProfile === profileKey;
              return (
                <button
                  key={profileKey}
                  type="button"
                  onClick={() => setSelectedProfile(profileKey)}
                  className={`cursor-pointer rounded-full px-4 py-2 text-xs font-bold transition sm:text-sm ${
                    isActive
                      ? "bg-blue-600 text-white shadow-sm"
                      : "border border-zinc-200 bg-zinc-50 text-zinc-700 hover:border-zinc-300 hover:bg-zinc-100"
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>

          {/* Toggle Mensal / Anual */}
          <div className="mt-6 flex items-center justify-center">
            <div className="inline-flex items-center rounded-xl border border-zinc-200 bg-zinc-50 p-1">
              <button
                type="button"
                onClick={() => setBillingCycle("mensal")}
                className={`cursor-pointer rounded-lg px-4 py-1.5 text-xs font-bold transition ${
                  billingCycle === "mensal"
                    ? "bg-white text-zinc-900 shadow-2xs"
                    : "text-zinc-600 hover:text-zinc-900"
                }`}
              >
                Ciclo Mensal
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle("anual")}
                className={`flex cursor-pointer items-center gap-1.5 rounded-lg px-4 py-1.5 text-xs font-bold transition ${
                  billingCycle === "anual"
                    ? "bg-white text-zinc-900 shadow-2xs"
                    : "text-zinc-600 hover:text-zinc-900"
                }`}
              >
                <span>Anual</span>
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-extrabold text-emerald-800">
                  Economize até 32%
                </span>
              </button>
            </div>
          </div>

          {/* Headline Dinâmica do Perfil Selecionado com Retrato da Persona */}
          <div className="mt-8 flex flex-col items-center justify-between gap-4 rounded-2xl border border-zinc-200 bg-zinc-50 px-6 py-5 shadow-xs sm:flex-row sm:text-left text-center">
            <div className="flex flex-col items-center gap-4 sm:flex-row">
              <img
                src={PROFILE_AVATAR[selectedProfile]}
                alt={currentProfileData.label}
                className="h-14 w-14 shrink-0 rounded-2xl border-2 border-white object-cover shadow-sm"
              />
              <div>
                <h3 className="text-lg font-extrabold text-zinc-900 sm:text-xl">
                  {currentProfileData.headline}
                </h3>
                <p className="mt-1 text-xs text-zinc-600 sm:text-sm">
                  {currentProfileData.subheadline}
                </p>
              </div>
            </div>
            <span className="shrink-0 rounded-full border border-emerald-300 bg-emerald-50 px-3.5 py-1.5 text-xs font-extrabold text-emerald-800">
              Economia de até R$ 1.400/ano vs. ferramentas em Dólar
            </span>
          </div>

          {/* Grid de 3 Cards Dinâmicos */}
          <div className="mt-8 grid gap-6 lg:grid-cols-3">
            {currentProfileData.plans.map((plan) => {
              const displayPrice =
                billingCycle === "anual" ? plan.annualPrice : plan.monthlyPrice;
              const isFree = displayPrice === "R$ 0";

              return (
                <div
                  key={plan.name}
                  className={`relative flex flex-col justify-between rounded-3xl p-7 transition ${
                    plan.highlighted
                      ? "border-2 border-blue-600 bg-white shadow-xl"
                      : "border border-zinc-200 bg-zinc-50"
                  }`}
                >
                  {plan.badge && (
                    <span
                      className={`absolute -top-3.5 right-6 rounded-full px-3.5 py-1 text-xs font-extrabold shadow-xs ${
                        plan.highlighted
                          ? "bg-blue-600 text-white"
                          : "border border-zinc-200 bg-white text-zinc-800"
                      }`}
                    >
                      {plan.badge}
                    </span>
                  )}

                  <div>
                    <h4 className="text-xl font-extrabold text-zinc-900">{plan.name}</h4>
                    <p className="mt-1.5 min-h-[36px] text-xs leading-relaxed text-zinc-600">
                      {plan.subtitle}
                    </p>

                    <div className="mt-5 flex items-baseline gap-1.5 border-b border-zinc-200 pb-5">
                      <span className="text-4xl font-black tracking-tight text-zinc-900">
                        {displayPrice}
                      </span>
                      <div className="flex flex-col text-xs text-zinc-500">
                        <span>{plan.periodNote}</span>
                        {!isFree && billingCycle === "anual" && (
                          <span className="font-semibold text-emerald-700">
                            {plan.annualPrice === "R$ 34,90"
                              ? "R$ 499/ano no ciclo anual"
                              : "R$ 199/ano no ciclo anual"}
                          </span>
                        )}
                      </div>
                    </div>

                    <ul className="mt-6 space-y-3">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm">
                          {feature.included ? (
                            <span className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full bg-blue-50 text-blue-600">
                              <Check className="h-3 w-3" />
                            </span>
                          ) : (
                            <span className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full bg-zinc-200/70 text-zinc-400">
                              <X className="h-3 w-3" />
                            </span>
                          )}
                          <span
                            className={
                              feature.included
                                ? "font-medium text-zinc-800"
                                : "text-zinc-400 line-through"
                            }
                          >
                            {feature.text}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-8">
                    <Link
                      href={
                        isLoggedIn
                          ? "/dashboard/billing"
                          : `/login?plan=${encodeURIComponent(plan.name)}&profile=${selectedProfile}`
                      }
                      className={`flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-center text-sm font-bold transition ${
                        plan.highlighted
                          ? "bg-blue-600 text-white shadow-sm hover:bg-blue-700"
                          : "border border-zinc-300 bg-white text-zinc-900 hover:bg-zinc-100"
                      }`}
                    >
                      <span>{plan.ctaText}</span>
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                    <p className="mt-2.5 text-center text-[11px] text-zinc-500">
                      {isFree
                        ? "Não pede cartão de crédito"
                        : "Pagamento seguro via Mercado Pago (Pix ou Cartão)"}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Barra de Confiança de Pagamento */}
          <div className="mt-10 flex flex-col items-center justify-between gap-4 rounded-2xl border border-zinc-200 bg-zinc-50 px-6 py-4 sm:flex-row">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-600">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-zinc-900">
                  Processamento Oficial em Reais via Mercado Pago
                </p>
                <p className="text-xs text-zinc-600">
                  Pague com Pix Automático (liberação instantânea) ou Cartão de Crédito sem IOF. Cancele quando quiser.
                </p>
              </div>
            </div>
            <span className="shrink-0 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-bold text-zinc-800">
              Pix • Cartão em R$ • 7 dias de garantia
            </span>
          </div>
        </div>
      </section>

      {/* 7. SEÇÃO FAQ INTERATIVA (ACORDEÃO) */}
      <section id="faq" className="border-b border-zinc-200 bg-zinc-50 py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-bold text-zinc-700">
              Dúvidas Frequentes
            </span>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-zinc-900 sm:text-4xl">
              Tudo o que você precisa saber antes de começar
            </h2>
            <p className="mt-3 text-sm text-zinc-600 sm:text-base">
              Transparência total sobre nossos recursos, recebimentos por Pix e planos.
            </p>
          </div>

          <div className="mt-10 space-y-3">
            {FAQ_ITEMS.map((item, index) => {
              const isOpen = openFaqIndex === index;
              return (
                <div
                  key={index}
                  className="overflow-hidden rounded-2xl border border-zinc-200 bg-white transition"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                    className="flex w-full cursor-pointer items-center justify-between gap-4 px-6 py-4 text-left"
                  >
                    <span className="text-sm font-bold text-zinc-900 sm:text-base">
                      {item.question}
                    </span>
                    <ChevronDown
                      className={`h-5 w-5 shrink-0 text-zinc-500 transition-transform duration-200 ${
                        isOpen ? "rotate-180 text-blue-600" : ""
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="border-t border-zinc-100 px-6 py-4 text-sm leading-relaxed text-zinc-600">
                      {item.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA FINAL + FOOTER */}
      <section className="bg-[#FFFFFF] py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-zinc-200 bg-zinc-50 p-8 text-center sm:p-12">
            <h2 className="text-2xl font-extrabold tracking-tight text-zinc-900 sm:text-4xl">
              Pronto para profissionalizar seus links, vendas e crachás?
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm text-zinc-600 sm:text-base">
              Garanta agora o seu endereço exclusivo no LinkSnap e tenha Pix sem taxa, vitrine de produtos, WhatsApp e carteirinhas de equipe em menos de 2 minutos.
            </p>
            <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href={isLoggedIn ? "/dashboard" : "/login"}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-7 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700"
              >
                <span>{isLoggedIn ? "Acessar Meu Painel Agora" : "Criar Minha Conta Grátis"}</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="#pricing"
                className="inline-flex items-center justify-center rounded-xl border border-zinc-200 bg-white px-6 py-3.5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50"
              >
                Comparar Planos em Reais
              </a>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-zinc-200 bg-zinc-50 py-10 text-xs text-zinc-600">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6 lg:px-8">
          <div className="flex items-center gap-2.5">
            <img
              src="/brand/logo-mark.svg"
              alt="LinkSnap"
              className="h-7 w-7 rounded-lg shadow-2xs"
            />
            <span className="font-black text-zinc-900">
              link<span className="text-blue-600">Snap</span>
            </span>
            <span className="text-zinc-400">•</span>
            <span>© {new Date().getFullYear()} Todos os direitos reservados.</span>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-zinc-600">
            <a href="#feito-pro-brasil" className="hover:text-zinc-900">
              Feito pro Brasil
            </a>
            <a href="#carteirinhas" className="hover:text-zinc-900">
              Carteirinhas de Equipe
            </a>
            <a href="#pricing" className="hover:text-zinc-900">
              Planos e Preços
            </a>
            <span className="text-zinc-300">|</span>
            <span className="font-medium text-zinc-800">
              Pagamentos em R$ via Mercado Pago (Pix e Cartão)
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
