import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { UserProfile } from '@/firebase/db';
import { AI_PRESETS, isGeminiUrl, geminiApiBase } from '@/lib/aiClient';
import { useUserCatalog, verifyModelAvailability, removeModelsFromCatalog } from '@/lib/model-catalog';
import { AVAILABLE_MODELS, PIPELINE_AGENT_DEFS, loadAgentModels, saveAgentModels, getDefaultModelMap } from '@/lib/model-config';
import { useMutation } from '@tanstack/react-query';
import ModelCatalogModal from '@/components/ModelCatalogModal';
import OpenRouterBrowserModal from '@/components/OpenRouterBrowserModal';
import AgentModelConfig from '@/components/AgentModelConfig';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  User,
  Mail,
  Save,
  Loader2,
  Shield,
  Bot,
  Eye,
  EyeOff,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  FlaskConical,
  BookOpen,
  Download,
  ShieldCheck,
  Trash2,
} from 'lucide-react';

const DEFAULT_AI_PROVIDER = 'openrouter';

/** Maps a saved baseUrl back to the corresponding AI_PRESETS key. */
function detectProviderFromUrl(baseUrl) {
  if (!baseUrl) return DEFAULT_AI_PROVIDER;
  for (const [key, preset] of Object.entries(AI_PRESETS)) {
    if (key !== 'custom' && preset.baseUrl && baseUrl === preset.baseUrl) {
      return key;
    }
  }
  return 'custom';
}

