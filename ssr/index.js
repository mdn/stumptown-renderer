const fs = require("fs");
const path = require("path");

const { fixSyntaxHighlighting } = require("./syntax-highlighter");
const { normalizeURLs } = require("./browser-compatibility-table");

// This is necessary because the ssr.js is in dist/ssr.js
// and we need to reach the .env this way.
require("dotenv").config({ path: path.join(__dirname, "../../.env") });

/**
 * Transform the `related_content` object for this document. For each node:
 * - rename `mdn_url` to `uri`
 * - use `short_title` instead of `title`, if it is available
 * - delete `short_description`
 * - set `isActive` for the node whose `uri` matches this document's `mdn_url`
 * - set `open` for nodes which are active or which have an active child
 *
 * This /mutates/ the document data.
 */
function fixRelatedContent(document) {
  function fixBlock(node) {
    if (node.mdn_url) {
      // always expect this to be a relative URL
      if (!node.mdn_url.startsWith("/")) {
        throw new Error(
          `Document's .mdn_url doesn't start with / (${item.mdn_url})`
        );
      }
      // Complicated way to rename an object key.
      node.uri = node.mdn_url;
      delete node.mdn_url;
    }

    // The sidebar only needs a 'title' and doesn't really care if
    // it came from the full title or the 'short_title'.
    node.title = node.short_title || node.title;
    delete node.short_title;
    // At the moment, we never actually use the 'short_description'
    // so no use including it.
    delete node.short_description;

    // isActive means that this node is a link to the current document
    // open means that this node or one of its children is a link to the current document
    if (node.uri === document.mdn_url) {
      node.open = true;
      node.isActive = true;
    }

    if (node.content) {
      for (const child of node.content) {
        fixBlock(child);
        if (child.open) {
          node.open = true;
        }
      }
    }
  }

  if (document.related_content) {
    document.related_content.forEach((block) => {
      fixBlock(block);
    });
  }
}

/** The breadcrumb is an array of parents include the document itself.
 * It only gets added to the document there are actual parents.
 */
function addBreadcrumbData(uri, document, allTitles) {
  const parents = [];
  let split = uri.split("/");
  let parentUri;
  let parentUriLC;
  while (split.length > 2) {
    split.pop();
    parentUri = split.join("/");
    parentUriLC = parentUri.toLowerCase();
    // This test makes it possible to "skip" certain URIs that might not
    // be a page on its own. For example: /en-US/docs/Web/ is a page,
    // and so is /en-US/ but there might not be a page for /end-US/docs/.
    if (allTitles.has(parentUriLC)) {
      parents.unshift({
        uri: parentUri,
        title: allTitles.get(parentUriLC).title,
      });
    }
  }
  if (parents.length) {
    parents.push({
      uri: uri,
      title: document.short_title || document.title,
    });
    document.parents = parents;
  }
}

function buildHtmlAndJsonFromDoc({
  doc,
  destinationDir,
  buildHtml,
  allTitles,
}) {
  const options = { doc };

  // always expect this to be a relative URL
  if (!options.doc.mdn_url.startsWith("/")) {
    throw new Error(
      `Document's .mdn_url doesn't start with / (${options.doc.mdn_url})`
    );
  }
  const uri = decodeURI(options.doc.mdn_url);
  fs.mkdirSync(destinationDir, { recursive: true });

  // The `titles` object should contain every possible URI->Title mapping.
  // We can use that generate the necessary information needed to build
  // a breadcrumb in the React componentx.
  addBreadcrumbData(uri, options.doc, allTitles);

  // Stumptown produces a `.related_content` for every document. But it
  // contains data that is either not needed or not appropriate for the way
  // we're using it in the renderer. So mutate it for the specific needs
  // of the renderer.
  fixRelatedContent(options.doc);

  if (options.doc.body) {
    // Find blocks of code and transform it to syntax highlighted code.
    fixSyntaxHighlighting(options.doc);
    // Creates new mdn_url's for the browser-compatibility-table to link to
    // pages within this project rather than use the absolute URLs
    normalizeURLs(options.doc);
  }

  const outfileHtml = path.join(destinationDir, "index.html");
  const outfileJson = path.join(destinationDir, "index.json");

  let wasRendered = false;

  fs.writeFileSync(
    outfileJson,
    process.env.NODE_ENV === "development"
      ? JSON.stringify(options, null, 2)
      : JSON.stringify(options)
  );

  return { uri, wasRendered, outfileHtml, outfileJson };
}

module.exports = { buildHtmlAndJsonFromDoc };
