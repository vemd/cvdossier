#!/usr/bin/env python3
"""Gera termos.html, privacidade.html e eliminacao-de-conta.html.

Os textos vêm dos documentos de Jurídico e Privacidade:
  ../departamentos/juridico-e-privacidade/documentos/*.txt
Quando esses documentos mudarem, voltar a executar:
  python3 gerar-paginas-legais.py
"""
import html
import re
from pathlib import Path

AQUI = Path(__file__).resolve().parent
DOCS = AQUI.parent / 'departamentos' / 'juridico-e-privacidade' / 'documentos'
EMAIL = 'geralcvdossier@gmail.com'

TABS = [
    ('termos.html', 'Termos de utilização'),
    ('privacidade.html', 'Política de privacidade'),
    ('eliminacao-de-conta.html', 'Eliminação de conta'),
]


def linkify(text):
    # Mantém os contactos de suporte e de envio da CvDossier ao regenerar.
    text = re.sub(r'[\w.+-]+@[\w-]+\.[\w.]+\w',
                  lambda m: 'noreply@cvdossier.app' if m[0].startswith('noreply@') else EMAIL, text)
    text = html.escape(text, quote=False)
    text = re.sub(r'(https?://[^\s<]+?)([.,;:)]?)(?=\s|$)',
                  r'<a href="\1" target="_blank" rel="noopener">\1</a>\2', text)
    text = re.sub(r'(?<![\w/.@])(?!noreply@)([\w.+-]+@[\w-]+\.[\w.]+\w)',
                  r'<a href="mailto:\1">\1</a>', text)
    return text


def parse(path):
    lines = path.read_text(encoding='utf-8').splitlines()
    meta = next(l for l in lines if l.startswith('Versão'))
    sections, current = [], None
    for line in lines[1:]:
        line = line.strip()
        if not line or line == meta:
            continue
        m = re.match(r'^(\d+)\.\s+(.+)$', line)
        if m and len(line) < 90 and not line.endswith('.'):
            current = {'n': m.group(1), 'title': m.group(2), 'paras': []}
            sections.append(current)
        elif current:
            current['paras'].append(line)
    return meta, sections


def page(file, title_html, plain_title, description, meta, body):
    tabs = '\n'.join(
        f'        <a href="{href}"{" aria-current=\"page\"" if href == file else ""}>{label}</a>'
        for href, label in TABS)
    return f'''<!doctype html>
<html lang="pt">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{plain_title} — CvDossier</title>
  <meta name="description" content="{description}">
  <meta name="theme-color" content="#0A2A6B">
  <link rel="canonical" href="https://cvdossier.app/{file}">
  <link rel="icon" type="image/png" href="assets/marca/favicon.png">
  <link rel="apple-touch-icon" href="assets/marca/apple-touch-icon.png">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Instrument+Serif:ital@0;1&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="styles.css">
</head>
<body class="legal-page">
  <a class="skip" href="#conteudo">Saltar para o conteúdo</a>
  <header class="site-header">
    <div class="container header-inner">
      <a class="brand" href="index.html" aria-label="CvDossier — início">
        <img src="assets/marca/simbolo.png" alt="" width="30" height="34">
        <span class="wordmark"><span class="wm-cv">Cv</span>Dossier</span>
      </a>
      <a class="back" href="index.html">← Voltar ao site</a>
    </div>
  </header>

  <main id="conteudo">
    <div class="legal-hero">
      <div class="container">
        <h1>{title_html}</h1>
        <p class="legal-meta">{meta}</p>
        <p class="legal-meta">Contacto de suporte: geralcvdossier@gmail.com.</p>
        <nav class="legal-tabs" aria-label="Documentos legais">
{tabs}
        </nav>
      </div>
    </div>
{body}
  </main>

  <footer class="site-footer">
    <div class="container footer-bottom" style="margin-top:0;border-top:0;padding-top:0">
      <span>© <span data-year>2026</span> Cv Dossier. Todos os direitos reservados.</span>
      <span><a href="mailto:{EMAIL}">{EMAIL}</a></span>
    </div>
  </footer>
  <script src="script.js" defer></script>
</body>
</html>
'''


def legal_doc(src, file, title_html, plain_title, description):
    meta, sections = parse(DOCS / src)
    toc = '\n'.join(f'          <li><a href="#s{s["n"]}">{html.escape(s["title"])}</a></li>' for s in sections)
    secs = []
    for s in sections:
        paras = '\n'.join(f'          <p>{linkify(p)}</p>' for p in s['paras'])
        secs.append(f'''        <section id="s{s["n"]}">
          <h2><span class="n">{int(s["n"]):02d}</span>{html.escape(s["title"])}</h2>
{paras}
        </section>''')
    body = f'''    <div class="container legal-layout">
      <nav class="toc" aria-label="Índice">
        <h2>Índice</h2>
        <ol>
{toc}
        </ol>
      </nav>
      <article class="legal-body">
{chr(10).join(secs)}
        <div class="legal-contact">
          <h3>Tens alguma dúvida?</h3>
          <p>Escreve para <a href="mailto:{EMAIL}">{EMAIL}</a>.</p>
        </div>
      </article>
    </div>'''
    (AQUI / file).write_text(page(file, title_html, plain_title, description, html.escape(meta), body), encoding='utf-8')
    print(f'{file}: {len(sections)} secções')


