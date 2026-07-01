import { useState } from 'react';
import { X, Eye, EyeOff, Loader2, ShieldCheck } from 'lucide-react';
import { loginWithBackend, registerWithBackend } from '../lib/backendLogin';
import { EcosystemButton } from './EcosystemButton';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setName('');
    setError(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (mode === 'login') {
        await loginWithBackend(email, password);
      } else {
        if (!name.trim()) {
          setError('Por favor, informe seu nome');
          setIsLoading(false);
          return;
        }

        await registerWithBackend(name, email, password);
      }

      handleClose();
      onSuccess();
      window.location.reload();
    } catch (err: any) {
      setError(err.message || 'Erro ao autenticar. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">
              {mode === 'login' ? 'Bem-vindo!' : 'Criar sua conta'}
            </h2>
            <p className="text-sm text-slate-500">
              Acesse sua carteira DocWallet
            </p>
          </div>
          <button onClick={handleClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X className="text-slate-500" size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex items-start gap-3 rounded-xl bg-blue-50 border border-blue-100 p-4">
            <ShieldCheck className="text-blue-600 mt-0.5" size={20} />
            <div>
              <p className="font-medium text-slate-800 text-sm">Login pelo backend próprio</p>
              <p className="text-slate-500 text-sm">Conta e documentos ficam no backend DocWallet. Clientes integrados também podem entrar pelo ecossistema.</p>
            </div>
          </div>

          <EcosystemButton />

          <div className="flex items-center gap-4">
            <div className="flex-1 h-px bg-slate-200"></div>
            <span className="text-slate-400 text-sm">ou</span>
            <div className="flex-1 h-px bg-slate-200"></div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Nome completo
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Seu nome"
                  required
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                E-mail
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Senha
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-primary hover:bg-primary-dark text-white rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading && <Loader2 className="animate-spin" size={20} />}
              {mode === 'login' ? 'Entrar' : 'Cadastrar'}
            </button>
          </form>
        </div>

        <div className="px-6 pb-6 text-center">
          <p className="text-slate-500 text-sm">
            {mode === 'login' ? 'Não tem uma conta?' : 'Já tem uma conta?'}
            <button
              type="button"
              onClick={() => {
                setMode(mode === 'login' ? 'register' : 'login');
                setError(null);
              }}
              className="text-primary font-medium hover:underline ml-1"
            >
              {mode === 'login' ? 'Cadastre-se' : 'Fazer login'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
