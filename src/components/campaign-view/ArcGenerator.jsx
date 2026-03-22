import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Sparkles, Loader2, CheckCircle2, Circle } from 'lucide-react';
import { invokeLLM } from '@/lib/aiClient';
import { useAuth } from '@/lib/AuthContext';

const MISSION_TYPES = [
  'Investigação', 'Exploração', 'Roubo', 'Assassinato', 'Resgate',
  'Diplomacia', 'Infiltração', 'Defesa', 'Conquista', 'Mistério',
  'Sobrevivência', 'Caça', 'Escolta'
];

const ACT_FUNCTIONS = ['setup', 'rising_action', 'climax', 'falling_action'];

// ── Helpers ────────────────────────────────────────────────────────────────────

/** Build shared context block used across all generation steps */
function buildContextBlock({ description, hooks, answers5W2H, npcs, existingArcs }) {
  const parts = [];

  if (description) {
    parts.push(`DESCRIÇÃO DA CAMPANHA:\n${String(description).substring(0, 800)}`);
  }

  if (hooks && hooks.length > 0) {
    const hookTexts = hooks.slice(0, 6).map((h, i) => {
      const text = typeof h === 'string' ? h : (h.text || h.description || h.content || h.title || h.hook || h.name || '');
      return `${i + 1}. ${text || '[gancho sem texto]'}`;
    });
    parts.push(`GANCHOS NARRATIVOS DA CAMPANHA:\n${hookTexts.join('\n')}`);
  }

  if (answers5W2H && Object.keys(answers5W2H).length > 0) {
    const entries = Object.entries(answers5W2H).map(([k, v]) => `${k}: ${String(v).substring(0, 120)}`);
    parts.push(`5W2H DA CAMPANHA:\n${entries.join('\n')}`);
  }

  if (npcs && npcs.length > 0) {
    const npcLines = npcs.slice(0, 15).map(n =>
      `- ${n.name}${n.type ? ` (${n.type})` : ''}${n.role ? ` — ${n.role}` : ''}${n.description ? `: ${String(n.description).substring(0, 80)}` : ''}`
    );
    parts.push(`NPCs/CRIATURAS EXISTENTES (utilize-os quando fizer sentido):\n${npcLines.join('\n')}`);
  }

  if (existingArcs && existingArcs.length > 0) {
    const arcSummaries = existingArcs.map((a, i) =>
      `Arco ${i + 1} — "${a.name}": ${(a.description || a.arc_objective || '').substring(0, 120)}`
    );
    parts.push(`ARCOS NARRATIVOS ANTERIORES (o novo arco deve dar continuidade, NÃO repetir conteúdo):\n${arcSummaries.join('\n')}`);
  }

  return parts.join('\n\n');
}

/** Unwrap common wrapper patterns some AI models return */
function unwrapResult(raw, fallbackName) {
  let result = raw;
  if (typeof result === 'string') {
    try { result = JSON.parse(result); } catch { /* keep as-is */ }
  }
  if (!result || typeof result !== 'object') return null;
  if (!result.name && result.arc) result = result.arc;
  if (!result.name && result.narrative_arc) result = result.narrative_arc;
  if (!result.name && result.data) result = result.data;
  if (!result.name && result.title) result = { ...result, name: result.title };
  if (!result.name && result.arc_name) result = { ...result, name: result.arc_name };
  if (!result.name && fallbackName) result = { ...result, name: fallbackName };
  return result;
}

/** Unwrap arrays that might come wrapped */
function unwrapArray(raw) {
  let result = raw;
  if (typeof result === 'string') {
    try { result = JSON.parse(result); } catch { return []; }
  }
  if (Array.isArray(result)) return result;
  if (result && typeof result === 'object') {
    // Try common wrapper keys
    for (const key of ['acts', 'scenes', 'items', 'data', 'results', 'list']) {
      if (Array.isArray(result[key])) return result[key];
    }
  }
  return [];
}

