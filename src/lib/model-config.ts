/**
 * OmniForge RPG — Model Configuration
 *
 * Catálogo estático de modelos OpenRouter disponíveis na plataforma.
 * Deve estar sincronizado com MODEL_REGISTRY em backend/model_registry.py.
 *
 * Ao adicionar um novo modelo, atualizar ambos os arquivos.
 */

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

export type AgentCategory = 'extraction' | 'synthesis' | 'reasoning' | 'writing';

export interface AgentFitScores {
  extraction: number;  // 1–10 (10 = melhor da categoria globalmente)
  synthesis: number;
  reasoning: number;
  writing: number;
}

export interface ModelOption {
  id: string;              // OpenRouter model ID ("provider/model-name")
  label: string;           // Nome amigável para exibição
  provider: string;        // Nome do provedor (ex: "Anthropic")
  tier: 'fast' | 'balanced' | 'premium';
  description: string;
  contextWindow: number;   // tokens
  inputCost: number;       // USD por 1M tokens de entrada
  outputCost: number;      // USD por 1M tokens de saída
  isFree: boolean;
  agentFit: AgentFitScores;
}

export interface AgentModelDef {
  key: string;                         // AGENT_IDS value
  label: string;                       // Nome legível do agente
  description: string;                 // O que o agente faz
  defaultModel: string;                // OpenRouter model ID padrão
  recommendedTier: 'fast' | 'balanced' | 'premium';
  agentCategory: AgentCategory;
}

// ---------------------------------------------------------------------------
// Fit scores por tier
// ---------------------------------------------------------------------------

const FIT_FAST: AgentFitScores    = { extraction: 8, synthesis: 5, reasoning: 4, writing: 5 };
const FIT_BALANCED: AgentFitScores = { extraction: 7, synthesis: 7, reasoning: 7, writing: 7 };
const FIT_PREMIUM: AgentFitScores  = { extraction: 6, synthesis: 9, reasoning: 9, writing: 9 };
const FIT_REASONING: AgentFitScores = { extraction: 3, synthesis: 6, reasoning: 9, writing: 6 };

// ---------------------------------------------------------------------------
// AVAILABLE_MODELS
// ---------------------------------------------------------------------------

