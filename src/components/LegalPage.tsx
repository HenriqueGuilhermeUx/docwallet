import { ShieldCheck, Trash2, Wallet } from 'lucide-react';

const today = '01/07/2026';
const supportEmail = 'suporte@docwallet.app';

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
    <h2 className="text-xl font-bold text-slate-900 mb-3">{title}</h2>
    <div className="text-slate-600 leading-relaxed space-y-3 text-sm md:text-base">{children}</div>
  </section>
);

export const PrivacyPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-slate-950 text-white border-b border-white/10">
        <div className="max-w-5xl mx-auto px-4 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-indigo-600 rounded-xl flex items-center justify-center"><Wallet size={22} /></div>
            <div>
              <p className="font-bold text-lg">DocWallet</p>
              <p className="text-xs text-slate-400">Política de Privacidade</p>
            </div>
          </div>
          <a href="/" className="text-sm text-slate-300 hover:text-white">Voltar</a>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-5">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl p-8 text-white">
          <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mb-4"><ShieldCheck size={30} /></div>
          <h1 className="text-3xl font-bold">Política de Privacidade</h1>
          <p className="text-white/80 mt-2">Última atualização: {today}</p>
        </div>

        <Section title="1. Quem somos">
          <p>O DocWallet é uma carteira digital para guardar documentos, criar contratos simples, compartilhar documentos com segurança, coletar assinatura eletrônica e registrar provas de integridade por hash em blockchain.</p>
        </Section>

        <Section title="2. Dados que podemos coletar">
          <p>Podemos coletar dados de cadastro, como nome, e-mail, telefone quando informado e informações necessárias para login e segurança da conta.</p>
          <p>Também tratamos documentos enviados pelo usuário, contratos criados, arquivos compartilhados, registros de assinatura eletrônica, hashes SHA-256, certificados blockchain e dados técnicos de acesso.</p>
          <p>Para auditoria de assinatura eletrônica, podemos registrar nome informado, e-mail, data e hora, endereço IP, navegador/dispositivo utilizado e eventos de aceite.</p>
        </Section>

        <Section title="3. Como usamos os dados">
          <p>Usamos os dados para operar a conta DocWallet, armazenar e exibir documentos, gerar contratos, criar links de compartilhamento, registrar assinaturas eletrônicas, calcular hashes, emitir certificados e manter trilhas de auditoria.</p>
          <p>Também podemos usar dados técnicos para segurança, prevenção de fraude, suporte, melhoria do serviço e cumprimento de obrigações legais.</p>
        </Section>

        <Section title="4. Documentos e contratos">
          <p>Os documentos e contratos pertencem ao usuário que os envia ou cria. O DocWallet não vende documentos, contratos ou dados pessoais a terceiros.</p>
          <p>Links públicos de compartilhamento e assinatura podem ser acessados por quem receber o link. O usuário é responsável por enviar esses links apenas a pessoas autorizadas.</p>
        </Section>

        <Section title="5. Blockchain e hashes">
          <p>O DocWallet pode registrar em blockchain apenas o hash do documento ou contrato, e não necessariamente o conteúdo completo do arquivo. O hash serve como prova de integridade: se o conteúdo mudar, o hash também muda.</p>
          <p>Transações blockchain são públicas por natureza e podem incluir carteira, hash da transação, rede, data e dados técnicos relacionados.</p>
        </Section>

        <Section title="6. Pagamentos">
          <p>Quando houver pagamento por validação, contrato, Pix ou cripto, poderemos tratar dados necessários para processar, confirmar e auditar a cobrança. Provedores de pagamento podem ter suas próprias políticas de privacidade.</p>
        </Section>

        <Section title="7. Segurança">
          <p>Adotamos medidas técnicas para proteger contas, documentos, links e certificados. Ainda assim, nenhum sistema é totalmente imune a riscos. O usuário deve proteger sua senha, dispositivo e links compartilhados.</p>
        </Section>

        <Section title="8. Compartilhamento de dados">
          <p>Podemos compartilhar dados com provedores de infraestrutura, hospedagem, banco de dados, autenticação, pagamentos, blockchain, análise técnica e suporte, sempre na medida necessária para operar o serviço.</p>
          <p>Também podemos compartilhar dados quando necessário para cumprir obrigação legal, ordem de autoridade competente ou proteger direitos do DocWallet e de seus usuários.</p>
        </Section>

        <Section title="9. Retenção e exclusão">
          <p>Os dados são mantidos enquanto necessários para prestação do serviço, cumprimento de obrigações legais, auditoria, segurança e defesa de direitos. O usuário pode solicitar exclusão de dados, observadas obrigações legais e registros necessários de auditoria.</p>
          <p>A página pública de solicitação de exclusão está disponível em <a className="text-indigo-600 font-semibold" href="/delete-account">/delete-account</a>.</p>
        </Section>

        <Section title="10. Contato">
          <p>Para dúvidas, solicitações de privacidade ou exclusão de dados, entre em contato pelo e-mail <a className="text-indigo-600 font-semibold" href={`mailto:${supportEmail}`}>{supportEmail}</a>.</p>
        </Section>
      </main>
    </div>
  );
};

