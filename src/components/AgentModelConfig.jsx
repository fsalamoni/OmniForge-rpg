/**
 * OmniForge RPG — Agent Model Configuration
 *
 * Componente que permite configurar o modelo de IA para cada agente
 * do pipeline, com seleção individual via catálogo do usuário.
 *
 * Segue o padrão de design OmniForge (slate-900 + purple accents).
 */

import React, { useState, useMemo, useCallback } from 'react';
import ModelCatalogModal from '@/components/ModelCatalogModal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Bot,
  Cpu,
  BookOpen,
  RotateCcw,
  Save,
  Loader2,
  Info,
} from 'lucide-react';
import { PIPELINE_AGENT_DEFS } from '@/lib/model-config';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CATEGORY_COLORS = {
  extraction: 'bg-purple-600/20 text-purple-400 border-purple-500/30',
  synthesis: 'bg-blue-600/20 text-blue-400 border-blue-500/30',
  reasoning: 'bg-amber-600/20 text-amber-400 border-amber-500/30',
  writing: 'bg-emerald-600/20 text-emerald-400 border-emerald-500/30',
};

const CATEGORY_LABELS = {
  extraction: 'Extração',
  synthesis: 'Síntese',
  reasoning: 'Raciocínio',
  writing: 'Redação',
};

const CATEGORY_TIPS = {
  extraction: 'Agentes de extração processam dados brutos e identificam informações.',
  synthesis: 'Agentes de síntese combinam informações para criar conteúdo coerente.',
  reasoning: 'Agentes de raciocínio avaliam lógica, consequências e coerência.',
  writing: 'Agentes de redação produzem texto narrativo criativo e descritivo.',
};

// ---------------------------------------------------------------------------
// Agent Row Component
// ---------------------------------------------------------------------------

