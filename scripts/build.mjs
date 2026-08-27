#!/usr/bin/env node
/**
 * build.mjs — monta dist/ a partir de src/ e confere as invariantes do pacote.
 *
 * Não é um bundler e não minifica de propósito: o CDN comprime, e os
 * comentários das receitas são a documentação. Roda só aqui, ao publicar;
 * quem consome o pacote nunca executa nada.
 *
 *   node scripts/build.mjs
 */
import { readdir, readFile, writeFile, mkdir, rm, copyFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { conferir } from './invariantes.mjs';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(raiz, 'src');
const DIST = join(raiz, 'dist');

/**
 * As pastas de HTML que também passam pelas invariantes. Não entram em dist/ —
 * são conferidas porque um template é feito para ser COPIADO: um nome
 * aposentado que sobrevive aqui se espalha por todo protótipo que nascer dele.
 */
const HTML = ['templates', 'demo'];

/** Cada saída do CDN e as partes de src/ que a compõem, na ordem. */
const BUNDLES = [
  { saida: 'ppl-compass.css',            partes: ['fonts.css', 'tokens.css', 'components.css'] },
  { saida: 'ppl-compass-nofonts.css',    partes: ['tokens.css', 'components.css'] },
  { saida: 'ppl-compass-tokens.css',     partes: ['tokens.css'] },
  { saida: 'ppl-compass-components.css', partes: ['components.css'] },
  { saida: 'ppl-compass.js',             partes: ['ppl-compass.js'] },
  { saida: 'ppl-compass-icons.js',       partes: ['ppl-compass-icons.js'] },
];

async function listar(dir, base = dir) {
  const saida = [];
  for (const item of await readdir(dir, { withFileTypes: true })) {
    const caminho = join(dir, item.name);
    if (item.isDirectory()) saida.push(...(await listar(caminho, base)));
    else saida.push(caminho.slice(base.length + 1));
  }
  return saida;
}

const arquivos = await listar(SRC);
const textuais = arquivos.filter((f) => /\.(css|js)$/.test(f));
const binarios = arquivos.filter((f) => !/\.(css|js)$/.test(f));

/* ── 1. conferir ───────────────────────────────────────────────────────────
 * As invariantes moram em invariantes.mjs, porque o lint.mjs confere as mesmas
 * em arquivos que nunca entram em dist/. Uma regra, um lugar.
 * ─────────────────────────────────────────────────────────────────────────── */
const erros = [];
for (const rel of textuais) {
  const achados = conferir(await readFile(join(SRC, rel), 'utf8'), `src/${rel}`);
  for (const a of achados) erros.push(`  ${a.rotulo}:${a.linha}  ${a.motivo}\n    ${a.trecho}`);
}
for (const pasta of HTML) {
  const base = join(raiz, pasta);
  let lista;
  try {
    lista = (await listar(base)).filter((f) => f.endsWith('.html'));
  } catch {
    continue;                       // a pasta pode não existir ainda
  }
  for (const rel of lista) {
    const achados = conferir(await readFile(join(base, rel), 'utf8'), `${pasta}/${rel}`);
    for (const a of achados) erros.push(`  ${a.rotulo}:${a.linha}  ${a.motivo}\n    ${a.trecho}`);
  }
}

if (erros.length) {
  console.error('\n✗ build reprovado:\n');
  console.error(erros.join('\n'));
  console.error('');
  process.exit(1);
}

/* ── 2. montar ─────────────────────────────────────────────────────────── */
await rm(DIST, { recursive: true, force: true });
await mkdir(DIST, { recursive: true });

const linha = (n) => '─'.repeat(n);

for (const { saida, partes } of BUNDLES) {
  const pedacos = [];
  for (const parte of partes) {
    const conteudo = await readFile(join(SRC, parte), 'utf8');
    pedacos.push(partes.length > 1 ? `/* ${linha(70)}\n   ${parte}\n   ${linha(70)} */\n${conteudo}` : conteudo);
  }
  await writeFile(join(DIST, saida), pedacos.join('\n'));
}

/* Binários (fontes) vão como estão, preservando a estrutura de pastas. */
for (const rel of binarios) {
  const destino = join(DIST, rel);
  await mkdir(dirname(destino), { recursive: true });
  await copyFile(join(SRC, rel), destino);
}

/* ── 3. relatar ────────────────────────────────────────────────────────── */
let total = 0;
for (const rel of (await listar(DIST)).sort()) {
  const bytes = (await readFile(join(DIST, rel))).length;
  total += bytes;
  console.log(`  ✓ ${rel.padEnd(38)} ${(bytes / 1024).toFixed(1).padStart(7)} KB`);
}
console.log(`\n✓ dist/ montado — ${(total / 1024).toFixed(1)} KB. Nenhuma invariante violada.\n`);
