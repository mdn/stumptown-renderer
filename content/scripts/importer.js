const url = require("url");
const fs = require("fs");
const path = require("path");
const mysql = require("mysql");
const cheerio = require("cheerio");
const sanitizeFilename = require("sanitize-filename");
const yaml = require("js-yaml");
const assert = require('assert').strict;

const ProgressBar = require("./progress-bar");

const REDIRECT_HTML = "REDIRECT <a ";

// Any slug that starts with one of these prefixes goes into a different
// folder; namely the archive folder.
// Case matters but 100% of Prod slugs are spelled like this. I.e.
// there's *no* slug that is something like this 'archiVe/Foo/Bar'.
const ARCHIVE_SLUG_PREFIXES = [
  "Archive",
  "BrowserID",
  "Debugging",
  "Extensions",
  "Firefox_OS",
  "Garbage_MixedContentBlocker",
  "Gecko",
  "Hacking_Firefox",
  "Interfaces",
  "Mercurial",
  "Mozilla",
  "Multi-Process_Architecture",
  "NSS",
  "nsS",
  "Performance",
  "Persona",
  "Preferences_System",
  "Sandbox",
  "SpiderMonkey",
  "Thunderbird",
  "XML_Web_Services",
  "XUL",
  "XULREF",
  "Zones"
];

async function runImporter(options, logger) {
  const creds = url.parse(options.dbURL);
  const host = creds.host; // XXX should it be creds.hostname??
  const user = (creds.auth && creds.auth.split(":")[0]) || "";
  const password = (creds.auth && creds.auth.split(":")[1]) || "";
  const database = creds.pathname.split("/")[1];

  logger.info(
    `Going to try to connect to ${database} (locales=${options.locales})`
  );
  logger.info(
    `Going to exclude the following slug prefixes: ${options.excludePrefixes}`
  );

  const connection = mysql.createConnection({
    host,
    user,
    password,
    database
  });
  connection.connect();

  const importer = new ToDiskImporter(connection, options, logger, () => {
    connection.end();
  });

  console.time("Time to fetch all contributors");
  await importer.fetchAllContributors();
  console.timeEnd("Time to fetch all contributors");
  console.time("Time to fetch all translation relationships");
  await importer.fetchAllTranslationRelationships();
  console.timeEnd("Time to fetch all translation relationships");

  importer.start();
}

function buildAbsoluteUrl(locale, slug) {
  return `/${locale}/docs/${slug}`;
}

/** The basic class that takes a connection and options, and a callback to
 * be called when all rows have been processed.
 * The only API function is the `start` method. Example:
 *
 *     const options = { locales: ['en-US'] }
 *     const importer = new Importer(someDbConnection, options, () => {
 *        someDbConnection.close();
 *     })
 *     importer.start();
 *
 * The most important methods to override are:
 *
 *     - processRow()
 *     -   or, processRedirect()
 *     -   or, processDocument()
 *     - end()
 *
 */
class Importer {
  constructor(connection, options, logger, quitCallback) {
    this.connection = connection;
    this.options = options;
    this.logger = logger;
    this.quitCallback = quitCallback;

    // A map of document_id => [user_id, user_idX, user_idY]
    // where the user IDs are inserted in a descending order. Meaning, the
    // user IDs of the *most recently created document revisions* come first.
    this.allContributors = {};
    // Just a map of user_id => username
    this.allUsernames = {};

    this.progressBar = !options.noProgressbar
      ? new ProgressBar({
          includeMemory: true
        })
      : null;

    // Mutable for all redirects
    this.allRedirects = {};
    this.improvedRedirects = 0;
    this.messedupRedirects = 0;
  }
  initProgressbar(total) {
    this.progressBar && this.progressBar.init(total);
  }
  tickProgressbar(incr) {
    this.progressBar && this.progressBar.update(incr);
  }
  stopProgressbar() {
    this.progressBar && this.progressBar.stop();
  }

