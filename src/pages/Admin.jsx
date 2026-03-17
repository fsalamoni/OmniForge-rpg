import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { useAuth } from '@/lib/AuthContext';
import { AdminDB, SeedData, RpgSystem } from '@/firebase/db';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Shield,
  Users,
  BookOpen,
  Settings,
  Database,
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  Save,
  Loader2,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Globe,
  Lock,
  Sparkles,
  Eye
} from 'lucide-react';

// ─── Componente de Card de Estatística ──────────────────────────────────────

function StatCard({ label, value, icon: Icon, colorClass }) {
  return (
    <div className={`relative overflow-hidden p-6 bg-slate-900/50 backdrop-blur-xl border rounded-2xl ${colorClass}`}>
      <div className="flex justify-between items-center">
        <div>
          <p className="text-slate-400 text-sm font-medium mb-1">{label}</p>
          <p className="text-4xl font-black text-white">{value ?? '—'}</p>
        </div>
        <div className="p-3 bg-slate-800/50 rounded-xl">
          <Icon className="w-6 h-6 text-slate-300" />
        </div>
      </div>
    </div>
  );
}

// ─── Aba: Visão Geral ────────────────────────────────────────────────────────

function TabOverview() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => AdminDB.getStats()
  });

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">Estatísticas do App</h2>
      {isLoading ? (
        <div className="flex items-center gap-3 text-slate-400">
          <Loader2 className="w-5 h-5 animate-spin" />
          Carregando estatísticas...
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard label="Total de Usuários" value={stats?.totalUsers} icon={Users} colorClass="border-blue-500/30" />
          <StatCard label="Total de Campanhas" value={stats?.totalCampaigns} icon={BookOpen} colorClass="border-purple-500/30" />
          <StatCard label="Campanhas Públicas" value={stats?.publicCampaigns} icon={Globe} colorClass="border-green-500/30" />
          <StatCard label="Campanhas Concluídas" value={stats?.completedCampaigns} icon={Sparkles} colorClass="border-amber-500/30" />
          <StatCard label="Sistemas Globais" value={stats?.globalSystems} icon={Settings} colorClass="border-rose-500/30" />
          <StatCard label="Sistemas Totais" value={stats?.totalSystems} icon={TrendingUp} colorClass="border-slate-500/30" />
        </div>
      )}
    </div>
  );
}

// ─── Aba: Usuários ───────────────────────────────────────────────────────────

const ROLE_OPTIONS = [
  { value: 'user', label: 'Usuário' },
  { value: 'moderator', label: 'Moderador' },
  { value: 'admin', label: 'Administrador' }
];

