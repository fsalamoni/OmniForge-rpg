import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GitBranch, AlertCircle, CheckCircle2, XCircle, Edit } from 'lucide-react';
import EditGatewaysDialog from './EditGatewaysDialog';
import { Campaign } from '@/firebase/db';

export default function DecisionFlowView({ gateways, isOwner, campaignId, campaign, onRefresh }) {
  const [expandedGateways, setExpandedGateways] = useState({});
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const handleSaveGateways = async (updatedGateways) => {
    await Campaign.update(campaignId, {
      content_json: {
        ...campaign.content_json,
        decision_gateways: updatedGateways
      }
    });
    if (onRefresh) onRefresh();
  };

  const toggleGateway = (index) => {
    setExpandedGateways(prev => ({ ...prev, [index]: !prev[index] }));
  };

  if (!gateways || gateways.length === 0) {
    return (
      <div className="text-center py-8 text-slate-400">
        Fluxogramas de Decisão não disponíveis
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {isOwner && (
        <div className="flex justify-end">
          <Button onClick={() => setEditDialogOpen(true)} variant="outline" className="border-purple-500/30">
            <Edit className="w-4 h-4 mr-2" />
            Editar Gateways
          </Button>
        </div>
      )}

      <Card className="bg-gradient-to-br from-blue-900/30 to-slate-900/30 border-blue-500/30">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <GitBranch className="w-6 h-6 text-blue-400" />
            Fluxogramas de Decisão
          </CardTitle>
          <p className="text-slate-400 text-sm">
            Ramificações lógicas baseadas nas escolhas dos jogadores
          </p>
        </CardHeader>
      </Card>

      <div className="space-y-4">
        {gateways.map((gateway, index) => (
          <Card key={index} className="bg-slate-900/50 border-purple-900/20">
            <CardHeader
              className="cursor-pointer hover:bg-slate-800/30 transition-colors"
              onClick={() => toggleGateway(index)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-5 h-5 text-amber-400" />
                    <CardTitle className="text-white text-lg">
                      Gateway #{index + 1}
                    </CardTitle>
                  </div>
                  <p className="text-slate-400 text-sm">
                    <span className="text-purple-400 font-semibold">Trigger: </span>
                    {gateway.trigger}
                  </p>
                </div>
                <span className="text-slate-500 text-xs">
                  {expandedGateways[index] ? '−' : '+'}
                </span>
              </div>
            </CardHeader>

            {expandedGateways[index] && (
              <CardContent className="space-y-4">
                <div className="p-4 bg-blue-900/10 border border-blue-500/20 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">❓</span>
                    <h4 className="text-blue-300 font-semibold">Condição</h4>
                  </div>
                  <p className="text-slate-300 text-sm">{gateway.condition}</p>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 bg-green-900/10 border border-green-500/20 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2 className="w-5 h-5 text-green-400" />
                      <h4 className="text-green-300 font-semibold text-sm">Se VERDADEIRO</h4>
                    </div>
                    <p className="text-slate-300 text-sm">{gateway.consequence_a}</p>
                  </div>

                  <div className="p-4 bg-red-900/10 border border-red-500/20 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <XCircle className="w-5 h-5 text-red-400" />
                      <h4 className="text-red-300 font-semibold text-sm">Se FALSO</h4>
                    </div>
                    <p className="text-slate-300 text-sm">{gateway.consequence_b}</p>
                  </div>
                </div>

                <div className="p-4 bg-purple-900/10 border border-purple-500/20 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">⚡</span>
                    <h4 className="text-purple-300 font-semibold text-sm">Impacto na WBS</h4>
                  </div>
                  <p className="text-slate-300 text-sm">{gateway.impact}</p>
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      <Card className="bg-slate-900/50 border-purple-900/20">
        <CardHeader>
          <CardTitle className="text-white text-lg">💡 Como Usar</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-slate-300">
          <p>• <span className="text-purple-400">Gateways</span> são pontos de decisão críticos que alteram o fluxo da campanha</p>
          <p>• Cada <span className="text-green-400">ramificação</span> leva a um novo caminho narrativo</p>
          <p>• <span className="text-red-400">Nenhuma decisão</span> leva ao fim prematuro - sempre há contingências</p>
          <p>• Use o <span className="text-amber-400">impacto na WBS</span> para ajustar os arcos narrativos em tempo real</p>
        </CardContent>
      </Card>

      {isOwner && (
        <EditGatewaysDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          gateways={gateways}
          onSave={handleSaveGateways}
        />
      )}
    </div>
  );
}
