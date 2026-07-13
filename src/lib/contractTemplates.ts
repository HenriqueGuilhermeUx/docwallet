export type ContractTemplateCategory =
  | 'Comercial'
  | 'Pessoal'
  | 'Imobiliario'
  | 'Financeiro'
  | 'Trabalho'
  | 'Privacidade'
  | 'Familia';

export interface ContractTemplate {
  title: string;
  category: ContractTemplateCategory;
  audience: string;
  description: string;
  tags: string[];
  popular?: boolean;
  sensitive?: boolean;
}

export const CONTRACT_TEMPLATES: ContractTemplate[] = [
  {
    title: 'Prestacao de Servicos',
    category: 'Comercial',
    audience: 'Autonomos, freelancers e pequenas empresas',
    description: 'Contrato simples para combinar escopo, prazo, valor, entrega, pagamento e responsabilidades entre contratante e prestador.',
    tags: ['servicos', 'freelancer', 'empresa'],
    popular: true,
  },
  {
    title: 'Proposta Comercial com Aceite',
    category: 'Comercial',
    audience: 'Vendedores, consultores e agencias',
    description: 'Modelo para transformar uma proposta em aceite digital com evidencias, assinatura e hash final.',
    tags: ['proposta', 'aceite', 'vendas'],
    popular: true,
  },
  {
    title: 'NDA / Confidencialidade',
    category: 'Privacidade',
    audience: 'Empresas, socios e parceiros',
    description: 'Acordo para proteger informacoes confidenciais, documentos, ideias, propostas e dados comerciais.',
    tags: ['sigilo', 'confidencialidade', 'parceria'],
    popular: true,
  },
  {
    title: 'Contrato de Namoro',
    category: 'Pessoal',
    audience: 'Casais que querem organizar declaracoes e limites patrimoniais',
    description: 'Modelo declarativo para registrar a intencao das partes, deixando claro que a relacao e namoro e nao uniao estavel, quando aplicavel.',
    tags: ['namoro', 'relacionamento', 'patrimonio'],
    popular: true,
    sensitive: true,
  },
  {
    title: 'Acordo de Convivencia',
    category: 'Familia',
    audience: 'Casais, companheiros e conviventes',
    description: 'Modelo para organizar regras de convivencia, despesas, bens, pets e combinados praticos entre as partes.',
    tags: ['convivencia', 'casal', 'familia'],
    sensitive: true,
  },
  {
    title: 'Contrato de Uniao Estavel',
    category: 'Familia',
    audience: 'Casais que desejam formalizar convivencia',
    description: 'Modelo base para organizar declaracoes, regime patrimonial pretendido e informacoes das partes antes de revisao profissional.',
    tags: ['uniao estavel', 'familia', 'patrimonio'],
    sensitive: true,
  },
  {
    title: 'Autorizacao para Viagem de Menor',
    category: 'Familia',
    audience: 'Pais e responsaveis',
    description: 'Documento de apoio para registrar autorizacao, datas, responsaveis, destino e contatos de emergencia.',
    tags: ['menor', 'viagem', 'autorizacao'],
    sensitive: true,
  },
  {
    title: 'Contrato de Locacao Residencial Simples',
    category: 'Imobiliario',
    audience: 'Locadores e locatarios',
    description: 'Modelo para aluguel residencial com valor, prazo, caução, reajuste, responsabilidades e entrega do imovel.',
    tags: ['locacao', 'aluguel', 'imovel'],
  },
  {
    title: 'Contrato de Locacao Comercial Simples',
    category: 'Imobiliario',
    audience: 'Pequenos negocios e proprietarios',
    description: 'Modelo para aluguel comercial com uso do espaco, prazo, pagamento, reajuste e responsabilidades.',
    tags: ['comercial', 'loja', 'imovel'],
  },
  {
    title: 'Compra e Venda de Bem Movel',
    category: 'Comercial',
    audience: 'Pessoas e pequenos negocios',
    description: 'Modelo para venda de equipamentos, veiculos, eletronicos, moveis e outros bens, com valor e entrega.',
    tags: ['compra', 'venda', 'bem movel'],
  },
  {
    title: 'Recibo de Pagamento',
    category: 'Financeiro',
    audience: 'Pessoas, MEIs e profissionais autonomos',
    description: 'Recibo simples com pagador, recebedor, valor, data, forma de pagamento e descricao do servico ou produto.',
    tags: ['recibo', 'pagamento', 'comprovante'],
  },
  {
    title: 'Confissao de Divida',
    category: 'Financeiro',
    audience: 'Credores e devedores',
    description: 'Modelo para reconhecer divida, definir valor, vencimentos, parcelas, juros, multa e forma de pagamento.',
    tags: ['divida', 'parcelas', 'cobranca'],
    popular: true,
  },
  {
    title: 'Emprestimo entre Pessoas',
    category: 'Financeiro',
    audience: 'Familiares, amigos e particulares',
    description: 'Modelo para registrar emprestimo privado com valor, prazo, devolucao, parcelas e condicoes.',
    tags: ['emprestimo', 'p2p', 'particular'],
    sensitive: true,
  },
  {
    title: 'Termo de Entrega de Chaves',
    category: 'Imobiliario',
    audience: 'Imobiliarias, locadores e locatarios',
    description: 'Registro da entrega ou devolucao de chaves, data, estado geral e observacoes do imovel.',
    tags: ['chaves', 'vistoria', 'imovel'],
  },
  {
    title: 'Termo de Vistoria Simples',
    category: 'Imobiliario',
    audience: 'Locacao, compra e venda ou entrega de bens',
    description: 'Modelo para descrever estado de conservacao, fotos, itens, divergencias e aceite das partes.',
    tags: ['vistoria', 'evidencia', 'imovel'],
  },
  {
    title: 'Contrato de Parceria Comercial',
    category: 'Comercial',
    audience: 'Empresas, influenciadores e prestadores',
    description: 'Modelo para definir responsabilidades, comissao, metas, uso de marca, prazo e confidencialidade.',
    tags: ['parceria', 'comissao', 'negocios'],
  },
  {
    title: 'Contrato de Permuta',
    category: 'Comercial',
    audience: 'Empresas e profissionais',
    description: 'Modelo para troca de produtos, servicos ou beneficios, com descricao das entregas e prazos.',
    tags: ['permuta', 'troca', 'parceria'],
  },
  {
    title: 'Termo de Uso de Imagem',
    category: 'Privacidade',
    audience: 'Criadores, empresas, eventos e escolas',
    description: 'Autorizacao para uso de imagem, voz, nome ou depoimento em campanhas, redes sociais e materiais institucionais.',
    tags: ['imagem', 'autorizacao', 'marketing'],
  },
  {
    title: 'Termo de Responsabilidade',
    category: 'Comercial',
    audience: 'Eventos, cursos, servicos e entregas',
    description: 'Modelo para registrar ciencia, responsabilidades, riscos informados e aceite de condicoes.',
    tags: ['responsabilidade', 'aceite', 'evento'],
  },
  {
    title: 'Acordo de Home Office',
    category: 'Trabalho',
    audience: 'Empresas e colaboradores',
    description: 'Modelo para combinar regras de trabalho remoto, equipamentos, horario, seguranca e confidencialidade.',
    tags: ['home office', 'trabalho', 'empresa'],
  },
  {
    title: 'Banco de Horas Simples',
    category: 'Trabalho',
    audience: 'Empresas e colaboradores',
    description: 'Documento de apoio para registrar acordo de compensacao de horas, periodo, saldo e acompanhamento.',
    tags: ['horas', 'trabalho', 'compensacao'],
    sensitive: true,
  },
  {
    title: 'Termo de Aceite de Projeto',
    category: 'Comercial',
    audience: 'Agencias, software houses e consultores',
    description: 'Modelo para registrar aceite de entrega, homologacao, pendencias e proxima etapa do projeto.',
    tags: ['projeto', 'aceite', 'entrega'],
  },
  {
    title: 'Contrato Personalizado',
    category: 'Comercial',
    audience: 'Qualquer usuario',
    description: 'Comece com estrutura em branco e use o DocWallet para assinatura, hash, certificado e historico de evidencias.',
    tags: ['personalizado', 'documento', 'assinatura'],
  },
];

export const TEMPLATE_CATEGORIES: ContractTemplateCategory[] = [
  'Comercial',
  'Pessoal',
  'Familia',
  'Imobiliario',
  'Financeiro',
  'Trabalho',
  'Privacidade',
];
