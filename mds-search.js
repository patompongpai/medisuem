/* Medisüem — ค้นหาทั้งหน้า (ใช้ร่วมกันทุกบทเรียน)
   ปุ่ม 🔍 อยู่ในแถบลอยมุมขวาล่าง (.imhub-bar) · คีย์ลัด Ctrl/⌘+K
   - หน้าที่มีระบบค้นหาของตัวเองอยู่แล้ว (#sOpen, #searchBtn) → ปุ่มจะเปิดระบบเดิม
   - หน้าแบบ SECTIONS + goTo() → ค้นจากข้อมูลบทเรียนทุกบท
   - หน้าอื่น → ค้นจากเนื้อหาทั้งหน้า รวมแท็บที่ซ่อนอยู่ แล้วเปิดแท็บให้อัตโนมัติ */
(function () {
  "use strict";
  if (window.__mdsSearch) return;
  window.__mdsSearch = true;

  var D = document;
  var NATIVE = D.getElementById("sOpen") || D.getElementById("searchBtn");
  var ICON = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.6-3.6"/></svg>';

  /* ---------- styles ---------- */
  var css = "" +
    ".mds-sbtn{display:inline-flex;align-items:center;justify-content:center;gap:6px;height:38px;padding:0 14px;border-radius:999px;background:var(--hb-bg,#fff);color:var(--hb-fg,#1b2a44);border:1px solid var(--hb-line,#cfd6e2);box-shadow:0 4px 14px rgba(20,30,50,.16);font:600 13.5px/1 'IBM Plex Sans Thai','Sarabun','Noto Sans Thai',system-ui,sans-serif;cursor:pointer}" +
    ".mds-sbtn:hover{transform:translateY(-1px)}.mds-sbtn:focus-visible{outline:2px solid #3b6fd8;outline-offset:2px}" +
    "@media(max-width:560px){.mds-sbtn{width:38px;padding:0}.mds-sbtn span{display:none}}" +
    ".mds-ov{--m-bg:#fff;--m-bg2:#f3f5f9;--m-fg:#1b2a44;--m-mut:#5d6b82;--m-line:#d6dce6;--m-acc:#2f5fc4;--m-mark:#fde9b8;" +
    "position:fixed;inset:0;z-index:2147483000;background:rgba(15,22,34,.45);display:flex;justify-content:center;align-items:flex-start;padding:8vh 14px 14px;font-family:'IBM Plex Sans Thai','Sarabun','Noto Sans Thai',system-ui,sans-serif}" +
    "@media (prefers-color-scheme:dark){:root:not([data-theme='light']) .mds-ov{--m-bg:#1a2333;--m-bg2:#222d40;--m-fg:#e4eaf5;--m-mut:#9aa7bd;--m-line:#33415a;--m-acc:#8fb0f2;--m-mark:#5a4a1c}}" +
    ":root[data-theme='dark'] .mds-ov{--m-bg:#1a2333;--m-bg2:#222d40;--m-fg:#e4eaf5;--m-mut:#9aa7bd;--m-line:#33415a;--m-acc:#8fb0f2;--m-mark:#5a4a1c}" +
    ".mds-ov[hidden]{display:none!important}" +
    ".mds-panel{width:100%;max-width:700px;max-height:80vh;display:flex;flex-direction:column;background:var(--m-bg);color:var(--m-fg);border:1px solid var(--m-line);border-radius:14px;box-shadow:0 20px 60px -20px rgba(0,0,0,.5);overflow:hidden}" +
    ".mds-row{display:flex;align-items:center;gap:10px;padding:12px 14px;border-bottom:1px solid var(--m-line)}" +
    ".mds-row svg{flex:none;color:var(--m-mut)}" +
    ".mds-row input{flex:1;min-width:0;border:0;outline:0;background:transparent;color:var(--m-fg);font:inherit;font-size:17px}" +
    ".mds-row input::-webkit-search-cancel-button{display:none}" +
    ".mds-x{background:var(--m-bg2);color:var(--m-fg);border:1px solid var(--m-line);border-radius:8px;padding:5px 11px;font:600 13px inherit;cursor:pointer}" +
    ".mds-body{overflow-y:auto;overscroll-behavior:contain;padding:8px 10px 14px}" +
    ".mds-meta{font-size:12px;color:var(--m-mut);padding:4px 6px 8px}" +
    ".mds-hit{display:block;width:100%;text-align:left;background:none;color:var(--m-fg);border:1px solid transparent;border-radius:9px;padding:9px 11px;cursor:pointer;line-height:1.55;font:inherit}" +
    ".mds-hit:hover,.mds-hit.on{background:var(--m-bg2);border-color:var(--m-line)}" +
    ".mds-sec{display:block;font-size:11.5px;font-weight:600;color:var(--m-acc);margin-bottom:2px}" +
    ".mds-txt{font-size:14.5px}" +
    ".mds-hit mark{background:var(--m-mark);color:inherit;border-radius:3px;padding:0 2px}" +
    ".mds-foot{font-size:11.5px;color:var(--m-mut);padding:8px 14px;border-top:1px solid var(--m-line);display:flex;gap:14px;flex-wrap:wrap}" +
    ".mds-foot kbd{font-family:ui-monospace,Menlo,monospace;font-size:11px;border:1px solid var(--m-line);border-radius:4px;padding:0 5px}" +
    ".mds-flash{animation:mdsflash 2.4s ease;border-radius:4px}" +
    "@keyframes mdsflash{0%,45%{background-color:rgba(250,204,21,.38);box-shadow:0 0 0 4px rgba(250,204,21,.38)}100%{background-color:transparent;box-shadow:none}}" +
    "@media print{.mds-sbtn,.mds-ov{display:none!important}}";
  var st = D.createElement("style"); st.textContent = css; D.head.appendChild(st);

  /* ---------- button ---------- */
  function mountButton() {
    var b = D.createElement("button");
    b.type = "button"; b.className = "mds-sbtn"; b.id = "mdsSearch";
    b.setAttribute("aria-label", "ค้นหาในบทเรียน (Ctrl+K)"); b.title = "ค้นหาในบทเรียน (Ctrl+K)";
    b.innerHTML = ICON + "<span>ค้นหา</span>";
    var bar = D.querySelector(".imhub-bar");
    if (bar) bar.insertBefore(b, bar.firstChild);
    else { b.style.cssText = "position:fixed;right:16px;bottom:calc(16px + env(safe-area-inset-bottom,0px));z-index:70"; D.body.appendChild(b); }
    b.addEventListener("click", function () { NATIVE ? NATIVE.click() : open(); });
  }
  if (D.readyState === "loading") D.addEventListener("DOMContentLoaded", mountButton); else mountButton();
  if (NATIVE) return; /* page keeps its own search & shortcuts */

  /* ---------- overlay ---------- */
  var ov = D.createElement("div");
  ov.className = "mds-ov"; ov.hidden = true;
  ov.innerHTML = '<div class="mds-panel" role="dialog" aria-modal="true" aria-label="ค้นหาในบทเรียน">' +
    '<div class="mds-row">' + ICON + '<input type="search" placeholder="ค้นหาในบทเรียนนี้ เช่น ชื่อยา ตัวเลข คำย่อ" autocomplete="off" enterkeyhint="search" aria-label="คำค้น"><button type="button" class="mds-x">ปิด</button></div>' +
    '<div class="mds-body"></div>' +
    '<div class="mds-foot"><span><kbd>↑</kbd><kbd>↓</kbd> เลือก</span><span><kbd>Enter</kbd> ไปที่เนื้อหา</span><span><kbd>Esc</kbd> ปิด</span><span>หลายคำ = ต้องมีครบทุกคำ</span></div></div>';
  var inp, body, IDX = [], hits = [], cur = 0, lastFocus = null;
  function attach() { D.body.appendChild(ov); inp = ov.querySelector("input"); body = ov.querySelector(".mds-body");
    ov.querySelector(".mds-x").addEventListener("click", close);
    ov.addEventListener("click", function (e) { if (e.target === ov) close(); });
    inp.addEventListener("input", render);
    inp.addEventListener("keydown", function (e) {
      var bs = body.querySelectorAll(".mds-hit");
      if (e.key === "ArrowDown" || e.key === "ArrowUp") { e.preventDefault(); if (!bs.length) return; bs[cur].classList.remove("on"); cur = (cur + (e.key === "ArrowDown" ? 1 : -1) + bs.length) % bs.length; bs[cur].classList.add("on"); bs[cur].scrollIntoView({ block: "nearest" }); }
      else if (e.key === "Enter") { e.preventDefault(); go(cur); }
    });
  }
  if (D.readyState === "loading") D.addEventListener("DOMContentLoaded", attach); else attach();

  D.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && !ov.hidden) { close(); return; }
    if ((e.ctrlKey || e.metaKey) && (e.key || "").toLowerCase() === "k" && ov.hidden) { e.preventDefault(); open(); }
  });

  function norm(t) { return (t || "").replace(/\s+/g, " ").trim(); }
  function strip(h) { var d = D.createElement("div"); d.innerHTML = String(h == null ? "" : h); return norm(d.textContent); }
  function esc(t) { return t.replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  /* ---------- index: data-driven pages (SECTIONS + goTo) ---------- */
  function dataIndex() {
    var S, G;
    try { S = (typeof SECTIONS !== "undefined") ? SECTIONS : null; G = (typeof goTo === "function") ? goTo : window.goTo; } catch (e) { S = null; }
    if (!S || !Array.isArray(S) || typeof G !== "function") return null;
    var out = [];
    S.forEach(function (s) {
      if (!s || s.isHome || s.isFinal) return;
      var sec = (s.n ? "บทที่ " + s.n + " · " : "") + strip(s.title || s.nav || s.id);
      function add(t, kind) { t = strip(t); if (t.length > 2) out.push({ sec: sec + (kind ? " · " + kind : ""), t: t, lo: t.toLowerCase(), data: s.id }); }
      if (s.title) add(s.title + (s.sub ? " — " + s.sub : ""), "");
      (s.chips || []).forEach(function (c) { add((c.v || "") + " " + (c.l || ""), "ตัวเลขสำคัญ"); });
      (s.bullets || []).forEach(function (b) { add(b, "สรุป"); });
      (s.recs || []).forEach(function (r) { add(r && r.t != null ? r.t : r, "คำแนะนำ"); });
      (s.cards || []).forEach(function (c) { add((c.f || "") + " — " + (c.b || ""), "แฟลชการ์ด"); });
      (s.quiz || []).forEach(function (q) { add((q.q || "") + (q.c && q.a != null ? " — " + q.c[q.a] : "") + (q.e ? " · " + q.e : ""), "แบบทดสอบ"); });
      Object.keys(s).forEach(function (k) { /* other text arrays, e.g. tables/notes */
        if (["chips", "bullets", "recs", "cards", "quiz"].indexOf(k) > -1) return;
        var v = s[k];
        if (Array.isArray(v)) v.forEach(function (x) { if (typeof x === "string") add(x, ""); else if (x && typeof x === "object") add(Object.keys(x).map(function (kk) { return typeof x[kk] === "string" ? x[kk] : ""; }).join(" "), ""); });
      });
    });
    var MK = null; try { MK = (typeof MUST_KNOW !== "undefined") ? MUST_KNOW : null; } catch (e) {}
    if (Array.isArray(MK)) MK.forEach(function (m) { var t = strip((m.v || "") + " " + (m.l || "")); out.push({ sec: "หน้าแรก · ตัวเลขที่ต้องจำ", t: t, lo: t.toLowerCase(), data: "home" }); });
    out._go = G;
    return out;
  }

  /* ---------- index: generic DOM ---------- */
  var BLOCK = "h1,h2,h3,h4,h5,p,li,tr,dt,dd,summary,figcaption,blockquote,.callout,.node,.kp,.note,.rec,.chip,.stat-tile";
  var SKIP = "script,style,noscript,template,svg,.mds-ov,.mds-sbtn,.imhub-bar,select,option,textarea,input,[aria-hidden='true']";
  function sectionLabel(el) {
    var lab = [];
    var panel = hiddenRoots(el).pop();
    if (panel && panel.id) { var c = controlFor(panel); if (c) lab.push(norm(Array.prototype.map.call(c.childNodes, function (n) { return n.textContent; }).join(" ")).slice(0, 40)); }
    return lab;
  }
  function domIndex() {
    var root = D.querySelector("main") || D.body;
    if (root !== D.body && D.body.querySelectorAll("main").length > 1) root = D.body;
    var all = Array.prototype.slice.call(D.body.querySelectorAll(BLOCK));
    var out = [], seen = {}, h2 = "", h3 = "";
    all.forEach(function (el) {
      if (el.closest(SKIP)) return;
      if (/^H[1-3]$/.test(el.tagName)) { if (el.tagName !== "H3") { h2 = norm(el.textContent); h3 = ""; } else h3 = norm(el.textContent); }
      if (!root.contains(el) && !/^H[1-5]$/.test(el.tagName)) { if (el.closest("header,footer")) return; }
      if (el.tagName !== "TR" && el.querySelector(BLOCK)) return;      /* keep leaf blocks */
      if (el.closest("nav") && el.tagName !== "P") return;
      if (el.closest("button") || el.closest("label")) return;
      var t = el.tagName === "TR" ? norm(Array.prototype.map.call(el.children, function (c) { return c.textContent; }).join(" · ")) : norm(el.textContent);
      if (t.length < 3 || t.length > 1500) { if (t.length > 1500) t = t.slice(0, 1500); else return; }
      if (seen[t]) return; seen[t] = 1;
      var lab = sectionLabel(el);
      var secTxt = lab.concat([h2, h3]).filter(Boolean).filter(function (x, i, a) { return a.indexOf(x) === i; }).join(" › ");
      out.push({ el: el, sec: secTxt || "เนื้อหา", t: t, lo: t.toLowerCase() });
    });
    return out;
  }

  /* ---------- reveal hidden tab / panel ---------- */
  function isHidden(el) { return el.hidden || (el.nodeType === 1 && getComputedStyle(el).display === "none"); }
  function hiddenRoots(el) { var a = [], p = el; while (p && p !== D.body) { if (p.nodeType === 1 && isHidden(p)) a.push(p); p = p.parentElement; } return a; }
  var CTRL = "button,a[href^='#'],[role=tab],[data-go],[data-tab],[data-v],[data-p],[data-view],[data-nav],[data-goto],[data-target],[data-tool],[data-sec]";
  function matches(id, v) {
    if (!v || v.length < 2) return false;
    v = v.replace(/^#/, "");
    return v === id || id === "v-" + v || id === "p-" + v || id === "t-" + v || id === "tab-" + v || id === "panel-" + v || id === "sec-" + v || id === "view-" + v ||
      id.slice(-(v.length + 1)) === "-" + v || id.slice(-(v.length + 1)) === "_" + v;
  }
  var CC = {};
  function controlFor(panel) {
    var id = panel.id; if (!id) return null;
    if (Object.prototype.hasOwnProperty.call(CC, id)) return CC[id];
    return (CC[id] = findControl(panel, id));
  }
  function findControl(panel, id) {
    var cs = D.querySelectorAll(CTRL), best = null;
    for (var i = 0; i < cs.length; i++) {
      var c = cs[i]; if (c.closest(".mds-ov") || panel.contains(c)) continue;
      var vals = [c.getAttribute("aria-controls"), c.getAttribute("href")];
      for (var j = 0; j < c.attributes.length; j++) if (/^data-/.test(c.attributes[j].name)) vals.push(c.attributes[j].value);
      if (vals.some(function (v) { return matches(id, v || ""); })) {
        if (!best || (c.getAttribute("role") === "tab" && best.getAttribute("role") !== "tab") || (c.closest("nav") && !best.closest("nav"))) best = c;
      }
    }
    return best;
  }
  function reveal(el) {
    var p = el.parentElement; while (p) { if (p.tagName === "DETAILS" && !p.open) p.open = true; p = p.parentElement; }
    for (var pass = 0; pass < 4; pass++) {
      var hs = hiddenRoots(el); if (!hs.length) return true;
      var top = hs[hs.length - 1], clicked = false;
      for (var k = hs.length - 1; k >= 0 && !clicked; k--) { var c = controlFor(hs[k]); if (c) { try { c.click(); clicked = true; } catch (e) {} } }
      if (!clicked) break;
      if (top.isConnected === false) return false;
    }
    return !hiddenRoots(el).length;
  }

  /* ---------- UI ---------- */
  function snip(t, terms) {
    var lo = t.toLowerCase(), i = lo.indexOf(terms[0]), s = Math.max(0, i - 60), o = t.slice(s, s + 230);
    var h = esc((s > 0 ? "…" : "") + o + (s + 230 < t.length ? "…" : ""));
    terms.forEach(function (w) { var re = new RegExp("(" + esc(w).replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + ")", "gi"); h = h.replace(re, "<mark>$1</mark>"); });
    return h;
  }
  function suggestions() {
    var words = {}, txt = IDX.slice(0, 600).map(function (x) { return x.t; }).join(" ");
    (txt.match(/\b[A-Za-z][A-Za-z0-9\-]{2,}\b/g) || []).forEach(function (w) { if (!/^(the|and|for|with|from|that|this|not|are|was|per|day|mg|kg|use)$/i.test(w)) words[w] = (words[w] || 0) + 1; });
    return Object.keys(words).sort(function (a, b) { return words[b] - words[a]; }).slice(0, 10);
  }
  function render() {
    var q = norm(inp.value).toLowerCase();
    if (!q) {
      var sug = suggestions();
      body.innerHTML = '<div class="mds-meta">ค้นได้ทุกแท็บ/ทุกบทในหน้านี้ · ' + IDX.length + ' ข้อความ</div>' +
        (sug.length ? '<div class="mds-meta">คำที่พบบ่อย: ' + sug.map(function (w) { return '<button type="button" class="mds-x" style="margin:2px">' + esc(w) + "</button>"; }).join("") + "</div>" : "");
      body.querySelectorAll(".mds-meta button").forEach(function (b) { b.onclick = function () { inp.value = b.textContent; render(); inp.focus(); }; });
      hits = []; return;
    }
    var terms = q.split(" ").filter(Boolean);
    hits = IDX.filter(function (it) { return terms.every(function (w) { return it.lo.indexOf(w) > -1; }); });
    hits.sort(function (a, b) { var ah = /^H\d$/.test(a.el && a.el.tagName || "") ? 0 : 1, bh = /^H\d$/.test(b.el && b.el.tagName || "") ? 0 : 1; return ah - bh; });
    var n = hits.length; hits = hits.slice(0, 80); cur = 0;
    body.innerHTML = '<div class="mds-meta">พบ ' + n + " รายการ" + (n > 80 ? " (แสดง 80 แรก)" : "") + "</div>" +
      hits.map(function (it, i) { return '<button type="button" class="mds-hit' + (i === 0 ? " on" : "") + '" data-i="' + i + '"><span class="mds-sec">' + esc(it.sec) + '</span><span class="mds-txt">' + snip(it.t, terms) + "</span></button>"; }).join("") +
      (n ? "" : '<div class="mds-meta">ไม่พบ — ลองคำที่สั้นลง หรือสะกดชื่อยา/คำย่อภาษาอังกฤษ</div>');
    body.querySelectorAll(".mds-hit").forEach(function (b) { b.onclick = function () { go(+b.dataset.i); }; });
  }
  function flash(el) {
    var y = el.getBoundingClientRect().top + window.scrollY - Math.min(180, window.innerHeight * 0.25);
    window.scrollTo({ top: Math.max(0, y), behavior: "smooth" });
    el.classList.remove("mds-flash"); void el.offsetWidth; el.classList.add("mds-flash");
    setTimeout(function () { el.classList.remove("mds-flash"); }, 2600);
  }
  function findText(root, t) {
    var sq = function (z) { return (z || "").replace(/\s+/g, "").toLowerCase(); };
    var key = sq(t).slice(0, 36), els = (root || D.body).querySelectorAll(BLOCK + ",div,span,td"), best = null;
    for (var i = 0; i < els.length; i++) { var x = els[i]; if (x.closest(".mds-ov")) continue; if (sq(x.textContent).indexOf(key) > -1) { if (!best || best.contains(x)) best = x; } }
    return best;
  }
  function go(i) {
    var it = hits[i]; if (!it) return; close();
    if (it.data) {
      try { IDX._go(it.data); } catch (e) {}
      setTimeout(function () { var el = findText(D.getElementById("main") || D.body, it.t); if (el) flash(el); }, 160);
      return;
    }
    var el = it.el;
    if (!el.isConnected) { el = findText(D.body, it.t); if (!el) return; }
    reveal(el);
    setTimeout(function () {
      var target = el;
      if (!el.isConnected || hiddenRoots(el).length) { var alt = findText(D.body, it.t); if (alt && !hiddenRoots(alt).length) target = alt; else { var vis = el; while (vis && hiddenRoots(vis).length) vis = vis.parentElement; target = vis || el; } }
      flash(target);
    }, 80);
  }
  function open() {
    CC = {}; IDX = dataIndex() || domIndex();
    lastFocus = D.activeElement; ov.hidden = false; D.body.style.overflow = "hidden";
    render(); setTimeout(function () { inp.focus(); inp.select(); }, 20);
  }
  function close() { ov.hidden = true; D.body.style.overflow = ""; if (lastFocus && lastFocus.focus) try { lastFocus.focus({ preventScroll: true }); } catch (e) {} }
  window.mdsSearchOpen = open;
})();