export default function Profile() {
  const { user, userProfile, refreshProfile } = useAuth();
  const [formData, setFormData] = useState({
    full_name: userProfile?.full_name || user?.displayName || ''
  });
  const [aiProvider, setAiProvider] = useState(() =>
    detectProviderFromUrl(userProfile?.aiConfig?.baseUrl)
  );
  const [aiConfig, setAiConfig] = useState({
    baseUrl: userProfile?.aiConfig?.baseUrl || AI_PRESETS.openrouter.baseUrl,
    apiKey: userProfile?.aiConfig?.apiKey || '',
    model: userProfile?.aiConfig?.model || ''
  });
  const [showApiKey, setShowApiKey] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState('');
  const [testStatus, setTestStatus] = useState(null); // null | 'testing' | 'ok' | 'error'
  const [testError, setTestError] = useState('');
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [browserOpen, setBrowserOpen] = useState(false);

  // Model verification state
  const [verifyStatus, setVerifyStatus] = useState(null); // null | 'verifying' | 'done' | 'error'
  const [verifyResults, setVerifyResults] = useState(null);
  const [verifyError, setVerifyError] = useState('');

  // Custom model IDs from Firestore
  const [customModelIds, setCustomModelIds] = useState([]);

  // Removed (unavailable) model IDs from Firestore
  const [removedModelIds, setRemovedModelIds] = useState([]);

  // Per-agent model map
  const [agentModels, setAgentModels] = useState(() => getDefaultModelMap());

  // Use the enhanced catalog hook — returns user's models + all OpenRouter models
  const { userModels, allModels, isLoading: catalogLoading } = useUserCatalog(
    aiProvider === 'openrouter' ? aiConfig.apiKey : undefined,
    customModelIds,
    removedModelIds
  );

  // IDs of all models in the user's catalog (curated + custom)
  const userModelIds = useMemo(
    () => userModels.map((m) => m.id),
    [userModels]
  );

  // Sync local state when userProfile loads asynchronously from Firestore
  useEffect(() => {
    if (!userProfile) return;
    setFormData({ full_name: userProfile.full_name || user?.displayName || '' });
    if (userProfile.aiConfig) {
      const savedBaseUrl = userProfile.aiConfig.baseUrl || AI_PRESETS.openrouter.baseUrl;
      setAiConfig({
        baseUrl: savedBaseUrl,
        apiKey: userProfile.aiConfig.apiKey || '',
        model: userProfile.aiConfig.model || ''
      });
      setAiProvider(detectProviderFromUrl(savedBaseUrl));
    }
    // Load custom model IDs from Firestore
    if (Array.isArray(userProfile.customModelIds)) {
      setCustomModelIds(userProfile.customModelIds);
    }
    // Load removed model IDs from Firestore
    if (Array.isArray(userProfile.removedModelIds)) {
      setRemovedModelIds(userProfile.removedModelIds);
    }
    // Load per-agent model map from Firestore (fallback to localStorage)
    setAgentModels(loadAgentModels(userProfile.agentModels));
  }, [userProfile, user]);

  const updateProfileMutation = useMutation({
    mutationFn: async (data) => {
      await UserProfile.upsert(user.uid, data);
      await refreshProfile();
    },
    onSuccess: () => {
      setSaveSuccess('profile');
      setTimeout(() => setSaveSuccess(''), 3000);
    }
  });

  const updateAiMutation = useMutation({
    mutationFn: async (config) => {
      await UserProfile.updateAiConfig(user.uid, config);
      await refreshProfile();
    },
    onSuccess: () => {
      setSaveSuccess('ai');
      setTimeout(() => setSaveSuccess(''), 3000);
    }
  });

  const updateAgentModelsMutation = useMutation({
    mutationFn: async (models) => {
      // Save to both Firestore and localStorage
      await UserProfile.updateAgentModels(user.uid, models);
      saveAgentModels(models);
      await refreshProfile();
    },
    onSuccess: () => {
      setSaveSuccess('agents');
      setTimeout(() => setSaveSuccess(''), 3000);
    }
  });

  const handleProfileSubmit = (e) => {
    e.preventDefault();
    updateProfileMutation.mutate(formData);
  };

  const handleAiSubmit = (e) => {
    e.preventDefault();
    const configToSave = { ...aiConfig };
    // Se o usuário deixou a chave em branco, mantém a chave existente no Firestore
    if (!configToSave.apiKey.trim() && userProfile?.aiConfig?.apiKey) {
      configToSave.apiKey = userProfile.aiConfig.apiKey;
    }
    updateAiMutation.mutate(configToSave);
  };

  const handleProviderChange = (provider) => {
    setAiProvider(provider);
    const preset = AI_PRESETS[provider];
    setAiConfig(prev => ({
      ...prev,
      baseUrl: provider !== 'custom' ? preset.baseUrl : '',
      model: preset.models?.[0]?.value || ''
    }));
    setTestStatus(null);
  };

  const handleTestKey = async () => {
    const key = (aiConfig.apiKey || '').trim();
    if (!key || !aiConfig.baseUrl) {
      setTestError('Preencha a chave de API antes de testar.');
      setTestStatus('error');
      return;
    }
    setTestStatus('testing');
    setTestError('');
    try {
      if (aiProvider === 'gemini' || isGeminiUrl(aiConfig.baseUrl)) {
        // Gemini (native or via Custom URL): use the native REST endpoint with ?key= param.
        // The OpenAI-compat endpoint (/openai/models) blocks CORS from browsers, so we
        // always normalise to the v1beta root and call /models?key=… instead.
        const nativeBase = geminiApiBase(aiConfig.baseUrl);
        const res = await fetch(
          `${nativeBase}/models?key=${encodeURIComponent(key)}`
        );
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err?.error?.message || `Erro ${res.status}: ${res.statusText}`);
        }
      } else {
        // OpenRouter / OpenAI-compatible: validate via GET /models (no model required)
        const res = await fetch(`${aiConfig.baseUrl}/models`, {
          headers: {
            Authorization: `Bearer ${key}`,
            'HTTP-Referer': window.location.origin,
            'X-Title': 'OmniForge RPG',
          },
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err?.error?.message || `Erro ${res.status}: ${res.statusText}`);
        }
      }
      setTestStatus('ok');
    } catch (err) {
      setTestStatus('error');
      setTestError(err.message || 'Erro ao conectar com a API');
    }
  };

  // Handle adding a model from the OpenRouter browser to the user's catalog
  const handleAddModelFromBrowser = async (model) => {
    const curatedIds = new Set(AVAILABLE_MODELS.map((m) => m.id));
    const isRemovedCurated = curatedIds.has(model.id) && new Set(removedModelIds).has(model.id);

    // If it's a curated model that was previously removed, un-remove it
    if (isRemovedCurated) {
      const newRemovedIds = removedModelIds.filter((id) => id !== model.id);
      setRemovedModelIds(newRemovedIds);
      try {
        await UserProfile.updateRemovedModels(user.uid, newRemovedIds);
        await refreshProfile();
      } catch (err) {
        console.error('Failed to restore removed model:', err);
      }
      return;
    }

    // Don't add curated models that are still active (they're always included)
    if (curatedIds.has(model.id)) return;
    // Don't add duplicates
    if (customModelIds.includes(model.id)) return;
    const newIds = [...customModelIds, model.id];
    setCustomModelIds(newIds);
    // Persist to Firestore
    try {
      await UserProfile.updateModelCatalog(user.uid, newIds);
      await refreshProfile();
    } catch (err) {
      console.error('Failed to save custom model:', err);
    }
  };

  const handleSaveAgentModels = () => {
    updateAgentModelsMutation.mutate(agentModels);
  };

  const handleResetAgentModels = () => {
    const defaults = getDefaultModelMap();
    setAgentModels(defaults);
  };

  // ---------------------------------------------------------------------------
  // Verify & cleanup unavailable models
  // ---------------------------------------------------------------------------
  const handleVerifyModels = async () => {
    const key = (aiConfig.apiKey || '').trim();
    if (!key) {
      setVerifyError('Configure sua chave de API antes de verificar os modelos.');
      setVerifyStatus('error');
      return;
    }
    setVerifyStatus('verifying');
    setVerifyError('');
    setVerifyResults(null);
    try {
      const results = await verifyModelAvailability(key, agentModels, aiConfig.model);
      setVerifyResults(results);

      const unavailableAgentKeys = Object.keys(results.unavailableAgentModels);
      const hasUnavailableCatalog = results.unavailableCatalogIds.length > 0;
      const hasUnavailableAgents = unavailableAgentKeys.length > 0;
      const hasUnavailableDefault = !results.defaultModelAvailable;

      if (hasUnavailableCatalog || hasUnavailableAgents || hasUnavailableDefault) {
        const unavailableSet = new Set(results.unavailableCatalogIds);

        // 1) Remove unavailable models from the in-memory catalog
        removeModelsFromCatalog(unavailableSet);

        // 2) Persist removed catalog model IDs to Firestore
        const newRemovedIds = [...new Set([...removedModelIds, ...results.unavailableCatalogIds])];
        setRemovedModelIds(newRemovedIds);
        try {
          await UserProfile.updateRemovedModels(user.uid, newRemovedIds);
        } catch (saveErr) {
          console.error('Failed to save removed model IDs:', saveErr);
        }

        // 3) Remove unavailable custom model IDs
        const cleanedCustomIds = customModelIds.filter((id) => results.availableIds.has(id));
        if (cleanedCustomIds.length < customModelIds.length) {
          setCustomModelIds(cleanedCustomIds);
          try {
            await UserProfile.updateModelCatalog(user.uid, cleanedCustomIds);
          } catch (saveErr) {
            console.error('Failed to save cleaned custom models:', saveErr);
          }
        }

        // 4) Reset unavailable agent models to empty string
        if (hasUnavailableAgents) {
          const cleanedAgentModels = { ...agentModels };
          for (const agentKey of unavailableAgentKeys) {
            cleanedAgentModels[agentKey] = '';
          }
          setAgentModels(cleanedAgentModels);
          try {
            await UserProfile.updateAgentModels(user.uid, cleanedAgentModels);
            saveAgentModels(cleanedAgentModels);
          } catch (saveErr) {
            console.error('Failed to save cleaned agent models:', saveErr);
          }
        }

        // 5) Clear the default model if unavailable
        if (hasUnavailableDefault) {
          const cleanedConfig = { ...aiConfig, model: '' };
          setAiConfig(cleanedConfig);
          try {
            await UserProfile.updateAiConfig(user.uid, cleanedConfig);
          } catch (saveErr) {
            console.error('Failed to save cleaned AI config:', saveErr);
          }
        }

        await refreshProfile();
      }

      setVerifyStatus('done');
    } catch (err) {
      setVerifyStatus('error');
      setVerifyError(err.message || 'Erro ao verificar modelos');
    }
  };

  const currentPreset = AI_PRESETS[aiProvider];
  const hasModelList = Array.isArray(currentPreset?.models);

  const maskedKey = aiConfig.apiKey
    ? `${'•'.repeat(Math.max(0, aiConfig.apiKey.length - 4))}${aiConfig.apiKey.slice(-4)}`
    : '';

  if (!user) {
    return (
      <div className="text-center py-16">
        <p className="text-slate-400">Faça login para acessar seu perfil</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <User className="w-10 h-10 text-purple-400" />
          <h1 className="text-4xl font-bold text-white">Meu Perfil</h1>
        </div>
        <p className="text-slate-400 text-lg">Gerencie suas informações pessoais e preferências</p>
      </div>

      {/* Avatar */}
      <Card className="bg-slate-900/50 backdrop-blur-xl border-purple-900/20">
        <CardContent className="p-8">
          <div className="flex items-center gap-6">
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt="Avatar"
                className="w-24 h-24 rounded-full border-4 border-purple-500/30"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-600 to-amber-500 flex items-center justify-center text-white text-4xl font-bold">
                {(user.displayName || user.email)?.[0]?.toUpperCase()}
              </div>
            )}
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">
                {userProfile?.full_name || user.displayName || 'Usuário'}
              </h2>
              <p className="text-slate-400">{user.email}</p>
              <div className="flex items-center gap-2 mt-2">
                <Shield className="w-4 h-4 text-purple-400" />
                <span className="text-sm text-purple-300 capitalize">
                  {userProfile?.role || 'user'}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Informações Pessoais */}
      <Card className="bg-slate-900/50 backdrop-blur-xl border-purple-900/20">
        <CardHeader>
          <CardTitle className="text-white">Informações Pessoais</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleProfileSubmit} className="space-y-6">
            <div>
              <Label htmlFor="full_name" className="text-white mb-2 block">Nome Completo</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder="Seu nome completo"
                  className="pl-10 bg-slate-950/50 border-slate-700 text-white"
                />
              </div>
            </div>
            <div>
              <Label className="text-white mb-2 block">E-mail</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  value={user.email}
                  disabled
                  className="pl-10 bg-slate-950/50 border-slate-700 text-slate-500 cursor-not-allowed"
                />
              </div>
              <p className="text-xs text-slate-500 mt-1">O e-mail é gerenciado pelo Google</p>
            </div>
            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={updateProfileMutation.isPending}
                className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white"
              >
                {updateProfileMutation.isPending ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Salvando...</>
                ) : (
                  <><Save className="w-4 h-4 mr-2" />{saveSuccess === 'profile' ? '✓ Salvo!' : 'Salvar Alterações'}</>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Configuração de IA */}
      <Card className="bg-slate-900/50 backdrop-blur-xl border-purple-900/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Bot className="w-6 h-6 text-purple-400" />
            Configuração de IA
          </CardTitle>
          <p className="text-slate-400 text-sm mt-1">
            Configure sua chave de API para gerar campanhas com IA. A chave é armazenada de forma segura na sua conta.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAiSubmit} className="space-y-6">
            {/* Provider */}
            <div>
              <Label className="text-white mb-2 block">Provedor de IA</Label>
              <Select value={aiProvider} onValueChange={handleProviderChange}>
                <SelectTrigger className="bg-slate-950/50 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(AI_PRESETS).map(([key, preset]) => (
                    <SelectItem key={key} value={key}>{preset.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {currentPreset?.docsUrl && (
                <a
                  href={currentPreset.docsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300 mt-2"
                >
                  <ExternalLink className="w-3 h-3" />
                  Obter chave de API
                </a>
              )}
            </div>

            {/* Base URL — hidden for presets with a fixed URL, shown for custom */}
            {aiProvider === 'custom' && (
              <div>
                <Label className="text-white mb-2 block">URL Base da API</Label>
                <Input
                  value={aiConfig.baseUrl}
                  onChange={(e) => setAiConfig({ ...aiConfig, baseUrl: e.target.value })}
                  placeholder="https://seu-endpoint.com/v1"
                  required
                  className="bg-slate-950/50 border-slate-700 text-white font-mono text-sm"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Deve ser compatível com OpenAI Chat Completions API
                </p>
              </div>
            )}

            {/* API Key */}
            <div>
              <Label className="text-white mb-2 block">Chave de API</Label>
              <div className="relative">
                <Input
                  type={showApiKey ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={aiConfig.apiKey}
                  onChange={(e) => {
                    setAiConfig({ ...aiConfig, apiKey: e.target.value });
                    setTestStatus(null);
                  }}
                  placeholder={userProfile?.aiConfig?.apiKey ? maskedKey : 'Cole sua chave de API aqui'}
                  required={!userProfile?.aiConfig?.apiKey}
                  className="pr-10 bg-slate-950/50 border-slate-700 text-white font-mono text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {userProfile?.aiConfig?.apiKey && (
                <p className="text-xs text-green-500 mt-1">✓ Chave configurada. Deixe em branco para manter a atual.</p>
              )}
            </div>

            {/* Model — dropdown when preset has model list, catalog combobox for openrouter, text input for custom */}
            <div>
              <Label className="text-white mb-2 block">Modelo Padrão</Label>
              {hasModelList ? (
                <Select
                  value={aiConfig.model}
                  onValueChange={(val) => {
                    setAiConfig({ ...aiConfig, model: val });
                    setTestStatus(null);
                  }}
                >
                  <SelectTrigger className="bg-slate-950/50 border-slate-700 text-white">
                    <SelectValue placeholder="Selecione um modelo..." />
                  </SelectTrigger>
                  <SelectContent>
                    {currentPreset.models.map((m) => (
                      <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : aiProvider === 'openrouter' ? (
                <>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setCatalogOpen(true)}
                      className="flex flex-1 items-center justify-between rounded-md border border-slate-700 bg-slate-950/50 px-3 py-2 text-sm text-white hover:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-purple-500"
                    >
                      <span className={aiConfig.model ? 'text-white' : 'text-slate-500'}>
                        {aiConfig.model
                          ? (userModels.find((m) => m.id === aiConfig.model)?.label ?? aiConfig.model)
                          : 'Clique para abrir o catálogo de modelos...'}
                      </span>
                      <BookOpen className="ml-2 h-4 w-4 shrink-0 text-purple-400" />
                    </button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setBrowserOpen(true)}
                      className="border-purple-600/50 text-purple-300 hover:text-white hover:bg-purple-800/30 shrink-0"
                      title="Adicionar modelos do OpenRouter ao catálogo"
                    >
                      <Download className="w-4 h-4 mr-1.5" />
                      Adicionar do OpenRouter
                    </Button>
                  </div>
                  <ModelCatalogModal
                    open={catalogOpen}
                    onOpenChange={setCatalogOpen}
                    models={userModels}
                    selectedModelId={aiConfig.model}
                    onSelect={(model) => {
                      setAiConfig({ ...aiConfig, model: model.id });
                      setTestStatus(null);
                    }}
                  />
                  <OpenRouterBrowserModal
                    open={browserOpen}
                    onOpenChange={setBrowserOpen}
                    allModels={allModels}
                    userModelIds={userModelIds}
                    onAddModel={handleAddModelFromBrowser}
                    isLoading={catalogLoading}
                  />
                  <div className="mt-2">
                    <Input
                      value={aiConfig.model}
                      onChange={(e) => {
                        setAiConfig({ ...aiConfig, model: e.target.value });
                        setTestStatus(null);
                      }}
                      placeholder="Ou digite o ID do modelo manualmente (ex: openai/gpt-4o)"
                      className="bg-slate-950/50 border-slate-700 text-white font-mono text-sm"
                    />
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    {userModels.length} modelos no seu catálogo
                    {customModelIds.length > 0 && (
                      <span className="text-purple-400"> ({customModelIds.length} personalizado{customModelIds.length !== 1 ? 's' : ''})</span>
                    )}
                  </p>
                </>
              ) : (
                <>
                  <Input
                    value={aiConfig.model}
                    onChange={(e) => {
                      setAiConfig({ ...aiConfig, model: e.target.value });
                      setTestStatus(null);
                    }}
                    placeholder={currentPreset?.modelPlaceholder || 'model-name'}
                    required
                    className="bg-slate-950/50 border-slate-700 text-white font-mono text-sm"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    {aiProvider === 'custom' && 'Nome do modelo conforme aceito pela sua API'}
                  </p>
                </>
              )}
            </div>

            {/* Test key button + result */}
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleTestKey}
                disabled={testStatus === 'testing'}
                className="border-slate-600 text-slate-300 hover:text-white hover:bg-slate-800"
              >
                {testStatus === 'testing' ? (
                  <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />Testando...</>
                ) : (
                  <><FlaskConical className="w-3.5 h-3.5 mr-1.5" />Testar Chave</>
                )}
              </Button>
              {testStatus === 'ok' && (
                <span className="flex items-center gap-1.5 text-sm text-green-400">
                  <CheckCircle className="w-4 h-4" />
                  Chave válida! API respondendo corretamente.
                </span>
              )}
              {testStatus === 'error' && (
                <span className="flex items-center gap-1.5 text-sm text-red-400">
                  <AlertCircle className="w-4 h-4" />
                  {testError || 'Erro ao conectar com a API'}
                </span>
              )}
            </div>

            {/* Verify Models button + results (OpenRouter only) */}
            {aiProvider === 'openrouter' && (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleVerifyModels}
                    disabled={verifyStatus === 'verifying'}
                    className="border-purple-600/50 text-purple-300 hover:text-white hover:bg-purple-800/30"
                  >
                    {verifyStatus === 'verifying' ? (
                      <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />Verificando...</>
                    ) : (
                      <><ShieldCheck className="w-3.5 h-3.5 mr-1.5" />Verificar Modelos</>
                    )}
                  </Button>
                  {verifyStatus === 'done' && verifyResults && (
                    <span className="text-xs text-slate-400">
                      {verifyResults.unavailableCatalogIds.length === 0 &&
                       Object.keys(verifyResults.unavailableAgentModels).length === 0 &&
                       verifyResults.defaultModelAvailable
                        ? <span className="flex items-center gap-1.5 text-green-400"><CheckCircle className="w-3.5 h-3.5" />Todos os modelos estão disponíveis!</span>
                        : <span className="flex items-center gap-1.5 text-green-400"><CheckCircle className="w-3.5 h-3.5" />Modelos indisponíveis foram excluídos do catálogo.</span>
                      }
                    </span>
                  )}
                  {verifyStatus === 'error' && (
                    <span className="flex items-center gap-1.5 text-sm text-red-400">
                      <AlertCircle className="w-4 h-4" />
                      {verifyError || 'Erro ao verificar modelos'}
                    </span>
                  )}
                </div>

                {/* Verification results detail */}
                {verifyStatus === 'done' && verifyResults && (
                  (verifyResults.unavailableCatalogIds.length > 0 ||
                   Object.keys(verifyResults.unavailableAgentModels).length > 0 ||
                   !verifyResults.defaultModelAvailable) && (
                    <div className="p-4 bg-blue-900/20 border border-blue-500/20 rounded-lg space-y-2">
                      <p className="text-blue-300 text-sm font-medium flex items-center gap-1.5">
                        <Trash2 className="w-4 h-4" />
                        Modelos indisponíveis excluídos do catálogo
                      </p>

                      {!verifyResults.defaultModelAvailable && (
                        <p className="text-amber-200/70 text-xs">
                          ⚠ Modelo padrão <code className="bg-slate-800 px-1 rounded">{aiConfig.model || '(nenhum)'}</code> não está mais disponível e foi removido — selecione um novo modelo.
                        </p>
                      )}

                      {Object.keys(verifyResults.unavailableAgentModels).length > 0 && (
                        <div>
                          <p className="text-amber-200/70 text-xs mb-1">
                            ⚠ Modelos de agentes removidos ({Object.keys(verifyResults.unavailableAgentModels).length}):
                          </p>
                          <ul className="text-xs text-slate-400 space-y-0.5 pl-4">
                            {Object.entries(verifyResults.unavailableAgentModels).map(([agentKey, modelId]) => {
                              const agent = PIPELINE_AGENT_DEFS.find((a) => a.key === agentKey);
                              return (
                                <li key={agentKey}>
                                  <span className="text-slate-300">{agent?.label || agentKey}</span>
                                  {' → '}
                                  <code className="bg-slate-800 px-1 rounded text-red-400">{modelId}</code>
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      )}

                      {verifyResults.unavailableCatalogIds.length > 0 && (
                        <div>
                          <p className="text-amber-200/70 text-xs mb-1">
                            ⚠ Modelos excluídos do catálogo ({verifyResults.unavailableCatalogIds.length}):
                          </p>
                          <ul className="text-xs text-slate-400 space-y-0.5 pl-4 max-h-32 overflow-y-auto">
                            {verifyResults.unavailableCatalogIds.map((id) => (
                              <li key={id}>
                                <code className="bg-slate-800 px-1 rounded text-red-400">{id}</code>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <p className="text-xs text-slate-500 mt-1">
                        Selecione novos modelos para os agentes afetados na seção &quot;Modelos por Agente&quot; abaixo.
                      </p>
                    </div>
                  )
                )}
              </div>
            )}

            <div className="p-4 bg-blue-900/20 border border-blue-500/20 rounded-lg">
              <p className="text-blue-300 text-sm">
                💡 <strong>Dica:</strong> Recomendamos o <strong>OpenRouter</strong> pois dá acesso a todos os modelos de IA (GPT-4, Claude, Gemini) com uma única chave. O modelo <code className="text-blue-200">openai/gpt-4o</code> é uma ótima escolha para criação de campanhas. Para usar o Gemini diretamente, crie uma chave em <strong>Google AI Studio</strong>.
              </p>
            </div>

            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={updateAiMutation.isPending}
                className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white"
              >
                {updateAiMutation.isPending ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Salvando...</>
                ) : (
                  <><Save className="w-4 h-4 mr-2" />{saveSuccess === 'ai' ? '✓ Configuração Salva!' : 'Salvar Configuração de IA'}</>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Per-Agent Model Configuration */}
      {aiProvider === 'openrouter' && (
        <AgentModelConfig
          agentModels={agentModels}
          onAgentModelsChange={setAgentModels}
          catalogModels={userModels}
          isSaving={updateAgentModelsMutation.isPending}
          onSave={handleSaveAgentModels}
          onReset={handleResetAgentModels}
        />
      )}
    </div>
  );
}
