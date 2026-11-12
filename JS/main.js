/* =====================================================================
   FINUITY promo site — behaviour
   Sections: config wiring · nav · reveal · hero · tips · calculator ·
             plans · transcript · form
   Plain JavaScript, no libraries, works when opened straight from disk.
   ===================================================================== */
(function () {
  "use strict";

  document.documentElement.classList.add("js");

  var $  = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var cfg = window.FINUITY_SITE || {};
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Config wiring: app / Facebook / email links ---------- */
  if (cfg.appUrl) {
    $$("[data-app-link]").forEach(function (a) {
      a.href = cfg.appUrl;
      a.target = "_blank";
      a.rel = "noopener";
    });
  }
  if (cfg.facebookUrl) { $("#fbLink").href = cfg.facebookUrl; }
  if (cfg.email) {
    var e = $("#emailLink");
    e.href = "mailto:" + cfg.email;
    e.textContent = cfg.email;
    $("#emailRow").hidden = false;
  }
  $("#year").textContent = new Date().getFullYear();

  /* ---------- Header: shadow on scroll, mobile menu, active link ---------- */
  var header = $(".site-header");
  var menuBtn = $("#menuBtn");
  var nav = $("#nav");
  var sticky = $("#stickyCta");

  function onScroll() {
    header.classList.toggle("scrolled", window.scrollY > 8);
    // show the mobile sticky CTA after the hero, hide it again at the contact form
    var contact = $("#contact").getBoundingClientRect();
    var pastHero = window.scrollY > window.innerHeight * 0.8;
    sticky.classList.toggle("show", pastHero && contact.top > window.innerHeight * 0.6);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  function setMenu(open) {
    nav.classList.toggle("open", open);
    menuBtn.setAttribute("aria-expanded", String(open));
    menuBtn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  }
  menuBtn.addEventListener("click", function () { setMenu(!nav.classList.contains("open")); });
  $$("a", nav).forEach(function (a) { a.addEventListener("click", function () { setMenu(false); }); });
  document.addEventListener("keydown", function (ev) { if (ev.key === "Escape") setMenu(false); });

  // highlight the nav link of the section being read
  if ("IntersectionObserver" in window) {
    var links = {};
    $$("[data-spy]").forEach(function (a) { links[a.dataset.spy] = a; });
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        Object.keys(links).forEach(function (k) { links[k].classList.toggle("active", k === en.target.id); });
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    Object.keys(links).forEach(function (id) { var s = document.getElementById(id); if (s) spy.observe(s); });
  }

  /* ---------- Scroll reveal ---------- */
  var reveals = $$(".reveal");
  if ("IntersectionObserver" in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("in"); obs.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    reveals.forEach(function (el, i) {
      el.style.transitionDelay = (i % 3) * 70 + "ms";
      io.observe(el);
    });
  } else {
    reveals.forEach(function (el) { el.classList.add("in"); });
  }

  /* ---------- Hero: count-up + progress bar ---------- */
  var fmt = new Intl.NumberFormat("en-PH", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  var peek = $("#peekCount");
  function countUp(el, to, ms) {
    if (reduceMotion) { el.textContent = fmt.format(to); return; }
    var t0 = performance.now();
    (function step(now) {
      var p = Math.min(1, (now - t0) / ms);
      el.textContent = fmt.format(Math.round(to * (1 - Math.pow(1 - p, 3))));
      if (p < 1) requestAnimationFrame(step);
    })(t0);
  }
  window.addEventListener("load", function () {
    document.body.classList.add("is-ready");
    countUp(peek, +peek.dataset.to, 1400);
  });

  /* ---------- Fin: rotating money tips ---------- */
  var tips = [
    "Pay bills first. What’s left is truly yours.",
    "Log it right away. Small buys are the sneaky ones.",
    "Save first, spend next, even if it’s only ₱20.",
    "Utang is fine if you write it down.",
    "A streak is just showing up. One log a day.",
    "Lunch money adds up. Count it for one week.",
    "Need vs want? Ask before you tap Pay."
  ];
  var tipIdx = -1;
  var fin = $("#fin"), bubble = $("#finBubble");
  fin.addEventListener("click", function () {
    tipIdx = (tipIdx + 1) % tips.length;
    bubble.textContent = tips[tipIdx];
  });

  /* ---------- "Yours to spend" receipt calculator ---------- */
  var peso = new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", minimumFractionDigits: 2 });
  var mInc = $("#mIncome"), mBills = $("#mBills"), mSpent = $("#mSpent");
  var mTotal = $("#mTotal"), mNote = $("#mNote"), mBar = $("#mBar");
  $("#mathMonth").textContent = new Date().toLocaleString("en-US", { month: "long" }).toUpperCase();

  function num(input) {
    var v = parseFloat(String(input.value).replace(/[^0-9.]/g, ""));
    return isFinite(v) && v >= 0 ? v : 0;
  }
  function calc() {
    var inc = num(mInc), bills = num(mBills), spent = num(mSpent);
    var left = inc - bills - spent;
    mTotal.textContent = peso.format(left).replace("PHP", "₱").replace(/\s/g, "");
    mTotal.classList.toggle("neg", left < 0);

    var share = inc > 0 ? left / inc : 0;
    var pct = Math.max(0, Math.min(100, Math.round(share * 100)));
    mBar.style.width = pct + "%";
    mBar.style.background = left < 0 ? "#c0391b" : "";

    if (inc === 0) mNote.textContent = "Type what is coming in this month to begin.";
    else if (left < 0) mNote.textContent = "You are ₱" + fmt.format(Math.abs(left)) + " over. Time to trim a want.";
    else if (share >= 0.3) mNote.textContent = "That is " + pct + "% of your money. Healthy room to breathe.";
    else if (share > 0) mNote.textContent = "Only " + pct + "% is left. Watch the small buys.";
    else mNote.textContent = "Zero left. Every peso is spoken for.";
  }
  [mInc, mBills, mSpent].forEach(function (i) {
    i.addEventListener("input", calc);
    i.addEventListener("focus", function () { i.select(); });
  });
  $("#mathForm").addEventListener("submit", function (ev) { ev.preventDefault(); });
  calc();

  /* ---------- VIP plan picker ---------- */
  var BASE_MONTH = 49;
  var PLANS = {
    m1:  { months: 1,  price: 49 },
    m3:  { months: 3,  price: 129 },
    m12: { months: 12, price: 399 }
  };
  var seg = $("#seg");
  function pickPlan(id) {
    var p = PLANS[id];
    var full = BASE_MONTH * p.months, save = full - p.price;
    $$("button", seg).forEach(function (b) { b.setAttribute("aria-checked", String(b.dataset.plan === id)); });
    $("#vipPrice").textContent = "₱" + p.price;
    $("#vipPer").textContent = p.months === 1 ? "for one month" : "about ₱" + Math.round(p.price / p.months) + " a month";
    $("#vipSave").textContent = save > 0
      ? (id === "m12" ? "Best value. " : "") + "Save ₱" + save + " compared with paying monthly."
      : "Pay as you go. No commitment.";
  }
  seg.addEventListener("click", function (ev) {
    var b = ev.target.closest("button[data-plan]");
    if (b) pickPlan(b.dataset.plan);
  });
  seg.addEventListener("keydown", function (ev) {   // arrow keys move through the radio group
    if (ev.key !== "ArrowRight" && ev.key !== "ArrowLeft") return;
    var btns = $$("button", seg);
    var i = btns.findIndex(function (b) { return b.getAttribute("aria-checked") === "true"; });
    i = (i + (ev.key === "ArrowRight" ? 1 : btns.length - 1)) % btns.length;
    pickPlan(btns[i].dataset.plan);
    btns[i].focus();
  });
  pickPlan("m12");

  /* ---------- Video transcript (text comes from js/transcript.js) ---------- */
  var tr = $("#transcript");
  (window.FINUITY_TRANSCRIPT || []).forEach(function (c) {
    var p = document.createElement("p");
    var t = document.createElement("time");
    t.textContent = c[0];
    p.appendChild(t);
    p.appendChild(document.createTextNode(c[1]));
    tr.appendChild(p);
  });

  /* ---------- Contact form (front-end only, no backend) ---------- */
  var form = $("#inquiry");
  var fields = {
    name:    { input: $("#fName"),    err: $("#eName") },
    contact: { input: $("#fContact"), err: $("#eContact") },
    message: { input: $("#fMsg"),     err: $("#eMsg") }
  };
  var count = $("#count");

  function setError(key, msg) {
    var f = fields[key];
    f.err.textContent = msg;
    f.input.closest(".field").classList.toggle("bad", !!msg);
    f.input.setAttribute("aria-invalid", msg ? "true" : "false");
    if (msg) f.input.setAttribute("aria-describedby", f.err.id); else f.input.removeAttribute("aria-describedby");
  }
  function validate() {
    var ok = true, first = null;
    var name = fields.name.input.value.trim();
    var contact = fields.contact.input.value.trim();
    var msg = fields.message.input.value.trim();

    if (name.length < 2) { setError("name", "Please tell us your name."); ok = false; first = first || fields.name.input; }
    else setError("name", "");

    var looksEmail = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(contact);
    if (!contact) { setError("contact", "Add an email or your Facebook name so we can reply."); ok = false; first = first || fields.contact.input; }
    else if (contact.indexOf("@") > -1 && !looksEmail) { setError("contact", "That email doesn’t look right. Check for typos."); ok = false; first = first || fields.contact.input; }
    else if (contact.length < 3) { setError("contact", "That looks too short."); ok = false; first = first || fields.contact.input; }
    else setError("contact", "");

    if (msg.length < 10) { setError("message", "Please write at least 10 characters."); ok = false; first = first || fields.message.input; }
    else setError("message", "");

    if (first) first.focus();
    return ok;
  }

  fields.message.input.addEventListener("input", function () {
    count.textContent = this.value.length + " / 500";
  });
  // clear an error as soon as the person fixes it
  ["name", "contact", "message"].forEach(function (k) {
    fields[k].input.addEventListener("input", function () {
      if (fields[k].err.textContent) setError(k, "");
    });
  });

  var success = $("#success");
  form.addEventListener("submit", function (ev) {
    ev.preventDefault();
    if (!validate()) return;
    var first = fields.name.input.value.trim().split(/\s+/)[0];
    var topic = $("#fTopic").value.toLowerCase();
    $("#okTitle").textContent = "Thank you, " + first + "!";
    $("#okText").textContent = "We got your note about “" + topic + "”. We’ll reply through " +
      (fields.contact.input.value.indexOf("@") > -1 ? "email" : "Facebook") + " soon.";
    success.hidden = false;
    success.focus();
  });
  $("#again").addEventListener("click", function () {
    form.reset();
    count.textContent = "0 / 500";
    success.hidden = true;
    fields.name.input.focus();
  });
})();
