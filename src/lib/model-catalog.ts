/**
 * OmniForge RPG — Model Catalog
 *
 * Cache em memória + carregamento dinâmico a partir da API OpenRouter.
 * Faz fallback para AVAILABLE_MODELS quando a API estiver indisponível.
 */

import { useState, useEffect } from 'react';
import { AVAILABLE_MODELS, type ModelOption, type AgentCategory } from './model-config';
import { sanitizeApiKey } from './aiClient';

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
 * Infere fit scores por categoria com base no tier, ID e nome do modelo.
 * Usa heurísticas mais granulares para scores realistas entre modelos.
 */
export function inferFitScores(
  tier: 'fast' | 'balanced' | 'premium',
  id: string,
  _name?: string,
): ModelOption['agentFit'] {
  const lower = id.toLowerCase();
  const isReasoning = /\b(r1|r2|o3|o4|think|reasoning)\b/.test(lower);
  const isCoder = /\b(coder|code|starcoder)\b/.test(lower);
  const isFree = lower.includes(':free');

  // Penalty for free models (typically rate-limited or older snapshots)
  const freeOffset = isFree ? -1 : 0;

  if (isReasoning) {
    return {
      extraction: Math.max(1, 3 + freeOffset),
      synthesis:  Math.max(1, 6 + freeOffset),
      reasoning:  Math.max(1, 9 + freeOffset),
      writing:    Math.max(1, 6 + freeOffset),
    };
  }
  if (isCoder) {
    return {
      extraction: Math.max(1, 8 + freeOffset),
      synthesis:  Math.max(1, 4 + freeOffset),
      reasoning:  Math.max(1, 6 + freeOffset),
      writing:    Math.max(1, 3 + freeOffset),
    };
  }
  if (tier === 'fast') {
    return {
      extraction: Math.max(1, 7 + freeOffset),
      synthesis:  Math.max(1, 4 + freeOffset),
      reasoning:  Math.max(1, 3 + freeOffset),
      writing:    Math.max(1, 4 + freeOffset),
    };
  }
  if (tier === 'premium') {
    return {
      extraction: Math.max(1, 7 + freeOffset),
      synthesis:  Math.max(1, 8 + freeOffset),
      reasoning:  Math.max(1, 8 + freeOffset),
      writing:    Math.max(1, 8 + freeOffset),
    };
  }
  // balanced
  return {
    extraction: Math.max(1, 7 + freeOffset),
    synthesis:  Math.max(1, 6 + freeOffset),
    reasoning:  Math.max(1, 6 + freeOffset),
    writing:    Math.max(1, 6 + freeOffset),
  };
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
  const agentFit = inferFitScores(tier, or.id, or.name ?? '');

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
      const cleanKey = sanitizeApiKey(apiKey);
      if (cleanKey) {
        headers['Authorization'] = `Bearer ${cleanKey}`;
      }
    }

    const res = await fetch('https://openrouter.ai/api/v1/models', { headers });
    if (!res.ok) throw new Error(`OpenRouter API returned ${res.status}`);

    const json = await res.json() as { data: OpenRouterModel[] };
    const textModels = (json.data ?? []).filter(
      (m) => !m.architecture?.modality || m.architecture.modality.includes('text')
    );

    const converted = textModels.map(openRouterToModelOption);

    // Build set of live model IDs for availability check
    const liveIds = new Set(converted.map((m) => m.id));

    // Keep only AVAILABLE_MODELS that are confirmed live on OpenRouter
    const confirmedCurated = AVAILABLE_MODELS.filter((m) => liveIds.has(m.id));
    const curatedIds = new Set(confirmedCurated.map((m) => m.id));

    // Append extra models from the API that are not in the curated list
    const extras = converted.filter((m) => !curatedIds.has(m.id));

    _catalog = [...confirmedCurated, ...extras];
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
// Verificação de modelos contra a API OpenRouter
// ---------------------------------------------------------------------------

export interface VerifyResult {
  /** IDs de modelos disponíveis na API OpenRouter */
  availableIds: Set<string>;
  /** Modelos do catálogo (AVAILABLE_MODELS) que NÃO estão disponíveis */
  unavailableCatalogIds: string[];
  /** Modelos de agente que NÃO estão disponíveis. Map {agentKey → modelId} */
  unavailableAgentModels: Record<string, string>;
  /** O modelo padrão configurado é válido? */
  defaultModelAvailable: boolean;
  /** Total de modelos verificados */
  totalChecked: number;
}

/**
 * Verifica quais modelos do catálogo e dos agentes ainda estão disponíveis na API OpenRouter.
 * @param apiKey Chave de API OpenRouter do usuário
 * @param agentModels Mapa {agentKey → modelId} dos agentes
 * @param defaultModel Modelo padrão configurado pelo usuário
 */
