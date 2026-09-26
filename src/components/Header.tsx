import {
  Wallet,
  Plus,
  Search,
  User,
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
  LogOut,
  Brain,
  Zap,
  FileSignature,
  ShieldCheck,
} from 'lucide-react';
import { BackendUser } from '../lib/backendSession';
import { AppLink } from '../lib/navigation';

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

export const DocumentTypeIcon: React.FC<DocumentTypeIconProps> = ({ iconName, className = '', size = 24 }) => {
  const IconComponent = iconMap[iconName] || File;
  return <IconComponent className={className} size={size} />;
};

interface HeaderProps {
  onAddClick: () => void;
  user?: BackendUser | null;
  onLogout?: () => void;
  currentPath?: string;
}

const navItems = [
  { href: '/', label: 'Documentos', Icon: Wallet },
  { href: '/inteligencia', label: 'Inteligência', Icon: Brain },
  { href: '/docflow', label: 'Fluxos', Icon: Zap },
  { href: '/assinaturas', label: 'Assinar', Icon: FileSignature },
  { href: '/validar-documento', label: 'Confiança', Icon: ShieldCheck },
];

export const Header: React.FC<HeaderProps> = ({ onAddClick, user, onLogout, currentPath = window.location.pathname }) => {
  const userInitial = user?.email?.[0]?.toUpperCase() || 'U';
  const userLabel = user?.email?.split('@')[0] || 'Conta';

  const active = (href: string) => href === '/' ? currentPath === '/' : currentPath === href || currentPath.startsWith(`${href}/`);

  return (
    <header className="bg-white/95 backdrop-blur border-b border-slate-200 sticky top-0 z-40 safe-top">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          <AppLink href="/" className="flex items-center gap-3 shrink-0 min-w-0">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary-dark rounded-xl flex items-center justify-center shadow-md shrink-0">
              <Wallet className="text-white" size={22} />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 truncate">DocWallet</h1>
              <p className="text-xs text-slate-500 truncate">documentos → processos → confiança</p>
            </div>
          </AppLink>

          <nav className="hidden lg:flex items-center gap-1 rounded-2xl bg-slate-50 border border-slate-100 p-1">
            {navItems.map(({ href, label, Icon }) => (
              <AppLink
                key={href}
                href={href}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-colors ${active(href) ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-950 hover:bg-white/70'}`}
              >
                <Icon size={15} /> {label}
              </AppLink>
            ))}
          </nav>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onAddClick}
              className="hidden sm:flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-full font-medium transition-all duration-200 hover:shadow-lg active:scale-95"
            >
              <Plus size={18} />
              <span>{user ? 'Adicionar' : 'Entrar'}</span>
            </button>

            {user ? (
              <div className="flex items-center gap-2">
                <div className="hidden sm:flex flex-col items-end">
                  <span className="text-sm font-medium text-slate-700 max-w-[170px] truncate">{userLabel}</span>
                  <button type="button" onClick={onLogout} className="text-xs text-slate-500 hover:text-red-500 transition-colors flex items-center gap-1">
                    <LogOut size={12} /> Sair
                  </button>
                </div>
                <div className="min-w-11 min-h-11 w-11 h-11 bg-secondary text-white rounded-full flex items-center justify-center shadow-sm" title={user.email}>
                  <span className="font-semibold">{userInitial}</span>
                </div>
                <button type="button" onClick={onLogout} className="sm:hidden min-h-11 px-3 rounded-full border border-slate-200 text-slate-700 bg-white flex items-center gap-1 text-sm font-semibold active:scale-95" aria-label="Sair da conta">
                  <LogOut size={16} /> Sair
                </button>
              </div>
            ) : (
              <button type="button" onClick={onAddClick} className="w-11 h-11 bg-slate-100 rounded-full flex items-center justify-center active:scale-95" aria-label="Entrar ou cadastrar">
                <User className="text-slate-600" size={20} />
              </button>
            )}
          </div>
        </div>

        <nav className="lg:hidden flex items-center gap-2 overflow-x-auto pb-3 -mt-1 text-xs font-bold">
          {navItems.map(({ href, label, Icon }) => (
            <AppLink
              key={href}
              href={href}
              className={`shrink-0 inline-flex items-center gap-1 px-3 py-2 rounded-full ${active(href) ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700'}`}
            >
              <Icon size={14} /> {label}
            </AppLink>
          ))}
        </nav>
      </div>
    </header>
  );
};

export const Hero: React.FC<{ documentCount: number; onAddClick: () => void }> = ({ documentCount, onAddClick }) => (
  <section className="bg-gradient-to-br from-primary via-primary-dark to-indigo-700 py-8 px-4">
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-indigo-200 text-xs font-bold uppercase tracking-[0.18em] mb-2">Seu workspace documental</p>
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">Da entrada do documento até a prova final.</h2>
          <p className="text-indigo-100">{documentCount > 0 ? `${documentCount} documento${documentCount > 1 ? 's' : ''} no workspace` : 'Adicione seu primeiro documento para começar'}</p>
        </div>
        <button onClick={onAddClick} className="sm:hidden flex items-center justify-center gap-2 bg-white text-primary px-6 py-3 rounded-full font-semibold transition-all duration-200 hover:shadow-lg active:scale-95 w-full">
          <Plus size={20} /> Adicionar documento
        </button>
      </div>
    </div>
  </section>
);

export const SearchBar: React.FC<{ value: string; onChange: (value: string) => void }> = ({ value, onChange }) => (
  <div className="bg-white mx-4 sm:mx-6 lg:mx-8 -mt-6 rounded-xl shadow-card p-1 flex items-center gap-2">
    <Search className="text-slate-400 ml-3" size={20} />
    <input type="text" placeholder="Buscar documentos..." value={value} onChange={(e) => onChange(e.target.value)} className="flex-1 py-3 px-2 outline-none text-slate-700 placeholder-slate-400 bg-transparent" />
    {value && <button onClick={() => onChange('')} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X className="text-slate-400" size={16} /></button>}
  </div>
);

export { Wallet, Plus, Search };