  start() {
    // Count of how many rows we've processed
    let individualCount = 0;
    let totalCount = 0; // this'll soon be set by the first query

    this.startTime = Date.now();

    // Let's warm up by seeing we can connect to the wiki_document table
    // and extract some stats.
    const { constraintsSQL, queryArgs } = this._getSQLConstraints({
      alias: "w"
    });
    let sql = `
      SELECT
      w.locale, COUNT(*) AS count
      FROM wiki_document w ${constraintsSQL}
    `;
    sql += " group by w.locale ORDER by count DESC ";

    // First make a table of locale<->counts
    this.connection.query(sql, queryArgs, (error, results) => {
      if (error) {
        console.error("Unable to connect to MySQL.");
        throw error;
      }

      console.log(`LOCALE\tDOCUMENTS`);
      let countNonEnUs = 0;
      let countEnUs = 0;
      results.forEach(result => {
        console.log(`${result.locale}\t${result.count.toLocaleString()}`);
        totalCount += result.count;
        if (result.locale === "en-US") {
          countEnUs += result.count;
        } else {
          countNonEnUs += result.count;
        }
      });
      if (countNonEnUs && countEnUs) {
        const nonEnUsPercentage =
          (100 * countNonEnUs) / (countNonEnUs + countEnUs);
        console.log(
          `(FYI ${countNonEnUs.toLocaleString()} (${nonEnUsPercentage.toFixed(
            1
          )}%) are non-en-US)`
        );
      }
      // return this.quitCallback();

      // If something needs to be done to where files will be written.
      this.prepareRoots();

      this.initProgressbar(totalCount);

      // Actually do the imported
      sql = `
        SELECT
          w.id,
          w.title,
          w.slug,
          w.locale,
          w.is_redirect,
          w.html,
          w.rendered_html,
          w.modified,
          p.id AS parent_id,
          p.slug AS parent_slug,
          p.locale AS parent_locale,
          p.modified AS parent_modified
        FROM wiki_document w
        LEFT OUTER JOIN wiki_document p ON w.parent_id = p.id
        ${constraintsSQL}
      `;

      const query = this.connection.query(sql, queryArgs);
      query
        .on("error", err => {
          // Handle error, an 'end' event will be emitted after this as well
          console.error("Error event!");
          throw err;
        })
        .on("result", row => {
          individualCount++;
          // Only update (and repaint) every 20th time.
          // Make it much more than every 1 time or else it'll flicker.
          individualCount % 20 == 0 && this.tickProgressbar(individualCount);

          this.processRow(row, () => {});
          // // Pausing the connnection is useful if your processing involves I/O
          // connection.pause();

          // processRow(row, function() {
          //   connection.resume();
          // });
        })
        .on("end", () => {
          this.end(individualCount);
        });
    });
  }

  fetchAllContributors() {
    const { constraintsSQL, queryArgs } = this._getSQLConstraints({
      joinTable: "wiki_document",
      includeDeleted: true,
      alias: "d"
    });
    let sql =
      `SELECT r.document_id, r.creator_id FROM wiki_revision r
      inner join wiki_document d on r.document_id = d.id
      ` + constraintsSQL;
    sql += " ORDER BY r.created DESC ";

    return new Promise((resolve, reject) => {
      console.log("Going to fetch ALL contributor *mappings*");
      this.connection.query(sql, queryArgs, (error, results) => {
        if (error) {
          return reject(error);
        }
        const contributors = {};
        results.forEach(result => {
          if (!(result.document_id in contributors)) {
            contributors[result.document_id] = []; // Array because order matters
          }
          if (!contributors[result.document_id].includes(result.creator_id)) {
            contributors[result.document_id].push(result.creator_id);
          }
        });
        this.allContributors = contributors;

        console.log("Going to fetch ALL contributor *usernames*");
        let sql = "SELECT id, username FROM auth_user";
        this.connection.query(sql, queryArgs, (error, results) => {
          if (error) {
            return reject(error);
          }
          const usernames = {};
          results.forEach(result => {
            usernames[result.id] = result.username;
          });
          this.allUsernames = usernames;

          resolve();
        });
      });
    });
  }

