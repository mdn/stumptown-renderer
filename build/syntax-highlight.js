const Prism = require("prismjs");
const loadLanguages = require("prismjs/components/index");

const lazy = (creator) => {
  let res;
  let processed = false;
  return (...args) => {
    if (processed) return res;
    res = creator.apply(this, args);
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

const JS_KEYWORD_DOCS = {
  var: "Statements/var",
  let: "Statements/let",
  const: "Statements/const",

  import: "Statements/import",
  as: "Statements/import#rename_multiple_exports_during_import",
  export: "Statements/export",

  async: "Statements/async_function",

  class: "Statements/class",

  extends: "Classes/extends",

  if: "Statements/if...else",
  else: "Statements/if...else",

  switch: "Statements/switch",
  case: "Statements/switch",
  default: "Statements/switch",

  do: "Statements/do...while",
  while: "Statements/while",
  continue: "Statements/continue",

  break: "Statements/break",

  return: "Statements/return",

  throw: "Statements/throw",
  try: "Statements/try...catch",
  catch: "Statements/try...catch#conditional_catch-blocks",
  finally: "Statements/try...catch#the_finally-block",

  function: "Global_Objects/Function",
  null: "Global_Objects/null",
  undefined: "Global_Objects/undefined",

  new: "Operators/new",
  this: "Operators/this",
  super: "Operators/super",
  static: "Operators/static",

  delete: "Operators/delete",
  void: "Operators/void",
  typeof: "Operators/typeof",
  instanceof: "Operators/instanceof",
  await: "Operators/await",
  yield: "Operators/yield",

  get: "Functions/get",
  set: "Functions/set",
};

/**
 * Mutate the `$` instance for by looking for <pre> tags that can be
 * syntax highlighted with Prism.
 *
 */
function syntaxHighlight($, doc) {
  loadAllLanguages();

  // Our content will be like this: `<pre class="brush:js">` or
  // `<pre class="brush: js">` so we're technically not looking for an exact
  // match. The wildcard would technically match `<pre class="brushetta">`
  // too. But within the loop, we do a more careful regex on the class name
  // and only proceed if it's something sensible we can use in Prism.
  $("pre[class*=brush]").each((_, element) => {
    // The language is whatever string comes after the `brush(:)`
    // portion of the class name.
    const $pre = $(element).wrapAll("<div class='code-example'>");

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

    let hasLinks = false;

    if (name == "js") {
      $code.find(".keyword").each((i, el) => {
        const $el = $(el);
        const keyword = $el.text();
        const slug = JS_KEYWORD_DOCS[keyword];
        if (slug) {
          hasLinks = true;
          $el.empty().append(
            $("<a>")
              .attr({
                href: `/${doc.locale}/docs/Web/JavaScript/Reference/${slug}`,
                draggable: false,
              })
              .addClass("code-reference-link")
              .text(keyword)
          );
        }
      });
    }

    if (hasLinks) {
      $pre.parent().append(
        $(
          "<div><em>You can click underlined keywords to open their reference docs.</em></div>"
        ).css({
          "border-left": "6px solid #00458b",
          margin: "-24px 0 24px 0",
          "padding-left": "24px",
          background: "#e6e6e6",
        })
      );
    }

    $pre.empty().append($code);
  });
}

module.exports = { syntaxHighlight };
