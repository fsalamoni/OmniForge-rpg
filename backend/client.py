"""
OmniForge RPG — LLM Client (OpenRouter)
Envia prompts para a API do OpenRouter e retorna conteúdo + metadados de uso.
"""

from __future__ import annotations

import os
import time
from typing import Any

import httpx

from model_registry import get_model_cost

# ---------------------------------------------------------------------------
# Configuração
# ---------------------------------------------------------------------------

OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"
OPENROUTER_API_KEY = os.environ.get("OPENROUTER_API_KEY", "")

# Modelo padrão global (pode ser sobrescrito via argumento ou variável de ambiente)
DEFAULT_MODEL = os.environ.get("MODEL_MAIN", "openai/gpt-4o")


# ---------------------------------------------------------------------------
# Tipos de retorno
# ---------------------------------------------------------------------------

class LLMResult(dict):
    """
    Dicionário com os campos:
        content (str): texto gerado
        model (str): model ID utilizado
        tokens_in (int): tokens de entrada
        tokens_out (int): tokens de saída
        cost_usd (float): custo estimado em USD
        duration_ms (int): duração da chamada em milissegundos
    """


# ---------------------------------------------------------------------------
# Função principal
# ---------------------------------------------------------------------------

def call_llm(
    system: str,
    user: str,
    model: str | None = None,
    max_tokens: int = 4000,
    temperature: float = 0.3,
) -> LLMResult:
    """
    Envia uma mensagem ao OpenRouter e retorna o resultado com metadados.

    Args:
        system: Prompt de sistema (contexto/papel da IA).
        user: Prompt do usuário (tarefa a executar).
        model: OpenRouter model ID. Se None, usa DEFAULT_MODEL.
        max_tokens: Máximo de tokens gerados na resposta.
        temperature: Temperatura de amostragem (0.0–2.0).

    Returns:
        LLMResult com content, model, tokens_in, tokens_out, cost_usd,
        duration_ms.

    Raises:
        ValueError: Quando a chave de API não está configurada.
        httpx.HTTPStatusError: Quando a API retorna um erro HTTP.
    """
    if not OPENROUTER_API_KEY:
        raise ValueError(
            "OPENROUTER_API_KEY não configurada. "
            "Defina a variável de ambiente antes de chamar call_llm()."
        )

    resolved_model = model or DEFAULT_MODEL

    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
        "X-Title": "OmniForge RPG",
    }

    payload: dict[str, Any] = {
        "model": resolved_model,
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
        "max_tokens": max_tokens,
        "temperature": temperature,
    }

    start_ms = time.monotonic()

    with httpx.Client(timeout=120) as client:
        response = client.post(OPENROUTER_API_URL, json=payload, headers=headers)
        response.raise_for_status()

    duration_ms = int((time.monotonic() - start_ms) * 1000)

    data = response.json()
    choice = data["choices"][0]
    content: str = choice["message"]["content"]

    usage = data.get("usage", {})
    tokens_in: int = usage.get("prompt_tokens", 0)
    tokens_out: int = usage.get("completion_tokens", 0)

    cost_usd = get_model_cost(resolved_model, tokens_in, tokens_out)

    return LLMResult(
        content=content,
        model=resolved_model,
        tokens_in=tokens_in,
        tokens_out=tokens_out,
        cost_usd=cost_usd,
        duration_ms=duration_ms,
    )
