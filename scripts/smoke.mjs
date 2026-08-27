#!/usr/bin/env node
/**
 * smoke.mjs — o teclado percorre a galeria inteira, e o foco volta de onde saiu.
 *
 * É a única checagem que precisa de navegador, porque é a única que não dá para
 * responder lendo o HTML: se o `inert` está realmente prendendo o foco, para
 * onde o `Esc` devolve o cursor e se existe armadilha de tabulação só se
 * descobre apertando as teclas.
 *
 * Usa `playwright-core` e o **Chrome que já está na máquina** — nenhum navegador
 * é baixado. No runner do GitHub Actions o Chrome vem instalado; localmente é o
 * seu. Se o executável estiver em outro lugar, aponte com PPL_CHROME.
 *
 *   node scripts/smoke.mjs
 *   PPL_CHROME="/caminho/para/chrome" node scripts/smoke.mjs
 */
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');

const TIPOS = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.woff2': 'font/woff2',
  '.json': 'application/json',
};

/** Servidor estático mínimo. Sem dependência: são vinte linhas. */
function servir() {
  return new Promise((resolve) => {
    const servidor = createServer(async (req, res) => {
      const caminho = join(raiz, decodeURIComponent(req.url.split('?')[0]));
      try {
        const corpo = await readFile(caminho);
        res.writeHead(200, { 'content-type': TIPOS[extname(caminho)] ?? 'application/octet-stream' });
        res.end(corpo);
      } catch {
        res.writeHead(404).end('nao encontrado');
      }
    });
    servidor.listen(0, '127.0.0.1', () => resolve({ servidor, porta: servidor.address().port }));
  });
}

/* ══════════════════════════════════════════════════════════════════════════ */
const casos = [];
const caso = (nome, fn) => casos.push({ nome, fn });

/** Descreve o elemento com foco, do jeito que um humano identificaria. */
const focado = (pagina) => pagina.evaluate(() => {
  const el = document.activeElement;
  if (!el || el === document.body) return { tag: 'body', texto: '', dentroDe: null, visivel: true };
  const caixa = el.getBoundingClientRect();
  return {
    tag: el.tagName.toLowerCase(),
    texto: (el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 40),
    id: el.id || null,
    dentroDe: el.closest('.ppl-drawer') ? 'drawer' : el.closest('.ppl-scrim') ? 'dialogo' : null,
    visivel: caixa.width > 0 && caixa.height > 0,
    inerte: !!el.closest('[inert]'),
  };
});

/* ── 1 · Tab percorre a página sem prender e sem parar em coisa invisível ── */
caso('Tab percorre a galeria sem armadilha', async (pagina) => {
  await pagina.evaluate(() => document.body.focus());
  const vistos = new Set();
  for (let i = 0; i < 60; i++) {
    await pagina.keyboard.press('Tab');
    const f = await focado(pagina);
    if (f.tag === 'body') continue;
    if (!f.visivel) throw new Error(`Tab ${i + 1} parou num elemento invisível: <${f.tag}> "${f.texto}"`);
    if (f.inerte) throw new Error(`Tab ${i + 1} entrou em região inerte: <${f.tag}> "${f.texto}"`);
    vistos.add(`${f.tag}:${f.texto}:${f.id}`);
  }
  if (vistos.size < 25) {
    throw new Error(`60 Tabs visitaram só ${vistos.size} elementos distintos — parece armadilha de foco.`);
  }
  return `${vistos.size} elementos distintos em 60 tabulações`;
});

/* ── 2 · Drawer: prende o foco, Esc fecha, foco volta ao gatilho ─────────── */
caso('drawer prende o foco e devolve ao gatilho', async (pagina) => {
  const gatilho = pagina.locator('[data-ppl-drawer-open]').first();
  const rotulo = (await gatilho.textContent()).trim();
  await gatilho.click();
  await pagina.waitForSelector('.ppl-drawer[data-open="true"]');

  const inicial = await focado(pagina);
  if (inicial.dentroDe !== 'drawer') {
    throw new Error(`ao abrir, o foco foi para <${inicial.tag}> "${inicial.texto}" e não para o painel.`);
  }

  for (let i = 0; i < 15; i++) {
    await pagina.keyboard.press('Tab');
    const f = await focado(pagina);
    if (f.tag !== 'body' && f.dentroDe !== 'drawer') {
      throw new Error(`Tab ${i + 1} escapou do drawer para <${f.tag}> "${f.texto}".`);
    }
  }

  await pagina.keyboard.press('Escape');
  await pagina.waitForSelector('.ppl-drawer[data-open="true"]', { state: 'detached' }).catch(() => {});
  const aberto = await pagina.locator('.ppl-drawer[data-open="true"]').count();
  if (aberto) throw new Error('Esc não fechou o drawer.');

  const depois = await focado(pagina);
  if (depois.texto !== rotulo) {
    throw new Error(`depois do Esc o foco ficou em "${depois.texto}", e não de volta em "${rotulo}".`);
  }
  return `foco preso em 15 tabulações e devolvido a "${rotulo}"`;
});