export const TermsPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-slate-950 text-white border-b border-white/10">
        <div className="max-w-5xl mx-auto px-4 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-indigo-600 rounded-xl flex items-center justify-center"><Wallet size={22} /></div>
            <div>
              <p className="font-bold text-lg">DocWallet</p>
              <p className="text-xs text-slate-400">Termos de Uso</p>
            </div>
          </div>
          <a href="/" className="text-sm text-slate-300 hover:text-white">Voltar</a>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-5">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl p-8 text-white">
          <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mb-4"><ShieldCheck size={30} /></div>
          <h1 className="text-3xl font-bold">Termos de Uso</h1>
          <p className="text-white/80 mt-2">Última atualização: {today}</p>
        </div>

        <Section title="1. Aceitação dos termos">
          <p>Ao usar o DocWallet, você concorda com estes Termos de Uso e com a Política de Privacidade. Caso não concorde, não utilize o serviço.</p>
        </Section>

        <Section title="2. O que é o DocWallet">
          <p>O DocWallet é uma plataforma digital para armazenamento de documentos, criação de contratos simples, compartilhamento seguro, assinatura eletrônica com evidências digitais e prova de integridade por hash e blockchain.</p>
        </Section>

        <Section title="3. O que o DocWallet não é">
          <p>O DocWallet não é cartório, não substitui automaticamente reconhecimento de firma, não presta consultoria jurídica e não garante que um contrato seja adequado para todos os casos.</p>
          <p>Os modelos e textos de contrato são ferramentas de apoio. O usuário é responsável por revisar o conteúdo e buscar orientação jurídica quando necessário.</p>
        </Section>

        <Section title="4. Conta e responsabilidade do usuário">
          <p>O usuário é responsável por manter suas credenciais seguras, por todos os documentos enviados, contratos criados, links compartilhados e informações inseridas na plataforma.</p>
          <p>É proibido usar o DocWallet para armazenar, compartilhar ou assinar conteúdo ilegal, fraudulento, ofensivo, que viole direitos de terceiros ou que contrarie a legislação aplicável.</p>
        </Section>

        <Section title="5. Assinatura eletrônica DocWallet">
          <p>A assinatura eletrônica DocWallet registra evidências digitais de aceite, como nome informado, e-mail, data e hora, IP, navegador/dispositivo, hash do contrato e status das partes.</p>
          <p>Essa assinatura busca comprovar autoria, aceite e integridade, mas não deve ser apresentada como assinatura qualificada ICP-Brasil, salvo se no futuro houver integração específica para isso.</p>
        </Section>

        <Section title="6. Blockchain e certificados">
          <p>A validação blockchain registra prova de integridade do documento ou contrato por meio de hash. A blockchain não valida o mérito jurídico do conteúdo nem garante que o documento esteja correto, verdadeiro ou completo.</p>
          <p>Taxas, transações, carteiras e redes blockchain podem variar e estão sujeitas a regras de terceiros.</p>
        </Section>

        <Section title="7. Planos, pagamentos e cobranças avulsas">
          <p>O DocWallet pode oferecer armazenamento e compartilhamento gratuitos e cobrar por validações, contratos, assinaturas, certificados ou recursos adicionais. Preços podem mudar mediante atualização da plataforma.</p>
          <p>Pagamentos por Pix, cripto ou outros meios dependem de provedores externos e da confirmação da transação.</p>
        </Section>

        <Section title="8. Disponibilidade e limitações">
          <p>Buscamos manter o serviço disponível e seguro, mas não garantimos disponibilidade ininterrupta, ausência de erros, compatibilidade com todas as carteiras cripto ou funcionamento perfeito em todos os dispositivos.</p>
        </Section>

        <Section title="9. Suspensão e encerramento">
          <p>Podemos suspender ou encerrar contas e acessos em caso de violação destes termos, suspeita de fraude, risco de segurança, exigência legal ou uso indevido da plataforma.</p>
        </Section>

        <Section title="10. Alterações dos termos">
          <p>Estes termos podem ser atualizados para refletir melhorias do produto, exigências legais ou mudanças operacionais. A versão vigente estará disponível no app ou site.</p>
        </Section>
      </main>
    </div>
  );
};

