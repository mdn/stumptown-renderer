const fs = require("fs");
const path = require("path");

const { resolveFundamental } = require("../libs/fundamental-redirects");
const { decodePath, slugToFolder } = require("../libs/slug-utils");
const {
  CONTENT_ROOT,
  CONTENT_TRANSLATED_ROOT,
  VALID_LOCALES,
} = require("./constants");
const { getRoot } = require("./utils");
const { isArchivedFilePath } = require("./archive");

const FORBIDDEN_URL_SYMBOLS = ["\n", "\t"];
const VALID_LOCALES_SET = new Set([...VALID_LOCALES.values()]);

function checkURLInvalidSymbols(url) {
  for (const character of FORBIDDEN_URL_SYMBOLS) {
    if (url.includes(character)) {
      throw new Error(`URL contains invalid character '${character}'`);
    }
  }
}

function isVanityRedirectURL(url) {
  const localeUrls = new Set([...VALID_LOCALES.values()].map((l) => `/${l}/`));
  return localeUrls.has(url);
}

function resolveDocumentPath(url) {
  // Let's keep vanity urls to /en-US/ ...
  if (isVanityRedirectURL(url)) {
    return url;
  }
  const [bareURL] = url.split("#");

  const [, locale, , ...slug] = bareURL.toLowerCase().split("/");

  const relativeFolderPath = path.join(locale, slugToFolder(slug.join("/")));
  const relativeFilePath = path.join(relativeFolderPath, "index.html");

  if (isArchivedFilePath(relativeFilePath)) {
    return `$ARCHIVED/${relativeFilePath}`;
  }

  const root = getRoot(locale);

  if (!root) {
    return `$TRANSLATED/${relativeFilePath}`;
  }
  const filePath = path.join(root, relativeFilePath);
  if (
    fs.existsSync(filePath) ||
    fs.existsSync(path.join(root, relativeFolderPath, "index.md"))
  ) {
    return filePath;
  }
  return null;
}

// Throw if this can't be a redirect from-URL.
function validateFromURL(url, locale, checkPath = true) {
  if (!url.startsWith("/")) {
    throw new Error(`From-URL must start with a / was ${url}`);
  }
  const [, fromLocale] = url.toLowerCase().split("/");
  if (fromLocale !== locale) {
    throw new Error(
      `From-URL with ${fromLocale} in ${locale} redirects file: ${url}`
    );
  }
  if (!url.includes("/docs/")) {
    throw new Error(`From-URL must contain '/docs/' was ${url}`);
  }
  if (!VALID_LOCALES_SET.has(url.split("/")[1])) {
    throw new Error(`The locale prefix is not valid or wrong case was ${url}`);
  }
  checkURLInvalidSymbols(url);
  // This is a circular dependency we should solve that in another way.
  validateURLLocale(url);
  if (checkPath) {
    const path = resolveDocumentPath(url);
    if (path) {
      throw new Error(`From-URL resolves to a file (${path})`);
    }
  }
}

// Throw if this can't be a redirect to-URL.
function validateToURL(url, locale, checkPath = true) {
  // Let's keep vanity urls to /en-US/ ...
  if (isVanityRedirectURL(url)) {
    return url;
  }
  // If it's not external, it has to go to a valid document
  if (url.includes("://")) {
    // If this throws, conveniently the validator will do its job.
    const parsedURL = new URL(url);
    if (parsedURL.protocol !== "https:") {
      throw new Error("We only redirect to https://");
    }
  } else if (url.startsWith("/")) {
    checkURLInvalidSymbols(url);
    validateURLLocale(url);

    const [bareURL] = url.split("#");
    if (checkPath) {
      const [, toLocale] = url.toLowerCase().split("/");
      if (toLocale !== locale) {
        return;
      }
      const path = resolveDocumentPath(bareURL);
      if (!path) {
        throw new Error(`To-URL has to resolve to a file (${bareURL})`);
      }
    }
  } else {
    throw new Error(`To-URL has to be external or start with / (${url})`);
  }
}