/* ── 3 · R2 nasce com o foco no Cancelar ─────────────────────────────────── */
caso('R2 abre com o foco em "Cancelar"', async (pagina) => {
  const gatilho = pagina.locator('[data-ppl-confirm="R2"]').first();
  const rotulo = (await gatilho.textContent()).trim();
  await gatilho.click();
  await pagina.waitForSelector('.ppl-scrim [role="alertdialog"]');

  const f = await focado(pagina);
  if (f.texto !== 'Cancelar') {
    throw new Error(`o foco inicial foi para "${f.texto}" — no R2 tem que ser "Cancelar".`);
  }

  await pagina.keyboard.press('Escape');
  if (await pagina.locator('.ppl-scrim [role="alertdialog"]').count()) {
    throw new Error('Esc não fechou o diálogo R2.');
  }
  const depois = await focado(pagina);
  if (depois.texto !== rotulo) throw new Error(`foco não voltou ao gatilho: ficou em "${depois.texto}".`);
  return 'foco inicial no Cancelar, Esc cancela, foco volta';
});

/* ── 4 · R3: Esc cancela e NUNCA confirma ────────────────────────────────── */
caso('R3 exige a frase e o Esc não confirma', async (pagina) => {
  await pagina.evaluate(() => {
    window.__auditoria = 0;
    document.addEventListener('ppl:auditoria', () => { window.__auditoria++; });
  });

  const gatilho = pagina.locator('[data-ppl-confirm="R3"][data-ppl-confirm-frase]').first();
  await gatilho.click();
  await pagina.waitForSelector('#ppl-confirm-frase');

  const f = await focado(pagina);
  if (f.id !== 'ppl-confirm-frase') {
    throw new Error(`no R3 o foco inicial tem que ser o campo da frase; foi para <${f.tag}> "${f.texto}".`);
  }

  const acao = pagina.locator('.ppl-scrim .ppl-btn--danger');
  if (!(await acao.isDisabled())) throw new Error('o botão destrutivo do R3 nasceu habilitado.');

  await pagina.fill('#ppl-confirm-frase', 'competencia errada');
  if (!(await acao.isDisabled())) throw new Error('o botão habilitou com a frase errada.');

  await pagina.keyboard.press('Escape');
  if (await pagina.locator('#ppl-confirm-frase').count()) throw new Error('Esc não fechou o diálogo R3.');

  const eventos = await pagina.evaluate(() => window.__auditoria);
  if (eventos !== 0) throw new Error(`Esc emitiu ${eventos} evento(s) de auditoria — ele CONFIRMOU.`);
  return 'botão travado até a frase exata, e o Esc saiu sem confirmar';
});

/* ── 5 · Busca global: Ctrl+K abre, Esc fecha ────────────────────────────── */
caso('Ctrl+K abre a busca e Esc fecha', async (pagina) => {
  await pagina.keyboard.press('Control+k');
  await pagina.waitForSelector('#ppl-search:not([hidden])');
  const f = await focado(pagina);
  if (f.id !== 'ppl-search-input') throw new Error(`a busca abriu sem foco no campo (foi para "${f.texto}").`);
  await pagina.keyboard.press('Escape');
  if (await pagina.locator('#ppl-search:not([hidden])').count()) throw new Error('Esc não fechou a busca.');
  return 'abre com o foco no campo e fecha no Esc';
});

/* ══════════════════════════════════════════════════════════════════════════ */
const { servidor, porta } = await servir();

let navegador;
try {
  navegador = await chromium.launch(
    process.env.PPL_CHROME ? { executablePath: process.env.PPL_CHROME } : { channel: 'chrome' },
  );
} catch (e) {
  servidor.close();
  console.error('\n[x] Não foi possível abrir o Chrome.');
  console.error('    O smoke usa o navegador já instalado, sem baixar nada.');
  console.error('    Aponte o executável com PPL_CHROME se ele estiver fora do caminho padrão.\n');
  console.error(`    ${e.message}\n`);
  process.exit(1);
}

const pagina = await navegador.newPage();
const erros = [];
pagina.on('pageerror', (e) => erros.push(`erro de JavaScript na página: ${e.message}`));

await pagina.goto(`http://127.0.0.1:${porta}/demo/gallery.html`, { waitUntil: 'load' });

console.log('\n  Smoke de teclado na galeria:\n');
let reprovou = false;
for (const { nome, fn } of casos) {
  try {
    /* Cada percurso começa de uma página limpa. Um caso que falha no meio deixa
       modal aberto e metade da árvore inerte — sem recarregar, os seguintes
       reprovariam por contagio e apontariam para o lugar errado. */
    await pagina.goto(`http://127.0.0.1:${porta}/demo/gallery.html`, { waitUntil: 'load' });
    const detalhe = await fn(pagina);
    console.log(`  [ok] ${nome}${detalhe ? `  (${detalhe})` : ''}`);
  } catch (e) {
    console.log(`  [X]  ${nome}\n         ${e.message}`);
    reprovou = true;
  }
}

for (const e of erros) {
  console.log(`  [X]  ${e}`);
  reprovou = true;
}

await navegador.close();
servidor.close();

if (reprovou) {
  console.error('\n[x] smoke de teclado reprovado.\n');
  process.exit(1);
}
console.log(`\n[ok] Os ${casos.length} percursos de teclado passaram.\n`);
