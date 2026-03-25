import React, { useState } from 'react';
import ModelCatalogModal from '@/components/ModelCatalogModal';
import { AVAILABLE_MODELS } from '@/lib/model-config';

export default function TestModal() {
  const [open, setOpen] = useState(true);
  const [selected, setSelected] = useState('');
  return (
    <div className="bg-slate-950 min-h-screen p-8">
      <button
        onClick={() => setOpen(true)}
        className="px-4 py-2 bg-purple-600 text-white rounded"
      >
        Abrir Catálogo de Modelos
      </button>
      <p className="text-slate-400 mt-2">Modelo selecionado: {selected || 'nenhum'}</p>
      <ModelCatalogModal
        open={open}
        onOpenChange={setOpen}
        onSelect={(m) => setSelected(m.id)}
        models={AVAILABLE_MODELS}
        selectedModelId={selected}
        agentLabel="Triagem"
        agentCategory="extraction"
      />
    </div>
  );
}
