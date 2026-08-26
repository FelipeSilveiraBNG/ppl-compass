#!/usr/bin/env node
/**
 * preview.mjs — espelha templates/ em .preview/ apontando para dist/ local.
 *
 * Os templates apontam para o CDN em tag fixa, com SRI, porque é assim que eles
 * têm que funcionar na mão de quem copia. O efeito colateral é que, antes do
 * push da tag, eles carregam uma versão que ainda não existe — e não dá para
 * conferir o que se está publicando.
 *
 * Este script resolve isso sem sujar o entregável: troca a URL do CDN por
 * `../dist/`, tira `integrity` e `crossorigin` (que travam byte de um arquivo
 * que ainda vai mudar) e escreve em `.preview/`, que não vai para o Git.
 *
 * Roda só aqui. Quem consome o pacote nunca executa nada — R3 é sobre o
 * consumidor, não sobre nós.
 *
 *   node scripts/preview.mjs
 *   python -m http.server 8777      → http://localhost:8777/.preview/lista.html
 */
import { readdir, readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const TEMPLATES = join(raiz, 'templates');
const SAIDA = join(raiz, '.preview');

const CDN = /https:\/\/cdn\.jsdelivr\.net\/gh\/[^/]+\/ppl-compass@[^/]+\/dist\//g;
const TRAVA = /\s+(integrity|crossorigin)="[^"]*"/g;

const nomes = (await readdir(TEMPLATES)).filter((f) => f.endsWith('.html')).sort();
if (!nomes.length) {
  console.error('✗ templates/ não tem nenhum .html.');
  process.exit(1);
}

await rm(SAIDA, { recursive: true, force: true });
await mkdir(SAIDA, { recursive: true });

for (const nome of nomes) {
  const original = await readFile(join(TEMPLATES, nome), 'utf8');
  const local = original.replace(CDN, '../dist/').replace(TRAVA, '');
  if (local === original) {
    console.error(`✗ ${nome} não referencia o CDN — um template precisa apontar para a tag publicada.`);
    process.exit(1);
  }
  await writeFile(join(SAIDA, nome), local);
  console.log(`  ✓ .preview/${nome}`);
}

console.log(`\n✓ ${nomes.length} templates espelhados. Sirva a raiz do repositório e abra .preview/.\n`);
