# Templates de tela

Oito arquétipos. Cada um é um `.html` autossuficiente que roda com dois `<link>`/`<script>`
apontando para o CDN — **copie o arquivo, troque o conteúdo, pronto**. Não há build, não há
`include`, não há passo intermediário.

---

## Qual usar

| A tela que você quer | Template | O que ela é |
|---|---|---|
| Qualquer uma — comece aqui | [`shell.html`](shell.html) | navegação + topo + `<main>` vazio |
| Tabela de registros | [`lista.html`](lista.html) | painel com tabela e os **quatro estados** |
| Tabela + edição num painel | [`form-drawer.html`](form-drawer.html) | o padrão de 35 telas do console |
| Fluxo em etapas | [`wizard.html`](wizard.html) | numerado, com revisão e conclusão |
| Ponto de partida do operador | [`home.html`](home.html) | saudação e processos em cards grandes |
| Ficha de um registro | [`detalhe.html`](detalhe.html) | contexto, números e seções colapsáveis |
| Página pública | [`landing.html`](landing.html) | vidro e tema escuro — a única superfície com os dois |
| Aplicativo do colaborador | [`pwa.html`](pwa.html) | molde móvel com tabbar e alvo de toque |

---

## Como fazer a próxima tela

1. Copie o template mais próximo.
2. Troque a **`rotaAtiva`** do JSON da navegação e a **migalha** do topo. São os dois lugares
   que dizem "onde estou", e desencontrar os dois é o defeito mais comum ao copiar.
3. Troque o miolo do `<main>`.
4. Confira a tag do CDN nas três URLs do topo e do rodapé — protótipo publicado aponta para
   **tag fixa**, nunca para branch.

A navegação inteira sai de um `<script type="application/json">` dentro do `<aside data-ppl-nav>`.
É por isso que dez telas não custam dez cópias de marcação: custam dez vezes a mesma lista com uma
rota diferente. Trocar um item de lugar muda as dez de uma vez, porque o JSON é o mesmo texto
colado — colar é a única forma de reúso que sobrevive à restrição de zero build no consumidor.

### A navegação falha fechado

Ela não aparece meio certa. Some, e no lugar dela vem um alerta dizendo o defeito:

- item sem `label` ou sem `href`;
- grupo sem itens;
- `contador` que não é número — o `"99+"` é exatamente o que o badge de contagem existe para evitar;
- tabbar com mais de **5** itens, que é o teto verificado no CI do produto;
- tabbar fora de um `<nav>`;
- **`rotaAtiva` que não existe no menu** — o mais importante dos seis. Menu que não sabe onde você
  está é pior do que menu nenhum, porque mente com confiança.

---

## O que estes templates assumem

| Decisão | Consequência aqui |
|---|---|
| **Dados estáticos** (Q12) | os dados moram no HTML. `data-ppl-submit` fecha o painel e anuncia o resultado; a tabela por baixo **não** ganha a linha. |
| **Sempre por HTTP** (Q11) | os templates apontam para o CDN. Abrir por `file://` não funciona — sirva a pasta. |
| **Escuro só na landing** (Q14) | o alternador de tema existe só em `landing.html`; o shell autenticado é claro-only, como o produto. |
| **Desktop + um molde móvel** (Q13) | sete templates de desktop e um de aplicativo. |
| **PO e time interno** (Q9) | cobertura antes de polimento: muitos arquétipos rasos para montar a jornada inteira rápido. |

### Os limites, ditos na cara

- **O toast é o único registro do que aconteceu.** Numa tela de verdade isso seria defeito: a lista
  tem que ganhar a linha, e o estado da tela tem que mudar junto. Aqui é a consequência aceita de
  não haver estado.
- **Voltar uma etapa no wizard redesenha o formulário**, então o que foi digitado se perde. Mesma
  causa.
- **A navegação precisa de JavaScript.** Com o script bloqueado, o `<aside>` fica vazio — os ícones
  já dependiam disso, mas navegação é conteúdo, e isso é um recuo em relação a "degrada sem JS".
  A troca foi aceita porque o alternativa é dez cópias da mesma marcação divergindo em silêncio.
  Se um protótipo precisar sobreviver sem JS, escreva os `<a class="ppl-nav__item">` à mão: a
  receita CSS é a mesma, e `nav()` não é obrigatório.

---

## Escrever JavaScript não faz parte

Sete dos oito templates têm exatamente uma linha de script: `PplCompass.init()`. Todo o resto é
atributo no HTML.

```html
<button data-ppl-drawer-open="meu-drawer">Abrir</button>
<button data-ppl-drawer-close>Fechar</button>
<form data-ppl-submit="Rubrica 1042 criada.">…</form>
<section data-ppl-disclosure>…</section>
<div data-ppl-combo>…</div>
<button data-ppl-search-open>Buscar</button>
<button data-ppl-theme-toggle>Tema</button>
<i data-ppl-icon="wallet" data-ppl-size="16"></i>
<aside class="ppl-nav" data-ppl-nav><script type="application/json">…</script></aside>
```

A exceção é `wizard.html`: os passos, a validação de cada etapa e a conclusão são **dados do
fluxo**, não marcação, e passam pela `PplCompass.Wizard`. Fluxo de efeito jurídico ou financeiro
sem etapa de revisão não renderiza — o pacote mostra o defeito em vez de deixar assinar sem
conferir.

---

## Conferir localmente antes de publicar

Os templates apontam para a tag publicada, então **antes do push eles carregam uma versão que
ainda não existe**. Para ver o que se está publicando:

```bash
node scripts/build.mjs        # dist/ e as invariantes (os templates também são conferidos)
node scripts/preview.mjs      # espelha templates/ em .preview/ apontando para ../dist/
python -m http.server 8777    # http://localhost:8777/.preview/lista.html
```

`.preview/` não vai para o Git. Ele é artefato de conferência, nunca entregável.

---

## O critério que estes templates precisam cumprir

`lista.html` **é** a tela de Folha do console, e cabe em **menos de 200 linhas de HTML**, sem uma
linha de CSS nova e sem nenhum `<script>` além do `init()`. Esse é o critério de sucesso da v1
(`PLANO.md` §1). Se uma mudança fizer o arquivo passar de 200 linhas, o problema é falta de
componente — não excesso de tela.
