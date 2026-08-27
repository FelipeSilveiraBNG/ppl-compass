/*!
 * ppl-compass — comportamentos
 *
 * Zero dependência. Uma IIFE, um global: window.PplCompass.
 * Quem monta o protótipo NÃO escreve JavaScript: marca o HTML com data-* e
 * chama init() uma vez.
 *
 *   PplCompass.init();
 *   PplCompass.toast.success('Rubrica criada.');
 *   PplCompass.drawer.abrir('drawer-rubrica');
 */
(function (global) {
  'use strict';

  var $  = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  /* ==========================================================================
   * LIGAR DUAS VEZES NAO PODE LIGAR DUAS VEZES
   * --------------------------------------------------------------------------
   * `init()` É FEITO para ser chamado de novo: é assim que HTML injetado depois
   * do load ganha comportamento, e é o que o `aoRenderizar` do wizard faz a cada
   * etapa — o construtor já renderiza o primeiro passo, então acontece no load,
   * sem interação nenhuma.
   *
   * O problema é que `addEventListener` só ignora o repetido quando a REFERÊNCIA
   * é a mesma. Closure anônima nova é referência nova, então cada `init()`
   * empilhava outro listener no mesmo elemento — e o dano dependia da natureza
   * do efeito, o que fazia cada componente falhar de um jeito diferente:
   *
   *   alternância (`aria-expanded = !aberto`)  par de listeners = movimento ZERO
   *                                            (o chevron do menu e o botão do
   *                                            disclosure ficavam mortos)
   *   acumulador (`ativo = ativo + 1`)         ArrowDown andava dois itens
   *   produtor (cria DOM)                      um submit dava dois toasts; um
   *                                            clique em "reabrir competência"
   *                                            abria QUATRO diálogos e deixava
   *                                            scrims órfãos sobre a página
   *   escrita idempotente / guarda de estado   inofensivo (painel, drawer)
   *
   * O `tema` nunca teve o defeito, e por acidente: ele passa `alternar`, função
   * NOMEADA, então a referência repetia e o navegador descartava. A diferença
   * entre imune e quebrado era ter dado nome à função.
   *
   * `umaVez` marca o elemento e responde se é a PRIMEIRA vez. A guarda protege o
   * corpo inteiro de cada ligação, não só o `addEventListener`: reprocessar o
   * estado inicial jogaria fora o que a pessoa abriu ou fechou desde o load.
   * Elemento novo (injetado, ou recriado por `nav()`) chega sem marca e é ligado
   * normalmente — que é justamente o serviço que o `init()` presta.
   *
   * Ligação DELEGADA no `document` não usa isto: ela precisa existir uma vez na
   * vida e não pertence a elemento nenhum, então quem a guarda é um booleano de
   * módulo. Marca em elemento ali seria mentira sobre o que está sendo protegido.
   * ======================================================================== */
  function umaVez(el, marca) {
    if (!el || el.dataset[marca]) return false;
    el.dataset[marca] = '1';
    return true;
  }

  /* ==========================================================================
   * 0 · MODAL — o que drawer e diálogo compartilham
   * --------------------------------------------------------------------------
   * UM MODAL POR VEZ, e isso não é preferência estética. O foco é preso
   * marcando os IRMÃOS do que está aberto como `inert`; um segundo modal, aberto
   * por cima, nasceria irmão do primeiro e portanto inerte — desenhado na tela,
   * invisível para o teclado e para o leitor de tela. Empilhar aqui não degrada,
   * apaga. Então quem tenta abrir o segundo é recusado, e sabe por quê.
   *
   * A região de notificações fica FORA da inertização: um toast que aparece
   * enquanto o modal está aberto precisa continuar sendo anunciado. Prender o
   * foco é impedir que a pessoa se perca, não silenciar o sistema.
   * ======================================================================== */
  var modal = (function () {
    var atual = null;
    var gatilho = null;
    var overflow = '';

    /* Sobe do modal até o <body> marcando os IRMÃOS de cada nível. O caminho
       do body até o modal fica de fora, e todo o resto fica inerte.

       Antes isto marcava só os filhos diretos de <body> — e aí um modal
       aninhado em qualquer container ficava inerte ELE MESMO, junto com o
       container. Desenhado na tela, morto para o teclado. Funcionava enquanto
       todo drawer por acaso era filho direto de <body>: uma armadilha que só
       aparece quando alguém aninha, e que não dá nenhum sinal quando aparece. */
    function inertizar(el, ligado) {
      var no = el;
      while (no && no !== document.body && no.parentElement) {
        var irmaos = no.parentElement.children;
        for (var i = 0; i < irmaos.length; i++) {
          var irmao = irmaos[i];
          if (irmao === no || irmao.classList.contains('ppl-toaster')) continue;
          if (ligado) irmao.setAttribute('inert', ''); else irmao.removeAttribute('inert');
        }
        no = no.parentElement;
      }
    }

    return {
      /** O elemento modal aberto, ou null. */
      aberto: function () { return atual; },

      abrir: function (el, origem) {
        atual = el;
        gatilho = origem || document.activeElement;
        overflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        inertizar(el, true);
      },

      fechar: function (el) {
        inertizar(el, false);
        document.body.style.overflow = overflow;
        atual = null;
        /* O foco VOLTA ao gatilho. Sem isto, fechar um painel joga o teclado
           para o início do documento e a pessoa refaz o caminho inteiro. */
        if (gatilho && gatilho.focus) gatilho.focus();
        gatilho = null;
      }
    };
  })();

  /* ==========================================================================
   * 1 · DRAWER
   * --------------------------------------------------------------------------
   * Contrato de acessibilidade que a tradução não pode perder:
   *  - role="dialog" + aria-modal + aria-labelledby
   *  - Esc fecha; clique no scrim fecha
   *  - o foco vai para o painel ao abrir e VOLTA ao gatilho ao fechar
   *  - o resto da página fica `inert` enquanto aberto: o leitor de tela e o Tab
   *    não escapam do painel. Antes isso exigia varrer tabindex à mão.
   * ======================================================================== */
  var drawer = (function () {
    function abrir(id, origem) {
      var el = document.getElementById(id);
      if (!el || el.dataset.open === 'true') return;
      if (modal.aberto()) return;              // um modal por vez — ver o bloco 0
      el.dataset.open = 'true';
      el.removeAttribute('aria-hidden');
      modal.abrir(el, origem);
      var painel = $('.ppl-drawer__panel', el);
      if (painel) { painel.setAttribute('tabindex', '-1'); painel.focus(); }
    }

    function fechar(id) {
      var el = id ? document.getElementById(id) : $('.ppl-drawer[data-open="true"]');
      if (!el) return;
      el.dataset.open = 'false';
      el.setAttribute('aria-hidden', 'true');
      modal.fechar(el);
    }

    /* Delegação no `document`: precisa existir UMA vez na vida e não pertence a
       elemento nenhum, então o guarda é um booleano — não uma marca em elemento.
       (O drawer nunca sofreu com a duplicação porque `abrir` recusa painel já
       aberto e recusa segundo modal; mesmo assim, listener empilhado a cada
       `init()` é lixo que cresce.) */
    var ligado = false;
    function ligar() {
      if (ligado) return;
      ligado = true;

      document.addEventListener('click', function (e) {
        var abre = e.target.closest('[data-ppl-drawer-open]');
        if (abre) { abrir(abre.dataset.pplDrawerOpen, abre); return; }
        var fecha = e.target.closest('[data-ppl-drawer-close]');
        if (fecha) { var d = fecha.closest('.ppl-drawer'); fechar(d && d.id); return; }
        if (e.target.classList && e.target.classList.contains('ppl-drawer__scrim')) {
          fechar(e.target.closest('.ppl-drawer').id);
        }
      });
      document.addEventListener('keydown', function (e) {
        if (e.key !== 'Escape') return;
        var aberto = $('.ppl-drawer[data-open="true"]');
        if (aberto) fechar(aberto.id);
      });
    }

    return { abrir: abrir, fechar: fechar, _ligar: ligar };
  })();

  /* ==========================================================================
   * 2 · TOAST
   * --------------------------------------------------------------------------
   * Região aria-live="polite"; cada toast é role="status".
   * Sucesso e info somem sozinhos. ERRO é PERSISTENTE e traz ação de
   * recuperação — é o requisito do design system, e é o que o console ainda
   * não faz (lá tudo some em 4,2s). O protótipo mostra o alvo.
   * ======================================================================== */
  var toast = (function () {
    var regiao = null;
    var DURACAO = 4200;

    function garantirRegiao() {
      if (regiao && document.body.contains(regiao)) return regiao;
      regiao = $('.ppl-toaster');
      if (!regiao) {
        regiao = document.createElement('div');
        regiao.className = 'ppl-toaster';
        regiao.setAttribute('aria-live', 'polite');
        regiao.setAttribute('role', 'region');
        regiao.setAttribute('aria-label', 'Notificações');
        document.body.appendChild(regiao);
      }
      return regiao;
    }

    function mostrar(tipo, mensagem, opcoes) {
      opcoes = opcoes || {};
      var el = document.createElement('div');
      el.className = 'ppl-toast ppl-toast--' + tipo;
      el.setAttribute('role', 'status');

      var icone = document.createElement('span');
      icone.innerHTML = icons.svg(
        tipo === 'success' ? 'circle-check' : tipo === 'error' ? 'circle-x' : 'info', 18
      );

      var corpo = document.createElement('span');
      corpo.className = 'ppl-toast__body';
      corpo.textContent = mensagem;

      el.appendChild(icone);
      el.appendChild(corpo);

      if (opcoes.acao) {
        var acao = document.createElement('button');
        acao.type = 'button';
        acao.className = 'ppl-btn ppl-btn--sm ppl-btn--ghost';
        acao.textContent = opcoes.acao.label;
        acao.addEventListener('click', function () { opcoes.acao.onClick(); el.remove(); });
        el.appendChild(acao);
      }

      var fechar = document.createElement('button');
      fechar.type = 'button';
      fechar.className = 'ppl-toast__close';
      fechar.setAttribute('aria-label', 'Fechar notificação');
      fechar.innerHTML = icons.svg('x', 14);
      fechar.addEventListener('click', function () { el.remove(); });
      el.appendChild(fechar);

      garantirRegiao().appendChild(el);
      if (tipo !== 'error') setTimeout(function () { el.remove(); }, opcoes.duracao || DURACAO);
      return el;
    }

    return {
      success: function (m, o) { return mostrar('success', m, o); },
      error:   function (m, o) { return mostrar('error', m, o); },
      info:    function (m, o) { return mostrar('info', m, o); },
      show: mostrar
    };
  })();

  /* ==========================================================================
   * 3 · BUSCA GLOBAL (Ctrl/⌘+K)
   * --------------------------------------------------------------------------
   *  - Escape vale em QUALQUER ponteiro: fechar diálogo é acessibilidade,
   *    não atalho de descoberta.
   *  - O resto é desativado em `pointer: coarse`. Num aparelho de dedo o ⌘K
   *    não tem como ser acionado, e o painel anunciaria teclas que não existem.
   *    A porta lá é o botão da barra de topo.
   *  - A lista é composta pelo que o usuário pode: nunca listar-e-negar.
   * ======================================================================== */
  var busca = (function () {
    var CHAVE = 'ppl_recentes';
    var acoes = [], el = null, input = null, lista = null, ativo = 0;

    function touch() { return global.matchMedia && global.matchMedia('(pointer: coarse)').matches; }
    function lerRecentes() {
      try { return JSON.parse(localStorage.getItem(CHAVE) || '[]'); } catch (e) { return []; }
    }
    function registrar(href) {
      try {
        var l = lerRecentes().filter(function (h) { return h !== href; });
        l.unshift(href);
        localStorage.setItem(CHAVE, JSON.stringify(l.slice(0, 6)));
      } catch (e) { /* modo privado ou quota: recente é conveniência, não requisito */ }
    }

    function filtrar(termo) {
      var t = termo.trim().toLowerCase();
      if (!t) {
        var rec = lerRecentes();
        if (!rec.length) return acoes.slice(0, 8);
        var mapa = {};
        acoes.forEach(function (a) { mapa[a.href] = a; });
        var topo = rec.map(function (h) { return mapa[h]; }).filter(Boolean);
        return topo.concat(acoes.filter(function (a) { return rec.indexOf(a.href) === -1; })).slice(0, 8);
      }
      return acoes.filter(function (a) {
        return (a.label + ' ' + a.href).toLowerCase().indexOf(t) !== -1;
      }).slice(0, 8);
    }

    function render() {
      var itens = filtrar(input.value);
      ativo = Math.min(ativo, Math.max(itens.length - 1, 0));
      lista.textContent = '';
      if (!itens.length) {
        var vazio = document.createElement('li');
        vazio.className = 'ppl-state ppl-state--empty';
        vazio.style.padding = '24px';
        vazio.textContent = 'Nada encontrado.';
        lista.appendChild(vazio);
        return;
      }
      itens.forEach(function (a, i) {
        var li = document.createElement('li');
        li.setAttribute('role', 'option');
        li.setAttribute('aria-selected', String(i === ativo));
        var link = document.createElement('a');
        link.className = 'ppl-combo__option';
        link.href = a.href;
        var wrap = document.createElement('span');
        var nome = document.createElement('span'); nome.textContent = a.label;
        var hint = document.createElement('span'); hint.className = 'ppl-combo__hint'; hint.textContent = a.href;
        wrap.appendChild(nome); wrap.appendChild(hint);
        link.appendChild(wrap);
        li.appendChild(link);
        lista.appendChild(li);
      });
    }

    /* A busca declara `aria-modal="true"`. Declarar e não prender o foco é
       mentir para o leitor de tela: ele anuncia que o resto da página está
       fora, e o Tab passeia por ela assim mesmo. Então ela entra na mesma
       trava dos outros modais — inclusive na de um por vez. */
    function abrir(origem) {
      if (!el || !el.hidden) return;
      if (modal.aberto()) return;
      el.hidden = false;
      input.value = '';
      ativo = 0;
      render();
      modal.abrir(el, origem);
      input.focus();
    }
    function fechar() {
      if (!el || el.hidden) return;
      el.hidden = true;
      if (modal.aberto() === el) modal.fechar(el);
    }

    /* O diálogo é montado aqui, como a região do toast. Antes, toda tela que
       quisesse busca precisava colar catorze linhas de marcação e manter os
       `aria-controls` em dia — e marcação copiada é marcação que envelhece
       diferente em cada cópia. Quem já tem um #ppl-search na página continua
       mandando: o dele é usado como está. */
    function garantirEl() {
      var achado = $('#ppl-search');
      if (achado) return achado;

      var scrim = document.createElement('div');
      scrim.className = 'ppl-scrim';
      scrim.id = 'ppl-search';
      scrim.hidden = true;

      var painel = document.createElement('div');
      painel.className = 'ppl-dialog ppl-dialog--wide';
      painel.setAttribute('role', 'dialog');
      painel.setAttribute('aria-modal', 'true');
      painel.setAttribute('aria-label', 'Busca global');

      var cabeca = document.createElement('div');
      cabeca.className = 'ppl-dialog__head';
      var titulo = document.createElement('h2');
      titulo.className = 'ppl-dialog__title';
      titulo.textContent = 'Busca global';
      var x = document.createElement('button');
      x.type = 'button';
      x.className = 'ppl-btn ppl-btn--icon ppl-btn--secondary';
      x.setAttribute('aria-label', 'Fechar busca');
      x.innerHTML = icons.svg('x', 16);
      x.addEventListener('click', fechar);
      cabeca.appendChild(titulo);
      cabeca.appendChild(x);

      var campo = document.createElement('input');
      campo.className = 'ppl-input';
      campo.id = 'ppl-search-input';
      campo.setAttribute('role', 'combobox');
      campo.setAttribute('aria-expanded', 'true');
      campo.setAttribute('aria-controls', 'ppl-search-list');
      campo.setAttribute('aria-autocomplete', 'list');
      campo.setAttribute('autocomplete', 'off');
      campo.placeholder = 'Buscar processo, tela ou registro…';

      var ul = document.createElement('ul');
      ul.className = 'ppl-combo__list ppl-search__list';
      ul.id = 'ppl-search-list';
      ul.setAttribute('role', 'listbox');

      painel.appendChild(cabeca);
      painel.appendChild(campo);
      painel.appendChild(ul);
      scrim.appendChild(painel);
      document.body.appendChild(scrim);
      return scrim;
    }

    function ligar(config) {
      /* Sem lista explícita, a busca herda o que a navegação compôs.
         Duas listas divergiriam na primeira rota nova. */
      acoes = (config && config.acoes) || nav.acoes();
      /* Sem nenhuma ação não existe busca — e um diálogo que abre vazio é pior
         do que um atalho que não faz nada. */
      if (!acoes.length) return;
      el = garantirEl();
      input = $('#ppl-search-input', el);
      lista = $('#ppl-search-list', el);

      /* O `acoes` acima é REPROCESSADO a cada `init()` de propósito: rota nova
         precisa entrar na busca. Só a ligação é que não pode repetir — e aqui
         ela não podia mesmo: `garantirEl()` REUSA o `#ppl-search` que já existe,
         então o mesmo `input` recebia outro `keydown` por init, e como `ativo` é
         uma variável de módulo os dois handlers incrementavam a MESMA: um toque
         de ArrowDown pulava do índice 0 para o 2. */
      if (!umaVez(el, 'pplLigadoBusca')) return;

      input.addEventListener('input', function () { ativo = 0; render(); });
      el.addEventListener('mousedown', function (e) { if (e.target === el) fechar(); });

      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') { fechar(); return; }
        if (touch()) return;
        if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
          e.preventDefault();
          abrir(document.activeElement);
        }
      });

      input.addEventListener('keydown', function (e) {
        var itens = $$('li[role="option"]', lista);
        if (e.key === 'ArrowDown') { e.preventDefault(); ativo = Math.min(ativo + 1, itens.length - 1); render(); }
        else if (e.key === 'ArrowUp')   { e.preventDefault(); ativo = Math.max(ativo - 1, 0); render(); }
        else if (e.key === 'Home')      { e.preventDefault(); ativo = 0; render(); }
        else if (e.key === 'End')       { e.preventDefault(); ativo = itens.length - 1; render(); }
        else if (e.key === 'Enter') {
          e.preventDefault();
          var link = $('li[aria-selected="true"] a', lista);
          if (link) { registrar(link.getAttribute('href')); link.click(); fechar(); }
        }
      });

      $$('[data-ppl-search-open]').forEach(function (b) {
        b.addEventListener('click', function () { abrir(b); });
      });
    }

    return { abrir: abrir, fechar: fechar, _ligar: ligar };
  })();

  /* ==========================================================================
   * 4 · DISCLOSURE — <button> dentro de <h*>, aria-expanded, aria-controls
   * ======================================================================== */
  var disclosure = {
    _ligar: function () {
      $$('[data-ppl-disclosure] .ppl-disclosure__btn').forEach(function (btn) {
        if (!umaVez(btn, 'pplLigadoDisclosure')) return;
        btn.addEventListener('click', function () {
          var aberto = btn.getAttribute('aria-expanded') === 'true';
          btn.setAttribute('aria-expanded', String(!aberto));
          var corpo = document.getElementById(btn.getAttribute('aria-controls'));
          if (corpo) corpo.hidden = aberto;
        });
      });
    }
  };

  /* ==========================================================================
   * 5 · COMBOBOX
   * --------------------------------------------------------------------------
   * Esc com o popup ABERTO fecha SÓ o popup e faz stopPropagation. Sem isso um
   * único Esc fecharia o drawer inteiro e perderia o formulário.
   * ======================================================================== */
  var combo = {
    _ligar: function () {
      $$('[data-ppl-combo]').forEach(function (raiz) {
        if (!umaVez(raiz, 'pplLigadoCombo')) return;
        var input = $('input[role="combobox"]', raiz);
        var lista = $('.ppl-combo__list', raiz);
        if (!input || !lista) return;
        var opcoes = $$('li[role="option"]', lista);
        var ativo = 0;

        function abrir()  { lista.hidden = false; input.setAttribute('aria-expanded', 'true'); }
        function fechar() { lista.hidden = true;  input.setAttribute('aria-expanded', 'false'); }
        function marcar() {
          var vis = opcoes.filter(function (o) { return !o.hidden; });
          opcoes.forEach(function (o) { o.setAttribute('aria-selected', 'false'); });
          if (vis[ativo]) vis[ativo].setAttribute('aria-selected', 'true');
        }
        function filtrar() {
          var t = input.value.trim().toLowerCase();
          var n = 0;
          opcoes.forEach(function (o) {
            var casa = !t || o.textContent.toLowerCase().indexOf(t) !== -1;
            o.hidden = !casa;
            if (casa) n++;
          });
          var vazio = $('.ppl-combo__empty', lista);
          if (vazio) vazio.hidden = n > 0;
        }
        function escolher(o) {
          input.value = $('.ppl-combo__option span span', o).textContent.trim();
          fechar();
        }

        input.addEventListener('focus', abrir);
        input.addEventListener('input', function () { abrir(); ativo = 0; filtrar(); marcar(); });
        input.addEventListener('keydown', function (e) {
          if (e.key === 'Escape') {
            if (!lista.hidden) { e.stopPropagation(); e.preventDefault(); }
            fechar();
            return;
          }
          if (lista.hidden && (e.key === 'ArrowDown' || e.key === 'Enter')) { e.preventDefault(); abrir(); return; }
          if (lista.hidden) return;
          var vis = opcoes.filter(function (o) { return !o.hidden; });
          if (e.key === 'ArrowDown') { e.preventDefault(); ativo = Math.min(ativo + 1, vis.length - 1); marcar(); }
          else if (e.key === 'ArrowUp') { e.preventDefault(); ativo = Math.max(ativo - 1, 0); marcar(); }
          else if (e.key === 'Enter')   { e.preventDefault(); if (vis[ativo]) escolher(vis[ativo]); }
          else if (e.key === 'Tab')     { fechar(); }
        });
        opcoes.forEach(function (o, i) {
          o.addEventListener('mouseenter', function () { ativo = i; marcar(); });
          o.addEventListener('click', function () { escolher(o); });
        });
        document.addEventListener('mousedown', function (e) { if (!raiz.contains(e.target)) fechar(); });
        marcar();
      });
    }
  };

  /* ==========================================================================
   * 6 · NAV — a navegação inteira a partir de um JSON
   * --------------------------------------------------------------------------
   * `PplCompass.nav(cfg)` desenha marca, grupos, itens, ícone, rota ativa,
   * contador e rodapé de usuário a partir de um objeto. É o que faz um template
   * virar dez sem copiar marcação: o shell de todas as telas é o mesmo JSON com
   * uma `rotaAtiva` diferente.
   *
   * Duas formas, o mesmo objeto. A declarativa é a que os templates usam: um
   * <aside class="ppl-nav" data-ppl-nav> com um <script type="application/json">
   * dentro. init() hidrata sozinho, e quem monta o protótipo continua sem
   * escrever JavaScript. A imperativa — PplCompass.nav({ alvo: '#nav', … }) —
   * existe para trocar a navegação depois que a página carregou.
   *
   * `variante: "tabbar"` desenha a navegação móvel a partir do MESMO objeto: um
   * shell e um molde de aplicativo não mantêm duas listas de rotas.
   *
   * Os grupos nascem RECOLHIDOS, exceto o que contém a rota ativa. Recolher é
   * gesto momentâneo de foco, não configuração: não persiste.
   *
   * FALHA FECHADO, e é aqui que isso paga. Navegação malformada não aparece
   * meio certa: ela some e dá lugar a um alerta que diz o defeito. Item sem
   * rótulo, item sem destino, grupo vazio, contador que não é número (o "99+"
   * é exatamente o que o badge de contagem proibiu), tabbar com mais de cinco
   * itens — o teto que o CI do produto verifica — e `rotaAtiva` que não existe
   * no menu. Esse último é o que mais importa: menu que não sabe onde você está
   * é pior do que menu nenhum, porque mente com confiança.
   * ======================================================================== */
  var nav = (function () {
    /* O que a navegação oferece vira a lista da busca global. Uma verdade só:
       declarar as ações de novo criaria duas listas que divergem na primeira
       rota nova. */
    var derivadas = [];

    function el(tag, cls, texto) {
      var n = document.createElement(tag);
      if (cls) n.className = cls;
      if (texto != null) n.textContent = texto;
      return n;
    }

    function comSvg(cls, nome, tam) {
      var n = el('span', cls);
      n.innerHTML = icons.svg(nome, tam);
      return n;
    }

    /** Todos os itens de link, com os grupos achatados. */
    function planos(cfg) {
      var saida = [];
      (cfg.itens || []).forEach(function (entrada) {
        if (entrada.grupo) saida = saida.concat(entrada.itens || []);
        else saida.push(entrada);
      });
      return saida;
    }

    function conferir(raiz, cfg) {
      var tabbar = cfg.variante === 'tabbar';
      if (!Array.isArray(cfg.itens) || !cfg.itens.length)
        return 'A chave "itens" precisa ser uma lista com pelo menos um item.';
      if (tabbar && raiz.tagName !== 'NAV')
        return 'A tabbar precisa morar num <nav>: o rótulo dela é o que anuncia a navegação.';

      for (var i = 0; i < cfg.itens.length; i++) {
        var entrada = cfg.itens[i];
        if (!entrada.grupo) continue;
        if (tabbar) return 'A tabbar não tem grupos — "' + entrada.grupo + '" precisa virar item ou sair.';
        if (!Array.isArray(entrada.itens) || !entrada.itens.length)
          return 'O grupo "' + entrada.grupo + '" está vazio. Grupo sem item só ocupa espaço.';
      }

      var lista = planos(cfg);
      if (tabbar && lista.length > 5)
        return 'A tabbar aceita no máximo 5 itens e vieram ' + lista.length + '.';

      for (var j = 0; j < lista.length; j++) {
        var it = lista[j];
        if (!it.label) return 'Há um item sem "label".';
        if (!it.href) return 'O item "' + it.label + '" está sem "href".';
        if ('contador' in it && typeof it.contador !== 'number')
          return 'O contador de "' + it.label + '" precisa ser número: o badge mostra o total real, com separador de milhar.';
      }

      if (cfg.rotaAtiva) {
        var achou = lista.some(function (it) { return it.href === cfg.rotaAtiva; });
        if (!achou) return 'A rotaAtiva "' + cfg.rotaAtiva + '" não existe neste menu.';
      }
      return null;
    }

    function defeito(raiz, mensagem) {
      raiz.textContent = '';
      var alerta = el('div', 'ppl-alert ppl-alert--danger');
      alerta.setAttribute('role', 'alert');
      /* Um filho só. `.ppl-alert` é flex de [ícone, texto]: dois filhos de texto
         viram duas colunas, e o aviso sai espremido em vez de legível. */
      var linha = el('span');
      linha.appendChild(el('strong', null, 'Navegação mal montada — nada foi exibido.'));
      linha.append(' ' + mensagem);
      alerta.appendChild(linha);
      raiz.appendChild(alerta);
      return null;
    }

    function item(it, rotaAtiva) {
      var a = el('a', 'ppl-nav__item');
      a.href = it.href;
      if (it.icone) a.appendChild(comSvg(null, it.icone, 16));
      a.appendChild(el('span', null, it.label));
      if (typeof it.contador === 'number') {
        a.appendChild(el('span', 'ppl-badge ppl-badge--gold ppl-badge--count ppl-nav__count',
                         fmt.contagem(it.contador)));
      }
      if (rotaAtiva && it.href === rotaAtiva) a.setAttribute('aria-current', 'page');
      return a;
    }

    function montarLateral(raiz, cfg) {
      raiz.textContent = '';
      raiz.classList.add('ppl-nav');

      if (cfg.marca) {
        var marca = el('div', 'ppl-nav__brand');
        marca.appendChild(el('span', 'ppl-nav__mark', cfg.marca.sigla || ''));
        var id = el('span', 'ppl-nav__id');
        id.appendChild(el('span', 'ppl-nav__name', cfg.marca.nome || ''));
        if (cfg.marca.tag) id.appendChild(el('span', 'ppl-nav__tag', cfg.marca.tag));
        marca.appendChild(id);
        raiz.appendChild(marca);
      }

      var menu = el('nav', 'ppl-nav__menu');
      /* O rótulo é o sinal de "shell renderizado" para o teste de ponta a ponta
         e o de "onde estou" para o leitor de tela. Não é decorativo. */
      menu.setAttribute('aria-label', cfg.rotulo || 'Navegação principal');

      cfg.itens.forEach(function (entrada, i) {
        if (!entrada.grupo) { menu.appendChild(item(entrada, cfg.rotaAtiva)); return; }

        var bloco = el('div', 'ppl-nav__block');
        var idLista = 'ppl-nav-g' + i;

        var botao = el('button', 'ppl-nav__group');
        botao.type = 'button';
        botao.setAttribute('aria-controls', idLista);
        botao.append(entrada.grupo);
        botao.appendChild(comSvg('ppl-chevron', 'chevron-down', 13));

        var lista = el('div', 'ppl-nav__list');
        lista.id = idLista;
        entrada.itens.forEach(function (it) { lista.appendChild(item(it, cfg.rotaAtiva)); });

        bloco.appendChild(botao);
        bloco.appendChild(lista);
        menu.appendChild(bloco);
      });
      raiz.appendChild(menu);
      raiz.appendChild(el('div', 'ppl-spacer'));

      if (cfg.usuario) {
        var u = cfg.usuario;
        var pe = el('div', 'ppl-nav__foot');
        pe.appendChild(el('span', 'ppl-avatar', u.iniciais || ''));
        var quem = el('span', 'ppl-nav__who');
        quem.appendChild(el('span', 'ppl-nav__mail', u.nome || ''));
        if (u.papel) quem.appendChild(el('span', 'ppl-nav__role', u.papel));
        pe.appendChild(quem);
        if (u.sair) {
          var sair = el('a', 'ppl-btn ppl-btn--icon ppl-nav__exit');
          sair.href = u.sair;
          sair.setAttribute('aria-label', 'Sair');
          sair.appendChild(comSvg(null, 'log-out', 15));
          pe.appendChild(sair);
        }
        raiz.appendChild(pe);
      }
    }

    function montarTabbar(raiz, cfg) {
      raiz.textContent = '';
      raiz.classList.add('ppl-tabbar');
      raiz.setAttribute('aria-label', cfg.rotulo || 'Navegação principal');
      cfg.itens.forEach(function (it) {
        /* O alvo de toque é o link inteiro, nunca a pílula de 36px. */
        var a = el('a', 'ppl-tabbar__item');
        a.href = it.href;
        if (it.icone) a.appendChild(comSvg('ppl-tabbar__pill', it.icone, 20));
        a.append(it.label);
        if (cfg.rotaAtiva && it.href === cfg.rotaAtiva) a.setAttribute('aria-current', 'page');
        raiz.appendChild(a);
      });
    }

    function montar(alvo, cfg) {
      var raiz = typeof alvo === 'string' ? $(alvo) : alvo;
      if (!raiz || !cfg) return null;
      var erro = conferir(raiz, cfg);
      if (erro) return defeito(raiz, erro);

      if (cfg.variante === 'tabbar') montarTabbar(raiz, cfg);
      else montarLateral(raiz, cfg);

      planos(cfg).forEach(function (it) {
        if (derivadas.some(function (a) { return a.href === it.href; })) return;
        derivadas.push({ href: it.href, label: it.label });
      });
      return raiz;
    }

    function api(cfg) { return montar(cfg && cfg.alvo, cfg); }

    /** As ações que a navegação compôs — a busca global consome isto. */
    api.acoes = function () { return derivadas.slice(); };

    api._hidratar = function () {
      $$('[data-ppl-nav]').forEach(function (raiz) {
        var fonte = $('script[type="application/json"]', raiz);
        if (!fonte) return;
        var cfg;
        try { cfg = JSON.parse(fonte.textContent); }
        catch (e) { defeito(raiz, 'O JSON da navegação não pôde ser lido: ' + e.message); return; }
        montar(raiz, cfg);
      });
    };

    /* A guarda é a do `umaVez` no topo do arquivo — sem ela o clique alternava
     * duas vezes e o grupo não se movia, com o chevron desenhado girando nada.
     * Menu montado por `nav()` é reconstruído do zero e chega sem marca, então
     * grupo novo ganha estado e listener normalmente. */
    api._ligar = function () {
      $$('.ppl-nav__group').forEach(function (btn) {
        if (!umaVez(btn, 'pplLigadoGrupo')) return;

        var corpo = document.getElementById(btn.getAttribute('aria-controls'));
        var temAtivo = corpo && $('[aria-current="page"]', corpo);
        btn.setAttribute('aria-expanded', temAtivo ? 'true' : 'false');
        if (corpo) corpo.hidden = !temAtivo;
        btn.addEventListener('click', function () {
          var aberto = btn.getAttribute('aria-expanded') === 'true';
          btn.setAttribute('aria-expanded', String(!aberto));
          if (corpo) corpo.hidden = aberto;
        });
      });
    };

    return api;
  })();

  /* ==========================================================================
   * 7 · WIZARD
   * --------------------------------------------------------------------------
   * Avançar SEMPRE valida a etapa corrente. Voltar é direito do operador;
   * saltar para frente burlaria a validação e é bloqueado.
   *
   * FALHA FECHADO: fluxo de efeito jurídico ou financeiro SEM etapa de revisão
   * não renderiza — mostra o defeito. Um fluxo de rescisão que "esqueceu" a
   * revisão não é um fluxo com uma tela a menos: é um fluxo que assina sem
   * conferir.
   * ======================================================================== */
  function Wizard(cfg) {
    this.cfg = cfg;
    this.indice = 0;
    var temRevisao = cfg.passos.some(function (p) { return p.id === 'revisao'; });
    var exige = cfg.efeito === 'juridico' || cfg.efeito === 'financeiro';
    this.defeito = (exige && !temRevisao)
      ? 'Fluxo de efeito ' + cfg.efeito + ' precisa terminar em uma etapa "revisao".'
      : null;
    this.render();
  }

  Wizard.prototype.render = function () {
    var self = this, cfg = this.cfg, raiz = cfg.raiz;

    if (this.defeito) {
      raiz.textContent = '';
      var alerta = document.createElement('div');
      alerta.className = 'ppl-alert ppl-alert--danger';
      alerta.setAttribute('role', 'alert');
      var linha = document.createElement('span');
      linha.innerHTML = '<strong>Fluxo mal montado — nada foi exibido.</strong>&nbsp;';
      linha.append(this.defeito);
      alerta.appendChild(linha);
      raiz.appendChild(alerta);
      return;
    }

    var passos = cfg.passos, atual = passos[this.indice], fim = this.indice === passos.length - 1;

    var ol = document.createElement('ol');
    ol.className = 'ppl-steps';
    ol.setAttribute('aria-label', 'Etapas');
    passos.forEach(function (p, i) {
      var feito = i < self.indice, alcancavel = i <= self.indice;
      var li = document.createElement('li');
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'ppl-steps__item' + (feito ? ' ppl-steps__item--done' : '');
      if (i === self.indice) b.setAttribute('aria-current', 'step');
      b.disabled = !alcancavel;
      var num = document.createElement('span');
      num.className = 'ppl-steps__num';
      /* Etapa concluída leva o ícone de check, não um caractere de dingbat:
         zero emoji vale também para o que "parece" um símbolo tipográfico. */
      if (feito) num.innerHTML = icons.svg('check', 13);
      else num.textContent = String(i + 1);
      var lab = document.createElement('span');
      lab.className = 'ppl-steps__label';
      lab.textContent = p.label;
      b.appendChild(num); b.appendChild(lab);
      b.addEventListener('click', function () {
        if (i > self.indice) return;          // sem salto para frente
        self.indice = i; self.render();
      });
      li.appendChild(b); ol.appendChild(li);
    });

    var corpo = document.createElement('div');
    corpo.className = 'ppl-wizard__panel';

    var erro = document.createElement('p');
    erro.className = 'ppl-field__error';
    erro.setAttribute('role', 'alert');
    erro.hidden = true;

    var barra = document.createElement('div');
    barra.className = 'ppl-wizard__nav';
    var voltar = document.createElement('button');
    voltar.type = 'button';
    voltar.className = 'ppl-btn ppl-btn--secondary ppl-btn--touch';
    voltar.textContent = 'Voltar';
    voltar.disabled = this.indice === 0;
    voltar.addEventListener('click', function () {
      if (self.indice > 0) { self.indice--; self.render(); }
    });
    var avancar = document.createElement('button');
    avancar.type = 'button';
    avancar.className = 'ppl-btn ppl-btn--primary ppl-btn--touch';
    avancar.textContent = fim ? (cfg.rotuloConfirmar || 'Confirmar e enviar') : 'Avançar';
    avancar.addEventListener('click', function () {
      var veredito = atual.validar ? atual.validar() : null;
      if (veredito) { erro.textContent = veredito; erro.hidden = false; return; }
      if (fim) { cfg.onConcluir(); return; }
      self.indice++; self.render();
    });
    barra.appendChild(voltar); barra.appendChild(avancar);

    var wrap = document.createElement('div');
    wrap.className = 'ppl-stack';
    wrap.appendChild(ol); wrap.appendChild(corpo); wrap.appendChild(erro); wrap.appendChild(barra);

    raiz.textContent = '';
    raiz.appendChild(wrap);
    if (cfg.aoRenderizar) cfg.aoRenderizar(atual, corpo);
  };

  /* ==========================================================================
   * 8 · TEMA — só a landing tem escuro
   * data-theme no <html>; preferência em localStorage. É dado de UI anônimo:
   * não é cookie e não depende de consentimento.
   * ======================================================================== */
  var tema = (function () {
    var CHAVE = 'ppl_theme';
    function ler() {
      try { var v = localStorage.getItem(CHAVE); return v === 'light' || v === 'dark' ? v : null; }
      catch (e) { return null; }
    }
    function aplicar(t) {
      document.documentElement.dataset.theme = t;
      try { localStorage.setItem(CHAVE, t); } catch (e) {}
    }
    function alternar() {
      var atual = document.documentElement.dataset.theme ||
        (global.matchMedia && global.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
      aplicar(atual === 'dark' ? 'light' : 'dark');
    }
    function ligar() {
      var salvo = ler();
      if (salvo) document.documentElement.dataset.theme = salvo;
      $$('[data-ppl-theme-toggle]').forEach(function (b) { b.addEventListener('click', alternar); });
    }
    return { alternar: alternar, aplicar: aplicar, _ligar: ligar };
  })();

  /* ==========================================================================
   * 9 · FORMATO pt-BR
   * --------------------------------------------------------------------------
   * Valor monetário é STRING decimal no domínio: formate só na exibição.
   * Converter para Number no caminho do dado perde precisão em folha.
   * ======================================================================== */
  var fmt = {
    cpf: function (v) {
      var d = String(v).replace(/\D/g, '').slice(0, 11);
      return d.replace(/^(\d{3})(\d{0,3})(\d{0,3})(\d{0,2}).*/, function (_, a, b, c, e) {
        return a + (b ? '.' + b : '') + (c ? '.' + c : '') + (e ? '-' + e : '');
      });
    },
    cnpj: function (v) {
      var d = String(v).replace(/\D/g, '').slice(0, 14);
      return d.replace(/^(\d{2})(\d{0,3})(\d{0,3})(\d{0,4})(\d{0,2}).*/, function (_, a, b, c, e, f) {
        return a + (b ? '.' + b : '') + (c ? '.' + c : '') + (e ? '/' + e : '') + (f ? '-' + f : '');
      });
    },
    dinheiro: function (v) {
      return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(v));
    },
    /** Número real com separador de milhar. Nunca "99+". */
    contagem: function (n) { return new Intl.NumberFormat('pt-BR').format(n); },
    /** Competência é data civil AAAA-MM — nunca Date, que arrasta fuso. */
    competencia: function (c) {
      var p = String(c).split('-');
      var meses = ['janeiro','fevereiro','março','abril','maio','junho','julho',
                   'agosto','setembro','outubro','novembro','dezembro'];
      return meses[Number(p[1]) - 1] + '/' + p[0];
    }
  };

  /* ==========================================================================
   * 10 · ENVIO SEM PERSISTÊNCIA — data-ppl-submit
   * --------------------------------------------------------------------------
   * O protótipo não guarda nada: os dados moram no HTML e o formulário apenas
   * anuncia o que teria acontecido. Sem esta receita, toda tela com formulário
   * precisaria de um <script> próprio — e aí o protótipo deixa de ser HTML e
   * vira código, que é exatamente o que este pacote existe para evitar.
   *
   *   <form data-ppl-submit="Rubrica 1042 criada na competência 2026-08.">
   *   <form data-ppl-submit="Não foi possível salvar." data-ppl-submit-tipo="error">
   *
   * Fecha o painel que contém o formulário, quando existe. Numa tela real o
   * drawer some junto com o salvamento; um painel que fica aberto depois do
   * "salvo" faz o operador salvar duas vezes.
   *
   * O limite, dito na cara: o toast é o ÚNICO registro do que aconteceu, e a
   * tela por baixo não muda. Numa tela de verdade isso seria defeito — a lista
   * tem que ganhar a linha. Aqui é a consequência aceita de não ter estado.
   * ======================================================================== */
  var envio = {
    _ligar: function () {
      $$('form[data-ppl-submit]').forEach(function (form) {
        if (!umaVez(form, 'pplLigadoEnvio')) return;
        form.addEventListener('submit', function (e) {
          e.preventDefault();
          var painel = form.closest('.ppl-drawer');
          if (painel) drawer.fechar(painel.id);
          toast.show(form.dataset.pplSubmitTipo || 'success', form.dataset.pplSubmit);
        });
      });
    }
  };

  /* ==========================================================================
   * 11 · PAINEL DE DADOS — a máquina de quatro estados
   * --------------------------------------------------------------------------
   * A receita mora no CSS; aqui ficam só as duas portas para trocar de estado.
   * Declarativa, para o protótipo demonstrar os quatro sem escrever JavaScript:
   *
   *   <button data-ppl-state-set="painel-folha:vazio">Vazio</button>
   *
   * E imperativa, para quando o protótipo simula uma carga:
   *
   *   PplCompass.painel('painel-folha', 'carregando');
   *
   * Os botões de um mesmo painel formam um grupo de alternância de fato, então
   * carregam `aria-pressed`. Sem isso o leitor de tela anuncia quatro botões
   * idênticos e nenhum jeito de saber em qual estado a lista está.
   * ======================================================================== */
  var painel = {
    trocar: function (alvo, estado) {
      var el = typeof alvo === 'string' ? document.getElementById(alvo) : alvo;
      if (!el) return null;
      el.dataset.pplState = estado;
      painel._marcar(el.id, estado);
      return el;
    },

    _marcar: function (id, estado) {
      if (!id) return;
      $$('[data-ppl-state-set^="' + id + ':"]').forEach(function (b) {
        b.setAttribute('aria-pressed', String(b.dataset.pplStateSet.split(':')[1] === estado));
      });
    },

    _ligar: function () {
      $$('[data-ppl-state-set]').forEach(function (b) {
        if (!umaVez(b, 'pplLigadoEstado')) return;
        var partes = b.dataset.pplStateSet.split(':');
        b.addEventListener('click', function () { painel.trocar(partes[0], partes[1]); });
      });
      /* Marca o estado inicial a partir do que o HTML já diz. */
      $$('.ppl-data-panel[data-ppl-state]').forEach(function (p) {
        painel._marcar(p.id, p.dataset.pplState);
      });
    }
  };

  /* ==========================================================================
   * 12 · CONFIRMAÇÃO POR RISCO — R2 e R3
   * --------------------------------------------------------------------------
   * O nível de risco é atributo do PROCESSO, não decisão de tela. Por isso ele
   * é a primeira coisa que se declara, e é ele que escolhe o diálogo:
   *
   *   R2  difícil de reverter        reabrir competência, excluir dependente
   *       consequência no título · alvo visível · botão destrutivo em `danger`
   *       · FOCO INICIAL NO "CANCELAR"
   *
   *   R3  alto risco jurídico ou financeiro    concluir rescisão, fechamento
   *       tudo do R2 + digitar o texto EXATO · comparação sem acento e sem
   *       caixa · clique-fora não fecha · evento de auditoria
   *
   * FALHA FECHADO — e o caso mais importante é o que RECUSA um modal:
   * R0 e R1 não abrem diálogo nenhum. R0 é toast de sucesso, R1 é toast com
   * "Desfazer". Fadiga de confirmação é risco mapeado: modal em ação reversível
   * treina o operador a clicar sem ler, e aí o modal do R3 também não é lido.
   * Pedir confirmação demais custa a confirmação que importa.
   *
   * Sobre `Esc`: ele CANCELA nos dois níveis, e isso não contradiz o DS-22. O
   * que o requisito proíbe é `Esc` VALER como confirmação. Fechar um diálogo
   * pelo teclado é requisito de acessibilidade — prender a pessoa lá dentro
   * seria trocar um risco por outro.
   * ======================================================================== */
  var confirmacao = (function () {
    var NIVEIS = {
      R2: { digita: false, scrimCancela: true,  audita: false },
      R3: { digita: true,  scrimCancela: false, audita: true }
    };

    /** Sem acento, sem caixa, sem espaço sobrando. "JOSÉ  SILVA" casa com "jose silva". */
    function normalizar(t) {
      return String(t == null ? '' : t)
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .trim().replace(/\s+/g, ' ').toLowerCase();
    }

    function el(tag, cls, texto) {
      var n = document.createElement(tag);
      if (cls) n.className = cls;
      if (texto != null) n.textContent = texto;
      return n;
    }

    function conferir(cfg) {
      if (modal.aberto())
        return 'Já existe um painel ou diálogo aberto. Um modal por vez: o segundo nasceria inerte, desenhado na tela e invisível para o teclado.';

      var r = cfg.risco;
      if (r === 'R0' || r === 'R1')
        return r + ' não abre diálogo. R0 é toast de sucesso e R1 é toast com "Desfazer" — confirmar ação reversível treina o operador a clicar sem ler, e é a confirmação do R3 que paga essa conta.';
      if (r === 'R4')
        return 'R4 exige step-up de autenticação além do R3, e um protótipo não tem como fazer isso de verdade. Trate como R3 e registre o step-up como requisito.';
      if (!NIVEIS[r])
        return 'Risco "' + (r == null ? '' : r) + '" desconhecido. Os níveis que abrem diálogo são R2 e R3.';

      if (!cfg.titulo)
        return 'Falta o "titulo", e ele precisa dizer a CONSEQUÊNCIA, não a ação: "Reabrir a competência 2026-08?" e não "Tem certeza?".';
      if (!cfg.alvo)
        return 'Falta o "alvo". O alvo da ação fica visível no diálogo, sempre — sem ele o operador confirma o diálogo, não a operação.';

      if (NIVEIS[r].digita) {
        if (!cfg.frase)
          return 'R3 sem "frase" é um R2 fantasiado. O que separa os dois níveis é digitar o texto exato.';
        if (!cfg.processo)
          return 'R3 sem "processo" não tem o "o quê" do evento de auditoria — que é quem, quando e o quê.';
      }
      return null;
    }

    function fechar() {
      var atual = modal.aberto();
      if (!atual) return;
      modal.fechar(atual);
      atual.remove();
    }

    /** O defeito ocupa o lugar do diálogo: quem clicou tem que ver que não funcionou. */
    function defeito(mensagem) {
      var scrim = el('div', 'ppl-scrim');
      var caixa = el('div', 'ppl-dialog');
      caixa.setAttribute('role', 'alertdialog');
      caixa.setAttribute('aria-modal', 'true');
      caixa.setAttribute('aria-label', 'Confirmação mal montada');

      var alerta = el('div', 'ppl-alert ppl-alert--danger');
      var linha = el('span');
      linha.appendChild(el('strong', null, 'Confirmação mal montada — nada foi perguntado.'));
      linha.append(' ' + mensagem);
      alerta.appendChild(linha);

      var pe = el('div', 'ppl-dialog__foot');
      var ok = el('button', 'ppl-btn ppl-btn--secondary', 'Fechar');
      ok.type = 'button';
      /* Fecha a si mesmo, e não via fechar(): este diálogo não se registra em
         `modal`, então a rotina de fechar modal registrado não o enxerga. */
      ok.addEventListener('click', function () { scrim.remove(); });
      pe.appendChild(ok);

      caixa.appendChild(alerta);
      caixa.appendChild(pe);
      scrim.appendChild(caixa);
      document.body.appendChild(scrim);

      /* Sem modal.abrir(): o defeito não disputa a trava com um modal que já
         esteja aberto — ele pode justamente ser o aviso de que existe um. */
      ok.focus();
      scrim.addEventListener('click', function (e) { if (e.target === scrim) scrim.remove(); });
      scrim.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') { e.stopPropagation(); scrim.remove(); }
      });
      return null;
    }

    function montarAlvo(alvo) {
      var caixa = el('div', 'ppl-dialog__alvo');
      if (typeof alvo === 'string') { caixa.textContent = alvo; return caixa; }
      var dl = el('dl', 'ppl-review');
      alvo.forEach(function (par) {
        var linha = el('div', 'ppl-review__row');
        linha.appendChild(el('dt', 'ppl-review__key', par.chave));
        linha.appendChild(el('dd', 'ppl-review__val' + (par.data ? ' ppl-review__val--data' : ''), par.valor));
        dl.appendChild(linha);
      });
      caixa.appendChild(dl);
      return caixa;
    }

    function confirmar(cfg) {
      cfg = cfg || {};
      var problema = conferir(cfg);
      if (problema) return defeito(problema);


      var nivel = NIVEIS[cfg.risco];
      var idTitulo = 'ppl-confirm-t';

      var scrim = el('div', 'ppl-scrim');
      var caixa = el('div', 'ppl-dialog');
      /* alertdialog e não dialog: a mensagem é a razão de o diálogo existir, e
         o leitor de tela precisa anunciá-la junto com o título. */
      caixa.setAttribute('role', 'alertdialog');
      caixa.setAttribute('aria-modal', 'true');
      caixa.setAttribute('aria-labelledby', idTitulo);

      var cabeca = el('div', 'ppl-dialog__head');
      var titulo = el('h2', 'ppl-dialog__title', cfg.titulo);
      titulo.id = idTitulo;
      cabeca.appendChild(titulo);

      var corpo = el('div', 'ppl-dialog__body');
      if (cfg.corpo) corpo.appendChild(el('p', 'ppl-muted', cfg.corpo));

      var alvo = montarAlvo(cfg.alvo);
      if (nivel.digita) alvo.classList.add('ppl-dialog__alvo--risco');
      corpo.appendChild(alvo);

      var campo = null, acao = null;

      if (nivel.digita) {
        var bloco = el('div', 'ppl-dialog__typed');
        var rotulo = el('label', 'ppl-field__label');
        rotulo.htmlFor = 'ppl-confirm-frase';
        rotulo.append(cfg.rotuloFrase || 'Para confirmar, digite ');
        rotulo.appendChild(el('span', 'ppl-dialog__phrase', cfg.frase));
        campo = el('input', 'ppl-input');
        campo.id = 'ppl-confirm-frase';
        campo.type = 'text';
        campo.autocomplete = 'off';
        campo.setAttribute('aria-describedby', 'ppl-confirm-hint');
        var dica = el('p', 'ppl-field__hint', 'Sem diferença entre maiúsculas e minúsculas, nem entre letras com e sem acento.');
        dica.id = 'ppl-confirm-hint';
        bloco.appendChild(rotulo);
        bloco.appendChild(campo);
        bloco.appendChild(dica);
        corpo.appendChild(bloco);

        var aviso = el('div', 'ppl-alert ppl-alert--warning');
        aviso.innerHTML = icons.svg('shield', 16);
        aviso.append(' Esta ação fica registrada com quem, quando e o quê.');
        corpo.appendChild(aviso);
      }

      var pe = el('div', 'ppl-dialog__foot');
      /* "Cancelar" vem PRIMEIRO no DOM e é quem recebe o foco no R2: a tecla
         mais fácil de apertar sem querer tem que ser a que não faz nada. */
      var cancelar = el('button', 'ppl-btn ppl-btn--secondary ppl-btn--touch', cfg.rotuloCancelar || 'Cancelar');
      cancelar.type = 'button';
      acao = el('button', 'ppl-btn ppl-btn--danger ppl-btn--touch', cfg.acao || 'Confirmar');
      acao.type = 'button';
      if (nivel.digita) acao.disabled = true;
      pe.appendChild(cancelar);
      pe.appendChild(acao);

      caixa.appendChild(cabeca);
      caixa.appendChild(corpo);
      caixa.appendChild(pe);
      scrim.appendChild(caixa);
      document.body.appendChild(scrim);

      function cancelou() {
        fechar();
        if (cfg.onCancelar) cfg.onCancelar();
      }

      function confirmou() {
        /* Confere de novo na hora de agir. A trava do botão é conveniência de
           interface; a regra é esta. */
        if (nivel.digita && normalizar(campo.value) !== normalizar(cfg.frase)) return;
        if (nivel.audita) {
          document.dispatchEvent(new CustomEvent('ppl:auditoria', {
            detail: {
              processo: cfg.processo,
              risco: cfg.risco,
              alvo: cfg.alvo,
              quando: new Date().toISOString()
            }
          }));
        }
        fechar();
        if (cfg.onConfirmar) cfg.onConfirmar();
      }

      cancelar.addEventListener('click', cancelou);
      acao.addEventListener('click', confirmou);

      if (campo) {
        campo.addEventListener('input', function () {
          acao.disabled = normalizar(campo.value) !== normalizar(cfg.frase);
        });
        campo.addEventListener('keydown', function (e) {
          if (e.key === 'Enter' && !acao.disabled) { e.preventDefault(); confirmou(); }
        });
      }

      scrim.addEventListener('click', function (e) {
        if (e.target !== scrim) return;
        /* No R3 o clique fora não faz nada: perder a frase digitada por um
           clique torto custa refazer o caminho todo, e a alternativa — fechar
           confirmando — está fora de questão. Devolve o foco ao campo, senão o
           clique deixa o teclado sem lugar nenhum dentro do diálogo. */
        if (nivel.scrimCancela) cancelou();
        else if (campo) campo.focus();
      });

      scrim.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') { e.stopPropagation(); cancelou(); }
      });

      modal.abrir(scrim, cfg.origem);
      if (campo) campo.focus(); else cancelar.focus();
      return scrim;
    }

    function ligar() {
      $$('[data-ppl-confirm]').forEach(function (b) {
        /* O gatilho de ação destrutiva é onde a duplicação doía mais: cada
           `init()` somava um listener, e um clique em "reabrir competência"
           abria um diálogo POR listener — quatro empilhados numa página que
           chamara `init()` três vezes, com scrims sobrando no DOM depois de
           fechar. Confirmação é o controle de maior consequência do pacote. */
        if (!umaVez(b, 'pplLigadoConfirm')) return;
        b.addEventListener('click', function (e) {
          e.preventDefault();
          var d = b.dataset;
          confirmar({
            risco: d.pplConfirm,
            titulo: d.pplConfirmTitulo,
            corpo: d.pplConfirmCorpo,
            alvo: d.pplConfirmAlvo,
            frase: d.pplConfirmFrase,
            processo: d.pplConfirmProcesso,
            acao: d.pplConfirmAcao,
            origem: b,
            onConfirmar: function () {
              if (d.pplConfirmFeito) toast.success(d.pplConfirmFeito);
            }
          });
        });
      });
    }

    return { abrir: confirmar, fechar: fechar, _ligar: ligar };
  })();

  /* ==========================================================================
   * ÍCONES — preenchido por ppl-compass-icons.js quando ele estiver na página.
   * Sem ele, `svg()` devolve string vazia e nada quebra.
   * ======================================================================== */
  var icons = global.PplCompassIcons || { desenhos: {}, svg: function () { return ''; } };

  function hidratarIcones() {
    $$('[data-ppl-icon]').forEach(function (el) {
      var nome = el.dataset.pplIcon;
      var tam = Number(el.dataset.pplSize || 18);
      var svg = icons.svg(nome, tam);
      if (svg) el.outerHTML = svg;
    });
  }

  /* ========================================================================== */
  function init(config) {
    icons = global.PplCompassIcons || icons;
    hidratarIcones();
    /* A navegação é desenhada ANTES de qualquer coisa se ligar a ela:
       _ligar() dos grupos precisa dos botões que nav() acabou de criar. */
    nav._hidratar();
    drawer._ligar();
    disclosure._ligar();
    combo._ligar();
    envio._ligar();
    painel._ligar();
    confirmacao._ligar();
    nav._ligar();
    tema._ligar();
    busca._ligar(config || {});
  }

  global.PplCompass = {
    init: init,
    drawer: drawer,
    toast: toast,
    busca: busca,
    disclosure: disclosure,
    combo: combo,
    nav: nav,
    painel: painel.trocar,
    confirmar: confirmacao.abrir,
    tema: tema,
    fmt: fmt,
    icon: function (nome, tam) { return icons.svg(nome, tam); },
    Wizard: Wizard
  };
})(window);
