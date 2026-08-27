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

## Ícones — em vigor desde a adoção do lucide (27/08/2026)

O design system do BNG People usa **lucide** como biblioteca única de ícones (DS-03), e a produção
(console + PWA) o consome via `lucide-react`. O framework **proíbe carregar o pacote em runtime**
(zero dependência) — mas o **lucide é ISC**, que permite reusar os dados de geometria com
atribuição. É o que este pacote faz.

| Item | Licença | Como entra aqui |
|---|---|---|
| **lucide** | ISC | geometria de 136 ícones embutida em `ppl-compass-icons.js`, sem carregar o pacote |

O texto integral da licença ISC acompanha os arquivos em **`dist/LICENSE-lucide.txt`** — é a
condição que o ISC põe, e por isso o arquivo é copiado do próprio pacote pelo gerador, nunca
transcrito à mão.

Como funciona, para não haver dúvida sobre o que chega ao navegador:

- `lucide-static@0.575.0` é **devDependency de build** — a mesma minor que o `lucide-react` da
  produção, para que protótipo e produto desenhem o mesmo traço;
- `scripts/gerar-icones.mjs` lê a geometria e emite `src/ppl-compass-icons.js` com os dados
  embutidos, no traço 2 e na grade 24×24 do lucide;
- o `dist/` não contém nenhuma referência ao pacote, e o navegador nunca pede nada ao npm.

Os nomes usados são os **canônicos** do lucide. Alias depreciado do `lucide-react` (`AlertTriangle`)
resolve para o canônico (`triangle-alert`): geometria idêntica, nome que sobrevive.

---

## Nada além disto

Não há dependência de **runtime**: sem React, Vue, jQuery, Tailwind, Bootstrap, Alpine. As duas
devDependencies (`lucide-static`, `playwright-core`) são de build e de CI — não chegam ao navegador.
Se a lista de runtime deste arquivo crescer, a promessa de zero dependência foi quebrada — vale
investigar antes de adicionar a linha.
