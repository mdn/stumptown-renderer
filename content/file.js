const fs = require("fs");
const path = require("path");

const readChunk = require("read-chunk");
const FileType = require("file-type");

const { ROOTS, VALID_FILE_TYPES } = require("./constants");
const { memoize, slugToFolder } = require("./utils");

async function isFile(filePath) {
  if (fs.statSync(filePath).isDirectory()) {
    return false;
  }

  const buffer = readChunk.sync(filePath, 0, 12);
  if (buffer.length === 0) {
    return false;
  }
  const type = await FileType.fromBuffer(buffer);
  // If the file valid, this comes back
  // as, for example: { ext: 'ttf', mime: 'font/ttf' }
  if (!type || !VALID_FILE_TYPES.has(type.ext)) {
    return false;
  }
  if (!VALID_FILE_TYPES.get(type.ext).includes(type.mime)) {
    console.warn(`${filePath} (${type}) not a valid file type`);
    return false;
  }

  return true;
}

function urlToFilePath(url) {
  const [, locale, , ...slugParts] = decodeURI(url).split("/");
  return path.join(locale.toLowerCase(), slugToFolder(slugParts.join("/")));
}

const find = memoize((relativePath) => {
  return ROOTS.map((root) => path.join(root, relativePath)).find(
    (filePath) => fs.existsSync(filePath) && isFile(filePath)
  );
});

function findByURL(url) {
  return find(urlToFilePath(url));
}

module.exports = {
  findByURL,
};
