/**
 * @prettier
 */
const util = require("./util.js");

module.exports = {
  // Determines whether or not the page has the specified tag. Returns
  // true if it does, otherwise false. This is case-insensitive.
  //
  hasTag: function (aPage, aTag) {
    // First, return false at once if there are no tags on the page

    if (
      aPage.tags == undefined ||
      aPage.tags == null ||
      aPage.tags.length == 0
    ) {
      return false;
    }

    // Convert to lower case for comparing

    var theTag = aTag.toLowerCase();

    // Now look for a match

    for (var i = 0; i < aPage.tags.length; i++) {
      if (aPage.tags[i].toLowerCase() == theTag) {
        return true;
      }
    }

    return false;
  },

  // Optional path, defaults to current page
  //
  // Optional depth. Number of levels of children to include, 0
  // is the path page
  //
  // Optional self, defaults to false. Include the path page in
  // the results
  //
  // This is not called by any macros, and is only used here by
  // wiki.tree(), so we could move it to be part of that function.
  async subpages(path, depth, self) {
    return this.info.getChildren(path || this.env.url, self);
  },

  // Optional path, defaults to current page
  //
  // Optional depth. Number of levels of children to include, 0
  // is the path page
  //
  // Optional self, defaults to false. Include the path page in
  // the results
  //
  subpagesExpand(path, depth, self) {
    return this.info.getChildren(path || this.env.url, self);
  },

  // Flatten subPages list
  subPagesFlatten(pages) {
    var output = [];

    process_array(pages);

    return output;

    function process_array(arr) {
      if (arr.length) {
        arr.forEach(function (item) {
          if (!item) {
            return;
          }
          process_array(item.subpages || []);
          // If only a header for a branch
          if (item.url == "") {
            return;
          }
          item.subpages = [];
          output.push(item);
        });
      }
    }
  },

  translations(path) {
    return this.info.getTranslations(path || this.env.url);
  },
};
