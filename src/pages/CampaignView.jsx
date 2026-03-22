import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { useAuth } from '@/lib/AuthContext';
import { Campaign, NpcCreature } from '@/firebase/db';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Sparkles,
  Anchor,
  GitBranch,
  TrendingUp,
  BarChart3,
  Plus,
  Pencil,
  Map,
  Swords,
  Shield,
  Star,
  Clock
} from 'lucide-react';

// Campaign view sub-components
import NpcCard from '../components/campaign-view/NpcCard';
import GenerateNpcDialog from '../components/campaign-view/GenerateNpcDialog';
import EditNpcDialog from '../components/campaign-view/EditNpcDialog';
import EditableSection from '../components/campaign-view/EditableSection';
import PlotHooksList from '../components/campaign-view/PlotHooksList';
import HooksView from '../components/campaign-view/HooksView';
import HooksGenerator from '../components/campaign-view/HooksGenerator';
import ArcsView from '../components/campaign-view/ArcsView';
import NpcSelector from '../components/campaign-view/NpcSelector';
import ManualDescriptionDialog from '../components/campaign-view/ManualDescriptionDialog';

// Campaign management components
import WbsView from '../components/campaign-management/WbsView';
import SwotView from '../components/campaign-management/SwotView';
import StakeholdersMatrix from '../components/campaign-management/StakeholdersMatrix';
import DecisionFlowView from '../components/campaign-management/DecisionFlowView';
import CampaignMap from '../components/campaign-management/CampaignMap';

// Campaign progression components
import SessionTracker from '../components/campaign-progression/SessionTracker';
import WorldStateDashboard from '../components/campaign-progression/WorldStateDashboard';
import RewardsDashboard from '../components/campaign-progression/RewardsDashboard';

