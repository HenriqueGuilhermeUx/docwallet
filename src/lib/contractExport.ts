export const openContractPdf = (params: {
  title: string;
  content: string;
  hash?: string;
  certificateId?: string;
}) => {
  const safe = (value: string) => value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>${safe(params.title)}</title>
<style>
  body { font-family: Arial, sans-serif; margin: 0; background: #f8fafc; color: #0f172a; }
  .page { max-width: 820px; margin: 32px auto; background: white; padding: 48px; border: 1px solid #e2e8f0; }
  .brand { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0f172a; padding-bottom: 18px; margin-bottom: 30px; }
  .logo { font-size: 26px; font-weight: 800; }
  .badge { background: #eef2ff; color: #3730a3; padding: 8px 12px; border-radius: 999px; font-size: 12px; font-weight: 700; }
  h1 { font-size: 26px; margin: 0 0 24px; }
  pre { white-space: pre-wrap; font-family: Arial, sans-serif; line-height: 1.55; font-size: 14px; }
  .proof { margin-top: 32px; padding: 18px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; font-size: 12px; word-break: break-all; }
  .footer { margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 16px; font-size: 11px; color: #64748b; }
  @media print { body { background: white; } .page { margin: 0; border: 0; max-width: none; } .no-print { display: none; } }
</style>
</head>
<body>
  <div class="page">
    <div class="brand"><div class="logo">DocWallet</div><div class="badge">Contrato digital</div></div>
    <h1>${safe(params.title)}</h1>
    <pre>${safe(params.content)}</pre>
    <div class="proof">
      <strong>Prova de integridade DocWallet</strong><br />
      ${params.hash ? `Hash SHA-256: ${safe(params.hash)}<br />` : ''}
      ${params.certificateId ? `Certificado: ${safe(params.certificateId)}<br />` : ''}
      Gerado em: ${new Date().toLocaleString('pt-BR')}
    </div>
    <div class="footer">Este documento foi gerado pelo DocWallet. A prova de integridade depende do hash do conteúdo e, quando aplicável, do registro blockchain correspondente.</div>
  </div>
  <script>window.onload = () => setTimeout(() => window.print(), 500);</script>
</body>
</html>`;

  const win = window.open('', '_blank');
  if (!win) return;
  win.document.open();
  win.document.write(html);
  win.document.close();
};
