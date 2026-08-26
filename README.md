# ppl-compass

Framework de prototipação do **BNG People**. CSS + JS, **zero dependência**, servido por CDN.

Monte um protótipo navegável do produto escrevendo HTML — com a identidade v5 (azul + dourado)
já correta e as regras de acessibilidade já embutidas.

> **v0.1.0 é um release de prova.** Um token e uma classe, para validar o caminho de entrega
> antes de escrever componente. O framework entra na v1.0.0.

---

## Uso

```html
<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="stylesheet"
        href="https://cdn.jsdelivr.net/gh/FelipeSilveiraBNG/ppl-compass@0.1.0/dist/ppl-compass.css"
        integrity="sha384-oDd/Cbo3oZtMz2uMiSgkMhRNO10x1PvWpOOUICcVXOFgIBfBaiwNmHsMNXqTJZkZ"
        crossorigin="anonymous">
</head>
<body data-brand="people">
  <div class="ppl-proof"></div>
</body>
</html>
```

A partir da v1.0.0 entra também:

```html
  <script defer src="https://cdn.jsdelivr.net/gh/FelipeSilveiraBNG/ppl-compass@1.0.0/dist/ppl-compass.js"></script>
  <script>addEventListener('DOMContentLoaded', () => PplCompass.init());</script>
```

---

## Regras de uso

**Aponte sempre para uma tag, nunca para um branch.**

| Referência | Cache | Consequência |
|---|---|---|
| `@0.1.0` (tag) | 1 ano, imutável | ✅ a demo de amanhã é byte a byte a de hoje |
| `@main` (branch) | 12 h no edge | ❌ a demo pode mudar sozinha antes da reunião |

**Use o arquivo com SRI, não o `.min`.** O jsDelivr gera `.min.css` automaticamente, mas
[avisa explicitamente](https://www.jsdelivr.com/documentation) para **não** usar SRI com arquivos
gerados dinamicamente — a versão do minificador muda, o hash quebra e a página para de carregar.

O arquivo completo tem ~22 KB gzipados e os comentários são a documentação: cada receita anota o
componente React de origem e a regra de acessibilidade que a sustenta. Minificar apaga exatamente
isso, para economizar ~6 KB. Não compensa.

---

## Versionamento

SemVer. **A superfície pública é:** nomes de token, nomes de classe, atributos `data-*`
e a API `PplCompass.*`.

| Mudança | Bump |
|---|---|
| novo componente, novo token, nova variante | minor |
| ajuste de valor sem trocar nome | patch |
| renomear ou remover token, classe, `data-*` ou método | **major** |

Enquanto estiver em `0.x`, a API pode quebrar em minor — os nomes ainda estão assentando.

---

## Desenvolvimento

Não é um pacote npm e não tem dependência de build. `src/` é legível, `dist/` é o que o CDN serve.

```bash
node scripts/build.mjs        # copia src/ → dist/ e confere as invariantes
node scripts/sri.mjs          # tabela de hashes SRI para colar neste README
node scripts/sri.mjs --html   # o <link> pronto, já com a URL do CDN

# owner e tag padrão são FelipeSilveiraBNG e v0.1.0; sobrescreva por variável de ambiente
PPL_TAG=v0.2.0 node scripts/sri.mjs --html
```

O `build.mjs` **falha fechado**: nome de token aposentado no fonte reprova o build com exit 1,
em vez de virar dívida silenciosa. São os nomes herdados da identidade anterior —
`--color-people-violet-*` (a escala é azul e se chama `blue-*`), os tokens órfãos que ficaram
referenciados sem nunca terem sido definidos, e o violeta `#6F00FF`.

### Validar antes de publicar

Duas páginas de prova, e a diferença entre elas é o diagnóstico:

| Página | Aponta para | Serve para |
|---|---|---|
| `demo/proof-local.html` | `../dist/` | validar o **conteúdo** antes de publicar |
| `demo/proof.html` | o CDN | validar o **caminho de entrega** depois de publicar |

Se a local aprova e a do CDN reprova, o problema é entrega (org, tag, SRI, propagação).
Se a local reprova, o problema é o CSS — nem adianta publicar.

Sirva por HTTP, não abra por `file://`:

```bash
python -m http.server 8777
# http://localhost:8777/demo/proof-local.html
```

Publicar uma versão:

```bash
node scripts/build.mjs
git add -A && git commit -m "release: v0.1.0"
git tag v0.1.0 && git push origin main --tags
# a tag fica disponível no jsDelivr em segundos
```

---

## Hashes SRI

| Arquivo | Tamanho | `integrity` (v0.1.0) |
|---|---|---|
| `ppl-compass.css` | 1,6 KB | `sha384-oDd/Cbo3oZtMz2uMiSgkMhRNO10x1PvWpOOUICcVXOFgIBfBaiwNmHsMNXqTJZkZ` |

> O hash cobre o **byte exato** de `dist/ppl-compass.css`. Qualquer mudança no arquivo — inclusive
> num comentário — gera um hash novo. Regere com `node scripts/sri.mjs` e atualize esta tabela
> **antes** de criar a tag, nunca depois.

---

## Licença

[MIT](LICENSE). As fontes redistribuídas seguem a **SIL Open Font License 1.1** — ver [NOTICE.md](NOTICE.md).
