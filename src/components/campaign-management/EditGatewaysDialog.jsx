import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, Plus, Trash2 } from 'lucide-react';

export default function EditGatewaysDialog({ open, onOpenChange, gateways, onSave }) {
  const [loading, setLoading] = useState(false);
  const [editedGateways, setEditedGateways] = useState(gateways || []);

  const handleSave = async () => {
    setLoading(true);
    try {
      await onSave(editedGateways);
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao salvar gateways:', error);
      alert('Erro ao salvar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const addGateway = () => {
    setEditedGateways([...editedGateways, { trigger: '', condition: '', consequence_a: '', consequence_b: '', impact: '' }]);
  };

  const removeGateway = (index) => {
    setEditedGateways(prev => prev.filter((_, i) => i !== index));
  };

  const updateGateway = (index, field, value) => {
    setEditedGateways(prev => prev.map((g, i) => i === index ? { ...g, [field]: value } : g));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-purple-900/20 text-white max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Editar Decision Flow Gateways</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="flex items-center justify-between">
            <p className="text-slate-400 text-sm">Pontos de decisão que ramificam a narrativa</p>
            <Button onClick={addGateway} size="sm" variant="outline" className="border-purple-500/30">
              <Plus className="w-4 h-4 mr-1" />
              Adicionar Gateway
            </Button>
          </div>
          <div className="space-y-6">
            {editedGateways.map((gateway, index) => (
              <div key={index} className="p-4 bg-slate-950/50 border border-slate-700 rounded-lg space-y-4">
                <div className="flex items-start justify-between">
                  <h3 className="text-lg font-semibold text-purple-300">Gateway {index + 1}</h3>
                  <Button onClick={() => removeGateway(index)} size="sm" variant="ghost" className="text-red-400 hover:text-red-300">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                <div>
                  <Label className="text-slate-300 text-sm mb-1 block">Trigger (Situação Ativadora)</Label>
                  <Textarea value={gateway.trigger} onChange={(e) => updateGateway(index, 'trigger', e.target.value)} placeholder="Ex: Durante a infiltração no palácio..." className="min-h-[70px] bg-slate-900 border-slate-600 text-white" />
                </div>
                <div>
                  <Label className="text-slate-300 text-sm mb-1 block">Condição (Se...)</Label>
                  <Textarea value={gateway.condition} onChange={(e) => updateGateway(index, 'condition', e.target.value)} placeholder="Se os jogadores..." className="min-h-[70px] bg-slate-900 border-slate-600 text-white" />
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-green-300 text-sm mb-1 block">Consequência A (Verdadeiro)</Label>
                    <Textarea value={gateway.consequence_a} onChange={(e) => updateGateway(index, 'consequence_a', e.target.value)} placeholder="O que acontece se for verdadeiro..." className="min-h-[90px] bg-slate-900 border-green-600/30 text-white" />
                  </div>
                  <div>
                    <Label className="text-red-300 text-sm mb-1 block">Consequência B (Falso)</Label>
                    <Textarea value={gateway.consequence_b} onChange={(e) => updateGateway(index, 'consequence_b', e.target.value)} placeholder="O que acontece se for falso..." className="min-h-[90px] bg-slate-900 border-red-600/30 text-white" />
                  </div>
                </div>
                <div>
                  <Label className="text-slate-300 text-sm mb-1 block">Impacto na WBS</Label>
                  <Textarea value={gateway.impact} onChange={(e) => updateGateway(index, 'impact', e.target.value)} placeholder="Como isso afeta os arcos narrativos..." className="min-h-[70px] bg-slate-900 border-slate-600 text-white" />
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="border-slate-700">Cancelar</Button>
            <Button onClick={handleSave} disabled={loading} className="bg-purple-600 hover:bg-purple-700">
              {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Salvando...</> : 'Salvar Gateways'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
