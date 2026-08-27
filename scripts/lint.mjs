#!/usr/bin/env node
/**
 * lint.mjs — as checagens de higiene do repositório.
 *
 * Roda só aqui, em PR. Não toca em nada que o consumidor baixa: R3 é sobre o
 * consumidor, não sobre nós.
 *
 *   node scripts/lint.mjs              confere o repositório
 *   node scripts/lint.mjs --autoteste  confere as CHECAGENS
 *
 * Sobre o `--autoteste`: cada regra é rodada contra uma entrada que ela TEM que
 * reprovar. Um lint que parou de morder é pior do que lint nenhum — o repositório
 * segue verde e a garantia virou decoração, sem que ninguém perceba. Ele roda no
 * CI antes do lint de verdade, e é o que sustenta o "reprovam de verdade" da
 * Fase 4 do PLANO.
 */
import { readdir, readFile } from 'node:fs/promises';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { conferir } from './invariantes.mjs';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');

/* ══════════════════════════════════════════════════════════════════════════
 * Utilidades
 * ═══════════════════════════════════════════════════════════════════════ */

async function listar(dir, base = raiz) {
  const saida = [];
  let itens;
  try {
    itens = await readdir(dir, { withFileTypes: true });
  } catch {
    return saida;
  }
  for (const item of itens) {
    if (item.name.startsWith('.') || item.name === 'node_modules') continue;
    const caminho = join(dir, item.name);
    if (item.isDirectory()) saida.push(...(await listar(caminho, base)));
    else saida.push(relative(base, caminho).split('\\').join('/'));
  }
  return saida;
}

/** Tira do HTML o que não é marcação da tela: script, JSON de config e comentário. */
function soMarcacao(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '');
}

/** Separa a página das superfícies modais — cada uma é uma tela por si. */
function superficies(html) {
  const modais = [];
  const semModais = html.replace(
    /<div class="ppl-drawer"[\s\S]*?\n<\/div>/g,
    (bloco) => { modais.push(bloco); return ''; },
  );
  return { pagina: semModais, modais };
}

const contar = (texto, agulha) => texto.split(agulha).length - 1;

/* ══════════════════════════════════════════════════════════════════════════
 * 1 · TOKEN REFERENCIADO ≠ TOKEN DEFINIDO
 * --------------------------------------------------------------------------
 * Pega a classe inteira do problema que produziu os quatro órfãos do console
 * (`docs/01` §8): `--color-people-veu` e companhia eram referenciados e nunca
 * definidos, então resolviam para NADA — badge transparente, foco sem cor,
 * botão branco com texto branco. Nenhum deles quebrava o build; todos
 * quebravam a tela, em silêncio.
 * ═══════════════════════════════════════════════════════════════════════ */
