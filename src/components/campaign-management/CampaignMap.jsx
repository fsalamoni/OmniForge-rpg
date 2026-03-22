import React, { useState, useRef, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { MapPin, Plus, Trash2, Upload, Edit2, X } from 'lucide-react';
import { Campaign, CampaignStorage } from '@/firebase/db';

const DEFAULT_MARKER_ICON = '📍';

const MARKER_ICONS = {
  location: DEFAULT_MARKER_ICON,
  scene: '🎬',
  stakeholder: '👤',
  poi: '⭐',
  danger: '⚠️',
  quest: '❓'
};

function MapCanvas({ map, isOwner, onCanvasClick, onRemoveMarker }) {
  const [hovered, setHovered] = useState(null);
  const canvasRef = useRef(null);

  const handleMapClick = useCallback((e) => {
    if (!isOwner) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);
    onCanvasClick({ x, y });
  }, [isOwner, onCanvasClick]);

  const markers = map?.markers || [];

  return (
    <div
      ref={canvasRef}
      className="relative w-full h-96 rounded-lg border border-slate-700 overflow-hidden cursor-crosshair"
      style={{
        background: map?.imageUrl
          ? `url(${map.imageUrl}) center/cover no-repeat`
          : 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)'
      }}
      onClick={handleMapClick}
      title={isOwner ? 'Clique para adicionar um marcador' : ''}
    >
      {/* Grid overlay when no image */}
      {!map?.imageUrl && (
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          {[...Array(10)].map((_, i) => (
            <div key={`h-${i}`} className="absolute w-full border-t border-slate-700" style={{ top: `${i * 10}%` }} />
          ))}
          {[...Array(10)].map((_, i) => (
            <div key={`v-${i}`} className="absolute h-full border-l border-slate-700" style={{ left: `${i * 10}%` }} />
          ))}
        </div>
      )}

      {isOwner && (
        <div className="absolute bottom-2 right-3 text-xs text-slate-500 bg-slate-950/60 px-2 py-1 rounded pointer-events-none select-none">
          Clique no mapa para adicionar marcador
        </div>
      )}

      {/* Markers */}
      {markers.map((marker, index) => (
        <div
          key={marker.id || index}
          className="absolute group transition-transform hover:scale-110"
          style={{
            left: `${Math.min(Math.max(marker.x, 2), 98)}%`,
            top: `${Math.min(Math.max(marker.y, 2), 98)}%`,
            transform: 'translate(-50%, -50%)'
          }}
          onClick={(e) => e.stopPropagation()}
          onMouseEnter={() => setHovered(index)}
          onMouseLeave={() => setHovered(null)}
        >
          <div className="text-2xl filter drop-shadow-lg cursor-default select-none">
            {MARKER_ICONS[marker.type] || DEFAULT_MARKER_ICON}
          </div>

          {hovered === index && (
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-10 w-56">
              <div className="bg-slate-950 border border-purple-500/30 rounded-lg p-3 shadow-xl">
                <div className="flex items-start justify-between mb-1">
                  <p className="text-white font-semibold text-sm">{marker.name}</p>
                  {isOwner && marker.id && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onRemoveMarker(marker.id); }}
                      className="text-red-400 hover:text-red-300 ml-2 shrink-0"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
                {marker.arc && <p className="text-purple-400 text-xs">{marker.arc}</p>}
                {marker.role && <p className="text-slate-400 text-xs">{marker.role}</p>}
                {marker.notes && (
                  <p className="text-slate-300 text-xs mt-1 leading-relaxed">
                    {marker.notes.substring(0, 150)}{marker.notes.length > 150 ? '...' : ''}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default function CampaignMap({ wbs, stakeholders, isOwner, campaignId, initialMarkers, content }) {
  const [maps, setMaps] = useState(() => {
    if (content?.maps && content.maps.length > 0) return content.maps;
    return [{
      id: 'default',
      name: 'Mapa Principal',
      imageUrl: '',
      markers: initialMarkers || []
    }];
  });
  const [activeMapId, setActiveMapId] = useState(() => {
    if (content?.maps && content.maps.length > 0) return content.maps[0]?.id || 'default';
    return 'default';
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newMarker, setNewMarker] = useState({ x: 50, y: 50, name: '', notes: '', type: 'location' });
  const [editingMapName, setEditingMapName] = useState(false);
  const fileInputRef = useRef(null);

  const activeMap = maps.find(m => m.id === activeMapId) || maps[0];

  const persistMaps = async (updatedMaps) => {
    if (!campaignId || !content) return;
    setSaving(true);
    try {
      await Campaign.update(campaignId, {
        // maps array is the primary storage; map_markers kept for backward compatibility
        content_json: { ...content, maps: updatedMaps, map_markers: updatedMaps[0]?.markers || [] }
      });
    } catch (err) {
      console.error('Erro ao salvar mapa:', err);
    } finally {
      setSaving(false);
    }
  };

  const updateActiveMap = async (updater) => {
    const updated = maps.map(m => m.id === activeMapId ? updater(m) : m);
    setMaps(updated);
    await persistMaps(updated);
  };

  const handleAddMarkerForm = async () => {
    if (!newMarker.name.trim()) return;
    const marker = { ...newMarker, id: Date.now() };
    await updateActiveMap(m => ({ ...m, markers: [...(m.markers || []), marker] }));
    setNewMarker({ x: 50, y: 50, name: '', notes: '', type: 'location' });
    setDialogOpen(false);
  };

  const handleAddMarkerFromCanvas = ({ x, y }) => {
    setNewMarker(prev => ({ ...prev, x, y }));
    setDialogOpen(true);
  };

  const handleRemoveMarker = async (markerId) => {
    if (!confirm('Remover este marcador do mapa?')) return;
    await updateActiveMap(m => ({ ...m, markers: (m.markers || []).filter(mk => mk.id !== markerId) }));
  };

  const handleAddMap = async () => {
    const name = prompt('Nome do novo mapa:');
    if (!name?.trim()) return;
    const newMap = { id: `map_${Date.now()}`, name: name.trim(), imageUrl: '', markers: [] };
    const updated = [...maps, newMap];
    setMaps(updated);
    setActiveMapId(newMap.id);
    await persistMaps(updated);
  };

  const handleDeleteMap = async () => {
    if (maps.length <= 1) return;
    if (!confirm(`Excluir o mapa "${activeMap.name}"?`)) return;
    const updated = maps.filter(m => m.id !== activeMapId);
    setMaps(updated);
    setActiveMapId(updated[0].id);
    await persistMaps(updated);
  };

  const handleRenameMap = async (newName) => {
    if (!newName?.trim()) return;
    await updateActiveMap(m => ({ ...m, name: newName.trim() }));
    setEditingMapName(false);
  };

  const handleUploadImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadProgress(0);
    try {
      const url = await CampaignStorage.uploadMapImage(
        campaignId, activeMapId, file,
        (pct) => setUploadProgress(pct)
      );
      await updateActiveMap(m => ({ ...m, imageUrl: url }));
    } catch (err) {
      console.error('Erro ao fazer upload da imagem:', err);
      const msg = err?.code === 'storage/unauthorized'
        ? 'Sem permissão para enviar imagens. Verifique as regras do Firebase Storage.'
        : err?.message || 'Erro desconhecido';
      alert(`Erro ao fazer upload: ${msg}`);
    } finally {
      setUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveImage = async () => {
    if (!confirm('Remover imagem do mapa?')) return;
    await updateActiveMap(m => ({ ...m, imageUrl: '' }));
  };

  // Auto-markers from WBS and stakeholders (read-only, not persisted)
  const autoMarkers = useMemo(() => {
    const result = [];
    if (wbs?.narrative_arcs) {
      wbs.narrative_arcs.forEach((arc, arcIndex) => {
        (arc.scenes || []).forEach((scene, sceneIndex) => {
          if (scene.name) {
            result.push({
              name: scene.name, type: 'scene', arc: arc.name,
              x: 20 + (arcIndex * 25), y: 20 + (sceneIndex * 15),
              notes: scene.process || ''
            });
          }
        });
      });
    }
    if (stakeholders) {
      stakeholders.forEach((s, i) => {
        result.push({
          name: s.name, type: 'stakeholder', role: s.role || s.title,
          x: 30 + (i * 12), y: 60 + (i * 8),
          notes: s.description || ''
        });
      });
    }
    return result;
  }, [wbs, stakeholders]);

  const displayMap = activeMap
    ? { ...activeMap, markers: [...autoMarkers, ...(activeMap.markers || [])] }
    : { markers: autoMarkers };

  return (
    <div className="space-y-6">
      <Card className="bg-slate-900/50 border-purple-900/20">
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <MapPin className="w-6 h-6 text-purple-400" />
              {editingMapName ? (
                <form onSubmit={(e) => { e.preventDefault(); handleRenameMap(e.target.elements.mapName.value); }}>
                  <Input
                    name="mapName"
                    defaultValue={activeMap?.name}
                    autoFocus
                    className="bg-slate-950/50 border-slate-700 text-white h-7 w-48 text-sm"
                    onBlur={(e) => handleRenameMap(e.target.value)}
                  />
                </form>
              ) : (
                <CardTitle className="text-white flex items-center gap-2">
                  {activeMap?.name || 'Mapa'}
                  {isOwner && (
                    <button onClick={() => setEditingMapName(true)} className="text-slate-500 hover:text-slate-300">
                      <Edit2 className="w-3 h-3" />
                    </button>
                  )}
                </CardTitle>
              )}
              {saving && <span className="text-xs text-slate-500 animate-pulse">Salvando...</span>}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Map selector */}
              {maps.length > 1 && (
                <Select value={activeMapId} onValueChange={setActiveMapId}>
                  <SelectTrigger className="bg-slate-950/50 border-slate-700 text-white text-xs h-8 w-44">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {maps.map(m => (
                      <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {isOwner && (
                <>
                  {/* Upload image */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleUploadImage}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-blue-500/30 text-blue-300 hover:bg-blue-900/20"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                  >
                    <Upload className="w-4 h-4 mr-1" />
                    {uploading ? `${uploadProgress}%` : 'Upload de Mapa'}
                  </Button>
                  {activeMap?.imageUrl && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-400 hover:text-red-300 h-8 w-8 p-0"
                      onClick={handleRemoveImage}
                      title="Remover imagem"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}

                  {/* Add marker dialog */}
                  <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="border-purple-500/30">
                        <Plus className="w-4 h-4 mr-1" />
                        Marcador
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
                          onClick={handleAddMarkerForm}
                          disabled={!newMarker.name.trim()}
                          className="w-full bg-purple-600 hover:bg-purple-700"
                        >
                          Adicionar ao Mapa
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>

                  {/* Add new map */}
                  <Button variant="outline" size="sm" className="border-green-500/30 text-green-300 hover:bg-green-900/20" onClick={handleAddMap}>
                    <Plus className="w-4 h-4 mr-1" />
                    Novo Mapa
                  </Button>

                  {/* Delete map */}
                  {maps.length > 1 && (
                    <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-300 h-8 w-8 p-0" onClick={handleDeleteMap} title="Excluir este mapa">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <MapCanvas
            map={displayMap}
            isOwner={isOwner}
            onCanvasClick={handleAddMarkerFromCanvas}
            onRemoveMarker={handleRemoveMarker}
          />

          {/* Legend */}
          <div className="mt-4 flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2"><span>📍</span><span className="text-slate-400">Locais</span></div>
            <div className="flex items-center gap-2"><span>⭐</span><span className="text-slate-400">Pontos de Interesse</span></div>
            <div className="flex items-center gap-2"><span>⚠️</span><span className="text-slate-400">Perigos</span></div>
            <div className="flex items-center gap-2"><span>❓</span><span className="text-slate-400">Missões</span></div>
            <div className="flex items-center gap-2"><span>🎬</span><span className="text-slate-400">Cenas WBS</span></div>
            <div className="flex items-center gap-2"><span>👤</span><span className="text-slate-400">Stakeholders</span></div>
          </div>

          {/* Custom markers list */}
          {(activeMap?.markers || []).length > 0 && (
            <div className="mt-4 border-t border-slate-700 pt-4">
              <p className="text-xs text-slate-500 mb-2">Marcadores salvos ({activeMap.markers.length})</p>
              <div className="flex flex-wrap gap-2">
                {activeMap.markers.map((m) => (
                  <div key={m.id} className="flex items-center gap-1 px-2 py-1 bg-slate-800/50 border border-slate-700 rounded text-xs text-slate-300">
                    <span>{MARKER_ICONS[m.type] || DEFAULT_MARKER_ICON}</span>
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
