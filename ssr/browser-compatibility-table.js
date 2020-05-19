const url = require("url");

function normalizeURLs(doc) {
  // Loop over, and mutate, all 'browser_compatibility' sections.
  // BCD data comes froms from a library with `mdn_url`'s that are absolute.
  // This takes the `mdn_url` and sets it to a URI that can be used when
  // rendering the BCD table to link to a relative path.
  doc.body
    .filter((section) => section.type === "browser_compatibility")
    .forEach((section) => {
      Object.entries(section.value.data).forEach(([, block]) => {
        // First block from the BCD data does not have its name as the root key
        // so mdn_url is accessible at the root. If the block has a key for
        // `__compat` it is not the first block, and the information is nested
        // under `__compat`.
        if (block.__compat) {
          block = block.__compat;
        }
        if (block.mdn_url) {
          block.mdn_url = getPathFromAbsoluteURL(block.mdn_url);
        }
      });
    });
}

function getPathFromAbsoluteURL(absURL) {
  const u = url.parse(absURL);
  if (u.hostname !== "developer.mozilla.org") {
    // If URL is from a different host, return without modifying it
    return absURL;
  }
  // Return the pathname without docs directory, the base path for the
  // `Document` component the BCD table is within is /:locale/docs/ so it is
  // not needed.
  return u.pathname.replace("/docs/", "");
}

module.exports = { normalizeURLs };
