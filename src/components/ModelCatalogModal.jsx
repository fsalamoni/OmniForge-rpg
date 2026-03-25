/**
 * OmniForge RPG — Model Catalog Modal
 *
 * Modal rico para seleção de modelos de IA com busca, filtros
 * (gratuitos/pagos, tier, provedor), scores de adequação por
 * categoria de agente, tamanho de contexto, preços e descrições.
 *
 * Layout em tabela com colunas de largura fixa para exibir todas
 * as informações de forma clara: modelo, adequação, contexto,
 * custo de entrada e custo de saída.
 *
 * Segue o padrão de design OmniForge (slate-900 + purple accents).
 */

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Search,
  X,
  Cpu,
  Layers,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Constantes
// ---------------------------------------------------------------------------

const CATEGORY_LABELS = {
  extraction: { short: 'Ex', full: 'Extração', color: 'bg-purple-600' },
  synthesis: { short: 'Sí', full: 'Síntese', color: 'bg-blue-600' },
  reasoning: { short: 'Ra', full: 'Raciocínio', color: 'bg-amber-600' },
  writing: { short: 'Re', full: 'Redação', color: 'bg-emerald-600' },
};

const TIER_CONFIG = {
  fast: { label: 'Rápido', icon: '⚡', color: 'text-green-400 bg-green-400/10 border-green-400/20' },
  balanced: { label: 'Equilibrado', icon: '⚖️', color: 'text-blue-400 bg-blue-400/10 border-blue-400/20' },
  premium: { label: 'Premium', icon: '💎', color: 'text-amber-400 bg-amber-400/10 border-amber-400/20' },
};

const CATEGORIES = Object.keys(CATEGORY_LABELS);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatContextWindow(tokens) {
  if (!tokens) return '—';
  if (tokens >= 1_000_000) return `${(tokens / 1_000_000).toFixed(1)}M`;
  if (tokens >= 1_000) return `${Math.round(tokens / 1_000)}K`;
  return String(tokens);
}

function formatCost(cost) {
  if (cost === 0) return 'Grátis';
  if (cost < 0.01) return `$${cost.toFixed(4)}`;
  if (cost < 1) return `$${cost.toFixed(3)}`;
  return `$${cost.toFixed(2)}`;
}

/** Cor do score: 9-10 excelente, 7-8 bom, 5-6 adequado, ≤4 fraco. */
function scoreColor(score) {
  if (score >= 9) return 'bg-green-500 text-white';
  if (score >= 7) return 'bg-blue-500 text-white';
  if (score >= 5) return 'bg-amber-500 text-white';
  return 'bg-slate-600 text-slate-300';
}

/** Cor de borda destacada quando a categoria corresponde ao agente ativo. */
function scoreBorderColor(score) {
  if (score >= 9) return 'ring-2 ring-green-400';
  if (score >= 7) return 'ring-2 ring-blue-400';
  if (score >= 5) return 'ring-2 ring-amber-400';
  return 'ring-2 ring-slate-500';
}

// ---------------------------------------------------------------------------
// Score Badge
// ---------------------------------------------------------------------------

function ScoreBadge({ score, label, fullLabel, isHighlighted }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={`
            inline-flex items-center justify-center w-7 h-7 rounded-md text-xs font-bold
            ${scoreColor(score)}
            ${isHighlighted ? scoreBorderColor(score) : ''}
            transition-all
          `}
        >
          {score}
        </span>
      </TooltipTrigger>
      <TooltipContent side="top" className="bg-slate-800 text-white border-slate-700">
        <p className="font-semibold">{fullLabel}: {score}/10</p>
        <p className="text-xs text-slate-400 mt-0.5">
          {score >= 9 ? 'Excelente' : score >= 7 ? 'Bom' : score >= 5 ? 'Adequado' : 'Fraco'}
        </p>
      </TooltipContent>
    </Tooltip>
  );
}

// ---------------------------------------------------------------------------
// Model Row — table-like layout with fixed columns
// ---------------------------------------------------------------------------

