/**
 * OmniForge RPG — Configurações dos Agentes de IA
 *
 * Cada agente define o comportamento de uma IA específica no app.
 * Os prompts padrão podem ser sobrescritos pelo admin no painel Admin → Agentes de IA.
 * As substituições ficam salvas na coleção `aiAgents` do Firestore.
 *
 * Variáveis nos templates: use {{nome_da_variavel}}
 */

// ─── IDs dos Agentes ──────────────────────────────────────────────────────────

export const AGENT_IDS = {
  QUESTION_WHAT:        'question-what',
  QUESTION_WHY:         'question-why',
  QUESTION_WHERE:       'question-where',
  QUESTION_WHEN:        'question-when',
  QUESTION_WHO:         'question-who',
  QUESTION_HOW:         'question-how',
  QUESTION_HOW_MUCH:    'question-how-much',
  CAMPAIGN_GENERATOR:   'campaign-generator',
  NPC_GENERATOR:        'npc-generator'
};

// Mapeia chave da pergunta → ID do agente
export const QUESTION_KEY_TO_AGENT = {
  what:     AGENT_IDS.QUESTION_WHAT,
  why:      AGENT_IDS.QUESTION_WHY,
  where:    AGENT_IDS.QUESTION_WHERE,
  when:     AGENT_IDS.QUESTION_WHEN,
  who:      AGENT_IDS.QUESTION_WHO,
  how:      AGENT_IDS.QUESTION_HOW,
  how_much: AGENT_IDS.QUESTION_HOW_MUCH
};

// ─── Função: Build de Prompt ──────────────────────────────────────────────────

/**
 * Substitui {{variavel}} no template pelos valores fornecidos.
 * @param {string} template
 * @param {Record<string, string|number>} variables
 * @returns {string}
 */
export function buildPrompt(template, variables) {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    const val = variables[key];
    return val !== undefined && val !== null ? String(val) : match;
  });
}

// ─── Definições Padrão dos Agentes ────────────────────────────────────────────

