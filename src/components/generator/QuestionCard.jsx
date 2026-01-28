import React from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { ArrowRight, Loader2 } from 'lucide-react';

export default function QuestionCard({ 
  question, 
  answer, 
  onChange, 
  onNext, 
  isLoading 
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
        
        <Textarea
          value={answer}
          onChange={(e) => onChange(e.target.value)}
          placeholder={question.placeholder}
          className="min-h-[150px] bg-slate-950/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-purple-500 resize-none"
        />

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
          disabled={!answer.trim() || isLoading}
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