async function checarTokens(arquivos, ler) {
  const definidos = new Set();
  const referenciados = new Map();          // token → onde apareceu primeiro

  for (const rel of arquivos) {
    if (!/\.(css|js|html)$/.test(rel)) continue;
    const texto = await ler(rel);
    for (const m of texto.matchAll(/(--ppl-[a-z0-9-]+)\s*:/g)) definidos.add(m[1]);
    for (const m of texto.matchAll(/var\(\s*(--ppl-[a-z0-9-]+)/g)) {
      if (!referenciados.has(m[1])) referenciados.set(m[1], rel);
    }
  }

  const erros = [];
  for (const [token, onde] of referenciados) {
    if (!definidos.has(token)) {
      erros.push(`${token} é referenciado em ${onde} e nunca definido — resolve para nada.`);
    }
  }

  const ociosos = [...definidos].filter((t) => !referenciados.has(t));
  return { erros, nota: ociosos.length ? `${ociosos.length} tokens definidos e não referenciados` : null };
}

/* ══════════════════════════════════════════════════════════════════════════
 * 2 · UM CTA SÓLIDO POR SUPERFÍCIE · NO MÁXIMO UM DOURADO
 * --------------------------------------------------------------------------
 * DS-07 e DS v5 §2.6. Vale por SUPERFÍCIE, não por arquivo: um drawer aberto
 * cobre a página e tem o próprio CTA — contar os dois juntos acusaria o padrão
 * certo de errado.
 *
 * A galeria fica de fora: ela é um catálogo de componentes, não uma tela. Todo
 * botão dela existe para ser olhado, não para ser clicado como decisão.
 *
 * O que sai de `<script>` também fica de fora — o Wizard desenha o próprio
 * "Avançar", e ele nunca divide a tela com outro CTA sólido.
 * ═══════════════════════════════════════════════════════════════════════ */
const CTA_SOLIDO = ['ppl-btn--primary', 'ppl-btn--hero'];
const DOURADO = ['ppl-btn--gold', 'ppl-badge--gold', 'ppl-icon-tile--gold', 'ppl-nav__mark'];

async function checarTelas(arquivos, ler) {
  const erros = [];

  for (const rel of arquivos) {
    if (!rel.startsWith('templates/') || !rel.endsWith('.html')) continue;
    const { pagina, modais } = superficies(soMarcacao(await ler(rel)));

    for (const [nome, html] of [['a página', pagina], ...modais.map((m, i) => [`o modal ${i + 1}`, m])]) {
      const ctas = CTA_SOLIDO.reduce((n, c) => n + contar(html, c), 0);
      if (ctas > 1) {
        erros.push(`${rel}: ${ctas} CTAs sólidos em ${nome}. Um por superfície (DS-07) — com dois, a tela não diz qual é a decisão.`);
      }
      const ouro = DOURADO.reduce((n, c) => n + contar(html, c), 0);
      if (ouro > 1) {
        erros.push(`${rel}: ${ouro} elementos dourados em ${nome}. No máximo um — dourado é acento, e acento repetido deixa de acentuar.`);
      }
    }
  }
  return { erros, nota: null };
}

/* ══════════════════════════════════════════════════════════════════════════
 * 3 · CONTRASTE DOS PARES VERSIONADOS
 * --------------------------------------------------------------------------
 * Os pares de `docs/01` §6 estão anotados na documentação como razões fixas.
 * Anotação não segura ninguém: quem trocar um token deixa a anotação para trás
 * e a razão continua escrita, errada, no documento. Aqui os pares são resolvidos
 * a partir do `tokens.css` de hoje e recalculados.
 *
 * O tema escuro é conferido montando a paleta clara e sobrepondo o bloco
 * `[data-theme="dark"]` — que é exatamente o que o navegador faz.
 * ═══════════════════════════════════════════════════════════════════════ */
const PARES = [
  // Shell autenticado — claro-only.
  ['claro', '--ppl-ink', '--ppl-surface', 4.5, 'texto de título sobre a superfície dominante'],
  ['claro', '--ppl-ink-soft', '--ppl-surface', 4.5, 'texto secundário — o mais usado do sistema'],
  ['claro', '--ppl-ink', '--ppl-surface-sunk', 4.5, 'texto sobre cabeçalho de tabela'],
  ['claro', '--ppl-ink-soft', '--ppl-surface-sunk', 4.5, 'rótulo de coluna'],
  ['claro', '--ppl-primary-fg', '--ppl-primary', 4.5, 'rótulo do botão primário'],
  ['claro', '--ppl-focus-ring', '--ppl-surface', 3, 'anel de foco (WCAG 1.4.11)'],
  ['claro', '--ppl-on-dark', '--ppl-blue-900', 4.5, 'nome do produto na navegação'],
  ['claro', '--ppl-on-dark-soft', '--ppl-blue-800', 4.5, 'item de navegação não ativo'],
  ['claro', '--ppl-danger', '--ppl-surface', 4.5, 'texto de erro'],
  // Landing — os quatro pares versionados em docs/01 §6, nos dois temas.
  ['claro', '--ppl-lp-ink', '--ppl-lp-bg', 4.5, 'texto da landing'],
  ['claro', '--ppl-lp-ink-soft', '--ppl-lp-bg', 4.5, 'apoio da landing'],
  ['claro', '--ppl-lp-accent-strong', '--ppl-lp-bg', 4.5, 'eyebrow editorial'],
  ['escuro', '--ppl-lp-ink', '--ppl-lp-bg', 4.5, 'texto da landing no escuro'],
  ['escuro', '--ppl-lp-ink-soft', '--ppl-lp-surface', 4.5, 'apoio sobre card no escuro'],
  ['escuro', '--ppl-lp-accent-strong', '--ppl-lp-bg', 4.5, 'eyebrow no escuro'],
  ['escuro', '--ppl-lp-on-accent', '--ppl-lp-accent', 4.5, 'texto sobre o acento no escuro'],
];

function hexParaRgb(hex) {
  const h = hex.trim().replace('#', '');
  const c = h.length === 3 ? h.split('').map((x) => x + x).join('') : h;
  if (!/^[0-9a-f]{6}$/i.test(c)) return null;
  return [0, 2, 4].map((i) => parseInt(c.slice(i, i + 2), 16));
}

function luminancia([r, g, b]) {
  const f = (v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

function razao(a, b) {
  const [x, y] = [luminancia(a), luminancia(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}

/** Lê os blocos de declaração do tokens.css: o claro e o `[data-theme="dark"]`. */
function paletas(css) {
  const claro = new Map();
  const escuro = new Map();

  const blocoEscuro = css.match(/:root\[data-theme="dark"\]\s*\{([\s\S]*?)\n\}/);
  const semEscuro = blocoEscuro ? css.replace(blocoEscuro[0], '') : css;
  const semMedia = semEscuro.replace(/@media[^{]*\{[\s\S]*?\n\}\n\}/g, '');

  for (const m of semMedia.matchAll(/(--ppl-[a-z0-9-]+)\s*:\s*([^;]+);/g)) claro.set(m[1], m[2].trim());
  if (blocoEscuro) {
    for (const m of blocoEscuro[1].matchAll(/(--ppl-[a-z0-9-]+)\s*:\s*([^;]+);/g)) escuro.set(m[1], m[2].trim());
  }
  return { claro, escuro };
}

/** Resolve um token até um hex, seguindo as cadeias de `var()`. */
function resolver(token, mapa, profundidade = 0) {
  if (profundidade > 10) return null;
  const bruto = mapa.get(token);
  if (!bruto) return null;
  const ref = bruto.match(/^var\(\s*(--ppl-[a-z0-9-]+)/);
  if (ref) return resolver(ref[1], mapa, profundidade + 1);
  return hexParaRgb(bruto);
}

/**
 * DÍVIDA CONHECIDA — pares que hoje NÃO atingem AA.
 *
 * Vêm da paleta do console (`docs/01` §1.4 e §1.5) e não são defeito de código:
 * são decisão de identidade que ninguém tomou olhando para o contraste. Listar
 * é melhor do que baixar o limite em silêncio — a checagem continua medindo e
 * reprova se qualquer um PIORAR, então a dívida não cresce enquanto não for paga.
 *
 * Pagá-la custa mais do que trocar um hex: `--ppl-ink-faint` precisaria chegar a
 * ~4.5:1 no branco, e aí encosta em `--ppl-ink-soft` (5.83:1) — a hierarquia de
 * três níveis do texto vira dois. É decisão de produto, não de higiene.
 */
const DIVIDA = [
  ['claro', '--ppl-ink-faint', '--ppl-surface', 3.12, 'eyebrow, dica de campo, estado vazio'],
  ['claro', '--ppl-warning', '--ppl-surface', 3.19, 'texto de atenção'],
  ['claro', '--ppl-success', '--ppl-surface', 4.41, 'texto de sucesso — falta pouco'],
];

async function checarContraste(_arquivos, ler) {
  const css = await ler('src/tokens.css');
  const { claro, escuro } = paletas(css);
  const mapas = { claro, escuro: new Map([...claro, ...escuro]) };

  const erros = [];
  const medir = (tema, frente, fundo) => {
    const a = resolver(frente, mapas[tema]);
    const b = resolver(fundo, mapas[tema]);
    return a && b ? razao(a, b) : null;
  };

  for (const [tema, frente, fundo, minimo, papel] of PARES) {
    const r = medir(tema, frente, fundo);
    if (r === null) {
      erros.push(`${tema}: não foi possível resolver ${frente} sobre ${fundo} até uma cor.`);
    } else if (r < minimo) {
      erros.push(`${tema}: ${frente} sobre ${fundo} = ${r.toFixed(2)}:1, abaixo de ${minimo}:1 — ${papel}.`);
    }
  }

  /* A dívida não precisa melhorar aqui, mas não pode piorar. */
  const pendentes = [];
  for (const [tema, frente, fundo, teto, papel] of DIVIDA) {
    const r = medir(tema, frente, fundo);
    if (r === null) {
      erros.push(`${tema}: não foi possível resolver ${frente} sobre ${fundo} até uma cor.`);
    } else if (r < teto - 0.005) {
      erros.push(
        `${tema}: ${frente} sobre ${fundo} caiu para ${r.toFixed(2)}:1 (era ${teto}:1) — ${papel}. ` +
        'A dívida de contraste pode ser paga, nunca aumentada.',
      );
    } else {
      pendentes.push(`${frente} ${r.toFixed(2)}:1`);
    }
  }

  const nota = `${PARES.length} pares em AA · dívida conhecida: ${pendentes.join(', ')}`;
  return { erros, nota };
}

/* ══════════════════════════════════════════════════════════════════════════
 * 4 · NENHUM NOME LEGADO VOLTOU
 * --------------------------------------------------------------------------
 * O `build.mjs` já reprova em `src/`, `templates/` e `demo/`. Aqui a varredura
 * é do repositório inteiro — README, workflow, script —, porque um nome
 * aposentado que sobrevive na documentação volta para o código pela mão de
 * quem copiou o exemplo.
 * ═══════════════════════════════════════════════════════════════════════ */
/** O que o navegador recebe. Fora daqui, só as regras de nome valem. */
const ENTREGUE = /^(src|templates|demo)\/|^(README|NOTICE)\.md$|^index\.html$/;

async function checarNomes(arquivos, ler) {
  const erros = [];
  for (const rel of arquivos) {
    if (!/\.(css|js|mjs|html|md|yml|yaml|json)$/.test(rel)) continue;
    const achados = conferir(await ler(rel), rel, { entregue: ENTREGUE.test(rel) });
    for (const a of achados) erros.push(`${a.rotulo}:${a.linha}  ${a.motivo}\n      ${a.trecho}`);
  }
  return { erros, nota: null };
}

/* ══════════════════════════════════════════════════════════════════════════
 * O AUTOTESTE — cada regra contra uma entrada que ela TEM que reprovar
 * ═══════════════════════════════════════════════════════════════════════ */
const CASOS = [
  {
    nome: 'token referenciado e nunca definido',
    checagem: checarTokens,
    arquivos: { 'src/x.css': '.a { color: var(--ppl-nunca-definido); }' },
  },
  {
    nome: 'dois CTAs sólidos na mesma superfície',
    checagem: checarTelas,
    arquivos: { 'templates/x.html': '<button class="ppl-btn ppl-btn--primary">a</button><button class="ppl-btn ppl-btn--primary">b</button>' },
  },
  {
    nome: 'dois elementos dourados na mesma superfície',
    checagem: checarTelas,
    arquivos: { 'templates/y.html': '<span class="ppl-icon-tile--gold"></span><span class="ppl-badge--gold"></span>' },
  },
  {
    nome: 'par de contraste abaixo de AA',
    checagem: checarContraste,
    arquivos: { 'src/tokens.css': ':root {\n  --ppl-ink: #cccccc;\n  --ppl-surface: #ffffff;\n}' },
  },
  {
    nome: 'dívida de contraste piorando',
    checagem: checarContraste,
    arquivos: { 'src/tokens.css': ':root {\n  --ppl-ink-faint: #b8c2d6;\n  --ppl-surface: #ffffff;\n}' },
  },
  {
    nome: 'nome aposentado de volta',
    checagem: checarNomes,
    arquivos: { 'README.md': '.people-bento { color: red; }' },
  },
];

async function autoteste() {
  console.log('\n  Autoteste — cada regra contra uma entrada que ela tem que reprovar:\n');
  let falhou = false;
  for (const caso of CASOS) {
    const nomes = Object.keys(caso.arquivos);
    const { erros } = await caso.checagem(nomes, async (rel) => caso.arquivos[rel] ?? '');
    if (erros.length) {
      console.log(`  ✓ reprovou: ${caso.nome}`);
    } else {
      console.log(`  ✗ PASSOU BATIDO: ${caso.nome}`);
      falhou = true;
    }
  }
  if (falhou) {
    console.error('\n✗ Uma checagem parou de morder. Ela não está mais garantindo nada.\n');
    process.exit(1);
  }
  console.log(`\n✓ As ${CASOS.length} regras reprovam de verdade.\n`);
}

/* ══════════════════════════════════════════════════════════════════════════ */
const CHECAGENS = [
  ['token definido', checarTokens],
  ['um CTA sólido, um dourado', checarTelas],
  ['contraste dos pares versionados', checarContraste],
  ['nenhum nome aposentado', checarNomes],
];

async function rodar() {
  const arquivos = await listar(raiz);
  const ler = (rel) => readFile(join(raiz, rel), 'utf8');

  let total = 0;
  for (const [nome, checagem] of CHECAGENS) {
    const { erros, nota } = await checagem(arquivos, ler);
    if (erros.length) {
      total += erros.length;
      console.log(`\n  ✗ ${nome}`);
      for (const e of erros) console.log(`      ${e}`);
    } else {
      console.log(`  ✓ ${nome}${nota ? `  (${nota})` : ''}`);
    }
  }

  if (total) {
    console.error(`\n✗ lint reprovado — ${total} ${total === 1 ? 'violação' : 'violações'}.\n`);
    process.exit(1);
  }
  console.log('\n✓ Nenhuma violação.\n');
}

if (process.argv.includes('--autoteste')) await autoteste();
else await rodar();