export async function verifyModelAvailability(
  apiKey: string,
  agentModels: Record<string, string>,
  defaultModel: string,
): Promise<VerifyResult> {
  if (!apiKey || !apiKey.trim()) {
    throw new Error('Chave de API não configurada. Configure sua chave em Perfil → Configuração de IA.');
  }

  // Strip a leading "Bearer " prefix (in case the user pasted the full header value)
  // and remove non-printable / non-ASCII characters that are invalid in HTTP headers.
  // Delegates to the shared sanitizeApiKey utility for consistency.
  const trimmedKey = sanitizeApiKey(apiKey);
  const commonHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${trimmedKey}`,
  };

  // Validate the API key first using the authenticated /auth/key endpoint.
  // GET /v1/models is a public endpoint and does not validate authentication,
  // so we must use /auth/key to confirm the key is actually valid.
  const authRes = await fetch('https://openrouter.ai/api/v1/auth/key', { headers: commonHeaders });
  if (!authRes.ok) {
    const errBody = await authRes.json().catch(() => ({})) as { error?: { message?: string } };
    const msg = errBody?.error?.message || `${authRes.status} ${authRes.statusText}`;
    throw new Error(`Chave de API OpenRouter inválida ou não reconhecida (${msg}). Verifique se a chave está correta e não expirou em Perfil → Configuração de IA.`);
  }

  const res = await fetch('https://openrouter.ai/api/v1/models', { headers: commonHeaders });
  if (!res.ok) {
    throw new Error(`OpenRouter API retornou ${res.status}: ${res.statusText}`);
  }

  const json = await res.json() as { data: OpenRouterModel[] };
  const liveIds = new Set((json.data ?? []).map((m) => m.id));

  // Check which AVAILABLE_MODELS are unavailable
  const unavailableCatalogIds = AVAILABLE_MODELS
    .map((m) => m.id)
    .filter((id) => !liveIds.has(id));

  // Check which agent models are unavailable (skip empty/unset assignments)
  const unavailableAgentModels: Record<string, string> = {};
  for (const [agentKey, modelId] of Object.entries(agentModels)) {
    if (modelId && !liveIds.has(modelId)) {
      unavailableAgentModels[agentKey] = modelId;
    }
  }

  // Check default model (empty string means no model selected — treated as valid)
  const defaultModelAvailable = !defaultModel || liveIds.has(defaultModel);

  // Total unique IDs checked
  const allIds = new Set([
    ...AVAILABLE_MODELS.map((m) => m.id),
    ...Object.values(agentModels),
    defaultModel,
  ].filter(Boolean));

  return {
    availableIds: liveIds,
    unavailableCatalogIds,
    unavailableAgentModels,
    defaultModelAvailable,
    totalChecked: allIds.size,
  };
}

// ---------------------------------------------------------------------------
// React hooks
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

/**
 * Remove modelos do catálogo em memória pelo ID e notifica os listeners.
 * Usado após verificação para excluir modelos indisponíveis.
 */
export function removeModelsFromCatalog(idsToRemove: Set<string>): void {
  if (idsToRemove.size === 0) return;
  _catalog = _catalog.filter((m) => !idsToRemove.has(m.id));
  notifyListeners();
}

/**
 * Hook React que retorna o catálogo personalizado do usuário.
 * Combina modelos curados (AVAILABLE_MODELS) + modelos customizados adicionados pelo usuário,
 * excluindo modelos marcados como removidos (indisponíveis).
 * @param apiKey Chave OpenRouter para buscar modelos extras
 * @param customModelIds IDs de modelos customizados do Firestore do usuário
 * @param removedModelIds IDs de modelos removidos (indisponíveis) do Firestore do usuário
 */
export function useUserCatalog(
  apiKey?: string,
  customModelIds?: string[],
  removedModelIds?: string[],
): {
  /** Modelos curados + customizados do usuário */
  userModels: ModelOption[];
  /** Catálogo completo (inclui todos os modelos OpenRouter) */
  allModels: ModelOption[];
  isLoading: boolean;
} {
  const { models: allModels, isLoading } = useCatalogModels(apiKey);

  const [merged, setMerged] = useState<ModelOption[]>(AVAILABLE_MODELS);

  useEffect(() => {
    const removedSet = new Set(removedModelIds ?? []);
    const filteredCurated = AVAILABLE_MODELS.filter((m) => !removedSet.has(m.id));

    if (!customModelIds || customModelIds.length === 0) {
      setMerged([...filteredCurated]);
      return;
    }
    const curatedIds = new Set(filteredCurated.map((m) => m.id));
    const extraModels = customModelIds
      .filter((id) => !curatedIds.has(id) && !removedSet.has(id))
      .map((id) => allModels.find((m) => m.id === id))
      .filter(Boolean) as ModelOption[];
    setMerged([...filteredCurated, ...extraModels]);
  }, [customModelIds, removedModelIds, allModels]);

  return { userModels: merged, allModels, isLoading };
}
