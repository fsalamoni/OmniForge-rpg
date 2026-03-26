import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { NpcCreature, AiAgent } from '@/firebase/db';
import { invokeLLM, validateAIConfig } from '@/lib/aiClient';
import { AGENT_IDS, buildPrompt, getAgentConfig } from '@/lib/aiAgents';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Sparkles } from 'lucide-react';

export default function GenerateNpcDialog({ campaignId, systemRpg, setting, onNpcCreated }) {
  const { userProfile } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [npcType, setNpcType] = useState('NPC');
  const [instructions, setInstructions] = useState('');
  const [agentOverrides, setAgentOverrides] = useState({});

  // Carrega overrides do agente NPC ao abrir o dialog (admin only para performance)
  useEffect(() => {
    if (!open) return;
    const loadOverrides = async () => {
      try {
        const map = await AiAgent.loadOverridesMap();
        setAgentOverrides(map);
      } catch (err) {
        console.error('Erro ao carregar configuração do agente NPC:', err);
      }
    };
    loadOverrides();
  }, [open]);

  const handleGenerate = async () => {
    const configError = validateAIConfig(userProfile?.aiConfig);
    if (configError) {
      alert(configError);
      return;
    }
    setLoading(true);
    try {
      // Carrega config do agente NPC com override se existir
      const config = getAgentConfig(AGENT_IDS.NPC_GENERATOR, agentOverrides);

      const prompt = buildPrompt(config.promptTemplate, {
        type: npcType,
        system: systemRpg,
        setting,
        instructions: instructions || 'Crie um personagem único, memorável e adequado ao contexto da campanha.'
      });

      const result = await invokeLLM({
        prompt,
        responseSchema: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            role: { type: 'string' },
            motivation: { type: 'string' },
            description: { type: 'string' },
            stats: { type: 'object' }
          },
          required: ['name', 'role', 'description']
        },
        userAIConfig: userProfile.aiConfig,
        systemPrompt: config.systemPrompt,
        temperature: config.temperature,
        agentKey: AGENT_IDS.NPC_GENERATOR,
        agentModels: userProfile?.agentModels || {}
      });

      const newNpc = await NpcCreature.create({
        campaignId,
        name: result.name,
        type: npcType,
        role: result.role || 'Personagem',
        motivation: result.motivation || 'Não especificada',
        description: result.description,
        stats_json: result.stats || {}
      });

      if (onNpcCreated) onNpcCreated(newNpc);
      setOpen(false);
      setInstructions('');
    } catch (error) {
      console.error('Erro ao gerar NPC:', error);
      alert(error.message || 'Erro ao gerar NPC. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-purple-600 hover:bg-purple-700">
          <Sparkles className="w-4 h-4 mr-2" />
          Gerar Novo NPC
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-slate-900 border-purple-900/20 text-white max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl">Gerar Novo Personagem</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div>
            <Label className="text-white mb-2 block">Tipo de Personagem</Label>
            <Select value={npcType} onValueChange={setNpcType}>
              <SelectTrigger className="bg-slate-950/50 border-slate-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NPC">NPC (Personagem Neutro)</SelectItem>
                <SelectItem value="Ally">Aliado</SelectItem>
                <SelectItem value="Villain">Vilão</SelectItem>
                <SelectItem value="Monster">Monstro/Criatura</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-white mb-2 block">Instruções Específicas (opcional)</Label>
            <Textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="Ex: Um mago idoso que esconde um segredo sombrio, possui grande conhecimento arcano..."
              className="min-h-[120px] bg-slate-950/50 border-slate-700 text-white"
            />
            <p className="text-slate-500 text-sm mt-2">
              Descreva características, personalidade, papel na história, ou deixe em branco para a IA criar livremente.
            </p>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              className="border-slate-700 text-slate-300"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleGenerate}
              disabled={loading}
              className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Gerando...</>
              ) : (
                <><Sparkles className="w-4 h-4 mr-2" />Gerar Personagem</>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