function AgentRow({ agent, currentModelId, modelLabel, onOpenCatalog }) {
  const isEmpty = !currentModelId;
  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
      {/* Agent info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-white text-sm">{agent.label}</span>
          <Badge
            className={`text-[10px] px-1.5 py-0 border ${CATEGORY_COLORS[agent.agentCategory] || 'text-slate-400 border-slate-600'}`}
          >
            {CATEGORY_LABELS[agent.agentCategory] || agent.agentCategory}
          </Badge>
        </div>
        <p className="text-xs text-slate-500 mt-0.5 truncate">{agent.description}</p>
      </div>

      {/* Current model */}
      <button
        type="button"
        onClick={() => onOpenCatalog(agent)}
        className={`flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs hover:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-purple-500 transition-colors min-w-[200px] max-w-[280px] ${
          isEmpty
            ? 'border-amber-600/50 bg-amber-950/20 text-amber-400'
            : 'border-slate-700 bg-slate-950/50 text-white'
        }`}
      >
        <Cpu className={`w-3 h-3 shrink-0 ${isEmpty ? 'text-amber-500' : 'text-slate-500'}`} />
        <span className={`truncate ${isEmpty ? 'text-amber-400 italic' : 'text-slate-300'}`}>
          {isEmpty ? 'Selecione um modelo...' : (modelLabel || currentModelId)}
        </span>
        <BookOpen className="w-3 h-3 text-purple-400 shrink-0 ml-auto" />
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

/**
 * @param {Object} props
 * @param {Record<string, string>} props.agentModels — mapa {agentKey → modelId}
 * @param {function} props.onAgentModelsChange — callback (newMap) => void
 * @param {Array} props.catalogModels — modelos disponíveis para seleção
 * @param {boolean} props.isSaving — indica se está salvando
 * @param {function} props.onSave — callback para salvar no Firestore
 * @param {function} props.onReset — callback para resetar para defaults
 */
export default function AgentModelConfig({
  agentModels = {},
  onAgentModelsChange,
  catalogModels = [],
  isSaving = false,
  onSave,
  onReset,
}) {
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [activeAgent, setActiveAgent] = useState(null);

  // Group agents by category for visual organization
  const groupedAgents = useMemo(() => {
    const groups = {};
    for (const cat of ['writing', 'synthesis', 'reasoning', 'extraction']) {
      groups[cat] = PIPELINE_AGENT_DEFS.filter((a) => a.agentCategory === cat);
    }
    return groups;
  }, []);

  // Build lookup map for model labels
  const modelLabelMap = useMemo(() => {
    const map = {};
    for (const m of catalogModels) {
      map[m.id] = m.label;
    }
    return map;
  }, [catalogModels]);

  const handleOpenCatalog = useCallback((agent) => {
    setActiveAgent(agent);
    setCatalogOpen(true);
  }, []);

  const handleSelectModel = useCallback(
    (model) => {
      if (!activeAgent) return;
      const newMap = { ...agentModels, [activeAgent.key]: model.id };
      onAgentModelsChange?.(newMap);
    },
    [activeAgent, agentModels, onAgentModelsChange]
  );

  const changedCount = useMemo(() => {
    let count = 0;
    for (const def of PIPELINE_AGENT_DEFS) {
      if (agentModels[def.key] && agentModels[def.key] !== def.defaultModel) {
        count++;
      }
    }
    return count;
  }, [agentModels]);

  return (
    <Card className="bg-slate-900/50 backdrop-blur-xl border-purple-900/20">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Bot className="w-6 h-6 text-purple-400" />
          Modelos por Agente
        </CardTitle>
        <p className="text-slate-400 text-sm mt-1">
          Configure o modelo de IA ideal para cada agente do pipeline. Modelos diferentes podem ser
          mais eficazes para tarefas específicas como escrita criativa, raciocínio lógico ou extração de dados.
        </p>
      </CardHeader>
      <CardContent className="p-0">
        <TooltipProvider delayDuration={200}>
          {Object.entries(groupedAgents).map(([category, agents]) => (
            <div key={category}>
              {/* Category header */}
              <div className="px-4 py-2 bg-slate-800/30 flex items-center gap-2">
                <Badge
                  className={`text-[10px] px-2 py-0.5 border ${CATEGORY_COLORS[category]}`}
                >
                  {CATEGORY_LABELS[category]}
                </Badge>
                <span className="text-[10px] text-slate-500">
                  {agents.length} agentes
                </span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="w-3 h-3 text-slate-600 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="bg-slate-800 text-white border-slate-700 max-w-[250px]">
                    <p className="text-xs">{CATEGORY_TIPS[category]}</p>
                  </TooltipContent>
                </Tooltip>
              </div>

              {/* Agent rows */}
              {agents.map((agent) => {
                // Use explicit check: empty string '' means "no model assigned"
                const rawId = agentModels[agent.key];
                const effectiveModelId = rawId === '' ? '' : (rawId || agent.defaultModel);
                return (
                  <AgentRow
                    key={agent.key}
                    agent={agent}
                    currentModelId={effectiveModelId}
                    modelLabel={effectiveModelId ? modelLabelMap[effectiveModelId] : ''}
                    onOpenCatalog={handleOpenCatalog}
                  />
                );
              })}
            </div>
          ))}
        </TooltipProvider>

        {/* Actions footer */}
        <div className="px-4 py-3 border-t border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onReset}
              className="border-slate-600 text-slate-300 hover:text-white hover:bg-slate-800"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
              Restaurar Padrões
            </Button>
            {changedCount > 0 && (
              <span className="text-[11px] text-purple-400">
                {changedCount} agente{changedCount !== 1 ? 's' : ''} personalizado{changedCount !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          <Button
            type="button"
            size="sm"
            onClick={onSave}
            disabled={isSaving}
            className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white"
          >
            {isSaving ? (
              <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />Salvando...</>
            ) : (
              <><Save className="w-3.5 h-3.5 mr-1.5" />Salvar Modelos</>
            )}
          </Button>
        </div>
      </CardContent>

      {/* Model Catalog Modal */}
      <ModelCatalogModal
        open={catalogOpen}
        onOpenChange={setCatalogOpen}
        models={catalogModels}
        selectedModelId={activeAgent
          ? (agentModels[activeAgent.key] === '' ? '' : (agentModels[activeAgent.key] || activeAgent.defaultModel))
          : ''
        }
        onSelect={handleSelectModel}
        agentLabel={activeAgent?.label || ''}
        agentCategory={activeAgent?.agentCategory || ''}
      />
    </Card>
  );
}
