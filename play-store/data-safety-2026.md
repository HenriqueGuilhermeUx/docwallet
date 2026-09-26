# DocWallet Docs — Google Play Data Safety 2026

Use este arquivo como guia ao preencher `Políticas e programas > Conteúdo do app > Segurança dos dados` no Play Console. A declaração final deve refletir exatamente a versão enviada ao Google Play e as relações contratuais com cada provedor.

## Resumo

- O app coleta dados: **Sim**.
- Dados são criptografados em trânsito: **Sim**, para os serviços de produção acessados por HTTPS.
- O usuário pode solicitar exclusão: **Sim**.
- URL pública de exclusão: `https://trydocwallet.com/delete-account`.
- Política de privacidade: `https://trydocwallet.com/privacy`.
- Venda de dados pessoais: **Não**.
- Anúncios: **Não**.

## Tipos de dados a declarar

### Informações pessoais

- **Nome** — obrigatório no cadastro e/ou assinatura; finalidade: gerenciamento de conta, funcionalidades do app e evidências de assinatura.
- **E-mail** — obrigatório para a conta e usado em convites/OTP quando aplicável; finalidade: conta, comunicação, autenticação e assinatura.
- **ID do usuário** — gerado pelo backend; finalidade: gerenciamento da conta e associação dos documentos.
- **Telefone** — opcional; pode ser usado para envio/identificação em fluxos de assinatura.
- **Outras informações pessoais** — CPF pode ser informado opcionalmente durante assinatura reforçada/ICP compatível.

### Arquivos e documentos

- **Arquivos e documentos** — enviados voluntariamente pelo usuário; finalidade: armazenamento, organização, compartilhamento, Intelligence, DocFlow e comprovação.
- **Fotos** — imagens JPG/PNG podem ser enviadas como documentos; finalidade: mesma funcionalidade documental.

### Saúde

- **Informações de saúde** — opcionais e fornecidas pelo usuário quando ele escolhe armazenar documentos como carteira de saúde ou carteira de vacinação. O DocWallet Docs não diagnostica, trata ou monitora condições médicas.

### Localização

- **Localização exata** — opcional, somente quando o usuário autoriza durante um fluxo de assinatura que registra essa evidência. Não é coletada em segundo plano.

### Dispositivo e identificadores

- **Dispositivo ou outros identificadores / informações técnicas** — podem compor a impressão técnica de uma assinatura (navegador, plataforma, tamanho da tela, timezone e dados semelhantes); finalidade: segurança, prevenção de fraude e evidências.

### Atividade no app

- **Interações no app / eventos** — eventos de assinatura, andamento de workflow e trilha de auditoria podem ser registrados para operar o serviço e manter evidências.

## Coleta obrigatória x opcional

- Cadastro: nome/e-mail e credenciais — necessários para a conta.
- Documentos: opcionais e iniciados pelo usuário.
- Dados de signatários: necessários somente quando o usuário cria/participa de um fluxo de assinatura.
- Telefone/CPF/assinatura desenhada/localização: opcionais conforme o fluxo.
- Dados de saúde: opcionais; existem somente quando o usuário escolhe documentos de saúde/vacinação.

## Compartilhamento com terceiros

Não responder automaticamente `Não compartilhado` sem validar a relação de cada provedor.

O Google Play prevê exceções para transferências a **prestadores de serviço que processam dados somente em nome do desenvolvedor** e para transferências **iniciadas pelo próprio usuário**. Confirmar que contratos e práticas dos provedores se enquadram nessas exceções antes de marcar a resposta final.

Provedores/fluxos a considerar na revisão:

- hospedagem/backend e banco de dados;
- e-mail transacional;
- provedor ICP-Brasil/assinatura digital quando o usuário escolhe esse fluxo;
- serviços técnicos necessários a Intelligence/DocFlow;
- redes blockchain apenas em recursos/fluxos realmente oferecidos na versão distribuída.

## Segurança

- Tráfego de produção via HTTPS.
- Senhas não devem ser armazenadas em texto simples.
- Links de assinatura são individuais e não devem revelar dados/bearer links de outras partes.
- Evidências e documentos devem continuar protegidos pela autenticação/ownership já implementados.

## Exclusão de conta

O Play exige caminho no app e na web para apps que permitem criação de conta. A versão Play possui links de `Política de Privacidade`, `Termos de Uso` e `Excluir conta e dados` na área de acesso/cadastro.

## Health Apps declaration

Todos os apps precisam preencher o formulário `Health apps`. Como o DocWallet Docs oferece tipos de documento `Carteira de Saúde` e `Carteira de Vacinação`, declarar a finalidade documental de forma transparente.

Sugestão coerente com a versão atual:

- selecionar a categoria relacionada a **Healthcare Services and Management / gerenciamento de registros de saúde**, se o formulário a apresentar;
- explicar que o app apenas permite armazenar/organizar documentos escolhidos pelo usuário;
- não selecionar diagnóstico, tratamento, dispositivo médico, fitness ou monitoramento, pois essas funções não existem.

## Financial features declaration — versão Android Play

Na versão Android da Play, os recursos pagos de blockchain/Pix/cripto foram removidos da navegação e não são oferecidos no app. Assim, para o binário Play atual, a declaração esperada é **`Meu app não oferece recursos financeiros`**, desde que nenhum recurso financeiro volte a ser exposto antes do envio.

Se carteira cripto, pagamento Pix por função digital ou compra blockchain voltar ao Android, revisar esta declaração e a política de Google Play Billing antes de publicar.
