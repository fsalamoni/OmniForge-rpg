/**
 * Universal AI client - supports OpenAI-compatible APIs and native Gemini API
 */

import { getModelCost } from './model-config';

export const AI_PRESETS = {
  openrouter: {
    label: 'OpenRouter (todos os modelos)',
    baseUrl: 'https://openrouter.ai/api/v1',
    modelPlaceholder: 'openai/gpt-4o',
    docsUrl: 'https://openrouter.ai/keys',
    models: null // free text — too many models
  },
  openai: {
    label: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    modelPlaceholder: 'gpt-4o',
    docsUrl: 'https://platform.openai.com/api-keys',
    models: [
      { value: 'gpt-4o',       label: 'GPT-4o (recomendado)' },
      { value: 'gpt-4o-mini',  label: 'GPT-4o Mini (rápido e barato)' },
      { value: 'gpt-4-turbo',  label: 'GPT-4 Turbo' },
      { value: 'o3-mini',      label: 'o3-mini (raciocínio)' },
      { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo (legado)' }
    ]
  },
  gemini: {
    label: 'Google Gemini',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    modelPlaceholder: 'gemini-2.0-flash',
    docsUrl: 'https://aistudio.google.com/app/apikey',
    models: [
      { value: 'gemini-2.5-pro-preview-03-25', label: 'Gemini 2.5 Pro Preview (mais inteligente)' },
      { value: 'gemini-2.0-flash',             label: 'Gemini 2.0 Flash (recomendado)' },
      { value: 'gemini-2.0-flash-lite',        label: 'Gemini 2.0 Flash Lite (mais rápido)' },
      { value: 'gemini-1.5-pro',               label: 'Gemini 1.5 Pro' },
      { value: 'gemini-1.5-flash',             label: 'Gemini 1.5 Flash' }
    ]
  },
  custom: {
    label: 'Custom (URL própria)',
    baseUrl: '',
    modelPlaceholder: 'model-name',
    docsUrl: null,
    models: null // free text
  }
};

/** Returns true when the baseUrl points to Gemini's native REST API */
export function isGeminiUrl(baseUrl) {
  return typeof baseUrl === 'string' && baseUrl.includes('generativelanguage.googleapis.com');
}

/** Returns true when the baseUrl points to OpenRouter's API */
export function isOpenRouterUrl(baseUrl) {
  return typeof baseUrl === 'string' && baseUrl.includes('openrouter.ai');
}

/**
 * Sanitizes an API key so it is safe to use as an HTTP Bearer token.
 * - Strips a leading "Bearer " prefix (common copy-paste mistake).
 * - Removes non-printable / non-ASCII characters (U+0000–U+001F and U+007F–U+FFFF).
 *   Such characters (e.g. zero-width spaces, U+200B) pass String.prototype.trim()
 *   but are invalid in HTTP header values; browsers can silently drop the
 *   Authorization header when they are present, causing OpenRouter to return
 *   "Missing Authentication header" (HTTP 401).
 * - Trims leading/trailing whitespace.
 *
 * @param {string} key - Raw key string, may be empty/null/undefined.
 * @returns {string} Sanitized key, or empty string if nothing valid remains.
 */
export function sanitizeApiKey(key) {
  if (!key || typeof key !== 'string') return '';
  return key
    .replace(/^Bearer\s+/i, '')
    .replace(/[^\x20-\x7E]/g, '')
    .trim();
}

/**
 * Validates the AI configuration object.
 * Returns null if valid, or an error message string if invalid.
 * @param {object} aiConfig - { apiKey, baseUrl, model }
 * @returns {string|null} Error message or null if valid
 */
export function validateAIConfig(aiConfig) {
  if (!aiConfig) {
    return 'Configure sua chave de IA, URL base e modelo no Perfil antes de usar esta funcionalidade.\n\nAcesse: Perfil → Configuração de IA';
  }
  const missing = [];
  if (!aiConfig.apiKey || typeof aiConfig.apiKey !== 'string' || !aiConfig.apiKey.trim()) {
    missing.push('chave de API');
  }
  if (!aiConfig.baseUrl || typeof aiConfig.baseUrl !== 'string' || !aiConfig.baseUrl.trim()) {
    missing.push('URL base');
  }
  if (!aiConfig.model || typeof aiConfig.model !== 'string' || !aiConfig.model.trim()) {
    missing.push('modelo');
  }
  if (missing.length > 0) {
    return `Configure ${missing.join(', ')} no Perfil antes de usar esta funcionalidade.\n\nAcesse: Perfil → Configuração de IA`;
  }
  return null;
}

/** Normalize any Gemini baseUrl variant to the v1beta root (strips /openai suffix if present) */
export function geminiApiBase(baseUrl) {
  return baseUrl.replace(/\/openai\/?$/, '').replace(/\/$/, '');
}

/** Trim a baseUrl and remove any trailing slashes to avoid double-slash paths in fetch URLs */
export function normalizeBaseUrl(baseUrl) {
  return (typeof baseUrl === 'string') ? baseUrl.trim().replace(/\/+$/, '') : '';
}

/**
 * @param {object} params
 * @param {string} params.prompt                  - The user prompt to send
 * @param {object} [params.responseSchema]         - Optional JSON schema for structured output
 * @param {object} params.userAIConfig             - { apiKey, baseUrl, model }
 * @param {string} [params.systemPrompt]           - Override default system prompt
 * @param {number} [params.temperature]            - Override default temperature (0–2)
 * @param {string} [params.agentKey]               - Agent key to resolve per-agent model override
 * @param {Record<string,string>} [params.agentModels] - Map {agentKey → modelId} for per-agent overrides
 * @returns {Promise<object|string>} Parsed JSON if responseSchema provided, string otherwise
 */
export async function invokeLLM({ prompt, responseSchema, userAIConfig, systemPrompt, temperature, agentKey, agentModels }) {
  const { apiKey: _apiKey, baseUrl: _baseUrl, model: configModel } = userAIConfig || {};
  const apiKey = (typeof _apiKey === 'string') ? _apiKey.trim() : '';
  // Normalize baseUrl: trim and remove trailing slashes to avoid double-slash URLs that may cause redirects
  const baseUrl = normalizeBaseUrl(_baseUrl);

  // Resolve model: per-agent override > config model
  const model = (agentKey && agentModels?.[agentKey]) || configModel;

  if (!apiKey || !baseUrl || !model) {
    const missing = [];
    if (!apiKey) missing.push('chave de API');
    if (!baseUrl) missing.push('URL base');
    if (!model) missing.push('modelo');
    throw new Error(
      `Configure ${missing.join(', ')} no perfil antes de gerar campanhas. Acesse Perfil → Configuração de IA.`
    );
  }

  const resolvedSystemPrompt = systemPrompt ?? (
    responseSchema
      ? 'Você é um assistente especialista em RPG. Responda SEMPRE em JSON válido conforme o schema solicitado. Não adicione texto fora do JSON.'
      : 'Você é um assistente especialista em RPG.'
  );

  // ── Native Gemini API (avoids CORS issues with the OpenAI-compatible endpoint) ──
  if (isGeminiUrl(baseUrl)) {
    const apiBase = geminiApiBase(baseUrl);
    const url = `${apiBase}/models/${model}:generateContent?key=${apiKey}`;

    const geminiBody = {
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      systemInstruction: { parts: [{ text: resolvedSystemPrompt }] },
      generationConfig: {
        temperature: temperature ?? 0.8,
        ...(responseSchema ? { responseMimeType: 'application/json' } : {})
      }
    };

    const geminiResponse = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(geminiBody)
    });

    if (!geminiResponse.ok) {
      const err = await geminiResponse.json().catch(() => ({}));
      const errorMessage = err?.error?.message || `Erro na API Gemini: ${geminiResponse.status} ${geminiResponse.statusText}`;
      if (geminiResponse.status === 401 || geminiResponse.status === 403 || /auth|unauthorized|forbidden|api.key/i.test(errorMessage)) {
        throw new Error(
          `Erro de autenticação com a API Gemini: ${errorMessage}\n\nVerifique se sua chave de API está correta em Perfil → Configuração de IA.`
        );
      }
      throw new Error(errorMessage);
    }

    const geminiData = await geminiResponse.json();
    const content = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!content) throw new Error('Resposta vazia da API Gemini');

    if (responseSchema) {
      try {
        return JSON.parse(content);
      } catch {
        const match = content.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (match) return JSON.parse(match[1]);
        throw new Error('A IA não retornou JSON válido. Tente novamente.');
      }
    }
    return content;
  }

  // ── OpenAI-compatible API (OpenRouter, OpenAI, custom) ──────────────────────
  const messages = [
    { role: 'system', content: resolvedSystemPrompt },
    { role: 'user', content: prompt }
  ];

  const body = {
    model,
    messages,
    temperature: temperature ?? 0.8
  };

  if (responseSchema) {
    body.response_format = { type: 'json_object' };
  }

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      'HTTP-Referer': window.location.origin,
      'X-Title': 'OmniForge RPG'
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    const errorMessage = err?.error?.message || `Erro na API de IA: ${response.status} ${response.statusText}`;
    if (response.status === 401 || response.status === 403 || /auth|unauthorized|forbidden/i.test(errorMessage)) {
      throw new Error(
        `Erro de autenticação com a API de IA: ${errorMessage}\n\nVerifique se sua chave de API está correta em Perfil → Configuração de IA.`
      );
    }
    throw new Error(errorMessage);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error('Resposta vazia da API de IA');
  }

  if (responseSchema) {
    try {
      return JSON.parse(content);
    } catch {
      const match = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (match) return JSON.parse(match[1]);
      throw new Error('A IA não retornou JSON válido. Tente novamente.');
    }
  }

  return content;
}