export const AVAILABLE_MODELS: ModelOption[] = [

  // ── Anthropic ────────────────────────────────────────────────────────────
  {
    id: 'anthropic/claude-3-5-sonnet',
    label: 'Claude 3.5 Sonnet',
    provider: 'Anthropic',
    tier: 'balanced',
    description: 'Excelente equilíbrio entre capacidade e custo. Ótimo para síntese narrativa.',
    contextWindow: 200_000,
    inputCost: 3.0,
    outputCost: 15.0,
    isFree: false,
    agentFit: FIT_BALANCED,
  },
  {
    id: 'anthropic/claude-3-5-haiku',
    label: 'Claude 3.5 Haiku',
    provider: 'Anthropic',
    tier: 'fast',
    description: 'Versão rápida do Claude 3.5. Ideal para extração e tarefas estruturadas.',
    contextWindow: 200_000,
    inputCost: 0.8,
    outputCost: 4.0,
    isFree: false,
    agentFit: FIT_FAST,
  },
  {
    id: 'anthropic/claude-3-opus',
    label: 'Claude 3 Opus',
    provider: 'Anthropic',
    tier: 'premium',
    description: 'Modelo premium da Anthropic. Máxima capacidade de raciocínio e escrita.',
    contextWindow: 200_000,
    inputCost: 15.0,
    outputCost: 75.0,
    isFree: false,
    agentFit: FIT_PREMIUM,
  },
  {
    id: 'anthropic/claude-3-haiku:free',
    label: 'Claude 3 Haiku (Free)',
    provider: 'Anthropic',
    tier: 'fast',
    description: 'Versão gratuita do Claude 3 Haiku. Bom para testes e uso leve.',
    contextWindow: 200_000,
    inputCost: 0.0,
    outputCost: 0.0,
    isFree: true,
    agentFit: FIT_FAST,
  },

  // ── Google ──────────────────────────────────────────────────────────────
  {
    id: 'google/gemini-2.5-pro-preview-03-25',
    label: 'Gemini 2.5 Pro Preview',
    provider: 'Google',
    tier: 'premium',
    description: 'Modelo flagship do Google com janela de contexto gigante. Excelente raciocínio.',
    contextWindow: 1_048_576,
    inputCost: 1.25,
    outputCost: 10.0,
    isFree: false,
    agentFit: FIT_PREMIUM,
  },
  {
    id: 'google/gemini-2.0-flash',
    label: 'Gemini 2.0 Flash',
    provider: 'Google',
    tier: 'balanced',
    description: 'Modelo balanceado do Google com contexto de 1M tokens. Recomendado para campainhas.',
    contextWindow: 1_048_576,
    inputCost: 0.1,
    outputCost: 0.4,
    isFree: false,
    agentFit: FIT_BALANCED,
  },
  {
    id: 'google/gemini-2.0-flash-lite',
    label: 'Gemini 2.0 Flash Lite',
    provider: 'Google',
    tier: 'fast',
    description: 'Versão mais rápida e econômica do Gemini 2.0 Flash.',
    contextWindow: 1_048_576,
    inputCost: 0.075,
    outputCost: 0.3,
    isFree: false,
    agentFit: FIT_FAST,
  },
  {
    id: 'google/gemini-flash-1.5:free',
    label: 'Gemini 1.5 Flash (Free)',
    provider: 'Google',
    tier: 'fast',
    description: 'Versão gratuita do Gemini 1.5 Flash. Bom ponto de entrada.',
    contextWindow: 1_000_000,
    inputCost: 0.0,
    outputCost: 0.0,
    isFree: true,
    agentFit: FIT_FAST,
  },

  // ── OpenAI ──────────────────────────────────────────────────────────────
  {
    id: 'openai/gpt-4o',
    label: 'GPT-4o',
    provider: 'OpenAI',
    tier: 'balanced',
    description: 'Modelo flagship da OpenAI. Ótima relação custo-benefício para RPG.',
    contextWindow: 128_000,
    inputCost: 2.5,
    outputCost: 10.0,
    isFree: false,
    agentFit: FIT_BALANCED,
  },
  {
    id: 'openai/gpt-4o-mini',
    label: 'GPT-4o Mini',
    provider: 'OpenAI',
    tier: 'fast',
    description: 'Versão rápida e econômica do GPT-4o. Ideal para extração de dados.',
    contextWindow: 128_000,
    inputCost: 0.15,
    outputCost: 0.6,
    isFree: false,
    agentFit: FIT_FAST,
  },
  {
    id: 'openai/o3-mini',
    label: 'o3-mini',
    provider: 'OpenAI',
    tier: 'balanced',
    description: 'Modelo de raciocínio avançado da OpenAI. Excelente para lógica complexa.',
    contextWindow: 128_000,
    inputCost: 1.1,
    outputCost: 4.4,
    isFree: false,
    agentFit: FIT_REASONING,
  },
  {
    id: 'openai/o4-mini',
    label: 'o4-mini',
    provider: 'OpenAI',
    tier: 'fast',
    description: 'Modelo de raciocínio rápido da OpenAI. Bom custo-benefício para raciocínio.',
    contextWindow: 128_000,
    inputCost: 1.1,
    outputCost: 4.4,
    isFree: false,
    agentFit: FIT_REASONING,
  },
  {
    id: 'openai/gpt-3.5-turbo',
    label: 'GPT-3.5 Turbo',
    provider: 'OpenAI',
    tier: 'fast',
    description: 'Modelo legado, rápido e econômico. Adequado para tarefas simples.',
    contextWindow: 16_385,
    inputCost: 0.5,
    outputCost: 1.5,
    isFree: false,
    agentFit: FIT_FAST,
  },

  // ── DeepSeek ────────────────────────────────────────────────────────────
  {
    id: 'deepseek/deepseek-chat',
    label: 'DeepSeek Chat (V3)',
    provider: 'DeepSeek',
    tier: 'balanced',
    description: 'Modelo balanceado da DeepSeek com excelente custo-benefício.',
    contextWindow: 64_000,
    inputCost: 0.27,
    outputCost: 1.1,
    isFree: false,
    agentFit: FIT_BALANCED,
  },
  {
    id: 'deepseek/deepseek-r1',
    label: 'DeepSeek R1',
    provider: 'DeepSeek',
    tier: 'premium',
    description: 'Modelo de raciocínio avançado. Excelente para planejamento e lógica.',
    contextWindow: 64_000,
    inputCost: 0.55,
    outputCost: 2.19,
    isFree: false,
    agentFit: FIT_REASONING,
  },
  {
    id: 'deepseek/deepseek-chat:free',
    label: 'DeepSeek Chat (Free)',
    provider: 'DeepSeek',
    tier: 'balanced',
    description: 'Versão gratuita do DeepSeek Chat. Excelente para começar.',
    contextWindow: 64_000,
    inputCost: 0.0,
    outputCost: 0.0,
    isFree: true,
    agentFit: FIT_BALANCED,
  },
  {
    id: 'deepseek/deepseek-r1:free',
    label: 'DeepSeek R1 (Free)',
    provider: 'DeepSeek',
    tier: 'premium',
    description: 'Versão gratuita do DeepSeek R1. Raciocínio avançado sem custo.',
    contextWindow: 64_000,
    inputCost: 0.0,
    outputCost: 0.0,
    isFree: true,
    agentFit: FIT_REASONING,
  },

  // ── Meta ────────────────────────────────────────────────────────────────
  {
    id: 'meta-llama/llama-3.1-405b-instruct',
    label: 'Llama 3.1 405B Instruct',
    provider: 'Meta',
    tier: 'premium',
    description: 'Modelo open-source premium da Meta. Alta qualidade de escrita.',
    contextWindow: 131_072,
    inputCost: 2.7,
    outputCost: 2.7,
    isFree: false,
    agentFit: FIT_PREMIUM,
  },
  {
    id: 'meta-llama/llama-3.3-70b-instruct',
    label: 'Llama 3.3 70B Instruct',
    provider: 'Meta',
    tier: 'balanced',
    description: 'Versão 70B do Llama 3.3. Ótima relação capacidade/custo.',
    contextWindow: 131_072,
    inputCost: 0.12,
    outputCost: 0.3,
    isFree: false,
    agentFit: FIT_BALANCED,
  },
  {
    id: 'meta-llama/llama-3.1-8b-instruct:free',
    label: 'Llama 3.1 8B Instruct (Free)',
    provider: 'Meta',
    tier: 'fast',
    description: 'Modelo leve e gratuito da Meta. Bom para testes e extração simples.',
    contextWindow: 131_072,
    inputCost: 0.0,
    outputCost: 0.0,
    isFree: true,
    agentFit: FIT_FAST,
  },

  // ── Mistral ─────────────────────────────────────────────────────────────
  {
    id: 'mistralai/mistral-large-2411',
    label: 'Mistral Large (Nov 2024)',
    provider: 'Mistral',
    tier: 'premium',
    description: 'Modelo premium da Mistral. Excelente para escrita criativa em múltiplos idiomas.',
    contextWindow: 131_000,
    inputCost: 2.0,
    outputCost: 6.0,
    isFree: false,
    agentFit: FIT_PREMIUM,
  },
  {
    id: 'mistralai/mistral-small-3.1-24b-instruct',
    label: 'Mistral Small 3.1 24B',
    provider: 'Mistral',
    tier: 'balanced',
    description: 'Modelo balanceado da Mistral. Eficiente e multilíngue.',
    contextWindow: 131_000,
    inputCost: 0.1,
    outputCost: 0.3,
    isFree: false,
    agentFit: FIT_BALANCED,
  },
  {
    id: 'mistralai/mistral-7b-instruct:free',
    label: 'Mistral 7B Instruct (Free)',
    provider: 'Mistral',
    tier: 'fast',
    description: 'Modelo open-source gratuito da Mistral. Leve e rápido.',
    contextWindow: 32_768,
    inputCost: 0.0,
    outputCost: 0.0,
    isFree: true,
    agentFit: FIT_FAST,
  },

  // ── Qwen ────────────────────────────────────────────────────────────────
  {
    id: 'qwen/qwen-2.5-72b-instruct',
    label: 'Qwen 2.5 72B Instruct',
    provider: 'Qwen',
    tier: 'balanced',
    description: 'Modelo da Alibaba com forte desempenho em texto e código.',
    contextWindow: 131_072,
    inputCost: 0.13,
    outputCost: 0.4,
    isFree: false,
    agentFit: FIT_BALANCED,
  },
  {
    id: 'qwen/qwen-2-7b-instruct:free',
    label: 'Qwen 2 7B Instruct (Free)',
    provider: 'Qwen',
    tier: 'fast',
    description: 'Versão gratuita e leve do Qwen 2.',
    contextWindow: 131_072,
    inputCost: 0.0,
    outputCost: 0.0,
    isFree: true,
    agentFit: FIT_FAST,
  },

  // ── xAI ─────────────────────────────────────────────────────────────────
  {
    id: 'x-ai/grok-3',
    label: 'Grok 3',
    provider: 'xAI',
    tier: 'premium',
    description: 'Modelo premium da xAI com forte capacidade de escrita criativa.',
    contextWindow: 131_072,
    inputCost: 3.0,
    outputCost: 15.0,
    isFree: false,
    agentFit: FIT_PREMIUM,
  },
  {
    id: 'x-ai/grok-3-mini',
    label: 'Grok 3 Mini',
    provider: 'xAI',
    tier: 'fast',
    description: 'Versão menor e econômica do Grok 3.',
    contextWindow: 131_072,
    inputCost: 0.3,
    outputCost: 0.5,
    isFree: false,
    agentFit: FIT_FAST,
  },

  // ── Cohere ──────────────────────────────────────────────────────────────
  {
    id: 'cohere/command-r-plus',
    label: 'Command R+',
    provider: 'Cohere',
    tier: 'premium',
    description: 'Modelo premium da Cohere. Excelente para síntese e recuperação de informação.',
    contextWindow: 128_000,
    inputCost: 2.5,
    outputCost: 10.0,
    isFree: false,
    agentFit: FIT_PREMIUM,
  },
  {
    id: 'cohere/command-r',
    label: 'Command R',
    provider: 'Cohere',
    tier: 'balanced',
    description: 'Modelo balanceado da Cohere. Bom para síntese e geração de texto.',
    contextWindow: 128_000,
    inputCost: 0.15,
    outputCost: 0.6,
    isFree: false,
    agentFit: FIT_BALANCED,
  },

  // ── Microsoft ────────────────────────────────────────────────────────────
  {
    id: 'microsoft/phi-4',
    label: 'Phi-4',
    provider: 'Microsoft',
    tier: 'fast',
    description: 'Modelo compacto da Microsoft com surpreendente capacidade de raciocínio.',
    contextWindow: 16_384,
    inputCost: 0.07,
    outputCost: 0.14,
    isFree: false,
    agentFit: FIT_FAST,
  },
  {
    id: 'microsoft/phi-3-medium-128k-instruct:free',
    label: 'Phi-3 Medium 128K (Free)',
    provider: 'Microsoft',
    tier: 'fast',
    description: 'Modelo gratuito da Microsoft com janela de 128K tokens.',
    contextWindow: 128_000,
    inputCost: 0.0,
    outputCost: 0.0,
    isFree: true,
    agentFit: FIT_FAST,
  },
];