function ModelRow({ model, isSelected, onSelect, highlightCategory }) {
  const fit = model.agentFit || { extraction: 5, synthesis: 5, reasoning: 5, writing: 5 };

  return (
    <button
      type="button"
      onClick={() => onSelect(model)}
      className={`
        w-full text-left px-5 py-3.5 border-b border-slate-800/50 transition-all
        hover:bg-slate-800/60
        ${isSelected ? 'bg-purple-900/20 border-l-2 border-l-purple-500' : ''}
        group
      `}
    >
      {/* Row grid: MODEL | SCORES | CONTEXT | INPUT | OUTPUT */}
      <div className="flex items-center gap-4">
        {/* ── Model info (name, badges, description) ── */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-white text-sm leading-tight">
              {model.label}
            </span>
          </div>
          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
            <Badge
              variant="outline"
              className="text-[10px] px-1.5 py-0 border-slate-600 text-slate-400 shrink-0"
            >
              {model.provider}
            </Badge>
            <Badge
              variant="outline"
              className={`text-[10px] px-1.5 py-0 border shrink-0 ${TIER_CONFIG[model.tier]?.color || 'text-slate-400 border-slate-600'}`}
            >
              {TIER_CONFIG[model.tier]?.icon} {TIER_CONFIG[model.tier]?.label || model.tier}
            </Badge>
            <span className="text-[11px] text-slate-500 truncate block min-w-0">
              {model.description}
            </span>
          </div>
        </div>

        {/* ── Adequação scores (4 badges) — w-[140px] ── */}
        <div className="flex items-center gap-1 shrink-0 w-[140px] justify-center">
          {CATEGORIES.map((cat) => (
            <div key={cat} className="flex flex-col items-center gap-0.5">
              <ScoreBadge
                score={fit[cat]}
                label={CATEGORY_LABELS[cat].short}
                fullLabel={CATEGORY_LABELS[cat].full}
                isHighlighted={highlightCategory === cat}
              />
              <span className="text-[9px] text-slate-500 leading-none">
                {CATEGORY_LABELS[cat].short}
              </span>
            </div>
          ))}
        </div>

        {/* ── Contexto — w-[80px] ── */}
        <div className="flex items-center gap-1 shrink-0 w-[80px] justify-center text-xs text-slate-400">
          <Cpu className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <div className="flex flex-col items-start leading-tight">
            <span className="text-slate-300 font-medium">{formatContextWindow(model.contextWindow)}</span>
            <span className="text-[9px] text-slate-600">tokens</span>
          </div>
        </div>

        {/* ── Entrada (input cost) — w-[85px] ── */}
        <div className="shrink-0 w-[85px] text-right">
          {model.isFree ? (
            <span className="text-green-400 font-medium text-xs">Grátis</span>
          ) : (
            <div className="flex flex-col items-end leading-tight">
              <span className="text-slate-300 text-xs font-medium">{formatCost(model.inputCost)}</span>
              <span className="text-[9px] text-slate-600">/1M entrada</span>
            </div>
          )}
        </div>

        {/* ── Saída (output cost) — w-[85px] ── */}
        <div className="shrink-0 w-[85px] text-right">
          {model.isFree ? (
            <span className="text-green-400 font-medium text-xs">Grátis</span>
          ) : (
            <div className="flex flex-col items-end leading-tight">
              <span className="text-slate-300 text-xs font-medium">{formatCost(model.outputCost)}</span>
              <span className="text-[9px] text-slate-600">/1M saída</span>
            </div>
          )}
        </div>
      </div>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

/**
 * @param {Object} props
 * @param {boolean} props.open — controla abertura do dialog
 * @param {function} props.onOpenChange — callback ao abrir/fechar
 * @param {function} props.onSelect — callback ao selecionar modelo: (model) => void
 * @param {Array} props.models — lista de ModelOption[]
 * @param {string} [props.selectedModelId] — ID do modelo atualmente selecionado
 * @param {string} [props.agentLabel] — nome do agente (exibido no header)
 * @param {string} [props.agentCategory] — categoria do agente para destacar a coluna correspondente
 */
export default function ModelCatalogModal({
  open,
  onOpenChange,
  onSelect,
  models = [],
  selectedModelId = '',
  agentLabel = '',
  agentCategory = '',
}) {
  // ── State ────────────────────────────────────────────────────────────────
  const [search, setSearch] = useState('');
  const [pricingFilter, setPricingFilter] = useState('all'); // 'all' | 'free' | 'paid'
  const [tierFilter, setTierFilter] = useState('all');       // 'all' | 'fast' | 'balanced' | 'premium'
  const [providerFilter, setProviderFilter] = useState('all');

  const searchRef = useRef(null);

  // Reset filters when modal opens
  useEffect(() => {
    if (open) {
      setSearch('');
      setPricingFilter('all');
      setTierFilter('all');
      setProviderFilter('all');
    }
  }, [open]);

  // ── Derived ──────────────────────────────────────────────────────────────

  /** Unique providers from the model list. */
  const providers = useMemo(() => {
    const set = new Set(models.map((m) => m.provider));
    return Array.from(set).sort();
  }, [models]);

  /** Filtered + sorted models (sorted by agent fit score descending). */
  const filteredModels = useMemo(() => {
    let list = [...models];

    // Text search
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (m) =>
          (m.label || '').toLowerCase().includes(q) ||
          (m.provider || '').toLowerCase().includes(q) ||
          (m.id || '').toLowerCase().includes(q) ||
          (m.description || '').toLowerCase().includes(q)
      );
    }

    // Pricing filter
    if (pricingFilter === 'free') list = list.filter((m) => m.isFree);
    if (pricingFilter === 'paid') list = list.filter((m) => !m.isFree);

    // Tier filter
    if (tierFilter !== 'all') list = list.filter((m) => m.tier === tierFilter);

    // Provider filter
    if (providerFilter !== 'all') list = list.filter((m) => m.provider === providerFilter);

    // Default sort: by agent fit score descending
    const fitKey = agentCategory || 'synthesis';
    list.sort((a, b) => (b.agentFit?.[fitKey] ?? 0) - (a.agentFit?.[fitKey] ?? 0));

    return list;
  }, [models, search, pricingFilter, tierFilter, providerFilter, agentCategory]);

  const handleSelect = useCallback(
    (model) => {
      onSelect?.(model);
      onOpenChange?.(false);
    },
    [onSelect, onOpenChange]
  );

  const resetFilters = useCallback(() => {
    setSearch('');
    setPricingFilter('all');
    setTierFilter('all');
    setProviderFilter('all');
  }, []);

  const hasActiveFilters =
    search || pricingFilter !== 'all' || tierFilter !== 'all' || providerFilter !== 'all';

  // Category label for header subtitle
  const categoryLabel = agentCategory
    ? CATEGORY_LABELS[agentCategory]?.full || agentCategory
    : '';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="bg-slate-900 border-purple-900/20 w-[900px] max-w-[95vw] max-h-[90vh] overflow-hidden flex flex-col p-0 gap-0"
        onOpenAutoFocus={(e) => {
          e.preventDefault();
          setTimeout(() => searchRef.current?.focus(), 50);
        }}
      >
        <TooltipProvider delayDuration={200}>
        {/* ── Header ──────────────────────────────────────────────────── */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-slate-800 shrink-0">
          <DialogTitle className="text-xl text-white font-bold">
            Selecionar Modelo
          </DialogTitle>
          <DialogDescription className="text-slate-400 text-sm">
            {agentLabel && (
              <span>
                Agente: <span className="text-purple-300 font-medium">{agentLabel}</span>
              </span>
            )}
            {agentLabel && categoryLabel && <span> · </span>}
            {categoryLabel && (
              <span>
                Categoria: <span className="text-purple-300 font-medium">{categoryLabel}</span>
              </span>
            )}
            {(agentLabel || categoryLabel) && <span> · </span>}
            <span>{filteredModels.length} modelos</span>
          </DialogDescription>
        </DialogHeader>

        {/* ── Filters bar ─────────────────────────────────────────────── */}
        <div className="px-6 py-3 border-b border-slate-800 space-y-3 shrink-0">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <Input
              ref={searchRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.stopPropagation()}
              onKeyUp={(e) => e.stopPropagation()}
              placeholder="Buscar modelo..."
              className="pl-9 pr-8 bg-slate-950/50 border-purple-700/50 focus:border-purple-500 text-white text-sm placeholder:text-slate-500"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter row */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Pricing buttons */}
            <div className="inline-flex rounded-lg border border-slate-700 overflow-hidden">
              {[
                { value: 'all', label: 'Todos' },
                { value: 'free', label: '✦ Grátis' },
                { value: 'paid', label: 'Pagos' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setPricingFilter(opt.value)}
                  className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                    pricingFilter === opt.value
                      ? 'bg-purple-600 text-white'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Tier */}
            <Select value={tierFilter} onValueChange={setTierFilter}>
              <SelectTrigger className="w-[150px] h-8 text-xs bg-slate-950/50 border-slate-700 text-slate-300">
                <Layers className="w-3 h-3 mr-1 text-slate-500" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tiers</SelectItem>
                <SelectItem value="fast">⚡ Rápido</SelectItem>
                <SelectItem value="balanced">⚖️ Equilibrado</SelectItem>
                <SelectItem value="premium">💎 Premium</SelectItem>
              </SelectContent>
            </Select>

            {/* Provider */}
            <Select value={providerFilter} onValueChange={setProviderFilter}>
              <SelectTrigger className="w-[170px] h-8 text-xs bg-slate-950/50 border-slate-700 text-slate-300">
                <Cpu className="w-3 h-3 mr-1 text-slate-500" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os provedores</SelectItem>
                {providers.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Clear filters */}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="text-xs text-purple-400 hover:text-purple-300 ml-auto"
              >
                Limpar filtros
              </button>
            )}
          </div>
        </div>

        {/* ── Column headers (table-like) ─────────────────────────────── */}
        <div className="px-5 py-2 border-b border-slate-800 flex items-center gap-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wider shrink-0">
          <div className="flex-1 min-w-0">Modelo</div>
          <div className="flex items-center gap-1 shrink-0 w-[140px] justify-center">
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="cursor-default">⊕ Adequação /10</span>
              </TooltipTrigger>
              <TooltipContent className="bg-slate-800 text-white border-slate-700">
                <p>Scores de adequação por categoria (1-10)</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <div className="shrink-0 w-[80px] text-center flex items-center justify-center gap-1">
            <Cpu className="w-3 h-3" />
            <span>Contexto</span>
          </div>
          <div className="shrink-0 w-[85px] text-right flex items-center justify-end gap-1">
            <span>⊕ Entrada</span>
          </div>
          <div className="shrink-0 w-[85px] text-right">Saída</div>
        </div>

        {/* ── Model list (scrollable) ─────────────────────────────────── */}
        <ScrollArea className="flex-1 min-h-0">
          <div className="divide-y divide-slate-800/50">
            {filteredModels.length === 0 ? (
              <div className="px-6 py-12 text-center text-slate-500">
                <Cpu className="w-10 h-10 mx-auto mb-3 text-slate-600" />
                <p className="text-sm">Nenhum modelo encontrado com os filtros atuais.</p>
                <button
                  type="button"
                  onClick={resetFilters}
                  className="mt-2 text-xs text-purple-400 hover:text-purple-300"
                >
                  Limpar filtros
                </button>
              </div>
            ) : (
              filteredModels.map((m) => (
                <ModelRow
                  key={m.id}
                  model={m}
                  isSelected={selectedModelId === m.id}
                  onSelect={handleSelect}
                  highlightCategory={agentCategory}
                />
              ))
            )}
          </div>
        </ScrollArea>

        {/* ── Footer ──────────────────────────────────────────────────── */}
        <div className="px-6 py-3 border-t border-slate-800 flex items-center justify-between shrink-0">
          <p className="text-[10px] text-slate-600 max-w-[70%]">
            <span className="font-semibold text-slate-500">Adequação /10</span> — escala global
            absoluta: ≥9 excelente · 7-8 bom · 5-6 adequado · ≤4 fraco.
            {agentCategory && (
              <>
                {' '}Coluna destacada = categoria deste agente (
                {CATEGORY_LABELS[agentCategory]?.full}).
              </>
            )}
            {' '}Preços em USD/1M tokens (OpenRouter).
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange?.(false)}
            className="border-slate-600 text-slate-300 hover:text-white hover:bg-slate-800"
          >
            Cancelar
          </Button>
        </div>
        </TooltipProvider>
      </DialogContent>
    </Dialog>
  );
}
