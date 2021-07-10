const fs = require("fs");
const path = require("path");

const chalk = require("chalk");
const got = require("got");
const FileType = require("file-type");
const imagemin = require("imagemin");
const imageminPngquant = require("imagemin-pngquant");
const imageminMozjpeg = require("imagemin-mozjpeg");
const imageminGifsicle = require("imagemin-gifsicle");
const imageminSvgo = require("imagemin-svgo");
const sanitizeFilename = require("sanitize-filename");

const { Document } = require("../../content");
const { FLAW_LEVELS, VALID_FLAW_CHECKS } = require("../constants");
const { DEFAULT_LOCALE } = require("../../libs/constants");
const { replaceMatchesInText } = require("../matches-in-text");
const { humanFileSize } = require("../utils");
const { VALID_MIME_TYPES } = require("../../filecheck/constants");
const { getBadBCDQueriesFlaws } = require("./bad-bcd-queries");
const { getBrokenLinksFlaws } = require("./broken-links");
const { getHeadingLinksFlaws } = require("./heading-links");
const { getPreTagFlaws } = require("./pre-tags");
const { injectSectionFlaws } = require("./sections");
const { getUnsafeHTMLFlaws } = require("./unsafe-html");
const { injectTranslationDifferences } = require("./translation-differences");

function injectFlaws(doc, $, options, document) {
  if (doc.isArchive) return;

  const flawChecks = [
    ["unsafe_html", getUnsafeHTMLFlaws, false],
    ["broken_links", getBrokenLinksFlaws, true],
    ["bad_bcd_queries", getBadBCDQueriesFlaws, false],
    ["bad_pre_tags", getPreTagFlaws, false],
    ["heading_links", getHeadingLinksFlaws, false],
  ];
  if (doc.locale !== DEFAULT_LOCALE && doc.isActive) {
    flawChecks.push([
      "translation_differences",
      injectTranslationDifferences,
      false,
    ]);
  }

  // Note that some flaw checking functions need to always run. Even if we're not
  // recording the flaws, the checks that it does are important for regular
  // building.

  for (const [flawName, func, alwaysRun] of flawChecks) {
    // Sanity check the list of flaw names that they're all recognized.
    // Basically a cheap enum check.
    if (!VALID_FLAW_CHECKS.has(flawName)) {
      throw new Error(`'${flawName}' is not a valid flaw check name`);
    }

    const level = options.flawLevels.get(flawName);
    if (!alwaysRun && level === FLAW_LEVELS.IGNORE) {
      continue;
    }

    // The flaw injection function will mutate the `doc.flaws` object.
    const flaws = func(doc, $, document, level);
    if (flaws.length > 0) {
      doc.flaws[flawName] = flaws;
    }

    if (level === FLAW_LEVELS.ERROR && flaws.length > 0) {
      // To make the stdout output a bit more user-friendly, print one warning
      // for each explanation
      flaws.forEach((flaw, i) => {
        console.warn(
          i + 1,
          chalk.yellow(`${chalk.bold(flawName)} flaw: ${flaw.explanation}`)
        );
      });
      throw new Error(`${doc.flaws[flawName].length} ${flawName} flaws`);
    }
  }
}

