import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { MapPin, Plus } from 'lucide-react';

export default function CampaignMap({ wbs, stakeholders, isOwner }) {
  const [markers, setMarkers] = useState([]);
  const [newMarker, setNewMarker] = useState({ x: 50, y: 50, name: '', notes: '', type: 'location' });

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

  const handleAddMarker = () => {
    if (!newMarker.name.trim()) return;
    setMarkers([...markers, { ...newMarker, id: Date.now() }]);
    setNewMarker({ x: 50, y: 50, name: '', notes: '', type: 'location' });
  };

  const markerIcons = {
    location: '📍',
    scene: '🎬',
    stakeholder: '👤',
    poi: '⭐'
  };

  return (
    <div className="space-y-6">
      <Card className="bg-slate-900/50 border-purple-900/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="w-6 h-6 text-purple-400" />
              <CardTitle className="text-white">Mapa da Campanha</CardTitle>
            </div>
            {isOwner && (
              <Dialog>
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
                      <label className="text-slate-300 text-sm mb-2 block">Nome do Local</label>
                      <Input
                        value={newMarker.name}
                        onChange={(e) => setNewMarker({ ...newMarker, name: e.target.value })}
                        className="bg-slate-950/50 border-slate-700 text-white"
                      />
                    </div>
                    <div>
                      <label className="text-slate-300 text-sm mb-2 block">Notas</label>
                      <Textarea
                        value={newMarker.notes}
                        onChange={(e) => setNewMarker({ ...newMarker, notes: e.target.value })}
                        className="bg-slate-950/50 border-slate-700 text-white"
                      />
                    </div>
                    <Button onClick={handleAddMarker} className="w-full bg-purple-600">
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
                      <span className={`px-2 py-1 rounded text-xs ${
                        marker.type === 'scene' ? 'bg-blue-600/20 text-blue-300' :
                        marker.type === 'stakeholder' ? 'bg-purple-600/20 text-purple-300' :
                        'bg-slate-600/20 text-slate-300'
                      }`}>
                        {marker.type}
                      </span>
                    </div>
                    {marker.notes && (
                      <p className="text-slate-300 text-xs leading-relaxed">
                        {marker.notes.substring(0, 150)}{marker.notes.length > 150 ? '...' : ''}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Legenda */}
          <div className="mt-4 flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span>📍</span>
              <span className="text-slate-400">Locais Customizados</span>
            </div>
            <div className="flex items-center gap-2">
              <span>🎬</span>
              <span className="text-slate-400">Cenas da WBS</span>
            </div>
            <div className="flex items-center gap-2">
              <span>👤</span>
              <span className="text-slate-400">Stakeholders</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
