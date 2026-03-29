/**
 * OmniForge RPG — Tutorial de Configuração de API Key
 *
 * Modal interativo que guia o usuário no processo de obtenção
 * e configuração de API Keys para os provedores de IA suportados.
 *
 * Exibido automaticamente na primeira visita do usuário autenticado.
 * Pode ser reaberto pela Central de Ajuda.
 */

import React, { useState, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  Key,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  User,
  CheckCircle,
  Globe,
  Zap,
  Star,
  BookOpen,
  Shield,
  Rocket,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// localStorage key
// ---------------------------------------------------------------------------
const TUTORIAL_DISMISSED_KEY = 'omniforge_tutorial_dismissed';

export function isTutorialDismissed() {
  try {
    return localStorage.getItem(TUTORIAL_DISMISSED_KEY) === 'true';
  } catch {
    return false;
  }
}

export function dismissTutorial() {
  try {
    localStorage.setItem(TUTORIAL_DISMISSED_KEY, 'true');
  } catch {
    // noop
  }
}

export function resetTutorialDismissed() {
  try {
    localStorage.removeItem(TUTORIAL_DISMISSED_KEY);
  } catch {
    // noop
  }
}

// ---------------------------------------------------------------------------
// Provider guide data
// ---------------------------------------------------------------------------
const PROVIDER_GUIDES = [
  {
    id: 'openrouter',
    name: 'OpenRouter',
    recommended: true,
    icon: '🌐',
    color: 'from-violet-600 to-indigo-600',
    badgeColor: 'bg-violet-600/20 text-violet-400 border-violet-500/30',
    description: 'Acesso a centenas de modelos de IA por uma única API Key. Ideal para quem quer flexibilidade máxima.',
    pricing: 'Pay-as-you-go · Alguns modelos gratuitos',
    steps: [
      'Acesse openrouter.ai e clique em "Sign Up" no canto superior direito.',
      'Crie sua conta usando Google, GitHub ou email.',
      'Após o login, clique no seu avatar e selecione "Keys" no menu, ou acesse diretamente openrouter.ai/keys.',
      'Clique em "Create Key" para gerar uma nova API Key.',
      'Dê um nome à chave (ex: "OmniForge RPG") e clique em "Create".',
      'Copie a chave gerada (começa com "sk-or-..."). Ela só é exibida uma vez!',
      'Cole a chave na página de Perfil do OmniForge, no campo "Chave de API".',
    ],
  },
  {
    id: 'gemini',
    name: 'Google Gemini',
    recommended: false,
    icon: '💎',
    color: 'from-blue-600 to-cyan-600',
    badgeColor: 'bg-blue-600/20 text-blue-400 border-blue-500/30',
    description: 'Modelos Gemini do Google com tier gratuito generoso. Ótimo para começar sem custo.',
    pricing: 'Tier gratuito disponível · Pay-as-you-go',
    steps: [
      'Acesse aistudio.google.com e faça login com sua conta Google.',
      'No painel principal do Google AI Studio, clique em "Get API key" no menu lateral esquerdo.',
      'Clique em "Create API key" e selecione um projeto existente ou crie um novo no Google Cloud.',
      'Sua API Key será gerada automaticamente (começa com "AIza...").',
      'Copie a chave clicando no ícone de cópia ao lado dela.',
      'No OmniForge, selecione "Google AI Studio (Gemini)" como provedor e cole a chave no campo "Chave de API".',
    ],
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    recommended: false,
    icon: '🔍',
    color: 'from-emerald-600 to-teal-600',
    badgeColor: 'bg-emerald-600/20 text-emerald-400 border-emerald-500/30',
    description: 'Modelos de alta qualidade com preços competitivos. Destaque para o DeepSeek V3 e R1.',
    pricing: 'Pay-as-you-go · Preços acessíveis',
    steps: [
      'Acesse platform.deepseek.com e clique em "Sign Up" para criar sua conta.',
      'Confirme seu email e faça login na plataforma.',
      'No painel, acesse "API Keys" no menu lateral esquerdo.',
      'Clique em "Create new API key".',
      'Dê um nome para a chave (ex: "OmniForge") e confirme.',
      'Copie a chave gerada (começa com "sk-...").',
      'No OmniForge, selecione "DeepSeek" como provedor e cole a chave.',
    ],
  },
  {
    id: 'openai',
    name: 'OpenAI',
    recommended: false,
    icon: '🤖',
    color: 'from-green-600 to-emerald-600',
    badgeColor: 'bg-green-600/20 text-green-400 border-green-500/30',
    description: 'GPT-4o, GPT-4 Turbo e mais. Referência em qualidade para geração de texto.',
    pricing: 'Pay-as-you-go · Créditos iniciais para novos usuários',
    steps: [
      'Acesse platform.openai.com e faça login ou crie uma conta.',
      'No menu lateral, clique em "API keys" (ou acesse diretamente platform.openai.com/api-keys).',
      'Clique em "+ Create new secret key".',
      'Dê um nome à chave (ex: "OmniForge RPG") e selecione as permissões desejadas.',
      'Clique em "Create secret key" e copie a chave (começa com "sk-...").',
      'A chave só é exibida uma vez! Guarde-a em local seguro.',
      'No OmniForge, selecione "OpenAI" como provedor e cole a chave.',
    ],
  },
  {
    id: 'anthropic',
    name: 'Anthropic (Claude)',
    recommended: false,
    icon: '🧠',
    color: 'from-orange-600 to-amber-600',
    badgeColor: 'bg-orange-600/20 text-orange-400 border-orange-500/30',
    description: 'Modelos Claude — excelentes para textos longos, criativos e análise detalhada.',
    pricing: 'Pay-as-you-go · Créditos iniciais disponíveis',
    steps: [
      'Acesse console.anthropic.com e crie uma conta ou faça login.',
      'No painel do Console, clique em "Settings" no menu lateral.',
      'Selecione "API Keys" na seção de configurações.',
      'Clique em "Create Key" para gerar uma nova chave.',
      'Dê um nome à chave e confirme a criação.',
      'Copie a chave gerada (começa com "sk-ant-...").',
      'No OmniForge, selecione "Anthropic (Claude)" como provedor e cole a chave.',
    ],
  },
  {
    id: 'kimi',
    name: 'Kimi (Moonshot AI)',
    recommended: false,
    icon: '🌙',
    color: 'from-indigo-600 to-purple-600',
    badgeColor: 'bg-indigo-600/20 text-indigo-400 border-indigo-500/30',
    description: 'Modelos Kimi da Moonshot AI, com boa capacidade para textos longos e contexto amplo.',
    pricing: 'Pay-as-you-go',
    steps: [
      'Acesse platform.moonshot.cn e crie uma conta.',
      'Faça login na plataforma Moonshot AI.',
      'No painel, navegue até a seção "API Key Management".',
      'Clique em "Create new API Key".',
      'Copie a chave gerada.',
      'No OmniForge, selecione "Custom (URL própria)" como provedor.',
      'Insira a URL base: https://api.moonshot.cn/v1 e cole a chave no campo "Chave de API".',
    ],
  },
  {
    id: 'qwen',
    name: 'Qwen (Alibaba Cloud)',
    recommended: false,
    icon: '☁️',
    color: 'from-sky-600 to-blue-600',
    badgeColor: 'bg-sky-600/20 text-sky-400 border-sky-500/30',
    description: 'Modelos Qwen da Alibaba, poderosos para múltiplos idiomas e tarefas diversas.',
    pricing: 'Pay-as-you-go · Tier gratuito disponível',
    steps: [
      'Acesse dashscope.aliyuncs.com e crie uma conta Alibaba Cloud (ou faça login).',
      'No painel do DashScope, acesse "API-KEY Management".',
      'Clique em "Create new API Key".',
      'Copie a chave gerada.',
      'No OmniForge, selecione "Custom (URL própria)" como provedor.',
      'Insira a URL base: https://dashscope.aliyuncs.com/compatible-mode/v1 e cole a chave no campo "Chave de API".',
      'Escolha um modelo Qwen (ex: qwen-turbo, qwen-plus, qwen-max) digitando no campo de modelo.',
    ],
  },
];

// ---------------------------------------------------------------------------
// Tutorial pages
// ---------------------------------------------------------------------------

const TOTAL_INTRO_PAGES = 2; // welcome + provider list
const TOTAL_FINAL_PAGES = 1; // final "register on platform" page

// ---------------------------------------------------------------------------
// Components
// ---------------------------------------------------------------------------

function WelcomePage() {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <div className="mx-auto w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-600 to-amber-500 flex items-center justify-center shadow-lg shadow-purple-900/30">
          <Sparkles className="w-10 h-10 text-white" />
        </div>
        <h3 className="text-2xl font-bold text-white">
          Bem-vindo ao OmniForge RPG!
        </h3>
        <p className="text-slate-300 leading-relaxed max-w-md mx-auto">
          Para utilizar as ferramentas de <strong className="text-purple-300">Inteligência Artificial</strong> na
          plataforma — como geração de campanhas, NPCs, encontros e mais — você
          precisa configurar uma <strong className="text-amber-300">API Key</strong> de um provedor de IA.
        </p>
      </div>

      <div className="grid gap-3">
        {[
          { icon: Key, text: 'Obtenha uma API Key de um provedor de IA', color: 'text-amber-400' },
          { icon: User, text: 'Registre sua chave na página de Perfil', color: 'text-purple-400' },
          { icon: Sparkles, text: 'Comece a gerar conteúdo incrível para suas aventuras!', color: 'text-emerald-400' },
        ].map((item, idx) => (
          <div key={idx} className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-700/50 text-sm font-bold text-slate-300">
              {idx + 1}
            </div>
            <item.icon className={`w-5 h-5 ${item.color} shrink-0`} />
            <span className="text-sm text-slate-300">{item.text}</span>
          </div>
        ))}
      </div>

      <div className="p-4 rounded-xl bg-gradient-to-r from-violet-900/30 to-indigo-900/30 border border-violet-500/20">
        <div className="flex items-start gap-3">
          <Star className="w-5 h-5 text-violet-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-violet-300">Recomendação</p>
            <p className="text-xs text-slate-400 mt-1">
              Se você não possui uma API Key de nenhum provedor, recomendamos o{' '}
              <strong className="text-violet-300">OpenRouter</strong> — ele dá acesso a centenas de modelos
              de IA com uma única chave, incluindo opções gratuitas!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProviderListPage({ onSelectProvider }) {
  return (
    <div className="space-y-4">
      <div className="text-center space-y-2">
        <h3 className="text-xl font-bold text-white">Escolha seu Provedor</h3>
        <p className="text-slate-400 text-sm">
          Selecione o provedor para ver o guia passo a passo de como obter a API Key.
        </p>
      </div>

      <div className="grid gap-2 max-h-[380px] overflow-y-auto pr-1 model-catalog-scroll">
        {PROVIDER_GUIDES.map((provider) => (
          <button
            key={provider.id}
            onClick={() => onSelectProvider(provider)}
            className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/50 border border-slate-700/50 hover:border-purple-500/50 hover:bg-slate-800/80 transition-all text-left group"
          >
            <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${provider.color} flex items-center justify-center text-lg shrink-0`}>
              {provider.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-white">{provider.name}</span>
                {provider.recommended && (
                  <Badge className="bg-amber-600/20 text-amber-400 border-amber-500/30 text-[10px] px-1.5 py-0">
                    Recomendado
                  </Badge>
                )}
              </div>
              <p className="text-xs text-slate-500 truncate">{provider.description}</p>
              <p className="text-[10px] text-slate-600 mt-0.5">{provider.pricing}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-purple-400 transition-colors shrink-0" />
          </button>
        ))}
      </div>
    </div>
  );
}

function ProviderGuidePage({ provider, onBack }) {
  return (
    <div className="space-y-4">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        Voltar à lista de provedores
      </button>

      <div className="flex items-center gap-3">
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${provider.color} flex items-center justify-center text-xl shrink-0`}>
          {provider.icon}
        </div>
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            {provider.name}
            {provider.recommended && (
              <Badge className="bg-amber-600/20 text-amber-400 border-amber-500/30 text-[10px] px-1.5 py-0">
                Recomendado
              </Badge>
            )}
          </h3>
          <p className="text-xs text-slate-400">{provider.description}</p>
        </div>
      </div>

      <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1 model-catalog-scroll">
        {provider.steps.map((step, idx) => (
          <div key={idx} className="flex gap-3 p-3 rounded-lg bg-slate-800/30 border border-slate-700/30">
            <div className="flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-br from-purple-600 to-amber-500 text-white text-xs font-bold shrink-0 mt-0.5">
              {idx + 1}
            </div>
            <p className="text-sm text-slate-300 leading-relaxed">{step}</p>
          </div>
        ))}
      </div>

      <div className="p-3 rounded-lg bg-amber-900/20 border border-amber-500/20">
        <div className="flex items-start gap-2">
          <Shield className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-300/80">
            <strong>Dica de segurança:</strong> Nunca compartilhe sua API Key publicamente.
            Ela é armazenada de forma segura na sua conta do OmniForge.
          </p>
        </div>
      </div>
    </div>
  );
}

function RegisterKeyPage() {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-3">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-900/30">
          <Rocket className="w-8 h-8 text-white" />
        </div>
        <h3 className="text-xl font-bold text-white">
          Registrar sua API Key no OmniForge
        </h3>
        <p className="text-slate-400 text-sm">
          Com sua API Key em mãos, siga estes passos para ativá-la na plataforma:
        </p>
      </div>

      <div className="space-y-3">
        {[
          {
            step: 1,
            title: 'Acesse a página de Perfil',
            desc: 'No menu lateral, clique em "Perfil" para abrir suas configurações.',
            icon: User,
          },
          {
            step: 2,
            title: 'Selecione o Provedor de IA',
            desc: 'No card "Configuração de IA", escolha o provedor correspondente à sua API Key.',
            icon: Globe,
          },
          {
            step: 3,
            title: 'Cole sua API Key',
            desc: 'No campo "Chave de API", cole a chave que você obteve do provedor.',
            icon: Key,
          },
          {
            step: 4,
            title: 'Escolha um modelo padrão',
            desc: 'Clique no botão do catálogo para selecionar o modelo de IA que deseja usar.',
            icon: BookOpen,
          },
          {
            step: 5,
            title: 'Teste e salve',
            desc: 'Clique em "Testar Chave" para verificar e depois em "Salvar Configuração".',
            icon: CheckCircle,
          },
        ].map((item) => (
          <div key={item.step} className="flex gap-3 p-3 rounded-lg bg-slate-800/30 border border-slate-700/30">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-emerald-600 to-teal-600 text-white text-xs font-bold shrink-0">
              {item.step}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <item.icon className="w-4 h-4 text-emerald-400" />
                <span className="text-sm font-semibold text-white">{item.title}</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 rounded-xl bg-gradient-to-r from-purple-900/30 to-amber-900/20 border border-purple-500/20 text-center">
        <Zap className="w-6 h-6 text-amber-400 mx-auto mb-2" />
        <p className="text-sm text-slate-300">
          Pronto! Agora você pode usar todas as ferramentas de IA do OmniForge
          para criar campanhas épicas de RPG! 🎲
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Modal
// ---------------------------------------------------------------------------

export default function ApiKeyTutorialModal({ open, onOpenChange }) {
  // Pages: 0 = welcome, 1 = provider list, 2 = provider guide (sub), 3 = register on platform
  const [page, setPage] = useState(0);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const handleClose = useCallback(() => {
    if (dontShowAgain) {
      dismissTutorial();
    }
    setPage(0);
    setSelectedProvider(null);
    onOpenChange(false);
  }, [dontShowAgain, onOpenChange]);

  const handleSelectProvider = useCallback((provider) => {
    setSelectedProvider(provider);
  }, []);

  const handleBackToList = useCallback(() => {
    setSelectedProvider(null);
  }, []);

  const totalPages = TOTAL_INTRO_PAGES + TOTAL_FINAL_PAGES; // 0, 1, 2
  const isFirstPage = page === 0 && !selectedProvider;
  const isLastPage = page === totalPages - 1 && !selectedProvider;

  const handleNext = () => {
    if (selectedProvider) {
      setSelectedProvider(null);
      return;
    }
    if (page < totalPages - 1) {
      setPage(page + 1);
    }
  };

  const handlePrev = () => {
    if (selectedProvider) {
      setSelectedProvider(null);
      return;
    }
    if (page > 0) {
      setPage(page - 1);
    }
  };

  const renderContent = () => {
    if (selectedProvider) {
      return <ProviderGuidePage provider={selectedProvider} onBack={handleBackToList} />;
    }
    switch (page) {
      case 0:
        return <WelcomePage />;
      case 1:
        return <ProviderListPage onSelectProvider={handleSelectProvider} />;
      case 2:
        return <RegisterKeyPage />;
      default:
        return <WelcomePage />;
    }
  };

  const pageLabels = ['Boas-vindas', 'Provedores', 'Configurar'];

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); else onOpenChange(v); }}>
      <DialogContent className="bg-slate-900 border-purple-900/30 text-white max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Key className="w-5 h-5 text-amber-400" />
            {selectedProvider
              ? `Guia: ${selectedProvider.name}`
              : 'Tutorial de Configuração'}
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            {selectedProvider
              ? 'Siga o passo a passo para obter sua API Key.'
              : 'Configure sua API Key para usar as ferramentas de IA.'}
          </DialogDescription>
        </DialogHeader>

        {/* Progress dots */}
        {!selectedProvider && (
          <div className="flex items-center justify-center gap-2 py-1">
            {pageLabels.map((label, idx) => (
              <button
                key={idx}
                onClick={() => setPage(idx)}
                className="flex items-center gap-1.5 group"
                title={label}
              >
                <div className={`w-2 h-2 rounded-full transition-all ${
                  idx === page
                    ? 'bg-purple-500 scale-125'
                    : idx < page
                    ? 'bg-purple-700'
                    : 'bg-slate-700'
                }`} />
                <span className={`text-[10px] transition-colors ${
                  idx === page ? 'text-purple-400' : 'text-slate-600 group-hover:text-slate-400'
                }`}>
                  {label}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Content area */}
        <div className="flex-1 overflow-y-auto pr-1 model-catalog-scroll min-h-0">
          {renderContent()}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-800 gap-3">
          <div className="flex items-center gap-2">
            <Checkbox
              id="dont-show"
              checked={dontShowAgain}
              onCheckedChange={(checked) => setDontShowAgain(!!checked)}
              className="border-slate-600 data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
            />
            <label htmlFor="dont-show" className="text-xs text-slate-500 cursor-pointer select-none">
              Não mostrar novamente
            </label>
          </div>

          <div className="flex items-center gap-2">
            {!isFirstPage && !selectedProvider && (
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrev}
                className="border-slate-600 text-slate-300 hover:text-white hover:bg-slate-800"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Anterior
              </Button>
            )}
            {selectedProvider && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleBackToList}
                className="border-slate-600 text-slate-300 hover:text-white hover:bg-slate-800"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Voltar
              </Button>
            )}
            {isLastPage && !selectedProvider ? (
              <Button
                size="sm"
                onClick={handleClose}
                className="bg-gradient-to-r from-purple-600 to-amber-600 hover:from-purple-500 hover:to-amber-500 text-white"
              >
                Entendido!
                <CheckCircle className="w-4 h-4 ml-1" />
              </Button>
            ) : !selectedProvider ? (
              <Button
                size="sm"
                onClick={handleNext}
                className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white"
              >
                Próximo
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            ) : null}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
