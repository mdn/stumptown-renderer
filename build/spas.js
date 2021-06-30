const fs = require("fs");
const path = require("path");

const {
  CONTENT_ROOT,
  CONTENT_TRANSLATED_ROOT,
  VALID_LOCALES,
} = require("../content");
const {
  BUILD_OUT_ROOT,
  HOMEPAGE_FEED_URL,
  HOMEPAGE_FEED_DISPLAY_MAX,
  BUILD_SUBSCRIPTION_CONFIG_URL,
} = require("./constants");
const { getFeedEntries } = require("./feedparser");
const { getSubscriptionConfig } = require("./subscriptionconfig");
// eslint-disable-next-line node/no-missing-require
const { renderHTML } = require("../ssr/dist/main");

function getLanguages() {
  return new Map(
    Object.entries(
      JSON.parse(fs.readFileSync(path.join(__dirname, "languages.json")))
    )
  );
}

async function buildSPAs(options) {
  let buildCount = 0;

  // The URL isn't very important as long as it triggers the right route in the <App/>
  const url = "/en-US/404.html";
  const html = renderHTML(url, { pageNotFound: true });
  const outPath = path.join(BUILD_OUT_ROOT, "en-us", "_spas");
  fs.mkdirSync(outPath, { recursive: true });
  fs.writeFileSync(path.join(outPath, path.basename(url)), html);
  buildCount++;
  if (options.verbose) {
    console.log("Wrote", path.join(outPath, path.basename(url)));
  }

  const subscriptionConfig = BUILD_SUBSCRIPTION_CONFIG_URL
    ? await getSubscriptionConfig(BUILD_SUBSCRIPTION_CONFIG_URL)
    : null;

  // Basically, this builds one (for example) `search/index.html` for every
  // locale we intend to build.
  for (const root of [CONTENT_ROOT, CONTENT_TRANSLATED_ROOT]) {
    if (!root) {
      continue;
    }
    for (const locale of fs.readdirSync(root)) {
      if (!fs.statSync(path.join(root, locale)).isDirectory()) {
        continue;
      }
      const SPAs = [
        { prefix: "search", pageTitle: "Search" },
        { prefix: "signin", pageTitle: "Sign in", noIndexing: true },
        { prefix: "signup", pageTitle: "Sign up", noIndexing: true },
        { prefix: "settings", pageTitle: "Account settings", noIndexing: true },
        { prefix: "plus", pageTitle: "Plus", noIndexing: true },
      ];
      for (const { prefix, pageTitle, noIndexing } of SPAs) {
        const url = `/${locale}/${prefix}`;
        const context = {
          pageTitle,
          locale: VALID_LOCALES.get(locale) || locale,
          noIndexing,
        };
        if (prefix === "settings") {
          // This SPA needs a list of all valid locales
          const languages = getLanguages();
          context.possibleLocales = [...VALID_LOCALES.values()].map(
            (locale) => {
              return Object.assign({ locale }, languages.get(locale));
            }
          );
        }
        const html = renderHTML(url, context);
        const outPath = path.join(BUILD_OUT_ROOT, locale, prefix);
        fs.mkdirSync(outPath, { recursive: true });
        const filePath = path.join(outPath, "index.html");
        fs.writeFileSync(filePath, html);
        buildCount++;
        if (options.verbose) {
          console.log("Wrote", filePath);
        }
        if (prefix === "settings") {
          const filePathContext = path.join(outPath, "index.json");
          fs.writeFileSync(
            filePathContext,
            JSON.stringify({ ...context, subscriptionConfig })
          );
          buildCount++;
          if (options.verbose) {
            console.log("Wrote", filePathContext);
          }
        }
      }
    }
  }

  // Build all the home pages in all locales.
  // Have the feed entries ready before building the home pages.
  // XXX disk caching?
  const feedEntries = (await getFeedEntries(HOMEPAGE_FEED_URL)).slice(
    0,
    HOMEPAGE_FEED_DISPLAY_MAX
  );
  for (const root of [CONTENT_ROOT, CONTENT_TRANSLATED_ROOT]) {
    if (!root) {
      continue;
    }
    for (const locale of fs.readdirSync(root)) {
      if (locale === "jsondata") {
        // This is actually not a locale but it's located next to the locales.
        continue;
      }
      if (!fs.statSync(path.join(root, locale)).isDirectory()) {
        continue;
      }
      const url = `/${locale}/`;
      // Each .pubDate in feedEntries is a Date object. That has to be converted
      // to a string. That way the SSR rendering is
      const dateFormatter = new Intl.DateTimeFormat(locale, {
        dateStyle: "full",
      });
      const context = {
        feedEntries: feedEntries.map((entry) => {
          const pubDateString = dateFormatter.format(entry.pubDate);
          return Object.assign({}, entry, { pubDate: pubDateString });
        }),
      };
      const html = renderHTML(url, context);
      const outPath = path.join(BUILD_OUT_ROOT, locale);
      fs.mkdirSync(outPath, { recursive: true });
      const filePath = path.join(outPath, "index.html");
      fs.writeFileSync(filePath, html);
      buildCount++;
      if (options.verbose) {
        console.log("Wrote", filePath);
      }
      // Also, dump the feed entries as a JSON file so the data can be gotten
      // in client-side rendering.
      const filePathContext = path.join(outPath, "index.json");
      fs.writeFileSync(filePathContext, JSON.stringify(context));
      buildCount++;
      if (options.verbose) {
        console.log("Wrote", filePathContext);
      }
    }
  }

  if (!options.quiet) {
    console.log(`Built ${buildCount} SPA related files`);
  }
}

module.exports = { buildSPAs };
