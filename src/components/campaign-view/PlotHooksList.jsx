import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Pencil, Check, X, Trash2, Plus, Lightbulb } from 'lucide-react';

export default function PlotHooksList({ hooks, onSave, isOwner }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedHooks, setEditedHooks] = useState(hooks || []);
  const [newHook, setNewHook] = useState('');

  const handleSave = () => {
    onSave(editedHooks);
    setIsEditing(false);
    setNewHook('');
  };

  const handleCancel = () => {
    setEditedHooks(hooks || []);
    setIsEditing(false);
    setNewHook('');
  };

  const handleUpdateHook = (index, value) => {
    const updated = [...editedHooks];
    updated[index] = value;
    setEditedHooks(updated);
  };

  const handleDeleteHook = (index) => {
    const updated = editedHooks.filter((_, i) => i !== index);
    setEditedHooks(updated);
  };

  const handleAddHook = () => {
    if (newHook.trim()) {
      setEditedHooks([...editedHooks, newHook.trim()]);
      setNewHook('');
    }
  };

  return (
    <div className="p-6 bg-slate-900/50 backdrop-blur-xl border border-purple-900/20 rounded-2xl">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Lightbulb className="w-6 h-6 text-amber-400" />
          Ganchos de Aventura
        </h2>
        {isOwner && !isEditing && (
          <Button
            onClick={() => setIsEditing(true)}
            variant="ghost"
            size="sm"
            className="text-slate-400 hover:text-white"
          >
            <Pencil className="w-4 h-4 mr-2" />
            Editar
          </Button>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-4">
          {editedHooks.map((hook, index) => (
            <div key={index} className="flex gap-2">
              <div className="flex-shrink-0 w-8 h-8 bg-amber-600 rounded-lg flex items-center justify-center text-white font-bold">
                {index + 1}
              </div>
              <Textarea
                value={hook}
                onChange={(e) => handleUpdateHook(index, e.target.value)}
                className="flex-1 bg-slate-950/50 border-slate-700 text-white"
              />
              <Button
                onClick={() => handleDeleteHook(index)}
                variant="ghost"
                size="sm"
                className="text-red-400 hover:text-red-300"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}

          <div className="flex gap-2">
            <Input
              value={newHook}
              onChange={(e) => setNewHook(e.target.value)}
              placeholder="Adicionar novo gancho..."
              className="flex-1 bg-slate-950/50 border-slate-700 text-white"
              onKeyPress={(e) => e.key === 'Enter' && handleAddHook()}
            />
            <Button
              onClick={handleAddHook}
              size="sm"
              className="bg-amber-600 hover:bg-amber-700"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              onClick={handleCancel}
              variant="outline"
              size="sm"
              className="border-slate-700 text-slate-300"
            >
              <X className="w-4 h-4 mr-2" />
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              size="sm"
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Check className="w-4 h-4 mr-2" />
              Salvar
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {editedHooks.map((hook, index) => (
            <div 
              key={index}
              className="p-4 bg-amber-900/10 border border-amber-500/20 rounded-lg hover:bg-amber-900/15 transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-amber-600 rounded-lg flex items-center justify-center text-white font-bold">
                  {index + 1}
                </div>
                <p className="text-slate-300 leading-relaxed flex-1">
                  {hook}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}