/** Ensure a scene object has all required fields with correct types */
function normalizeScene(scene) {
  return {
    scene_name: scene.scene_name || scene.name || scene.title || 'Cena sem nome',
    scene_type: scene.scene_type || scene.type || 'Exploração',
    trigger: scene.trigger || '',
    read_aloud: scene.read_aloud || scene.readAloud || scene.read_aloud_text || '',
    hidden_reality: scene.hidden_reality || scene.hiddenReality || '',
    secrets_and_clues: Array.isArray(scene.secrets_and_clues) ? scene.secrets_and_clues
      : Array.isArray(scene.secretsAndClues) ? scene.secretsAndClues
      : Array.isArray(scene.clues) ? scene.clues.map(c => typeof c === 'string' ? { clue: c, how_to_find: '' } : c)
      : [],
    objective: scene.objective || scene.goal || '',
    opposition_passive: scene.opposition_passive || scene.oppositionPassive || '',
    opposition_active: scene.opposition_active || scene.oppositionActive || '',
    suggested_checks: Array.isArray(scene.suggested_checks) ? scene.suggested_checks
      : Array.isArray(scene.suggestedChecks) ? scene.suggestedChecks
      : Array.isArray(scene.checks) ? scene.checks
      : [],
    outcomes: Array.isArray(scene.outcomes) ? scene.outcomes
      : Array.isArray(scene.possible_outcomes) ? scene.possible_outcomes
      : [],
    exits: scene.exits || scene.exit || '',
    rewards: scene.rewards || scene.reward || '',
    completed: false,
    encounters: []
  };
}

/** Ensure an act object has all required fields with correct types */
function normalizeAct(act) {
  const fn = act.act_function || act.actFunction || act.function || '';
  return {
    title: act.title || act.name || 'Ato sem título',
    act_function: ACT_FUNCTIONS.includes(fn) ? fn : 'rising_action',
    description: act.description || '',
    objectives: Array.isArray(act.objectives) ? act.objectives
      : typeof act.objectives === 'string' ? [act.objectives]
      : [],
    twist: act.twist || '',
    npcs_involved: Array.isArray(act.npcs_involved) ? act.npcs_involved
      : Array.isArray(act.npcsInvolved) ? act.npcsInvolved
      : [],
    completed: false,
    scenes: Array.isArray(act.scenes) ? act.scenes.map(normalizeScene) : []
  };
}

// ── Generation Steps ───────────────────────────────────────────────────────────

const GENERATION_STEPS = [
  { id: 'overview', label: 'Contexto e visão geral do arco' },
  { id: 'acts', label: 'Estrutura dos atos' },
  { id: 'scenes', label: 'Cenas detalhadas' }
];

