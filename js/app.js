/* ShaadiSpot app logic */
const SS = (() => {
  // >>> CHANGE THIS to the business WhatsApp number (Pakistan format, no +) <<<
  const WA_NUMBER = "923238781697";

  const CATS = {
    halls:         { label: "Marriage Halls", icon: '<path d="M4 21V8l8-5 8 5v13"/><path d="M9 21v-6h6v6"/><path d="M2 21h20"/>' },
    photographers: { label: "Photographers",  icon: '<rect x="3" y="7" width="18" height="13" rx="2.5"/><circle cx="12" cy="13.5" r="3.5"/><path d="M8.5 7l1.5-2.5h4L15.5 7"/>' },
    makeup:        { label: "Makeup & Salons", icon: '<path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z"/><path d="M19 15l.9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9z"/>' },
    caterers:      { label: "Caterers",        icon: '<path d="M4 17h16"/><path d="M12 6a7 7 0 017 7H5a7 7 0 017-7z"/><path d="M12 6V4"/><circle cx="12" cy="3" r=".8"/>' },
    decorators:    { label: "Decorators",      icon: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9L17 7M7 17l-2.1 2.1"/>' },
  };
  const CAT_KEYS = Object.keys(CATS);

  const waLink = (msg) => `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`;
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const icon = (paths, cls="ic") => `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`;
  const star = '<svg class="ic-sm" viewBox="0 0 24 24" fill="currentColor" style="width:12px;height:12px"><path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5L2.5 9.4l6.6-.9z"/></svg>';
  const pin = '<svg class="ic-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 21s-7-5.5-7-11a7 7 0 0114 0c0 5.5-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/></svg>';

  let vendors = [];
  async function load() {
    if (vendors.length) return vendors;
    const r = await fetch("data/vendors.json");
    const j = await r.json();
    vendors = j.vendors;
    return vendors;
  }
  const byId = (id) => vendors.find(v => v.id === id);
  const priceLine = (v) => v.priceNote || "Contact for price";
  const ratingBadge = (v) => (v.rating ? `<span class="vrating">${star} ${v.rating}</span>` : "");
  const tagBadge = (v) => (v.tags && v.tags.includes("popular") ? `<span class="vtag">Popular</span>` : "");

  function card(v) {
    const initial = esc(v.name.trim().charAt(0));
    return `<a class="vcard" href="vendor.html?id=${v.id}">
      <div class="vmedia"><span class="mono">${initial}</span>${tagBadge(v)}${ratingBadge(v)}
        <div class="vprice">${esc(priceLine(v))}</div></div>
      <div class="vbody"><h3>${esc(v.name)}</h3>
        <p class="vcity">${pin} ${esc(v.area)}, ${esc(v.city)}</p>
        <div class="vfoot"><span class="vcat">${CATS[v.category].label}</span>
        <span class="varrow">${icon('<path d="M4 12h15M13.5 6.5L19 12l-5.5 5.5"/>',"ic-sm")}</span></div>
      </div></a>`;
  }

  function catCards() {
    return CAT_KEYS.map(k => {
      const n = vendors.filter(v => v.category === k).length;
      return `<a class="cat" href="vendors.html?cat=${k}">
        <span class="glyph">${icon(CATS[k].icon)}</span><b>${CATS[k].label}</b><small>${n} vendors</small></a>`;
    }).join("");
  }

  async function home() {
    await load();
    document.getElementById("cats").innerHTML = catCards();
    const feat = vendors.filter(v => v.tags && v.tags.includes("popular")).slice(0, 6);
    document.getElementById("featured").innerHTML = feat.map(card).join("");
    document.getElementById("listCta").href = waLink("Assalam-o-Alaikum! Main apna business ShaadiSpot par list karna chahta hun.");
  }

  function params() { return new URLSearchParams(location.search); }

  async function listing() {
    await load();
    const p = params();
    const state = { city: p.get("city") || "", cat: p.get("cat") || "", q: p.get("q") || "" };
    const pills = document.getElementById("catPills");
    pills.innerHTML = [`<button class="pill${!state.cat ? " active" : ""}" data-cat="">All</button>`,
      ...CAT_KEYS.map(k => `<button class="pill${state.cat === k ? " active" : ""}" data-cat="${k}">${CATS[k].label}</button>`)].join("");
    document.getElementById("fCity").value = state.city;
    document.getElementById("fQ").value = state.q;

    function render() {
      const q = state.q.trim().toLowerCase();
      const list = vendors.filter(v =>
        (!state.city || v.city === state.city) &&
        (!state.cat || v.category === state.cat) &&
        (!q || (v.name + " " + v.area).toLowerCase().includes(q)));
      document.getElementById("grid").innerHTML = list.map(card).join("");
      document.getElementById("empty").style.display = list.length ? "none" : "";
      document.getElementById("count").textContent = list.length ? `${list.length} vendor${list.length !== 1 ? "s" : ""} found` : "";
      pills.querySelectorAll(".pill").forEach(b => b.classList.toggle("active", b.dataset.cat === state.cat));
    }
    pills.addEventListener("click", e => {
      const b = e.target.closest(".pill"); if (!b) return;
      state.cat = b.dataset.cat; render();
    });
    document.getElementById("filterSearch").addEventListener("submit", e => {
      e.preventDefault();
      state.city = document.getElementById("fCity").value;
      state.q = document.getElementById("fQ").value;
      history.replaceState(null, "", "vendors.html?" + new URLSearchParams({city: state.city, cat: state.cat, q: state.q}));
      render();
    });
    render();
  }

  async function detail() {
    await load();
    const v = byId(params().get("id"));
    const box = document.getElementById("detail");
    if (!v) { box.innerHTML = `<div class="empty" style="margin:40px 0"><p>Vendor not found. <a class="link" href="vendors.html">Back to vendors →</a></p></div>`; return; }
    document.title = v.name + " — ShaadiSpot";
    const initial = esc(v.name.trim().charAt(0));
    const waMsg = `Assalam-o-Alaikum! Mujhe ${v.name} (${v.area}, ${v.city}) ke baare mein maloomat chahiye. ShaadiSpot se mila.`;
    const callBtn = v.phone ? `<a class="btn btn-call" href="tel:+92${v.phone.replace(/^0/, "")}">${icon('<path d="M5 4h4l2 5-2.5 1.5a12 12 0 005 5L15 13l5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2z"/>')} Call now</a>` : "";
    box.innerHTML = `<div class="detail-hero">
      <div class="detail-media"><span class="mono">${initial}</span></div>
      <div class="detail-body">
        <span class="vcat">${CATS[v.category].label}</span>
        <h1>${esc(v.name)}</h1>
        <div class="dmeta">
          <span>${pin} ${esc(v.area)}, ${esc(v.city)}</span>
          ${v.rating ? `<span>${star} ${v.rating}${v.reviews ? ` (${v.reviews} reviews)` : ""}</span>` : ""}
        </div>
        <div class="dprice">${esc(priceLine(v))}</div>
        <div class="dactions">
          <a class="btn btn-wa" target="_blank" rel="noopener" href="${waLink(waMsg)}">${icon('<path d="M21 12a9 9 0 01-13.2 7.9L4 21l1.1-3.7A9 9 0 1121 12z"/><path d="M9 9.5c.5 2.5 3 5 5.5 5.5l1-1.5 2.5 1c-.5 1.5-1.5 2-3 1.5-3.5-1-6.5-4-7.5-7.5-.5-1.5 0-2.5 1.5-3l1 2.5z"/>')} WhatsApp vendor</a>
          ${callBtn}
        </div>
        <div class="note">Tip: ShaadiSpot par listing free hai — vendor se direct baat karen, koi extra charges nahi.</div>
      </div></div>`;
    const sim = vendors.filter(x => x.id !== v.id && (x.category === v.category || x.city === v.city)).slice(0, 3);
    document.getElementById("similar").innerHTML = sim.map(card).join("");
  }

  return { home, listing, detail, waLink };
})();
