import { Shield, FileText, Lock, Sparkles } from 'lucide-react';

interface BannerBlockchainProps {
  onLearnMore?: () => void;
}

export const BannerBlockchain: React.FC<BannerBlockchainProps> = ({ onLearnMore }) => {
  return (
    <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 p-6 rounded-2xl shadow-lg mb-6">
      <div className="flex flex-col md:flex-row items-center gap-6">
        <div className="flex-shrink-0">
          <div className="w-20 h-20 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center">
            <Shield className="text-white" size={40} />
          </div>
        </div>

        <div className="flex-1 text-center md:text-left">
          <h3 className="text-xl font-bold text-white mb-2">
            Prova digital para seus documentos
          </h3>
          <p className="text-white/90 text-sm md:text-base mb-4">
            Guarde seus documentos sem custo de upload. A prova digital é um recurso opcional para quem deseja gerar evidências de data, autenticidade e integridade.
          </p>

          <div className="flex flex-wrap justify-center md:justify-start gap-3">
            <button
              onClick={onLearnMore}
              className="px-5 py-2.5 bg-white text-primary rounded-full font-semibold text-sm hover:bg-white/90 transition-colors flex items-center gap-2"
            >
              <Lock size={16} />
              Saiba Mais
            </button>
            <button
              onClick={onLearnMore}
              className="px-5 py-2.5 bg-white/20 backdrop-blur text-white rounded-full font-semibold text-sm hover:bg-white/30 transition-colors flex items-center gap-2 border border-white/30"
            >
              <Sparkles size={16} />
              Recursos extras
            </button>
          </div>
        </div>

        <div className="hidden lg:flex gap-3">
          <div className="bg-white/10 backdrop-blur rounded-xl p-4 text-center min-w-[100px]">
            <div className="text-2xl font-bold text-white">Upload grátis</div>
            <div className="text-white/70 text-xs">documentos ilimitados*</div>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-xl p-4 text-center min-w-[100px]">
            <div className="text-2xl font-bold text-white">Polygon</div>
            <div className="text-white/70 text-xs">rede rapida</div>
          </div>
        </div>
      </div>
    </div>
  );
};