function validateURLLocale(url) {
  // Check that it's a valid document URL
  const [nothing, locale, docs] = url.split("/");
  if (nothing || !locale || docs !== "docs") {
    throw new Error(`The URL is expected to start with /$locale/docs/: ${url}`);
  }
  const validValues = [...VALID_LOCALES.values()];
  if (!validValues.includes(locale)) {
    throw new Error(`'${locale}' not in ${validValues}`);
  }
}

function errorOnEncoded(paris) {
  for (const [from, to] of paris) {
    const [decodedFrom, decodedTo] = decodePair([from, to]);
    if (decodedFrom !== from) {
      throw new Error(`From URL must be decoded: ${from}`);
    }
    if (decodedTo !== to) {
      throw new Error(`To URL must be decoded: ${to}`);
    }
  }
}

function errorOnDuplicated(pairs) {
  const seen = new Set();
  for (const [from] of pairs) {
    const fromLower = from.toLowerCase();
    if (seen.has(fromLower)) {
      throw new Error(`Duplicated redirect: ${fromLower}`);
    }
    seen.add(fromLower);
  }
}

function removeConflictingOldRedirects(oldPairs, updatePairs) {
  if (oldPairs.length === 0) {
    return oldPairs;
  }
  const newTargets = new Set(updatePairs.map(([, to]) => to.toLowerCase()));

  return oldPairs.filter(([from, to]) => {
    const conflictingTo = newTargets.has(from.toLowerCase());
    if (conflictingTo) {
      console.warn(
        `Breaking 301: removing conflicting redirect ${from}\t${to}`
      );
    }
    return !conflictingTo;
  });
}

function removeOrphanedRedirects(pairs, locale) {
  return pairs.filter(([from, to]) => {
    if (resolveDocumentPath(from)) {
      console.log(`removing orphaned redirect (from exists): ${from}\t${to}`);
      return false;
    }
    if (to.startsWith("/") && !resolveDocumentPath(to)) {
      const [, toLocale] = to.toLowerCase().split("/");
      if (toLocale !== locale) {
        console.log(`Skipping: non ${locale} locale: ${from}\t${to}`);
        return true;
      }
      console.log(
        `removing orphaned redirect (to doesn't exists): ${from}\t${to}`
      );
      return false;
    }
    return true;
  });
}

function loadPairsFromFile(filePath, locale, strict = true) {
  const content = fs.readFileSync(filePath, "utf-8");
  const pairs = content
    .trim()
    .split("\n")
    // Skip the header line.
    .filter((line) => line && !line.startsWith("#"))
    .map((line) => line.trim().split(/\t+/));

  if (strict) {
    errorOnEncoded(pairs);
    errorOnDuplicated(pairs);
  }
  validatePairs(pairs, locale, strict);
  return pairs;
}

function loadLocaleAndAdd(
  locale,
  updatePairs,
  { fix = false, strict = false } = {}
) {
  errorOnEncoded(updatePairs);
  errorOnDuplicated(updatePairs);
  validatePairs(updatePairs, locale, strict);

  locale = locale.toLowerCase();
  let root = getRoot(
    locale,
    `trying to add redirects for ${locale} but CONTENT_TRANSLATED_ROOT not set`
  );

  const redirectsFilePath = path.join(root, locale, "_redirects.txt");
  const pairs = [];
  if (fs.existsSync(redirectsFilePath)) {
    // If we wanna fix we load relaxed, hence the !fix.
    pairs.push(...loadPairsFromFile(redirectsFilePath, locale, strict && !fix));
  }

  const cleanPairs = removeConflictingOldRedirects(pairs, updatePairs);
  cleanPairs.push(...updatePairs);

  let simplifiedPairs = shortCuts(cleanPairs);
  if (fix) {
    simplifiedPairs = removeOrphanedRedirects(simplifiedPairs, locale);
  }
  validatePairs(simplifiedPairs, locale, strict);

  const pairsChanged = (a, b) => {
    // Compare tuple by tuple if they are the same.
    for (let i = 0; i < Math.max(a.length, b.length); i++) {
      const [a1, a2] = a[i] || [];
      const [b1, b2] = b[i] || [];
      if (a1 !== b1 || a2 !== b2) {
        return true;
      }
    }
    return false;
  };

  return {
    pairs: simplifiedPairs,
    root,
    changed: pairsChanged(pairs, simplifiedPairs),
  };
}

