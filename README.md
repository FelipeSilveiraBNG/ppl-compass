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
        href="https://cdn.jsdelivr.net/gh/FelipeSilveiraBNG/ppl-compass@1.0.0/dist/ppl-compass.css"
        integrity="sha384-gnNykpgFhVW6TBfaNWy6T1ldwqhfUN3E+PYaY8GFggoA13BNNJJl7prnULMptiQB"
        crossorigin="anonymous">
</head>
<body data-brand="people">

  <button class="ppl-btn ppl-btn--primary">Concluir admissão</button>

  <script src="https://cdn.jsdelivr.net/gh/FelipeSilveiraBNG/ppl-compass@1.0.0/dist/ppl-compass-icons.js"
          integrity="sha384-o+I2YYIzrf7eiwXox6GFV1UX+gkIudlDtXnA0MwZvanJkBmjYwRCtA7LKJVwhPCx" crossorigin="anonymous"></script>
  <script src="https://cdn.jsdelivr.net/gh/FelipeSilveiraBNG/ppl-compass@1.0.0/dist/ppl-compass.js"
          integrity="sha384-IMIGtsjZiQD10er++tBRXDGL3zDqQmMRuO3o6PoV+t5N0qQghwcp/znJ4us18aMO" crossorigin="anonymous"></script>
  <script>addEventListener('DOMContentLoaded', () => PplCompass.init());</script>
</body>
</html>
```

**Comece pela galeria:** [`demo/gallery.html`](demo/gallery.html) traz os 19 blocos com o HTML
copiável de cada componente.

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
**Texto** `.ppl-display` `.ppl-data` `.ppl-eyebrow` `.ppl-grad-text`
**Ação** `.ppl-btn` (`--primary --hero --secondary --ghost --danger --gold --sm --icon --touch`)
**Estado** `.ppl-badge` `.ppl-alert` `.ppl-toast` `.ppl-state` `.ppl-skeleton` `.ppl-spinner` `.ppl-progress`
**Formulário** `.ppl-field` `.ppl-input` `.ppl-select` `.ppl-check` `.ppl-combo`
**Sobreposição** `.ppl-drawer` `.ppl-dialog` `.ppl-scrim`
**Navegação** `.ppl-nav` `.ppl-topbar` `.ppl-tabbar` `.ppl-page-head`
**Conteúdo** `.ppl-panel` `.ppl-choice` `.ppl-stat` `.ppl-table` `.ppl-steps` `.ppl-review` `.ppl-disclosure`
**Layout** `.ppl-shell` `.ppl-main` `.ppl-stack` `.ppl-row` `.ppl-cols-2`

### Comportamento sem escrever JavaScript

```html
<button data-ppl-drawer-open="meu-drawer">Abrir</button>
<button data-ppl-drawer-close>Fechar</button>
<section data-ppl-disclosure>…</section>
<div data-ppl-combo>…</div>
<button data-ppl-search-open>Buscar</button>
<button data-ppl-theme-toggle>Tema</button>
<i data-ppl-icon="wallet" data-ppl-size="16"></i>
```

### API

```js
PplCompass.init({ acoes: [{ href, label }] });
PplCompass.toast.success(msg) / .error(msg, { acao: { label, onClick } }) / .info(msg)
PplCompass.drawer.abrir(id) / .fechar(id)
PplCompass.busca.abrir() / .fechar()
PplCompass.tema.alternar()
PplCompass.icon(nome, tamanho)
PplCompass.fmt.cpf / .cnpj / .dinheiro / .contagem / .competencia

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
| `@1.0.0` | 1 ano, imutável | a demo de amanhã é byte a byte a de hoje |
| `@main` | 12 h no edge | a demo pode mudar sozinha antes da reunião |

**Use o arquivo com SRI, não o `.min`.** O jsDelivr gera `.min.css` automaticamente, mas avisa
para **não** usar SRI com arquivo gerado dinamicamente: o minificador muda de versão, o hash
quebra e a página para de carregar. E os comentários das receitas são a documentação — cada uma
anota o componente React de origem e a regra de acessibilidade que a sustenta.

---

## Versionamento

SemVer. **A superfície pública é:** nomes de token, nomes de classe, atributos `data-*` e a API
`PplCompass.*`.

| Mudança | Bump |
|---|---|
| novo componente, novo token, nova variante | minor |
| ajuste de valor sem trocar nome | patch |
| renomear ou remover token, classe, `data-*` ou método | **major** |

---

## Desenvolvimento

Não é um pacote npm e não tem dependência de build. `src/` é legível, `dist/` é o que o CDN serve.

```bash
node scripts/build.mjs        # monta dist/ e confere as invariantes
node scripts/sri.mjs          # tabela de hashes para colar neste README
node scripts/sri.mjs --html   # as tags prontas, já com a URL do CDN

PPL_TAG=v1.1.0 node scripts/sri.mjs --html
```

### Validar antes de publicar

| Página | Aponta para | Serve para |
|---|---|---|
| `demo/gallery.html` | `../dist/` | ver todos os componentes do commit aberto |
| `demo/proof-local.html` | `../dist/` | validar o **conteúdo** antes de publicar |
| `demo/proof.html` | o CDN | validar a **entrega** depois de publicar |

Se a local aprova e a do CDN reprova, o problema é entrega. Se a local reprova, é o pacote —
nem adianta publicar.

```bash
python -m http.server 8777
# http://localhost:8777/demo/gallery.html
```

### Publicar

```bash
node scripts/build.mjs
node scripts/sri.mjs              # cole os hashes aqui e em demo/proof.html
git add -A && git commit -m "release: v1.0.0"
git tag v1.0.0 && git push origin main --tags
```

O hash cobre o **byte exato** de cada arquivo: qualquer mudança, inclusive num comentário, gera
um hash novo. Regere **antes** de criar a tag, nunca depois.

---

## Hashes SRI

| Arquivo | Tamanho | `integrity` (v1.0.0) |
|---|---|---|
| `ppl-compass-components.css` | 43.8 KB | `sha384-oZ441bg1N6cRV4ytw6bWJD4zWPXLGlhslfODJh+OSMd5+l5eZwaRjnBdDHfF/i/u` |
| `ppl-compass-icons.js` | 6.3 KB | `sha384-o+I2YYIzrf7eiwXox6GFV1UX+gkIudlDtXnA0MwZvanJkBmjYwRCtA7LKJVwhPCx` |
| `ppl-compass-nofonts.css` | 57.3 KB | `sha384-4evymN0fna0R8UEDZm0l6YQE0+/mW7e77KMm9O7vj39G6dQIrO+IBJNFf/7EBIRu` |
| `ppl-compass-tokens.css` | 12.6 KB | `sha384-3fyTGfH+NW8HgYJ+fNNdYdIkl6OM5VyyePyxGR1v4czXGyGQXkX1Q3eGsYR19GeM` |
| `ppl-compass.css` | 59.9 KB | `sha384-gnNykpgFhVW6TBfaNWy6T1ldwqhfUN3E+PYaY8GFggoA13BNNJJl7prnULMptiQB` |
| `ppl-compass.js` | 23.7 KB | `sha384-IMIGtsjZiQD10er++tBRXDGL3zDqQmMRuO3o6PoV+t5N0qQghwcp/znJ4us18aMO` |

---

## Licença

[MIT](LICENSE). As fontes redistribuídas seguem a **SIL Open Font License 1.1** — ver [NOTICE.md](NOTICE.md).