  fetchAllTranslationRelationships() {
    const { constraintsSQL, queryArgs } = this._getSQLConstraints({
      alias: "d"
    });
    let sql =
      `SELECT d.id, d.parent_id, d.slug, d.locale FROM wiki_document d
      ` + constraintsSQL;
    sql += `
      AND d.parent_id IS NOT NULL
      ORDER BY d.locale
    `;

    return new Promise((resolve, reject) => {
      console.log("Going to fetch ALL parents");
      this.connection.query(sql, queryArgs, (error, results) => {
        if (error) {
          return reject(error);
        }
        const translations = {};
        results.forEach(result => {
          if (!(result.parent_id in translations)) {
            translations[result.parent_id] = [];
          }
          translations[result.parent_id].push({
            slug: result.slug,
            locale: result.locale
          });
        });
        this.allTranslations = translations;
        resolve();
      });
    });
  }

  _getSQLConstraints({
    joinTable = null,
    alias = null,
    includeDeleted = false
  } = {}) {
    // Yeah, this is ugly but it bloody works for now.
    const a = alias ? `${alias}.` : "";
    const extra = [];
    const queryArgs = [];
    // Always exclude these. These are straggler documents that don't yet
    // have a revision
    extra.push(`${a}current_revision_id IS NOT NULL`);
    // There aren't many but these get excluded in kuma anyway.
    extra.push(`${a}html <> ''`);

    if (!includeDeleted) {
      extra.push(`${a}deleted = false`);
    }
    const { locales, excludePrefixes } = this.options;
    if (locales.length) {
      extra.push(`${a}locale in (?)`);
      queryArgs.push(locales);
    }
    if (excludePrefixes.length) {
      extra.push(
        "NOT (" + excludePrefixes.map(_ => `${a}slug LIKE ?`).join(" OR ") + ")"
      );
      queryArgs.push(...excludePrefixes.map(s => `${s}%`));
    }

    let sql = " ";
    if (joinTable) {
      sql += `INNER JOIN ${joinTable} ON document_id=${joinTable}.id `;
    }

    return {
      constraintsSQL: sql + extra.length ? ` WHERE ${extra.join(" AND ")}` : "",
      queryArgs
    };
  }

  prepareRoots() {
    // In case anything needs to be done to this.sources
  }

  isArchiveDoc(row) {
    return ARCHIVE_SLUG_PREFIXES.some(prefix =>
      row.slug.startsWith(prefix) ||
      (row.parent_slug && row.parent_slug.startsWith(prefix))
    );
  }

  processRow(row, resumeCallback) {
    const isArchive = this.isArchiveDoc(row);
    const absoluteUrl = buildAbsoluteUrl(row.locale, row.slug);
    if (row.is_redirect) {
      if (isArchive) {
        // Note! If a document is considered archive, any redirect is
        // simply dropped!
      } else {
        this.processRedirect(row, absoluteUrl);
      }
    } else {
      this.processDocument(row, isArchive);
    }
    resumeCallback();
  }

  processRedirect(doc, absoluteUrl) {
    if (doc.html.includes(REDIRECT_HTML)) {
      const redirectUrl = this.getRedirectURL(doc.html);
      if (redirectUrl) {
        if (redirectUrl.includes("://")) {
          console.warn(
            "WEIRD REDIRECT:",
            redirectUrl,
            "  FROM  ",
            `https://developer.mozilla.org${encodeURI(absoluteUrl)}`,
            doc.html
          );
        }
        // A lot of documents redirect to the old URL style.
        // E.g. `/en-us/docs/Foo` --> `/docs/en/Bar`.
        // Fix those to it becomes `/en-us/docs/Foo` --> `/en-us/docs/Bar`
        // But if the redirect was `/en-us/docs/Foo` --> `/docs/en/Foo`
        // then just drop those.
        if (redirectUrl.startsWith("/docs/")) {
          const split = redirectUrl.split("/");
          let locale = split[2];
          if (locale === "en") {
            locale = "en-US";
          }
          split.splice(2, 1);
          split.splice(1, 0, locale);
          const fixedRedirectUrl = split.join("/");
          if (fixedRedirectUrl === absoluteUrl) {
            this.messedupRedirects++;
          } else {
            this.improvedRedirects++;
            this.allRedirects[absoluteUrl] = fixedRedirectUrl;
          }
        } else {
          this.allRedirects[absoluteUrl] = redirectUrl;
        }
      }
    } else {
      console.log(`${doc.locale}/${doc.slug} is direct but not REDIRECT_HTML`);
    }
  }

