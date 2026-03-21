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
  QUESTION_WHAT:          'question-what',
  QUESTION_WHY:           'question-why',
  QUESTION_WHERE:         'question-where',
  QUESTION_WHEN:          'question-when',
  QUESTION_WHO:           'question-who',
  QUESTION_HOW:           'question-how',
  QUESTION_HOW_MUCH:      'question-how-much',
  CAMPAIGN_GENERATOR:     'campaign-generator',
  NPC_GENERATOR:          'npc-generator',
  ENCOUNTER_GENERATOR:    'encounter-generator',
  ARC_GENERATOR:          'arc-generator',
  HOOKS_GENERATOR:        'hooks-generator',
  NPC_EXTRACTOR:          'npc-extractor',
  NPC_INTERACTION:        'npc-interaction',
  CONSEQUENCE_GENERATOR:  'consequence-generator',
  AI_EXPANDER:            'ai-expander',
  MANAGEMENT_GENERATOR:   'management-generator'
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
  },

  // ─ Gerador de Arco Narrativo ──────────────────────────────────────────────
  [AGENT_IDS.ARC_GENERATOR]: {
    name: 'Gerador de Arco Narrativo',
    description: 'Gera um arco narrativo completo com atos e cenas detalhadas para uma campanha.',
    systemPrompt: `Você é um mestre de RPG especialista em estrutura narrativa épica. Crie arcos de campanha com atos bem definidos e cenas imersivas, adaptados ao sistema e ambientação fornecidos. Responda SEMPRE em JSON válido.`,
    promptTemplate: `TAREFA: Criar arco de RPG completo com {{num_acts}} atos, cada ato com {{scenes_per_act}} cenas.

INFORMAÇÕES DO ARCO:
Nome: {{arc_name}}
Tipo de Missão: {{mission_type}}
Sistema: {{system_rpg}}
Ambientação: {{setting}}

CONTEXTO DA CAMPANHA:
{{description}}

CONTEXTO 5W2H:
{{answers_5w2h}}

{{#custom_instructions}}
INSTRUÇÕES ESPECÍFICAS:
{{custom_instructions}}
{{/custom_instructions}}

REGRA ABSOLUTA: Gere EXATAMENTE {{num_acts}} atos × {{scenes_per_act}} cenas = {{num_acts}} atos no total.

Para cada CENA inclua:
- scene_name: nome evocativo
- scene_type: "Combate" | "Social" | "Exploração" | "Investigação" | "Climax"
- trigger: o que ativa esta cena
- read_aloud: texto para leitura em voz alta pelo mestre (2-3 frases atmosféricas)
- hidden_reality: o que está realmente acontecendo por trás das aparências
- secrets_and_clues: pistas escondidas que os jogadores podem encontrar
- objective: objetivo dos jogadores nesta cena
- opposition_passive: obstáculos passivos (ambientais, sociais)
- opposition_active: oponentes ativos e suas táticas
- suggested_checks: testes mecânicos sugeridos (ex: Percepção DC 15)
- rewards: recompensas possíveis
- outcomes: possíveis desfechos (sucesso total, parcial, falha)

Responda em JSON com estrutura:
{
  "name": "{{arc_name}}",
  "arc_objective": "objetivo principal do arco",
  "world_change": "como o mundo muda ao completar este arco",
  "arc_villain": "antagonista principal deste arco",
  "description": "descrição narrativa do arco (3-4 frases)",
  "acts": [
    {
      "title": "Título do Ato",
      "act_function": "Inciting Incident | Rising Action | Climax | Resolution",
      "description": "descrição do ato",
      "objectives": "objetivos dos jogadores neste ato",
      "twist": "reviravolta ou surpresa",
      "npcs_involved": ["NPC 1", "NPC 2"],
      "completed": false,
      "scenes": [
        {
          "scene_name": "Nome da Cena",
          "scene_type": "Combate",
          "trigger": "o que ativa a cena",
          "read_aloud": "texto atmosférico para leitura",
          "hidden_reality": "verdade oculta",
          "secrets_and_clues": "pistas disponíveis",
          "objective": "objetivo dos jogadores",
          "opposition_passive": "obstáculos passivos",
          "opposition_active": "oponentes e táticas",
          "suggested_checks": "testes sugeridos",
          "rewards": "recompensas",
          "outcomes": "desfechos possíveis",
          "completed": false
        }
      ]
    }
  ]
}`,
    variables: [
      { key: 'arc_name', description: 'Nome do arco narrativo' },
      { key: 'mission_type', description: 'Tipo de missão (Investigação, Exploração, etc.)' },
      { key: 'num_acts', description: 'Número de atos' },
      { key: 'scenes_per_act', description: 'Número de cenas por ato' },
      { key: 'system_rpg', description: 'Sistema de RPG' },
      { key: 'setting', description: 'Ambientação' },
      { key: 'description', description: 'Descrição/resumo da campanha' },
      { key: 'answers_5w2h', description: 'Respostas 5W2H para contexto' },
      { key: 'custom_instructions', description: 'Instruções personalizadas (opcional)' }
    ],
    temperature: 0.85
  },

  // ─ Gerador de Ganchos de Plot ─────────────────────────────────────────────
  [AGENT_IDS.HOOKS_GENERATOR]: {
    name: 'Gerador de Ganchos de Plot',
    description: 'Gera ganchos de aventura (plot hooks) originais e variados para uma campanha.',
    systemPrompt: `Você é um mestre de RPG especialista em narrativa e hooks de engajamento. Crie ganchos de plot únicos, intrigantes e contextualizados que conectem os jogadores à campanha de forma imersiva. Responda SEMPRE em JSON válido.`,
    promptTemplate: `Você é um Mestre de RPG especialista em {{system_rpg}} na ambientação {{setting}}.

CONTEXTO DA CAMPANHA:
{{description}}

RESPOSTAS 5W2H:
{{answers_5w2h}}

TAREFA: Gere EXATAMENTE {{quantity}} ganchos de plot (plot hooks) originais, intrigantes e variados.

{{#custom_instructions}}
INSTRUÇÕES ESPECÍFICAS:
{{custom_instructions}}
{{/custom_instructions}}

REQUISITOS:
- Cada gancho deve ser único e criar suspense imediato
- Variar entre: mistério, conflito, descoberta, perigo, oportunidade
- Adaptar ao sistema {{system_rpg}} e ambientação {{setting}}
- Conectar com o contexto da campanha
- Cada gancho em 2-3 frases descritivas e evocativas

Responda em JSON:
{
  "hooks": ["gancho 1", "gancho 2", ...]
}`,
    variables: [
      { key: 'quantity', description: 'Quantidade de ganchos a gerar' },
      { key: 'system_rpg', description: 'Sistema de RPG' },
      { key: 'setting', description: 'Ambientação' },
      { key: 'description', description: 'Descrição/resumo da campanha' },
      { key: 'answers_5w2h', description: 'Respostas 5W2H para contexto' },
      { key: 'custom_instructions', description: 'Instruções personalizadas (opcional)' }
    ],
    temperature: 0.9
  },

  // ─ Extrator de NPCs do Conteúdo ───────────────────────────────────────────
  [AGENT_IDS.NPC_EXTRACTOR]: {
    name: 'Extrator de NPCs do Conteúdo',
    description: 'Analisa o conteúdo da campanha e extrai nomes de personagens para criação de NPCs.',
    systemPrompt: `Você é um analista de narrativas RPG. Extraia nomes de personagens mencionados explicitamente em descrições de campanhas. Responda SEMPRE em JSON válido.`,
    promptTemplate: `Analise a descrição desta campanha de RPG e extraia os nomes de TODOS os personagens mencionados explicitamente (NPCs, vilões, aliados, figuras históricas, etc.).

CONTEÚDO DA CAMPANHA:
{{content_text}}

Extraia apenas nomes PRÓPRIOS de personagens. Não inclua tipos genéricos como "o rei" sem nome. Agrupe por localização quando possível.

Responda em JSON:
{
  "locations": [
    {
      "location": "Nome da localização",
      "npcs": ["Nome 1", "Nome 2"]
    }
  ]
}`,
    variables: [
      { key: 'content_text', description: 'Texto da campanha (descrição + ganchos + arcos)' }
    ],
    temperature: 0.3
  },

  // ─ Interação com NPC (Roleplay) ───────────────────────────────────────────
  [AGENT_IDS.NPC_INTERACTION]: {
    name: 'Interação com NPC (Roleplay)',
    description: 'Gera respostas em roleplay de NPCs para interações dos jogadores.',
    systemPrompt: `Você é um ator experiente em roleplay de RPG. Incorpore completamente a personalidade, motivações e conhecimentos do NPC especificado. Mantenha consistência com o perfil do personagem e o contexto da campanha. Nunca quebre o personagem.`,
    promptTemplate: `Você é {{npc_name}}, {{npc_role}}.

PERFIL COMPLETO:
{{npc_profile}}

NÍVEL DE INTERESSE/CONFIANÇA COM OS JOGADORES: {{interest}}/10

HISTÓRICO RECENTE DA SESSÃO:
{{recent_history}}

HISTÓRICO DE CONVERSA:
{{conversation_history}}

MENSAGEM DO JOGADOR: "{{player_message}}"

Responda COMO {{npc_name}}, em primeira pessoa, com:
1. Resposta imediata (o que {{npc_name}} diz agora)
2. [Subtexto do Mestre]: o que {{npc_name}} está realmente pensando/sentindo
3. [Ação]: o que {{npc_name}} faz fisicamente enquanto fala

Seja consistente com a personalidade, use vocabulário adequado ao personagem. Adapte o nível de confiança ao valor de interesse fornecido.`,
    variables: [
      { key: 'npc_name', description: 'Nome do NPC' },
      { key: 'npc_role', description: 'Papel/função do NPC' },
      { key: 'npc_profile', description: 'Perfil completo do NPC (descrição, motivação, shadow file)' },
      { key: 'interest', description: 'Nível de interesse/confiança com jogadores (-10 a +10)' },
      { key: 'conversation_history', description: 'Histórico de mensagens da conversa atual' },
      { key: 'player_message', description: 'Mensagem atual do jogador' },
      { key: 'recent_history', description: 'Eventos recentes da sessão' }
    ],
    temperature: 0.9
  },

  // ─ Gerador de Consequências de Decisões ───────────────────────────────────
  [AGENT_IDS.CONSEQUENCE_GENERATOR]: {
    name: 'Gerador de Consequências de Decisões',
    description: 'Gera consequências narrativas e mecânicas para decisões tomadas pelos jogadores.',
    systemPrompt: `Você é o Arquiteto de Consequências. Analise eventos de campanha e gere impactos realistas, interconectados e dramaticamente interessantes. Considere stakeholders, arcos narrativos e WBS ao gerar consequências. Responda SEMPRE em JSON válido.`,
    promptTemplate: `CONTEXTO DA CAMPANHA:
Sistema: {{system_rpg}}
Ambientação: {{setting}}
Objetivo Principal: {{core_objective}}

STAKEHOLDERS ATIVOS:
{{stakeholders_summary}}

HISTÓRICO RECENTE:
{{recent_history}}

EVENTO ATUAL:
Tipo: {{event_type}}
Descrição: {{description}}
Escolha dos Jogadores: {{player_choice}}

TAREFA: Gere consequências lógicas e integradas:
1. Consequência Imediata (o que acontece agora)
2. Impacto de Longo Prazo (sementes narrativas futuras)
3. Mudanças em Stakeholders (quem é afetado e como)
4. Impacto na WBS (qual arco/cena é afetado)
5. Novos Eventos Gerados (2-3 ganchos narrativos resultantes)

Responda em JSON:
{
  "immediate": "consequência imediata detalhada",
  "long_term": "impacto de longo prazo na narrativa",
  "stakeholder_changes": [
    {
      "stakeholder_name": "Nome do Stakeholder",
      "interest_change": 2,
      "reason": "por que o interesse mudou"
    }
  ],
  "wbs_impact": "qual arco ou cena é afetado e como",
  "ai_generated_events": [
    "gancho narrativo 1",
    "gancho narrativo 2"
  ]
}`,
    variables: [
      { key: 'system_rpg', description: 'Sistema de RPG' },
      { key: 'setting', description: 'Ambientação' },
      { key: 'core_objective', description: 'Objetivo principal da campanha' },
      { key: 'stakeholders_summary', description: 'Resumo dos stakeholders ativos' },
      { key: 'recent_history', description: 'Histórico recente de sessões' },
      { key: 'event_type', description: 'Tipo do evento (decision, combat, social, etc.)' },
      { key: 'description', description: 'Descrição do evento' },
      { key: 'player_choice', description: 'Escolha dos jogadores' }
    ],
    temperature: 0.8
  },

  // ─ Expansor de Conteúdo com IA ────────────────────────────────────────────
  [AGENT_IDS.AI_EXPANDER]: {
    name: 'Expansor de Conteúdo com IA',
    description: 'Expande e aprofunda conteúdo de campanha (NPCs, atos, arcos, ganchos) com detalhes adicionais.',
    systemPrompt: `Você é um mestre de RPG criativo e detalhista. Expanda conteúdo existente com profundidade narrativa, elementos mecânicos e material imediatamente utilizável em sessão. Use vocabulário adequado ao sistema e ambientação fornecidos.`,
    promptTemplate: `Você é um mestre de RPG especialista em {{system_rpg}}.

TIPO DE EXPANSÃO: {{expand_type}}

CONTEÚDO A EXPANDIR:
{{content}}

CONTEXTO DA CAMPANHA:
{{context}}

TAREFA: Expanda o conteúdo acima com material adicional rico e imediatamente utilizável. Seja específico, cinematográfico e adapte ao sistema {{system_rpg}}.

Para NPCs: inclua histórico, personalidade profunda, hooks de interação.
Para Atos: inclua cenas intermediárias, diálogos sugeridos, pistas adicionais.
Para Arcos: inclua sub-tramas, NPCs secundários, locais importantes, twists potenciais.
Para Ganchos: inclua variações, consequências, conexões com a trama principal.`,
    variables: [
      { key: 'expand_type', description: 'Tipo de expansão (npc, act, arc, hook, general)' },
      { key: 'content', description: 'Conteúdo a ser expandido' },
      { key: 'context', description: 'Contexto da campanha' },
      { key: 'system_rpg', description: 'Sistema de RPG' }
    ],
    temperature: 0.85
  },

  // ─ Gerador de Dados de Gestão ─────────────────────────────────────────────
  [AGENT_IDS.MANAGEMENT_GENERATOR]: {
    name: 'Gerador de Dados de Gestão',
    description: 'Gera WBS, análise SWOT do antagonista, matriz de stakeholders e gateways de decisão para uma campanha.',
    systemPrompt: `Você é um especialista em gestão de projetos narrativos e design de campanhas RPG. Crie estruturas de gestão profissionais adaptadas ao contexto da campanha, com foco em ferramentas práticas para o mestre. Responda SEMPRE em JSON válido.`,
    promptTemplate: `Crie a estrutura de gestão completa para esta campanha de RPG:

SISTEMA: {{system_rpg}}
AMBIENTAÇÃO: {{setting}}
TÍTULO: {{title}}

RESUMO DA CAMPANHA:
{{adventure_summary}}

GANCHOS:
{{plot_hooks}}

CONTEXTO 5W2H:
{{answers_5w2h}}

Gere:
1. WBS (Work Breakdown Structure) - estrutura hierárquica da campanha
2. Análise SWOT do antagonista principal
3. Matriz de Stakeholders (poder × interesse)
4. Gateways de Decisão (pontos de bifurcação narrativa)

Responda em JSON:
{
  "wbs": {
    "core_objective": "objetivo macro da campanha em 1 frase",
    "narrative_arcs": [
      {
        "name": "Nome do Arco",
        "description": "descrição breve",
        "scenes": [
          {
            "name": "Nome da Cena",
            "challenge_type": "Combate | Social | Exploração | Puzzle | Híbrido",
            "input": "o que os jogadores precisam ter/saber para iniciar esta cena",
            "process": "processo/ação principal que ocorre na cena",
            "deliverable": "resultado concreto que os jogadores obtêm ao completar"
          }
        ]
      }
    ]
  },
  "antagonist_swot": {
    "name": "Nome do antagonista",
    "backstory": "história do antagonista",
    "motivation": "motivação profunda",
    "strengths": ["força 1", "força 2", "força 3"],
    "weaknesses": ["fraqueza 1", "fraqueza 2"],
    "opportunities": ["oportunidade 1", "oportunidade 2"],
    "threats": ["ameaça 1", "ameaça 2"]
  },
  "stakeholders": [
    {
      "name": "Nome do Stakeholder",
      "title": "Cargo/Título",
      "archetype": "Facilitador | Obstrutor | Oportunista | Recurso Chave",
      "description": "descrição breve",
      "power": 7,
      "interest": 3
    }
  ],
  "decision_gateways": [
    {
      "trigger": "situação que ativa este ponto de decisão (ex: durante a infiltração no palácio...)",
      "condition": "a condição que os jogadores enfrentam (Se os jogadores decidirem...)",
      "consequence_a": "o que acontece se a condição for verdadeira (caminho A)",
      "consequence_b": "o que acontece se a condição for falsa (caminho B)",
      "impact": "como esta decisão afeta os arcos narrativos e a WBS"
    }
  ]
}`,
    variables: [
      { key: 'system_rpg', description: 'Sistema de RPG' },
      { key: 'setting', description: 'Ambientação' },
      { key: 'title', description: 'Título da campanha' },
      { key: 'adventure_summary', description: 'Resumo narrativo da campanha' },
      { key: 'plot_hooks', description: 'Ganchos da campanha' },
      { key: 'answers_5w2h', description: 'Respostas 5W2H para contexto' }
    ],
    temperature: 0.75
  },

  // ─ Gerador de Encontro Individual ─────────────────────────────────────────
  [AGENT_IDS.ENCOUNTER_GENERATOR]: {
    name: 'Gerador de Encontro',
    description: 'Gera um encontro/desafio completo e balanceado para uma campanha.',
    systemPrompt: `Você é um mestre de RPG especialista em design de encontros balanceados, criativos e narrativamente interessantes. Você domina as mecânicas de combate, desafios sociais e puzzles de múltiplos sistemas de RPG de mesa. Responda SEMPRE em JSON válido.`,
    promptTemplate: `Crie um encontro completo para esta campanha de RPG:

SISTEMA: {{system_rpg}}
AMBIENTAÇÃO: {{setting}}
JOGADORES: {{players_count}}
CONTEXTO DA CAMPANHA: {{campaign_summary}}
{{#instructions}}
INSTRUÇÕES ESPECÍFICAS: {{instructions}}
{{/instructions}}
TIPO DE ENCONTRO: {{encounter_type}}
DIFICULDADE DESEJADA: {{difficulty}}

Crie um encontro que:
- Seja balanceado para {{players_count}} jogadores no sistema {{system_rpg}}
- Tenha contexto narrativo que se encaixe na campanha
- Inclua criaturas/inimigos com quantidades adequadas
- Tenha táticas e comportamentos específicos para os inimigos
- Traga elementos que surpreendam os jogadores

Responda em JSON:
{
  "name": "Nome do encontro",
  "difficulty": "Fácil|Médio|Difícil|Mortal",
  "description": "Descrição narrativa detalhada do encontro (3-5 frases)",
  "creatures": [{"name": "Nome da criatura", "quantity": 2}],
  "tactics": "Táticas e comportamento dos inimigos durante o encontro"
}`,
    variables: [
      { key: 'system_rpg', description: 'Sistema de RPG' },
      { key: 'setting', description: 'Ambientação' },
      { key: 'players_count', description: 'Número de jogadores' },
      { key: 'campaign_summary', description: 'Resumo da campanha para contexto' },
      { key: 'instructions', description: 'Instruções específicas do usuário (opcional)' },
      { key: 'encounter_type', description: 'Tipo de encontro (Combate, Social, Exploração, Puzzle)' },
      { key: 'difficulty', description: 'Dificuldade desejada' }
    ],
    temperature: 0.85
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