export default function CampaignView() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const campaignId = searchParams.get('id');
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [masterNotes, setMasterNotes] = useState('');
  const [notesChanged, setNotesChanged] = useState(false);
  const [npcFilter, setNpcFilter] = useState('all');
  const [showHookCreator, setShowHookCreator] = useState(false);
  const [hookCreatorMode, setHookCreatorMode] = useState(null); // null | 'ai' | 'manual'
  const [manualHookText, setManualHookText] = useState('');
  const [showNpcCreator, setShowNpcCreator] = useState(false);
  const [npcCreatorMode, setNpcCreatorMode] = useState(null); // null | 'ai' | 'manual'
  const [manualNpcDialogOpen, setManualNpcDialogOpen] = useState(false);
  const [manualDescriptionOpen, setManualDescriptionOpen] = useState(false);

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

  const handleSaveManualDescription = async (descriptionData) => {
    const updatedContent = { ...content, campaign_description_data: descriptionData };
    await updateContentMutation.mutateAsync(updatedContent);
  };

  const handleUpdateHooks = async (newHooks) => {
    const updatedContent = { ...content, plot_hooks: newHooks };
    await updateContentMutation.mutateAsync(updatedContent);
  };

  const handleHooksGenerated = async (newHooks) => {
    const existingHooks = content.plot_hooks || [];
    const updatedContent = { ...content, plot_hooks: [...existingHooks, ...newHooks] };
    await updateContentMutation.mutateAsync(updatedContent);
  };

  const handleArcGenerated = async (newArc) => {
    const existingArcs = content.narrative_arcs || [];
    const updatedContent = { ...content, narrative_arcs: [...existingArcs, newArc] };
    await updateContentMutation.mutateAsync(updatedContent);
  };

  const handleRefreshCampaign = () => {
    queryClient.invalidateQueries(['campaign', campaignId]);
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
  const campaignContext = content.adventure_summary || '';
  const answers5W2H = campaign.answers_5w2h_map || {};

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

      <Tabs defaultValue="description" className="space-y-6">
        <TabsList className="bg-slate-900/50 border border-purple-900/20 p-1 flex flex-wrap gap-1 h-auto">
          <TabsTrigger value="description" className="data-[state=active]:bg-purple-600/20 data-[state=active]:text-purple-300">
            <BookOpen className="w-4 h-4 mr-2" />
            Descrição
          </TabsTrigger>
          <TabsTrigger value="hooks" className="data-[state=active]:bg-purple-600/20 data-[state=active]:text-purple-300">
            <Anchor className="w-4 h-4 mr-2" />
            Ganchos
          </TabsTrigger>
          <TabsTrigger value="arcs" className="data-[state=active]:bg-purple-600/20 data-[state=active]:text-purple-300">
            <GitBranch className="w-4 h-4 mr-2" />
            Arcos
          </TabsTrigger>
          <TabsTrigger value="npcs" className="data-[state=active]:bg-purple-600/20 data-[state=active]:text-purple-300">
            <Users className="w-4 h-4 mr-2" />
            NPCs
          </TabsTrigger>
          <TabsTrigger value="progression" className="data-[state=active]:bg-purple-600/20 data-[state=active]:text-purple-300">
            <TrendingUp className="w-4 h-4 mr-2" />
            Progressão
          </TabsTrigger>
          <TabsTrigger value="management" className="data-[state=active]:bg-purple-600/20 data-[state=active]:text-purple-300">
            <BarChart3 className="w-4 h-4 mr-2" />
            Gestão
          </TabsTrigger>
          <TabsTrigger value="notes" className="data-[state=active]:bg-purple-600/20 data-[state=active]:text-purple-300">
            <StickyNote className="w-4 h-4 mr-2" />
            Notas
          </TabsTrigger>
          <TabsTrigger value="settings" className="data-[state=active]:bg-purple-600/20 data-[state=active]:text-purple-300">
            <Settings className="w-4 h-4 mr-2" />
            Configurações
          </TabsTrigger>
        </TabsList>

        {/* ── TAB: DESCRIÇÃO GERAL ── */}
        <TabsContent value="description" className="space-y-6">
          {isOwner && (
            <div className="flex justify-end">
              <ManualDescriptionDialog
                currentData={content.campaign_description_data || null}
                onSave={handleSaveManualDescription}
                open={manualDescriptionOpen}
                onOpenChange={setManualDescriptionOpen}
              />
              <button
                onClick={() => setManualDescriptionOpen(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800/70 border border-slate-600 text-slate-300 hover:bg-slate-700/70 hover:text-white transition-colors text-sm"
              >
                <Pencil className="w-4 h-4 text-purple-400" />
                {content.campaign_description_data ? 'Editar Descrição Manualmente' : 'Criar Descrição Manualmente'}
              </button>
            </div>
          )}
          {content.campaign_description_data ? (
            <CampaignDescriptionView data={content.campaign_description_data} />
          ) : content.adventure_summary && isOwner ? (
            <EditableSection
              title="Resumo da Aventura"
              content={content.adventure_summary}
              onSave={handleUpdateSummary}
              icon={BookOpen}
            />
          ) : content.adventure_summary && !isOwner ? (
            <div className="p-6 bg-slate-900/50 backdrop-blur-xl border border-purple-900/20 rounded-2xl">
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                <BookOpen className="w-6 h-6 text-purple-400" />
                Resumo da Aventura
              </h2>
              <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">{content.adventure_summary}</p>
            </div>
          ) : (
            <div className="text-center py-12 bg-slate-900/30 border border-slate-800 rounded-2xl">
              <BookOpen className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400">Nenhuma descrição disponível. Gere a campanha primeiro ou crie manualmente.</p>
            </div>
          )}
        </TabsContent>

        {/* ── TAB: GANCHOS ── */}
        <TabsContent value="hooks" className="space-y-6">
          {isOwner && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <Anchor className="w-6 h-6 text-purple-400" />
                  Ganchos de Plot {content.plot_hooks?.length > 0 && `(${content.plot_hooks.length})`}
                </h2>
                <Button
                  onClick={() => { setShowHookCreator(v => !v); setHookCreatorMode(null); setManualHookText(''); }}
                  className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600"
                  size="sm"
                >
                  <Plus className="w-4 h-4 mr-2" /> Novo Gancho
                </Button>
              </div>

              {showHookCreator && (
                <div className="space-y-4">
                  {!hookCreatorMode && (
                    <div className="grid md:grid-cols-2 gap-4">
                      <Card className="bg-purple-900/20 border-purple-500/40 cursor-pointer hover:bg-purple-900/40 transition-colors" onClick={() => setHookCreatorMode('ai')}>
                        <CardContent className="pt-8 pb-8 text-center space-y-3">
                          <Sparkles className="w-12 h-12 text-purple-400 mx-auto" />
                          <h3 className="text-white font-bold text-lg">Gerar por IA</h3>
                          <p className="text-slate-400 text-sm">A IA cria vários ganchos narrativos com base na campanha</p>
                        </CardContent>
                      </Card>
                      <Card className="bg-slate-800/50 border-slate-600 cursor-pointer hover:bg-slate-700/50 transition-colors" onClick={() => setHookCreatorMode('manual')}>
                        <CardContent className="pt-8 pb-8 text-center space-y-3">
                          <Pencil className="w-12 h-12 text-slate-300 mx-auto" />
                          <h3 className="text-white font-bold text-lg">Criar Manualmente</h3>
                          <p className="text-slate-400 text-sm">Escreva seu próprio gancho narrativo</p>
                        </CardContent>
                      </Card>
                    </div>
                  )}
                  {hookCreatorMode === 'ai' && (
                    <div>
                      <button onClick={() => setHookCreatorMode(null)} className="text-slate-400 hover:text-white text-sm mb-4 block">← Voltar</button>
                      <HooksGenerator
                        campaignId={campaignId}
                        description={campaignContext}
                        answers5W2H={answers5W2H}
                        systemRpg={campaign.system_rpg}
                        setting={campaign.setting}
                        onHooksGenerated={async (newHooks) => { await handleHooksGenerated(newHooks); setShowHookCreator(false); setHookCreatorMode(null); }}
                      />
                    </div>
                  )}
                  {hookCreatorMode === 'manual' && (
                    <div className="space-y-3 p-4 bg-slate-900/50 border border-slate-700 rounded-xl">
                      <button onClick={() => setHookCreatorMode(null)} className="text-slate-400 hover:text-white text-sm">← Voltar</button>
                      <div>
                        <label className="text-slate-300 text-sm block mb-2">Texto do Gancho</label>
                        <textarea
                          value={manualHookText}
                          onChange={(e) => setManualHookText(e.target.value)}
                          placeholder="Escreva o gancho narrativo aqui..."
                          className="w-full min-h-[100px] bg-slate-950/50 border border-slate-700 text-white rounded-md p-3 text-sm resize-y"
                        />
                      </div>
                      <div className="flex justify-end gap-3">
                        <Button variant="outline" onClick={() => { setShowHookCreator(false); setHookCreatorMode(null); setManualHookText(''); }} className="border-slate-700">Cancelar</Button>
                        <Button
                          onClick={async () => {
                            if (!manualHookText.trim()) return;
                            await handleHooksGenerated([manualHookText.trim()]);
                            setManualHookText('');
                            setShowHookCreator(false);
                            setHookCreatorMode(null);
                          }}
                          className="bg-purple-600 hover:bg-purple-700"
                        >
                          Salvar Gancho
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {content.plot_hooks?.length > 0 ? (
            <div className="space-y-4">
              {!isOwner && (
                <h2 className="text-2xl font-bold text-white">
                  Ganchos de Plot ({content.plot_hooks.length})
                </h2>
              )}
              <HooksView
                hooks={content.plot_hooks}
                campaignContext={campaignContext}
                systemRpg={campaign.system_rpg}
              />
              {isOwner && (
                <PlotHooksList hooks={content.plot_hooks} onSave={handleUpdateHooks} isOwner={isOwner} />
              )}
            </div>
          ) : (
            <div className="text-center py-12 bg-slate-900/30 border border-slate-800 rounded-2xl">
              <Anchor className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400">{isOwner ? 'Nenhum gancho criado ainda. Use o botão "Novo Gancho" acima.' : 'Nenhum gancho disponível.'}</p>
            </div>
          )}
        </TabsContent>

        {/* ── TAB: ARCOS NARRATIVOS ── */}
        <TabsContent value="arcs" className="space-y-6">
          <ArcsView
            arcs={content.narrative_arcs || []}
            campaignContext={campaignContext}
            systemRpg={campaign.system_rpg}
            gateways={content.decision_gateways || []}
            campaignId={campaignId}
            campaign={campaign}
            isOwner={isOwner}
            onRefresh={handleRefreshCampaign}
            onArcCreated={isOwner ? handleArcGenerated : undefined}
            answers5W2H={answers5W2H}
            hooks={content.plot_hooks || []}
          />
        </TabsContent>

        {/* ── TAB: NPCs E MONSTROS ── */}
        <TabsContent value="npcs">
          <div className="space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">Personagens e Criaturas</h2>
                <span className="text-slate-400">
                  {npcs.filter(n => npcFilter === 'all' || n.type === npcFilter).length} personagens
                </span>
              </div>
              <div className="flex flex-wrap gap-3">
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
                  <>
                    <NpcSelector
                      campaignId={campaignId}
                      description={campaignContext}
                      hooks={content.plot_hooks || []}
                      arcs={content.narrative_arcs || []}
                      systemRpg={campaign.system_rpg}
                      onNpcsCreated={() => queryClient.invalidateQueries(['npcs', campaignId])}
                    />
                    <Button
                      onClick={() => { setShowNpcCreator(v => !v); setNpcCreatorMode(null); }}
                      className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600"
                      size="sm"
                    >
                      <Plus className="w-4 h-4 mr-2" /> Novo NPC ou Criatura
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* NPC Creator — AI or Manual */}
            {isOwner && showNpcCreator && (
              <div className="space-y-4">
                {!npcCreatorMode && (
                  <div className="grid md:grid-cols-2 gap-4">
                    <Card className="bg-purple-900/20 border-purple-500/40 cursor-pointer hover:bg-purple-900/40 transition-colors" onClick={() => setNpcCreatorMode('ai')}>
                      <CardContent className="pt-8 pb-8 text-center space-y-3">
                        <Sparkles className="w-12 h-12 text-purple-400 mx-auto" />
                        <h3 className="text-white font-bold text-lg">Gerar por IA</h3>
                        <p className="text-slate-400 text-sm">A IA cria um NPC/criatura com stats, motivações e shadow file</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-slate-800/50 border-slate-600 cursor-pointer hover:bg-slate-700/50 transition-colors" onClick={() => { setNpcCreatorMode('manual'); setManualNpcDialogOpen(true); }}>
                      <CardContent className="pt-8 pb-8 text-center space-y-3">
                        <Pencil className="w-12 h-12 text-slate-300 mx-auto" />
                        <h3 className="text-white font-bold text-lg">Criar Manualmente</h3>
                        <p className="text-slate-400 text-sm">Preencha todos os dados do personagem manualmente</p>
                      </CardContent>
                    </Card>
                  </div>
                )}
                {npcCreatorMode === 'ai' && (
                  <div>
                    <button onClick={() => setNpcCreatorMode(null)} className="text-slate-400 hover:text-white text-sm mb-4 block">← Voltar</button>
                    <GenerateNpcDialog
                      campaignId={campaignId}
                      systemRpg={campaign.system_rpg}
                      setting={campaign.setting}
                      onNpcCreated={() => { queryClient.invalidateQueries(['npcs', campaignId]); setShowNpcCreator(false); setNpcCreatorMode(null); }}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Manual NPC Dialog */}
            <EditNpcDialog
              npc={null}
              campaignId={campaignId}
              onCreate={() => { queryClient.invalidateQueries(['npcs', campaignId]); setManualNpcDialogOpen(false); setShowNpcCreator(false); setNpcCreatorMode(null); }}
              open={manualNpcDialogOpen}
              onOpenChange={setManualNpcDialogOpen}
            />

            {npcs.length === 0 ? (
              <div className="text-center py-16 bg-slate-900/30 backdrop-blur-xl border border-slate-800 rounded-2xl">
                <Users className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400">Nenhum NPC ou criatura criado ainda</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {npcs
                  .filter(npc => npcFilter === 'all' || npc.type === npcFilter)
                  .map((npc) => (
                    <NpcCard
                      key={npc.id}
                      npc={npc}
                      isOwner={isOwner}
                      campaignId={campaignId}
                      campaignContext={campaignContext}
                      systemRpg={campaign.system_rpg}
                      onUpdate={() => queryClient.invalidateQueries(['npcs', campaignId])}
                    />
                  ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* ── TAB: PROGRESSÃO ── */}
        <TabsContent value="progression" className="space-y-6">
          <Tabs defaultValue="session" className="space-y-4">
            <TabsList className="bg-slate-900/30 border border-slate-800 p-1">
              <TabsTrigger value="session" className="data-[state=active]:bg-slate-800 data-[state=active]:text-white text-slate-400">
                Rastreador de Sessão
              </TabsTrigger>
              <TabsTrigger value="world" className="data-[state=active]:bg-slate-800 data-[state=active]:text-white text-slate-400">
                Estado do Mundo
              </TabsTrigger>
              <TabsTrigger value="rewards" className="data-[state=active]:bg-slate-800 data-[state=active]:text-white text-slate-400">
                Recompensas
              </TabsTrigger>
            </TabsList>
            <TabsContent value="session">
              <SessionTracker campaignId={campaignId} isOwner={isOwner} />
            </TabsContent>
            <TabsContent value="world">
              <WorldStateDashboard campaignId={campaignId} isOwner={isOwner} />
            </TabsContent>
            <TabsContent value="rewards">
              <RewardsDashboard campaignId={campaignId} isOwner={isOwner} />
            </TabsContent>
          </Tabs>
        </TabsContent>

        {/* ── TAB: GESTÃO ── */}
        <TabsContent value="management" className="space-y-6">
          <Tabs defaultValue="wbs" className="space-y-4">
            <TabsList className="bg-slate-900/30 border border-slate-800 p-1 flex flex-wrap gap-1 h-auto">
              <TabsTrigger value="wbs" className="data-[state=active]:bg-slate-800 data-[state=active]:text-white text-slate-400">
                WBS
              </TabsTrigger>
              <TabsTrigger value="swot" className="data-[state=active]:bg-slate-800 data-[state=active]:text-white text-slate-400">
                SWOT do Antagonista
              </TabsTrigger>
              <TabsTrigger value="stakeholders" className="data-[state=active]:bg-slate-800 data-[state=active]:text-white text-slate-400">
                Stakeholders
              </TabsTrigger>
              <TabsTrigger value="decisions" className="data-[state=active]:bg-slate-800 data-[state=active]:text-white text-slate-400">
                Gateways
              </TabsTrigger>
              <TabsTrigger value="map" className="data-[state=active]:bg-slate-800 data-[state=active]:text-white text-slate-400">
                Mapa
              </TabsTrigger>
            </TabsList>
            <TabsContent value="wbs">
              <WbsView
                wbs={content.wbs}
                isOwner={isOwner}
                campaignId={campaignId}
                campaign={campaign}
                onRefresh={handleRefreshCampaign}
              />
            </TabsContent>
            <TabsContent value="swot">
              <SwotView
                swot={content.antagonist_swot}
                isOwner={isOwner}
                campaignId={campaignId}
                campaign={campaign}
                onRefresh={handleRefreshCampaign}
              />
            </TabsContent>
            <TabsContent value="stakeholders">
              <StakeholdersMatrix
                stakeholders={content.stakeholders || []}
                isOwner={isOwner}
                campaignId={campaignId}
                campaign={campaign}
                onRefresh={handleRefreshCampaign}
              />
            </TabsContent>
            <TabsContent value="decisions">
              <DecisionFlowView
                gateways={content.decision_gateways || []}
                isOwner={isOwner}
                campaignId={campaignId}
                campaign={campaign}
                onRefresh={handleRefreshCampaign}
              />
            </TabsContent>
            <TabsContent value="map">
              <CampaignMap
                wbs={content.wbs}
                stakeholders={content.stakeholders || []}
                isOwner={isOwner}
                campaignId={campaignId}
                initialMarkers={content.map_markers || []}
                content={content}
              />
            </TabsContent>
          </Tabs>
        </TabsContent>

        {/* ── TAB: NOTAS DO MESTRE ── */}
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

        {/* ── TAB: CONFIGURAÇÕES ── */}
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

// ── Structured Campaign Description View ──────────────────────────────────────
function DescriptionSection({ icon: Icon, title, iconClass, children }) {
  return (
    <div className="p-6 bg-slate-900/50 backdrop-blur-xl border border-purple-900/20 rounded-2xl">
      <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
        <Icon className={`w-5 h-5 ${iconClass}`} />
        {title}
      </h2>
      {children}
    </div>
  );
}

function SubField({ label, value }) {
  if (!value) return null;
  return (
    <div className="mb-3">
      <span className="text-sm font-semibold text-purple-300">{label}</span>
      <p className="text-slate-300 leading-relaxed mt-1">{value}</p>
    </div>
  );
}

function CampaignDescriptionView({ data }) {
  if (!data) return null;
  const { premissa, contexto_mundo, conflito_central, forcas_poder, aspectos_campanha, relogio_apocalipse } = data;

  return (
    <div className="space-y-6">
      {/* 1. PREMISSA */}
      {premissa && (
        <DescriptionSection icon={Sparkles} title="1. Premissa" iconClass="text-purple-400">
          <SubField label="Pitch" value={premissa.pitch} />
          <SubField label='O "E Se?"' value={premissa.e_se} />
          <SubField label="Promessa de Experiência" value={premissa.promessa_experiencia} />
          <SubField label="Função dos Personagens" value={premissa.funcao_personagens} />
          <SubField label="Proposta de Jogo" value={premissa.proposta_jogo} />
          <SubField label="Escala" value={premissa.escala} />
        </DescriptionSection>
      )}

      {/* 2. CONTEXTO DO MUNDO */}
      {contexto_mundo && (
        <DescriptionSection icon={Map} title="2. Contexto do Mundo" iconClass="text-blue-400">
          <SubField label="Geografia e Atmosfera" value={contexto_mundo.geografia_atmosfera} />
          <SubField label="Paleta Sensorial" value={contexto_mundo.paleta_sensorial} />
          <SubField label="Sociedade e Cultura" value={contexto_mundo.sociedade_cultura} />
          <SubField label="História Recente" value={contexto_mundo.historia_recente} />
          <SubField label="Letalidade e Moralidade" value={contexto_mundo.letalidade_moralidade} />
        </DescriptionSection>
      )}

      {/* 3. CONFLITO CENTRAL */}
      {conflito_central && (
        <DescriptionSection icon={Swords} title="3. Conflito Central" iconClass="text-red-400">
          <SubField label="Origem do Problema" value={conflito_central.origem_problema} />
          <SubField label="Facções Envolvidas" value={conflito_central.faccoes_envolvidas} />
          <SubField label="O Que Está em Jogo" value={conflito_central.stakes} />
          <SubField label="Tensão Política/Social" value={conflito_central.tensao_politica} />
          <SubField label="Inimigo Oculto vs. Visível" value={conflito_central.inimigos} />
        </DescriptionSection>
      )}

      {/* 4. FORÇAS DE PODER */}
      {Array.isArray(forcas_poder) && forcas_poder.length > 0 && (
        <DescriptionSection icon={Shield} title="4. Forças de Poder" iconClass="text-amber-400">
          <div className="grid md:grid-cols-2 gap-4">
            {forcas_poder.map((f, i) => (
              <div key={i} className="p-4 bg-amber-900/10 border border-amber-900/20 rounded-xl">
                <h3 className="text-amber-300 font-bold mb-2">{f.nome}</h3>
                <p className="text-slate-400 text-sm mb-1">
                  <span className="text-amber-400 font-semibold">Desejo:</span> {f.desejo}
                </p>
                <p className="text-slate-400 text-sm mb-1">
                  <span className="text-amber-400 font-semibold">Recurso:</span> {f.recurso}
                </p>
                <p className="text-slate-400 text-sm">
                  <span className="text-amber-400 font-semibold">Carência:</span> {f.carencia}
                </p>
              </div>
            ))}
          </div>
        </DescriptionSection>
      )}

      {/* 5. ASPECTOS DA CAMPANHA */}
      {Array.isArray(aspectos_campanha) && aspectos_campanha.length > 0 && (
        <DescriptionSection icon={Star} title="5. Aspectos da Campanha" iconClass="text-green-400">
          <ul className="space-y-2">
            {aspectos_campanha.map((aspecto, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-green-400 font-bold mt-0.5">{i + 1}.</span>
                <span className="text-slate-300">{aspecto}</span>
              </li>
            ))}
          </ul>
        </DescriptionSection>
      )}

      {/* 6. RELÓGIO DO APOCALIPSE */}
      {Array.isArray(relogio_apocalipse) && relogio_apocalipse.length > 0 && (
        <DescriptionSection icon={Clock} title="6. Relógio do Apocalipse" iconClass="text-rose-400">
          <div className="space-y-3">
            {relogio_apocalipse.map((r, i) => (
              <div key={i} className="flex items-start gap-3 p-3 bg-rose-900/10 border border-rose-900/20 rounded-lg">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-rose-900/30 border border-rose-500/40 flex items-center justify-center text-rose-400 font-bold text-sm">
                  {i + 1}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-rose-300 font-semibold">{r.estagio}</span>
                    {r.tempo_estimado && (
                      <span className="text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">{r.tempo_estimado}</span>
                    )}
                  </div>
                  <p className="text-slate-300 text-sm leading-relaxed">{r.descricao}</p>
                </div>
              </div>
            ))}
          </div>
        </DescriptionSection>
      )}
    </div>
  );
}


