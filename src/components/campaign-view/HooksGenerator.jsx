import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Anchor, Sparkles, Loader2, X } from 'lucide-react';
import { invokeLLM, validateAIConfig } from '@/lib/aiClient';
import { AGENT_IDS } from '@/lib/aiAgents';
import { useAuth } from '@/lib/AuthContext';

export default function HooksGenerator({ campaignId, description, answers5W2H, systemRpg, setting, onHooksGenerated }) {
  const [quantity, setQuantity] = useState(5);
  const [customInstructions, setCustomInstructions] = useState('');
  const [generating, setGenerating] = useState(false);
  const [generatedHooks, setGeneratedHooks] = useState([]);
  const { userProfile } = useAuth();

  const handleGenerate = async () => {
    const configError = validateAIConfig(userProfile?.aiConfig);
    if (configError) {
      alert(configError);
      return;
    }
    setGenerating(true);
    try {
      const context5W2H = answers5W2H
        ? Object.entries(answers5W2H)
            .map(([k, v]) => `${k}: ${v}`)
            .join('\n')
        : '';

      const prompt = `Você é um Mestre de RPG especialista em ${systemRpg} na ambientação ${setting}.

CONTEXTO DA CAMPANHA:
${description}

RESPOSTAS 5W2H:
${context5W2H}

TAREFA: Gere EXATAMENTE ${quantity} ganchos de plot (plot hooks) originais, intrigantes e variados para esta campanha.

${customInstructions ? `INSTRUÇÕES ESPECÍFICAS:\n${customInstructions}\n\n` : ''}

REQUISITOS:
- Cada gancho deve ser único e criar suspense imediato
- Variar entre: mistério, conflito, descoberta, perigo, oportunidade
- Adaptar ao sistema ${systemRpg} e ambientação ${setting}
- Conectar com o contexto da campanha
- Cada gancho em 2-3 frases descritivas e evocativas

Responda em JSON com exatamente ${quantity} hooks.`;

      const result = await invokeLLM({
        prompt,
        responseSchema: {
          type: 'object',
          properties: {
            hooks: {
              type: 'array',
              items: { type: 'object', properties: { hook: { type: 'string' } }, required: ['hook'] }
            }
          },
          required: ['hooks']
        },
        userAIConfig: userProfile.aiConfig,
        systemPrompt: 'Você é um assistente especialista em RPG. Responda SEMPRE em JSON válido.',
        agentKey: AGENT_IDS.HOOKS_GENERATOR,
        agentModels: userProfile?.agentModels || {}
      });

      const hooks = (result?.hooks || []).map(h => typeof h === 'string' ? h : (h.hook || String(h)));
      setGeneratedHooks(hooks);
    } catch (error) {
      console.error('Erro ao gerar ganchos:', error);
      alert('Erro ao gerar ganchos: ' + error.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleRemoveHook = (index) => {
    setGeneratedHooks(prev => prev.filter((_, i) => i !== index));
  };

  const handleSaveHooks = async () => {
    if (generatedHooks.length === 0) return;
    await onHooksGenerated(generatedHooks);
    setGeneratedHooks([]);
    setCustomInstructions('');
  };

  return (
    <Card className="bg-slate-900/50 backdrop-blur-xl border-purple-900/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Sparkles className="w-6 h-6 text-purple-400" />
          Gerar Ganchos de Plot
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label className="text-slate-300">Quantidade de Ganchos</Label>
          <Input
            type="number"
            min="1"
            max="10"
            value={quantity}
            onChange={(e) => setQuantity(parseInt(e.target.value))}
            className="bg-slate-950/50 border-slate-700 text-white mt-2 w-32"
          />
        </div>

        <div>
          <Label className="text-slate-300">Instruções Específicas (Opcional)</Label>
          <Textarea
            value={customInstructions}
            onChange={(e) => setCustomInstructions(e.target.value)}
            placeholder="Ex: Focar em elementos de horror, incluir NPCs específicos..."
            className="bg-slate-950/50 border-slate-700 text-white mt-2"
          />
        </div>

        <Button
          onClick={handleGenerate}
          disabled={generating}
          className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600"
        >
          {generating ? (
            <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Gerando ganchos...</>
          ) : (
            <><Anchor className="w-5 h-5 mr-2" />Gerar {quantity} Ganchos</>
          )}
        </Button>

        {generatedHooks.length > 0 && (
          <div className="space-y-3 mt-4">
            <h3 className="text-white font-semibold">Ganchos Gerados:</h3>
            {generatedHooks.map((hook, index) => (
              <div key={index} className="flex items-start gap-2 p-3 bg-slate-950/50 border border-slate-700 rounded-lg">
                <Anchor className="w-4 h-4 text-purple-400 mt-1 shrink-0" />
                <p className="text-slate-300 text-sm flex-1">{hook}</p>
                <button onClick={() => handleRemoveHook(index)} className="text-slate-500 hover:text-red-400 shrink-0">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
            <Button
              onClick={handleSaveHooks}
              className="w-full bg-green-700 hover:bg-green-600"
            >
              Salvar {generatedHooks.length} Ganchos
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
