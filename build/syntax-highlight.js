const Prism = require("prismjs");
const loadLanguages = require("prismjs/components/index");

const lazy = (creator) => {
  let res;
  let processed = false;
  return () => {
    if (processed) return res;
    res = creator.apply(this, arguments);
    processed = true;
    return res;
  };
};

const loadAllLanguages = lazy(() => {
  loadLanguages([
    "python",
    "bash",
    "sql",
    "json",
    "glsl",
    "php",
    "cpp",
    "java",
    "http",
    "wasm",
    "rust",
    "toml",
  ]);
});

// Add things to this list to help make things convenient. Sometimes
// there are `<pre class="brush: foo">` whose name is not that which
// Prism expects. It'd be hard to require that content writers
// have to stick to the exact naming conventions that Prism uses
// because Prism is an implementation detail.
const ALIASES = new Map([["sh", "shell"]]);

// Over the years we have accumulated some weird <pre> tags whose
// brush is more or less "junk".
// TODO: Perhaps, if you have a doc with <pre> tags that matches
// this, it should become a flaw.
const IGNORE = new Set(["none", "text", "plain", "unix"]);

/**
 * Mutate the `$` instance for by looking for <pre> tags that can be
 * syntax highlighted with Prism.
 *
 */
function syntaxHighlight($, doc) {
  loadAllLanguages();

  // First flag all `<pre>` tags that are inside a hidden container as hidden.
  // This way, when we iterate over the `<pre>` tags we can know that we can
  // ignore it because it's visually hidden.
  $("div.hidden pre").addClass("hidden");

  // Our content will be like this: `<pre class="brush:js">` or
  // `<pre class="brush: js">` so we're technically not looking for an exact
  // match. The wildcard would technically match `<pre class="brushetta">`
  // too. But within the loop, we do a more careful regex on the class name
  // and only proceed if it's something sensible we can use in Prism.
  $("pre[class*=brush]").each((_, element) => {
    // The language is whatever string comes after the `brush(:)`
    // portion of the class name.
    const $pre = $(element);

    if ($pre.hasClass("hidden")) {
      // Unfortunately, there's no way to avoid this.
      // Ideally, we should only bother going into `<pre>` tags according to:
      //   1. Contains `brush` (e.g. `brush:` or `brush:js`)
      //   2. Does *not* have `hidden`
      // But it's not possible with cheerio. An early exit is reasonably fast.
      return;
    }

    const className = $pre.attr("class").toLowerCase();
    const match = className.match(/brush:?\s*([\w_-]+)/);
    if (!match) {
      return;
    }
    const name = ALIASES.get(match[1]) || match[1];
    if (IGNORE.has(name)) {
      // Seems to exist a couple of these in our docs. Just bail.
      return;
    }
    const grammar = Prism.languages[name];
    if (!grammar) {
      console.warn(
        `Unable to find a Prism grammar for '${name}' found in ${doc.mdn_url}`
      );
      return; // bail!
    }
    const code = $pre.text();
    const html = Prism.highlight(code, grammar, name);
    const $code = $("<code>").html(html);
    $pre.empty().append($code);
  });
}

module.exports = { syntaxHighlight };
