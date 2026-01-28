import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Pencil, Check, X, Loader2 } from 'lucide-react';

export default function EditableSection({ title, content, onSave, icon: Icon }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(content);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(editedContent);
      setIsEditing(false);
    } catch (error) {
      console.error('Erro ao salvar:', error);
      alert('Erro ao salvar. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditedContent(content);
    setIsEditing(false);
  };

  return (
    <div className="p-6 bg-slate-900/50 backdrop-blur-xl border border-purple-900/20 rounded-2xl">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          {Icon && <Icon className="w-6 h-6 text-purple-400" />}
          {title}
        </h2>
        {!isEditing && (
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
          <Textarea
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
            className="min-h-[200px] bg-slate-950/50 border-slate-700 text-white"
          />
          <div className="flex justify-end gap-2">
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
              disabled={saving}
              size="sm"
              className="bg-purple-600 hover:bg-purple-700"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Check className="w-4 h-4 mr-2" />
              )}
              Salvar
            </Button>
          </div>
        </div>
      ) : (
        <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">
          {content}
        </p>
      )}
    </div>
  );
}