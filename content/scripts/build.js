const fs = require("fs");
const path = require("path");
const nodeUrl = require("url");
const crypto = require("crypto");
const childProcess = require("child_process");
const { performance } = require("perf_hooks");

const got = require("got");
const chalk = require("chalk");
const yaml = require("js-yaml");
const sanitizeFilename = require("sanitize-filename");
const chokidar = require("chokidar");
const WebSocket = require("ws");
const { HtmlDiffer } = require("html-differ");
const htmlDifferlogger = require("html-differ/lib/logger");
// XXX does this work on Windows?
const packageJson = require("../../package.json");

require("dotenv").config();

const cheerio = require("./monkeypatched-cheerio");
const ProgressBar = require("./progress-bar");
const { buildHtmlAndJsonFromDoc } = require("ssr");
const {
  extractDocumentSections,
  extractSidebar,
} = require("./document-extractor");
const { BUILD_TIMEOUT, VALID_LOCALES } = require("./constants");
const { slugToFoldername } = require("./utils");
const { timeout } = require("./promise-timeout.js");

const KSRenderer = require("kumascript");

const MAX_OPEN_FILES = 256;
const htmlDiffer = new HtmlDiffer();

function getCurretGitHubBaseURL() {
  return packageJson.repository;
}

// Module level global that gets set once and reused repeatedly
let _currentGitBranch = null;
function getCurrentGitBranch(fallback = "master") {
  if (!_currentGitBranch) {
    // XXX Fixme with what you'd get in the likes of TravisCI!
    if (process.env.CI_CURRENT_BRANCH) {
      _currentGitBranch = process.env.CI_CURRENT_BRANCH;
    } else {
      const spawned = childProcess.spawnSync("git", [
        "branch",
        "--show-current",
      ]);
      if (spawned.error) {
        console.warn(
          "Unable to run 'git branch' to find out name of the current branch. Error:",
          spawned.error
        );
        return fallback;
      } else {
        return spawned.stdout.toString().trim();
      }
    }
  }
  return _currentGitBranch;
}

// XXX is this the best way??
function isTTY() {
  return !!process.stdout.columns;
}

/** Given a array of locales, return it "cleaned up".
 * For example, they should always be lowercase and whitespace stripped.
 * and if they locale (case INsensitively) is not in VALID_LOCALES it
 * should throw an error.
 */
function cleanLocales(locales) {
  const clean = [];
  for (const locale of locales) {
    // The user *might* type locales as a comma separated strings.
    // Explode those split by ','.
    if (locale.includes(",")) {
      clean.push(...locale.split(",").map((l) => l.toLowerCase()));
    } else {
      // As a convenience, we know that every locale folder is always lowercase,
      // but it's very possible that someone specifies it in NOT lowercase.
      // E.g '--locales en-US'. So just lowercase them all.
      clean.push(locale.toLowerCase());
    }
  }
  return clean.filter((x) => {
    if (x) {
      if (!VALID_LOCALES.has(x)) {
        throw new Error(`'${x}' is not a valid locale (see VALID_LOCALES)`);
      }
    }
    return x;
  });
}

/** Needs doc string */
function triggerTouch(filepath, document, root) {
  const changedFile = {
    path: filepath,
    name: path.relative(root, filepath),
  };
  const data = {
    documentUri: document.mdn_url,
    changedFile,
    hasEDITOR: Boolean(process.env.EDITOR),
  };
  broadcastWebsocketMessage(JSON.stringify(data));
}

/** Needs doc string */
function buildMDNUrl(locale, slug) {
  if (!locale) throw new Error("locale falsy!");
  if (!slug) throw new Error("slug falsy!");
  return `/${locale}/docs/${slug}`;
}

function extractLocale(source, folder) {
  // E.g. 'pt-br/web/foo'
  const relativeToSource = path.relative(source.filepath, folder);
  // E.g. 'pr-br'
  const localeFolderName = relativeToSource.split(path.sep)[0];
  // E.g. 'pt-BR'
  const locale = VALID_LOCALES.get(localeFolderName);
  // This checks that the extraction worked *and* that the locale found
  // really is in VALID_LOCALES *and* it ultimately returns the
  // locale as we prefer to spell it (e.g. 'pt-BR' not 'Pt-bR')
  if (!locale) {
    throw new Error(`Unable to figure out locale from ${folder}`);
  }
  return locale;
}

/** Throw an error if the slug is insane.
 * This helps breaking the build if someone has put in faulty data into
 * the content (metadata file).
 * If all is well, do nothing. Nothing is expected to return.
 */
function validateSlug(slug) {
  if (!slug) {
    throw new Error("slug is empty");
  }
  if (slug.startsWith("/")) {
    throw new Error(`Slug '${slug}' starts with a /`);
  }
  if (slug.endsWith("/")) {
    throw new Error(`Slug '${slug}' ends with a /`);
  }
  if (slug.includes("//")) {
    throw new Error(`Slug '${slug}' contains a double /`);
  }
}

let webSocketServer = null;
function broadcastWebsocketMessage(msg) {
  if (!webSocketServer) {
    console.warn("No WebSocket server started");
    return;
  }
  // let i = 0;
  webSocketServer.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      // i++;
      // console.log(`SENDING (${i})...`, msg);
      client.send(msg);
    }
  });
  // console.log(`Sent to ${i} open clients`);
}

