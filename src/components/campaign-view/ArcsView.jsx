import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  ChevronDown,
  ChevronRight,
  BookOpen,
  Target,
  Users,
  MessageSquare,
  Search,
  Swords,
  Gift,
  Lightbulb,
  GitBranch
} from 'lucide-react';
import AIExpander from './AIExpander';
import NarrativeTimeline from './NarrativeTimeline';
import EditArcDialog from './EditArcDialog';
import ArcCompletionTracker from './ArcCompletionTracker';
import ReorderArcsDialog from './ReorderArcsDialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Campaign } from '@/firebase/db';

export default function ArcsView({ arcs, campaignContext = '', systemRpg = 'D&D 5e', gateways = [], campaignId, campaign, isOwner, onRefresh }) {
  const [expandedArcs, setExpandedArcs] = useState({});
  const [expandedActs, setExpandedActs] = useState({});
  const [viewMode, setViewMode] = useState('list');

  const toggleArc = (index) => setExpandedArcs(prev => ({ ...prev, [index]: !prev[index] }));

  const toggleAct = (arcIndex, actIndex) => {
    const key = `${arcIndex}-${actIndex}`;
    setExpandedActs(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleToggleActCompletion = async (arcIndex, actIndex) => {
    if (!isOwner || !campaignId) return;
    const updatedArcs = arcs.map((arc, i) => {
      if (i !== arcIndex) return arc;
      return {
        ...arc,
        acts: arc.acts.map((act, j) =>
          j !== actIndex ? act : { ...act, completed: !act.completed }
        )
      };
    });
    await Campaign.update(campaignId, {
      content_json: { ...campaign.content_json, narrative_arcs: updatedArcs }
    });
    if (onRefresh) onRefresh();
  };

  const handleToggleSceneCompletion = async (arcIndex, actIndex, sceneIndex) => {
    if (!isOwner || !campaignId) return;
    const updatedArcs = arcs.map((arc, i) => {
      if (i !== arcIndex) return arc;
      return {
        ...arc,
        acts: arc.acts.map((act, j) => {
          if (j !== actIndex) return act;
          return {
            ...act,
            scenes: act.scenes.map((scene, k) =>
              k !== sceneIndex ? scene : { ...scene, completed: !scene.completed }
            )
          };
        })
      };
    });
    await Campaign.update(campaignId, {
      content_json: { ...campaign.content_json, narrative_arcs: updatedArcs }
    });
    if (onRefresh) onRefresh();
  };

  const handleSaveArc = async (arcIndex, updatedArc) => {
    const updatedArcs = [...arcs];
    updatedArcs[arcIndex] = updatedArc;
    await Campaign.update(campaignId, {
      content_json: { ...campaign.content_json, narrative_arcs: updatedArcs }
    });
    if (onRefresh) onRefresh();
  };

  const handleReorderArcs = async (reorderedArcs) => {
    await Campaign.update(campaignId, {
      content_json: { ...campaign.content_json, narrative_arcs: reorderedArcs }
    });
    if (onRefresh) onRefresh();
  };

  const challengeTypeColors = {
    'Combate': 'bg-red-600/20 text-red-300 border-red-500/30',
    'Social': 'bg-blue-600/20 text-blue-300 border-blue-500/30',
    'Exploração': 'bg-green-600/20 text-green-300 border-green-500/30',
    'Puzzle': 'bg-purple-600/20 text-purple-300 border-purple-500/30'
  };

  const difficultyColors = {
    'Fácil': 'bg-green-600/20 text-green-300',
    'Médio': 'bg-yellow-600/20 text-yellow-300',
    'Difícil': 'bg-orange-600/20 text-orange-300',
    'Mortal': 'bg-red-600/20 text-red-300'
  };

  if (!arcs || arcs.length === 0) {
    return (
      <div className="text-center py-16 bg-slate-900/30 backdrop-blur-xl border border-slate-800 rounded-2xl">
        <BookOpen className="w-16 h-16 text-slate-600 mx-auto mb-4" />
        <p className="text-slate-400">Nenhum arco narrativo disponível</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <BookOpen className="w-8 h-8 text-purple-400" />
          <div>
            <h2 className="text-2xl font-bold text-white">Arcos Narrativos</h2>
            <p className="text-slate-400">
              {arcs.length} {arcs.length === 1 ? 'arco' : 'arcos'} •{' '}
              {arcs.reduce((sum, arc) => sum + (arc.acts?.length || 0), 0)} atos no total
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {isOwner && arcs.length > 1 && (
            <ReorderArcsDialog arcs={arcs} onReorder={handleReorderArcs} />
          )}
          <Button
            onClick={() => setViewMode('list')}
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            className={viewMode === 'list' ? 'bg-purple-600' : 'border-purple-500/30 text-purple-300'}
          >
            <BookOpen className="w-4 h-4 mr-2" />
            Lista
          </Button>
          <Button
            onClick={() => setViewMode('timeline')}
            variant={viewMode === 'timeline' ? 'default' : 'outline'}
            size="sm"
            className={viewMode === 'timeline' ? 'bg-purple-600' : 'border-purple-500/30 text-purple-300'}
          >
            <GitBranch className="w-4 h-4 mr-2" />
            Timeline
          </Button>
        </div>
      </div>

      {viewMode === 'timeline' && (
        <NarrativeTimeline arcs={arcs} gateways={gateways} />
      )}

      {viewMode === 'list' && (
        <div className="space-y-4">
          {arcs.map((arc, arcIndex) => (
            <Card key={arcIndex} className="bg-slate-900/50 backdrop-blur-xl border-purple-900/20">
              <CardHeader
                className="cursor-pointer hover:bg-slate-800/30 transition-colors"
                onClick={() => toggleArc(arcIndex)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="mt-1">
                      {expandedArcs[arcIndex]
                        ? <ChevronDown className="w-5 h-5 text-purple-400" />
                        : <ChevronRight className="w-5 h-5 text-purple-400" />}
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-xl text-white mb-2">
                        Arco {arcIndex + 1}: {arc.name}
                      </CardTitle>
                      {arc.description && (
                        <p className="text-slate-400 text-sm leading-relaxed">{arc.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    {isOwner && (
                      <EditArcDialog arc={arc} onSave={(updatedArc) => handleSaveArc(arcIndex, updatedArc)} />
                    )}
                    <Badge className="bg-purple-600/20 text-purple-300 border-purple-500/30">
                      {arc.acts?.length || 0} atos
                    </Badge>
                  </div>
                </div>
              </CardHeader>

              {expandedArcs[arcIndex] && arc.acts && arc.acts.length > 0 && (
                <CardContent className="space-y-3">
                  {isOwner && (
                    <ArcCompletionTracker arc={arc} isOwner={isOwner} />
                  )}

                  {(arc.arc_objective || arc.world_change || arc.arc_villain) && (
                    <div className="grid md:grid-cols-3 gap-4 mb-4">
                      {arc.arc_objective && (
                        <div className="bg-purple-900/10 border border-purple-500/20 p-3 rounded-lg">
                          <h5 className="text-purple-300 font-semibold text-xs mb-1">🎯 OBJETIVO DO ARCO</h5>
                          <p className="text-slate-300 text-sm">{arc.arc_objective}</p>
                        </div>
                      )}
                      {arc.world_change && (
                        <div className="bg-blue-900/10 border border-blue-500/20 p-3 rounded-lg">
                          <h5 className="text-blue-300 font-semibold text-xs mb-1">🌍 MUDANÇA DE ESTADO</h5>
                          <p className="text-slate-300 text-sm">{arc.world_change}</p>
                        </div>
                      )}
                      {arc.arc_villain && (
                        <div className="bg-red-900/10 border border-red-500/20 p-3 rounded-lg">
                          <h5 className="text-red-300 font-semibold text-xs mb-1">⚔️ VILÃO DO ARCO</h5>
                          <p className="text-slate-300 text-sm">{arc.arc_villain}</p>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="mb-4">
                    <AIExpander
                      content={`Arco: ${arc.name}\nDescrição: ${arc.description}\nObjetivo: ${arc.arc_objective || 'N/A'}`}
                      context={campaignContext}
                      expandType="arc"
                      systemRpg={systemRpg}
                    />
                  </div>

                  {arc.acts.map((act, actIndex) => {
                    const isExpanded = expandedActs[`${arcIndex}-${actIndex}`];
                    return (
                      <Card key={actIndex} className="bg-slate-950/50 border-slate-700">
                        <CardHeader
                          className="cursor-pointer hover:bg-slate-800/30 transition-colors p-4"
                          onClick={() => toggleAct(arcIndex, actIndex)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-2 flex-1">
                              {isExpanded
                                ? <ChevronDown className="w-4 h-4 text-amber-400 mt-0.5" />
                                : <ChevronRight className="w-4 h-4 text-amber-400 mt-0.5" />}
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  {isOwner && (
                                    <Checkbox
                                      checked={act.completed || false}
                                      onCheckedChange={() => handleToggleActCompletion(arcIndex, actIndex)}
                                      onClick={(e) => e.stopPropagation()}
                                    />
                                  )}
                                  <h4 className={`text-white font-semibold ${act.completed ? 'line-through opacity-60' : ''}`}>
                                    Ato {actIndex + 1}: {act.title}
                                  </h4>
                                </div>
                                {act.description && (
                                  <p className="text-slate-400 text-sm mt-1">{act.description}</p>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardHeader>

                        {isExpanded && (
                          <CardContent className="p-4 pt-0 space-y-4">
                            {act.act_function && (
                              <Badge className="bg-amber-600/20 text-amber-300 border-amber-500/30">
                                {act.act_function === 'setup' && '📖 Setup (Gancho)'}
                                {act.act_function === 'rising_action' && '📈 Rising Action (Complicação)'}
                                {act.act_function === 'climax' && '⚡ Clímax'}
                                {act.act_function === 'falling_action' && '📉 Resolução'}
                                {!['setup','rising_action','climax','falling_action'].includes(act.act_function) && act.act_function}
                              </Badge>
                            )}

                            {act.twist && (
                              <div className="bg-red-900/10 border border-red-500/20 p-3 rounded-lg">
                                <h5 className="text-red-300 font-semibold text-sm mb-2">🔀 TWIST (Reviravolta)</h5>
                                <p className="text-slate-300 text-sm">{act.twist}</p>
                              </div>
                            )}

                            <AIExpander
                              content={`Ato: ${act.title}\nDescrição: ${act.description}\nObjetivos: ${(act.objectives || []).join(', ')}`}
                              context={campaignContext}
                              expandType="act"
                              systemRpg={systemRpg}
                            />

                            {act.objectives && act.objectives.length > 0 && (
                              <div>
                                <h5 className="text-sm font-semibold text-slate-300 mb-2 flex items-center gap-2">
                                  <Target className="w-4 h-4 text-green-400" />
                                  Objetivos
                                </h5>
                                <ul className="space-y-1">
                                  {act.objectives.map((obj, idx) => (
                                    <li key={idx} className="text-slate-400 text-sm flex items-start gap-2">
                                      <span className="text-green-400 mt-0.5">•</span>
                                      <span>{obj}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {act.npcs_involved && act.npcs_involved.length > 0 && (
                              <div>
                                <h5 className="text-sm font-semibold text-slate-300 mb-2 flex items-center gap-2">
                                  <Users className="w-4 h-4 text-purple-400" />
                                  NPCs Envolvidos
                                </h5>
                                <div className="flex flex-wrap gap-2">
                                  {act.npcs_involved.map((npc, idx) => (
                                    <Badge key={idx} className="bg-purple-600/20 text-purple-300 border-purple-500/30">{npc}</Badge>
                                  ))}
                                </div>
                              </div>
                            )}

                            {act.clues && act.clues.length > 0 && (
                              <div>
                                <h5 className="text-sm font-semibold text-slate-300 mb-2 flex items-center gap-2">
                                  <Search className="w-4 h-4 text-amber-400" />
                                  Pistas
                                </h5>
                                <div className="space-y-2">
                                  {act.clues.map((clue, idx) => (
                                    <div key={idx} className="bg-amber-900/10 border border-amber-500/20 p-2 rounded">
                                      <p className="text-slate-300 text-sm">{typeof clue === 'string' ? clue : clue.information}</p>
                                      {clue.how_to_discover && (
                                        <p className="text-slate-400 text-xs mt-1">Como descobrir: {clue.how_to_discover}</p>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {act.challenges && act.challenges.length > 0 && (
                              <div>
                                <h5 className="text-sm font-semibold text-slate-300 mb-2 flex items-center gap-2">
                                  <Swords className="w-4 h-4 text-red-400" />
                                  Desafios
                                </h5>
                                <div className="space-y-3">
                                  {act.challenges.map((challenge, idx) => (
                                    <div key={idx} className="bg-slate-900/50 border border-slate-700 p-3 rounded">
                                      <div className="flex items-center justify-between mb-2">
                                        <Badge className={challengeTypeColors[challenge.type] || 'bg-slate-600/20 text-slate-300'}>
                                          {challenge.type}
                                        </Badge>
                                        {challenge.difficulty && (
                                          <Badge className={difficultyColors[challenge.difficulty]}>{challenge.difficulty}</Badge>
                                        )}
                                      </div>
                                      <p className="text-slate-300 text-sm mb-2">{challenge.description}</p>
                                      <AIExpander
                                        content={`Desafio: ${challenge.description}`}
                                        context={campaignContext}
                                        expandType="challenge"
                                        systemRpg={systemRpg}
                                      />
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {act.scenes && act.scenes.length > 0 && (
                              <div className="space-y-3">
                                <h5 className="text-sm font-semibold text-white mb-3 flex items-center gap-2 bg-slate-800/50 p-2 rounded">
                                  <BookOpen className="w-4 h-4 text-purple-400" />
                                  Cenas ({act.scenes.length})
                                </h5>
                                {act.scenes.map((scene, sceneIdx) => (
                                  <Card key={sceneIdx} className="bg-slate-900/70 border-slate-600">
                                    <CardHeader className="pb-3">
                                      <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                          <div className="flex items-center gap-2 mb-2">
                                            {isOwner && (
                                              <Checkbox
                                                checked={scene.completed || false}
                                                onCheckedChange={() => handleToggleSceneCompletion(arcIndex, actIndex, sceneIdx)}
                                              />
                                            )}
                                            <h6 className={`text-white font-semibold ${scene.completed ? 'line-through opacity-60' : ''}`}>
                                              Cena {sceneIdx + 1}: {scene.scene_name}
                                            </h6>
                                          </div>
                                          {scene.scene_type && (
                                            <Badge className="bg-blue-600/20 text-blue-300 border-blue-500/30">{scene.scene_type}</Badge>
                                          )}
                                        </div>
                                      </div>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                      {scene.trigger && (
                                        <div className="bg-amber-900/10 border-l-4 border-amber-500 p-2">
                                          <p className="text-xs font-semibold text-amber-300 mb-1">⚡ GATILHO</p>
                                          <p className="text-slate-300 text-sm">{scene.trigger}</p>
                                        </div>
                                      )}
                                      {scene.read_aloud && (
                                        <div className="bg-purple-900/10 border border-purple-500/30 p-3 rounded-lg">
                                          <p className="text-xs font-semibold text-purple-300 mb-2">📖 READ-ALOUD TEXT</p>
                                          <p className="text-slate-200 text-sm italic leading-relaxed">{scene.read_aloud}</p>
                                        </div>
                                      )}
                                      {scene.hidden_reality && (
                                        <div className="bg-red-900/10 border border-red-500/20 p-2">
                                          <p className="text-xs font-semibold text-red-300 mb-1">🎭 REALIDADE OCULTA (GM)</p>
                                          <p className="text-slate-300 text-sm">{scene.hidden_reality}</p>
                                        </div>
                                      )}
                                      {scene.objective && (
                                        <div className="bg-green-900/10 border-l-4 border-green-500 p-2">
                                          <p className="text-xs font-semibold text-green-300 mb-1">🎯 OBJETIVO</p>
                                          <p className="text-slate-300 text-sm">{scene.objective}</p>
                                        </div>
                                      )}
                                      {(scene.opposition_passive || scene.opposition_active) && (
                                        <div className="grid md:grid-cols-2 gap-2">
                                          {scene.opposition_passive && (
                                            <div className="bg-slate-800/50 border border-slate-600 p-2 rounded">
                                              <p className="text-xs font-semibold text-slate-300 mb-1">🛡️ Oposição Passiva</p>
                                              <p className="text-slate-400 text-xs">{scene.opposition_passive}</p>
                                            </div>
                                          )}
                                          {scene.opposition_active && (
                                            <div className="bg-red-900/20 border border-red-500/30 p-2 rounded">
                                              <p className="text-xs font-semibold text-red-300 mb-1">⚔️ Oposição Ativa</p>
                                              <p className="text-slate-300 text-xs">{scene.opposition_active}</p>
                                            </div>
                                          )}
                                        </div>
                                      )}
                                      {scene.secrets_and_clues && scene.secrets_and_clues.length > 0 && (
                                        <div className="bg-amber-900/10 border border-amber-500/20 p-2 rounded">
                                          <p className="text-xs font-semibold text-amber-300 mb-2">🔍 SEGREDOS E PISTAS</p>
                                          <div className="space-y-1">
                                            {scene.secrets_and_clues.map((item, i) => (
                                              <div key={i} className="text-xs">
                                                <p className="text-slate-300">• {item.clue}</p>
                                                {item.how_to_find && (
                                                  <p className="text-slate-500 ml-3 italic">Como: {item.how_to_find}</p>
                                                )}
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                      {scene.suggested_checks && scene.suggested_checks.length > 0 && (
                                        <div className="bg-blue-900/10 border border-blue-500/20 p-2 rounded">
                                          <p className="text-xs font-semibold text-blue-300 mb-2">🎲 TESTES E MECÂNICAS</p>
                                          <div className="space-y-2">
                                            {scene.suggested_checks.map((check, i) => (
                                              <div key={i} className="bg-slate-800/50 p-2 rounded text-xs">
                                                <p className="text-white font-semibold">{check.skill} {check.dc && `(CD ${check.dc})`}</p>
                                                {check.on_success && <p className="text-green-400 mt-1">✓ Sucesso: {check.on_success}</p>}
                                                {check.on_failure && <p className="text-red-400 mt-1">✗ Falha: {check.on_failure}</p>}
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                      <div className="grid md:grid-cols-2 gap-2">
                                        {scene.exits && (
                                          <div className="bg-slate-800/50 border border-slate-600 p-2 rounded">
                                            <p className="text-xs font-semibold text-slate-300 mb-1">🚪 Saídas</p>
                                            <p className="text-slate-400 text-xs">{scene.exits}</p>
                                          </div>
                                        )}
                                        {scene.rewards && (
                                          <div className="bg-green-900/20 border border-green-500/30 p-2 rounded">
                                            <p className="text-xs font-semibold text-green-300 mb-1">🎁 Recompensas</p>
                                            <p className="text-slate-300 text-xs">{scene.rewards}</p>
                                          </div>
                                        )}
                                      </div>
                                      {scene.outcomes && scene.outcomes.length > 0 && (
                                        <div className="bg-purple-900/10 border border-purple-500/20 p-2 rounded">
                                          <p className="text-xs font-semibold text-purple-300 mb-1">🎬 Possíveis Finais</p>
                                          <ul className="space-y-1">
                                            {scene.outcomes.map((outcome, i) => (
                                              <li key={i} className="text-slate-300 text-xs">• {outcome}</li>
                                            ))}
                                          </ul>
                                        </div>
                                      )}
                                    </CardContent>
                                  </Card>
                                ))}
                              </div>
                            )}

                            {act.rewards && !act.scenes && (
                              <div>
                                <h5 className="text-sm font-semibold text-slate-300 mb-2 flex items-center gap-2">
                                  <Gift className="w-4 h-4 text-green-400" />
                                  Recompensas
                                </h5>
                                <p className="text-slate-300 text-sm bg-green-900/10 border border-green-500/20 p-2 rounded">{act.rewards}</p>
                              </div>
                            )}
                          </CardContent>
                        )}
                      </Card>
                    );
                  })}
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}

      <div className="p-6 bg-blue-900/10 border border-blue-500/20 rounded-lg">
        <h3 className="text-blue-300 font-semibold mb-2 flex items-center gap-2">
          <Lightbulb className="w-4 h-4" />
          Dica para o Narrador
        </h3>
        <p className="text-slate-400 text-sm leading-relaxed">
          Os arcos narrativos são estruturas flexíveis. Os jogadores não precisam seguir os atos
          na ordem exata — adapte conforme as ações deles. Use as pistas para guiar sutilmente,
          os NPCs envolvidos para criar momentos memoráveis, e os desafios para criar tensão.
        </p>
      </div>
    </div>
  );
}
