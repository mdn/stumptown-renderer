const LRU = require("lru-cache");

const { Document } = require("../content");
const { m2h } = require("../markdown");

const {
  INTERACTIVE_EXAMPLES_BASE_URL,
  LIVE_SAMPLES_BASE_URL,
} = require("./src/constants");
const info = require("./src/info.js");
const { render: renderMacros } = require("./src/render.js");
const {
  getLiveSampleIDs,
  buildLiveSamplePages,
  LiveSampleError,
} = require("./src/live-sample.js");
const { HTMLTool } = require("./src/api/util.js");
const { DEFAULT_LOCALE } = require("../libs/constants");

const DEPENDENCY_LOOP_INTRO =
  'The following documents form a circular dependency when rendering (via the "page" and/or "IncludeSubnav" macros):';

const renderCache = new LRU({ max: 2000 });

const renderFromURL = async (
  url,
  { urlsSeen = null, selective_mode = false, invalidateCache = false } = {}
) => {
  const urlLC = url.toLowerCase();
  if (renderCache.has(urlLC)) {
    if (invalidateCache) {
      renderCache.del(urlLC);
    } else {
      return renderCache.get(urlLC);
    }
  }

  urlsSeen = urlsSeen || new Set([]);
  if (urlsSeen.has(urlLC)) {
    throw new Error(
      `${DEPENDENCY_LOOP_INTRO}\n${[...urlsSeen, url].join(" ⭢ ")}`
    );
  }
  urlsSeen.add(urlLC);
  const prerequisiteErrorsByKey = new Map();
  const document = invalidateCache
    ? Document.findByURL(url, Document.MEMOIZE_INVALIDATE)
    : Document.findByURL(url);
  if (!document) {
    throw new Error(
      `From URL ${url} no folder on disk could be found. ` +
        `Tried to find a folder called ${Document.urlToFolderPath(url)}`
    );
  }
  let { metadata } = document;
  // If we're rendering a translation, merge in the parent document's
  // metadata into this metadata.
  if (metadata.locale !== DEFAULT_LOCALE) {
    const parentURL = url
      .toLowerCase()
      .replace(`/${metadata.locale.toLowerCase()}/`, `/${DEFAULT_LOCALE}/`);

    const parentDocument = invalidateCache
      ? Document.findByURL(parentURL, Document.MEMOIZE_INVALIDATE)
      : Document.findByURL(parentURL);
    if (parentDocument) {
      metadata = { ...parentDocument.metadata, ...metadata };
    }
  }

  const { rawBody, fileInfo, isMarkdown } = document;
  const rawHTML = isMarkdown ? await m2h(rawBody) : rawBody;
  const [renderedHtml, errors] = await renderMacros(
    rawHTML,
    {
      ...metadata,
      url,
      tags: metadata.tags || [],
      selective_mode,
      interactive_examples: {
        base_url: INTERACTIVE_EXAMPLES_BASE_URL,
      },
      live_samples: { base_url: LIVE_SAMPLES_BASE_URL || url },
    },
    async (url) => {
      const [renderedHtml, errors] = await renderFromURL(info.cleanURL(url), {
        urlsSeen,
      });
      // Remove duplicate flaws. During the rendering process, it's possible for identical
      // flaws to be introduced when different dependency paths share common prerequisites.
      // For example, document A may have prerequisite documents B and C, and in turn,
      // document C may also have prerequisite B, and the rendering of document B generates
      // one or more flaws.
      for (const error of errors) {
        prerequisiteErrorsByKey.set(error.key, error);
      }
      return renderedHtml;
    }
  );

  // For now, we're just going to inject section ID's.
  // TODO: Sanitize the HTML and also filter the "src"
  //       attributes of any iframes.
  const tool = new HTMLTool(renderedHtml);
  tool.injectSectionIDs();
  renderCache.set(urlLC, [
    tool.html(),
    // The prerequisite errors have already been updated with their own file information.
    [...prerequisiteErrorsByKey.values()].concat(
      errors.map((e) => e.updateFileInfo(fileInfo))
    ),
  ]);
  return renderCache.get(urlLC);
};

module.exports = {
  buildLiveSamplePages,
  getLiveSampleIDs,
  LiveSampleError,
  render: renderFromURL,
  renderCache,
};
