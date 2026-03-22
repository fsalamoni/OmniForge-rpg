import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, UserPlus } from 'lucide-react';
import { Campaign } from '@/firebase/db';

export default function StakeholdersMatrix({ stakeholders, npcs = [], isOwner = false, campaignId, campaign, onRefresh }) {
  const [selectedStakeholder, setSelectedStakeholder] = useState(null);
  const [importing, setImporting] = useState(false);

  const handleImportNpcs = async () => {
    if (!npcs || npcs.length === 0) return;
    setImporting(true);
    try {
      const existing = stakeholders || [];
      const existingNames = new Set(existing.map(s => s.name?.toLowerCase()));
      const newStakeholders = npcs
        .filter(npc => !existingNames.has(npc.name?.toLowerCase()))
        .map(npc => ({
          name: npc.name,
          role: npc.role || npc.type,
          archetype: npc.type === 'Villain' ? 'Obstrutor' :
                     npc.type === 'Ally' ? 'Facilitador' :
                     npc.type === 'Monster' ? 'Obstrutor' : 'Oportunista',
          description: npc.description || '',
          motivation: npc.motivation || '',
          long_term_goal: npc.stats_json?.long_term_ambition || '',
          interest: npc.stats_json?.interest || 0,
          power: npc.stats_json?.power || 5,
        }));
      if (newStakeholders.length === 0) return;
      const merged = [...existing, ...newStakeholders];
      await Campaign.update(campaignId, {
        content_json: { ...campaign.content_json, stakeholders: merged }
      });
      if (onRefresh) onRefresh();
    } finally {
      setImporting(false);
    }
  };

  const archetypeColors = {
    'Facilitador': 'bg-green-600/20 text-green-300 border-green-500/30',
    'Obstrutor': 'bg-red-600/20 text-red-300 border-red-500/30',
    'Oportunista': 'bg-amber-600/20 text-amber-300 border-amber-500/30',
    'Recurso Chave': 'bg-blue-600/20 text-blue-300 border-blue-500/30'
  };

  const importableNpcsCount = npcs.filter(npc => {
    const existingNames = new Set((stakeholders || []).map(s => s.name?.toLowerCase()));
    return !existingNames.has(npc.name?.toLowerCase());
  }).length;

  if (!stakeholders || stakeholders.length === 0) {
    return (
      <div className="text-center py-8 text-slate-400">
        <Users className="w-12 h-12 mx-auto mb-3 text-slate-600" />
        <p>Nenhum stakeholder disponível</p>
        {isOwner && importableNpcsCount > 0 && (
          <div className="mt-4">
            <Button
              onClick={handleImportNpcs}
              disabled={importing}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Importar NPCs como Stakeholders ({importableNpcsCount})
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {isOwner && importableNpcsCount > 0 && (
        <div className="flex justify-end">
          <Button
            onClick={handleImportNpcs}
            disabled={importing}
            variant="outline"
            className="border-purple-500/30 text-purple-300 hover:bg-purple-900/20"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Importar NPCs como Stakeholders ({importableNpcsCount})
          </Button>
        </div>
      )}

      <Card className="bg-gradient-to-br from-purple-900/30 to-slate-900/30 border-purple-500/30">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-purple-400" />
            Matriz de Stakeholders
          </CardTitle>
          <p className="text-slate-400 text-sm">Poder × Interesse — {stakeholders.length} stakeholders</p>
        </CardHeader>
        <CardContent>
          {/* Visual Matrix */}
          <div className="relative w-full h-80 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 rounded-lg border border-slate-700 overflow-hidden mb-4">
            {/* Axis labels */}
            <div className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-slate-500 -rotate-90 whitespace-nowrap">Poder →</div>
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-xs text-slate-500">Interesse →</div>

            {/* Grid lines */}
            <div className="absolute inset-0 opacity-20">
              <div className="absolute w-full border-t border-slate-600" style={{ top: '50%' }} />
              <div className="absolute h-full border-l border-slate-600" style={{ left: '50%' }} />
            </div>

            {/* Quadrant labels */}
            <div className="absolute top-3 left-3 text-xs text-slate-600">Alto Poder / Baixo Interesse</div>
            <div className="absolute top-3 right-3 text-xs text-slate-600 text-right">Alto Poder / Alto Interesse</div>
            <div className="absolute bottom-8 left-3 text-xs text-slate-600">Baixo Poder / Baixo Interesse</div>
            <div className="absolute bottom-8 right-3 text-xs text-slate-600 text-right">Baixo Poder / Alto Interesse</div>

            {/* Stakeholder dots */}
            {stakeholders.map((s, i) => {
              const power = s.power || 5;
              const interest = s.interest || 0;
              const x = ((interest + 10) / 20) * 90 + 5;
              const y = 100 - ((power / 10) * 90) - 5;

              return (
                <button
                  key={i}
                  className={`absolute group cursor-pointer transition-transform hover:scale-125 z-10 ${selectedStakeholder === i ? 'scale-125' : ''}`}
                  style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)' }}
                  onClick={() => setSelectedStakeholder(selectedStakeholder === i ? null : i)}
                >
                  <div className={`w-3 h-3 rounded-full border-2 ${
                    interest > 3 ? 'bg-green-500 border-green-300' :
                    interest < -3 ? 'bg-red-500 border-red-300' :
                    'bg-amber-500 border-amber-300'
                  }`} />
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block z-20 whitespace-nowrap">
                    <span className="bg-slate-950 text-white text-xs px-2 py-1 rounded border border-slate-700">{s.name}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Stakeholder Cards */}
      <div className="grid md:grid-cols-2 gap-4">
        {stakeholders.map((s, i) => (
          <Card
            key={i}
            className={`bg-slate-900/50 border cursor-pointer transition-all ${selectedStakeholder === i ? 'border-purple-500/70' : 'border-purple-900/20'}`}
            onClick={() => setSelectedStakeholder(selectedStakeholder === i ? null : i)}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="text-white font-semibold">{s.name}</h4>
                  {(s.role || s.title) && <p className="text-slate-400 text-sm">{s.role || s.title}</p>}
                </div>
                {s.archetype && (
                  <Badge className={`text-xs ${archetypeColors[s.archetype] || 'bg-slate-600/20 text-slate-300'}`}>
                    {s.archetype}
                  </Badge>
                )}
              </div>

              <div className="flex gap-4 mb-3">
                <div className="text-center">
                  <p className="text-xs text-slate-400">Poder</p>
                  <p className="text-xl font-bold text-purple-400">{s.power || 5}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-slate-400">Interesse</p>
                  <p className={`text-xl font-bold ${(s.interest || 0) > 0 ? 'text-green-400' : (s.interest || 0) < 0 ? 'text-red-400' : 'text-slate-400'}`}>
                    {(s.interest || 0) > 0 ? '+' : ''}{s.interest || 0}
                  </p>
                </div>
              </div>

              {s.description && (
                <p className="text-slate-400 text-sm line-clamp-2">{s.description}</p>
              )}

              {selectedStakeholder === i && (
                <div className="mt-3 space-y-2 border-t border-slate-700 pt-3">
                  {s.motivation && (
                    <div>
                      <p className="text-xs text-slate-400 font-semibold">MOTIVAÇÃO:</p>
                      <p className="text-slate-300 text-sm">{s.motivation}</p>
                    </div>
                  )}
                  {s.long_term_goal && (
                    <div>
                      <p className="text-xs text-slate-400 font-semibold">AMBIÇÃO:</p>
                      <p className="text-slate-300 text-sm">{s.long_term_goal}</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
