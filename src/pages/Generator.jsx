import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { useAuth } from '@/lib/AuthContext';
import { Campaign, CampaignStep, NpcCreature, RpgSystem, AiAgent } from '@/firebase/db';
import { invokeLLM } from '@/lib/aiClient';
import {
  AGENT_IDS,
  QUESTION_KEY_TO_AGENT,
  DEFAULT_AGENTS,
  buildPrompt,
  getAgentConfig
} from '@/lib/aiAgents';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import QuestionCard from '../components/generator/QuestionCard';
import ProgressBar from '../components/generator/ProgressBar';
import { Wand2, ArrowLeft, Sparkles, Loader2, CheckCircle, Circle, Zap } from 'lucide-react';

const QUESTIONS_5W2H = [
  {
    key: 'what',
    title: 'O Quê? (What)',
    description: 'Qual é o conflito principal da aventura?',
    placeholder: 'Ex: Uma antiga relíquia foi roubada e ameaça despertar um mal ancestral...',
    examples: [
      'Um culto está tentando invocar um demônio',
      'A cidade está sendo atacada por criaturas desconhecidas',
      'Um artefato mágico está corrompendo a região'
    ]
  },
  {
    key: 'why',
    title: 'Por Quê? (Why)',
    description: 'Qual a motivação dos vilões ou do mundo?',
    placeholder: 'Ex: O vilão busca vingança contra aqueles que o traíram...',
    examples: [
      'Vingança pessoal contra uma organização',
      'Poder absoluto através de magia proibida',
      'Sobrevivência em um mundo hostil'
    ]
  },
  {
    key: 'where',
    title: 'Onde? (Where)',
    description: 'Onde a ação começa?',
    placeholder: 'Ex: Em uma pequena vila nas montanhas, cercada por florestas antigas...',
    examples: [
      'Uma metrópole cyberpunk cheia de neon',
      'Ruínas de uma civilização perdida',
      'Uma estação espacial isolada'
    ]
  },
  {
    key: 'when',
    title: 'Quando? (When)',
    description: 'Em que período/época dentro da ambientação?',
    placeholder: 'Ex: Durante um eclipse lunar, quando as barreiras entre mundos enfraquecem...',
    examples: [
      'No auge de uma guerra civil',
      'Cem anos após um apocalipse',
      'Durante um festival importante'
    ]
  },
  {
    key: 'who',
    title: 'Quem? (Who)',
    description: 'Quem são as figuras centrais (aliados/inimigos)?',
    placeholder: 'Ex: Um senhor da guerra corrupto, um sábio misterioso, uma ladina rebelde...',
    examples: [
      'Um mentor traidor, um aliado improvável',
      'Uma corporação corrupta e seus executores',
      'Um culto fanático liderado por um profeta'
    ]
  },
  {
    key: 'how',
    title: 'Como? (How)',
    description: 'Como os jogadores se envolveram?',
    placeholder: 'Ex: Foram contratados por um nobre desesperado...',
    examples: [
      'Testemunharam um crime e foram perseguidos',
      'Receberam uma mensagem de alguém próximo',
      'Estavam no lugar errado na hora errada'
    ]
  },
  {
    key: 'how_much',
    title: 'Quanto? (How Much)',
    description: 'Qual o nível de letalidade e complexidade esperada?',
    placeholder: 'Ex: Alta letalidade, conspiração complexa com múltiplas facções...',
    examples: [
      'Baixa letalidade, foco em investigação',
      'Alta intensidade, combates frequentes',
      'Média complexidade, mistério central'
    ]
  }
];

const DEFAULT_SYSTEMS = ['D&D 5e', 'Pathfinder 2e', 'Call of Cthulhu', 'Vampire: The Masquerade', 'Savage Worlds', 'GURPS', 'Outro'];

