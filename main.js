const CACHE_KEY = "gh-repos-cache";
const CACHE_TTL = 3600000;

function readCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { timestamp, data } = JSON.parse(raw);
    if (Date.now() - timestamp > CACHE_TTL) return null;
    return data;
  } catch {
    return null;
  }
}

function writeCache(data) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ timestamp: Date.now(), data }));
  } catch {}
}

const escapeHTML = (str) =>
  str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const policy = trustedTypes.createPolicy("repo-policy", {
  createHTML: (input) => input,
});

let repoData = readCache();

if (!repoData) {
  const response = await fetch(
    "https://api.github.com/users/lindgrenleonard/repos",
  );
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const repositories = await response.json();
  const sortedRepos = repositories
    .filter((a) => a.fork === false)
    .toSorted((a, b) => new Date(a.pushed_at) - new Date(b.pushed_at));

  const languages = await Promise.all(
    sortedRepos.map((repo) => fetch(repo.languages_url).then((r) => r.json())),
  );

  repoData = sortedRepos.map((repo, i) => ({
    repo,
    languages: Object.keys(languages[i]),
  }));

  writeCache(repoData);
}

const html = repoData
  .map(({ repo, languages }) => {
    const langs = languages
      .map((l) => `<span class="lang-tag">${escapeHTML(l)}</span>`)
      .join("");
    return `<div class="repo-card">
      <div class="repo-header">
        <h2><a href="${escapeHTML(repo.html_url)}" target="_blank" rel="noopener">${escapeHTML(repo.name)}</a></h2>
        <div class="repo-langs">${langs}</div>
      </div>
      <p>${repo.description ? escapeHTML(repo.description) : "Have not gotten around to writing a description for this one"}</p>
    </div>`;
  })
  .join("");

document.querySelector("main").innerHTML = policy.createHTML(html);
