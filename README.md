# ppl-compass

Framework de prototipação do **BNG People**. CSS + JS, **zero dependência**, servido por CDN.

Monte um protótipo navegável do produto escrevendo HTML — com a identidade v5 (azul + dourado)
já correta e as regras de acessibilidade já embutidas.

---

## Uso

```html
<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="stylesheet"
        href="https://cdn.jsdelivr.net/gh/FelipeSilveiraBNG/ppl-compass@0.4.0/dist/ppl-compass.css"
        integrity="sha384-E/qBbSGDbYr5hi+Q+4F1wUy5uXO+0q56bzlXkG86ngrjw1upmDRUvA3d1m/MBjhT"
        crossorigin="anonymous">
</head>
<body data-brand="people">

  <button class="ppl-btn ppl-btn--primary">Concluir admissão</button>

  <script src="https://cdn.jsdelivr.net/gh/FelipeSilveiraBNG/ppl-compass@0.4.0/dist/ppl-compass-icons.js"
          integrity="sha384-o+I2YYIzrf7eiwXox6GFV1UX+gkIudlDtXnA0MwZvanJkBmjYwRCtA7LKJVwhPCx" crossorigin="anonymous"></script>
  <script src="https://cdn.jsdelivr.net/gh/FelipeSilveiraBNG/ppl-compass@0.4.0/dist/ppl-compass.js"
          integrity="sha384-R6iJmhsWlAOh23kVKR1HujiFnIJjwWF+2Yvs227SM25jKcx8Yive8Q/Wqz+ZxBi4" crossorigin="anonymous"></script>
  <script>addEventListener('DOMContentLoaded', () => PplCompass.init());</script>
</body>
</html>
```

**Comece pela documentação:** [`index.html`](index.html) — 21 páginas com o exemplo vivo e o
código copiável de cada receita, as regras que o pacote embute e a referência da API. Sirva a raiz
do repositório e abra na porta escolhida.

**Para montar uma tela:** [`templates/`](templates/README.md) traz oito arquétipos prontos —
lista, lista com drawer de edição, wizard, home, detalhe, landing, molde móvel e a casca vazia.
Copie o mais próximo e troque o conteúdo.

**Para conferir um componente isolado:** [`demo/gallery.html`](demo/gallery.html) traz os 21 blocos
soltos, sem a navegação da documentação em volta.

### Arquivos publicados

| Arquivo | O que é |
|---|---|
| `ppl-compass.css` | fontes + tokens + componentes — **o padrão, 1 requisição** |
| `ppl-compass-nofonts.css` | igual, sem `@font-face` |
| `ppl-compass-tokens.css` | só as custom properties — trocar isto troca a marca |
| `ppl-compass-components.css` | só as receitas (exige um tokens) |
| `ppl-compass.js` | os comportamentos |
| `ppl-compass-icons.js` | 46 ícones |
| `fonts/*.woff2` | Urbanist, Playfair Display itálica, JetBrains Mono — subset latin |

---

## O que existe

**Superfícies** `.ppl-canvas` `.ppl-card` `.ppl-bar` `.ppl-glass` `.ppl-sheet`
**Texto** `.ppl-display` (`--hero`) `.ppl-data` `.ppl-eyebrow` `.ppl-grad-text`
**Ação** `.ppl-btn` (`--primary --hero --secondary --ghost --danger --gold --sm --icon --touch`)
**Estado** `.ppl-badge` `.ppl-alert` `.ppl-toast` `.ppl-state` `.ppl-skeleton` `.ppl-spinner` `.ppl-progress`
**Formulário** `.ppl-field` `.ppl-input` `.ppl-select` `.ppl-check` `.ppl-combo`
**Sobreposição** `.ppl-drawer` `.ppl-dialog` `.ppl-scrim`
**Navegação** `.ppl-nav` `.ppl-topbar` `.ppl-tabbar` `.ppl-page-head`
**Conteúdo** `.ppl-panel` `.ppl-data-panel` `.ppl-choice` `.ppl-stat` `.ppl-table` `.ppl-steps` `.ppl-review` `.ppl-disclosure`
**Público** `.ppl-landing` `.ppl-landing__bar` `.ppl-hero`
**Layout** `.ppl-shell` `.ppl-main` `.ppl-app` `.ppl-stack` `.ppl-row` `.ppl-cols-2`

### Comportamento sem escrever JavaScript

