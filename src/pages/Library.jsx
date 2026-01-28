import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Library as LibraryIcon,
  Search,
  Filter,
  Copy,
  Eye,
  Heart,
  Loader2,
  User,
  TrendingUp
} from 'lucide-react';

export default function Library() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSystem, setFilterSystem] = useState('all');
  const [filterSetting, setFilterSetting] = useState('all');
  const [filterDuration, setFilterDuration] = useState('all');
  const [sortBy, setSortBy] = useState('recent');

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (error) {
        await base44.auth.redirectToLogin(createPageUrl('Library'));
      }
    };
    loadUser();
  }, []);

  const { data: allCampaigns = [], isLoading } = useQuery({
    queryKey: ['public-campaigns'],
    queryFn: async () => {
      const campaigns = await base44.entities.Campaign.list('-created_date');
      return campaigns.filter(c => c.is_public && c.is_completed);
    }
  });

  const { data: likes = [] } = useQuery({
    queryKey: ['my-likes'],
    queryFn: () => base44.entities.CampaignLike.filter({ user_id: user?.id }),
    enabled: !!user
  });

  const cloneMutation = useMutation({
    mutationFn: async (originalCampaign) => {
      // Criar cópia da campanha
      const newCampaign = await base44.entities.Campaign.create({
        title: originalCampaign.title + ' (Clone)',
        system_rpg: originalCampaign.system_rpg,
        setting: originalCampaign.setting,
        duration_type: originalCampaign.duration_type,
        players_count: originalCampaign.players_count,
        creativity_level: originalCampaign.creativity_level,
        current_step: originalCampaign.current_step,
        is_completed: true,
        is_public: false,
        content_json: originalCampaign.content_json,
        original_campaign_id: originalCampaign.id
      });

      // Copiar NPCs
      const originalNpcs = await base44.entities.NpcCreature.filter({ 
        campaign_id: originalCampaign.id 
      });
      
      for (const npc of originalNpcs) {
        await base44.entities.NpcCreature.create({
          campaign_id: newCampaign.id,
          name: npc.name,
          type: npc.type,
          role: npc.role,
          motivation: npc.motivation,
          description: npc.description,
          stats_json: npc.stats_json
        });
      }

      // Atualizar contador de clones
      await base44.entities.Campaign.update(originalCampaign.id, {
        clone_count: (originalCampaign.clone_count || 0) + 1
      });

      return newCampaign;
    },
    onSuccess: (newCampaign) => {
      queryClient.invalidateQueries(['public-campaigns']);
      queryClient.invalidateQueries(['my-campaigns']);
      navigate(createPageUrl('CampaignView') + '?id=' + newCampaign.id);
    }
  });

  const toggleLikeMutation = useMutation({
    mutationFn: async (campaignId) => {
      const existingLike = likes.find(l => l.campaign_id === campaignId);
      if (existingLike) {
        await base44.entities.CampaignLike.delete(existingLike.id);
      } else {
        await base44.entities.CampaignLike.create({
          campaign_id: campaignId,
          user_id: user.id
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['my-likes']);
    }
  });

  // Filtros
  let filteredCampaigns = allCampaigns.filter(campaign => {
    const matchesSearch = campaign.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSystem = filterSystem === 'all' || campaign.system_rpg === filterSystem;
    const matchesSetting = filterSetting === 'all' || campaign.setting === filterSetting;
    const matchesDuration = filterDuration === 'all' || campaign.duration_type === filterDuration;
    
    return matchesSearch && matchesSystem && matchesSetting && matchesDuration;
  });

  // Ordenação
  if (sortBy === 'recent') {
    filteredCampaigns = [...filteredCampaigns].sort((a, b) => 
      new Date(b.created_date) - new Date(a.created_date)
    );
  } else if (sortBy === 'popular') {
    filteredCampaigns = [...filteredCampaigns].sort((a, b) => 
      (b.clone_count || 0) - (a.clone_count || 0)
    );
  }

  const uniqueSystems = [...new Set(allCampaigns.map(c => c.system_rpg))];
  const uniqueSettings = [...new Set(allCampaigns.map(c => c.setting))];
  const uniqueDurations = [...new Set(allCampaigns.map(c => c.duration_type))];

  const isLiked = (campaignId) => likes.some(l => l.campaign_id === campaignId);

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <LibraryIcon className="w-10 h-10 text-purple-400" />
            <h1 className="text-4xl font-bold text-white">
              Biblioteca Pública
            </h1>
          </div>
          <p className="text-slate-400 text-lg">
            Explore e clone campanhas criadas pela comunidade
          </p>
        </div>
      </div>

      {/* Filtros e Ordenação */}
      <div className="p-6 bg-slate-900/50 backdrop-blur-xl border border-purple-900/20 rounded-2xl space-y-4">
        <div className="flex items-center gap-2 text-white font-semibold mb-4">
          <Filter className="w-5 h-5 text-purple-400" />
          Filtros e Ordenação
        </div>

        <div className="grid md:grid-cols-5 gap-4">
          {/* Busca */}
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Buscar campanhas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-slate-950/50 border-slate-700 text-white"
            />
          </div>

          {/* Sistema */}
          <Select value={filterSystem} onValueChange={setFilterSystem}>
            <SelectTrigger className="bg-slate-950/50 border-slate-700 text-white">
              <SelectValue placeholder="Sistema" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Sistemas</SelectItem>
              {uniqueSystems.map(system => (
                <SelectItem key={system} value={system}>{system}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Ambientação */}
          <Select value={filterSetting} onValueChange={setFilterSetting}>
            <SelectTrigger className="bg-slate-950/50 border-slate-700 text-white">
              <SelectValue placeholder="Ambientação" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {uniqueSettings.map(setting => (
                <SelectItem key={setting} value={setting}>{setting}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Ordenação */}
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="bg-slate-950/50 border-slate-700 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Mais Recentes</SelectItem>
              <SelectItem value="popular">Mais Populares</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Duração */}
        <div className="flex gap-2">
          <Button
            onClick={() => setFilterDuration('all')}
            variant={filterDuration === 'all' ? 'default' : 'outline'}
            size="sm"
            className={filterDuration === 'all' 
              ? 'bg-purple-600 hover:bg-purple-700' 
              : 'border-slate-700 text-slate-300 hover:bg-slate-800'
            }
          >
            Todas
          </Button>
          {uniqueDurations.map(duration => (
            <Button
              key={duration}
              onClick={() => setFilterDuration(duration)}
              variant={filterDuration === duration ? 'default' : 'outline'}
              size="sm"
              className={filterDuration === duration 
                ? 'bg-purple-600 hover:bg-purple-700' 
                : 'border-slate-700 text-slate-300 hover:bg-slate-800'
              }
            >
              {duration}
            </Button>
          ))}
        </div>

        {/* Limpar filtros */}
        {(searchTerm || filterSystem !== 'all' || filterSetting !== 'all' || filterDuration !== 'all') && (
          <Button
            onClick={() => {
              setSearchTerm('');
              setFilterSystem('all');
              setFilterSetting('all');
              setFilterDuration('all');
            }}
            variant="outline"
            className="border-slate-700 text-slate-300 hover:bg-slate-800"
          >
            Limpar Filtros
          </Button>
        )}
      </div>

      {/* Resultados */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <p className="text-slate-400">
            {filteredCampaigns.length} {filteredCampaigns.length === 1 ? 'campanha encontrada' : 'campanhas encontradas'}
          </p>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <TrendingUp className="w-4 h-4" />
            {sortBy === 'recent' ? 'Ordenado por data' : 'Ordenado por popularidade'}
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-16">
            <Loader2 className="w-12 h-12 text-purple-500 animate-spin mx-auto mb-4" />
            <p className="text-slate-400">Carregando biblioteca...</p>
          </div>
        ) : filteredCampaigns.length === 0 ? (
          <div className="text-center py-16 bg-slate-900/30 backdrop-blur-xl border border-slate-800 rounded-2xl">
            <LibraryIcon className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400 text-lg">
              {allCampaigns.length === 0 
                ? 'Ainda não há campanhas públicas na biblioteca'
                : 'Nenhuma campanha encontrada com os filtros aplicados'
              }
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCampaigns.map((campaign) => (
              <div
                key={campaign.id}
                className="group p-6 bg-slate-900/50 backdrop-blur-xl border border-purple-900/20 hover:border-purple-500/50 rounded-2xl transition-all"
              >
                {/* Header */}
                <div className="mb-4">
                  <h3 className="text-xl font-bold text-white mb-2 line-clamp-2 group-hover:text-purple-300 transition-colors">
                    {campaign.title}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-2 py-1 bg-purple-600/20 text-purple-300 text-xs font-medium rounded-lg border border-purple-500/30">
                      {campaign.system_rpg}
                    </span>
                    <span className="px-2 py-1 bg-amber-600/20 text-amber-300 text-xs font-medium rounded-lg border border-amber-500/30">
                      {campaign.setting}
                    </span>
                  </div>
                </div>

                {/* Resumo */}
                {campaign.content_json?.adventure_summary && (
                  <p className="text-slate-400 text-sm mb-4 line-clamp-3">
                    {campaign.content_json.adventure_summary}
                  </p>
                )}

                {/* Metadata */}
                <div className="flex items-center gap-4 text-xs text-slate-500 mb-4 pb-4 border-b border-slate-800">
                  <div className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    <span className="truncate max-w-[100px]">
                      {campaign.created_by?.split('@')[0]}
                    </span>
                  </div>
                  {campaign.clone_count > 0 && (
                    <div className="flex items-center gap-1">
                      <Copy className="w-3 h-3" />
                      <span>{campaign.clone_count}</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    onClick={() => navigate(createPageUrl('CampaignView') + '?id=' + campaign.id)}
                    className="flex-1 bg-slate-800 hover:bg-slate-700 text-white"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Visualizar
                  </Button>
                  
                  <Button
                    onClick={() => cloneMutation.mutate(campaign)}
                    disabled={cloneMutation.isLoading}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white"
                  >
                    {cloneMutation.isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Copy className="w-4 h-4 mr-2" />
                        Clonar
                      </>
                    )}
                  </Button>
                  
                  <Button
                    onClick={() => toggleLikeMutation.mutate(campaign.id)}
                    variant="outline"
                    className={`border-slate-700 ${
                      isLiked(campaign.id) 
                        ? 'text-red-400 hover:text-red-300' 
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Heart 
                      className={`w-4 h-4 ${isLiked(campaign.id) ? 'fill-current' : ''}`} 
                    />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}