async function generateArcOverview({ arcName, missionType, numActs, scenesPerAct, systemRpg, setting, customInstructions, contextBlock, userAIConfig }) {
  const prompt = `Você é um mestre de RPG de nível mundial criando um arco narrativo épico e memorável.

TAREFA: Criar a VISÃO GERAL de um arco narrativo para RPG de mesa.

INFORMAÇÕES DO ARCO:
- Nome: ${arcName}
- Tipo de Missão: ${missionType}
- Sistema: ${systemRpg || 'Sistema genérico'}
- Ambientação: ${setting || 'Fantasia'}
- Estrutura planejada: ${numActs} atos com ${scenesPerAct} cenas cada

${contextBlock}

${customInstructions ? `INSTRUÇÕES DO NARRADOR: ${customInstructions}` : ''}

DIRETRIZES IMPORTANTES:
- Este arco NÃO representa todo o jogo. Ele é um segmento da campanha, situado no tempo e progressão do jogo.
- NÃO crie um início-meio-fim completo da campanha. O arco deve ter ganchos que conectem a arcos futuros.
- Se existem arcos anteriores, faça referências a eventos passados e crie continuidade.
- O arco deve ter um conflito central claro, consequências reais, e um antagonista ou força antagonista bem definida.
- A descrição deve ser rica, evocativa e imersiva, pensada para um narrador de RPG de mesa.
- O objetivo do arco deve ser desafiador e envolvente para os jogadores.
- Descreva como o mundo muda ao final deste arco (world_change).
- Inclua ganchos narrativos que possam ser explorados em arcos futuros (future_hooks).

Retorne um JSON com a seguinte estrutura:
{
  "name": "${arcName}",
  "description": "Descrição narrativa rica e imersiva do arco (4-6 frases descrevendo o cenário, a atmosfera, os conflitos e o que está em jogo)",
  "arc_objective": "O objetivo central que os jogadores precisam alcançar neste arco (2-3 frases)",
  "world_change": "Como o mundo da campanha será transformado ao final deste arco, independente do resultado (2-3 frases)",
  "arc_villain": "O antagonista ou força antagonista principal deste arco — nome, motivação e método (2-3 frases)",
  "tone_and_themes": "Tom narrativo e temas centrais deste arco (ex: traição, redenção, horror cósmico)",
  "stakes": "O que está em jogo — consequências de falha e de sucesso (2-3 frases)",
  "future_hooks": ["Gancho para arco futuro 1", "Gancho para arco futuro 2"]
}`;

  const raw = await invokeLLM({
    prompt,
    responseSchema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        description: { type: 'string' },
        arc_objective: { type: 'string' },
        world_change: { type: 'string' },
        arc_villain: { type: 'string' },
        tone_and_themes: { type: 'string' },
        stakes: { type: 'string' },
        future_hooks: { type: 'array', items: { type: 'string' } }
      },
      required: ['name', 'description']
    },
    userAIConfig,
    systemPrompt: 'Você é um mestre de RPG renomado, especialista em narrativa épica e design de aventuras. Crie conteúdo rico, detalhado e imersivo. Responda SEMPRE em JSON válido.',
    temperature: 0.85
  });

  return unwrapResult(raw, arcName) || { name: arcName, description: '' };
}

async function generateActsStructure({ arcOverview, numActs, scenesPerAct, missionType, systemRpg, setting, contextBlock, userAIConfig }) {
  const actFunctionGuide = numActs <= 2
    ? 'Use "setup" para o primeiro ato e "climax" para o último.'
    : numActs === 3
    ? 'Use "setup" para o Ato 1, "rising_action" ou "climax" para o Ato 2, e "climax" ou "falling_action" para o Ato 3.'
    : `Distribua as funções narrativas entre os ${numActs} atos: comece com "setup", passe por "rising_action", atinja o "climax", e termine com "falling_action".`;

  const prompt = `Você é um mestre de RPG de nível mundial estruturando os atos de um arco narrativo.

ARCO NARRATIVO:
- Nome: ${arcOverview.name}
- Descrição: ${arcOverview.description}
- Objetivo: ${arcOverview.arc_objective || 'N/A'}
- Vilão: ${arcOverview.arc_villain || 'N/A'}
- Tom e Temas: ${arcOverview.tone_and_themes || 'N/A'}
- O que está em jogo: ${arcOverview.stakes || 'N/A'}
- Tipo de Missão: ${missionType}
- Sistema: ${systemRpg || 'Sistema genérico'}
- Ambientação: ${setting || 'Fantasia'}

${contextBlock}

TAREFA: Criar EXATAMENTE ${numActs} atos para este arco. Cada ato terá ${scenesPerAct} cenas (as cenas serão detalhadas separadamente).

GUIA DE FUNÇÕES NARRATIVAS:
${actFunctionGuide}
Valores válidos para act_function: "setup", "rising_action", "climax", "falling_action"

DIRETRIZES:
- Cada ato deve ter um propósito narrativo claro e distinto.
- A descrição de cada ato deve ser rica (3-5 frases), explicando o contexto, a atmosfera e o que acontece narrativamente.
- Os objetivos devem ser concretos e acionáveis pelos jogadores (3-5 objetivos por ato).
- O twist (reviravolta) deve surpreender e adicionar profundidade — não deve ser previsível.
- Liste NPCs envolvidos neste ato (nomes de personagens relevantes).
- Considere a progressão emocional: tensão crescente, momentos de alívio, clímax dramático.
- Cada ato deve ter pistas que conectam ao próximo, criando um fluxo narrativo coeso.

Retorne um JSON com a seguinte estrutura:
{
  "acts": [
    {
      "title": "Título evocativo do ato",
      "act_function": "setup|rising_action|climax|falling_action",
      "description": "Descrição rica e narrativa do ato (3-5 frases sobre o contexto, atmosfera, eventos principais)",
      "objectives": ["Objetivo concreto 1", "Objetivo concreto 2", "Objetivo concreto 3"],
      "twist": "Reviravolta surpreendente que muda a direção do ato ou revela algo inesperado",
      "npcs_involved": ["Nome do NPC 1", "Nome do NPC 2"],
      "transition_to_next": "Como este ato leva ao próximo (ou encerra o arco, se for o último)"
    }
  ]
}`;

  const raw = await invokeLLM({
    prompt,
    responseSchema: {
      type: 'object',
      properties: {
        acts: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              act_function: { type: 'string' },
              description: { type: 'string' },
              objectives: { type: 'array', items: { type: 'string' } },
              twist: { type: 'string' },
              npcs_involved: { type: 'array', items: { type: 'string' } },
              transition_to_next: { type: 'string' }
            }
          }
        }
      },
      required: ['acts']
    },
    userAIConfig,
    systemPrompt: 'Você é um mestre de RPG renomado, especialista em estrutura narrativa e design de aventuras. Crie atos com progressão dramática perfeita. Responda SEMPRE em JSON válido.',
    temperature: 0.8
  });

  let acts = unwrapArray(raw?.acts || raw);
  if (acts.length > numActs) acts = acts.slice(0, numActs);
  return acts;
}

