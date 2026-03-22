import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { MapPin, Plus, Trash2 } from 'lucide-react';
import { Campaign } from '@/firebase/db';

export default function CampaignMap({ wbs, stakeholders, isOwner, campaignId, initialMarkers, content }) {
  const [markers, setMarkers] = useState(initialMarkers || []);
  const [newMarker, setNewMarker] = useState({ x: 50, y: 50, name: '', notes: '', type: 'location' });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const persistMarkers = async (updated) => {
    if (!campaignId || !content) return;
    setSaving(true);
    try {
      await Campaign.update(campaignId, {
        content_json: { ...content, map_markers: updated }
      });
    } catch (err) {
      console.error('Erro ao salvar marcadores:', err);
    } finally {
      setSaving(false);
    }
  };

  const extractLocationsFromWBS = () => {
    if (!wbs || !wbs.narrative_arcs) return [];
    const locations = [];
    wbs.narrative_arcs.forEach((arc, arcIndex) => {
      if (arc.scenes) {
        arc.scenes.forEach((scene, sceneIndex) => {
          if (scene.name) {
            locations.push({
              name: scene.name,
              type: 'scene',
              arc: arc.name,
              x: 20 + (arcIndex * 25),
              y: 20 + (sceneIndex * 15),
              notes: scene.process || ''
            });
          }
        });
      }
    });
    return locations;
  };

  const extractStakeholderLocations = () => {
    if (!stakeholders) return [];
    return stakeholders.map((s, i) => ({
      name: s.name,
      type: 'stakeholder',
      role: s.role || s.title,
      x: 30 + (i * 12),
      y: 60 + (i * 8),
      notes: s.description || ''
    }));
  };

  const allMarkers = [
    ...extractLocationsFromWBS(),
    ...extractStakeholderLocations(),
    ...markers
  ];

  const handleAddMarker = async () => {
    if (!newMarker.name.trim()) return;
    const updated = [...markers, { ...newMarker, id: Date.now() }];
    setMarkers(updated);
    setNewMarker({ x: 50, y: 50, name: '', notes: '', type: 'location' });
    setDialogOpen(false);
    await persistMarkers(updated);
  };

  const handleRemoveMarker = async (markerId) => {
    if (!confirm('Remover este marcador do mapa?')) return;
    const updated = markers.filter(m => m.id !== markerId);
    setMarkers(updated);
    await persistMarkers(updated);
  };

  const markerIcons = {
    location: '📍',
    scene: '🎬',
    stakeholder: '👤',
    poi: '⭐',
    danger: '⚠️',
    quest: '❓'
  };

  return (
    <div className="space-y-6">
      <Card className="bg-slate-900/50 border-purple-900/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="w-6 h-6 text-purple-400" />
              <CardTitle className="text-white">Mapa da Campanha</CardTitle>
              {saving && <span className="text-xs text-slate-500 animate-pulse">Salvando...</span>}
            </div>
            {isOwner && (
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="border-purple-500/30">
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar Local
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-slate-900 border-purple-900/20">
                  <DialogHeader>
                    <DialogTitle className="text-white">Novo Marcador</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <label className="text-slate-300 text-sm mb-2 block">Nome do Local *</label>
                      <Input
                        value={newMarker.name}
                        onChange={(e) => setNewMarker({ ...newMarker, name: e.target.value })}
                        placeholder="Ex: Taverna do Urso Negro"
                        className="bg-slate-950/50 border-slate-700 text-white"
                      />
                    </div>
                    <div>
                      <label className="text-slate-300 text-sm mb-2 block">Tipo</label>
                      <Select value={newMarker.type} onValueChange={(v) => setNewMarker({ ...newMarker, type: v })}>
                        <SelectTrigger className="bg-slate-950/50 border-slate-700 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="location">📍 Local</SelectItem>
                          <SelectItem value="poi">⭐ Ponto de Interesse</SelectItem>
                          <SelectItem value="danger">⚠️ Perigo</SelectItem>
                          <SelectItem value="quest">❓ Missão</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-slate-300 text-sm mb-2 block">Posição X (0-100)</label>
                        <Input
                          type="number" min="2" max="98"
                          value={newMarker.x}
                          onChange={(e) => setNewMarker({ ...newMarker, x: parseInt(e.target.value) || 50 })}
                          className="bg-slate-950/50 border-slate-700 text-white"
                        />
                      </div>
                      <div>
                        <label className="text-slate-300 text-sm mb-2 block">Posição Y (0-100)</label>
                        <Input
                          type="number" min="2" max="98"
                          value={newMarker.y}
                          onChange={(e) => setNewMarker({ ...newMarker, y: parseInt(e.target.value) || 50 })}
                          className="bg-slate-950/50 border-slate-700 text-white"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-slate-300 text-sm mb-2 block">Notas</label>
                      <Textarea
                        value={newMarker.notes}
                        onChange={(e) => setNewMarker({ ...newMarker, notes: e.target.value })}
                        placeholder="Descrição, eventos ocorridos, segredos..."
                        className="bg-slate-950/50 border-slate-700 text-white"
                      />
                    </div>
                    <Button
                      onClick={handleAddMarker}
                      disabled={!newMarker.name.trim()}
                      className="w-full bg-purple-600 hover:bg-purple-700"
                    >
                      Adicionar ao Mapa
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {/* Mapa Visual */}
          <div className="relative w-full h-96 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 rounded-lg border border-slate-700 overflow-hidden">
            {/* Grid de fundo */}
            <div className="absolute inset-0 opacity-20">
              {[...Array(10)].map((_, i) => (
                <div key={`h-${i}`} className="absolute w-full border-t border-slate-700" style={{ top: `${i * 10}%` }} />
              ))}
              {[...Array(10)].map((_, i) => (
                <div key={`v-${i}`} className="absolute h-full border-l border-slate-700" style={{ left: `${i * 10}%` }} />
              ))}
            </div>

            {/* Legenda de escala */}
            <div className="absolute bottom-2 right-3 text-xs text-slate-600 select-none">
              Grade 10×10
            </div>

            {/* Marcadores */}
            {allMarkers.map((marker, index) => (
              <div
                key={index}
                className="absolute group cursor-pointer transition-transform hover:scale-110"
                style={{
                  left: `${Math.min(Math.max(marker.x, 2), 98)}%`,
                  top: `${Math.min(Math.max(marker.y, 2), 98)}%`,
                  transform: 'translate(-50%, -50%)'
                }}
              >
                <div className="text-2xl filter drop-shadow-lg">
                  {markerIcons[marker.type] || '📍'}
                </div>

                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10 w-64">
                  <div className="bg-slate-950 border border-purple-500/30 rounded-lg p-3 shadow-xl">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="text-white font-semibold text-sm">{marker.name}</p>
                        {marker.role && <p className="text-slate-400 text-xs">{marker.role}</p>}
                        {marker.arc && <p className="text-purple-400 text-xs">{marker.arc}</p>}
                      </div>
                      <div className="flex items-center gap-1">
                        <span className={`px-2 py-0.5 rounded text-xs ${
                          marker.type === 'scene' ? 'bg-blue-600/20 text-blue-300' :
                          marker.type === 'stakeholder' ? 'bg-purple-600/20 text-purple-300' :
                          marker.type === 'danger' ? 'bg-red-600/20 text-red-300' :
                          marker.type === 'quest' ? 'bg-amber-600/20 text-amber-300' :
                          'bg-slate-600/20 text-slate-300'
                        }`}>
                          {marker.type}
                        </span>
                        {isOwner && marker.id && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleRemoveMarker(marker.id); }}
                            className="text-red-400 hover:text-red-300 ml-1"
                            title="Remover marcador"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                    {marker.notes && (
                      <p className="text-slate-300 text-xs leading-relaxed">
                        {marker.notes.substring(0, 200)}{marker.notes.length > 200 ? '...' : ''}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Legenda */}
          <div className="mt-4 flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2"><span>📍</span><span className="text-slate-400">Locais</span></div>
            <div className="flex items-center gap-2"><span>⭐</span><span className="text-slate-400">Pontos de Interesse</span></div>
            <div className="flex items-center gap-2"><span>⚠️</span><span className="text-slate-400">Perigos</span></div>
            <div className="flex items-center gap-2"><span>❓</span><span className="text-slate-400">Missões</span></div>
            <div className="flex items-center gap-2"><span>🎬</span><span className="text-slate-400">Cenas WBS</span></div>
            <div className="flex items-center gap-2"><span>👤</span><span className="text-slate-400">Stakeholders</span></div>
          </div>

          {/* Custom markers list */}
          {markers.length > 0 && (
            <div className="mt-4 border-t border-slate-700 pt-4">
              <p className="text-xs text-slate-500 mb-2">Marcadores salvos ({markers.length})</p>
              <div className="flex flex-wrap gap-2">
                {markers.map((m) => (
                  <div key={m.id} className="flex items-center gap-1 px-2 py-1 bg-slate-800/50 border border-slate-700 rounded text-xs text-slate-300">
                    <span>{markerIcons[m.type] || '📍'}</span>
                    <span>{m.name}</span>
                    {isOwner && (
                      <button onClick={() => handleRemoveMarker(m.id)} className="text-slate-500 hover:text-red-400 ml-1">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
