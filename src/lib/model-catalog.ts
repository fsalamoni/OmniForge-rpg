/**
 * OmniForge RPG — Model Catalog
 *
 * Cache em memória + carregamento dinâmico a partir da API OpenRouter.
 * Faz fallback para AVAILABLE_MODELS quando a API estiver indisponível.
 */

import { useState, useEffect } from 'react';
import { AVAILABLE_MODELS, type ModelOption, type AgentCategory } from './model-config';

// ---------------------------------------------------------------------------
// Tipos da resposta da API OpenRouter
// ---------------------------------------------------------------------------

interface OpenRouterModelArch {
  modality?: string;
}

interface OpenRouterModel {
  id: string;
  name: string;
  description?: string;
  context_length?: number;
  architecture?: OpenRouterModelArch;
  pricing?: {
    prompt?: string;
    completion?: string;
  };
}

// ---------------------------------------------------------------------------
// Cache em memória
// ---------------------------------------------------------------------------

let _catalog: ModelOption[] = [...AVAILABLE_MODELS];
let _listeners: Array<() => void> = [];

function notifyListeners() {
  _listeners.forEach((fn) => fn());
}

/** Retorna o catálogo atual (estático ou carregado da API). */
export function getCatalog(): ModelOption[] {
  return _catalog;
}

// ---------------------------------------------------------------------------
// Inferência de metadados
// ---------------------------------------------------------------------------

/**
 * Infere o tier do modelo a partir de seu ID e nome.
 * - fast: mini/nano/lite/flash/haiku/small
 * - premium: r1/r2/o3/o4/opus/large
 * - balanced: demais
 */
export function inferTier(id: string, name: string): 'fast' | 'balanced' | 'premium' {
  const combined = `${id} ${name}`.toLowerCase();
  if (/\b(mini|nano|lite|flash|haiku|small)\b/.test(combined)) return 'fast';
  if (/\b(r1|r2|o3|o4|opus|large)\b/.test(combined)) return 'premium';
  return 'balanced';
}

/**
 * Infere fit scores por categoria com base no tier e ID do modelo.
 * Modelos de raciocínio (r1/r2/o3/o4/think) recebem scores especiais.
 */
export function inferFitScores(
  tier: 'fast' | 'balanced' | 'premium',
  id: string
): ModelOption['agentFit'] {
  const isReasoning = /\b(r1|r2|o3|o4|think|reasoning)\b/.test(id.toLowerCase());

  if (isReasoning) {
    return { extraction: 3, synthesis: 6, reasoning: 9, writing: 6 };
  }
  if (tier === 'fast') {
    return { extraction: 8, synthesis: 5, reasoning: 4, writing: 5 };
  }
  if (tier === 'premium') {
    return { extraction: 6, synthesis: 9, reasoning: 9, writing: 9 };
  }
  // balanced
  return { extraction: 7, synthesis: 7, reasoning: 7, writing: 7 };
}

/** Extrai o nome do provedor a partir do model ID ("provider/model-name"). */
function inferProvider(id: string): string {
  const providerMap: Record<string, string> = {
    'anthropic': 'Anthropic',
    'google': 'Google',
    'openai': 'OpenAI',
    'deepseek': 'DeepSeek',
    'meta-llama': 'Meta',
    'mistralai': 'Mistral',
    'qwen': 'Qwen',
    'x-ai': 'xAI',
    'cohere': 'Cohere',
    'microsoft': 'Microsoft',
    'nvidia': 'NVIDIA',
    'amazon': 'Amazon',
    'perplexity': 'Perplexity',
  };
  const prefix = id.split('/')[0];
  return providerMap[prefix] ?? prefix ?? 'Unknown';
}

// ---------------------------------------------------------------------------
// Conversão de resposta da API OpenRouter → ModelOption
// ---------------------------------------------------------------------------

/**
 * Converte um modelo da API OpenRouter para o formato ModelOption interno.
 */
