const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const cliProgress = require("cli-progress");
const program = require("@caporal/core").default;
const { prompt } = require("inquirer");

const { Document, slugToFolder } = require("../content");
// eslint-disable-next-line node/no-missing-require
const { renderDocHTML, renderHTML } = require("../ssr/dist/main");

const options = require("./build-options");
const { buildDocument, renderContributorsTxt } = require("./index");
const SearchIndex = require("./search-index");
const {
  BUILD_OUT_ROOT,
  GIT_RECENT_HOURS,
  HOMEPAGE_FEED_URL,
  HOMEPAGE_FEED_DISPLAY_MAX,
} = require("./constants");
const { makeSitemapXML, makeSitemapIndexXML } = require("./sitemaps");
const {
  CONTENT_TRANSLATED_ROOT,
  CONTENT_ROOT,
  CONTENT_ARCHIVED_ROOT,
} = require("../content/constants");
const { uniqifyTranslationsOf } = require("./translationsof");
const { humanFileSize } = require("./utils");
const { getRecentGitFiles } = require("./git-history");
const { getFeedEntries } = require("./feedparser");

async function buildDocumentInteractive(
  documentPath,
  translationsOf,
  interactive,
  invalidate = false
) {
  try {
    const document = invalidate
      ? Document.read(documentPath, Document.MEMOIZE_INVALIDATE)
      : Document.read(documentPath);

    const { translation_of } = document.metadata;

    // If it's a non-en-US document, it'll most likely have a `translation_of`.
    // If so, add it to the map so that when we build the en-US one, we can
    // get an index of the *other* translations available.
    if (translation_of) {
      if (!translationsOf.has(translation_of)) {
        translationsOf.set(translation_of, []);
      }
      const translation = {
        url: document.url,
        locale: document.metadata.locale,
        title: document.metadata.title,
      };
      if (document.metadata.translation_of_original) {
        translation.original = document.metadata.translation_of_original;
      }
      translationsOf.get(translation_of).push(translation);
      // This is a shortcoming. If this is a translated document, we don't have a
      // complete mapping of all other translations. So, the best we can do is
      // at least link to the English version.
      // In 2021, when we refactor localization entirely, this will need to change.
      // Perhaps, then, we'll do a complete scan through all content first to build
      // up the map before we process each one.
      document.translations = [];
    } else if (translationsOf.has(document.metadata.slug)) {
      document.translations = uniqifyTranslationsOf(
        translationsOf.get(document.metadata.slug),
        document.url
      );
    }
    return { document, doc: await buildDocument(document), skip: false };
  } catch (e) {
    if (!interactive) {
      throw e;
    }
    console.error(e);
    const { action } = await prompt([
      {
        type: "list",
        message: "What to do?",
        name: "action",
        choices: [
          { name: "re-run", value: "r" },
          { name: "skip", value: "s" },
          { name: "quit", value: "q" },
        ],
        default: "r",
      },
    ]);
    if (action === "r") {
      return await buildDocumentInteractive(
        documentPath,
        translationsOf,
        interactive,
        true
      );
    }
    if (action === "s") {
      return { doc: {}, skip: true };
    }
    throw e;
  }
}

