import { useState } from 'react';
import { Copy, FileSignature, Loader2, Send, X } from 'lucide-react';
import { createSignatureRequest, publicSignUrl, SignatureRequest } from '../lib/signatures';

interface SignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SignatureModal: React.FC<SignatureModalProps> = ({ isOpen, onClose }) => {
  const [title, setTitle] = useState('Contrato DocWallet');
  const [content, setContent] = useState('');
  const [partyA, setPartyA] = useState('');
  const [emailA, setEmailA] = useState('');
  const [partyB, setPartyB] = useState('');
  const [emailB, setEmailB] = useState('');
  const [request, setRequest] = useState<SignatureRequest | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreate = async () => {
    setError('');
    setLoading(true);
    try {
      const created = await createSignatureRequest({
        title,
        contractContent: content,
        parties: [
          { name: partyA, email: emailA },
          { name: partyB, email: emailB },
        ].filter((item) => item.name.trim()),
      });
      setRequest(created);
    } catch (err: any) {
      setError(err?.message || 'Erro ao criar solicitação.');
    } finally {
      setLoading(false);
    }
  };

  const copy = (value: string) => navigator.clipboard.writeText(value).catch(() => undefined);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm overflow-y-auto">
      <div className="min-h-screen py-8 px-4 flex items-start justify-center">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center"><FileSignature className="text-white" size={26} /></div>
              <div>
                <h2 className="text-2xl font-bold text-white">Assinatura eletrônica DocWallet</h2>
                <p className="text-white/80 text-sm">Uma parte assina, envia para a outra, e no final o contrato ganha hash final.</p>
              </div>
            </div>
            <button onClick={onClose} className="text-white/80 hover:text-white"><X size={24} /></button>
          </div>

          <div className="p-6 grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-slate-700">Título</label>
                <input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1 w-full border border-slate-300 rounded-xl px-4 py-3" />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700">Contrato</label>
                <textarea value={content} onChange={(e) => setContent(e.target.value)} className="mt-1 w-full border border-slate-300 rounded-xl px-4 py-3 min-h-[240px]" placeholder="Cole aqui o contrato gerado no DocWallet ou seu texto final." />
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <input value={partyA} onChange={(e) => setPartyA(e.target.value)} className="border border-slate-300 rounded-xl px-4 py-3" placeholder="Nome Parte A" />
                <input value={emailA} onChange={(e) => setEmailA(e.target.value)} className="border border-slate-300 rounded-xl px-4 py-3" placeholder="E-mail Parte A" />
                <input value={partyB} onChange={(e) => setPartyB(e.target.value)} className="border border-slate-300 rounded-xl px-4 py-3" placeholder="Nome Parte B" />
                <input value={emailB} onChange={(e) => setEmailB(e.target.value)} className="border border-slate-300 rounded-xl px-4 py-3" placeholder="E-mail Parte B" />
              </div>
              {error && <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm">{error}</div>}
              <button onClick={handleCreate} disabled={loading || !content || !partyA} className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold disabled:opacity-50 flex items-center justify-center gap-2">
                {loading ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
                Criar links de assinatura
              </button>
            </div>

            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
              {!request ? (
                <div className="text-slate-500 text-sm space-y-3">
                  <p className="font-semibold text-slate-700">Como funciona:</p>
                  <p>1. Crie a solicitação.</p>
                  <p>2. Envie o link da Parte A.</p>
                  <p>3. Depois envie o link da Parte B.</p>
                  <p>4. Quando todos assinarem, o DocWallet gera o hash final assinado.</p>
                  <p>5. Aí você pode validar esse hash final em blockchain.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-slate-500">Status</p>
                    <p className="font-bold text-slate-800">{request.status}</p>
                  </div>
                  <div className="rounded-xl bg-white border border-slate-200 p-3">
                    <p className="text-xs text-slate-500 mb-1">Hash original</p>
                    <p className="text-xs font-mono break-all text-slate-700">{request.content_hash}</p>
                  </div>
                  {request.parties.map((party) => {
                    const url = publicSignUrl(party.code || '');
                    return (
                      <div key={party.id} className="bg-white border border-slate-200 rounded-xl p-4">
                        <p className="font-semibold text-slate-800">{party.name}</p>
                        <p className="text-sm text-slate-500">{party.email}</p>
                        <div className="mt-3 flex gap-2">
                          <input value={url} readOnly className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-xs" />
                          <button onClick={() => copy(url)} className="px-3 py-2 rounded-lg bg-slate-900 text-white"><Copy size={16} /></button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
