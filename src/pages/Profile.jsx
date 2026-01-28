import React, { useState, useEffect } from 'react';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  User,
  Mail,
  Save,
  Loader2,
  Shield,
  Calendar
} from 'lucide-react';

export default function Profile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    full_name: '',
    email: ''
  });

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        setFormData({
          full_name: currentUser.full_name || '',
          email: currentUser.email || ''
        });
      } catch (error) {
        await base44.auth.redirectToLogin(createPageUrl('Profile'));
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, []);

  const updateMutation = useMutation({
    mutationFn: async (data) => {
      await base44.auth.updateMe(data);
    },
    onSuccess: () => {
      alert('Perfil atualizado com sucesso!');
      window.location.reload();
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  if (loading) {
    return (
      <div className="text-center py-16">
        <Loader2 className="w-12 h-12 text-purple-500 animate-spin mx-auto mb-4" />
        <p className="text-slate-400">Carregando perfil...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <User className="w-10 h-10 text-purple-400" />
          <h1 className="text-4xl font-bold text-white">
            Meu Perfil
          </h1>
        </div>
        <p className="text-slate-400 text-lg">
          Gerencie suas informações pessoais e preferências
        </p>
      </div>

      {/* Avatar */}
      <Card className="bg-slate-900/50 backdrop-blur-xl border-purple-900/20">
        <CardContent className="p-8">
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-600 to-amber-500 flex items-center justify-center text-white text-4xl font-bold">
              {user?.full_name?.[0] || user?.email[0].toUpperCase()}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">
                {user?.full_name || 'Usuário'}
              </h2>
              <p className="text-slate-400">{user?.email}</p>
              <div className="flex items-center gap-2 mt-2">
                <Shield className="w-4 h-4 text-purple-400" />
                <span className="text-sm text-purple-300 capitalize">
                  {user?.role || 'user'}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Formulário */}
      <Card className="bg-slate-900/50 backdrop-blur-xl border-purple-900/20">
        <CardHeader>
          <CardTitle className="text-white">Informações Pessoais</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="full_name" className="text-white mb-2 block">
                Nome Completo
              </Label>
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
              <Label htmlFor="email" className="text-white mb-2 block">
                E-mail
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  disabled
                  className="pl-10 bg-slate-950/50 border-slate-700 text-slate-500 cursor-not-allowed"
                />
              </div>
              <p className="text-xs text-slate-500 mt-1">
                O e-mail não pode ser alterado
              </p>
            </div>

            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={updateMutation.isLoading}
                className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white"
              >
                {updateMutation.isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Salvar Alterações
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Informações da Conta */}
      <Card className="bg-slate-900/50 backdrop-blur-xl border-purple-900/20">
        <CardHeader>
          <CardTitle className="text-white">Informações da Conta</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-slate-800">
            <div className="flex items-center gap-2 text-slate-300">
              <Calendar className="w-4 h-4 text-slate-500" />
              <span>Membro desde</span>
            </div>
            <span className="text-white font-medium">
              {user?.created_date 
                ? new Date(user.created_date).toLocaleDateString('pt-BR')
                : 'N/A'
              }
            </span>
          </div>

          <div className="flex items-center justify-between py-3 border-b border-slate-800">
            <div className="flex items-center gap-2 text-slate-300">
              <Shield className="w-4 h-4 text-slate-500" />
              <span>Tipo de conta</span>
            </div>
            <span className="text-white font-medium capitalize">
              {user?.role || 'user'}
            </span>
          </div>

          <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-2 text-slate-300">
              <Mail className="w-4 h-4 text-slate-500" />
              <span>E-mail verificado</span>
            </div>
            <span className="text-green-400 font-medium">
              Sim
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}