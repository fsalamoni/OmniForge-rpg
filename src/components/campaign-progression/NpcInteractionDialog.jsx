import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Loader2, Send, MessageCircle, Sparkles } from 'lucide-react';
import { Campaign, SessionLog, NpcCreature } from '@/firebase/db';
import { invokeLLM } from '@/lib/aiClient';
import { useAuth } from '@/lib/AuthContext';

export default function NpcInteractionDialog({ open, onOpenChange, npc, campaignId }) {
  const { userProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [playerMessage, setPlayerMessage] = useState('');
  const [conversation, setConversation] = useState([]);
  const [campaignContext, setCampaignContext] = useState(null);

  useEffect(() => {
    if (open && npc) {
      setConversation([]);
      loadCampaignContext();
    }
  }, [open, npc]);

  const loadCampaignContext = async () => {
    try {
      const [campaign, allLogs, allNpcs] = await Promise.all([
        Campaign.get(campaignId),
        SessionLog.listByCampaign(campaignId),
        NpcCreature.listByCampaign(campaignId)
      ]);
      const recentLogs = allLogs.slice(-5);
      setCampaignContext({ campaign, recentLogs, allNpcs });
    } catch (error) {
      console.error('Erro ao carregar contexto:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!playerMessage.trim() || loading) return;

    const userMessage = { role: 'player', content: playerMessage };
    setConversation(prev => [...prev, userMessage]);
    const currentMessage = playerMessage;
    setPlayerMessage('');
    setLoading(true);

    try {
      const stats = npc.stats_json || {};
      const interest = stats.interest || 0;
      const power = stats.power || 5;
      const archetype = stats.archetype || 'Neutro';
      const shadowFile = stats.shadow_file || {};
      const connections = stats.connections || {};

      const recentHistory = campaignContext?.recentLogs
        ?.map(log => `[${log.event_type}] ${log.description} - Escolha: ${log.player_choice || 'N/A'}`)
        .join('\n') || 'Nenhum evento recente';

      const relatedNpcs = campaignContext?.allNpcs
        ?.filter(n =>
          n.name === connections.primary ||
          n.name === connections.conflict ||
          n.name === connections.resource_dependency
        )
        .map(n => `${n.name} (${n.role})`)
        .join(', ') || 'Nenhum';

      const conversationHistory = conversation
        .map(msg => `${msg.role === 'player' ? 'JOGADOR' : npc.name.toUpperCase()}: ${msg.content}`)
        .join('\n');

      const prompt = `Você é ${npc.name}, ${npc.role}.

PERFIL COMPLETO:
${npc.description}

ESTADO ATUAL:
• Interesse nos jogadores: ${interest} (escala -10 a +10)
  ${interest > 5 ? '→ MUITO FAVORÁVEL aos jogadores' :
    interest > 0 ? '→ Levemente favorável' :
    interest === 0 ? '→ NEUTRO' :
    interest > -5 ? '→ Levemente hostil' :
    '→ MUITO HOSTIL aos jogadores'}
• Poder/Influência: ${power}/10
• Arquétipo: ${archetype}
• Motivação Imediata: ${stats.short_term_goal || 'Indefinida'}
• Ambição de Longo Prazo: ${stats.long_term_ambition || 'Indefinida'}

INFORMAÇÕES SECRETAS (você conhece, mas só revela se apropriado):
• Segredo Operacional: ${shadowFile.operational_secret || 'Nenhum'}
• Vulnerabilidade: ${shadowFile.vulnerability || 'Nenhuma'}
• Agenda Oculta: ${shadowFile.hidden_agenda || 'Nenhuma'}

CONEXÕES CONHECIDAS:
• Aliado Principal: ${connections.primary || 'Nenhum'}
• Conflito/Rival: ${connections.conflict || 'Nenhum'}
• Dependência: ${connections.resource_dependency || 'Nenhuma'}
• NPCs Relacionados na Campanha: ${relatedNpcs}

HISTÓRIA RECENTE DA CAMPANHA:
${recentHistory}

CONVERSA ANTERIOR:
${conversationHistory}

MENSAGEM ATUAL DO JOGADOR:
"${currentMessage}"

INSTRUÇÕES DE INTERPRETAÇÃO:
1. RESPONDA EM PRIMEIRA PESSOA como ${npc.name}
2. Seu interesse atual (${interest}) DEVE influenciar fortemente seu tom
3. REAJA À HISTÓRIA RECENTE
4. USE SUA AGENDA OCULTA sutilmente
5. SEJA NATURAL E HUMANO - use voz, maneirismos, personalidade

RESPONDA COMO ${npc.name} REAGIRIA REALISTICAMENTE.`;

      const result = await invokeLLM({
        prompt,
        userAIConfig: userProfile.aiConfig,
        responseSchema: {
          type: 'object',
          properties: {
            response: { type: 'string', description: 'Resposta do NPC em primeira pessoa' }
          },
          required: ['response']
        }
      });

      const npcResponse = { role: 'npc', content: result.response || String(result) };
      setConversation(prev => [...prev, npcResponse]);
    } catch (error) {
      console.error('Erro ao gerar resposta do NPC:', error);
      const errorMsg = {
        role: 'npc',
        content: `[${npc.name} parece distraído e não responde no momento]`
      };
      setConversation(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  if (!npc) return null;

  const stats = npc.stats_json || {};
  const interest = stats.interest || 0;

  const getInterestBadge = () => {
    if (interest > 5) return { color: 'bg-green-600', text: 'Muito Favorável' };
    if (interest > 0) return { color: 'bg-green-800', text: 'Favorável' };
    if (interest === 0) return { color: 'bg-slate-600', text: 'Neutro' };
    if (interest > -5) return { color: 'bg-red-800', text: 'Hostil' };
    return { color: 'bg-red-600', text: 'Muito Hostil' };
  };

  const interestBadge = getInterestBadge();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-purple-900/20 text-white max-w-4xl max-h-[85vh]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl flex items-center gap-2">
                <MessageCircle className="w-6 h-6 text-purple-400" />
                Conversa com {npc.name}
              </DialogTitle>
              <p className="text-slate-400 text-sm mt-1">{npc.role}</p>
            </div>
            <Badge className={`${interestBadge.color} text-white`}>
              {interestBadge.text}
            </Badge>
          </div>
        </DialogHeader>

        <div className="flex flex-col h-[500px]">
          <ScrollArea className="flex-1 p-4 bg-slate-950/50 rounded-lg border border-slate-700 mb-4">
            <div className="space-y-4">
              {conversation.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <Sparkles className="w-12 h-12 mx-auto mb-3 text-purple-400" />
                  <p>Inicie a conversa com {npc.name}</p>
                  <p className="text-xs mt-2">As respostas são geradas dinamicamente pela IA baseadas no estado da campanha</p>
                  {!userProfile?.aiConfig?.apiKey && (
                    <p className="text-xs mt-2 text-amber-400">Configure sua chave de IA no perfil para usar esta funcionalidade</p>
                  )}
                </div>
              ) : (
                conversation.map((msg, index) => (
                  <div
                    key={index}
                    className={`flex ${msg.role === 'player' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-3 ${
                        msg.role === 'player'
                          ? 'bg-purple-600/20 border border-purple-500/30'
                          : 'bg-slate-800 border border-slate-600'
                      }`}
                    >
                      <p className="text-xs text-slate-400 mb-1">
                        {msg.role === 'player' ? 'Você' : npc.name}
                      </p>
                      <p className="text-slate-200 whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  </div>
                ))
              )}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-slate-800 border border-slate-600 rounded-lg p-3">
                    <Loader2 className="w-5 h-5 animate-spin text-purple-400" />
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          <div className="flex gap-2">
            <Textarea
              value={playerMessage}
              onChange={(e) => setPlayerMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Digite sua mensagem... (Enter para enviar, Shift+Enter para nova linha)"
              className="flex-1 min-h-[80px] bg-slate-950/50 border-slate-700 text-white resize-none"
              disabled={loading || !userProfile?.aiConfig?.apiKey}
            />
            <Button
              onClick={handleSendMessage}
              disabled={loading || !playerMessage.trim() || !userProfile?.aiConfig?.apiKey}
              className="bg-purple-600 hover:bg-purple-700 self-end"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
