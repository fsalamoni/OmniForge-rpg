import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { useAuth } from '@/lib/AuthContext';
import { Campaign, NpcCreature } from '@/firebase/db';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import NpcCard from '../components/campaign-view/NpcCard';
import GenerateNpcDialog from '../components/campaign-view/GenerateNpcDialog';
import GenerateEncounterDialog from '../components/campaign-view/GenerateEncounterDialog';
import EditableSection from '../components/campaign-view/EditableSection';
import EncounterCard from '../components/campaign-view/EncounterCard';
import PlotHooksList from '../components/campaign-view/PlotHooksList';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  ArrowLeft,
  BookOpen,
  Users,
  StickyNote,
  Settings,
  Globe,
  Lock,
  Loader2,
  Share2,
  Sparkles
} from 'lucide-react';

export default function CampaignView() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const campaignId = searchParams.get('id');
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [masterNotes, setMasterNotes] = useState('');
  const [notesChanged, setNotesChanged] = useState(false);
  const [npcFilter, setNpcFilter] = useState('all');

  const { data: campaign, isLoading } = useQuery({
    queryKey: ['campaign', campaignId],
    queryFn: async () => {
      const camp = await Campaign.get(campaignId);
      if (camp) setMasterNotes(camp.master_notes || '');
      return camp;
    },
    enabled: !!campaignId
  });

  const { data: npcs = [] } = useQuery({
    queryKey: ['npcs', campaignId],
    queryFn: () => NpcCreature.listByCampaign(campaignId),
    enabled: !!campaignId
  });

  const updateNotesMutation = useMutation({
    mutationFn: () => Campaign.update(campaignId, { master_notes: masterNotes }),
    onSuccess: () => {
      queryClient.invalidateQueries(['campaign', campaignId]);
      setNotesChanged(false);
    }
  });

  const togglePublicMutation = useMutation({
    mutationFn: () => Campaign.update(campaignId, { is_public: !campaign.is_public }),
    onSuccess: () => queryClient.invalidateQueries(['campaign', campaignId])
  });

  const updateContentMutation = useMutation({
    mutationFn: (newContent) => Campaign.update(campaignId, { content_json: newContent }),
    onSuccess: () => queryClient.invalidateQueries(['campaign', campaignId])
  });

  const handleUpdateSummary = async (newSummary) => {
    const updatedContent = { ...content, adventure_summary: newSummary };
    await updateContentMutation.mutateAsync(updatedContent);
  };

  const handleUpdateHooks = async (newHooks) => {
    const updatedContent = { ...content, plot_hooks: newHooks };
    await updateContentMutation.mutateAsync(updatedContent);
  };

  if (!campaignId) {
    return <div className="text-center py-16"><p className="text-slate-400">ID de campanha não fornecido</p></div>;
  }

  if (isLoading) {
    return (
      <div className="text-center py-16">
        <Loader2 className="w-12 h-12 text-purple-500 animate-spin mx-auto mb-4" />
        <p className="text-slate-400">Carregando campanha...</p>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="text-center py-16">
        <p className="text-slate-400 mb-4">Campanha não encontrada</p>
        <Button onClick={() => navigate(createPageUrl('MyCampaigns'))}>
          Voltar para Minhas Campanhas
        </Button>
      </div>
    );
  }

  const content = campaign.content_json || {};
  const isOwner = campaign.userId === user?.uid;

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div>
        <button
          onClick={() => navigate(createPageUrl('MyCampaigns'))}
          className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Voltar para Campanhas
        </button>
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <Sparkles className="w-8 h-8 text-purple-400" />
              <h1 className="text-4xl font-bold text-white">{campaign.title}</h1>
            </div>
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="px-3 py-1 bg-purple-600/20 text-purple-300 text-sm font-medium rounded-lg border border-purple-500/30">
                {campaign.system_rpg}
              </span>
              <span className="px-3 py-1 bg-amber-600/20 text-amber-300 text-sm font-medium rounded-lg border border-amber-500/30">
                {campaign.setting}
              </span>
              <span className="px-3 py-1 bg-blue-600/20 text-blue-300 text-sm font-medium rounded-lg border border-blue-500/30">
                {campaign.duration_type}
              </span>
              <span className="px-3 py-1 bg-slate-600/20 text-slate-300 text-sm font-medium rounded-lg border border-slate-500/30">
                {campaign.players_count} jogadores
              </span>
            </div>
            <p className="text-slate-400">
              Nível de criatividade: <span className="text-purple-400 font-semibold">{campaign.creativity_level}/5</span>
            </p>
          </div>
          {isOwner && (
            <div className="flex gap-3">
              <Button
                onClick={() => navigate(createPageUrl('Generator') + '?id=' + campaign.id)}
                variant="outline"
                className="border-slate-700 text-slate-300 hover:bg-slate-800"
              >
                Editar Informações
              </Button>
            </div>
          )}
        </div>
      </div>

      <Tabs defaultValue="narrative" className="space-y-6">
        <TabsList className="bg-slate-900/50 border border-purple-900/20 p-1">
          <TabsTrigger value="narrative" className="data-[state=active]:bg-purple-600/20 data-[state=active]:text-purple-300">
            <BookOpen className="w-4 h-4 mr-2" />
            Narrativa
          </TabsTrigger>
          <TabsTrigger value="npcs" className="data-[state=active]:bg-purple-600/20 data-[state=active]:text-purple-300">
            <Users className="w-4 h-4 mr-2" />
            NPCs e Monstros
          </TabsTrigger>
          <TabsTrigger value="notes" className="data-[state=active]:bg-purple-600/20 data-[state=active]:text-purple-300">
            <StickyNote className="w-4 h-4 mr-2" />
            Notas do Mestre
          </TabsTrigger>
          <TabsTrigger value="settings" className="data-[state=active]:bg-purple-600/20 data-[state=active]:text-purple-300">
            <Settings className="w-4 h-4 mr-2" />
            Configurações
          </TabsTrigger>
        </TabsList>

        <TabsContent value="narrative" className="space-y-6">
          {content.adventure_summary && isOwner && (
            <EditableSection
              title="Resumo da Aventura"
              content={content.adventure_summary}
              onSave={handleUpdateSummary}
              icon={BookOpen}
            />
          )}
          {content.adventure_summary && !isOwner && (
            <div className="p-6 bg-slate-900/50 backdrop-blur-xl border border-purple-900/20 rounded-2xl">
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                <BookOpen className="w-6 h-6 text-purple-400" />
                Resumo da Aventura
              </h2>
              <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">{content.adventure_summary}</p>
            </div>
          )}
          {content.plot_hooks?.length > 0 && (
            <PlotHooksList hooks={content.plot_hooks} onSave={handleUpdateHooks} isOwner={isOwner} />
          )}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">Encontros Balanceados</h2>
              <div className="flex items-center gap-3">
                {content.encounters?.length > 0 && (
                  <span className="text-slate-400">
                    {content.encounters.length} {content.encounters.length === 1 ? 'encontro' : 'encontros'}
                  </span>
                )}
                {isOwner && (
                  <GenerateEncounterDialog
                    campaignId={campaignId}
                    campaign={campaign}
                    onEncounterCreated={() => queryClient.invalidateQueries(['campaign', campaignId])}
                  />
                )}
              </div>
            </div>
            {content.encounters?.length > 0 ? (
              content.encounters.map((encounter, index) => (
                <EncounterCard key={index} encounter={encounter} index={index} />
              ))
            ) : (
              <div className="text-center py-8 bg-slate-900/30 border border-slate-800 rounded-2xl">
                <p className="text-slate-400">Nenhum encontro gerado ainda</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="npcs">
          <div className="space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">Personagens e Criaturas</h2>
                <span className="text-slate-400">
                  {npcs.filter(n => npcFilter === 'all' || n.type === npcFilter).length} personagens
                </span>
              </div>
              <div className="flex gap-3">
                <Select value={npcFilter} onValueChange={setNpcFilter}>
                  <SelectTrigger className="w-40 bg-slate-900/50 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="NPC">NPCs</SelectItem>
                    <SelectItem value="Ally">Aliados</SelectItem>
                    <SelectItem value="Villain">Vilões</SelectItem>
                    <SelectItem value="Monster">Monstros</SelectItem>
                  </SelectContent>
                </Select>
                {isOwner && (
                  <GenerateNpcDialog
                    campaignId={campaignId}
                    systemRpg={campaign.system_rpg}
                    setting={campaign.setting}
                    onNpcCreated={() => queryClient.invalidateQueries(['npcs', campaignId])}
                  />
                )}
              </div>
            </div>
            {npcs.length === 0 ? (
              <div className="text-center py-16 bg-slate-900/30 backdrop-blur-xl border border-slate-800 rounded-2xl">
                <Users className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400">Nenhum NPC ou criatura gerado ainda</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {npcs
                  .filter(npc => npcFilter === 'all' || npc.type === npcFilter)
                  .map((npc) => (
                    <NpcCard key={npc.id} npc={npc} />
                  ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="notes">
          <div className="p-6 bg-slate-900/50 backdrop-blur-xl border border-purple-900/20 rounded-2xl">
            <h2 className="text-2xl font-bold text-white mb-4">Notas do Mestre</h2>
            <p className="text-slate-400 mb-4">
              Use este espaço para adicionar suas próprias anotações, ideias e modificações.
            </p>
            <Textarea
              value={masterNotes}
              onChange={(e) => { setMasterNotes(e.target.value); setNotesChanged(true); }}
              placeholder="Adicione suas notas aqui..."
              className="min-h-[300px] bg-slate-950/50 border-slate-700 text-white"
              disabled={!isOwner}
            />
            {isOwner && notesChanged && (
              <div className="flex justify-end mt-4">
                <Button
                  onClick={() => updateNotesMutation.mutate()}
                  disabled={updateNotesMutation.isPending}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {updateNotesMutation.isPending ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Salvando...</>
                  ) : 'Salvar Notas'}
                </Button>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="settings">
          <div className="p-6 bg-slate-900/50 backdrop-blur-xl border border-purple-900/20 rounded-2xl space-y-6">
            <h2 className="text-2xl font-bold text-white mb-4">Configurações da Campanha</h2>
            {isOwner ? (
              <>
                <div className="p-6 bg-slate-950/50 border border-slate-700 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {campaign.is_public ? (
                          <Globe className="w-5 h-5 text-green-400" />
                        ) : (
                          <Lock className="w-5 h-5 text-slate-500" />
                        )}
                        <h3 className="text-lg font-semibold text-white">
                          {campaign.is_public ? 'Campanha Pública' : 'Campanha Privada'}
                        </h3>
                      </div>
                      <p className="text-slate-400 text-sm">
                        {campaign.is_public
                          ? 'Esta campanha está visível na biblioteca pública e pode ser clonada por outros usuários.'
                          : 'Esta campanha é privada e apenas você pode vê-la.'}
                      </p>
                    </div>
                    <Button
                      onClick={() => togglePublicMutation.mutate()}
                      disabled={togglePublicMutation.isPending}
                      variant="outline"
                      className={campaign.is_public
                        ? 'border-red-900/50 text-red-400 hover:bg-red-900/20'
                        : 'border-green-900/50 text-green-400 hover:bg-green-900/20'}
                    >
                      {togglePublicMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : campaign.is_public ? 'Tornar Privada' : 'Tornar Pública'}
                    </Button>
                  </div>
                </div>
                {campaign.is_public && campaign.clone_count > 0 && (
                  <div className="p-6 bg-purple-900/10 border border-purple-500/20 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Share2 className="w-5 h-5 text-purple-400" />
                      <h3 className="text-lg font-semibold text-white">Estatísticas</h3>
                    </div>
                    <p className="text-slate-300">
                      Esta campanha foi clonada{' '}
                      <span className="text-purple-400 font-bold">{campaign.clone_count}</span>{' '}
                      {campaign.clone_count === 1 ? 'vez' : 'vezes'}
                    </p>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8 text-slate-400">
                Apenas o criador da campanha pode modificar configurações.
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
