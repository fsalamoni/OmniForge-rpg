import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Pencil, Loader2 } from 'lucide-react';
import { NpcCreature } from '@/firebase/db';

// Supports both edit mode (npc != null) and create mode (npc == null, requires campaignId + onCreate)
export default function EditNpcDialog({ npc, onUpdate, campaignId, onCreate, open: controlledOpen, onOpenChange: controlledOnOpenChange }) {
  const isCreating = !npc;
  const isControlled = controlledOpen !== undefined;

  const [internalOpen, setInternalOpen] = useState(false);
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? controlledOnOpenChange : setInternalOpen;

  const [loading, setLoading] = useState(false);

  const stats = npc?.stats_json || {};
  const shadowFile = stats.shadow_file || {};
  const connections = stats.connections || {};

  const [formData, setFormData] = useState({
    name: npc?.name || '',
    role: npc?.role || '',
    type: npc?.type || 'NPC',
    motivation: npc?.motivation || '',
    description: npc?.description || '',
    power: stats.power || 5,
    interest: stats.interest || 0,
    archetype: stats.archetype || '',
    long_term_ambition: stats.long_term_ambition || '',
    operational_secret: shadowFile.operational_secret || '',
    vulnerability: shadowFile.vulnerability || '',
    hidden_agenda: shadowFile.hidden_agenda || '',
    connection_primary: connections.primary || '',
    connection_conflict: connections.conflict || '',
    resource_dependency: connections.resource_dependency || ''
  });

  const buildPayload = () => ({
    name: formData.name,
    role: formData.role,
    type: formData.type,
    motivation: formData.motivation,
    description: formData.description,
    stats_json: {
      ...stats,
      power: parseInt(formData.power),
      interest: parseInt(formData.interest),
      archetype: formData.archetype,
      long_term_ambition: formData.long_term_ambition,
      shadow_file: {
        operational_secret: formData.operational_secret,
        vulnerability: formData.vulnerability,
        hidden_agenda: formData.hidden_agenda
      },
      connections: {
        primary: formData.connection_primary,
        conflict: formData.connection_conflict,
        resource_dependency: formData.resource_dependency
      }
    }
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) { alert('O nome é obrigatório.'); return; }
    setLoading(true);
    try {
      if (isCreating) {
        await NpcCreature.create({ campaignId, ...buildPayload() });
        if (onCreate) onCreate();
      } else {
        await NpcCreature.update(npc.id, buildPayload());
        if (onUpdate) onUpdate();
      }
      setOpen(false);
    } catch (error) {
      console.error('Erro ao salvar NPC:', error);
      alert('Erro ao salvar NPC. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const set = (field) => (e) => setFormData(prev => ({ ...prev, [field]: e.target.value }));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!isControlled && (
        <DialogTrigger asChild>
          <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
            <Pencil className="w-4 h-4" />
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-slate-900 border-purple-900/20">
        <DialogHeader>
          <DialogTitle className="text-white text-xl">{isCreating ? 'Novo Personagem / Criatura' : 'Editar Personagem'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-purple-300">Informações Básicas</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label className="text-slate-300">Nome *</Label>
                <Input value={formData.name} onChange={set('name')} className="bg-slate-950/50 border-slate-700 text-white" required />
              </div>
              <div>
                <Label className="text-slate-300">Cargo/Título</Label>
                <Input value={formData.role} onChange={set('role')} className="bg-slate-950/50 border-slate-700 text-white" />
              </div>
              <div>
                <Label className="text-slate-300">Tipo</Label>
                <Select value={formData.type} onValueChange={(v) => setFormData(p => ({ ...p, type: v }))}>
                  <SelectTrigger className="bg-slate-950/50 border-slate-700 text-white"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NPC">NPC</SelectItem>
                    <SelectItem value="Ally">Aliado</SelectItem>
                    <SelectItem value="Villain">Vilão</SelectItem>
                    <SelectItem value="Monster">Monstro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-slate-300">Arquétipo</Label>
                <Select value={formData.archetype} onValueChange={(v) => setFormData(p => ({ ...p, archetype: v }))}>
                  <SelectTrigger className="bg-slate-950/50 border-slate-700 text-white"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Facilitador">Facilitador</SelectItem>
                    <SelectItem value="Obstrutor">Obstrutor</SelectItem>
                    <SelectItem value="Oportunista">Oportunista</SelectItem>
                    <SelectItem value="Recurso Chave">Recurso Chave</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-slate-300">Descrição Completa</Label>
              <Textarea value={formData.description} onChange={set('description')} className="bg-slate-950/50 border-slate-700 text-white min-h-[100px]" />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-purple-300">Matriz de Influência</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label className="text-slate-300">Poder (1-10)</Label>
                <Input type="number" min="1" max="10" value={formData.power} onChange={set('power')} className="bg-slate-950/50 border-slate-700 text-white" />
              </div>
              <div>
                <Label className="text-slate-300">Interesse (-10 a 10)</Label>
                <Input type="number" min="-10" max="10" value={formData.interest} onChange={set('interest')} className="bg-slate-950/50 border-slate-700 text-white" />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-purple-300">Motivações</h3>
            <div>
              <Label className="text-slate-300">Objetivo de Curto Prazo</Label>
              <Textarea value={formData.motivation} onChange={set('motivation')} className="bg-slate-950/50 border-slate-700 text-white" rows={2} />
            </div>
            <div>
              <Label className="text-slate-300">Ambição de Longo Prazo</Label>
              <Textarea value={formData.long_term_ambition} onChange={set('long_term_ambition')} className="bg-slate-950/50 border-slate-700 text-white" rows={2} />
            </div>
          </div>

          <div className="space-y-4 bg-red-900/10 border border-red-500/20 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-red-300">Shadow File 🔒</h3>
            <div>
              <Label className="text-slate-300">Segredo Operacional</Label>
              <Textarea value={formData.operational_secret} onChange={set('operational_secret')} className="bg-slate-950/50 border-slate-700 text-white" rows={2} />
            </div>
            <div>
              <Label className="text-slate-300">Vulnerabilidade</Label>
              <Textarea value={formData.vulnerability} onChange={set('vulnerability')} className="bg-slate-950/50 border-slate-700 text-white" rows={2} />
            </div>
            <div>
              <Label className="text-slate-300">Agenda Oculta</Label>
              <Textarea value={formData.hidden_agenda} onChange={set('hidden_agenda')} className="bg-slate-950/50 border-slate-700 text-white" rows={2} />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-purple-300">Vínculos Operacionais</h3>
            <div>
              <Label className="text-slate-300">Aliado Principal</Label>
              <Input value={formData.connection_primary} onChange={set('connection_primary')} className="bg-slate-950/50 border-slate-700 text-white" />
            </div>
            <div>
              <Label className="text-slate-300">Rival/Conflito</Label>
              <Input value={formData.connection_conflict} onChange={set('connection_conflict')} className="bg-slate-950/50 border-slate-700 text-white" />
            </div>
            <div>
              <Label className="text-slate-300">Dependência de Recurso</Label>
              <Input value={formData.resource_dependency} onChange={set('resource_dependency')} className="bg-slate-950/50 border-slate-700 text-white" />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="border-slate-700 text-slate-300">Cancelar</Button>
            <Button type="submit" disabled={loading} className="bg-purple-600 hover:bg-purple-700">
              {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Salvando...</> : isCreating ? 'Criar Personagem' : 'Salvar Alterações'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