async function buildDocuments(
  files = null,
  quiet = false,
  interactive = false
) {
  // If a list of files was set, it came from the CLI.
  // Override whatever was in the build options.
  const findAllOptions = files
    ? Object.assign({}, options, { files: new Set(files) })
    : options;

  const documents = Document.findAll(findAllOptions);
  const progressBar = new cliProgress.SingleBar(
    {},
    cliProgress.Presets.shades_grey
  );

  const docPerLocale = {};
  const searchIndex = new SearchIndex();

  if (!documents.count) {
    throw new Error("No documents to build found");
  }

  let peakHeapBytes = 0;

  // For keeping track of the total counts of flaws
  const totalFlaws = new Map();

  function appendTotalFlaws(flaws) {
    for (const [key, actualFlaws] of Object.entries(flaws)) {
      const count = actualFlaws.length;
      if (!totalFlaws.has(key)) {
        totalFlaws.set(key, 0);
      }
      totalFlaws.set(key, totalFlaws.get(key) + count);
    }
  }

  // This builds up a mapping from en-US slugs to their translated slugs.
  const translationsOf = new Map();

  if (files && CONTENT_TRANSLATED_ROOT && !interactive) {
    // Normally, when `files` is set, it won't scan all translated content
    // to build up a complete(ish) map of all translations to each other.
    // But if specific files are only considered it won't get the chance,
    // so we have to manually prepare it.
    // XXX NOTE This will become a LOT simpler once all translated content
    // has no slugs of their own any more.
    const allDocuments = Document.findAll();
    for (const document of allDocuments.iter()) {
      if (!document.isTranslated) {
        continue;
      }
      const { translation_of, locale, title } = document.metadata;
      if (!translation_of) continue; // junk
      if (!translationsOf.has(translation_of)) {
        translationsOf.set(translation_of, []);
      }
      translationsOf.get(translation_of).push({
        url: document.url,
        locale,
        title,
      });
    }
  }

  if (!options.noProgressbar) {
    progressBar.start(documents.count);
  }

  for (const documentPath of documents.iter({ pathOnly: true })) {
    const {
      doc: { doc: builtDocument, liveSamples, fileAttachments, bcdData },
      document,
      skip,
    } = await buildDocumentInteractive(
      documentPath,
      translationsOf,
      interactive
    );
    if (skip) {
      continue;
    }

    const outPath = path.join(BUILD_OUT_ROOT, slugToFolder(document.url));
    fs.mkdirSync(outPath, { recursive: true });

    if (builtDocument.flaws) {
      appendTotalFlaws(builtDocument.flaws);
    }

    fs.writeFileSync(
      path.join(outPath, "index.html"),
      renderDocHTML(builtDocument, document.url)
    );
    fs.writeFileSync(
      path.join(outPath, "index.json"),
      // This is exploiting the fact that renderDocHTML has the side-effect of
      // mutating the built document which makes this not great and refactor-worthy.
      JSON.stringify({ doc: builtDocument })
    );
    // There are some archived documents that, due to possible corruption or other
    // unknown reasons, don't have a list of contributors.
    if (document.metadata.contributors || !document.isArchive) {
      fs.writeFileSync(
        path.join(outPath, "contributors.txt"),
        renderContributorsTxt(
          document.metadata.contributors,
          !document.isArchive
            ? builtDocument.source.github_url.replace("/blob/", "/commits/")
            : null
        )
      );
    }
    for (const { url, data } of bcdData) {
      fs.writeFileSync(
        path.join(outPath, path.basename(url)),
        JSON.stringify(data, (key, value) => {
          // The BCD data object contains a bunch of data we don't need in the
          // React component that loads the `bcd.json` file and displays it.
          // The `.releases` block contains information about browsers (e.g
          // release dates) and that part has already been extracted and put
          // next to each version number where appropriate.
          if (key === "releases") {
            return undefined;
          }
          // TODO: Instead of serializing with a exclusion, instead explicitly
          // serialize exactly only the data that is needed.
          return value;
        })
      );
    }

    for (const { id, html } of liveSamples) {
      const liveSamplePath = path.join(outPath, "_samples_", id, "index.html");
      fs.mkdirSync(path.dirname(liveSamplePath), { recursive: true });
      fs.writeFileSync(liveSamplePath, html);
    }

    for (const filePath of fileAttachments) {
      // We *could* use symlinks instead. But, there's no point :)
      // Yes, a symlink is less disk I/O but it's nominal.
      fs.copyFileSync(filePath, path.join(outPath, path.basename(filePath)));
    }

    // Collect non-archived documents' slugs to be used in sitemap building and
    // search index building.
    if (!document.noIndexing) {
      const { locale, slug } = document.metadata;
      if (!docPerLocale[locale]) {
        docPerLocale[locale] = [];
      }
      docPerLocale[locale].push({
        slug,
        modified: document.metadata.modified,
      });

      searchIndex.add(document);
    }

    if (!options.noProgressbar) {
      progressBar.increment();
    } else if (!quiet) {
      console.log(outPath);
    }
    const heapBytes = process.memoryUsage().heapUsed;
    if (heapBytes > peakHeapBytes) {
      peakHeapBytes = heapBytes;
    }
  }

  if (!options.noProgressbar) {
    progressBar.stop();
  }

  const sitemapsBuilt = [];
  for (const [locale, docs] of Object.entries(docPerLocale)) {
    const sitemapDir = path.join(
      BUILD_OUT_ROOT,
      "sitemaps",
      locale.toLowerCase()
    );
    fs.mkdirSync(sitemapDir, { recursive: true });
    const sitemapFilePath = path.join(sitemapDir, "sitemap.xml.gz");
    fs.writeFileSync(
      sitemapFilePath,
      zlib.gzipSync(makeSitemapXML(locale, docs))
    );
    sitemapsBuilt.push(sitemapFilePath);
  }

  // Only if you've just built all of CONTENT_ROOT and all of CONTENT_TRANSLATED_ROOT
  // do we bother generating the combined sitemaps index file.
  // That means, that if you've done this at least once, consequent runs of
  // *only* CONTENT_ROOT will just keep overwriting the sitemaps/en-us/sitemap.xml.gz.
  if (CONTENT_TRANSLATED_ROOT) {
    const sitemapIndexFilePath = path.join(BUILD_OUT_ROOT, "sitemap.xml");
    fs.writeFileSync(
      sitemapIndexFilePath,
      makeSitemapIndexXML(
        sitemapsBuilt.map((fp) => fp.replace(BUILD_OUT_ROOT, ""))
      )
    );
  }

  searchIndex.sort();
  for (const [locale, items] of Object.entries(searchIndex.getItems())) {
    fs.writeFileSync(
      path.join(BUILD_OUT_ROOT, locale.toLowerCase(), "search-index.json"),
      JSON.stringify(items)
    );
  }
  return { slugPerLocale: docPerLocale, peakHeapBytes, totalFlaws };
}