function add(
  locale,
  updatePairs,
  { fix = false, strict = false, dry = false } = {}
) {
  const localeLC = locale.toLowerCase();
  const { pairs, root } = loadLocaleAndAdd(localeLC, updatePairs, {
    fix,
    strict,
  });
  if (!dry) {
    save(path.join(root, localeLC), pairs);
  }
}

function remove(locale, urls, { strict = false } = {}) {
  const localeLC = locale.toLowerCase();
  const urlsLC = new Set(urls.map((url) => url.toLowerCase()));
  const { pairs, root } = loadLocaleAndAdd(localeLC, [], {
    strict,
  });
  const filteredPairs = pairs.filter(([, to]) => !urlsLC.has(to.toLowerCase()));
  save(path.join(root, localeLC), filteredPairs);
}

function validateLocale(locale, strict = false) {
  const localeLC = locale.toLowerCase();
  // To validate strict we check if there is something to fix.
  const { changed } = loadLocaleAndAdd(localeLC, [], { fix: strict, strict });
  if (changed) {
    throw new Error(` _redirects.txt for ${localeLC} is flawed`);
  }
}

function redirectFilePathForLocale(locale, throws = false) {
  const makeFilePath = (root) =>
    path.join(root, locale.toLowerCase(), "_redirects.txt");

  const filePath = makeFilePath(CONTENT_ROOT);
  if (fs.existsSync(filePath)) {
    return filePath;
  }
  if (CONTENT_TRANSLATED_ROOT) {
    const translatedFilePath = makeFilePath(CONTENT_TRANSLATED_ROOT);

    if (fs.existsSync(translatedFilePath)) {
      return translatedFilePath;
    }
  }
  if (throws) {
    throw new Error(`no _redirects file for ${locale}`);
  }
  return null;
}

// The module level cache
const redirects = new Map();

function load(locales = [...VALID_LOCALES.keys()], verbose = false) {
  for (const locale of locales) {
    const redirectsFilePath = redirectFilePathForLocale(locale);
    if (!redirectsFilePath) {
      continue;
    }
    if (verbose) {
      console.log(`Checking ${redirectsFilePath}`);
    }
    const pairs = loadPairsFromFile(redirectsFilePath, locale, false);
    // Now that all have been collected, transfer them to the `redirects` map
    // but also do invariance checking.
    for (const [from, to] of pairs) {
      redirects.set(from.toLowerCase(), to);
    }
  }
}

const resolve = (url) => {
  if (!redirects.size) {
    load();
  }
  const fundamentalOrUrl = resolveFundamental(url).url || url;
  return (
    redirects.get(decodePath(fundamentalOrUrl).toLowerCase()) ||
    fundamentalOrUrl
  );
};

