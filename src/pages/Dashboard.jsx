import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { 
  Plus, 
  BookOpen, 
  TrendingUp, 
  Star,
  Sparkles,
  Calendar,
  Users,
  Gamepad2
} from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (error) {
        await base44.auth.redirectToLogin(createPageUrl('Dashboard'));
      }
    };
    loadUser();
  }, []);

  const { data: campaigns = [], isLoading } = useQuery({
    queryKey: ['my-campaigns'],
    queryFn: async () => {
      const allCampaigns = await base44.entities.Campaign.list('-created_date');
      return allCampaigns.filter(c => c.created_by === user?.email);
    },
    enabled: !!user
  });

  const completedCampaigns = campaigns.filter(c => c.is_completed);
  const inProgressCampaigns = campaigns.filter(c => !c.is_completed);

  // Estatísticas
  const stats = [
    {
      label: 'Total de Campanhas',
      value: campaigns.length,
      icon: BookOpen,
      color: 'from-purple-600 to-purple-700',
      bgColor: 'bg-purple-600/10',
      borderColor: 'border-purple-500/30'
    },
    {
      label: 'Campanhas Completas',
      value: completedCampaigns.length,
      icon: Sparkles,
      color: 'from-amber-600 to-amber-700',
      bgColor: 'bg-amber-600/10',
      borderColor: 'border-amber-500/30'
    },
    {
      label: 'Em Andamento',
      value: inProgressCampaigns.length,
      icon: TrendingUp,
      color: 'from-blue-600 to-blue-700',
      bgColor: 'bg-blue-600/10',
      borderColor: 'border-blue-500/30'
    }
  ];

  // Sistema mais usado
  const systemCount = {};
  campaigns.forEach(c => {
    systemCount[c.system_rpg] = (systemCount[c.system_rpg] || 0) + 1;
  });
  const mostUsedSystem = Object.entries(systemCount).sort((a, b) => b[1] - a[1])[0];

  const recentCampaigns = campaigns.slice(0, 3);

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">
            Bem-vindo de volta, {user?.full_name || 'Mestre'}! 👋
          </h1>
          <p className="text-slate-400 text-lg">
            Continue criando campanhas épicas ou explore a biblioteca
          </p>
        </div>
        <button
          onClick={() => navigate(createPageUrl('Generator'))}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white rounded-xl font-semibold transition-all shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 hover:scale-105"
        >
          <Plus className="w-5 h-5" />
          Nova Campanha
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-3 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className={`relative overflow-hidden p-6 bg-slate-900/50 backdrop-blur-xl border ${stat.borderColor} rounded-2xl hover:scale-105 transition-all`}
            >
              <div className={`absolute top-0 right-0 w-32 h-32 transform translate-x-8 -translate-y-8 ${stat.bgColor} rounded-full opacity-20`} />
              <div className="relative">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-slate-400 text-sm font-medium mb-1">
                      {stat.label}
                    </p>
                    <p className="text-4xl font-black text-white">
                      {stat.value}
                    </p>
                  </div>
                  <div className={`p-3 bg-gradient-to-br ${stat.color} rounded-xl shadow-lg`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Sistema Mais Usado */}
      {mostUsedSystem && (
        <div className="p-6 bg-gradient-to-br from-purple-900/30 to-slate-900/30 backdrop-blur-xl border border-purple-500/30 rounded-2xl">
          <div className="flex items-center gap-3 mb-2">
            <Star className="w-5 h-5 text-amber-400" />
            <h3 className="text-lg font-semibold text-white">Sistema Favorito</h3>
          </div>
          <p className="text-3xl font-bold text-purple-300">
            {mostUsedSystem[0]}
          </p>
          <p className="text-slate-400 mt-1">
            {mostUsedSystem[1]} {mostUsedSystem[1] === 1 ? 'campanha' : 'campanhas'}
          </p>
        </div>
      )}

      {/* Campanhas Recentes */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Campanhas Recentes</h2>
          <button
            onClick={() => navigate(createPageUrl('MyCampaigns'))}
            className="text-purple-400 hover:text-purple-300 font-medium transition-colors"
          >
            Ver todas →
          </button>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-purple-500/30 border-t-purple-500" />
          </div>
        ) : recentCampaigns.length === 0 ? (
          <div className="text-center py-16 bg-slate-900/30 backdrop-blur-xl border border-slate-800 rounded-2xl">
            <Gamepad2 className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400 text-lg mb-6">
              Você ainda não criou nenhuma campanha
            </p>
            <button
              onClick={() => navigate(createPageUrl('Generator'))}
              className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold transition-all"
            >
              <Plus className="w-5 h-5" />
              Criar Primeira Campanha
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recentCampaigns.map((campaign) => (
              <div
                key={campaign.id}
                onClick={() => campaign.is_completed 
                  ? navigate(createPageUrl('CampaignView') + '?id=' + campaign.id)
                  : navigate(createPageUrl('Generator') + '?id=' + campaign.id)
                }
                className="group cursor-pointer p-6 bg-slate-900/50 backdrop-blur-xl border border-purple-900/20 hover:border-purple-500/50 rounded-2xl transition-all hover:scale-105"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white mb-2 line-clamp-1">
                      {campaign.title}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      <span className="px-2 py-1 bg-purple-600/20 text-purple-300 text-xs rounded-lg border border-purple-500/30">
                        {campaign.system_rpg}
                      </span>
                      <span className="px-2 py-1 bg-amber-600/20 text-amber-300 text-xs rounded-lg border border-amber-500/30">
                        {campaign.setting}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 text-sm text-slate-400">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    <span>{campaign.players_count} jogadores</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>{campaign.duration_type}</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-800">
                  {campaign.is_completed ? (
                    <span className="inline-flex items-center gap-1 text-green-400 text-sm font-medium">
                      <Sparkles className="w-4 h-4" />
                      Completa
                    </span>
                  ) : (
                    <span className="text-blue-400 text-sm font-medium">
                      Etapa {campaign.current_step}/7
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-2 gap-6">
        <div
          onClick={() => navigate(createPageUrl('Library'))}
          className="group cursor-pointer p-8 bg-gradient-to-br from-purple-900/30 to-slate-900/30 backdrop-blur-xl border border-purple-500/30 hover:border-purple-500/60 rounded-2xl transition-all hover:scale-105"
        >
          <BookOpen className="w-12 h-12 text-purple-400 mb-4 group-hover:scale-110 transition-transform" />
          <h3 className="text-2xl font-bold text-white mb-2">
            Explorar Biblioteca
          </h3>
          <p className="text-slate-400">
            Descubra e clone campanhas criadas pela comunidade
          </p>
        </div>

        <div
          onClick={() => navigate(createPageUrl('Help'))}
          className="group cursor-pointer p-8 bg-gradient-to-br from-amber-900/30 to-slate-900/30 backdrop-blur-xl border border-amber-500/30 hover:border-amber-500/60 rounded-2xl transition-all hover:scale-105"
        >
          <Sparkles className="w-12 h-12 text-amber-400 mb-4 group-hover:scale-110 transition-transform" />
          <h3 className="text-2xl font-bold text-white mb-2">
            Guia e Dicas
          </h3>
          <p className="text-slate-400">
            Aprenda a usar a metodologia 5W2H e criar campanhas incríveis
          </p>
        </div>
      </div>
    </div>
  );
}