const fs = require("fs");
const path = require("path");

const chalk = require("chalk");
const cheerio = require("cheerio");

const {
  Document,
  CONTENT_ROOT,
  Image,
  REPOSITORY_URLS,
  execGit,
} = require("../content");
const kumascript = require("../kumascript");
const Parser = require("../kumascript/src/parser.js");
const { normalizeMacroName } = require("../kumascript/src/render.js");

const { FLAW_LEVELS } = require("./constants");
const {
  extractSections,
  extractSidebar,
  extractSummary,
} = require("./document-extractor");
const SearchIndex = require("./search-index");
const { addBreadcrumbData } = require("./document-utils");
const { fixFixableFlaws, injectFlaws, injectSectionFlaws } = require("./flaws");
const { normalizeBCDURLs, extractBCDData } = require("./bcd-urls");
const { checkImageReferences, checkImageWidths } = require("./check-images");
const { getPageTitle } = require("./page-title");
const { syntaxHighlight } = require("./syntax-highlight");
const buildOptions = require("./build-options");
const { gather: gatherGitHistory } = require("./git-history");
const { buildSPAs } = require("./spas");
const { renderCache: renderKumascriptCache } = require("../kumascript");
const LANGUAGES_RAW = require("../content/languages.json");

const LANGUAGES = new Map(
  Object.entries(LANGUAGES_RAW).map(([locale, data]) => {
    return [locale.toLowerCase(), data];
  })
);

const DEFAULT_BRANCH_NAME = "main"; // That's what we use for github.com/mdn/content

// Module-level cache
const rootToGitBranchMap = new Map();

function getCurrentGitBranch(root) {
  if (!rootToGitBranchMap.has(root)) {
    // If this is running in a GitHub Action "PR Build" workflow the current
    // branch name will be set in `GITHUB_REF_NAME_SLUG`.
    let name = DEFAULT_BRANCH_NAME;
    // Only bother getting fancy if the root is CONTENT_ROOT.
    // For other possible roots, just leave it to the default.
    if (root === CONTENT_ROOT) {
      if (process.env.GITHUB_REF) {
        name = process.env.GITHUB_REF.split("/").slice(2).join("/");
      } else {
        // Most probably, you're hacking on the content, using Yari to preview,
        // in a topic branch. Then figure this out using a child-process.
        // Note, if you're in detached head, (e.g. "d6a6c3f17") instead of a named
        // branch, this will fail. But that's why we rely on a default.
        try {
          const output = execGit(["branch", "--show-current"], {
            cwd: root,
          });
          if (output) {
            name = output;
          }
        } catch (e) {
          /* allowed to fail for non git content root */
        }
      }
    }

    rootToGitBranchMap.set(root, name);
  }
  return rootToGitBranchMap.get(root);
}

/** Throw an error if the slug is insane.
 * This helps breaking the build if someone has put in faulty data into
 * the content (metadata file).
 * If all is well, do nothing. Nothing is expected to return.
 */
function validateSlug(slug) {
  if (!slug) {
    throw new Error("slug is empty");
  }
  if (slug.startsWith("/")) {
    throw new Error(`Slug '${slug}' starts with a /`);
  }
  if (slug.endsWith("/")) {
    throw new Error(`Slug '${slug}' ends with a /`);
  }
  if (slug.includes("//")) {
    throw new Error(`Slug '${slug}' contains a double /`);
  }
}

/**
 * Find all tags that we need to change to tell tools like Google Translate
 * to not translate.
 *
 * @param {Cheerio document instance} $
 */
function injectNoTranslate($) {
  $("pre").addClass("notranslate");
}

/**
 * For every image and iframe, where appropriate add the `loading="lazy"` attribute.
 *
 * @param {Cheerio document instance} $
 */
function injectLoadingLazyAttributes($) {
  $("img:not([loading]), iframe:not([loading])").attr("loading", "lazy");
}

/**
 * For every `<a href="http...">` make it
 * `<a href="http..." class="external" and rel="noopener">`
 *
 *
 * @param {Cheerio document instance} $
 */