const CREATIVITY_LABELS = ['Totalmente Fiel', 'Muito Fiel', 'Equilibrado', 'Criativo', 'Muito Criativo', 'Liberdade Total'];
const CREATIVITY_INSTRUCTIONS = [
  'Siga estritamente as informações fornecidas, sem adicionar elementos extras.',
  'Siga as informações com pequenos detalhes adicionais.',
  'Use as informações como base e adicione elementos criativos moderados.',
  'Tenha liberdade para expandir as ideias com criatividade.',
  'Crie conteúdo muito além do básico, com reviravoltas inesperadas.',
  'Tenha liberdade total para criar, usando as respostas apenas como inspiração.'
];

export default function Generator() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const campaignId = searchParams.get('id');
  const { user, userProfile, isAdmin } = useAuth();

  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [aiFillingKey, setAiFillingKey] = useState(null); // chave da pergunta sendo preenchida por IA
  const [aiFillingAll, setAiFillingAll] = useState(false);
  const [aiFillingProgress, setAiFillingProgress] = useState(-1);
  const [availableSystems, setAvailableSystems] = useState(DEFAULT_SYSTEMS);
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    title: '',
    system_rpg: 'D&D 5e',
    setting: 'Fantasia Medieval',
    duration_type: 'One-shot',
    players_count: 4
  });
  const [answers, setAnswers] = useState({});
  const [creativityLevel, setCreativityLevel] = useState(2);
  const [activeCampaignId, setActiveCampaignId] = useState(campaignId);

  // Overrides de prompts dos agentes (carregados do Firestore, apenas para admin)
  const [agentOverrides, setAgentOverrides] = useState({});

  // Carrega sistemas disponíveis
  useEffect(() => {
    const loadSystems = async () => {
      if (!user) return;
      try {
        const systems = await RpgSystem.list(user.uid);
        if (systems.length > 0) {
          setAvailableSystems(systems.map(s => s.name));
        }
      } catch (err) {
        console.error('Erro ao carregar sistemas:', err);
      }
    };
    loadSystems();
  }, [user]);

  // Carrega overrides dos agentes do Firestore (só para admin)
  useEffect(() => {
    if (!isAdmin) return;
    const loadAgentOverrides = async () => {
      try {
        const map = await AiAgent.loadOverridesMap();
        setAgentOverrides(map);
      } catch (err) {
        console.error('Erro ao carregar configurações dos agentes:', err);
      }
    };
    loadAgentOverrides();
  }, [isAdmin]);

  // Carrega campanha existente se houver ID
  useEffect(() => {
    if (campaignId && user) {
      loadExistingCampaign();
    }
  }, [campaignId, user]);

  const loadExistingCampaign = async () => {
    try {
      const campaign = await Campaign.get(campaignId);
      if (campaign && campaign.userId === user.uid) {
        setFormData({
          title: campaign.title,
          system_rpg: campaign.system_rpg,
          setting: campaign.setting,
          duration_type: campaign.duration_type,
          players_count: campaign.players_count
        });
        setCreativityLevel(campaign.creativity_level || 2);
        setCurrentStep(campaign.current_step || 0);

        const steps = await CampaignStep.listByCampaign(campaignId);
        const answersObj = {};
        steps.forEach(step => {
          answersObj[step.question_key] = step.user_answer;
        });
        setAnswers(answersObj);
      }
    } catch (err) {
      console.error('Erro ao carregar campanha:', err);
    }
  };

  const handleInitialSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (activeCampaignId) {
        await Campaign.update(activeCampaignId, { ...formData, current_step: 1 });
      } else {
        const newCampaign = await Campaign.create({
          ...formData,
          current_step: 1,
          creativity_level: creativityLevel,
          is_completed: false,
          is_public: false,
          userId: user.uid
        });
        setActiveCampaignId(newCampaign.id);
      }
      setCurrentStep(1);
    } catch (err) {
      console.error('Erro ao criar campanha:', err);
      alert('Erro ao criar campanha. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSubmit = async () => {
    if (!activeCampaignId) return;
    setLoading(true);
    const currentQuestion = QUESTIONS_5W2H[currentStep - 1];
    const answer = answers[currentQuestion.key] || '';

    try {
      await CampaignStep.upsert(activeCampaignId, currentQuestion.key, {
        question_text: currentQuestion.title,
        user_answer: answer,
        order_index: currentStep
      });
      await Campaign.update(activeCampaignId, { current_step: currentStep + 1 });

      if (currentStep < 7) {
        setCurrentStep(currentStep + 1);
      } else {
        setCurrentStep(8);
      }
    } catch (err) {
      console.error('Erro ao salvar resposta:', err);
      alert('Erro ao salvar resposta. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // ─── Auto-fill com IA (admin only) ──────────────────────────────────────────
  const handleAiFillQuestion = async (questionKey) => {
    if (!userProfile?.aiConfig) {
      alert('Configure sua chave de IA no Perfil antes de usar o auto-preenchimento.\n\nAcesse: Perfil → Configuração de IA');
      return;
    }

    setAiFillingKey(questionKey);
    try {
      const agentId = QUESTION_KEY_TO_AGENT[questionKey];
      const config = getAgentConfig(agentId, agentOverrides);

      // Monta contexto das respostas anteriores
      const previousAnswers = QUESTIONS_5W2H
        .filter(q => q.key !== questionKey && String(answers[q.key] ?? '').trim())
        .map(q => `${q.title}: ${String(answers[q.key] ?? '')}`)
        .join('\n');

      const prompt = buildPrompt(config.promptTemplate, {
        system: formData.system_rpg,
        setting: formData.setting,
        duration: formData.duration_type,
        players: formData.players_count,
        title: formData.title,
        question_title: QUESTIONS_5W2H.find(q => q.key === questionKey)?.title || '',
        question_description: QUESTIONS_5W2H.find(q => q.key === questionKey)?.description || '',
        previous_answers: previousAnswers || 'Nenhuma resposta anterior ainda.'
      });

      const result = await invokeLLM({
        prompt,
        responseSchema: {
          type: 'object',
          properties: { answer: { type: 'string' } },
          required: ['answer']
        },
        userAIConfig: userProfile.aiConfig,
        systemPrompt: config.systemPrompt,
        temperature: config.temperature
      });

      if (result?.answer != null) {
        setAnswers(prev => ({ ...prev, [questionKey]: String(result.answer) }));
      }
    } catch (err) {
      console.error('Erro ao gerar resposta com IA:', err);
      alert(`Erro ao gerar resposta: ${err.message}`);
    } finally {
      setAiFillingKey(null);
    }
  };

  // ─── Preencher TODAS as respostas com IA (admin only) ──────────────────────
  const handleAiFillAll = async () => {
    if (!userProfile?.aiConfig) {
      alert('Configure sua chave de IA no Perfil antes de usar o auto-preenchimento.\n\nAcesse: Perfil → Configuração de IA');
      return;
    }

    // Garante que a campanha existe antes de começar
    let campaignIdToUse = activeCampaignId;
    if (!campaignIdToUse) {
      try {
        const newCampaign = await Campaign.create({
          ...formData,
          current_step: 1,
          creativity_level: creativityLevel,
          is_completed: false,
          is_public: false,
          userId: user.uid
        });
        campaignIdToUse = newCampaign.id;
        setActiveCampaignId(newCampaign.id);
      } catch (err) {
        alert('Erro ao criar campanha. Tente novamente.');
        return;
      }
    }

    setAiFillingAll(true);
    setAiFillingProgress(0);

    const newAnswers = {};

    try {
      for (let i = 0; i < QUESTIONS_5W2H.length; i++) {
        setAiFillingProgress(i);
        const question = QUESTIONS_5W2H[i];
        const agentId = QUESTION_KEY_TO_AGENT[question.key];
        const config = getAgentConfig(agentId, agentOverrides);

        // Constrói contexto das respostas anteriores (já geradas pela IA)
        const previousAnswers = QUESTIONS_5W2H
          .slice(0, i)
          .filter(q => String(newAnswers[q.key] ?? '').trim())
          .map(q => `${q.title}: ${String(newAnswers[q.key] ?? '')}`)
          .join('\n');

        const prompt = buildPrompt(config.promptTemplate, {
          system: formData.system_rpg,
          setting: formData.setting,
          duration: formData.duration_type,
          players: formData.players_count,
          title: formData.title,
          question_title: question.title,
          question_description: question.description,
          previous_answers: previousAnswers || 'Nenhuma resposta anterior ainda.'
        });

        const result = await invokeLLM({
          prompt,
          responseSchema: {
            type: 'object',
            properties: { answer: { type: 'string' } },
            required: ['answer']
          },
          userAIConfig: userProfile.aiConfig,
          systemPrompt: config.systemPrompt,
          temperature: config.temperature
        });

        if (result?.answer != null) {
          newAnswers[question.key] = String(result.answer);
        }
      }

      // Atualiza todas as respostas no estado local
      setAnswers(newAnswers);

      // Salva todas as etapas no Firestore
      for (let i = 0; i < QUESTIONS_5W2H.length; i++) {
        const question = QUESTIONS_5W2H[i];
        if (newAnswers[question.key]) {
          await CampaignStep.upsert(campaignIdToUse, question.key, {
            question_text: question.title,
            user_answer: newAnswers[question.key],
            order_index: i + 1
          });
        }
      }

      // Pula direto para a etapa 8 (nível de criatividade)
      await Campaign.update(campaignIdToUse, { current_step: 8 });
      setCurrentStep(8);
    } catch (err) {
      console.error('Erro ao preencher todas as respostas com IA:', err);
      // Mantém as respostas parciais
      setAnswers(prev => ({ ...prev, ...newAnswers }));
      alert(`Erro ao preencher respostas: ${err.message}\n\nAlgumas respostas podem ter sido preenchidas parcialmente.`);
    } finally {
      setAiFillingAll(false);
      setAiFillingProgress(-1);
    }
  };

  // ─── Geração final da campanha ───────────────────────────────────────────────
  const handleFinalGeneration = async () => {
    if (!activeCampaignId) return;

    if (!userProfile?.aiConfig) {
      alert('Configure sua chave de IA no Perfil antes de gerar campanhas.\n\nAcesse: Perfil → Configuração de IA');
      return;
    }

    setGenerating(true);
    try {
      await Campaign.update(activeCampaignId, { creativity_level: creativityLevel });

      const steps = await CampaignStep.listByCampaign(activeCampaignId);
      if (!steps || steps.length === 0) {
        throw new Error('Nenhuma resposta encontrada. Complete as 7 perguntas primeiro.');
      }

      const answersText = steps
        .sort((a, b) => a.order_index - b.order_index)
        .map(s => `${s.question_text}: ${s.user_answer}`)
        .join('\n');

      // Carrega config do agente de geração final (com override do admin se existir)
      const genConfig = getAgentConfig(AGENT_IDS.CAMPAIGN_GENERATOR, agentOverrides);

      const prompt = buildPrompt(genConfig.promptTemplate, {
        system: formData.system_rpg,
        setting: formData.setting,
        duration: formData.duration_type,
        players: formData.players_count,
        answers: answersText,
        creativity_level: creativityLevel,
        creativity_instructions: CREATIVITY_INSTRUCTIONS[creativityLevel]
      });

      const result = await invokeLLM({
        prompt,
        responseSchema: {
          type: 'object',
          properties: {
            adventure_summary: { type: 'string' },
            plot_hooks: { type: 'array', items: { type: 'string' } },
            npcs: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  role: { type: 'string' },
                  motivation: { type: 'string' },
                  description: { type: 'string' }
                },
                required: ['name', 'role', 'description']
              }
            },
            encounters: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  difficulty: { type: 'string' },
                  description: { type: 'string' },
                  creatures: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        name: { type: 'string' },
                        quantity: { type: 'integer' }
                      },
                      required: ['name', 'quantity']
                    }
                  }
                },
                required: ['name', 'difficulty', 'description']
              }
            }
          },
          required: ['adventure_summary', 'plot_hooks', 'npcs', 'encounters']
        },
        userAIConfig: userProfile.aiConfig,
        systemPrompt: genConfig.systemPrompt,
        temperature: genConfig.temperature
      });

      const normalizedResult = {
        adventure_summary: result.adventure_summary || 'Sem resumo disponível',
        plot_hooks: Array.isArray(result.plot_hooks) ? result.plot_hooks : [],
        npcs: Array.isArray(result.npcs) ? result.npcs : [],
        encounters: Array.isArray(result.encounters) ? result.encounters : []
      };

      const answersForContext = steps
        .sort((a, b) => a.order_index - b.order_index)
        .reduce((acc, s) => {
          acc[s.question_key] = s.user_answer;
          return acc;
        }, {});

      await Campaign.update(activeCampaignId, {
        content_json: normalizedResult,
        answers_5w2h: answersText,
        answers_5w2h_map: answersForContext,
        is_completed: true,
        current_step: 8
      });

      if (normalizedResult.npcs.length > 0) {
        await Promise.all(
          normalizedResult.npcs
            .filter(npc => npc && npc.name)
            .map(npc =>
              NpcCreature.create({
                campaignId: activeCampaignId,
                name: npc.name,
                type: 'NPC',
                role: npc.role || 'Personagem',
                motivation: npc.motivation || 'Não especificada',
                description: npc.description || 'Sem descrição',
                stats_json: {}
              })
            )
        );
      }

      navigate(createPageUrl('CampaignView') + '?id=' + activeCampaignId);
    } catch (err) {
      console.error('Erro ao gerar campanha:', err);
      alert(`Erro: ${err.message}\n\nTente novamente ou ajuste suas respostas.`);
    } finally {
      setGenerating(false);
    }
  };

  // ─── Etapa 0: Formulário inicial ─────────────────────────────────────────────
  if (currentStep === 0) {
    return (
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => navigate(createPageUrl('Dashboard'))}
          className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Voltar ao Dashboard
        </button>
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Wand2 className="w-10 h-10 text-purple-400" />
            <h1 className="text-4xl font-bold text-white">Novo Gerador de Campanha</h1>
          </div>
          <p className="text-slate-400 text-lg">
            Vamos começar definindo os parâmetros básicos da sua aventura
          </p>
        </div>
        <form onSubmit={handleInitialSubmit} className="space-y-6">
          <div className="p-8 bg-slate-900/50 backdrop-blur-xl border border-purple-900/20 rounded-2xl space-y-6">
            <div>
              <Label htmlFor="title" className="text-white mb-2 block">Título da Campanha *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Ex: A Maldição do Templo Esquecido"
                required
                className="bg-slate-950/50 border-slate-700 text-white"
              />
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <Label className="text-white mb-2 block">Sistema de RPG *</Label>
                <Select value={formData.system_rpg} onValueChange={(value) => setFormData({ ...formData, system_rpg: value })}>
                  <SelectTrigger className="bg-slate-950/50 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableSystems.map((system) => (
                      <SelectItem key={system} value={system}>{system}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-white mb-2 block">Ambientação *</Label>
                <Select value={formData.setting} onValueChange={(value) => setFormData({ ...formData, setting: value })}>
                  <SelectTrigger className="bg-slate-950/50 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Fantasia Medieval">Fantasia Medieval</SelectItem>
                    <SelectItem value="Cyberpunk">Cyberpunk</SelectItem>
                    <SelectItem value="Pós-Apocalíptico">Pós-Apocalíptico</SelectItem>
                    <SelectItem value="Terror/Horror">Terror/Horror</SelectItem>
                    <SelectItem value="Investigação">Investigação</SelectItem>
                    <SelectItem value="Espacial/Sci-Fi">Espacial/Sci-Fi</SelectItem>
                    <SelectItem value="Contemporâneo">Contemporâneo</SelectItem>
                    <SelectItem value="Outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-white mb-2 block">Duração *</Label>
                <Select value={formData.duration_type} onValueChange={(value) => setFormData({ ...formData, duration_type: value })}>
                  <SelectTrigger className="bg-slate-950/50 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="One-shot">One-shot</SelectItem>
                    <SelectItem value="Série (4-6 sessões)">Série (4-6 sessões)</SelectItem>
                    <SelectItem value="Campanha Longa">Campanha Longa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-white mb-2 block">Número de Jogadores *</Label>
                <Input
                  type="number"
                  min="1"
                  max="10"
                  value={formData.players_count}
                  onChange={(e) => setFormData({ ...formData, players_count: parseInt(e.target.value) })}
                  required
                  className="bg-slate-950/50 border-slate-700 text-white"
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={loading}
              className="px-8 py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white rounded-xl font-semibold transition-all shadow-lg flex items-center gap-2"
            >
              {loading ? (
                <><Loader2 className="w-5 h-5 animate-spin" />Salvando...</>
              ) : (
                <>Iniciar Interrogatório 5W2H<Sparkles className="w-5 h-5" /></>
              )}
            </Button>
          </div>
        </form>
      </div>
    );
  }

  // ─── Etapas 1–7: Perguntas 5W2H ──────────────────────────────────────────────
  if (currentStep >= 1 && currentStep <= 7) {
    const question = QUESTIONS_5W2H[currentStep - 1];

    // Durante o preenchimento automático total, mostra progresso
    if (aiFillingAll) {
      return (
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">{formData.title}</h1>
            <p className="text-slate-400">{formData.system_rpg} • {formData.setting}</p>
          </div>

          <div className="p-8 bg-slate-900/50 backdrop-blur-xl border border-purple-900/20 rounded-2xl">
            <div className="text-center mb-8">
              <Loader2 className="w-12 h-12 text-purple-400 animate-spin mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white">Preenchendo todas as respostas com IA...</h2>
              <p className="text-slate-400 mt-2">
                Pergunta {aiFillingProgress + 1} de {QUESTIONS_5W2H.length}
              </p>
            </div>

            <div className="space-y-2">
              {QUESTIONS_5W2H.map((q, i) => (
                <div
                  key={q.key}
                  className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                    i < aiFillingProgress
                      ? 'bg-green-900/20 border border-green-500/20'
                      : i === aiFillingProgress
                        ? 'bg-purple-900/20 border border-purple-500/30'
                        : 'bg-slate-800/30 border border-transparent'
                  }`}
                >
                  {i < aiFillingProgress ? (
                    <CheckCircle className="w-5 h-5 text-green-400 shrink-0" />
                  ) : i === aiFillingProgress ? (
                    <Loader2 className="w-5 h-5 text-purple-400 animate-spin shrink-0" />
                  ) : (
                    <Circle className="w-5 h-5 text-slate-600 shrink-0" />
                  )}
                  <span className={`text-sm font-medium ${
                    i < aiFillingProgress ? 'text-green-300' :
                    i === aiFillingProgress ? 'text-purple-300' : 'text-slate-500'
                  }`}>
                    {q.title}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => currentStep === 1 ? setCurrentStep(0) : setCurrentStep(currentStep - 1)}
          className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Voltar
        </button>
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">{formData.title}</h1>
          <p className="text-slate-400">{formData.system_rpg} • {formData.setting}</p>
        </div>
        <ProgressBar currentStep={currentStep - 1} totalSteps={7} />

        {/* Botão "Preencher Tudo com IA" — admin only */}
        {isAdmin && (
          <div className="mb-6 p-4 bg-gradient-to-r from-amber-900/20 to-purple-900/20 border border-amber-500/20 rounded-xl flex items-center justify-between gap-4">
            <div>
              <p className="text-amber-200 font-semibold text-sm">Modo Admin</p>
              <p className="text-slate-400 text-xs mt-0.5">
                Preenche automaticamente todas as 7 perguntas do 5W2H com IA e avança para a geração final.
              </p>
            </div>
            <Button
              type="button"
              onClick={handleAiFillAll}
              disabled={aiFillingAll || loading}
              className="shrink-0 flex items-center gap-2 bg-gradient-to-r from-amber-600 to-purple-600 hover:from-amber-500 hover:to-purple-500 text-white font-semibold shadow-lg"
            >
              <Zap className="w-4 h-4" />
              Preencher Tudo com IA
            </Button>
          </div>
        )}

        <QuestionCard
          question={question}
          answer={answers[question.key] || ''}
          onChange={(value) => setAnswers({ ...answers, [question.key]: value })}
          onNext={handleAnswerSubmit}
          isLoading={loading}
          onAiFill={isAdmin ? () => handleAiFillQuestion(question.key) : undefined}
          isAiFilling={aiFillingKey === question.key}
        />
      </div>
    );
  }

  // ─── Etapa 8: Nível de criatividade ──────────────────────────────────────────
  if (currentStep === 8) {
    return (
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => setCurrentStep(7)}
          className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Voltar
        </button>
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Nível de Criatividade</h1>
          <p className="text-slate-400 text-lg">
            Escolha quanta liberdade criativa a IA terá ao gerar sua campanha
          </p>
        </div>
        <div className="p-8 bg-slate-900/50 backdrop-blur-xl border border-purple-900/20 rounded-2xl space-y-8">
          <div>
            <div className="flex justify-between items-center mb-4">
              <Label className="text-white text-lg">
                Nível: <span className="text-purple-400 font-bold">{creativityLevel}</span>
              </Label>
              <span className="text-sm text-slate-400">
                {CREATIVITY_LABELS[creativityLevel]}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="5"
              value={creativityLevel}
              onChange={(e) => setCreativityLevel(parseInt(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-600"
            />
            <div className="flex justify-between text-xs text-slate-500 mt-2">
              {[0, 1, 2, 3, 4, 5].map(n => <span key={n}>{n}</span>)}
            </div>
          </div>
          <div className="p-6 bg-purple-900/10 border border-purple-500/20 rounded-lg">
            <h3 className="text-white font-semibold mb-2">{CREATIVITY_LABELS[creativityLevel]}</h3>
            <p className="text-slate-400 text-sm">{CREATIVITY_INSTRUCTIONS[creativityLevel]}</p>
          </div>

          {!userProfile?.aiConfig && (
            <div className="p-4 bg-amber-900/20 border border-amber-500/30 rounded-lg">
              <p className="text-amber-300 text-sm">
                ⚠️ Configure sua chave de IA no{' '}
                <button
                  onClick={() => navigate(createPageUrl('Profile'))}
                  className="underline hover:text-amber-200"
                >
                  Perfil
                </button>{' '}
                antes de gerar a campanha.
              </p>
            </div>
          )}
        </div>
        <div className="mt-8 flex justify-end">
          <Button
            onClick={handleFinalGeneration}
            disabled={generating}
            className="px-10 py-4 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white rounded-xl font-bold text-lg transition-all shadow-lg shadow-purple-500/30 flex items-center gap-3"
          >
            {generating ? (
              <><Loader2 className="w-6 h-6 animate-spin" />Gerando sua campanha...</>
            ) : (
              <><Sparkles className="w-6 h-6" />Gerar Campanha Completa</>
            )}
          </Button>
        </div>
      </div>
    );
  }

  return null;
}
