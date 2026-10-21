/**
 * Configura o Google Form de inscrição nos testes Android do CvDossier.
 *
 * Como usar:
 *   1. Abre o formulário em modo de edição → ⋮ (Mais) → Editor de scripts (Apps Script).
 *   2. Apaga o código que lá estiver, cola este ficheiro e guarda.
 *   3. Escolhe a função configurarFormulario e carrega em Executar. Autoriza quando pedido.
 *
 * Reutiliza as perguntas existentes pelos títulos atuais ou antigos, mantendo
 * as respostas e as colunas do Google Sheets ligadas. Não elimina perguntas.
 * Pode ser executado de novo sem duplicar perguntas. A imagem do cabeçalho não é alterada.
 */

const APP_STORE_URL = 'https://apps.apple.com/us/app/cvdossier/id6822973085';

const T = {
  nome: 'Nome Completo',
  pais: 'País de residência',
  telefone: 'Telefone (de preferência com WhatsApp)',
  sistema: 'Plataforma para os testes',
  email: 'E-mail da tua conta Google (Play Store)',
  situacao: 'Qual é a tua situação atual?',
  uso: 'O que queres criar com o CvDossier?',
  origem: 'Como conheceste o CvDossier?',
  testes: 'Queres participar nos testes Android?',
  consentimento: 'Autorização de contacto',
};

function configurarFormulario() {
  const form = FormApp.getActiveForm();
  form
    .setTitle('Participa nos testes Android do CvDossier')
    .setDescription(
      'O CvDossier já está disponível no iOS. Se usas iPhone, descarrega a app na App Store: ' + APP_STORE_URL + '\n\n' +
      'Este formulário destina-se apenas aos testes e ao acesso antecipado no Android. ' +
      'Inscreve-te para receberes um convite para testar ou seres avisado do lançamento no Android.\n\n' +
      'Importante: indica o e-mail da conta Google com que entras na Play Store. ' +
      'É a esse e-mail que associamos o acesso antecipado no Android.\n\n' +
      'A inscrição é gratuita e leva menos de um minuto.'
    )
    .setConfirmationMessage(
      'Obrigado! Recebemos a tua inscrição para o Android. Vamos contactar-te por e-mail sobre os testes ' +
      'ou o lançamento no Android; fica atento também à pasta de spam. ' +
      'No iPhone, já podes descarregar o CvDossier na App Store: ' + APP_STORE_URL
    )
    .setShowLinkToRespondAgain(false);

  // Devolve a pergunta já existente (com um destes títulos) ou cria uma nova do tipo indicado
  const pergunta = (titulos, tipo) => {
    const existente = form.getItems().find((i) => titulos.includes(i.getTitle()));
    return existente ? existente['as' + tipo + 'Item']() : form['add' + tipo + 'Item']();
  };

  // Perguntas que já existem no formulário
  const nome = pergunta([T.nome, 'Nome', 'Nome completo', 'Nome e Sobrenome'], 'Text')
    .setTitle(T.nome)
    .setRequired(true);

  const titulosEmail = [T.email, 'E-mail da tua conta na Play Store', 'E-mail da tua conta da loja (Play Store ou Apple Store)', 'E-mail da tua conta da loja (Play Store ou Apple ID)'];
  const emailExistente = form.getItems().some((i) => titulosEmail.includes(i.getTitle()));
  const email = pergunta(titulosEmail, 'Text')
    .setTitle(T.email)
    .setHelpText('Usa o e-mail da conta Google com que entras na Play Store no Android. O acesso aos testes é associado a essa conta.')
    .setRequired(true);
  if (!emailExistente) {
    email.setValidation(FormApp.createTextValidation()
      .setHelpText('Introduz um endereço de e-mail válido.')
      .requireTextIsEmail()
      .build());
  }

  // Perguntas novas
  const pais = pergunta([T.pais, 'País onde vives'], 'Text')
    .setTitle(T.pais)
    .setRequired(true);

  const telefone = pergunta([T.telefone], 'Text')
    .setTitle(T.telefone)
    .setHelpText('Com o indicativo do país, por exemplo +244 923 000 000.')
    .setValidation(FormApp.createTextValidation()
      .setHelpText('Indica um número válido, com o indicativo do país.')
      .requireTextMatchesPattern('^\\+?[0-9 ()-]{7,20}$')
      .build())
    .setRequired(true);

  const sistema = pergunta([T.sistema, 'Que telemóvel usas?', 'Tens um telemóvel Android para testar o CvDossier?'], 'MultipleChoice')
    .setTitle(T.sistema)
    .setHelpText('Os testes são apenas no Android. Se usas só iPhone, já podes descarregar a app na App Store: ' + APP_STORE_URL)
    .setChoiceValues(['Android (Google Play)'])
    .setRequired(true);

  const situacao = pergunta([T.situacao], 'MultipleChoice')
    .setTitle(T.situacao)
    .setChoiceValues([
      'Estudante',
      'À procura do primeiro emprego',
      'Empregado(a), à procura de uma nova oportunidade',
      'Empregado(a), só quero atualizar o currículo',
      'Trabalhador(a) independente ou freelancer',
      'Desempregado(a), à procura de trabalho',
    ])
    .showOtherOption(true)
    .setRequired(false);

  const uso = pergunta([T.uso], 'Checkbox')
    .setTitle(T.uso)
    .setHelpText('Podes escolher mais do que uma opção.')
    .setChoiceValues(['Currículo', 'Carta de apresentação', 'Carta de motivação', 'Carta de recomendação'])
    .setRequired(false);

  const origem = pergunta([T.origem], 'MultipleChoice')
    .setTitle(T.origem)
    .setChoiceValues(['Instagram', 'TikTok', 'Facebook', 'LinkedIn', 'YouTube', 'Amigos ou família', 'Pesquisa na internet'])
    .showOtherOption(true)
    .setRequired(false);

  const testes = pergunta([T.testes, 'Queres testar a app antes do lançamento?', 'Queres testar o CvDossier no Android?'], 'MultipleChoice')
    .setTitle(T.testes)
    .setHelpText('Os testes são feitos apenas no Android, pela Google Play, com o e-mail que indicaste acima.')
    .setChoiceValues(['Sim, quero receber um convite para testar no Android', 'Não, avisem-me só do lançamento no Android'])
    .setRequired(true);

  const consentimento = pergunta([T.consentimento], 'Checkbox')
    .setTitle(T.consentimento)
    .setChoiceValues(['Aceito que o CvDossier use estes dados para me contactar sobre os testes, o acesso antecipado e o lançamento no Android, conforme a Política de privacidade (cvdossier.app/privacidade.html).'])
    .setRequired(true);

  // Ordem final: o sistema confirma o Android antes do e-mail da Play Store.
  [nome, pais, telefone, sistema, email, situacao, uso, origem, testes, consentimento]
    .forEach((it, i) => form.moveItem(it.getIndex(), i));
}
