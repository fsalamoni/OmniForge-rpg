import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Loader2, Sparkles } from 'lucide-react';
import { invokeLLM } from '@/lib/aiClient';
import { NpcCreature } from '@/firebase/db';
import { useAuth } from '@/lib/AuthContext';

export default function NpcSelector({ campaignId, description, hooks, arcs, systemRpg, onNpcsCreated }) {
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [npcNames, setNpcNames] = useState([]);
  const [selected, setSelected] = useState({});
  const { userProfile } = useAuth();

  useEffect(() => {
    if (description) {
      extractNpcNames();
    }
  }, [description]);

  const extractNpcNames = async () => {
    if (!userProfile?.aiConfig) return;
    setLoading(true);
    try {
      const hooksText = Array.isArray(hooks) ? hooks.map(h => typeof h === 'string' ? h : h.hook || '').join('\n') : '';
      const arcsText = Array.isArray(arcs) ? arcs.map(a => a.name || '').join(', ') : '';

      const result = await invokeLLM({
        prompt: `Analise a descrição desta campanha de RPG e extraia os nomes de TODOS os personagens mencionados explicitamente (NPCs, vilões, aliados, figuras históricas, etc.).

DESCRIÇÃO:
${description}

GANCHOS:
${hooksText}

ARCOS:
${arcsText}

Extraia apenas nomes PRÓPRIOS de personagens. Não inclua tipos genéricos como "o rei" sem nome. Agrupe por localização quando possível.`,
        responseSchema: {
          type: 'object',
          properties: {
            locations: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  location: { type: 'string' },
                  npcs: { type: 'array', items: { type: 'string' } }
                },
                required: ['location', 'npcs']
              }
            }
          },
          required: ['locations']
        },
        userAIConfig: userProfile.aiConfig
      });

      setNpcNames(result?.locations || []);
    } catch (error) {
      console.error('Erro ao extrair NPCs:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleNpc = (name) => {
    setSelected(prev => ({ ...prev, [name]: !prev[name] }));
  };

  const selectedNames = Object.entries(selected).filter(([, v]) => v).map(([k]) => k);

  const handleCreateSelected = async () => {
    if (selectedNames.length === 0) return;
    if (!userProfile?.aiConfig) {
      alert('Configure sua chave de IA no Perfil antes de usar esta funcionalidade.');
      return;
    }
    setCreating(true);
    try {
      const created = [];
      for (const name of selectedNames) {
        const result = await invokeLLM({
          prompt: `Crie um perfil detalhado para o personagem "${name}" da seguinte campanha de RPG:

Sistema: ${systemRpg}
Descrição: ${(description || '').substring(0, 800)}

Gere um perfil completo com aparência, personalidade, motivações e papel na campanha.`,
          responseSchema: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              role: { type: 'string' },
              type: { type: 'string', enum: ['NPC', 'Ally', 'Villain', 'Monster'] },
              description: { type: 'string' },
              motivation: { type: 'string' },
              power: { type: 'integer', minimum: 1, maximum: 10 },
              interest: { type: 'integer', minimum: -10, maximum: 10 },
              archetype: { type: 'string' }
            },
            required: ['name', 'role', 'type', 'description', 'motivation']
          },
          userAIConfig: userProfile.aiConfig
        });

        const npc = await NpcCreature.create({
          campaignId,
          name: result.name || name,
          type: result.type || 'NPC',
          role: result.role || 'Personagem',
          motivation: result.motivation || 'Não especificada',
          description: result.description || 'Sem descrição',
          stats_json: {
            power: result.power || 5,
            interest: result.interest || 0,
            archetype: result.archetype || '',
            long_term_ambition: '',
            shadow_file: { operational_secret: '', vulnerability: '', hidden_agenda: '' },
            connections: { primary: '', conflict: '', resource_dependency: '' }
          }
        });
        created.push(npc);
      }

      if (onNpcsCreated) onNpcsCreated(created);
      setSelected({});
    } catch (error) {
      console.error('Erro ao criar NPCs:', error);
      alert('Erro ao criar NPCs: ' + error.message);
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <Card className="bg-slate-900/50 border-purple-900/20">
        <CardContent className="py-8 text-center">
          <Loader2 className="w-8 h-8 text-purple-400 animate-spin mx-auto mb-3" />
          <p className="text-slate-400">Analisando campanha para encontrar NPCs...</p>
        </CardContent>
      </Card>
    );
  }

  if (npcNames.length === 0) {
    return (
      <Card className="bg-slate-900/50 border-purple-900/20">
        <CardContent className="py-8 text-center">
          <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">Nenhum personagem encontrado na descrição da campanha.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-900/50 border-purple-900/20">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Users className="w-5 h-5 text-purple-400" />
          Personagens Identificados na Campanha
        </CardTitle>
        <p className="text-slate-400 text-sm">
          Selecione os personagens para criar perfis detalhados com IA
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {npcNames.map((group, gi) => (
          <div key={gi}>
            <h4 className="text-slate-300 text-sm font-semibold mb-2">{group.location}</h4>
            <div className="space-y-2">
              {(group.npcs || []).map((name, ni) => (
                <div key={ni} className="flex items-center gap-3 p-2 bg-slate-950/50 rounded">
                  <Checkbox
                    id={`npc-${gi}-${ni}`}
                    checked={!!selected[name]}
                    onCheckedChange={() => toggleNpc(name)}
                    className="border-purple-500"
                  />
                  <label htmlFor={`npc-${gi}-${ni}`} className="text-white cursor-pointer">{name}</label>
                </div>
              ))}
            </div>
          </div>
        ))}

        {selectedNames.length > 0 && (
          <div className="pt-4 border-t border-slate-700">
            <div className="flex items-center justify-between mb-3">
              <span className="text-slate-400 text-sm">{selectedNames.length} selecionados</span>
              <div className="flex flex-wrap gap-1">
                {selectedNames.map(name => (
                  <Badge key={name} className="bg-purple-600/20 text-purple-300 text-xs">{name}</Badge>
                ))}
              </div>
            </div>
            <Button
              onClick={handleCreateSelected}
              disabled={creating}
              className="w-full bg-gradient-to-r from-purple-600 to-purple-700"
            >
              {creating ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Criando {selectedNames.length} NPCs...</>
              ) : (
                <><Sparkles className="w-4 h-4 mr-2" />Criar {selectedNames.length} NPCs com IA</>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
