(() => {
  const escapeHtml = (value) => String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

  const resolveHref = (href) => {
    if (!href) return "#";
    if (/^(https?:|mailto:|#)/.test(href)) return href;
    const base = document.querySelector('meta[name="site_url"]')?.content;
    if (base) return new URL(href, base).href;

    const path = window.location.pathname;
    const marker = "/1A-Field-Guide-Site/";
    const markerIndex = path.indexOf(marker);
    const root = markerIndex >= 0 ? path.slice(0, markerIndex + marker.length) : "/";
    return `${root}${href}`.replace(/\/+/g, "/");
  };

  const render = (root, research) => {
    if (!Array.isArray(research) || research.length === 0) {
      root.innerHTML = "<p>No public investigations are listed yet.</p>";
      return;
    }

    const ordered = [...research].sort((a, b) => Number(Boolean(b.lead)) - Number(Boolean(a.lead)));
    root.innerHTML = ordered.map((item, index) => {
      const leadClass = item.lead ? " investigation-card--lead" : "";
      const phase = item.phase ? `<span class="investigation-card__phase">${escapeHtml(item.phase)}</span>` : "";
      const question = item.question ? `<p class="investigation-card__question"><strong>Open question:</strong> ${escapeHtml(item.question)}</p>` : "";
      const updated = item.last_updated ? `<span>Updated ${escapeHtml(item.last_updated)}</span>` : "";
      const jurisdiction = item.jurisdiction ? `<span>${escapeHtml(item.jurisdiction)}</span>` : "";
      const region = item.region ? `<span>${escapeHtml(item.region)}</span>` : "";
      const facilityLink = item.facility_href
        ? `<a class="investigation-card__secondary" href="${resolveHref(item.facility_href)}">Facility record</a>`
        : "";

      return `
        <article class="investigation-card${leadClass}">
          <div class="investigation-card__index">${String(index + 1).padStart(2, "0")}</div>
          <div class="investigation-card__body">
            <div class="investigation-card__eyebrow">
              <span class="investigation-card__status">${escapeHtml(item.status || "RESEARCH")}</span>
              ${phase}
            </div>
            <h2><a href="${resolveHref(item.href)}">${escapeHtml(item.title)}</a></h2>
            <div class="investigation-card__meta">${jurisdiction}${region}${updated}</div>
            <p>${escapeHtml(item.summary || "")}</p>
            ${question}
            <div class="investigation-card__actions">
              <a href="${resolveHref(item.href)}">Open research file</a>
              ${facilityLink}
            </div>
          </div>
        </article>`;
    }).join("");
  };

  const init = async () => {
    const root = document.querySelector("#investigations-live");
    if (!root) return;
    const source = root.dataset.projectState || "../data/project-state.json";

    try {
      const response = await fetch(source, { cache: "no-store" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const state = await response.json();
      render(root, state.research);
    } catch (error) {
      root.innerHTML = `<p class="investigations-error">Current investigation state could not be loaded. The research pages remain available through site navigation.</p>`;
      console.error("Investigation index state load failed", error);
    }
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
