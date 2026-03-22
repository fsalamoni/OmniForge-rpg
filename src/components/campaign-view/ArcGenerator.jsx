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

export default function ArcGenerator({ campaignId, description, answers5W2H, hooks = [], npcs = [], systemRpg, setting, onArcGenerated }) {
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
      // Build context sections for the prompt
      const hooksContext = hooks && hooks.length > 0
        ? `\nGANCHOS DA CAMPANHA (use-os como base para conflitos e motivações do arco):\n${hooks.slice(0, 5).map((h, i) => {
            const text = typeof h === 'string' ? h
              : (h.text || h.description || h.content || h.title || h.hook || h.name || '');
            return `${i + 1}. ${text || '[gancho sem texto]'}`;
          }).join('\n')}`
        : '';

      const w2h5Context = answers5W2H && Object.keys(answers5W2H).length > 0
        ? `\n5W2H DA CAMPANHA:\n${Object.entries(answers5W2H).map(([k, v]) => `${k}: ${String(v).substring(0, 80)}`).join('\n')}`
        : '';

      const npcsContext = npcs && npcs.length > 0
        ? `\nNPCs/CRIATURAS EXISTENTES (prefira usá-los nos npcs_involved dos atos e cenas):\n${npcs.slice(0, 12).map(n => `- ${n.name}${n.type ? ` (${n.type})` : ''}${n.role ? ` — ${n.role}` : ''}`).join('\n')}`
        : '';

      const raw = await invokeLLM({
        prompt: `TAREFA: Criar arco narrativo de RPG com EXATAMENTE ${numActs} atos, cada ato com EXATAMENTE ${scenesPerAct} cenas.

Nome do Arco: ${arcName}
Tipo de Missão: ${missionType}
Sistema RPG: ${systemRpg}
Ambientação: ${setting}

REGRA ABSOLUTA: ${numActs} atos × ${scenesPerAct} cenas = ${numActs * scenesPerAct} cenas no total.

DESCRIÇÃO DA CAMPANHA (contexto principal):
${(description || '').substring(0, 600)}
${hooksContext}
${w2h5Context}
${npcsContext}
${customInstructions ? `\nINSTRUÇÕES ESPECÍFICAS: ${customInstructions}` : ''}

IMPORTANTE: O arco deve ser COERENTE com a descrição da campanha, os ganchos e o 5W2H acima.

Retorne um JSON com: name, description, arc_objective, world_change, arc_villain, acts.`,
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

      // Unwrap common wrapper patterns some AI models return
      let result = raw;
      if (!result?.name && result?.arc) result = result.arc;
      if (!result?.name && result?.narrative_arc) result = result.narrative_arc;
      if (!result?.name && result?.data) result = result.data;
      // Use arcName as fallback if AI omitted the name field but returned the rest
      if (!result?.name && result?.acts) result = { ...result, name: arcName };
      // Handle alt field names
      if (!result?.name && result?.title) result = { ...result, name: result.title };
      if (!result?.name && result?.arc_name) result = { ...result, name: result.arc_name };

      if (!result?.name) throw new Error('IA retornou um arco sem nome');
      if (!result.acts?.length) throw new Error('IA não criou nenhum ato para o arco');
      if (result.acts.length < numActs - 1 || result.acts.length > numActs + 1) {
        throw new Error(`IA criou ${result.acts.length} atos, mas você pediu ${numActs}. Tente novamente.`);
      }
      // Trim to exact count if IA returned one extra
      if (result.acts.length > numActs) result.acts = result.acts.slice(0, numActs);

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
