"""
OmniForge RPG — Model Registry
Catálogo de modelos OpenRouter com metadados de custo e contexto.
Deve estar sincronizado com AVAILABLE_MODELS em src/lib/model-config.ts.
"""

from __future__ import annotations

from typing import TypedDict


class ModelInfo(TypedDict):
    name: str
    input_cost: float   # USD por 1 milhão de tokens de entrada
    output_cost: float  # USD por 1 milhão de tokens de saída
    context_window: int  # tokens


# ---------------------------------------------------------------------------
# MODEL_REGISTRY
# Chave: OpenRouter model ID (formato "provider/model-name" ou
#        "provider/model-name:free" para modelos gratuitos).
# ---------------------------------------------------------------------------

MODEL_REGISTRY: dict[str, ModelInfo] = {

    # ── Anthropic ──────────────────────────────────────────────────────────
    "anthropic/claude-3-5-sonnet": ModelInfo(
        name="Claude 3.5 Sonnet",
        input_cost=3.0,
        output_cost=15.0,
        context_window=200_000,
    ),
    "anthropic/claude-3-5-haiku": ModelInfo(
        name="Claude 3.5 Haiku",
        input_cost=0.8,
        output_cost=4.0,
        context_window=200_000,
    ),
    "anthropic/claude-3-opus": ModelInfo(
        name="Claude 3 Opus",
        input_cost=15.0,
        output_cost=75.0,
        context_window=200_000,
    ),
    "anthropic/claude-3-haiku:free": ModelInfo(
        name="Claude 3 Haiku (Free)",
        input_cost=0.0,
        output_cost=0.0,
        context_window=200_000,
    ),

    # ── Google ─────────────────────────────────────────────────────────────
    "google/gemini-2.5-pro-preview-03-25": ModelInfo(
        name="Gemini 2.5 Pro Preview",
        input_cost=1.25,
        output_cost=10.0,
        context_window=1_048_576,
    ),
    "google/gemini-2.0-flash": ModelInfo(
        name="Gemini 2.0 Flash",
        input_cost=0.1,
        output_cost=0.4,
        context_window=1_048_576,
    ),
    "google/gemini-2.0-flash-lite": ModelInfo(
        name="Gemini 2.0 Flash Lite",
        input_cost=0.075,
        output_cost=0.3,
        context_window=1_048_576,
    ),
    "google/gemini-flash-1.5:free": ModelInfo(
        name="Gemini 1.5 Flash (Free)",
        input_cost=0.0,
        output_cost=0.0,
        context_window=1_000_000,
    ),

    # ── OpenAI ─────────────────────────────────────────────────────────────
    "openai/gpt-4o": ModelInfo(
        name="GPT-4o",
        input_cost=2.5,
        output_cost=10.0,
        context_window=128_000,
    ),
    "openai/gpt-4o-mini": ModelInfo(
        name="GPT-4o Mini",
        input_cost=0.15,
        output_cost=0.6,
        context_window=128_000,
    ),
    "openai/o3-mini": ModelInfo(
        name="o3-mini",
        input_cost=1.1,
        output_cost=4.4,
        context_window=128_000,
    ),
    "openai/o4-mini": ModelInfo(
        name="o4-mini",
        input_cost=1.1,
        output_cost=4.4,
        context_window=128_000,
    ),
    "openai/gpt-3.5-turbo": ModelInfo(
        name="GPT-3.5 Turbo",
        input_cost=0.5,
        output_cost=1.5,
        context_window=16_385,
    ),

    # ── DeepSeek ───────────────────────────────────────────────────────────
    "deepseek/deepseek-chat": ModelInfo(
        name="DeepSeek Chat (V3)",
        input_cost=0.27,
        output_cost=1.1,
        context_window=64_000,
    ),
    "deepseek/deepseek-r1": ModelInfo(
        name="DeepSeek R1",
        input_cost=0.55,
        output_cost=2.19,
        context_window=64_000,
    ),
    "deepseek/deepseek-chat:free": ModelInfo(
        name="DeepSeek Chat (Free)",
        input_cost=0.0,
        output_cost=0.0,
        context_window=64_000,
    ),
    "deepseek/deepseek-r1:free": ModelInfo(
        name="DeepSeek R1 (Free)",
        input_cost=0.0,
        output_cost=0.0,
        context_window=64_000,
    ),

    # ── Meta ───────────────────────────────────────────────────────────────
    "meta-llama/llama-3.1-405b-instruct": ModelInfo(
        name="Llama 3.1 405B Instruct",
        input_cost=2.7,
        output_cost=2.7,
        context_window=131_072,
    ),
    "meta-llama/llama-3.3-70b-instruct": ModelInfo(
        name="Llama 3.3 70B Instruct",
        input_cost=0.12,
        output_cost=0.3,
        context_window=131_072,
    ),
    "meta-llama/llama-3.1-8b-instruct:free": ModelInfo(
        name="Llama 3.1 8B Instruct (Free)",
        input_cost=0.0,
        output_cost=0.0,
        context_window=131_072,
    ),

    # ── Mistral ────────────────────────────────────────────────────────────
    "mistralai/mistral-large-2411": ModelInfo(
        name="Mistral Large (Nov 2024)",
        input_cost=2.0,
        output_cost=6.0,
        context_window=131_000,
    ),
    "mistralai/mistral-small-3.1-24b-instruct": ModelInfo(
        name="Mistral Small 3.1 24B",
        input_cost=0.1,
        output_cost=0.3,
        context_window=131_000,
    ),
    "mistralai/mistral-7b-instruct:free": ModelInfo(
        name="Mistral 7B Instruct (Free)",
        input_cost=0.0,
        output_cost=0.0,
        context_window=32_768,
    ),

    # ── Qwen ───────────────────────────────────────────────────────────────
    "qwen/qwen-2.5-72b-instruct": ModelInfo(
        name="Qwen 2.5 72B Instruct",
        input_cost=0.13,
        output_cost=0.4,
        context_window=131_072,
    ),
    "qwen/qwen-2-7b-instruct:free": ModelInfo(
        name="Qwen 2 7B Instruct (Free)",
        input_cost=0.0,
        output_cost=0.0,
        context_window=131_072,
    ),

    # ── xAI ────────────────────────────────────────────────────────────────
    "x-ai/grok-3": ModelInfo(
        name="Grok 3",
        input_cost=3.0,
        output_cost=15.0,
        context_window=131_072,
    ),
    "x-ai/grok-3-mini": ModelInfo(
        name="Grok 3 Mini",
        input_cost=0.3,
        output_cost=0.5,
        context_window=131_072,
    ),

    # ── Cohere ─────────────────────────────────────────────────────────────
    "cohere/command-r-plus": ModelInfo(
        name="Command R+",
        input_cost=2.5,
        output_cost=10.0,
        context_window=128_000,
    ),
    "cohere/command-r": ModelInfo(
        name="Command R",
        input_cost=0.15,
        output_cost=0.6,
        context_window=128_000,
    ),

    # ── Microsoft ──────────────────────────────────────────────────────────
    "microsoft/phi-4": ModelInfo(
        name="Phi-4",
        input_cost=0.07,
        output_cost=0.14,
        context_window=16_384,
    ),
    "microsoft/phi-3-medium-128k-instruct:free": ModelInfo(
        name="Phi-3 Medium 128K (Free)",
        input_cost=0.0,
        output_cost=0.0,
        context_window=128_000,
    ),

    # ── Arcee AI ──────────────────────────────────────────────────────────
    "arcee-ai/arcee-blitz": ModelInfo(
        name="Arcee Blitz",
        input_cost=0.05,
        output_cost=0.10,
        context_window=32_768,
    ),
    "arcee-ai/arcee-caller": ModelInfo(
        name="Arcee Caller",
        input_cost=0.03,
        output_cost=0.05,
        context_window=32_768,
    ),

    # ── NVIDIA (extras) ──────────────────────────────────────────────────
    "nvidia/llama-3.1-nemotron-ultra-253b-v1:free": ModelInfo(
        name="Nemotron Ultra 253B (Free)",
        input_cost=0.0,
        output_cost=0.0,
        context_window=131_072,
    ),

    # ── Google (extras) ──────────────────────────────────────────────────
    "google/gemini-2.5-flash-preview:thinking": ModelInfo(
        name="Gemini 2.5 Flash Thinking",
        input_cost=0.15,
        output_cost=0.60,
        context_window=1_048_576,
    ),

    # ── Amazon ───────────────────────────────────────────────────────────
    "amazon/nova-pro-v1": ModelInfo(
        name="Amazon Nova Pro",
        input_cost=0.80,
        output_cost=3.20,
        context_window=300_000,
    ),
    "amazon/nova-lite-v1": ModelInfo(
        name="Amazon Nova Lite",
        input_cost=0.06,
        output_cost=0.24,
        context_window=300_000,
    ),

    # ── MiniMax ──────────────────────────────────────────────────────────
    "minimax/minimax-01": ModelInfo(
        name="MiniMax-01",
        input_cost=0.40,
        output_cost=1.10,
        context_window=1_048_576,
    ),

    # ── Nous Research ────────────────────────────────────────────────────
    "nousresearch/hermes-3-llama-3.1-405b": ModelInfo(
        name="Hermes 3 405B",
        input_cost=0.80,
        output_cost=0.80,
        context_window=131_072,
    ),

    # ── OpenRouter ───────────────────────────────────────────────────────
    "openrouter/auto": ModelInfo(
        name="OpenRouter Auto",
        input_cost=0.0,
        output_cost=0.0,
        context_window=200_000,
    ),
    "openrouter/optimus": ModelInfo(
        name="OpenRouter Optimus",
        input_cost=0.0,
        output_cost=0.0,
        context_window=200_000,
    ),

    # ── Free Models (extras) ────────────────────────────────────────────
    "meta-llama/llama-3.3-70b-instruct:free": ModelInfo(
        name="Llama 3.3 70B (Free)",
        input_cost=0.0,
        output_cost=0.0,
        context_window=131_072,
    ),
    "meta-llama/llama-4-maverick:free": ModelInfo(
        name="Llama 4 Maverick (Free)",
        input_cost=0.0,
        output_cost=0.0,
        context_window=1_048_576,
    ),
    "qwen/qwen-2.5-72b-instruct:free": ModelInfo(
        name="Qwen 2.5 72B (Free)",
        input_cost=0.0,
        output_cost=0.0,
        context_window=131_072,
    ),
    "google/gemma-3-27b-it:free": ModelInfo(
        name="Gemma 3 27B (Free)",
        input_cost=0.0,
        output_cost=0.0,
        context_window=131_072,
    ),
}


def get_model_cost(model: str, tokens_in: int, tokens_out: int) -> float:
    """
    Calcula o custo real de uma chamada ao modelo.

    Args:
        model: OpenRouter model ID (ex: "openai/gpt-4o").
        tokens_in: Número de tokens de entrada consumidos.
        tokens_out: Número de tokens de saída gerados.

    Returns:
        Custo total em USD. Retorna 0.0 se o modelo não estiver no registro.
    """
    info = MODEL_REGISTRY.get(model)
    if info is None:
        return 0.0
    cost = (tokens_in * info["input_cost"] + tokens_out * info["output_cost"]) / 1_000_000
    return round(cost, 8)