export const DEFAULT_AGENTS = {

  // ─ Respondedor: O Quê? ────────────────────────────────────────────────────
  [AGENT_IDS.QUESTION_WHAT]: {
    name: 'Respondedor: O Quê? (Conflito)',
    description: 'Gera sugestão para o conflito principal da aventura (pergunta "O Quê?" do 5W2H).',
    systemPrompt: `Você é um mestre de RPG experiente e criativo, especialista em construção de narrativas épicas e envolventes. Sua tarefa é sugerir conflitos principais para campanhas de RPG de mesa. Responda SEMPRE em JSON válido, sem texto adicional fora do JSON.`,
    promptTemplate: `Crie um conflito principal interessante para uma campanha de RPG com as seguintes características:

Sistema: {{system}}
Ambientação: {{setting}}
Duração prevista: {{duration}}
Número de jogadores: {{players}}
Título da campanha: "{{title}}"

{{#previous_answers}}
Contexto já definido:
{{previous_answers}}
{{/previous_answers}}

Crie um CONFLITO PRINCIPAL que:
- Seja adequado ao sistema {{system}} e à ambientação {{setting}}
- Seja escalável para {{players}} jogadores
- Tenha stakes claros (o que pode ser perdido/ganho)
- Seja original e memorável
- Tenha entre 2 e 4 frases descritivas

Responda em JSON: {"answer": "descrição do conflito aqui"}`,
    variables: [
      { key: 'system', description: 'Sistema de RPG (ex: D&D 5e)' },
      { key: 'setting', description: 'Ambientação (ex: Fantasia Medieval)' },
      { key: 'duration', description: 'Duração da campanha (ex: One-shot)' },
      { key: 'players', description: 'Número de jogadores' },
      { key: 'title', description: 'Título da campanha' },
      { key: 'previous_answers', description: 'Respostas anteriores do 5W2H (para contexto)' }
    ],
    temperature: 0.9
  },

  // ─ Respondedor: Por Quê? ──────────────────────────────────────────────────
  [AGENT_IDS.QUESTION_WHY]: {
    name: 'Respondedor: Por Quê? (Motivação)',
    description: 'Gera sugestão para a motivação dos antagonistas/forças da aventura (pergunta "Por Quê?" do 5W2H).',
    systemPrompt: `Você é um mestre de RPG especialista em criação de antagonistas e motivações narrativas complexas. Crie motivações ricas e multidimensionais para vilões e forças opostas em campanhas de RPG. Responda SEMPRE em JSON válido.`,
    promptTemplate: `Crie a motivação central dos antagonistas/forças opostas para esta campanha de RPG:

Sistema: {{system}}
Ambientação: {{setting}}
Duração: {{duration}}
Jogadores: {{players}}
Título: "{{title}}"

Contexto já definido:
{{previous_answers}}

Crie uma MOTIVAÇÃO que:
- Seja compreensível (até mesmo simpática em certa medida)
- Revele a lógica interna do antagonista
- Crie conflito moral interessante
- Seja coerente com a ambientação {{setting}}
- Tenha entre 2 e 4 frases

Responda em JSON: {"answer": "motivação dos antagonistas aqui"}`,
    variables: [
      { key: 'system', description: 'Sistema de RPG' },
      { key: 'setting', description: 'Ambientação' },
      { key: 'duration', description: 'Duração' },
      { key: 'players', description: 'Número de jogadores' },
      { key: 'title', description: 'Título' },
      { key: 'previous_answers', description: 'Respostas anteriores do 5W2H' }
    ],
    temperature: 0.85
  },

  // ─ Respondedor: Onde? ─────────────────────────────────────────────────────
  [AGENT_IDS.QUESTION_WHERE]: {
    name: 'Respondedor: Onde? (Localização)',
    description: 'Gera sugestão de localização/cenário inicial da aventura (pergunta "Onde?" do 5W2H).',
    systemPrompt: `Você é um mestre de RPG especialista em worldbuilding e construção de cenários imersivos. Crie localizações detalhadas e evocativas para aventuras de RPG que estimulem a imaginação dos jogadores. Responda SEMPRE em JSON válido.`,
    promptTemplate: `Crie o local de início desta campanha de RPG:

Sistema: {{system}}
Ambientação: {{setting}}
Duração: {{duration}}
Jogadores: {{players}}
Título: "{{title}}"

Contexto já definido:
{{previous_answers}}

Descreva uma LOCALIZAÇÃO que:
- Se encaixe perfeitamente na ambientação {{setting}}
- Tenha atmosfera e identidade própria
- Ofereça possibilidades de exploração e interação
- Situe o tom da aventura (perigoso, misterioso, civilizado, etc.)
- Tenha entre 2 e 4 frases descritivas e evocativas

Responda em JSON: {"answer": "descrição do local de início aqui"}`,
    variables: [
      { key: 'system', description: 'Sistema de RPG' },
      { key: 'setting', description: 'Ambientação' },
      { key: 'duration', description: 'Duração' },
      { key: 'players', description: 'Número de jogadores' },
      { key: 'title', description: 'Título' },
      { key: 'previous_answers', description: 'Respostas anteriores do 5W2H' }
    ],
    temperature: 0.9
  },

  // ─ Respondedor: Quando? ───────────────────────────────────────────────────
  [AGENT_IDS.QUESTION_WHEN]: {
    name: 'Respondedor: Quando? (Período/Contexto Temporal)',
    description: 'Gera sugestão para o período/contexto temporal da aventura (pergunta "Quando?" do 5W2H).',
    systemPrompt: `Você é um mestre de RPG especialista em contextualização temporal de narrativas. Crie contextos temporais que adicionem urgência, significado e profundidade às campanhas de RPG. Responda SEMPRE em JSON válido.`,
    promptTemplate: `Defina o contexto temporal desta campanha de RPG:

Sistema: {{system}}
Ambientação: {{setting}}
Duração: {{duration}}
Jogadores: {{players}}
Título: "{{title}}"

Contexto já definido:
{{previous_answers}}

Crie um CONTEXTO TEMPORAL que:
- Adicione urgência ou significado especial ao momento da aventura
- Possa envolver eventos históricos, ciclos naturais, crises, festividades ou eras específicas
- Seja relevante para o conflito e motivação já estabelecidos
- Crie sensação de momento único e irrepetível
- Tenha entre 2 e 3 frases

Responda em JSON: {"answer": "contexto temporal aqui"}`,
    variables: [
      { key: 'system', description: 'Sistema de RPG' },
      { key: 'setting', description: 'Ambientação' },
      { key: 'duration', description: 'Duração' },
      { key: 'players', description: 'Número de jogadores' },
      { key: 'title', description: 'Título' },
      { key: 'previous_answers', description: 'Respostas anteriores do 5W2H' }
    ],
    temperature: 0.85
  },

  // ─ Respondedor: Quem? ─────────────────────────────────────────────────────
  [AGENT_IDS.QUESTION_WHO]: {
    name: 'Respondedor: Quem? (Personagens Centrais)',
    description: 'Gera sugestão de personagens centrais (antagonistas, aliados, neutros) da aventura (pergunta "Quem?" do 5W2H).',
    systemPrompt: `Você é um mestre de RPG especialista em criação de personagens memoráveis e complexos para campanhas de RPG. Crie NPCs que sejam funcionais para a trama e ao mesmo tempo inesquecíveis para os jogadores. Responda SEMPRE em JSON válido.`,
    promptTemplate: `Crie os personagens centrais desta campanha de RPG:

Sistema: {{system}}
Ambientação: {{setting}}
Duração: {{duration}}
Jogadores: {{players}}
Título: "{{title}}"

Contexto já definido:
{{previous_answers}}

Crie uma galeria de PERSONAGENS CENTRAIS que inclua:
- 1-2 antagonistas (quem ou o quê os jogadores devem enfrentar)
- 1-2 aliados potenciais (quem pode ajudar os jogadores)
- 1 figura neutra ou ambígua (que pode ser aliado ou inimigo)

Para cada personagem, mencione nome e papel brevemente. Seja específico ao sistema {{system}}.

Responda em JSON: {"answer": "descrição dos personagens centrais aqui"}`,
    variables: [
      { key: 'system', description: 'Sistema de RPG' },
      { key: 'setting', description: 'Ambientação' },
      { key: 'duration', description: 'Duração' },
      { key: 'players', description: 'Número de jogadores' },
      { key: 'title', description: 'Título' },
      { key: 'previous_answers', description: 'Respostas anteriores do 5W2H' }
    ],
    temperature: 0.9
  },

  // ─ Respondedor: Como? ─────────────────────────────────────────────────────
  [AGENT_IDS.QUESTION_HOW]: {
    name: 'Respondedor: Como? (Envolvimento dos Jogadores)',
    description: 'Gera sugestão de como os personagens jogadores se envolvem na aventura (pergunta "Como?" do 5W2H).',
    systemPrompt: `Você é um mestre de RPG especialista em hooks narrativos e ganchos de engajamento. Crie ganchos de envolvimento orgânicos que conectem os personagens dos jogadores à trama de forma natural e motivadora. Responda SEMPRE em JSON válido.`,
    promptTemplate: `Defina como os personagens jogadores se envolvem nesta campanha de RPG:

Sistema: {{system}}
Ambientação: {{setting}}
Duração: {{duration}}
Jogadores: {{players}}
Título: "{{title}}"

Contexto já definido:
{{previous_answers}}

Crie um GANCHO DE ENVOLVIMENTO que:
- Conecte os PJs à situação de forma orgânica e natural
- Dê motivação clara para os {{players}} jogadores se envolverem
- Seja adequado a diferentes tipos de personagem (seja inclusivo)
- Crie senso de urgência ou curiosidade imediata
- Tenha entre 2 e 4 frases

Responda em JSON: {"answer": "como os jogadores se envolvem aqui"}`,
    variables: [
      { key: 'system', description: 'Sistema de RPG' },
      { key: 'setting', description: 'Ambientação' },
      { key: 'duration', description: 'Duração' },
      { key: 'players', description: 'Número de jogadores' },
      { key: 'title', description: 'Título' },
      { key: 'previous_answers', description: 'Respostas anteriores do 5W2H' }
    ],
    temperature: 0.85
  },

  // ─ Respondedor: Quanto? ───────────────────────────────────────────────────
  [AGENT_IDS.QUESTION_HOW_MUCH]: {
    name: 'Respondedor: Quanto? (Intensidade e Stakes)',
    description: 'Gera sugestão para o nível de intensidade, letalidade e complexidade da aventura (pergunta "Quanto?" do 5W2H).',
    systemPrompt: `Você é um mestre de RPG especialista em calibração de desafios e equilíbrio de campanhas. Crie definições de intensidade que correspondam ao estilo de jogo desejado e às capacidades do grupo. Responda SEMPRE em JSON válido.`,
    promptTemplate: `Defina a intensidade e stakes desta campanha de RPG:

Sistema: {{system}}
Ambientação: {{setting}}
Duração: {{duration}}
Jogadores: {{players}}
Título: "{{title}}"

Contexto já definido:
{{previous_answers}}

Defina a INTENSIDADE que inclua:
- Nível de letalidade (baixo/médio/alto)
- Complexidade da trama (simples/moderada/complexa com múltiplas facções)
- Tipo de desafios predominantes (combate, investigação, social, exploração)
- Ritmo esperado das sessões
- Tenha entre 2 e 4 frases

Responda em JSON: {"answer": "intensidade e stakes aqui"}`,
    variables: [
      { key: 'system', description: 'Sistema de RPG' },
      { key: 'setting', description: 'Ambientação' },
      { key: 'duration', description: 'Duração' },
      { key: 'players', description: 'Número de jogadores' },
      { key: 'title', description: 'Título' },
      { key: 'previous_answers', description: 'Respostas anteriores do 5W2H' }
    ],
    temperature: 0.8
  },

  // ─ Gerador de Campanha Completa ───────────────────────────────────────────
  [AGENT_IDS.CAMPAIGN_GENERATOR]: {
    name: 'Gerador de Campanha Completa',
    description: 'Gera a campanha completa (resumo, ganchos, NPCs, encontros) a partir das respostas 5W2H.',
    systemPrompt: `Você é um mestre de RPG de alto nível, especialista em criar campanhas completas, balanceadas e inesquecíveis para qualquer sistema de RPG de mesa. Você conhece profundamente os sistemas mais populares (D&D, Pathfinder, Call of Cthulhu, Vampire, Ordem Paranormal, Tormenta20, etc.) e sabe criar conteúdo adaptado a cada um. Responda SEMPRE em JSON válido e estruturado, sem nenhum texto fora do JSON.`,
    promptTemplate: `Crie uma campanha de RPG COMPLETA com base nestas informações:

SISTEMA: {{system}}
AMBIENTAÇÃO: {{setting}}
DURAÇÃO: {{duration}}
JOGADORES: {{players}}

RESPOSTAS DO PLANEJAMENTO (5W2H):
{{answers}}

NÍVEL DE CRIATIVIDADE {{creativity_level}}/5: {{creativity_instructions}}

Crie uma campanha completa em português do Brasil com:
1. Um resumo narrativo envolvente e detalhado (4-6 parágrafos)
2. 3 a 5 ganchos de aventura específicos e interessantes
3. 3 a 5 NPCs importantes com personalidade definida
4. 3 a 5 encontros balanceados para {{players}} jogadores no sistema {{system}}

Para os encontros, considere as mecânicas específicas do sistema {{system}} ao definir dificuldade e criaturas.
Para os NPCs, crie personagens tridimensionais com motivações claras.

Responda em JSON com a seguinte estrutura EXATA:
{
  "adventure_summary": "Resumo narrativo completo da aventura com 4-6 parágrafos",
  "plot_hooks": ["gancho 1", "gancho 2", "gancho 3"],
  "npcs": [
    {
      "name": "Nome do NPC",
      "role": "Papel na história (ex: Vilão Principal, Aliado, Informante)",
      "motivation": "O que motiva este personagem",
      "description": "Descrição física, personalidade e história breve"
    }
  ],
  "encounters": [
    {
      "name": "Nome do encontro",
      "difficulty": "Fácil|Médio|Difícil|Mortal",
      "description": "Descrição detalhada do encontro e contexto narrativo",
      "creatures": [{"name": "Nome da criatura/inimigo", "quantity": 2}],
      "tactics": "Táticas e comportamento dos inimigos em combate"
    }
  ]
}`,
    variables: [
      { key: 'system', description: 'Sistema de RPG' },
      { key: 'setting', description: 'Ambientação' },
      { key: 'duration', description: 'Duração da campanha' },
      { key: 'players', description: 'Número de jogadores' },
      { key: 'answers', description: 'Todas as respostas 5W2H formatadas' },
      { key: 'creativity_level', description: 'Nível de criatividade (0-5)' },
      { key: 'creativity_instructions', description: 'Instrução textual do nível de criatividade' }
    ],
    temperature: 0.8
  },

  // ─ Gerador de NPC Individual ──────────────────────────────────────────────
  [AGENT_IDS.NPC_GENERATOR]: {
    name: 'Gerador de NPC Individual',
    description: 'Gera um NPC/criatura/aliado/vilão completo e memorável para uma campanha.',
    systemPrompt: `Você é um mestre de RPG especialista em criação de personagens secundários (NPCs) ricos, complexos e memoráveis. Você domina as mecânicas de múltiplos sistemas de RPG e sabe criar fichas de personagens adaptadas a cada sistema. Responda SEMPRE em JSON válido.`,
    promptTemplate: `Crie um {{type}} completo e memorável para esta campanha de RPG:

SISTEMA: {{system}}
AMBIENTAÇÃO: {{setting}}
{{#instructions}}
INSTRUÇÕES ESPECÍFICAS: {{instructions}}
{{/instructions}}

O personagem deve ser:
- Completamente adequado ao sistema {{system}} e à ambientação {{setting}}
- Memorable e com personalidade distinta
- Funcional para uso em sessão (com atributos relevantes)
- Com motivações claras e coerentes

Para os ATRIBUTOS (campo "stats"), use os atributos e valores típicos do sistema {{system}}. Inclua pelo menos os atributos principais do sistema.

Responda em JSON:
{
  "name": "Nome completo do personagem",
  "role": "Papel/função na história (ex: Guarda da cidade, Mercador suspeito, Cultista fanático)",
  "motivation": "O que motiva este personagem em 1-2 frases",
  "description": "Descrição física detalhada + personalidade + background em 3-4 frases",
  "stats": {
    "atributo1": valor,
    "atributo2": valor,
    "PV": valor,
    "CA": valor
  }
}`,
    variables: [
      { key: 'type', description: 'Tipo de personagem (NPC, Aliado, Vilão, Monstro)' },
      { key: 'system', description: 'Sistema de RPG' },
      { key: 'setting', description: 'Ambientação' },
      { key: 'instructions', description: 'Instruções específicas do usuário (opcional)' }
    ],
    temperature: 0.9
  }
};

// ─── Funções Auxiliares ───────────────────────────────────────────────────────

/**
 * Mescla configuração padrão com override do Firestore.
 * @param {string} agentId
 * @param {Record<string, object>} firestoreOverrides - { [agentId]: { systemPrompt?, promptTemplate?, temperature? } }
 * @returns {{ systemPrompt: string, promptTemplate: string, temperature: number, name: string, description: string, variables: array }}
 */
export function getAgentConfig(agentId, firestoreOverrides = {}) {
  const defaults = DEFAULT_AGENTS[agentId];
  if (!defaults) {
    throw new Error(`Agente de IA desconhecido: ${agentId}`);
  }
  const override = firestoreOverrides[agentId] || {};
  return {
    ...defaults,
    systemPrompt: override.systemPrompt ?? defaults.systemPrompt,
    promptTemplate: override.promptTemplate ?? defaults.promptTemplate,
    temperature: override.temperature ?? defaults.temperature
  };
}