  processDocument(doc, absoluteUrl) {
    throw new Error("Not implemented");
  }

  saveAllRedirects() {
    throw new Error("Not implemented");
  }

  end(individualCount) {
    // all rows have been received
    this.stopProgressbar();
    this.saveAllRedirects();

    if (this.improvedRedirects) {
      console.log(
        `${this.improvedRedirects.toLocaleString()} redirects were corrected as they used the old URL style.`
      );
    }
    if (this.messedupRedirects) {
      console.log(
        `${this.messedupRedirects} redirects were ignored because they would lead to an infinite redirect loop.`
      );
    }

    const endTime = Date.now();
    const secondsTook = (endTime - this.startTime) / 1000;
    function fmtSecs(s) {
      if (s > 60) {
        const m = Math.floor(s / 60);
        s = Math.floor(s % 60);
        return `${m}m${s}s`;
      } else {
        return s.toFixed(1);
      }
    }
    console.log(
      `Took ${fmtSecs(
        secondsTook
      )} seconds to process ${individualCount.toLocaleString()} rows.`
    );
    console.log(
      `Roughly ${(individualCount / secondsTook).toFixed(1)} rows/sec.`
    );

    this.quitCallback();
  }

  cleanSlugForFoldername(slug) {
    return slug
      .toLowerCase()
      .split(path.sep)
      .map(sanitizeFilename)
      .join(path.sep);
  }

  getRedirectURL(html) {
    /**
     * Sometimes the HTML is like this:
     *   'REDIRECT <a class="redirect" href="/docs/http://wiki.commonjs.org/wiki/C_API">http://wiki.commonjs.org/wiki/C_API</a>'
     * and sometimes it's like this:
     *   'REDIRECT <a class="redirect" href="/en-US/docs/Web/API/WebGL_API">WebGL</a>'
     *
     * So we need the "best of both worlds".
     * */
    const $ = cheerio.load(html);
    for (const a of $("a[href].redirect").toArray()) {
      const hrefHref = $(a).attr("href");
      const hrefText = $(a).text();
      let href;
      if (
        hrefHref.startsWith("/docs/http") ||
        hrefHref.startsWith("/docs/en/http")
      ) {
        href = hrefText;
      } else {
        href = hrefHref;
      }
      if (href.startsWith("https://developer.mozilla.org")) {
        return url.parse(href).pathname;
      } else if (href.startsWith("/") && !href.startsWith("//")) {
        return href;
      }
    }
    return null;
  }
}

/** Same as Importer but will dump to disk */
class ToDiskImporter extends Importer {
  prepareRoots() {
    if (!this.options.archiveRoot) throw new Error("woot?!");
    if (!this.options.root) throw new Error("waat?!");
    if (this.options.root === this.options.archiveRoot) throw new Error("eh?!");

    if (this.options.startClean) {
      // Experimental new feature
      // https://nodejs.org/api/fs.html#fs_fs_rmdirsync_path_options
      let label = `Delete all of ${this.options.root}`;
      console.time(label);
      fs.rmdirSync(this.options.root, { recursive: true });
      console.timeEnd(label);
      label = `Delete all of ${this.options.archiveRoot}`;
      console.time(label);
      fs.rmdirSync(this.options.archiveRoot, { recursive: true });
      console.timeEnd(label);
    }
    fs.mkdirSync(this.options.root, { recursive: true });
    fs.mkdirSync(this.options.archiveRoot, { recursive: true });
  }

