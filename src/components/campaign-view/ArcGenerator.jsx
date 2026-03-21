import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, Sparkles, Loader2 } from 'lucide-react';
import { invokeLLM } from '@/lib/aiClient';
import { useAuth } from '@/lib/AuthContext';

const MISSION_TYPES = [
  'Investigação', 'Exploração', 'Roubo', 'Assassinato', 'Resgate',
  'Diplomacia', 'Infiltração', 'Defesa', 'Conquista', 'Mistério',
  'Sobrevivência', 'Caça', 'Escolta'
];

export default function ArcGenerator({ campaignId, description, answers5W2H, systemRpg, setting, onArcGenerated }) {
  const [arcName, setArcName] = useState('');
  const [missionType, setMissionType] = useState('Investigação');
  const [numActs, setNumActs] = useState(3);
  const [scenesPerAct, setScenesPerAct] = useState(2);
  const [customInstructions, setCustomInstructions] = useState('');
  const [generating, setGenerating] = useState(false);
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
    try {
      const result = await invokeLLM({
        prompt: `TAREFA: Criar arco de RPG com EXATAMENTE ${numActs} atos, cada ato com EXATAMENTE ${scenesPerAct} cenas.

Nome: ${arcName}
Missão: ${missionType}
Sistema: ${systemRpg}
Ambientação: ${setting}

REGRA ABSOLUTA: Total de ${numActs} atos × ${scenesPerAct} cenas = ${numActs * scenesPerAct} cenas no arco completo.

${customInstructions ? `EXTRA: ${customInstructions}\n` : ''}
Contexto: ${(description || '').substring(0, 600)}`,
        responseSchema: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            arc_objective: { type: 'string' },
            world_change: { type: 'string' },
            arc_villain: { type: 'string' },
            description: { type: 'string' },
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
                }
              }
            }
          },
          required: ['name', 'acts']
        },
        userAIConfig: userProfile.aiConfig,
        systemPrompt: 'Você é um assistente especialista em RPG. Responda SEMPRE em JSON válido conforme o schema solicitado.'
      });

      if (!result?.name) throw new Error('IA retornou um arco sem nome');
      if (!result.acts?.length) throw new Error('IA não criou nenhum ato para o arco');
      if (result.acts.length !== numActs) throw new Error(`IA criou ${result.acts.length} atos, mas você pediu ${numActs}. Tente novamente.`);

      for (let i = 0; i < result.acts.length; i++) {
        const act = result.acts[i];
        if (!act.scenes || act.scenes.length !== scenesPerAct) {
          throw new Error(`Ato ${i + 1} tem ${act.scenes?.length || 0} cenas, mas você pediu ${scenesPerAct}. Tente novamente.`);
        }
      }

      await onArcGenerated(result);
      setArcName('');
      setCustomInstructions('');
    } catch (error) {
      console.error('Erro ao gerar arco:', error);
      alert('Erro ao gerar arco: ' + (error.message || 'Erro desconhecido'));
    } finally {
      setGenerating(false);
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
              onChange={(e) => setNumActs(parseInt(e.target.value))}
              className="bg-slate-950/50 border-slate-700 text-white mt-2"
            />
          </div>
          <div>
            <Label className="text-slate-300">Cenas por Ato</Label>
            <Input
              type="number" min="1" max="5" value={scenesPerAct}
              onChange={(e) => setScenesPerAct(parseInt(e.target.value))}
              className="bg-slate-950/50 border-slate-700 text-white mt-2"
            />
          </div>
        </div>

        <div>
          <Label className="text-slate-300">Instruções Específicas (Opcional)</Label>
          <Textarea
            value={customInstructions}
            onChange={(e) => setCustomInstructions(e.target.value)}
            placeholder="Ex: Incluir elementos de horror, focar em dilemas morais..."
            className="bg-slate-950/50 border-slate-700 text-white mt-2"
          />
        </div>

        <Button
          onClick={handleGenerate}
          disabled={generating || !arcName.trim()}
          className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600"
        >
          {generating ? (
            <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Gerando arco...</>
          ) : (
            <><BookOpen className="w-5 h-5 mr-2" />Gerar Arco: {arcName || 'Defina um nome'}</>
          )}
        </Button>
        <p className="text-xs text-slate-500 text-center">
          Será gerado: {numActs} atos × {scenesPerAct} cenas = {numActs * scenesPerAct} cenas totais
        </p>
      </CardContent>
    </Card>
  );
}
