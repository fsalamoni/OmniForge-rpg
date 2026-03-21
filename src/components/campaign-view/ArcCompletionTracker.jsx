import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, Circle, BookOpen } from 'lucide-react';

export default function ArcCompletionTracker({ arc, isOwner }) {
  if (!arc || !arc.acts) return null;

  const totalActs = arc.acts.length;
  const completedActs = arc.acts.filter(a => a.completed).length;
  const totalScenes = arc.acts.reduce((sum, act) => sum + (act.scenes?.length || 0), 0);
  const completedScenes = arc.acts.reduce((sum, act) =>
    sum + (act.scenes?.filter(s => s.completed)?.length || 0), 0);

  const actProgress = totalActs > 0 ? Math.round((completedActs / totalActs) * 100) : 0;
  const sceneProgress = totalScenes > 0 ? Math.round((completedScenes / totalScenes) * 100) : 0;

  return (
    <Card className="bg-slate-950/50 border-slate-700">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-slate-300 flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-purple-400" />
          Progresso do Arco
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
        <div className="flex flex-wrap gap-1 mt-2">
          {arc.acts.map((act, i) => (
            <div key={i} title={act.title}>
              {act.completed
                ? <CheckCircle2 className="w-4 h-4 text-green-400" />
                : <Circle className="w-4 h-4 text-slate-600" />
              }
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
