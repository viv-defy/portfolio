async function loadNotes() {
  const res = await fetch("/notes/search.json", { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load notes index");
  return res.json();
}

function uniqSorted(arr) {
  return Array.from(new Set(arr.filter(Boolean))).sort((a, b) =>
    a.localeCompare(b),
  );
}

function getHashParam(key) {
  const hash = window.location.hash.startsWith("#")
    ? window.location.hash.slice(1)
    : window.location.hash;
  const params = new URLSearchParams(hash);
  return params.get(key) || "";
}

function setHashParam(key, value) {
  const hash = window.location.hash.startsWith("#")
    ? window.location.hash.slice(1)
    : window.location.hash;
  const params = new URLSearchParams(hash);
  if (value) params.set(key, value);
  else params.delete(key);
  const next = params.toString();
  window.location.hash = next ? `#${next}` : "";
}

function renderList(el, items) {
  if (!items.length) {
    el.innerHTML =
      '<li><strong>No matches.</strong><div class="meta">Try a different query or tag.</div></li>';
    return;
  }
  el.innerHTML = items
    .map((n) => {
      const tagText = Array.isArray(n.tags) && n.tags.length ? n.tags.join(", ") : "";
      const meta = [n.date, tagText].filter(Boolean).join(" · ");
      return `<li>
        <a href="${n.url}">${escapeHtml(n.title || "Untitled")}</a>
        <div class="meta">${escapeHtml(meta)}</div>
      </li>`;
    })
    .join("");
}

function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

(async function main() {
  const input = document.getElementById("q");
  const select = document.getElementById("tag");
  const results = document.getElementById("results");

  const notes = await loadNotes();
  const allTags = uniqSorted(
    notes.flatMap((n) => (Array.isArray(n.tags) ? n.tags : [])),
  );

  for (const n of notes) {
    n.tagsText = Array.isArray(n.tags) ? n.tags.join(" ") : "";
  }

  for (const t of allTags) {
    const opt = document.createElement("option");
    opt.value = t;
    opt.textContent = `#${t}`;
    select.appendChild(opt);
  }

  const idx = lunr(function () {
    this.ref("id");
    this.field("title");
    this.field("content");
    this.field("tagsText");
    for (const n of notes) this.add(n);
  });

  function applyFromUI({ pushHash = true } = {}) {
    const q = input.value.trim();
    const tag = select.value;

    if (pushHash) {
      setHashParam("q", q);
      setHashParam("tag", tag);
    }

    let filtered = notes;
    if (tag) filtered = filtered.filter((n) => Array.isArray(n.tags) && n.tags.includes(tag));

    if (!q) {
      renderList(results, filtered.slice(0, 200));
      return;
    }

    const lunrQuery = tag ? `${q} tagsText:${tag}` : q;
    const matches = idx.search(lunrQuery);
    const ranked = matches
      .map((m) => filtered.find((n) => String(n.id) === String(m.ref)))
      .filter(Boolean);

    renderList(results, ranked.slice(0, 200));
  }

  function applyFromHash() {
    const q = getHashParam("q");
    const tag = getHashParam("tag");
    input.value = q;
    select.value = tag;
    applyFromUI({ pushHash: false });
  }

  input.addEventListener("input", () => applyFromUI());
  select.addEventListener("change", () => applyFromUI());
  window.addEventListener("hashchange", applyFromHash);

  applyFromHash();
})().catch((err) => {
  const results = document.getElementById("results");
  if (results) {
    results.innerHTML = `<li><strong>Error loading notes index.</strong><div class="meta">${escapeHtml(
      err?.message || String(err),
    )}</div></li>`;
  }
});
