import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { useAuth } from '@/lib/AuthContext';
import { RpgSystem } from '@/firebase/db';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  Settings as SettingsIcon,
  Plus,
  Pencil,
  Trash2,
  ArrowLeft,
  Save,
  Loader2
} from 'lucide-react';

const defaultForm = {
  name: '',
  description: '',
  core_attributes: [],
  core_attributes_text: '',
  skill_system: '',
  dice_mechanics: '',
  combat_system: '',
  is_custom: true,
  is_active: true
};

export default function Settings() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [editingSystem, setEditingSystem] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState(defaultForm);

  const { data: systems = [], isLoading } = useQuery({
    queryKey: ['rpg-systems', user?.uid],
    queryFn: () => RpgSystem.list(user.uid),
    enabled: !!user
  });

  const createMutation = useMutation({
    mutationFn: (data) => RpgSystem.create({ ...data, userId: user.uid }),
    onSuccess: () => {
      queryClient.invalidateQueries(['rpg-systems', user?.uid]);
      setDialogOpen(false);
      resetForm();
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => RpgSystem.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['rpg-systems', user?.uid]);
      setDialogOpen(false);
      setEditingSystem(null);
      resetForm();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => RpgSystem.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['rpg-systems', user?.uid]);
    }
  });

  const resetForm = () => {
    setFormData(defaultForm);
    setEditingSystem(null);
  };

  const handleEdit = (system) => {
    setEditingSystem(system);
    setFormData({
      name: system.name,
      description: system.description || '',
      core_attributes: system.core_attributes || [],
      core_attributes_text: (system.core_attributes || []).join(', '),
      skill_system: system.skill_system || '',
      dice_mechanics: system.dice_mechanics || '',
      combat_system: system.combat_system || '',
      is_custom: system.is_custom,
      is_active: system.is_active
    });
    setDialogOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const attributesArray = (formData.core_attributes_text || '')
      .split(',')
      .map(s => s.trim())
      .filter(s => s);

    const data = { ...formData, core_attributes: attributesArray };
    delete data.core_attributes_text;

    if (editingSystem) {
      updateMutation.mutate({ id: editingSystem.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <button
          onClick={() => navigate(createPageUrl('Dashboard'))}
          className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Voltar ao Dashboard
        </button>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <SettingsIcon className="w-10 h-10 text-purple-400" />
              <h1 className="text-4xl font-bold text-white">Sistemas de RPG</h1>
            </div>
            <p className="text-slate-400 text-lg">
              Gerencie os sistemas de RPG disponíveis para criação de suas campanhas
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={resetForm}
                className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600"
              >
                <Plus className="w-5 h-5 mr-2" />
                Novo Sistema
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-900 border-purple-900/20 text-white max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-2xl">
                  {editingSystem ? 'Editar Sistema' : 'Novo Sistema de RPG'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-6 py-4">
                <div>
                  <Label className="text-white mb-2 block">Nome do Sistema *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: D&D 5e, Pathfinder, Call of Cthulhu"
                    required
                    className="bg-slate-950/50 border-slate-700 text-white"
                  />
                </div>
                <div>
                  <Label className="text-white mb-2 block">Descrição</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Breve descrição do sistema e suas características"
                    className="bg-slate-950/50 border-slate-700 text-white"
                  />
                </div>
                <div>
                  <Label className="text-white mb-2 block">Atributos Principais</Label>
                  <Input
                    value={formData.core_attributes_text}
                    onChange={(e) => setFormData({ ...formData, core_attributes_text: e.target.value })}
                    placeholder="Ex: Força, Destreza, Constituição, Inteligência, Sabedoria, Carisma"
                    className="bg-slate-950/50 border-slate-700 text-white"
                  />
                  <p className="text-slate-500 text-sm mt-1">Separe por vírgulas</p>
                </div>
                <div>
                  <Label className="text-white mb-2 block">Sistema de Perícias</Label>
                  <Textarea
                    value={formData.skill_system}
                    onChange={(e) => setFormData({ ...formData, skill_system: e.target.value })}
                    placeholder="Ex: Baseado em atributos + bônus de proficiência"
                    className="bg-slate-950/50 border-slate-700 text-white"
                  />
                </div>
                <div>
                  <Label className="text-white mb-2 block">Mecânica de Dados</Label>
                  <Input
                    value={formData.dice_mechanics}
                    onChange={(e) => setFormData({ ...formData, dice_mechanics: e.target.value })}
                    placeholder="Ex: d20 + modificadores vs DC"
                    className="bg-slate-950/50 border-slate-700 text-white"
                  />
                </div>
                <div>
                  <Label className="text-white mb-2 block">Sistema de Combate</Label>
                  <Textarea
                    value={formData.combat_system}
                    onChange={(e) => setFormData({ ...formData, combat_system: e.target.value })}
                    placeholder="Ex: Baseado em turnos, iniciativa por Destreza"
                    className="bg-slate-950/50 border-slate-700 text-white"
                  />
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => { setDialogOpen(false); resetForm(); }}
                    className="border-slate-700 text-slate-300"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={createMutation.isPending || updateMutation.isPending}
                    className="bg-gradient-to-r from-purple-600 to-purple-700"
                  >
                    {(createMutation.isPending || updateMutation.isPending) ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        {editingSystem ? 'Atualizar' : 'Criar Sistema'}
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div>
        {isLoading ? (
          <div className="text-center py-16">
            <Loader2 className="w-12 h-12 text-purple-500 animate-spin mx-auto mb-4" />
            <p className="text-slate-400">Carregando sistemas...</p>
          </div>
        ) : systems.length === 0 ? (
          <div className="text-center py-16 bg-slate-900/30 backdrop-blur-xl border border-slate-800 rounded-2xl">
            <SettingsIcon className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400 text-lg mb-4">Nenhum sistema cadastrado ainda</p>
            <p className="text-slate-500 text-sm">
              Crie sistemas personalizados para gerar campanhas mais precisas
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {systems.map((system) => (
              <div key={system.id} className="p-6 bg-slate-900/50 backdrop-blur-xl border border-purple-900/20 rounded-2xl">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-xl font-bold text-white">{system.name}</h3>
                      {system.is_custom && (
                        <span className="px-2 py-1 bg-purple-600/20 text-purple-300 text-xs rounded-lg">Custom</span>
                      )}
                    </div>
                    {system.description && (
                      <p className="text-slate-400 text-sm mb-3">{system.description}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleEdit(system)}
                      variant="ghost"
                      size="sm"
                      className="text-slate-400 hover:text-white"
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    {system.is_custom && (
                      <Button
                        onClick={() => {
                          if (confirm('Tem certeza que deseja excluir este sistema?')) {
                            deleteMutation.mutate(system.id);
                          }
                        }}
                        variant="ghost"
                        size="sm"
                        className="text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
                <div className="space-y-3 text-sm">
                  {system.core_attributes?.length > 0 && (
                    <div>
                      <span className="text-slate-500">Atributos: </span>
                      <span className="text-slate-300">{system.core_attributes.join(', ')}</span>
                    </div>
                  )}
                  {system.dice_mechanics && (
                    <div>
                      <span className="text-slate-500">Dados: </span>
                      <span className="text-slate-300">{system.dice_mechanics}</span>
                    </div>
                  )}
                  {system.skill_system && (
                    <div>
                      <span className="text-slate-500">Perícias: </span>
                      <span className="text-slate-300">{system.skill_system}</span>
                    </div>
                  )}
                  {system.combat_system && (
                    <div>
                      <span className="text-slate-500">Combate: </span>
                      <span className="text-slate-300">{system.combat_system}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
