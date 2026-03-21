import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Target, ChevronDown, ChevronRight, Edit } from 'lucide-react';
import EditWbsDialog from './EditWbsDialog';
import { Campaign } from '@/firebase/db';

export default function WbsView({ wbs, isOwner, campaignId, campaign, onRefresh }) {
  const [expandedArcs, setExpandedArcs] = useState({});
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const toggleArc = (index) => setExpandedArcs(prev => ({ ...prev, [index]: !prev[index] }));

  const handleSaveWbs = async (updatedWbs) => {
    await Campaign.update(campaignId, {
      content_json: { ...campaign.content_json, wbs: updatedWbs }
    });
    if (onRefresh) onRefresh();
  };

  const challengeColors = {
    'Combate': 'bg-red-600/20 text-red-300 border-red-500/30',
    'Social': 'bg-blue-600/20 text-blue-300 border-blue-500/30',
    'Exploração': 'bg-green-600/20 text-green-300 border-green-500/30'
  };

  if (!wbs) {
    return (
      <div className="text-center py-8 text-slate-400">
        <Target className="w-12 h-12 mx-auto mb-3 text-slate-600" />
        <p>Estrutura WBS não disponível</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {isOwner && (
        <div className="flex justify-end">
          <Button onClick={() => setEditDialogOpen(true)} variant="outline" className="border-purple-500/30">
            <Edit className="w-4 h-4 mr-2" />
            Editar WBS
          </Button>
        </div>
      )}

      <Card className="bg-gradient-to-br from-purple-900/30 to-slate-900/30 border-purple-500/30">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Target className="w-6 h-6 text-purple-400" />
            Work Breakdown Structure (WBS)
          </CardTitle>
          <p className="text-slate-400 text-sm">Estrutura hierárquica de trabalho da campanha</p>
        </CardHeader>
        {wbs.core_objective && (
          <CardContent>
            <div className="p-4 bg-purple-900/20 border border-purple-500/30 rounded-lg">
              <h4 className="text-purple-300 font-semibold text-sm mb-2">🎯 OBJETIVO MACRO</h4>
              <p className="text-white">{wbs.core_objective}</p>
            </div>
          </CardContent>
        )}
      </Card>

      {wbs.narrative_arcs && wbs.narrative_arcs.length > 0 && (
        <div className="space-y-3">
          {wbs.narrative_arcs.map((arc, arcIdx) => (
            <Card key={arcIdx} className="bg-slate-900/50 border-purple-900/20">
              <CardHeader
                className="cursor-pointer hover:bg-slate-800/30 transition-colors"
                onClick={() => toggleArc(arcIdx)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {expandedArcs[arcIdx]
                      ? <ChevronDown className="w-5 h-5 text-purple-400" />
                      : <ChevronRight className="w-5 h-5 text-purple-400" />}
                    <CardTitle className="text-white">
                      Arco {arcIdx + 1}: {arc.name}
                    </CardTitle>
                  </div>
                  <Badge className="bg-purple-600/20 text-purple-300">
                    {arc.scenes?.length || 0} cenas
                  </Badge>
                </div>
                {arc.description && (
                  <p className="text-slate-400 text-sm ml-8">{arc.description}</p>
                )}
              </CardHeader>

              {expandedArcs[arcIdx] && arc.scenes && arc.scenes.length > 0 && (
                <CardContent>
                  <div className="space-y-2">
                    {arc.scenes.map((scene, sceneIdx) => (
                      <div key={sceneIdx} className="p-3 bg-slate-950/50 border border-slate-700 rounded-lg">
                        <div className="flex items-start justify-between mb-2">
                          <h5 className="text-white font-medium">{scene.name}</h5>
                          {scene.challenge_type && (
                            <Badge className={`text-xs ${challengeColors[scene.challenge_type] || 'bg-slate-600/20 text-slate-300'}`}>
                              {scene.challenge_type}
                            </Badge>
                          )}
                        </div>
                        {scene.input && (
                          <div className="mb-2">
                            <p className="text-xs text-slate-400 font-semibold">INPUT:</p>
                            <p className="text-slate-300 text-sm">{scene.input}</p>
                          </div>
                        )}
                        {scene.process && (
                          <div className="mb-2">
                            <p className="text-xs text-slate-400 font-semibold">PROCESSO:</p>
                            <p className="text-slate-300 text-sm">{scene.process}</p>
                          </div>
                        )}
                        {scene.deliverable && (
                          <div>
                            <p className="text-xs text-green-400 font-semibold">ENTREGÁVEL:</p>
                            <p className="text-slate-300 text-sm">{scene.deliverable}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}

      {isOwner && (
        <EditWbsDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          wbs={wbs}
          onSave={handleSaveWbs}
        />
      )}
    </div>
  );
}
