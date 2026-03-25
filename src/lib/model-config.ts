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
// AVAILABLE_MODELS
//
// Scores de adequação são comparativos entre todos os modelos.
// Escala global absoluta 1–10: ≥9 excelente · 7-8 bom · 5-6 adequado · ≤4 fraco.
// ---------------------------------------------------------------------------

export const AVAILABLE_MODELS: ModelOption[] = [

  // ── Anthropic ────────────────────────────────────────────────────────────
  {
    id: 'anthropic/claude-sonnet-4',
    label: 'Claude Sonnet 4',
    provider: 'Anthropic',
    tier: 'balanced',
    description: 'Última geração Anthropic — equilíbrio ideal entre qualidade e custo para narrativa.',
    contextWindow: 200_000,
    inputCost: 3.0,
    outputCost: 15.0,
    isFree: false,
    agentFit: { extraction: 8, synthesis: 9, reasoning: 9, writing: 9 },
  },
  {
    id: 'anthropic/claude-3.5-sonnet',
    label: 'Claude 3.5 Sonnet',
    provider: 'Anthropic',
    tier: 'balanced',
    description: 'Excelente equilíbrio entre capacidade e custo. Ótimo para síntese narrativa.',
    contextWindow: 200_000,
    inputCost: 3.0,
    outputCost: 15.0,
    isFree: false,
    agentFit: { extraction: 8, synthesis: 9, reasoning: 8, writing: 9 },
  },
  {
    id: 'anthropic/claude-3.5-haiku',
    label: 'Claude 3.5 Haiku',
    provider: 'Anthropic',
    tier: 'fast',
    description: 'Rápido e econômico — ideal para triagem e verificação.',
    contextWindow: 200_000,
    inputCost: 0.8,
    outputCost: 4.0,
    isFree: false,
    agentFit: { extraction: 9, synthesis: 5, reasoning: 4, writing: 5 },
  },
  {
    id: 'anthropic/claude-3-opus',
    label: 'Claude 3 Opus',
    provider: 'Anthropic',
    tier: 'premium',
    description: 'Máxima capacidade de raciocínio e escrita criativa da Anthropic.',
    contextWindow: 200_000,
    inputCost: 15.0,
    outputCost: 75.0,
    isFree: false,
    agentFit: { extraction: 7, synthesis: 9, reasoning: 10, writing: 10 },
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
    agentFit: { extraction: 7, synthesis: 4, reasoning: 3, writing: 4 },
  },

  // ── Google ──────────────────────────────────────────────────────────────
  {
    id: 'google/gemini-2.5-pro-preview-03-25',
    label: 'Gemini 2.5 Pro Preview',
    provider: 'Google',
    tier: 'premium',
    description: 'Flagship do Google — contexto gigante com raciocínio aprimorado.',
    contextWindow: 1_048_576,
    inputCost: 1.25,
    outputCost: 10.0,
    isFree: false,
    agentFit: { extraction: 8, synthesis: 9, reasoning: 9, writing: 9 },
  },
  {
    id: 'google/gemini-2.5-flash',
    label: 'Gemini 2.5 Flash',
    provider: 'Google',
    tier: 'balanced',
    description: 'Equilíbrio ideal — contexto gigante com raciocínio aprimorado.',
    contextWindow: 1_048_576,
    inputCost: 0.15,
    outputCost: 0.6,
    isFree: false,
    agentFit: { extraction: 8, synthesis: 7, reasoning: 7, writing: 7 },
  },
  {
    id: 'google/gemini-2.0-flash',
    label: 'Gemini 2.0 Flash',
    provider: 'Google',
    tier: 'balanced',
    description: 'Rápido e econômico — boa alternativa para tarefas simples.',
    contextWindow: 1_048_576,
    inputCost: 0.1,
    outputCost: 0.4,
    isFree: false,
    agentFit: { extraction: 9, synthesis: 5, reasoning: 5, writing: 5 },
  },
  {
    id: 'google/gemini-2.0-flash-lite',
    label: 'Gemini 2.0 Flash Lite',
    provider: 'Google',
    tier: 'fast',
    description: 'Ultra econômico — para tarefas de extração de baixa complexidade.',
    contextWindow: 1_048_576,
    inputCost: 0.075,
    outputCost: 0.3,
    isFree: false,
    agentFit: { extraction: 8, synthesis: 4, reasoning: 3, writing: 4 },
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
    agentFit: { extraction: 7, synthesis: 4, reasoning: 3, writing: 4 },
  },

  // ── OpenAI ──────────────────────────────────────────────────────────────
  {
    id: 'openai/gpt-4o',
    label: 'GPT-4o',
    provider: 'OpenAI',
    tier: 'balanced',
    description: 'Modelo multimodal equilibrado da OpenAI — ótimo para RPG.',
    contextWindow: 128_000,
    inputCost: 2.5,
    outputCost: 10.0,
    isFree: false,
    agentFit: { extraction: 8, synthesis: 8, reasoning: 8, writing: 8 },
  },
  {
    id: 'openai/gpt-4o-mini',
    label: 'GPT-4o Mini',
    provider: 'OpenAI',
    tier: 'fast',
    description: 'Versão leve e econômica do GPT-4o.',
    contextWindow: 128_000,
    inputCost: 0.15,
    outputCost: 0.6,
    isFree: false,
    agentFit: { extraction: 8, synthesis: 5, reasoning: 5, writing: 5 },
  },
  {
    id: 'openai/gpt-4.1',
    label: 'GPT-4.1',
    provider: 'OpenAI',
    tier: 'premium',
    description: 'Nova geração OpenAI — superior em codificação e instruções longas.',
    contextWindow: 1_048_576,
    inputCost: 2.0,
    outputCost: 8.0,
    isFree: false,
    agentFit: { extraction: 9, synthesis: 9, reasoning: 9, writing: 8 },
  },
  {
    id: 'openai/gpt-4.1-mini',
    label: 'GPT-4.1 Mini',
    provider: 'OpenAI',
    tier: 'fast',
    description: 'Versão compacta e rápida do GPT-4.1.',
    contextWindow: 1_048_576,
    inputCost: 0.4,
    outputCost: 1.6,
    isFree: false,
    agentFit: { extraction: 8, synthesis: 6, reasoning: 6, writing: 6 },
  },
  {
    id: 'openai/o3-mini',
    label: 'o3-mini',
    provider: 'OpenAI',
    tier: 'balanced',
    description: 'Raciocínio avançado da OpenAI — excelente para lógica complexa.',
    contextWindow: 200_000,
    inputCost: 1.1,
    outputCost: 4.4,
    isFree: false,
    agentFit: { extraction: 4, synthesis: 6, reasoning: 9, writing: 6 },
  },
  {
    id: 'openai/o4-mini',
    label: 'o4-mini',
    provider: 'OpenAI',
    tier: 'balanced',
    description: 'Raciocínio rápido da OpenAI — bom custo-benefício para análise.',
    contextWindow: 200_000,
    inputCost: 1.1,
    outputCost: 4.4,
    isFree: false,
    agentFit: { extraction: 5, synthesis: 7, reasoning: 9, writing: 6 },
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
    agentFit: { extraction: 7, synthesis: 4, reasoning: 3, writing: 4 },
  },

  // ── DeepSeek ────────────────────────────────────────────────────────────
  {
    id: 'deepseek/deepseek-chat',
    label: 'DeepSeek Chat (V3)',
    provider: 'DeepSeek',
    tier: 'balanced',
    description: 'Balanceado com excelente custo-benefício — forte em código e texto.',
    contextWindow: 64_000,
    inputCost: 0.27,
    outputCost: 1.1,
    isFree: false,
    agentFit: { extraction: 7, synthesis: 7, reasoning: 7, writing: 7 },
  },
  {
    id: 'deepseek/deepseek-r1',
    label: 'DeepSeek R1',
    provider: 'DeepSeek',
    tier: 'premium',
    description: 'Raciocínio avançado — excelente para planejamento e lógica de enredo.',
    contextWindow: 64_000,
    inputCost: 0.55,
    outputCost: 2.19,
    isFree: false,
    agentFit: { extraction: 3, synthesis: 6, reasoning: 9, writing: 6 },
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
    agentFit: { extraction: 6, synthesis: 6, reasoning: 6, writing: 6 },
  },
  {
    id: 'deepseek/deepseek-r1:free',
    label: 'DeepSeek R1 (Free)',
    provider: 'DeepSeek',
    tier: 'premium',
    description: 'Raciocínio avançado sem custo — ótimo para planejamento narrativo.',
    contextWindow: 64_000,
    inputCost: 0.0,
    outputCost: 0.0,
    isFree: true,
    agentFit: { extraction: 3, synthesis: 5, reasoning: 8, writing: 5 },
  },

  // ── Meta ────────────────────────────────────────────────────────────────
  {
    id: 'meta-llama/llama-4-maverick',
    label: 'Llama 4 Maverick',
    provider: 'Meta',
    tier: 'premium',
    description: 'Última geração Meta — 400B MoE com escrita criativa excepcional.',
    contextWindow: 1_048_576,
    inputCost: 0.2,
    outputCost: 0.6,
    isFree: false,
    agentFit: { extraction: 7, synthesis: 8, reasoning: 8, writing: 9 },
  },
  {
    id: 'meta-llama/llama-4-scout',
    label: 'Llama 4 Scout',
    provider: 'Meta',
    tier: 'balanced',
    description: 'Contexto massivo de 10M tokens — ótimo para campanhas longas.',
    contextWindow: 10_000_000,
    inputCost: 0.15,
    outputCost: 0.4,
    isFree: false,
    agentFit: { extraction: 8, synthesis: 7, reasoning: 6, writing: 7 },
  },
  {
    id: 'meta-llama/llama-3.3-70b-instruct',
    label: 'Llama 3.3 70B Instruct',
    provider: 'Meta',
    tier: 'balanced',
    description: 'Ótima relação capacidade/custo — open-source confiável.',
    contextWindow: 131_072,
    inputCost: 0.12,
    outputCost: 0.3,
    isFree: false,
    agentFit: { extraction: 7, synthesis: 7, reasoning: 7, writing: 7 },
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
    agentFit: { extraction: 6, synthesis: 3, reasoning: 3, writing: 3 },
  },

  // ── Mistral ─────────────────────────────────────────────────────────────
  {
    id: 'mistralai/mistral-large-2411',
    label: 'Mistral Large (Nov 2024)',
    provider: 'Mistral',
    tier: 'premium',
    description: 'Premium da Mistral — excelente para escrita criativa multilíngue.',
    contextWindow: 131_000,
    inputCost: 2.0,
    outputCost: 6.0,
    isFree: false,
    agentFit: { extraction: 6, synthesis: 8, reasoning: 8, writing: 9 },
  },
  {
    id: 'mistralai/mistral-small-3.1-24b-instruct',
    label: 'Mistral Small 3.1 24B',
    provider: 'Mistral',
    tier: 'balanced',
    description: 'Balanceado e eficiente — multilíngue com boa relação custo-benefício.',
    contextWindow: 131_000,
    inputCost: 0.1,
    outputCost: 0.3,
    isFree: false,
    agentFit: { extraction: 7, synthesis: 6, reasoning: 6, writing: 6 },
  },
  {
    id: 'mistralai/mistral-7b-instruct:free',
    label: 'Mistral 7B Instruct (Free)',
    provider: 'Mistral',
    tier: 'fast',
    description: 'Open-source gratuito da Mistral — leve e rápido.',
    contextWindow: 32_768,
    inputCost: 0.0,
    outputCost: 0.0,
    isFree: true,
    agentFit: { extraction: 5, synthesis: 3, reasoning: 2, writing: 3 },
  },

  // ── Qwen ────────────────────────────────────────────────────────────────
  {
    id: 'qwen/qwen-2.5-72b-instruct',
    label: 'Qwen 2.5 72B Instruct',
    provider: 'Qwen',
    tier: 'balanced',
    description: 'Forte em texto e código — boa alternativa equilibrada.',
    contextWindow: 131_072,
    inputCost: 0.13,
    outputCost: 0.4,
    isFree: false,
    agentFit: { extraction: 7, synthesis: 7, reasoning: 7, writing: 6 },
  },
  {
    id: 'qwen/qwen-2.5-coder-32b-instruct',
    label: 'Qwen 2.5 Coder 32B',
    provider: 'Qwen',
    tier: 'balanced',
    description: 'Especialista em código — útil para extração estruturada e JSON.',
    contextWindow: 131_072,
    inputCost: 0.07,
    outputCost: 0.16,
    isFree: false,
    agentFit: { extraction: 8, synthesis: 5, reasoning: 6, writing: 4 },
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
    agentFit: { extraction: 5, synthesis: 3, reasoning: 3, writing: 3 },
  },

  // ── xAI ─────────────────────────────────────────────────────────────────
  {
    id: 'x-ai/grok-3',
    label: 'Grok 3',
    provider: 'xAI',
    tier: 'premium',
    description: 'Premium da xAI — forte escrita criativa e raciocínio lógico.',
    contextWindow: 131_072,
    inputCost: 3.0,
    outputCost: 15.0,
    isFree: false,
    agentFit: { extraction: 7, synthesis: 8, reasoning: 9, writing: 8 },
  },
  {
    id: 'x-ai/grok-3-mini',
    label: 'Grok 3 Mini',
    provider: 'xAI',
    tier: 'fast',
    description: 'Versão compacta do Grok 3 — rápido e econômico.',
    contextWindow: 131_072,
    inputCost: 0.3,
    outputCost: 0.5,
    isFree: false,
    agentFit: { extraction: 7, synthesis: 5, reasoning: 5, writing: 5 },
  },

  // ── Cohere ──────────────────────────────────────────────────────────────
  {
    id: 'cohere/command-r-plus',
    label: 'Command R+',
    provider: 'Cohere',
    tier: 'premium',
    description: 'Premium da Cohere — excelente para síntese e recuperação de informação.',
    contextWindow: 128_000,
    inputCost: 2.5,
    outputCost: 10.0,
    isFree: false,
    agentFit: { extraction: 7, synthesis: 8, reasoning: 7, writing: 7 },
  },
  {
    id: 'cohere/command-r',
    label: 'Command R',
    provider: 'Cohere',
    tier: 'balanced',
    description: 'Balanceado da Cohere — bom para síntese e geração de texto.',
    contextWindow: 128_000,
    inputCost: 0.15,
    outputCost: 0.6,
    isFree: false,
    agentFit: { extraction: 6, synthesis: 6, reasoning: 5, writing: 6 },
  },

  // ── Microsoft ────────────────────────────────────────────────────────────
  {
    id: 'microsoft/phi-4',
    label: 'Phi-4',
    provider: 'Microsoft',
    tier: 'fast',
    description: 'Compacto da Microsoft — surpreendente raciocínio para o tamanho.',
    contextWindow: 16_384,
    inputCost: 0.07,
    outputCost: 0.14,
    isFree: false,
    agentFit: { extraction: 7, synthesis: 4, reasoning: 6, writing: 4 },
  },
  {
    id: 'microsoft/phi-3-medium-128k-instruct:free',
    label: 'Phi-3 Medium 128K (Free)',
    provider: 'Microsoft',
    tier: 'fast',
    description: 'Gratuito da Microsoft — janela de 128K tokens.',
    contextWindow: 128_000,
    inputCost: 0.0,
    outputCost: 0.0,
    isFree: true,
    agentFit: { extraction: 6, synthesis: 3, reasoning: 4, writing: 3 },
  },

  // ── NVIDIA ──────────────────────────────────────────────────────────────
  {
    id: 'nvidia/llama-3.1-nemotron-70b-instruct',
    label: 'Nemotron 70B',
    provider: 'NVIDIA',
    tier: 'balanced',
    description: 'Fine-tune NVIDIA do Llama 3.1 — forte em seguir instruções.',
    contextWindow: 131_072,
    inputCost: 0.12,
    outputCost: 0.3,
    isFree: false,
    agentFit: { extraction: 8, synthesis: 7, reasoning: 7, writing: 7 },
  },

  // ── Perplexity ──────────────────────────────────────────────────────────
  {
    id: 'perplexity/sonar-pro',
    label: 'Sonar Pro',
    provider: 'Perplexity',
    tier: 'premium',
    description: 'Busca web integrada — ideal para pesquisa de lore e ambientação.',
    contextWindow: 200_000,
    inputCost: 3.0,
    outputCost: 15.0,
    isFree: false,
    agentFit: { extraction: 9, synthesis: 7, reasoning: 6, writing: 5 },
  },
  {
    id: 'perplexity/sonar',
    label: 'Sonar',
    provider: 'Perplexity',
    tier: 'balanced',
    description: 'Busca web econômica — bom para consultas rápidas de referência.',
    contextWindow: 127_072,
    inputCost: 1.0,
    outputCost: 1.0,
    isFree: false,
    agentFit: { extraction: 8, synthesis: 5, reasoning: 4, writing: 4 },
  },

  // ── Arcee AI ────────────────────────────────────────────────────────────
  {
    id: 'arcee-ai/arcee-blitz',
    label: 'Arcee Blitz',
    provider: 'Arcee AI',
    tier: 'fast',
    description: 'Modelo equilibrado e rápido da Arcee — bom custo-benefício para tarefas variadas.',
    contextWindow: 32_768,
    inputCost: 0.05,
    outputCost: 0.10,
    isFree: false,
    agentFit: { extraction: 7, synthesis: 5, reasoning: 5, writing: 5 },
  },
  {
    id: 'arcee-ai/arcee-caller',
    label: 'Arcee Caller',
    provider: 'Arcee AI',
    tier: 'fast',
    description: 'Especialista em chamadas de função — ideal para agentes e automações.',
    contextWindow: 32_768,
    inputCost: 0.03,
    outputCost: 0.05,
    isFree: false,
    agentFit: { extraction: 8, synthesis: 4, reasoning: 5, writing: 3 },
  },

  // ── NVIDIA (extras) ────────────────────────────────────────────────────
  {
    id: 'nvidia/llama-3.1-nemotron-ultra-253b-v1:free',
    label: 'Nemotron Ultra 253B (Free)',
    provider: 'NVIDIA',
    tier: 'premium',
    description: 'Modelo premium gratuito da NVIDIA — 253B params com raciocínio avançado.',
    contextWindow: 131_072,
    inputCost: 0.0,
    outputCost: 0.0,
    isFree: true,
    agentFit: { extraction: 7, synthesis: 7, reasoning: 8, writing: 7 },
  },

  // ── Google (extras) ────────────────────────────────────────────────────
  {
    id: 'google/gemini-2.5-flash-preview:thinking',
    label: 'Gemini 2.5 Flash Thinking',
    provider: 'Google',
    tier: 'balanced',
    description: 'Flash com modo thinking — raciocínio aprimorado e janela de 1M tokens.',
    contextWindow: 1_048_576,
    inputCost: 0.15,
    outputCost: 0.60,
    isFree: false,
    agentFit: { extraction: 8, synthesis: 7, reasoning: 8, writing: 7 },
  },

  // ── Amazon ─────────────────────────────────────────────────────────────
  {
    id: 'amazon/nova-pro-v1',
    label: 'Amazon Nova Pro',
    provider: 'Amazon',
    tier: 'balanced',
    description: 'Modelo multimodal da Amazon — forte em análise e geração de texto longo.',
    contextWindow: 300_000,
    inputCost: 0.80,
    outputCost: 3.20,
    isFree: false,
    agentFit: { extraction: 7, synthesis: 7, reasoning: 7, writing: 6 },
  },
  {
    id: 'amazon/nova-lite-v1',
    label: 'Amazon Nova Lite',
    provider: 'Amazon',
    tier: 'fast',
    description: 'Versão leve e econômica do Nova — rápida para tarefas simples.',
    contextWindow: 300_000,
    inputCost: 0.06,
    outputCost: 0.24,
    isFree: false,
    agentFit: { extraction: 7, synthesis: 4, reasoning: 4, writing: 4 },
  },

  // ── MiniMax ────────────────────────────────────────────────────────────
  {
    id: 'minimax/minimax-01',
    label: 'MiniMax-01',
    provider: 'MiniMax',
    tier: 'balanced',
    description: 'Modelo chinês com janela de 1M tokens — bom equilíbrio geral.',
    contextWindow: 1_048_576,
    inputCost: 0.40,
    outputCost: 1.10,
    isFree: false,
    agentFit: { extraction: 7, synthesis: 7, reasoning: 7, writing: 7 },
  },

  // ── Nous Research ──────────────────────────────────────────────────────
  {
    id: 'nousresearch/hermes-3-llama-3.1-405b',
    label: 'Hermes 3 405B',
    provider: 'Nous Research',
    tier: 'premium',
    description: 'Fine-tune premium do Llama 405B — excelente para escrita criativa e RPG.',
    contextWindow: 131_072,
    inputCost: 0.80,
    outputCost: 0.80,
    isFree: false,
    agentFit: { extraction: 7, synthesis: 8, reasoning: 8, writing: 8 },
  },

  // ── OpenRouter ─────────────────────────────────────────────────────────
  {
    id: 'openrouter/auto',
    label: 'OpenRouter Auto',
    provider: 'OpenRouter',
    tier: 'balanced',
    description: 'Roteamento automático OpenRouter — escolhe o melhor modelo disponível.',
    contextWindow: 200_000,
    inputCost: 0.0,
    outputCost: 0.0,
    isFree: false,
    agentFit: { extraction: 7, synthesis: 7, reasoning: 7, writing: 7 },
  },
  {
    id: 'openrouter/optimus',
    label: 'OpenRouter Optimus',
    provider: 'OpenRouter',
    tier: 'balanced',
    description: 'Otimização automática de modelo para custo-qualidade.',
    contextWindow: 200_000,
    inputCost: 0.0,
    outputCost: 0.0,
    isFree: false,
    agentFit: { extraction: 7, synthesis: 7, reasoning: 7, writing: 7 },
  },

  // ── Free Models (extras) ───────────────────────────────────────────────
  {
    id: 'meta-llama/llama-3.3-70b-instruct:free',
    label: 'Llama 3.3 70B (Free)',
    provider: 'Meta',
    tier: 'balanced',
    description: 'Llama 3.3 70B gratuito — boa qualidade para uso sem custos.',
    contextWindow: 131_072,
    inputCost: 0.0,
    outputCost: 0.0,
    isFree: true,
    agentFit: { extraction: 6, synthesis: 6, reasoning: 6, writing: 6 },
  },
  {
    id: 'meta-llama/llama-4-maverick:free',
    label: 'Llama 4 Maverick (Free)',
    provider: 'Meta',
    tier: 'premium',
    description: 'Llama 4 Maverick gratuito — modelo premium com janela de 1M tokens.',
    contextWindow: 1_048_576,
    inputCost: 0.0,
    outputCost: 0.0,
    isFree: true,
    agentFit: { extraction: 6, synthesis: 7, reasoning: 7, writing: 8 },
  },
  {
    id: 'qwen/qwen-2.5-72b-instruct:free',
    label: 'Qwen 2.5 72B (Free)',
    provider: 'Qwen',
    tier: 'balanced',
    description: 'Qwen 72B gratuito — alternativa forte e sem custo.',
    contextWindow: 131_072,
    inputCost: 0.0,
    outputCost: 0.0,
    isFree: true,
    agentFit: { extraction: 6, synthesis: 6, reasoning: 6, writing: 5 },
  },
  {
    id: 'google/gemma-3-27b-it:free',
    label: 'Gemma 3 27B (Free)',
    provider: 'Google',
    tier: 'fast',
    description: 'Modelo leve e gratuito do Google — rápido para tarefas simples.',
    contextWindow: 131_072,
    inputCost: 0.0,
    outputCost: 0.0,
    isFree: true,
    agentFit: { extraction: 6, synthesis: 4, reasoning: 5, writing: 4 },
  },

  // ── Gemini (extras) ────────────────────────────────────────────────────
  {
    id: 'google/gemini-pro-1.5',
    label: 'Gemini 1.5 Pro',
    provider: 'Google',
    tier: 'premium',
    description: 'Gemini 1.5 Pro com janela de 2M tokens — excelente para longas campanhas.',
    contextWindow: 2_000_000,
    inputCost: 1.25,
    outputCost: 5.0,
    isFree: false,
    agentFit: { extraction: 8, synthesis: 8, reasoning: 8, writing: 8 },
  },

  // ── Meta (extras) ─────────────────────────────────────────────────────
  {
    id: 'meta-llama/llama-3.1-70b-instruct',
    label: 'Llama 3.1 70B Instruct',
    provider: 'Meta',
    tier: 'balanced',
    description: 'Llama 3.1 70B — referência open-source com excelente custo-benefício.',
    contextWindow: 131_072,
    inputCost: 0.08,
    outputCost: 0.29,
    isFree: false,
    agentFit: { extraction: 7, synthesis: 6, reasoning: 6, writing: 6 },
  },
  {
    id: 'meta-llama/llama-3.2-90b-vision-instruct',
    label: 'Llama 3.2 90B Vision',
    provider: 'Meta',
    tier: 'balanced',
    description: 'Llama 3.2 multimodal com 90B params — visão + texto com boa qualidade.',
    contextWindow: 131_072,
    inputCost: 0.9,
    outputCost: 0.9,
    isFree: false,
    agentFit: { extraction: 7, synthesis: 6, reasoning: 6, writing: 6 },
  },

  // ── Mistral (extras) ──────────────────────────────────────────────────
  {
    id: 'mistralai/mixtral-8x7b-instruct',
    label: 'Mixtral 8x7B Instruct',
    provider: 'Mistral',
    tier: 'balanced',
    description: 'MoE clássico da Mistral — ótimo custo-benefício para tarefas gerais.',
    contextWindow: 32_768,
    inputCost: 0.24,
    outputCost: 0.24,
    isFree: false,
    agentFit: { extraction: 7, synthesis: 6, reasoning: 6, writing: 6 },
  },
  {
    id: 'mistralai/mixtral-8x22b-instruct',
    label: 'Mixtral 8x22B Instruct',
    provider: 'Mistral',
    tier: 'premium',
    description: 'MoE grande da Mistral — alta capacidade com bom equilíbrio de custo.',
    contextWindow: 65_536,
    inputCost: 0.9,
    outputCost: 0.9,
    isFree: false,
    agentFit: { extraction: 7, synthesis: 7, reasoning: 7, writing: 7 },
  },
  {
    id: 'mistralai/mistral-nemo',
    label: 'Mistral Nemo',
    provider: 'Mistral',
    tier: 'balanced',
    description: 'Mistral Nemo 12B — multilíngue, rápido e eficiente para texto narrativo.',
    contextWindow: 128_000,
    inputCost: 0.13,
    outputCost: 0.13,
    isFree: false,
    agentFit: { extraction: 7, synthesis: 6, reasoning: 5, writing: 6 },
  },
  {
    id: 'mistralai/mistral-nemo:free',
    label: 'Mistral Nemo (Free)',
    provider: 'Mistral',
    tier: 'balanced',
    description: 'Mistral Nemo 12B gratuito — bom para uso multilíngue sem custos.',
    contextWindow: 128_000,
    inputCost: 0.0,
    outputCost: 0.0,
    isFree: true,
    agentFit: { extraction: 6, synthesis: 5, reasoning: 4, writing: 5 },
  },

  // ── xAI (extras) ──────────────────────────────────────────────────────
  {
    id: 'x-ai/grok-2-1212',
    label: 'Grok 2',
    provider: 'xAI',
    tier: 'premium',
    description: 'Grok 2 da xAI — forte raciocínio e criatividade narrativa.',
    contextWindow: 131_072,
    inputCost: 2.0,
    outputCost: 10.0,
    isFree: false,
    agentFit: { extraction: 7, synthesis: 8, reasoning: 8, writing: 8 },
  },

  // ── DeepSeek (distilados) ──────────────────────────────────────────────
  {
    id: 'deepseek/deepseek-r1-distill-llama-70b',
    label: 'DeepSeek R1 Distill 70B',
    provider: 'DeepSeek',
    tier: 'balanced',
    description: 'R1 destilado em Llama 70B — raciocínio avançado com bom custo-benefício.',
    contextWindow: 131_072,
    inputCost: 0.23,
    outputCost: 0.69,
    isFree: false,
    agentFit: { extraction: 4, synthesis: 6, reasoning: 8, writing: 5 },
  },
  {
    id: 'deepseek/deepseek-r1-distill-qwen-32b',
    label: 'DeepSeek R1 Distill 32B',
    provider: 'DeepSeek',
    tier: 'balanced',
    description: 'R1 destilado em Qwen 32B — raciocínio compacto e econômico.',
    contextWindow: 131_072,
    inputCost: 0.18,
    outputCost: 0.18,
    isFree: false,
    agentFit: { extraction: 4, synthesis: 5, reasoning: 7, writing: 4 },
  },

  // ── Nous Research (extras) ────────────────────────────────────────────
  {
    id: 'nousresearch/hermes-3-llama-3.1-405b:free',
    label: 'Hermes 3 405B (Free)',
    provider: 'Nous Research',
    tier: 'premium',
    description: 'Hermes 3 405B gratuito — excelente para RPG e escrita criativa.',
    contextWindow: 131_072,
    inputCost: 0.0,
    outputCost: 0.0,
    isFree: true,
    agentFit: { extraction: 6, synthesis: 7, reasoning: 7, writing: 8 },
  },

  // ── Google Gemma (extras) ──────────────────────────────────────────────
  {
    id: 'google/gemma-3-12b-it:free',
    label: 'Gemma 3 12B (Free)',
    provider: 'Google',
    tier: 'fast',
    description: 'Gemma 3 12B gratuito — leve e rápido para tarefas básicas.',
    contextWindow: 131_072,
    inputCost: 0.0,
    outputCost: 0.0,
    isFree: true,
    agentFit: { extraction: 6, synthesis: 3, reasoning: 4, writing: 3 },
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
 * Carrega o mapa de modelos por agente.
 * Prioridade: firestoreData > localStorage > defaults.
 * @param firestoreData Mapa de agente→modelo salvo no Firestore (opcional)
 */
export function loadAgentModels(firestoreData?: Record<string, string>): Record<string, string> {
  const defaults = getDefaultModelMap();
  if (firestoreData && Object.keys(firestoreData).length > 0) {
    return { ...defaults, ...firestoreData };
  }
  try {
    const raw = localStorage.getItem(AGENT_MODELS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Record<string, string>;
      return { ...defaults, ...parsed };
    }
  } catch {
    // localStorage indisponível (SSR, erro de parse, etc.)
  }
  return defaults;
}

/**
 * Persiste o mapa de modelos por agente no localStorage (cache local).
 * A persistência principal é feita via Firestore em UserProfile.updateAgentModels().
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