function TabUsers() {
  const queryClient = useQueryClient();

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => AdminDB.listAllUsers()
  });

  const roleMutation = useMutation({
    mutationFn: ({ uid, role }) => AdminDB.updateUserRole(uid, role),
    onSuccess: () => queryClient.invalidateQueries(['admin-users'])
  });

  const roleColor = (role) => {
    if (role === 'admin') return 'bg-red-600/20 text-red-300 border-red-500/30';
    if (role === 'moderator') return 'bg-amber-600/20 text-amber-300 border-amber-500/30';
    return 'bg-slate-700/50 text-slate-300 border-slate-600/30';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Usuários Cadastrados</h2>
        <span className="text-slate-400 text-sm">{users.length} {users.length === 1 ? 'usuário' : 'usuários'}</span>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-3 text-slate-400">
          <Loader2 className="w-5 h-5 animate-spin" />
          Carregando usuários...
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p>Nenhum usuário encontrado</p>
        </div>
      ) : (
        <div className="space-y-3">
          {users.map((u) => (
            <div
              key={u.id}
              className="flex items-center gap-4 p-4 bg-slate-900/50 border border-slate-800 rounded-xl"
            >
              {u.photoURL ? (
                <img src={u.photoURL} alt="" className="w-10 h-10 rounded-full border border-slate-700" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-amber-500 flex items-center justify-center text-white font-bold text-sm">
                  {(u.full_name || u.email || '?')[0].toUpperCase()}
                </div>
              )}

              <div className="flex-1 min-w-0">
                <p className="text-white font-medium truncate">{u.full_name || 'Sem nome'}</p>
                <p className="text-slate-400 text-sm truncate">{u.email}</p>
              </div>

              <div className="flex items-center gap-3">
                <span className={`px-2 py-1 text-xs rounded-md border font-medium ${roleColor(u.role)}`}>
                  {u.role === 'admin' ? 'Admin' : u.role === 'moderator' ? 'Moderador' : 'Usuário'}
                </span>

                <Select
                  value={u.role || 'user'}
                  onValueChange={(role) => roleMutation.mutate({ uid: u.id, role })}
                >
                  <SelectTrigger className="w-36 bg-slate-800 border-slate-700 text-slate-300 text-sm h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Aba: Campanhas ──────────────────────────────────────────────────────────

function TabCampaigns() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');

  const { data: campaigns = [], isLoading } = useQuery({
    queryKey: ['admin-campaigns'],
    queryFn: () => AdminDB.listAllCampaigns()
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => AdminDB.deleteCampaign(id),
    onSuccess: () => queryClient.invalidateQueries(['admin-campaigns'])
  });

  const filtered = campaigns.filter((c) => {
    if (!searchTerm) return true;
    const s = searchTerm.toLowerCase();
    return (
      c.title?.toLowerCase().includes(s) ||
      c.system_rpg?.toLowerCase().includes(s) ||
      c.setting?.toLowerCase().includes(s)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-white">Todas as Campanhas</h2>
        <span className="text-slate-400 text-sm shrink-0">{campaigns.length} total</span>
      </div>

      <Input
        placeholder="Buscar por título, sistema ou cenário..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="bg-slate-900/50 border-slate-700 text-white"
      />

      {isLoading ? (
        <div className="flex items-center gap-3 text-slate-400">
          <Loader2 className="w-5 h-5 animate-spin" />
          Carregando campanhas...
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p>{searchTerm ? 'Nenhuma campanha encontrada' : 'Sem campanhas ainda'}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((c) => (
            <div
              key={c.id}
              className="flex items-center gap-4 p-4 bg-slate-900/50 border border-slate-800 rounded-xl"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-white font-medium truncate">{c.title || 'Sem título'}</p>
                  {c.is_public ? (
                    <Globe className="w-3.5 h-3.5 text-green-400 shrink-0" />
                  ) : (
                    <Lock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  )}
                  {c.is_completed && (
                    <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  )}
                </div>
                <div className="flex flex-wrap gap-2 text-xs">
                  {c.system_rpg && (
                    <span className="px-2 py-0.5 bg-purple-600/20 text-purple-300 rounded">
                      {c.system_rpg}
                    </span>
                  )}
                  {c.setting && (
                    <span className="px-2 py-0.5 bg-slate-700 text-slate-300 rounded">
                      {c.setting}
                    </span>
                  )}
                  <span className="px-2 py-0.5 bg-slate-800 text-slate-400 rounded">
                    {c.userId?.slice(0, 8)}...
                  </span>
                </div>
              </div>

              <div className="flex gap-2 shrink-0">
                {c.is_completed && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-slate-400 hover:text-white"
                    onClick={() => navigate(createPageUrl('CampaignView') + '?id=' + c.id)}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-red-400 hover:text-red-300"
                  onClick={() => {
                    if (confirm(`Excluir campanha "${c.title}"? Esta ação é irreversível.`)) {
                      deleteMutation.mutate(c.id);
                    }
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Aba: Sistemas RPG (Globais) ─────────────────────────────────────────────

const defaultSystemForm = {
  name: '',
  description: '',
  core_attributes_text: '',
  skill_system: '',
  dice_mechanics: '',
  combat_system: ''
};

function TabSystems() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSystem, setEditingSystem] = useState(null);
  const [formData, setFormData] = useState(defaultSystemForm);

  const { data: systems = [], isLoading } = useQuery({
    queryKey: ['admin-global-systems'],
    queryFn: () => AdminDB.listGlobalSystems()
  });

  const createMutation = useMutation({
    mutationFn: (data) => AdminDB.createGlobalSystem(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-global-systems']);
      queryClient.invalidateQueries(['rpg-systems']);
      setDialogOpen(false);
      resetForm();
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => AdminDB.updateGlobalSystem(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-global-systems']);
      queryClient.invalidateQueries(['rpg-systems']);
      setDialogOpen(false);
      resetForm();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => AdminDB.deleteGlobalSystem(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-global-systems']);
      queryClient.invalidateQueries(['rpg-systems']);
    }
  });

  const resetForm = () => {
    setFormData(defaultSystemForm);
    setEditingSystem(null);
  };

  const handleEdit = (system) => {
    setEditingSystem(system);
    setFormData({
      name: system.name || '',
      description: system.description || '',
      core_attributes_text: (system.core_attributes || []).join(', '),
      skill_system: system.skill_system || '',
      dice_mechanics: system.dice_mechanics || '',
      combat_system: system.combat_system || ''
    });
    setDialogOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const core_attributes = (formData.core_attributes_text || '')
      .split(',').map((s) => s.trim()).filter(Boolean);
    const data = { ...formData, core_attributes };
    delete data.core_attributes_text;

    if (editingSystem) {
      updateMutation.mutate({ id: editingSystem.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Sistemas Globais</h2>
          <p className="text-slate-400 text-sm mt-1">
            Sistemas globais ficam disponíveis para todos os usuários do app.
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={resetForm}
              className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600"
            >
              <Plus className="w-4 h-4 mr-2" />
              Novo Sistema Global
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-900 border-purple-900/20 text-white max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingSystem ? 'Editar Sistema' : 'Novo Sistema Global'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 py-4">
              <div>
                <Label className="text-white mb-2 block">Nome *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="bg-slate-950/50 border-slate-700 text-white"
                  placeholder="Ex: D&D 5ª Edição"
                />
              </div>
              <div>
                <Label className="text-white mb-2 block">Descrição</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="bg-slate-950/50 border-slate-700 text-white"
                  rows={3}
                />
              </div>
              <div>
                <Label className="text-white mb-2 block">Atributos Principais</Label>
                <Input
                  value={formData.core_attributes_text}
                  onChange={(e) => setFormData({ ...formData, core_attributes_text: e.target.value })}
                  className="bg-slate-950/50 border-slate-700 text-white"
                  placeholder="Separe por vírgulas: Força, Destreza, ..."
                />
              </div>
              <div>
                <Label className="text-white mb-2 block">Sistema de Perícias</Label>
                <Textarea
                  value={formData.skill_system}
                  onChange={(e) => setFormData({ ...formData, skill_system: e.target.value })}
                  className="bg-slate-950/50 border-slate-700 text-white"
                  rows={2}
                />
              </div>
              <div>
                <Label className="text-white mb-2 block">Mecânica de Dados</Label>
                <Input
                  value={formData.dice_mechanics}
                  onChange={(e) => setFormData({ ...formData, dice_mechanics: e.target.value })}
                  className="bg-slate-950/50 border-slate-700 text-white"
                />
              </div>
              <div>
                <Label className="text-white mb-2 block">Sistema de Combate</Label>
                <Textarea
                  value={formData.combat_system}
                  onChange={(e) => setFormData({ ...formData, combat_system: e.target.value })}
                  className="bg-slate-950/50 border-slate-700 text-white"
                  rows={2}
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
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
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {(createMutation.isPending || updateMutation.isPending) ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Salvando...</>
                  ) : (
                    <><Save className="w-4 h-4 mr-2" />{editingSystem ? 'Atualizar' : 'Criar'}</>
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-3 text-slate-400">
          <Loader2 className="w-5 h-5 animate-spin" />
          Carregando sistemas...
        </div>
      ) : systems.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <Settings className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p className="mb-2">Nenhum sistema global cadastrado</p>
          <p className="text-sm">Use a aba "Banco de Dados" para popular os sistemas padrão.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {systems.map((system) => (
            <div key={system.id} className="p-5 bg-slate-900/50 border border-purple-900/20 rounded-xl">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="text-white font-semibold">{system.name}</h3>
                  {system.description && (
                    <p className="text-slate-400 text-xs mt-1 line-clamp-2">{system.description}</p>
                  )}
                </div>
                <div className="flex gap-1 ml-3">
                  <Button size="sm" variant="ghost" className="text-slate-400 hover:text-white h-8 w-8 p-0" onClick={() => handleEdit(system)}>
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    size="sm" variant="ghost" className="text-red-400 hover:text-red-300 h-8 w-8 p-0"
                    onClick={() => {
                      if (confirm(`Excluir sistema global "${system.name}"?`)) {
                        deleteMutation.mutate(system.id);
                      }
                    }}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
              <div className="space-y-1 text-xs">
                {system.dice_mechanics && (
                  <p className="text-slate-500">
                    <span className="text-slate-400">Dados: </span>{system.dice_mechanics}
                  </p>
                )}
                {system.core_attributes?.length > 0 && (
                  <p className="text-slate-500">
                    <span className="text-slate-400">Atributos: </span>
                    {system.core_attributes.slice(0, 4).join(', ')}
                    {system.core_attributes.length > 4 && '...'}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Aba: Banco de Dados (Seed) ──────────────────────────────────────────────

function TabDatabase() {
  const queryClient = useQueryClient();
  const [seedStatus, setSeedStatus] = useState(null); // null | 'running' | {added, skipped}
  const [forceStatus, setForceStatus] = useState(null);

  const runSeed = async (force = false) => {
    if (force) {
      setForceStatus('running');
    } else {
      setSeedStatus('running');
    }

    try {
      const fn = force
        ? () => SeedData.forceUpdateRpgSystems((r) => setForceStatus({ ...r }))
        : () => SeedData.seedRpgSystems((r) => setSeedStatus({ ...r }));

      const result = await fn();

      if (force) {
        setForceStatus(result);
      } else {
        setSeedStatus(result);
      }

      queryClient.invalidateQueries(['admin-global-systems']);
      queryClient.invalidateQueries(['rpg-systems']);
      queryClient.invalidateQueries(['admin-stats']);
    } catch (err) {
      console.error('Seed error:', err);
      if (force) setForceStatus({ error: err.message });
      else setSeedStatus({ error: err.message });
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-white mb-1">Gerenciamento do Banco de Dados</h2>
        <p className="text-slate-400">
          Inicialize e mantenha os dados globais do aplicativo.
        </p>
      </div>

      {/* Seed Sistemas RPG */}
      <div className="p-6 bg-slate-900/50 border border-purple-900/20 rounded-2xl space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <Settings className="w-6 h-6 text-purple-400" />
          <h3 className="text-xl font-bold text-white">Sistemas de RPG Globais</h3>
        </div>
        <p className="text-slate-400 text-sm">
          Popula o banco com <strong className="text-white">12 sistemas de RPG</strong> pré-configurados e detalhados
          (D&D 5e, Pathfinder 2e, Call of Cthulhu, Vampire, Savage Worlds, GURPS, Ordem Paranormal,
          Tormenta20, Cyberpunk Red, Fate Core, Shadowrun, Delta Green).
        </p>
        <p className="text-slate-500 text-xs">
          O seed é idempotente — sistemas já existentes são ignorados. Para forçar atualização, use "Forçar Atualização".
        </p>

        <div className="flex flex-wrap gap-3">
          <Button
            onClick={() => runSeed(false)}
            disabled={seedStatus === 'running' || forceStatus === 'running'}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {seedStatus === 'running' ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Populando...</>
            ) : (
              <><Database className="w-4 h-4 mr-2" />Executar Seed</>
            )}
          </Button>

          <Button
            onClick={() => runSeed(true)}
            disabled={seedStatus === 'running' || forceStatus === 'running'}
            variant="outline"
            className="border-amber-700 text-amber-400 hover:bg-amber-900/20"
          >
            {forceStatus === 'running' ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Atualizando...</>
            ) : (
              <><RefreshCw className="w-4 h-4 mr-2" />Forçar Atualização</>
            )}
          </Button>
        </div>

        {/* Resultado do Seed */}
        {seedStatus && seedStatus !== 'running' && (
          <div className="p-4 bg-slate-950/50 rounded-xl space-y-2">
            {seedStatus.error ? (
              <div className="flex items-center gap-2 text-red-400">
                <AlertCircle className="w-4 h-4" />
                <span>Erro: {seedStatus.error}</span>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 text-green-400">
                  <CheckCircle className="w-4 h-4" />
                  <span className="font-medium">Seed concluído!</span>
                </div>
                {seedStatus.added?.length > 0 && (
                  <div className="text-sm">
                    <span className="text-slate-400">Adicionados ({seedStatus.added.length}): </span>
                    <span className="text-green-300">{seedStatus.added.join(', ')}</span>
                  </div>
                )}
                {seedStatus.skipped?.length > 0 && (
                  <div className="text-sm">
                    <span className="text-slate-400">Ignorados (já existiam) ({seedStatus.skipped.length}): </span>
                    <span className="text-slate-500">{seedStatus.skipped.join(', ')}</span>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Resultado do ForceUpdate */}
        {forceStatus && forceStatus !== 'running' && (
          <div className="p-4 bg-slate-950/50 rounded-xl space-y-2">
            {forceStatus.error ? (
              <div className="flex items-center gap-2 text-red-400">
                <AlertCircle className="w-4 h-4" />
                <span>Erro: {forceStatus.error}</span>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 text-amber-400">
                  <CheckCircle className="w-4 h-4" />
                  <span className="font-medium">Atualização forçada concluída!</span>
                </div>
                {forceStatus.updated?.length > 0 && (
                  <div className="text-sm">
                    <span className="text-slate-400">Atualizados ({forceStatus.updated.length}): </span>
                    <span className="text-amber-300">{forceStatus.updated.join(', ')}</span>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Aviso sobre Regras do Firestore */}
      <div className="p-5 bg-blue-900/20 border border-blue-500/20 rounded-xl">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5 shrink-0" />
          <div className="text-sm text-blue-300">
            <p className="font-semibold mb-1">Sobre as regras do Firestore</p>
            <p className="text-blue-400">
              O banco de dados está usando as regras que você configurou no Firebase Console.
              As operações de admin funcionam porque você é o proprietário do projeto Firebase.
              Para maior segurança em produção, as regras podem ser refinadas para distinguir
              usuários admin dos demais por role no Firestore.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Componente Principal: Admin ─────────────────────────────────────────────

export default function Admin() {
  const navigate = useNavigate();
  const { isAdmin, isLoadingAuth } = useAuth();

  // Proteção: se não for admin, redireciona
  if (isLoadingAuth) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4 text-center">
        <Lock className="w-16 h-16 text-red-500/50" />
        <h1 className="text-2xl font-bold text-white">Acesso Negado</h1>
        <p className="text-slate-400 max-w-sm">
          Esta área é restrita a administradores do OmniForge.
        </p>
        <Button variant="outline" onClick={() => navigate(createPageUrl('Dashboard'))}>
          Voltar ao Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <button
          onClick={() => navigate(createPageUrl('Dashboard'))}
          className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Voltar ao Dashboard
        </button>
        <div className="flex items-center gap-3">
          <Shield className="w-10 h-10 text-red-400" />
          <div>
            <h1 className="text-4xl font-bold text-white">Painel Admin</h1>
            <p className="text-slate-400">Gerenciamento completo do OmniForge RPG</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList className="bg-slate-900/50 border border-slate-800 p-1 h-auto flex flex-wrap gap-1">
          <TabsTrigger value="overview" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white text-slate-400">
            <TrendingUp className="w-4 h-4 mr-2" />
            Visão Geral
          </TabsTrigger>
          <TabsTrigger value="users" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white text-slate-400">
            <Users className="w-4 h-4 mr-2" />
            Usuários
          </TabsTrigger>
          <TabsTrigger value="campaigns" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white text-slate-400">
            <BookOpen className="w-4 h-4 mr-2" />
            Campanhas
          </TabsTrigger>
          <TabsTrigger value="systems" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white text-slate-400">
            <Settings className="w-4 h-4 mr-2" />
            Sistemas RPG
          </TabsTrigger>
          <TabsTrigger value="database" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white text-slate-400">
            <Database className="w-4 h-4 mr-2" />
            Banco de Dados
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <TabOverview />
        </TabsContent>
        <TabsContent value="users" className="mt-6">
          <TabUsers />
        </TabsContent>
        <TabsContent value="campaigns" className="mt-6">
          <TabCampaigns />
        </TabsContent>
        <TabsContent value="systems" className="mt-6">
          <TabSystems />
        </TabsContent>
        <TabsContent value="database" className="mt-6">
          <TabDatabase />
        </TabsContent>
      </Tabs>
    </div>
  );
}