/**
 * Chama a API do OpenRouter e retorna conteúdo + metadados de uso e custo.
 * Usa o model ID fornecido ou faz fallback para o modelo padrão da config do usuário.
 *
 * @param {object} params
 * @param {string} params.system              - Prompt de sistema
 * @param {string} params.user                - Prompt do usuário
 * @param {object} params.userAIConfig        - { apiKey, baseUrl, model }
 * @param {string} [params.model]             - Model ID opcional; se omitido usa userAIConfig.model
 * @param {number} [params.maxTokens]         - Máximo de tokens gerados (padrão: 4000)
 * @param {number} [params.temperature]       - Temperatura (padrão: 0.3)
 * @returns {Promise<{content: string, model: string, tokens_in: number, tokens_out: number, cost_usd: number, duration_ms: number}>}
 */
export async function callLLM({ system, user, userAIConfig, model, maxTokens = 4000, temperature = 0.3, agentKey, agentModels }) {
  const { apiKey: _apiKey, baseUrl: _baseUrl, model: configModel } = userAIConfig || {};
  const apiKey = (typeof _apiKey === 'string') ? _apiKey.trim() : '';

  if (!apiKey) {
    throw new Error(
      'Configure sua chave de IA no perfil antes de gerar campanhas. Acesse Perfil → Configuração de IA.'
    );
  }

  const resolvedModel = (agentKey && agentModels?.[agentKey]) || model || configModel;
  // Normalize baseUrl: trim and remove trailing slashes to avoid double-slash URLs that may cause redirects
  const resolvedBaseUrl = normalizeBaseUrl(_baseUrl) || 'https://openrouter.ai/api/v1';

  if (!resolvedModel) {
    throw new Error('Nenhum modelo especificado. Configure o modelo no perfil ou passe o parâmetro model.');
  }

  const startTime = Date.now();

  // ── Native Gemini API ───────────────────────────────────────────────────────
  if (isGeminiUrl(resolvedBaseUrl)) {
    const apiBase = geminiApiBase(resolvedBaseUrl);
    const url = `${apiBase}/models/${resolvedModel}:generateContent?key=${apiKey}`;

    const geminiBody = {
      contents: [{ role: 'user', parts: [{ text: user }] }],
      systemInstruction: { parts: [{ text: system }] },
      generationConfig: {
        temperature,
        maxOutputTokens: maxTokens
      }
    };

    const geminiResponse = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(geminiBody)
    });

    const duration_ms = Date.now() - startTime;

    if (!geminiResponse.ok) {
      const err = await geminiResponse.json().catch(() => ({}));
      const errorMessage = err?.error?.message || `Erro na API Gemini: ${geminiResponse.status} ${geminiResponse.statusText}`;
      if (geminiResponse.status === 401 || geminiResponse.status === 403 || /auth|unauthorized|forbidden|api.key/i.test(errorMessage)) {
        throw new Error(
          `Erro de autenticação com a API Gemini: ${errorMessage}\n\nVerifique se sua chave de API está correta em Perfil → Configuração de IA.`
        );
      }
      throw new Error(errorMessage);
    }

    const geminiData = await geminiResponse.json();
    const content = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!content) throw new Error('Resposta vazia da API Gemini');

    return {
      content,
      model: resolvedModel,
      tokens_in: geminiData.usageMetadata?.promptTokenCount ?? 0,
      tokens_out: geminiData.usageMetadata?.candidatesTokenCount ?? 0,
      cost_usd: getModelCost(resolvedModel, geminiData.usageMetadata?.promptTokenCount ?? 0, geminiData.usageMetadata?.candidatesTokenCount ?? 0),
      duration_ms
    };
  }

  // ── OpenAI-compatible API ───────────────────────────────────────────────────
  const body = {
    model: resolvedModel,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user }
    ],
    max_tokens: maxTokens,
    temperature
  };

  const response = await fetch(`${resolvedBaseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      'HTTP-Referer': window.location.origin,
      'X-Title': 'OmniForge RPG'
    },
    body: JSON.stringify(body)
  });

  const duration_ms = Date.now() - startTime;

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    const errorMessage = err?.error?.message || `Erro na API de IA: ${response.status} ${response.statusText}`;
    if (response.status === 401 || response.status === 403 || /auth|unauthorized|forbidden/i.test(errorMessage)) {
      throw new Error(
        `Erro de autenticação com a API de IA: ${errorMessage}\n\nVerifique se sua chave de API está correta em Perfil → Configuração de IA.`
      );
    }
    throw new Error(errorMessage);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error('Resposta vazia da API de IA');
  }

  const tokens_in = data.usage?.prompt_tokens ?? 0;
  const tokens_out = data.usage?.completion_tokens ?? 0;
  const cost_usd = getModelCost(resolvedModel, tokens_in, tokens_out);

  return {
    content,
    model: resolvedModel,
    tokens_in,
    tokens_out,
    cost_usd,
    duration_ms
  };
}
