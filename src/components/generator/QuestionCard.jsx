import React from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { ArrowRight, Loader2, Wand2 } from 'lucide-react';

export default function QuestionCard({
  question,
  answer,
  onChange,
  onNext,
  isLoading,
  // Admin-only AI auto-fill props
  onAiFill,
  isAiFilling
}) {
  return (
    <div className="space-y-6">
      <div className="p-6 bg-slate-900/50 backdrop-blur-xl border border-purple-500/30 rounded-2xl">
        <h3 className="text-2xl font-bold text-white mb-2">
          {question.title}
        </h3>
        <p className="text-slate-400 mb-6">
          {question.description}
        </p>

        <div className="relative">
          <Textarea
            value={answer}
            onChange={(e) => onChange(e.target.value)}
            placeholder={question.placeholder}
            className="min-h-[150px] bg-slate-950/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-purple-500 resize-none"
          />

          {/* Botão de IA — visível apenas para admin (quando onAiFill é fornecido) */}
          {onAiFill && (
            <div className="mt-3 flex justify-end">
              <Button
                type="button"
                size="sm"
                onClick={onAiFill}
                disabled={isAiFilling || isLoading}
                className="flex items-center gap-2 bg-gradient-to-r from-amber-600/80 to-amber-700/80 hover:from-amber-500 hover:to-amber-600 text-white border border-amber-500/30 shadow-sm"
                title="Gerar resposta com IA (Admin)"
              >
                {isAiFilling ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span className="text-xs">Gerando...</span>
                  </>
                ) : (
                  <>
                    <Wand2 className="w-3.5 h-3.5" />
                    <span className="text-xs font-semibold">Responder com IA</span>
                  </>
                )}
              </Button>
            </div>
          )}
        </div>

        {question.examples && (
          <div className="mt-4 p-4 bg-purple-900/10 border border-purple-500/20 rounded-lg">
            <p className="text-sm text-purple-300 font-medium mb-2">
              💡 Exemplos:
            </p>
            <ul className="text-sm text-slate-400 space-y-1">
              {question.examples.map((example, i) => (
                <li key={i}>• {example}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="flex justify-end">
        <Button
          onClick={onNext}
          disabled={!answer.trim() || isLoading || isAiFilling}
          className="px-8 py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white rounded-xl font-semibold transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              Próxima Pergunta
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
