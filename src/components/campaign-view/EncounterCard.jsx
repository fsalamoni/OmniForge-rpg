import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Swords, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function EncounterCard({ encounter, index }) {
  const [expanded, setExpanded] = useState(false);

  const difficultyConfig = {
    'Fácil': { color: 'text-green-300', bg: 'bg-green-600/20', border: 'border-green-500/30' },
    'Médio': { color: 'text-yellow-300', bg: 'bg-yellow-600/20', border: 'border-yellow-500/30' },
    'Difícil': { color: 'text-red-300', bg: 'bg-red-600/20', border: 'border-red-500/30' },
    'Mortal': { color: 'text-purple-300', bg: 'bg-purple-600/20', border: 'border-purple-500/30' }
  };

  const config = difficultyConfig[encounter.difficulty] || difficultyConfig['Médio'];

  return (
    <div className={cn(
      "p-5 bg-slate-950/50 border rounded-xl transition-all",
      expanded ? 'border-purple-500/30' : 'border-slate-700'
    )}>
      <div 
        className="flex items-start justify-between cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex-shrink-0 w-8 h-8 bg-purple-600/20 rounded-lg flex items-center justify-center text-purple-300 font-bold">
              {index + 1}
            </div>
            <h3 className="text-lg font-semibold text-white">
              {encounter.name}
            </h3>
          </div>
          
          {!expanded && encounter.description && (
            <p className="text-slate-400 text-sm line-clamp-2 ml-11">
              {encounter.description}
            </p>
          )}
        </div>

        <div className="flex items-center gap-3 ml-4">
          <span className={cn(
            "px-3 py-1 rounded-lg text-xs font-medium border",
            config.bg, config.color, config.border
          )}>
            {encounter.difficulty}
          </span>
          {expanded ? (
            <ChevronUp className="w-5 h-5 text-slate-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-slate-400" />
          )}
        </div>
      </div>

      {expanded && (
        <div className="mt-4 ml-11 space-y-4 animate-in slide-in-from-top-2">
          {encounter.description && (
            <div className="p-4 bg-slate-900/50 rounded-lg">
              <p className="text-slate-300 leading-relaxed">
                {encounter.description}
              </p>
            </div>
          )}

          {encounter.creatures && encounter.creatures.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Swords className="w-4 h-4 text-purple-400" />
                <h4 className="text-sm font-semibold text-white">
                  Criaturas e Inimigos
                </h4>
              </div>
              <div className="space-y-2">
                {encounter.creatures.map((creature, cIndex) => (
                  <div 
                    key={cIndex}
                    className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg border border-slate-700/50"
                  >
                    <span className="text-slate-300 font-medium">
                      {creature.name}
                    </span>
                    {creature.quantity > 1 && (
                      <span className="px-2 py-1 bg-slate-800 text-slate-400 text-xs rounded">
                        x{creature.quantity}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {encounter.tactics && (
            <div className="p-4 bg-amber-900/10 border border-amber-500/20 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <h4 className="text-sm font-semibold text-white">Táticas</h4>
              </div>
              <p className="text-slate-300 text-sm">
                {encounter.tactics}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}