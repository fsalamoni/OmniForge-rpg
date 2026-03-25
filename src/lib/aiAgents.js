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
  MANAGEMENT_GENERATOR:   'management-generator',
  CREATURE_GENERATOR:     'creature-generator',
  SESSION_PLANNER:        'session-planner'
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
 * Também processa blocos condicionais {{#variavel}}...{{/variavel}}:
 * o bloco é incluído apenas se o valor da variável for truthy (não-vazio).
 * @param {string} template
 * @param {Record<string, string|number>} variables
 * @returns {string}
 */
export function buildPrompt(template, variables) {
  // 1) Resolve blocos condicionais {{#var}}...{{/var}}
  let result = template.replace(/\{\{#(\w+)\}\}([\s\S]*?)\{\{\/\1\}\}/g, (match, key, content) => {
    const val = variables[key];
    return (val !== undefined && val !== null && val !== '') ? content : '';
  });

  // 2) Substitui variáveis simples {{var}}
  result = result.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    const val = variables[key];
    return val !== undefined && val !== null ? String(val) : match;
  });

  return result;
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
Tom da Campanha: {{campaign_tone}}
Nível de Experiência dos Jogadores: {{experience_level}}
Duração prevista: {{duration}}
Número de jogadores: {{players}}
Título da campanha: "{{title}}"

{{#previous_answers}}
Contexto já definido:
{{previous_answers}}
{{/previous_answers}}

Crie um CONFLITO PRINCIPAL que:
- Seja adequado ao sistema {{system}} e à ambientação {{setting}}
- Reflita o tom {{campaign_tone}} e seja acessível para jogadores {{experience_level}}
- Seja escalável para {{players}} jogadores
- Tenha stakes claros (o que pode ser perdido/ganho)
- Seja original e memorável
- Tenha entre 2 e 4 frases descritivas

Responda em JSON: {"answer": "descrição do conflito aqui"}`,
    variables: [
      { key: 'system', description: 'Sistema de RPG (ex: D&D 5e)' },
      { key: 'setting', description: 'Ambientação (ex: Fantasia Medieval)' },
      { key: 'campaign_tone', description: 'Tom(s) da campanha (ex: Épico, Horror)' },
      { key: 'experience_level', description: 'Nível de experiência dos jogadores' },
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
Tom da Campanha: {{campaign_tone}}
Nível de Experiência dos Jogadores: {{experience_level}}
Duração: {{duration}}
Jogadores: {{players}}
Título: "{{title}}"

Contexto já definido:
{{previous_answers}}

Crie uma MOTIVAÇÃO que:
- Seja compreensível (até mesmo simpática em certa medida)
- Revele a lógica interna do antagonista
- Crie conflito moral adequado ao tom {{campaign_tone}}
- Seja coerente com a ambientação {{setting}} e sistema {{system}}
- Tenha entre 2 e 4 frases

Responda em JSON: {"answer": "motivação dos antagonistas aqui"}`,
    variables: [
      { key: 'system', description: 'Sistema de RPG' },
      { key: 'setting', description: 'Ambientação' },
      { key: 'campaign_tone', description: 'Tom(s) da campanha' },
      { key: 'experience_level', description: 'Nível de experiência dos jogadores' },
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
Tom da Campanha: {{campaign_tone}}
Nível de Experiência dos Jogadores: {{experience_level}}
Duração: {{duration}}
Jogadores: {{players}}
Título: "{{title}}"

Contexto já definido:
{{previous_answers}}

Descreva uma LOCALIZAÇÃO que:
- Se encaixe perfeitamente na ambientação {{setting}} e sistema {{system}}
- Transmita o tom {{campaign_tone}} através de sua atmosfera e detalhes sensoriais
- Tenha atmosfera e identidade própria
- Ofereça possibilidades de exploração e interação
- Tenha entre 2 e 4 frases descritivas e evocativas

Responda em JSON: {"answer": "descrição do local de início aqui"}`,
    variables: [
      { key: 'system', description: 'Sistema de RPG' },
      { key: 'setting', description: 'Ambientação' },
      { key: 'campaign_tone', description: 'Tom(s) da campanha' },
      { key: 'experience_level', description: 'Nível de experiência dos jogadores' },
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
Tom da Campanha: {{campaign_tone}}
Nível de Experiência dos Jogadores: {{experience_level}}
Duração: {{duration}}
Jogadores: {{players}}
Título: "{{title}}"

Contexto já definido:
{{previous_answers}}

Crie um CONTEXTO TEMPORAL que:
- Adicione urgência ou significado especial ao momento da aventura
- Reforce o tom {{campaign_tone}} (ex: Horror evoca datas sombrias, Épico evoca profecias ancestrais)
- Seja relevante para o conflito e motivação já estabelecidos
- Crie sensação de momento único e irrepetível
- Tenha entre 2 e 3 frases

Responda em JSON: {"answer": "contexto temporal aqui"}`,
    variables: [
      { key: 'system', description: 'Sistema de RPG' },
      { key: 'setting', description: 'Ambientação' },
      { key: 'campaign_tone', description: 'Tom(s) da campanha' },
      { key: 'experience_level', description: 'Nível de experiência dos jogadores' },
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
Tom da Campanha: {{campaign_tone}}
Nível de Experiência dos Jogadores: {{experience_level}}
Duração: {{duration}}
Jogadores: {{players}}
Título: "{{title}}"

Contexto já definido:
{{previous_answers}}

Crie uma galeria de PERSONAGENS CENTRAIS que inclua:
- 1-2 antagonistas (quem ou o quê os jogadores devem enfrentar)
- 1-2 aliados potenciais (quem pode ajudar os jogadores)
- 1 figura neutra ou ambígua (que pode ser aliado ou inimigo)

Para cada personagem, mencione nome e papel brevemente. Adapte ao sistema {{system}} e tom {{campaign_tone}}.
Se os jogadores forem {{experience_level}}, calibre a complexidade dos personagens adequadamente.

Responda em JSON: {"answer": "descrição dos personagens centrais aqui"}`,
    variables: [
      { key: 'system', description: 'Sistema de RPG' },
      { key: 'setting', description: 'Ambientação' },
      { key: 'campaign_tone', description: 'Tom(s) da campanha' },
      { key: 'experience_level', description: 'Nível de experiência dos jogadores' },
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
Tom da Campanha: {{campaign_tone}}
Nível de Experiência dos Jogadores: {{experience_level}}
Duração: {{duration}}
Jogadores: {{players}}
Título: "{{title}}"

Contexto já definido:
{{previous_answers}}

Crie um GANCHO DE ENVOLVIMENTO que:
- Conecte os PJs à situação de forma orgânica e natural no sistema {{system}}
- Dê motivação clara para os {{players}} jogadores se envolverem
- Seja coerente com o tom {{campaign_tone}} e acessível para jogadores {{experience_level}}
- Crie senso de urgência ou curiosidade imediata
- Tenha entre 2 e 4 frases

Responda em JSON: {"answer": "como os jogadores se envolvem aqui"}`,
    variables: [
      { key: 'system', description: 'Sistema de RPG' },
      { key: 'setting', description: 'Ambientação' },
      { key: 'campaign_tone', description: 'Tom(s) da campanha' },
      { key: 'experience_level', description: 'Nível de experiência dos jogadores' },
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
Tom da Campanha: {{campaign_tone}}
Nível de Experiência dos Jogadores: {{experience_level}}
Duração: {{duration}}
Jogadores: {{players}}
Título: "{{title}}"

Contexto já definido:
{{previous_answers}}

Defina a INTENSIDADE que inclua:
- Nível de letalidade calibrado para {{experience_level}} no sistema {{system}}
- Complexidade da trama coerente com o tom {{campaign_tone}}
- Tipo de desafios predominantes (combate, investigação, social, exploração)
- Ritmo esperado das sessões para {{players}} jogadores
- Tenha entre 2 e 4 frases

Responda em JSON: {"answer": "intensidade e stakes aqui"}`,
    variables: [
      { key: 'system', description: 'Sistema de RPG' },
      { key: 'setting', description: 'Ambientação' },
      { key: 'campaign_tone', description: 'Tom(s) da campanha' },
      { key: 'experience_level', description: 'Nível de experiência dos jogadores' },
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
    description: 'Gera a campanha completa (descrição estruturada, ganchos, NPCs, encontros) a partir das respostas 5W2H.',
    systemPrompt: `Você é um designer de campanhas profissional de RPG, especialista em criar campanhas completas, balanceadas e inesquecíveis para qualquer sistema. Você domina sistemas como D&D, Pathfinder, Call of Cthulhu, Vampire, Ordem Paranormal, Tormenta20 e sabe criar conteúdo adaptado a cada um. Responda SEMPRE em JSON válido e estruturado, sem nenhum texto fora do JSON.`,
    promptTemplate: `Você é um designer de campanhas profissional de RPG. Crie uma CAMPANHA COMPLETA em português do Brasil com base nas informações abaixo. Cada campo deve conter texto RICO, DETALHADO e INSPIRADOR — NUNCA deixe um campo vazio. MÍNIMO TOTAL DE 2500 CARACTERES na soma dos textos das seções premissa, contexto_mundo e conflito_central.

SISTEMA: {{system}}
AMBIENTAÇÃO: {{setting}}
TOM DA CAMPANHA: {{campaign_tone}}
NÍVEL DE EXPERIÊNCIA DOS JOGADORES: {{experience_level}}
DURAÇÃO: {{duration}}
JOGADORES: {{players}}
CRIATIVIDADE: {{creativity_level}}/5 — {{creativity_instructions}}

RESPOSTAS DO PLANEJAMENTO (5W2H):
{{answers}}

Use as respostas 5W2H acima como FUNDAMENTO de toda a campanha. Seja específico para {{system}} em {{setting}}.

RETORNE EXATAMENTE o seguinte objeto JSON, preenchendo CADA campo com conteúdo gerado (nenhum campo pode ser string vazia):

{
  "premissa": {
    "pitch": "<2-3 frases apresentando os protagonistas, a ação central e o antagonista/obstáculo principal>",
    "e_se": "<a pergunta 'E se...?' fundamental que quebra o status quo e move a campanha>",
    "promessa_experiencia": "<descreva o que os jogadores sentirão: tensão, maravilha, horror, heroísmo — seja evocativo>",
    "funcao_personagens": "<quem são os personagens jogadores, qual seu papel e objetivo dentro do mundo>",
    "proposta_jogo": "<gênero refinado da campanha e o que os jogadores farão na maior parte do tempo>",
    "escala": "<escopo geográfico/narrativo da campanha e progressão esperada de poder/nível>"
  },
  "contexto_mundo": {
    "geografia_atmosfera": "<regiões de interesse, clima dominante, arquitetura marcante — crie imagem mental vívida>",
    "paleta_sensorial": "<cores, cheiros e sons característicos do cenário — detalhe o que torna o lugar único>",
    "sociedade_cultura": "<como as pessoas vivem, o que é considerado crime, o que é sagrado ou tabu>",
    "historia_recente": "<os últimos 50 anos de eventos que moldaram o presente — guerras, catástrofes, descobertas>",
    "letalidade_moralidade": "<o tom moral da campanha: heróico/cinematográfico ou sombrio/cinza — e o que isso significa para os PCs>"
  },
  "conflito_central": {
    "origem_problema": "<o evento ou decisão que quebrou o equilíbrio e desencadeou a crise atual>",
    "faccoes_envolvidas": "<os grandes players do conflito: governos, cultos, corporações, facções — quem são e o que representam>",
    "stakes": "<por que isso importa para o mundo e para os personagens — o que está em jogo se os heróis falharem>",
    "tensao_politica": "<quem oprime quem, qual escassez gera conflito, as injustiças que alimentam o fogo>",
    "inimigos": "<distinção entre a ameaça imediata (visível) e a ameaça existencial (oculta) que os heróis enfrentarão>"
  },
  "forcas_poder": [
    {
      "nome": "<nome da facção 1 — obrigatória>",
      "desejo": "<o que essa facção quer desesperadamente — seu objetivo máximo>",
      "recurso": "<o que essa facção possui em abundância — seu poder ou vantagem>",
      "carencia": "<o que essa facção precisa e não consegue sozinha — sua fraqueza>"
    },
    {
      "nome": "<nome da facção 2 — obrigatória>",
      "desejo": "<o que essa facção quer desesperadamente>",
      "recurso": "<o que essa facção possui em abundância>",
      "carencia": "<o que essa facção precisa e não consegue sozinha>"
    },
    {
      "nome": "<nome da facção 3 — adicione se a campanha tiver 3 ou 4 facções relevantes, caso contrário omita>",
      "desejo": "<o que essa facção quer desesperadamente>",
      "recurso": "<o que essa facção possui em abundância>",
      "carencia": "<o que essa facção precisa e não consegue sozinha>"
    }
  ],
  "aspectos_campanha": [
    "<fato absoluto 1 que diferencia este cenário — algo único e marcante>",
    "<fato absoluto 2 — uma verdade imutável do mundo>",
    "<fato absoluto 3 — uma característica inesquecível>",
    "<fato absoluto 4 — adicione se enriquecer o cenário, caso contrário omita>",
    "<fato absoluto 5 — adicione se enriquecer o cenário, caso contrário omita>"
  ],
  "relogio_apocalipse": [
    {
      "estagio": "<nome do estágio 1 — ex: 'Tensão Crescente'>",
      "descricao": "<o que acontece neste estágio se os heróis não intervirem — seja específico e dramático>",
      "tempo_estimado": "<quanto tempo in-game até este estágio — ex: '2 semanas'>"
    },
    {
      "estagio": "<nome do estágio 2>",
      "descricao": "<consequências deste estágio>",
      "tempo_estimado": "<tempo estimado>"
    },
    {
      "estagio": "<nome do estágio 3>",
      "descricao": "<consequências deste estágio>",
      "tempo_estimado": "<tempo estimado>"
    },
    {
      "estagio": "<nome do estágio 4 — opcional>",
      "descricao": "<consequências deste estágio>",
      "tempo_estimado": "<tempo estimado>"
    },
    {
      "estagio": "<Catástrofe Final — nome do colapso total>",
      "descricao": "<o fim do mundo como os personagens conhecem se nada for feito>",
      "tempo_estimado": "<prazo final>"
    }
  ],
  "plot_hooks": [
    "<gancho 1 — situação concreta que puxa os PCs para a aventura>",
    "<gancho 2 — um segundo gancho diferente do primeiro>",
    "<gancho 3 — um terceiro gancho diferente dos anteriores>",
    "<gancho 4 — adicione se enriquecer a campanha, caso contrário omita>",
    "<gancho 5 — adicione se enriquecer a campanha, caso contrário omita>"
  ],
  "npcs": [
    {
      "name": "<nome do NPC 1>",
      "role": "<papel na trama — aliado, vilão, informante, etc.>",
      "motivation": "<o que move este NPC — seu desejo ou medo central>",
      "description": "<aparência, personalidade, segredo ou peculiaridade marcante>"
    },
    {
      "name": "<nome do NPC 2>",
      "role": "<papel na trama>",
      "motivation": "<motivação>",
      "description": "<descrição>"
    },
    {
      "name": "<nome do NPC 3>",
      "role": "<papel na trama>",
      "motivation": "<motivação>",
      "description": "<descrição>"
    }
  ],
  "encounters": [
    {
      "name": "<nome do encontro 1>",
      "difficulty": "Médio",
      "description": "<situação, ambiente e objetivos táticos do encontro>",
      "creatures": [{"name": "<criatura>", "quantity": 1}],
      "tactics": "<como os inimigos agem e o que torna este encontro memorável>"
    },
    {
      "name": "<nome do encontro 2>",
      "difficulty": "Difícil",
      "description": "<situação e ambiente>",
      "creatures": [{"name": "<criatura>", "quantity": 2}],
      "tactics": "<táticas>"
    },
    {
      "name": "<nome do encontro 3>",
      "difficulty": "Mortal",
      "description": "<situação e ambiente>",
      "creatures": [{"name": "<criatura>", "quantity": 1}],
      "tactics": "<táticas>"
    }
  ]
}`,
    variables: [
      { key: 'system', description: 'Sistema de RPG' },
      { key: 'setting', description: 'Ambientação' },
      { key: 'campaign_tone', description: 'Tom(s) da campanha (ex: Épico, Horror, Grimdark)' },
      { key: 'experience_level', description: 'Nível de experiência dos jogadores' },
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
  // NOTA: O ArcGenerator.jsx utiliza geração multi-etapa com prompts próprios,
  // chamando invokeLLM diretamente em 3 passos (overview → atos → cenas).
  // Este agente é mantido para referência e para o painel Admin.
  [AGENT_IDS.ARC_GENERATOR]: {
    name: 'Gerador de Arco Narrativo (Multi-Etapa)',
    description: 'Gera um arco narrativo completo com atos e cenas detalhadas em múltiplas etapas de IA para máxima qualidade.',
    systemPrompt: `Você é um mestre de RPG lendário, especialista em estrutura narrativa épica e design de aventuras imersivas. Crie arcos de campanha com atos bem definidos e cenas ricamente detalhadas, com textos de leitura em voz alta que transportam os jogadores para dentro da cena. Inclua descrições sensoriais (visão, audição, olfato, tato), atmosfera emocional, e mecânicas de jogo detalhadas. Responda SEMPRE em JSON válido.`,
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

INSTRUÇÕES ESPECÍFICAS DO NARRADOR: {{custom_instructions}}

REGRA ABSOLUTA: Gere EXATAMENTE {{num_acts}} atos × {{scenes_per_act}} cenas.

O arco NÃO representa todo o jogo — é um segmento da campanha.
Deve ter ganchos que conectem a arcos futuros.

Para cada CENA inclua:
- scene_name: nome evocativo e descritivo
- scene_type: "Combate" | "Social" | "Exploração" | "Puzzle" | "Híbrido"
- trigger: o que ativa esta cena (evento ou decisão específica)
- read_aloud: texto LONGO e IMERSIVO para leitura em voz alta (mínimo 5-8 frases com descrições visuais, sonoras, olfativas, táteis e atmosfera emocional)
- hidden_reality: o que está realmente acontecendo por trás das aparências (2-4 frases)
- secrets_and_clues: [{clue, how_to_find}] — 2-4 pistas por cena
- objective: objetivo concreto dos jogadores
- opposition_passive: obstáculos ambientais e sociais (2-3 frases)
- opposition_active: oponentes ativos e suas táticas (2-3 frases)
- suggested_checks: [{skill, dc, on_success, on_failure}] — 2-4 testes mecânicos
- outcomes: 2-4 possíveis desfechos (sucesso total, parcial, falha, variações morais)
- exits: transições possíveis para a próxima cena
- rewards: recompensas concretas (itens, informações, aliados)

Responda em JSON com estrutura:
{
  "name": "{{arc_name}}",
  "description": "descrição narrativa rica e imersiva (4-6 frases)",
  "arc_objective": "objetivo central do arco (2-3 frases)",
  "world_change": "como o mundo muda ao completar este arco (2-3 frases)",
  "arc_villain": "antagonista principal — nome, motivação e método (2-3 frases)",
  "tone_and_themes": "tom narrativo e temas centrais",
  "stakes": "consequências de falha e sucesso (2-3 frases)",
  "future_hooks": ["gancho futuro 1", "gancho futuro 2"],
  "acts": [
    {
      "title": "Título do Ato",
      "act_function": "setup|rising_action|climax|falling_action",
      "description": "descrição rica do ato (3-5 frases)",
      "objectives": ["objetivo 1", "objetivo 2", "objetivo 3"],
      "twist": "reviravolta surpreendente",
      "npcs_involved": ["NPC 1", "NPC 2"],
      "completed": false,
      "scenes": [
        {
          "scene_name": "Nome Evocativo da Cena",
          "scene_type": "Combate",
          "trigger": "evento específico que inicia a cena",
          "read_aloud": "TEXTO LONGO E IMERSIVO com todos os sentidos descritos",
          "hidden_reality": "verdade oculta detalhada",
          "secrets_and_clues": [{"clue": "pista", "how_to_find": "método"}],
          "objective": "objetivo concreto",
          "opposition_passive": "obstáculos ambientais",
          "opposition_active": "oponentes e táticas",
          "suggested_checks": [{"skill": "Percepção", "dc": "15", "on_success": "resultado", "on_failure": "resultado"}],
          "outcomes": ["sucesso total", "sucesso parcial", "falha"],
          "exits": "transições possíveis",
          "rewards": "recompensas concretas",
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

  // ─ Gerador de Criatura Completa ───────────────────────────────────────────
  [AGENT_IDS.CREATURE_GENERATOR]: {
    name: 'Gerador de Criatura Completa',
    description: 'Gera uma criatura/monstro com ficha completa adaptada ao sistema de RPG especificado.',
    systemPrompt: `Você é um designer de RPG especialista em criação de criaturas e monstros para múltiplos sistemas. Crie fichas completas, balanceadas e narrativamente ricas, usando a terminologia correta de cada sistema (CR para D&D, Ameaça para Tormenta20, etc.). Responda SEMPRE em JSON válido.`,
    promptTemplate: `Crie uma criatura/monstro completo para esta campanha de RPG:

SISTEMA: {{system_rpg}}
AMBIENTAÇÃO: {{setting}}
TIPO DE CRIATURA: {{creature_type}}
NÍVEL DE AMEAÇA: {{threat_level}}
{{#context}}
CONTEXTO DA CAMPANHA: {{context}}
{{/context}}
{{#instructions}}
INSTRUÇÕES ESPECÍFICAS: {{instructions}}
{{/instructions}}

Gere uma criatura que:
- Use a terminologia e métricas corretas do sistema {{system_rpg}}
- Seja adequada ao nível/CR/Ameaça {{threat_level}}
- Tenha habilidades especiais temáticas e narrativamente interessantes
- Inclua táticas de combate e comportamento
- Tenha ganchos narrativos (loot, motivação, fraqueza exploitável)

Responda em JSON:
{
  "name": "Nome da Criatura",
  "type": "Tipo (ex: Morto-vivo, Besta, Humanoide)",
  "threat_level": "CR/Nível de Ameaça no sistema {{system_rpg}}",
  "size": "Tamanho (ex: Grande, Médio)",
  "description": "Descrição física e comportamental em 2-3 frases",
  "lore": "Lore e contexto narrativo em 1-2 frases",
  "stats": {
    "hp": "pontos de vida (ex: 52 (8d10 + 8))",
    "ac": "classe de armadura (ex: 14 (couro natural))",
    "speed": "velocidade (ex: 9m, voo 18m)",
    "attributes": {
      "FOR": 16, "DES": 12, "CON": 14, "INT": 6, "SAB": 10, "CAR": 8
    },
    "saving_throws": "testes de resistência relevantes",
    "skills": "perícias relevantes",
    "damage_immunities": "imunidades (se houver)",
    "senses": "sentidos especiais",
    "challenge": "CR ou equivalente no sistema"
  },
  "special_abilities": [
    {"name": "Nome da Habilidade", "description": "Descrição mecânica"}
  ],
  "actions": [
    {"name": "Nome da Ação", "description": "Descrição mecânica com dano/efeito"}
  ],
  "tactics": "Como esta criatura se comporta em combate",
  "loot": "O que os jogadores podem obter ao derrotá-la",
  "weakness": "Fraqueza exploitável narrativamente"
}`,
    variables: [
      { key: 'system_rpg', description: 'Sistema de RPG (ex: D&D 5e, Pathfinder 2e)' },
      { key: 'setting', description: 'Ambientação da campanha' },
      { key: 'creature_type', description: 'Tipo de criatura (ex: Morto-vivo, Demônio, Besta)' },
      { key: 'threat_level', description: 'Nível de ameaça/CR desejado' },
      { key: 'context', description: 'Contexto da campanha (opcional)' },
      { key: 'instructions', description: 'Instruções específicas (opcional)' }
    ],
    temperature: 0.85
  },

  // ─ Planejador de Sessão ────────────────────────────────────────────────────
  [AGENT_IDS.SESSION_PLANNER]: {
    name: 'Planejador de Sessão',
    description: 'Gera um roteiro detalhado para uma sessão de RPG com abertura, cenas, NPCs ativos, objetivos e possíveis desfechos.',
    systemPrompt: `Você é um mestre de RPG experiente especialista em planejamento de sessões. Crie roteiros de sessão práticos, flexíveis e com conteúdo imediatamente utilizável em mesa. Inclua ganchos de abertura impactantes, cenas com objetivos claros e fechamentos que deixem os jogadores querendo mais. Responda SEMPRE em JSON válido.`,
    promptTemplate: `Crie um roteiro completo para uma sessão de RPG:

SISTEMA: {{system_rpg}}
AMBIENTAÇÃO: {{setting}}
NÚMERO DE SESSÃO: {{session_number}}
DURAÇÃO ESTIMADA: {{duration_hours}} horas
JOGADORES: {{players_count}}

CONTEXTO DA CAMPANHA:
{{campaign_summary}}

ARCO ATUAL: {{current_arc}}
EVENTOS ANTERIORES: {{previous_events}}

{{#custom_instructions}}
INSTRUÇÕES ESPECÍFICAS: {{custom_instructions}}
{{/custom_instructions}}

Gere um roteiro de sessão que:
- Tenha uma abertura impactante que retome os eventos anteriores
- Inclua 3-5 cenas com objetivos claros e tempo estimado
- Liste os NPCs ativos e seus objetivos nesta sessão
- Inclua um ou mais momentos de tensão/climax
- Termine com um gancho para a próxima sessão

Responda em JSON:
{
  "session_title": "Título desta sessão",
  "session_theme": "Tema central desta sessão (ex: Revelação, Traição, Exploração)",
  "opening_hook": "Como a sessão começa — descrição cinematográfica de abertura para o mestre ler",
  "session_objective": "O que os jogadores devem alcançar nesta sessão",
  "estimated_duration": "{{duration_hours}}h",
  "scenes": [
    {
      "order": 1,
      "name": "Nome da Cena",
      "type": "Combate | Social | Exploração | Investigação | Transição",
      "estimated_time": "30 min",
      "setup": "Como a cena começa",
      "objective": "O que acontece nesta cena",
      "npcs_active": ["NPC 1", "NPC 2"],
      "possible_outcomes": ["Desfecho A", "Desfecho B"],
      "dm_notes": "Dicas para o mestre conduzir esta cena"
    }
  ],
  "key_npcs": [
    {
      "name": "Nome do NPC",
      "role_this_session": "O que este NPC faz nesta sessão",
      "secret": "Segredo que pode ser revelado (opcional)",
      "agenda": "O que o NPC quer alcançar"
    }
  ],
  "tension_moments": ["Momento de tensão 1", "Momento de tensão 2"],
  "session_end_hook": "Como a sessão termina — gancho para deixar os jogadores ansiosos",
  "xp_rewards": "Sugestão de XP/recompensas para a sessão",
  "dm_checklist": ["Item a preparar 1", "Item a preparar 2", "Item a preparar 3"]
}`,
    variables: [
      { key: 'system_rpg', description: 'Sistema de RPG' },
      { key: 'setting', description: 'Ambientação' },
      { key: 'session_number', description: 'Número da sessão (ex: 1, 5, 10)' },
      { key: 'duration_hours', description: 'Duração estimada em horas (ex: 3, 4)' },
      { key: 'players_count', description: 'Número de jogadores' },
      { key: 'campaign_summary', description: 'Resumo da campanha' },
      { key: 'current_arc', description: 'Arco narrativo atual' },
      { key: 'previous_events', description: 'Eventos da sessão anterior' },
      { key: 'custom_instructions', description: 'Instruções específicas (opcional)' }
    ],
    temperature: 0.85
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