```html
<aside class="ppl-nav" data-ppl-nav><script type="application/json">{ "itens": [ … ] }</script></aside>
<div class="ppl-data-panel" id="p" data-ppl-state="dados"><div data-ppl-when="dados">…</div></div>
<button data-ppl-state-set="p:vazio">Vazio</button>
<button data-ppl-confirm="R2" data-ppl-confirm-titulo="…" data-ppl-confirm-alvo="…"
        data-ppl-confirm-acao="…" data-ppl-confirm-feito="…">Reabrir</button>
<button data-ppl-drawer-open="meu-drawer">Abrir</button>
<button data-ppl-drawer-close>Fechar</button>
<form data-ppl-submit="Rubrica 1042 criada.">…</form>
<section data-ppl-disclosure>…</section>
<div data-ppl-combo>…</div>
<button data-ppl-search-open>Buscar</button>
<button data-ppl-theme-toggle>Tema</button>
<i data-ppl-icon="wallet" data-ppl-size="16"></i>
```

### API

```js
PplCompass.init({ acoes: [{ href, label }] });   // sem `acoes`, a busca herda a navegação

PplCompass.nav({
  alvo: '#nav',                                  // ou marque o elemento com data-ppl-nav
  variante: 'lateral' | 'tabbar',                // o mesmo objeto desenha as duas
  rotaAtiva: '/folha',
  marca:   { sigla, nome, tag },
  itens:   [ { label, icone, href, contador? }, { grupo, itens: [ … ] } ],
  usuario: { iniciais, nome, papel, sair }
});
PplCompass.toast.success(msg) / .error(msg, { acao: { label, onClick } }) / .info(msg)
PplCompass.drawer.abrir(id) / .fechar(id)
PplCompass.busca.abrir() / .fechar()
PplCompass.tema.alternar()
PplCompass.icon(nome, tamanho)
PplCompass.fmt.cpf / .cnpj / .dinheiro / .contagem / .competencia

PplCompass.painel('painel-folha', 'carregando');   // dados | carregando | vazio | erro

PplCompass.confirmar({
  risco: 'R2' | 'R3',                 // R0 e R1 são RECUSADOS: não abrem diálogo
  titulo: 'Reabrir a competência 2026-08?',        // a consequência, não a ação
  alvo: 'Gestão Hospitalar Ltda · 12.345.678/0001-90',   // ou [{ chave, valor, data? }]
  corpo: '…',
  frase: '2026-08',                   // só R3 — obrigatório nele
  processo: 'fechamento-definitivo',  // só R3 — o "o quê" do evento de auditoria
  acao: 'Reabrir competência',
  onConfirmar() {}, onCancelar() {}
});
// R3 emite `ppl:auditoria` em document: { processo, risco, alvo, quando }

new PplCompass.Wizard({
  raiz, efeito: 'juridico' | 'financeiro' | 'nenhum',
  passos: [{ id, label, validar? }],   // 'revisao' é obrigatório se efeito ≠ 'nenhum'
  aoRenderizar(passo, corpo), onConcluir()
});
```

---

## Regras que o pacote carrega embutidas

Não são preferências de estilo. Um protótipo que as viola gera retrabalho na implementação.

- **Um CTA primário sólido por tela.** Rótulo verbo-primeiro, nunca "OK".
- **No máximo um elemento dourado por tela.** Dourado é acento, não decoração.
- **Vermelho é só erro e ação destrutiva.** Nunca "chamar atenção".
- **Estado nunca só por cor** — sempre ícone + texto.
- **Dado de folha e ponto sempre em `.ppl-data`**, com `tabular-nums`.
- **Zero emoji** em qualquer superfície: ícone é ícone, e vem de `ppl-compass-icons.js`.
- **Alvo de toque ≥ 44px** com `.ppl-btn--touch`.
- **Gradiente só** em navegação/hero, CTA de destaque, marca e selo.
- **Tema escuro só na landing** — o shell autenticado é claro, como o produto.
- **Fluxo de efeito jurídico ou financeiro termina em revisão.** O `Wizard` falha fechado:
  sem a etapa `revisao` ele não renderiza e mostra o defeito.
- **Contador é o número real, com separador de milhar** — nunca `"99+"`.
- **Confirmação é proporcional ao risco do processo**, e o risco é atributo do processo, não
  decisão de tela. R0 e R1 **não abrem diálogo** — `confirmar()` recusa e diz por quê. Fadiga de
  confirmação é risco mapeado: confirmar ação reversível treina o operador a clicar sem ler, e é a
  confirmação do R3 que paga essa conta.
- **O alvo da ação fica visível no diálogo**, sempre. Sem ele o operador confirma o diálogo, não a
  operação.
- **`Esc` nunca confirma** — mas cancela nos dois níveis, porque fechar diálogo pelo teclado é
  requisito de acessibilidade. No R3 o clique fora não faz nada: perder a frase digitada por um
  clique torto custa refazer o caminho inteiro.
