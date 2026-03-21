import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Plus, Trash2 } from 'lucide-react';

export default function EditWbsDialog({ open, onOpenChange, wbs, onSave }) {
  const [loading, setLoading] = useState(false);
  const [editedWbs, setEditedWbs] = useState(wbs || { core_objective: '', narrative_arcs: [] });

  const handleSave = async () => {
    setLoading(true);
    try {
      await onSave(editedWbs);
      onOpenChange(false);
    } catch (error) {
      alert('Erro ao salvar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const addArc = () => setEditedWbs(p => ({ ...p, narrative_arcs: [...p.narrative_arcs, { name: '', description: '', scenes: [] }] }));
  const removeArc = (i) => setEditedWbs(p => ({ ...p, narrative_arcs: p.narrative_arcs.filter((_, idx) => idx !== i) }));
  const updateArc = (i, field, value) => setEditedWbs(p => ({ ...p, narrative_arcs: p.narrative_arcs.map((a, idx) => idx === i ? { ...a, [field]: value } : a) }));

  const addScene = (arcIdx) => setEditedWbs(p => {
    const arcs = [...p.narrative_arcs];
    arcs[arcIdx].scenes = [...(arcs[arcIdx].scenes || []), { name: '', input: '', process: '', challenge_type: 'Combate', deliverable: '' }];
    return { ...p, narrative_arcs: arcs };
  });

  const removeScene = (arcIdx, sceneIdx) => setEditedWbs(p => {
    const arcs = [...p.narrative_arcs];
    arcs[arcIdx].scenes = arcs[arcIdx].scenes.filter((_, i) => i !== sceneIdx);
    return { ...p, narrative_arcs: arcs };
  });

  const updateScene = (arcIdx, sceneIdx, field, value) => setEditedWbs(p => {
    const arcs = [...p.narrative_arcs];
    arcs[arcIdx].scenes[sceneIdx] = { ...arcs[arcIdx].scenes[sceneIdx], [field]: value };
    return { ...p, narrative_arcs: arcs };
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-purple-900/20 text-white max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Editar WBS da Campanha</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div>
            <Label className="text-white mb-2 block font-semibold">Objetivo Macro (Core Objective)</Label>
            <Textarea value={editedWbs.core_objective || ''} onChange={(e) => setEditedWbs(p => ({ ...p, core_objective: e.target.value }))} className="min-h-[70px] bg-slate-950/50 border-slate-700 text-white" />
          </div>
          <div>
            <div className="flex items-center justify-between mb-3">
              <Label className="text-white font-semibold">Arcos Narrativos</Label>
              <Button onClick={addArc} size="sm" variant="outline" className="border-purple-500/30">
                <Plus className="w-4 h-4 mr-1" />
                Adicionar Arco
              </Button>
            </div>
            <div className="space-y-6">
              {(editedWbs.narrative_arcs || []).map((arc, arcIdx) => (
                <div key={arcIdx} className="p-4 bg-slate-950/50 border border-slate-700 rounded-lg space-y-4">
                  <div className="flex items-start justify-between">
                    <h3 className="text-lg font-semibold text-purple-300">Arco {arcIdx + 1}</h3>
                    <Button onClick={() => removeArc(arcIdx)} size="sm" variant="ghost" className="text-red-400 hover:text-red-300">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <Input value={arc.name || ''} onChange={(e) => updateArc(arcIdx, 'name', e.target.value)} placeholder="Nome do Arco" className="bg-slate-900 border-slate-600 text-white" />
                  <Textarea value={arc.description || ''} onChange={(e) => updateArc(arcIdx, 'description', e.target.value)} placeholder="Descrição..." className="min-h-[80px] bg-slate-900 border-slate-600 text-white" />
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-slate-300 text-sm">Cenas</Label>
                      <Button onClick={() => addScene(arcIdx)} size="sm" variant="outline" className="border-slate-600 text-xs">
                        <Plus className="w-3 h-3 mr-1" />
                        Adicionar Cena
                      </Button>
                    </div>
                    <div className="space-y-3">
                      {(arc.scenes || []).map((scene, sceneIdx) => (
                        <div key={sceneIdx} className="p-3 bg-slate-900 border border-slate-600 rounded space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-slate-400">Cena {sceneIdx + 1}</span>
                            <Button onClick={() => removeScene(arcIdx, sceneIdx)} size="sm" variant="ghost" className="text-red-400 h-6 w-6 p-0">
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                          <Input value={scene.name || ''} onChange={(e) => updateScene(arcIdx, sceneIdx, 'name', e.target.value)} placeholder="Nome da cena" className="bg-slate-950 border-slate-600 text-white text-sm" />
                          <Select value={scene.challenge_type || 'Combate'} onValueChange={(v) => updateScene(arcIdx, sceneIdx, 'challenge_type', v)}>
                            <SelectTrigger className="bg-slate-950 border-slate-600 text-white text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Combate">⚔️ Combate</SelectItem>
                              <SelectItem value="Social">💬 Social</SelectItem>
                              <SelectItem value="Exploração">🗺️ Exploração</SelectItem>
                            </SelectContent>
                          </Select>
                          <Textarea value={scene.process || ''} onChange={(e) => updateScene(arcIdx, sceneIdx, 'process', e.target.value)} placeholder="Desafio central" className="min-h-[60px] bg-slate-950 border-slate-600 text-white text-sm" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="border-slate-700">Cancelar</Button>
            <Button onClick={handleSave} disabled={loading} className="bg-purple-600 hover:bg-purple-700">
              {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Salvando...</> : 'Salvar WBS'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