async function fixFixableFlaws(doc, options, document) {
  if (!options.fixFlaws || document.isArchive) return;

  const { rawBody, isMarkdown } = document;
  if (isMarkdown) {
    throw new Error("Fixing flaws in Markdown is not implemented yet");
  }
  // String copy so we can mutate it
  let newRawBody = rawBody;

  const phrasing = options.fixFlawsDryRun ? "Would fix" : "Fixed";

  const loud = options.fixFlawsDryRun || options.fixFlawsVerbose;

  // Any 'macros' of type "MacroRedirectedLinkError" or "MacroDeprecatedError"...
  for (const flaw of doc.flaws.macros || []) {
    if (flaw.fixable) {
      // Sanity check that our understanding of flaws, filepaths, and sources
      // work as expected.
      if (!newRawBody.includes(flaw.macroSource)) {
        throw new Error(
          `rawBody doesn't contain macroSource (${flaw.macroSource})`
        );
      }
      const newMacroSource = flaw.suggestion;
      // Remember, in JavaScript only the first occurrence will be replaced.
      newRawBody = newRawBody.replace(flaw.macroSource, newMacroSource);
      if (loud) {
        console.log(
          chalk.grey(
            `${phrasing} (${flaw.id}) macro ${chalk.white.bold(
              flaw.macroSource
            )} to ${chalk.white.bold(newMacroSource)}`
          )
        );
      }
    }
  }

  // Any 'broken_links' with a suggestion...
  for (const flaw of doc.flaws.broken_links || []) {
    if (!flaw.suggestion) {
      continue;
    }
    // XXX MARKDOWN
    // The reason we're not using the parse HTML, as a cheerio object `$`
    // is because the raw HTML we're dealing with isn't actually proper
    // HTML. It's only proper HTML when the kumascript macros have been
    // expanded.
    newRawBody = replaceMatchesInText(flaw.href, newRawBody, flaw.suggestion, {
      inAttribute: "href",
    });
    if (loud) {
      console.log(
        chalk.grey(
          `${phrasing} (${flaw.id}) broken_link ${chalk.white.bold(
            flaw.href
          )} to ${chalk.white.bold(flaw.suggestion)}`
        )
      );
    }
  }

  // Any 'bad_pre_tags' with a suggestion...
  for (const flaw of doc.flaws.bad_pre_tags || []) {
    if (!flaw.suggestion || !flaw.fixable) {
      continue;
    }

    if (!newRawBody.includes(flaw.html)) {
      throw new Error(`rawBody doesn't contain flaw HTML (${flaw.html})`);
    }
    // It's not feasible to pin point exactly which `<pre>` tag this
    // refers to, so do the same query we use when we find the
    // flaw, but this time actually make the mutation.
    newRawBody = newRawBody.replace(flaw.html, flaw.suggestion);
    if (loud) {
      console.log(chalk.grey(`${phrasing} (${flaw.id}) bad_pre_tags`));
    }
  }

  // We have a lot of images that *should* be external, at least for the sake
  // of cleaning up, but aren't. E.g. `/@api/deki/files/247/=HTMLBlinkElement.gif`
  // These get logged as external images by the flaw detection, but to actually
  // be able to process them and fix the problem we need to "temporarily"
  // pretend they were hosted on a remote working full domain.
  // See https://github.com/mdn/yari/issues/1103
  function forceExternalURL(url) {
    if (url.startsWith("/")) {
      return `https://mdn.mozillademos.org${url}`;
    }
    return url;
  }

  // Any 'images' flaws with a suggestion or external image...
  for (const flaw of doc.flaws.images || []) {
    if (!(flaw.suggestion || flaw.externalImage)) {
      continue;
    }
    // The reason we're not using the parse HTML, as a cheerio object `$`
    // is because the raw HTML we're dealing with isn't actually proper
    // HTML. It's only proper HTML when the kumascript macros have been
    // expanded.
    let newSrc;
    if (flaw.suggestion) {
      newSrc = flaw.suggestion;
    } else {
      // Sanity check that it's an external image
      const url = new URL(forceExternalURL(flaw.src));
      if (url.protocol !== "https:") {
        throw new Error(`Insecure image URL ${flaw.src}`);
      }
      try {
        const imageResponse = await got(forceExternalURL(flaw.src), {
          responseType: "buffer",
          timeout: 10000,
          retry: 3,
        });
        const imageBuffer = imageResponse.body;
        let fileType = await FileType.fromBuffer(imageBuffer);
        if (
          !fileType &&
          flaw.src.toLowerCase().endsWith(".svg") &&
          imageResponse.headers["content-type"]
            .toLowerCase()
            .startsWith("image/svg+xml")
        ) {
          // If the SVG doesn't have the `<?xml version="1.0" encoding="UTF-8"?>`
          // and/or the `<!DOCTYPE svg PUBLIC ...` in the first couple of bytes
          // the FileType.fromBuffer will fail.
          // But if the image URL and the response Content-Type are sane, we
          // can safely assumes it's an SVG file.
          fileType = {
            ext: "xml",
            mime: "application/xml",
          };
        }
        if (!fileType) {
          throw new Error(
            `No file type could be extracted from ${flaw.src} at all. Probably not going to be a valid image file.`
          );
        }
        const isSVG =
          fileType.mime === "application/xml" &&
          flaw.src.toLowerCase().endsWith(".svg");

        if (!(VALID_MIME_TYPES.has(fileType.mime) || isSVG)) {
          throw new Error(
            `${flaw.src} has an unrecognized mime type: ${fileType.mime}`
          );
        }
        // Otherwise FileType would make it `.xml`
        const imageExtension = isSVG ? "svg" : fileType.ext;
        const decodedPathname = decodeURI(url.pathname).replace(/\s+/g, "_");
        const imageBasename = sanitizeFilename(
          `${path.basename(
            decodedPathname,
            path.extname(decodedPathname)
          )}.${imageExtension}`
        );
        const destination = path.join(
          Document.getFolderPath(document.metadata),
          path
            .basename(imageBasename)
            // Names like `screenshot-(1).png` are annoying because the `(` often
            // has to be escaped when working on the command line.
            .replace(/[()]/g, "")
            .replace(/\s+/g, "_")
            // From legacy we have a lot of images that are named like
            // `/@api/deki/files/247/=HTMLBlinkElement.gif` for example.
            // Take this opportunity to clean that odd looking leading `=`.
            .replace(/^=/, "")
            .toLowerCase()
        );
        // Before writing to disk, run it through the same imagemin
        // compression we do in the filecheck CLI.
        const compressedImageBuffer = await imagemin.buffer(imageBuffer, {
          plugins: [getImageminPlugin(url.pathname)],
        });
        if (compressedImageBuffer.length < imageBuffer.length) {
          console.log(
            `Raw image size: ${humanFileSize(
              imageBuffer.length
            )} Compressed: ${humanFileSize(compressedImageBuffer.length)}`
          );
          fs.writeFileSync(destination, compressedImageBuffer);
        } else {
          console.log(`Raw image size: ${humanFileSize(imageBuffer.length)}`);
          fs.writeFileSync(destination, imageBuffer);
        }
        console.log(`Downloaded ${flaw.src} to ${destination}`);
        newSrc = path.basename(destination);
      } catch (error) {
        const { response } = error;
        if (response && response.statusCode === 404) {
          console.log(chalk.yellow(`Skipping ${flaw.src} (404)`));
          continue;
        } else if (error.code === "ETIMEDOUT" || error.code === "ENOTFOUND") {
          console.log(chalk.yellow(`Skipping ${flaw.src} (${error.code})`));
          continue;
        } else {
          console.error(error);
          throw error;
        }
      }
    }
    newRawBody = replaceMatchesInText(flaw.src, newRawBody, newSrc, {
      inAttribute: "src",
    });
    if (loud) {
      console.log(
        chalk.grey(
          `${phrasing} (${flaw.id}) image ${chalk.white.bold(
            flaw.src
          )} to ${chalk.white.bold(newSrc)}`
        )
      );
    }
  }

  // Any 'image_widths' flaws with a suggestion
  for (const flaw of doc.flaws.image_widths || []) {
    if (!flaw.fixable) {
      continue;
    }
    newRawBody = replaceMatchesInText(flaw.style, newRawBody, flaw.suggestion, {
      inAttribute: "style",
      removeEntireAttribute: flaw.suggestion === "",
    });
    if (loud) {
      console.log(
        flaw.suggestion === ""
          ? chalk.grey(
              `${phrasing} (${flaw.id}) image_widths ${chalk.white.bold(
                "remove entire 'style' attribute"
              )}`
            )
          : chalk.grey(
              `${phrasing} (${flaw.id}) image_widths style="${chalk.white.bold(
                flaw.style
              )}" to style="${chalk.white.bold(flaw.suggestion)}"`
            )
      );
    }
  }

  // Finally, summarized what happened...
  if (newRawBody !== rawBody) {
    // It changed the raw HTML of the source. So deal with this.
    if (options.fixFlawsDryRun) {
      console.log(
        chalk.yellow(
          `Would modify "${document.fileInfo.path}" from fixable flaws.`
        )
      );
    } else {
      Document.update(document.url, newRawBody, document.metadata, isMarkdown);
      if (options.fixFlawsVerbose) {
        console.log(
          chalk.green(
            `Modified "${chalk.bold(
              document.fileInfo.path
            )}" from fixable flaws.`
          )
        );
      }
    }
  }
}

function getImageminPlugin(fileName) {
  const extension = path.extname(fileName).toLowerCase();
  if (extension === ".jpg" || extension === ".jpeg") {
    return imageminMozjpeg();
  }
  if (extension === ".png") {
    return imageminPngquant();
  }
  if (extension === ".gif") {
    return imageminGifsicle();
  }
  if (extension === ".svg") {
    return imageminSvgo();
  }
  throw new Error(`No imagemin plugin for ${extension}`);
}

module.exports = { injectFlaws, injectSectionFlaws, fixFixableFlaws };
