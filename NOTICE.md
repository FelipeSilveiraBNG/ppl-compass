# NOTICE — software de terceiros redistribuído

O código do `ppl-compass` é MIT (ver [LICENSE](LICENSE)). Os itens abaixo são de terceiros,
redistribuídos com este pacote, e mantêm as suas próprias licenças.

---

## Fontes — a partir da v1.0.0, em `dist/fonts/`

As três estão sob **SIL Open Font License 1.1**, que permite redistribuição e uso comercial,
**desde que o aviso de licença seja preservado junto dos arquivos**. É por isso que este
documento existe.

| Fonte | Papel no design system | Licença |
|---|---|---|
| **Urbanist** | UI — toda a interface | SIL OFL 1.1 |
| **Playfair Display** (itálica) | display humano — só saudação, sucesso e hero | SIL OFL 1.1 |
| **JetBrains Mono** | dados de folha e ponto, com `tabular-nums` | SIL OFL 1.1 |

Os arquivos `OFL.txt` de cada família acompanham os `.woff2` em `dist/fonts/`.

Restrição da OFL que vale registrar: **a fonte não pode ser vendida isoladamente** e, se for
modificada (ex.: gerar um subset), o Reserved Font Name não pode ser reutilizado no arquivo
derivado. Fazer subset latin e manter o nome original é uso corrente e aceito; renomear a família
não é necessário para subsetting.

---

## Ícones — a partir da v1.0.0, se forem reusados em vez de redesenhados

O design system do BNG People usa **lucide** como biblioteca única de ícones (DS-03).
O framework proíbe carregar o pacote em runtime (zero dependência), mas o **lucide é ISC**, que
permite reusar os dados de path com atribuição.

| Item | Licença | Como entra aqui |
|---|---|---|
| **lucide** | ISC | dados de `path` embutidos em `ppl-compass-icons.js`, sem carregar o pacote |

Se os ícones forem redesenhados do zero em vez de reusados, esta seção sai.

O texto integral da licença ISC do lucide acompanha o arquivo de ícones quando ele existir.

---

## Nada além disto

Não há dependência de runtime: sem React, Vue, jQuery, Tailwind, Bootstrap, Alpine.
Se este arquivo crescer, a promessa de zero dependência foi quebrada — vale investigar antes de
adicionar a linha.
