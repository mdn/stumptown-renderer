const { buildURL, execGit } = require("./utils");
const { htmlPathToSlugAndLocale } = require("./document");
const { CONTENT_ROOT } = require("./constants");

const UPSTREAM_URLS = [
  "https://github.com/mdn/content.git",
  "git@github.com:mdn/content.git",
];
const PR_URL_RE = /^https:\/\/github\.com\/mdn\/content\/pull\/(\d+)$/i;
const TMP_BRANCH = "___content-preview";

function getUpstreamName() {
  try {
    const remotes = execGit(["remote", "show"]).trim().split("\n");
    return remotes.find((r) => {
      const url = execGit(["remote", "get-url", r]);
      return UPSTREAM_URLS.includes(url);
    });
  } catch (e) {
    throw new Error(`unable to determine upstream: ${e}`);
  }
}

function getPRId(url) {
  const [, id] = PR_URL_RE.exec(url) || [];
  return id;
}

function checkoutPR(url) {
  const upstream = getUpstreamName();
  const id = getPRId(url);
  if (!upstream || !id) {
    throw new Error(`not a PR: ${url}`);
  }
  try {
    execGit(["checkout", "main"]);
    execGit(["branch", "-D", TMP_BRANCH]);
    execGit(["fetch", upstream]);
    execGit(["fetch", upstream, `pull/${id}/head:${TMP_BRANCH}`]);
    execGit(["checkout", TMP_BRANCH]);
  } catch (e) {
    throw new Error(`unable to checkout PR: ${e}`);
  }
  try {
    execGit(["merge", "--no-ff", `${upstream}/main`]);
  } catch (e) {
    throw new Error(`cannot merge main, please resolve conflicts: ${e}`);
  }
  try {
    const gitRoot = execGit(["rev-parse", "--show-toplevel"], CONTENT_ROOT);
    const changed = execGit(["diff", "--name-only", `${upstream}/main`]).split(
      "\n"
    );
    return changed.map((p) => {
      const { slug, locale } = htmlPathToSlugAndLocale(p, gitRoot);
      const url = buildURL(locale, slug);
      return { slug, locale, url };
    });
  } catch (e) {
    throw new Error(`unable to diff: ${e}`);
  }
}

module.exports = {
  getPRId,
  checkoutPR,
};
