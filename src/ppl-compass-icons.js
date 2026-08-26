/*!
 * ppl-compass — ícones
 *
 * Desenhos originais na mesma gramática visual do design system: grade 24×24,
 * traço 1.75, pontas e junções arredondadas, sem preenchimento. Não há dado de
 * pacote de terceiro embutido aqui — nenhuma licença externa entra no bundle.
 *
 * Uso declarativo (hidratado pelo init):   <i data-ppl-icon="wallet" data-ppl-size="16"></i>
 * Uso imperativo:                          PplCompass.icon('wallet', 16)
 *
 * Zero emoji em qualquer superfície: ícone é ícone, e vem daqui.
 */
(function (global) {
  'use strict';

  /* `d` de cada <path>. Um ícone pode ter vários traços. */
  var P = {
    /* ── navegação e estrutura ─────────────────────────────────────────── */
    'home':        ['M3 21V9l9-6 9 6v12', 'M9 21v-7h6v7'],
    'building':    ['M3 21V5a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v16', 'M16 9h3a2 2 0 0 1 2 2v10', 'M7 7h4M7 11h4M7 15h4', 'M2 21h20'],
    'users':       ['M16 20v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2', 'M9 10a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7', 'M22 20v-2a4 4 0 0 0-3-3.9', 'M16 3.1a4 4 0 0 1 0 7.8'],
    'user':        ['M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2', 'M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8'],
    'grid':        ['M3 3h7v7H3z', 'M14 3h7v7h-7z', 'M3 14h7v7H3z', 'M14 14h7v7h-7z'],
    'layers':      ['m12 2 9 5-9 5-9-5 9-5', 'm3 12 9 5 9-5', 'm3 17 9 5 9-5'],
    'map-pin':     ['M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 1 1 16 0', 'M12 12a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5'],

    /* ── folha, dinheiro e dados ───────────────────────────────────────── */
    'wallet':      ['M2 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2z', 'M17 12h4', 'M16.5 12a1 1 0 1 0 2 0 1 1 0 0 0-2 0'],
    'banknote':    ['M2 6h20v12H2z', 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6', 'M6 12h.01M18 12h.01'],
    'coins':       ['M12 10a6 3 0 1 0 0-6 6 3 0 0 0 0 6', 'M6 7v5c0 1.7 2.7 3 6 3s6-1.3 6-3V7', 'M6 12v5c0 1.7 2.7 3 6 3s6-1.3 6-3v-5'],
    'trend-up':    ['m3 17 6-6 4 4 8-8', 'M17 7h4v4'],
    'trend-down':  ['m3 7 6 6 4-4 8 8', 'M17 17h4v-4'],
    'receipt':     ['M6 2h12v20l-3-2-3 2-3-2-3 2z', 'M9 7h6M9 11h6M9 15h3'],
    'calculator':  ['M5 2h14v20H5z', 'M9 6h6', 'M9 11h.01M12 11h.01M15 11h.01M9 15h.01M12 15h.01M15 15h.01M9 19h6'],
    'list':        ['M9 6h11M9 12h11M9 18h11', 'M4 6h.01M4 12h.01M4 18h.01'],
    'table':       ['M3 4h18v16H3z', 'M3 10h18M3 15h18', 'M9 4v16'],

    /* ── tempo e ponto ─────────────────────────────────────────────────── */
    'calendar':    ['M3 5h18v16H3z', 'M16 3v4M8 3v4M3 10h18'],
    'clock':       ['M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18', 'M12 7v5l3 2'],
    'fingerprint': ['M12 3a5 5 0 0 0-5 5v4a5 5 0 0 0 10 0V8a5 5 0 0 0-5-5', 'M12 8v5', 'M6 20h12'],
    'calendar-x':  ['M3 5h18v16H3z', 'M16 3v4M8 3v4M3 10h18', 'm10 15 4 4M14 15l-4 4'],
    'palm':        ['M12 21V9', 'M12 9c0-3 2.5-5 5.5-5 0 3-2.5 5-5.5 5', 'M12 9C12 6 9.5 4 6.5 4c0 3 2.5 5 5.5 5', 'M8 21h8'],

    /* ── estado e feedback ─────────────────────────────────────────────── */
    'check':        ['M20 6 9 17l-5-5'],
    'check-circle': ['M21.8 10A10 10 0 1 1 17 3.3', 'm9 11 3 3L22 4'],
    'x':            ['M18 6 6 18M6 6l12 12'],
    'x-circle':     ['M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18', 'm15 9-6 6M9 9l6 6'],
    'alert':        ['m21.7 18-8-14a2 2 0 0 0-3.4 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.7-3', 'M12 9v4M12 17h.01'],
    'alert-circle': ['M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18', 'M12 8v5M12 16h.01'],
    'info':         ['M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18', 'M12 16v-4M12 8h.01'],
    'clock-dashed': ['M12 21a9 9 0 1 0 0-18', 'M12 7v5l3 2'],
    'slash':        ['M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18', 'm5.6 5.6 12.8 12.8'],

    /* ── ação e chrome ─────────────────────────────────────────────────── */
    'search':      ['M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14', 'm20 20-3.5-3.5'],
    'menu':        ['M4 6h16M4 12h16M4 18h16'],
    'plus':        ['M12 5v14M5 12h14'],
    'chevron-down':['m6 9 6 6 6-6'],
    'chevron-updown':['m7 15 5 5 5-5', 'm7 9 5-5 5 5'],
    'log-out':     ['M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4', 'm16 17 5-5-5-5', 'M21 12H9'],
    'arrow-right': ['M5 12h14', 'm12 5 7 7-7 7'],
    'moon':        ['M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8'],
    'sun':         ['M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10', 'M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4'],
    'file':        ['M6 2h9l5 5v15H6z', 'M15 2v5h5'],
    'shield':      ['M12 3 4 6v6c0 5 3.4 8.4 8 9 4.6-.6 8-4 8-9V6z'],
    'send':        ['m21 3-9 18-2.5-7.5L2 11z', 'M21 3 9.5 13.5'],
    'star':        ['M12 2 15 9l7 .6-5.3 4.6L18.3 21 12 17.3 5.7 21l1.6-6.8L2 9.6 9 9z'],
    'edit':        ['M11 4H5a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h13a2 2 0 0 0 2-2v-6', 'M18.5 2.5a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4z'],
    'clipboard':   ['M9 3h6v3H9z', 'M15 4.5h2A2 2 0 0 1 19 6.5V20a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6.5a2 2 0 0 1 2-2h2', 'm9 14 2 2 4-4'],
    'lock':        ['M5 11h14v10H5z', 'M8 11V7a4 4 0 1 1 8 0v4']
  };

  /**
   * Devolve o markup SVG do ícone.
   * `aria-hidden` sempre: no design system o ícone acompanha texto, nunca o
   * substitui. Se algum dia um ícone for a única informação, quem chama põe
   * um rótulo acessível por fora.
   */
  function svg(nome, tamanho) {
    var traços = P[nome];
    if (!traços) return '';
    var t = tamanho || 18;
    return '<svg width="' + t + '" height="' + t + '" viewBox="0 0 24 24" fill="none" ' +
      'stroke="currentColor" stroke-width="1.75" stroke-linecap="round" ' +
      'stroke-linejoin="round" aria-hidden="true" focusable="false">' +
      traços.map(function (d) { return '<path d="' + d + '"/>'; }).join('') +
      '</svg>';
  }

  global.PplCompassIcons = {
    paths: P,
    svg: svg,
    /** Nomes disponíveis — útil para conferir se um ícone existe antes de usar. */
    nomes: function () { return Object.keys(P).sort(); }
  };
})(window);
