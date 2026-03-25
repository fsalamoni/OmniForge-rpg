import React, { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { AGENT_IDS, buildPrompt, getAgentConfig } from '@/lib/aiAgents';
import { invokeLLM, validateAIConfig } from '@/lib/aiClient';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sparkles, Pencil, Loader2, Plus, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const EMPTY_ENCOUNTER = {
  name: '',
  difficulty: 'Médio',
  encounter_type: 'Combate',
  description: '',
  creatures: [],
  tactics: '',
  rewards: '',
  notes: ''
};

export default function SceneEncounterDialog({ open, onOpenChange, campaign, onEncounterCreated }) {
  const { userProfile } = useAuth();
  const [mode, setMode] = useState(null); // null | 'ai' | 'manual'
  const [loading, setLoading] = useState(false);

  // AI fields
  const [encounterType, setEncounterType] = useState('Combate');
  const [difficulty, setDifficulty] = useState('Médio');
  const [instructions, setInstructions] = useState('');

  // Manual fields
  const [manual, setManual] = useState(EMPTY_ENCOUNTER);
  const [newCreature, setNewCreature] = useState({ name: '', quantity: 1 });

  const resetAndClose = () => {
    setMode(null);
    setInstructions('');
    setManual(EMPTY_ENCOUNTER);
    setNewCreature({ name: '', quantity: 1 });
    onOpenChange(false);
  };

  const handleGenerateAI = async () => {
    const configError = validateAIConfig(userProfile?.aiConfig);
    if (configError) {
      alert(configError);
      return;
    }
    setLoading(true);
    try {
      const content = campaign?.content_json || {};
      const summaryPreview = (content.adventure_summary || '').slice(0, 500);
      const config = getAgentConfig(AGENT_IDS.ENCOUNTER_GENERATOR, {});
      const prompt = buildPrompt(config.promptTemplate, {
        system_rpg: campaign?.system_rpg || '',
        setting: campaign?.setting || '',
        players_count: campaign?.players_count || 4,
        campaign_summary: summaryPreview || 'Sem resumo disponível.',
        instructions: instructions || '',
        encounter_type: encounterType,
        difficulty
      });

      const result = await invokeLLM({
        prompt,
        responseSchema: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            difficulty: { type: 'string' },
            encounter_type: { type: 'string' },
            description: { type: 'string' },
            creatures: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' }, quantity: { type: 'integer' } }, required: ['name', 'quantity'] } },
            tactics: { type: 'string' },
            rewards: { type: 'string' },
            notes: { type: 'string' }
          },
          required: ['name', 'description']
        },
        userAIConfig: userProfile.aiConfig,
        systemPrompt: config.systemPrompt,
        temperature: config.temperature
      });

      const encounter = {
        name: result.name || 'Encontro sem nome',
        difficulty: result.difficulty || difficulty,
        encounter_type: result.encounter_type || encounterType,
        description: result.description || '',
        creatures: Array.isArray(result.creatures) ? result.creatures : [],
        tactics: result.tactics || '',
        rewards: result.rewards || '',
        notes: result.notes || ''
      };

      onEncounterCreated(encounter);
      resetAndClose();
    } catch (error) {
      console.error('Erro ao gerar encontro:', error);
      alert('Erro ao gerar encontro: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveManual = () => {
    if (!manual.name.trim()) {
      alert('Defina um nome para o encontro.');
      return;
    }
    onEncounterCreated({ ...manual });
    resetAndClose();
  };

  const addCreature = () => {
    if (!newCreature.name.trim()) return;
    setManual(prev => ({ ...prev, creatures: [...prev.creatures, { ...newCreature }] }));
    setNewCreature({ name: '', quantity: 1 });
  };

  const removeCreature = (idx) => {
    setManual(prev => ({ ...prev, creatures: prev.creatures.filter((_, i) => i !== idx) }));
  };

  return (
    <Dialog open={open} onOpenChange={resetAndClose}>
      <DialogContent className="bg-slate-900 border-purple-900/20 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Novo Encontro</DialogTitle>
        </DialogHeader>

        {!mode && (
          <div className="space-y-4 py-4">
            <p className="text-slate-400 text-sm">Como deseja criar este encontro?</p>
            <div className="grid grid-cols-2 gap-4">
              <Card
                className="bg-purple-900/20 border-purple-500/40 cursor-pointer hover:bg-purple-900/40 transition-colors"
                onClick={() => setMode('ai')}
              >
                <CardContent className="pt-6 pb-6 text-center space-y-3">
                  <Sparkles className="w-10 h-10 text-purple-400 mx-auto" />
                  <h3 className="text-white font-semibold">Gerar por IA</h3>
                  <p className="text-slate-400 text-xs">A IA cria um encontro balanceado com táticas e criaturas</p>
                </CardContent>
              </Card>
              <Card
                className="bg-slate-800/50 border-slate-600 cursor-pointer hover:bg-slate-700/50 transition-colors"
                onClick={() => setMode('manual')}
              >
                <CardContent className="pt-6 pb-6 text-center space-y-3">
                  <Pencil className="w-10 h-10 text-slate-300 mx-auto" />
                  <h3 className="text-white font-semibold">Criar Manualmente</h3>
                  <p className="text-slate-400 text-xs">Escreva o encontro com seus próprios detalhes</p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {mode === 'ai' && (
          <div className="space-y-4 py-4">
            <button onClick={() => setMode(null)} className="text-slate-400 hover:text-white text-sm">← Voltar</button>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-white mb-2 block">Tipo de Encontro</Label>
                <Select value={encounterType} onValueChange={setEncounterType}>
                  <SelectTrigger className="bg-slate-950/50 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {['Combate', 'Social / Diplomacia', 'Exploração / Armadilhas', 'Puzzle / Enigma', 'Misto'].map(t => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-white mb-2 block">Dificuldade</Label>
                <Select value={difficulty} onValueChange={setDifficulty}>
                  <SelectTrigger className="bg-slate-950/50 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {['Fácil', 'Médio', 'Difícil', 'Mortal'].map(d => (
                      <SelectItem key={d} value={d}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-white mb-2 block">Instruções Específicas (opcional)</Label>
              <Textarea
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="Ex: Uma emboscada em uma ponte estreita, com arqueiros..."
                className="min-h-[100px] bg-slate-950/50 border-slate-700 text-white"
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={resetAndClose} className="border-slate-700">Cancelar</Button>
              <Button onClick={handleGenerateAI} disabled={loading} className="bg-purple-600 hover:bg-purple-700">
                {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Gerando...</> : <><Sparkles className="w-4 h-4 mr-2" />Gerar</>}
              </Button>
            </div>
          </div>
        )}

        {mode === 'manual' && (
          <div className="space-y-4 py-4">
            <button onClick={() => setMode(null)} className="text-slate-400 hover:text-white text-sm">← Voltar</button>
            <div>
              <Label className="text-white mb-2 block">Nome do Encontro *</Label>
              <Input value={manual.name} onChange={(e) => setManual(p => ({ ...p, name: e.target.value }))} placeholder="Ex: Emboscada dos Cultistas" className="bg-slate-950/50 border-slate-700 text-white" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-white mb-2 block">Tipo</Label>
                <Select value={manual.encounter_type} onValueChange={(v) => setManual(p => ({ ...p, encounter_type: v }))}>
                  <SelectTrigger className="bg-slate-950/50 border-slate-700 text-white"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['Combate', 'Social', 'Exploração', 'Puzzle', 'Misto'].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-white mb-2 block">Dificuldade</Label>
                <Select value={manual.difficulty} onValueChange={(v) => setManual(p => ({ ...p, difficulty: v }))}>
                  <SelectTrigger className="bg-slate-950/50 border-slate-700 text-white"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['Fácil', 'Médio', 'Difícil', 'Mortal'].map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-white mb-2 block">Descrição</Label>
              <Textarea value={manual.description} onChange={(e) => setManual(p => ({ ...p, description: e.target.value }))} placeholder="Descreva o encontro..." className="min-h-[80px] bg-slate-950/50 border-slate-700 text-white" />
            </div>
            <div>
              <Label className="text-white mb-2 block">Táticas / Comportamento</Label>
              <Textarea value={manual.tactics} onChange={(e) => setManual(p => ({ ...p, tactics: e.target.value }))} placeholder="Como os inimigos/participantes se comportam..." className="min-h-[60px] bg-slate-950/50 border-slate-700 text-white" />
            </div>
            <div>
              <Label className="text-white mb-2 block">Criaturas / Participantes</Label>
              <div className="space-y-2 mb-2">
                {manual.creatures.map((c, idx) => (
                  <div key={idx} className="flex items-center gap-2 bg-slate-800/50 p-2 rounded">
                    <span className="text-slate-300 text-sm flex-1">{c.name} × {c.quantity}</span>
                    <Button size="sm" variant="ghost" onClick={() => removeCreature(idx)} className="text-red-400 hover:text-red-300 h-7 w-7 p-0"><Trash2 className="w-3 h-3" /></Button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Input value={newCreature.name} onChange={(e) => setNewCreature(p => ({ ...p, name: e.target.value }))} placeholder="Nome da criatura" className="bg-slate-950/50 border-slate-700 text-white flex-1" />
                <Input type="number" min="1" value={newCreature.quantity} onChange={(e) => setNewCreature(p => ({ ...p, quantity: parseInt(e.target.value) || 1 }))} className="bg-slate-950/50 border-slate-700 text-white w-20" />
                <Button size="sm" onClick={addCreature} variant="outline" className="border-slate-600"><Plus className="w-4 h-4" /></Button>
              </div>
            </div>
            <div>
              <Label className="text-white mb-2 block">Recompensas</Label>
              <Input value={manual.rewards} onChange={(e) => setManual(p => ({ ...p, rewards: e.target.value }))} placeholder="XP, itens, informações..." className="bg-slate-950/50 border-slate-700 text-white" />
            </div>
            <div>
              <Label className="text-white mb-2 block">Notas do Mestre</Label>
              <Textarea value={manual.notes} onChange={(e) => setManual(p => ({ ...p, notes: e.target.value }))} placeholder="Anotações privadas para o mestre..." className="min-h-[60px] bg-slate-950/50 border-slate-700 text-white" />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={resetAndClose} className="border-slate-700">Cancelar</Button>
              <Button onClick={handleSaveManual} className="bg-purple-600 hover:bg-purple-700">Salvar Encontro</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
