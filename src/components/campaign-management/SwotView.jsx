import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, Edit } from 'lucide-react';
import EditSwotDialog from './EditSwotDialog';
import { Campaign } from '@/firebase/db';

export default function SwotView({ swot, isOwner, campaignId, campaign, onRefresh, npcs = [] }) {
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [suggestedSwot, setSuggestedSwot] = useState(null);

  const handleSaveSwot = async (updatedSwot) => {
    await Campaign.update(campaignId, {
      content_json: { ...campaign.content_json, antagonist_swot: updatedSwot }
    });
    if (onRefresh) onRefresh();
  };

  const handleImportVillains = () => {
    const villains = npcs.filter(n => n.type === 'Villain');
    if (villains.length === 0) return;
    const mainVillain = villains[0];
    const suggested = {
      name: mainVillain.name,
      backstory: mainVillain.description || '',
      motivation: mainVillain.motivation || mainVillain.stats_json?.long_term_ambition || '',
      strengths: [
        mainVillain.stats_json?.archetype ? `Arquétipo: ${mainVillain.stats_json.archetype}` : null,
        mainVillain.stats_json?.connections?.primary ? `Aliança: ${mainVillain.stats_json.connections.primary}` : null,
      ].filter(Boolean),
      weaknesses: [
        mainVillain.stats_json?.shadow_file?.vulnerability || null,
      ].filter(Boolean),
      opportunities: [],
      threats: [
        mainVillain.stats_json?.shadow_file?.hidden_agenda ? `Agenda oculta: ${mainVillain.stats_json.shadow_file.hidden_agenda}` : null,
      ].filter(Boolean),
    };
    setSuggestedSwot(suggested);
  };

  if (!swot) {
    return (
      <div className="text-center py-8 text-slate-400">
        <Shield className="w-12 h-12 mx-auto mb-3 text-slate-600" />
        <p>Análise SWOT do antagonista não disponível</p>
        {isOwner && npcs.filter(n => n.type === 'Villain').length > 0 && (
          <div className="mt-4">
            <Button
              onClick={handleImportVillains}
              className="bg-red-700 hover:bg-red-600"
            >
              <Shield className="w-4 h-4 mr-2" />
              Importar Vilões como Base SWOT
            </Button>
            <p className="text-xs text-slate-500 mt-2">
              Cria sugestão baseada nos {npcs.filter(n => n.type === 'Villain').length} vilão(ões)
            </p>
          </div>
        )}
        {suggestedSwot && (
          <div className="mt-6 text-left max-w-2xl mx-auto space-y-4">
            <p className="text-yellow-400 text-sm font-semibold text-center">Sugestão gerada — revise e salve</p>
            <div className="p-4 bg-slate-900/80 border border-red-500/30 rounded-lg space-y-3">
              <p className="text-white font-bold">{suggestedSwot.name}</p>
              {suggestedSwot.backstory && <p className="text-slate-400 text-sm">{suggestedSwot.backstory}</p>}
            </div>
            <Button
              onClick={async () => {
                await Campaign.update(campaignId, {
                  content_json: { ...campaign.content_json, antagonist_swot: suggestedSwot }
                });
                if (onRefresh) onRefresh();
                setSuggestedSwot(null);
              }}
              className="w-full bg-red-700 hover:bg-red-600"
            >
              Salvar esta Sugestão
            </Button>
          </div>
        )}
      </div>
    );
  }

  const quadrants = [
    { key: 'strengths', label: 'Forças', icon: '💪', bg: 'bg-green-900/10', border: 'border-green-500/30', text: 'text-green-300' },
    { key: 'weaknesses', label: 'Fraquezas', icon: '⚠️', bg: 'bg-red-900/10', border: 'border-red-500/30', text: 'text-red-300' },
    { key: 'opportunities', label: 'Oportunidades', icon: '🎯', bg: 'bg-blue-900/10', border: 'border-blue-500/30', text: 'text-blue-300' },
    { key: 'threats', label: 'Ameaças', icon: '☠️', bg: 'bg-amber-900/10', border: 'border-amber-500/30', text: 'text-amber-300' }
  ];

  return (
    <div className="space-y-6">
      {isOwner && (
        <div className="flex justify-end">
          <Button onClick={() => setEditDialogOpen(true)} variant="outline" className="border-purple-500/30">
            <Edit className="w-4 h-4 mr-2" />
            Editar SWOT
          </Button>
        </div>
      )}

      <Card className="bg-gradient-to-br from-red-900/20 to-slate-900/30 border-red-500/30">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Shield className="w-6 h-6 text-red-400" />
            Análise SWOT do Antagonista Principal
          </CardTitle>
          {swot.name && <p className="text-red-300 font-semibold text-lg">{swot.name}</p>}
        </CardHeader>
        {(swot.backstory || swot.motivation) && (
          <CardContent className="grid md:grid-cols-2 gap-4">
            {swot.backstory && (
              <div className="p-4 bg-slate-950/50 border border-slate-700 rounded-lg">
                <h4 className="text-slate-300 font-semibold text-sm mb-2">📖 Backstory</h4>
                <p className="text-slate-400 text-sm">{swot.backstory}</p>
              </div>
            )}
            {swot.motivation && (
              <div className="p-4 bg-slate-950/50 border border-slate-700 rounded-lg">
                <h4 className="text-slate-300 font-semibold text-sm mb-2">🎭 Motivação Profunda</h4>
                <p className="text-slate-400 text-sm">{swot.motivation}</p>
              </div>
            )}
          </CardContent>
        )}
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        {quadrants.map((q) => (
          <Card key={q.key} className={`${q.bg} border ${q.border}`}>
            <CardHeader>
              <CardTitle className={`${q.text} flex items-center gap-2 text-lg`}>
                <span>{q.icon}</span>
                {q.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(swot[q.key] || []).length > 0 ? (
                <ul className="space-y-2">
                  {swot[q.key].map((item, i) => (
                    <li key={i} className="text-slate-300 text-sm flex items-start gap-2">
                      <span className={`${q.text} mt-0.5`}>•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-slate-500 text-sm italic">Nenhum item registrado</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {isOwner && (
        <EditSwotDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          swot={swot}
          onSave={handleSaveSwot}
        />
      )}
    </div>
  );
}