function shortCuts(pairs, throws = false) {
  // We have mixed cases in the _redirects.txt like:
  // /en-US/docs/window.document     /en-US/docs/Web/API/window.document
  // /en-US/docs/Web/API/Window.document     /en-US/docs/Web/API/Window/document
  // therefore we have to lowercase everything and restore it later.
  const casing = new Map([
    ...pairs.map(([from]) => [from.toLowerCase(), from]),
    ...pairs.map(([, to]) => [to.toLowerCase(), to]),
  ]);
  const lowerCasePairs = pairs.map(([from, to]) => [
    from.toLowerCase(),
    to.toLowerCase(),
  ]);
  const hashPairs = pairs.filter(([, to]) => to.includes("#"));

  // Directed graph of all redirects.
  const dg = new Map(lowerCasePairs);

  // Transitive directed acyclic graph of all redirects.
  // All redirects are expanded A -> B, B -> C becomes:
  // A -> B, B -> C, A -> C and all cycles are removed.
  const transitiveDag = new Map();

  // Expand all "edges" and keep track of the nodes we traverse.
  const transit = (s, froms = []) => {
    const next = dg.get(s);
    if (next) {
      froms.push(s);
      if (froms.includes(next)) {
        const msg = `redirect cycle [${froms.join(", ")}] → ${next}`;
        if (throws) {
          throw new Error(msg);
        }
        console.log(msg);
        return [];
      }
      return transit(next, froms);
    }
    return [froms, s];
  };

  const sortTuples = ([a, b], [c, d]) => {
    if (a > c) {
      return 1;
    }
    if (a < c) {
      return -1;
    }
    if (b > d) {
      return 1;
    }
    if (b < d) {
      return -1;
    }
    return 0;
  };

  for (const [from] of lowerCasePairs) {
    const [froms = [], to] = transit(from);
    for (const from of froms) {
      transitiveDag.set(from, to);
    }
  }

  // We want to shortcut
  // /en-US/docs/foo/bar     /en-US/docs/foo#bar
  // /en-US/docs/foo     /en-US/docs/Web/something
  // to
  // /en-US/docs/foo/bar     /en-US/docs/something#bar
  // /en-US/docs/foo     /en-US/docs/Web/something
  for (const [from, to] of hashPairs) {
    const [bareTo, ...hashes] = to.split("#");
    const bareToLC = bareTo.toLowerCase();
    if (transitiveDag.has(bareToLC)) {
      const redirectedTo = transitiveDag.get(bareToLC);
      const newTo = `${redirectedTo}#${hashes.join("#").toLowerCase()}`;

      // Add casing for the hashed new URL.
      const redirectedToCased = casing.get(redirectedTo);
      const newToCased = `${redirectedToCased}#${hashes.join("#")}`;
      casing.set(newTo, newToCased);

      // Log something since this is opportunistic!
      console.log(`Short cutting hashed redirect: ${from} -> ${newTo}`);
      transitiveDag.set(from.toLowerCase(), newTo);
    }
  }

  const transitivePairs = [...transitiveDag.entries()];

  // Restore cases!
  const mappedPairs = transitivePairs.map(([from, to]) => [
    casing.get(from) || from,
    casing.get(to) || to,
  ]);
  mappedPairs.sort(sortTuples);
  return mappedPairs;
}

function decodePair([from, to]) {
  const fromDecoded = decodePath(from);
  let toDecoded;
  if (to.startsWith("/")) {
    toDecoded = decodePath(to);
  } else {
    toDecoded = decodeURI(to);
  }
  return [fromDecoded, toDecoded];
}

function decodePairs(pairs) {
  return pairs.map((pair) => decodePair(pair));
}

function validatePairs(pairs, locale, checkExists = true) {
  for (const [from, to] of pairs) {
    validateFromURL(from, locale, checkExists);
    validateToURL(to, locale, checkExists);
  }
}

const redirectsFileOpening = `
# DO NOT EDIT THIS FILE MANUALLY.
# Use the CLI instead:
#
#    yarn content add-redirect <fromURL> <toURL>
#
# FROM-URL\tTO-URL
`.trim();

function save(localeFolder, pairs) {
  const filePath = path.join(localeFolder, "_redirects.txt");
  const writeStream = fs.createWriteStream(filePath);
  writeStream.write(`${redirectsFileOpening}\n`);
  for (const [fromURL, toURL] of pairs) {
    writeStream.write(`${fromURL}\t${toURL}\n`);
  }
  writeStream.end();
}

module.exports = {
  add,
  remove,
  resolve,
  load,
  validateLocale,

  testing: {
    shortCuts,
    decodePairs,
  },
};
