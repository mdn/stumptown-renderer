import * as fs from "fs";
import path from "path";

const { Builder } = require("content/scripts/build");
const { Sources } = require("content/scripts/sources");
const {
  DEFAULT_POPULARITIES_FILEPATH,
} = require("content/scripts/constants.js");

const CONTENT_ALL_TITLES = require("content/_all-titles.json");

function normalizeContentPath(start) {
  return fs.existsSync(start) ? start : path.join(__dirname, "..", start);
}

function getFolderFromURI(uri) {
  // The file CONTENT_ALL_TITLES has a complete list of every *known* URI
  // and what file, on disk, it corresponds to.
  // Let's open this file dynamically each time because there's not much
  // benefit in caching it once since it might change after this server
  // has started.
  const allUris = CONTENT_ALL_TITLES;
  for (const key of Object.keys(allUris)) {
    if (key.toLowerCase() === uri.toLowerCase()) {
      return allUris[key].file;
    }
  }
  return null;
}

// A global where we stuff ALL redirects possible.
const _allRedirects = new Map();

// Return the redirect but if it can't be found, just return `undefined`
function getRedirectUrl(uri) {
  return null;
  if (!_allRedirects.size && process.env.BUILD_ROOT) {
    const contentRoot = process.env.BUILD_ROOT;
    // They're all in 1 level deep from the content root
    fs.readdirSync(contentRoot)
      .map((n) => path.join(contentRoot, n))
      .filter((filepath) => fs.statSync(filepath).isDirectory())
      .forEach((directory) => {
        fs.readdirSync(directory)
          .filter((n) => n === "_redirects.txt")
          .map((n) => path.join(directory, n))
          .forEach((filepath) => {
            const content = fs.readFileSync(filepath, "utf8");
            content.split(/\n/).forEach((line) => {
              if (line.trim().length && !line.trim().startsWith("#")) {
                const [from, to] = line.split("\t");
                // Express turns ALL URLs into lowercase. So we have to do
                // this here too to have any chance matching.
                _allRedirects.set(from.toLowerCase(), to);
              }
            });
          });
      });

    if (!_allRedirects.size) {
      throw new Error(`Unable to gather any redirects from ${contentRoot}`);
    }
  }

  return _allRedirects.get(uri.toLowerCase()) || null;
}

// Module level memoization
let builder = null;
function getOrCreateBuilder(options: any = {}) {
  if (!builder) {
    const sources = new Sources();
    // The server doesn't have command line arguments like the content CLI
    // does so we need to entirely rely on environment variables.
    if (process.env.BUILD_ROOT) {
      sources.add("../content/files");
    }
    builder = new Builder(
      sources,
      {
        destination: normalizeContentPath(
          process.env.BUILD_DESTINATION || "client/build"
        ),
        noSitemaps: true,
        specificFolders: [],
        buildJsonOnly: false,
        locales: options.locales || [],
        notLocales: [],
        slugsearch: [],
        noProgressbar: true,
        foldersearch: options.foldersearch || [],
        popularitiesfile: normalizeContentPath(DEFAULT_POPULARITIES_FILEPATH),
      },
      console
    );
    builder.initSelfHash();
    builder.ensureAllTitles();
    builder.ensureAllRedirects();
    builder.prepareRoots();
  }
  return builder;
}

export default async (req, res) => {
  let lookupUrl = req.url;
  let extraSuffix = "";

  if (req.url.endsWith("index.json")) {
    // It's a bit special then.
    // The URL like me something like
    // /en-US/docs/HTML/Global_attributes/index.json
    // and that won't be found in getRedirectUrl() since that doesn't
    // index things with the '/index.json' suffix. So we need to
    // temporarily remove it and remember to but it back when we're done.
    extraSuffix = "/index.json";
    lookupUrl = lookupUrl.replace(extraSuffix, "");
  }

  lookupUrl = lookupUrl.replace("/api/docs", "").toLowerCase();

  const redirectUrl = getRedirectUrl(lookupUrl);
  if (redirectUrl) {
    return res.redirect(301, redirectUrl + extraSuffix);
  }

  // If it wasn't a redirect, it has to be possible to build!
  const folderName = getFolderFromURI(lookupUrl);
  if (!folderName) {
    return res
      .status(404)
      .send(`Can not finder a folder based on ${lookupUrl}`);
  }
  const specificFolder = normalizeContentPath(folderName);

  // Check that it even makes sense!
  if (specificFolder) {
    // const t0 = performance.now();
    try {
      const built = await getOrCreateBuilder().start({
        specificFolders: [specificFolder],
      });
      // const t1 = performance.now();
      // Remember, the only reason we're here in the catch-all is because
      // Express couldn't find the file as a static asset. But might
      // actually already be built because inside the Builder it might
      // have transformed the URL to something that doesn't match what
      // it's called on disk.
      // If that's the case, then `built[0].result === 'already'`.
      if (built[0].result === "already") {
        console.log(
          `Actually already built ${path.join(
            path.dirname(built[0].file),
            extraSuffix
          )} (${1 /*(t1 - t0).toFixed()*/}ms)`
        );
      } else {
        // XXX Should this also log about flaws??
        console.log(
          `Successfully on-the-fly built ${path.join(
            path.dirname(built[0].file),
            extraSuffix
          )} (${1 /*(t1 - t0).toFixed()*/}ms)`
        );
      }
      if (extraSuffix == "/index.json") {
        res.writeHead(200, {
          "Content-Type": "audio/mpeg",
          "Content-Length": fs.statSync(built[0].jsonFile).size,
        });

        console.log(built[0].jsonFile);
        fs.createReadStream(built[0].jsonFile).pipe(res);
      }
    } catch (ex) {
      console.error(ex);
      res.status(500).send(ex.toString());
    }
  } else {
    res.status(404).send("Page not found. Not a redirect or a real directory");
  }
};
