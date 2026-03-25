/**
 * OmniForge RPG — OpenRouter Browser Modal
 *
 * Modal para navegar TODOS os modelos disponíveis no OpenRouter e
 * adicionar modelos ao catálogo pessoal do usuário.
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Search,
  X,
  Plus,
  Check,
  Cpu,
  Layers,
  ArrowUpDown,
  Globe,
  ExternalLink,
  AlertTriangle,
} from 'lucide-react';

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

const TIER_CONFIG = {
  fast: { label: 'Rápido', icon: '⚡', color: 'text-green-400 bg-green-400/10 border-green-400/20' },
  balanced: { label: 'Equilibrado', icon: '⚖️', color: 'text-blue-400 bg-blue-400/10 border-blue-400/20' },
  premium: { label: 'Premium', icon: '💎', color: 'text-amber-400 bg-amber-400/10 border-amber-400/20' },
};

const SORT_OPTIONS = [
  { value: 'name-asc', label: 'Nome A-Z' },
  { value: 'context-desc', label: 'Contexto ↓' },
  { value: 'price-asc', label: 'Preço ↑' },
  { value: 'price-desc', label: 'Preço ↓' },
];

// ---------------------------------------------------------------------------
// Browser Row
// ---------------------------------------------------------------------------

function BrowserRow({ model, isAdded, onAdd }) {
  return (
    <div className="w-full text-left px-4 py-3 border-b border-slate-800/50 transition-all hover:bg-slate-800/40 flex items-center gap-3">
      {/* Left: Name + metadata */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-white text-sm truncate">
            {model.label}
          </span>
          {model.isFree && (
            <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-[10px] px-1.5 py-0">
              Grátis
            </Badge>
          )}
          {isAdded && (
            <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 text-[10px] px-1.5 py-0">
              No catálogo
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <Badge
            variant="outline"
            className="text-[10px] px-1.5 py-0 border-slate-600 text-slate-400"
          >
            {model.provider}
          </Badge>
          <Badge
            variant="outline"
            className={`text-[10px] px-1.5 py-0 border ${TIER_CONFIG[model.tier]?.color || 'text-slate-400 border-slate-600'}`}
          >
            {TIER_CONFIG[model.tier]?.icon} {TIER_CONFIG[model.tier]?.label || model.tier}
          </Badge>
          <span className="text-[10px] text-slate-600 truncate hidden sm:inline font-mono">
            {model.id}
          </span>
        </div>
      </div>

      {/* Center: Context + Price */}
      <div className="hidden sm:flex items-center gap-4 text-xs text-slate-400 shrink-0">
        <div className="flex items-center gap-1" title="Janela de contexto">
          <Cpu className="w-3.5 h-3.5 text-slate-500" />
          <span>{formatContextWindow(model.contextWindow)}</span>
        </div>
        <div className="min-w-[70px] text-right">
          {model.isFree ? (
            <span className="text-green-400 font-medium">Grátis</span>
          ) : (
            <span className="text-slate-300">{formatCost(model.inputCost)}</span>
          )}
        </div>
      </div>

      {/* Right: Add button */}
      <Button
        type="button"
        size="sm"
        variant={isAdded ? 'outline' : 'default'}
        disabled={isAdded}
        onClick={() => onAdd(model)}
        className={
          isAdded
            ? 'border-slate-600 text-slate-500 cursor-default h-8 w-8 p-0'
            : 'bg-purple-600 hover:bg-purple-500 text-white h-8 w-8 p-0'
        }
      >
        {isAdded ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
      </Button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

/**
 * @param {Object} props
 * @param {boolean} props.open
 * @param {function} props.onOpenChange
 * @param {Array} props.allModels — todos os modelos do OpenRouter (catálogo completo)
 * @param {Array} props.userModelIds — IDs dos modelos já no catálogo do usuário
 * @param {function} props.onAddModel — callback (model) => void ao adicionar modelo
 * @param {boolean} props.isLoading
 */
export default function OpenRouterBrowserModal({
  open,
  onOpenChange,
  allModels = [],
  userModelIds = [],
  onAddModel,
  isLoading = false,
}) {
  const [search, setSearch] = useState('');
  const [pricingFilter, setPricingFilter] = useState('all');
  const [tierFilter, setTierFilter] = useState('all');
  const [providerFilter, setProviderFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name-asc');

  // "Adicionar por ID" state
  const [manualId, setManualId] = useState('');
  const [manualError, setManualError] = useState('');
  const [manualAdded, setManualAdded] = useState(false);

  const searchRef = useRef(null);

  // Reset filters when modal opens
  useEffect(() => {
    if (open) {
      setSearch('');
      setPricingFilter('all');
      setTierFilter('all');
      setProviderFilter('all');
      setSortBy('name-asc');
      setManualId('');
      setManualError('');
      setManualAdded(false);
    }
  }, [open]);

  const userIdSet = useMemo(() => new Set(userModelIds), [userModelIds]);

  const providers = useMemo(() => {
    const set = new Set(allModels.map((m) => m.provider));
    return Array.from(set).sort();
  }, [allModels]);

  const filteredModels = useMemo(() => {
    let list = [...allModels];

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

    if (pricingFilter === 'free') list = list.filter((m) => m.isFree);
    if (pricingFilter === 'paid') list = list.filter((m) => !m.isFree);
    if (tierFilter !== 'all') list = list.filter((m) => m.tier === tierFilter);
    if (providerFilter !== 'all') list = list.filter((m) => m.provider === providerFilter);

    list.sort((a, b) => {
      switch (sortBy) {
        case 'context-desc':
          return (b.contextWindow ?? 0) - (a.contextWindow ?? 0);
        case 'price-asc':
          return (a.inputCost ?? 0) - (b.inputCost ?? 0);
        case 'price-desc':
          return (b.inputCost ?? 0) - (a.inputCost ?? 0);
        case 'name-asc':
        default:
          return a.label.localeCompare(b.label);
      }
    });

    return list;
  }, [allModels, search, pricingFilter, tierFilter, providerFilter, sortBy]);

  const handleAdd = useCallback(
    (model) => {
      onAddModel?.(model);
    },
    [onAddModel]
  );

  const handleAddByManualId = useCallback(() => {
    const id = manualId.trim();
    if (!id) {
      setManualError('Digite o ID do modelo.');
      return;
    }
    if (!/^[a-zA-Z0-9_\-.]+\/[a-zA-Z0-9_\-.:]+$/.test(id)) {
      setManualError('Formato inválido. Use: provedor/nome-do-modelo');
      return;
    }
    if (userIdSet.has(id)) {
      setManualError('Este modelo já está no seu catálogo.');
      return;
    }
    // Look up in allModels first; if not found, create a minimal stub
    const existing = allModels.find((m) => m.id === id);
    const [providerPart, modelPart] = id.split('/');
    const modelToAdd = existing ?? {
      id,
      label: modelPart ?? id,
      provider: providerPart ?? 'Custom',
      tier: 'balanced',
      description: '',
      contextWindow: 0,
      inputCost: 0,
      outputCost: 0,
      isFree: id.endsWith(':free'),
      agentFit: { extraction: 5, synthesis: 5, reasoning: 5, writing: 5 },
    };
    onAddModel?.(modelToAdd);
    setManualId('');
    setManualError('');
    setManualAdded(true);
    setTimeout(() => setManualAdded(false), 2000);
  }, [manualId, userIdSet, allModels, onAddModel]);

  const resetFilters = useCallback(() => {
    setSearch('');
    setPricingFilter('all');
    setTierFilter('all');
    setProviderFilter('all');
    setSortBy('name-asc');
  }, []);

  const hasActiveFilters =
    search || pricingFilter !== 'all' || tierFilter !== 'all' || providerFilter !== 'all';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="bg-slate-900 border-purple-900/20 max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0 gap-0"
        onOpenAutoFocus={(e) => {
          e.preventDefault();
          searchRef.current?.focus();
        }}
      >
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-slate-800">
          <DialogTitle className="text-xl text-white font-bold flex items-center gap-2">
            <Globe className="w-5 h-5 text-purple-400" />
            Adicionar Modelos ao Catálogo
          </DialogTitle>
          <DialogDescription className="text-slate-400 text-sm flex items-center gap-3 flex-wrap">
            {isLoading
              ? <span className="text-purple-400">Carregando modelos do OpenRouter...</span>
              : <span>{filteredModels.length} de {allModels.length} modelos do OpenRouter</span>
            }
            <a
              href="https://openrouter.ai/models"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-purple-400 hover:text-purple-300 text-xs ml-auto"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Ver no OpenRouter
            </a>
          </DialogDescription>
        </DialogHeader>

        {/* Add by ID */}
        <div className="px-6 py-3 border-b border-slate-800 bg-amber-900/10">
          <p className="text-[11px] text-amber-400 flex items-center gap-1 mb-2">
            <AlertTriangle className="w-3.5 h-3.5" />
            Adicionar por ID (para modelos não listados abaixo):
          </p>
          <div className="flex gap-2">
            <Input
              value={manualId}
              onChange={(e) => { setManualId(e.target.value); setManualError(''); }}
              onKeyDown={(e) => { if (e.key === 'Enter') handleAddByManualId(); e.stopPropagation(); }}
              placeholder="ex: openai/gpt-4o ou deepseek/deepseek-v3"
              className="bg-slate-950/50 border-slate-700 text-white text-sm placeholder:text-slate-600 font-mono"
            />
            <Button
              type="button"
              size="sm"
              onClick={handleAddByManualId}
              className={manualAdded
                ? 'bg-green-600 hover:bg-green-500 text-white shrink-0'
                : 'bg-purple-600 hover:bg-purple-500 text-white shrink-0'
              }
            >
              {manualAdded ? <Check className="w-4 h-4 mr-1.5" /> : <Plus className="w-4 h-4 mr-1.5" />}
              {manualAdded ? 'Adicionado!' : 'Adicionar'}
            </Button>
          </div>
          {manualError && (
            <p className="text-[11px] text-red-400 mt-1">{manualError}</p>
          )}
        </div>

        {/* Filters */}
        <div className="px-6 py-3 border-b border-slate-800 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <Input
              ref={searchRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.stopPropagation()}
              placeholder="Buscar por nome, provedor ou ID..."
              className="pl-9 pr-8 bg-slate-950/50 border-slate-700 text-white text-sm placeholder:text-slate-500"
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

          <div className="flex flex-wrap items-center gap-2">
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

            <Select value={providerFilter} onValueChange={setProviderFilter}>
              <SelectTrigger className="w-[170px] h-8 text-xs bg-slate-950/50 border-slate-700 text-slate-300">
                <Cpu className="w-3 h-3 mr-1 text-slate-500" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os provedores</SelectItem>
                {providers.map((p) => (
                  <SelectItem key={p} value={p}>{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[150px] h-8 text-xs bg-slate-950/50 border-slate-700 text-slate-300">
                <ArrowUpDown className="w-3 h-3 mr-1 text-slate-500" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

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

        {/* Column headers */}
        <div className="px-4 py-2 border-b border-slate-800 flex items-center gap-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
          <div className="flex-1">Modelo</div>
          <div className="hidden sm:flex items-center gap-4 shrink-0">
            <span className="w-[60px] text-center">Contexto</span>
            <span className="w-[70px] text-right">Preço</span>
          </div>
          <span className="w-8 text-center">+</span>
        </div>

        {/* Model list */}
        <ScrollArea className="flex-1 min-h-0">
          <div className="divide-y divide-slate-800/50">
            {filteredModels.length === 0 ? (
              <div className="px-6 py-12 text-center text-slate-500">
                <Globe className="w-10 h-10 mx-auto mb-3 text-slate-600" />
                <p className="text-sm">
                  {isLoading
                    ? 'Carregando modelos do OpenRouter...'
                    : 'Nenhum modelo encontrado com os filtros atuais.'}
                </p>
                {!isLoading && (
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="mt-2 text-xs text-purple-400 hover:text-purple-300"
                  >
                    Limpar filtros
                  </button>
                )}
              </div>
            ) : (
              filteredModels.map((m) => (
                <BrowserRow
                  key={m.id}
                  model={m}
                  isAdded={userIdSet.has(m.id)}
                  onAdd={handleAdd}
                />
              ))
            )}
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 flex items-center justify-between">
          <p className="text-[10px] text-slate-600 max-w-[70%]">
            Após adicionar, salve o catálogo. Os modelos adicionados ficam disponíveis em todos os seletores de agentes.
            Preços em USD/1M tokens (OpenRouter).
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange?.(false)}
            className="border-slate-600 text-slate-300 hover:text-white hover:bg-slate-800"
          >
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
