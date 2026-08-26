#!/usr/bin/env node
/**
 * build.mjs — copia src/ → dist/ e confere as invariantes do pacote.
 *
 * Não é um bundler e não minifica de propósito (ver README §"Use o arquivo com
 * SRI"). Roda só aqui, ao publicar; quem consome o pacote nunca executa nada.
 *
 *   node scripts/build.mjs
 */
import { readdir, readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(raiz, 'src');
const DIST = join(raiz, 'dist');

/** Nomes que a virada de identidade azul aposentou. A substituição está no motivo. */
const NOMES_PROIBIDOS = [
  { padrao: /--color-people-violet-\d/, motivo: 'escala azul renomeada para --color-people-blue-*' },
  { padrao: /--color-people-veu\b/, motivo: 'token órfão — usar --color-people-blue-50' },
  { padrao: /--color-people-roxo\b/, motivo: 'token órfão — usar --color-people-primary' },
  { padrao: /--color-people-carbono\b/, motivo: 'token órfão — usar --color-people-tinta' },
  { padrao: /--color-people-violeta\b/, motivo: 'token órfão — usar --color-people-primary' },
  { padrao: /--color-people-perigo\b/, motivo: 'token órfão — usar --color-people-danger' },
  { padrao: /#6f00ff/i, motivo: 'violeta da identidade anterior — a marca é #2F5AD0' },
];

async function arquivos(dir) {
  const saida = [];
  for (const item of await readdir(dir, { withFileTypes: true })) {
    const caminho = join(dir, item.name);
    if (item.isDirectory()) saida.push(...(await arquivos(caminho)));
    else saida.push(caminho);
  }
  return saida;
}

/**
 * Falha fechado: nome aposentado no fonte reprova o build em vez de virar
 * dívida silenciosa. É o mesmo princípio do Wizard do console (DS-17).
 */
function conferir(caminho, conteudo) {
  const erros = [];
  for (const { padrao, motivo } of NOMES_PROIBIDOS) {
    // A tabela de/para do próprio CSS cita os nomes antigos de propósito.
    const linhas = conteudo.split('\n');
    linhas.forEach((linha, i) => {
      if (padrao.test(linha) && !/→|->|MIGRA|de\/para|substituir/i.test(linha)) {
        erros.push(`  ${caminho}:${i + 1}  ${motivo}\n    ${linha.trim()}`);
      }
    });
  }
  return erros;
}

const fontes = await arquivos(SRC);
const erros = [];

for (const caminho of fontes) {
  const conteudo = await readFile(caminho, 'utf8');
  erros.push(...conferir(caminho.replace(raiz + '\\', '').replace(raiz + '/', ''), conteudo));
}

if (erros.length) {
  console.error('\n✗ build reprovado — nome aposentado no fonte:\n');
  console.error(erros.join('\n'));
  console.error('\nA marca é azul #2F5AD0; estes nomes não voltam.\n');
  process.exit(1);
}

await rm(DIST, { recursive: true, force: true });
await mkdir(DIST, { recursive: true });

for (const caminho of fontes) {
  const relativo = caminho.slice(SRC.length + 1);
  const destino = join(DIST, relativo);
  await mkdir(dirname(destino), { recursive: true });
  await writeFile(destino, await readFile(caminho));
  const kb = ((await readFile(caminho)).length / 1024).toFixed(1);
  console.log(`  ✓ ${relativo.padEnd(32)} ${kb.padStart(6)} KB`);
}

console.log(`\n✓ ${fontes.length} arquivo(s) em dist/. Nenhum nome aposentado.\n`);