export const DeleteAccountPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-slate-950 text-white border-b border-white/10">
        <div className="max-w-5xl mx-auto px-4 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-red-600 rounded-xl flex items-center justify-center"><Trash2 size={22} /></div>
            <div>
              <p className="font-bold text-lg">DocWallet</p>
              <p className="text-xs text-slate-400">Exclusão de conta e dados</p>
            </div>
          </div>
          <a href="/" className="text-sm text-slate-300 hover:text-white">Voltar</a>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-5">
        <div className="bg-gradient-to-r from-red-600 to-slate-900 rounded-3xl p-8 text-white">
          <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mb-4"><Trash2 size={30} /></div>
          <h1 className="text-3xl font-bold">Solicitação de exclusão de conta e dados</h1>
          <p className="text-white/80 mt-2">Última atualização: {today}</p>
        </div>

        <Section title="Como solicitar a exclusão">
          <p>Para excluir sua conta DocWallet e os dados pessoais associados, envie uma solicitação para <a className="text-indigo-600 font-semibold" href={`mailto:${supportEmail}?subject=Solicitação de exclusão de conta DocWallet`}>{supportEmail}</a>.</p>
          <p>No e-mail, informe o endereço de e-mail usado no cadastro do DocWallet e escreva: “Solicito a exclusão da minha conta DocWallet e dos dados pessoais associados”.</p>
        </Section>

        <Section title="Quais dados podem ser excluídos">
          <p>Após validação da titularidade da conta, poderemos excluir dados de cadastro, sessão, documentos enviados, contratos criados, links de compartilhamento ativos e outros dados pessoais associados à conta.</p>
        </Section>

        <Section title="Dados que podem ser retidos">
          <p>Alguns registros podem ser mantidos pelo período necessário para cumprimento legal, auditoria, prevenção de fraude, segurança, comprovação de transações, defesa de direitos e registros técnicos.</p>
          <p>Registros em blockchain, hashes, transações públicas e dados já gravados em redes descentralizadas podem não ser apagáveis por natureza técnica da blockchain.</p>
        </Section>

        <Section title="Prazo de atendimento">
          <p>Responderemos às solicitações de exclusão em prazo razoável, após confirmação da identidade do solicitante e análise de eventuais obrigações legais ou registros que precisem ser preservados.</p>
        </Section>

        <Section title="URL pública para a Google Play">
          <p>Esta página é a URL pública de solicitação de exclusão de conta e dados do DocWallet:</p>
          <p className="font-mono text-slate-900 break-all bg-slate-100 rounded-xl p-3">https://docwallet.netlify.app/delete-account</p>
        </Section>
      </main>
    </div>
  );
};
