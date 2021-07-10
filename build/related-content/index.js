const getMDNRelatedContent = require("./mdn");
const getLearnRelatedContent = require("./learn");

function getRelatedContent(sidebar, doc) {
  if (sidebar === "mdn") {
    return getMDNRelatedContent(doc);
  } else if (sidebar === "learn") {
    return getLearnRelatedContent(doc);
  } else {
    throw new Error(`sidebar key '${sidebar}' is currently not recognized`);
  }
}

module.exports = {
  getRelatedContent,
};