- **Um modal por vez.** O foco é preso marcando os irmãos como `inert`, então um segundo modal
  nasceria inerte — desenhado na tela e invisível ao teclado. Empilhar aqui não degrada, apaga.
- **Tabbar tem no máximo 5 itens.** O sexto não quebra o grid em silêncio: `nav()` falha fechado,
  como faz com grupo vazio, item sem destino e `rotaAtiva` que não existe no menu. Menu que não
  sabe onde você está é pior do que menu nenhum, porque mente com confiança.

### Nomes

Nada foi herdado do console. Lá a escala azul ainda se chama `violet-*`, e as superfícies se
chamam `bento` e `glass` — nomes de decisões já revertidas (a identidade Violeta, e a direção
Bento UI + Glassmorphism). Aqui cada nome descreve o que a coisa **é**: `.ppl-card` é um card,
`.ppl-bar` é uma barra, `.ppl-disclosure` é o padrão ARIA que ele implementa.

O `build.mjs` **falha fechado** se um nome aposentado voltar ao fonte.

---

## Compatibilidade

Duas últimas versões maiores de **Chrome, Edge e Safari**. Safari define o teto — é o último a
chegar. Sem polyfill: polyfill é dependência.

Em uso: `:has()`, `@container`, `color-mix()`, `inert` — é ele que prende o foco no drawer sem
gerenciar `tabindex` à mão —, custom properties e Grid. Fora da v1: aninhamento nativo de CSS.
`backdrop-filter` sempre acompanhado de `-webkit-`, que o Safari exige.

---

## Regras de consumo

**Aponte para uma tag, nunca para um branch.**

| Referência | Cache | Consequência |
|---|---|---|
| `@0.4.0` | 1 ano, imutável | a demo de amanhã é byte a byte a de hoje |
| `@main` | 12 h no edge | a demo pode mudar sozinha antes da reunião |

**Use o arquivo com SRI, não o `.min`.** O jsDelivr gera `.min.css` automaticamente, mas avisa
para **não** usar SRI com arquivo gerado dinamicamente: o minificador muda de versão, o hash
quebra e a página para de carregar. E os comentários das receitas são a documentação — cada uma
anota o componente React de origem e a regra de acessibilidade que a sustenta.

---

## Versionamento

SemVer, **e o pacote está em `0.x` de propósito.** Em `0.x` o próprio SemVer dispensa a garantia de
compatibilidade: um `minor` pode renomear uma classe ou um token. É a promessa honesta enquanto o
framework ainda está descobrindo os próprios nomes — cada fase encontra receita que faltava, e
travar a superfície agora só criaria alias legado, que é exatamente o que o §5.4 do plano existe
para evitar.

**A `1.0.0` volta quando a documentação estiver publicada no GitHub Pages** — antes disso não há
onde alguém conferir o que a estabilidade estaria prometendo.

> Houve uma `v1.0.0` no fim da Fase 1. Ela saiu antes da hora e **foi apagada em 26/08/2026**,
> com a confirmação de que ninguém a consumia. Se você encontrar uma referência a `@1.0.0`, troque
> pela `0.x`: no GitHub a tag já não existe, e o que ainda responde é cache do CDN — que some sem
> aviso. Apagar tag publicada só é seguro com essa confirmação.

**A superfície pública é:** nomes de token, nomes de classe, atributos `data-*` e a API
`PplCompass.*`.

| Mudança | Bump em `0.x` | Bump depois da `1.0.0` |
|---|---|---|
| novo componente, novo token, nova variante | minor | minor |
| ajuste de valor sem trocar nome | patch | patch |
| renomear ou remover token, classe, `data-*` ou método | **minor** | **major** |

---

## Desenvolvimento

`src/` é legível, `dist/` é o que o CDN serve, e **o consumidor não instala nada** — dois arquivos
do CDN e a página funciona. O `package.json` existe só para o `playwright-core` do smoke de
teclado; o pacote não é publicado no npm.

```bash
npm run check                 # o que o CI roda: autoteste, build, lint e smoke

node scripts/build.mjs        # monta dist/ e confere as invariantes (inclusive nos .html)
node scripts/lint.mjs         # token órfão, CTA duplicado, dourado repetido, contraste
node scripts/lint.mjs --autoteste   # confere as CHECAGENS, não o código
node scripts/smoke.mjs        # Tab, Esc e retorno de foco, no Chrome já instalado
node scripts/preview.mjs      # espelha templates/ em .preview/ apontando para ../dist/
node scripts/sri.mjs          # tabela de hashes para colar neste README
node scripts/sri.mjs --html   # as tags prontas, já com a URL do CDN

PPL_TAG=v0.4.0 node scripts/sri.mjs --html
```

### O que o CI reprova

