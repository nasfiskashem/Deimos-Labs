/* Deimos Labs reconstitution calculator. Arithmetic only, on values the researcher enters.
   window.DL_PEPTIDES (name, mw, sizes) is prepended by build.py. */
(function () {
  var PEP = window.DL_PEPTIDES || {};
  function $(id) { return document.getElementById(id); }
  function num(id) { var v = parseFloat($(id).value); return isFinite(v) && v > 0 ? v : NaN; }
  function fmt(n, sig) {
    if (!isFinite(n)) return '—';
    if (n === 0) return '0';
    var v = Number(n.toPrecision(sig || 4));
    return v.toLocaleString('en-GB', { maximumFractionDigits: 8 });
  }
  function vol(ul) { return ul >= 1000 ? fmt(ul / 1000) + ' mL' : fmt(ul) + ' µL'; }
  var U_UL = 10;                      // 1 mL graduated in 100 divisions, so 1 division = 10 µL
  function units(ul) { return ul / U_UL; }
  function uStr(u) { var s = fmt(u); return s + (s === '1' ? ' division' : ' divisions'); }
  var MASS = { mg: 1, ug: 0.001 }, VOL = { mL: 1, uL: 0.001 };
  var SYR_ON = !!$('r-units');        // the U-100 syringe reading is rendered only when build.py has SYRINGE_UNITS on
  var acked = true;  // results show as soon as values are entered; the notice above the form carries the research-only statement
  function gate() { update(); updateBlend(); }

  // ---------- tabs ----------
  var tabs = [].slice.call(document.querySelectorAll('[role=tab]'));
  function showTab(id) {
    tabs.forEach(function (t) { var on = t.getAttribute('aria-controls') === id; t.setAttribute('aria-selected', on ? 'true' : 'false'); t.tabIndex = on ? 0 : -1; $(t.getAttribute('aria-controls')).hidden = !on; });
    try { history.replaceState(null, '', id === 'panel-blend' ? '?mode=blend' : location.pathname); } catch (e) {}
  }
  tabs.forEach(function (t, i) {
    t.addEventListener('click', function () { showTab(t.getAttribute('aria-controls')); });
    t.addEventListener('keydown', function (e) {
      var j = e.key === 'ArrowRight' ? i + 1 : e.key === 'ArrowLeft' ? i - 1 : -1;
      if (j < 0 || j >= tabs.length) return; tabs[j].focus(); showTab(tabs[j].getAttribute('aria-controls')); e.preventDefault();
    });
  });

  // ---------- single peptide ----------
  var sel = $('c-pep');
  if (sel) {
    Object.keys(PEP).forEach(function (k) { var o = document.createElement('option'); o.value = k; o.textContent = PEP[k].name; sel.appendChild(o); });
    sel.addEventListener('change', function () {
      var p = PEP[sel.value]; if (!p) { $('c-mw').value = ''; update(); return; }
      $('c-mw').value = p.mw;
      if (!num('c-mass')) { $('c-mass').value = p.sizes[0]; $('c-mass-u').value = 'mg'; }
      update();
    });
  }
  function solveMode() { return document.querySelector('[name=c-solve]:checked').value; }
  function setSolve(v) { var r = document.querySelector('[name=c-solve][value=' + v + ']'); if (r) r.checked = true; }
  function update() {
    if (!$('c-mass')) return;
    var mode = solveMode();
    $('c-row-amount').hidden = mode !== 'volume'; $('c-row-volume').hidden = mode !== 'amount';
    var m = num('c-mass') * MASS[$('c-mass-u').value], v = num('c-vol') * VOL[$('c-vol-u').value], mw = num('c-mw');
    var C = m / v;                      // mg/mL == µg/µL
    var out = { C: C, mM: C / mw * 1000, m: m, v: v, mw: mw, mode: mode };
    if (mode === 'volume') {
      var au = $('c-amt-u').value, a = num('c-amt');
      out.a_mg = au === 'nmol' ? a * mw / 1e6 : au === 'mg' ? a : a / 1000;   // amount per sample in mg
      out.V_ul = out.a_mg / C * 1000;
      out.a_nmol = out.a_mg / mw * 1e6;
    } else {
      var su = $('c-svol-u') ? $('c-svol-u').value : 'uL', sv = num('c-svol');
      out.inUnits = su === 'units';
      out.V_ul = out.inUnits ? sv * U_UL : sv;
      $('c-svol').placeholder = out.inUnits ? 'e.g. 10' : 'e.g. 100';
      out.a_mg = C * out.V_ul / 1000;
      out.a_nmol = out.a_mg / mw * 1e6;
    }
    out.n = Math.floor(v * 1000 / out.V_ul + 1e-9);
    out.over = isFinite(out.a_mg) && out.a_mg > m + 1e-12;
    render(out);
    try {
      var q = new URLSearchParams();
      if (sel.value) q.set('p', sel.value);
      ['c-mass', 'c-mass-u', 'c-vol', 'c-vol-u', 'c-mw', 'c-amt', 'c-amt-u', 'c-svol', 'c-svol-u', 'c-syr'].forEach(function (id) { if ($(id) && $(id).value !== '') q.set(id.slice(2), $(id).value); });
      q.set('solve', mode);
      history.replaceState(null, '', '?' + q.toString());
    } catch (e) {}
  }
  var last = null;
  function render(o) {
    last = o;
    var L = !acked, ok = isFinite(o.C);
    var dash = function (s) { return L || !ok ? '—' : s; };
    $('r-conc').textContent = dash(fmt(o.C) + ' mg/mL');
    $('r-conc-sub').textContent = dash(fmt(o.C) + ' µg/µL · ' + fmt(o.C * 1000) + ' µg/mL' + (isFinite(o.mM) ? ' · ' + fmt(o.mM) + ' mM (' + fmt(o.mM * 1000) + ' µM)' : ''));
    var okS = ok && isFinite(o.V_ul) && o.V_ul > 0;
    var dashS = function (s) { return L || !okS ? '—' : s; };
    var inl = $('c-inline');
    if (o.mode === 'volume') {
      $('r-sample-label').textContent = 'Volume of solution per sample';
      $('r-sample').textContent = dashS(vol(o.V_ul));
      $('r-sample-sub').textContent = dashS('holds ' + fmt(o.a_mg * 1000) + ' µg' + (isFinite(o.a_nmol) ? ' (' + fmt(o.a_nmol) + ' nmol)' : '') + (o.V_ul >= 1000 ? ' · ' + fmt(o.V_ul) + ' µL' : ' · ' + fmt(o.V_ul / 1000) + ' mL') + ' · ' + (o.n >= 1 ? o.n.toLocaleString('en-GB') + (o.n === 1 ? ' sample' : ' samples') + ' from the vial' : 'more than the vial holds'));
      $('r-how').textContent = okS ? fmt(o.a_mg * 1000) + ' µg ÷ ' + fmt(o.C) + ' µg/µL = ' + fmt(o.V_ul) + ' µL' : '';
      if (inl) inl.textContent = okS ? 'Measure out ' + vol(o.V_ul) + ' of solution for ' + fmt(o.a_mg * 1000) + ' µg' + (SYR_ON ? ' · ' + uStr(units(o.V_ul)) + ' on a 1 mL graduated syringe' : '') : ok ? 'Enter the amount you want in a sample.' : 'Enter the vial contents and diluent volume first.';
    } else {
      $('r-sample-label').textContent = 'Amount of peptide in that volume';
      $('r-sample').textContent = dashS(fmt(o.a_mg * 1000) + ' µg');
      $('r-sample-sub').textContent = dashS(fmt(o.a_mg) + ' mg' + (isFinite(o.a_nmol) ? ' · ' + fmt(o.a_nmol) + ' nmol' : '') + ' in ' + fmt(o.V_ul) + ' µL · ' + (o.n >= 1 ? o.n.toLocaleString('en-GB') + (o.n === 1 ? ' sample' : ' samples') + ' from the vial' : 'more than the vial holds'));
      $('r-how').textContent = okS ? (o.inUnits ? fmt(units(o.V_ul)) + ' divisions × 10 µL = ' : '') + fmt(o.V_ul) + ' µL × ' + fmt(o.C) + ' µg/µL = ' + fmt(o.a_mg * 1000) + ' µg' : '';
      if (inl) inl.textContent = okS ? (o.inUnits ? uStr(units(o.V_ul)) + ' (' + vol(o.V_ul) + ')' : fmt(o.V_ul) + ' µL') + ' of solution holds ' + fmt(o.a_mg * 1000) + ' µg' : ok ? 'Enter the volume of the sample.' : 'Enter the vial contents and diluent volume first.';
    }
    if (SYR_ON) {
      var u = units(o.V_ul);
      $('r-units').textContent = dashS(uStr(u));
      $('r-units-sub').textContent = okS && !L ? fmt(o.V_ul) + ' µL ÷ 10 µL per division · ' + fmt(o.V_ul / 1000) + ' mL' : '1 division = 10 µL (0.01 mL)';
      drawSyringe(okS && !L ? u : NaN);
    }
    $('r-per').textContent = dash('1 µL contains ' + fmt(o.C) + ' µg' + (isFinite(o.mM) ? ' (' + fmt(o.mM) + ' nmol)' : '') + ' · the vial holds ' + fmt(o.m) + ' mg in ' + vol(o.v * 1000));
    $('r-warn').hidden = L || !ok || !o.over;
    $('r-hint').hidden = L || ok;
    // figure: liquid level (3 mL vial drawn full) and sample gauge
    var lvl = ok ? Math.max(0.06, Math.min(1, o.v / 3)) : 0;
    var liq = $('f-liquid'); if (liq) { var H = 150, y = 216 - H * lvl; liq.setAttribute('y', y); liq.setAttribute('height', 216 - y); liq.style.opacity = ok && !L ? 1 : 0; }
    $('f-vial-text').textContent = ok && !L ? fmt(o.m) + ' mg' : '—';
    $('f-vol').textContent = ok && !L ? vol(o.v * 1000) : '';
    $('f-conc').textContent = ok && !L ? fmt(o.C) + ' mg/mL' : '';
    var g = $('gauge'); if (g) {
      var frac = okS && !L ? Math.min(1, o.V_ul / (o.v * 1000)) : 0;
      $('gauge-fill').style.width = (frac * 100).toFixed(2) + '%';
      $('gauge-text').textContent = okS && !L ? 'One sample = ' + fmt(o.V_ul) + ' µL of ' + vol(o.v * 1000) + (frac < 1 ? ' (' + fmt(frac * 100, 3) + '%)' : '') : 'Sample volume will appear here';
    }
  }
  // ---------- syringe scale: 1 mL in 100 divisions; barrel scale runs from x=54 over 292 user units ----------
  var SYR = { 100: { minor: 2, mid: 10, major: 10 }, 50: { minor: 1, mid: 5, major: 5 }, 30: { minor: 0.5, mid: 1, major: 5 } };
  var SX0 = 54, SL = 292, drawnCap = 0;
  function drawScale(cap) {
    var s = SYR[cap], n = Math.round(cap / s.minor), out = '';
    for (var i = 0; i <= n; i++) {
      var u = i * s.minor, x = (SX0 + u / cap * SL).toFixed(1);
      var major = Math.abs(u / s.major - Math.round(u / s.major)) < 1e-9, mid = Math.abs(u / s.mid - Math.round(u / s.mid)) < 1e-9;
      out += '<line class="s-tick' + (major ? ' major' : '') + '" x1="' + x + '" y1="63" x2="' + x + '" y2="' + (63 - (major ? 11 : mid ? 7 : 4)) + '"/>';
      if (major) out += '<text class="s-lbl" x="' + x + '" y="78" text-anchor="middle">' + u + '</text>';
    }
    $('s-ticks').innerHTML = out;
  }
  function drawSyringe(u) {
    var pick = $('c-syr'); if (!pick) return;
    var cap = +pick.value || 100; if (cap !== drawnCap) { drawScale(cap); drawnCap = cap; }
    var okU = isFinite(u) && u > 0, over = okU && u > cap + 1e-9, frac = okU ? Math.min(1, u / cap) : 0, x = SX0 + frac * SL;
    var fill = $('s-fill'), seal = $('s-seal'), rod = $('s-rod');
    fill.setAttribute('width', (frac * SL).toFixed(2)); fill.style.width = (frac * SL).toFixed(2) + 'px';
    seal.setAttribute('x', x.toFixed(2)); seal.style.x = x.toFixed(2) + 'px';
    rod.setAttribute('x', (x + 4).toFixed(2)); rod.style.x = (x + 4).toFixed(2) + 'px';
    rod.setAttribute('width', Math.max(0, 366 - x).toFixed(2)); rod.style.width = Math.max(0, 366 - x).toFixed(2) + 'px';
    var t = $('s-read'); t.textContent = okU ? (over ? 'over ' + cap : fmt(u)) + ' div' : ''; t.setAttribute('x', Math.max(74, Math.min(326, x)).toFixed(1));
    $('syr-fig').classList.toggle('s-over', over);
    $('syr-text').textContent = okU ? (over ? uStr(u) + ' · more than the ' + cap + '-division scale' : uStr(u) + ' on the ' + cap + '-division scale · ' + fmt(frac * 100, 3) + '% of the barrel') : 'Volume shown as 0.01 mL divisions · 1 division = 10 µL';
  }
  function summary() {
    var o = last; if (!o || !acked || !isFinite(o.C)) return '';
    var p = PEP[sel.value];
    return ['Reconstitution summary (Deimos Labs calculator)',
      'Peptide: ' + (p ? p.name : 'not specified') + (isFinite(o.mw) ? ' · MW ' + fmt(o.mw, 6) + ' g/mol' : ''),
      'Vial contents: ' + fmt(o.m) + ' mg · Diluent: ' + vol(o.v * 1000),
      'Concentration: ' + fmt(o.C) + ' mg/mL (' + fmt(o.C) + ' µg/µL)' + (isFinite(o.mM) ? ' · ' + fmt(o.mM) + ' mM' : ''),
      isFinite(o.V_ul) && o.V_ul > 0 ? (o.mode === 'volume' ? 'Amount wanted per sample: ' + fmt(o.a_mg * 1000) + ' µg → ' + vol(o.V_ul) + ' of solution' : 'Volume per sample: ' + fmt(o.V_ul) + ' µL → holds ' + fmt(o.a_mg * 1000) + ' µg') + (o.n >= 1 ? ' · ' + o.n + ' samples per vial' : '') : '',
      SYR_ON && isFinite(o.V_ul) && o.V_ul > 0 ? 'Syringe reading: ' + uStr(units(o.V_ul)) + ' on a 1 mL syringe graduated in 100 divisions (1 division = 10 µL)' : '',
      '', 'Arithmetic only, on values entered by the researcher. Deimos Labs does not recommend any amount, concentration, solvent or protocol. For laboratory research use only. Not for human or veterinary use.',
      'https://www.deimos-labs.co.uk/calculator.html'].filter(function (l) { return l !== ''; }).join('\n');
  }
  function copyText(text, note, link) {
    if (!text) { note.textContent = 'Nothing to copy yet.'; note.hidden = false; return; }
    var done = function () { note.textContent = link ? 'Link copied.' : 'Summary copied.'; note.hidden = false; };
    var fail = function () { note.textContent = 'Could not copy automatically. ' + (link ? 'Copy the address bar instead.' : 'Select the results and copy them.'); note.hidden = false; };
    try { navigator.clipboard.writeText(text).then(done, fail); } catch (e) { fail(); }
  }
  if ($('c-mass')) {
    ['c-mass', 'c-mass-u', 'c-vol', 'c-vol-u', 'c-mw', 'c-amt', 'c-amt-u', 'c-svol', 'c-svol-u', 'c-syr'].forEach(function (id) { if ($(id)) { $(id).addEventListener('input', update); $(id).addEventListener('change', update); } });
    [].forEach.call(document.querySelectorAll('[name=c-solve]'), function (r) { r.addEventListener('change', update); });
    $('c-copy').addEventListener('click', function () { copyText(summary(), $('c-copy-note')); });
    $('c-link').addEventListener('click', function () { copyText(acked && isFinite(last.C) ? location.href : '', $('c-copy-note'), true); });
    $('c-reset').addEventListener('click', function () {
      sel.value = ''; ['c-mass', 'c-vol', 'c-mw', 'c-amt', 'c-svol'].forEach(function (id) { $(id).value = ''; });
      $('c-mass-u').value = 'mg'; $('c-vol-u').value = 'mL'; $('c-amt-u').value = 'ug'; if ($('c-svol-u')) $('c-svol-u').value = 'uL'; if ($('c-syr')) $('c-syr').value = '100'; setSolve('volume'); update(); $('c-mass').focus();
    });
    // prefill from the query string (product pages link here with ?p=slug&size=5mg)
    try {
      var q = new URLSearchParams(location.search);
      if (q.get('p') && PEP[q.get('p')]) { sel.value = q.get('p'); $('c-mw').value = PEP[q.get('p')].mw; }
      if (q.get('size')) { var sz = /^([\d.]+)\s*(mg|ug|µg)$/.exec(q.get('size')); if (sz) { $('c-mass').value = sz[1]; $('c-mass-u').value = sz[2] === 'mg' ? 'mg' : 'ug'; } }
      ['mass', 'mass-u', 'vol', 'vol-u', 'mw', 'amt', 'amt-u', 'svol', 'svol-u', 'syr'].forEach(function (k) { if (q.has(k) && $('c-' + k)) $('c-' + k).value = q.get(k); });
      if (q.get('solve')) setSolve(q.get('solve'));
      if (q.get('mode') === 'blend') showTab('panel-blend');
    } catch (e) {}
  }

  // ---------- blend ----------
  var rows = $('blend-rows'), comps = [];
  function addComp(name, mass) {
    if (comps.length >= 8) return;
    comps.push({ name: name || '', mass: mass || '' }); renderRows(); 
  }
  function renderRows() {
    if (!rows) return;
    rows.innerHTML = '';
    comps.forEach(function (c, i) {
      var li = document.createElement('li'); li.className = 'blend-row';
      li.innerHTML = '<label><span class="visually-hidden">Component ' + (i + 1) + ' name</span><input type="text" placeholder="Component ' + (i + 1) + '" data-k="name" autocomplete="off"></label>' +
        '<label class="unit"><span class="visually-hidden">Component ' + (i + 1) + ' mass in the vial</span><input type="number" inputmode="decimal" min="0" step="any" placeholder="Mass" data-k="mass"><span class="unit-tag">mg</span></label>' +
        '<button type="button" class="line-remove" aria-label="Remove component ' + (i + 1) + '">Remove</button>';
      li.querySelector('[data-k=name]').value = c.name; li.querySelector('[data-k=mass]').value = c.mass;
      li.querySelectorAll('input').forEach(function (inp) { inp.addEventListener('input', function () { c[inp.dataset.k] = inp.value; refSelect(); updateBlend(); }); });
      li.querySelector('button').addEventListener('click', function () { comps.splice(i, 1); renderRows(); });
      rows.appendChild(li);
    });
    $('b-add').disabled = comps.length >= 8;
    refSelect(); updateBlend();
  }
  function refSelect() {
    var s = $('b-ref'), cur = s.value; s.innerHTML = '<option value="">Choose a component</option>';
    comps.forEach(function (c, i) { var o = document.createElement('option'); o.value = i; o.textContent = c.name || 'Component ' + (i + 1); s.appendChild(o); });
    if (cur !== '' && cur < comps.length) s.value = cur;
  }
  function updateBlend() {
    if (!rows) return;
    var L = !acked;
    var v = num('b-vol') * VOL[$('b-vol-u').value];
    var masses = comps.map(function (c) { var m = parseFloat(c.mass); return isFinite(m) && m > 0 ? m : 0; });
    var total = masses.reduce(function (a, b) { return a + b; }, 0);
    var ok = total > 0 && isFinite(v);
    var ref = $('b-ref').value === '' ? -1 : +$('b-ref').value;
    var tu = $('b-target-u').value, t = num('b-target') * (tu === 'mg' ? 1 : 0.001);
    var okS = ok && ref >= 0 && masses[ref] > 0 && isFinite(t);
    var V_ul = okS ? t / (masses[ref] / v) * 1000 : NaN;
    var dash = function (c, s) { return L || !c ? '—' : s; };
    $('b-total').textContent = dash(total > 0, fmt(total) + ' mg');
    $('b-conc').textContent = dash(ok, fmt(total / v) + ' mg/mL');
    $('b-svol').textContent = dash(okS, vol(V_ul));
    if ($('b-units')) $('b-units').textContent = dash(okS, uStr(units(V_ul)));
    $('b-n').textContent = dash(okS, (Math.floor(v * 1000 / V_ul + 1e-9) || 0).toLocaleString('en-GB') + ' per vial');
    $('b-warn').hidden = L || !okS || t <= masses[ref] + 1e-12;
    var tb = $('blend-table').querySelector('tbody'); tb.innerHTML = '';
    if (L || !(total > 0)) { tb.innerHTML = '<tr><td colspan="5" class="muted">' + (L ? 'Confirm the research-use notice to show results.' : 'Add components and their masses.') + '</td></tr>'; return; }
    comps.forEach(function (c, i) {
      var tr = document.createElement('tr');
      var share = masses[i] / total;
      var cells = [c.name || 'Component ' + (i + 1), fmt(masses[i]) + ' mg', fmt(share * 100, 3) + '%', ok ? fmt(masses[i] / v) + ' mg/mL' : '—', okS ? fmt(masses[i] / v * V_ul) + ' µg' : '—'];
      cells.forEach(function (x, j) { var td = document.createElement('td'); td.textContent = x; if (j) td.className = 'mono'; tr.appendChild(td); });
      if (i === ref) tr.className = 'is-ref';
      tb.appendChild(tr);
    });
  }
  if (rows) {
    $('b-add').addEventListener('click', function () { addComp(); rows.lastChild.querySelector('input').focus(); });
    ['b-vol', 'b-vol-u', 'b-ref', 'b-target', 'b-target-u'].forEach(function (id) { $(id).addEventListener('input', updateBlend); $(id).addEventListener('change', updateBlend); });
    $('b-copy').addEventListener('click', function () {
      var ok = acked && $('b-conc').textContent !== '—';
      var lines = ok ? ['Blend summary (Deimos Labs calculator)', 'Total mass: ' + $('b-total').textContent + ' · Diluent: ' + $('b-vol').value + ' ' + $('b-vol-u').value.replace('uL', 'µL') + ' · Total concentration: ' + $('b-conc').textContent,
        'Sample volume: ' + $('b-svol').textContent + ($('b-units') ? ' · ' + $('b-units').textContent + ' on a 1 mL graduated syringe' : '') + ' · ' + $('b-n').textContent].concat([].map.call($('blend-table').querySelectorAll('tbody tr'), function (tr) { return [].map.call(tr.children, function (td) { return td.textContent; }).join(' · '); }),
        ['', 'Arithmetic only, on values entered by the researcher. Deimos Labs does not recommend any amount, concentration, solvent or protocol. For laboratory research use only. Not for human or veterinary use.']) : [];
      copyText(lines.join('\n'), $('b-copy-note'));
    });
    addComp(); addComp();
  }
  gate();
})();
