/**
 * gerar-icones.mjs — emite `src/ppl-compass-icons.js` a partir do lucide.
 *
 * POR QUE ISTO EXISTE: o design system usa lucide como biblioteca única (DS-03),
 * e a produção (console + PWA) consome `lucide-react`. O framework NÃO pode
 * carregar o pacote em runtime — nem o react, nem o lucide, nem nada: o
 * consumidor recebe dois arquivos de CDN e abre o HTML. A saída é reusar os
 * DADOS (o lucide é ISC, que permite com atribuição) e embuti-los no bundle.
 * `lucide-static` é devDependency de BUILD, como o playwright-core do smoke:
 * nada disso vai para o `dist/`. Ver NOTICE.md.
 *
 * A minor pinada (0.575) é a mesma do `lucide-react` da produção, então o
 * protótipo e o produto desenham o mesmo traço. Trocar a minor é decisão, não
 * efeito colateral de `npm update` — por isso a versão é conferida aqui e o
 * gerador REPROVA se ela não casar com o que este arquivo espera.
 *
 * ALIASES: o `lucide-react` mantém nomes depreciados (`AlertTriangle`) apontando
 * para o canônico (`triangle-alert`) — a geometria é idêntica, só a classe CSS
 * do SVG difere. `src/icones.txt` lista os CANÔNICOS de propósito: alias é nome
 * com prazo, e a regra do pacote é que nome errado quebre em vez de sobreviver.
 *
 * USO:  npm run icones
 */
import fs from 'node:fs';
import path from 'node:path';

const RAIZ = path.resolve(import.meta.dirname, '..');
const MINOR_ESPERADA = '0.575';

/* A lista mora em `scripts/`, e não em `src/`, porque `src/` é o que EMBARCA:
 * o build copia todo arquivo não-css/js de lá para `dist/`, e a lista é entrada
 * de build, não entregável. A licença ISC, ao contrário, embarca de propósito. */
const LISTA = path.join(RAIZ, 'scripts/icones.txt');
const SAIDA = path.join(RAIZ, 'src/ppl-compass-icons.js');
const PACOTE = path.join(RAIZ, 'node_modules/lucide-static');

/* As sete primitivas que a biblioteca usa. O renderizador antigo só sabia
 * `<path>` — e mais de um terço dos ícones do lucide usa circle/rect/line, então
 * um mapa só-de-path não conseguiria guardar o que a produção já desenha. */
const PRIMITIVAS = ['path', 'circle', 'ellipse', 'line', 'polygon', 'polyline', 'rect'];

function morrer(mensagem) {
  process.stderr.write(`\n  ERRO  ${mensagem}\n\n`);
  process.exit(1);
}

/* ── entrada ─────────────────────────────────────────────────────────────── */

if (!fs.existsSync(PACOTE)) {
  morrer('lucide-static não instalado — rode `npm install` (é devDependency).');
}

const versao = JSON.parse(
  fs.readFileSync(path.join(PACOTE, 'package.json'), 'utf8'),
).version;

if (!versao.startsWith(`${MINOR_ESPERADA}.`)) {
  morrer(
    `lucide-static@${versao} instalado, mas este gerador espera ${MINOR_ESPERADA}.x ` +
      `(a minor que o lucide-react da produção usa).\n        Se a troca de minor é ` +
      `intencional, atualize MINOR_ESPERADA aqui e confira os desenhos que mudaram.`,
  );
}

const nós = JSON.parse(
  fs.readFileSync(path.join(PACOTE, 'icon-nodes.json'), 'utf8'),
);