Roda em PR (`.github/workflows/ci.yml`). Nenhuma destas checagens acrescenta um byte ao que o
navegador baixa.

| Checagem | O que pega |
|---|---|
| **autoteste** | uma regra que parou de morder — roda antes de tudo, porque um lint decorativo deixa o repositório verde e a garantia vazia |
| **token definido** | `var(--ppl-x)` sem `--ppl-x:` em lugar nenhum. Resolve para nada: badge transparente, foco sem cor, botão branco com texto branco |
| **um CTA sólido** | dois `--primary`/`--hero` na mesma superfície (DS-07). Vale por superfície: um drawer aberto tem o próprio CTA |
| **um dourado** | acento repetido deixa de acentuar |
| **contraste** | os pares versionados recalculados a partir do `tokens.css` de hoje, claro e escuro. A dívida conhecida é nomeada e **não pode piorar** |
| **nome aposentado** | um nome do console de volta, em qualquer arquivo — inclusive na documentação, de onde ele volta para o código pela mão de quem copiou o exemplo |
| **smoke de teclado** | `Tab` sem armadilha, foco preso no modal, `Esc` que fecha sem confirmar, foco de volta no gatilho |
| **dist/ e SRI** | `dist/` que não é o que o fonte gera, ou hash documentado que não bate — a página de quem consome pararia de carregar |

### Dívida de contraste, nomeada

Três pares herdados da paleta do console não atingem AA e estão listados no `lint.mjs`:
`--ppl-ink-faint` (3.12:1), `--ppl-warning` (3.19:1) e `--ppl-success` (4.41:1). A checagem mede os
três a cada execução e **reprova se algum piorar**. Pagá-los é decisão de identidade, não de
higiene: `--ppl-ink-faint` precisaria escurecer até encostar em `--ppl-ink-soft`, e a hierarquia de
três níveis do texto viraria dois.

### Validar antes de publicar

| Página | Aponta para | Serve para |
|---|---|---|
| `index.html` | `dist/` | a documentação — 21 páginas, exemplo vivo e código |
| `demo/gallery.html` | `../dist/` | ver todos os componentes do commit aberto |
| `demo/proof-local.html` | `../dist/` | validar o **conteúdo** antes de publicar |
| `demo/proof.html` | o CDN | validar a **entrega** depois de publicar |
| `.preview/*.html` | `../dist/` | ver os templates antes de a tag existir |

Se a local aprova e a do CDN reprova, o problema é entrega. Se a local reprova, é o pacote —
nem adianta publicar.

```bash
python -m http.server 8777
# http://localhost:8777/demo/gallery.html
```

### Publicar

```bash
node scripts/build.mjs
node scripts/sri.mjs              # cole os hashes aqui, em demo/proof.html e em templates/*.html
git add -A && git commit -m "release: v0.4.0"
git tag v0.4.0 && git push origin main --tags
```

O hash cobre o **byte exato** de cada arquivo: qualquer mudança, inclusive num comentário, gera
um hash novo. Regere **antes** de criar a tag, nunca depois.

---

## Hashes SRI

| Arquivo | Tamanho | `integrity` (v0.4.0) |
|---|---|---|
| `ppl-compass-components.css` | 52.6 KB | `sha384-rblKGhGSAqP+I5ktX6NVKEe38OV1BCbqM/48XsK697iZ8lXvo+DVbBwjH4GOPobk` |
| `ppl-compass-icons.js` | 6.3 KB | `sha384-o+I2YYIzrf7eiwXox6GFV1UX+gkIudlDtXnA0MwZvanJkBmjYwRCtA7LKJVwhPCx` |
| `ppl-compass-nofonts.css` | 66.2 KB | `sha384-2Yjt1p6csRAkxNtFsbk7kM/ngmCeReS5SVO60/Y2IXgIfh7j7g6+yDIf9l8Qbw6o` |
| `ppl-compass-tokens.css` | 12.8 KB | `sha384-e9hvrC/d4+ZqAfi200UvHN5OofkTbnN6JmygwRhEOMD21yowqA9oRCNn91Whkssn` |
| `ppl-compass.css` | 68.8 KB | `sha384-E/qBbSGDbYr5hi+Q+4F1wUy5uXO+0q56bzlXkG86ngrjw1upmDRUvA3d1m/MBjhT` |
| `ppl-compass.js` | 53.0 KB | `sha384-R6iJmhsWlAOh23kVKR1HujiFnIJjwWF+2Yvs227SM25jKcx8Yive8Q/Wqz+ZxBi4` |

---

## Licença

[MIT](LICENSE). As fontes redistribuídas seguem a **SIL Open Font License 1.1** — ver [NOTICE.md](NOTICE.md).
