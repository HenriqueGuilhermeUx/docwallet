import { useEffect, useState } from 'react';
import { ExternalLink, RefreshCw, ShieldCheck } from 'lucide-react';
import { BlockchainCertificate, listCertificates } from '../lib/certificates';

const certId = (item: BlockchainCertificate) => item.certificate_id || item.id || '';
const certName = (item: BlockchainCertificate) => item.document_name || item.file_name || 'Documento certificado';
const shortHash = (value?: string) => value ? `${value.slice(0, 10)}...${value.slice(-8)}` : 'sem hash';

export function CertificateHistoryPanel() {
  const [items, setItems] = useState<BlockchainCertificate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await listCertificates();
      setItems(data.slice(0, 5));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nao foi possivel carregar certificados.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <section className="max-w-6xl mx-auto px-4 mb-6">
      <div className="bg-white rounded-3xl border border-slate-100 shadow-card p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center"><ShieldCheck size={24} /></div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">Historico de certificados</h3>
              <p className="text-sm text-slate-500">Ultimos documentos e contratos com prova de integridade registrada.</p>
            </div>
          </div>
          <button onClick={load} className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-200">
            <RefreshCw size={16} /> Atualizar
          </button>
        </div>

        {isLoading && <p className="mt-5 text-sm text-slate-500">Carregando certificados...</p>}
        {error && <p className="mt-5 text-sm text-amber-700 bg-amber-50 rounded-xl p-3">{error}</p>}

        {!isLoading && !error && items.length === 0 && (
          <div className="mt-5 bg-slate-50 rounded-2xl p-5 text-sm text-slate-500">
            Nenhum certificado encontrado ainda. Valide um documento ou registre o hash final de um contrato assinado.
          </div>
        )}

        {items.length > 0 && (
          <div className="mt-5 grid gap-3">
            {items.map((item, index) => {
              const id = certId(item);
              return (
                <div key={id || index} className="rounded-2xl border border-slate-100 p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">{certName(item)}</p>
                    <p className="text-xs text-slate-500 mt-1">Hash: {shortHash(item.file_hash)}</p>
                    {item.created_at && <p className="text-xs text-slate-400 mt-1">Criado em: {new Date(item.created_at).toLocaleString('pt-BR')}</p>}
                  </div>
                  {id && (
                    <a href={`/cert/${id}`} className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700">
                      Abrir certificado <ExternalLink size={15} />
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
