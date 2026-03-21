import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { GripVertical, ArrowUpDown, Loader2 } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

export default function ReorderArcsDialog({ arcs, onReorder }) {
  const [open, setOpen] = useState(false);
  const [reorderedArcs, setReorderedArcs] = useState(arcs);
  const [saving, setSaving] = useState(false);

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    const items = Array.from(reorderedArcs);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    setReorderedArcs(items);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onReorder(reorderedArcs);
      setOpen(false);
    } catch (error) {
      alert('Erro ao reordenar: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => {
      setOpen(v);
      if (v) setReorderedArcs(arcs);
    }}>
      <DialogTrigger asChild>
        <Button variant="outline" className="border-purple-500/30 text-purple-300">
          <ArrowUpDown className="w-4 h-4 mr-2" />
          Reordenar Arcos
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-slate-900 border-purple-900/20 max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-white">Reordenar Arcos Narrativos</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p className="text-slate-400 text-sm mb-4">
            Arraste os arcos para reordená-los. A ordem será salva permanentemente.
          </p>
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="arcs">
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                  {reorderedArcs.map((arc, index) => (
                    <Draggable key={index} draggableId={`arc-${index}`} index={index}>
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className="bg-slate-950/50 border border-slate-700 rounded-lg p-4 flex items-center gap-3"
                        >
                          <div {...provided.dragHandleProps} className="cursor-move">
                            <GripVertical className="w-5 h-5 text-slate-500" />
                          </div>
                          <div className="flex-1">
                            <div className="text-white font-semibold">{arc.name}</div>
                            <div className="text-slate-400 text-sm">
                              {arc.acts?.length || 0} atos • {arc.acts?.reduce((sum, act) => sum + (act.scenes?.length || 0), 0) || 0} cenas
                            </div>
                          </div>
                          <div className="text-slate-500 text-sm">#{index + 1}</div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </div>
        <div className="flex justify-end gap-2 pt-4 border-t border-slate-700">
          <Button variant="outline" onClick={() => setOpen(false)} className="border-slate-700">Cancelar</Button>
          <Button onClick={handleSave} disabled={saving} className="bg-purple-600">
            {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Salvando...</> : 'Salvar Ordem'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
