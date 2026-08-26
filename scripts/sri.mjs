#!/usr/bin/env node
/**
 * sri.mjs — gera os hashes Subresource Integrity de tudo que está em dist/.
 *
 * Por que SRI e não `.min`: o jsDelivr gera o minificado sob demanda e avisa,
 * no cabeçalho do próprio arquivo, para NÃO usar SRI com arquivo gerado
 * dinamicamente (o minificador muda de versão, o byte muda, o hash quebra e a
 * página inteira para de carregar). Servimos o arquivo legível e travamos o
 * byte com SRI. Ver README §"Use o arquivo com SRI".
 *
 *   node scripts/sri.mjs            → tabela para colar no README
 *   node scripts/sri.mjs --html     → o <link> pronto, com a URL do CDN
 */
import { readdir, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(raiz, 'dist');

const ORG = process.env.PPL_ORG ?? 'bng-health';
const TAG = process.env.PPL_TAG ?? 'v0.1.0';
const versao = TAG.replace(/^v/, '');

async function arquivos(dir, base = dir) {
  const saida = [];
  for (const item of await readdir(dir, { withFileTypes: true })) {
    const caminho = join(dir, item.name);
    if (item.isDirectory()) saida.push(...(await arquivos(caminho, base)));
    else saida.push(caminho.slice(base.length + 1));
  }
  return saida;
}

const lista = (await arquivos(DIST)).filter((f) => /\.(css|js)$/.test(f)).sort();

if (!lista.length) {
  console.error('✗ dist/ vazio. Rode `node scripts/build.mjs` antes.');
  process.exit(1);
}

const linhas = [];
for (const arquivo of lista) {
  const conteudo = await readFile(join(DIST, arquivo));
  const hash = createHash('sha384').update(conteudo).digest('base64');
  linhas.push({ arquivo, integrity: `sha384-${hash}`, kb: (conteudo.length / 1024).toFixed(1) });
}

if (process.argv.includes('--html')) {
  console.log();
  for (const { arquivo, integrity } of linhas) {
    const url = `https://cdn.jsdelivr.net/gh/${ORG}/ppl-compass@${versao}/dist/${arquivo}`;
    console.log(
      arquivo.endsWith('.css')
        ? `<link rel="stylesheet"\n      href="${url}"\n      integrity="${integrity}"\n      crossorigin="anonymous">\n`
        : `<script defer src="${url}"\n        integrity="${integrity}"\n        crossorigin="anonymous"></script>\n`,
    );
  }
} else {
  console.log(`\n| Arquivo | Tamanho | \`integrity\` (${TAG}) |`);
  console.log('|---|---|---|');
  for (const { arquivo, integrity, kb } of linhas) {
    console.log(`| \`${arquivo}\` | ${kb} KB | \`${integrity}\` |`);
  }
  console.log('\nO hash muda a cada release — regere e atualize o README junto com a tag.\n');
}