// ---------------------------------------------------------------------------
// PIPELINE_AGENT_DEFS
// ---------------------------------------------------------------------------

export const PIPELINE_AGENT_DEFS: AgentModelDef[] = [
  {
    key: 'question-what',
    label: 'Respondedor: O Quê?',
    description: 'Gera o conflito principal da campanha.',
    defaultModel: 'openai/gpt-4o',
    recommendedTier: 'balanced',
    agentCategory: 'writing',
  },
  {
    key: 'question-why',
    label: 'Respondedor: Por Quê?',
    description: 'Define a motivação e razão da campanha.',
    defaultModel: 'openai/gpt-4o',
    recommendedTier: 'balanced',
    agentCategory: 'writing',
  },
  {
    key: 'question-where',
    label: 'Respondedor: Onde?',
    description: 'Define o cenário e locais da campanha.',
    defaultModel: 'openai/gpt-4o',
    recommendedTier: 'balanced',
    agentCategory: 'writing',
  },
  {
    key: 'question-when',
    label: 'Respondedor: Quando?',
    description: 'Define a linha do tempo e contexto histórico.',
    defaultModel: 'openai/gpt-4o',
    recommendedTier: 'balanced',
    agentCategory: 'writing',
  },
  {
    key: 'question-who',
    label: 'Respondedor: Quem?',
    description: 'Define os personagens centrais da trama.',
    defaultModel: 'openai/gpt-4o',
    recommendedTier: 'balanced',
    agentCategory: 'writing',
  },
  {
    key: 'question-how',
    label: 'Respondedor: Como?',
    description: 'Define os mecanismos e eventos principais.',
    defaultModel: 'openai/gpt-4o',
    recommendedTier: 'balanced',
    agentCategory: 'writing',
  },
  {
    key: 'question-how-much',
    label: 'Respondedor: Quanto?',
    description: 'Define escala, duração e recursos da campanha.',
    defaultModel: 'openai/gpt-4o',
    recommendedTier: 'balanced',
    agentCategory: 'extraction',
  },
  {
    key: 'campaign-generator',
    label: 'Gerador de Campanha',
    description: 'Sintetiza todas as respostas em uma campanha completa.',
    defaultModel: 'openai/gpt-4o',
    recommendedTier: 'premium',
    agentCategory: 'synthesis',
  },
  {
    key: 'npc-generator',
    label: 'Gerador de NPCs',
    description: 'Cria personagens não-jogadores com personalidade e história.',
    defaultModel: 'openai/gpt-4o',
    recommendedTier: 'balanced',
    agentCategory: 'writing',
  },
  {
    key: 'encounter-generator',
    label: 'Gerador de Encontros',
    description: 'Cria encontros e combates balanceados.',
    defaultModel: 'openai/gpt-4o-mini',
    recommendedTier: 'fast',
    agentCategory: 'extraction',
  },
  {
    key: 'arc-generator',
    label: 'Gerador de Arcos',
    description: 'Cria arcos narrativos com atos e cenas.',
    defaultModel: 'openai/gpt-4o',
    recommendedTier: 'premium',
    agentCategory: 'synthesis',
  },
  {
    key: 'hooks-generator',
    label: 'Gerador de Ganchos',
    description: 'Cria ganchos narrativos para envolver os jogadores.',
    defaultModel: 'openai/gpt-4o',
    recommendedTier: 'balanced',
    agentCategory: 'writing',
  },
  {
    key: 'npc-extractor',
    label: 'Extrator de NPCs',
    description: 'Extrai NPCs a partir de texto de campanha existente.',
    defaultModel: 'openai/gpt-4o-mini',
    recommendedTier: 'fast',
    agentCategory: 'extraction',
  },
  {
    key: 'npc-interaction',
    label: 'Interação com NPC',
    description: 'Simula diálogos e interações com NPCs.',
    defaultModel: 'openai/gpt-4o',
    recommendedTier: 'balanced',
    agentCategory: 'writing',
  },
  {
    key: 'consequence-generator',
    label: 'Gerador de Consequências',
    description: 'Gera consequências narrativas das ações dos jogadores.',
    defaultModel: 'openai/gpt-4o',
    recommendedTier: 'balanced',
    agentCategory: 'reasoning',
  },
  {
    key: 'ai-expander',
    label: 'Expansor de Conteúdo',
    description: 'Expande seções curtas em conteúdo detalhado.',
    defaultModel: 'openai/gpt-4o',
    recommendedTier: 'balanced',
    agentCategory: 'writing',
  },
  {
    key: 'management-generator',
    label: 'Gerador de Gestão',
    description: 'Cria ferramentas e recursos de gestão de campanha.',
    defaultModel: 'openai/gpt-4o-mini',
    recommendedTier: 'fast',
    agentCategory: 'extraction',
  },
  {
    key: 'creature-generator',
    label: 'Gerador de Criaturas',
    description: 'Cria criaturas e monstros com estatísticas completas.',
    defaultModel: 'openai/gpt-4o-mini',
    recommendedTier: 'fast',
    agentCategory: 'extraction',
  },
  {
    key: 'session-planner',
    label: 'Planejador de Sessão',
    description: 'Planeja sessões de jogo com objetivos e eventos.',
    defaultModel: 'openai/gpt-4o',
    recommendedTier: 'balanced',
    agentCategory: 'synthesis',
  },
];

