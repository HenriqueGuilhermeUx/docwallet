import { useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, CheckCircle, Copy, FileSignature, KeyRound, Loader2, MailCheck, MapPin, PenLine, RotateCcw, Send, Shield, Smartphone, Wallet } from 'lucide-react';
import {
  acceptSignature,
  buildDeviceFingerprint,
  publicSignPathToUrl,
  readPublicSignature,
  readSignatureIdentity,
  requestSignatureEmailOtp,
  SignatureIdentityConfig,
  verifySignatureEmailOtp,
} from '../lib/signatures';
import { getIcpSignatureConfig, IcpSignatureConfig, IcpSignatureSession, startPublicIcpSignature } from '../lib/icpSignature';

type NextParty = {
  name: string;
  email?: string;
  url: string;
  code: string;
};

type PublicData = {
  request: {
    title: string;
    content_hash: string;
    final_hash?: string | null;
    status: string;
    parties: { name: string; email?: string; status: string; signed_at?: string | null }[];
  };
  party: { name: string; email?: string; status: string };
  contract_content: string;
  next_party?: NextParty | null;
};

type GeoCapture = { latitude?: number; longitude?: number; accuracy?: number } | null;

const confirmationRequired = 'EU ACEITO';

export const SignPage: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawingRef = useRef(false);
  const [data, setData] = useState<PublicData | null>(null);
  const [nextParty, setNextParty] = useState<NextParty | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [cpf, setCpf] = useState('');
  const [phone, setPhone] = useState('');
  const [confirmationPhrase, setConfirmationPhrase] = useState('');
  const [accepted, setAccepted] = useState(false);
  const [icpAccepted, setIcpAccepted] = useState(false);
  const [signatureTouched, setSignatureTouched] = useState(false);
  const [geo, setGeo] = useState<GeoCapture>(null);
  const [geoStatus, setGeoStatus] = useState('Localização opcional não capturada.');
  const [icpConfig, setIcpConfig] = useState<IcpSignatureConfig | null>(null);
  const [icpSession, setIcpSession] = useState<IcpSignatureSession | null>(null);
  const [icpLoading, setIcpLoading] = useState(false);
  const [icpNotice, setIcpNotice] = useState('');
  const [identity, setIdentity] = useState<SignatureIdentityConfig | null>(null);
  const [identityLoading, setIdentityLoading] = useState(false);
  const [identityNotice, setIdentityNotice] = useState('');
  const [challengeId, setChallengeId] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [copied, setCopied] = useState(false);

  const code = useMemo(() => {
    const parts = window.location.pathname.split('/').filter(Boolean);
    return parts[0] === 'sign' ? parts[1] : '';
  }, []);

  const resetCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#0f172a';
    setSignatureTouched(false);
  };

  useEffect(() => {
    resetCanvas();
  }, [loading]);

  useEffect(() => {
    const load = async () => {
      try {
        const [loaded, config, identityConfig] = await Promise.all([
          readPublicSignature(code),
          getIcpSignatureConfig().catch(() => null),
          readSignatureIdentity(code).catch(() => null),
        ]);
        setData(loaded);
        setIcpConfig(config);
        setIdentity(identityConfig);
        setName(loaded.party?.name || '');
        setEmail(loaded.party?.email || '');
      } catch (err: any) {
        setError(err?.message || 'Link indisponível.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [code]);

  const getCanvasPoint = (event: any) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const clientX = event.clientX ?? event.touches?.[0]?.clientX;
    const clientY = event.clientY ?? event.touches?.[0]?.clientY;
    if (clientX === undefined || clientY === undefined) return null;
    return {
      x: (clientX - rect.left) * (canvas.width / rect.width),
      y: (clientY - rect.top) * (canvas.height / rect.height),
    };
  };

  const startDrawing = (event: any) => {
    event.preventDefault?.();
    const canvas = canvasRef.current;
    const point = getCanvasPoint(event);
    if (!canvas || !point) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    drawingRef.current = true;
    ctx.beginPath();
    ctx.moveTo(point.x, point.y);
    setSignatureTouched(true);
  };

  const draw = (event: any) => {
    if (!drawingRef.current) return;
    event.preventDefault?.();
    const canvas = canvasRef.current;
    const point = getCanvasPoint(event);
    if (!canvas || !point) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.lineTo(point.x, point.y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    drawingRef.current = false;
  };

  const captureLocation = () => {
    setGeoStatus('Solicitando permissão de localização...');
    if (!navigator.geolocation) {
      setGeoStatus('Este dispositivo não suporta geolocalização.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const captured = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        };
        setGeo(captured);
        setGeoStatus(`Localização capturada com precisão aproximada de ${Math.round(position.coords.accuracy)}m.`);
      },
      () => setGeoStatus('Localização não autorizada. A assinatura pode seguir sem geolocalização.'),
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 },
    );
  };

  const sendIdentityCode = async () => {
    setError('');
    setIdentityNotice('');
    setIdentityLoading(true);
    try {
      const challenge = await requestSignatureEmailOtp(code);
      setChallengeId(challenge.challengeId);
      setIdentityNotice(`Código enviado para ${challenge.maskedEmail || 'o e-mail cadastrado'}. Ele expira em cerca de ${Math.round(challenge.expiresIn / 60)} minutos.`);
    } catch (err: any) {
      setError(err?.message || 'Não foi possível enviar o código de verificação.');
    } finally {
      setIdentityLoading(false);
    }
  };

  const verifyIdentityCode = async () => {
    setError('');
    setIdentityLoading(true);
    try {
      const verified = await verifySignatureEmailOtp(code, challengeId, otpCode);
      setIdentity((current) => ({
        ...(current || { success: true, emailAvailable: true, verified: false }),
        ...verified,
        verified: true,
      }));
      setIdentityNotice('E-mail verificado. Esta assinatura terá evidência de identidade reforçada por OTP.');
      setOtpCode('');
    } catch (err: any) {
      setError(err?.message || 'Código de verificação inválido.');
    } finally {
      setIdentityLoading(false);
    }
  };

  const handleAccept = async () => {
    setError('');
    if (!accepted) {
      setError('Confirme que leu e aceita assinar eletronicamente.');
      return;
    }
    if (confirmationPhrase.trim().toUpperCase() !== confirmationRequired) {
      setError(`Digite ${confirmationRequired} para confirmar a assinatura.`);
      return;
    }
    if (!signatureTouched || !canvasRef.current) {
      setError('Desenhe sua assinatura no campo indicado.');
      return;
    }

    setSubmitting(true);
    try {
      const signatureImage = canvasRef.current.toDataURL('image/png');
      const consentText = identity?.verified
        ? 'Li o documento apresentado, confirmo meus dados, validei o e-mail associado ao convite e aceito assinar eletronicamente pelo DocWallet, autorizando o registro das evidências técnicas da assinatura.'
        : 'Li o documento apresentado, confirmo meus dados, aceito assinar eletronicamente pelo DocWallet e autorizo o registro das evidências técnicas da assinatura.';
      const signed = await acceptSignature(code, {
        name,
        email,
        cpf,
        phone,
        confirmationPhrase,
        signatureImage,
        geolocation: geo,
        deviceFingerprint: buildDeviceFingerprint(),
        consentText,
        evidenceLevel: identity?.verified ? 'verified_evidence' : 'reinforced_evidence',
      });
      setSuccess(true);
      setData(signed);
      setNextParty(signed.next_party || null);
    } catch (err: any) {
      setError(err?.message || 'Erro ao assinar.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleIcpSign = async () => {
    setError('');
    setIcpNotice('');
    setIcpLoading(true);
    try {
      const result = await startPublicIcpSignature(code);
      setIcpConfig(result.config);
      setIcpSession(result.session);
      if (result.session.redirectUrl) {
        window.location.href = result.session.redirectUrl;
        return;
      }
      setIcpNotice(result.session.metadata?.message as string || result.config.statusMessage || 'Assinatura ICP-Brasil preparada. Configure o provider para assinar com certificado digital.');
    } catch (err: any) {
      setError(err?.message || 'Erro ao iniciar assinatura ICP-Brasil.');
    } finally {
      setIcpLoading(false);
    }
  };

  const nextPartyUrl = nextParty ? publicSignPathToUrl(nextParty.url) : '';

  const copyNextLink = async () => {
    if (!nextPartyUrl) return;
    await navigator.clipboard.writeText(nextPartyUrl).catch(() => undefined);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const sendByWhatsApp = () => {
    if (!nextPartyUrl || !nextParty) return;
    const text = encodeURIComponent(`Olá, ${nextParty.name}. Você recebeu um contrato para assinar eletronicamente no DocWallet: ${nextPartyUrl}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl p-8 text-center shadow-2xl">
          <Loader2 className="animate-spin mx-auto text-indigo-600 mb-4" size={40} />
          <p className="font-semibold text-slate-800">Abrindo assinatura...</p>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl p-8 text-center shadow-2xl max-w-md w-full">
          <AlertCircle className="mx-auto text-red-500 mb-4" size={44} />
          <h1 className="text-xl font-bold text-slate-800 mb-2">Link indisponível</h1>
          <p className="text-slate-500">{error}</p>
        </div>
      </div>
    );
  }

  const alreadySigned = data?.party?.status === 'signed' || success;
  const completed = data?.request?.status === 'completed';
  const icpReady = Boolean(icpConfig?.configured && icpConfig?.enabled);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-white/10 bg-slate-950/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center"><Wallet size={22} /></div>
            <div><p className="font-bold">DocWallet</p><p className="text-xs text-slate-400">assinatura eletrônica com evidências</p></div>
          </div>
          {completed && <span className="text-xs bg-emerald-500/20 text-emerald-200 px-3 py-1 rounded-full">Contrato completo</span>}
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 grid lg:grid-cols-[430px_1fr] gap-6">
        <aside className="bg-white text-slate-900 rounded-2xl p-6 shadow-2xl h-fit">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4"><FileSignature size={28} /></div>
          <h1 className="text-2xl font-bold leading-tight break-words">{data?.request.title}</h1>
          <p className="text-sm text-slate-500 mt-2">Leia o contrato, confirme sua identidade e registre a assinatura eletrônica com evidências reforçadas.</p>

          <div className="mt-5 p-3 rounded-xl bg-slate-50 border border-slate-100">
            <p className="text-xs text-slate-500 mb-1">Hash original SHA-256</p>
            <p className="text-xs font-mono break-all text-slate-700">{data?.request.content_hash}</p>
          </div>

          {data?.request.final_hash && (
            <div className="mt-3 p-3 rounded-xl bg-emerald-50 border border-emerald-100">
              <p className="text-xs text-emerald-700 mb-1">Hash final assinado</p>
              <p className="text-xs font-mono break-all text-emerald-800">{data.request.final_hash}</p>
            </div>
          )}

          <div className="mt-5 space-y-2">
            {data?.request.parties.map((party, index) => (
              <div key={index} className="flex items-center justify-between rounded-xl border border-slate-100 p-3 text-sm">
                <div><p className="font-semibold">{party.name}</p><p className="text-slate-500 text-xs">{party.email}</p></div>
                <span className={party.status === 'signed' ? 'text-emerald-600 font-semibold' : 'text-amber-600 font-semibold'}>{party.status === 'signed' ? 'assinado' : 'pendente'}</span>
              </div>
            ))}
          </div>

          {alreadySigned ? (
            <div className="mt-6 space-y-4">
              <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-4 text-emerald-800 flex gap-3">
                <CheckCircle size={22} />
                <div>
                  <p className="font-bold">Assinatura registrada</p>
                  <p className="text-sm">Sua evidência foi salva com data, IP, navegador, dispositivo, assinatura desenhada, hash do contrato{identity?.verified ? ' e e-mail verificado por código.' : '.'}</p>
                </div>
              </div>

              {nextParty && (
                <div className="rounded-xl bg-indigo-50 border border-indigo-100 p-4 text-indigo-900">
                  <p className="font-bold">Enviar para próxima parte</p>
                  <p className="text-sm mt-1">Agora envie o link para {nextParty.name} assinar.</p>
                  <input value={nextPartyUrl} readOnly className="mt-3 w-full px-3 py-2 rounded-lg border border-indigo-100 text-xs text-slate-700" />
                  <div className="grid grid-cols-2 gap-2 mt-3">
                    <button onClick={copyNextLink} className="py-2 bg-slate-900 text-white rounded-lg font-semibold text-sm flex items-center justify-center gap-2">
                      <Copy size={16} /> {copied ? 'Copiado' : 'Copiar'}
                    </button>
                    <button onClick={sendByWhatsApp} className="py-2 bg-emerald-600 text-white rounded-lg font-semibold text-sm flex items-center justify-center gap-2">
                      <Send size={16} /> WhatsApp
                    </button>
                  </div>
                </div>
              )}

              {!nextParty && completed && (
                <div className="rounded-xl bg-slate-50 border border-slate-100 p-4 text-slate-700 text-sm">
                  Todas as partes assinaram. O contrato está completo e já possui hash final assinado.
                </div>
              )}
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              <div className="rounded-xl bg-indigo-50 border border-indigo-100 p-4">
                <p className="font-bold text-indigo-950 flex items-center gap-2"><Shield size={18} /> DocWallet Sign Evidências Reforçadas</p>
                <p className="text-xs text-indigo-900 mt-1">Nossa solução registra aceite, assinatura desenhada, frase de confirmação, data/hora, IP, navegador, dispositivo, hash e geolocalização opcional. Não é ICP-Brasil qualificada.</p>
              </div>

              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Seu nome completo" className="w-full px-4 py-3 border border-slate-300 rounded-xl" />
              <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Seu e-mail" className="w-full px-4 py-3 border border-slate-300 rounded-xl" />
              <div className="grid sm:grid-cols-2 gap-3">
                <input value={cpf} onChange={(e) => setCpf(e.target.value)} placeholder="CPF opcional" className="w-full px-4 py-3 border border-slate-300 rounded-xl" />
                <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Telefone opcional" className="w-full px-4 py-3 border border-slate-300 rounded-xl" />
              </div>

              {identity?.emailAvailable && (
                <div className={`rounded-xl border p-4 ${identity.verified ? 'border-emerald-200 bg-emerald-50' : 'border-sky-200 bg-sky-50'}`}>
                  <div className="flex items-start gap-3">
                    <MailCheck className={identity.verified ? 'text-emerald-700' : 'text-sky-700'} size={20} />
                    <div className="flex-1">
                      <p className={`font-bold ${identity.verified ? 'text-emerald-900' : 'text-sky-950'}`}>{identity.verified ? 'E-mail verificado' : 'Verificar identidade por e-mail'}</p>
                      <p className={`text-xs mt-1 ${identity.verified ? 'text-emerald-800' : 'text-sky-800'}`}>
                        {identity.verified
                          ? 'A posse do e-mail convidado foi confirmada por código de uso único e entra na trilha de evidências.'
                          : `Envie um código para ${identity.maskedEmail || 'o e-mail do convite'} e fortaleça a evidência da assinatura.`}
                      </p>
                    </div>
                  </div>
                  {!identity.verified && (
                    <div className="mt-3 space-y-2">
                      {!challengeId ? (
                        <button type="button" onClick={sendIdentityCode} disabled={identityLoading} className="w-full py-2.5 rounded-xl bg-sky-700 text-white font-semibold text-sm disabled:opacity-50 flex items-center justify-center gap-2">
                          {identityLoading ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />} Enviar código por e-mail
                        </button>
                      ) : (
                        <div className="grid grid-cols-[1fr_auto] gap-2">
                          <input value={otpCode} onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" placeholder="Código de 6 dígitos" className="w-full px-4 py-2.5 border border-sky-200 bg-white rounded-xl tracking-[0.25em] font-mono" />
                          <button type="button" onClick={verifyIdentityCode} disabled={identityLoading || otpCode.length !== 6} className="px-4 py-2.5 rounded-xl bg-sky-700 text-white font-semibold text-sm disabled:opacity-50">Validar</button>
                        </div>
                      )}
                      {challengeId && <button type="button" onClick={sendIdentityCode} disabled={identityLoading} className="text-xs font-semibold text-sky-700">Reenviar código</button>}
                      {identityNotice && <p className="text-xs text-sky-800">{identityNotice}</p>}
                    </div>
                  )}
                </div>
              )}

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-3 mb-2">
                  <p className="font-bold text-slate-900 flex items-center gap-2"><PenLine size={18} /> Assinatura desenhada</p>
                  <button type="button" onClick={resetCanvas} className="text-xs px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 flex items-center gap-1"><RotateCcw size={14} /> Limpar</button>
                </div>
                <canvas
                  ref={canvasRef}
                  width={640}
                  height={220}
                  className="w-full h-36 bg-white border border-slate-200 rounded-xl touch-none"
                  onPointerDown={startDrawing}
                  onPointerMove={draw}
                  onPointerUp={stopDrawing}
                  onPointerLeave={stopDrawing}
                />
                <p className="text-xs text-slate-500 mt-2">Use o dedo, mouse ou caneta para desenhar sua assinatura.</p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="font-bold text-slate-900 flex items-center gap-2"><Smartphone size={18} /> Confirmação e evidências</p>
                <input value={confirmationPhrase} onChange={(e) => setConfirmationPhrase(e.target.value)} placeholder="Digite EU ACEITO" className="mt-3 w-full px-4 py-3 border border-slate-300 rounded-xl" />
                <button type="button" onClick={captureLocation} className="mt-3 w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold flex items-center justify-center gap-2"><MapPin size={17} /> Adicionar localização opcional</button>
                <p className="text-xs text-slate-500 mt-2">{geoStatus}</p>
              </div>

              <label className="flex gap-3 text-sm text-slate-600"><input type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} /> Li, aceito e desejo assinar eletronicamente este contrato pelo DocWallet, com registro das evidências técnicas da assinatura.</label>
              {error && <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm">{error}</div>}
              <button onClick={handleAccept} disabled={!accepted || !name || !signatureTouched || submitting} className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold disabled:opacity-50 flex items-center justify-center gap-2">
                {submitting ? <Loader2 className="animate-spin" size={18} /> : <Shield size={18} />}
                {identity?.verified ? 'Assinar com identidade verificada' : 'Assinar com evidências reforçadas'}
              </button>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-start gap-3">
                  <KeyRound className="text-slate-700 mt-0.5" size={20} />
                  <div>
                    <p className="font-bold text-slate-900">Assinar com certificado digital ICP-Brasil</p>
                    <p className="text-xs text-slate-500 mt-1">{icpConfig?.safeLabel || 'Assinatura qualificada depende de certificado digital ICP-Brasil e provider configurado.'}</p>
                  </div>
                </div>
                <label className="mt-3 flex gap-3 text-sm text-slate-600"><input type="checkbox" checked={icpAccepted} onChange={(e) => setIcpAccepted(e.target.checked)} /> Entendo que a assinatura qualificada depende do meu certificado digital ICP-Brasil.</label>
                <button onClick={handleIcpSign} disabled={!icpAccepted || icpLoading} className={`mt-3 w-full py-3 rounded-xl font-semibold disabled:opacity-50 flex items-center justify-center gap-2 ${icpReady ? 'bg-slate-950 text-white hover:bg-slate-800' : 'bg-white text-slate-700 border border-slate-200'}`}>
                  {icpLoading ? <Loader2 className="animate-spin" size={18} /> : <KeyRound size={18} />}
                  {icpReady ? 'Assinar com certificado digital' : 'Preparar assinatura ICP-Brasil'}
                </button>
                {(icpNotice || icpSession) && (
                  <div className="mt-3 rounded-lg bg-amber-50 border border-amber-100 p-3 text-xs text-amber-800">
                    {icpNotice || icpSession?.metadata?.message as string || 'Provider ICP-Brasil ainda não configurado.'}
                  </div>
                )}
              </div>
            </div>
          )}
        </aside>

        <section className="bg-white text-slate-900 rounded-2xl min-h-[70vh] overflow-auto p-8">
          <pre className="whitespace-pre-wrap font-sans leading-relaxed text-sm">{data?.contract_content}</pre>
        </section>
      </main>
    </div>
  );
};
