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
    var gatilho = null;
    var overflow = '';

    function inertizarIrmaos(el, ligado) {
      $$('body > *').forEach(function (n) {
        if (n === el) return;
        if (ligado) n.setAttribute('inert', ''); else n.removeAttribute('inert');
      });
    }

    function abrir(id, origem) {
      var el = document.getElementById(id);
      if (!el || el.dataset.open === 'true') return;
      gatilho = origem || document.activeElement;
      el.dataset.open = 'true';
      el.removeAttribute('aria-hidden');
      overflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      inertizarIrmaos(el, true);
      var painel = $('.ppl-drawer__panel', el);
      if (painel) { painel.setAttribute('tabindex', '-1'); painel.focus(); }
    }

    function fechar(id) {
      var el = id ? document.getElementById(id) : $('.ppl-drawer[data-open="true"]');
      if (!el) return;
      el.dataset.open = 'false';
      el.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = overflow;
      inertizarIrmaos(el, false);
      if (gatilho && gatilho.focus) gatilho.focus();
      gatilho = null;
    }

    function ligar() {
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
        tipo === 'success' ? 'check-circle' : tipo === 'error' ? 'x-circle' : 'info', 18
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

    function abrir() {
      if (!el) return;
      el.hidden = false;
      input.value = '';
      ativo = 0;
      render();
      input.focus();
    }
    function fechar() { if (el) el.hidden = true; }

    function ligar(config) {
      acoes = (config && config.acoes) || [];
      el = $('#ppl-search');
      if (!el) return;
      input = $('#ppl-search-input', el);
      lista = $('#ppl-search-list', el);

      input.addEventListener('input', function () { ativo = 0; render(); });
      el.addEventListener('mousedown', function (e) { if (e.target === el) fechar(); });

      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') { fechar(); return; }
        if (touch()) return;
        if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); abrir(); }
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

      $$('[data-ppl-search-open]').forEach(function (b) { b.addEventListener('click', abrir); });
    }

    return { abrir: abrir, fechar: fechar, _ligar: ligar };
  })();

  /* ==========================================================================
   * 4 · DISCLOSURE — <button> dentro de <h*>, aria-expanded, aria-controls
   * ======================================================================== */
  var disclosure = {
    _ligar: function () {
      $$('[data-ppl-disclosure] .ppl-disclosure__btn').forEach(function (btn) {
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
   * 6 · NAV — grupos recolhíveis
   * --------------------------------------------------------------------------
   * Grupos nascem RECOLHIDOS, exceto o que contém o item com
   * aria-current="page". Recolher é gesto momentâneo de foco, não
   * configuração: NÃO persiste.
   * ======================================================================== */
  var nav = {
    _ligar: function () {
      $$('.ppl-nav__group').forEach(function (btn) {
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
    }
  };

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
      alerta.innerHTML = '<strong>Fluxo mal montado — nada foi exibido.</strong>&nbsp;';
      alerta.append(this.defeito);
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
   * ÍCONES — preenchido por ppl-compass-icons.js quando ele estiver na página.
   * Sem ele, `svg()` devolve string vazia e nada quebra.
   * ======================================================================== */
  var icons = global.PplCompassIcons || { paths: {}, svg: function () { return ''; } };

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
    drawer._ligar();
    disclosure._ligar();
    combo._ligar();
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
    tema: tema,
    fmt: fmt,
    icon: function (nome, tam) { return icons.svg(nome, tam); },
    Wizard: Wizard
  };
})(window);