  processDocument(doc, isArchive) {
    const { slug, locale, title } = doc;

    const localeFolder = path.join(
      isArchive ? this.options.archiveRoot : this.options.root,
      locale.toLowerCase()
    );

    const folder = path.join(localeFolder, this.cleanSlugForFoldername(slug));
    fs.mkdirSync(folder, { recursive: true });
    const htmlFile = path.join(folder, "index.html");

    // XXX As of right now, we don't have a KS shim that converts "raw Kuma HTML"
    // to rendered HTML. So we'll cheat by copying the `rendered_html`.
    // fs.writeFileSync(htmlFile, doc.html);
    // Extra confusing is that archived slugs never store the Kuma raw HTML.
    // It always just used the rendered_html.
    if (isArchive) {
      fs.writeFileSync(htmlFile, doc.rendered_html);
    } else {
      fs.writeFileSync(htmlFile, doc.rendered_html);
    }

    const wikiHistoryFile = path.join(folder, "wikihistory.json");
    const metaFile = path.join(folder, "index.yaml");

    const meta = {
      title,
      slug
    };
    if (isArchive) {
      meta.archived = true;
    }
    const wikiHistory = {
      modified: doc.modified.toISOString(),
      _generated: new Date().toISOString()
    };

    if (doc.parent_slug) {
      assert(doc.parent_locale === "en-US");
      meta.translationof = doc.parent_slug;
    }

    // let otherTranslations = this.allTranslations[doc.id] || [];
    // if (
    //   !otherTranslations.length &&
    //   doc.parent_id &&
    //   this.allTranslations[doc.parent_id]
    // ) {
    //   // This document is a child and its parent has translations.
    //   // otherTranslations = this.allTranslations[doc.parent_id];
    // }
    // if (otherTranslations.length) {
    //   meta.other_translations = otherTranslations;
    // }
    fs.writeFileSync(metaFile, yaml.safeDump(meta));

    const contributors = (this.allContributors[doc.id] || []).map(
      userId => this.allUsernames[userId]
    );
    if (contributors.length) {
      wikiHistory.contributors = contributors;
    }
    fs.writeFileSync(wikiHistoryFile, JSON.stringify(wikiHistory, null, 2));

    // XXX At the moment, we're pretending we have the KS shim, and that means
    // we'll have access to the raw (full of macros) string which'll be
    // useful to infer certain things such as how the {{Compat(...)}}
    // macro is used. But for now, we'll inject it into the metadata:
    if (!isArchive) {
      const rawFile = path.join(folder, "raw.html");
      fs.writeFileSync(rawFile, doc.html);
    }
  }

  saveAllRedirects() {
    const byLocale = {};
    Object.entries(this.allRedirects).forEach(([fromUrl, toUrl]) => {
      const locale = fromUrl.split("/")[1];
      if (!(locale in byLocale)) {
        byLocale[locale] = [];
      }
      byLocale[locale].push([fromUrl, toUrl]);
    });
    const countPerLocale = [];
    Object.entries(byLocale).forEach(([locale, pairs]) => {
      pairs.sort((a, b) => {
        if (a[0] < b[0]) return -1;
        if (a[0] > b[0]) return 1;
        return 0;
      });
      countPerLocale.push([locale, pairs.length]);
      const filePath = path.join(this.options.root, locale, "_redirects.txt");
      const writeStream = fs.createWriteStream(filePath);
      writeStream.write(`# FROM-URL\tTO-URL\n`);
      pairs.forEach(([fromUrl, toUrl]) => {
        writeStream.write(`${fromUrl}\t${toUrl}\n`);
      });
      writeStream.end();
      this.logger.info(`Wrote all ${locale} redirects to ${filePath}`);
    });

    this.logger.info("# Redirects per locale");
    countPerLocale.sort((a, b) => b[1] - a[1]);
    countPerLocale.forEach(([locale, count]) => {
      this.logger.info(`${locale.padEnd(10)}${count.toLocaleString()}`);
    });
  }
}

module.exports = {
  runImporter
};
