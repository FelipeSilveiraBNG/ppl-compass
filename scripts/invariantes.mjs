/**
 * invariantes.mjs — as regras que valem para o fonte do pacote.
 *
 * Vivem aqui, e não dentro do build, porque quem as confere é mais de um: o
 * `build.mjs` reprova antes de montar `dist/`, e o `lint.mjs` varre também o
 * que não entra em `dist/` — README, workflow, script. Duas listas divergiriam
 * na primeira regra nova, e a que ficasse para trás pararia de morder em
 * silêncio, que é o pior defeito possível numa checagem.
 *
 * As regras vêm em dois grupos, e a divisão não é burocracia:
 *
 *   SEMPRE     nome aposentado e a cor da identidade anterior. Se sobreviverem
 *              num comentário ou no README, voltam para o código pela mão de
 *              quem copiou o exemplo. Valem em todo arquivo.
 *
 *   ENTREGUE   emoji e CDN de terceiro. Descrevem o que o NAVEGADOR recebe. Um
 *              `✓` no relatório de um script de build é saída de terminal, não
 *              superfície do produto; tratar os dois como a mesma coisa faria a
 *              regra gritar onde não há nada para consertar — e regra que grita
 *              à toa é regra que se aprende a ignorar.
 */

/** Vale em qualquer arquivo do repositório. */
export const SEMPRE = [
  {
    re: /--color-people-|\.people-(bento|glass|mesh|serif|mono|eyebrow|fade-up)\b/,
    motivo: 'nome herdado do console — o sistema de nomes deste pacote é próprio (prefixo ppl-)',
  },
  {
    re: /#6f00ff/i,
    motivo: 'violeta da identidade anterior — a marca é o azul #2F5AD0',
  },
];

/** Vale só no que o navegador recebe: src/, templates/, demo/ e a documentação. */
export const ENTREGUE = [
  {
    re: /\bfonts\.googleapis\.com|\bfonts\.gstatic\.com/,
    motivo: 'CDN de fonte de terceiro — as fontes são self-hospedadas em src/fonts/',
  },
  {
    re: /\bcdn\.jsdelivr\.net\/(?!gh\/FelipeSilveiraBNG\/ppl-compass)/,
    motivo: 'referência a pacote de terceiro no CDN — o pacote é zero dependência',
  },
  // Zero emoji é regra do design system: ícone é ícone. A faixa inclui os
  // dingbats de propósito — um `✓` digitado no lugar do ícone de check é
  // exatamente o defeito que a regra existe para pegar.
  {
    re: /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u,
    motivo: 'emoji ou dingbat — proibido em qualquer superfície; use um ícone de ppl-compass-icons.js',
  },
];

/**
 * Os dois arquivos que CONTÊM os padrões porque os definem e os testam.
 * Um lint não consegue se conferir sem se acusar; a alternativa seria escrever
 * as regras ofuscadas, e aí ninguém mais as lê.
 */
export const AUTORREFERENTES = ['scripts/invariantes.mjs', 'scripts/lint.mjs'];

/**
 * Linhas que CITAM um nome antigo para explicar a substituição são legítimas —
 * é assim que a tabela de/para e os comentários das receitas funcionam.
 */
export const EXPLICATIVA = /→|->|console:|era |em vez de|substitu|herdad|no lugar de|proibid|aposentad/i;

/**
 * Confere um texto linha a linha.
 * @param {object} opcoes
 * @param {boolean} opcoes.entregue  aplica também as regras do que o navegador recebe
 */
export function conferir(texto, rotulo, { entregue = true } = {}) {
  if (AUTORREFERENTES.includes(rotulo)) return [];
  const regras = entregue ? [...SEMPRE, ...ENTREGUE] : SEMPRE;
  const achados = [];
  texto.split('\n').forEach((linha, i) => {
    if (EXPLICATIVA.test(linha)) return;
    for (const { re, motivo } of regras) {
      if (re.test(linha)) achados.push({ rotulo, linha: i + 1, motivo, trecho: linha.trim() });
    }
  });
  return achados;
}
