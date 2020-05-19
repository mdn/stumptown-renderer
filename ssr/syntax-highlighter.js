const cheerio = require("cheerio");
const Prism = require("prismjs");

// Memoization cache for getPrismPluginName()
const _prismPluginNames = new Map();

function getPrismPluginName(classList) {
  const cacheKey = classList.join("");
  if (_prismPluginNames.has(cacheKey)) {
    return _prismPluginNames.get(cacheKey);
  }
  for (let cls of classList) {
    if (/language-\w+/.test(cls)) {
      const name = cls.replace(/^language-/, "").trim();
      if (Prism.languages[name]) {
        _prismPluginNames.set(cacheKey, name);
        return name;
      } else {
        // console.warn(
        //   `Looks like a syntax highlighting marker but not found as a Prism plugin: ${name}`
        // );
      }
    }
  }
  // No good match
  _prismPluginNames.set(cacheKey, null);
  return null;
}

function fixSyntaxHighlighting(document) {
  if (!document.body) {
    throw new Error("Expecting document.body and it being an array");
  }

  // Loop over all prose sections that look for <pre><code> blocks
  // that might have a syntax highlighting marker.
  document.body
    .filter((section) => {
      return (
        section.type === "prose" &&
        section.value &&
        section.value.content &&
        // This is an optimization. Very roughly,
        // only 1 in 5 prose sections has a <pre> tag in it. If it doesn't
        // have one there's no point loading up `cheerio.load(...)`
        // and doing selector lookups on it. So this is our
        // chance to avoid bothering.
        section.value.content.includes("</pre>")
      );
    })
    .forEach((section) => {
      const $ = cheerio.load(section.value.content);
      let mutations = 0;
      $("pre > code").each((_, blob) => {
        const elem = $(blob);
        const cls = elem.attr("class");
        if (!cls) return; // bail!
        const classList = cls.split(/\s+/);
        const prismPluginName = getPrismPluginName(classList);
        if (!prismPluginName) return; // bail!
        const code = elem.text();
        const html = Prism.highlight(
          code,
          Prism.languages[prismPluginName],
          prismPluginName
        );
        elem.html(html);
        mutations++;
      });

      if (!mutations) {
        // Legacy ones that haven't come from Markdown
        $("pre[class^=brush]").each((_, blob) => {
          const elem = $(blob);
          const name = elem
            .attr("class")
            .replace(/^brush:/, "")
            .trim();
          const prismLang = Prism.languages[name];
          if (!prismLang) {
            return; // bail!
          }
          const code = elem.text();
          const html = Prism.highlight(code, prismLang, name);
          elem.html(html);
          mutations++;
        });
      }
      if (mutations) {
        section.value.content = $.html();
      }
    });

  // Now loop over, and mutate, all 'example' sections
  document.body
    .filter((section) => section.type === "examples")
    .forEach((section) => {
      section.value.examples
        .filter((block) => block.sources)
        .forEach((block) => {
          highlightSources(block.sources);
        });
    });
}

function highlightSources(sources) {
  Object.entries(sources).forEach(([key, source]) => {
    if (Prism.languages[key]) {
      const html = Prism.highlight(source, Prism.languages[key], key);
      sources[`${key}_html`] = html;
    }
  });
}

module.exports = { fixSyntaxHighlighting };
