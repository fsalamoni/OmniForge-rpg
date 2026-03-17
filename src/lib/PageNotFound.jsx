import { useLocation } from 'react-router-dom';

export default function PageNotFound() {
  const location = useLocation();
  const pageName = location.pathname.substring(1);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-950">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="space-y-2">
          <h1 className="text-7xl font-light text-slate-600">404</h1>
          <div className="h-0.5 w-16 bg-slate-700 mx-auto"></div>
        </div>
        <div className="space-y-3">
          <h2 className="text-2xl font-medium text-white">Página não encontrada</h2>
          <p className="text-slate-400 leading-relaxed">
            A página <span className="font-medium text-slate-300">"{pageName}"</span> não existe nesta aplicação.
          </p>
        </div>
        <div className="pt-6">
          <button
            onClick={() => window.location.href = '/'}
            className="inline-flex items-center px-6 py-3 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
          >
            Voltar ao Início
          </button>
        </div>
      </div>
    </div>
  );
}
