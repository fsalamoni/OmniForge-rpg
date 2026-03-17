/**
 * Universal AI client - supports any OpenAI-compatible API
 * (OpenRouter, OpenAI, Gemini OpenAI-compat, Together AI, etc.)
 */

export const AI_PRESETS = {
  openrouter: {
    label: 'OpenRouter (todos os modelos)',
    baseUrl: 'https://openrouter.ai/api/v1',
    modelPlaceholder: 'openai/gpt-4o',
    docsUrl: 'https://openrouter.ai/keys'
  },
  openai: {
    label: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    modelPlaceholder: 'gpt-4o',
    docsUrl: 'https://platform.openai.com/api-keys'
  },
  gemini: {
    label: 'Google Gemini',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
    modelPlaceholder: 'gemini-2.0-flash',
    docsUrl: 'https://aistudio.google.com/app/apikey'
  },
  custom: {
    label: 'Custom (URL própria)',
    baseUrl: '',
    modelPlaceholder: 'model-name',
    docsUrl: null
  }
};

/**
 * @param {object} params
 * @param {string} params.prompt                  - The user prompt to send
 * @param {object} [params.responseSchema]         - Optional JSON schema for structured output
 * @param {object} params.userAIConfig             - { apiKey, baseUrl, model }
 * @param {string} [params.systemPrompt]           - Override default system prompt
 * @param {number} [params.temperature]            - Override default temperature (0–2)
 * @returns {Promise<object|string>} Parsed JSON if responseSchema provided, string otherwise
 */
export async function invokeLLM({ prompt, responseSchema, userAIConfig, systemPrompt, temperature }) {
  const { apiKey, baseUrl, model } = userAIConfig || {};

  if (!apiKey || !baseUrl || !model) {
    throw new Error(
      'Configure sua chave de IA no perfil antes de gerar campanhas. Acesse Perfil → Configuração de IA.'
    );
  }

  // Default system prompt falls back based on whether a schema is expected
  const resolvedSystemPrompt = systemPrompt ?? (
    responseSchema
      ? 'Você é um assistente especialista em RPG. Responda SEMPRE em JSON válido conforme o schema solicitado. Não adicione texto fora do JSON.'
      : 'Você é um assistente especialista em RPG.'
  );

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
    throw new Error(
      err?.error?.message || `Erro na API de IA: ${response.status} ${response.statusText}`
    );
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
      // Try to extract JSON from markdown code blocks
      const match = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (match) return JSON.parse(match[1]);
      throw new Error('A IA não retornou JSON válido. Tente novamente.');
    }
  }

  return content;
}
