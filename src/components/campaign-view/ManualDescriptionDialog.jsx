import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Pencil, Plus, Trash2, Loader2,
  Sparkles, Map, Swords, Shield, Star, Clock
} from 'lucide-react';

const EMPTY_DESCRIPTION = {
  premissa: {
    pitch: '',
    e_se: '',
    promessa_experiencia: '',
    funcao_personagens: '',
    proposta_jogo: '',
    escala: ''
  },
  contexto_mundo: {
    geografia_atmosfera: '',
    paleta_sensorial: '',
    sociedade_cultura: '',
    historia_recente: '',
    letalidade_moralidade: ''
  },
  conflito_central: {
    origem_problema: '',
    faccoes_envolvidas: '',
    stakes: '',
    tensao_politica: '',
    inimigos: ''
  },
  forcas_poder: [],
  aspectos_campanha: [],
  relogio_apocalipse: []
};

function SectionTab({ icon: Icon, label, iconClass }) {
  return (
    <span className="flex items-center gap-1.5">
      <Icon className={`w-3.5 h-3.5 ${iconClass}`} />
      <span className="hidden sm:inline">{label}</span>
    </span>
  );
}

export default function ManualDescriptionDialog({ currentData, onSave, open: controlledOpen, onOpenChange: controlledOnOpenChange }) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? controlledOnOpenChange : setInternalOpen;

  const [saving, setSaving] = useState(false);
  const [data, setData] = useState(() => mergeWithEmpty(currentData));

  useEffect(() => {
    if (open) setData(mergeWithEmpty(currentData));
  }, [open, currentData]);

  function mergeWithEmpty(src) {
    if (!src) return JSON.parse(JSON.stringify(EMPTY_DESCRIPTION));
    return {
      premissa: { ...EMPTY_DESCRIPTION.premissa, ...(src.premissa || {}) },
      contexto_mundo: { ...EMPTY_DESCRIPTION.contexto_mundo, ...(src.contexto_mundo || {}) },
      conflito_central: { ...EMPTY_DESCRIPTION.conflito_central, ...(src.conflito_central || {}) },
      forcas_poder: Array.isArray(src.forcas_poder) ? src.forcas_poder.map(f => ({ nome: '', desejo: '', recurso: '', carencia: '', ...f })) : [],
      aspectos_campanha: Array.isArray(src.aspectos_campanha) ? [...src.aspectos_campanha] : [],
      relogio_apocalipse: Array.isArray(src.relogio_apocalipse) ? src.relogio_apocalipse.map(r => ({ estagio: '', tempo_estimado: '', descricao: '', ...r })) : []
    };
  }

  const setPremissa = (field, value) =>
    setData(d => ({ ...d, premissa: { ...d.premissa, [field]: value } }));

  const setContexto = (field, value) =>
    setData(d => ({ ...d, contexto_mundo: { ...d.contexto_mundo, [field]: value } }));

  const setConflito = (field, value) =>
    setData(d => ({ ...d, conflito_central: { ...d.conflito_central, [field]: value } }));

  // Forças de Poder
  const addForca = () =>
    setData(d => ({ ...d, forcas_poder: [...d.forcas_poder, { nome: '', desejo: '', recurso: '', carencia: '' }] }));

  const updateForca = (idx, field, value) =>
    setData(d => {
      const arr = [...d.forcas_poder];
      arr[idx] = { ...arr[idx], [field]: value };
      return { ...d, forcas_poder: arr };
    });

  const removeForca = (idx) =>
    setData(d => ({ ...d, forcas_poder: d.forcas_poder.filter((_, i) => i !== idx) }));

  // Aspectos
  const addAspecto = () =>
    setData(d => ({ ...d, aspectos_campanha: [...d.aspectos_campanha, ''] }));

  const updateAspecto = (idx, value) =>
    setData(d => {
      const arr = [...d.aspectos_campanha];
      arr[idx] = value;
      return { ...d, aspectos_campanha: arr };
    });

  const removeAspecto = (idx) =>
    setData(d => ({ ...d, aspectos_campanha: d.aspectos_campanha.filter((_, i) => i !== idx) }));

  // Relógio
  const addRelogio = () =>
    setData(d => ({ ...d, relogio_apocalipse: [...d.relogio_apocalipse, { estagio: '', tempo_estimado: '', descricao: '' }] }));

  const updateRelogio = (idx, field, value) =>
    setData(d => {
      const arr = [...d.relogio_apocalipse];
      arr[idx] = { ...arr[idx], [field]: value };
      return { ...d, relogio_apocalipse: arr };
    });

  const removeRelogio = (idx) =>
    setData(d => ({ ...d, relogio_apocalipse: d.relogio_apocalipse.filter((_, i) => i !== idx) }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(data);
      setOpen(false);
    } catch (err) {
      alert('Erro ao salvar: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const fieldClass = 'bg-slate-950/50 border-slate-700 text-white mt-1';
  const labelClass = 'text-slate-300 text-sm';

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!isControlled && (
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="border-purple-500/30 text-purple-300 hover:bg-purple-900/20">
            <Pencil className="w-4 h-4 mr-2" />
            Criar/Editar Descrição
          </Button>
        </DialogTrigger>
      )}

      <DialogContent className="bg-slate-900 border-purple-900/20 max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Pencil className="w-5 h-5 text-purple-400" />
            Descrição da Campanha — Criação Manual
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="premissa" className="mt-4 space-y-4">
          <TabsList className="bg-slate-950/50 border border-slate-700 p-1 flex flex-wrap gap-1 h-auto">
            <TabsTrigger value="premissa" className="data-[state=active]:bg-purple-600/20 data-[state=active]:text-purple-300 text-slate-400">
              <SectionTab icon={Sparkles} label="Premissa" iconClass="text-purple-400" />
            </TabsTrigger>
            <TabsTrigger value="contexto" className="data-[state=active]:bg-blue-600/20 data-[state=active]:text-blue-300 text-slate-400">
              <SectionTab icon={Map} label="Mundo" iconClass="text-blue-400" />
            </TabsTrigger>
            <TabsTrigger value="conflito" className="data-[state=active]:bg-red-600/20 data-[state=active]:text-red-300 text-slate-400">
              <SectionTab icon={Swords} label="Conflito" iconClass="text-red-400" />
            </TabsTrigger>
            <TabsTrigger value="forcas" className="data-[state=active]:bg-amber-600/20 data-[state=active]:text-amber-300 text-slate-400">
              <SectionTab icon={Shield} label="Forças" iconClass="text-amber-400" />
            </TabsTrigger>
            <TabsTrigger value="aspectos" className="data-[state=active]:bg-green-600/20 data-[state=active]:text-green-300 text-slate-400">
              <SectionTab icon={Star} label="Aspectos" iconClass="text-green-400" />
            </TabsTrigger>
            <TabsTrigger value="relogio" className="data-[state=active]:bg-rose-600/20 data-[state=active]:text-rose-300 text-slate-400">
              <SectionTab icon={Clock} label="Relógio" iconClass="text-rose-400" />
            </TabsTrigger>
          </TabsList>

          {/* 1. PREMISSA */}
          <TabsContent value="premissa" className="space-y-4">
            <p className="text-slate-400 text-xs">A premissa define o núcleo da campanha: o que ela é e o que promete aos jogadores.</p>
            <div>
              <Label className={labelClass}>Pitch <span className="text-slate-500">(resumo de uma frase)</span></Label>
              <Textarea value={data.premissa.pitch} onChange={e => setPremissa('pitch', e.target.value)}
                placeholder="Uma frase que vende a campanha..." className={fieldClass} rows={2} />
            </div>
            <div>
              <Label className={labelClass}>O "E Se?" <span className="text-slate-500">(pergunta central da campanha)</span></Label>
              <Textarea value={data.premissa.e_se} onChange={e => setPremissa('e_se', e.target.value)}
                placeholder="E se o reino estivesse sendo consumido por uma corrupção oculta..." className={fieldClass} rows={2} />
            </div>
            <div>
              <Label className={labelClass}>Promessa de Experiência</Label>
              <Textarea value={data.premissa.promessa_experiencia} onChange={e => setPremissa('promessa_experiencia', e.target.value)}
                placeholder="O que os jogadores vão sentir e vivenciar..." className={fieldClass} rows={2} />
            </div>
            <div>
              <Label className={labelClass}>Função dos Personagens</Label>
              <Textarea value={data.premissa.funcao_personagens} onChange={e => setPremissa('funcao_personagens', e.target.value)}
                placeholder="Quem são os personagens dos jogadores nesta história..." className={fieldClass} rows={2} />
            </div>
            <div>
              <Label className={labelClass}>Proposta de Jogo</Label>
              <Textarea value={data.premissa.proposta_jogo} onChange={e => setPremissa('proposta_jogo', e.target.value)}
                placeholder="Qual o estilo e foco do jogo (investigação, ação, drama...)..." className={fieldClass} rows={2} />
            </div>
            <div>
              <Label className={labelClass}>Escala</Label>
              <Input value={data.premissa.escala} onChange={e => setPremissa('escala', e.target.value)}
                placeholder="Local, regional, continental, cósmica..." className={fieldClass} />
            </div>
          </TabsContent>

          {/* 2. CONTEXTO DO MUNDO */}
          <TabsContent value="contexto" className="space-y-4">
            <p className="text-slate-400 text-xs">Descreva o cenário, a atmosfera e a sociedade em que a campanha acontece.</p>
            <div>
              <Label className={labelClass}>Geografia e Atmosfera</Label>
              <Textarea value={data.contexto_mundo.geografia_atmosfera} onChange={e => setContexto('geografia_atmosfera', e.target.value)}
                placeholder="Como é o mundo, seus lugares e a sensação geral do ambiente..." className={fieldClass} rows={2} />
            </div>
            <div>
              <Label className={labelClass}>Paleta Sensorial</Label>
              <Textarea value={data.contexto_mundo.paleta_sensorial} onChange={e => setContexto('paleta_sensorial', e.target.value)}
                placeholder="Sons, cheiros, texturas que definem o ambiente..." className={fieldClass} rows={2} />
            </div>
            <div>
              <Label className={labelClass}>Sociedade e Cultura</Label>
              <Textarea value={data.contexto_mundo.sociedade_cultura} onChange={e => setContexto('sociedade_cultura', e.target.value)}
                placeholder="Como as pessoas vivem, suas crenças e valores..." className={fieldClass} rows={2} />
            </div>
            <div>
              <Label className={labelClass}>História Recente</Label>
              <Textarea value={data.contexto_mundo.historia_recente} onChange={e => setContexto('historia_recente', e.target.value)}
                placeholder="Eventos recentes que moldaram o mundo atual..." className={fieldClass} rows={2} />
            </div>
            <div>
              <Label className={labelClass}>Letalidade e Moralidade</Label>
              <Textarea value={data.contexto_mundo.letalidade_moralidade} onChange={e => setContexto('letalidade_moralidade', e.target.value)}
                placeholder="Quão perigoso é o mundo? Que dilemas morais surgem?..." className={fieldClass} rows={2} />
            </div>
          </TabsContent>

          {/* 3. CONFLITO CENTRAL */}
          <TabsContent value="conflito" className="space-y-4">
            <p className="text-slate-400 text-xs">O conflito central é o motor da campanha — o que move a história.</p>
            <div>
              <Label className={labelClass}>Origem do Problema</Label>
              <Textarea value={data.conflito_central.origem_problema} onChange={e => setConflito('origem_problema', e.target.value)}
                placeholder="Como e por que o conflito começou..." className={fieldClass} rows={2} />
            </div>
            <div>
              <Label className={labelClass}>Facções Envolvidas</Label>
              <Textarea value={data.conflito_central.faccoes_envolvidas} onChange={e => setConflito('faccoes_envolvidas', e.target.value)}
                placeholder="Quais grupos estão em conflito e quais são seus interesses..." className={fieldClass} rows={2} />
            </div>
            <div>
              <Label className={labelClass}>O Que Está em Jogo</Label>
              <Textarea value={data.conflito_central.stakes} onChange={e => setConflito('stakes', e.target.value)}
                placeholder="O que acontece se os heróis falharem?..." className={fieldClass} rows={2} />
            </div>
            <div>
              <Label className={labelClass}>Tensão Política/Social</Label>
              <Textarea value={data.conflito_central.tensao_politica} onChange={e => setConflito('tensao_politica', e.target.value)}
                placeholder="Conflitos de poder, sociais ou políticos que permeiam a campanha..." className={fieldClass} rows={2} />
            </div>
            <div>
              <Label className={labelClass}>Inimigo Oculto vs. Visível</Label>
              <Textarea value={data.conflito_central.inimigos} onChange={e => setConflito('inimigos', e.target.value)}
                placeholder="Quem são os antagonistas abertos e os ocultos..." className={fieldClass} rows={2} />
            </div>
          </TabsContent>

          {/* 4. FORÇAS DE PODER */}
          <TabsContent value="forcas" className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-slate-400 text-xs">Facções, organizações ou figuras que têm influência no mundo.</p>
              <Button onClick={addForca} size="sm" variant="outline" className="border-amber-500/30 text-amber-300 hover:bg-amber-900/20">
                <Plus className="w-3 h-3 mr-1" /> Adicionar Força
              </Button>
            </div>
            {data.forcas_poder.length === 0 && (
              <p className="text-slate-500 text-sm text-center py-6">Nenhuma força de poder adicionada ainda.</p>
            )}
            {data.forcas_poder.map((f, idx) => (
              <div key={idx} className="p-4 bg-amber-900/10 border border-amber-900/20 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-amber-300 font-semibold text-sm">Força {idx + 1}</span>
                  <Button onClick={() => removeForca(idx)} size="sm" variant="ghost" className="text-red-400 hover:bg-red-900/20 h-6 w-6 p-0">
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
                <div>
                  <Label className={labelClass}>Nome</Label>
                  <Input value={f.nome} onChange={e => updateForca(idx, 'nome', e.target.value)}
                    placeholder="Nome da facção ou figura..." className={fieldClass} />
                </div>
                <div className="grid md:grid-cols-3 gap-3">
                  <div>
                    <Label className={labelClass}>Desejo</Label>
                    <Input value={f.desejo} onChange={e => updateForca(idx, 'desejo', e.target.value)}
                      placeholder="O que busca..." className={fieldClass} />
                  </div>
                  <div>
                    <Label className={labelClass}>Recurso</Label>
                    <Input value={f.recurso} onChange={e => updateForca(idx, 'recurso', e.target.value)}
                      placeholder="O que possui..." className={fieldClass} />
                  </div>
                  <div>
                    <Label className={labelClass}>Carência</Label>
                    <Input value={f.carencia} onChange={e => updateForca(idx, 'carencia', e.target.value)}
                      placeholder="O que precisa..." className={fieldClass} />
                  </div>
                </div>
              </div>
            ))}
          </TabsContent>

          {/* 5. ASPECTOS DA CAMPANHA */}
          <TabsContent value="aspectos" className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-slate-400 text-xs">Aspectos são verdades ou temas centrais que definem a campanha.</p>
              <Button onClick={addAspecto} size="sm" variant="outline" className="border-green-500/30 text-green-300 hover:bg-green-900/20">
                <Plus className="w-3 h-3 mr-1" /> Adicionar Aspecto
              </Button>
            </div>
            {data.aspectos_campanha.length === 0 && (
              <p className="text-slate-500 text-sm text-center py-6">Nenhum aspecto adicionado ainda.</p>
            )}
            {data.aspectos_campanha.map((aspecto, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span className="text-green-400 font-bold w-6 text-sm">{idx + 1}.</span>
                <Input value={aspecto} onChange={e => updateAspecto(idx, e.target.value)}
                  placeholder="Ex: A traição está em todo lugar..." className={`${fieldClass} flex-1`} />
                <Button onClick={() => removeAspecto(idx)} size="sm" variant="ghost" className="text-red-400 hover:bg-red-900/20 h-8 w-8 p-0">
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </TabsContent>

          {/* 6. RELÓGIO DO APOCALIPSE */}
          <TabsContent value="relogio" className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-slate-400 text-xs">O relógio do apocalipse mostra o que acontece se os heróis não agirem.</p>
              <Button onClick={addRelogio} size="sm" variant="outline" className="border-rose-500/30 text-rose-300 hover:bg-rose-900/20">
                <Plus className="w-3 h-3 mr-1" /> Adicionar Estágio
              </Button>
            </div>
            {data.relogio_apocalipse.length === 0 && (
              <p className="text-slate-500 text-sm text-center py-6">Nenhum estágio adicionado ainda.</p>
            )}
            {data.relogio_apocalipse.map((r, idx) => (
              <div key={idx} className="flex items-start gap-3 p-4 bg-rose-900/10 border border-rose-900/20 rounded-lg">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-rose-900/30 border border-rose-500/40 flex items-center justify-center text-rose-400 font-bold text-sm">
                  {idx + 1}
                </div>
                <div className="flex-1 space-y-2">
                  <div className="grid md:grid-cols-3 gap-2">
                    <div className="md:col-span-2">
                      <Label className={labelClass}>Estágio</Label>
                      <Input value={r.estagio} onChange={e => updateRelogio(idx, 'estagio', e.target.value)}
                        placeholder="Nome do estágio..." className={fieldClass} />
                    </div>
                    <div>
                      <Label className={labelClass}>Tempo Estimado</Label>
                      <Input value={r.tempo_estimado} onChange={e => updateRelogio(idx, 'tempo_estimado', e.target.value)}
                        placeholder="Ex: Sessão 3-4..." className={fieldClass} />
                    </div>
                  </div>
                  <div>
                    <Label className={labelClass}>Descrição</Label>
                    <Textarea value={r.descricao} onChange={e => updateRelogio(idx, 'descricao', e.target.value)}
                      placeholder="O que acontece neste estágio..." className={fieldClass} rows={2} />
                  </div>
                </div>
                <Button onClick={() => removeRelogio(idx)} size="sm" variant="ghost" className="text-red-400 hover:bg-red-900/20 h-8 w-8 p-0 flex-shrink-0">
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-700 mt-4">
          <Button variant="outline" onClick={() => setOpen(false)} className="border-slate-700 text-slate-300">
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving} className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600">
            {saving ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Salvando...</>
            ) : (
              <><Pencil className="w-4 h-4 mr-2" />Salvar Descrição</>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
