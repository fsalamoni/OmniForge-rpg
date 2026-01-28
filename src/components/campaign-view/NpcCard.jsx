import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp, User, Heart, Sword } from 'lucide-react';

export default function NpcCard({ npc }) {
  const [expanded, setExpanded] = useState(false);

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

  return (
    <Card className="bg-slate-900/50 backdrop-blur-xl border-purple-900/20 hover:border-purple-500/50 transition-all">
      <CardHeader 
        className="cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className={`p-2 rounded-lg ${typeColors[npc.type]}`}>
                <Icon className="w-5 h-5" />
              </div>
              <CardTitle className="text-xl text-white">
                {npc.name}
              </CardTitle>
            </div>
            
            <Badge className={`${typeColors[npc.type]} border`}>
              {npc.type}
            </Badge>
          </div>
          
          {expanded ? (
            <ChevronUp className="w-5 h-5 text-slate-400 flex-shrink-0" />
          ) : (
            <ChevronDown className="w-5 h-5 text-slate-400 flex-shrink-0" />
          )}
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

          {npc.stats_json && Object.keys(npc.stats_json).length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-slate-400 mb-2">Atributos</h4>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(npc.stats_json).map(([stat, value]) => (
                  <div 
                    key={stat}
                    className="flex justify-between items-center bg-slate-950/50 p-2 rounded-lg"
                  >
                    <span className="text-xs text-slate-400 uppercase font-semibold">
                      {stat}
                    </span>
                    <span className="text-sm text-amber-400 font-bold">
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}