// ---------------------------------------------------------------------------
// Helpers de mapa de modelos por agente
// ---------------------------------------------------------------------------

const AGENT_MODELS_STORAGE_KEY = 'omniforge:agentModels';

/** Retorna o mapa padrão {agentKey → modelId} a partir de PIPELINE_AGENT_DEFS. */
export function getDefaultModelMap(): Record<string, string> {
  return Object.fromEntries(
    PIPELINE_AGENT_DEFS.map((def) => [def.key, def.defaultModel])
  );
}

/**
 * Carrega o mapa de modelos por agente do localStorage.
 * Faz fallback para getDefaultModelMap() se não houver dados salvos.
 */
export function loadAgentModels(): Record<string, string> {
  try {
    const raw = localStorage.getItem(AGENT_MODELS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Record<string, string>;
      // Mescla com os defaults para incluir agentes adicionados após o save
      return { ...getDefaultModelMap(), ...parsed };
    }
  } catch {
    // localStorage indisponível (SSR, erro de parse, etc.)
  }
  return getDefaultModelMap();
}

/**
 * Persiste o mapa de modelos por agente no localStorage.
 * @param models Mapa {agentKey → modelId}
 */
export function saveAgentModels(models: Record<string, string>): void {
  try {
    localStorage.setItem(AGENT_MODELS_STORAGE_KEY, JSON.stringify(models));
  } catch {
    // localStorage indisponível
  }
}

// ---------------------------------------------------------------------------
// Utilitário de custo (equivalente ao get_model_cost() Python)
// ---------------------------------------------------------------------------

/**
 * Calcula o custo estimado de uma chamada ao modelo em USD.
 * @param modelId OpenRouter model ID
 * @param tokensIn Tokens de entrada
 * @param tokensOut Tokens de saída
 */
export function getModelCost(modelId: string, tokensIn: number, tokensOut: number): number {
  const model = AVAILABLE_MODELS.find((m) => m.id === modelId);
  if (!model) return 0;
  return (tokensIn * model.inputCost + tokensOut * model.outputCost) / 1_000_000;
}
