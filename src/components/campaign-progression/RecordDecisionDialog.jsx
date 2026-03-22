import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Sparkles, TrendingUp, TrendingDown, Minus, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Campaign, NpcCreature, SessionLog } from '@/firebase/db';
import { invokeLLM } from '@/lib/aiClient';
import { useAuth } from '@/lib/AuthContext';

// Step: 'form' | 'reviewing' | 'saving'
export default function RecordDecisionDialog({ open, onOpenChange, campaignId, onSuccess }) {
  const { userProfile } = useAuth();
  const [step, setStep] = useState('form');
  const [loading, setLoading] = useState(false);
  const [generateConsequences, setGenerateConsequences] = useState(true);
  const [campaign, setCampaign] = useState(null);
  const [stakeholders, setStakeholders] = useState([]);
  const [sessionLogs, setSessionLogs] = useState([]);

  // Consequences preview (before applying)
  const [aiResult, setAiResult] = useState(null);

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
    if (!open) {
      // Reset on close
      setStep('form');
      setAiResult(null);
      setFormData({ session_number: 1, event_type: 'decision', description: '', player_choice: '' });
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

  const handleGenerate = async () => {
    if (!formData.description.trim()) {
      alert('Descreva o evento antes de continuar.');
      return;
    }
    setLoading(true);
    try {
      if (generateConsequences && campaign && userProfile?.aiConfig) {
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

        const result = await invokeLLM({
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
        setAiResult(result);
        setStep('reviewing');
      } else {
        // No AI, go straight to save
        await saveEvent(null, []);
      }
    } catch (error) {
      console.error('Erro ao gerar consequências:', error);
      alert('Erro ao gerar consequências: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const saveEvent = async (consequences, newEvents) => {
    setStep('saving');
    setLoading(true);
    try {
      // Apply stakeholder interest changes
      if (consequences?.stakeholder_changes?.length > 0) {
        for (const change of consequences.stakeholder_changes) {
          const stakeholder = stakeholders.find(s =>
            s.name.toLowerCase().includes(change.stakeholder_name.toLowerCase())
          );
          if (stakeholder) {
            const stats = stakeholder.stats_json || {};
            const newInterest = Math.max(-10, Math.min(10, (stats.interest || 0) + change.interest_change));
            await NpcCreature.update(stakeholder.id, {
              stats_json: { ...stats, interest: newInterest }
            });
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
      setStep('form');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmAndSave = async () => {
    const consequences = aiResult ? {
      immediate: aiResult.immediate,
      long_term: aiResult.long_term,
      stakeholder_changes: aiResult.stakeholder_changes || [],
      wbs_impact: aiResult.wbs_impact
    } : null;
    const newEvents = (aiResult?.new_events || []).filter(e => e?.trim());
    await saveEvent(consequences, newEvents);
  };

  // ── STEP: form ──────────────────────────────────────────────────────────────
  const renderForm = () => (
    <div className="space-y-6 py-4">
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <Label className="text-white mb-2 block">Sessão #</Label>
          <Input
            type="number"
            min="1"
            value={formData.session_number}
            onChange={(e) => setFormData({ ...formData, session_number: parseInt(e.target.value) || 1 })}
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
        <Label className="text-white mb-2 block">Descrição do Evento *</Label>
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
          className="min-h-[80px] bg-slate-950/50 border-slate-700 text-white"
        />
      </div>

      <div className="flex items-start gap-3 p-4 bg-purple-900/10 border border-purple-500/20 rounded-lg">
        <Checkbox
          id="ai-consequences"
          checked={generateConsequences}
          onCheckedChange={setGenerateConsequences}
          className="border-purple-500 mt-0.5"
        />
        <div className="flex flex-col">
          <Label htmlFor="ai-consequences" className="text-white font-semibold cursor-pointer">
            Gerar Consequências com IA
          </Label>
          <p className="text-slate-400 text-xs mt-1">
            A IA analisará o evento e gerará impactos nos stakeholders, WBS e novos eventos narrativos.
            Você poderá revisar antes de aplicar.
            {!userProfile?.aiConfig && <span className="text-amber-400"> Configure sua chave de IA no perfil para usar.</span>}
          </p>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button variant="outline" onClick={() => onOpenChange(false)} className="border-slate-700 text-slate-300">
          Cancelar
        </Button>
        <Button
          onClick={handleGenerate}
          disabled={loading || !formData.description.trim()}
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
              {generateConsequences && userProfile?.aiConfig ? 'Gerar e Revisar' : 'Registrar Evento'}
            </>
          )}
        </Button>
      </div>
    </div>
  );

  // ── STEP: reviewing ─────────────────────────────────────────────────────────
  const renderReview = () => (
    <div className="space-y-4 py-4">
      <div className="flex items-center gap-2 p-3 bg-purple-900/20 border border-purple-500/30 rounded-lg">
        <CheckCircle2 className="w-5 h-5 text-purple-400 shrink-0" />
        <p className="text-purple-300 text-sm font-medium">
          Consequências geradas — revise antes de aplicar
        </p>
      </div>

      {aiResult?.immediate && (
        <div className="p-3 bg-amber-900/10 border border-amber-500/20 rounded-lg">
          <p className="text-amber-300 text-xs font-semibold mb-1">⚡ Consequência Imediata</p>
          <p className="text-slate-300 text-sm">{aiResult.immediate}</p>
        </div>
      )}

      {aiResult?.long_term && (
        <div className="p-3 bg-purple-900/10 border border-purple-500/20 rounded-lg">
          <p className="text-purple-300 text-xs font-semibold mb-1">🔮 Impacto de Longo Prazo</p>
          <p className="text-slate-300 text-sm">{aiResult.long_term}</p>
        </div>
      )}

      {aiResult?.stakeholder_changes?.length > 0 && (
        <div className="p-3 bg-slate-950/50 border border-slate-700 rounded-lg">
          <p className="text-slate-300 text-xs font-semibold mb-2 flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            Mudanças em Stakeholders (serão aplicadas)
          </p>
          <div className="space-y-2">
            {aiResult.stakeholder_changes.map((change, i) => {
              const match = stakeholders.find(s =>
                s.name.toLowerCase().includes(change.stakeholder_name.toLowerCase())
              );
              return (
                <div key={i} className="flex items-start gap-2 text-sm">
                  {change.interest_change > 0 ? (
                    <TrendingUp className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
                  ) : change.interest_change < 0 ? (
                    <TrendingDown className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                  ) : (
                    <Minus className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                  )}
                  <div>
                    <span className={`font-medium ${match ? 'text-white' : 'text-slate-500'}`}>
                      {change.stakeholder_name}
                      {!match && <span className="text-xs text-slate-500 ml-1">(não encontrado)</span>}
                    </span>
                    <span className={`ml-2 text-xs font-bold ${
                      change.interest_change > 0 ? 'text-green-400' :
                      change.interest_change < 0 ? 'text-red-400' : 'text-slate-400'
                    }`}>
                      {change.interest_change > 0 ? `+${change.interest_change}` : change.interest_change}
                    </span>
                    <p className="text-slate-400 text-xs mt-0.5">{change.reason}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {aiResult?.wbs_impact && (
        <div className="p-3 bg-green-900/10 border border-green-500/20 rounded-lg">
          <p className="text-green-300 text-xs font-semibold mb-1">📊 Impacto na WBS</p>
          <p className="text-slate-300 text-sm">{aiResult.wbs_impact}</p>
        </div>
      )}

      {aiResult?.new_events?.length > 0 && (
        <div className="p-3 bg-red-900/10 border border-red-500/20 rounded-lg">
          <p className="text-red-300 text-xs font-semibold mb-2">🎭 Novos Eventos Gerados</p>
          <ul className="space-y-1">
            {aiResult.new_events.filter(e => e?.trim()).map((event, i) => (
              <li key={i} className="text-slate-300 text-sm flex items-start gap-2">
                <span className="text-red-400 mt-0.5">•</span>{event}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex justify-end gap-3 pt-2 border-t border-slate-700">
        <Button variant="outline" onClick={() => setStep('form')} className="border-slate-700 text-slate-300">
          ← Editar
        </Button>
        <Button
          onClick={() => saveEvent(null, [])}
          variant="outline"
          className="border-slate-600 text-slate-400"
        >
          Salvar sem consequências
        </Button>
        <Button
          onClick={handleConfirmAndSave}
          disabled={loading}
          className="bg-green-600 hover:bg-green-700"
        >
          {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Aplicando...</> : '✓ Confirmar e Aplicar'}
        </Button>
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-purple-900/20 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {step === 'reviewing' ? 'Revisar Consequências' : 'Registrar Evento da Campanha'}
          </DialogTitle>
        </DialogHeader>
        {step === 'reviewing' ? renderReview() : renderForm()}
      </DialogContent>
    </Dialog>
  );
}