async function generateScenesForAct({ actData, actIndex, numActs, scenesPerAct, arcOverview, previousActsSummary, systemRpg, setting, contextBlock, userAIConfig }) {
  const prompt = `Você é um mestre de RPG de nível mundial criando cenas detalhadas e imersivas para uma sessão de RPG de mesa.

ARCO: "${arcOverview.name}"
${arcOverview.description}
Vilão: ${arcOverview.arc_villain || 'N/A'}
Tom e Temas: ${arcOverview.tone_and_themes || 'N/A'}

ATO ATUAL — Ato ${actIndex + 1} de ${numActs}: "${actData.title}"
Função Narrativa: ${actData.act_function}
Descrição: ${actData.description}
Objetivos do Ato: ${(actData.objectives || []).join('; ')}
Reviravolta: ${actData.twist || 'N/A'}
NPCs Envolvidos: ${(actData.npcs_involved || []).join(', ') || 'N/A'}

${previousActsSummary ? `RESUMO DOS ATOS ANTERIORES:\n${previousActsSummary}\n` : ''}

Sistema: ${systemRpg || 'Sistema genérico'}
Ambientação: ${setting || 'Fantasia'}

${contextBlock}

TAREFA: Criar EXATAMENTE ${scenesPerAct} cenas para este ato.

DIRETRIZES PARA CADA CENA — LEIA COM ATENÇÃO:

1. **scene_name**: Nome evocativo e descritivo (ex: "O Sussurro na Cripta Abandonada").

2. **scene_type**: Um entre "Social", "Combate", "Exploração", "Puzzle" ou "Híbrido". Varie os tipos ao longo das cenas.

3. **trigger**: O que faz esta cena começar. Seja específico — qual evento, descoberta ou decisão dos jogadores inicia esta cena.

4. **read_aloud**: ESTE É O CAMPO MAIS IMPORTANTE. Escreva um texto narrativo LONGO e IMERSIVO (mínimo 5-8 frases) que o narrador lerá em voz alta para os jogadores. Deve incluir:
   - Descrição visual detalhada do ambiente (cores, iluminação, arquitetura, vegetação)
   - Sons ambientes (vento, passos, vozes distantes, criaturas, silêncio opressor)
   - Cheiros e sensações táteis (umidade, calor, frio, poeira, perfumes, podridão)
   - Atmosfera emocional (tensão, mistério, serenidade ameaçadora, urgência)
   - Elementos que chamem a atenção dos jogadores (um objeto incomum, uma figura misteriosa, um som perturbador)
   Use linguagem literária, evocativa e imersiva. O jogador deve SENTIR que está lá.

5. **hidden_reality**: O que está REALMENTE acontecendo por trás das aparências. Informações que apenas o narrador sabe. Seja detalhado (2-4 frases).

6. **secrets_and_clues**: Lista de pistas que os jogadores podem descobrir. Cada pista deve ter uma descrição (clue) e um método de descoberta (how_to_find). Inclua 2-4 pistas por cena.

7. **objective**: O que os jogadores precisam realizar nesta cena. Seja concreto e claro (1-2 frases).

8. **opposition_passive**: Obstáculos ambientais, sociais ou estruturais (armadilhas, terreno difícil, desconfiança de NPCs, prazos, condições climáticas). Descreva em 2-3 frases.

9. **opposition_active**: Oponentes ativos com táticas específicas. Descreva quem são, o que querem, e como lutam/agem. (2-3 frases).

10. **suggested_checks**: Lista de 2-4 testes mecânicos. Cada teste deve ter: skill (perícia/habilidade), dc (dificuldade numérica), on_success (resultado de sucesso), on_failure (resultado de falha).

11. **outcomes**: Lista de 2-4 possíveis desfechos. Inclua: sucesso total, sucesso parcial, falha com consequências, e variações baseadas em escolhas morais.

12. **exits**: Para onde esta cena pode levar. Descreva as transições possíveis para a próxima cena ou ato.

13. **rewards**: Recompensas concretas (itens, informações, aliados, experiência, moeda). Descreva em 1-2 frases.

Retorne um JSON com a seguinte estrutura:
{
  "scenes": [
    {
      "scene_name": "Nome evocativo",
      "scene_type": "Social|Combate|Exploração|Puzzle|Híbrido",
      "trigger": "O que inicia esta cena",
      "read_aloud": "TEXTO LONGO E IMERSIVO para o narrador ler aos jogadores (mínimo 5-8 frases com todos os sentidos descritos)",
      "hidden_reality": "A verdade oculta por trás das aparências",
      "secrets_and_clues": [{"clue": "Pista encontrável", "how_to_find": "Como encontrar esta pista"}],
      "objective": "O que os jogadores devem alcançar",
      "opposition_passive": "Obstáculos ambientais e sociais",
      "opposition_active": "Oponentes ativos e suas táticas",
      "suggested_checks": [{"skill": "Percepção", "dc": "15", "on_success": "Resultado do sucesso", "on_failure": "Resultado da falha"}],
      "outcomes": ["Sucesso total: ...", "Sucesso parcial: ...", "Falha: ..."],
      "exits": "Transições possíveis",
      "rewards": "Recompensas concretas"
    }
  ]
}`;

  const raw = await invokeLLM({
    prompt,
    responseSchema: {
      type: 'object',
      properties: {
        scenes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              scene_name: { type: 'string' },
              scene_type: { type: 'string' },
              trigger: { type: 'string' },
              read_aloud: { type: 'string' },
              hidden_reality: { type: 'string' },
              secrets_and_clues: { type: 'array', items: { type: 'object', properties: { clue: { type: 'string' }, how_to_find: { type: 'string' } } } },
              objective: { type: 'string' },
              opposition_passive: { type: 'string' },
              opposition_active: { type: 'string' },
              suggested_checks: { type: 'array', items: { type: 'object', properties: { skill: { type: 'string' }, dc: { type: 'string' }, on_success: { type: 'string' }, on_failure: { type: 'string' } } } },
              outcomes: { type: 'array', items: { type: 'string' } },
              exits: { type: 'string' },
              rewards: { type: 'string' }
            }
          }
        }
      },
      required: ['scenes']
    },
    userAIConfig,
    systemPrompt: 'Você é um mestre de RPG lendário, famoso por criar as cenas mais imersivas, detalhadas e memoráveis de todos os tempos. Seus textos de read_aloud são obras-primas literárias que transportam os jogadores para dentro da cena. Responda SEMPRE em JSON válido.',
    temperature: 0.9
  });

  let scenes = unwrapArray(raw?.scenes || raw);
  if (scenes.length > scenesPerAct) scenes = scenes.slice(0, scenesPerAct);
  return scenes.map(normalizeScene);
}

