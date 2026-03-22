import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Zap,
  Users,
  Map,
  Clock,
  Sparkles,
  Loader2
} from 'lucide-react';
import { Campaign, NpcCreature, SessionLog } from '@/firebase/db';
import { invokeLLM } from '@/lib/aiClient';
import { useAuth } from '@/lib/AuthContext';

export default function WorldStateDashboard({ campaignId, isOwner }) {
  const { userProfile } = useAuth();
  const [generatingEvent, setGeneratingEvent] = useState(false);
  const [campaign, setCampaign] = useState(null);
  const [sessionLogs, setSessionLogs] = useState([]);
  const [npcs, setNpcs] = useState([]);

  const loadData = async () => {
    if (!campaignId) return;
    try {
      const [camp, logs, npcList] = await Promise.all([
        Campaign.get(campaignId),
        SessionLog.listByCampaign(campaignId),
        NpcCreature.listByCampaign(campaignId)
      ]);
      setCampaign(camp);
      setSessionLogs(logs);
      setNpcs(npcList);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    }
  };

  useEffect(() => {
    loadData();
  }, [campaignId]);

  const getStakeholderChanges = () => {
    const changes = [];
    sessionLogs.forEach(log => {
      if (log.consequences_json?.stakeholder_changes) {
        log.consequences_json.stakeholder_changes.forEach(change => {
          const stakeholder = npcs.find(n =>
            n.name.toLowerCase().includes((change.stakeholder_name || '').toLowerCase())
          );
          if (stakeholder) {
            changes.push({
              session: log.session_number,
              name: stakeholder.name,
              interestChange: change.interest_change,
              reason: change.reason,
              newInterest: (stakeholder.stats_json?.interest || 0)
            });
          }
        });
      }
    });
    return changes.slice(-10);
  };

  const getAffectedArcs = () => {
    const affected = [];
    const wbs = campaign?.content_json?.wbs;
    if (!wbs) return [];
    sessionLogs.forEach(log => {
      if (log.consequences_json?.wbs_impact) {
        affected.push({
          session: log.session_number,
          impact: log.consequences_json.wbs_impact,
          event: log.description
        });
      }
    });
    return affected.slice(-5);
  };

  const generateEmergentEvent = async () => {
    if (!isOwner || !userProfile?.aiConfig) return;

    setGeneratingEvent(true);
    try {
      const recentLogs = sessionLogs.slice(-5);
      const stakeholders = npcs.map(npc => ({
        name: npc.name,
        role: npc.role,
        interest: npc.stats_json?.interest || 0,
        power: npc.stats_json?.power || 5,
        archetype: npc.stats_json?.archetype,
        connections: npc.stats_json?.connections
      }));

      const currentArcs = campaign?.content_json?.wbs?.narrative_arcs || [];

      const prompt = `Você é o Narrador Mestre da campanha "${campaign?.title}".

ESTADO ATUAL DO MUNDO:
Sistema: ${campaign?.system_rpg}
Ambientação: ${campaign?.setting}

EVENTOS RECENTES (últimas 5 sessões):
${recentLogs.map(log => `• Sessão ${log.session_number}: [${log.event_type}] ${log.description}\n  Escolha dos jogadores: ${log.player_choice || 'N/A'}\n  Consequências: ${log.consequences_json?.immediate || 'N/A'}`).join('\n')}

STAKEHOLDERS E SUAS ATITUDES:
${stakeholders.map(s => `• ${s.name} (${s.role}): Interesse ${s.interest}/10, Poder ${s.power}/10, Arquétipo: ${s.archetype}\n  Conexões: Aliado=${s.connections?.primary || 'nenhum'}, Rival=${s.connections?.conflict || 'nenhum'}`).join('\n')}

ARCOS NARRATIVOS ATIVOS:
${currentArcs.map((arc, i) => `${i + 1}. ${arc.name}: ${arc.description}`).join('\n')}

════════════════════════════════════════════════════════════════
TAREFA: GERAR EVENTO EMERGENTE
════════════════════════════════════════════════════════════════

Baseado no estado atual da campanha, gere UM EVENTO EMERGENTE que:

1. Seja uma CONSEQUÊNCIA NATURAL das decisões recentes dos jogadores
2. Envolva pelo menos 1 stakeholder cujo interesse mudou significativamente
3. Crie um novo desafio ou oportunidade inesperada
4. Afete um dos arcos narrativos de forma interessante
5. Mantenha o tom e ambientação da campanha

Seja criativo, dramático e conectado à história estabelecida!

Responda em JSON com exatamente esta estrutura:
{
  "event_title": "título curto e impactante do evento",
  "event_description": "descrição detalhada do que está acontecendo",
  "trigger": "o que desencadeou este evento (decisão/consequência anterior)",
  "npcs_involved": ["nome do NPC 1", "nome do NPC 2"],
  "immediate_consequences": "o que acontece imediatamente após o evento",
  "player_opportunities": "quais oportunidades ou escolhas os jogadores têm",
  "arc_impact": "como este evento afeta os arcos narrativos ativos"
}`;

      const result = await invokeLLM({
        prompt,
        userAIConfig: userProfile.aiConfig,
        responseSchema: {
          type: 'object',
          properties: {
            event_title: { type: 'string' },
            event_description: { type: 'string' },
            trigger: { type: 'string' },
            npcs_involved: { type: 'array', items: { type: 'string' } },
            immediate_consequences: { type: 'string' },
            player_opportunities: { type: 'string' },
            arc_impact: { type: 'string' }
          },
          required: ['event_title', 'event_description', 'trigger', 'immediate_consequences', 'arc_impact']
        }
      });

      if (!result || !result.event_title) {
        throw new Error('IA não retornou um evento válido');
      }

      const latestSession = sessionLogs.length > 0
        ? Math.max(...sessionLogs.map(l => l.session_number || 0))
        : 0;

      await SessionLog.create({
        campaignId,
        session_number: latestSession + 1,
        event_type: 'milestone',
        description: result.event_description || 'Evento emergente gerado',
        player_choice: result.trigger || 'Evento emergente gerado pela IA',
        consequences_json: {
          immediate: result.immediate_consequences || 'A definir',
          long_term: result.player_opportunities || 'A definir',
          wbs_impact: result.arc_impact || 'A definir'
        },
        ai_generated_events: [result.event_title || 'Evento Emergente']
      });

      await loadData();
      alert(`✨ Evento emergente gerado: "${result.event_title}"\n\nConfira no tracker de sessões!`);
    } catch (error) {
      console.error('Erro ao gerar evento:', error);
      alert('Erro ao gerar evento emergente. Tente novamente.');
    } finally {
      setGeneratingEvent(false);
    }
  };

  const stakeholderChanges = getStakeholderChanges();
  const affectedArcs = getAffectedArcs();

  const totalDecisions = sessionLogs.filter(l => l.event_type === 'decision').length;
  const totalCombats = sessionLogs.filter(l => l.event_type === 'combat').length;
  const avgInterest = npcs.length > 0
    ? (npcs.reduce((sum, n) => sum + (n.stats_json?.interest || 0), 0) / npcs.length).toFixed(1)
    : 0;

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-purple-900/30 to-slate-900/30 border-purple-500/30">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white text-2xl flex items-center gap-2">
                <Map className="w-7 h-7 text-purple-400" />
                Estado Dinâmico do Mundo
              </CardTitle>
              <p className="text-slate-400 text-sm mt-1">
                Painel de mudanças e eventos emergentes baseados em IA
              </p>
            </div>
            {isOwner && (
              <Button
                onClick={generateEmergentEvent}
                disabled={generatingEvent || !userProfile?.aiConfig}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {generatingEvent ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Gerando...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Gerar Evento Emergente
                  </>
                )}
              </Button>
            )}
          </div>
        </CardHeader>
      </Card>

      <div className="grid md:grid-cols-4 gap-4">
        <Card className="bg-slate-900/50 border-purple-900/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Decisões Tomadas</p>
                <p className="text-3xl font-bold text-white">{totalDecisions}</p>
              </div>
              <CheckCircle2 className="w-10 h-10 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-purple-900/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Combates</p>
                <p className="text-3xl font-bold text-white">{totalCombats}</p>
              </div>
              <Zap className="w-10 h-10 text-red-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-purple-900/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Stakeholders</p>
                <p className="text-3xl font-bold text-white">{npcs.length}</p>
              </div>
              <Users className="w-10 h-10 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-purple-900/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Interesse Médio</p>
                <p className="text-3xl font-bold text-white">{avgInterest}</p>
              </div>
              {avgInterest > 0 ? (
                <TrendingUp className="w-10 h-10 text-green-400" />
              ) : (
                <TrendingDown className="w-10 h-10 text-red-400" />
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="stakeholders" className="space-y-4">
        <TabsList className="bg-slate-900/50 border border-purple-900/20">
          <TabsTrigger value="stakeholders">Mudanças de Influência</TabsTrigger>
          <TabsTrigger value="arcs">Arcos Afetados</TabsTrigger>
        </TabsList>

        <TabsContent value="stakeholders">
          <Card className="bg-slate-900/50 border-purple-900/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-400" />
                Mudanças Recentes de Stakeholders
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stakeholderChanges.length === 0 ? (
                <p className="text-slate-400 text-center py-8">Nenhuma mudança registrada ainda</p>
              ) : (
                <div className="space-y-3">
                  {stakeholderChanges.map((change, index) => (
                    <div key={index} className="p-4 bg-slate-950/50 rounded-lg border border-slate-700">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Clock className="w-4 h-4 text-slate-500" />
                            <span className="text-slate-400 text-xs">Sessão {change.session}</span>
                          </div>
                          <h4 className="text-white font-semibold">{change.name}</h4>
                          <p className="text-slate-400 text-sm mt-1">{change.reason}</p>
                        </div>
                        <Badge className={change.interestChange > 0 ? 'bg-green-600' : 'bg-red-600'}>
                          {change.interestChange > 0 ? '+' : ''}{change.interestChange}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <TrendingUp className="w-3 h-3" />
                        Interesse atual: {change.newInterest}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="arcs">
          <Card className="bg-slate-900/50 border-purple-900/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                Arcos Narrativos Afetados
              </CardTitle>
            </CardHeader>
            <CardContent>
              {affectedArcs.length === 0 ? (
                <p className="text-slate-400 text-center py-8">Nenhum impacto na WBS registrado ainda</p>
              ) : (
                <div className="space-y-3">
                  {affectedArcs.map((arc, index) => (
                    <div key={index} className="p-4 bg-amber-900/10 border border-amber-500/20 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="w-4 h-4 text-slate-500" />
                        <span className="text-slate-400 text-xs">Sessão {arc.session}</span>
                      </div>
                      <p className="text-slate-300 text-sm mb-2">
                        <span className="font-semibold">Evento:</span> {arc.event}
                      </p>
                      <div className="p-3 bg-slate-950/50 rounded">
                        <p className="text-amber-300 text-sm">
                          <span className="font-semibold">Impacto na WBS:</span> {arc.impact}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
