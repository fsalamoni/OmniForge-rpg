import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { AiAgent, Campaign } from '@/firebase/db';
import { invokeLLM, validateAIConfig } from '@/lib/aiClient';
import { AGENT_IDS, buildPrompt, getAgentConfig } from '@/lib/aiAgents';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Sparkles, Swords } from 'lucide-react';

export default function GenerateEncounterDialog({ campaignId, campaign, onEncounterCreated }) {
  const { userProfile } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [encounterType, setEncounterType] = useState('Combate');
  const [difficulty, setDifficulty] = useState('Médio');
  const [instructions, setInstructions] = useState('');
  const [agentOverrides, setAgentOverrides] = useState({});

  useEffect(() => {
    if (!open) return;
    AiAgent.loadOverridesMap().then(setAgentOverrides).catch(console.error);
  }, [open]);

  const handleGenerate = async () => {
    const configError = validateAIConfig(userProfile?.aiConfig);
    if (configError) {
      alert(configError);
      return;
    }

    setLoading(true);
    try {
      const config = getAgentConfig(AGENT_IDS.ENCOUNTER_GENERATOR, agentOverrides);
      const content = campaign.content_json || {};
      const summaryPreview = (content.adventure_summary || '').slice(0, 500);

      const prompt = buildPrompt(config.promptTemplate, {
        system_rpg: campaign.system_rpg,
        setting: campaign.setting,
        players_count: campaign.players_count,
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
            },
            tactics: { type: 'string' }
          },
          required: ['name', 'difficulty', 'description']
        },
        userAIConfig: userProfile.aiConfig,
        systemPrompt: config.systemPrompt,
        temperature: config.temperature
      });

      // Adiciona o novo encontro ao content_json da campanha
      const encounters = [...(content.encounters || []), {
        name: result.name || 'Encontro sem nome',
        difficulty: result.difficulty || difficulty,
        description: result.description || '',
        creatures: Array.isArray(result.creatures) ? result.creatures : [],
        tactics: result.tactics || ''
      }];

      await Campaign.update(campaignId, {
        content_json: { ...content, encounters }
      });

      if (onEncounterCreated) onEncounterCreated();
      setOpen(false);
      setInstructions('');
    } catch (error) {
      console.error('Erro ao gerar encontro:', error);
      alert('Erro ao gerar encontro: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-purple-600 hover:bg-purple-700">
          <Swords className="w-4 h-4 mr-2" />
          Gerar Encontro
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-slate-900 border-purple-900/20 text-white max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl">Gerar Novo Encontro</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-white mb-2 block">Tipo de Encontro</Label>
              <Select value={encounterType} onValueChange={setEncounterType}>
                <SelectTrigger className="bg-slate-950/50 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Combate">Combate</SelectItem>
                  <SelectItem value="Social">Social / Diplomacia</SelectItem>
                  <SelectItem value="Exploração">Exploração / Armadilhas</SelectItem>
                  <SelectItem value="Puzzle">Puzzle / Enigma</SelectItem>
                  <SelectItem value="Misto">Misto</SelectItem>
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
                  <SelectItem value="Fácil">Fácil</SelectItem>
                  <SelectItem value="Médio">Médio</SelectItem>
                  <SelectItem value="Difícil">Difícil</SelectItem>
                  <SelectItem value="Mortal">Mortal</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label className="text-white mb-2 block">
              Instruções Específicas (opcional)
            </Label>
            <Textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="Ex: Uma emboscada em uma ponte estreita, com arqueiros escondidos na floresta..."
              className="min-h-[120px] bg-slate-950/50 border-slate-700 text-white"
            />
            <p className="text-slate-500 text-sm mt-2">
              Descreva o cenário, tema ou restrições do encontro, ou deixe em branco para a IA criar livremente.
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
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Gerando...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Gerar Encontro
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
