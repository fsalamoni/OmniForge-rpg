import React from 'react';
import { CheckCircle2, Circle } from 'lucide-react';

export default function ProgressBar({ currentStep, totalSteps }) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-slate-400">
          Progresso
        </span>
        <span className="text-sm font-medium text-purple-400">
          Etapa {currentStep + 1} de {totalSteps}
        </span>
      </div>
      
      <div className="relative">
        <div className="h-2 bg-slate-900/50 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-purple-600 to-purple-500 transition-all duration-500 ease-out"
            style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
          />
        </div>
        
        <div className="flex justify-between mt-4">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div key={i} className="flex flex-col items-center">
              {i <= currentStep ? (
                <CheckCircle2 className="w-5 h-5 text-purple-400" />
              ) : (
                <Circle className="w-5 h-5 text-slate-600" />
              )}
              <span className={`text-xs mt-1 ${
                i <= currentStep ? 'text-purple-400' : 'text-slate-600'
              }`}>
                {i + 1}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}