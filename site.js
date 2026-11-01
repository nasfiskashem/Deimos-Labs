window.DL_EMAIL="info@deimos-labs.co.uk";
window.DL_PRODUCTS={"bpc-157-5mg": {"name": "BPC-157 5mg", "price": 34.0, "href": "product-bpc-157-5mg.html"}, "bpc-157-10mg": {"name": "BPC-157 10mg", "price": 54.0, "href": "product-bpc-157-10mg.html"}, "tb-500-5mg": {"name": "TB-500 5mg", "price": 34.0, "href": "product-tb-500-5mg.html"}, "tb-500-10mg": {"name": "TB-500 10mg", "price": 54.0, "href": "product-tb-500-10mg.html"}, "ghk-cu-50mg": {"name": "GHK-Cu 50mg", "price": 29.0, "href": "product-ghk-cu-50mg.html"}, "ghk-cu-100mg": {"name": "GHK-Cu 100mg", "price": 45.0, "href": "product-ghk-cu-100mg.html"}, "angiotensin-ii-5mg": {"name": "Angiotensin II 5mg", "price": 29.0, "href": "product-angiotensin-ii-5mg.html"}, "angiotensin-ii-25mg": {"name": "Angiotensin II 25mg", "price": 79.0, "href": "product-angiotensin-ii-25mg.html"}, "bradykinin-5mg": {"name": "Bradykinin 5mg", "price": 29.0, "href": "product-bradykinin-5mg.html"}, "bradykinin-25mg": {"name": "Bradykinin 25mg", "price": 79.0, "href": "product-bradykinin-25mg.html"}, "substance-p-1mg": {"name": "Substance P 1mg", "price": 24.0, "href": "product-substance-p-1mg.html"}, "substance-p-5mg": {"name": "Substance P 5mg", "price": 59.0, "href": "product-substance-p-5mg.html"}, "leu-enkephalin-5mg": {"name": "Leu-Enkephalin 5mg", "price": 22.0, "href": "product-leu-enkephalin-5mg.html"}, "leu-enkephalin-25mg": {"name": "Leu-Enkephalin 25mg", "price": 59.0, "href": "product-leu-enkephalin-25mg.html"}, "amyloid-beta-1-42-0-5mg": {"name": "Amyloid \u03b2 1-42 0.5mg", "price": 89.0, "href": "product-amyloid-beta-1-42-0-5mg.html"}, "amyloid-beta-1-42-1mg": {"name": "Amyloid \u03b2 1-42 1mg", "price": 149.0, "href": "product-amyloid-beta-1-42-1mg.html"}};
/* Deimos Labs basket and forms. window.DL_PRODUCTS and window.DL_EMAIL are prepended by build.py. */
(function () {
  var KEY = 'deimos-basket', memory = [], P = window.DL_PRODUCTS || {}, EMAIL = window.DL_EMAIL;
  function gbp(n) { return '£' + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
  function load() {
    try { var v = JSON.parse(localStorage.getItem(KEY) || '[]'); memory = Array.isArray(v) ? v.filter(function (i) { return P[i.id]; }) : []; } catch (e) {}
    return memory.slice();
  }
  function save(b) { memory = b; try { localStorage.setItem(KEY, JSON.stringify(b)); } catch (e) {} badge(); }
  function badge() {
    var n = load().reduce(function (s, i) { return s + i.qty; }, 0);
    [].forEach.call(document.querySelectorAll('[data-basket-count]'), function (el) { el.textContent = n; el.hidden = n === 0; });
  }
  var toastTimer;
  function toast(msg) {
    var t = document.getElementById('toast'); if (!t) return;
    t.innerHTML = msg; t.hidden = false; clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.hidden = true; }, 3200);
  }
  function add(id, qty) {
    var b = load(), f = b.filter(function (i) { return i.id === id; })[0];
    if (f) f.qty = Math.min(99, f.qty + qty); else b.push({ id: id, qty: qty });
    save(b);
    toast('<span>Added ' + qty + ' × ' + P[id].name + '</span><a href="basket.html">View basket</a>');
  }
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-add]');
    if (btn) {
      var q = document.getElementById('qty'), qty = btn.dataset.useQty && q ? Math.max(1, Math.min(99, parseInt(q.value, 10) || 1)) : 1;
      add(btn.dataset.add, qty);
      return;
    }
    var c = e.target.closest('[data-copy]');
    if (c) {
      var pre = document.getElementById(c.dataset.copy), note = c.closest('.result').querySelector('[data-copy-note]');
      var select = function () {
        var r = document.createRange(); r.selectNodeContents(pre); var s = getSelection(); s.removeAllRanges(); s.addRange(r);
        note.textContent = 'Text selected. Press Ctrl+C or ⌘C to copy.'; note.hidden = false;
      };
      try { navigator.clipboard.writeText(pre.textContent).then(function () { note.textContent = 'Copied to clipboard.'; note.hidden = false; }, select); } catch (x) { select(); }
    }
  });

  function check(form, errEl) {
    var bad = [].filter.call(form.querySelectorAll('[required]'), function (el) { return !el.checkValidity(); });
    if (!bad.length) { errEl.hidden = true; return true; }
    errEl.textContent = 'Please complete: ' + bad.map(function (el) {
      return el.type === 'checkbox' ? 'the research-use confirmation' : el.parentNode.firstChild.textContent.trim().toLowerCase();
    }).join(', ') + '.';
    errEl.hidden = false; bad[0].focus(); return false;
  }
  function val(id) { return document.getElementById(id).value.trim(); }
  function ready(resultId, textId, mailId, subject, body) {
    document.getElementById(textId).textContent = body;
    document.getElementById(mailId).href = 'mailto:' + EMAIL + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
    var r = document.getElementById(resultId); r.hidden = false; r.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  window.DL = {
    basketPage: function () {
      var lines = document.getElementById('lines');
      function render() {
        var b = load(), sub = 0;
        lines.innerHTML = '';
        b.forEach(function (i) {
          var p = P[i.id], line = i.qty * p.price; sub += line;
          var li = document.createElement('li'); li.className = 'line';
          li.innerHTML = '<a class="line-name" href="' + p.href + '"></a><span class="line-unit mono">' + gbp(p.price) + ' each</span>' +
            '<div class="stepper"><button type="button" data-step="-1" aria-label="One fewer">−</button><span class="mono">' + i.qty + '</span><button type="button" data-step="1" aria-label="One more">+</button></div>' +
            '<span class="line-total mono">' + gbp(line) + '</span><button type="button" class="line-remove" data-remove>Remove</button>';
          li.querySelector('.line-name').textContent = p.name;
          li.querySelectorAll('[data-step]').forEach(function (s) { s.addEventListener('click', function () {
            var bb = load(); bb.forEach(function (x) { if (x.id === i.id) x.qty = Math.max(1, Math.min(99, x.qty + +s.dataset.step)); }); save(bb); render(); }); });
          li.querySelector('[data-remove]').addEventListener('click', function () { save(load().filter(function (x) { return x.id !== i.id; })); render(); });
          lines.appendChild(li);
        });
        document.getElementById('subtotal').textContent = gbp(sub);
        document.getElementById('basket-empty').hidden = b.length > 0;
        document.getElementById('basket-side').hidden = b.length === 0;
        return { items: b, sub: sub };
      }
      render();
      var of = document.getElementById('order-form');
      if (of) of.addEventListener('submit', function (e) {
        e.preventDefault();
        if (!check(this, document.getElementById('o-error'))) return;
        var s = render();
        var body = 'Order request\n\n' + s.items.map(function (i) { return i.qty + ' x ' + P[i.id].name + ' @ ' + gbp(P[i.id].price) + ' = ' + gbp(i.qty * P[i.id].price); }).join('\n') +
          '\n\nSubtotal: ' + gbp(s.sub) + '\n\nName: ' + val('o-name') + '\nEmail: ' + val('o-email') + '\nInstitution: ' + val('o-org') +
          '\nDelivery address: ' + val('o-addr').replace(/\n/g, ', ') + '\nPO number: ' + (val('o-po') || '-') +
          '\n\nI confirm these products are for laboratory research use only.';
        ready('result', 'result-text', 'mailto', 'Order request from ' + val('o-org'), body);
      });
    },
    contactPage: function () {
      document.getElementById('contact-form').addEventListener('submit', function (e) {
        e.preventDefault();
        if (!check(this, document.getElementById('c-error'))) return;
        var body = 'Name: ' + val('c-name') + '\nEmail: ' + val('c-email') + '\nInstitution: ' + (val('c-org') || '-') + '\nTopic: ' + val('c-topic') + '\n\n' + val('c-msg');
        ready('c-result', 'c-text', 'c-mailto', val('c-topic') + ' – ' + val('c-name'), body);
      });
    }
  };
  document.addEventListener('click', function (e) {
    [].forEach.call(document.querySelectorAll('details.dropdown[open]'), function (d) { if (!d.contains(e.target)) d.open = false; });
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') [].forEach.call(document.querySelectorAll('details.dropdown[open]'), function (d) { d.open = false; });
  });
  // Starfield, orbit and parallax for the hero
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) [].forEach.call(document.querySelectorAll('animateMotion'), function (m) { m.remove(); });
  var cv = document.querySelector('.starfield');
  if (cv && cv.getContext) {
    var ctx = cv.getContext('2d'), stars = [], w = 0, h = 0, dpr = Math.min(window.devicePixelRatio || 1, 2), running = true;
    var size = function () {
      var r = cv.getBoundingClientRect(); w = r.width; h = r.height;
      cv.width = w * dpr; cv.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      stars = []; var n = Math.round(w * h / 2400);
      for (var i = 0; i < n; i++) stars.push({ x: Math.random() * w, y: Math.random() * h, r: Math.random() * 1.1 + 0.2, a: Math.random() * 0.7 + 0.15, t: Math.random() * 6.28, s: Math.random() * 0.02 + 0.004, v: Math.random() * 0.05 + 0.01 });
    };
    var draw = function () {
      ctx.clearRect(0, 0, w, h); ctx.fillStyle = '#fff';
      for (var i = 0; i < stars.length; i++) {
        var st = stars[i];
        if (!reduce) { st.t += st.s; st.x -= st.v; if (st.x < 0) st.x = w; }
        ctx.globalAlpha = st.a * (0.6 + 0.4 * Math.sin(st.t));
        ctx.beginPath(); ctx.arc(st.x, st.y, st.r, 0, 6.283); ctx.fill();
      }
      if (!reduce && running) requestAnimationFrame(draw);
    };
    size(); draw();
    window.addEventListener('resize', function () { size(); if (reduce) draw(); });
    if ('IntersectionObserver' in window) new IntersectionObserver(function (es) {
      var vis = es[0].isIntersecting; if (vis && !running) { running = true; draw(); } running = vis;
    }).observe(cv);
  }
  // Deimos orbiting Mars. Seen from below the orbital plane, so the near side is the upper arc.
  var scene = document.querySelector('.scene'), moon = scene && scene.querySelector('.deimos');
  if (moon && scene.dataset.rx) {
    var RX = +scene.dataset.rx, RY = +scene.dataset.ry, T = +scene.dataset.tilt * Math.PI / 180;
    var th = 3.55, last = performance.now(), going = true, BASE = (Math.PI * 2) / 34000;
    var put = function () {
      var ex = RX * Math.cos(th), ey = RY * Math.sin(th), depth = -Math.sin(th);
      moon.style.left = ((500 + ex * Math.cos(T) - ey * Math.sin(T)) / 10) + '%';
      moon.style.top = ((500 + ex * Math.sin(T) + ey * Math.cos(T)) / 10) + '%';
      moon.style.setProperty('--s', (0.82 + 0.18 * depth).toFixed(3)); moon.style.setProperty('--rot', (Math.cos(th) * -6).toFixed(2) + 'deg');
      moon.classList.toggle('is-behind', depth < 0);
      return depth;
    };
    var depth0 = put();
    if (!reduce) {
      var tick = function (now) {
        var dt = Math.min(now - last, 100); last = now;
        var depth = put(), r = moon.getBoundingClientRect();
        var offscreen = r.left > window.innerWidth - 20;
        // Spend little time where Deimos can't be seen (behind Mars or off the edge)
        var speed = depth < 0 || offscreen ? 5 : 1;
        th += BASE * dt * speed;
        if (going) requestAnimationFrame(tick);
      };
      requestAnimationFrame(function (n) { last = n; tick(n); });
      if ('IntersectionObserver' in window) new IntersectionObserver(function (es) {
        var vis = es[0].isIntersecting; if (vis && !going) { going = true; last = performance.now(); requestAnimationFrame(tick); } going = vis;
      }).observe(scene);
    }
  }
  // Rotating Mars (WebGL). Falls back to the still image if WebGL is unavailable.
  var glc = scene && scene.querySelector('.mars-gl');
  if (glc) (function () {
    var gl; try { gl = glc.getContext('webgl', { premultipliedAlpha: true, alpha: true, antialias: true }); } catch (e) {}
    if (!gl) return;
    var VS = 'attribute vec2 p;varying vec2 v;void main(){v=p;gl_Position=vec4(p,0.,1.);}';
    var FS = [
      'precision highp float;varying vec2 v;uniform sampler2D map;uniform float rot;uniform vec3 sh;',
      'const float K=1.08;',
      'void main(){',
      ' vec2 q=v*K; q.y=-q.y; float r2=dot(q,q);',
      ' vec3 L=normalize(vec3(-0.55,-0.35,0.76));',
      ' if(r2>1.){ float d=sqrt(r2)-1.; vec2 n2=normalize(q); float lit=clamp(dot(vec3(n2,0.),L)*1.2+0.35,0.,1.);',
      '  float a=exp(-d*38.)*lit*0.75; gl_FragColor=vec4(vec3(0.95,0.55,0.32)*a,a); return; }',
      ' float nz=sqrt(1.-r2); vec3 n=vec3(q,nz);',
      ' float t=0.38, c=cos(t), s=sin(t); vec3 P=vec3(n.x, n.y*c-n.z*s, n.y*s+n.z*c);',
      ' float lat=asin(clamp(-P.y,-1.,1.)); float lon=atan(P.x,P.z)+rot;',
      ' vec2 uv=vec2(fract(lon/6.2831853+0.5), 0.5-lat/3.14159265);',
      ' vec3 col=texture2D(map,uv).rgb;',
      ' float lam=clamp(dot(n,L),0.,1.); float shade=pow(clamp(lam*1.15+0.02,0.,1.),0.9);',
      ' float limb=0.55+0.45*sqrt(nz);',
      ' vec3 img=col*shade*limb;',
      ' float haze=pow(1.-nz,3.)*clamp(lam*1.4+0.15,0.,1.);',
      ' img+=haze*vec3(0.85,0.55,0.38)*0.55;',
      ' if(sh.z>0.){ float d=length(q-sh.xy); img*=1.-0.6*sh.z*(1.-smoothstep(0.035,0.11,d)); }',
      ' float edge=clamp((1.-sqrt(r2))*500.,0.,1.);',
      ' gl_FragColor=vec4(img*edge,edge);',
      '}'].join('\n');
    function sh(type, src) { var o = gl.createShader(type); gl.shaderSource(o, src); gl.compileShader(o); return gl.getShaderParameter(o, gl.COMPILE_STATUS) ? o : null; }
    var vs = sh(gl.VERTEX_SHADER, VS), fs = sh(gl.FRAGMENT_SHADER, FS); if (!vs || !fs) return;
    var pr = gl.createProgram(); gl.attachShader(pr, vs); gl.attachShader(pr, fs); gl.linkProgram(pr);
    if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) return;
    gl.useProgram(pr);
    var b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    var loc = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    var uRot = gl.getUniformLocation(pr, 'rot'), uSh = gl.getUniformLocation(pr, 'sh');
    var img = new Image(); img.crossOrigin = 'anonymous';
    img.onload = function () {
      var tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tex);
      try { gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img); } catch (e) { return; }
      if (gl.getError()) return;
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      var rot = 0.7, prev = performance.now(), live = true;
      var MR = 360;
      function size() {
        var r = glc.getBoundingClientRect(), d = Math.min(window.devicePixelRatio || 1, 2);
        glc.width = Math.round(r.width * d); glc.height = Math.round(r.height * d); gl.viewport(0, 0, glc.width, glc.height);
      }
      function frame(now) {
        if (!reduce) rot += Math.min(now - prev, 100) * 0.000035; prev = now;
        var shv = [0, 0, 0];
        if (moon && !moon.classList.contains('is-still') && !moon.classList.contains('is-behind')) {
          var x = (parseFloat(moon.style.left) * 10 - 500) / MR, y = (parseFloat(moon.style.top) * 10 - 500) / MR;
          // Shadow falls away from the light (upper left), onto the surface behind Deimos
          shv = [x + 0.16, y + 0.1, 1];
        }
        gl.uniform1f(uRot, rot); gl.uniform3f(uSh, shv[0], shv[1], shv[2]);
        gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT); gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        if (live && !reduce) requestAnimationFrame(frame);
      }
      size(); frame(prev); scene.classList.add('gl');
      window.addEventListener('resize', function () { size(); if (reduce) frame(performance.now()); });
      if ('IntersectionObserver' in window) new IntersectionObserver(function (es) {
        var vis = es[0].isIntersecting; if (vis && !live && !reduce) { live = true; prev = performance.now(); requestAnimationFrame(frame); } live = vis;
      }).observe(glc);
    };
    img.src = 'assets/mars-map.jpg';
  })();
  // Gentle scroll parallax on the hero scene
  if (scene && !reduce) {
    var onScroll = function () { var y = window.scrollY; if (y < window.innerHeight * 1.2) scene.style.setProperty('--sy', (y * 0.18).toFixed(1) + 'px'); };
    window.addEventListener('scroll', onScroll, { passive: true }); onScroll();
  }
  // Product cards: pointer glow and a slight 3D tilt
  var fine = window.matchMedia && matchMedia('(hover: hover) and (pointer: fine)').matches;
  document.addEventListener('pointermove', function (e) {
    var c = e.target.closest && e.target.closest('.pcard'); if (!c) return;
    var r = c.getBoundingClientRect(), mx = e.clientX - r.left, my = e.clientY - r.top;
    c.style.setProperty('--mx', mx + 'px'); c.style.setProperty('--my', my + 'px');
    if (fine && !reduce) { c.style.setProperty('--ry', ((mx / r.width - 0.5) * 6).toFixed(2) + 'deg'); c.style.setProperty('--rx', ((0.5 - my / r.height) * 5).toFixed(2) + 'deg'); }
  });
  document.addEventListener('pointerout', function (e) {
    var c = e.target.closest && e.target.closest('.pcard'); if (!c || c.contains(e.relatedTarget)) return;
    c.style.setProperty('--rx', '0deg'); c.style.setProperty('--ry', '0deg');
  });
  // Reveal on scroll. Only elements below the fold get shifted, so nothing is ever hidden.
  if (!reduce && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (en) { if (en.isIntersecting) { en.target.classList.remove('pre-reveal'); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -8% 0px' });
    [].forEach.call(document.querySelectorAll('[data-reveal]'), function (el, i) {
      if (el.getBoundingClientRect().top > window.innerHeight) { el.classList.add('pre-reveal'); el.style.transitionDelay = ((i % 3) * 80) + 'ms'; io.observe(el); }
    });
  }
  // Logo intro on the first page of a visit
  (function () {
    if (reduce || !document.querySelector('.hero')) return;
    var seen = false; try { seen = sessionStorage.getItem('dl-intro') === '1'; sessionStorage.setItem('dl-intro', '1'); } catch (e) {}
    if (seen) return;
    var d = document.createElement('div'); d.className = 'intro'; d.setAttribute('aria-hidden', 'true');
    d.innerHTML = '<img src="assets/logo.webp" alt="">';
    document.body.appendChild(d);
    setTimeout(function () { d.classList.add('out'); setTimeout(function () { d.remove(); }, 900); }, 1700);
  })();
  // Reading progress on monograph pages
  var rb = document.querySelector('.readbar i');
  if (rb) {
    var art2 = document.querySelector('.article-body');
    var prog = function () {
      if (!art2) return; var r = art2.getBoundingClientRect(), total = r.height - innerHeight * 0.6;
      rb.style.transform = 'scaleX(' + Math.max(0, Math.min(1, -r.top / total)).toFixed(3) + ')';
    };
    addEventListener('scroll', prog, { passive: true }); prog();
  }
  // Residue chains animate in when they scroll into view
  if ('IntersectionObserver' in window && !reduce) {
    var cio = new IntersectionObserver(function (es) { es.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('play'); cio.unobserve(en.target); } }); }, { threshold: 0.3 });
    [].forEach.call(document.querySelectorAll('.chain'), function (c) { cio.observe(c); });
  } else [].forEach.call(document.querySelectorAll('.chain'), function (c) { c.classList.add('play'); });
  badge();
})();
