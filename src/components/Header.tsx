import {
  Wallet,
  Plus,
  Search,
  User,
  Menu,
  X,
  CreditCard,
  Car,
  Fingerprint,
  Plane,
  CheckSquare,
  Briefcase,
  Heart,
  Syringe,
  FileText,
  File,
  LogOut
} from 'lucide-react';
import { BackendUser } from '../lib/backendSession';

const iconMap: Record<string, React.FC<{ className?: string }>> = {
  'id-card': CreditCard,
  'car': Car,
  'fingerprint': Fingerprint,
  'plane': Plane,
  'check-square': CheckSquare,
  'briefcase': Briefcase,
  'heart': Heart,
  'syringe': Syringe,
  'file-text': FileText,
  'file': File,
};

interface DocumentTypeIconProps {
  iconName: string;
  className?: string;
  size?: number;
}

export const DocumentTypeIcon: React.FC<DocumentTypeIconProps> = ({
  iconName,
  className = '',
  size = 24
}) => {
  const IconComponent = iconMap[iconName] || File;
  return <IconComponent className={className} size={size} />;
};

interface HeaderProps {
  onAddClick: () => void;
  user?: BackendUser | null;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onAddClick, user, onLogout }) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary-dark rounded-xl flex items-center justify-center shadow-md">
              <Wallet className="text-white" size={22} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">DocWallet</h1>
              <p className="text-xs text-slate-500">standalone</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onAddClick}
              className="hidden sm:flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-full font-medium transition-all duration-200 hover:shadow-lg active:scale-95"
            >
              <Plus size={18} />
              <span>Adicionar</span>
            </button>

            {user ? (
              <div className="flex items-center gap-2">
                <div className="hidden sm:flex flex-col items-end">
                  <span className="text-sm font-medium text-slate-700">
                    {user.email?.split('@')[0]}
                  </span>
                  <button
                    onClick={onLogout}
                    className="text-xs text-slate-500 hover:text-red-500 transition-colors flex items-center gap-1"
                  >
                    <LogOut size={12} />
                    Sair
                  </button>
                </div>
                <div className="w-10 h-10 bg-secondary text-white rounded-full flex items-center justify-center">
                  <span className="font-semibold">{user.email?.[0]?.toUpperCase()}</span>
                </div>
              </div>
            ) : (
              <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
                <User className="text-slate-600" size={20} />
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export const Hero: React.FC<{ documentCount: number; onAddClick: () => void }> = ({
  documentCount,
  onAddClick
}) => {
  return (
    <section className="bg-gradient-to-br from-primary via-primary-dark to-indigo-700 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
              Identidade e documentos sob seu controle
            </h2>
            <p className="text-indigo-100">
              {documentCount > 0
                ? `${documentCount} documento${documentCount > 1 ? 's' : ''} salvo${documentCount > 1 ? 's' : ''}`
                : 'Adicione seus primeiros documentos'
              }
            </p>
          </div>
          <button
            onClick={onAddClick}
            className="sm:hidden flex items-center justify-center gap-2 bg-white text-primary px-6 py-3 rounded-full font-semibold transition-all duration-200 hover:shadow-lg active:scale-95 w-full"
          >
            <Plus size={20} />
            <span>Adicionar Documento</span>
          </button>
        </div>
      </div>
    </section>
  );
};

export const SearchBar: React.FC<{
  value: string;
  onChange: (value: string) => void
}> = ({ value, onChange }) => {
  return (
    <div className="bg-white mx-4 sm:mx-6 lg:mx-8 -mt-6 rounded-xl shadow-card p-1 flex items-center gap-2">
      <Search className="text-slate-400 ml-3" size={20} />
      <input
        type="text"
        placeholder="Buscar documentos..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 py-3 px-2 outline-none text-slate-700 placeholder-slate-400 bg-transparent"
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="p-2 hover:bg-slate-100 rounded-full transition-colors"
        >
          <X className="text-slate-400" size={16} />
        </button>
      )}
    </div>
  );
};

export { Wallet, Plus, Search };
