import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { GitBranch, CheckCircle2, Clock, ChevronRight, ChevronDown, Maximize2, Minimize2 } from 'lucide-react';

export default function NarrativeTimeline({ arcs = [], gateways = [] }) {
  const [expandedArcs, setExpandedArcs] = useState({});
  const [fullView, setFullView] = useState(false);

  const toggleArc = (index) => setExpandedArcs(prev => ({ ...prev, [index]: !prev[index] }));

  const toggleAllArcs = () => {
    if (Object.keys(expandedArcs).length === arcs.length) {
      setExpandedArcs({});
    } else {
      const allExpanded = {};
      arcs.forEach((_, i) => { allExpanded[i] = true; });
      setExpandedArcs(allExpanded);
    }
  };

  if (!arcs || arcs.length === 0) {
    return <div className="text-center py-8 text-slate-400">Nenhum arco narrativo disponível</div>;
  }

  const totalActs = arcs.reduce((sum, arc) => sum + (arc.acts?.length || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">Linha do Tempo Narrativa</h2>
          <p className="text-slate-400 text-sm">
            {arcs.length} {arcs.length === 1 ? 'arco' : 'arcos'} • {totalActs} {totalActs === 1 ? 'ato' : 'atos'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={toggleAllArcs} variant="outline" size="sm" className="border-purple-500/30 text-purple-300">
            {Object.keys(expandedArcs).length === arcs.length ? 'Recolher Todos' : 'Expandir Todos'}
          </Button>
          <Button onClick={() => setFullView(!fullView)} variant="outline" size="sm" className="border-purple-500/30 text-purple-300">
            {fullView ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      <div className="relative">
        <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-purple-500 via-purple-600 to-purple-700" />
        <div className="space-y-8">
          {arcs.map((arc, arcIndex) => {
            const isExpanded = expandedArcs[arcIndex];
            const acts = arc.acts || [];
            return (
              <div key={arcIndex} className="relative">
                <div className="absolute left-8 top-6 w-6 h-6 -ml-3 rounded-full bg-purple-600 border-4 border-slate-900 z-10 flex items-center justify-center">
                  <span className="text-white text-xs font-bold">{arcIndex + 1}</span>
                </div>
                <div className="ml-20">
                  <Card className="bg-gradient-to-br from-purple-900/30 to-slate-900/50 border-purple-500/30 hover:border-purple-500/50 transition-all">
                    <CardHeader className="cursor-pointer" onClick={() => toggleArc(arcIndex)}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {isExpanded ? <ChevronDown className="w-5 h-5 text-purple-400" /> : <ChevronRight className="w-5 h-5 text-purple-400" />}
                            <CardTitle className="text-white text-xl">{arc.name}</CardTitle>
                          </div>
                          {!isExpanded && (
                            <p className="text-slate-400 text-sm line-clamp-2 ml-7">{arc.description}</p>
                          )}
                        </div>
                        <Badge className="bg-purple-600/20 text-purple-300 ml-4">
                          {acts.length} {acts.length === 1 ? 'ato' : 'atos'}
                        </Badge>
                      </div>
                    </CardHeader>
                    {isExpanded && (
                      <CardContent className="space-y-4">
                        <p className="text-slate-300 leading-relaxed border-l-2 border-purple-500/30 pl-4">{arc.description}</p>
                        <div className="relative pl-6 space-y-4">
                          <div className="absolute left-2 top-2 bottom-2 w-px bg-slate-700" />
                          {acts.map((act, actIndex) => (
                            <div key={actIndex} className="relative">
                              <div className="absolute left-2 top-3 w-4 h-4 -ml-2 rounded-full bg-slate-700 border-2 border-slate-900 z-10" />
                              <div className="ml-6 p-4 bg-slate-950/50 border border-slate-700 rounded-lg hover:border-purple-500/30 transition-all">
                                <div className="flex items-start justify-between mb-2">
                                  <h4 className="text-white font-semibold flex items-center gap-2">
                                    <span className="text-purple-400 text-sm">Ato {actIndex + 1}:</span>
                                    {act.title}
                                  </h4>
                                  <Clock className="w-4 h-4 text-slate-500 flex-shrink-0" />
                                </div>
                                {fullView && act.description && (
                                  <p className="text-slate-400 text-sm">{act.description}</p>
                                )}
                                {fullView && act.objectives?.length > 0 && (
                                  <ul className="mt-2 space-y-1">
                                    {act.objectives.map((obj, i) => (
                                      <li key={i} className="text-slate-400 text-xs flex items-start gap-2">
                                        <CheckCircle2 className="w-3 h-3 text-green-400 flex-shrink-0 mt-0.5" />
                                        {obj}
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                              {gateways?.some(g => g.trigger?.toLowerCase().includes(act.title?.toLowerCase())) && (
                                <div className="ml-6 mt-2 p-3 bg-amber-900/10 border border-amber-500/20 rounded-lg">
                                  <div className="flex items-center gap-2 text-amber-300 text-xs font-semibold">
                                    <GitBranch className="w-3 h-3" />
                                    Ponto de Decisão Crítico
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    )}
                  </Card>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <Card className="bg-slate-900/50 border-purple-900/20">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-purple-600" />
              <span className="text-slate-400">Arco Narrativo</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-slate-700" />
              <span className="text-slate-400">Ato Individual</span>
            </div>
            <div className="flex items-center gap-2">
              <GitBranch className="w-4 h-4 text-amber-400" />
              <span className="text-slate-400">Decisão Crítica</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
