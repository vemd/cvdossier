/**
 * Configura o Google Form de inscrição no pré-lançamento do CvDossier.
 *
 * Como usar:
 *   1. Abre o formulário em modo de edição → ⋮ (Mais) → Editor de scripts (Apps Script).
 *   2. Apaga o código que lá estiver, cola este ficheiro e guarda.
 *   3. Escolhe a função configurarFormulario e carrega em Executar. Autoriza quando pedido.
 *
 * Mantém as perguntas Nome e E-mail que já existem (as respostas e as colunas do
 * Google Sheets continuam ligadas) e acrescenta as restantes. Pode ser executado
 * de novo sem duplicar perguntas. A imagem do cabeçalho não é alterada.
 */

const T = {
  nome: 'Nome e Sobrenome',
  pais: 'País de residência',
  telefone: 'Telefone (de preferência com WhatsApp)',
  sistema: 'Que telemóvel usas?',
  email: 'E-mail da tua conta da loja (Play Store ou Apple Store)',
  situacao: 'Qual é a tua situação atual?',
  uso: 'O que queres criar com o CvDossier?',
  origem: 'Como conheceste o CvDossier?',
  testes: 'Queres testar a app antes do lançamento?',
  consentimento: 'Autorização de contacto',
};

function configurarFormulario() {
  const form = FormApp.getActiveForm();
  form
    .setTitle('Sê um dos primeiros a usar o CvDossier!')
    .setDescription(
      'O CvDossier chega em breve ao Android e ao iOS. Inscreve-te para seres avisado no lançamento ' +
      'e, se quiseres, receberes um convite para testar a app antes de toda a gente.\n\n' +
      'Importante: indica o e-mail da conta da tua loja. No Android, o e-mail da conta Google com que ' +
      'entras na Play Store; no iPhone, o e-mail do teu Apple ID. É a esse e-mail que associamos o acesso antecipado.\n\n' +
      'A inscrição é gratuita e leva menos de um minuto.'
    )
    .setConfirmationMessage(
      'Obrigado! Já estás na lista do CvDossier. Vamos avisar-te por e-mail; fica atento também à pasta de spam. ' +
      'Enquanto esperas, segue-nos no Instagram, TikTok e Facebook: @cvdossier.app'
    )
    .setShowLinkToRespondAgain(false);

  // Devolve a pergunta já existente (com um destes títulos) ou cria uma nova do tipo indicado
  const pergunta = (titulos, tipo) => {
    const existente = form.getItems().find((i) => titulos.includes(i.getTitle()));
    return existente ? existente['as' + tipo + 'Item']() : form['add' + tipo + 'Item']();
  };

  // Apagar perguntas de resposta curta sem título (sobras de uma execução que falhou)
  form.getItems(FormApp.ItemType.TEXT)
    .filter((i) => !i.getTitle() && !i.getHelpText())
    .forEach((i) => form.deleteItem(i));

  // Perguntas que já existem no formulário
  const nome = pergunta([T.nome, 'Nome', 'Nome completo'], 'Text')
    .setTitle(T.nome)
    .setRequired(true);

  const emailExistente = form.getItems().some((i) => [T.email, 'E-mail da tua conta da loja (Play Store ou Apple ID)', 'E-mail da tua conta na Play Store'].includes(i.getTitle()));
  const email = pergunta([T.email, 'E-mail da tua conta da loja (Play Store ou Apple ID)', 'E-mail da tua conta na Play Store'], 'Text')
    .setTitle(T.email)
    .setHelpText('Android: a conta Google da Play Store. iPhone: o e-mail do teu Apple ID.')
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

  const sistema = pergunta([T.sistema], 'MultipleChoice')
    .setTitle(T.sistema)
    .setChoiceValues(['Android (Google Play)', 'iPhone (iOS · App Store)', 'Uso os dois'])
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

  const testes = pergunta([T.testes], 'MultipleChoice')
    .setTitle(T.testes)
    .setHelpText('Os testes são feitos pela Google Play ou pelo TestFlight da Apple, com o e-mail que indicaste acima.')
    .setChoiceValues(['Sim, quero receber um convite para testar', 'Não, avisem-me só quando for lançada'])
    .setRequired(true);

  const consentimento = pergunta([T.consentimento], 'Checkbox')
    .setTitle(T.consentimento)
    .setChoiceValues(['Aceito que o CvDossier use estes dados para me contactar sobre o lançamento e o acesso antecipado, conforme a Política de privacidade (cvdossier.app/privacidade.html).'])
    .setRequired(true);

  // Ordem final: o sistema vem antes do e-mail, para a pessoa saber que conta indicar
  [nome, pais, telefone, sistema, email, situacao, uso, origem, testes, consentimento]
    .forEach((it, i) => form.moveItem(it.getIndex(), i));
}