async function buildOtherSPAs(options) {
  // The URL isn't very important as long as it triggers the right route in the <App/>
  const url = "/en-US/404.html";
  const html = renderHTML(url, { pageNotFound: true });
  const outPath = path.join(BUILD_OUT_ROOT, "en-us", "_spas");
  fs.mkdirSync(outPath, { recursive: true });
  fs.writeFileSync(path.join(outPath, path.basename(url)), html);
  if (!options.quiet) {
    console.log("Wrote", path.join(outPath, path.basename(url)));
  }

  // Basically, this builds one `search/index.html` for every locale we intend
  // to build.
  for (const root of [CONTENT_ROOT, CONTENT_TRANSLATED_ROOT]) {
    if (!root) {
      continue;
    }
    for (const locale of fs.readdirSync(root)) {
      if (!fs.statSync(path.join(root, locale)).isDirectory()) {
        continue;
      }
      const url = `/${locale}/search`;
      const html = renderHTML(url);
      const outPath = path.join(BUILD_OUT_ROOT, locale, "search");
      fs.mkdirSync(outPath, { recursive: true });
      const filePath = path.join(outPath, "index.html");
      fs.writeFileSync(filePath, html);
      if (!options.quiet) {
        console.log("Wrote", filePath);
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
      if (!options.quiet) {
        console.log("Wrote", filePath);
      }
      // Also, dump the feed entries as a JSON file so the data can be gotten
      // in client-side rendering.
      const filePathContext = path.join(outPath, "index.json");
      fs.writeFileSync(filePathContext, JSON.stringify(context));
      if (!options.quiet) {
        console.log("Wrote", filePathContext);
      }
    }
  }
}

function formatTotalFlaws(flawsCountMap, header = "Total_Flaws_Count") {
  if (!flawsCountMap.size) {
    return "";
  }
  const keys = [...flawsCountMap.keys()];
  const longestKey = Math.max(...keys.map((k) => k.length));
  const out = ["\n"];
  out.push(header);
  for (const key of keys.sort()) {
    out.push(
      `${key.padEnd(longestKey + 1)} ${flawsCountMap.get(key).toLocaleString()}`
    );
  }
  out.push("\n");
  return out.join("\n");
}

program
  .name("build")
  .option("--spas", "Build the SPA pages", { default: true }) // PR builds
  .option("--spas-only", "Only build the SPA pages", { default: false })
  .option("-i, --interactive", "Ask what to do when encountering flaws", {
    default: false,
  })
  .option(
    "-g, --git-recent-hours",
    "Use the git history to find specific files changed in the last X hours",
    {
      default: GIT_RECENT_HOURS,
      validator: (value) => {
        if (value === null) {
          return null;
        }
        const hours = parseInt(value);
        if (isNaN(hours)) {
          throw new Error(`'${value}' is not a number`);
        }
        if (hours < 1) {
          throw new Error("Minimum is 1 hour");
        }
        return hours;
      },
    }
  )
  .argument("[files...]", "specific files to build")
  .action(async ({ args, options }) => {
    try {
      if (options.spas) {
        if (!options.quiet) {
          console.log("\nBuilding SPAs...");
        }
        await buildOtherSPAs(options);
      }
      if (options.spasOnly) {
        return;
      }

      if (!options.quiet && !options.gitRecentHours) {
        console.log("\nBuilding Documents from...");
        console.log(CONTENT_ROOT);
        if (CONTENT_TRANSLATED_ROOT) {
          console.log(CONTENT_TRANSLATED_ROOT);
        }
        if (CONTENT_ARCHIVED_ROOT) {
          console.log(CONTENT_ARCHIVED_ROOT);
        }
      }
      const gitFiles = options.gitRecentHours
        ? getRecentGitFiles(CONTENT_ROOT, options.gitRecentHours)
        : null;
      if (gitFiles) {
        if (gitFiles.length) {
          console.log(`Found ${gitFiles.length} recently modified in git!`);
        } else {
          console.log("Nothing recently modified in git");
          return;
        }
      }

      const { files } = args;
      const t0 = new Date();
      const { slugPerLocale, peakHeapBytes, totalFlaws } = await buildDocuments(
        gitFiles || files,
        Boolean(options.quiet),
        Boolean(options.interactive)
      );
      const t1 = new Date();
      const count = Object.values(slugPerLocale).reduce(
        (a, b) => a + b.length,
        0
      );
      const seconds = (t1 - t0) / 1000;
      const took =
        seconds > 60
          ? `${(seconds / 60).toFixed(1)} minutes`
          : `${seconds.toFixed(1)} seconds`;
      if (!options.quiet) {
        console.log(
          `Built ${count.toLocaleString()} pages in ${took}, at a rate of ${(
            count / seconds
          ).toFixed(1)} documents per second.`
        );
        console.log(`Peak heap memory usage: ${humanFileSize(peakHeapBytes)}`);
        console.log(formatTotalFlaws(totalFlaws));
      }
    } catch (error) {
      // So you get a stacktrace in the CLI output
      console.error(error);
      // So that the CLI ultimately fails
      throw error;
    }
  });

program.run();
