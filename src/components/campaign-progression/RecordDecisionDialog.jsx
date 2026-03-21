import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Sparkles } from 'lucide-react';
import { Campaign, NpcCreature, SessionLog } from '@/firebase/db';
import { invokeLLM } from '@/lib/aiClient';
import { useAuth } from '@/lib/AuthContext';

export default function RecordDecisionDialog({ open, onOpenChange, campaignId, onSuccess }) {
  const { userProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [generateConsequences, setGenerateConsequences] = useState(true);
  const [campaign, setCampaign] = useState(null);
  const [stakeholders, setStakeholders] = useState([]);
  const [sessionLogs, setSessionLogs] = useState([]);

  const [formData, setFormData] = useState({
    session_number: 1,
    event_type: 'decision',
    description: '',
    player_choice: ''
  });

  useEffect(() => {
    if (open && campaignId) {
      loadCampaignData();
    }
  }, [open, campaignId]);

  const loadCampaignData = async () => {
    try {
      const [camp, npcs, logs] = await Promise.all([
        Campaign.get(campaignId),
        NpcCreature.listByCampaign(campaignId),
        SessionLog.listByCampaign(campaignId)
      ]);
      setCampaign(camp);
      setStakeholders(npcs);
      setSessionLogs(logs);

      if (logs.length > 0) {
        const maxSession = Math.max(...logs.map(l => l.session_number || 1));
        setFormData(prev => ({ ...prev, session_number: maxSession }));
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      let consequences = null;
      let newEvents = [];

      if (generateConsequences && campaign && userProfile?.aiConfig?.apiKey) {
        const recentHistory = sessionLogs
          .slice(-5)
          .map(log => `${log.event_type}: ${log.description} - ${log.player_choice}`)
          .join('\n');

        const stakeholdersSummary = stakeholders
          .map(s => {
            const stats = s.stats_json || {};
            return `${s.name} (${s.role}) - Poder: ${stats.power || 5}, Interesse: ${stats.interest || 0}`;
          })
          .join('\n');

        const prompt = `Você é o Arquiteto de Consequências. Analise o evento registrado e gere impactos realistas.

CONTEXTO DA CAMPANHA:
Sistema: ${campaign.system_rpg}
Ambientação: ${campaign.setting}
Objetivo: ${campaign.content_json?.wbs?.core_objective || 'Não especificado'}

STAKEHOLDERS ATIVOS:
${stakeholdersSummary}

HISTÓRICO RECENTE:
${recentHistory}

EVENTO ATUAL:
Tipo: ${formData.event_type}
Descrição: ${formData.description}
Escolha dos Jogadores: ${formData.player_choice}

TAREFA: Gere consequências lógicas e integradas ao sistema de gestão:
1. Consequência Imediata (o que acontece agora)
2. Impacto de Longo Prazo (sementes narrativas futuras)
3. Mudanças em Stakeholders (quem é afetado e como - alterações de interesse)
4. Impacto na WBS (qual arco/cena é afetado)
5. Novos Eventos Gerados (2-3 ganchos narrativos resultantes dessa decisão)

Seja específico, dramático e crie conexões causais fortes.`;

        const aiResult = await invokeLLM({
          prompt,
          userAIConfig: userProfile.aiConfig,
          responseSchema: {
            type: 'object',
            properties: {
              immediate: { type: 'string' },
              long_term: { type: 'string' },
              stakeholder_changes: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    stakeholder_name: { type: 'string' },
                    interest_change: { type: 'integer' },
                    reason: { type: 'string' }
                  },
                  required: ['stakeholder_name', 'interest_change', 'reason']
                }
              },
              wbs_impact: { type: 'string' },
              new_events: { type: 'array', items: { type: 'string' } }
            },
            required: ['immediate', 'long_term', 'stakeholder_changes', 'wbs_impact', 'new_events']
          }
        });

        consequences = {
          immediate: aiResult.immediate,
          long_term: aiResult.long_term,
          stakeholder_changes: aiResult.stakeholder_changes || [],
          wbs_impact: aiResult.wbs_impact
        };
        newEvents = aiResult.new_events || [];

        // Aplicar mudanças nos stakeholders
        if (aiResult.stakeholder_changes && aiResult.stakeholder_changes.length > 0) {
          for (const change of aiResult.stakeholder_changes) {
            const stakeholder = stakeholders.find(s =>
              s.name.toLowerCase().includes(change.stakeholder_name.toLowerCase())
            );

            if (stakeholder) {
              const stats = stakeholder.stats_json || {};
              const newInterest = Math.max(-10, Math.min(10,
                (stats.interest || 0) + change.interest_change
              ));

              await NpcCreature.update(stakeholder.id, {
                stats_json: { ...stats, interest: newInterest }
              });
            }
          }
        }
      }

      await SessionLog.create({
        campaignId,
        session_number: formData.session_number,
        event_type: formData.event_type,
        description: formData.description,
        player_choice: formData.player_choice,
        consequences_json: consequences,
        ai_generated_events: newEvents
      });

      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Erro ao registrar evento:', error);
      alert('Erro ao registrar evento. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-purple-900/20 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Registrar Evento da Campanha</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label className="text-white mb-2 block">Sessão #</Label>
              <Input
                type="number"
                min="1"
                value={formData.session_number}
                onChange={(e) => setFormData({ ...formData, session_number: parseInt(e.target.value) })}
                className="bg-slate-950/50 border-slate-700 text-white"
              />
            </div>

            <div>
              <Label className="text-white mb-2 block">Tipo de Evento</Label>
              <Select
                value={formData.event_type}
                onValueChange={(value) => setFormData({ ...formData, event_type: value })}
              >
                <SelectTrigger className="bg-slate-950/50 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="decision">🎯 Decisão Importante</SelectItem>
                  <SelectItem value="combat">⚔️ Combate</SelectItem>
                  <SelectItem value="social">💬 Interação Social</SelectItem>
                  <SelectItem value="exploration">🗺️ Exploração</SelectItem>
                  <SelectItem value="milestone">🏆 Marco Narrativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label className="text-white mb-2 block">Descrição do Evento</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Ex: Os jogadores confrontaram o Conselho Arcano sobre as acusações de corrupção..."
              className="min-h-[100px] bg-slate-950/50 border-slate-700 text-white"
            />
          </div>

          <div>
            <Label className="text-white mb-2 block">Escolha/Ação dos Jogadores</Label>
            <Textarea
              value={formData.player_choice}
              onChange={(e) => setFormData({ ...formData, player_choice: e.target.value })}
              placeholder="Ex: Decidiram apoiar a facção rebelde em vez de negociar com o Conselho..."
              className="min-h-[100px] bg-slate-950/50 border-slate-700 text-white"
            />
          </div>

          <div className="flex items-center space-x-2 p-4 bg-purple-900/10 border border-purple-500/20 rounded-lg">
            <Checkbox
              id="ai-consequences"
              checked={generateConsequences}
              onCheckedChange={setGenerateConsequences}
              className="border-purple-500"
            />
            <div className="flex flex-col">
              <Label htmlFor="ai-consequences" className="text-white font-semibold cursor-pointer">
                Gerar Consequências com IA
              </Label>
              <p className="text-slate-400 text-xs mt-1">
                A IA analisará o evento e gerará impactos nos stakeholders, WBS e novos eventos narrativos
                {!userProfile?.aiConfig?.apiKey && ' (configure sua chave de IA no perfil)'}
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-slate-700 text-slate-300"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={loading || !formData.description}
              className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {generateConsequences ? 'Gerando Consequências...' : 'Salvando...'}
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Registrar Evento
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
