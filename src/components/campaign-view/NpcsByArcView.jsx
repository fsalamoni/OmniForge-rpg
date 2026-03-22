import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronDown, ChevronRight, Users, Link } from 'lucide-react';
import NpcCard from './NpcCard';
import { NpcCreature } from '@/firebase/db';

function AssociatePopover({ npc, arcs, onAssociate, onClose }) {
  const [arcIdx, setArcIdx] = useState('');
  const [actIdx, setActIdx] = useState('');
  const [sceneIdx, setSceneIdx] = useState('');

  const selectedArc = arcIdx !== '' ? arcs[parseInt(arcIdx)] : null;
  const selectedAct = selectedArc && actIdx !== '' ? selectedArc.acts?.[parseInt(actIdx)] : null;

  const handleConfirm = async () => {
    if (arcIdx === '') return;
    const association = {
      arc_index: parseInt(arcIdx),
      act_index: actIdx !== '' ? parseInt(actIdx) : null,
      scene_index: sceneIdx !== '' ? parseInt(sceneIdx) : null,
    };
    const existing = npc.arc_associations || [];
    const isDuplicate = existing.some(
      a => a.arc_index === association.arc_index &&
           a.act_index === association.act_index &&
           a.scene_index === association.scene_index
    );
    if (!isDuplicate) {
      await NpcCreature.update(npc.id, {
        arc_associations: [...existing, association]
      });
    }
    onAssociate();
    onClose();
  };

  return (
    <div className="absolute z-50 top-8 right-0 w-72 bg-slate-900 border border-purple-500/40 rounded-lg shadow-xl p-4 space-y-3">
      <p className="text-white text-sm font-semibold">Associar a Arco/Ato/Cena</p>
      <div>
        <label className="text-slate-400 text-xs mb-1 block">Arco *</label>
        <Select value={arcIdx} onValueChange={(v) => { setArcIdx(v); setActIdx(''); setSceneIdx(''); }}>
          <SelectTrigger className="bg-slate-950/50 border-slate-700 text-white text-xs h-8">
            <SelectValue placeholder="Selecionar arco..." />
          </SelectTrigger>
          <SelectContent>
            {arcs.map((arc, i) => (
              <SelectItem key={i} value={String(i)}>
                {arc.name || `Arco ${i + 1}`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {selectedArc && (selectedArc.acts || []).length > 0 && (
        <div>
          <label className="text-slate-400 text-xs mb-1 block">Ato (opcional)</label>
          <Select value={actIdx} onValueChange={(v) => { setActIdx(v); setSceneIdx(''); }}>
            <SelectTrigger className="bg-slate-950/50 border-slate-700 text-white text-xs h-8">
              <SelectValue placeholder="Todos os atos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todos os atos</SelectItem>
              {(selectedArc.acts || []).map((act, i) => (
                <SelectItem key={i} value={String(i)}>
                  {act.title || `Ato ${i + 1}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      {selectedAct && (selectedAct.scenes || []).length > 0 && (
        <div>
          <label className="text-slate-400 text-xs mb-1 block">Cena (opcional)</label>
          <Select value={sceneIdx} onValueChange={setSceneIdx}>
            <SelectTrigger className="bg-slate-950/50 border-slate-700 text-white text-xs h-8">
              <SelectValue placeholder="Todas as cenas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todas as cenas</SelectItem>
              {(selectedAct.scenes || []).map((scene, i) => (
                <SelectItem key={i} value={String(i)}>
                  {scene.scene_name || `Cena ${i + 1}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      <div className="flex gap-2">
        <Button
          size="sm"
          className="flex-1 bg-purple-600 hover:bg-purple-700 text-xs h-7"
          disabled={arcIdx === ''}
          onClick={handleConfirm}
        >
          Confirmar
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="flex-1 border-slate-600 text-slate-300 text-xs h-7"
          onClick={onClose}
        >
          Cancelar
        </Button>
      </div>
    </div>
  );
}

function CollapsibleSection({ title, count, children, defaultOpen = false, colorClass = 'text-purple-300', borderClass = 'border-purple-500/30' }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={`border ${borderClass} rounded-lg overflow-hidden`}>
      <button
        className="w-full flex items-center justify-between p-3 bg-slate-900/60 hover:bg-slate-800/60 transition-colors text-left"
        onClick={() => setOpen(v => !v)}
      >
        <span className={`font-semibold text-sm ${colorClass} flex items-center gap-2`}>
          {open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          {title}
        </span>
        <Badge className="bg-slate-700/50 text-slate-300 border-slate-600 text-xs">
          {count} NPC{count !== 1 ? 's' : ''}
        </Badge>
      </button>
      {open && <div className="p-3 space-y-3">{children}</div>}
    </div>
  );
}

function NpcWithAssociate({ npc, arcs, isOwner, campaignId, campaignContext, systemRpg, onUpdate, showAssociate }) {
  const [popoverOpen, setPopoverOpen] = useState(false);
  return (
    <div className="relative">
      {isOwner && showAssociate && (
        <div className="absolute top-3 right-3 z-10">
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0 text-slate-400 hover:text-purple-300 hover:bg-purple-900/30"
            title="Associar a Arco"
            onClick={() => setPopoverOpen(v => !v)}
          >
            <Link className="w-3 h-3" />
          </Button>
          {popoverOpen && (
            <AssociatePopover
              npc={npc}
              arcs={arcs}
              onAssociate={onUpdate}
              onClose={() => setPopoverOpen(false)}
            />
          )}
        </div>
      )}
      <NpcCard
        npc={npc}
        isOwner={isOwner}
        campaignId={campaignId}
        campaignContext={campaignContext}
        systemRpg={systemRpg}
        onUpdate={onUpdate}
      />
    </div>
  );
}

export default function NpcsByArcView({
  arcs = [],
  npcs = [],
  isOwner = false,
  campaignId,
  campaignContext = '',
  systemRpg = 'D&D 5e',
  onUpdate,
  npcFilter = 'all',
}) {
  const filteredNpcs = npcFilter === 'all' ? npcs : npcs.filter(n => n.type === npcFilter);

  const getNpcsAtArcLevel = (arcIndex) => {
    return filteredNpcs.filter(npc => {
      const assocs = npc.arc_associations || [];
      return assocs.some(a =>
        a.arc_index === arcIndex &&
        a.act_index === null &&
        a.scene_index === null
      );
    });
  };

  const getNpcsAtActLevel = (arcIndex, actIndex) => {
    return filteredNpcs.filter(npc => {
      const assocs = npc.arc_associations || [];
      return assocs.some(a =>
        a.arc_index === arcIndex &&
        a.act_index === actIndex &&
        a.scene_index === null
      );
    });
  };

  const getNpcsAtSceneLevel = (arcIndex, actIndex, sceneIndex) => {
    return filteredNpcs.filter(npc => {
      const assocs = npc.arc_associations || [];
      return assocs.some(a =>
        a.arc_index === arcIndex &&
        a.act_index === actIndex &&
        a.scene_index === sceneIndex
      );
    });
  };

  const countNpcsInArc = (arcIndex) => {
    const seen = new Set();
    filteredNpcs.forEach(npc => {
      const assocs = npc.arc_associations || [];
      if (assocs.some(a => a.arc_index === arcIndex)) seen.add(npc.id);
    });
    return seen.size;
  };

  const countNpcsInAct = (arcIndex, actIndex) => {
    const seen = new Set();
    filteredNpcs.forEach(npc => {
      const assocs = npc.arc_associations || [];
      if (assocs.some(a => a.arc_index === arcIndex && a.act_index === actIndex)) seen.add(npc.id);
    });
    return seen.size;
  };

  const countNpcsInScene = (arcIndex, actIndex, sceneIndex) => {
    const seen = new Set();
    filteredNpcs.forEach(npc => {
      const assocs = npc.arc_associations || [];
      if (assocs.some(a => a.arc_index === arcIndex && a.act_index === actIndex && a.scene_index === sceneIndex)) seen.add(npc.id);
    });
    return seen.size;
  };

  const unassignedNpcs = filteredNpcs.filter(npc => {
    const assocs = npc.arc_associations || [];
    return assocs.length === 0;
  });

  const cardProps = { isOwner, campaignId, campaignContext, systemRpg, onUpdate, arcs };

  if (arcs.length === 0 && filteredNpcs.length === 0) {
    return (
      <div className="text-center py-12 bg-slate-900/30 border border-slate-800 rounded-2xl">
        <Users className="w-12 h-12 text-slate-600 mx-auto mb-4" />
        <p className="text-slate-400">Nenhum NPC ou arco disponível</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {arcs.map((arc, arcIdx) => {
        const arcNpcCount = countNpcsInArc(arcIdx);
        const arcLevelNpcs = getNpcsAtArcLevel(arcIdx);
        return (
          <CollapsibleSection
            key={arcIdx}
            title={`Arco ${arcIdx + 1}: ${arc.name || 'Sem nome'}`}
            count={arcNpcCount}
            defaultOpen={arcNpcCount > 0}
            colorClass="text-purple-300"
            borderClass="border-purple-500/30"
          >
            {arcLevelNpcs.length > 0 && (
              <div className="grid md:grid-cols-2 gap-3 mb-3">
                {arcLevelNpcs.map(npc => (
                  <NpcWithAssociate key={npc.id} npc={npc} showAssociate={false} {...cardProps} />
                ))}
              </div>
            )}

            {(arc.acts || []).map((act, actIdx) => {
              const actNpcCount = countNpcsInAct(arcIdx, actIdx);
              const actLevelNpcs = getNpcsAtActLevel(arcIdx, actIdx);
              return (
                <CollapsibleSection
                  key={actIdx}
                  title={`Ato ${actIdx + 1}: ${act.title || 'Sem título'}`}
                  count={actNpcCount}
                  defaultOpen={actNpcCount > 0}
                  colorClass="text-blue-300"
                  borderClass="border-blue-500/20"
                >
                  {actLevelNpcs.length > 0 && (
                    <div className="grid md:grid-cols-2 gap-3 mb-3">
                      {actLevelNpcs.map(npc => (
                        <NpcWithAssociate key={npc.id} npc={npc} showAssociate={false} {...cardProps} />
                      ))}
                    </div>
                  )}

                  {(act.scenes || []).map((scene, sceneIdx) => {
                    const sceneNpcCount = countNpcsInScene(arcIdx, actIdx, sceneIdx);
                    const sceneNpcs = getNpcsAtSceneLevel(arcIdx, actIdx, sceneIdx);
                    const encounters = scene.encounters || [];
                    return (
                      <CollapsibleSection
                        key={sceneIdx}
                        title={`Cena: ${scene.scene_name || `Cena ${sceneIdx + 1}`}`}
                        count={sceneNpcCount}
                        defaultOpen={sceneNpcCount > 0}
                        colorClass="text-green-300"
                        borderClass="border-green-500/20"
                      >
                        {sceneNpcs.length > 0 ? (
                          <div className="grid md:grid-cols-2 gap-3">
                            {sceneNpcs.map(npc => (
                              <NpcWithAssociate key={npc.id} npc={npc} showAssociate={false} {...cardProps} />
                            ))}
                          </div>
                        ) : (
                          <p className="text-slate-500 text-xs italic py-1">Nenhum NPC associado a esta cena</p>
                        )}

                        {encounters.map((enc, encIdx) => {
                          const encNpcs = filteredNpcs.filter(npc => {
                            const assocs = npc.arc_associations || [];
                            return assocs.some(a =>
                              a.arc_index === arcIdx &&
                              a.act_index === actIdx &&
                              a.scene_index === sceneIdx &&
                              a.encounter_index === encIdx
                            );
                          });
                          if (encNpcs.length === 0) return null;
                          return (
                            <CollapsibleSection
                              key={encIdx}
                              title={`Encontro: ${enc.name || `Encontro ${encIdx + 1}`}`}
                              count={encNpcs.length}
                              defaultOpen={true}
                              colorClass="text-amber-300"
                              borderClass="border-amber-500/20"
                            >
                              <div className="grid md:grid-cols-2 gap-3">
                                {encNpcs.map(npc => (
                                  <NpcWithAssociate key={npc.id} npc={npc} showAssociate={false} {...cardProps} />
                                ))}
                              </div>
                            </CollapsibleSection>
                          );
                        })}
                      </CollapsibleSection>
                    );
                  })}
                </CollapsibleSection>
              );
            })}
          </CollapsibleSection>
        );
      })}

      {unassignedNpcs.length > 0 && (
        <CollapsibleSection
          title="Sem Associação"
          count={unassignedNpcs.length}
          defaultOpen={true}
          colorClass="text-slate-400"
          borderClass="border-slate-600/40"
        >
          <p className="text-slate-500 text-xs mb-3">
            {isOwner ? 'Clique no ícone 🔗 para associar um NPC a um arco.' : 'NPCs sem arco associado.'}
          </p>
          <div className="grid md:grid-cols-2 gap-3">
            {unassignedNpcs.map(npc => (
              <NpcWithAssociate
                key={npc.id}
                npc={npc}
                showAssociate={arcs.length > 0}
                {...cardProps}
              />
            ))}
          </div>
        </CollapsibleSection>
      )}

      {filteredNpcs.length > 0 && unassignedNpcs.length === 0 && arcs.length === 0 && (
        <div className="grid md:grid-cols-2 gap-6">
          {filteredNpcs.map(npc => (
            <NpcWithAssociate key={npc.id} npc={npc} showAssociate={false} {...cardProps} />
          ))}
        </div>
      )}
    </div>
  );
}
