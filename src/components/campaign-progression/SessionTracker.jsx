import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, TrendingUp, TrendingDown, Plus } from 'lucide-react';
import RecordDecisionDialog from './RecordDecisionDialog';
import { SessionLog } from '@/firebase/db';

export default function SessionTracker({ campaignId, isOwner }) {
  const [recordDialogOpen, setRecordDialogOpen] = useState(false);
  const [sessionLogs, setSessionLogs] = useState([]);

  const loadLogs = async () => {
    if (!campaignId) return;
    try {
      const logs = await SessionLog.listByCampaign(campaignId);
      setSessionLogs(logs);
    } catch (error) {
      console.error('Erro ao carregar sessões:', error);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [campaignId]);

  const groupedBySessions = sessionLogs.reduce((acc, log) => {
    const session = log.session_number || 1;
    if (!acc[session]) acc[session] = [];
    acc[session].push(log);
    return acc;
  }, {});

  const eventIcons = {
    decision: '🎯',
    combat: '⚔️',
    social: '💬',
    exploration: '🗺️',
    milestone: '🏆'
  };

  const eventColors = {
    decision: 'bg-purple-600/20 text-purple-300 border-purple-500/30',
    combat: 'bg-red-600/20 text-red-300 border-red-500/30',
    social: 'bg-blue-600/20 text-blue-300 border-blue-500/30',
    exploration: 'bg-green-600/20 text-green-300 border-green-500/30',
    milestone: 'bg-amber-600/20 text-amber-300 border-amber-500/30'
  };

  const formatDate = (ts) => {
    try {
      const d = ts?.toDate ? ts.toDate() : new Date(ts);
      return d.toLocaleDateString('pt-BR');
    } catch {
      return '';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">
            📖 Diário de Progressão da Campanha
          </h2>
          <p className="text-slate-400">
            Registro cronológico de decisões, eventos e suas consequências
          </p>
        </div>
        {isOwner && (
          <Button
            onClick={() => setRecordDialogOpen(true)}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Registrar Evento
          </Button>
        )}
      </div>

      {Object.keys(groupedBySessions).length === 0 ? (
        <Card className="bg-slate-900/50 border-purple-900/20">
          <CardContent className="text-center py-12">
            <Clock className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400 mb-4">
              Nenhum evento registrado ainda. Comece a documentar a jornada dos jogadores!
            </p>
            {isOwner && (
              <Button
                onClick={() => setRecordDialogOpen(true)}
                variant="outline"
                className="border-purple-500/30"
              >
                Registrar Primeiro Evento
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.keys(groupedBySessions)
            .sort((a, b) => parseInt(b) - parseInt(a))
            .map((sessionNum) => (
              <Card key={sessionNum} className="bg-slate-900/50 border-purple-900/20">
                <CardHeader className="bg-gradient-to-r from-purple-900/30 to-transparent">
                  <CardTitle className="text-white flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                      {sessionNum}
                    </div>
                    Sessão {sessionNum}
                    <Badge variant="outline" className="ml-auto">
                      {groupedBySessions[sessionNum].length} eventos
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    {groupedBySessions[sessionNum].map((log, index) => (
                      <div
                        key={log.id || index}
                        className="relative pl-8 pb-4 border-l-2 border-slate-700 last:border-l-0 last:pb-0"
                      >
                        <div className="absolute left-0 top-0 w-4 h-4 bg-purple-500 rounded-full -translate-x-2 ring-4 ring-slate-900" />

                        <div className="space-y-3">
                          <div className="flex items-start gap-3">
                            <span className="text-2xl">{eventIcons[log.event_type] || '📌'}</span>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge className={`${eventColors[log.event_type] || 'bg-slate-600/20 text-slate-300'} border text-xs`}>
                                  {log.event_type}
                                </Badge>
                                {log.createdAt && (
                                  <span className="text-xs text-slate-500">
                                    {formatDate(log.createdAt)}
                                  </span>
                                )}
                              </div>
                              <p className="text-white font-medium">{log.description}</p>
                            </div>
                          </div>

                          {log.player_choice && (
                            <div className="pl-11 p-3 bg-blue-900/10 border border-blue-500/20 rounded-lg">
                              <p className="text-blue-300 text-sm font-semibold mb-1">🎲 Escolha dos Jogadores:</p>
                              <p className="text-slate-300 text-sm">{log.player_choice}</p>
                            </div>
                          )}

                          {log.consequences_json && (
                            <div className="pl-11 space-y-2">
                              {log.consequences_json.immediate && (
                                <div className="p-3 bg-amber-900/10 border border-amber-500/20 rounded-lg">
                                  <p className="text-amber-300 text-xs font-semibold mb-1">⚡ Consequência Imediata:</p>
                                  <p className="text-slate-300 text-sm">{log.consequences_json.immediate}</p>
                                </div>
                              )}

                              {log.consequences_json.long_term && (
                                <div className="p-3 bg-purple-900/10 border border-purple-500/20 rounded-lg">
                                  <p className="text-purple-300 text-xs font-semibold mb-1">🔮 Impacto Futuro:</p>
                                  <p className="text-slate-300 text-sm">{log.consequences_json.long_term}</p>
                                </div>
                              )}

                              {log.consequences_json.stakeholder_changes &&
                               log.consequences_json.stakeholder_changes.length > 0 && (
                                <div className="p-3 bg-slate-950/50 border border-slate-700 rounded-lg">
                                  <p className="text-slate-300 text-xs font-semibold mb-2">👥 Mudanças em Stakeholders:</p>
                                  <div className="space-y-2">
                                    {log.consequences_json.stakeholder_changes.map((change, i) => (
                                      <div key={i} className="flex items-center gap-2 text-sm">
                                        {change.interest_change > 0 ? (
                                          <TrendingUp className="w-4 h-4 text-green-400" />
                                        ) : (
                                          <TrendingDown className="w-4 h-4 text-red-400" />
                                        )}
                                        <span className="text-slate-300">{change.reason}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {log.consequences_json.wbs_impact && (
                                <div className="p-3 bg-green-900/10 border border-green-500/20 rounded-lg">
                                  <p className="text-green-300 text-xs font-semibold mb-1">📊 Impacto na WBS:</p>
                                  <p className="text-slate-300 text-sm">{log.consequences_json.wbs_impact}</p>
                                </div>
                              )}
                            </div>
                          )}

                          {log.ai_generated_events && log.ai_generated_events.length > 0 && (
                            <div className="pl-11 p-3 bg-red-900/10 border border-red-500/20 rounded-lg">
                              <p className="text-red-300 text-xs font-semibold mb-2">🎭 Novos Eventos Gerados pela IA:</p>
                              <ul className="space-y-1">
                                {log.ai_generated_events.map((event, i) => (
                                  <li key={i} className="text-slate-300 text-sm flex items-start gap-2">
                                    <span className="text-red-400">•</span>
                                    {event}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      )}

      {isOwner && (
        <RecordDecisionDialog
          open={recordDialogOpen}
          onOpenChange={setRecordDialogOpen}
          campaignId={campaignId}
          onSuccess={() => {
            loadLogs();
            setRecordDialogOpen(false);
          }}
        />
      )}
    </div>
  );
}
