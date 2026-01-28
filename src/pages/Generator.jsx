import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import QuestionCard from '../components/generator/QuestionCard';
import ProgressBar from '../components/generator/ProgressBar';
import { Wand2, ArrowLeft, Sparkles, Loader2 } from 'lucide-react';

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

export default function Generator() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const campaignId = searchParams.get('id');

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [availableSystems, setAvailableSystems] = useState([]);
  
  // Etapa atual: 0 = inicial, 1-7 = perguntas, 8 = criatividade, 9 = gerando
  const [currentStep, setCurrentStep] = useState(0);
  
  // Dados do formulário inicial
  const [formData, setFormData] = useState({
    title: '',
    system_rpg: 'D&D 5e',
    setting: 'Fantasia Medieval',
    duration_type: 'One-shot',
    players_count: 4
  });

  // Respostas das perguntas
  const [answers, setAnswers] = useState({});
  
  // Nível de criatividade
  const [creativityLevel, setCreativityLevel] = useState(2);

  // ID da campanha sendo criada/editada
  const [activeCampaignId, setActiveCampaignId] = useState(campaignId);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (error) {
        await base44.auth.redirectToLogin(createPageUrl('Generator'));
      }
    };
    loadUser();
  }, []);

  useEffect(() => {
    const loadSystems = async () => {
      try {
        const systems = await base44.entities.RpgSystem.filter({ is_active: true });
        setAvailableSystems(systems);
      } catch (error) {
        console.error('Erro ao carregar sistemas:', error);
      }
    };
    loadSystems();
  }, []);

  useEffect(() => {
    // Carregar campanha existente se houver ID
    if (campaignId && user) {
      loadExistingCampaign();
    }
  }, [campaignId, user]);

  const loadExistingCampaign = async () => {
    try {
      const campaigns = await base44.entities.Campaign.list();
      const campaign = campaigns.find(c => c.id === campaignId);
      
      if (campaign && campaign.created_by === user.email) {
        setFormData({
          title: campaign.title,
          system_rpg: campaign.system_rpg,
          setting: campaign.setting,
          duration_type: campaign.duration_type,
          players_count: campaign.players_count
        });
        setCreativityLevel(campaign.creativity_level);
        setCurrentStep(campaign.current_step);

        // Carregar respostas existentes
        const steps = await base44.entities.CampaignStep.filter({ campaign_id: campaignId });
        const answersObj = {};
        steps.forEach(step => {
          answersObj[step.question_key] = step.user_answer;
        });
        setAnswers(answersObj);
      }
    } catch (error) {
      console.error('Erro ao carregar campanha:', error);
    }
  };

  const handleInitialSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (activeCampaignId) {
        // Atualizar campanha existente
        await base44.entities.Campaign.update(activeCampaignId, {
          ...formData,
          current_step: 1
        });
      } else {
        // Criar nova campanha
        const newCampaign = await base44.entities.Campaign.create({
          ...formData,
          current_step: 1,
          creativity_level: creativityLevel,
          is_completed: false,
          is_public: false
        });
        setActiveCampaignId(newCampaign.id);
      }
      
      setCurrentStep(1);
    } catch (error) {
      console.error('Erro ao criar campanha:', error);
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
      // Salvar resposta
      const existingSteps = await base44.entities.CampaignStep.filter({
        campaign_id: activeCampaignId,
        question_key: currentQuestion.key
      });

      if (existingSteps.length > 0) {
        await base44.entities.CampaignStep.update(existingSteps[0].id, {
          user_answer: answer
        });
      } else {
        await base44.entities.CampaignStep.create({
          campaign_id: activeCampaignId,
          question_key: currentQuestion.key,
          question_text: currentQuestion.title,
          user_answer: answer,
          order_index: currentStep
        });
      }

      // Atualizar progresso
      await base44.entities.Campaign.update(activeCampaignId, {
        current_step: currentStep + 1
      });

      if (currentStep < 7) {
        setCurrentStep(currentStep + 1);
      } else {
        setCurrentStep(8); // Etapa de criatividade
      }
    } catch (error) {
      console.error('Erro ao salvar resposta:', error);
      alert('Erro ao salvar resposta. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleFinalGeneration = async () => {
    if (!activeCampaignId) return;
    
    setGenerating(true);

    try {
      // Atualizar nível de criatividade
      await base44.entities.Campaign.update(activeCampaignId, {
        creativity_level: creativityLevel
      });

      // Buscar todas as respostas
      const steps = await base44.entities.CampaignStep.filter({
        campaign_id: activeCampaignId
      });

      if (!steps || steps.length === 0) {
        throw new Error('Nenhuma resposta encontrada. Complete as 7 perguntas primeiro.');
      }

      const answersText = steps
        .sort((a, b) => a.order_index - b.order_index)
        .map(s => `${s.question_text}: ${s.user_answer}`)
        .join('\n');

      // Criar prompt estruturado
      const prompt = `Você é um mestre de RPG criando uma campanha para ${formData.system_rpg}.

Ambientação: ${formData.setting}
Duração: ${formData.duration_type}
Jogadores: ${formData.players_count}

Informações da campanha:
${answersText}

Crie uma campanha completa com resumo narrativo, 3 ganchos de aventura, NPCs interessantes e encontros balanceados.`;

      // Schema JSON COMPLETO e VÁLIDO
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: prompt,
        response_json_schema: {
          type: 'object',
          properties: {
            adventure_summary: { 
              type: 'string',
              description: 'Resumo completo da aventura'
            },
            plot_hooks: { 
              type: 'array',
              description: 'Lista de ganchos de aventura',
              items: { 
                type: 'string' 
              }
            },
            npcs: { 
              type: 'array',
              description: 'Lista de NPCs importantes',
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
              description: 'Lista de encontros',
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
        }
      });

      // Validar e normalizar resultado
      if (!result || typeof result !== 'object') {
        throw new Error('Resposta inválida da IA. Tente novamente.');
      }

      // Garantir estrutura mínima
      const normalizedResult = {
        adventure_summary: result.adventure_summary || 'Sem resumo disponível',
        plot_hooks: Array.isArray(result.plot_hooks) ? result.plot_hooks : [],
        npcs: Array.isArray(result.npcs) ? result.npcs : [],
        encounters: Array.isArray(result.encounters) ? result.encounters : []
      };

      // Salvar resultado normalizado
      await base44.entities.Campaign.update(activeCampaignId, {
        content_json: normalizedResult,
        is_completed: true,
        current_step: 8
      });

      // Criar registros de NPCs com validação
      if (normalizedResult.npcs.length > 0) {
        const npcPromises = normalizedResult.npcs
          .filter(npc => npc && typeof npc === 'object' && npc.name)
          .map(npc => 
            base44.entities.NpcCreature.create({
              campaign_id: activeCampaignId,
              name: npc.name,
              type: 'NPC',
              role: npc.role || 'Personagem',
              motivation: npc.motivation || 'Não especificada',
              description: npc.description || 'Sem descrição',
              stats_json: (npc.stats && typeof npc.stats === 'object') ? npc.stats : {}
            })
          );
        
        if (npcPromises.length > 0) {
          await Promise.all(npcPromises);
        }
      }

      // Redirecionar para visualização
      navigate(createPageUrl('CampaignView') + '?id=' + activeCampaignId);
    } catch (error) {
      console.error('Erro detalhado:', error);
      const errorMessage = error.message || 'Erro desconhecido ao gerar campanha';
      alert(`Erro: ${errorMessage}\n\nTente novamente ou ajuste suas respostas.`);
    } finally {
      setGenerating(false);
    }
  };

  // Etapa 0: Formulário inicial
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
            <h1 className="text-4xl font-bold text-white">
              Novo Gerador de Campanha
            </h1>
          </div>
          <p className="text-slate-400 text-lg">
            Vamos começar definindo os parâmetros básicos da sua aventura
          </p>
        </div>

        <form onSubmit={handleInitialSubmit} className="space-y-6">
          <div className="p-8 bg-slate-900/50 backdrop-blur-xl border border-purple-900/20 rounded-2xl space-y-6">
            <div>
              <Label htmlFor="title" className="text-white mb-2 block">
                Título da Campanha *
              </Label>
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
                <Label htmlFor="system" className="text-white mb-2 block">
                  Sistema de RPG *
                </Label>
                <Select
                  value={formData.system_rpg}
                  onValueChange={(value) => setFormData({ ...formData, system_rpg: value })}
                >
                  <SelectTrigger className="bg-slate-950/50 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableSystems.map((system) => (
                      <SelectItem key={system.id} value={system.name}>
                        {system.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="setting" className="text-white mb-2 block">
                  Ambientação *
                </Label>
                <Select
                  value={formData.setting}
                  onValueChange={(value) => setFormData({ ...formData, setting: value })}
                >
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
                <Label htmlFor="duration" className="text-white mb-2 block">
                  Duração *
                </Label>
                <Select
                  value={formData.duration_type}
                  onValueChange={(value) => setFormData({ ...formData, duration_type: value })}
                >
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
                <Label htmlFor="players" className="text-white mb-2 block">
                  Número de Jogadores *
                </Label>
                <Input
                  id="players"
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
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  Iniciar Interrogatório 5W2H
                  <Sparkles className="w-5 h-5" />
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    );
  }

  // Etapas 1-7: Perguntas 5W2H
  if (currentStep >= 1 && currentStep <= 7) {
    const question = QUESTIONS_5W2H[currentStep - 1];
    
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
          <h1 className="text-4xl font-bold text-white mb-2">
            {formData.title}
          </h1>
          <p className="text-slate-400">
            {formData.system_rpg} • {formData.setting}
          </p>
        </div>

        <ProgressBar currentStep={currentStep - 1} totalSteps={7} />

        <QuestionCard
          question={question}
          answer={answers[question.key] || ''}
          onChange={(value) => setAnswers({ ...answers, [question.key]: value })}
          onNext={handleAnswerSubmit}
          isLoading={loading}
        />
      </div>
    );
  }

  // Etapa 8: Nível de criatividade
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
          <h1 className="text-4xl font-bold text-white mb-2">
            Nível de Criatividade
          </h1>
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
                {creativityLevel === 0 && 'Totalmente Fiel'}
                {creativityLevel === 1 && 'Muito Fiel'}
                {creativityLevel === 2 && 'Equilibrado'}
                {creativityLevel === 3 && 'Criativo'}
                {creativityLevel === 4 && 'Muito Criativo'}
                {creativityLevel === 5 && 'Liberdade Total'}
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
              <span>0</span>
              <span>1</span>
              <span>2</span>
              <span>3</span>
              <span>4</span>
              <span>5</span>
            </div>
          </div>

          <div className="p-6 bg-purple-900/10 border border-purple-500/20 rounded-lg">
            <h3 className="text-white font-semibold mb-2">
              {creativityLevel <= 1 && 'Modo Fiel'}
              {creativityLevel === 2 && 'Modo Equilibrado'}
              {creativityLevel === 3 && 'Modo Criativo'}
              {creativityLevel >= 4 && 'Modo Livre'}
            </h3>
            <p className="text-slate-400 text-sm">
              {creativityLevel === 0 && 'A IA seguirá estritamente suas respostas, sem adicionar elementos extras.'}
              {creativityLevel === 1 && 'A IA seguirá suas respostas com pequenos detalhes adicionais.'}
              {creativityLevel === 2 && 'A IA usará suas respostas como base e adicionará elementos criativos moderados.'}
              {creativityLevel === 3 && 'A IA terá liberdade para expandir suas ideias com criatividade.'}
              {creativityLevel === 4 && 'A IA criará conteúdo muito além do básico, com reviravoltas inesperadas.'}
              {creativityLevel === 5 && 'A IA terá liberdade total para criar, usando suas respostas apenas como inspiração.'}
            </p>
          </div>
        </div>

        <div className="mt-8 flex justify-end">
          <Button
            onClick={handleFinalGeneration}
            disabled={generating}
            className="px-10 py-4 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white rounded-xl font-bold text-lg transition-all shadow-lg shadow-purple-500/30 flex items-center gap-3"
          >
            {generating ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" />
                Gerando sua campanha...
              </>
            ) : (
              <>
                <Sparkles className="w-6 h-6" />
                Gerar Campanha Completa
              </>
            )}
          </Button>
        </div>
      </div>
    );
  }

  return null;
}