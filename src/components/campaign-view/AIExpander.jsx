import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2, ChevronUp } from 'lucide-react';
import { invokeLLM, validateAIConfig } from '@/lib/aiClient';
import { AGENT_IDS } from '@/lib/aiAgents';
import { useAuth } from '@/lib/AuthContext';

/**
 * AIExpander - Botão "Expandir com IA" para gerar mais detalhes sobre um conteúdo
 */
export default function AIExpander({
  content,
  context,
  expandType = 'general',
  systemRpg = 'D&D 5e',
  onExpanded
}) {
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [expandedContent, setExpandedContent] = useState('');
  const { userProfile } = useAuth();

  const getPrompt = () => {
    switch (expandType) {
      case 'npc':
        return `Você é um mestre de RPG especialista em ${systemRpg}. Expanda e aprofunde os DETALHES deste NPC:\n\n${content}\n\nCONTEXTO DA CAMPANHA:\n${context}\n\nGere MAIS DETALHES sobre este NPC em 3 áreas (mínimo 4-5 sentenças CADA):\n\n1. HISTÓRICO DETALHADO: Infância, eventos formativos, relacionamentos passados\n2. PERSONALIDADE PROFUNDA: Medos secretos, desejos ocultos, contradições internas\n3. HOOKS DE INTERAÇÃO: 3-4 formas específicas que os jogadores podem interagir\n\nSeja ESPECÍFICO e CINEMATOGRÁFICO. Use as regras de ${systemRpg}.`;
      case 'act':
        return `Você é um mestre de RPG especialista em ${systemRpg}. Expanda este ATO com mais cenas e detalhes:\n\n${content}\n\nCONTEXTO DA CAMPANHA:\n${context}\n\nGere CONTEÚDO ADICIONAL para este ato:\n\n1. CENAS INTERMEDIÁRIAS: 2-3 cenas menores\n2. DIÁLOGOS SUGERIDOS: 2-3 diálogos-chave\n3. PISTAS ADICIONAIS: 2-3 pistas extras\n4. EVENTOS ALEATÓRIOS: 2 eventos surpresa\n\nUse as regras e atmosfera de ${systemRpg}.`;
      case 'arc':
        return `Você é um mestre de RPG especialista em ${systemRpg}. Expanda este ARCO NARRATIVO:\n\n${content}\n\nCONTEXTO DA CAMPANHA:\n${context}\n\nGere MATERIAL ADICIONAL:\n\n1. SUB-TRAMAS: 2 sub-tramas paralelas\n2. NPCS SECUNDÁRIOS: 2-3 NPCs memoráveis\n3. LOCAIS IMPORTANTES: 3-4 locais-chave\n4. TWISTS POTENCIAIS: 2-3 reviravoltas\n\nSeja DETALHADO e use as regras de ${systemRpg}.`;
      default:
        return `Você é um mestre de RPG especialista em ${systemRpg}. Expanda e detalhe o seguinte conteúdo:\n\n${content}\n\nCONTEXTO DA CAMPANHA:\n${context}\n\nForneça MAIS DETALHES, EXEMPLOS CONCRETOS e ELEMENTOS JOGÁVEIS. Seja específico e use as regras de ${systemRpg}.`;
    }
  };

  const handleExpand = async () => {
    const configError = validateAIConfig(userProfile?.aiConfig);
    if (configError) {
      alert(configError);
      return;
    }
    setLoading(true);
    try {
      const result = await invokeLLM({
        prompt: getPrompt(),
        userAIConfig: userProfile.aiConfig,
        agentKey: AGENT_IDS.AI_EXPANDER,
        agentModels: userProfile?.agentModels || {}
      });
      setExpandedContent(result);
      setExpanded(true);
      if (onExpanded) onExpanded(result);
    } catch (error) {
      console.error('Erro ao expandir com IA:', error);
      alert('Erro ao gerar conteúdo adicional. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <Button
        onClick={handleExpand}
        disabled={loading}
        variant="outline"
        size="sm"
        className="border-purple-500/30 text-purple-300 hover:bg-purple-900/20"
      >
        {loading ? (
          <><Loader2 className="w-3 h-3 mr-2 animate-spin" />Gerando...</>
        ) : (
          <><Sparkles className="w-3 h-3 mr-2" />Expandir com IA</>
        )}
      </Button>

      {expanded && expandedContent && (
        <div className="mt-4 p-4 bg-purple-900/10 border border-purple-500/20 rounded-lg space-y-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-purple-300 font-semibold text-sm flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Conteúdo Expandido pela IA
            </span>
            <button onClick={() => setExpanded(false)} className="text-slate-400 hover:text-white">
              <ChevronUp className="w-4 h-4" />
            </button>
          </div>
          <p className="text-slate-300 text-sm whitespace-pre-wrap leading-relaxed">
            {expandedContent}
          </p>
        </div>
      )}
    </div>
  );
}
