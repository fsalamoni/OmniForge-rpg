import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Loader2 } from 'lucide-react';
import { CampaignReward } from '@/firebase/db';

export default function AddRewardDialog({ campaignId, onRewardAdded }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    reward_type: 'XP',
    description: '',
    quantity: '',
    session_number: '',
    arc_name: '',
    scene_name: '',
    awarded_to: 'Grupo todo'
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.description.trim()) {
      alert('Descrição é obrigatória');
      return;
    }
    setLoading(true);
    try {
      await CampaignReward.create({
        campaignId,
        ...formData,
        session_number: formData.session_number ? parseInt(formData.session_number) : null
      });
      setOpen(false);
      setFormData({
        reward_type: 'XP',
        description: '',
        quantity: '',
        session_number: '',
        arc_name: '',
        scene_name: '',
        awarded_to: 'Grupo todo'
      });
      if (onRewardAdded) onRewardAdded();
    } catch (error) {
      console.error('Erro ao criar recompensa:', error);
      alert('Erro ao adicionar recompensa. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-purple-600 to-purple-700">
          <Plus className="w-4 h-4 mr-2" />
          Adicionar Recompensa
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-slate-900 border-purple-900/20 max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-white">Nova Recompensa</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label className="text-slate-300">Tipo de Recompensa *</Label>
              <Select value={formData.reward_type} onValueChange={(v) => setFormData({ ...formData, reward_type: v })}>
                <SelectTrigger className="bg-slate-950/50 border-slate-700 text-white mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="XP">XP</SelectItem>
                  <SelectItem value="Item">Item</SelectItem>
                  <SelectItem value="Informação">Informação</SelectItem>
                  <SelectItem value="Favor">Favor</SelectItem>
                  <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                  <SelectItem value="Contato">Contato</SelectItem>
                  <SelectItem value="Outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-slate-300">Quantidade</Label>
              <Input
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                placeholder="Ex: 500 XP, 3 poções"
                className="bg-slate-950/50 border-slate-700 text-white mt-2"
              />
            </div>
          </div>

          <div>
            <Label className="text-slate-300">Descrição *</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descreva a recompensa..."
              className="bg-slate-950/50 border-slate-700 text-white mt-2 min-h-[100px]"
              required
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label className="text-slate-300">Número da Sessão</Label>
              <Input
                type="number"
                value={formData.session_number}
                onChange={(e) => setFormData({ ...formData, session_number: e.target.value })}
                placeholder="Ex: 5"
                className="bg-slate-950/50 border-slate-700 text-white mt-2"
              />
            </div>

            <div>
              <Label className="text-slate-300">Concedida Para</Label>
              <Input
                value={formData.awarded_to}
                onChange={(e) => setFormData({ ...formData, awarded_to: e.target.value })}
                placeholder="Ex: Grupo todo, Personagem X"
                className="bg-slate-950/50 border-slate-700 text-white mt-2"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label className="text-slate-300">Arco Narrativo</Label>
              <Input
                value={formData.arc_name}
                onChange={(e) => setFormData({ ...formData, arc_name: e.target.value })}
                placeholder="Ex: O Mistério das Sombras"
                className="bg-slate-950/50 border-slate-700 text-white mt-2"
              />
            </div>

            <div>
              <Label className="text-slate-300">Cena</Label>
              <Input
                value={formData.scene_name}
                onChange={(e) => setFormData({ ...formData, scene_name: e.target.value })}
                placeholder="Ex: Confronto Final"
                className="bg-slate-950/50 border-slate-700 text-white mt-2"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="border-slate-700">
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="bg-purple-600 hover:bg-purple-700">
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Adicionar Recompensa'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
