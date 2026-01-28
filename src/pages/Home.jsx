import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { 
  Sparkles, 
  Wand2, 
  BookOpen, 
  Users, 
  Zap, 
  Shield,
  ArrowRight,
  Scroll,
  Globe,
  Gamepad2
} from 'lucide-react';

export default function Home() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const authed = await base44.auth.isAuthenticated();
      setIsAuthenticated(authed);
    };
    checkAuth();
  }, []);

  const handleGetStarted = async () => {
    if (isAuthenticated) {
      navigate(createPageUrl('Dashboard'));
    } else {
      await base44.auth.redirectToLogin(createPageUrl('Dashboard'));
    }
  };

  const features = [
    {
      icon: Wand2,
      title: 'Geração com IA',
      description: 'Utilize inteligência artificial avançada para criar campanhas ricas e detalhadas em minutos'
    },
    {
      icon: BookOpen,
      title: 'Múltiplos Sistemas',
      description: 'Suporte para D&D 5e, Ordem Paranormal, Cyberpunk e muito mais'
    },
    {
      icon: Users,
      title: 'Biblioteca Compartilhada',
      description: 'Explore e clone campanhas criadas pela comunidade'
    },
    {
      icon: Zap,
      title: 'Fluxo Inteligente',
      description: 'Metodologia 5W2H para extrair informações e criar histórias coerentes'
    },
    {
      icon: Shield,
      title: 'Balanceamento Automático',
      description: 'NPCs e encontros balanceados para o número de jogadores'
    },
    {
      icon: Globe,
      title: 'Ambientações Variadas',
      description: 'De fantasia medieval a cyberpunk futurista'
    }
  ];

  const systems = [
    'D&D 5e',
    'Ordem Paranormal',
    'Savage Worlds',
    'Pathfinder',
    'Cyberpunk',
    'Call of Cthulhu'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgxMzksMTM5LDIwNCwwLjEpIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-20" />
        
        <div className="relative max-w-7xl mx-auto px-6 py-20 lg:py-32">
          <div className="text-center space-y-8">
            {/* Logo/Brand */}
            <div className="flex justify-center mb-8">
              <div className="flex items-center gap-4 bg-slate-900/50 backdrop-blur-xl px-6 py-3 rounded-2xl border border-purple-500/30">
                <Scroll className="w-10 h-10 text-purple-400" />
                <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 via-purple-300 to-amber-400 bg-clip-text text-transparent">
                  RPG Forge
                </h1>
              </div>
            </div>

            {/* Headline */}
            <div className="space-y-4">
              <h2 className="text-5xl lg:text-7xl font-black text-white leading-tight">
                Crie Campanhas de RPG
                <br />
                <span className="bg-gradient-to-r from-purple-400 to-amber-400 bg-clip-text text-transparent">
                  em Minutos
                </span>
              </h2>
              <p className="text-xl lg:text-2xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
                Geração inteligente de campanhas, personagens e encontros balanceados 
                com o poder da IA. Para mestres que querem focar na narrativa.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
              <button
                onClick={handleGetStarted}
                className="group px-8 py-4 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white rounded-xl font-semibold text-lg transition-all shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 hover:scale-105 flex items-center gap-2"
              >
                <Sparkles className="w-5 h-5" />
                Começar Gratuitamente
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              
              <button
                onClick={() => document.getElementById('features').scrollIntoView({ behavior: 'smooth' })}
                className="px-8 py-4 bg-slate-800/50 hover:bg-slate-800 text-white rounded-xl font-semibold text-lg transition-all border border-slate-700 hover:border-purple-500/50"
              >
                Ver Funcionalidades
              </button>
            </div>

            {/* Supported Systems */}
            <div className="pt-12">
              <p className="text-sm text-slate-400 mb-4">Sistemas Suportados</p>
              <div className="flex flex-wrap justify-center gap-3">
                {systems.map((system) => (
                  <div
                    key={system}
                    className="px-4 py-2 bg-slate-900/50 backdrop-blur border border-purple-900/30 rounded-lg text-sm text-purple-300"
                  >
                    {system}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div id="features" className="py-20 lg:py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h3 className="text-4xl lg:text-5xl font-bold text-white mb-4">
              Tudo que você precisa
            </h3>
            <p className="text-xl text-slate-400">
              Ferramentas poderosas para mestres de RPG modernos
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="group p-8 bg-slate-900/50 backdrop-blur-xl border border-purple-900/20 rounded-2xl hover:border-purple-500/50 transition-all hover:scale-105"
                >
                  <div className="w-14 h-14 bg-gradient-to-br from-purple-600 to-amber-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <h4 className="text-xl font-bold text-white mb-2">
                    {feature.title}
                  </h4>
                  <p className="text-slate-400 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="py-20 lg:py-32 px-6 bg-slate-950/50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h3 className="text-4xl lg:text-5xl font-bold text-white mb-4">
              Como Funciona
            </h3>
            <p className="text-xl text-slate-400">
              Simples, rápido e inteligente
            </p>
          </div>

          <div className="space-y-8">
            {[
              {
                step: '01',
                title: 'Escolha o Sistema e Ambientação',
                description: 'Selecione seu sistema de RPG favorito e o tipo de história que deseja contar'
              },
              {
                step: '02',
                title: 'Responda às Perguntas 5W2H',
                description: 'Nossa IA faz perguntas estratégicas para entender sua visão da campanha'
              },
              {
                step: '03',
                title: 'Ajuste a Criatividade',
                description: 'Escolha o nível de liberdade criativa da IA (de fiel às suas respostas a totalmente livre)'
              },
              {
                step: '04',
                title: 'Receba Sua Campanha Completa',
                description: 'NPCs com fichas, encontros balanceados e ganchos de aventura prontos para jogar'
              }
            ].map((item, index) => (
              <div
                key={index}
                className="flex gap-6 items-start group"
              >
                <div className="flex-shrink-0 w-20 h-20 bg-gradient-to-br from-purple-600 to-amber-500 rounded-2xl flex items-center justify-center text-3xl font-black text-white group-hover:scale-110 transition-transform">
                  {item.step}
                </div>
                <div className="flex-1">
                  <h4 className="text-2xl font-bold text-white mb-2">
                    {item.title}
                  </h4>
                  <p className="text-lg text-slate-400 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Final CTA */}
      <div className="py-20 lg:py-32 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-gradient-to-br from-purple-900/50 to-slate-900/50 backdrop-blur-xl border border-purple-500/30 rounded-3xl p-12 lg:p-16">
            <Gamepad2 className="w-16 h-16 text-purple-400 mx-auto mb-6" />
            <h3 className="text-4xl lg:text-5xl font-bold text-white mb-6">
              Pronto para criar sua próxima aventura épica?
            </h3>
            <p className="text-xl text-slate-300 mb-8">
              Junte-se a mestres de RPG que já estão usando IA para criar campanhas incríveis
            </p>
            <button
              onClick={handleGetStarted}
              className="group px-10 py-5 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white rounded-xl font-bold text-xl transition-all shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 hover:scale-105 inline-flex items-center gap-3"
            >
              <Sparkles className="w-6 h-6" />
              Criar Minha Primeira Campanha
              <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-purple-900/20 py-8 px-6">
        <div className="max-w-7xl mx-auto text-center text-slate-400 text-sm">
          <p>© 2024 RPG Forge. Geração de campanhas com IA para mestres modernos.</p>
        </div>
      </footer>
    </div>
  );
}