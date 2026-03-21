import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, User, Heart, Sword, MessageCircle, Eye, EyeOff } from 'lucide-react';
import AIExpander from './AIExpander';
import EditNpcDialog from './EditNpcDialog';
import NpcInteractionDialog from '../campaign-progression/NpcInteractionDialog';

export default function NpcCard({
  npc,
  onUpdate,
  isOwner = false,
  campaignId,
  campaignContext = '',
  systemRpg = 'D&D 5e'
}) {
  const [expanded, setExpanded] = useState(false);
  const [showShadowFile, setShowShadowFile] = useState(false);
  const [interactionOpen, setInteractionOpen] = useState(false);

  const typeColors = {
    NPC: 'bg-blue-600/20 text-blue-300 border-blue-500/30',
    Monster: 'bg-red-600/20 text-red-300 border-red-500/30',
    Ally: 'bg-green-600/20 text-green-300 border-green-500/30',
    Villain: 'bg-purple-600/20 text-purple-300 border-purple-500/30'
  };

  const typeIcons = {
    NPC: User,
    Monster: Sword,
    Ally: Heart,
    Villain: Sword
  };

  const Icon = typeIcons[npc.type] || User;
  const stats = npc.stats_json || {};
  const shadowFile = stats.shadow_file || {};
  const connections = stats.connections || {};
  const hasShadowFile = shadowFile.operational_secret || shadowFile.vulnerability || shadowFile.hidden_agenda;
  const hasConnections = connections.primary || connections.conflict || connections.resource_dependency;

  const getPowerLabel = (power) => {
    if (power >= 8) return { label: 'Alto', color: 'text-red-400' };
    if (power >= 5) return { label: 'Médio', color: 'text-amber-400' };
    return { label: 'Baixo', color: 'text-green-400' };
  };

  const getInterestLabel = (interest) => {
    if (interest > 3) return { label: 'Aliado', color: 'text-green-400' };
    if (interest < -3) return { label: 'Hostil', color: 'text-red-400' };
    return { label: 'Neutro', color: 'text-amber-400' };
  };

  return (
    <>
      <Card className="bg-slate-900/50 backdrop-blur-xl border-purple-900/20 hover:border-purple-500/50 transition-all">
        <CardHeader
          className="cursor-pointer"
          onClick={() => setExpanded(!expanded)}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className={`p-2 rounded-lg ${typeColors[npc.type] || typeColors.NPC}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <CardTitle className="text-xl text-white">
                  {npc.name}
                </CardTitle>
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge className={`${typeColors[npc.type] || typeColors.NPC} border`}>
                  {npc.type}
                </Badge>
                {stats.archetype && (
                  <Badge variant="outline" className="border-slate-600 text-slate-400 text-xs">
                    {stats.archetype}
                  </Badge>
                )}
                {stats.power !== undefined && (
                  <span className={`text-xs font-semibold ${getPowerLabel(stats.power).color}`}>
                    Poder: {stats.power}/10
                  </span>
                )}
                {stats.interest !== undefined && (
                  <span className={`text-xs font-semibold ${getInterestLabel(stats.interest).color}`}>
                    {getInterestLabel(stats.interest).label} ({stats.interest > 0 ? '+' : ''}{stats.interest})
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1">
              {isOwner && campaignId && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-purple-400 hover:text-purple-300 hover:bg-purple-900/20 p-1 h-auto"
                    onClick={(e) => { e.stopPropagation(); setInteractionOpen(true); }}
                    title="Interagir com NPC"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </Button>
                  <div onClick={(e) => e.stopPropagation()}>
                    <EditNpcDialog npc={npc} onUpdate={onUpdate} />
                  </div>
                </>
              )}
              {expanded ? (
                <ChevronUp className="w-5 h-5 text-slate-400 flex-shrink-0" />
              ) : (
                <ChevronDown className="w-5 h-5 text-slate-400 flex-shrink-0" />
              )}
            </div>
          </div>

          {npc.role && (
            <p className="text-sm text-purple-300 italic mt-2">
              {npc.role}
            </p>
          )}
        </CardHeader>

        {expanded && (
          <CardContent className="space-y-4">
            {npc.description && (
              <div>
                <h4 className="text-sm font-semibold text-slate-400 mb-1">Descrição</h4>
                <p className="text-slate-300 text-sm leading-relaxed">
                  {npc.description}
                </p>
              </div>
            )}

            {npc.motivation && (
              <div>
                <h4 className="text-sm font-semibold text-slate-400 mb-1">Motivação</h4>
                <p className="text-slate-300 text-sm leading-relaxed">
                  {npc.motivation}
                </p>
              </div>
            )}

            {stats.long_term_ambition && (
              <div>
                <h4 className="text-sm font-semibold text-slate-400 mb-1">Ambição de Longo Prazo</h4>
                <p className="text-slate-300 text-sm leading-relaxed">{stats.long_term_ambition}</p>
              </div>
            )}

            {hasConnections && (
              <div>
                <h4 className="text-sm font-semibold text-slate-400 mb-2">Conexões</h4>
                <div className="space-y-1 text-sm">
                  {connections.primary && (
                    <p className="text-slate-300"><span className="text-blue-400">Aliança:</span> {connections.primary}</p>
                  )}
                  {connections.conflict && (
                    <p className="text-slate-300"><span className="text-red-400">Conflito:</span> {connections.conflict}</p>
                  )}
                  {connections.resource_dependency && (
                    <p className="text-slate-300"><span className="text-amber-400">Recurso:</span> {connections.resource_dependency}</p>
                  )}
                </div>
              </div>
            )}

            {isOwner && hasShadowFile && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-semibold text-red-400">Arquivo Sombra</h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-slate-400 hover:text-white p-1 h-auto"
                    onClick={() => setShowShadowFile(!showShadowFile)}
                  >
                    {showShadowFile ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
                {showShadowFile && (
                  <div className="bg-red-950/20 border border-red-900/30 rounded-lg p-3 space-y-2 text-sm">
                    {shadowFile.operational_secret && (
                      <p className="text-slate-300"><span className="text-red-400">Segredo Operacional:</span> {shadowFile.operational_secret}</p>
                    )}
                    {shadowFile.vulnerability && (
                      <p className="text-slate-300"><span className="text-amber-400">Vulnerabilidade:</span> {shadowFile.vulnerability}</p>
                    )}
                    {shadowFile.hidden_agenda && (
                      <p className="text-slate-300"><span className="text-purple-400">Agenda Oculta:</span> {shadowFile.hidden_agenda}</p>
                    )}
                  </div>
                )}
              </div>
            )}

            {stats.stat_block && Object.keys(stats.stat_block).length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-slate-400 mb-2">Bloco de Estatísticas</h4>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(stats.stat_block).map(([stat, value]) => (
                    <div
                      key={stat}
                      className="flex justify-between items-center bg-slate-950/50 p-2 rounded-lg"
                    >
                      <span className="text-xs text-slate-400 uppercase font-semibold">{stat}</span>
                      <span className="text-sm text-amber-400 font-bold">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Fallback para stats simples sem stat_block */}
            {!stats.stat_block && Object.keys(stats).filter(k =>
              !['power','interest','archetype','long_term_ambition','shadow_file','connections','stat_block','appears_in'].includes(k)
            ).length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-slate-400 mb-2">Atributos</h4>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(stats)
                    .filter(([k]) => !['power','interest','archetype','long_term_ambition','shadow_file','connections','stat_block','appears_in'].includes(k))
                    .map(([stat, value]) => (
                      <div
                        key={stat}
                        className="flex justify-between items-center bg-slate-950/50 p-2 rounded-lg"
                      >
                        <span className="text-xs text-slate-400 uppercase font-semibold">{stat}</span>
                        <span className="text-sm text-amber-400 font-bold">{value}</span>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {campaignId && (
              <AIExpander
                content={`${npc.name} (${npc.role}): ${npc.description} | Motivação: ${npc.motivation}`}
                context={campaignContext}
                expandType="npc"
                systemRpg={systemRpg}
              />
            )}
          </CardContent>
        )}
      </Card>

      {isOwner && campaignId && (
        <NpcInteractionDialog
          open={interactionOpen}
          onOpenChange={setInteractionOpen}
          npc={npc}
          campaignId={campaignId}
        />
      )}
    </>
  );
}
