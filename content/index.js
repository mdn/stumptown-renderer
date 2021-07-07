const {
  CONTENT_ROOT,
  CONTENT_ARCHIVED_ROOT,
  CONTENT_TRANSLATED_ROOT,
  REPOSITORY_URLS,
  ROOTS,
  VALID_LOCALES,
  VALID_FILE_TYPES,
  VALID_IMAGE_EXTENSIONS,
} = require("./constants");
const Document = require("./document");
const Translation = require("./translation");
const { getPopularities } = require("./popularities");
const Redirect = require("./redirect");
const Image = require("./image");
const File = require("./file");
const Archive = require("./archive");
const {
  buildURL,
  memoize,
  slugToFolder,
  execGit,
  getRoot,
} = require("./utils");
const { resolveFundamental } = require("../libs/fundamental-redirects");
const { translationsOf } = require("./translations");

module.exports = {
  CONTENT_ROOT,
  CONTENT_ARCHIVED_ROOT,
  CONTENT_TRANSLATED_ROOT,
  REPOSITORY_URLS,
  ROOTS,
  VALID_LOCALES,
  VALID_FILE_TYPES,
  VALID_IMAGE_EXTENSIONS,

  getPopularities,

  Document,
  Redirect,
  Image,
  File,
  Archive,
  Translation,

  buildURL,
  memoize,
  slugToFolder,
  resolveFundamental,
  execGit,
  translationsOf,
  getRoot,
};