const nomes = fs
  .readFileSync(LISTA, 'utf8')
  .split(/\r?\n/)
  .map((l) => l.replace(/#.*$/, '').trim())
  .filter(Boolean);

if (!nomes.length) morrer(`${path.basename(LISTA)} não listou nenhum ícone.`);

const duplicados = nomes.filter((n, i) => nomes.indexOf(n) !== i);
if (duplicados.length) {
  morrer(`nome repetido em icones.txt: ${[...new Set(duplicados)].join(', ')}`);
}

/* Nome inexistente reprova em vez de emitir um ícone vazio: `svg()` devolve ''
 * para nome desconhecido, então um erro de digitação aqui viraria um espaço em
 * branco no protótipo — defeito que ninguém procura. */
const desconhecidos = nomes.filter((n) => !nós[n]);
if (desconhecidos.length) {
  const dica = desconhecidos
    .map((n) => {
      const svg = path.join(PACOTE, 'icons', `${n}.svg`);
      return fs.existsSync(svg)
        ? `        ${n} — existe como ALIAS; use o nome canônico`
        : `        ${n} — não existe na biblioteca`;
    })
    .join('\n');
  morrer(`${desconhecidos.length} nome(s) fora da biblioteca:\n${dica}`);
}

/* ── conversão ───────────────────────────────────────────────────────────── */

/* Um ícone é uma lista de elementos. `<path>` — o caso comum — é gravado como a
 * string do `d` pura, e não como tupla: são 136 ícones e a maioria é só path, de
 * modo que a forma curta paga o arquivo inteiro. Qualquer outra primitiva vira
 * `[tag, atributos]`. O renderizador distingue por `typeof`. */
function elemento([tag, atributos]) {
  if (!PRIMITIVAS.includes(tag)) {
    morrer(`primitiva inesperada <${tag}> — o renderizador não sabe emitir isso.`);
  }
  if (tag === 'path' && Object.keys(atributos).length === 1 && atributos.d) {
    return JSON.stringify(atributos.d);
  }
  return `[${JSON.stringify(tag)},${JSON.stringify(atributos)}]`;
}

const larguraNome = Math.max(...nomes.map((n) => n.length)) + 3;
const linhas = nomes.map((n) => {
  const chave = `'${n}':`.padEnd(larguraNome);
  return `    ${chave}[${nós[n].map(elemento).join(',')}]`;
});

const contagem = {
  total: nomes.length,
  primitivas: [
    ...new Set(nomes.flatMap((n) => nós[n].map(([t]) => t))),
  ].sort(),
};

/* ── saída ───────────────────────────────────────────────────────────────── */

const arquivo = `/*!
 * ppl-compass — ícones
 *
 * ARQUIVO GERADO — não edite à mão. Para mudar o conjunto, mexa em
 * \`src/icones.txt\` e rode \`npm run icones\`.
 *
 * ${contagem.total} ícones do lucide (ISC), extraídos de lucide-static@${versao} — a mesma minor
 * que o console e a PWA consomem via lucide-react (DS-03), para que o protótipo
 * e o produto desenhem o mesmo traço. Os dados estão EMBUTIDOS: o pacote lucide
 * não é carregado em runtime e a promessa de zero dependência continua de pé.
 *
 * Licença ISC do lucide em \`dist/LICENSE-lucide.txt\`, redistribuída com o
 * pacote — é a condição do reuso. Ver NOTICE.md.
 *
 * Grade 24×24, traço 2, pontas e junções arredondadas, sem preenchimento — a
 * gramática do lucide, e a que a produção renderiza.
 *
 * Uso declarativo (hidratado pelo init):   <i data-ppl-icon="wallet" data-ppl-size="16"></i>
 * Uso imperativo:                          PplCompass.icon('wallet', 16)
 *
 * Zero emoji em qualquer superfície: ícone é ícone, e vem daqui.
 */
(function (global) {
  'use strict';

  /* Cada ícone é uma lista de elementos:
   *   string          -> <path d="…">, o caso comum
   *   [tag, atributos] -> qualquer outra primitiva (${contagem.primitivas.filter((p) => p !== 'path').join(', ')})
   */
  var D = {
${linhas.join(',\n')}
  };

  function elemento(e) {
    if (typeof e === 'string') return '<path d="' + e + '"/>';
    var atributos = e[1], saida = '<' + e[0];
    for (var k in atributos) {
      if (Object.prototype.hasOwnProperty.call(atributos, k)) {
        saida += ' ' + k + '="' + atributos[k] + '"';
      }
    }
    return saida + '/>';
  }

  /**
   * Devolve o markup SVG do ícone.
   * \`aria-hidden\` sempre: no design system o ícone acompanha texto, nunca o
   * substitui. Se algum dia um ícone for a única informação, quem chama põe
   * um rótulo acessível por fora.
   */
  function svg(nome, tamanho) {
    var desenho = D[nome];
    if (!desenho) return '';
    var t = tamanho || 18;
    return '<svg width="' + t + '" height="' + t + '" viewBox="0 0 24 24" fill="none" ' +
      'stroke="currentColor" stroke-width="2" stroke-linecap="round" ' +
      'stroke-linejoin="round" aria-hidden="true" focusable="false">' +
      desenho.map(elemento).join('') +
      '</svg>';
  }

  global.PplCompassIcons = {
    /* \`desenhos\`, e não \`paths\`: desde a adoção do lucide um ícone pode trazer
       circle/rect/line, então \`paths\` passaria a mentir sobre o que guarda. */
    desenhos: D,
    svg: svg,
    /** Nomes disponíveis — útil para conferir se um ícone existe antes de usar. */
    nomes: function () { return Object.keys(D).sort(); }
  };
})(window);
`;

/* A licença ISC acompanha o pacote: é a condição que o ISC põe para o reuso dos
 * dados, e o NOTICE.md promete que ela viaja junto. Copiada do pacote em vez de
 * transcrita — transcrição envelhece e ninguém confere. */
const licencaOrigem = path.join(PACOTE, 'LICENSE');
const licencaDestino = path.join(RAIZ, 'src/LICENSE-lucide.txt');
const licenca = fs.readFileSync(licencaOrigem, 'utf8');

/* ── nome referenciado que não existe ────────────────────────────────────
 *
 * O DEFEITO QUE ISTO EXISTE PARA PEGAR, e ele já aconteceu: a adoção do lucide
 * renomeou 39 ícones, a migração cobriu `data-ppl-icon="…"` e `.icon('…')`, e
 * deixou de fora `"icone": "…"` — a chave que o JSON do `data-ppl-nav` usa — e
 * os literais dentro de `icons.svg(…)` no próprio ppl-compass.js. Resultado: os
 * ícones do menu e os do toast desapareceram em 37 referências.
 *
 * E desapareceram EM SILÊNCIO, que é o que torna isto indispensável: `svg()`
 * devolve '' para nome desconhecido, e quem consome faz `innerHTML = ''`. Não
 * sobra `<i data-ppl-icon>` para conferir nem `<svg>` vazio para contar — nada
 * no DOM registra que um ícone deveria estar ali. Nenhuma inspeção de página
 * pega; só a conferência estática do nome pega.
 * ─────────────────────────────────────────────────────────────────────── */

/** Onde um nome de ícone pode aparecer declarado. */
const REFERENCIAS = [
  { re: /data-ppl-icon="([a-z0-9-]+)"/g, rotulo: 'data-ppl-icon' },
  { re: /"icone"\s*:\s*"([a-z0-9-]+)"/g, rotulo: 'JSON "icone"' },
];

/* Chamadas cujos ARGUMENTOS carregam nome de ícone. Regex de argumento único
 * não serve: o toast passa um ternário (`tipo === 'success' ? 'circle-check' :
 * …`), e foi exatamente ali que um nome morto sobreviveu. Então lemos a lista de
 * argumentos inteira, equilibrando parênteses, e conferimos TODO literal que
 * tenha forma de nome de ícone. */
const CHAMADAS = ['icons.svg(', 'PplCompassIcons.svg(', '.icon(', 'comSvg('];

/* `comSvg(classe, nome, tamanho)` passa uma CLASSE no 1º argumento, e
 * 'ppl-chevron' tem forma de nome de ícone. Nome de ícone nunca começa com
 * `ppl-` — é o prefixo das classes deste pacote —, então a exclusão é segura e
 * não precisa saber a posição de cada argumento de cada função. */
const ehNomePlausivel = (s) => /^[a-z][a-z0-9-]*$/.test(s) && !s.startsWith('ppl-');

function literaisDeChamadas(texto) {
  const achados = [];
  for (const chamada of CHAMADAS) {
    let i = 0;
    while ((i = texto.indexOf(chamada, i)) !== -1) {
      let profundidade = 1;
      let j = i + chamada.length;
      const inicio = j;
      while (j < texto.length && profundidade > 0) {
        if (texto[j] === '(') profundidade++;
        else if (texto[j] === ')') profundidade--;
        j++;
      }
      /* Literal COMPARADO não é argumento. No toast o nome sai de
       * `tipo === 'success' ? 'circle-check' : …` — sem esta poda, 'success' e
       * 'error' seriam acusados de ícone inexistente a cada execução, e uma
       * checagem que acusa o que está certo é uma checagem que se aprende a
       * ignorar. Some-se o operando; sobra só o que de fato vira ícone. */
      const args = texto.slice(inicio, j - 1).replace(/[!=]==?\s*(['"])[^'"]*\1/g, '');
      for (const m of args.matchAll(/['"]([^'"]+)['"]/g)) {
        if (ehNomePlausivel(m[1])) achados.push({ nome: m[1], rotulo: chamada.replace('(', '()') });
      }
      i = j;
    }
  }
  return achados;
}

/* Nome vindo de variável (`comSvg(null, it.icone, 16)`) não é conferível aqui —
 * é por isso que a chave `"icone"` do JSON é conferida à parte: ela é a fonte
 * estática de onde aquele valor dinâmico sai. */
function conferirReferencias() {
  const arquivos = [
    'index.html',
    'src/ppl-compass.js',
    ...['templates', 'demo'].flatMap((pasta) => {
      const dir = path.join(RAIZ, pasta);
      if (!fs.existsSync(dir)) return [];
      return fs.readdirSync(dir).filter((f) => f.endsWith('.html')).map((f) => `${pasta}/${f}`);
    }),
  ];

  const quebradas = [];
  let examinadas = 0;

  for (const rel of arquivos) {
    const abs = path.join(RAIZ, rel);
    if (!fs.existsSync(abs)) continue;
    const texto = fs.readFileSync(abs, 'utf8');

    const refs = [
      ...REFERENCIAS.flatMap(({ re, rotulo }) =>
        [...texto.matchAll(re)].map((m) => ({ nome: m[1], rotulo })),
      ),
      ...literaisDeChamadas(texto),
    ];

    for (const { nome, rotulo } of refs) {
      examinadas++;
      if (!nós[nome]) quebradas.push(`${rel}  ${nome}  (${rotulo})`);
    }
  }

  return { quebradas, examinadas };
}

/* ── `--conferir`: o guard de deriva ──────────────────────────────────────
 *
 * O arquivo de ícones é GERADO e VERSIONADO. Versionar a saída é deliberado —
 * quem clona o repo tem o pacote inteiro sem `npm install` —, mas cria a chance
 * de alguém editar `src/ppl-compass-icons.js` à mão apesar do aviso no topo. A
 * próxima geração reverteria a edição em silêncio, e "em silêncio" é o defeito
 * que este repo não aceita. Então o `check` confere em vez de confiar.
 * ──────────────────────────────────────────────────────────────────────── */
if (process.argv.includes('--conferir')) {
  const derivou = [];
  const igual = (destino, esperado) =>
    fs.existsSync(destino) && fs.readFileSync(destino, 'utf8') === esperado;

  if (!igual(SAIDA, arquivo)) derivou.push(path.relative(RAIZ, SAIDA));
  if (!igual(licencaDestino, licenca)) derivou.push(path.relative(RAIZ, licencaDestino));

  if (derivou.length) {
    morrer(
      `arquivo gerado fora de sincronia com scripts/icones.txt:\n` +
        derivou.map((d) => `        ${d}`).join('\n') +
        `\n\n        Rode \`npm run icones\` e versione o resultado.`,
    );
  }

  const { quebradas, examinadas } = conferirReferencias();
  if (quebradas.length) {
    morrer(
      `${quebradas.length} referência(s) a ícone que NÃO existe no conjunto — ` +
        `renderizam vazio sem deixar vestígio no DOM:\n` +
        quebradas.map((q) => `        ${q}`).join('\n') +
        `\n\n        Ou o nome está errado, ou o ícone falta em scripts/icones.txt.`,
    );
  }

  process.stdout.write(
    `  ✓ ícones em sincronia  (${contagem.total} de scripts/icones.txt, lucide-static@${versao})\n` +
      `  ✓ nome referenciado existe  (${examinadas} referências em uso)\n`,
  );
  process.exit(0);
}

fs.writeFileSync(SAIDA, arquivo);
fs.writeFileSync(licencaDestino, licenca);

process.stdout.write(
  `\n  ícones gerados: ${contagem.total}  (lucide-static@${versao}, ISC)\n` +
    `  primitivas emitidas: ${contagem.primitivas.join(', ')}\n` +
    `  ${path.relative(RAIZ, SAIDA)} — ${(fs.statSync(SAIDA).size / 1024).toFixed(1)} KB\n` +
    `  ${path.relative(RAIZ, licencaDestino)} — licença ISC copiada do pacote\n\n`,
);