// ── Component ──────────────────────────────────────────────────────────────────

export default function ArcGenerator({ campaignId, description, answers5W2H, hooks = [], npcs = [], systemRpg, setting, existingArcs = [], onArcGenerated }) {
  const [arcName, setArcName] = useState('');
  const [missionType, setMissionType] = useState('Investigação');
  const [numActs, setNumActs] = useState(3);
  const [scenesPerAct, setScenesPerAct] = useState(2);
  const [customInstructions, setCustomInstructions] = useState('');
  const [generating, setGenerating] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const [stepDetail, setStepDetail] = useState('');
  const { userProfile } = useAuth();

  const handleGenerate = async () => {
    if (!arcName.trim()) {
      alert('Por favor, defina um nome para o arco');
      return;
    }
    if (!userProfile?.aiConfig) {
      alert('Configure sua chave de IA no Perfil antes de usar esta funcionalidade.');
      return;
    }

    setGenerating(true);
    setCurrentStep(0);
    setStepDetail('Criando visão geral do arco...');

    try {
      const contextBlock = buildContextBlock({ description, hooks, answers5W2H, npcs, existingArcs });
      const userAIConfig = userProfile.aiConfig;

      // ── STEP 1: Arc Overview ──
      const arcOverview = await generateArcOverview({
        arcName, missionType, numActs, scenesPerAct,
        systemRpg, setting, customInstructions, contextBlock, userAIConfig
      });

      if (!arcOverview?.name) throw new Error('Falha ao gerar a visão geral do arco. Tente novamente.');

      // ── STEP 2: Acts Structure ──
      setCurrentStep(1);
      setStepDetail(`Estruturando ${numActs} atos...`);

      let acts = await generateActsStructure({
        arcOverview, numActs, scenesPerAct, missionType,
        systemRpg, setting, contextBlock, userAIConfig
      });

      if (!acts || acts.length === 0) throw new Error('Falha ao gerar a estrutura dos atos. Tente novamente.');

      // Normalize and ensure correct count
      acts = acts.map(normalizeAct);
      if (acts.length > numActs) acts = acts.slice(0, numActs);

      // ── STEP 3: Scenes for each act ──
      setCurrentStep(2);

      for (let i = 0; i < acts.length; i++) {
        setStepDetail(`Criando cenas do Ato ${i + 1} de ${acts.length}: "${acts[i].title}"...`);

        const previousActsSummary = i > 0
          ? acts.slice(0, i).map((a, idx) =>
              `Ato ${idx + 1} "${a.title}": ${a.description.substring(0, 150)}`
            ).join('\n')
          : '';

        const scenes = await generateScenesForAct({
          actData: acts[i], actIndex: i, numActs: acts.length, scenesPerAct,
          arcOverview, previousActsSummary, systemRpg, setting, contextBlock, userAIConfig
        });

        acts[i].scenes = scenes.length > 0 ? scenes : acts[i].scenes;
      }

      // ── Assemble Final Arc ──
      const finalArc = {
        name: arcOverview.name,
        description: arcOverview.description || '',
        arc_objective: arcOverview.arc_objective || '',
        world_change: arcOverview.world_change || '',
        arc_villain: arcOverview.arc_villain || '',
        tone_and_themes: arcOverview.tone_and_themes || '',
        stakes: arcOverview.stakes || '',
        future_hooks: Array.isArray(arcOverview.future_hooks) ? arcOverview.future_hooks : [],
        acts
      };

      await onArcGenerated(finalArc);
      setArcName('');
      setCustomInstructions('');
    } catch (error) {
      console.error('Erro ao gerar arco:', error);
      alert('Erro ao gerar arco: ' + (error.message || 'Erro desconhecido'));
    } finally {
      setGenerating(false);
      setCurrentStep(-1);
      setStepDetail('');
    }
  };

  return (
    <Card className="bg-slate-900/50 backdrop-blur-xl border-purple-900/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Sparkles className="w-6 h-6 text-purple-400" />
          Criar Novo Arco Narrativo
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label className="text-slate-300">Nome do Arco *</Label>
          <Input
            value={arcName}
            onChange={(e) => setArcName(e.target.value)}
            placeholder="Ex: O Segredo das Ruínas Antigas"
            className="bg-slate-950/50 border-slate-700 text-white mt-2"
          />
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <Label className="text-slate-300">Tipo de Missão</Label>
            <Select value={missionType} onValueChange={setMissionType}>
              <SelectTrigger className="bg-slate-950/50 border-slate-700 text-white mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MISSION_TYPES.map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-slate-300">Número de Atos</Label>
            <Input
              type="number" min="2" max="6" value={numActs}
              onChange={(e) => setNumActs(parseInt(e.target.value) || 3)}
              className="bg-slate-950/50 border-slate-700 text-white mt-2"
            />
          </div>
          <div>
            <Label className="text-slate-300">Cenas por Ato</Label>
            <Input
              type="number" min="1" max="5" value={scenesPerAct}
              onChange={(e) => setScenesPerAct(parseInt(e.target.value) || 2)}
              className="bg-slate-950/50 border-slate-700 text-white mt-2"
            />
          </div>
        </div>

        <div>
          <Label className="text-slate-300">Instruções Específicas (Opcional)</Label>
          <Textarea
            value={customInstructions}
            onChange={(e) => setCustomInstructions(e.target.value)}
            placeholder="Ex: Incluir elementos de horror, focar em dilemas morais, referência ao arco anterior..."
            className="bg-slate-950/50 border-slate-700 text-white mt-2"
          />
        </div>

        {/* ── Progress Indicator ── */}
        {generating && (
          <div className="bg-slate-950/70 border border-purple-500/30 rounded-lg p-4 space-y-3">
            <p className="text-sm text-purple-300 font-semibold">Gerando arco em múltiplas etapas...</p>
            <div className="space-y-2">
              {GENERATION_STEPS.map((step, idx) => (
                <div key={step.id} className="flex items-center gap-3">
                  {currentStep > idx ? (
                    <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
                  ) : currentStep === idx ? (
                    <Loader2 className="w-4 h-4 text-purple-400 animate-spin flex-shrink-0" />
                  ) : (
                    <Circle className="w-4 h-4 text-slate-600 flex-shrink-0" />
                  )}
                  <span className={`text-sm ${currentStep === idx ? 'text-purple-300 font-medium' : currentStep > idx ? 'text-green-400/70' : 'text-slate-600'}`}>
                    {step.label}
                  </span>
                  {currentStep === idx && (
                    <Badge className="bg-purple-600/20 text-purple-300 border-purple-500/30 text-xs ml-auto">
                      Em progresso
                    </Badge>
                  )}
                </div>
              ))}
            </div>
            {stepDetail && (
              <p className="text-xs text-slate-400 italic mt-2">{stepDetail}</p>
            )}
          </div>
        )}

        <Button
          onClick={handleGenerate}
          disabled={generating || !arcName.trim()}
          className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600"
        >
          {generating ? (
            <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Gerando arco ({GENERATION_STEPS[currentStep]?.label || '...'})</>
          ) : (
            <><BookOpen className="w-5 h-5 mr-2" />Gerar Arco: {arcName || 'Defina um nome'}</>
          )}
        </Button>
        <p className="text-xs text-slate-500 text-center">
          Será gerado: {numActs} atos × {scenesPerAct} cenas = {numActs * scenesPerAct} cenas totais
          {generating && ' — O processo usa múltiplas chamadas de IA para máxima qualidade'}
        </p>
      </CardContent>
    </Card>
  );
}