ELIMINACAO = f'''    <div class="container legal-layout">
      <nav class="toc" aria-label="Índice">
        <h2>Índice</h2>
        <ol>
          <li><a href="#passos">Como eliminar</a></li>
          <li><a href="#prazo">O prazo de 30 dias</a></li>
          <li><a href="#premium">Assinatura Premium</a></li>
          <li><a href="#sem-acesso">Sem acesso à app</a></li>
          <li><a href="#o-que-fica">O que não é apagado</a></li>
        </ol>
      </nav>
      <article class="legal-body">
        <section id="passos">
          <h2>Como eliminar a tua conta</h2>
          <ol class="del-steps">
            <li><h3>Exporta o que queres guardar</h3><p>Antes de pedires a eliminação, exporta em PDF, Word ou PowerPoint os documentos que pretendes conservar.</p></li>
            <li><h3>Pede a eliminação na app</h3><p>Abre o CvDossier, entra na tua conta e inicia a eliminação nas definições.</p></li>
            <li><h3>Tens 30 dias para mudar de ideias</h3><p>Durante esse período podes cancelar o pedido nas próprias definições. Entrar novamente na conta não cancela o pedido.</p></li>
            <li><h3>A conta e os dados são removidos</h3><p>Depois dos 30 dias, o servidor bloqueia o acesso aos dados e o processo de limpeza remove as fotografias, a conta e os documentos associados.</p></li>
          </ol>
        </section>

        <section id="prazo">
          <h2>O prazo de 30 dias</h2>
          <div class="timeline">
            <div><strong>Dia 0</strong><span>Pedes a eliminação nas definições da app.</span></div>
            <div><strong>Até ao dia 30</strong><span>Podes cancelar o pedido nas definições.</span></div>
            <div><strong>Depois do dia 30</strong><span>O acesso é bloqueado e começa a limpeza.</span></div>
          </div>
          <p>O fim do período de cancelamento não significa que todas as operações de limpeza se concluam no mesmo instante. O procedimento de 30 dias não limita direitos legais que exijam outra resposta, como a eliminação ou o bloqueio de um tratamento ilícito.</p>
        </section>

        <section id="premium">
          <h2>Tens a assinatura Premium?</h2>
          <div class="callout"><strong>Eliminar a conta não cancela a assinatura.</strong>Para evitar novas cobranças, cancela também a assinatura na loja onde a contrataste. Não é preciso cancelar primeiro para pedires a eliminação.</div>
          <p>Para gerir ou cancelar no Google Play: <a href="https://support.google.com/googleplay/answer/7018481?hl=pt" target="_blank" rel="noopener">support.google.com/googleplay/answer/7018481</a>. Na Apple: <a href="https://support.apple.com/pt-br/118428" target="_blank" rel="noopener">support.apple.com/pt-br/118428</a>.</p>
        </section>

        <section id="sem-acesso">
          <h2>Não consegues aceder à app?</h2>
          <p>Para pedir a eliminação sem utilizar a aplicação, ou se não conseguires aceder à conta, escreve para <a href="mailto:{EMAIL}?subject=Eliminar%20a%20minha%20conta%20CvDossier">{EMAIL}</a> e indica que pretendes eliminar a tua conta CvDossier.</p>
          <p>Podemos pedir apenas as informações necessárias para confirmar a tua identidade e evitar a eliminação indevida da conta de outra pessoa. <strong>Não envies a tua palavra-passe.</strong></p>
        </section>

        <section id="o-que-fica">
          <h2>O que não é apagado automaticamente</h2>
          <p>Os ficheiros que já exportaste e guardaste fora da aplicação, ou que partilhaste com outras pessoas, permanecem no destino onde foram guardados ou partilhados.</p>
          <p>Informações que tenham de ser conservadas por obrigação legal ficam limitadas a essa finalidade e ao período justificado. Consulta a <a href="privacidade.html#s11">Política de privacidade</a> para conheceres a conservação dos dados e os teus direitos.</p>
        </section>

        <div class="legal-contact">
          <h3>Precisas de ajuda?</h3>
          <p>Escreve para <a href="mailto:{EMAIL}">{EMAIL}</a>.</p>
        </div>
      </article>
    </div>'''


if __name__ == '__main__':
    legal_doc('TERMOS_DE_UTILIZACAO.txt', 'termos.html',
              'Termos de <em>utilização.</em>', 'Termos de utilização',
              'As condições de utilização do CvDossier e as responsabilidades relacionadas com os documentos que preparas.')
    legal_doc('POLITICA_DE_PRIVACIDADE.txt', 'privacidade.html',
              'Política de <em>privacidade.</em>', 'Política de privacidade',
              'Como o CvDossier trata os teus dados pessoais e como exerces os teus direitos.')
    (AQUI / 'eliminacao-de-conta.html').write_text(page(
        'eliminacao-de-conta.html', 'Gestão e eliminação de <em>conta.</em>', 'Gestão e eliminação de conta',
        'Como eliminar a tua conta CvDossier e o que acontece aos teus dados.',
        'Como eliminar a tua conta CvDossier e o que acontece aos teus dados.', ELIMINACAO), encoding='utf-8')
    print('eliminacao-de-conta.html: ok')
