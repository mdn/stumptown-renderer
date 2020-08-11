const fs = require("fs");
const path = require("path");

const express = require("express");
const send = require("send");
const proxy = require("express-http-proxy");
const openEditor = require("open-editor");

const {
  buildDocumentFromURL,
  buildLiveSamplePageFromURL,
} = require("../build");
const { CONTENT_ROOT, Redirect, Image } = require("../content");
const { prepareDoc, renderHTML } = require("../ssr/dist/main");

const { STATIC_ROOT, PROXY_HOSTNAME, FAKE_V1_API } = require("./constants");
const documentRouter = require("./document");
const fakeV1APIRouter = require("./fake-v1-api");
const { searchRoute } = require("./document-watch");
const flawsRoute = require("./flaws");
const { staticMiddlewares } = require("./middlewares");

const app = express();
app.use(express.json());

app.use(staticMiddlewares);

app.use(express.static(STATIC_ROOT));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  "/api/v1",
  // Depending on if FAKE_V1_API is set, we either respond with JSON based
  // on `.json` files on disk or we proxy the requests to Kuma.
  FAKE_V1_API
    ? fakeV1APIRouter
    : proxy(PROXY_HOSTNAME, {
        // More options are available on
        // https://www.npmjs.com/package/express-http-proxy#options
        proxyReqPathResolver: (req) => "/api/v1" + req.url,
      })
);

app.use("/_document", documentRouter);

app.get("/_open", (req, res) => {
  const { line, column, filepath } = req.query;
  if (!filepath) {
    throw new Error("No .filepath in the request query");
  }

  // Sometimes that 'filepath' query string parameter is a full absolute
  // filepath (e.g. /Users/peterbe/yari/content.../index.html), which usually
  // happens when you this is used from the displayed flaws on a preview
  // page.
  // But sometimes, it's a relative path and if so, it's always relative
  // to the main builder source.
  let absoluteFilepath;
  if (fs.existsSync(filepath)) {
    absoluteFilepath = filepath;
  } else {
    absoluteFilepath = path.join(CONTENT_ROOT, filepath);
  }

  // Double-check that the file can be found.
  if (!fs.existsSync(absoluteFilepath)) {
    return res.status(400).send(`${absoluteFilepath} does not exist on disk.`);
  }

  let spec = absoluteFilepath;
  if (line) {
    spec += `:${parseInt(line)}`;
    if (column) {
      spec += `:${parseInt(column)}`;
    }
  }
  openEditor([spec]);
  res.status(200).send(`Tried to open ${spec} in ${process.env.EDITOR}`);
});

// Return about redirects based on a list of URLs.
// This is used by the "<Flaws/>" component which displays information
// about broken links in a page, as some of those broken links might just
// be redirects.
app.post("/_redirects", (req, res) => {
  if (req.body === undefined) {
    throw new Error("express.json middleware not installed");
  }
  const redirects = {};
  if (!req.body.urls) {
    return res.status(400).send("No .urls array sent in JSON");
  }
  for (const url of req.body.urls) {
    redirects[url] = getRedirectURL(url);
  }
  res.json({ redirects });
});

app.use("/:locale/search-index.json", searchRoute);

app.get("/_flaws", flawsRoute);

app.get("/*", async (req, res) => {
  if (req.url.startsWith("_")) {
    // URLs starting with _ is exclusively for the meta-work and if there
    // isn't already a handler, it's something wrong.
    return res.status(404).send("Page not found");
  }

  // If the catch-all gets one of these something's gone wrong
  if (req.url.startsWith("/static")) {
    return res.status(404).send("Page not found");
  }

  if (req.url.includes("/_samples_/")) {
    try {
      return res.send(await buildLiveSamplePageFromURL(req.url));
    } catch (e) {
      return res.status(404).send(e.toString());
    }
  }

  if (!req.url.includes("/docs/")) {
    // This should really only be expected for "single page apps".
    // All *documents* should be handled by the
    // `if (req.url.includes("/docs/"))` test above.
    res.sendFile(path.join(STATIC_ROOT, "/index.html"));
    return;
  }

  // TODO: Would be nice to have a list of all supported file extensions
  // in a constants file.
  if (/\.(png|webp|gif|jpeg|svg)$/.test(req.url)) {
    // Remember, Image.findByURL() will return the absolute file path
    // iff it exists on disk.
    const filePath = Image.findByURL(req.url);
    if (filePath) {
      return send(req, filePath).pipe(res);
    } else {
      return res.status(404).send("File not found on disk");
    }
  }

  let lookupURL = req.url;
  let extraSuffix = "";

  if (req.url.endsWith("index.json")) {
    // It's a bit special then.
    // The URL like me something like
    // /en-US/docs/HTML/Global_attributes/index.json
    // and that won't be found in getRedirectUrl() since that doesn't
    // index things with the '/index.json' suffix. So we need to
    // temporarily remove it and remember to but it back when we're done.
    extraSuffix = "/index.json";
    lookupURL = lookupURL.replace(extraSuffix, "");
  }

  const isJSONRequest = extraSuffix.endsWith(".json");

  let document;
  try {
    console.time(`buildDocumentFromURL(${lookupURL})`);
    document = await buildDocumentFromURL(lookupURL);
    console.timeEnd(`buildDocumentFromURL(${lookupURL})`);
  } catch (error) {
    console.error(`Error in buildDocumentFromURL(${lookupURL})`, error);
    return res.status(500).send(error.toString());
  }

  if (!document) {
    // redirect resolving can take some time, so we only do it when there's no document
    // for the current route
    const redirectURL = Redirect.resolve(lookupURL);
    if (redirectURL !== lookupURL) {
      return res.redirect(301, redirectURL + extraSuffix);
    }
    return res.sendStatus(404);
  }

  prepareDoc(document);
  if (isJSONRequest) {
    res.json({ doc: document });
  } else {
    res.send(renderHTML(document, lookupURL));
  }
});

const PORT = parseInt(process.env.SERVER_PORT || "5000");
app.listen(PORT, () => console.log(`Listening on port ${PORT}`));