export function openRouterToModelOption(or: OpenRouterModel): ModelOption {
  const isFree = or.id.endsWith(':free') ||
    (or.pricing?.prompt === '0' && or.pricing?.completion === '0');

  const inputCost = isFree ? 0 : parseFloat(or.pricing?.prompt ?? '0') * 1_000_000;
  const outputCost = isFree ? 0 : parseFloat(or.pricing?.completion ?? '0') * 1_000_000;

  const tier = inferTier(or.id, or.name ?? '');
  const agentFit = inferFitScores(tier, or.id);

  return {
    id: or.id,
    label: or.name ?? or.id,
    provider: inferProvider(or.id),
    tier,
    description: or.description ?? '',
    contextWindow: or.context_length ?? 0,
    inputCost,
    outputCost,
    isFree,
    agentFit,
  };
}

// ---------------------------------------------------------------------------
// Fetch da API OpenRouter
// ---------------------------------------------------------------------------

/**
 * Busca modelos disponíveis na API OpenRouter e atualiza o catálogo em memória.
 * Filtra apenas modelos de texto (modality === "text").
 * Se falhar, mantém o catálogo atual.
 */
export async function fetchOpenRouterModels(apiKey?: string): Promise<ModelOption[]> {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    const res = await fetch('https://openrouter.ai/api/v1/models', { headers });
    if (!res.ok) throw new Error(`OpenRouter API returned ${res.status}`);

    const json = await res.json() as { data: OpenRouterModel[] };
    const textModels = (json.data ?? []).filter(
      (m) => !m.architecture?.modality || m.architecture.modality.includes('text')
    );

    const converted = textModels.map(openRouterToModelOption);

    // Merge: priority to AVAILABLE_MODELS for known IDs (they have curated descriptions/scores),
    // then append any extra models from the API not in the static list.
    const knownIds = new Set(AVAILABLE_MODELS.map((m) => m.id));
    const extras = converted.filter((m) => !knownIds.has(m.id));

    _catalog = [...AVAILABLE_MODELS, ...extras];
    notifyListeners();
    return _catalog;
  } catch {
    // Silently fail — use static catalog
    return _catalog;
  }
}

// ---------------------------------------------------------------------------
// Utilitários de consulta ao catálogo
// ---------------------------------------------------------------------------

/** Retorna os modelos do catálogo filtrados por categoria de agente (fit ≥ minFit). */
export function getModelsForCategory(
  category: AgentCategory,
  minFit = 5
): ModelOption[] {
  return _catalog.filter((m) => m.agentFit[category] >= minFit);
}

/** Retorna os modelos do catálogo filtrados por tier. */
export function getModelsByTier(tier: 'fast' | 'balanced' | 'premium'): ModelOption[] {
  return _catalog.filter((m) => m.tier === tier);
}

/** Encontra um ModelOption pelo ID. Retorna undefined se não encontrado. */
export function findModelById(id: string): ModelOption | undefined {
  return _catalog.find((m) => m.id === id);
}

// ---------------------------------------------------------------------------
// React hook
// ---------------------------------------------------------------------------

/**
 * Hook React que retorna o catálogo atual e re-renderiza quando ele muda.
 * Opcionalmente busca os modelos ao montar o componente se `apiKey` for fornecida.
 */
export function useCatalogModels(apiKey?: string): {
  models: ModelOption[];
  isLoading: boolean;
} {
  const [models, setModels] = useState<ModelOption[]>(_catalog);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Subscribe to catalog updates
    const handler = () => setModels([..._catalog]);
    _listeners.push(handler);

    // Optionally fetch live models
    if (apiKey) {
      setIsLoading(true);
      fetchOpenRouterModels(apiKey).finally(() => setIsLoading(false));
    }

    return () => {
      _listeners = _listeners.filter((fn) => fn !== handler);
    };
  }, [apiKey]);

  return { models, isLoading };
}
