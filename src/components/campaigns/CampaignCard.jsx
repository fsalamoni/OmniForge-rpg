import React from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { 
  Users, 
  Calendar, 
  Sparkles, 
  Eye, 
  Edit, 
  Trash2,
  Globe,
  Lock
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function CampaignCard({ campaign, onDelete, showActions = true }) {
  const navigate = useNavigate();

  const handleView = () => {
    if (campaign.is_completed) {
      navigate(createPageUrl('CampaignView') + '?id=' + campaign.id);
    } else {
      navigate(createPageUrl('Generator') + '?id=' + campaign.id);
    }
  };

  const handleEdit = (e) => {
    e.stopPropagation();
    navigate(createPageUrl('Generator') + '?id=' + campaign.id);
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    if (window.confirm(`Tem certeza que deseja excluir "${campaign.title}"?`)) {
      onDelete(campaign.id);
    }
  };

  return (
    <div
      onClick={handleView}
      className="group cursor-pointer p-6 bg-slate-900/50 backdrop-blur-xl border border-purple-900/20 hover:border-purple-500/50 rounded-2xl transition-all hover:scale-[1.02]"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-xl font-bold text-white mb-2 line-clamp-2 group-hover:text-purple-300 transition-colors">
            {campaign.title}
          </h3>
          <div className="flex flex-wrap gap-2">
            <span className="px-3 py-1 bg-purple-600/20 text-purple-300 text-xs font-medium rounded-lg border border-purple-500/30">
              {campaign.system_rpg}
            </span>
            <span className="px-3 py-1 bg-amber-600/20 text-amber-300 text-xs font-medium rounded-lg border border-amber-500/30">
              {campaign.setting}
            </span>
          </div>
        </div>
        
        {campaign.is_public ? (
          <Globe className="w-5 h-5 text-green-400 flex-shrink-0 ml-2" title="Pública" />
        ) : (
          <Lock className="w-5 h-5 text-slate-500 flex-shrink-0 ml-2" title="Privada" />
        )}
      </div>

      {/* Info */}
      <div className="space-y-2 text-sm text-slate-400 mb-4">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4" />
          <span>{campaign.players_count} jogadores</span>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          <span>{campaign.duration_type}</span>
        </div>
      </div>

      {/* Status */}
      <div className="mb-4 pt-4 border-t border-slate-800">
        {campaign.is_completed ? (
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1 text-green-400 text-sm font-medium">
              <Sparkles className="w-4 h-4" />
              Campanha Completa
            </span>
            {campaign.clone_count > 0 && (
              <span className="text-xs text-slate-500">
                {campaign.clone_count} clones
              </span>
            )}
          </div>
        ) : (
          <span className="text-blue-400 text-sm font-medium">
            Em andamento • Etapa {campaign.current_step}/7
          </span>
        )}
      </div>

      {/* Actions */}
      {showActions && (
        <div className="flex gap-2 pt-4 border-t border-slate-800">
          <Button
            onClick={handleView}
            className="flex-1 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30"
          >
            <Eye className="w-4 h-4 mr-2" />
            {campaign.is_completed ? 'Visualizar' : 'Continuar'}
          </Button>
          
          {!campaign.is_completed && (
            <Button
              onClick={handleEdit}
              variant="outline"
              className="border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              <Edit className="w-4 h-4" />
            </Button>
          )}
          
          <Button
            onClick={handleDelete}
            variant="outline"
            className="border-red-900/50 text-red-400 hover:bg-red-900/20"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
}