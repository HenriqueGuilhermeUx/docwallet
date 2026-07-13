import { useMemo, useState } from 'react';
import { FileCheck, Hash, ShieldCheck, UploadCloud } from 'lucide-react';

const toHex = (buffer: ArrayBuffer) => {
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
};

export function FreeHashValidatorPage() {
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState<number | null>(null);
  const [hash, setHash] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const fileSizeLabel = useMemo(() => {
    if (!fileSize) return '';
    if (fileSize < 1024 * 1024) return `${Math.round(fileSize / 1024)} KB`;
    return `${(fileSize / 1024 / 1024).toFixed(2)} MB`;
  }, [fileSize]);

  const handleFile = async (file?: File) => {
    if (!file) return;
    setError('');
    setHash('');
    setFileName(file.name);
    setFileSize(file.size);
    setIsLoading(true);

    try {
      const buffer = await file.arrayBuffer();
      const digest = await window.crypto.subtle.digest('SHA-256', buffer);
      setHash(toHex(digest));
    } catch {
      setError('Nao foi possivel calcular o hash deste arquivo neste navegador.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-slate-950 text-white border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 py-6 flex items-center justify-between">
          <a href="/" className="flex items-center gap-3">
            <div className="w-11 h-11 bg-indigo-600 rounded-xl flex items-center justify-center"><ShieldCheck size={22} /></div>
            <div>
              <p className="font-bold text-lg">DocWallet</p>
              <p className="text-xs text-slate-400">Validar documento gratis</p>
            </div>
          </a>
          <a href="/" className="text-sm text-slate-300 hover:text-white">Voltar</a>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-10 grid lg:grid-cols-[1fr_0.8fr] gap-8 items-start">
        <section className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8">
          <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-sm font-semibold mb-4">
            <Hash size={16} /> SHA-256 local
          </div>
          <h1 className="text-4xl font-bold text-slate-900 leading-tight">Valide a integridade de um documento gratuitamente.</h1>
          <p className="text-slate-600 mt-4 text-lg leading-relaxed">
            Escolha um arquivo e o DocWallet calcula a impressao digital SHA-256 diretamente no seu navegador. O arquivo nao precisa ser enviado para o servidor para gerar o hash.
          </p>

          <label className="mt-8 border-2 border-dashed border-indigo-200 bg-indigo-50/50 rounded-3xl p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-indigo-50 transition-colors">
            <UploadCloud className="text-indigo-600 mb-3" size={42} />
            <span className="font-bold text-slate-900">Clique para selecionar um documento</span>
            <span className="text-sm text-slate-500 mt-1">PDF, imagem, planilha, contrato ou qualquer arquivo digital</span>
            <input type="file" className="hidden" onChange={(event) => handleFile(event.target.files?.[0])} />
          </label>

          {isLoading && <p className="mt-5 text-sm text-slate-500">Calculando hash...</p>}
          {error && <p className="mt-5 text-sm text-red-600">{error}</p>}

          {hash && (
            <div className="mt-6 bg-slate-950 text-white rounded-3xl p-6 space-y-4">
              <div className="flex items-start gap-3">
                <FileCheck className="text-emerald-400 mt-1" size={24} />
                <div>
                  <p className="font-bold">Hash calculado com sucesso</p>
                  <p className="text-sm text-slate-300">{fileName} {fileSizeLabel ? `- ${fileSizeLabel}` : ''}</p>
                </div>
              </div>
              <div className="bg-white/10 rounded-2xl p-4 break-all font-mono text-xs leading-relaxed">{hash}</div>
              <button
                onClick={() => navigator.clipboard?.writeText(hash)}
                className="px-5 py-3 bg-white text-slate-950 rounded-xl font-semibold text-sm hover:bg-slate-100"
              >
                Copiar hash
              </button>
            </div>
          )}
        </section>

        <aside className="space-y-4">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
            <h2 className="text-xl font-bold text-slate-900">O que esse hash prova?</h2>
            <p className="text-slate-600 mt-3 text-sm leading-relaxed">
              O hash e uma impressao digital do arquivo. Se qualquer caractere, imagem ou byte for alterado, o hash muda completamente.
            </p>
          </div>
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
            <h2 className="text-xl font-bold text-slate-900">Quer transformar em certificado?</h2>
            <p className="text-slate-600 mt-3 text-sm leading-relaxed">
              Crie uma conta DocWallet para registrar a prova em blockchain, gerar certificado publico e manter historico de evidencias.
            </p>
            <a href="/" className="mt-4 inline-flex px-5 py-3 bg-indigo-600 text-white rounded-xl font-semibold text-sm hover:bg-indigo-700">Criar conta gratis</a>
          </div>
          <div className="bg-amber-50 rounded-3xl border border-amber-100 p-6 text-sm text-amber-900 leading-relaxed">
            O DocWallet nao substitui cartorio e nao presta consultoria juridica. A validacao por hash demonstra integridade tecnica do arquivo.
          </div>
        </aside>
      </main>
    </div>
  );
}