async function runBuild(sources, options, logger) {
  const builder = new Builder(sources, options, logger);

  if (options.listLocales) {
    return builder.listLocales();
  } else if (options.ensureTitles) {
    return builder.ensureAllTitles();
  } else {
    builder.initSelfHash();
    builder.ensureAllTitles();
    builder.prepareRoots();
    if (!options.watch) {
      return builder.start();
    }
    if (options.watch || options.buildAndWatch) {
      builder.watch();
      console.log("Starting WebSocket (port 8080) to report on builds.");
      webSocketServer = new WebSocket.Server({ port: 8080 });
    }
  }
}

// Enums for return values
const processing = Object.freeze({
  ALREADY: "already",
  PROCESSED: "processed",
  EMPTY: "empty",
  EXCLUDED: "excluded",
});

class Builder {
  constructor(sources, options, logger) {
    this.sources = sources;
    this.destination = options.destination;
    this.options = options;
    this.logger = logger;
    this.selfHash = null;
    this.allTitles = {};
    this.ksRenderer = new KSRenderer();

    this.options.locales = cleanLocales(this.options.locales || []);
    this.options.notLocales = cleanLocales(this.options.notLocales || []);

    this.progressBar = !options.noProgressbar
      ? new ProgressBar({
          includeMemory: true,
        })
      : null;
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

  printProcessing(result, fileWritten) {
    !this.progressBar && this.logger.info(`${result}: ${fileWritten}`);
  }

  // Just print what could be found and exit
  listLocales() {
    for (const source of this.sources.entries()) {
      console.log(`\n${chalk.bold("Source:")} ${chalk.white(source.filepath)}`);
      const counts = this.countLocaleFolders(source);
      const sumCounts = Array.from(counts.values()).reduce((a, b) => a + b, 0);
      Array.from(counts)
        .sort((a, b) => b[1] - a[1])
        .forEach(([locale, count], i) => {
          const percent = sumCounts ? (100 * count) / sumCounts : 0;
          console.log(
            `${chalk.green(locale.padEnd(6))}${count
              .toLocaleString()
              .padStart(10)} ${chalk.grey(
              percent.toFixed(percent > 10 ? 1 : 2) + "%"
            )}`
          );
          if (i === counts.size - 1) {
            // Last one
            console.log(
              `${chalk.green(
                "TOTAL".padEnd(6)
              )}${sumCounts.toLocaleString().padStart(10)} ${chalk.grey(
                " 100%"
              )}`
            );
          }
        });
    }
  }

  *walkSources({ allLocales = false } = {}) {
    for (const source of this.sources.entries()) {
      for (const localeFolder of this.getLocaleRootFolders(source, {
        allLocales,
      })) {
        for (const [folder, files] of walker(localeFolder)) {
          yield { source, localeFolder, folder, files };
        }
      }
    }
  }

  async start({ specificFolders = null } = {}) {
    // This prepares this.selfHash so that when we build files, we can
    // write down which "self hash" was used at the time.
    const self = this;

    if (specificFolders) {
      // Check that they all exist and are folders
      const allProcessed = [];

      await Promise.all(
        specificFolders.map(async (folder) => {
          if (!fs.existsSync(folder)) {
            throw new Error(`${folder} does not exist`);
          }
          if (!fs.statSync(folder).isDirectory()) {
            throw new Error(`${folder} is not a directory`);
          }

          const source = self.sources.entries().find((source) => {
            return folder.startsWith(source.filepath);
          });
          if (!source) {
            throw new Error(`Unable to find the source based on ${folder}`);
          }

          let processed;
          try {
            processed = await timeout(
              self.processFolder(source, folder),
              BUILD_TIMEOUT,
              folder
            );
          } catch (err) {
            // If a crash happens inside processFolder it's hard to debug
            // if you don't know which files/folders caused it. So inject
            // some logging of that before throwing.
            self.logger.error(
              chalk.red(`Error happened processing: ${folder}`)
            );
            self.logger.error(err);
            // XXX need to decide what to do with errors.
            // We could increment a counter and dump all errors to a log file.
            throw err;
          }
          allProcessed.push(processed);
        })
      );

      return allProcessed;
    }

    self.describeActiveSources();
    self.describeActiveFilters();

    // To be able to make a progress bar we need to first count what we're
    // going to need to do.
    if (self.progressBar) {
      const countTodo = self.sources
        .entries()
        .map((source) => self.countLocaleFolders(source))
        .map((m) => Array.from(m.values()).reduce((a, b) => a + b))
        .reduce((a, b) => a + b);
      if (!countTodo) {
        throw new Error("No folders found to process!");
      }
      self.initProgressbar(countTodo);
    }

    let total = 0;

    // Record of counts of all results
    const counts = {};
    Object.values(processing).forEach((key) => {
      counts[key] = 0;
    });

    async function processAndTrackFolder(source, folder) {
      let processed;
      try {
        processed = await timeout(
          self.processFolder(source, folder),
          BUILD_TIMEOUT,
          folder
        );
      } catch (err) {
        // If a crash happens inside processFolder it's hard to debug
        // if you don't know which files/folders caused it. So inject
        // some logging of that before throwing.
        self.logger.error(chalk.red(`Error happened processing: ${folder}`));
        self.logger.error(err);
        // XXX need to decide what to do with errors.
        // We could increment a counter and dump all errors to a log file.
        throw err;
      }
      const { result, file } = processed;
      self.printProcessing(result, file);
      counts[result]++;
      self.tickProgressbar(++total);
    }

    // Start the real processing
    const t0 = new Date();
    let pendingFolders = 0;
    const folderProcessingPromises = [];

    for (const { source, localeFolder, folder, files } of self.walkSources()) {
      if (self.excludeFolder(source, folder, localeFolder, files)) {
        // If the folder was a Stumptown folder, what we're
        // actually excluding is all the .json files in the folder.
        if (source.isStumptown) {
          counts[processing.EXCLUDED] += files.filter((n) =>
            n.endsWith(".json")
          ).length;
        } else {
          counts[processing.EXCLUDED]++;
        }
        continue;
      }

      if (source.isStumptown) {
        // In the case of stumptown, one folder will have multiple
        // files with each representing a document.
        for (const filename of files.filter((n) => n.endsWith(".json"))) {
          const filepath = path.join(folder, filename);
          let processed;
          try {
            processed = self.processStumptownFile(source, filepath);
          } catch (err) {
            // If a crash happens inside processStumptownFile it's hard
            // to debug if you don't know which files/folders caused it.
            // So inject some logging of that before throwing.
            self.logger.error(
              chalk.red(`Error happened processing: ${filepath}`)
            );
            self.logger.error(err);
            throw err;
          }
          const { result, file } = processed;
          self.printProcessing(result, file);
          counts[result]++;
          self.tickProgressbar(++total);
        }
      } else {
        while (pendingFolders > MAX_OPEN_FILES) {
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
        pendingFolders++;
        folderProcessingPromises.push(
          processAndTrackFolder(source, folder).finally(() => pendingFolders--)
        );
      }
    }
    await Promise.all(folderProcessingPromises);
    const t1 = new Date();
    self.dumpAllURLs();
    self.summarizeResults(counts, t1 - t0);
  }

  ensureAllTitles() {
    if (
      Object.keys(this.allTitles).length &&
      !this.options.regenerateAllTitles
    ) {
      // No reason to proceed, the titles have already been loaded into memory.
      return;
    }
    // First walk all the content and pick up all the titles.
    // Note, no matter what locales you have picked in the filtering,
    // *always* include 'en-US' because with that, it becomes possible
    // to reference back to the English version for any locale.
    // But first, see if we can use the title from the last build.
    const allTitlesJsonFilepath = path.join(
      path.dirname(__dirname),
      "_all-titles.json"
    );
    if (
      fs.existsSync(allTitlesJsonFilepath) &&
      !this.options.regenerateAllTitles
    ) {
      // XXX maybe this should become a Map instance.
      this.allTitles = JSON.parse(
        fs.readFileSync(allTitlesJsonFilepath, "utf8")
      );
      // Set the context for the Kumascript renderer.
      this.ksRenderer.use(this.allTitles);
      return;
    }

    // If we're going to generate all titles, we need all popularities.
    const allPopularities = this._getAllPopularities();

    this.logger.info("Building a list of ALL titles and URIs...");
    let t0 = new Date();
    for (const { source, folder, files } of this.walkSources({
      allLocales: true,
    })) {
      if (source.isStumptown) {
        for (const filename of files.filter((n) => n.endsWith(".json"))) {
          const filepath = path.join(folder, filename);
          this.processStumptownFileTitle(source, filepath, allPopularities);
        }
      } else if (files.includes("index.html") && files.includes("index.yaml")) {
        this.processFolderTitle(source, folder, allPopularities);
      }
    }

    // Only after *all* titles have been processed can we iterate over the
    // mapping and figure out all translations.
    // What this does is that it sets `.translations=[{slug, locale}, ...]`
    // on every title that is the "translation_of". Practically, that means
    // that every 'en-US' document that has been translated, will have a list
    // of other locales and slugs.
    let countBrokenTranslationOfDocuments = 0;
    Object.values(this.allTitles)
      .filter((data) => data.translation_of)
      .forEach((data) => {
        const parentURL = buildMDNUrl("en-US", data.translation_of);
        const parentData = this.allTitles[parentURL];

        // TODO: Our dumper is not perfect yet. We still get bad
        // 'translation_of' references.
        // I.e. a localized document's 'index.yaml' says its
        // 'translation_of' is 'Web/Foo/Bar' but there is actually no en-US
        // document by that slug!
        // We're working on it in the dumper and this problem is known also
        // in the 'ensureAllTitles()' method which at least debug logs the
        // bad ones and warn logs about a total count of bad documents.
        // Once the dumper has matured, we'll remove this defensive style and
        // throw an error here. That'll be a form of validation-by-building
        // which can really help our CI trap content edit PRs that sets
        // or gets these references wrong.

        if (parentData) {
          if (!parentData.hasOwnProperty("translations")) {
            parentData.translations = [];
          }
          parentData.translations.push({
            locale: data.locale,
            slug: data.slug,
          });
        } else {
          countBrokenTranslationOfDocuments++;
          this.logger.debug(
            `${data.locale}/${data.slug} (${data.file}) refers to a ` +
              "en-US translation_of that doesn't exist."
          );
        }
      });
    if (countBrokenTranslationOfDocuments) {
      this.logger.warn(
        chalk.yellow(
          `${countBrokenTranslationOfDocuments.toLocaleString()} documents ` +
            "have a 'translation_of' that can actually not be found."
        )
      );
    }

    // Set the context for the Kumascript renderer.
    this.ksRenderer.use(this.allTitles);

    fs.writeFileSync(
      allTitlesJsonFilepath,
      JSON.stringify(this.allTitles, null, 2)
    );
    let t1 = new Date();
    this.logger.info(
      chalk.green(`Building list of all titles took ${ppMilliseconds(t1 - t0)}`)
    );
  }

  async watch() {
    const onChange = async (filepath, source) => {
      const folder = path.dirname(filepath);
      this.logger.info(`${chalk.bold("change")} in ${folder}`);
      const t0 = performance.now();
      const { result, file, doc } = await timeout(
        this.processFolder(source, folder),
        10, // seconds
        folder
      );
      const t1 = performance.now();

      const tookStr = ppMilliseconds(t1 - t0);
      console.log(
        `${
          result === processing.PROCESSED
            ? chalk.green(result)
            : chalk.yellow(result)
        }: ${chalk.white(file)} ${chalk.grey(tookStr)}`
      );
      if (result === processing.PROCESSED) {
        triggerTouch(filepath, doc, source.filepath);
      }
    };

    this.sources
      .entries()
      .filter((source) => source.watch)
      .forEach((source) => {
        const watchdir = path.resolve(source.filepath);

        console.log(chalk.yellow(`Setting up file watcher on ${watchdir}...`));
        const watcher = chokidar.watch(path.join(watchdir, "**/*.(html|yaml)"));
        watcher.on("change", (path) => {
          onChange(path, source);
        });
        watcher.on("ready", () => {
          const watchedPaths = watcher.getWatched();
          const folders = Object.values(watchedPaths);
          const count = folders
            .map((list) => list.length)
            .reduce((a, b) => a + b, 0);
          console.log(
            chalk.yellow(
              `File watcher set up for ${watchdir}. ` +
                `Watching over ${count.toLocaleString()} files in ${folders.length.toLocaleString()} folders.`
            )
          );
          if (isTTY()) {
            console.log("Hit Ctrl-C to quit the watcher when ready.");
          }
        });
      });
  }

  describeActiveSources() {
    const sourcesHuman = this.sources.entries().map((s, i) => {
      let out = `${i + 1}. ${s.filepath}`;
      if (s.isStumptown) {
        out += `\t(stumptown)`;
      } else if (s.htmlAlreadyRendered) {
        out += `\t(html already rendered)`;
      }
      return out;
    });
    console.log(
      chalk.yellow(`Current sources...\n\t${sourcesHuman.join("\n\t")}\n`)
    );
  }

  describeActiveFilters() {
    const filtersHuman = [];
    if (this.options.locales.length) {
      filtersHuman.push(`Locales: ${JSON.stringify(this.options.locales)}`);
    } else if (this.options.notLocales.length) {
      filtersHuman.push(
        `Not locales: ${JSON.stringify(this.options.notLocales)}`
      );
    }
    if (this.options.foldersearch.length) {
      filtersHuman.push(
        `Folders: ${JSON.stringify(this.options.foldersearch)}`
      );
    }
    if (filtersHuman.length) {
      console.log(
        chalk.yellow(`Current filters...\n\t${filtersHuman.join("\n\t")}\n`)
      );
    }
  }

  prepareRoots() {
    for (const source of this.sources.entries()) {
      for (const localeFolder of this.getLocaleRootFolders(source)) {
        this.prepareRoot(path.basename(localeFolder));
      }
    }
  }

  initSelfHash() {
    const contentRoot = path.resolve(__dirname, "..");
    const ssrRoot = path.resolve(__dirname, "..", "..", "ssr");
    this.selfHash = makeHash([
      // This'll be different when new packages are changed like
      // `mdn-browser-compat-data` but we *could* be more explicit but
      // this'll be on the safe side.
      path.join(contentRoot, "package.json"),
      // This is broad but let's make it depend on every .js file
      // in this file's folder
      ...simpleGlob(contentRoot, ".js"),
      ...simpleGlob(path.join(contentRoot, "scripts"), ".js"),
      // Also factor in the ssr builder's package.json
      path.join(ssrRoot, "package.json"),
      // and it's .js files
      ...simpleGlob(ssrRoot, ".js"),
    ]);
  }

  prepareRoot(locale) {
    if (!this.options.destination) {
      throw new Error("options.destination not set");
    }
    const folderpath = path.join(
      this.options.destination,
      locale.toLowerCase()
    );
    if (this.options.startClean) {
      // Experimental new feature
      // https://nodejs.org/api/fs.html#fs_fs_rmdirsync_path_options
      fs.rmdirSync(folderpath, { recursive: true });
    }
    fs.mkdirSync(folderpath, { recursive: true });
  }

  _getAllPopularities() {
    const { popularitiesfile } = this.options;
    if (popularitiesfile) {
      const allPopularities = JSON.parse(
        fs.readFileSync(popularitiesfile, "utf8")
      );
      this.logger.info(
        chalk.magenta(
          `Parsed ${Object.keys(
            allPopularities
          ).length.toLocaleString()} popularities.`
        )
      );
      return allPopularities;
    }
    // If the popularitiesfile isn't available you simply get
    // no popularity numbers set on any of the documents.
    return {};
  }

  summarizeResults(counts, took) {
    console.log("\n");
    console.log(chalk.green("Summary of build:"));
    const totalProcessed = counts[processing.PROCESSED];
    // const totalDocuments = Object.values(counts).reduce((a, b) => a + b);
    const rate = (1000 * totalProcessed) / took; // per second
    console.log(
      chalk.yellow(
        `Processed ${totalProcessed.toLocaleString()} in ${ppMilliseconds(
          took
        )} (roughly ${rate.toFixed(1)} docs/sec)`
      )
    );
    Object.keys(counts)
      .sort()
      .map((key) => {
        const count = counts[key];
        console.log(`${key.padEnd(12)}: ${count.toLocaleString()}`);
      });
  }

  /** `this.allTitles` is a map of mdn_url => object that contains useful
   * for the SSR work. This function dumps just the necessary data of that,
   * per locale, to the final destination.
   */
  dumpAllURLs() {
    const t0 = new Date();
    // First regroup ALL URLs into buckets per locale.
    const byLocale = {};
    const mostModified = {};
    for (let [uri, data] of Object.entries(this.allTitles)) {
      // XXX skip locales not in this.options.locales and
      // this.options.notLocales etc.

      if (!(data.locale in byLocale)) {
        byLocale[data.locale] = {};
        mostModified[data.locale] = data.modified;
      }
      byLocale[data.locale][uri] = data;
      if (data.modified > mostModified[data.locale]) {
        mostModified[data.locale] = data.modified;
      }
    }

    const { sitemapBaseUrl } = this.options;
    const allSitemapsBuilt = [];
    const allTitlesBuilt = [];
    Object.entries(byLocale).forEach(([locale, data]) => {
      if (!this.options.noSitemaps) {
        // For every locale, build a
        // `$DESTINATION/sitemaps/$LOCALE/sitemap_other.xml` and
        // `$DESTINATION/sitemaps/$LOCALE/sitemap.xml`

        const sitemapXml = makeSitemapXML(
          Object.entries(data)
            .filter(([uri, documentData]) => {
              return !documentData.excludeInSitemaps;
            })
            .map(([uri, documentData]) => {
              if (!documentData.modified) {
                throw new Error("No .modified in documentData");
              }
              return {
                loc: sitemapBaseUrl + uri,
                lastmod: documentData.modified.split("T")[0],
              };
            })
        );
        const sitemapsDir = path.join(
          this.destination,
          "sitemaps",
          locale.toLowerCase()
        );
        fs.mkdirSync(sitemapsDir, { recursive: true });
        const sitemapFilepath = path.join(sitemapsDir, "sitemap.xml");
        fs.writeFileSync(sitemapFilepath, sitemapXml);
        allSitemapsBuilt.push(locale);
        this.logger.debug(`Wrote: ${sitemapFilepath}`);
      }

      // Dump a `titles.json` into each locale folder
      const titles = {};
      Object.entries(data)
        .filter(([uri, documentData]) => {
          return !documentData.excludeInTitlesJson;
        })
        .forEach(([uri, documentData]) => {
          // This is the data that gets put into each 'titles.json` file which
          // gets XHR downloaded by the React autocomplete search widget.
          // So, it's important to only inject the absolutely minimum because
          // network bytes matter.
          titles[uri] = {
            title: documentData.title,
            popularity: documentData.popularity,
          };
        });

      const localeFolder = path.join(this.destination, locale.toLowerCase());
      fs.mkdirSync(localeFolder, { recursive: true });
      const titlesFilepath = path.join(localeFolder, "titles.json");
      fs.writeFileSync(titlesFilepath, JSON.stringify({ titles }, null, 2));
      allTitlesBuilt.push(titlesFilepath);
    });
    this.logger.info(
      chalk.green(`${allTitlesBuilt.length} titles.json files created`)
    );

    // Need to make the generic /sitemap.xml for all sitemaps
    if (!this.options.noSitemaps) {
      const allSitemapXml = makeSitemapXML(
        allSitemapsBuilt.map((locale) => {
          return {
            loc: sitemapBaseUrl + `/sitemaps/${locale}/sitemap.xml`,
            lastmod: mostModified[locale],
          };
        })
      );
      const allSitemapFilepath = path.join(this.destination, "sitemap.xml");
      fs.writeFileSync(allSitemapFilepath, allSitemapXml);
      this.logger.debug(`Wrote ${allSitemapFilepath}`);
    }

    const t1 = new Date();
    console.log(
      chalk.yellow(
        `Dumping all URLs to sitemaps and titles.json took ${ppMilliseconds(
          t1 - t0
        )}`
      )
    );
  }

  /** Return true if for any reason this folder should not be processed */
  excludeFolder(source, folder, localeFolder, files) {
    if (this.options.foldersearch.length) {
      // The slice makes it so that `foldername` never starts with a '/'
      // (or '\' on Windows).
      const foldername = folder.replace(localeFolder, "").slice(1);
      if (
        !this.options.foldersearch.some((search) => {
          // The folder search can contain special characters.
          // For example `^web` means `.startswith('web')`.
          // For example `foo/bar/media$` means `.endswith('foo/bar/media$')`.
          // anything else is plainly looking if the string is in the folder name.
          if (search.startsWith("^")) {
            return foldername.startsWith(search.slice(1));
          }
          return foldername.includes(search);
        })
      ) {
        return true;
      }
    }
    if (source.isStumptown) {
      return !files.some((filepath) => filepath.endsWith(".json"));
    } else {
      return !(files.includes("index.html") && files.includes("index.yaml"));
    }
  }

  /**
   * Return an array of full paths for the locale folders.
   * The 'allLocales' parameter means it overrides the
   * 'options.locales` or `options.notLocales` values.
   */
  *getLocaleRootFolders(source, { allLocales = false } = {}) {
    if (!source || !source.filepath) {
      throw new Error("Invalid source");
    }
    const { locales, notLocales } = this.options;
    const files = fs.readdirSync(source.filepath);
    for (const name of files) {
      const filepath = path.join(source.filepath, name);
      const isDirectory = fs.statSync(filepath).isDirectory();
      if (
        isDirectory &&
        (allLocales ||
          ((!locales.length || locales.includes(name)) &&
            (!notLocales || !notLocales.includes(name))))
      ) {
        yield filepath;
      }
    }
  }

  // For a given source, return a mapping of locale-> docs to build.
  // E.g. {'en-us': 123, fr: 9}
  countLocaleFolders(source) {
    let locales = new Map();
    for (const localeFolder of this.getLocaleRootFolders(source)) {
      const locale = path.basename(localeFolder);
      for (const [folder, files] of walker(localeFolder)) {
        if (this.excludeFolder(source, folder, localeFolder, files)) {
          continue;
        }
        if (source.isStumptown) {
          // In stumptown, you'll have multiple .json files per folder.
          // For example `en-us/html/reference/elements/abbr.json` and
          // `en-us/html/reference/elements/video.json` etc.
          locales.set(
            locale,
            (locales.get(locale) || 0) +
              files.filter((x) => x.endsWith(".json")).length
          );
        } else {
          locales.set(locale, (locales.get(locale) || 0) + 1);
        }
      }
    }
    return locales;
  }

  excludeSlug(metadata) {
    // XXX would it be faster to compute a regex in the constructor
    // and use it repeatedly here instead?
    const { slugsearch } = this.options;
    if (slugsearch.length) {
      const { mdn_url } = metadata;
      return !slugsearch.some((search) => mdn_url.includes(search));
    }
    return false;
  }

  async processFolder(source, folder, config) {
    config = config || {};

    const hasher = crypto.createHash("md5");

    const metadataRaw = fs.readFileSync(path.join(folder, "index.yaml"));

    const metadata = yaml.safeLoad(metadataRaw);
    if (this.excludeSlug(metadata)) {
      return { result: processing.EXCLUDED, file: folder };
    }
    hasher.update(metadataRaw);

    if (fs.existsSync(path.join(folder, "wikihistory.yaml"))) {
      const wikiMetadataRaw = fs.readFileSync(
        path.join(folder, "wikihistory.yaml")
      );
      const wikiMetadata = yaml.safeLoad(wikiMetadataRaw);
      metadata.modified = wikiMetadata.modified;
    }

    metadata.locale = extractLocale(source, folder);

    // The destination is the same as source but with a different base.
    // If the file *came from* /path/to/files/en-US/foo/bar/
    // the final destination is /path/to/build/en-US/foo/bar/index.json

    const mdn_url = buildMDNUrl(metadata.locale, metadata.slug);

    const destinationDirRaw = path.join(
      this.destination,
      mdn_url.toLowerCase()
    );
    const destinationDir = path.join(
      this.destination,
      slugToFoldername(mdn_url)
    );

    // const destination = path.join(
    //   folder.replace(this.root, this.destination),
    //   "index.json"
    // );
    const hashDestination = path.join(destinationDir, "_index.hash");

    // When the KS thing works we won't need this line

    // XXX What might be interesting is to make KS do less.
    // The idea is we first have the raw HTML, which'll contain strings
    // like `{{Compat('foo.bar')}}`, then we allow KS turn that into
    // something like `<div class="bc-data" data-query="foo.bar">...`.
    // To avoid KS having to do that, just replace the KS macro with a marker
    // like `<--#Compat('foo.bar')--> and then replace it here in the
    // post-processing instead.

    const rawHtml = fs.readFileSync(path.join(folder, "index.html"), "utf8");
    hasher.update(rawHtml);

    let renderedHtml;

    // When 'source.htmlAlreadyRendered' is true, it simply means that the 'index.html'
    // is already fully rendered HTML.
    if (source.htmlAlreadyRendered) {
      renderedHtml = rawHtml;
    } else {
      // XXX The this.renderHtml() method actually returns a tuple
      // of (renderedHtml, errors) but we're not doing anything with the
      // errors yet. Which we *will* do eventually.
      [renderedHtml] = await this.renderHtml(rawHtml, metadata);
    }

    // Now we've read in all the "inputs" needed.
    // Even if there's no hope in hell that we're going to get a catch hit,
    // we have to compute this hash because on a cache miss, we need to
    // write it down after we've done the work.
    const docHash = hasher.digest("hex").slice(0, 12);
    const combinedHash = `${this.selfHash}.${docHash}`;
    // If the destination and the hash file already exists AND the content
    // of an existing hash file is the same as this `combinedHash` then we
    // can bail early.
    if (
      !this.options.noCache &&
      fs.existsSync(destinationDir) &&
      fs.existsSync(hashDestination) &&
      fs.readFileSync(hashDestination, "utf8") === combinedHash
    ) {
      return {
        result: processing.ALREADY,
        file: path.join(destinationDir, "index.html"),
      };
    }

    // TODO: The slug should always match the folder name.
    // If you edit the slug bug don't correctly edit the folder it's in
    // it's going to lead to confusion.
    // We can use the utils.slugToFoldername() function and compare
    // its output with the `folder`.
    validateSlug(metadata.slug);

    const $ = cheerio.load(`<div id="_body">${renderedHtml}</div>`, {
      // decodeEntities: false
    });

    // Remove those '<span class="alllinks"><a href="/en-US/docs/tag/Web">View All...</a></span>' links
    // Remove any completely empty <p>, <dl>, or <div> tags.
    // XXX costs about 5% longer time
    $("p:empty,dl:empty,div:empty,span.alllinks").remove();

    // let macroCalls = extractMacroCalls(rawHtml);

    // XXX should we get some of this stuff from this.allTitles instead?!
    const doc = {};

    // Note that 'extractSidebar' will always return a string.
    // And if it finds a sidebar section, it gets removed from '$' too.
    doc.sidebarHTML = extractSidebar($, config);
    const sections = extractDocumentSections($, config);

    doc.title = metadata.title;
    doc.mdn_url = mdn_url;
    if (metadata.translation_of) {
      doc.translation_of = metadata.translation_of;
    }
    doc.body = sections;

    const titleData = this.allTitles[doc.mdn_url];
    if (titleData === undefined) {
      throw new Error(`${doc.mdn_url} is not present in this.allTitles`);
    }
    doc.popularity = titleData.popularity || 0.0;
    doc.modified = titleData.modified;

    const otherTranslations = this.allTitles[doc.mdn_url].translations || [];
    if (!otherTranslations.length && metadata.translation_of) {
      // But perhaps the parent has other translations?!
      const parentURL = buildMDNUrl("en-US", metadata.translation_of);
      const parentData = this.allTitles[parentURL];
      // See note in 'ensureAllTitles()' about why we need this if statement.
      if (parentData) {
        const parentOtherTranslations = parentData.translations;
        if (parentOtherTranslations && parentOtherTranslations.length) {
          otherTranslations.push(
            ...parentOtherTranslations.filter(
              (translation) => translation.locale !== metadata.locale
            )
          );
        }
      }
    }
    if (otherTranslations.length) {
      doc.other_translations = otherTranslations;
    }

    this.injectSource(source, doc, folder);

    const { outfileJson, outfileHtml } = buildHtmlAndJsonFromDoc({
      doc,
      destinationDir,
      buildHtml: !this.options.buildJsonOnly,
      titles: this.allTitles,
    });

    // We're *assuming* that `slugToFoldername(metadata.mdn_url)`
    // can be a valid folder name on the current filesystem. It if's all
    // non-control characters, it should be fine, but some characters can't be
    // used when storing folders. E.g. `:` in Windows.
    // However, we might want that for the eventual S3 key when it gets
    // uploaded. So make a note about it if necessary.
    if (destinationDir !== destinationDirRaw) {
      // In the cleaned folder that the file was put, put a "hidden
      // file" which'll be used by the deployer when it picks S3 key names.
      fs.writeFileSync(
        path.join(destinationDir, "_preferred-name.txt"),
        destinationDirRaw.replace(this.destination, "")
      );
    }

    fs.writeFileSync(hashDestination, combinedHash);
    return {
      result: processing.PROCESSED,
      file: outfileHtml || outfileJson,
      jsonFile: outfileJson,
      doc,
    };
  }

  injectSource(source, doc, folder) {
    if (process.env.NODE_ENV === "development") {
      // When in development mode, put the absolute path of the source
      // of where the content comes from.
      if (source.isStumptown) {
        doc.source = {
          folder: path.dirname(folder),
          // absolute_folder: folder,
          // markdown_file: folder
          content_file: folder, // actually a filepath!
          // content_file: path.join(folder, "index.html")
        };
      } else {
        doc.source = {
          // folder: path.relative(source.filepath, folder),
          // absolute_folder: folder,
          content_file: path.join(folder, "index.html"),
        };
      }
    } else {
      doc.source = {
        github_url: this.getGitHubURL(source, folder),
      };
    }
  }

  processStumptownFile(source, file, config) {
    config = config || {};

    const hasher = crypto.createHash("md5");
    const docRaw = fs.readFileSync(file);
    const doc = JSON.parse(docRaw);
    if (this.excludeSlug(doc)) {
      return { result: processing.EXCLUDED, file };
    }
    hasher.update(docRaw);

    const { mdn_url } = doc;
    const destinationDirRaw = path.join(
      this.destination,
      mdn_url.toLowerCase()
    );
    const destinationDir = destinationDirRaw
      .split(path.sep)
      .map(sanitizeFilename)
      .join(path.sep);

    const hashDestination = path.join(destinationDir, "_index.hash");

    // Now let's see if the inputs have changed since last time
    const docHash = hasher.digest("hex").slice(0, 12);
    const combinedHash = `${this.selfHash}.${docHash}`;
    if (
      !this.options.noCache &&
      fs.existsSync(destinationDir) &&
      fs.existsSync(hashDestination) &&
      fs.readFileSync(hashDestination, "utf8") === combinedHash
    ) {
      return {
        result: processing.ALREADY,
        file: path.join(destinationDir, "index.html"),
      };
    }

    this.injectSource(source, doc, file);

    const { outfileJson, outfileHtml } = buildHtmlAndJsonFromDoc({
      doc,
      destinationDir,
      buildHtml: !this.options.buildJsonOnly,
      titles: this.allTitles,
    });

    return {
      result: processing.PROCESSED,
      file: outfileHtml || outfileJson,
      jsonFile: outfileJson,
      doc,
    };
  }

  /** Similar to processFolder() but this time we're only interesting it
   * adding this document's uri and title to this.allTitles
   */
  processFolderTitle(source, folder, allPopularities) {
    const metadata = yaml.safeLoad(
      fs.readFileSync(path.join(folder, "index.yaml"))
    );

    metadata.locale = extractLocale(source, folder);
    const mdn_url = buildMDNUrl(metadata.locale, metadata.slug);

    // XXX Perhaps, if the source of this is from archive, we might
    // not need or want to bother with popularity or modified data.
    if (fs.existsSync(path.join(folder, "wikihistory.json"))) {
      const wikiMetadataRaw = fs.readFileSync(
        path.join(folder, "wikihistory.json")
      );
      const wikiMetadata = JSON.parse(wikiMetadataRaw);
      metadata.modified = wikiMetadata.modified;
    }

    if (mdn_url in this.allTitles) {
      // Already been added by stumptown probably.
      // But, before we exit early, let's update some of the pieces of
      // information that stumptown might not have, such as "modified"
      // and "translation_of".
      if (!this.allTitles[mdn_url].modified) {
        this.allTitles[mdn_url].modified = metadata.modified;
      }
      if (!this.allTitles[mdn_url].translation_of) {
        this.allTitles[mdn_url].translation_of = metadata.translation_of;
      }
      return;
    }

    const doc = {
      mdn_url,
      title: metadata.title,
      popularity: allPopularities[mdn_url] || 0.0,
      locale: metadata.locale,
      summary: metadata.summary,
      slug: metadata.slug,
      file: folder,
      modified: metadata.modified,
      translation_of: metadata.translation_of,
      // XXX To be lean if either of these are false, perhaps not
      // bother setting it.
      excludeInTitlesJson: source.excludeInTitlesJson,
      excludeInSitemaps: source.excludeInSitemaps,
      source: source.filepath,
    };
    if (metadata.tags) {
      // Unfortunately, some of the Kumascript macros (including some of the
      // sidebar macros) depend on tags for proper operation, so we need to
      // keep them for now.
      doc.tags = metadata.tags;
    }
    this.allTitles[mdn_url] = doc;
  }

  processStumptownFileTitle(source, file, allPopularities) {
    const metadata = JSON.parse(fs.readFileSync(file));
    const { mdn_url, title } = metadata;
    const doc = {
      mdn_url,
      title,
      popularity: allPopularities[mdn_url] || 0.0,
      locale: null,
      slug: null,
      modified: null,
      parent: null,
      excludeInTitlesJson: source.excludeInTitlesJson,
      excludeInSitemaps: source.excludeInSitemaps,
      source: source.filepath,
    };

    this.allTitles[mdn_url] = doc;
  }

  renderHtml(rawHtml, metadata) {
    // TODO: The "LiveSampleURL" macro uses the "revision_id" attribute of
    //       the "docEnv" below, but obviously that makes no sense in the world
    //       of Yari. We need to determine a new way to resolve that macro.
    const baseURL = "https://developer.mozilla.org";
    const path = buildMDNUrl(metadata.locale, metadata.slug);
    const docEnv = {
      path: path,
      url: `${baseURL}${path}`,
      locale: metadata.locale,
      slug: metadata.slug,
      tags: metadata.tags || [],
      selective_mode: false,
    };
    return this.ksRenderer.render(rawHtml, docEnv);
  }

  /**
   * Return the full URL directly to the file in GitHub based on this folder.
   *
   *
   * @param {String} folder - the current folder we're processing.
   * @paraam {Bool} stumptown - source is from stumptown.
   */
  getGitHubURL(source, folder, stumptown = false) {
    const gitUrl = getCurretGitHubBaseURL();
    const branch = getCurrentGitBranch();
    const relativePath = path.relative(source.filepath, folder);
    return `${gitUrl}/blob/${branch}/content/files/${relativePath}`;
  }
}

function* walker(root, depth = 0) {
  const files = fs.readdirSync(root);
  if (!depth) {
    yield [
      root,
      files.filter((name) => {
        return !fs.statSync(path.join(root, name)).isDirectory();
      }),
    ];
  }
  for (const name of files) {
    const filepath = path.join(root, name);
    const isDirectory = fs.statSync(filepath).isDirectory();
    if (isDirectory) {
      yield [
        filepath,
        fs.readdirSync(filepath).filter((name) => {
          return !fs.statSync(path.join(filepath, name)).isDirectory();
        }),
      ];
      // Now go deeper
      yield* walker(filepath, depth + 1);
    }
  }
}

function ppMilliseconds(ms) {
  // If the number of millseconds is really large, use seconds. Or minutes
  // even.
  if (ms > 1000 * 60 * 5) {
    const seconds = ms / 1000;
    const minutes = seconds / 60;
    return `${minutes.toFixed(1)} minutes`;
  } else if (ms > 100) {
    const seconds = ms / 1000;
    return `${seconds.toFixed(1)} seconds`;
  } else {
    return `${ms.toFixed(1)} milliseconds`;
  }
}

// Return a md5 hash based on the content of a list of file paths
function makeHash(filepaths, length = 12) {
  const hasher = crypto.createHash("md5");
  filepaths
    .map((fp) => fs.readFileSync(fp, "utf8"))
    .forEach((content) => hasher.update(content));
  return hasher.digest("hex").slice(0, length);
}

function makeSitemapXML(locations) {
  const xmlParts = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ];
  xmlParts.push(
    ...locations.map((location) => {
      return (
        `<url><loc>${location.loc}</loc>` +
        `<lastmod>${location.lastmod}</lastmod></url>`
      );
    })
  );
  xmlParts.push("</urlset>");
  xmlParts.push("");
  return xmlParts.join("\n");
}

// Slight extension of fs.readdirSync that returns full paths
function simpleGlob(directory, extension) {
  return fs
    .readdirSync(directory)
    .filter((name) => name.endsWith(extension))
    .map((name) => path.join(directory, name));
}

module.exports = {
  runBuild,
  Builder,
};
