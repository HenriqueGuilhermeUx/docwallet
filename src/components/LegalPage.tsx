import { ShieldCheck, Trash2, Wallet } from 'lucide-react';

const updatedAt = '25/09/2026';
const supportEmail = 'suporte@docwallet.app';
const publicBaseUrl = 'https://trydocwallet.com';

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
    <h2 className="text-xl font-bold text-slate-900 mb-3">{title}</h2>
    <div className="text-slate-600 leading-relaxed space-y-3 text-sm md:text-base">{children}</div>
  </section>
);

const LegalHeader: React.FC<{ subtitle: string; tone?: 'default' | 'danger' }> = ({ subtitle, tone = 'default' }) => (
  <header className="bg-slate-950 text-white border-b border-white/10">
    <div className="max-w-5xl mx-auto px-4 py-6 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${tone === 'danger' ? 'bg-red-600' : 'bg-indigo-600'}`}>
          {tone === 'danger' ? <Trash2 size={22} /> : <Wallet size={22} />}
        </div>
        <div>
          <p className="font-bold text-lg">DocWallet Docs</p>
          <p className="text-xs text-slate-400">{subtitle}</p>
        </div>
      </div>
      <a href="/" className="text-sm text-slate-300 hover:text-white">Voltar</a>
    </div>
  </header>
);

export const PrivacyPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50">
      <LegalHeader subtitle="Política de Privacidade" />

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-5">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl p-8 text-white">
          <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mb-4"><ShieldCheck size={30} /></div>
          <h1 className="text-3xl font-bold">Política de Privacidade</h1>
          <p className="text-white/80 mt-2">Última atualização: {updatedAt}</p>
        </div>

        <Section title="1. Quem somos">
          <p>O DocWallet Docs é uma plataforma de documentos da Alternative Ventures para receber, organizar, analisar, processar, assinar e comprovar documentos digitais.</p>
        </Section>

        <Section title="2. Dados que tratamos">
          <p>Para criar e manter uma conta, podemos tratar nome, e-mail, identificador da conta, senha protegida e telefone quando informado.</p>
          <p>Também tratamos documentos e arquivos enviados pelo usuário, conteúdo de contratos e fluxos, nomes de arquivos, links de compartilhamento, hashes, certificados e registros relacionados ao ciclo documental.</p>
          <p>Nos fluxos de assinatura, podemos tratar nome e e-mail dos signatários, telefone e CPF quando informados, assinatura desenhada, frase de confirmação, status de verificação por código, data e hora, endereço IP, navegador, informações técnicas do dispositivo e outros elementos necessários para formar o pacote de evidências.</p>
          <p>A localização exata pode ser coletada apenas quando o próprio usuário autoriza esse recurso durante a assinatura. O DocWallet não usa localização em segundo plano.</p>
        </Section>

        <Section title="3. Como usamos os dados">
          <p>Usamos os dados para autenticar usuários, armazenar e apresentar documentos, executar Intelligence e DocFlow, criar links e convites, coletar assinaturas, gerar PDFs finais, validar identidade, calcular hashes, emitir ou consultar provas de integridade e fornecer suporte.</p>
          <p>Dados técnicos também podem ser usados para segurança, prevenção de fraude, auditoria, diagnóstico de falhas e cumprimento de obrigações legais.</p>
        </Section>

        <Section title="4. Assinaturas e ICP-Brasil">
          <p>A assinatura eletrônica DocWallet pode registrar evidências técnicas do aceite. Quando o usuário escolhe um fluxo compatível com ICP-Brasil, dados necessários à operação podem ser enviados ao provedor de assinatura digital integrado para processar a sessão de assinatura e devolver o resultado ao DocWallet.</p>
          <p>O tipo de assinatura disponível depende do fluxo escolhido. O DocWallet não afirma que toda assinatura eletrônica comum seja uma assinatura qualificada ICP-Brasil.</p>
        </Section>

        <Section title="5. Provedores e compartilhamentos necessários">
          <p>Podemos usar provedores de infraestrutura, hospedagem, banco de dados, e-mail transacional, assinatura digital, blockchain, pagamentos e suporte para operar recursos solicitados pelo usuário.</p>
          <p>Esses provedores recebem somente os dados necessários à respectiva função e podem ter políticas próprias. Também podemos tratar ou divulgar dados quando houver obrigação legal, ordem de autoridade competente, prevenção de fraude ou defesa de direitos.</p>
          <p>O DocWallet não vende documentos nem dados pessoais dos usuários.</p>
        </Section>

        <Section title="6. Links públicos, blockchain e arquivos">
          <p>Links de compartilhamento e assinatura podem ser acessados por quem receber o link. O usuário deve compartilhá-los apenas com pessoas autorizadas.</p>
          <p>Quando uma prova é registrada em blockchain, a rede pode armazenar hashes, endereço de carteira, hash de transação e outros dados técnicos públicos. Informações gravadas em blockchain podem ser tecnicamente imutáveis.</p>
        </Section>

        <Section title="7. Segurança">
          <p>Adotamos controles técnicos e operacionais para proteger contas, documentos e evidências. As comunicações com nossos serviços são realizadas por conexões seguras quando suportadas. Nenhum sistema, entretanto, é totalmente livre de riscos.</p>
        </Section>

        <Section title="8. Retenção e exclusão">
          <p>Mantemos os dados enquanto necessários para prestar o serviço e, quando aplicável, para segurança, auditoria, prevenção de fraude, cumprimento legal e defesa de direitos.</p>
          <p>O usuário pode solicitar a exclusão da conta e dos dados associados. Alguns registros podem ser retidos quando existir uma obrigação legítima ou legal, e dados imutáveis já registrados em blockchain podem não ser tecnicamente apagáveis.</p>
          <p>A solicitação pode ser iniciada em <a className="text-indigo-600 font-semibold" href="/delete-account">Excluir conta e dados</a>.</p>
        </Section>

        <Section title="9. Contato">
          <p>Para dúvidas sobre privacidade, dados ou exclusão, escreva para <a className="text-indigo-600 font-semibold" href={`mailto:${supportEmail}`}>{supportEmail}</a>.</p>
        </Section>
      </main>
    </div>
  );
};

