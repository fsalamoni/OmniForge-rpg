import React from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { useAuth } from '@/lib/AuthContext';
import { Campaign } from '@/firebase/db';
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
  const { user, isAuthenticated, login } = useAuth();

  const { data: campaigns = [], isLoading } = useQuery({
    queryKey: ['my-campaigns', user?.uid],
    queryFn: () => Campaign.list(user.uid),
    enabled: !!user
  });

  const completedCampaigns = campaigns.filter(c => c.is_completed);
  const inProgressCampaigns = campaigns.filter(c => !c.is_completed);

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

  const systemCount = {};
  campaigns.forEach(c => {
    systemCount[c.system_rpg] = (systemCount[c.system_rpg] || 0) + 1;
  });
  const mostUsedSystem = Object.entries(systemCount).sort((a, b) => b[1] - a[1])[0];
  const recentCampaigns = campaigns.slice(0, 3);

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 text-center">
        <Gamepad2 className="w-20 h-20 text-purple-400" />
        <h1 className="text-4xl font-bold text-white">OmniForge RPG</h1>
        <p className="text-slate-400 text-lg max-w-md">
          Gere campanhas épicas de RPG com IA. Faça login para começar.
        </p>
        <button
          onClick={login}
          className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white rounded-xl font-bold text-lg transition-all shadow-lg shadow-purple-500/30"
        >
          <svg className="w-6 h-6" viewBox="0 0 24 24">
            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Entrar com Google
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">
            Bem-vindo de volta, {user?.displayName?.split(' ')[0] || 'Mestre'}! 👋
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
                    <p className="text-slate-400 text-sm font-medium mb-1">{stat.label}</p>
                    <p className="text-4xl font-black text-white">{stat.value}</p>
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

      {mostUsedSystem && (
        <div className="p-6 bg-gradient-to-br from-purple-900/30 to-slate-900/30 backdrop-blur-xl border border-purple-500/30 rounded-2xl">
          <div className="flex items-center gap-3 mb-2">
            <Star className="w-5 h-5 text-amber-400" />
            <h3 className="text-lg font-semibold text-white">Sistema Favorito</h3>
          </div>
          <p className="text-3xl font-bold text-purple-300">{mostUsedSystem[0]}</p>
          <p className="text-slate-400 mt-1">
            {mostUsedSystem[1]} {mostUsedSystem[1] === 1 ? 'campanha' : 'campanhas'}
          </p>
        </div>
      )}

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
            <p className="text-slate-400 text-lg mb-6">Você ainda não criou nenhuma campanha</p>
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
                    <h3 className="text-xl font-bold text-white mb-2 line-clamp-1">{campaign.title}</h3>
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
                    <span>{campaign.players_count || '?'} jogadores</span>
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

      <div className="grid md:grid-cols-2 gap-6">
        <div
          onClick={() => navigate(createPageUrl('Library'))}
          className="group cursor-pointer p-8 bg-gradient-to-br from-purple-900/30 to-slate-900/30 backdrop-blur-xl border border-purple-500/30 hover:border-purple-500/60 rounded-2xl transition-all hover:scale-105"
        >
          <BookOpen className="w-12 h-12 text-purple-400 mb-4 group-hover:scale-110 transition-transform" />
          <h3 className="text-2xl font-bold text-white mb-2">Explorar Biblioteca</h3>
          <p className="text-slate-400">Descubra e clone campanhas criadas pela comunidade</p>
        </div>
        <div
          onClick={() => navigate(createPageUrl('Help'))}
          className="group cursor-pointer p-8 bg-gradient-to-br from-amber-900/30 to-slate-900/30 backdrop-blur-xl border border-amber-500/30 hover:border-amber-500/60 rounded-2xl transition-all hover:scale-105"
        >
          <Sparkles className="w-12 h-12 text-amber-400 mb-4 group-hover:scale-110 transition-transform" />
          <h3 className="text-2xl font-bold text-white mb-2">Guia e Dicas</h3>
          <p className="text-slate-400">Aprenda a usar a metodologia 5W2H e criar campanhas incríveis</p>
        </div>
      </div>
    </div>
  );
}
