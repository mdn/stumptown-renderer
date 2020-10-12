const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const cliProgress = require("cli-progress");

const { Document, slugToFolder } = require("../content");
const { renderHTML } = require("../ssr/dist/main");

const options = require("./build-options");
const { buildDocument, renderContributorsTxt } = require("./index");
const SearchIndex = require("./search-index");
const { BUILD_OUT_ROOT } = require("./constants");
const { makeSitemapXML, makeSitemapIndexXML } = require("./sitemaps");
const { CONTENT_TRANSLATED_ROOT } = require("../content/constants");

async function buildDocuments() {
  const documents = Document.findAll(options);
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

  // This builds up a mapping from en-US slugs to their translated slugs.
  const translationsOf = new Map();

  !options.noProgressbar && progressBar.start(documents.count);
  for (const document of documents.iter()) {
    const outPath = path.join(BUILD_OUT_ROOT, slugToFolder(document.url));
    fs.mkdirSync(outPath, { recursive: true });

    const { translation_of } = document.metadata;

    // If it's a non-en-US document, it'll most likely have a `translation_of`.
    // If so, add it to the map so that when we build the en-US one, we can
    // get an index of the *other* translations available.
    if (translation_of) {
      if (!translationsOf.has(translation_of)) {
        translationsOf.set(translation_of, []);
      }
      translationsOf.get(translation_of).push({
        slug: document.metadata.slug,
        locale: document.metadata.locale,
      });
      // This is a shortcoming. If this is a translated document, we don't have a
      // complete mapping of all other translations. So, the best we can do is
      // at least link to the English version.
      // In 2021, when we refactor localization entirely, this will need to change.
      // Perhaps, then, we'll do a complete scan through all content first to build
      // up the map before we process each one.
      document.translations = [];
    } else {
      document.translations = translationsOf.get(document.metadata.slug);
    }

    const [builtDocument, liveSamples, fileAttachments] = await buildDocument(
      document
    );

    fs.writeFileSync(
      path.join(outPath, "index.html"),
      renderHTML(builtDocument, document.url)
    );
    fs.writeFileSync(
      path.join(outPath, "index.json"),
      // This is exploiting the fact that renderHTML has the side-effect of mutating builtDocument
      // which makes this not great and refactor-worthy
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

    // Decide whether it should be indexed (sitemaps, robots meta tag, search-index)
    document.noIndexing =
      (document.isArchive && !document.isTranslated) ||
      document.metadata.slug === "MDN/Kitchensink";

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
    } else {
      console.log(outPath);
    }
    const heapBytes = process.memoryUsage().heapUsed;
    if (heapBytes > peakHeapBytes) {
      peakHeapBytes = heapBytes;
    }
  }

  !options.noProgressbar && progressBar.stop();

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
  return { slugPerLocale: docPerLocale, peakHeapBytes };
}

function humanFileSize(size) {
  if (size < 1024) return size + " B";
  let i = Math.floor(Math.log(size) / Math.log(1024));
  let num = size / Math.pow(1024, i);
  let round = Math.round(num);
  num = round < 10 ? num.toFixed(2) : round < 100 ? num.toFixed(1) : round;
  return `${num} ${"KMGTPEZY"[i - 1]}B`;
}

if (require.main === module) {
  const t0 = new Date();
  buildDocuments()
    .then(({ slugPerLocale, peakHeapBytes }) => {
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
      console.log(
        `Built ${count.toLocaleString()} in ${took}, at a rate of ${(
          count / seconds
        ).toFixed(1)} documents per second.`
      );
      console.log(`Peak heap memory usage: ${humanFileSize(peakHeapBytes)}`);
    })
    .catch((error) => {
      console.error("error while building documents:", error);
      process.exit(1);
    });
}
