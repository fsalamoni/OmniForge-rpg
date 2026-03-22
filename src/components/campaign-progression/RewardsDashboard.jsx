import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Gift, Trash2, Award, Coins, Info, Users, Star } from 'lucide-react';
import AddRewardDialog from './AddRewardDialog';
import { CampaignReward } from '@/firebase/db';

export default function RewardsDashboard({ campaignId, isOwner }) {
  const [selectedType, setSelectedType] = useState('all');
  const [rewards, setRewards] = useState([]);

  const loadRewards = async () => {
    if (!campaignId) return;
    try {
      const data = await CampaignReward.listByCampaign(campaignId);
      setRewards(data);
    } catch (error) {
      console.error('Erro ao carregar recompensas:', error);
    }
  };

  useEffect(() => {
    loadRewards();
  }, [campaignId]);

  const handleDelete = async (rewardId) => {
    if (!confirm('Deletar esta recompensa?')) return;
    try {
      await CampaignReward.delete(rewardId);
      setRewards(prev => prev.filter(r => r.id !== rewardId));
    } catch (error) {
      console.error('Erro ao deletar recompensa:', error);
    }
  };

  const rewardTypeIcons = {
    'XP': Star,
    'Item': Gift,
    'Informação': Info,
    'Favor': Users,
    'Dinheiro': Coins,
    'Contato': Users,
    'Outro': Award
  };

  const rewardTypeColors = {
    'XP': 'bg-purple-600/20 text-purple-300 border-purple-500/30',
    'Item': 'bg-blue-600/20 text-blue-300 border-blue-500/30',
    'Informação': 'bg-amber-600/20 text-amber-300 border-amber-500/30',
    'Favor': 'bg-green-600/20 text-green-300 border-green-500/30',
    'Dinheiro': 'bg-yellow-600/20 text-yellow-300 border-yellow-500/30',
    'Contato': 'bg-cyan-600/20 text-cyan-300 border-cyan-500/30',
    'Outro': 'bg-slate-600/20 text-slate-300 border-slate-500/30'
  };

  const filteredRewards = selectedType === 'all'
    ? rewards
    : rewards.filter(r => r.reward_type === selectedType);

  const stats = {
    total: rewards.length,
    byType: rewards.reduce((acc, r) => {
      acc[r.reward_type] = (acc[r.reward_type] || 0) + 1;
      return acc;
    }, {})
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Gift className="w-7 h-7 text-purple-400" />
            Dashboard de Recompensas
          </h2>
          <p className="text-slate-400 mt-1">
            {rewards.length} {rewards.length === 1 ? 'recompensa concedida' : 'recompensas concedidas'}
          </p>
        </div>
        {isOwner && <AddRewardDialog campaignId={campaignId} onRewardAdded={loadRewards} />}
      </div>

      {/* Estatísticas Rápidas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Object.entries(stats.byType).map(([type, count]) => {
          const Icon = rewardTypeIcons[type] || Award;
          return (
            <Card key={type} className="bg-slate-900/50 border-purple-900/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Icon className="w-5 h-5 text-purple-400" />
                  <span className="text-white font-semibold">{count}</span>
                </div>
                <p className="text-xs text-slate-400">{type}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2">
        <Button
          onClick={() => setSelectedType('all')}
          variant={selectedType === 'all' ? 'default' : 'outline'}
          size="sm"
          className={selectedType === 'all' ? 'bg-purple-600' : 'border-slate-700'}
        >
          Todas ({rewards.length})
        </Button>
        {['XP', 'Item', 'Informação', 'Favor', 'Dinheiro', 'Contato', 'Outro'].map(type => {
          const count = stats.byType[type] || 0;
          if (count === 0) return null;
          return (
            <Button
              key={type}
              onClick={() => setSelectedType(type)}
              variant={selectedType === type ? 'default' : 'outline'}
              size="sm"
              className={selectedType === type ? 'bg-purple-600' : 'border-slate-700'}
            >
              {type} ({count})
            </Button>
          );
        })}
      </div>

      {/* Lista de Recompensas */}
      {filteredRewards.length === 0 ? (
        <Card className="bg-slate-900/30 border-slate-800">
          <CardContent className="py-16 text-center">
            <Gift className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">
              {selectedType === 'all'
                ? 'Nenhuma recompensa concedida ainda'
                : `Nenhuma recompensa do tipo "${selectedType}" concedida`}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredRewards.map((reward) => {
            const Icon = rewardTypeIcons[reward.reward_type] || Award;
            return (
              <Card key={reward.id} className="bg-slate-900/50 border-purple-900/20">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="p-2 bg-purple-900/20 rounded-lg">
                        <Icon className="w-5 h-5 text-purple-400" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={rewardTypeColors[reward.reward_type]}>
                            {reward.reward_type}
                          </Badge>
                          {reward.quantity && (
                            <span className="text-sm text-purple-300 font-semibold">
                              {reward.quantity}
                            </span>
                          )}
                        </div>
                        <p className="text-white font-medium mb-1">{reward.description}</p>
                        <div className="flex flex-wrap gap-2 text-xs text-slate-400">
                          {reward.arc_name && <span>📖 {reward.arc_name}</span>}
                          {reward.scene_name && <span>• 🎬 {reward.scene_name}</span>}
                          {reward.session_number && <span>• Sessão {reward.session_number}</span>}
                          {reward.awarded_to && <span>• 👥 {reward.awarded_to}</span>}
                        </div>
                      </div>
                    </div>
                    {isOwner && (
                      <Button
                        onClick={() => handleDelete(reward.id)}
                        variant="ghost"
                        size="sm"
                        className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
