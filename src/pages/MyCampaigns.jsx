import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { useAuth } from '@/lib/AuthContext';
import { Campaign, CampaignStep, NpcCreature } from '@/firebase/db';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import CampaignCard from '../components/campaigns/CampaignCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Filter, Loader2, BookOpen } from 'lucide-react';

export default function MyCampaigns() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterSystem, setFilterSystem] = useState('all');
  const [filterSetting, setFilterSetting] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const { data: allCampaigns = [], isLoading } = useQuery({
    queryKey: ['my-campaigns', user?.uid],
    queryFn: () => Campaign.list(user.uid),
    enabled: !!user
  });

  const deleteMutation = useMutation({
    mutationFn: async (campaignId) => {
      await CampaignStep.deleteByCampaign(campaignId);
      await NpcCreature.deleteByCampaign(campaignId);
      await Campaign.delete(campaignId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['my-campaigns', user?.uid]);
    }
  });

  const filteredCampaigns = allCampaigns.filter(campaign => {
    const matchesSearch = campaign.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSystem = filterSystem === 'all' || campaign.system_rpg === filterSystem;
    const matchesSetting = filterSetting === 'all' || campaign.setting === filterSetting;
    const matchesStatus =
      filterStatus === 'all' ||
      (filterStatus === 'completed' && campaign.is_completed) ||
      (filterStatus === 'in_progress' && !campaign.is_completed);
    return matchesSearch && matchesSystem && matchesSetting && matchesStatus;
  });

  const uniqueSystems = [...new Set(allCampaigns.map(c => c.system_rpg))];
  const uniqueSettings = [...new Set(allCampaigns.map(c => c.setting))];

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">Minhas Campanhas</h1>
          <p className="text-slate-400 text-lg">Gerencie todas as suas aventuras em um só lugar</p>
        </div>
        <Button
          onClick={() => navigate(createPageUrl('Generator'))}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white rounded-xl font-semibold transition-all shadow-lg"
        >
          <Plus className="w-5 h-5" />
          Nova Campanha
        </Button>
      </div>

      <div className="p-6 bg-slate-900/50 backdrop-blur-xl border border-purple-900/20 rounded-2xl space-y-4">
        <div className="flex items-center gap-2 text-white font-semibold mb-4">
          <Filter className="w-5 h-5 text-purple-400" />
          Filtros
        </div>
        <div className="grid md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Buscar por título..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-slate-950/50 border-slate-700 text-white"
            />
          </div>
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
          <Select value={filterSetting} onValueChange={setFilterSetting}>
            <SelectTrigger className="bg-slate-950/50 border-slate-700 text-white">
              <SelectValue placeholder="Ambientação" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as Ambientações</SelectItem>
              {uniqueSettings.map(setting => (
                <SelectItem key={setting} value={setting}>{setting}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="bg-slate-950/50 border-slate-700 text-white">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Status</SelectItem>
              <SelectItem value="completed">Completas</SelectItem>
              <SelectItem value="in_progress">Em Andamento</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {(searchTerm || filterSystem !== 'all' || filterSetting !== 'all' || filterStatus !== 'all') && (
          <Button
            onClick={() => {
              setSearchTerm('');
              setFilterSystem('all');
              setFilterSetting('all');
              setFilterStatus('all');
            }}
            variant="outline"
            className="border-slate-700 text-slate-300 hover:bg-slate-800"
          >
            Limpar Filtros
          </Button>
        )}
      </div>

      <div>
        <p className="text-slate-400 mb-4">
          {filteredCampaigns.length} {filteredCampaigns.length === 1 ? 'campanha encontrada' : 'campanhas encontradas'}
        </p>
        {isLoading ? (
          <div className="text-center py-16">
            <Loader2 className="w-12 h-12 text-purple-500 animate-spin mx-auto mb-4" />
            <p className="text-slate-400">Carregando campanhas...</p>
          </div>
        ) : filteredCampaigns.length === 0 ? (
          <div className="text-center py-16 bg-slate-900/30 backdrop-blur-xl border border-slate-800 rounded-2xl">
            <BookOpen className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400 text-lg mb-2">
              {allCampaigns.length === 0
                ? 'Você ainda não criou nenhuma campanha'
                : 'Nenhuma campanha encontrada com os filtros aplicados'}
            </p>
            {allCampaigns.length === 0 && (
              <Button
                onClick={() => navigate(createPageUrl('Generator'))}
                className="mt-4 bg-purple-600 hover:bg-purple-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Criar Primeira Campanha
              </Button>
            )}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCampaigns.map((campaign) => (
              <CampaignCard
                key={campaign.id}
                campaign={campaign}
                onDelete={(id) => deleteMutation.mutate(id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
