import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, Plus, Trash2 } from 'lucide-react';

const SECTIONS = [
  { key: 'strengths', label: 'Forças', borderColor: 'border-green-500/30' },
  { key: 'weaknesses', label: 'Fraquezas', borderColor: 'border-red-500/30' },
  { key: 'opportunities', label: 'Oportunidades', borderColor: 'border-blue-500/30' },
  { key: 'threats', label: 'Ameaças', borderColor: 'border-amber-500/30' }
];

export default function EditSwotDialog({ open, onOpenChange, swot, onSave }) {
  const [loading, setLoading] = useState(false);
  const [editedSwot, setEditedSwot] = useState(swot || { name: '', backstory: '', motivation: '', strengths: [], weaknesses: [], opportunities: [], threats: [] });

  const handleSave = async () => {
    setLoading(true);
    try {
      await onSave(editedSwot);
      onOpenChange(false);
    } catch (error) {
      alert('Erro ao salvar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const addItem = (field) => setEditedSwot(prev => ({ ...prev, [field]: [...(prev[field] || []), ''] }));
  const removeItem = (field, index) => setEditedSwot(prev => ({ ...prev, [field]: prev[field].filter((_, i) => i !== index) }));
  const updateItem = (field, index, value) => setEditedSwot(prev => ({ ...prev, [field]: prev[field].map((item, i) => i === index ? value : item) }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-purple-900/20 text-white max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Editar SWOT do Antagonista</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div>
            <Label className="text-white mb-2 block">Nome do Antagonista</Label>
            <Input value={editedSwot.name || ''} onChange={(e) => setEditedSwot(p => ({ ...p, name: e.target.value }))} className="bg-slate-950/50 border-slate-700 text-white" />
          </div>
          <div>
            <Label className="text-white mb-2 block">Backstory</Label>
            <Textarea value={editedSwot.backstory || ''} onChange={(e) => setEditedSwot(p => ({ ...p, backstory: e.target.value }))} className="min-h-[80px] bg-slate-950/50 border-slate-700 text-white" />
          </div>
          <div>
            <Label className="text-white mb-2 block">Motivação Profunda</Label>
            <Textarea value={editedSwot.motivation || ''} onChange={(e) => setEditedSwot(p => ({ ...p, motivation: e.target.value }))} className="min-h-[80px] bg-slate-950/50 border-slate-700 text-white" />
          </div>
          {SECTIONS.map((section) => (
            <div key={section.key}>
              <div className="flex items-center justify-between mb-3">
                <Label className="text-white font-semibold">{section.label}</Label>
                <Button onClick={() => addItem(section.key)} size="sm" variant="outline" className={section.borderColor}>
                  <Plus className="w-4 h-4 mr-1" />
                  Adicionar
                </Button>
              </div>
              <div className="space-y-2">
                {(editedSwot[section.key] || []).map((item, index) => (
                  <div key={index} className="flex gap-2">
                    <Textarea value={item} onChange={(e) => updateItem(section.key, index, e.target.value)} className="flex-1 min-h-[70px] bg-slate-950/50 border-slate-700 text-white" />
                    <Button onClick={() => removeItem(section.key, index)} size="sm" variant="ghost" className="text-red-400 hover:text-red-300 shrink-0">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          ))}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="border-slate-700">Cancelar</Button>
            <Button onClick={handleSave} disabled={loading} className="bg-purple-600 hover:bg-purple-700">
              {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Salvando...</> : 'Salvar SWOT'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
