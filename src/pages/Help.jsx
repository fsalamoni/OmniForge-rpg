import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { HelpContent } from '@/firebase/db';
import {
  HelpCircle,
  BookOpen,
  Sparkles,
  Copy,
  Target,
  ChevronDown,
  ChevronUp,
  Award,
  Play,
  Youtube,
  ExternalLink
} from 'lucide-react';

const FAQItem = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div
      className="p-4 bg-slate-900/50 backdrop-blur-xl border border-purple-900/20 hover:border-purple-500/50 rounded-xl transition-all cursor-pointer"
      onClick={() => setIsOpen(!isOpen)}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-white font-semibold flex-1">{question}</h3>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-purple-400 flex-shrink-0 ml-4" />
        ) : (
          <ChevronDown className="w-5 h-5 text-slate-400 flex-shrink-0 ml-4" />
        )}
      </div>
      {isOpen && (
        <p className="text-slate-300 mt-3 leading-relaxed">
          {answer}
        </p>
      )}
    </div>
  );
};

function ShowcaseSection() {
  const [activeVideo, setActiveVideo] = useState(0);
  const defaults = HelpContent.defaultContent();

  const { data: content } = useQuery({
    queryKey: ['helpShowcase'],
    queryFn: () => HelpContent.get(),
    staleTime: 5 * 60 * 1000,
  });

  const showcase = content || defaults;
  const videos = showcase.videos || defaults.videos;
  const current = videos[activeVideo] || videos[0];

  if (!current) return null;

  return (
    <Card className="overflow-hidden bg-gradient-to-br from-slate-900/80 via-purple-950/40 to-slate-900/80 backdrop-blur-xl border-purple-500/30 shadow-lg shadow-purple-900/10">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-3 mb-1">
          <div className="p-2.5 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl shadow-lg shadow-amber-900/30">
            <Award className="w-6 h-6 text-white" />
          </div>
          <CardTitle className="text-2xl text-white">{showcase.title || defaults.title}</CardTitle>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Texto descritivo */}
        <div className="text-slate-300 leading-relaxed whitespace-pre-line text-[0.95rem]">
          {showcase.description || defaults.description}
        </div>

        {/* Player principal */}
        <div className="space-y-4">
          <div className="relative w-full rounded-xl overflow-hidden border border-purple-500/20 shadow-xl shadow-purple-900/20 bg-black">
            <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
              <iframe
                className="absolute inset-0 w-full h-full"
                src={`https://www.youtube.com/embed/${current.videoId}?rel=0`}
                title={current.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>

          {/* Info do vídeo atual */}
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 p-2 bg-red-600/20 rounded-lg">
              <Youtube className="w-5 h-5 text-red-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-white font-semibold leading-tight">{current.title}</h4>
              <p className="text-slate-400 text-sm mt-1">{current.description}</p>
              <p className="text-slate-500 text-xs mt-2 flex items-center gap-1.5">
                <span className="inline-block w-1.5 h-1.5 bg-red-500 rounded-full" />
                Canal: <span className="text-slate-400 font-medium">{current.channel}</span>
                <span className="mx-1">|</span>
                Todos os direitos reservados ao autor original
              </p>
            </div>
            <a
              href={`https://www.youtube.com/watch?v=${current.videoId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-shrink-0 p-2 text-slate-400 hover:text-white transition-colors"
              title="Abrir no YouTube"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Seletor de vídeos */}
        {videos.length > 1 && (
          <div className="space-y-3">
            <p className="text-sm font-medium text-slate-400 uppercase tracking-wider">
              Mais vídeos sobre o tema
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {videos.map((video, idx) => (
                <button
                  key={video.videoId}
                  onClick={() => setActiveVideo(idx)}
                  className={`group relative rounded-xl overflow-hidden border transition-all text-left ${
                    idx === activeVideo
                      ? 'border-purple-500 ring-1 ring-purple-500/50 shadow-lg shadow-purple-900/20'
                      : 'border-slate-700/50 hover:border-purple-500/50'
                  }`}
                >
                  {/* Thumbnail */}
                  <div className="relative aspect-video bg-slate-800">
                    <img
                      src={`https://img.youtube.com/vi/${video.videoId}/mqdefault.jpg`}
                      alt={video.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    {idx !== activeVideo && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 group-hover:bg-black/20 transition-colors">
                        <Play className="w-8 h-8 text-white/80 group-hover:text-white group-hover:scale-110 transition-all" />
                      </div>
                    )}
                    {idx === activeVideo && (
                      <div className="absolute top-2 left-2 px-2 py-0.5 bg-purple-600 rounded text-[0.65rem] font-bold text-white uppercase tracking-wide">
                        Reproduzindo
                      </div>
                    )}
                  </div>
                  {/* Título */}
                  <div className="p-2.5 bg-slate-900/80">
                    <p className={`text-xs font-medium leading-tight line-clamp-2 ${
                      idx === activeVideo ? 'text-purple-300' : 'text-slate-300 group-hover:text-white'
                    }`}>
                      {video.title}
                    </p>
                    <p className="text-[0.65rem] text-slate-500 mt-1">{video.channel}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function Help() {
  const faqs = [
    {
      question: 'O que é a metodologia 5W2H?',
      answer: '5W2H é uma técnica de perguntas estruturadas que ajuda a extrair informações completas sobre uma situação. As 7 perguntas cobrem: What (O quê?), Why (Por quê?), Where (Onde?), When (Quando?), Who (Quem?), How (Como?) e How Much (Quanto?). Nossa IA usa essas respostas para criar campanhas detalhadas e coerentes.'
    },
    {
      question: 'Qual nível de criatividade devo usar?',
      answer: 'Nível 0-1: Para sistemas com regras rígidas (D&D 5e, Pathfinder) onde você quer fidelidade total. Nível 2-3: Para um equilíbrio entre suas ideias e criatividade da IA. Nível 4-5: Para campanhas experimentais onde você quer que a IA tenha liberdade criativa máxima.'
    },
    {
      question: 'Posso editar uma campanha depois de gerada?',
      answer: 'Sim! Você pode editar as informações básicas da campanha, adicionar notas do mestre e modificar a visibilidade (pública/privada) a qualquer momento.'
    },
    {
      question: 'O que acontece quando clono uma campanha?',
      answer: 'Ao clonar uma campanha da biblioteca, você cria uma cópia privada completa (incluindo todos os NPCs e conteúdo). A cópia é independente - você pode editá-la sem afetar o original. O criador original verá que sua campanha foi clonada.'
    },
    {
      question: 'Como funcionam as campanhas públicas?',
      answer: 'Campanhas públicas aparecem na Biblioteca para toda comunidade. Outros usuários podem visualizá-las e cloná-las. Você mantém a autoria original e pode torná-la privada novamente a qualquer momento.'
    },
    {
      question: 'Os NPCs são balanceados para meu grupo?',
      answer: 'Sim! A IA considera o número de jogadores que você informou e o sistema de RPG escolhido para criar encontros e NPCs balanceados. Os atributos seguem as regras do sistema selecionado.'
    },
    {
      question: 'Posso usar campanhas para sistemas personalizados?',
      answer: 'Sim! Selecione "Outro" como sistema e descreva as características nas respostas 5W2H. A IA adaptará a campanha para um sistema genérico que você pode ajustar.'
    },
    {
      question: 'As campanhas ficam salvas permanentemente?',
      answer: 'Sim, todas as suas campanhas (completas ou em andamento) ficam salvas na sua conta. Você pode acessá-las a qualquer momento na seção "Minhas Campanhas".'
    }
  ];

  const tools = [
    {
      icon: Sparkles,
      title: 'Interrogatório 5W2H',
      description: '7 perguntas sequenciais que definem a espinha dorsal da aventura',
      tip: 'Seja específico no "Why" (Motivação). Isso define se a campanha será sombria ou heroica.'
    },
    {
      icon: Target,
      title: 'Nível de Criatividade',
      description: 'Escala de 0 (Fiel ao input) a 5 (Liberdade total da IA)',
      tip: 'Use o nível 1 ou 2 para sistemas com regras rígidas. Use 5 para aventuras de fantasia épica.'
    },
    {
      icon: BookOpen,
      title: 'Biblioteca',
      description: 'Repositório de campanhas da comunidade',
      tip: 'Clone aventuras de outros usuários para ver como eles responderam ao 5W2H e aprenda novas técnicas.'
    },
    {
      icon: Copy,
      title: 'Clonagem',
      description: 'Cria uma cópia privada de uma campanha pública',
      tip: 'Personalize campanhas clonadas para seu grupo específico de jogadores.'
    }
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <HelpCircle className="w-10 h-10 text-purple-400" />
          <h1 className="text-4xl font-bold text-white">
            Central de Ajuda
          </h1>
        </div>
        <p className="text-slate-400 text-lg">
          Aprenda a usar todas as funcionalidades da plataforma
        </p>
      </div>

      {/* Seção de Destaque — Inspiração e Metodologia */}
      <ShowcaseSection />

      {/* Ferramentas e Dicas */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-6">
          Ferramentas e Dicas
        </h2>
        <div className="grid md:grid-cols-2 gap-6">
          {tools.map((tool, index) => {
            const Icon = tool.icon;
            return (
              <Card key={index} className="bg-slate-900/50 backdrop-blur-xl border-purple-900/20 hover:border-purple-500/50 transition-all">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-3 bg-gradient-to-br from-purple-600 to-amber-500 rounded-xl">
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <CardTitle className="text-white">{tool.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-slate-300 text-sm">
                    {tool.description}
                  </p>
                  <div className="p-3 bg-purple-900/10 border border-purple-500/20 rounded-lg">
                    <p className="text-purple-300 text-sm">
                      <span className="font-semibold">💡 Dica: </span>
                      {tool.tip}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Guia Passo a Passo */}
      <Card className="bg-slate-900/50 backdrop-blur-xl border-purple-900/20">
        <CardHeader>
          <CardTitle className="text-white text-2xl">Como Criar uma Campanha</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            {
              step: '1',
              title: 'Escolha o Sistema e Ambientação',
              description: 'Selecione seu sistema de RPG favorito (D&D 5e, Ordem Paranormal, etc.) e o tipo de história que deseja contar (Fantasia, Cyberpunk, Terror, etc.)'
            },
            {
              step: '2',
              title: 'Responda às Perguntas 5W2H',
              description: 'Nossa IA faz 7 perguntas estratégicas para entender sua visão. Seja detalhado nas respostas - quanto mais informação, melhor o resultado!'
            },
            {
              step: '3',
              title: 'Ajuste a Criatividade',
              description: 'Escolha o nível de liberdade criativa da IA (de 0 a 5). Nível baixo = fiel às suas respostas. Nível alto = IA pode adicionar reviravoltas.'
            },
            {
              step: '4',
              title: 'Receba Sua Campanha Completa',
              description: 'A IA gera uma campanha com resumo da trama, ganchos de aventura, NPCs com fichas completas e encontros balanceados para seu grupo.'
            }
          ].map((item) => (
            <div key={item.step} className="flex gap-4 items-start p-4 bg-slate-950/50 rounded-lg">
              <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-purple-600 to-amber-500 rounded-xl flex items-center justify-center text-white font-black text-lg">
                {item.step}
              </div>
              <div className="flex-1">
                <h3 className="text-white font-semibold mb-1">{item.title}</h3>
                <p className="text-slate-400 text-sm">{item.description}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* FAQ */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-6">
          Perguntas Frequentes
        </h2>
        <div className="space-y-3">
          {faqs.map((faq, index) => (
            <FAQItem key={index} question={faq.question} answer={faq.answer} />
          ))}
        </div>
      </div>

      {/* Contato */}
      <Card className="bg-gradient-to-br from-purple-900/30 to-slate-900/30 backdrop-blur-xl border-purple-500/30">
        <CardContent className="p-8 text-center">
          <HelpCircle className="w-12 h-12 text-purple-400 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-white mb-2">
            Ainda tem dúvidas?
          </h3>
          <p className="text-slate-300 mb-4">
            Explore a biblioteca para ver exemplos de campanhas criadas por outros usuários
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
