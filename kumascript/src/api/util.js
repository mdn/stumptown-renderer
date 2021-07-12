/**
 * Utility functions are collected here. These are functions that are used
 * by the exported functions below. Some of them are themselves exported.
 *
 * @prettier
 */
const cssesc = require("cssesc");
const sanitizeFilename = require("sanitize-filename");
const cheerio = require("cheerio");

const H1_TO_H6_TAGS = new Set(["h1", "h2", "h3", "h4", "h5", "h6"]);
const HEADING_TAGS = new Set([...H1_TO_H6_TAGS, "hgroup"]);
const INJECT_SECTION_ID_TAGS = new Set([...HEADING_TAGS, "section"]);
const LIVE_SAMPLE_PARTS = ["html", "css", "js"];
const SECTION_ID_DISALLOWED = /["#$%&+,/:;=?@[\]^`{|}~')(\\]/g;

class KumascriptError extends Error {
  constructor(message) {
    super(message);
    this.name = this.constructor.name;
  }
}

function slugify(text) {
  // Turn the text content of a header, or the value of the "name" attribute,
  // into a slug for use as an ID as well as a filename. Trim it, collapse
  // whitespace gaps into underscores, remove the same special characters that
  // Kuma removes (for consistency, since for example many live-samples depend
  // on this), and finally remove any remaining characters that would not work
  // within a filename on a Windows, Mac OS X, or Unix filesystem.
  // NOTE: These are the constraints that have to be satisfied:
  //    1) the result can be used as a filename on Windows, Mac OS X, and Unix
  //       (this is why the "sanitize-filename" npm package is used)
  //    2) the result will be used as an "id" attribute, so in HTML5 it must
  //       contain at least one character and must not contain any whitespace
  //       characters (the "sanitize-filename" npm package will itself remove
  //       spaces, but since they're useful in breaking up phrases, before we
  //       run "sanitize-filename" we convert whitespace gaps into underscores)
  //    3) many macros use sample ID's that assume that "id" attributes have
  //       had the SECTION_ID_DISALLOWED characters removed, so for now we have
  //       to maintain that legacy
  //    4) there's no need to add constraints that assume the result will be
  //       used as a CSS ID selector, since it will be properly escaped for that
  //       use case (see the "cssesc" code within the "getSection" method of the
  //       HTMLTool below)
  return sanitizeFilename(
    text.trim().replace(SECTION_ID_DISALLOWED, "").replace(/\s+/g, "_")
  );
}

function spacesToUnderscores(text) {
  return text.replace(/ |%20/g, "_");
}

function safeDecodeURIComponent(text) {
  // This function will attempt to URI-decode the incoming text, which may
  // or may not be URI-encoded, and if it can't, it assumes the text is not
  // URI-encoded and simply falls back to using the text itself. This exists
  // solely because some localized pages URI-encode the sample ID argument
  // to their "EmbedLiveSample" macro calls, and we need to run the non-URI-
  // encoded sample ID through "slugify()" above prior to URI-encoding it
  // for the live-sample URL.
  try {
    return decodeURIComponent(text);
  } catch (e) {
    return text;
  }
}

const findSectionStart = ($, sectionID) =>
  $(`#${cssesc(sectionID, { isIdentifier: true })}`);

const hasHeading = ($, sampleID) =>
  !sampleID ? false : findSectionStart($, sampleID).length > 0;

function findTopLevelParent($el) {
  while ($el.siblings(":header").length == 0 && $el.parent().length > 0) {
    $el = $el.parent();
  }
  return $el;
}

const getLevel = ($header) => parseInt($header[0].name[1], 10);

const getHigherHeaderSelectors = (upTo) =>
  Array.from({ length: upTo }, (_, i) => "h" + (i + 1)).join(", ");

function* collectLevels($el) {
  // Initialized to 7 so that we pick up the lowest heading level which is <h6>
  let level = 7;
  let $prev = $el;
  while (level !== 1) {
    const nextHigherLevel = getHigherHeaderSelectors(level - 1);
    const $header = $prev.prevAll(nextHigherLevel).first();
    if ($header.length == 0) {
      return;
    }
    level = getLevel($header);
    $prev = $header;
    yield $header.add($header.nextUntil(nextHigherLevel));
  }
}

function collectClosestCode($start) {
  const $el = findTopLevelParent($start);
  for (const $level of collectLevels($el)) {
    const pairs = LIVE_SAMPLE_PARTS.map((part) => {
      const selector = `.${part}, pre[class*="brush:${part}"], pre[class*="${part};"]`;
      const $filtered = $level.find(selector).add($level.filter(selector));
      return [
        part,
        $filtered
          .map((i, element) => cheerio(element).text())
          .get()
          .join("\n"),
      ];
    });
    if (pairs.some(([, code]) => !!code)) {
      $start.prop("title", $level.first(":header").text());
      return Object.fromEntries(pairs);
    }
  }
  return null;
}

class HTMLTool {
  constructor(html, pathDescription) {
    this.$ =
      typeof html == "string"
        ? cheerio.load(html, { decodeEntities: true })
        : html;
    this.pathDescription = pathDescription;
  }

  removeNoIncludes() {
    this.$(".noinclude").remove();
    return this;
  }

  injectSectionIDs() {
    let idCount = 0;
    const $ = this.$;
    const knownIDs = new Set();

    function generateUniqueID() {
      let id;
      do {
        id = `sect${++idCount}`;
      } while (knownIDs.has(id));
      knownIDs.add(id);
      return id;
    }

    // Now, let's inject section ID's.
    // The rules are simple; for the tags we look at...
    // If it as a `name` attribute, use that as the ID.
    // If it already has an ID, leave it and use that.
    // If it's a H1-6 tag, generate (slugify) an ID from its text.
    // If all else, generate a unique one.
    $([...INJECT_SECTION_ID_TAGS].join(",")).each((i, element) => {
      const $element = $(element);
      // Default is the existing one. Let's see if we need to change it.
      let id = $element.attr("id");
      if ($element.attr("name")) {
        // The "name" attribute overrides any current "id".
        id = slugify($element.attr("name"));
      } else if (id) {
        // If it already has an ID, respect it and leave it be.
      } else if (H1_TO_H6_TAGS.has($element[0].name)) {
        // For heading tags, we'll give them an "id" that's a
        // slugified version of their text content.
        const text = $element.text();
        id = slugify(text);
        if (id) {
          // Ensure that the slugified "id" has not already been
          // taken. If it has, create a unique version of it.
          let version = 2;
          const originalID = id;
          while (knownIDs.has(id)) {
            id = `${originalID}_${version++}`;
          }
        }
      }
      if (!id) {
        id = generateUniqueID();
      }
      knownIDs.add(id);
      $element.attr("id", id);
    });
    return this;
  }

  getSection(section) {
    const $ = this.$;
    // This is important since many macros specify the section ID with spaces,
    // and/or characters that are stripped from the actual ID's (e.g., "(" and ")").
    const sectionID = slugify(section);
    // Kuma looks for the first HTML tag of a limited set of section tags with ANY
    // attribute equal to the "sectionID", but in practice it's always an "id" attribute,
    // so let's simplify this as well as make it much faster.
    const sectionStart = findSectionStart($, sectionID);
    if (!sectionStart.length) {
      let errorMessage = `unable to find an HTML element with an "id" of "${sectionID}" within ${this.pathDescription}`;
      const hasMoreThanAscii = [...sectionID].some(
        (char) => char.charCodeAt(0) > 127
      );
      if (hasMoreThanAscii) {
        const cleanedSectionID = [...sectionID]
          .filter((char) => char.charCodeAt(0) <= 127)
          .join("");
        errorMessage +=
          ' -- hint! removing all non-ASCII characters in the "id" may fix this, so try ' +
          `'id="${cleanedSectionID}"' and 'EmbedLiveSample("${cleanedSectionID}", ...)'`;
      }
      throw new KumascriptError(errorMessage);
    }
    let result;
    const sectionTag = sectionStart.get(0).tagName;
    if (HEADING_TAGS.has(sectionTag)) {
      // Heading-based sections comprise the start and all siblings
      // after the start until the beginning of the next section of
      // equal or higher level. For example, if the section starts
      // with an "h3", take the "h3" and all of the following sibling
      // elements until either there are no more siblings or we reach
      // an "h1", "h2", or another "h3" element.
      const nextSection = [...HEADING_TAGS]
        .filter((tag) => tag <= sectionTag || tag === "hgroup")
        .join(",");
      result = sectionStart.add(sectionStart.nextUntil(nextSection));
    } else {
      // Non-heading-based sections comprise all of the children of
      // the starting element, but not the starting element itself.
      result = sectionStart.children();
    }
    return result;
  }

  extractSection(section) {
    const result = this.getSection(section).not(".noinclude");
    return cheerio.html(result);
  }

  extractLiveSampleObject(sampleID) {
    const sectionID = sampleID.substr("frame_".length);
    if (hasHeading(this.$, sectionID)) {
      const result = Object.create(null);
      const sample = this.getSection(sectionID);
      // We have to wrap the collection of elements from the section
      // we've just acquired because we're going to search among all
      // descendants and we want to include the elements themselves
      // as well as their descendants.
      const $ = cheerio.load(`<div>${cheerio.html(sample)}</div>`);
      for (const part of LIVE_SAMPLE_PARTS) {
        const src = $(
          `.${part}, pre[class*="brush:${part}"], pre[class*="${part};"]`
        )
          .map((i, element) => $(element).text())
          .get()
          .join("\n");
        // The string replacements below have been carried forward from Kuma:
        //   * Bugzilla 819999: &nbsp; gets decoded to \xa0, which trips up CSS.
        //   * Bugzilla 1284781: &nbsp; is incorrectly parsed on embed sample.
        result[part] = src ? src.replace(/\u00a0/g, " ") : null;
      }
      if (!LIVE_SAMPLE_PARTS.some((part) => result[part])) {
        throw new KumascriptError(
          `unable to find any live code samples for "${sampleID}" within ${this.pathDescription}`
        );
      }
      return result;
    } else {
      const result = collectClosestCode(
        this.$("#" + cssesc(sampleID, { isIdentifier: true }))
      );
      if (!result) {
        throw new KumascriptError(
          `unable to find any live code samples for "${sampleID}" within ${this.pathDescription}`
        );
      }
      return result;
    }
  }

  html() {
    return this.$.html();
  }
}

// Utility functions are collected here. These are functions that are used
// by the exported functions below. Some of them are themselves exported.
module.exports = {
  // Fill in undefined properties in object with values from the
  // defaults objects, and return the object. As soon as the property is
  // filled, further defaults will have no effect.
  //
  // Stolen from http://underscorejs.org/#defaults
  defaults(obj, ...sources) {
    for (const source of sources) {
      for (const prop in source) {
        if (obj[prop] === void 0) obj[prop] = source[prop];
      }
    }
    return obj;
  },

  /**
   * Prepares the provided path by looking for legacy paths that
   * need to be prefixed by "/en-US/docs", as well as ensuring
   * it starts with a "/" and replacing its spaces (whether
   * encoded or not) with underscores.
   */
  preparePath(path) {
    if (path.charAt(0) != "/") {
      path = `/${path}`;
    }
    if (path.indexOf("/docs") == -1) {
      // HACK: If this looks like a legacy wiki URL, throw /en-US/docs
      // in front of it. That will trigger the proper redirection logic
      // until/unless URLs are corrected in templates
      path = `/en-US/docs${path}`;
    }
    return spacesToUnderscores(path);
  },

  /**
   * #### htmlEscape(string)
   * Escape the given string for HTML inclusion.
   *
   * @param {string} s
   * @return {string}
   */
  htmlEscape(s) {
    return `${s}`
      .replace(/&/g, "&amp;")
      .replace(/>/g, "&gt;")
      .replace(/</g, "&lt;")
      .replace(/"/g, "&quot;");
  },

  escapeQuotes(a) {
    let b = "";
    for (let i = 0, len = a.length; i < len; i++) {
      let c = a[i];
      if (c == '"') {
        c = "&quot;";
      }
      b += c;
    }
    return b.replace(/(<([^>]+)>)/gi, "");
  },

  safeDecodeURIComponent,

  spacesToUnderscores,

  slugify,

  HTMLTool,

  KumascriptError,
};
