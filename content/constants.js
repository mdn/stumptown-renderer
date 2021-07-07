const fs = require("fs");
const path = require("path");
const { ACTIVE_LOCALES, VALID_LOCALES } = require("../libs/constants");

require("dotenv").config({
  path: path.join(__dirname, "..", process.env.ENV_FILE || ".env"),
});

let CONTENT_ROOT = process.env.CONTENT_ROOT;
if (!CONTENT_ROOT) {
  throw new Error("Env var CONTENT_ROOT must be set");
}
CONTENT_ROOT = fs.realpathSync(CONTENT_ROOT);
if (
  path.basename(CONTENT_ROOT) !== "files" &&
  fs.existsSync(path.join(CONTENT_ROOT, "files"))
) {
  // It can be "corrected"
  CONTENT_ROOT = path.join(CONTENT_ROOT, "files");
  console.warn(
    `Corrected the CONTENT_ROOT environment variable to ${CONTENT_ROOT}`
  );
} else if (!fs.existsSync(CONTENT_ROOT)) {
  throw new Error(`${path.resolve(CONTENT_ROOT)} does not exist`);
}

let CONTENT_ARCHIVED_ROOT = process.env.CONTENT_ARCHIVED_ROOT;
let CONTENT_TRANSLATED_ROOT = process.env.CONTENT_TRANSLATED_ROOT;

// This makes it possible to know, give a root folder, what is the name of
// the repository on GitHub.
// E.g. `'https://github.com/' + REPOSITORY_URLS[document.fileInfo.root]`
const REPOSITORY_URLS = {
  [CONTENT_ROOT]: "mdn/content",
};

// Make a combined array of all truthy roots. This way, you don't
// need to constantly worry about CONTENT_ARCHIVED_ROOT potentially being
// null.
const ROOTS = [CONTENT_ROOT];
if (CONTENT_ARCHIVED_ROOT) {
  if (!fs.existsSync(CONTENT_ARCHIVED_ROOT)) {
    throw new Error(`${path.resolve(CONTENT_ARCHIVED_ROOT)} does not exist`);
  }
  CONTENT_ARCHIVED_ROOT = fs.realpathSync(CONTENT_ARCHIVED_ROOT);
  ROOTS.push(CONTENT_ARCHIVED_ROOT);
  REPOSITORY_URLS[CONTENT_ARCHIVED_ROOT] = "mdn/archived-content";
}
if (CONTENT_TRANSLATED_ROOT) {
  if (!fs.existsSync(CONTENT_TRANSLATED_ROOT)) {
    throw new Error(`${path.resolve(CONTENT_TRANSLATED_ROOT)} does not exist`);
  }
  CONTENT_TRANSLATED_ROOT = fs.realpathSync(CONTENT_TRANSLATED_ROOT);
  ROOTS.push(CONTENT_TRANSLATED_ROOT);
  REPOSITORY_URLS[CONTENT_TRANSLATED_ROOT] = "mdn/translated-content";
}

// These are the files we can accept that are not images. The files that can
// chec checked into the content repo(s).
const VALID_FILE_TYPES = new Map([
  // Explanation:
  // Each row is [fileextension, Array of mime types]
  ["ttf", ["font/ttf"]],
]);

const VALID_IMAGE_EXTENSIONS = new Set([
  "png",
  "jpeg",
  "jpg",
  "gif",
  "svg",
  "webp",
]);

module.exports = {
  CONTENT_ROOT,
  CONTENT_ARCHIVED_ROOT,
  CONTENT_TRANSLATED_ROOT,
  REPOSITORY_URLS,
  ROOTS,
  VALID_LOCALES,
  ACTIVE_LOCALES,
  VALID_FILE_TYPES,
  VALID_IMAGE_EXTENSIONS,
};