export const TermsPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50">
      <LegalHeader subtitle="Termos de Uso" />

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-5">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl p-8 text-white">
          <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mb-4"><ShieldCheck size={30} /></div>
          <h1 className="text-3xl font-bold">Termos de Uso</h1>
          <p className="text-white/80 mt-2">Última atualização: {updatedAt}</p>
        </div>

        <Section title="1. Aceitação">
          <p>Ao usar o DocWallet Docs, você concorda com estes Termos e com a Política de Privacidade. Caso não concorde, não utilize o serviço.</p>
        </Section>

        <Section title="2. O produto">
          <p>O DocWallet Docs oferece recursos para documentos, Intelligence, DocFlow, compartilhamento, assinatura eletrônica, geração de evidências, PDF final, hash, certificados e, em fluxos compatíveis, assinatura ICP-Brasil por provedor integrado.</p>
        </Section>

        <Section title="3. Assinaturas">
          <p>A assinatura eletrônica DocWallet registra evidências de aceite e integridade. Em fluxos específicos, o usuário pode escolher uma assinatura ICP-Brasil processada por provedor integrado.</p>
          <p>O DocWallet não é cartório, não presta consultoria jurídica e não garante que um documento, modelo ou modalidade de assinatura seja adequada a toda finalidade jurídica. O usuário deve avaliar os requisitos do caso concreto.</p>
        </Section>

        <Section title="4. Responsabilidade do usuário">
          <p>O usuário é responsável pela segurança da conta e por documentos, dados de signatários, links e informações que inserir ou compartilhar. É proibido usar o serviço para fraude, conteúdo ilegal ou violação de direitos de terceiros.</p>
        </Section>

        <Section title="5. Integridade e blockchain">
          <p>Hashes e registros em blockchain auxiliam na comprovação de integridade, mas não comprovam, por si só, a veracidade ou correção jurídica do conteúdo.</p>
        </Section>

        <Section title="6. Provedores externos">
          <p>Alguns recursos dependem de provedores de e-mail, assinatura digital, pagamentos, blockchain, hospedagem e outros serviços externos. A disponibilidade desses recursos também pode depender das condições desses provedores.</p>
        </Section>

        <Section title="7. Disponibilidade e alterações">
          <p>Buscamos manter o serviço disponível e seguro, mas não garantimos funcionamento ininterrupto. Recursos e termos podem ser atualizados para refletir melhorias, segurança, operação ou exigências legais.</p>
        </Section>

        <Section title="8. Conta e encerramento">
          <p>O usuário pode solicitar a exclusão da conta. O DocWallet também pode restringir ou encerrar acesso em caso de fraude, risco de segurança, violação destes Termos ou exigência legal.</p>
        </Section>
      </main>
    </div>
  );
};

export const DeleteAccountPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50">
      <LegalHeader subtitle="Exclusão de conta e dados" tone="danger" />

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-5">
        <div className="bg-gradient-to-r from-red-600 to-slate-900 rounded-3xl p-8 text-white">
          <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mb-4"><Trash2 size={30} /></div>
          <h1 className="text-3xl font-bold">Excluir conta e dados</h1>
          <p className="text-white/80 mt-2">Última atualização: {updatedAt}</p>
        </div>

        <Section title="Como iniciar a solicitação">
          <p>Envie uma solicitação para <a className="text-indigo-600 font-semibold" href={`mailto:${supportEmail}?subject=Solicitação de exclusão de conta DocWallet Docs`}>{supportEmail}</a> usando, de preferência, o mesmo e-mail cadastrado na conta.</p>
          <p>No pedido, informe o e-mail da conta e escreva que deseja excluir sua conta DocWallet Docs e os dados pessoais associados.</p>
        </Section>

        <Section title="Acesso dentro do app">
          <p>O link “Excluir conta e dados” também está disponível na área de acesso/cadastro do aplicativo, permitindo iniciar o mesmo processo pelo próprio app.</p>
        </Section>

        <Section title="Dados abrangidos">
          <p>Após a validação da titularidade, a solicitação pode abranger dados de cadastro, sessões, documentos armazenados, contratos, links ativos, dados pessoais e outros registros associados à conta que possam ser legal e tecnicamente excluídos.</p>
        </Section>

        <Section title="Retenção necessária">
          <p>Alguns dados podem ser mantidos pelo período necessário para cumprimento legal, prevenção de fraude, segurança, auditoria, comprovação de transações e defesa de direitos. Registros imutáveis já gravados em blockchain podem não ser apagáveis.</p>
        </Section>

        <Section title="URL pública para solicitação">
          <p>Esta é a página pública do DocWallet Docs para exclusão de conta e dados:</p>
          <p className="font-mono text-slate-900 break-all bg-slate-100 rounded-xl p-3">{publicBaseUrl}/delete-account</p>
        </Section>
      </main>
    </div>
  );
};
