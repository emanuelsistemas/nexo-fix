import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Bug, Eye, EyeOff, X } from 'lucide-react';
import { toast } from 'react-toastify';

type AuthMode = 'login' | 'register';

export function Auth() {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [showAdminPasswordField, setShowAdminPasswordField] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === 'register') {
        if (password !== confirmPassword) {
          toast.error('As senhas não coincidem!');
          setLoading(false);
          return;
        }
        
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
            },
          },
        });
        
        if (signUpError) throw signUpError;
        toast.success('Cadastro realizado com sucesso!');
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (signInError) throw signInError;
        toast.success('Login realizado com sucesso!');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Ocorreu um erro');
    } finally {
      setLoading(false);
    }
  };

  const handleModeChange = (newMode: AuthMode) => {
    if (newMode === 'register') {
      setShowAdminModal(true);
    } else {
      setMode(newMode);
    }
  };

  const handleAdminPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPassword === import.meta.env.VITE_ADMIN_PASSWORD) {
      setMode('register');
      setShowAdminModal(false);
      setAdminPassword('');
      toast.success('Verificação de administrador bem-sucedida!');
    } else {
      toast.error('Senha de administrador incorreta!');
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="flex flex-col items-center mb-8">
          <Bug className="w-12 h-12 text-indigo-500 mb-4" />
          <h1 className="text-4xl font-bold text-white logo-text">nexo-fix</h1>
        </div>

        <div className="bg-gray-800 rounded-lg p-8">
          <div className="flex gap-4 mb-8">
            <button
              onClick={() => handleModeChange('login')}
              className={`flex-1 py-2 px-4 rounded-lg transition-colors ${
                mode === 'login'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              Login
            </button>
            <button
              onClick={() => handleModeChange('register')}
              className={`flex-1 py-2 px-4 rounded-lg transition-colors ${
                mode === 'register'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              Cadastro
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            {mode === 'register' && (
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">
                  Nome completo
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-gray-700 rounded-lg px-4 py-2 text-white"
                  required
                />
              </div>
            )}
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                E-mail
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-gray-700 rounded-lg px-4 py-2 text-white"
                required
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                Senha
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-gray-700 rounded-lg px-4 py-2 text-white pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {mode === 'register' && (
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">
                  Confirmar Senha
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-gray-700 rounded-lg px-4 py-2 text-white pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Carregando...' : mode === 'login' ? 'Entrar' : 'Cadastrar'}
            </button>
          </form>
        </div>
      </div>

      {/* Modal de Senha de Administrador */}
      {showAdminModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md relative">
            <button
              onClick={() => {
                setShowAdminModal(false);
                setAdminPassword('');
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-300"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-xl font-bold mb-4">Verificação de Administrador</h2>
            <p className="text-gray-300 mb-4">Digite a senha de administrador para continuar com o cadastro.</p>

            <form onSubmit={handleAdminPasswordSubmit}>
              <div className="mb-4">
                <div className="relative">
                  <input
                    type={showAdminPasswordField ? "text" : "password"}
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    className="w-full bg-gray-700 rounded-lg px-4 py-2 text-white pr-10"
                    placeholder="Senha de administrador"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowAdminPasswordField(!showAdminPasswordField)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
                  >
                    {showAdminPasswordField ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg"
                >
                  Verificar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAdminModal(false);
                    setAdminPassword('');
                  }}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}