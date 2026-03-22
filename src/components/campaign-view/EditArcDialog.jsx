import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Pencil, Plus, Trash2, GripVertical, Loader2, ChevronDown, ChevronRight } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

export default function EditArcDialog({ arc, onSave, open: controlledOpen, onOpenChange: controlledOnOpenChange }) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? controlledOnOpenChange : setInternalOpen;

  const [saving, setSaving] = useState(false);
  const [editedArc, setEditedArc] = useState(arc);
  const [expandedActs, setExpandedActs] = useState({});

  useEffect(() => {
    if (open) setEditedArc(arc);
  }, [open, arc]);

  const handleSave = async () => {
    if (!editedArc.name?.trim()) {
      alert('O arco precisa ter um nome.');
      return;
    }
    setSaving(true);
    try {
      await onSave(editedArc);
      setOpen(false);
    } catch (error) {
      alert('Erro ao salvar: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleActDragEnd = (result) => {
    if (!result.destination) return;
    const items = Array.from(editedArc.acts);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    setEditedArc({ ...editedArc, acts: items });
  };

  const handleSceneDragEnd = (actIndex, result) => {
    if (!result.destination) return;
    const newActs = [...editedArc.acts];
    const scenes = Array.from(newActs[actIndex].scenes || []);
    const [reorderedItem] = scenes.splice(result.source.index, 1);
    scenes.splice(result.destination.index, 0, reorderedItem);
    newActs[actIndex].scenes = scenes;
    setEditedArc({ ...editedArc, acts: newActs });
  };

  const addAct = () => {
    const newAct = {
      title: 'Novo Ato',
      act_function: 'rising_action',
      description: '',
      objectives: ['Objetivo 1', 'Objetivo 2', 'Objetivo 3'],
      completed: false,
      scenes: []
    };
    setEditedArc({ ...editedArc, acts: [...editedArc.acts, newAct] });
  };

  const updateAct = (actIndex, field, value) => {
    const newActs = [...editedArc.acts];
    newActs[actIndex] = { ...newActs[actIndex], [field]: value };
    setEditedArc({ ...editedArc, acts: newActs });
  };

  const deleteAct = (actIndex) => {
    if (!confirm('Deletar este ato e todas as suas cenas?')) return;
    const newActs = editedArc.acts.filter((_, i) => i !== actIndex);
    setEditedArc({ ...editedArc, acts: newActs });
  };

  const addScene = (actIndex) => {
    const newScene = {
      scene_name: 'Nova Cena',
      scene_type: 'Exploração',
      trigger: 'Descreva o que inicia esta cena',
      read_aloud: 'Texto descritivo para ler aos jogadores',
      hidden_reality: 'O que está escondido nesta cena',
      objective: 'O que os jogadores precisam alcançar',
      opposition_passive: '',
      opposition_active: '',
      outcomes: ['Resultado possível 1', 'Resultado possível 2'],
      exits: 'Para onde esta cena leva',
      rewards: 'Recompensas desta cena',
      completed: false
    };
    const newActs = [...editedArc.acts];
    newActs[actIndex].scenes = [...(newActs[actIndex].scenes || []), newScene];
    setEditedArc({ ...editedArc, acts: newActs });
  };

  const updateScene = (actIndex, sceneIndex, field, value) => {
    const newActs = [...editedArc.acts];
    newActs[actIndex].scenes[sceneIndex] = { 
      ...newActs[actIndex].scenes[sceneIndex], 
      [field]: value 
    };
    setEditedArc({ ...editedArc, acts: newActs });
  };

  const deleteScene = (actIndex, sceneIndex) => {
    if (!confirm('Deletar esta cena?')) return;
    const newActs = [...editedArc.acts];
    newActs[actIndex].scenes = newActs[actIndex].scenes.filter((_, i) => i !== sceneIndex);
    setEditedArc({ ...editedArc, acts: newActs });
  };

  const toggleActExpansion = (actIndex) => {
    setExpandedActs(prev => ({ ...prev, [actIndex]: !prev[actIndex] }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!isControlled && (
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="border-purple-500/30 text-purple-300">
            <Pencil className="w-4 h-4 mr-2" />
            Editar Arco
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="bg-slate-900 border-purple-900/20 max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white">{arc?.name ? `Editar Arco: ${arc.name}` : 'Novo Arco Narrativo'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div>
            <Label className="text-slate-300">Nome do Arco</Label>
            <Input
              value={editedArc.name}
              onChange={(e) => setEditedArc({ ...editedArc, name: e.target.value })}
              className="bg-slate-950/50 border-slate-700 text-white mt-2"
            />
          </div>

          <div>
            <Label className="text-slate-300">Descrição do Arco</Label>
            <Textarea
              value={editedArc.description}
              onChange={(e) => setEditedArc({ ...editedArc, description: e.target.value })}
              className="bg-slate-950/50 border-slate-700 text-white mt-2 min-h-[100px]"
            />
          </div>

          <div className="border-t border-slate-700 pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold">Atos ({editedArc.acts.length})</h3>
              <Button onClick={addAct} size="sm" className="bg-purple-600">
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Ato
              </Button>
            </div>

            <DragDropContext onDragEnd={handleActDragEnd}>
              <Droppable droppableId="acts">
                {(provided) => (
                  <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
                    {editedArc.acts.map((act, actIndex) => (
                      <Draggable key={actIndex} draggableId={`act-${actIndex}`} index={actIndex}>
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className="bg-slate-950/50 border border-slate-700 rounded-lg p-4"
                          >
                            <div className="flex items-start gap-3">
                              <div {...provided.dragHandleProps} className="mt-2 cursor-move">
                                <GripVertical className="w-5 h-5 text-slate-500" />
                              </div>
                              <div className="flex-1 space-y-3">
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => toggleActExpansion(actIndex)}
                                    className="text-purple-400 hover:text-purple-300"
                                  >
                                    {expandedActs[actIndex] ? (
                                      <ChevronDown className="w-5 h-5" />
                                    ) : (
                                      <ChevronRight className="w-5 h-5" />
                                    )}
                                  </button>
                                  <Input
                                    value={act.title}
                                    onChange={(e) => updateAct(actIndex, 'title', e.target.value)}
                                    className="bg-slate-900 border-slate-600 text-white font-semibold"
                                    placeholder="Nome do Ato"
                                  />
                                </div>

                                <Select
                                  value={act.act_function}
                                  onValueChange={(val) => updateAct(actIndex, 'act_function', val)}
                                >
                                  <SelectTrigger className="bg-slate-900 border-slate-600 text-white">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="setup">Setup (Apresentação)</SelectItem>
                                    <SelectItem value="rising_action">Rising Action (Complicação)</SelectItem>
                                    <SelectItem value="climax">Climax (Clímax)</SelectItem>
                                    <SelectItem value="falling_action">Falling Action (Resolução)</SelectItem>
                                  </SelectContent>
                                </Select>

                                <Textarea
                                  value={act.description}
                                  onChange={(e) => updateAct(actIndex, 'description', e.target.value)}
                                  className="bg-slate-900 border-slate-600 text-white"
                                  placeholder="Descrição do ato..."
                                />

                                {expandedActs[actIndex] && (
                                  <div className="space-y-3 pl-4 border-l-2 border-purple-500/30">
                                    <div className="flex items-center justify-between">
                                      <Label className="text-slate-400">Cenas ({act.scenes?.length || 0})</Label>
                                      <Button
                                        onClick={() => addScene(actIndex)}
                                        size="sm"
                                        variant="outline"
                                        className="border-blue-500/30 text-blue-300"
                                      >
                                        <Plus className="w-3 h-3 mr-1" />
                                        Nova Cena
                                      </Button>
                                    </div>

                                    <DragDropContext onDragEnd={(result) => handleSceneDragEnd(actIndex, result)}>
                                      <Droppable droppableId={`scenes-${actIndex}`}>
                                        {(provided) => (
                                          <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                                            {(act.scenes || []).map((scene, sceneIndex) => (
                                              <Draggable 
                                                key={sceneIndex} 
                                                draggableId={`scene-${actIndex}-${sceneIndex}`} 
                                                index={sceneIndex}
                                              >
                                                {(provided) => (
                                                  <div
                                                    ref={provided.innerRef}
                                                    {...provided.draggableProps}
                                                    className="bg-slate-900/70 border border-slate-600 rounded p-3"
                                                  >
                                                    <div className="flex items-start gap-2">
                                                      <div {...provided.dragHandleProps} className="mt-2 cursor-move">
                                                        <GripVertical className="w-4 h-4 text-slate-600" />
                                                      </div>
                                                      <div className="flex-1 space-y-2">
                                                        <Input
                                                          value={scene.scene_name}
                                                          onChange={(e) => updateScene(actIndex, sceneIndex, 'scene_name', e.target.value)}
                                                          className="bg-slate-950 border-slate-700 text-white text-sm"
                                                          placeholder="Nome da Cena"
                                                        />
                                                        <Select
                                                          value={scene.scene_type}
                                                          onValueChange={(val) => updateScene(actIndex, sceneIndex, 'scene_type', val)}
                                                        >
                                                          <SelectTrigger className="bg-slate-950 border-slate-700 text-white text-sm">
                                                            <SelectValue />
                                                          </SelectTrigger>
                                                          <SelectContent>
                                                            <SelectItem value="Social">Social</SelectItem>
                                                            <SelectItem value="Combate">Combate</SelectItem>
                                                            <SelectItem value="Exploração">Exploração</SelectItem>
                                                            <SelectItem value="Puzzle">Puzzle</SelectItem>
                                                            <SelectItem value="Híbrido">Híbrido</SelectItem>
                                                          </SelectContent>
                                                        </Select>
                                                        <Textarea
                                                          value={scene.read_aloud}
                                                          onChange={(e) => updateScene(actIndex, sceneIndex, 'read_aloud', e.target.value)}
                                                          className="bg-slate-950 border-slate-700 text-white text-sm"
                                                          placeholder="Texto para ler aos jogadores..."
                                                          rows={2}
                                                        />
                                                      </div>
                                                      <Button
                                                        onClick={() => deleteScene(actIndex, sceneIndex)}
                                                        size="sm"
                                                        variant="ghost"
                                                        className="text-red-400 hover:bg-red-900/20"
                                                      >
                                                        <Trash2 className="w-3 h-3" />
                                                      </Button>
                                                    </div>
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
                                )}
                              </div>
                              <Button
                                onClick={() => deleteAct(actIndex)}
                                size="sm"
                                variant="ghost"
                                className="text-red-400 hover:bg-red-900/20"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
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
            <Button variant="outline" onClick={() => setOpen(false)} className="border-slate-700">
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving} className="bg-purple-600">
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar Alterações'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}