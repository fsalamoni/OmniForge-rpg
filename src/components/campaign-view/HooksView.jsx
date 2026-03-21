import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Anchor } from 'lucide-react';
import AIExpander from './AIExpander';

export default function HooksView({ hooks, campaignContext, systemRpg }) {
  if (!hooks || hooks.length === 0) {
    return (
      <div className="text-center py-8 text-slate-400">
        <Anchor className="w-12 h-12 mx-auto mb-3 text-slate-600" />
        <p>Nenhum gancho de plot gerado ainda. Use o gerador acima para criar ganchos.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {hooks.map((hook, index) => {
        const hookText = typeof hook === 'string' ? hook : (hook?.hook || String(hook));
        return (
          <Card key={index} className="bg-slate-900/50 border-purple-900/20">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-purple-900/20 rounded-lg shrink-0">
                  <Anchor className="w-5 h-5 text-purple-400" />
                </div>
                <div className="flex-1">
                  <p className="text-slate-200 leading-relaxed mb-3">{hookText}</p>
                  <AIExpander
                    content={hookText}
                    context={campaignContext}
                    expandType="general"
                    systemRpg={systemRpg}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
