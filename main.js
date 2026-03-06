const escapeHTML = (str) =>
  str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const policy = trustedTypes.createPolicy("repo-policy", {
  createHTML: (input) => input,
});

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

const html = sortedRepos
  .map((repo, i) => {
    const langs = Object.keys(languages[i])
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
