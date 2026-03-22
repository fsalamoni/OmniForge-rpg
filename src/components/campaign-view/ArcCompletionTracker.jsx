import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, Circle, Clock, BookOpen } from 'lucide-react';

export default function ArcCompletionTracker({ arc, isOwner, onToggleAct, onToggleScene }) {
  if (!arc || !arc.acts) return null;

  const totalActs = arc.acts.length;
  const completedActs = arc.acts.filter(a => a.completed).length;
  const totalScenes = arc.acts.reduce((sum, act) => sum + (act.scenes?.length || 0), 0);
  const completedScenes = arc.acts.reduce((sum, act) =>
    sum + (act.scenes?.filter(s => s.completed)?.length || 0), 0);

  const actProgress = totalActs > 0 ? Math.round((completedActs / totalActs) * 100) : 0;
  const sceneProgress = totalScenes > 0 ? Math.round((completedScenes / totalScenes) * 100) : 0;

  // Determine act "status" relative to siblings: first non-completed = "in progress"
  const firstIncompleteIdx = arc.acts.findIndex(a => !a.completed);

  const getActStatus = (act, idx) => {
    if (act.completed) return 'done';
    if (idx === firstIncompleteIdx) return 'active';
    return 'future';
  };

  return (
    <Card className="bg-slate-950/50 border-slate-700">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-slate-300 flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-purple-400" />
          Progresso do Arco
          {isOwner && onToggleAct && (
            <span className="text-xs text-slate-500 ml-auto font-normal">clique para marcar</span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <div className="flex justify-between text-xs text-slate-400 mb-1">
            <span>Atos ({completedActs}/{totalActs})</span>
            <span>{actProgress}%</span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-2">
            <div
              className="bg-purple-500 h-2 rounded-full transition-all"
              style={{ width: `${actProgress}%` }}
            />
          </div>
        </div>
        {totalScenes > 0 && (
          <div>
            <div className="flex justify-between text-xs text-slate-400 mb-1">
              <span>Cenas ({completedScenes}/{totalScenes})</span>
              <span>{sceneProgress}%</span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all"
                style={{ width: `${sceneProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Act icons row */}
        <div className="flex flex-wrap gap-2 mt-2">
          {arc.acts.map((act, i) => {
            const status = getActStatus(act, i);
            const isClickable = isOwner && onToggleAct;
            return (
              <button
                key={i}
                title={`${act.title || `Ato ${i + 1}`}${act.completed ? ' ✓ Concluído' : status === 'active' ? ' ► Em andamento' : ' ○ Pendente'}`}
                onClick={isClickable ? () => onToggleAct(i) : undefined}
                disabled={!isClickable}
                className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs transition-all ${
                  isClickable ? 'cursor-pointer hover:opacity-80' : 'cursor-default'
                } ${
                  status === 'done'
                    ? 'bg-green-900/30 border border-green-500/40 text-green-300'
                    : status === 'active'
                      ? 'bg-blue-900/30 border border-blue-500/40 text-blue-300'
                      : 'bg-slate-800/50 border border-slate-700 text-slate-500'
                }`}
              >
                {status === 'done' ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                ) : status === 'active' ? (
                  <Clock className="w-3.5 h-3.5 text-blue-400" />
                ) : (
                  <Circle className="w-3.5 h-3.5 text-slate-600" />
                )}
                <span className="max-w-[80px] truncate">{act.title || `Ato ${i + 1}`}</span>
              </button>
            );
          })}
        </div>

        {/* Per-act scene progress (only show for active act) */}
        {arc.acts.map((act, actIdx) => {
          if (getActStatus(act, actIdx) !== 'active') return null;
          const scenes = act.scenes || [];
          if (scenes.length === 0) return null;
          return (
            <div key={actIdx} className="pt-2 border-t border-slate-700/50">
              <p className="text-xs text-blue-300 font-semibold mb-2">
                Cenas do ato atual — {act.title}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {scenes.map((scene, scIdx) => {
                  const isClickable = isOwner && onToggleScene;
                  return (
                    <button
                      key={scIdx}
                      title={`${scene.scene_name || `Cena ${scIdx + 1}`}${scene.completed ? ' ✓ Concluída' : ' ○ Pendente'}`}
                      onClick={isClickable ? () => onToggleScene(actIdx, scIdx) : undefined}
                      disabled={!isClickable}
                      className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs transition-all ${
                        isClickable ? 'cursor-pointer hover:opacity-80' : 'cursor-default'
                      } ${
                        scene.completed
                          ? 'bg-green-900/20 border border-green-500/30 text-green-400'
                          : 'bg-slate-800/50 border border-slate-700 text-slate-500'
                      }`}
                    >
                      {scene.completed
                        ? <CheckCircle2 className="w-3 h-3 text-green-400" />
                        : <Circle className="w-3 h-3 text-slate-600" />
                      }
                      <span className="max-w-[90px] truncate">{scene.scene_name || `Cena ${scIdx + 1}`}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