function postProcessExternalLinks($) {
  $("a[href^=http]").each((i, element) => {
    const $a = $(element);
    if ($a.attr("href").startsWith("https://developer.mozilla.org")) {
      // This should have been removed since it's considered a flaw.
      // But we haven't applied all fixable flaws yet and we still have to
      // support translated content which is quite a long time away from
      // being entirely treated with the fixable flaws cleanup.
      return;
    }
    $a.addClass("external");
    const rel = ($a.attr("rel") || "").split(" ");
    if (!rel.includes("noopener")) {
      rel.push("noopener");
      $a.attr("rel", rel.join(" "));
    }
  });
}

/**
 * For every `<a href="THING">`, where 'THING' is not a http or / link, make it
 * `<a href="$CURRENT_PATH/THING">`
 *
 *
 * @param {Cheerio document instance} $
 */
function postLocalFileLinks($, doc) {
  $("a[href]").each((i, element) => {
    const href = element.attribs.href;

    // This test is merely here to quickly bail if there's no hope to find the
    // image as a local file link. `Image.findByURL()` is fast but there are
    // a LOT of hyperlinks throughout the content and this simple if statement
    // means we can skip 99% of the links, so it's presumed to be worth it.
    if (
      !href ||
      /^(\/|\.\.|http|#|mailto:|about:|ftp:|news:|irc:|ftp:)/i.test(href)
    ) {
      return;
    }
    // There are a lot of links that don't match. E.g. `<a href="SubPage">`
    // So we'll look-up a lot "false positives" that are not images.
    // Thankfully, this lookup is fast.
    const url = `${doc.mdn_url}/${href}`;
    const image = Image.findByURL(url);
    if (image) {
      $(element).attr("href", url);
    }
  });
}

/**
 * Fix the heading IDs so they're all lower case.
 *
 * @param {Cheerio document instance} $
 */
function postProcessSmallerHeadingIDs($) {
  $("h4[id], h5[id], h6[id]").each((i, element) => {
    const id = element.attribs.id;
    const lcID = id.toLowerCase();
    if (id !== lcID) {
      $(element).attr("id", lcID);
    }
  });
}

/**
 * Find all `<div class="warning">` and turn them into `<div class="warning notecard">`
 * and keep in mind that if it was already been manually fixed so, you
 * won't end up with `<div class="warning notecard notecard">`.
 *
 * @param {Cheerio document instance} $
 */
function injectNotecardOnWarnings($) {
  $("div.warning, div.note, div.blockIndicator")
    .addClass("notecard")
    .removeClass("blockIndicator");
}

/**
 * Return the full URL directly to the file in GitHub based on this folder.
 * @param {String} folder - the current folder we're processing.
 */
function getGitHubURL(root, folder, filename) {
  const baseURL = `https://github.com/${REPOSITORY_URLS[root]}`;
  return `${baseURL}/blob/${getCurrentGitBranch(
    root
  )}/files/${folder}/${filename}`;
}

/**
 * Return the full URL directly to the last commit affecting this file on GitHub.
 * @param {String} hash - the full hash to point to.
 */
function getLastCommitURL(root, hash) {
  const baseURL = `https://github.com/${REPOSITORY_URLS[root]}`;
  return `${baseURL}/commit/${hash}`;
}

function injectSource(doc, document, metadata) {
  const folder = document.fileInfo.folder;
  const root = document.fileInfo.root;
  const filename = path.basename(document.fileInfo.path);
  doc.source = {
    folder,
    github_url: getGitHubURL(root, folder, filename),
    last_commit_url: getLastCommitURL(root, metadata.hash),
    filename,
  };
}

/**
 * Return an array of objects like this [{text: ..., id: ...}, ...]
 * from a document's body.
 * This will be used for the "Table of Contents" menu which expects to be able
 * to link to each section with anchor links.
 *
 * @param {Document} doc
 */
function makeTOC(doc) {
  return doc.body
    .map((section) => {
      if (
        (section.type === "prose" ||
          section.type === "browser_compatibility" ||
          section.type === "specifications") &&
        section.value.id &&
        section.value.title &&
        !section.value.isH3
      ) {
        return { text: section.value.title, id: section.value.id };
      }
      return null;
    })
    .filter(Boolean);
}

/**
 * Return an array of all images that are inside the documents source folder.
 *
 * @param {Document} document
 */
function getAdjacentImages(documentDirectory) {
  const dirents = fs.readdirSync(documentDirectory, { withFileTypes: true });
  return dirents
    .filter((dirent) => {
      // This needs to match what we do in filecheck/checker.py
      return (
        !dirent.isDirectory() &&
        /\.(png|jpeg|jpg|gif|svg|webp)$/i.test(dirent.name)
      );
    })
    .map((dirent) => path.join(documentDirectory, dirent.name));
}

async function buildDocument(document, documentOptions = {}) {
  // Important that the "local" document options comes last.
  // And use Object.assign to create a new object instead of mutating the
  // global one.
  const options = Object.assign({}, buildOptions, documentOptions);
  const { metadata, fileInfo } = document;

  if (Document.urlToFolderPath(document.url) !== document.fileInfo.folder) {
    throw new Error(
      `The document's slug (${metadata.slug}) doesn't match its disk folder name (${document.fileInfo.folder})`
    );
  }

  const doc = {
    isMarkdown: document.isMarkdown,
    isArchive: document.isArchive,
    isTranslated: document.isTranslated,
    isActive: document.isActive,
  };

  doc.flaws = {};

  let renderedHtml = "";
  let flaws = [];
  const liveSamples = [];

  if (doc.isArchive) {
    if (document.isMarkdown) {
      throw new Error("Markdown not supported for archived content");
    }
    renderedHtml = document.rawBody;
  } else {
    if (options.clearKumascriptRenderCache) {
      renderKumascriptCache.reset();
    }
    try {
      [renderedHtml, flaws] = await kumascript.render(document.url);
    } catch (error) {
      if (error.name === "MacroInvocationError") {
        // The source HTML couldn't even be parsed! There's no point allowing
        // anything else move on.
        // But considering that this might just be one of many documents you're
        // building, let's at least help by setting a more user-friendly error
        // message.
        error.updateFileInfo(document.fileInfo);
        throw new Error(
          `MacroInvocationError trying to parse ${error.filepath}, line ${error.line} column ${error.column} (${error.error.message})`
        );
      }

      // Any other unexpected error re-thrown.
      throw error;
    }

    const sampleIds = kumascript.getLiveSampleIDs(
      document.metadata.slug,
      document.rawBody
    );
    for (const sampleIdObject of sampleIds) {
      const liveSamplePage = kumascript.buildLiveSamplePage(
        document.url,
        document.metadata.title,
        renderedHtml,
        sampleIdObject
      );
      if (liveSamplePage.flaw) {
        const flaw = liveSamplePage.flaw.updateFileInfo(fileInfo);
        if (flaw.name === "MacroLiveSampleError") {
          // As of April 2021 there are 0 pages in mdn/content that trigger
          // a MacroLiveSampleError. So we can be a lot more strict with en-US
          // until the translated-content has had a chance to clean up all
          // their live sample errors.
          // See https://github.com/mdn/yari/issues/2489
          if (document.metadata.locale === "en-US") {
            throw new Error(
              `MacroLiveSampleError within ${flaw.filepath}, line ${flaw.line} column ${flaw.column} (${flaw.error.message})`
            );
          } else {
            console.warn(
              `MacroLiveSampleError within ${flaw.filepath}, line ${flaw.line} column ${flaw.column} (${flaw.error.message})`
            );
          }
        }
        flaws.push(flaw);
        continue;
      }
      liveSamples.push({
        id: sampleIdObject.id.toLowerCase(),
        html: liveSamplePage.html,
      });
    }

    if (flaws.length) {
      if (options.flawLevels.get("macros") === FLAW_LEVELS.ERROR) {
        // Report and exit immediately on the first document with flaws.
        console.error(
          chalk.red.bold(
            `Flaws (${flaws.length}) within ${document.metadata.slug} while rendering macros:`
          )
        );
        flaws.forEach((flaw, i) => {
          console.error(chalk.bold.red(`${i + 1}: ${flaw.name}`));
          console.error(chalk.red(`${flaw}\n`));
        });
        // // XXX This is probably the wrong way to bubble up.
        // process.exit(1);
        throw new Error("Flaw error encountered");
      } else if (options.flawLevels.get("macros") === FLAW_LEVELS.WARN) {
        // doc.flaws.macros = flaws;
        // The 'flaws' array don't have everything we need from the
        // kumascript rendering, so we "beef it up" to have convenient
        // attributes needed.
        doc.flaws.macros = flaws.map((flaw, i) => {
          let fixable = false;
          let suggestion = null;
          if (flaw.name === "MacroDeprecatedError") {
            fixable = true;
            suggestion = "";
          } else if (
            flaw.name === "MacroRedirectedLinkError" &&
            (!flaw.filepath || flaw.filepath === document.fileInfo.path)
          ) {
            fixable = true;
            suggestion = flaw.macroSource.replace(
              flaw.redirectInfo.current,
              flaw.redirectInfo.suggested
            );
          }
          const id = `macro${i}`;
          const explanation = flaw.error.message;
          return Object.assign({ id, fixable, suggestion, explanation }, flaw);
        });
      }
    }
  }

  // TODO: The slug should always match the folder name.
  // If you edit the slug bug don't correctly edit the folder it's in
  // it's going to lead to confusion.
  // We can use the utils.slugToFolder() function and compare
  // its output with the `folder`.
  validateSlug(metadata.slug);

  const $ = cheerio.load(`<div id="_body">${renderedHtml}</div>`);

  // Kumascript rendering can't know about FLAW_LEVELS when it's building,
  // because injecting it there would cause a circular dependency.
  // So, let's post-process the rendered HTML now afterwards.
  // If the flaw levels for `macros` was to ignore, we can delete all the
  // injected `data-flaw-src="..."` attributes.
  if (options.flawLevels.get("macros") === FLAW_LEVELS.IGNORE) {
    // This helps the final production built HTML since there `data-flaw-src`
    // attributes on the HTML is useless.
    $("[data-flaw-src]").removeAttr("data-flaw-src");
  }

  doc.title = metadata.title;
  doc.mdn_url = document.url;
  doc.locale = metadata.locale;
  doc.native = LANGUAGES.get(doc.locale.toLowerCase()).native;

  // Note that 'extractSidebar' will always return a string.
  // And if it finds a sidebar section, it gets removed from '$' too.
  // Also note, these operations mutate the `$`.
  doc.sidebarHTML = extractSidebar($);

  // Check and scrutinize any local image references
  const fileAttachments = checkImageReferences(doc, $, options, document);
  // Not all images are referenced as `<img>` tags. Some are just sitting in the
  // current document's folder and they might be referenced in live samples.
  // The checkImageReferences() does 2 things. Checks image *references* and
  // it returns which images it checked. But we'll need to complement any
  // other images in the folder.
  getAdjacentImages(path.dirname(document.fileInfo.path)).forEach((fp) =>
    fileAttachments.add(fp)
  );

  // Check the img tags for possible flaws and possible build-time rewrites
  checkImageWidths(doc, $, options, document);

  // With the sidebar out of the way, go ahead and check the rest
  try {
    injectFlaws(doc, $, options, document);
  } catch (error) {
    console.warn(
      `Injecting flaws into ${document.fileInfo.path} (${document.url}) failed.`
    );
    throw error;
  }

  // Some hyperlinks are not easily fixable and we should never include them
  // because they're potentially evil.
  $("a[href]").each((i, a) => {
    // See https://github.com/mdn/kuma/issues/7647
    // Ideally we should manually remove this from all sources (archived or not)
    // but that's not immediately feasible. So at least make sure we never
    // present the link in any rendered HTML.
    if (
      a.attribs.href.startsWith("http") &&
      a.attribs.href.includes("fxsitecompat.com")
    ) {
      $(a).attr("href", "https://github.com/mdn/kuma/issues/7647");
    }
  });

  // If fixFlaws is on and the doc has fixable flaws, this returned
  // raw HTML string will be different.
  try {
    await fixFixableFlaws(doc, options, document);
  } catch (error) {
    console.error(error);
    throw error;
  }

  // Now that live samples have been extracted, lets remove all the `div.hidden` tags
  // that were used for that. If we don't do this, for example, the `pre` tags will be
  // syntax highligted, which is a waste because they're going to be invisible
  // anyway.
  $("div.hidden").remove();

  // Apply syntax highlighting all <pre> tags.
  syntaxHighlight($, doc);

  // Post process HTML so that the right elements gets tagged so they
  // *don't* get translated by tools like Google Translate.
  injectNoTranslate($);

  // Add the `loading=lazy` HTML attribute to the appropriate elements.
  injectLoadingLazyAttributes($);

  // All external hyperlinks should have the `external` class name.
  postProcessExternalLinks($);

  // All internal hyperlinks to a file should become "absolute" URLs
  postLocalFileLinks($, doc);

  // Since all anchor links are forced into lower case, and `<h2>` and `<h3>`
  // is taken care of by the React rendering itself, we have to post-process
  // any possible headings whose ID might not be perfect.
  // The reason we can't do this as part of the kumascript rendering is because
  // the old
  postProcessSmallerHeadingIDs($);

  // All content that uses `<div class="warning">` needs to become
  // `<div class="warning notecard">` instead.
  // Some day, we can hopefully do a mass search-and-replace so we never
  // need to do this code here.
  // We might want to delete this injection in 2021 some time when all content's
  // raw HTML has been fixed to always have it in there already.
  injectNotecardOnWarnings($);

  // Turn the $ instance into an array of section blocks. Most of the
  // section blocks are of type "prose" and their value is a string blob
  // of HTML.
  const [sections, sectionFlaws] = extractSections($);
  doc.body = sections;
  if (sectionFlaws.length) {
    injectSectionFlaws(doc, sectionFlaws, options);
  }

  // Extract all the <h2> tags as they appear into an array.
  doc.toc = makeTOC(doc);

  // The summary comes from the HTML and potentially the <h2>Summary</h2>
  // section. It's always a plain text string.
  doc.summary = extractSummary(doc.body);

  // Creates new mdn_url's for the browser-compatibility-table to link to
  // pages within this project rather than use the absolute URLs
  normalizeBCDURLs(doc, options);

  const bcdData = extractBCDData(doc);

  // If the document has a `.popularity` make sure don't bother with too
  // many significant figures on it.
  doc.popularity = metadata.popularity
    ? Number(metadata.popularity.toFixed(4))
    : 0.0;

  doc.modified = metadata.modified || null;

  const otherTranslations = document.translations || [];
  if (!otherTranslations.length && metadata.translation_of) {
    // If built just-in-time, we won't have a record of all the other translations
    // available. But if the current document has a translation_of, we can
    // at least use that.
    const translationOf = Document.findByURL(
      `/en-US/docs/${metadata.translation_of}`
    );
    if (translationOf) {
      otherTranslations.push({
        locale: "en-US",
        title: translationOf.metadata.title,
        native: LANGUAGES.get("en-us").native,
      });
    }
  }

  if (otherTranslations.length) {
    doc.other_translations = otherTranslations;
  }

  injectSource(doc, document, metadata);

  // The `titles` object should contain every possible URI->Title mapping.
  // We can use that generate the necessary information needed to build
  // a breadcrumb in the React component.
  addBreadcrumbData(document.url, doc);

  doc.pageTitle = getPageTitle(doc);

  // Decide whether it should be indexed (sitemaps, robots meta tag, search-index)
  doc.noIndexing =
    (doc.isArchive && !doc.isTranslated) ||
    metadata.slug === "MDN/Kitchensink" ||
    document.metadata.slug.startsWith("orphaned/") ||
    document.metadata.slug.startsWith("conflicting/");

  return { doc, liveSamples, fileAttachments, bcdData };
}

async function buildLiveSamplePageFromURL(url) {
  // The 'url' is expected to be something
  // like '/en-us/docs/foo/bar/_sample_.myid.html' and from that we want to
  // extract '/en-us/docs/foo/bar' and 'myid'. But only if it matches.
  if (!url.endsWith(".html") || !url.includes("/_sample_.")) {
    throw new Error(`Unexpected URL format to extract live sample ('${url}')`);
  }
  const [documentURL, sampleID] = url.split(/\.html$/)[0].split("/_sample_.");
  const document = Document.findByURL(documentURL);
  if (!document) {
    throw new Error(`No document found for ${documentURL}`);
  }
  // Convert the lower-case sampleID we extract from the incoming URL into
  // the actual sampleID object with the properly-cased live-sample ID.
  for (const sampleIDObject of kumascript.getLiveSampleIDs(
    document.metadata.slug,
    document.rawBody
  )) {
    if (sampleIDObject.id.toLowerCase() === sampleID) {
      const liveSamplePage = kumascript.buildLiveSamplePage(
        document.url,
        document.metadata.title,
        (await kumascript.render(document.url))[0],
        sampleIDObject
      );
      if (liveSamplePage.flaw) {
        throw new Error(liveSamplePage.flaw.toString());
      }
      return liveSamplePage.html;
    }
  }
  throw new Error(`No live-sample "${sampleID}" found within ${documentURL}`);
}

// This is used by the builder (yarn build) and by the server (JIT).
// Someday, this function might change if we decide to include the list
// of GitHub usernames that have contributed to it since it moved to GitHub.
function renderContributorsTxt(wikiContributorNames = null, githubURL = null) {
  let txt = "";
  if (githubURL) {
    // Always show this first
    txt += `# Contributors by commit history\n${githubURL}\n\n`;
  }
  if (wikiContributorNames) {
    txt += `# Original Wiki contributors\n${wikiContributorNames.join("\n")}\n`;
  }
  return txt;
}

function* fastKSParser(s, includeArgs = false) {
  for (const match of s.matchAll(
    /\{\{\s*(\w+[\w-.]*\w+)\s*(\((.*?)\)|)\s*\}\}/gms
  )) {
    const { index } = match;
    if (s.charAt(index - 1) === "\\") {
      continue;
    }

    const split = (match[3] || "").trim().split(",");
    const found = { name: match[1] };
    if (includeArgs) {
      found.args = split
        .map((s) => s.trim())
        .map((s) => {
          if (s.startsWith('"') && s.endsWith('"')) {
            return s.slice(1, -1);
          }
          if (s.startsWith("'") && s.endsWith("'")) {
            return s.slice(1, -1);
          }
          return s;
        })
        .filter((s, i) => {
          if (!s) {
            // Only return false if it's NOT first
            if (i === 0) {
              return Boolean(s);
            }
          }
          return true;
        });
    }
    yield found;
  }
}

async function analyzeDocument(document) {
  const { metadata } = document;

  const doc = {
    ...metadata,
    contributors: metadata.contributors ? metadata.contributors.length : 0,
    isArchive: !!document.isArchive,
    isTranslated: !!document.isTranslated,
  };

  doc.normalizedMacrosCount = {};
  for (const token of fastKSParser(document.rawBody)) {
    const normalizedMacroName = normalizeMacroName(token.name);
    if (!(normalizedMacroName in doc.normalizedMacrosCount)) {
      doc.normalizedMacrosCount[normalizedMacroName] = 0;
    }
    doc.normalizedMacrosCount[normalizedMacroName]++;
  }
  doc.tags = document.metadata.tags || [];

  doc.fileSize = fs.statSync(document.fileInfo.path).size;
  doc.wordCount = document.rawBody
    .replace(/(<([^>]+)>)/g, "")
    .split(/\s+/).length;
  const $ = cheerio.load(document.rawBody);
  const imageCounts = countImages($);
  doc.images = imageCounts.total;
  doc.externalImages = imageCounts.external;
  doc.internalImages = imageCounts.internal;
  doc.h2s = $("h2").length;
  doc.h3s = $("h3").length;
  doc.pres = $("pre").length;
  doc.title = metadata.title;
  doc.mdn_url = document.url;
  doc.depth = document.url.split("/").length - 3;

  // If the document has a `.popularity` make sure don't bother with too
  // many significant figures on it.
  doc.popularity = metadata.popularity
    ? Number(metadata.popularity.toFixed(4))
    : 0.0;

  doc.modified = metadata.modified || null;

  const otherTranslations = document.translations || [];
  if (!otherTranslations.length && metadata.translation_of) {
    // If built just-in-time, we won't have a record of all the other translations
    // available. But if the current document has a translation_of, we can
    // at least use that.
    otherTranslations.push({ locale: "en-US", slug: metadata.translation_of });
  }

  if (otherTranslations.length) {
    doc.other_translations = otherTranslations;
  }

  return doc;
}

function countImages($) {
  const counts = {
    external: 0,
    internal: 0,
    total: 0,
  };
  $("img[src]").each((i, img) => {
    const src = $(img).attr("src");
    if (
      src.includes("://") ||
      src.startsWith("/@api/") ||
      src.startsWith("/files")
    ) {
      counts.external++;
    } else {
      counts.internal++;
    }
  });
  counts.total = counts.external + counts.internal;
  return counts;
}

module.exports = {
  FLAW_LEVELS,

  buildDocument,
  analyzeDocument,

  buildLiveSamplePageFromURL,
  renderContributorsTxt,

  SearchIndex,

  options: buildOptions,
  gatherGitHistory,
  buildSPAs,
  getLastCommitURL,
};
